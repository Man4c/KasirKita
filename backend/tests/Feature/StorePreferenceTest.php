<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class StorePreferenceTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Owner Test',
            'email' => 'owner_pref@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashier_pref@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_all_staff_can_get_store_preferences_with_defaults(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/settings/store');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.preferences.show_barcode_scanner', true)
            ->assertJsonPath('data.preferences.sound_beep', true)
            ->assertJsonPath('data.preferences.show_customer_picker', true)
            ->assertJsonPath('data.preferences.show_voucher_feature', true)
            ->assertJsonPath('data.preferences.show_tax_feature', true)
            ->assertJsonPath('data.preferences.auto_print', false)
            ->assertJsonPath('data.preferences.print_two_copies', false)
            ->assertJsonPath('data.preferences.paper_size', '58mm');
    }

    public function test_owner_can_update_preferences_partially(): void
    {
        $payload = [
            'show_barcode_scanner' => false,
            'auto_print' => true,
            'paper_size' => '80mm',
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/settings/preferences', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.show_barcode_scanner', false)
            ->assertJsonPath('data.auto_print', true)
            ->assertJsonPath('data.paper_size', '80mm')
            // Nilai lain yang tidak dikirim harus tetap utuh mengikuti nilai lama/default
            ->assertJsonPath('data.sound_beep', true)
            ->assertJsonPath('data.show_customer_picker', true);

        // Verifikasi pada GET /api/settings/store
        $check = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/settings/store');

        $check->assertStatus(200)
            ->assertJsonPath('data.preferences.show_barcode_scanner', false)
            ->assertJsonPath('data.preferences.auto_print', true)
            ->assertJsonPath('data.preferences.paper_size', '80mm');
    }

    public function test_cashier_cannot_update_preferences(): void
    {
        $payload = [
            'show_tax_feature' => false,
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->putJson('/api/settings/preferences', $payload);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_preferences(): void
    {
        $response = $this->putJson('/api/settings/preferences', [
            'auto_print' => true,
        ]);

        $response->assertStatus(401);
    }

    public function test_preferences_validation_rules(): void
    {
        // Test invalid paper_size
        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/settings/preferences', [
                'paper_size' => 'A4',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['paper_size']);

        // Test invalid boolean
        $responseBool = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/settings/preferences', [
                'sound_beep' => 'not-a-boolean',
            ]);

        $responseBool->assertStatus(422)
            ->assertJsonValidationErrors(['sound_beep']);
    }
}
