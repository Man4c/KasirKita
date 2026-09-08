<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\StoreProvisioningService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register a new store and owner account with initial template data.
     */
    public function registerStore(Request $request, StoreProvisioningService $provisioningService): JsonResponse
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'business_type' => ['required', 'string', 'in:retail,fnb,service,other'],
            'owner_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:6'],
            'address' => ['nullable', 'string'],
        ], [
            'store_name.required' => 'Nama toko wajib diisi.',
            'business_type.required' => 'Jenis usaha wajib dipilih.',
            'owner_name.required' => 'Nama pemilik toko wajib diisi.',
            'email.required' => 'Email akun login wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.',
            'phone.required' => 'Nomor WhatsApp / HP wajib diisi.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
        ]);

        $result = $provisioningService->registerStore($validated);
        $user = $result['user'];
        $store = $result['store'];
        $token = $result['token'];

        $storeData = [
            'id' => $store->id,
            'name' => $store->name,
            'business_type' => $store->business_type,
            'subscription_status' => $store->subscription_status,
            'trial_ends_at' => $store->trial_ends_at?->toIso8601String(),
            'activated_at' => $store->activated_at?->toIso8601String(),
            'is_active' => $store->isActive(),
            'is_trial' => $store->isTrial(),
            'is_expired' => $store->isExpired(),
        ];

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'is_superadmin' => $user->isSuperAdmin(),
                'store_id' => $user->store_id,
                'store' => $storeData,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Pendaftaran toko berhasil! Selamat datang di KasirKita POS.', 201);
    }

    /**
     * Handle user login and generate Sanctum token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->errorResponse('Email atau kata sandi tidak valid.', 401);
        }

        if (! $user->is_active) {
            return $this->errorResponse('Akun Anda sedang dinonaktifkan. Hubungi pemilik toko.', 403);
        }

        $deviceName = $validated['device_name'] ?? 'kasirkita-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        $storeData = null;
        if ($user->store) {
            $storeData = [
                'id' => $user->store->id,
                'name' => $user->store->name,
                'business_type' => $user->store->business_type,
                'subscription_status' => $user->store->subscription_status,
                'trial_ends_at' => $user->store->trial_ends_at?->toIso8601String(),
                'activated_at' => $user->store->activated_at?->toIso8601String(),
                'subscription_expires_at' => $user->store->subscription_expires_at?->toIso8601String(),
                'license_key' => $user->store->license_key,
                'is_active' => $user->store->isActive(),
                'is_trial' => $user->store->isTrial(),
                'is_expired' => $user->store->isExpired(),
            ];
        }

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'phone' => $user->phone,
                'is_superadmin' => $user->isSuperAdmin(),
                'store_id' => $user->store_id,
                'store' => $storeData,
            ],
            'token' => $token,
            'token_type' => 'Bearer',
        ], 'Login berhasil.');
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        $storeData = null;
        if ($user->store) {
            $storeData = [
                'id' => $user->store->id,
                'name' => $user->store->name,
                'business_type' => $user->store->business_type,
                'subscription_status' => $user->store->subscription_status,
                'trial_ends_at' => $user->store->trial_ends_at?->toIso8601String(),
                'activated_at' => $user->store->activated_at?->toIso8601String(),
                'subscription_expires_at' => $user->store->subscription_expires_at?->toIso8601String(),
                'license_key' => $user->store->license_key,
                'is_active' => $user->store->isActive(),
                'is_trial' => $user->store->isTrial(),
                'is_expired' => $user->store->isExpired(),
            ];
        }

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
            'is_superadmin' => $user->isSuperAdmin(),
            'store_id' => $user->store_id,
            'store' => $storeData,
        ], 'Profil pengguna berhasil diambil.');
    }

    /**
     * Handle user logout and revoke current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'Logout berhasil.');
    }

    /**
     * Update current authenticated user profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
        ]);

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'phone' => $user->phone,
        ], 'Profil pengguna berhasil diperbarui.');
    }

    /**
     * Change current authenticated user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6'],
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return $this->errorResponse('Kata sandi saat ini tidak cocok.', 422);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return $this->successResponse(null, 'Kata sandi berhasil diubah.');
    }
}
