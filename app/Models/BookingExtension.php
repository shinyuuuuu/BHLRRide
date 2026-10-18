<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingExtension extends Model
{
    use HasFactory;

    protected $table = 'booking_extensions';

    protected $fillable = [
        'booking_id',
        'requested_end_date',
        'additional_amount',
        'extension_status',
    ];

    protected function casts(): array
    {
        return [
            'requested_end_date' => 'datetime',
            'additional_amount' => 'decimal:2',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
