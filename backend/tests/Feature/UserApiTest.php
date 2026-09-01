<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create([
            'name' => 'Owner KasirKita',
            'email' => 'owner@kasirkita.com',
            'role' => 'owner',
            'is_active' => true,
        ]);

        $this->cashier = User::factory()->create([
            'name' => 'Budi Kasir',
            'email' => 'budi@kasirkita.com',
            'role' => 'cashier',
            'is_active' => true,
        ]);
    }

    public function test_cashier_cannot_access_user_management(): void
    {
        $response = $this->actingAs($this->cashier)
            ->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_owner_can_list_users_with_search_and_filter(): void
    {
        User::factory()->create([
            'name' => 'Siti Kasir Pagi',
            'email' => 'siti@kasirkita.com',
            'role' => 'cashier',
        ]);

        $response = $this->actingAs($this->owner)
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(3, 'data.data');

        // Search by name
        $searchResponse = $this->actingAs($this->owner)
            ->getJson('/api/users?search=Siti');

        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.name', 'Siti Kasir Pagi');

        // Filter by role
        $roleResponse = $this->actingAs($this->owner)
            ->getJson('/api/users?role=owner');

        $roleResponse->assertStatus(200)
            ->assertJsonCount(1, 'data.data')
            ->assertJsonPath('data.data.0.role', 'owner');
    }

    public function test_owner_can_create_new_cashier(): void
    {
        $payload = [
            'name' => 'Rina Shift Sore',
            'email' => 'rina@kasirkita.com',
            'phone' => '081234567890',
            'role' => 'cashier',
            'password' => 'secret123',
            'is_active' => true,
        ];

        $response = $this->actingAs($this->owner)
            ->postJson('/api/users', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Rina Shift Sore')
            ->assertJsonPath('data.email', 'rina@kasirkita.com')
            ->assertJsonPath('data.role', 'cashier');

        $createdUser = User::where('email', 'rina@kasirkita.com')->first();
        $this->assertNotNull($createdUser);
        $this->assertTrue(Hash::check('secret123', $createdUser->password));
    }

    public function test_cannot_create_user_with_duplicate_email(): void
    {
        $payload = [
            'name' => 'Duplikat Budi',
            'email' => 'budi@kasirkita.com',
            'role' => 'cashier',
            'password' => 'secret123',
        ];

        $response = $this->actingAs($this->owner)
            ->postJson('/api/users', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_owner_can_update_user(): void
    {
        $response = $this->actingAs($this->owner)
            ->putJson("/api/users/{$this->cashier->id}", [
                'name' => 'Budi Santoso (Senior)',
                'email' => 'budi.santoso@kasirkita.com',
                'phone' => '081987654321',
                'role' => 'cashier',
                'is_active' => true,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Budi Santoso (Senior)')
            ->assertJsonPath('data.email', 'budi.santoso@kasirkita.com');
    }

    public function test_owner_cannot_deactivate_or_delete_self(): void
    {
        // Test self deactivate
        $deactivateResponse = $this->actingAs($this->owner)
            ->putJson("/api/users/{$this->owner->id}", [
                'name' => $this->owner->name,
                'email' => $this->owner->email,
                'role' => 'owner',
                'is_active' => false,
            ]);

        $deactivateResponse->assertStatus(400);

        // Test self delete
        $deleteResponse = $this->actingAs($this->owner)
            ->deleteJson("/api/users/{$this->owner->id}");

        $deleteResponse->assertStatus(400);

        // Test toggle status on self
        $toggleResponse = $this->actingAs($this->owner)
            ->patchJson("/api/users/{$this->owner->id}/toggle-status");

        $toggleResponse->assertStatus(400);
    }

    public function test_owner_can_reset_password_and_revoke_tokens(): void
    {
        // Cashier has an active token
        $token = $this->cashier->createToken('test-device')->plainTextToken;
        $this->assertCount(1, $this->cashier->fresh()->tokens);

        $response = $this->actingAs($this->owner)
            ->postJson("/api/users/{$this->cashier->id}/reset-password", [
                'new_password' => 'newpassword123',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // Verify password changed
        $this->assertTrue(Hash::check('newpassword123', $this->cashier->fresh()->password));

        // Verify tokens revoked
        $this->assertCount(0, $this->cashier->fresh()->tokens);
    }

    public function test_deactivated_user_cannot_login(): void
    {
        $this->cashier->update(['is_active' => false]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'budi@kasirkita.com',
            'password' => 'password', // Default factory password
        ]);

        $loginResponse->assertStatus(403);
    }
}
