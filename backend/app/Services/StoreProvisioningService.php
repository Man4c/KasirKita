<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StoreProvisioningService
{
    public function __construct(
        protected TelegramNotificationService $telegramService
    ) {}

    /**
     * Register a new store and owner account atomically, then provision industry templates.
     *
     * @param  array{
     *     store_name: string,
     *     business_type: string,
     *     owner_name: string,
     *     email: string,
     *     password: string,
     *     phone: string,
     *     address?: string|null,
     * }  $data
     * @return array{user: User, store: Store, token: string}
     */
    public function registerStore(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $businessType = strtolower($data['business_type'] ?? 'retail');
            if (! in_array($businessType, ['retail', 'fnb', 'service', 'other'], true)) {
                $businessType = 'retail';
            }

            // 1. Create Store in Trial status (14 days)
            $store = Store::create([
                'name' => $data['store_name'],
                'business_type' => $businessType,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'subscription_status' => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'notes' => 'Registrasi mandiri dari aplikasi KasirKita',
            ]);

            // 2. Create Owner User
            $owner = User::create([
                'store_id' => $store->id,
                'name' => $data['owner_name'],
                'email' => strtolower(trim($data['email'])),
                'phone' => $data['phone'] ?? null,
                'role' => 'owner',
                'password' => Hash::make($data['password']),
                'is_active' => true,
            ]);

            // 3. Link Owner back to Store
            $store->update(['owner_id' => $owner->id]);

            // 4. Create default StoreSetting for the new store
            StoreSetting::create([
                'store_id' => $store->id,
                'name' => $store->name,
                'address' => $store->address,
                'phone' => $store->phone,
                'preferences' => StoreSetting::DEFAULT_PREFERENCES,
            ]);

            // 5. Provision Industry Template Data (Categories & Custom Units)
            $this->provisionTemplates($store, $businessType);

            // 6. Generate Sanctum Access Token
            $token = $owner->createToken('kasirkita-mobile')->plainTextToken;

            // 7. Push Telegram Alert to App Owner (Non-blocking fail-safe)
            $this->telegramService->notifyNewStoreRegistered($store, $owner);

            return [
                'user' => $owner,
                'store' => $store,
                'token' => $token,
            ];
        });
    }

    /**
     * Auto-provision initial categories and units suited for the selected business type.
     */
    public function provisionTemplates(Store $store, string $businessType): void
    {
        $categoryTemplates = match ($businessType) {
            'fnb' => [
                ['name' => 'Makanan Utama', 'slug' => 'makanan-utama', 'description' => 'Menu hidangan utama'],
                ['name' => 'Minuman & Kopi', 'slug' => 'minuman-kopi', 'description' => 'Aneka kopi, teh, dan jus'],
                ['name' => 'Camilan & Dessert', 'slug' => 'camilan-dessert', 'description' => 'Snack dan makanan penutup'],
                ['name' => 'Menu Paket', 'slug' => 'menu-paket', 'description' => 'Paket hemat kombo'],
                ['name' => 'Topping & Tambahan', 'slug' => 'topping-tambahan', 'description' => 'Extra topping dan sambal'],
            ],
            'service' => [
                ['name' => 'Layanan Utama', 'slug' => 'layanan-utama', 'description' => 'Jasa dan perbaikan utama'],
                ['name' => 'Paket Layanan', 'slug' => 'paket-layanan', 'description' => 'Paket komplit berkala'],
                ['name' => 'Sparepart & Bahan', 'slug' => 'sparepart-bahan', 'description' => 'Komponen dan bahan habis pakai'],
            ],
            'other' => [
                ['name' => 'Produk Reguler', 'slug' => 'produk-reguler', 'description' => 'Katalog produk utama'],
                ['name' => 'Layanan / Servis', 'slug' => 'layanan-servis', 'description' => 'Layanan dan servis'],
            ],
            default => [ // retail
                ['name' => 'Makanan & Minuman', 'slug' => 'makanan-minuman', 'description' => 'Produk makanan dan minuman kemasan'],
                ['name' => 'Kebutuhan Pokok', 'slug' => 'kebutuhan-pokok', 'description' => 'Beras, minyak, gula, sembako'],
                ['name' => 'Snack & Camilan', 'slug' => 'snack-camilan', 'description' => 'Makanan ringan dan biskuit'],
                ['name' => 'Perawatan & Kebersihan', 'slug' => 'perawatan-kebersihan', 'description' => 'Sabun, sampo, deterjen'],
                ['name' => 'Rokok & Tembakau', 'slug' => 'rokok-tembakau', 'description' => 'Produk tembakau dan rokok'],
            ],
        };

        foreach ($categoryTemplates as $cat) {
            Category::create([
                'store_id' => $store->id,
                'name' => $cat['name'],
                'slug' => $cat['slug'],
                'description' => $cat['description'],
            ]);
        }

        // Additional Industry-specific Units
        $unitTemplates = match ($businessType) {
            'fnb' => [
                ['name' => 'Porsi', 'symbol' => 'porsi', 'description' => 'Satu porsi sajian'],
                ['name' => 'Cup', 'symbol' => 'cup', 'description' => 'Satu cup minuman'],
                ['name' => 'Gelas', 'symbol' => 'gls', 'description' => 'Satu gelas minuman'],
            ],
            'service' => [
                ['name' => 'Sesi', 'symbol' => 'sesi', 'description' => 'Satu sesi pengerjaan'],
                ['name' => 'Jam', 'symbol' => 'jam', 'description' => 'Per jam pengerjaan'],
            ],
            default => [],
        };

        foreach ($unitTemplates as $unit) {
            // Only create if not already provided in shared system units (symbol check)
            $existingUnit = Unit::withoutStoreScope()
                ->where(function ($q) use ($store, $unit) {
                    $q->whereNull('store_id')
                      ->orWhere('store_id', $store->id);
                })
                ->where('symbol', $unit['symbol'])
                ->first();

            if (! $existingUnit) {
                Unit::create([
                    'store_id' => $store->id,
                    'name' => $unit['name'],
                    'symbol' => $unit['symbol'],
                    'description' => $unit['description'],
                ]);
            }
        }
    }
}
