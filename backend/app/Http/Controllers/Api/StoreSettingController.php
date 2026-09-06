<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreSettingController extends Controller
{
    use ApiResponse;

    /**
     * Get the store settings including preferences.
     */
    public function getStore(): JsonResponse
    {
        $setting = StoreSetting::first();

        if (! $setting) {
            $setting = StoreSetting::create([
                'name' => 'KasirKita Mart',
                'address' => 'Jl. Merdeka No. 12, Jakarta Pusat',
                'phone' => '0812-3456-7890',
                'receipt_footer' => 'Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar.',
                'show_logo_on_receipt' => true,
                'show_phone_on_receipt' => true,
                'preferences' => StoreSetting::DEFAULT_PREFERENCES,
            ]);
        }

        return $this->successResponse($setting, 'Pengaturan toko berhasil diambil');
    }

    /**
     * Update the general store settings.
     */
    public function updateStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'logo' => 'nullable|string',
            'receipt_footer' => 'nullable|string|max:500',
            'show_logo_on_receipt' => 'nullable|boolean',
            'show_phone_on_receipt' => 'nullable|boolean',
            'preferences' => 'nullable|array',
        ]);

        $setting = StoreSetting::first();

        if (! $setting) {
            $setting = new StoreSetting();
        }

        if (isset($validated['preferences'])) {
            $currentPreferences = $setting->preferences ?? StoreSetting::DEFAULT_PREFERENCES;
            $validated['preferences'] = array_merge($currentPreferences, $validated['preferences']);
        }

        $setting->fill($validated);
        $setting->save();

        return $this->successResponse($setting, 'Pengaturan toko berhasil diperbarui');
    }

    /**
     * Update the store preferences atomically (Owner only).
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'show_barcode_scanner' => 'nullable|boolean',
            'sound_beep' => 'nullable|boolean',
            'show_customer_picker' => 'nullable|boolean',
            'show_voucher_feature' => 'nullable|boolean',
            'show_tax_feature' => 'nullable|boolean',
            'auto_print' => 'nullable|boolean',
            'print_two_copies' => 'nullable|boolean',
            'paper_size' => 'nullable|string|in:58mm,80mm',
        ]);

        $setting = StoreSetting::first();

        if (! $setting) {
            $setting = StoreSetting::create([
                'name' => 'KasirKita Mart',
                'preferences' => StoreSetting::DEFAULT_PREFERENCES,
            ]);
        }

        $currentPreferences = $setting->preferences ?? StoreSetting::DEFAULT_PREFERENCES;
        $filteredIncoming = array_filter($validated, fn ($val) => ! is_null($val));
        $updatedPreferences = array_merge($currentPreferences, $filteredIncoming);

        $setting->preferences = $updatedPreferences;
        $setting->save();

        return $this->successResponse($setting->preferences, 'Preferensi toko berhasil diperbarui.');
    }
}
