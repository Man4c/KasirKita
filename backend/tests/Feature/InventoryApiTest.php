<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class InventoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Owner Test',
            'email' => 'owner@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->token = $this->user->createToken('test-token')->plainTextToken;
    }

    public function test_can_create_and_list_categories(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/categories', [
                'name' => 'Kategori Minuman',
                'description' => 'Semua minuman dingin dan panas',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Kategori Minuman',
                    'slug' => 'kategori-minuman',
                ],
            ]);

        $listResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson('/api/categories');

        $listResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    '*' => ['id', 'name', 'slug', 'products_count'],
                ],
            ]);
    }

    public function test_can_create_product_with_initial_stock_movement(): void
    {
        $category = Category::create([
            'name' => 'Makanan',
            'slug' => 'makanan',
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/products', [
                'category_id' => $category->id,
                'name' => 'Kopi Arabika 200g',
                'sku_barcode' => '89999001',
                'price' => 50000,
                'avg_cost' => 30000,
                'stock' => 10,
                'min_stock' => 3,
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Kopi Arabika 200g',
                    'stock' => 10,
                    'avg_cost' => '30000.00',
                ],
            ]);

        $productId = $response->json('data.id');

        // Check stock movement is recorded
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productId,
            'type' => 'IN',
            'quantity' => 10,
            'balance_after' => 10,
        ]);
    }

    public function test_perpetual_restock_calculates_average_cost_correctly(): void
    {
        // Initial state: 10 units @ Rp10,000 (total = Rp100,000)
        $product = Product::create([
            'name' => 'Susu Kotak 1L',
            'price' => 20000,
            'avg_cost' => 10000,
            'stock' => 10,
            'min_stock' => 5,
        ]);

        // Restock: 10 units @ Rp12,000 (total = Rp120,000)
        // New Total Stock = 20 units
        // New Total Valuation = Rp220,000
        // Expected New Average Cost = Rp220,000 / 20 = Rp11,000
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson("/api/products/{$product->id}/restock", [
                'quantity' => 10,
                'unit_cost' => 12000,
                'notes' => 'Restock batch #2 dari supplier',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $product->id,
                    'stock' => 20,
                    'avg_cost' => '11000.00',
                ],
            ]);

        // Verify stock movement
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'IN',
            'quantity' => 10,
            'unit_cost' => '12000.00',
            'balance_after' => 20,
        ]);

        // Verify cash outflow recorded
        $this->assertDatabaseHas('cash_flows', [
            'type' => 'OUT',
            'category' => 'PURCHASE',
            'amount' => '120000.00',
        ]);
    }

    public function test_stock_opname_creates_audit_and_adjusts_inventory(): void
    {
        $product = Product::create([
            'name' => 'Snack Keripik Singkong',
            'price' => 10000,
            'avg_cost' => 6000,
            'stock' => 20, // System stock
            'min_stock' => 5,
        ]);

        // Physical count finds only 18 units (missing 2 units)
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/stock-opnames', [
                'notes' => 'Audit akhir bulan',
                'apply_immediately' => true,
                'items' => [
                    [
                        'product_id' => $product->id,
                        'physical_stock' => 18,
                        'reason' => '2 bungkus rusak/kadaluarsa',
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'COMPLETED',
                ],
            ]);

        // Verify product stock is updated to 18
        $this->assertEquals(18, $product->fresh()->stock);

        // Verify ADJUSTMENT stock movement created with difference of -2
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'ADJUSTMENT',
            'quantity' => -2,
            'balance_after' => 18,
        ]);
    }

    public function test_soft_delete_hides_product_but_preserves_transaction_history(): void
    {
        $product = Product::create([
            'name' => 'Produk Hapus Test',
            'price' => 25000,
            'avg_cost' => 12000,
            'stock' => 10,
            'min_stock' => 2,
        ]);

        // Create a transaction first so we can verify history is preserved
        $checkoutRes = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/pos/checkout', [
                'customer_name' => 'Pelanggan Hapus',
                'paid_amount' => 25000,
                'payment_method' => 'CASH',
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1],
                ],
            ]);
        $checkoutRes->assertStatus(201);
        $transactionId = $checkoutRes->json('data.id');

        // Now delete the product via API
        $deleteRes = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->deleteJson("/api/products/{$product->id}");

        $deleteRes->assertStatus(200)
            ->assertJson(['success' => true]);

        // Product should NOT appear in product listing anymore
        $listRes = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson('/api/products');
        $listRes->assertStatus(200);

        $productIds = collect($listRes->json('data.data'))->pluck('id')->toArray();
        $this->assertNotContains($product->id, $productIds);

        // Product should still exist in DB with deleted_at set (SoftDeletes)
        $this->assertSoftDeleted('products', ['id' => $product->id]);

        // Transaction history should still be intact with product_name snapshot
        $this->assertDatabaseHas('transaction_items', [
            'transaction_id' => $transactionId,
            'product_name' => 'Produk Hapus Test',
        ]);
    }
}
