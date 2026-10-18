<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'bookings';

    protected $fillable = [
        'account_id',
        'vehicle_id',
        'start_date',
        'end_date',
        'total_amount',
        'booking_status',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'total_amount' => 'decimal:2',
        ];
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }
    public function extensions()
{
    return $this->hasMany(BookingExtension::class);
}
public function payments()
{
    return $this->hasMany(Payment::class);
}
public function review()
{
    return $this->hasOne(Review::class);
}
public function penalties()
{
    return $this->hasMany(Penalty::class);
}
}
