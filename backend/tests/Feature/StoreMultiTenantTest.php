<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StoreMultiTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_store_creation_and_relationships(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $store = Store::create([
            'name' => 'Toko Berkah Jaya',
            'business_type' => 'retail',
            'owner_id' => $owner->id,
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $this->assertNotNull($store->id);
        $this->assertEquals('Toko Berkah Jaya', $store->name);
        $this->assertTrue($store->isTrial());
        $this->assertTrue($store->isActive());
        $this->assertFalse($store->isExpired());

        // Test owner relation
        $this->assertEquals($owner->id, $store->owner->id);

        // Test store settings relation
        $setting = StoreSetting::create([
            'store_id' => $store->id,
            'name' => 'Toko Berkah Jaya POS',
        ]);
        $this->assertEquals($setting->id, $store->setting->id);
    }

    public function test_subscription_expiration_logic(): void
    {
        // Expired trial
        $expiredStore = Store::create([
            'name' => 'Toko Expired',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDay(),
        ]);
        $this->assertFalse($expiredStore->isActive());
        $this->assertTrue($expiredStore->isExpired());

        // Active paid store
        $activeStore = Store::create([
            'name' => 'Toko Langganan',
            'subscription_status' => 'active',
            'trial_ends_at' => null,
            'activated_at' => now(),
        ]);
        $this->assertTrue($activeStore->isActive());
        $this->assertFalse($activeStore->isTrial());
        $this->assertFalse($activeStore->isExpired());
    }

    public function test_multi_tenant_barcode_isolation_between_stores(): void
    {
        $storeA = Store::create(['name' => 'Store Alfa', 'business_type' => 'retail']);
        $storeB = Store::create(['name' => 'Store Beta', 'business_type' => 'retail']);

        $baseUnit = Unit::firstOrCreate(['symbol' => 'pcs'], ['name' => 'Pcs']);

        // Store A creates product with barcode 899123456789
        $productA = Product::create([
            'store_id' => $storeA->id,
            'name' => 'Sabun Mandi Alfa',
            'sku_barcode' => '899123456789',
            'price' => 5000,
            'cost_price' => 3500,
            'stock' => 10,
            'base_unit_id' => $baseUnit->id,
        ]);

        // Store B can create another product with the EXACT SAME barcode without unique collision
        $productB = Product::create([
            'store_id' => $storeB->id,
            'name' => 'Sabun Mandi Beta',
            'sku_barcode' => '899123456789',
            'price' => 5500,
            'cost_price' => 4000,
            'stock' => 20,
            'base_unit_id' => $baseUnit->id,
        ]);

        $this->assertNotNull($productA->id);
        $this->assertNotNull($productB->id);
        $this->assertNotEquals($productA->id, $productB->id);
        $this->assertEquals($productA->sku_barcode, $productB->sku_barcode);
        $this->assertEquals($storeA->id, $productA->store_id);
        $this->assertEquals($storeB->id, $productB->store_id);
    }
}
