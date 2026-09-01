<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaxAndFee extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'taxes_and_fees';

    protected $fillable = [
        'name',
        'type', // PERCENTAGE, FIXED
        'value',
        'apply_to', // ALL, SPECIFIC_PAYMENT, TAKEAWAY_ONLY, MANUAL
        'payment_method', // QRIS, TRANSFER, CASH
        'is_tax', // true = Pajak (PPN/PB1), false = Biaya operasional/layanan
        'is_default', // otomatis diterapkan pada transaksi
        'is_active',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'decimal:4',
            'is_tax' => 'boolean',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope only active components.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope only taxes.
     */
    public function scopeTaxes(Builder $query): Builder
    {
        return $query->where('is_tax', true);
    }

    /**
     * Scope only fees.
     */
    public function scopeFees(Builder $query): Builder
    {
        return $query->where('is_tax', false);
    }

    /**
     * Calculate calculated fee/tax amount against a base amount (subtotal - discount).
     */
    public function calculate(float $baseAmount): float
    {
        if (! $this->is_active) {
            return 0;
        }

        if ($this->type === 'PERCENTAGE') {
            return round(($baseAmount * (float) $this->value) / 100, 2);
        }

        return round((float) $this->value, 2);
    }
}
