<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\TaxAndFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxAndFeeTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Owner Test',
            'email' => 'ownertest@test.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashiertest@test.com',
            'password' => \Illuminate\Support\Facades\Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_cashier_can_list_taxes_and_fees(): void
    {
        TaxAndFee::create([
            'name' => 'PPN 11%',
            'type' => 'PERCENTAGE',
            'value' => 11.00,
            'apply_to' => 'ALL',
            'is_tax' => true,
            'is_default' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/taxes-and-fees');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');
    }

    public function test_cashier_cannot_create_tax_or_fee(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/taxes-and-fees', [
                'name' => 'Service 5%',
                'type' => 'PERCENTAGE',
                'value' => 5,
                'apply_to' => 'ALL',
                'is_tax' => false,
            ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_create_tax_and_fee(): void
    {
        $response = $this->actingAs($this->owner, 'sanctum')
            ->postJson('/api/taxes-and-fees', [
                'name' => 'Kantong Plastik',
                'type' => 'FIXED',
                'value' => 200,
                'apply_to' => 'MANUAL',
                'is_tax' => false,
                'is_default' => false,
                'is_active' => true,
                'description' => 'Biaya kresek',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Kantong Plastik')
            ->assertJsonPath('data.value', '200.0000');

        $this->assertDatabaseHas('taxes_and_fees', [
            'name' => 'Kantong Plastik',
            'type' => 'FIXED',
        ]);
    }

    public function test_owner_can_update_tax_and_fee(): void
    {
        $item = TaxAndFee::create([
            'name' => 'PPN 10%',
            'type' => 'PERCENTAGE',
            'value' => 10.00,
            'apply_to' => 'ALL',
            'is_tax' => true,
            'is_default' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson("/api/taxes-and-fees/{$item->id}", [
                'name' => 'PPN 11%',
                'value' => 11.00,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'PPN 11%');

        $this->assertDatabaseHas('taxes_and_fees', [
            'id' => $item->id,
            'name' => 'PPN 11%',
        ]);
    }

    public function test_owner_can_toggle_status_tax_and_fee(): void
    {
        $item = TaxAndFee::create([
            'name' => 'Admin QRIS',
            'type' => 'PERCENTAGE',
            'value' => 0.70,
            'apply_to' => 'SPECIFIC_PAYMENT',
            'payment_method' => 'QRIS',
            'is_tax' => false,
            'is_default' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->patchJson("/api/taxes-and-fees/{$item->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('data.is_active', false);

        $this->assertFalse($item->fresh()->is_active);
    }

    public function test_owner_can_soft_delete_tax_and_fee(): void
    {
        $item = TaxAndFee::create([
            'name' => 'Biaya Dus Bekas',
            'type' => 'FIXED',
            'value' => 1000,
            'apply_to' => 'MANUAL',
            'is_tax' => false,
            'is_default' => false,
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->owner, 'sanctum')
            ->deleteJson("/api/taxes-and-fees/{$item->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('taxes_and_fees', [
            'id' => $item->id,
        ]);
    }

    public function test_pos_checkout_stores_tax_and_fee_accurately(): void
    {
        $product = Product::create([
            'name' => 'Kopi Robusta',
            'price' => 20000,
            'stock' => 100,
            'min_stock' => 5,
            'avg_cost' => 10000,
        ]);

        $payload = [
            'paid_amount' => 50000,
            'payment_method' => 'QRIS',
            'tax_amount' => 2200, // e.g. PPN 11% dari Rp20.000
            'fee_amount' => 340,  // e.g. Kantong Rp200 + QRIS Rp140
            'fee_details' => [
                ['name' => 'Kantong Plastik', 'amount' => 200],
                ['name' => 'Admin QRIS', 'amount' => 140],
            ],
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/pos/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.subtotal', '20000.00')
            ->assertJsonPath('data.tax_amount', '2200.00')
            ->assertJsonPath('data.fee_amount', '340.00')
            ->assertJsonPath('data.total_amount', '22540.00'); // 20000 + 2200 + 340

        $this->assertDatabaseHas('transactions', [
            'subtotal' => 20000.00,
            'tax_amount' => 2200.00,
            'fee_amount' => 340.00,
            'total_amount' => 22540.00,
        ]);
    }
}
