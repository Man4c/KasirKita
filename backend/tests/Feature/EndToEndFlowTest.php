<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EndToEndFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;
    protected string $ownerToken;
    protected string $cashierToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Budi Owner',
            'email' => 'owner@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Siti Kasir',
            'email' => 'kasir@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $this->ownerToken = $this->owner->createToken('owner-token')->plainTextToken;
        $this->cashierToken = $this->cashier->createToken('cashier-token')->plainTextToken;
    }

    public function test_complete_store_operational_lifecycle(): void
    {
        // 1. Owner creates a Category
        $catRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->postJson('/api/categories', [
                'name' => 'Kopi Spesialti',
                'description' => 'Biji kopi pilihan',
            ]);
        $catRes->assertStatus(201);
        $categoryId = $catRes->json('data.id');

        // 2. Owner creates a Product: 20 units @ Rp10,000 cost, selling for Rp18,000
        $prodRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->postJson('/api/products', [
                'name' => 'Kopi Arabika Gayo',
                'category_id' => $categoryId,
                'sku_barcode' => '899123456789',
                'price' => 18000,
                'avg_cost' => 10000,
                'stock' => 20,
                'min_stock' => 5,
            ]);
        $prodRes->assertStatus(201);
        $productId = $prodRes->json('data.id');

        // 3. Owner restocks 10 units at higher cost (Rp13,000)
        // Moving Average Cost calculation:
        // Current: 20 * 10,000 = 200,000
        // New: 10 * 13,000 = 130,000
        // Total = 330,000 / 30 = Rp11,000 new avg_cost
        $restockRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->postJson("/api/products/{$productId}/restock", [
                'quantity' => 10,
                'unit_cost' => 13000,
                'notes' => 'Restock Supplier Gayo',
            ]);
        $restockRes->assertStatus(200);

        $productAfterRestock = Product::find($productId);
        $this->assertEquals(30, $productAfterRestock->stock);
        $this->assertEquals(11000, (float) $productAfterRestock->avg_cost);

        // 4. Cashier sells 5 units to customer with Rp5,000 discount
        // Subtotal: 5 * 18,000 = Rp90,000
        // Total: 90,000 - 5,000 = Rp85,000
        // Paid: Rp100,000 Cash -> Change: Rp15,000
        // Total COGS: 5 * 11,000 = Rp55,000
        $checkoutRes = $this->withHeader('Authorization', 'Bearer '.$this->cashierToken)
            ->postJson('/api/pos/checkout', [
                'customer_name' => 'Pak Joko',
                'discount_amount' => 5000,
                'paid_amount' => 100000,
                'payment_method' => 'CASH',
                'items' => [
                    [
                        'product_id' => $productId,
                        'quantity' => 5,
                    ],
                ],
            ]);
        $checkoutRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subtotal' => '90000.00',
                    'discount_amount' => '5000.00',
                    'total_amount' => '85000.00',
                    'paid_amount' => '100000.00',
                    'change_amount' => '15000.00',
                    'payment_status' => 'COMPLETED',
                ],
            ]);

        $transactionId = $checkoutRes->json('data.id');

        // Verify stock decreased to 25
        $this->assertEquals(25, Product::find($productId)->stock);

        // 5. Owner records operational expense (Listrik Rp10,000)
        $expenseRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->postJson('/api/finance/cash-flows', [
                'type' => 'OUT',
                'category' => 'OPERATIONAL',
                'amount' => 10000,
                'notes' => 'Token Listrik Toko',
            ]);
        $expenseRes->assertStatus(201);

        // 6. Owner checks Financial Dashboard
        // Total Revenue = Rp85,000
        // Total COGS = Rp55,000
        // Gross Profit = Rp85,000 - Rp55,000 = Rp30,000
        // Operating Expense = Rp10,000
        // Net Profit = Rp30,000 - Rp10,000 = Rp20,000
        $dashRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->getJson('/api/finance/dashboard');

        $dashRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'sales' => [
                        'total_revenue' => 85000,
                        'total_transactions' => 1,
                        'total_items_sold' => 5,
                    ],
                    'profitability' => [
                        'total_cogs' => 55000,
                        'gross_profit' => 30000,
                        'operational_expenses' => 10000,
                        'net_profit' => 20000,
                    ],
                ],
            ]);

        // 7. Stock Opname Audit: physical count finds 24 units (1 unit missing)
        $opnameRes = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->postJson('/api/stock-opnames', [
                'notes' => 'Audit Akhir Pekan',
                'apply_immediately' => true,
                'items' => [
                    [
                        'product_id' => $productId,
                        'physical_stock' => 24,
                        'reason' => '1 unit rusak/tumpah',
                    ],
                ],
            ]);
        $opnameRes->assertStatus(201);

        // Verify stock adjusted to 24
        $this->assertEquals(24, Product::find($productId)->stock);
    }
}
