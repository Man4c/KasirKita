<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'stock_opname_id',
        'product_id',
        'system_stock',
        'physical_stock',
        'difference',
        'unit_cost',
        'total_difference_cost',
        'reason',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'system_stock' => 'decimal:4',
            'physical_stock' => 'decimal:4',
            'difference' => 'decimal:4',
            'unit_cost' => 'decimal:4',
            'total_difference_cost' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
