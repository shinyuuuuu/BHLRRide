<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicle extends Model
{
    use HasFactory;

    protected $table = 'vehicles';

    protected $fillable = [
        'branch_id',
        'vehicle_type_id',
        'brand',
        'model',
        'plate_number',
        'rental_rate',
        'status',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'rental_rate' => 'decimal:2',
        ];
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function vehicleType()
    {
        return $this->belongsTo(VehicleType::class);
    }
    public function photos()
{
    return $this->hasMany(VehiclePhoto::class);
}
public function bookings()
{
    return $this->hasMany(Booking::class);
}
}
