<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    private function shape(Vendor $v): array
    {
        $branch = $v->branches->sortBy('id')->first();
        $decided = $v->approval_status !== 'pending';

        return [
            'id'           => 'VN-'.$v->id,
            'businessName' => $v->business_name,
            'ownerFirst'   => $v->account?->first_name ?? '',
            'ownerLast'    => $v->account?->last_name ?? '',
            'email'        => $v->account?->email ?? '',
            'phone'        => $v->business_phone ?? $v->account?->phone ?? '',
            'street'       => $branch?->branch_address ?? '',
            'city'         => $branch?->branch_name ?? '',
            'province'     => 'Bohol',
            'status'       => ucfirst($v->approval_status),
            'appliedAt'    => optional($v->created_at)->toIso8601String(),
            'decidedAt'    => $decided ? optional($v->updated_at)->toIso8601String() : null,
            'decidedBy'    => $decided && $v->approvedBy
                ? trim($v->approvedBy->first_name.' '.$v->approvedBy->last_name)
                : null,
        ];
    }

    public function index(): JsonResponse
    {
        $vendors = Vendor::with(['account', 'branches', 'approvedBy'])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Vendor $v) => $this->shape($v));

        return response()->json(['vendors' => $vendors]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:Approved,Rejected,Pending'],
        ]);

        $vendor = Vendor::with(['account', 'branches', 'approvedBy'])
            ->findOrFail((int) preg_replace('/\D/', '', $id));

        $status = strtolower($data['status']);

        $vendor->update([
            'approval_status' => $status,
            'approved_by'     => $status === 'pending' ? null : $request->user()->id,
        ]);

        return response()->json(['vendor' => $this->shape($vendor->fresh(['account', 'branches', 'approvedBy']))]);
    }
}
