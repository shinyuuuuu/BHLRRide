<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Penalty extends Model
{
    use HasFactory;

    protected $table = 'penalties';

    protected $fillable = [
        'booking_id',
        'penalty_type',
        'description',
        'amount',
        'penalty_status',
        'issued_by_account_id',
        'date_issued',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'date_issued' => 'datetime',
        ];
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function issuedBy()
    {
        return $this->belongsTo(
            Account::class,
            'issued_by_account_id'
        );
    }
}
