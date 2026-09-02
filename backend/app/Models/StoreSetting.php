<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'logo',
        'receipt_footer',
        'show_logo_on_receipt',
        'show_phone_on_receipt',
    ];

    protected $casts = [
        'show_logo_on_receipt' => 'boolean',
        'show_phone_on_receipt' => 'boolean',
    ];
}
