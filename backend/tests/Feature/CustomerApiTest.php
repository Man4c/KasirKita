<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;
    protected Unit $baseUnit;
    protected Category $category;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'name' => 'Toko Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
        ]);

        $this->cashier = User::factory()->create([
            'name' => 'Kasir Toko',
            'email' => 'cashier@test.com',
            'role' => 'cashier',
        ]);

        $this->baseUnit = Unit::firstOrCreate(
            ['symbol' => 'pcs'],
            ['name' => 'Pieces']
        );

        $this->category = Category::create([
            'name' => 'Minuman Segar',
            'slug' => 'minuman-segar',
        ]);

        $this->product = Product::create([
            'name' => 'Kopi Latte 250ml',
            'sku_barcode' => 'LATTE-001',
            'category_id' => $this->category->id,
            'base_unit_id' => $this->baseUnit->id,
            'price' => 15000,
            'avg_cost' => 10000,
            'stock' => 50,
            'min_stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_can_list_customers_with_search(): void
    {
        Customer::create([
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'membership_type' => 'VIP',
        ]);

        Customer::create([
            'name' => 'Siti Rahma',
            'phone' => '08987654321',
            'membership_type' => 'REGULAR',
        ]);

        // List all
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/customers');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.data');

        // Search by phone
        $searchResponse = $this->actingAs($this->cashier)
            ->getJson('/api/customers?search=08123456789');

        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Budi Santoso');
    }

    public function test_can_create_customer(): void
    {
        $payload = [
            'name' => 'Ahmad Dahlan',
            'phone' => '08551234567',
            'email' => 'ahmad@example.com',
            'address' => 'Jl. Merdeka No. 10',
            'membership_type' => 'VIP',
            'notes' => 'Pelanggan setia kantor sebelah',
        ];

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/customers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Ahmad Dahlan')
            ->assertJsonPath('data.membership_type', 'VIP');

        $this->assertDatabaseHas('customers', [
            'name' => 'Ahmad Dahlan',
            'phone' => '08551234567',
        ]);
    }

    public function test_customer_phone_must_be_unique(): void
    {
        Customer::create([
            'name' => 'Pelanggan Pertama',
            'phone' => '08111111111',
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/customers', [
                'name' => 'Pelanggan Kedua',
                'phone' => '08111111111',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);
    }

    public function test_can_update_customer(): void
    {
        $customer = Customer::create([
            'name' => 'Joko Widodo',
            'phone' => '08222222222',
            'membership_type' => 'REGULAR',
        ]);

        $response = $this->actingAs($this->cashier)
            ->putJson("/api/customers/{$customer->id}", [
                'name' => 'Joko Widodo Updated',
                'phone' => '08222222222',
                'membership_type' => 'WHOLESALE',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Joko Widodo Updated')
            ->assertJsonPath('data.membership_type', 'WHOLESALE');
    }

    public function test_cashier_cannot_delete_customer(): void
    {
        $customer = Customer::create([
            'name' => 'Hapus Me',
            'phone' => '08333333333',
        ]);

        $response = $this->actingAs($this->cashier)
            ->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(403);
    }

    public function test_owner_can_soft_delete_customer(): void
    {
        $customer = Customer::create([
            'name' => 'Hapus Me Owner',
            'phone' => '08444444444',
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/customers/{$customer->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('customers', [
            'id' => $customer->id,
        ]);
    }

    public function test_pos_checkout_links_customer_and_aggregates_spending(): void
    {
        $customer = Customer::create([
            'name' => 'Rina Wijaya',
            'phone' => '08777777777',
            'membership_type' => 'VIP',
        ]);

        $checkoutData = [
            'customer_id' => $customer->id,
            'paid_amount' => 50000,
            'payment_method' => 'CASH',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/pos/checkout', $checkoutData);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.customer_id', $customer->id)
            ->assertJsonPath('data.customer_name', 'Rina Wijaya')
            ->assertJsonPath('data.customer_phone', '08777777777');

        // Customer detail now reflects total spent and transactions count
        $detailResponse = $this->actingAs($this->cashier)
            ->getJson("/api/customers/{$customer->id}");

        $detailResponse->assertStatus(200)
            ->assertJsonPath('data.transactions_count', 1)
            ->assertJsonPath('data.total_spent', 30000);
    }
}
