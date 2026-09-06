<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\StoreSetting;
use App\Models\Supplier;
use App\Models\TaxAndFee;
use App\Models\Unit;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    /**
     * Restore master data and store settings from a backup payload (Owner only).
     */
    public function restoreBackup(Request $request): JsonResponse
    {
        $payload = $request->input('data', []);

        DB::beginTransaction();
        try {
            // 1. Categories
            if (! empty($payload['categories']) && is_array($payload['categories'])) {
                foreach ($payload['categories'] as $cat) {
                    if (empty($cat['name'])) continue;
                    $category = null;
                    if (! empty($cat['id'])) {
                        $category = Category::withTrashed()->find($cat['id']);
                    }
                    if (! $category) {
                        $category = Category::withTrashed()->where('name', $cat['name'])->first();
                    }
                    if ($category) {
                        if ($category->trashed()) {
                            $category->restore();
                        }
                        $category->update([
                            'name' => $cat['name'],
                            'slug' => $cat['slug'] ?? Str::slug($cat['name']),
                            'description' => $cat['description'] ?? $category->description,
                        ]);
                    } else {
                        Category::create([
                            'id' => $cat['id'] ?? (string) Str::uuid(),
                            'name' => $cat['name'],
                            'slug' => $cat['slug'] ?? Str::slug($cat['name']),
                            'description' => $cat['description'] ?? null,
                        ]);
                    }
                }
            }

            // 2. Units
            if (! empty($payload['units']) && is_array($payload['units'])) {
                foreach ($payload['units'] as $u) {
                    if (empty($u['name'])) continue;
                    $unit = null;
                    if (! empty($u['id'])) {
                        $unit = Unit::withTrashed()->find($u['id']);
                    }
                    if (! $unit) {
                        $unit = Unit::withTrashed()->where('name', $u['name'])->first();
                    }
                    if ($unit) {
                        if ($unit->trashed()) {
                            $unit->restore();
                        }
                        $unit->update([
                            'name' => $u['name'],
                            'symbol' => $u['symbol'] ?? $unit->symbol,
                            'description' => $u['description'] ?? $unit->description,
                        ]);
                    } else {
                        Unit::create([
                            'id' => $u['id'] ?? (string) Str::uuid(),
                            'name' => $u['name'],
                            'symbol' => $u['symbol'] ?? $u['name'],
                            'description' => $u['description'] ?? null,
                        ]);
                    }
                }
            }

            // 3. Products
            if (! empty($payload['products']) && is_array($payload['products'])) {
                foreach ($payload['products'] as $p) {
                    if (empty($p['name'])) continue;
                    $product = null;
                    if (! empty($p['id'])) {
                        $product = Product::withTrashed()->find($p['id']);
                    }
                    if (! $product && ! empty($p['sku_barcode'])) {
                        $product = Product::withTrashed()->where('sku_barcode', $p['sku_barcode'])->first();
                    }
                    if (! $product) {
                        $product = Product::withTrashed()->where('name', $p['name'])->first();
                    }

                    $prodData = [
                        'category_id' => $p['category_id'] ?? null,
                        'base_unit_id' => $p['base_unit_id'] ?? null,
                        'default_pos_unit_id' => $p['default_pos_unit_id'] ?? null,
                        'name' => $p['name'],
                        'sku_barcode' => $p['sku_barcode'] ?? null,
                        'description' => $p['description'] ?? null,
                        'price' => $p['price'] ?? 0,
                        'avg_cost' => $p['avg_cost'] ?? 0,
                        'stock' => $p['stock'] ?? 0,
                        'min_stock' => $p['min_stock'] ?? 0,
                        'is_active' => $p['is_active'] ?? true,
                        'is_for_sale' => $p['is_for_sale'] ?? true,
                    ];

                    if ($product) {
                        if ($product->trashed()) {
                            $product->restore();
                        }
                        $product->update($prodData);
                    } else {
                        $prodData['id'] = $p['id'] ?? (string) Str::uuid();
                        Product::create($prodData);
                    }
                }
            }

            // 4. Customers
            if (! empty($payload['customers']) && is_array($payload['customers'])) {
                foreach ($payload['customers'] as $c) {
                    if (empty($c['name'])) continue;
                    $customer = null;
                    if (! empty($c['id'])) {
                        $customer = Customer::withTrashed()->find($c['id']);
                    }
                    if (! $customer && ! empty($c['phone'])) {
                        $customer = Customer::withTrashed()->where('phone', $c['phone'])->first();
                    }
                    $custData = [
                        'name' => $c['name'],
                        'phone' => $c['phone'] ?? null,
                        'email' => $c['email'] ?? null,
                        'address' => $c['address'] ?? null,
                    ];
                    if ($customer) {
                        if ($customer->trashed()) {
                            $customer->restore();
                        }
                        $customer->update($custData);
                    } else {
                        $custData['id'] = $c['id'] ?? (string) Str::uuid();
                        Customer::create($custData);
                    }
                }
            }

            // 5. Suppliers
            if (! empty($payload['suppliers']) && is_array($payload['suppliers'])) {
                foreach ($payload['suppliers'] as $s) {
                    if (empty($s['name'])) continue;
                    $supplier = null;
                    if (! empty($s['id'])) {
                        $supplier = Supplier::withTrashed()->find($s['id']);
                    }
                    if (! $supplier && ! empty($s['phone'])) {
                        $supplier = Supplier::withTrashed()->where('phone', $s['phone'])->first();
                    }
                    $suppData = [
                        'name' => $s['name'],
                        'contact_person' => $s['contact_person'] ?? null,
                        'phone' => $s['phone'] ?? null,
                        'email' => $s['email'] ?? null,
                        'address' => $s['address'] ?? null,
                        'bank_name' => $s['bank_name'] ?? null,
                        'bank_account' => $s['bank_account'] ?? null,
                    ];
                    if ($supplier) {
                        if ($supplier->trashed()) {
                            $supplier->restore();
                        }
                        $supplier->update($suppData);
                    } else {
                        $suppData['id'] = $s['id'] ?? (string) Str::uuid();
                        Supplier::create($suppData);
                    }
                }
            }

            // 6. Taxes and Fees
            if (! empty($payload['taxes_and_fees']) && is_array($payload['taxes_and_fees'])) {
                foreach ($payload['taxes_and_fees'] as $t) {
                    if (empty($t['name'])) continue;
                    $tax = null;
                    if (! empty($t['id'])) {
                        $tax = TaxAndFee::withTrashed()->find($t['id']);
                    }
                    if (! $tax) {
                        $tax = TaxAndFee::withTrashed()->where('name', $t['name'])->first();
                    }
                    $taxData = [
                        'name' => $t['name'],
                        'type' => $t['type'] ?? 'PERCENTAGE',
                        'value' => $t['value'] ?? 0,
                        'is_active' => $t['is_active'] ?? true,
                    ];
                    if ($tax) {
                        if ($tax->trashed()) {
                            $tax->restore();
                        }
                        $tax->update($taxData);
                    } else {
                        $taxData['id'] = $t['id'] ?? (string) Str::uuid();
                        TaxAndFee::create($taxData);
                    }
                }
            }

            // 7. Discounts / Promos
            if (! empty($payload['discounts']) && is_array($payload['discounts'])) {
                foreach ($payload['discounts'] as $d) {
                    if (empty($d['name'])) continue;
                    $disc = null;
                    if (! empty($d['id'])) {
                        $disc = Discount::withTrashed()->find($d['id']);
                    }
                    if (! $disc && ! empty($d['code'])) {
                        $disc = Discount::withTrashed()->where('code', $d['code'])->first();
                    }
                    $discData = [
                        'name' => $d['name'],
                        'code' => $d['code'] ?? null,
                        'type' => $d['type'] ?? 'PERCENTAGE',
                        'value' => $d['value'] ?? 0,
                        'is_active' => $d['is_active'] ?? true,
                    ];
                    if ($disc) {
                        if ($disc->trashed()) {
                            $disc->restore();
                        }
                        $disc->update($discData);
                    } else {
                        $discData['id'] = $d['id'] ?? (string) Str::uuid();
                        Discount::create($discData);
                    }
                }
            }

            // 8. Store Settings & Preferences
            if (! empty($payload['store']) || ! empty($payload['preferences'])) {
                $setting = StoreSetting::first();
                if (! $setting) {
                    $setting = new StoreSetting();
                }
                $storeData = $payload['store'] ?? [];
                if (! empty($storeData['name'])) $setting->name = $storeData['name'];
                if (isset($storeData['address'])) $setting->address = $storeData['address'];
                if (isset($storeData['phone'])) $setting->phone = $storeData['phone'];
                if (isset($storeData['logo'])) $setting->logo = $storeData['logo'];
                if (isset($storeData['receipt_footer'])) $setting->receipt_footer = $storeData['receipt_footer'];
                if (isset($storeData['show_logo_on_receipt'])) $setting->show_logo_on_receipt = $storeData['show_logo_on_receipt'];
                if (isset($storeData['show_phone_on_receipt'])) $setting->show_phone_on_receipt = $storeData['show_phone_on_receipt'];

                if (! empty($payload['preferences']) && is_array($payload['preferences'])) {
                    $currentPrefs = $setting->preferences ?? StoreSetting::DEFAULT_PREFERENCES;
                    $setting->preferences = array_merge($currentPrefs, $payload['preferences']);
                }
                $setting->save();
            }

            DB::commit();
            return $this->successResponse(null, 'Data toko berhasil dipulihkan ke server.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->errorResponse('Gagal memulihkan data ke server: ' . $e->getMessage(), 500);
        }
    }
}
