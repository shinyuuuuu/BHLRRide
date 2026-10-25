<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;

class VehicleController extends Controller
{
    /** Public list of vehicles, shaped the way the React pages expect. */
    public function index(): JsonResponse
    {
        $vehicles = Vehicle::with(['branch.vendor'])
            ->orderBy('id')
            ->get()
            ->map(fn (Vehicle $v) => [
                'id'           => $v->id,
                'brand'        => $v->brand,
                'model'        => $v->model,
                'shop'         => $v->branch?->vendor?->business_name ?? '',
                'branch'       => $v->branch?->branch_name ?? '',
                'kind'         => $v->kind,
                'style'        => $v->style ?? '',
                'transmission' => $v->transmission ?? '',
                'seats'        => (int) $v->seats,
                'fuel'         => $v->fuel ?? '',
                'rate'         => (float) $v->rental_rate,
                'rating'       => 0, // real ratings come with the reviews step
                'badge'        => $v->badge ?? '',
                'available'    => $v->status === 'available',
                'image'        => $v->image ?? '',
                'emoji'        => $this->emoji($v),
            ]);

        return response()->json(['vehicles' => $vehicles]);
    }

    private function emoji(Vehicle $v): string
    {
        if ($v->kind === 'Motorcycle') {
            return $v->style === 'Scooter' ? '🛵' : '🏍️';
        }

        return match ($v->style) {
            'Van'   => '🚐',
            'MPV'   => '🚙',
            default => '🚗',
        };
    }
}
