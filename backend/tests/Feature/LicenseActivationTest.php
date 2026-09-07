<?php

namespace Tests\Feature;

use App\Models\LicenseKey;
use App\Models\Store;
use App\Models\User;
use App\Services\LicenseService;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class LicenseActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_license_service_generates_valid_keys_and_normalizes_input(): void
    {
        $service = app(LicenseService::class);

        $keys = $service->createBatch(5, 'lifetime', null, 'Batch Pengujian');
        $this->assertCount(5, $keys);

        foreach ($keys as $key) {
            $this->assertMatchesRegularExpression('/^KK-PRO-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/', $key->license_key);
            $this->assertEquals('available', $key->status);
            $this->assertEquals('lifetime', $key->duration_type);
        }

        // Test normalization forgiving input
        $this->assertEquals('KK-PRO-ABCD-EFGH', $service->normalizeKey('kk-pro-abcd-efgh'));
        $this->assertEquals('KK-PRO-ABCD-EFGH', $service->normalizeKey('KKPROABCDEFGH'));
        $this->assertEquals('KK-PRO-ABCD-EFGH', $service->normalizeKey('abcdefgh'));
        $this->assertEquals('KK-PRO-ABCD-EFGH', $service->normalizeKey('ABCD-EFGH'));
    }

    public function test_owner_can_activate_store_with_valid_lifetime_license(): void
    {
        $mockTelegram = Mockery::mock(TelegramNotificationService::class);
        $mockTelegram->shouldReceive('notifyLicenseActivated')
            ->once()
            ->andReturn(true);
        $this->app->instance(TelegramNotificationService::class, $mockTelegram);

        $store = Store::create([
            'name' => 'Toko Kelontong Berkah',
            'business_type' => 'retail',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $owner = User::create([
            'store_id' => $store->id,
            'name' => 'Pak Joko',
            'email' => 'joko@kelontongberkah.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $licenseService = app(LicenseService::class);
        $license = $licenseService->createKey('lifetime', null, 'Voucher Fisik Kartu KasirKita');

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => strtolower($license->license_key), // test case insensitivity
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Lisensi KasirKita PRO berhasil diaktifkan!',
                'data' => [
                    'store' => [
                        'id' => $store->id,
                        'name' => 'Toko Kelontong Berkah',
                        'subscription_status' => 'active',
                        'license_key' => $license->license_key,
                        'is_active' => true,
                        'is_trial' => false,
                        'is_expired' => false,
                        'subscription_expires_at' => null,
                    ],
                    'license' => [
                        'license_key' => $license->license_key,
                        'duration_type' => 'lifetime',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('stores', [
            'id' => $store->id,
            'subscription_status' => 'active',
            'license_key' => $license->license_key,
        ]);

        $this->assertDatabaseHas('license_keys', [
            'id' => $license->id,
            'status' => 'redeemed',
            'redeemed_by_store_id' => $store->id,
            'redeemed_by_user_id' => $owner->id,
        ]);
    }

    public function test_owner_can_activate_store_with_duration_license(): void
    {
        $mockTelegram = Mockery::mock(TelegramNotificationService::class);
        $mockTelegram->shouldReceive('notifyLicenseActivated')
            ->once()
            ->andReturn(true);
        $this->app->instance(TelegramNotificationService::class, $mockTelegram);

        $store = Store::create([
            'name' => 'Cafe Kopi Senja',
            'business_type' => 'fnb',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(5),
        ]);

        $owner = User::create([
            'store_id' => $store->id,
            'name' => 'Mas Seno',
            'email' => 'seno@kopisenja.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $licenseService = app(LicenseService::class);
        $license = $licenseService->createKey('1_year', 365, 'Paket Langganan 1 Tahun');

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => $license->license_key,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store' => [
                        'subscription_status' => 'active',
                        'is_active' => true,
                    ],
                    'license' => [
                        'duration_type' => '1_year',
                        'duration_days' => 365,
                    ],
                ],
            ]);

        $store->refresh();
        $this->assertNotNull($store->subscription_expires_at);
        $this->assertTrue($store->subscription_expires_at->isFuture());
    }

    public function test_cashier_cannot_activate_license(): void
    {
        $store = Store::create([
            'name' => 'Apotek Sehat',
            'business_type' => 'retail',
            'subscription_status' => 'trial',
        ]);

        $cashier = User::create([
            'store_id' => $store->id,
            'name' => 'Kasir Rina',
            'email' => 'rina@apoteksehat.com',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $response = $this->actingAs($cashier, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => 'KK-PRO-ABCD-EFGH',
        ]);

        $response->assertStatus(403);
    }

    public function test_cannot_activate_with_invalid_or_non_existent_key(): void
    {
        $store = Store::create([
            'name' => 'Toko Jaya',
            'business_type' => 'retail',
            'subscription_status' => 'trial',
        ]);

        $owner = User::create([
            'store_id' => $store->id,
            'name' => 'Owner Jaya',
            'email' => 'owner@tokojaya.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => 'KK-PRO-9999-9999',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Kode lisensi tidak valid atau tidak ditemukan.',
            ]);
    }

    public function test_cannot_redeem_already_redeemed_key(): void
    {
        $licenseService = app(LicenseService::class);
        $license = $licenseService->createKey('lifetime');

        $store1 = Store::create([
            'name' => 'Toko Pertama',
            'subscription_status' => 'trial',
        ]);
        $owner1 = User::create([
            'store_id' => $store1->id,
            'name' => 'Owner 1',
            'email' => 'owner1@store.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        // Redeem for Store 1
        $this->actingAs($owner1, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => $license->license_key,
        ])->assertStatus(200);

        // Store 2 tries to redeem the same key
        $store2 = Store::create([
            'name' => 'Toko Kedua',
            'subscription_status' => 'trial',
        ]);
        $owner2 = User::create([
            'store_id' => $store2->id,
            'name' => 'Owner 2',
            'email' => 'owner2@store.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $response = $this->actingAs($owner2, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => $license->license_key,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Kode lisensi ini sudah pernah digunakan oleh toko lain.',
            ]);
    }

    public function test_cannot_redeem_revoked_key(): void
    {
        $license = LicenseKey::create([
            'license_key' => 'KK-PRO-BLOK-IRXX',
            'status' => 'revoked',
            'duration_type' => 'lifetime',
        ]);

        $store = Store::create([
            'name' => 'Toko Uji',
            'subscription_status' => 'trial',
        ]);
        $owner = User::create([
            'store_id' => $store->id,
            'name' => 'Owner Uji',
            'email' => 'owner@uji.com',
            'password' => bcrypt('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/store/activate-license', [
            'license_key' => $license->license_key,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Kode lisensi ini telah dinonaktifkan.',
            ]);
    }

    public function test_can_get_store_license_status(): void
    {
        $store = Store::create([
            'name' => 'Bengkel Motor Kilat',
            'business_type' => 'service',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(10),
        ]);

        $user = User::create([
            'store_id' => $store->id,
            'name' => 'Mekanik Budi',
            'email' => 'budi@bengkelkilat.com',
            'password' => bcrypt('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user, 'sanctum')->getJson('/api/store/license');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store_id' => $store->id,
                    'store_name' => 'Bengkel Motor Kilat',
                    'subscription_status' => 'trial',
                    'is_active' => true,
                    'is_trial' => true,
                    'is_expired' => false,
                    'days_remaining' => 10,
                ],
            ]);
    }
}
