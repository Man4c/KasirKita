<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Discount extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'description',
        'type', // PERCENTAGE, FIXED, MIN_SPEND
        'value',
        'min_purchase_amount',
        'max_discount_amount',
        'start_date',
        'end_date',
        'quota',
        'usage_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_purchase_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'quota' => 'integer',
            'usage_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope to filter currently valid and active discounts.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                    ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->where(function ($q) {
                $q->whereNull('quota')
                    ->orWhereColumn('usage_count', '<', 'quota');
            });
    }

    /**
     * Check if discount is currently expired.
     */
    public function isExpired(): bool
    {
        if ($this->end_date && now()->isAfter($this->end_date)) {
            return true;
        }

        if ($this->start_date && now()->isBefore($this->start_date)) {
            return true;
        }

        return false;
    }

    /**
     * Check if discount quota has been reached.
     */
    public function isQuotaExceeded(): bool
    {
        if ($this->quota !== null && $this->usage_count >= $this->quota) {
            return true;
        }

        return false;
    }

    /**
     * Calculate discount amount given a subtotal.
     */
    public function calculateDiscount(float $subtotal): float
    {
        if ($subtotal < (float) $this->min_purchase_amount) {
            return 0;
        }

        $calculated = 0;
        $val = (float) $this->value;

        if ($this->type === 'PERCENTAGE' || $this->type === 'MIN_SPEND') {
            $calculated = ($subtotal * $val) / 100;
            if ($this->max_discount_amount !== null && (float) $this->max_discount_amount > 0) {
                $calculated = min($calculated, (float) $this->max_discount_amount);
            }
        } elseif ($this->type === 'FIXED') {
            $calculated = min($val, $subtotal);
        }

        return round(max(0, $calculated), 2);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
