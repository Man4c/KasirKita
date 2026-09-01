<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class PosApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::create([
            'name' => 'Kasir 1',
            'email' => 'kasir1@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $this->token = $this->cashier->createToken('pos-token')->plainTextToken;
    }

    public function test_pos_checkout_succeeds_and_deducts_stock_automatically(): void
    {
        // Setup 2 Products
        $product1 = Product::create([
            'name' => 'Kopi Susu Aren',
            'price' => 15000,
            'avg_cost' => 8000,
            'stock' => 20,
            'min_stock' => 5,
        ]);

        $product2 = Product::create([
            'name' => 'Roti Bakar Coklat',
            'price' => 20000,
            'avg_cost' => 11000,
            'stock' => 10,
            'min_stock' => 2,
        ]);

        // Checkout: 2x Kopi (Rp30,000) + 1x Roti (Rp20,000) = Subtotal Rp50,000
        // Discount Rp5,000, Tax Rp0 -> Total Rp45,000
        // Paid Rp50,000 -> Change Rp5,000
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/pos/checkout', [
                'customer_name' => 'Budi Santoso',
                'discount_amount' => 5000,
                'tax_amount' => 0,
                'paid_amount' => 50000,
                'payment_method' => 'CASH',
                'items' => [
                    [
                        'product_id' => $product1->id,
                        'quantity' => 2,
                    ],
                    [
                        'product_id' => $product2->id,
                        'quantity' => 1,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'customer_name' => 'Budi Santoso',
                    'subtotal' => '50000.00',
                    'discount_amount' => '5000.00',
                    'total_amount' => '45000.00',
                    'paid_amount' => '50000.00',
                    'change_amount' => '5000.00',
                    'payment_method' => 'CASH',
                    'payment_status' => 'COMPLETED',
                ],
            ]);

        $transactionId = $response->json('data.id');

        // Verify stock deducted
        $this->assertEquals(18, $product1->fresh()->stock); // 20 - 2 = 18
        $this->assertEquals(9, $product2->fresh()->stock);   // 10 - 1 = 9

        // Verify stock movements (SALE)
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product1->id,
            'type' => 'SALE',
            'quantity' => -2,
            'balance_after' => 18,
            'reference_id' => $transactionId,
        ]);

        // Verify Cash Inflow
        $this->assertDatabaseHas('cash_flows', [
            'transaction_id' => $transactionId,
            'type' => 'IN',
            'category' => 'SALES',
            'amount' => '45000.00',
        ]);
    }

    public function test_pos_checkout_fails_if_stock_is_insufficient(): void
    {
        $product = Product::create([
            'name' => 'Es Krim Spesial',
            'price' => 10000,
            'avg_cost' => 5000,
            'stock' => 2, // Only 2 in stock
            'min_stock' => 1,
        ]);

        // Try to buy 5 items
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/pos/checkout', [
                'paid_amount' => 50000,
                'payment_method' => 'CASH',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 5,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        // Verify stock remained unchanged
        $this->assertEquals(2, (float) $product->fresh()->stock);
    }

    public function test_pos_can_cancel_transaction_and_restore_stock(): void
    {
        $product = Product::create([
            'name' => 'Teh Manis',
            'price' => 5000,
            'avg_cost' => 2500,
            'stock' => 10,
            'min_stock' => 2,
        ]);

        // Checkout 3 items
        $checkoutResponse = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/pos/checkout', [
                'paid_amount' => 15000,
                'payment_method' => 'CASH',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 3,
                    ],
                ],
            ]);

        $checkoutResponse->assertStatus(201);
        $this->assertEquals(7, (float) $product->fresh()->stock);

        $transactionId = $checkoutResponse->json('data.id');

        // Cancel Transaction (Owner role needed)
        $owner = User::create([
            'name' => 'Owner Pos',
            'email' => 'owner_pos@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);
        $cancelResponse = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/pos/transactions/{$transactionId}/cancel", [
                'reason' => 'Customer changed mind',
            ]);

        $cancelResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'payment_status' => 'CANCELLED',
                ],
            ]);

        // Verify stock is restored to 10
        $this->assertEquals(10, (float) $product->fresh()->stock);
    }
}
