<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    use HasFactory;

    public const DEFAULT_PREFERENCES = [
        'show_barcode_scanner' => true,
        'sound_beep' => true,
        'show_customer_picker' => true,
        'show_voucher_feature' => true,
        'show_tax_feature' => true,
        'auto_print' => false,
        'print_two_copies' => false,
        'paper_size' => '58mm',
    ];

    public const DEFAULT_APP_VERSION = [
        'latest_version' => '1.3.0',
        'latest_version_code' => 130,
        'min_supported_version' => '1.0.0',
        'apk_url' => null,
        'apk_size_bytes' => 0,
        'changelog' => [
            'Pembaruan sistem dan perbaikan performa kasir',
        ],
        'release_date' => '2026-09-06',
        'is_mandatory' => false,
    ];

    protected $fillable = [
        'name',
        'address',
        'phone',
        'logo',
        'receipt_footer',
        'show_logo_on_receipt',
        'show_phone_on_receipt',
        'preferences',
        'app_version',
    ];

    protected $casts = [
        'show_logo_on_receipt' => 'boolean',
        'show_phone_on_receipt' => 'boolean',
        'preferences' => 'array',
        'app_version' => 'array',
    ];

    /**
     * Get preferences with automatic fallback to default preferences.
     */
    public function getPreferencesAttribute($value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            $decoded = [];
        }
        $merged = array_merge(self::DEFAULT_PREFERENCES, $decoded);
        if (empty($merged['paper_size']) || !in_array($merged['paper_size'], ['58mm', '80mm'], true)) {
            $merged['paper_size'] = '58mm';
        }
        return $merged;
    }

    /**
     * Get app_version with automatic fallback to config and defaults.
     */
    public function getAppVersionAttribute($value): array
    {
        $decoded = is_string($value) ? json_decode($value, true) : $value;
        if (!is_array($decoded)) {
            $decoded = [];
        }

        $configDefaults = config('app_version', self::DEFAULT_APP_VERSION);
        $merged = array_merge($configDefaults, $decoded);

        if (isset($merged['changelog']) && is_array($merged['changelog'])) {
            $merged['changelog'] = array_values($merged['changelog']);
        } else {
            $merged['changelog'] = $configDefaults['changelog'] ?? self::DEFAULT_APP_VERSION['changelog'];
        }

        return $merged;
    }
}
