<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Store;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MultiTenantScopeAndGuardTest extends TestCase
{
    use RefreshDatabase;

    private Store $storeA;
    private Store $storeB;
    private User $ownerA;
    private User $ownerB;
    private Unit $sharedUnit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storeA = Store::create([
            'name' => 'Toko Sembako Makmur',
            'business_type' => 'retail',
            'subscription_status' => 'active',
            'activated_at' => now(),
        ]);

        $this->storeB = Store::create([
            'name' => 'Kedai Kopi Senja',
            'business_type' => 'fnb',
            'subscription_status' => 'active',
            'activated_at' => now(),
        ]);

        $this->ownerA = User::create([
            'name' => 'Pak Makmur',
            'email' => 'makmur@toko.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'store_id' => $this->storeA->id,
            'is_active' => true,
        ]);

        $this->ownerB = User::create([
            'name' => 'Mas Senja',
            'email' => 'senja@kedai.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'store_id' => $this->storeB->id,
            'is_active' => true,
        ]);

        $this->sharedUnit = Unit::firstOrCreate(
            ['symbol' => 'pcs'],
            ['name' => 'Pieces / Buah', 'store_id' => null]
        );
    }

    public function test_product_query_is_isolated_between_stores(): void
    {
        // Store A products
        Product::create([
            'store_id' => $this->storeA->id,
            'name' => 'Beras Pandan Wangi 5kg',
            'sku_barcode' => 'BERAS-01',
            'price' => 75000,
            'cost_price' => 65000,
            'stock' => 20,
            'base_unit_id' => $this->sharedUnit->id,
        ]);

        // Store B products
        Product::create([
            'store_id' => $this->storeB->id,
            'name' => 'Espresso Beans 250g',
            'sku_barcode' => 'KOPI-01',
            'price' => 50000,
            'cost_price' => 35000,
            'stock' => 15,
            'base_unit_id' => $this->sharedUnit->id,
        ]);

        // Owner A queries products
        $responseA = $this->actingAs($this->ownerA, 'sanctum')
            ->getJson('/api/products');

        $responseA->assertStatus(200);
        $productsA = collect($responseA->json('data.data') ?? $responseA->json('data'));
        $this->assertTrue($productsA->contains('name', 'Beras Pandan Wangi 5kg'));
        $this->assertFalse($productsA->contains('name', 'Espresso Beans 250g'));

        // Owner B queries products
        $responseB = $this->actingAs($this->ownerB, 'sanctum')
            ->getJson('/api/products');

        $responseB->assertStatus(200);
        $productsB = collect($responseB->json('data.data') ?? $responseB->json('data'));
        $this->assertTrue($productsB->contains('name', 'Espresso Beans 250g'));
        $this->assertFalse($productsB->contains('name', 'Beras Pandan Wangi 5kg'));
    }

    public function test_creating_product_automatically_assigns_store_id_of_authenticated_user(): void
    {
        $response = $this->actingAs($this->ownerA, 'sanctum')
            ->postJson('/api/products', [
                'name' => 'Minyak Goreng 2L',
                'sku_barcode' => 'MINYAK-01',
                'price' => 32000,
                'cost_price' => 28000,
                'stock' => 10,
                'base_unit_id' => $this->sharedUnit->id,
            ]);

        $response->assertStatus(201);
        $productId = $response->json('data.id');

        $product = Product::withoutStoreScope()->find($productId);
        $this->assertNotNull($product);
        $this->assertEquals($this->storeA->id, $product->store_id);
    }

    public function test_customer_data_is_isolated_between_stores(): void
    {
        Customer::create([
            'store_id' => $this->storeA->id,
            'name' => 'Pelanggan Toko A',
            'phone' => '081111111111',
        ]);

        Customer::create([
            'store_id' => $this->storeB->id,
            'name' => 'Pelanggan Kedai B',
            'phone' => '082222222222',
        ]);

        $responseA = $this->actingAs($this->ownerA, 'sanctum')
            ->getJson('/api/customers');

        $responseA->assertStatus(200);
        $customersA = collect($responseA->json('data.data') ?? $responseA->json('data'));
        $this->assertTrue($customersA->contains('name', 'Pelanggan Toko A'));
        $this->assertFalse($customersA->contains('name', 'Pelanggan Kedai B'));
    }

    public function test_shared_units_visible_to_all_while_custom_unit_is_isolated(): void
    {
        // Custom unit for Store A only
        Unit::create([
            'store_id' => $this->storeA->id,
            'name' => 'Karung Jumbo 50kg',
            'symbol' => 'krg50',
        ]);

        // Custom unit for Store B only
        Unit::create([
            'store_id' => $this->storeB->id,
            'name' => 'Shot Espresso',
            'symbol' => 'shot',
        ]);

        $responseA = $this->actingAs($this->ownerA, 'sanctum')
            ->getJson('/api/units');

        $responseA->assertStatus(200);
        $unitsA = collect($responseA->json('data'));
        // Store A can see shared unit 'pcs' and its own 'krg50', but NOT 'shot'
        $this->assertTrue($unitsA->contains('symbol', 'pcs'));
        $this->assertTrue($unitsA->contains('symbol', 'krg50'));
        $this->assertFalse($unitsA->contains('symbol', 'shot'));
    }

    public function test_subscription_guard_blocks_checkout_on_expired_store(): void
    {
        $expiredStore = Store::create([
            'name' => 'Toko Sudah Habis Masa Trial',
            'business_type' => 'retail',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->subDays(2), // Expired 2 days ago
        ]);

        $cashierExpired = User::create([
            'name' => 'Kasir Toko Expired',
            'email' => 'kasir@expired.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'store_id' => $expiredStore->id,
            'is_active' => true,
        ]);

        $product = Product::create([
            'store_id' => $expiredStore->id,
            'name' => 'Gula Pasir 1kg',
            'price' => 15000,
            'stock' => 10,
            'base_unit_id' => $this->sharedUnit->id,
        ]);

        // 1. Read operations (e.g. view transactions, view products) MUST still be accessible
        $readResponse = $this->actingAs($cashierExpired, 'sanctum')
            ->getJson('/api/products');
        $readResponse->assertStatus(200);

        // 2. Transaction checkout MUST be blocked with 403 STORE_SUBSCRIPTION_EXPIRED
        $checkoutResponse = $this->actingAs($cashierExpired, 'sanctum')
            ->postJson('/api/pos/checkout', [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 1,
                        'unit_price' => 15000,
                    ],
                ],
                'paid_amount' => 20000,
                'payment_method' => 'CASH',
            ]);

        $checkoutResponse->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'STORE_SUBSCRIPTION_EXPIRED',
            ]);
    }

    public function test_subscription_guard_allows_checkout_on_active_and_valid_trial_stores(): void
    {
        // Store A is active
        $productA = Product::create([
            'store_id' => $this->storeA->id,
            'name' => 'Kecap Manis 600ml',
            'price' => 22000,
            'stock' => 10,
            'base_unit_id' => $this->sharedUnit->id,
        ]);

        $checkoutResponse = $this->actingAs($this->ownerA, 'sanctum')
            ->postJson('/api/pos/checkout', [
                'items' => [
                    [
                        'product_id' => $productA->id,
                        'quantity' => 1,
                        'unit_price' => 22000,
                    ],
                ],
                'paid_amount' => 30000,
                'payment_method' => 'CASH',
            ]);

        $checkoutResponse->assertStatus(201)
            ->assertJson(['success' => true]);

        // Trial store with active 14 days remaining
        $trialStore = Store::create([
            'name' => 'Toko Masa Trial Aktif',
            'business_type' => 'retail',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(10),
        ]);

        $trialOwner = User::create([
            'name' => 'Owner Trial',
            'email' => 'trial@toko.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'store_id' => $trialStore->id,
            'is_active' => true,
        ]);

        $productTrial = Product::create([
            'store_id' => $trialStore->id,
            'name' => 'Susu Kental Manis',
            'price' => 12000,
            'stock' => 5,
            'base_unit_id' => $this->sharedUnit->id,
        ]);

        $trialCheckoutResponse = $this->actingAs($trialOwner, 'sanctum')
            ->postJson('/api/pos/checkout', [
                'items' => [
                    [
                        'product_id' => $productTrial->id,
                        'quantity' => 1,
                        'unit_price' => 12000,
                    ],
                ],
                'paid_amount' => 15000,
                'payment_method' => 'CASH',
            ]);

        $trialCheckoutResponse->assertStatus(201)
            ->assertJson(['success' => true]);
    }
}
