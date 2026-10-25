<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Vehicle;
use App\Models\VehicleType;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    private const STATUS_TO_DB = [
        'Available'         => 'available',
        'Rented'            => 'rented',
        'Under maintenance' => 'maintenance',
    ];

    private const STATUS_LABEL = [
        'available'   => 'Available',
        'rented'      => 'Rented',
        'maintenance' => 'Under maintenance',
    ];

    /** Public list of vehicles, shaped the way the React pages expect. */
    public function index(Request $request): JsonResponse
    {
        $viewer = $request->user();

        $vehicles = Vehicle::with(['branch.vendor'])
            ->orderBy('id')
            ->get()
            ->map(fn (Vehicle $v) => $this->shape($v, $viewer));

        return response()->json(['vehicles' => $vehicles]);
    }

    /** A vendor lists a new vehicle for their shop. */
    public function store(Request $request): JsonResponse
    {
        $vendor = Vendor::where('account_id', $request->user()->id)->first();

        if (! $vendor || $vendor->approval_status !== 'approved') {
            return response()->json(['message' => 'Your shop must be approved before you can list vehicles.'], 403);
        }

        $data = $request->validate($this->rules());

        $branch = $this->branchFor($vendor, $data['branch']);

        $vehicle = Vehicle::create($this->columns($data) + [
            'branch_id'       => $branch->id,
            'vehicle_type_id' => $this->typeFor($data['style'] ?? null, $data['kind'])->id,
            'status'          => self::STATUS_TO_DB[$data['status'] ?? 'Available'],
        ]);

        return response()->json(['vehicle' => $this->shape($vehicle->load('branch.vendor'), $request->user())], 201);
    }

    /** A vendor (or admin) edits a vehicle. Only the fields sent are changed. */
    public function update(Request $request, int $vehicle): JsonResponse
    {
        $model = Vehicle::with('branch.vendor')->findOrFail($vehicle);

        if (! $this->canManage($request, $model)) {
            return response()->json(['message' => 'You cannot change this vehicle.'], 403);
        }

        $data = $request->validate($this->rules(partial: true, ignoreId: $model->id));

        $changes = $this->columns($data);

        if (isset($data['status'])) {
            $changes['status'] = self::STATUS_TO_DB[$data['status']];
        }
        if (isset($data['branch'])) {
            $changes['branch_id'] = $this->branchFor($model->branch->vendor, $data['branch'])->id;
        }
        if (isset($data['style']) || isset($data['kind'])) {
            $changes['vehicle_type_id'] = $this->typeFor(
                $data['style'] ?? $model->style,
                $data['kind'] ?? $model->kind
            )->id;
        }

        $model->update($changes);

        return response()->json(['vehicle' => $this->shape($model->fresh('branch.vendor'), $request->user())]);
    }

    public function destroy(Request $request, int $vehicle): JsonResponse
    {
        $model = Vehicle::with('branch.vendor')->findOrFail($vehicle);

        if (! $this->canManage($request, $model)) {
            return response()->json(['message' => 'You cannot remove this vehicle.'], 403);
        }

        if ($model->bookings()->exists()) {
            return response()->json([
                'message' => "{$model->brand} {$model->model} has booking records, so it can't be removed. Set it to \"Under maintenance\" instead.",
            ], 422);
        }

        $model->delete();

        return response()->json(['ok' => true]);
    }

    // ---------------------------------------------------------------

    private function rules(bool $partial = false, ?int $ignoreId = null): array
    {
        $req = $partial ? 'sometimes' : 'required';

        return [
            'brand'        => [$req, 'string', 'max:100'],
            'model'        => [$req, 'string', 'max:100'],
            'plateNumber'  => [$req, 'string', 'max:30', 'unique:vehicles,plate_number'.($ignoreId ? ','.$ignoreId : '')],
            'kind'         => [$req, 'in:Car,Motorcycle'],
            'style'        => ['nullable', 'string', 'max:50'],
            'transmission' => ['nullable', 'in:Automatic,Manual'],
            'seats'        => [$req, 'integer', 'min:1', 'max:60'],
            'fuel'         => ['nullable', 'string', 'max:20'],
            'rate'         => [$req, 'numeric', 'gt:0', 'max:9999999'],
            'branch'       => [$req, 'string', 'max:150'],
            'image'        => ['nullable', 'string', 'max:255'],
            'badge'        => ['nullable', 'string', 'max:100'],
            'status'       => ['nullable', 'in:Available,Rented,Under maintenance'],
        ];
    }

    /** Turn React-style field names into database columns (only fields that were sent). */
    private function columns(array $data): array
    {
        $map = [
            'brand' => 'brand', 'model' => 'model', 'plateNumber' => 'plate_number',
            'kind' => 'kind', 'style' => 'style', 'transmission' => 'transmission',
            'seats' => 'seats', 'fuel' => 'fuel', 'rate' => 'rental_rate',
            'image' => 'image', 'badge' => 'badge',
        ];

        $out = [];
        foreach ($map as $from => $to) {
            if (array_key_exists($from, $data)) {
                $out[$to] = $data[$from];
            }
        }
        if (isset($out['plate_number'])) {
            $out['plate_number'] = strtoupper(trim($out['plate_number']));
        }

        return $out;
    }

    private function branchFor(Vendor $vendor, string $name): Branch
    {
        return Branch::firstOrCreate(
            ['vendor_id' => $vendor->id, 'branch_name' => $name],
            ['branch_address' => $name.', Bohol']
        );
    }

    private function typeFor(?string $style, string $kind): VehicleType
    {
        return VehicleType::firstOrCreate(['type_name' => $style ?: $kind]);
    }

    private function canManage(Request $request, Vehicle $vehicle): bool
    {
        $account = $request->user();

        return $account->role === 'admin'
            || $vehicle->branch?->vendor?->account_id === $account->id;
    }

    private function shape(Vehicle $v, $viewer = null): array
    {
        $isOwner = $viewer && ($viewer->role === 'admin' || $v->branch?->vendor?->account_id === $viewer->id);

        $out = [
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
            'status'       => self::STATUS_LABEL[$v->status] ?? 'Rented',
            'image'        => $v->image ?? '',
            'emoji'        => $this->emoji($v),
        ];

        if ($isOwner) {
            $out['plateNumber'] = $v->plate_number ?? '';
        }

        return $out;
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
