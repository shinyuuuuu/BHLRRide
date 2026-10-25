<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Vehicle;
use App\Services\Notifier;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    /** Statuses that block a vehicle's dates. */
    private const BLOCKING = ['pending', 'approved'];

    /** Longest rental a customer can request, in days. */
    private const MAX_DAYS = 60;

    private function shape(Booking $b): array
    {
        $account = $b->account;

        return [
            'id'         => 'BK-'.$b->id,
            'vehicleId'  => $b->vehicle_id,
            'start'      => Carbon::parse($b->start_date)->toDateString(),
            'end'        => Carbon::parse($b->end_date)->toDateString(),
            'status'     => ucfirst($b->booking_status),
            'total'      => (float) $b->total_amount,
            'reviewed'   => isset($b->review_exists) ? (bool) $b->review_exists : $b->review()->exists(),
            'customer'   => $account ? trim($account->first_name.' '.$account->last_name) : '',
            'createdAt'  => optional($b->created_at)->toIso8601String(),
        ];
    }

    private function isCustomer($account): bool
    {
        return ! in_array($account->role, ['admin', 'vendor'], true);
    }

    /** The bookings this person is allowed to see. */
    public function index(Request $request): JsonResponse
    {
        $account = $request->user();

        $query = Booking::with('account')->withExists('review')->orderByDesc('id');

        if ($account->role === 'admin') {
            // admins see everything
        } elseif ($account->role === 'vendor') {
            $query->whereHas('vehicle.branch.vendor', fn ($q) => $q->where('account_id', $account->id));
        } else {
            $query->where('account_id', $account->id);
        }

        return response()->json(['bookings' => $query->get()->map(fn ($b) => $this->shape($b))]);
    }

    /** A customer asks to rent a vehicle. */
    public function store(Request $request): JsonResponse
    {
        $account = $request->user();

        if (! $this->isCustomer($account)) {
            return response()->json(['message' => 'Only customer accounts can book a ride.'], 403);
        }

        $data = $request->validate([
            'vehicleId' => ['required', 'integer', 'exists:vehicles,id'],
            'start'     => ['required', 'date_format:Y-m-d'],
            'end'       => ['required', 'date_format:Y-m-d', 'after_or_equal:start'],
        ], [
            'end.after_or_equal' => 'Return date must be on or after the pick-up date.',
        ]);

        $start = Carbon::parse($data['start'])->startOfDay();
        $end = Carbon::parse($data['end'])->startOfDay();

        if ($start->lt(Carbon::today(config('app.timezone')))) {
            return response()->json(['message' => 'Pick-up date cannot be in the past.'], 422);
        }

        if ((int) $start->diffInDays($end) > self::MAX_DAYS) {
            return response()->json(['message' => 'Bookings can be up to '.self::MAX_DAYS.' days. Please choose a shorter rental.'], 422);
        }

        $booking = DB::transaction(function () use ($data, $account, $start, $end) {
            // lock the vehicle row so two people can't grab the same dates at once
            $vehicle = Vehicle::whereKey($data['vehicleId'])->lockForUpdate()->first();

            if ($vehicle->status !== 'available') {
                return ['error' => 'This ride is not available right now.'];
            }

            $clash = Booking::where('vehicle_id', $vehicle->id)
                ->whereIn('booking_status', self::BLOCKING)
                ->where('start_date', '<', $end)
                ->where('end_date', '>', $start)
                ->exists();

            if ($clash) {
                return ['error' => 'This ride is already booked for some of those dates. Please try other dates.'];
            }

            $days = max(1, (int) $start->diffInDays($end));

            return Booking::create([
                'account_id'     => $account->id,
                'vehicle_id'     => $vehicle->id,
                'start_date'     => $start,
                'end_date'       => $end,
                'total_amount'   => $days * (float) $vehicle->rental_rate,
                'booking_status' => 'pending',
            ]);
        });

        if (is_array($booking)) {
            return response()->json(['message' => $booking['error']], 409);
        }

        $booking->load('account');
        Notifier::bookingRequested($booking);

        return response()->json(['booking' => $this->shape($booking)], 201);
    }

    /** Approve, cancel/reject, or complete a booking. */
    public function update(Request $request, string $id): JsonResponse
    {
        $account = $request->user();
        $id = (int) preg_replace('/\D/', '', $id);

        $data = $request->validate([
            'status' => ['required', 'in:Approved,Cancelled,Completed'],
        ]);

        $booking = Booking::with(['account', 'vehicle.branch.vendor'])->findOrFail($id);

        $isOwner = $booking->account_id === $account->id;
        $isShop = $booking->vehicle?->branch?->vendor?->account_id === $account->id;
        $isAdmin = $account->role === 'admin';

        if (! $isOwner && ! $isShop && ! $isAdmin) {
            return response()->json(['message' => 'You cannot change this booking.'], 403);
        }

        $current = $booking->booking_status;
        $new = strtolower($data['status']);
        $staff = $isShop || $isAdmin;

        $allowed = match ($new) {
            'approved'  => $staff && $current === 'pending',
            'completed' => $staff && $current === 'approved',
            'cancelled' => in_array($current, self::BLOCKING, true) && ($isOwner || $staff),
            default     => false,
        };

        if (! $allowed) {
            return response()->json(['message' => "A {$current} booking can't be changed to {$new}."], 422);
        }

        $booking->update(['booking_status' => $new]);
        Notifier::bookingStatus($booking, $new);

        return response()->json(['booking' => $this->shape($booking)]);
    }

    /** Public: which dates are taken for a vehicle (no personal details). */
    public function availability(int $vehicle): JsonResponse
    {
        $taken = Booking::where('vehicle_id', $vehicle)
            ->whereIn('booking_status', self::BLOCKING)
            ->where('end_date', '>=', Carbon::today(config('app.timezone')))
            ->orderBy('start_date')
            ->get()
            ->map(fn ($b) => [
                'vehicleId' => $b->vehicle_id,
                'start'     => Carbon::parse($b->start_date)->toDateString(),
                'end'       => Carbon::parse($b->end_date)->toDateString(),
                'status'    => ucfirst($b->booking_status),
            ]);

        return response()->json(['taken' => $taken]);
    }
}
