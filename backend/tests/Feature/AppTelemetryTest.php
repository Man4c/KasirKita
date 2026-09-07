<?php

namespace Tests\Feature;

use App\Models\AppInstallation;
use App\Models\StoreSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AppTelemetryTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::create([
            'name' => 'Kasir Telemetry Test',
            'email' => 'kasir_telem@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_first_device_ping_creates_new_installation_record(): void
    {
        $payload = [
            'installation_id' => 'inst_test_uuid_001',
            'device_model' => 'Samsung SM-A546E',
            'brand' => 'samsung',
            'os_name' => 'Android',
            'os_version' => '14',
            'app_version' => '1.3.1',
            'app_version_code' => 5,
            'metadata' => [
                'locale' => 'id-ID',
            ],
        ];

        $response = $this->postJson('/api/app/device-ping', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_new', true)
            ->assertJsonPath('data.installation_id', 'inst_test_uuid_001');

        $this->assertDatabaseHas('app_installations', [
            'installation_id' => 'inst_test_uuid_001',
            'device_model' => 'Samsung SM-A546E',
            'brand' => 'samsung',
            'os_name' => 'Android',
            'os_version' => '14',
            'app_version' => '1.3.1',
            'app_version_code' => 5,
            'total_pings' => 1,
        ]);

        $installation = AppInstallation::where('installation_id', 'inst_test_uuid_001')->first();
        $this->assertNotNull($installation->first_installed_at);
        $this->assertNotNull($installation->last_active_at);
        $this->assertEquals(['locale' => 'id-ID'], $installation->metadata);
    }

    public function test_repeated_ping_from_same_device_updates_active_time_without_duplicating(): void
    {
        $payloadInitial = [
            'installation_id' => 'inst_repeat_002',
            'device_model' => 'Redmi Note 12',
            'brand' => 'Xiaomi',
            'os_name' => 'Android',
            'os_version' => '13',
            'app_version' => '1.3.0',
            'app_version_code' => 4,
        ];

        // First ping
        $res1 = $this->postJson('/api/app/device-ping', $payloadInitial);
        $res1->assertStatus(201)
            ->assertJsonPath('data.is_new', true);

        $initialRecord = AppInstallation::where('installation_id', 'inst_repeat_002')->first();
        $this->assertNotNull($initialRecord);
        $firstInstalledAt = $initialRecord->first_installed_at;

        // Simulate app updated to 1.3.1 and opened again
        $payloadSecond = [
            'installation_id' => 'inst_repeat_002',
            'device_model' => 'Redmi Note 12',
            'brand' => 'Xiaomi',
            'os_name' => 'Android',
            'os_version' => '14',
            'app_version' => '1.3.1',
            'app_version_code' => 5,
        ];

        $res2 = $this->postJson('/api/app/device-ping', $payloadSecond);
        $res2->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_new', false)
            ->assertJsonPath('data.total_pings', 2);

        // Database should still have exactly 1 record for this installation_id
        $this->assertEquals(1, AppInstallation::where('installation_id', 'inst_repeat_002')->count());

        $updatedRecord = AppInstallation::where('installation_id', 'inst_repeat_002')->first();
        $this->assertEquals(2, $updatedRecord->total_pings);
        $this->assertEquals('1.3.1', $updatedRecord->app_version);
        $this->assertEquals(5, $updatedRecord->app_version_code);
        $this->assertEquals('14', $updatedRecord->os_version);
        // first_installed_at must be preserved
        $this->assertEquals($firstInstalledAt->toDateTimeString(), $updatedRecord->first_installed_at->toDateTimeString());
    }

    public function test_ping_requires_installation_id(): void
    {
        $response = $this->postJson('/api/app/device-ping', [
            'device_model' => 'Infinix Hot 30',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['installation_id']);
    }

    public function test_ping_associates_logged_in_user_when_authenticated(): void
    {
        $payload = [
            'installation_id' => 'inst_auth_003',
            'app_version' => '1.3.1',
        ];

        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson('/api/app/device-ping', $payload);

        $response->assertStatus(201);

        $installation = AppInstallation::where('installation_id', 'inst_auth_003')->first();
        $this->assertNotNull($installation);
        $this->assertEquals($this->cashier->id, $installation->user_id);
    }

    public function test_download_endpoint_redirects_to_configured_apk_url(): void
    {
        StoreSetting::create([
            'name' => 'KasirKita POS',
            'app_version' => [
                'latest_version' => '1.3.1',
                'apk_url' => 'https://test.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.3.1.apk',
            ],
        ]);

        $response = $this->get('/api/app/download');

        $response->assertStatus(302)
            ->assertRedirect('https://test.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.3.1.apk');
    }

    public function test_download_endpoint_returns_404_when_no_apk_url_configured(): void
    {
        config(['app_version.apk_url' => null]);

        $response = $this->getJson('/api/app/download');

        $response->assertStatus(404)
            ->assertJsonPath('success', false);
    }
}
