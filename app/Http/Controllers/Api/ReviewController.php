<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    private function shape(Review $r): array
    {
        $name = $r->account
            ? trim($r->account->first_name.' '.mb_substr($r->account->last_name, 0, 1).'.')
            : 'Verified renter';

        return [
            'id'        => 'RV-'.$r->id,
            'bookingId' => 'BK-'.$r->booking_id,
            'rating'    => (int) $r->rating,
            'comment'   => $r->comment ?? '',
            'date'      => optional($r->created_at)->toIso8601String(),
            'customer'  => $name,
        ];
    }

    /** Public: reviews for one vehicle. */
    public function forVehicle(int $vehicle): JsonResponse
    {
        $reviews = Review::with('account')
            ->whereHas('booking', fn ($q) => $q->where('vehicle_id', $vehicle))
            ->orderByDesc('id')
            ->get()
            ->map(fn ($r) => $this->shape($r));

        return response()->json(['reviews' => $reviews]);
    }

    /** A customer rates a finished ride (once per booking). */
    public function store(Request $request): JsonResponse
    {
        $account = $request->user();

        $data = $request->validate([
            'bookingId' => ['required', 'string'],
            'rating'    => ['required', 'integer', 'between:1,5'],
            'comment'   => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = Booking::findOrFail((int) preg_replace('/\D/', '', $data['bookingId']));

        if ($booking->account_id !== $account->id) {
            return response()->json(['message' => 'You can only review your own bookings.'], 403);
        }
        if ($booking->booking_status !== 'completed') {
            return response()->json(['message' => 'You can rate a ride after it is completed.'], 422);
        }
        if (Review::where('booking_id', $booking->id)->exists()) {
            return response()->json(['message' => 'You already reviewed this booking.'], 422);
        }

        $review = Review::create([
            'booking_id' => $booking->id,
            'account_id' => $account->id,
            'rating'     => $data['rating'],
            'comment'    => $data['comment'] ?? null,
        ]);

        return response()->json(['review' => $this->shape($review->load('account'))], 201);
    }
}
