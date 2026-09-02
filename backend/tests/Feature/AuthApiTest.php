<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_health_endpoint_returns_success(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'KasirKita POS API is running smoothly.',
            ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::create([
            'name' => 'Owner KasirKita',
            'email' => 'owner@kasirkita.com',
            'phone' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'owner@kasirkita.com',
            'password' => 'password123',
            'device_name' => 'test-device',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => ['id', 'name', 'email', 'role', 'phone'],
                    'token',
                    'token_type',
                ],
            ])
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'email' => 'owner@kasirkita.com',
                        'role' => 'owner',
                    ],
                    'token_type' => 'Bearer',
                ],
            ]);
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        User::create([
            'name' => 'Owner KasirKita',
            'email' => 'owner@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'owner',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'owner@kasirkita.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Email atau kata sandi tidak valid.',
            ]);
    }

    public function test_authenticated_user_can_get_profile_and_logout(): void
    {
        $user = User::create([
            'name' => 'Kasir Toko',
            'email' => 'kasir@kasirkita.com',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        // Get Profile
        $meResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'email' => 'kasir@kasirkita.com',
                    'role' => 'cashier',
                ],
            ]);

        // Logout
        $logoutResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil.',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_user_can_update_profile(): void
    {
        $user = User::create([
            'name' => 'Kasir Awal',
            'email' => 'kasir@kasirkita.com',
            'phone' => '081111111111',
            'password' => Hash::make('password123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/auth/profile', [
                'name' => 'Kasir Baru',
                'phone' => '082222222222',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Profil pengguna berhasil diperbarui.',
                'data' => [
                    'name' => 'Kasir Baru',
                    'phone' => '082222222222',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Kasir Baru',
            'phone' => '082222222222',
        ]);
    }

    public function test_authenticated_user_can_change_password(): void
    {
        $user = User::create([
            'name' => 'Kasir Toko',
            'email' => 'kasir2@kasirkita.com',
            'password' => Hash::make('oldpassword123'),
            'role' => 'cashier',
            'is_active' => true,
        ]);

        $token = $user->createToken('test-token')->plainTextToken;

        // Fails with wrong current password
        $failResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/auth/password', [
                'current_password' => 'wrongpass',
                'new_password' => 'newpassword123',
            ]);

        $failResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Kata sandi saat ini tidak cocok.',
            ]);

        // Succeeds with correct current password
        $successResponse = $this->withHeader('Authorization', 'Bearer '.$token)
            ->putJson('/api/auth/password', [
                'current_password' => 'oldpassword123',
                'new_password' => 'newpassword123',
            ]);

        $successResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Kata sandi berhasil diubah.',
            ]);

        $user->refresh();
        $this->assertTrue(Hash::check('newpassword123', $user->password));
    }
}
