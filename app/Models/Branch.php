<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $table = 'branches';

    protected $fillable = [
        'vendor_id',
        'branch_name',
        'branch_address',
        'contact_number',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function vehicles()
{
    return $this->hasMany(Vehicle::class);
}

}
