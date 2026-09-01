<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TransactionItem extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'transaction_id',
        'product_id',
        'product_name',
        'unit_name',
        'conversion_factor',
        'quantity',
        'base_quantity',
        'unit_price',
        'unit_cost',
        'subtotal',
        'total_cost',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:4',
            'conversion_factor' => 'decimal:4',
            'base_quantity' => 'decimal:4',
            'unit_price' => 'decimal:2',
            'unit_cost' => 'decimal:4',
            'subtotal' => 'decimal:2',
            'total_cost' => 'decimal:4',
            'created_at' => 'datetime',
        ];
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
