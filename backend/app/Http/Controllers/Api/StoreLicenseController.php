<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LicenseService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class StoreLicenseController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected LicenseService $licenseService
    ) {}

    /**
     * Get current store subscription and license status.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $store = $user->store;

        if (! $store) {
            return $this->errorResponse('Data toko tidak ditemukan.', 404);
        }

        $daysRemaining = null;
        if ($store->isTrial() && $store->trial_ends_at) {
            $diff = now()->diffInSeconds($store->trial_ends_at, false);
            $daysRemaining = max(0, (int) ceil($diff / 86400));
        } elseif ($store->isActive() && $store->subscription_expires_at) {
            $diff = now()->diffInSeconds($store->subscription_expires_at, false);
            $daysRemaining = max(0, (int) ceil($diff / 86400));
        }

        $data = [
            'store_id' => $store->id,
            'store_name' => $store->name,
            'subscription_status' => $store->subscription_status,
            'is_active' => $store->isActive(),
            'is_trial' => $store->isTrial(),
            'is_expired' => $store->isExpired(),
            'trial_ends_at' => $store->trial_ends_at?->toIso8601String(),
            'activated_at' => $store->activated_at?->toIso8601String(),
            'subscription_expires_at' => $store->subscription_expires_at?->toIso8601String(),
            'license_key' => $store->license_key,
            'days_remaining' => $daysRemaining,
        ];

        return $this->successResponse($data, 'Status lisensi toko berhasil diambil.');
    }

    /**
     * Activate store license using serial key.
     */
    public function activate(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'owner') {
            return $this->errorResponse('Hanya pemilik toko (owner) yang memiliki akses untuk mengaktifkan lisensi.', 403);
        }

        $store = $user->store;
        if (! $store) {
            return $this->errorResponse('Data toko tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'license_key' => ['required', 'string', 'min:6', 'max:64'],
        ], [
            'license_key.required' => 'Kode lisensi wajib diisi.',
            'license_key.min' => 'Kode lisensi terlalu pendek.',
            'license_key.max' => 'Kode lisensi melebihi panjang maksimum.',
        ]);

        try {
            $result = $this->licenseService->activateLicense($store, $user, $validated['license_key']);

            $daysRemaining = null;
            if ($result['store']->isActive() && $result['store']->subscription_expires_at) {
                $diff = now()->diffInSeconds($result['store']->subscription_expires_at, false);
                $daysRemaining = max(0, (int) ceil($diff / 86400));
            }

            $data = [
                'store' => [
                    'id' => $result['store']->id,
                    'name' => $result['store']->name,
                    'subscription_status' => $result['store']->subscription_status,
                    'is_active' => $result['store']->isActive(),
                    'is_trial' => $result['store']->isTrial(),
                    'is_expired' => $result['store']->isExpired(),
                    'trial_ends_at' => $result['store']->trial_ends_at?->toIso8601String(),
                    'activated_at' => $result['store']->activated_at?->toIso8601String(),
                    'subscription_expires_at' => $result['store']->subscription_expires_at?->toIso8601String(),
                    'license_key' => $result['store']->license_key,
                    'days_remaining' => $daysRemaining,
                ],
                'license' => [
                    'license_key' => $result['license']->license_key,
                    'duration_type' => $result['license']->duration_type,
                    'duration_days' => $result['license']->duration_days,
                    'redeemed_at' => $result['license']->redeemed_at?->toIso8601String(),
                ],
            ];

            return $this->successResponse($data, 'Lisensi KasirKita PRO berhasil diaktifkan!');
        } catch (InvalidArgumentException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
