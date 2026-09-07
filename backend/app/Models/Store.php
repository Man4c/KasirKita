<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Store extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'business_type',
        'owner_id',
        'phone',
        'address',
        'subscription_status',
        'trial_ends_at',
        'activated_at',
        'license_key',
        'notes',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'activated_at' => 'datetime',
    ];

    /**
     * Primary Owner of this Store.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * All users/staff assigned to this store.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Products belonging to this store.
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Transactions belonging to this store.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Store identity and receipt settings.
     */
    public function setting(): HasOne
    {
        return $this->hasOne(StoreSetting::class);
    }

    /**
     * Check if store subscription is active (either lifetime active or within trial period).
     */
    public function isActive(): bool
    {
        if ($this->subscription_status === 'active') {
            return true;
        }

        if ($this->subscription_status === 'trial') {
            return $this->trial_ends_at === null || $this->trial_ends_at->isFuture();
        }

        return false;
    }

    /**
     * Check if store is in trial period.
     */
    public function isTrial(): bool
    {
        return $this->subscription_status === 'trial';
    }

    /**
     * Check if store trial has expired without activation.
     */
    public function isExpired(): bool
    {
        if ($this->subscription_status === 'expired') {
            return true;
        }

        if ($this->subscription_status === 'trial' && $this->trial_ends_at && $this->trial_ends_at->isPast()) {
            return true;
        }

        return false;
    }
}
