<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Store;
use App\Models\StoreSetting;
use App\Models\Unit;
use App\Models\User;
use App\Services\TelegramNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class StoreRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_retail_store_registration(): void
    {
        $payload = [
            'store_name' => 'Toko Kelontong Sumber Rezeki',
            'business_type' => 'retail',
            'owner_name' => 'Budi Santoso',
            'email' => 'budi@sumberrezeki.com',
            'password' => 'password123',
            'phone' => '081234567890',
            'address' => 'Jl. Merdeka No. 45, Surabaya',
        ];

        $response = $this->postJson('/api/auth/register-store', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'phone',
                        'store_id',
                        'store' => [
                            'id',
                            'name',
                            'business_type',
                            'subscription_status',
                            'trial_ends_at',
                            'is_active',
                            'is_trial',
                            'is_expired',
                        ],
                    ],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'name' => 'Budi Santoso',
                        'email' => 'budi@sumberrezeki.com',
                        'role' => 'owner',
                        'store' => [
                            'name' => 'Toko Kelontong Sumber Rezeki',
                            'business_type' => 'retail',
                            'subscription_status' => 'trial',
                            'is_active' => true,
                            'is_trial' => true,
                            'is_expired' => false,
                        ],
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);

        $storeId = $response->json('data.user.store_id');
        $this->assertNotNull($storeId);

        // Verify Store record
        $store = Store::find($storeId);
        $this->assertNotNull($store);
        $this->assertEquals('Toko Kelontong Sumber Rezeki', $store->name);
        $this->assertEquals('retail', $store->business_type);
        $this->assertTrue($store->isTrial());
        $this->assertTrue($store->isActive());

        // Verify Owner User record
        $owner = User::where('email', 'budi@sumberrezeki.com')->first();
        $this->assertNotNull($owner);
        $this->assertEquals($store->id, $owner->store_id);
        $this->assertEquals($owner->id, $store->owner_id);

        // Verify StoreSetting
        $setting = StoreSetting::where('store_id', $store->id)->first();
        $this->assertNotNull($setting);
        $this->assertEquals('Toko Kelontong Sumber Rezeki', $setting->name);

        // Verify Retail Categories auto-provisioned
        $categories = Category::forStore($store->id)->get();
        $this->assertGreaterThanOrEqual(4, $categories->count());
        $this->assertTrue($categories->contains('slug', 'makanan-minuman'));
        $this->assertTrue($categories->contains('slug', 'kebutuhan-pokok'));
    }

    public function test_successful_fnb_store_registration(): void
    {
        $payload = [
            'store_name' => 'Kopi Titik Temu',
            'business_type' => 'fnb',
            'owner_name' => 'Arif Wijaya',
            'email' => 'arif@titiktemu.coffee',
            'password' => 'secret123',
            'phone' => '082198765432',
            'address' => 'Jl. Gandaria No. 10, Jakarta Selatan',
        ];

        $response = $this->postJson('/api/auth/register-store', $payload);

        $response->assertStatus(201);
        $storeId = $response->json('data.user.store_id');

        // Verify F&B Categories provisioned
        $categories = Category::forStore($storeId)->get();
        $this->assertTrue($categories->contains('slug', 'makanan-utama'));
        $this->assertTrue($categories->contains('slug', 'minuman-kopi'));
        $this->assertTrue($categories->contains('slug', 'camilan-dessert'));

        // Verify F&B Units provisioned
        $units = Unit::forStore($storeId)->get();
        $this->assertTrue($units->contains('symbol', 'porsi'));
        $this->assertTrue($units->contains('symbol', 'cup'));
    }

    public function test_successful_service_store_registration(): void
    {
        $payload = [
            'store_name' => 'Kinclong Express Laundry',
            'business_type' => 'service',
            'owner_name' => 'Siti Nurhaliza',
            'email' => 'siti@kinclonglaundry.com',
            'password' => 'laundry123',
            'phone' => '085712345678',
            'address' => 'Jl. Diponegoro No. 8, Bandung',
        ];

        $response = $this->postJson('/api/auth/register-store', $payload);

        $response->assertStatus(201);
        $storeId = $response->json('data.user.store_id');

        // Verify Service Categories provisioned
        $categories = Category::forStore($storeId)->get();
        $this->assertTrue($categories->contains('slug', 'layanan-utama'));
        $this->assertTrue($categories->contains('slug', 'paket-layanan'));

        // Verify Service Units provisioned
        $units = Unit::forStore($storeId)->get();
        $this->assertTrue($units->contains('symbol', 'sesi'));
        $this->assertTrue($units->contains('symbol', 'jam'));
    }

    public function test_duplicate_email_registration_fails(): void
    {
        // Existing user
        User::factory()->create([
            'email' => 'duplikat@kasirkita.com',
        ]);

        $payload = [
            'store_name' => 'Toko Duplikat',
            'business_type' => 'retail',
            'owner_name' => 'Hendra',
            'email' => 'duplikat@kasirkita.com',
            'password' => 'password123',
            'phone' => '081299998888',
        ];

        $response = $this->postJson('/api/auth/register-store', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_telegram_notification_service_integration(): void
    {
        Http::fake([
            'https://api.telegram.org/*' => Http::response(['ok' => true, 'result' => []], 200),
        ]);

        config([
            'services.telegram.bot_token' => '123456789:TEST_BOT_TOKEN',
            'services.telegram.admin_chat_id' => '987654321',
        ]);

        $store = Store::create([
            'name' => 'Kedai Kopi Uji Coba',
            'business_type' => 'fnb',
            'subscription_status' => 'trial',
            'trial_ends_at' => now()->addDays(14),
        ]);

        $owner = User::create([
            'name' => 'Barista Hebat',
            'email' => 'barista@kopi.com',
            'phone' => '081987654321',
            'role' => 'owner',
            'password' => 'secret',
            'store_id' => $store->id,
        ]);

        $telegramService = app(TelegramNotificationService::class);
        $sent = $telegramService->notifyNewStoreRegistered($store, $owner);

        $this->assertTrue($sent);

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.telegram.org')
                && str_contains($request['text'], 'Kedai Kopi Uji Coba')
                && str_contains($request['text'], 'Barista Hebat')
                && $request['chat_id'] === '987654321';
        });
    }
}
