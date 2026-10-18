<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Account extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'accounts';

    protected $fillable = [
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'password',
        'phone',
        'role',
        'account_status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function vendor()
    {
        return $this->hasOne(Vendor::class);
    }

    public function bookings()
{
    return $this->hasMany(Booking::class);
}
public function documents()
{
    return $this->hasMany(Document::class);
}

public function verifiedDocuments()
{
    return $this->hasMany(
        Document::class,
        'verified_by_account_id'
    );
}
public function reviews()
{
    return $this->hasMany(Review::class);
}

public function issuedPenalties()
{
    return $this->hasMany(
        Penalty::class,
        'issued_by_account_id'
    );
}
}
