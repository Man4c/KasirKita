<?php

namespace Tests\Feature;

use App\Models\CashFlow;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class FinanceApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Owner Toko',
            'email' => 'owner@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->token = $this->owner->createToken('finance-token')->plainTextToken;
    }

    public function test_dashboard_summary_calculates_revenue_cogs_and_profit_accurately(): void
    {
        $product = Product::create([
            'name' => 'Kopi Robusta',
            'price' => 20000,
            'avg_cost' => 12000, // HPP per unit = Rp12,000
            'stock' => 50,
            'min_stock' => 5,
        ]);

        // Create completed transaction: 2 items @ Rp20,000 = Rp40,000 revenue
        // Total HPP (COGS) = 2 * Rp12,000 = Rp24,000
        // Expected Gross Profit = Rp40,000 - Rp24,000 = Rp16,000
        $transaction = Transaction::create([
            'invoice_number' => 'INV-TEST-001',
            'user_id' => $this->owner->id,
            'subtotal' => 40000,
            'total_amount' => 40000,
            'paid_amount' => 40000,
            'payment_method' => 'CASH',
            'payment_status' => 'COMPLETED',
        ]);

        TransactionItem::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 2,
            'unit_price' => 20000,
            'unit_cost' => 12000,
            'subtotal' => 40000,
            'total_cost' => 24000,
        ]);

        // Cash Flow from Sales (Inflow)
        CashFlow::create([
            'user_id' => $this->owner->id,
            'transaction_id' => $transaction->id,
            'type' => 'IN',
            'category' => 'SALES',
            'amount' => 40000,
            'flow_date' => now()->toDateString(),
        ]);

        // Operational Expense (Outflow): Listrik Rp5,000
        CashFlow::create([
            'user_id' => $this->owner->id,
            'type' => 'OUT',
            'category' => 'OPERATIONAL',
            'amount' => 5000,
            'flow_date' => now()->toDateString(),
            'notes' => 'Token Listrik',
        ]);

        // Expected Net Profit = Rp16,000 - Rp5,000 = Rp11,000

        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->getJson('/api/finance/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'sales' => [
                        'total_revenue' => 40000,
                        'total_transactions' => 1,
                        'total_items_sold' => 2,
                    ],
                    'profitability' => [
                        'total_cogs' => 24000,
                        'gross_profit' => 16000,
                        'operational_expenses' => 5000,
                        'net_profit' => 11000,
                    ],
                    'cash_flow' => [
                        'total_inflow' => 40000,
                        'total_outflow' => 5000,
                        'net_cash' => 35000,
                    ],
                ],
            ]);
    }

    public function test_can_record_manual_operational_expense(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->postJson('/api/finance/cash-flows', [
                'type' => 'OUT',
                'category' => 'OPERATIONAL',
                'amount' => 150000,
                'flow_date' => now()->toDateString(),
                'notes' => 'Biaya kebersihan dan air bulanan',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'OUT',
                    'category' => 'OPERATIONAL',
                    'amount' => '150000.00',
                ],
            ]);
    }

    public function test_can_export_transactions_csv(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer '.$this->token)
            ->get('/api/finance/export?type=transactions');

        $response->assertStatus(200);
        $this->assertTrue(str_contains($response->headers->get('Content-Disposition'), 'attachment; filename='));
    }
}
