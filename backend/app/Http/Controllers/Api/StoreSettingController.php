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
     * Get the store settings.
     */
    public function getStore(): JsonResponse
    {
        $setting = StoreSetting::first();

        if (!$setting) {
            $setting = StoreSetting::create([
                'name' => 'KasirKita Mart',
                'address' => 'Jl. Merdeka No. 12, Jakarta Pusat',
                'phone' => '0812-3456-7890',
                'receipt_footer' => 'Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar.',
                'show_logo_on_receipt' => true,
                'show_phone_on_receipt' => true,
            ]);
        }

        return $this->successResponse($setting, 'Pengaturan toko berhasil diambil');
    }

    /**
     * Update the store settings.
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
        ]);

        $setting = StoreSetting::first();

        if (!$setting) {
            $setting = new StoreSetting();
        }

        $setting->fill($validated);
        $setting->save();

        return $this->successResponse($setting, 'Pengaturan toko berhasil diperbarui');
    }
}
