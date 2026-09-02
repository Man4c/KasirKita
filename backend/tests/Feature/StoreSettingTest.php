<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StoreSettingTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Owner Test',
            'email' => 'owner_setting@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashier_setting@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_cashier_can_get_store_settings(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/settings/store');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'KasirKita Mart');
    }

    public function test_owner_can_update_store_settings(): void
    {
        $payload = [
            'name' => 'Toko Berkah Kelontong',
            'address' => 'Jl. Sudirman No. 45, Bandung',
            'phone' => '081399887766',
            'logo' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'receipt_footer' => 'Terima kasih telah berbelanja!',
            'show_logo_on_receipt' => true,
            'show_phone_on_receipt' => true,
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/settings/store', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Toko Berkah Kelontong')
            ->assertJsonPath('data.phone', '081399887766');

        $this->assertDatabaseHas('store_settings', [
            'name' => 'Toko Berkah Kelontong',
            'phone' => '081399887766',
        ]);
    }

    public function test_cashier_cannot_update_store_settings(): void
    {
        $payload = [
            'name' => 'Toko Diubah Kasir',
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->putJson('/api/settings/store', $payload);

        $response->assertStatus(403);
    }

    public function test_update_store_settings_requires_name(): void
    {
        $payload = [
            'name' => '',
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/settings/store', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }
}
