<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AppInstallation extends Model
{
    use HasFactory;

    protected $table = 'app_installations';

    protected $fillable = [
        'installation_id',
        'device_model',
        'brand',
        'os_name',
        'os_version',
        'app_version',
        'app_version_code',
        'ip_address',
        'first_installed_at',
        'last_active_at',
        'total_pings',
        'user_id',
        'metadata',
    ];

    protected $casts = [
        'first_installed_at' => 'datetime',
        'last_active_at' => 'datetime',
        'total_pings' => 'integer',
        'app_version_code' => 'integer',
        'metadata' => 'array',
    ];

    /**
     * Associated logged-in user if cashier/owner is logged in on this device.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
