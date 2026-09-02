<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Transaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'invoice_number',
        'offline_id',
        'user_id',
        'customer_id',
        'customer_name',
        'customer_phone',
        'discount_id',
        'discount_code',
        'subtotal',
        'discount_amount',
        'tax_amount',
        'fee_amount',
        'fee_details',
        'total_amount',
        'paid_amount',
        'change_amount',
        'payment_method',
        'payment_status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'tax_amount' => 'decimal:2',
            'fee_amount' => 'decimal:2',
            'fee_details' => 'array',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'change_amount' => 'decimal:2',
        ];
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }

    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class);
    }

    public function cashFlow(): HasOne
    {
        return $this->hasOne(CashFlow::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
