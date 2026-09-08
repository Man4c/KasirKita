<?php

namespace Tests\Feature;

use App\Models\LicenseKey;
use App\Models\Store;
use App\Models\User;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class TelegramNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_false_when_telegram_is_not_configured(): void
    {
        Config::set('services.telegram.bot_token', null);
        Config::set('services.telegram.admin_chat_id', null);

        $service = app(TelegramNotificationService::class);

        $store = Store::factory()->create();
        $user = User::factory()->create(['store_id' => $store->id]);

        $this->assertFalse($service->notifyNewStoreRegistered($store, $user));
    }

    public function test_it_sends_new_store_registered_notification_when_configured(): void
    {
        Config::set('services.telegram.bot_token', 'fake-token-12345');
        Config::set('services.telegram.admin_chat_id', '123456789');

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        $service = app(TelegramNotificationService::class);

        $store = Store::factory()->create([
            'name' => 'Toko Barokah Jaya',
            'business_type' => 'retail',
        ]);
        $owner = User::factory()->create([
            'name' => 'Pak Haji Slamet',
            'email' => 'slamet@barokah.com',
            'phone' => '081234567890',
            'store_id' => $store->id,
        ]);

        $result = $service->notifyNewStoreRegistered($store, $owner);

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'fake-token-12345/sendMessage')
                && $request['chat_id'] === '123456789'
                && str_contains($request['text'], 'Toko Barokah Jaya')
                && str_contains($request['text'], 'Pak Haji Slamet');
        });
    }

    public function test_it_sends_license_activated_notification(): void
    {
        Config::set('services.telegram.bot_token', 'fake-token-12345');
        Config::set('services.telegram.admin_chat_id', '123456789');

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        $service = app(TelegramNotificationService::class);

        $store = Store::factory()->create(['name' => 'Cafe Kopi Kenangan']);
        $user = User::factory()->create(['name' => 'Barista Lead', 'store_id' => $store->id]);
        $license = LicenseKey::create([
            'license_key' => 'KK-PRO-TEST-1234',
            'duration_type' => '1_year',
            'duration_days' => 365,
            'status' => 'redeemed',
            'notes' => 'Pembelian via Sales Lapangan',
        ]);

        $result = $service->notifyLicenseActivated($store, $user, $license);

        $this->assertTrue($result);

        Http::assertSent(function ($request) {
            return str_contains($request['text'], 'Cafe Kopi Kenangan')
                && str_contains($request['text'], 'KK-PRO-TEST-1234')
                && str_contains($request['text'], '1 TAHUN');
        });
    }

    public function test_artisan_telegram_test_command(): void
    {
        // 1. Without credentials
        Config::set('services.telegram.bot_token', null);
        Config::set('services.telegram.admin_chat_id', null);

        $this->artisan('telegram:test')
            ->assertExitCode(1);

        // 2. With credentials
        Config::set('services.telegram.bot_token', 'fake-token');
        Config::set('services.telegram.admin_chat_id', '987654');

        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true], 200),
        ]);

        $this->artisan('telegram:test', ['--message' => 'Halo dari unit test'])
            ->expectsOutputToContain('Pesan berhasil terkirim ke Telegram admin!')
            ->assertExitCode(0);
    }
}
