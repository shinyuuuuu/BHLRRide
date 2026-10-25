<?php

namespace App\Services;

use App\Models\Account;
use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Sends email and SMS about bookings and payments.
 *
 * - Email uses whatever MAIL_* settings are in the environment. With the default
 *   MAIL_MAILER=log nothing is sent; the message is just written to the log.
 * - SMS uses Semaphore and only runs when SEMAPHORE_API_KEY is set.
 * - Everything runs after the page has responded, and any failure is only logged,
 *   so a broken mail or SMS setup can never break a booking.
 */
class Notifier
{
    // ---- the events -------------------------------------------------

    public static function bookingRequested(Booking $booking): void
    {
        [$customer, $shop, $vehicle, $dates] = self::parts($booking);

        self::tell($customer, 'We got your booking request',
            "Hi {$customer?->first_name}, your request for the {$vehicle} ({$dates}) was sent to the shop. "
            ."You'll be notified once it's approved. Booking BK-{$booking->id}.");

        self::tell($shop, 'New booking request',
            "New booking request BK-{$booking->id}: {$vehicle}, {$dates}, from {$customer?->first_name} {$customer?->last_name}. "
            .'Log in to BHLRRide to approve or decline.');
    }

    public static function bookingStatus(Booking $booking, string $status): void
    {
        [$customer, $shop, $vehicle, $dates] = self::parts($booking);

        $customerText = match ($status) {
            'approved'  => "Good news! Your booking BK-{$booking->id} for the {$vehicle} ({$dates}) was approved. Log in to BHLRRide to pay.",
            'cancelled' => "Your booking BK-{$booking->id} for the {$vehicle} ({$dates}) was cancelled.",
            'completed' => "Your rental BK-{$booking->id} ({$vehicle}) is complete. Thanks for riding with BHLRRide! You can leave a rating in your account.",
            default     => null,
        };

        if ($customerText) {
            self::tell($customer, "Booking BK-{$booking->id} {$status}", $customerText);
        }

        if ($status === 'cancelled') {
            self::tell($shop, "Booking BK-{$booking->id} cancelled", "Booking BK-{$booking->id} ({$vehicle}, {$dates}) was cancelled.");
        }
    }

    public static function paymentReceived(Payment $payment): void
    {
        $booking = $payment->booking;
        [$customer, $shop, $vehicle, $dates] = self::parts($booking);
        $amount = '₱'.number_format((float) $payment->amount, 2);

        self::tell($customer, 'Payment received',
            "We received your {$amount} payment for booking BK-{$booking->id} ({$vehicle}, {$dates}). Thank you! Your receipt is in your account.");

        self::tell($shop, 'Booking paid',
            "Booking BK-{$booking->id} ({$vehicle}, {$dates}) was paid: {$amount}.");
    }

    // ---- the plumbing -----------------------------------------------

    /** Customer, shop owner, vehicle name, dates text. */
    private static function parts(Booking $booking): array
    {
        $booking->loadMissing('account', 'vehicle.branch.vendor.account');

        $vehicle = $booking->vehicle;
        $vendor = $vehicle?->branch?->vendor;
        $name = $vehicle ? trim("{$vehicle->brand} {$vehicle->model}") : 'vehicle';
        $dates = $booking->start_date->format('M j').' to '.$booking->end_date->format('M j, Y');

        return [$booking->account, $vendor?->account, $name, $dates];
    }

    /** Email + SMS to one person, after the response is sent. */
    private static function tell(?Account $person, string $subject, string $message): void
    {
        if (! $person) {
            return;
        }

        $email = $person->email;
        $phone = $person->phone;

        dispatch(function () use ($email, $phone, $subject, $message) {
            self::email($email, $subject, $message);
            self::sms($phone, $message);
        })->afterResponse();
    }

    private static function email(?string $to, string $subject, string $message): void
    {
        if (! $to || str_ends_with($to, '.invalid')) {
            return;
        }

        try {
            Mail::raw($message."\n\n- BHLRRide", function ($mail) use ($to, $subject) {
                $mail->to($to)->subject('BHLRRide: '.$subject);
            });
        } catch (Throwable $e) {
            Log::warning('Email failed: '.$e->getMessage());
        }
    }

    private static function sms(?string $number, string $message): void
    {
        $key = config('services.semaphore.key');
        $digits = preg_replace('/\D/', '', (string) $number);

        if (! $key || strlen($digits) < 10) {
            return;
        }

        try {
            $payload = [
                'apikey'  => $key,
                'number'  => $digits,
                // Semaphore silently drops messages that start with "TEST"
                'message' => 'BHLRRide: '.$message,
            ];
            if ($sender = config('services.semaphore.sender')) {
                $payload['sendername'] = $sender;
            }

            $response = Http::asForm()->timeout(15)->post('https://api.semaphore.co/api/v4/messages', $payload);

            if ($response->failed()) {
                Log::warning('SMS failed: '.$response->body());
            }
        } catch (Throwable $e) {
            Log::warning('SMS failed: '.$e->getMessage());
        }
    }
}
