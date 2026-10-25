<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /** The shape the React app expects for a logged-in person. */
    private function payload(Account $account): array
    {
        $account->loadMissing('vendor');

        return [
            'id'         => $account->id,
            'email'      => $account->email,
            'firstName'  => $account->first_name,
            'middleName' => $account->middle_name ?? '',
            'lastName'   => $account->last_name,
            'phone'      => $account->phone ?? '',
            // the database stores 'user'; the React app calls that 'customer'
            'role'       => in_array($account->role, ['admin', 'vendor'], true) ? $account->role : 'customer',
            'shop'       => $account->vendor?->business_name,
        ];
    }

    public function me(Request $request): JsonResponse
    {
        $account = $request->user();

        return response()->json(['user' => $account ? $this->payload($account) : null]);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt(['email' => strtolower(trim($data['email'])), 'password' => $data['password']])) {
            return response()->json(['message' => 'Incorrect email or password.'], 422);
        }

        /** @var Account $account */
        $account = Auth::user();

        $blocked = null;
        if ($account->account_status !== 'active') {
            $blocked = 'This account is not active.';
        } elseif ($account->role === 'vendor') {
            $status = $account->vendor?->approval_status;
            if ($status === 'pending') {
                $blocked = 'Your application is still waiting for admin approval.';
            } elseif ($status === 'rejected') {
                $blocked = 'Your vendor application was not approved.';
            }
        }

        if ($blocked) {
            Auth::guard('web')->logout();

            return response()->json(['message' => $blocked], 403);
        }

        $request->session()->regenerate();

        return response()->json(['user' => $this->payload($account)]);
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'firstName'  => ['required', 'string', 'max:100'],
            'middleName' => ['nullable', 'string', 'max:100'],
            'lastName'   => ['required', 'string', 'max:100'],
            'email'      => ['required', 'string', 'email', 'max:255', 'unique:accounts,email'],
            'phone'      => ['nullable', 'string', 'max:30'],
            'password'   => ['required', 'string', Password::min(8)],
        ], [
            'email.unique' => 'That email is already registered.',
        ]);

        $account = Account::create([
            'first_name'  => $data['firstName'],
            'middle_name' => $data['middleName'] ?? null,
            'last_name'   => $data['lastName'],
            'email'       => strtolower(trim($data['email'])),
            'phone'       => $data['phone'] ?? null,
            'password'    => $data['password'],
            'role'        => 'user',
        ]);

        Auth::login($account);
        $request->session()->regenerate();

        return response()->json(['user' => $this->payload($account)], 201);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }
}
