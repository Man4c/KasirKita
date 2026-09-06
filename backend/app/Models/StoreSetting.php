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

    protected $fillable = [
        'name',
        'address',
        'phone',
        'logo',
        'receipt_footer',
        'show_logo_on_receipt',
        'show_phone_on_receipt',
        'preferences',
    ];

    protected $casts = [
        'show_logo_on_receipt' => 'boolean',
        'show_phone_on_receipt' => 'boolean',
        'preferences' => 'array',
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
}
