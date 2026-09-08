<?php

namespace Tests\Feature;

use App\Models\LicenseKey;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminControllerTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $regularCashier;
    protected Store $store1;
    protected Store $store2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->store1 = Store::create([
            'name' => 'Toko Mart Alpha',
            'slug' => 'toko-mart-alpha',
            'business_type' => 'retail',
            'subscription_status' => 'active',
            'activated_at' => now(),
        ]);

        $this->store2 = Store::create([
            'name' => 'Warung Kopi Beta',
            'slug' => 'warung-kopi-beta',
            'business_type' => 'fnb',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        // Superadmin user (owner@kasirkita.com or role superadmin)
        $this->superAdmin = User::factory()->create([
            'email' => 'owner@kasirkita.com',
            'role' => 'owner',
            'store_id' => $this->store1->id,
        ]);

        // Regular cashier (not superadmin)
        $this->regularCashier = User::factory()->create([
            'email' => 'kasir@beta.com',
            'role' => 'cashier',
            'store_id' => $this->store2->id,
        ]);
    }

    public function test_non_superadmin_is_forbidden_from_superadmin_endpoints(): void
    {
        $response = $this->actingAs($this->regularCashier)
            ->getJson('/api/superadmin/stats');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'error_code' => 'SUPERADMIN_ACCESS_REQUIRED',
            ]);
    }

    public function test_superadmin_can_retrieve_platform_stats(): void
    {
        LicenseKey::create([
            'license_key' => 'KK-PRO-TEST-AAAA',
            'status' => 'available',
            'duration_type' => '1_year',
            'duration_days' => 365,
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/superadmin/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_stores',
                    'trial_stores',
                    'active_stores',
                    'expired_stores',
                    'licenses' => [
                        'total',
                        'available',
                        'redeemed',
                        'revoked',
                    ],
                ],
            ]);

        $this->assertEquals(2, $response->json('data.total_stores'));
        $this->assertEquals(1, $response->json('data.active_stores'));
        $this->assertEquals(1, $response->json('data.trial_stores'));
        $this->assertEquals(1, $response->json('data.licenses.available'));
    }

    public function test_superadmin_can_list_and_search_stores(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/superadmin/stores?search=Alpha');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
                'meta' => ['total', 'current_page'],
            ]);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Toko Mart Alpha', $data[0]['name']);
    }

    public function test_superadmin_can_filter_stores_by_status(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->getJson('/api/superadmin/stores?status=trial');

        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('Warung Kopi Beta', $data[0]['name']);
    }

    public function test_superadmin_can_directly_activate_store(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/superadmin/stores/{$this->store2->id}/activate", [
                'duration_type' => '1_year',
                'notes' => 'Pembayaran cash di toko Rp 600.000',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subscription_status' => 'active',
                    'is_active' => true,
                ],
            ]);

        $this->store2->refresh();
        $this->assertEquals('active', $this->store2->subscription_status);
        $this->assertNotNull($this->store2->activated_at);
        $this->assertNotNull($this->store2->subscription_expires_at);
        $this->assertStringContainsString('Pembayaran cash di toko', $this->store2->notes);
    }

    public function test_superadmin_can_extend_trial_of_a_store(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/superadmin/stores/{$this->store2->id}/extend-trial", [
                'days' => 7,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subscription_status' => 'trial',
                ],
            ]);

        $this->store2->refresh();
        $this->assertEquals('trial', $this->store2->subscription_status);
        // Previously +14 days, now extended by +7 days = ~21 days
        $this->assertTrue($this->store2->trial_ends_at->isFuture());
    }

    public function test_superadmin_can_toggle_store_status(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/superadmin/stores/{$this->store2->id}/toggle-status", [
                'status' => 'expired',
            ]);

        $response->assertStatus(200);
        $this->store2->refresh();
        $this->assertEquals('expired', $this->store2->subscription_status);
    }

    public function test_superadmin_can_generate_batch_licenses(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->postJson('/api/superadmin/licenses/generate', [
                'count' => 3,
                'duration_type' => '1_year',
                'notes' => 'Promo Batch A',
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $keys = $response->json('data');
        $this->assertCount(3, $keys);
        $this->assertEquals(3, LicenseKey::where('notes', 'Promo Batch A')->count());
    }

    public function test_superadmin_can_revoke_license_key(): void
    {
        $key = LicenseKey::create([
            'license_key' => 'KK-PRO-TEST-REVOK',
            'status' => 'available',
            'duration_type' => '1_year',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->postJson("/api/superadmin/licenses/{$key->id}/revoke");

        $response->assertStatus(200);
        $key->refresh();
        $this->assertEquals('revoked', $key->status);
    }
}
