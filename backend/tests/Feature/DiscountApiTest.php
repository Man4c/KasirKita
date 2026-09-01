<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Discount;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiscountApiTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $cashier;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $category = Category::firstOrCreate(
            ['slug' => 'makanan-ringan'],
            ['name' => 'Makanan Ringan']
        );

        $unit = Unit::firstOrCreate(
            ['symbol' => 'pcs'],
            ['name' => 'Pieces']
        );

        $this->product = Product::create([
            'category_id' => $category->id,
            'base_unit_id' => $unit->id,
            'name' => 'Keripik Tempe Renyah',
            'sku_barcode' => 'KRP-001',
            'price' => 50000,
            'avg_cost' => 30000,
            'stock' => 100,
            'min_stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_cashier_cannot_create_discount(): void
    {
        $response = $this->actingAs($this->cashier)
            ->postJson('/api/discounts', [
                'code' => 'PROMO10',
                'name' => 'Promo Diskon 10%',
                'type' => 'PERCENTAGE',
                'value' => 10,
            ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_create_and_list_discounts(): void
    {
        $response = $this->actingAs($this->owner)
            ->postJson('/api/discounts', [
                'code' => 'HEMAT10',
                'name' => 'Diskon Hemat 10%',
                'description' => 'Potongan 10% maksimal Rp20.000',
                'type' => 'PERCENTAGE',
                'value' => 10,
                'min_purchase_amount' => 50000,
                'max_discount_amount' => 20000,
                'quota' => 100,
                'is_active' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'HEMAT10')
            ->assertJsonPath('data.value', '10.00')
            ->assertJsonPath('data.type', 'PERCENTAGE');

        $this->assertDatabaseHas('discounts', [
            'code' => 'HEMAT10',
            'name' => 'Diskon Hemat 10%',
        ]);

        $listResponse = $this->actingAs($this->cashier)
            ->getJson('/api/discounts');

        $listResponse->assertStatus(200)
            ->assertJsonFragment(['code' => 'HEMAT10']);
    }

    public function test_discount_code_must_be_unique(): void
    {
        Discount::create([
            'code' => 'PROMO50',
            'name' => 'Promo 50%',
            'type' => 'PERCENTAGE',
            'value' => 50,
        ]);

        $response = $this->actingAs($this->owner)
            ->postJson('/api/discounts', [
                'code' => 'PROMO50',
                'name' => 'Promo Dobel',
                'type' => 'FIXED',
                'value' => 15000,
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['code']);
    }

    public function test_owner_can_update_and_toggle_discount(): void
    {
        $discount = Discount::create([
            'code' => 'DISC25',
            'name' => 'Diskon 25%',
            'type' => 'PERCENTAGE',
            'value' => 25,
            'is_active' => true,
        ]);

        $updateResponse = $this->actingAs($this->owner)
            ->putJson("/api/discounts/{$discount->id}", [
                'code' => 'DISC30',
                'name' => 'Diskon 30%',
                'type' => 'PERCENTAGE',
                'value' => 30,
                'is_active' => true,
            ]);

        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.code', 'DISC30')
            ->assertJsonPath('data.value', '30.00');

        $toggleResponse = $this->actingAs($this->owner)
            ->patchJson("/api/discounts/{$discount->id}/toggle-status");

        $toggleResponse->assertStatus(200)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_owner_can_soft_delete_discount(): void
    {
        $discount = Discount::create([
            'code' => 'HAPUSME',
            'name' => 'Promo Akan Dihapus',
            'type' => 'FIXED',
            'value' => 5000,
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/discounts/{$discount->id}");

        $response->assertStatus(200);
        $this->assertSoftDeleted('discounts', ['id' => $discount->id]);
    }

    public function test_check_voucher_success_calculation(): void
    {
        $discount = Discount::create([
            'code' => 'POTONGAN20',
            'name' => 'Potongan 20 Ribu',
            'type' => 'FIXED',
            'value' => 20000,
            'min_purchase_amount' => 50000,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/discounts/check-voucher', [
                'code' => 'potongan20', // Test case insensitivity
                'subtotal' => 100000,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.valid', true)
            ->assertJsonPath('data.discount_code', 'POTONGAN20')
            ->assertJsonPath('data.discount_amount', 20000)
            ->assertJsonPath('data.final_amount', 80000);
    }

    public function test_check_voucher_validation_failures(): void
    {
        // 1. Min purchase requirement not met
        $discountMin = Discount::create([
            'code' => 'MIN100K',
            'name' => 'Promo Min 100k',
            'type' => 'PERCENTAGE',
            'value' => 10,
            'min_purchase_amount' => 100000,
            'is_active' => true,
        ]);

        $responseMin = $this->actingAs($this->cashier)
            ->postJson('/api/discounts/check-voucher', [
                'code' => 'MIN100K',
                'subtotal' => 50000,
            ]);
        $responseMin->assertStatus(422);

        // 2. Expired voucher
        $discountExpired = Discount::create([
            'code' => 'KADALUARSA',
            'name' => 'Promo Kemarin',
            'type' => 'PERCENTAGE',
            'value' => 10,
            'end_date' => now()->subDay(),
            'is_active' => true,
        ]);

        $responseExpired = $this->actingAs($this->cashier)
            ->postJson('/api/discounts/check-voucher', [
                'code' => 'KADALUARSA',
                'subtotal' => 50000,
            ]);
        $responseExpired->assertStatus(422);

        // 3. Quota exceeded
        $discountQuota = Discount::create([
            'code' => 'QUOTAHABIS',
            'name' => 'Promo Terbatas',
            'type' => 'FIXED',
            'value' => 10000,
            'quota' => 5,
            'usage_count' => 5,
            'is_active' => true,
        ]);

        $responseQuota = $this->actingAs($this->cashier)
            ->postJson('/api/discounts/check-voucher', [
                'code' => 'QUOTAHABIS',
                'subtotal' => 50000,
            ]);
        $responseQuota->assertStatus(422);
    }

    public function test_pos_checkout_applies_discount_and_increments_usage(): void
    {
        $discount = Discount::create([
            'code' => 'DISKON10RB',
            'name' => 'Diskon 10 Ribu',
            'type' => 'FIXED',
            'value' => 10000,
            'min_purchase_amount' => 50000,
            'quota' => 10,
            'usage_count' => 0,
            'is_active' => true,
        ]);

        // Product price is 50,000. 2 items = subtotal 100,000.
        // Discount 10,000 => Total 90,000.
        $checkoutPayload = [
            'paid_amount' => 100000,
            'payment_method' => 'CASH',
            'discount_code' => 'DISKON10RB',
            'discount_id' => $discount->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/pos/checkout', $checkoutPayload);

        $response->assertStatus(201)
            ->assertJsonPath('data.subtotal', '100000.00')
            ->assertJsonPath('data.discount_amount', '10000.00')
            ->assertJsonPath('data.total_amount', '90000.00')
            ->assertJsonPath('data.change_amount', '10000.00')
            ->assertJsonPath('data.discount_code', 'DISKON10RB');

        $this->assertDatabaseHas('transactions', [
            'discount_id' => $discount->id,
            'discount_code' => 'DISKON10RB',
            'discount_amount' => 10000.00,
            'total_amount' => 90000.00,
        ]);

        $discount->refresh();
        $this->assertEquals(1, $discount->usage_count);
    }
}
