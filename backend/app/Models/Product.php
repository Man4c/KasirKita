<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'category_id',
        'base_unit_id',
        'default_pos_unit_id',
        'name',
        'sku_barcode',
        'description',
        'price',
        'avg_cost',
        'stock',
        'min_stock',
        'image_path',
        'is_active',
        'is_for_sale',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'avg_cost' => 'decimal:4',
            'stock' => 'decimal:4',
            'min_stock' => 'decimal:4',
            'is_active' => 'boolean',
            'is_for_sale' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function ($product) {
            if (empty($product->base_unit_id)) {
                $product->base_unit_id = Unit::where('symbol', 'pcs')->value('id')
                    ?? Unit::first()?->id
                    ?? Unit::create(['name' => 'Pieces / Buah', 'symbol' => 'pcs'])->id;
            }
        });

        static::created(function ($product) {
            if (! $product->conversions()->where('is_base', true)->exists()) {
                $product->conversions()->create([
                    'unit_id' => $product->base_unit_id,
                    'conversion_factor' => 1.0000,
                    'sku_barcode' => $product->sku_barcode,
                    'price' => $product->price,
                    'is_base' => true,
                ]);
            }
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function baseUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'base_unit_id');
    }

    public function defaultPosUnit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'default_pos_unit_id');
    }

    public function conversions(): HasMany
    {
        return $this->hasMany(ProductUnitConversion::class);
    }

    public function baseConversion(): HasOne
    {
        return $this->hasOne(ProductUnitConversion::class)->where('is_base', true);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function transactionItems(): HasMany
    {
        return $this->hasMany(TransactionItem::class);
    }
}
