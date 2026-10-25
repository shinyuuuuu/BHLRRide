<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VehicleType extends Model
{
    use HasFactory;

    protected $table = 'vehicle_types';

    protected $fillable = [
        'type_name',
        'description',
    ];

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
