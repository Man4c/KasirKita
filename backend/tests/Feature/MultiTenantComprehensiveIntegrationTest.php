<?php

namespace Tests\Feature;

use App\Models\LicenseKey;
use App\Models\Store;
use App\Models\User;
use App\Services\LicenseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantComprehensiveIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function asTenant(string $token)
    {
        $this->app['auth']->forgetGuards();

        return $this->withHeader('Authorization', 'Bearer '.$token);
    }

    public function test_multitenant_full_store_lifecycle_and_zero_data_leakage(): void
    {
        // -------------------------------------------------------------
        // STEP 1: Store A Registers as Retail
        // -------------------------------------------------------------
        $regStoreARes = $this->postJson('/api/auth/register-store', [
            'store_name' => 'Minimarket Barokah Alpha',
            'business_type' => 'retail',
            'owner_name' => 'Pak Haji Budi',
            'email' => 'budi@barokah.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'address' => 'Jl. Merdeka No. 10, Bandung',
        ]);

        $regStoreARes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'budi@barokah.com',
                        'role' => 'owner',
                    ],
                ],
            ]);

        $tokenA = $regStoreARes->json('data.token');
        $storeAId = $regStoreARes->json('data.user.store_id');
        $storeA = Store::findOrFail($storeAId);

        $this->assertEquals('trial', $storeA->subscription_status);
        $this->assertTrue($storeA->isActive());

        // Verify Retail auto-provisioned categories
        $catARes = $this->asTenant($tokenA)
            ->getJson('/api/categories');
        $catARes->assertStatus(200);
        $catANames = collect($catARes->json('data'))->pluck('name')->toArray();
        $this->assertContains('Makanan & Minuman', $catANames);
        $this->assertContains('Kebutuhan Pokok', $catANames);
        $categoryAId = $catARes->json('data.0.id');

        // -------------------------------------------------------------
        // STEP 2: Store B Registers as F&B
        // -------------------------------------------------------------
        $regStoreBRes = $this->postJson('/api/auth/register-store', [
            'store_name' => 'Kedai Kopi Senja Beta',
            'business_type' => 'fnb',
            'owner_name' => 'Mbak Maya',
            'email' => 'maya@senjakopi.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '089876543210',
            'address' => 'Jl. Riau No. 45, Bandung',
        ]);

        $regStoreBRes->assertStatus(201);
        $tokenB = $regStoreBRes->json('data.token');
        $storeBId = $regStoreBRes->json('data.user.store_id');
        $storeB = Store::findOrFail($storeBId);

        // Verify F&B auto-provisioned categories and units
        $catBRes = $this->asTenant($tokenB)
            ->getJson('/api/categories');
        $catBRes->assertStatus(200);
        $catBNames = collect($catBRes->json('data'))->pluck('name')->toArray();
        $this->assertContains('Makanan Utama', $catBNames);
        $this->assertContains('Minuman & Kopi', $catBNames);
        $categoryBId = $catBRes->json('data.0.id');

        $unitBRes = $this->asTenant($tokenB)
            ->getJson('/api/units');
        $unitBRes->assertStatus(200);
        $unitBNames = collect($unitBRes->json('data'))->pluck('name')->toArray();
        $this->assertContains('Porsi', $unitBNames);
        $this->assertContains('Cup', $unitBNames);

        // -------------------------------------------------------------
        // STEP 3: Barcode Collision Safety Across Stores
        // Store A and Store B both sell products with IDENTICAL barcode: '8991234567890'
        // -------------------------------------------------------------
        $barcodeShared = '8991234567890';

        $prodARes = $this->asTenant($tokenA)
            ->postJson('/api/products', [
                'name' => 'Indomie Goreng Original',
                'category_id' => $categoryAId,
                'sku_barcode' => $barcodeShared,
                'price' => 3500,
                'avg_cost' => 2800,
                'stock' => 50,
                'min_stock' => 10,
            ]);
        $prodARes->assertStatus(201);
        $prodAId = $prodARes->json('data.id');

        // Store B creates product with SAME barcode
        $prodBRes = $this->asTenant($tokenB)
            ->postJson('/api/products', [
                'name' => 'Espresso Single Shot',
                'category_id' => $categoryBId,
                'sku_barcode' => $barcodeShared,
                'price' => 15000,
                'avg_cost' => 6000,
                'stock' => 100,
                'min_stock' => 20,
            ]);
        $prodBRes->assertStatus(201);
        $prodBId = $prodBRes->json('data.id');

        $this->assertNotEquals($prodAId, $prodBId);

        // -------------------------------------------------------------
        // STEP 4: Strict Data Isolation (Zero Leakage Verification)
        // -------------------------------------------------------------
        // Store A gets product catalog: only sees its own Indomie
        $catalogARes = $this->asTenant($tokenA)
            ->getJson('/api/products');
        $catalogARes->assertStatus(200);
        $catalogAItems = collect($catalogARes->json('data.data') ?? $catalogARes->json('data'))->pluck('name')->toArray();
        $this->assertContains('Indomie Goreng Original', $catalogAItems);
        $this->assertNotContains('Espresso Single Shot', $catalogAItems);

        // Store B gets product catalog: only sees its own Espresso
        $catalogBRes = $this->asTenant($tokenB)
            ->getJson('/api/products');
        $catalogBRes->assertStatus(200);
        $catalogBItems = collect($catalogBRes->json('data.data') ?? $catalogBRes->json('data'))->pluck('name')->toArray();
        $this->assertContains('Espresso Single Shot', $catalogBItems);
        $this->assertNotContains('Indomie Goreng Original', $catalogBItems);

        // Store A creates a customer
        $custARes = $this->asTenant($tokenA)
            ->postJson('/api/customers', [
                'name' => 'Pelanggan Setia Alpha',
                'phone' => '08111222333',
            ]);
        $custARes->assertStatus(201);

        // Store B queries customers: MUST see 0 customers!
        $custBRes = $this->asTenant($tokenB)
            ->getJson('/api/customers');
        $custBRes->assertStatus(200);
        $this->assertCount(0, $custBRes->json('data.data') ?? $custBRes->json('data'));

        // -------------------------------------------------------------
        // STEP 5: Store A Executes POS Checkout Successfully
        // -------------------------------------------------------------
        $checkoutARes = $this->asTenant($tokenA)
            ->postJson('/api/pos/checkout', [
                'payment_method' => 'CASH',
                'paid_amount' => 10000,
                'cash_received' => 10000,
                'items' => [
                    [
                        'product_id' => $prodAId,
                        'quantity' => 2,
                    ],
                ],
            ]);
        $checkoutARes->assertStatus(201);
        $this->assertEquals(7000, $checkoutARes->json('data.total_amount'));

        // Store B checks transactions: MUST NOT see Store A's transaction!
        $txBRes = $this->asTenant($tokenB)
            ->getJson('/api/pos/transactions');
        $txBRes->assertStatus(200);
        $this->assertCount(0, $txBRes->json('data.data') ?? $txBRes->json('data'));

        // -------------------------------------------------------------
        // STEP 6: Store B Trial Expiration & POS Lockout Guard
        // -------------------------------------------------------------
        $storeB->update([
            'subscription_status' => 'expired',
            'trial_ends_at' => now()->subDay(),
        ]);

        // Attempting checkout on expired store B MUST return 403 STORE_SUBSCRIPTION_EXPIRED
        $checkoutBBlockedRes = $this->asTenant($tokenB)
            ->postJson('/api/pos/checkout', [
                'payment_method' => 'CASH',
                'paid_amount' => 15000,
                'cash_received' => 50000,
                'items' => [
                    [
                        'product_id' => $prodBId,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $checkoutBBlockedRes->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'STORE_SUBSCRIPTION_EXPIRED',
            ]);

        // Read access remains available
        $readTxBRes = $this->asTenant($tokenB)
            ->getJson('/api/pos/transactions');
        $readTxBRes->assertStatus(200);

        // -------------------------------------------------------------
        // STEP 7: License Key Activation Unlocks Store B
        // -------------------------------------------------------------
        /** @var LicenseService $licenseService */
        $licenseService = app(LicenseService::class);
        $newKey = $licenseService->createKey('1_year', 365, 'Voucher 1 Tahun untuk Store B');

        $activateRes = $this->asTenant($tokenB)
            ->postJson('/api/store/activate-license', [
                'license_key' => $newKey->license_key,
            ]);

        $activateRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store' => [
                        'subscription_status' => 'active',
                        'is_active' => true,
                    ],
                ],
            ]);

        $storeB->refresh();
        $this->assertEquals('active', $storeB->subscription_status);
        $this->assertTrue($storeB->isActive());

        // Store B can now execute POS checkout!
        $checkoutBSuccessRes = $this->asTenant($tokenB)
            ->postJson('/api/pos/checkout', [
                'payment_method' => 'CASH',
                'paid_amount' => 15000,
                'cash_received' => 20000,
                'items' => [
                    [
                        'product_id' => $prodBId,
                        'quantity' => 1,
                    ],
                ],
            ]);
        $checkoutBSuccessRes->assertStatus(201);
        $this->assertEquals(15000, $checkoutBSuccessRes->json('data.total_amount'));

        // -------------------------------------------------------------
        // STEP 8: Superadmin Direct Field Activation (Door-to-door Cash)
        // -------------------------------------------------------------
        $superAdmin = User::factory()->create([
            'email' => 'owner@kasirkita.com',
            'role' => 'owner',
            'store_id' => $storeAId,
        ]);

        // Create expired Store C
        $storeC = Store::create([
            'name' => 'Bengkel Mobil Gamma',
            'slug' => 'bengkel-mobil-gamma',
            'business_type' => 'service',
            'subscription_status' => 'expired',
        ]);

        $superAdminActRes = $this->actingAs($superAdmin)
            ->postJson("/api/superadmin/stores/{$storeC->id}/activate", [
                'duration_type' => 'lifetime',
                'notes' => 'Aktivasi jemput bola lunas tunai Rp 1.500.000',
            ]);

        $superAdminActRes->assertStatus(200);
        $storeC->refresh();
        $this->assertEquals('active', $storeC->subscription_status);
        $this->assertNull($storeC->subscription_expires_at); // Lifetime
        $this->assertTrue($storeC->isActive());
    }
}
