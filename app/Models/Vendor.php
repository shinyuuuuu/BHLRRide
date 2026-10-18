<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $table = 'vendors';

    protected $fillable = [
        'account_id',
        'business_name',
        'business_address',
        'business_phone',
        'approval_status',
        'approved_by',
    ];

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(Account::class, 'approved_by');
    }
    
    public function branches()
{
    return $this->hasMany(Branch::class);
}
}
