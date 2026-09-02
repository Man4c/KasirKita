<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OfflineSyncTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::create([
            'name' => 'Kasir Offline Test',
            'email' => 'cashier_offline@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $category = Category::firstOrCreate([
            'slug' => 'minuman',
        ], [
            'name' => 'Minuman',
        ]);

        $unit = Unit::firstOrCreate([
            'symbol' => 'btl',
        ], [
            'name' => 'Botol',
            'is_default' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Teh Botol Sosro',
            'sku_barcode' => '8992345678901',
            'price' => 5000,
            'cost_price' => 3500,
            'stock' => 50,
            'unit' => 'btl',
            'base_unit_id' => $unit->id,
            'is_active' => true,
        ]);
    }

    public function test_can_checkout_with_offline_id_and_created_at(): void
    {
        $payload = [
            'offline_id' => 'OFF-20260902-TEST-0001',
            'created_at' => '2026-09-02 09:30:00',
            'payment_method' => 'CASH',
            'paid_amount' => 10000,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/pos/checkout', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.offline_id', 'OFF-20260902-TEST-0001')
            ->assertJsonPath('data.total_amount', '10000.00');

        $this->assertDatabaseHas('transactions', [
            'offline_id' => 'OFF-20260902-TEST-0001',
        ]);

        // Assert stock reduced by 2
        $this->product->refresh();
        $this->assertEquals(48, $this->product->stock);
    }

    public function test_idempotent_duplicate_offline_sync_does_not_double_deduct_stock(): void
    {
        $payload = [
            'offline_id' => 'OFF-20260902-TEST-0002',
            'created_at' => '2026-09-02 09:35:00',
            'payment_method' => 'CASH',
            'paid_amount' => 15000,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 3,
                ],
            ],
        ];

        // 1st Sync Attempt
        $res1 = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/pos/checkout', $payload);

        $res1->assertStatus(201);
        $txId = $res1->json('data.id');

        $this->product->refresh();
        $this->assertEquals(47, $this->product->stock);

        // 2nd Sync Attempt (Network retry)
        $res2 = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/pos/checkout', $payload);

        // Returns existing transaction successfully
        $res2->assertStatus(201)
            ->assertJsonPath('data.id', $txId);

        // Stock MUST remain 47 (NOT deducted again to 44)
        $this->product->refresh();
        $this->assertEquals(47, $this->product->stock);
    }
}
