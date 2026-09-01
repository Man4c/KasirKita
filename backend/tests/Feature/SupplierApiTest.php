<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupplierApiTest extends TestCase
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
            'name' => 'Sembako',
            'slug' => 'sembako',
        ]);

        $this->product = Product::create([
            'name' => 'Beras Premium 5kg',
            'sku_barcode' => 'BERAS-005',
            'category_id' => $this->category->id,
            'base_unit_id' => $this->baseUnit->id,
            'price' => 75000,
            'avg_cost' => 60000,
            'stock' => 20,
            'min_stock' => 5,
            'is_active' => true,
        ]);
    }

    public function test_cashier_cannot_access_suppliers(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/suppliers');

        $response->assertStatus(403);
    }

    public function test_owner_can_list_suppliers_with_search(): void
    {
        Supplier::create([
            'name' => 'PT Indomarco Adi Prima',
            'contact_person' => 'Pak Hendra',
            'phone' => '081298765432',
        ]);

        Supplier::create([
            'name' => 'Agen Beras Makmur',
            'contact_person' => 'Bu Lina',
            'phone' => '085612349876',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/suppliers');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.data');

        // Search by company name
        $searchResponse = $this->actingAs($this->owner)
            ->getJson('/api/suppliers?search=Indomarco');

        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'PT Indomarco Adi Prima');
    }

    public function test_owner_can_create_supplier(): void
    {
        $payload = [
            'name' => 'CV Sumber Rejeki',
            'contact_person' => 'Doni Saputra',
            'phone' => '087812345678',
            'email' => 'doni@sumberrejeki.com',
            'address' => 'Kawasan Industri Candi Blok D-12',
            'bank_name' => 'BCA',
            'bank_account' => '8899001122',
            'bank_holder' => 'CV Sumber Rejeki',
            'notes' => 'Penyalur aneka snack dan wafer',
        ];

        $response = $this->actingAs($this->owner)
            ->postJson('/api/suppliers', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'CV Sumber Rejeki')
            ->assertJsonPath('data.bank_account', '8899001122');

        $this->assertDatabaseHas('suppliers', [
            'name' => 'CV Sumber Rejeki',
            'bank_name' => 'BCA',
        ]);
    }

    public function test_owner_can_update_supplier(): void
    {
        $supplier = Supplier::create([
            'name' => 'Toko Agen Grosir',
            'phone' => '08123456789',
        ]);

        $response = $this->actingAs($this->owner)
            ->putJson("/api/suppliers/{$supplier->id}", [
                'name' => 'Toko Agen Grosir Jaya',
                'contact_person' => 'Koh Ahong',
                'phone' => '08123456789',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Toko Agen Grosir Jaya')
            ->assertJsonPath('data.contact_person', 'Koh Ahong');
    }

    public function test_owner_can_soft_delete_supplier(): void
    {
        $supplier = Supplier::create([
            'name' => 'Supplier Akan Dihapus',
            'phone' => '08999999999',
        ]);

        $response = $this->actingAs($this->owner)
            ->deleteJson("/api/suppliers/{$supplier->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('suppliers', [
            'id' => $supplier->id,
        ]);
    }

    public function test_restock_with_supplier_id_associates_movement_and_cash_flow(): void
    {
        $supplier = Supplier::create([
            'name' => 'Distributor Beras Utama',
            'phone' => '08111222333',
        ]);

        $restockPayload = [
            'quantity' => 10,
            'unit_cost' => 58000,
            'supplier_id' => $supplier->id,
            'notes' => 'Kulakan beras awal bulan',
        ];

        $response = $this->actingAs($this->owner)
            ->postJson("/api/products/{$this->product->id}/restock", $restockPayload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify stock_movement has supplier_id
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'supplier_id' => $supplier->id,
            'type' => 'IN',
            'total_cost' => 580000,
        ]);

        // Verify cash_flow has supplier_id
        $this->assertDatabaseHas('cash_flows', [
            'supplier_id' => $supplier->id,
            'type' => 'OUT',
            'category' => 'PURCHASE',
            'amount' => 580000,
        ]);

        // Verify supplier detail aggregates purchases
        $detailResponse = $this->actingAs($this->owner)
            ->getJson("/api/suppliers/{$supplier->id}");

        $detailResponse->assertStatus(200)
            ->assertJsonPath('data.restocks_count', 1)
            ->assertJsonPath('data.total_purchases', 580000);
    }
}
