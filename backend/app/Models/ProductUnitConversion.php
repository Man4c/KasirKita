<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductUnitConversion extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'product_id',
        'unit_id',
        'conversion_factor',
        'sku_barcode',
        'price',
        'is_base',
        'is_default_pos',
    ];

    protected $casts = [
        'conversion_factor' => 'decimal:4',
        'price' => 'decimal:2',
        'is_base' => 'boolean',
        'is_default_pos' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }
}
