<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Payment;
use App\Services\Notifier;
use App\Services\PayMongo;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class PaymentController extends Controller
{
    /** What the customer picks -> what PayMongo calls it. */
    private const METHODS = [
        'GCash'             => 'gcash',
        'Maya'              => 'paymaya',
        'Credit/debit card' => 'card',
    ];

    private function shape(Payment $p): array
    {
        $paidAt = $p->paid_at ? Carbon::parse($p->paid_at) : null;

        return [
            'id'            => 'PAY-'.$p->id,
            'bookingId'     => 'BK-'.$p->booking_id,
            'amount'        => (float) $p->amount,
            'type'          => 'Full payment',
            'method'        => $p->payment_method,
            'date'          => $paidAt?->toIso8601String(),
            'status'        => ucfirst($p->payment_status),
            'receiptNumber' => 'RC-'.($paidAt ?? $p->created_at)->format('Ymd').'-'.str_pad((string) $p->id, 4, '0', STR_PAD_LEFT),
        ];
    }

    /** Paid payments this person may see (customer: own, vendor: their shop's, admin: all). */
    public function index(Request $request): JsonResponse
    {
        $account = $request->user();

        $query = Payment::where('payment_status', 'paid')->orderByDesc('id');

        if ($account->role === 'admin') {
            // everything
        } elseif ($account->role === 'vendor') {
            $query->whereHas('booking.vehicle.branch.vendor', fn ($q) => $q->where('account_id', $account->id));
        } else {
            $query->whereHas('booking', fn ($q) => $q->where('account_id', $account->id));
        }

        return response()->json(['payments' => $query->get()->map(fn ($p) => $this->shape($p))]);
    }

    /** Customer chooses a method; we create a PayMongo checkout page and send back its address. */
    public function start(Request $request, string $id): JsonResponse
    {
        $account = $request->user();

        $data = $request->validate([
            'method' => ['required', 'in:'.implode(',', array_keys(self::METHODS))],
        ]);

        if (! PayMongo::configured()) {
            return response()->json(['message' => 'Online payments are not set up yet. Please contact the shop.'], 503);
        }

        $booking = Booking::with('vehicle')->findOrFail((int) preg_replace('/\D/', '', $id));

        if ($booking->account_id !== $account->id) {
            return response()->json(['message' => 'You cannot pay for this booking.'], 403);
        }
        if ($booking->booking_status !== 'approved') {
            return response()->json(['message' => 'This booking is not ready for payment yet.'], 422);
        }
        if ($booking->payments()->where('payment_status', 'paid')->exists()) {
            return response()->json(['message' => 'This booking is already paid.'], 422);
        }

        $payment = Payment::create([
            'booking_id'     => $booking->id,
            'amount'         => $booking->total_amount,
            'payment_method' => $data['method'],
            'payment_status' => 'pending',
        ]);

        $base = $request->getSchemeAndHttpHost();
        $vehicle = $booking->vehicle;

        try {
            $session = (new PayMongo())->createCheckout([
                'line_items' => [[
                    'currency' => 'PHP',
                    'amount'   => (int) round(((float) $booking->total_amount) * 100), // centavos
                    'name'     => trim("{$vehicle->brand} {$vehicle->model}")." rental (BK-{$booking->id})",
                    'quantity' => 1,
                ]],
                'payment_method_types' => [self::METHODS[$data['method']]],
                'success_url'          => $base.'/app/account?paid='.$payment->id,
                'cancel_url'           => $base.'/app/account?cancelled=1',
                'description'          => "BHLRRide booking BK-{$booking->id}",
                'reference_number'     => 'PAY-'.$payment->id,
                'metadata'             => ['payment_id' => (string) $payment->id, 'booking_id' => (string) $booking->id],
            ]);
        } catch (Throwable $e) {
            Log::warning('PayMongo checkout failed: '.$e->getMessage());
            $payment->update(['payment_status' => 'failed']);

            return response()->json(['message' => 'Could not start the payment: '.$e->getMessage()], 502);
        }

        $payment->update(['transaction_reference' => $session['id']]);

        return response()->json(['checkoutUrl' => $session['checkout_url']]);
    }

    /** The customer came back from PayMongo: check with PayMongo whether it was paid. */
    public function verify(Request $request, string $id): JsonResponse
    {
        $account = $request->user();
        $payment = Payment::with('booking')->findOrFail((int) preg_replace('/\D/', '', $id));

        if ($payment->booking->account_id !== $account->id && $account->role !== 'admin') {
            return response()->json(['message' => 'You cannot view this payment.'], 403);
        }

        if ($payment->payment_status === 'pending' && $payment->transaction_reference && PayMongo::configured()) {
            try {
                if ((new PayMongo())->isPaid($payment->transaction_reference)) {
                    $this->markPaid($payment);
                }
            } catch (Throwable $e) {
                Log::warning('PayMongo verify failed: '.$e->getMessage());

                return response()->json(['message' => 'Could not check the payment yet. Please refresh in a moment.'], 502);
            }
        }

        return response()->json(['payment' => $this->shape($payment->fresh())]);
    }

    /** PayMongo tells us a payment went through. This is the most reliable signal. */
    public function webhook(Request $request): JsonResponse
    {
        $raw = $request->getContent();

        if (! PayMongo::validSignature((string) $request->header('Paymongo-Signature', ''), $raw)) {
            return response()->json(['message' => 'Invalid signature.'], 400);
        }

        $body = json_decode($raw, true) ?: [];

        // PayMongo wraps the event slightly differently across versions, so look in both places
        $type = $body['data']['attributes']['type'] ?? $body['data']['type'] ?? '';
        $session = $body['data']['attributes']['data'] ?? $body['data'] ?? [];

        if (! str_contains((string) $type, 'payment.paid')) {
            return response()->json(['ok' => true]);
        }

        $sessionId = $session['id'] ?? null;
        $reference = $session['attributes']['reference_number'] ?? '';

        $payment = Payment::where('transaction_reference', $sessionId)->first()
            ?? (preg_match('/^PAY-(\d+)$/', (string) $reference, $m) ? Payment::find((int) $m[1]) : null);

        if ($payment) {
            $this->markPaid($payment);
        }

        return response()->json(['ok' => true]);
    }

    private function markPaid(Payment $payment): void
    {
        if ($payment->payment_status === 'paid') {
            return;
        }

        $payment->update([
            'payment_status' => 'paid',
            'paid_at'        => now(),
        ]);

        Notifier::paymentReceived($payment->fresh('booking'));
    }
}
