<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LicenseKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'license_key',
        'status',
        'duration_type',
        'duration_days',
        'redeemed_by_store_id',
        'redeemed_by_user_id',
        'redeemed_at',
        'notes',
    ];

    protected $casts = [
        'duration_days' => 'integer',
        'redeemed_at' => 'datetime',
    ];

    /**
     * Store that redeemed this license key.
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'redeemed_by_store_id');
    }

    /**
     * User/Owner who redeemed this license key.
     */
    public function redeemedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'redeemed_by_user_id');
    }

    /**
     * Scope query to available (unredeemed) keys.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope query to redeemed keys.
     */
    public function scopeRedeemed($query)
    {
        return $query->where('status', 'redeemed');
    }

    /**
     * Check if key is available for redemption.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if key has already been redeemed.
     */
    public function isRedeemed(): bool
    {
        return $this->status === 'redeemed';
    }

    /**
     * Check if key has been revoked.
     */
    public function isRevoked(): bool
    {
        return $this->status === 'revoked';
    }

    /**
     * Check if key grants lifetime access.
     */
    public function isLifetime(): bool
    {
        return $this->duration_type === 'lifetime';
    }
}
