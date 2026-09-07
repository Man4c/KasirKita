<?php

namespace App\Traits;

use App\Models\Store;
use App\Scopes\StoreScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToStore
{
    /**
     * Boot the BelongsToStore trait for the model.
     */
    public static function bootBelongsToStore(): void
    {
        static::addGlobalScope(new StoreScope());

        static::creating(function ($model) {
            if (empty($model->store_id) && auth()->check() && ! empty(auth()->user()->store_id)) {
                $model->store_id = auth()->user()->store_id;
            }
        });
    }

    /**
     * Relationship to the Store.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Bypass store scope to query across all tenants (superadmin / internal maintenance).
     */
    public function scopeWithoutStoreScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope(StoreScope::class);
    }

    /**
     * Query specifically for a targeted store ID.
     */
    public function scopeForStore(Builder $query, string $storeId): Builder
    {
        return $query->withoutGlobalScope(StoreScope::class)->where($this->getTable() . '.store_id', $storeId);
    }
}
