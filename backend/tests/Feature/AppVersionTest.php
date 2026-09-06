<?php

namespace Tests\Feature;

use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AppVersionTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::create([
            'name' => 'Owner Test',
            'email' => 'owner_ver@test.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashier_ver@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_public_guest_can_get_app_version_defaults(): void
    {
        $response = $this->getJson('/api/app/version');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'latest_version',
                    'latest_version_code',
                    'min_supported_version',
                    'apk_url',
                    'apk_size_bytes',
                    'changelog',
                    'release_date',
                    'is_mandatory',
                ],
            ]);
    }

    public function test_owner_can_update_app_version_successfully(): void
    {
        $payload = [
            'latest_version' => '1.4.0',
            'latest_version_code' => 140,
            'min_supported_version' => '1.1.0',
            'apk_url' => 'https://test-ref.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk',
            'apk_size_bytes' => 45600000,
            'changelog' => [
                'Perbaikan pemulihan cadangan data lokal dan cloud',
                'Optimasi sinkronisasi transaksi kasir',
            ],
            'release_date' => '2026-09-06',
            'is_mandatory' => false,
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/app/version', $payload);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.latest_version', '1.4.0')
            ->assertJsonPath('data.latest_version_code', 140)
            ->assertJsonPath('data.apk_url', 'https://test-ref.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk')
            ->assertJsonPath('data.changelog.0', 'Perbaikan pemulihan cadangan data lokal dan cloud');

        // Verify public endpoint returns the updated version immediately
        $publicCheck = $this->getJson('/api/app/version');
        $publicCheck->assertStatus(200)
            ->assertJsonPath('data.latest_version', '1.4.0')
            ->assertJsonPath('data.apk_url', 'https://test-ref.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk');
    }

    public function test_cashier_is_forbidden_from_updating_app_version(): void
    {
        $payload = [
            'latest_version' => '1.4.0',
            'apk_url' => 'https://test-ref.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk',
            'changelog' => ['Test update'],
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->putJson('/api/app/version', $payload);

        $response->assertStatus(403);
    }

    public function test_unauthenticated_client_cannot_update_app_version(): void
    {
        $payload = [
            'latest_version' => '1.4.0',
            'apk_url' => 'https://test-ref.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk',
            'changelog' => ['Test update'],
        ];

        $response = $this->putJson('/api/app/version', $payload);

        $response->assertStatus(401);
    }

    public function test_validation_rejects_invalid_semver_and_empty_changelog(): void
    {
        $invalidPayload = [
            'latest_version' => 'v1.4', // Invalid format, should be e.g. 1.4.0
            'apk_url' => 'not-a-valid-url',
            'changelog' => [],
        ];

        $response = $this->actingAs($this->owner, 'sanctum')
            ->putJson('/api/app/version', $invalidPayload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['latest_version', 'apk_url', 'changelog']);
    }

    public function test_model_accessor_merges_and_provides_defaults(): void
    {
        $setting = StoreSetting::create([
            'name' => 'Toko KasirKita',
            'app_version' => [
                'latest_version' => '1.5.0',
                'apk_url' => 'https://supabase.co/test.apk',
            ],
        ]);

        $version = $setting->app_version;

        $this->assertEquals('1.5.0', $version['latest_version']);
        $this->assertEquals('https://supabase.co/test.apk', $version['apk_url']);
        $this->assertIsArray($version['changelog']);
        $this->assertFalse($version['is_mandatory']);
    }
}
