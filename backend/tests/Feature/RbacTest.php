<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RbacTest extends TestCase
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
            'name' => 'Owner RBAC',
            'email' => 'owner_rbac@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Kasir RBAC',
            'email' => 'kasir_rbac@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $this->ownerToken = $this->owner->createToken('owner-token')->plainTextToken;
        $this->cashierToken = $this->cashier->createToken('cashier-token')->plainTextToken;
    }

    public function test_owner_can_access_finance_dashboard(): void
    {
        // Owner should be able to access finance dashboard (owner-only route)
        $response = $this->withHeader('Authorization', 'Bearer '.$this->ownerToken)
            ->getJson('/api/finance/dashboard');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_cashier_is_blocked_from_finance_dashboard_with_forbidden_status(): void
    {
        // Cashier should NOT be able to access finance dashboard (owner-only route)
        $response = $this->withHeader('Authorization', 'Bearer '.$this->cashierToken)
            ->getJson('/api/finance/dashboard');

        $response->assertStatus(403);
    }

    public function test_cashier_is_blocked_from_restock_product_endpoint(): void
    {
        // First, owner creates a product
        $product = Product::create([
            'name' => 'Produk RBAC Test',
            'price' => 10000,
            'avg_cost' => 5000,
            'stock' => 10,
            'min_stock' => 2,
        ]);

        // Cashier should NOT be able to restock (owner-only route)
        $response = $this->withHeader('Authorization', 'Bearer '.$this->cashierToken)
            ->postJson("/api/products/{$product->id}/restock", [
                'quantity' => 5,
                'unit_cost' => 6000,
                'notes' => 'Restock attempt by cashier',
            ]);

        $response->assertStatus(403);

        // Verify stock was NOT changed
        $this->assertEquals(10, (float) $product->fresh()->stock);
    }

    public function test_cashier_can_perform_pos_checkout(): void
    {
        // Cashier SHOULD be able to perform POS checkout (not owner-only)
        $product = Product::create([
            'name' => 'Produk POS RBAC',
            'price' => 8000,
            'avg_cost' => 4000,
            'stock' => 15,
            'min_stock' => 3,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->cashierToken)
            ->postJson('/api/pos/checkout', [
                'customer_name' => 'Pelanggan RBAC',
                'paid_amount' => 16000,
                'payment_method' => 'CASH',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJson(['success' => true]);

        // Verify stock was deducted
        $this->assertEquals(13, (float) $product->fresh()->stock);
    }
}
