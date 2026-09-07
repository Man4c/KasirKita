<?php

namespace App\Models;

use App\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use BelongsToStore, HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'store_id',
        'name',
        'symbol',
        'description',
    ];

    /**
     * Mark Unit as a shared tenant model so system default units (store_id NULL) are accessible by all tenants.
     */
    public function isSharedTenantModel(): bool
    {
        return true;
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'base_unit_id');
    }

    public function conversions(): HasMany
    {
        return $this->hasMany(ProductUnitConversion::class, 'unit_id');
    }
}
