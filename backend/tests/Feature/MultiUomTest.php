<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductUnitConversion;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiUomTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;
    protected Unit $pcsUnit;
    protected Unit $dusUnit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'name' => 'Owner Test',
            'email' => 'owner_uom@kasirkita.com',
            'role' => 'owner',
        ]);

        $this->cashier = User::factory()->create([
            'name' => 'Kasir Test',
            'email' => 'cashier_uom@kasirkita.com',
            'role' => 'cashier',
        ]);

        $this->pcsUnit = Unit::where('symbol', 'pcs')->first() ?? Unit::create(['name' => 'Pieces', 'symbol' => 'pcs']);
        $this->dusUnit = Unit::where('symbol', 'dus')->first() ?? Unit::create(['name' => 'Dus', 'symbol' => 'dus']);
    }

    public function test_owner_can_crud_units(): void
    {
        // 1. Create Unit
        $createRes = $this->actingAs($this->owner)->postJson('/api/units', [
            'name' => 'Karton Besar',
            'symbol' => 'ktn',
            'description' => 'Karton isi banyak',
        ]);
        $createRes->assertStatus(201)
            ->assertJsonPath('data.symbol', 'ktn');

        $unitId = $createRes->json('data.id');

        // 2. List Units
        $listRes = $this->actingAs($this->cashier)->getJson('/api/units');
        $listRes->assertStatus(200)
            ->assertJsonPath('success', true);

        // 3. Update Unit
        $updateRes = $this->actingAs($this->owner)->putJson("/api/units/{$unitId}", [
            'name' => 'Karton Jumbo',
        ]);
        $updateRes->assertStatus(200)
            ->assertJsonPath('data.name', 'Karton Jumbo');

        // 4. Delete Unit
        $delRes = $this->actingAs($this->owner)->deleteJson("/api/units/{$unitId}");
        $delRes->assertStatus(200);
    }

    public function test_multi_uom_restock_and_pos_checkout_flow(): void
    {
        // 1. Create Product with Base Unit (Pcs @ Rp15.000) and Conversion (Dus @ Rp160.000, factor = 12)
        $prodRes = $this->actingAs($this->owner)->postJson('/api/products', [
            'name' => 'Kopi Botol Aren',
            'sku_barcode' => 'KOP-BASE-01',
            'base_unit_id' => $this->pcsUnit->id,
            'price' => 15000,
            'stock' => 0,
            'avg_cost' => 0,
            'conversions' => [
                [
                    'unit_id' => $this->dusUnit->id,
                    'conversion_factor' => 12,
                    'sku_barcode' => 'KOP-DUS-01',
                    'price' => 160000,
                ],
            ],
        ]);
        $prodRes->assertStatus(201);
        $productId = $prodRes->json('data.id');

        // 2. Restock in Dus: Buy 2 Dus @ Rp120.000/Dus -> Total cost = Rp240.000, Base Qty = 24 Pcs, Avg Cost = Rp10.000/Pcs
        $restockRes = $this->actingAs($this->owner)->postJson("/api/products/{$productId}/restock", [
            'quantity' => 2,
            'unit_cost' => 120000,
            'unit_id' => $this->dusUnit->id,
            'notes' => 'Kulakan 2 Dus Kopi',
        ]);
        $restockRes->assertStatus(200);
        $this->assertEquals(24, (float) $restockRes->json('data.stock'));
        $this->assertEquals(10000, (float) $restockRes->json('data.avg_cost'));

        // 3. POS Checkout: Cashier sells 1 Dus (@ Rp160.000) -> should deduct 12 Pcs, remaining stock = 12 Pcs
        $checkoutRes = $this->actingAs($this->cashier)->postJson('/api/pos/checkout', [
            'customer_name' => 'Toko Mitra',
            'paid_amount' => 200000,
            'payment_method' => 'CASH',
            'items' => [
                [
                    'product_id' => $productId,
                    'quantity' => 1,
                    'unit_id' => $this->dusUnit->id,
                ],
            ],
        ]);
        $checkoutRes->assertStatus(201);
        $this->assertEquals(160000, (float) $checkoutRes->json('data.total_amount'));
        $this->assertEquals(40000, (float) $checkoutRes->json('data.change_amount'));
        $this->assertEquals('Dus / Karton', $checkoutRes->json('data.items.0.unit_name'));
        $this->assertEquals(12, (float) $checkoutRes->json('data.items.0.conversion_factor'));
        $this->assertEquals(12, (float) $checkoutRes->json('data.items.0.base_quantity'));

        // 4. Verify physical stock left
        $product = Product::find($productId);
        $this->assertEquals(12, (float) $product->stock);
    }
}
