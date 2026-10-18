<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $table = 'documents';

    protected $fillable = [
        'account_id',
        'document_type',
        'document_path',
        'verification_status',
        'verified_by_account_id',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function verifiedBy()
    {
        return $this->belongsTo(
            Account::class,
            'verified_by_account_id'
        );
    }
}
