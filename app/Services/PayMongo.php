<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Small wrapper around PayMongo's hosted checkout.
 * Works with test keys (sk_test_...) and live keys (sk_live_...).
 */
class PayMongo
{
    private const BASE = 'https://api.paymongo.com/v1';

    public static function configured(): bool
    {
        return (bool) config('services.paymongo.secret');
    }

    /** Create a hosted checkout page. Returns ['id' => ..., 'checkout_url' => ...]. */
    public function createCheckout(array $attributes): array
    {
        $response = $this->client()->post(self::BASE.'/checkout_sessions', [
            'data' => ['attributes' => $attributes],
        ]);

        $this->failIfBad($response);

        $data = $response->json('data');

        return [
            'id'           => $data['id'],
            'checkout_url' => $data['attributes']['checkout_url'],
        ];
    }

    /** Ask PayMongo whether a checkout session has a paid payment. */
    public function isPaid(string $sessionId): bool
    {
        $response = $this->client()->get(self::BASE.'/checkout_sessions/'.$sessionId);

        $this->failIfBad($response);

        $payments = $response->json('data.attributes.payments') ?? [];

        foreach ($payments as $payment) {
            if (($payment['attributes']['status'] ?? null) === 'paid') {
                return true;
            }
        }

        // some responses report it on the payment intent instead
        return $response->json('data.attributes.payment_intent.attributes.status') === 'succeeded';
    }

    /** Check the Paymongo-Signature header sent with a webhook. */
    public static function validSignature(string $header, string $rawBody): bool
    {
        $secret = config('services.paymongo.webhook_secret');
        if (! $secret || $header === '') {
            return false;
        }

        $parts = [];
        foreach (explode(',', $header) as $piece) {
            [$key, $value] = array_pad(explode('=', trim($piece), 2), 2, '');
            $parts[$key] = $value;
        }

        if (empty($parts['t'])) {
            return false;
        }

        $expected = hash_hmac('sha256', $parts['t'].'.'.$rawBody, $secret);

        foreach (['te', 'li'] as $key) {
            if (! empty($parts[$key]) && hash_equals($expected, $parts[$key])) {
                return true;
            }
        }

        return false;
    }

    private function client()
    {
        return Http::withBasicAuth((string) config('services.paymongo.secret'), '')
            ->acceptJson()
            ->asJson()
            ->timeout(20);
    }

    private function failIfBad($response): void
    {
        if ($response->failed()) {
            $detail = $response->json('errors.0.detail') ?? 'PayMongo could not process the request.';
            throw new RuntimeException($detail);
        }
    }
}
