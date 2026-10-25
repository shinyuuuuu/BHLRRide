<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Branch;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class VendorApplicationController extends Controller
{
    /** Someone applies to become a vendor. An admin must approve before they can log in. */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ownerFirst'   => ['required', 'string', 'max:100'],
            'ownerLast'    => ['required', 'string', 'max:100'],
            'email'        => ['required', 'string', 'email', 'max:255', 'unique:accounts,email'],
            'phone'        => ['required', 'string', 'max:30'],
            'password'     => ['required', 'string', Password::min(8)],
            'businessName' => ['required', 'string', 'max:150', 'unique:vendors,business_name'],
            'street'       => ['required', 'string', 'max:255'],
            'city'         => ['required', 'string', 'max:100'],
        ], [
            'email.unique'        => 'That email is already registered.',
            'businessName.unique' => 'A business with that name is already registered.',
        ]);

        DB::transaction(function () use ($data) {
            $account = Account::create([
                'first_name'     => $data['ownerFirst'],
                'last_name'      => $data['ownerLast'],
                'email'          => strtolower(trim($data['email'])),
                'phone'          => $data['phone'],
                'password'       => $data['password'],
                'role'           => 'vendor',
                'account_status' => 'active',
            ]);

            $vendor = Vendor::create([
                'account_id'       => $account->id,
                'business_name'    => $data['businessName'],
                'business_address' => $data['street'].', '.$data['city'].', Bohol',
                'business_phone'   => $data['phone'],
                'approval_status'  => 'pending',
            ]);

            Branch::create([
                'vendor_id'      => $vendor->id,
                'branch_name'    => $data['city'],
                'branch_address' => $data['street'],
                'contact_number' => $data['phone'],
            ]);
        });

        return response()->json(['ok' => true], 201);
    }
}
