<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LicenseKey;
use App\Models\Store;
use App\Services\LicenseService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminController extends Controller
{
    /**
     * Get platform overview analytics & statistics for superadmin.
     */
    public function stats(): JsonResponse
    {
        $now = now();

        $totalStores = Store::count();

        $trialStores = Store::where('subscription_status', 'trial')
            ->where(function ($query) use ($now) {
                $query->whereNull('trial_ends_at')
                    ->orWhere('trial_ends_at', '>=', $now);
            })
            ->count();

        $activeStores = Store::where('subscription_status', 'active')
            ->where(function ($query) use ($now) {
                $query->whereNull('subscription_expires_at')
                    ->orWhere('subscription_expires_at', '>=', $now);
            })
            ->count();

        // Expired count: explicitly expired, or trial/active that passed due date
        $expiredStores = Store::where(function ($query) use ($now) {
            $query->where('subscription_status', 'expired')
                ->orWhere(function ($q) use ($now) {
                    $q->where('subscription_status', 'trial')
                        ->whereNotNull('trial_ends_at')
                        ->where('trial_ends_at', '<', $now);
                })
                ->orWhere(function ($q) use ($now) {
                    $q->where('subscription_status', 'active')
                        ->whereNotNull('subscription_expires_at')
                        ->where('subscription_expires_at', '<', $now);
                });
        })->count();

        $totalLicenses = LicenseKey::count();
        $availableLicenses = LicenseKey::where('status', 'available')->count();
        $redeemedLicenses = LicenseKey::where('status', 'redeemed')->count();
        $revokedLicenses = LicenseKey::where('status', 'revoked')->count();

        return response()->json([
            'success' => true,
            'message' => 'Statistik platform superadmin berhasil dimuat.',
            'data' => [
                'total_stores' => $totalStores,
                'trial_stores' => $trialStores,
                'active_stores' => $activeStores,
                'expired_stores' => $expiredStores,
                'licenses' => [
                    'total' => $totalLicenses,
                    'available' => $availableLicenses,
                    'redeemed' => $redeemedLicenses,
                    'revoked' => $revokedLicenses,
                ],
            ],
        ]);
    }

    /**
     * Get paginated and filterable list of stores.
     */
    public function stores(Request $request): JsonResponse
    {
        $now = now();
        $query = Store::query()
            ->with(['owner:id,name,email,phone'])
            ->withCount(['users', 'products', 'transactions']);

        // Search
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('license_key', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($ownerQuery) use ($search) {
                        $ownerQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        // Filter status
        if ($status = $request->query('status')) {
            if ($status === 'trial') {
                $query->where('subscription_status', 'trial')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('trial_ends_at')->orWhere('trial_ends_at', '>=', $now);
                    });
            } elseif ($status === 'active') {
                $query->where('subscription_status', 'active')
                    ->where(function ($q) use ($now) {
                        $q->whereNull('subscription_expires_at')->orWhere('subscription_expires_at', '>=', $now);
                    });
            } elseif ($status === 'expired') {
                $query->where(function ($q) use ($now) {
                    $q->where('subscription_status', 'expired')
                        ->orWhere(function ($sub) use ($now) {
                            $sub->where('subscription_status', 'trial')
                                ->whereNotNull('trial_ends_at')
                                ->where('trial_ends_at', '<', $now);
                        })
                        ->orWhere(function ($sub) use ($now) {
                            $sub->where('subscription_status', 'active')
                                ->whereNotNull('subscription_expires_at')
                                ->where('subscription_expires_at', '<', $now);
                        });
                });
            }
        }

        // Filter business type
        if ($businessType = $request->query('business_type')) {
            if ($businessType !== 'all') {
                $query->where('business_type', $businessType);
            }
        }

        $perPage = min((int) ($request->query('per_page', 20)), 100);
        $paginated = $query->latest()->paginate($perPage);

        $items = collect($paginated->items())->map(function (Store $store) use ($now) {
            $daysRemaining = null;
            if ($store->subscription_status === 'trial' && $store->trial_ends_at) {
                $daysRemaining = $now->diffInDays($store->trial_ends_at, false);
            } elseif ($store->subscription_status === 'active') {
                if ($store->subscription_expires_at) {
                    $daysRemaining = $now->diffInDays($store->subscription_expires_at, false);
                } else {
                    $daysRemaining = 9999; // Lifetime
                }
            }

            return [
                'id' => $store->id,
                'name' => $store->name,
                'business_type' => $store->business_type,
                'phone' => $store->phone,
                'address' => $store->address,
                'subscription_status' => $store->subscription_status,
                'trial_ends_at' => $store->trial_ends_at?->toIso8601String(),
                'activated_at' => $store->activated_at?->toIso8601String(),
                'subscription_expires_at' => $store->subscription_expires_at?->toIso8601String(),
                'license_key' => $store->license_key,
                'notes' => $store->notes,
                'created_at' => $store->created_at?->toIso8601String(),
                'is_active' => $store->isActive(),
                'is_trial' => $store->isTrial(),
                'is_expired' => $store->isExpired(),
                'days_remaining' => $daysRemaining !== null ? (int) ceil($daysRemaining) : null,
                'owner' => $store->owner ? [
                    'id' => $store->owner->id,
                    'name' => $store->owner->name,
                    'email' => $store->owner->email,
                    'phone' => $store->owner->phone,
                ] : null,
                'users_count' => $store->users_count,
                'products_count' => $store->products_count,
                'transactions_count' => $store->transactions_count,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Daftar toko berhasil dimuat.',
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Directly activate a store subscription (Door-to-door sales cash activation).
     */
    public function activateStore(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'duration_type' => ['required', 'string', 'in:lifetime,1_year,6_months,1_month,custom'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $store = Store::findOrFail($id);

        $now = now();
        $expiresAt = match ($validated['duration_type']) {
            'lifetime' => null,
            '1_year' => $now->copy()->addYear(),
            '6_months' => $now->copy()->addMonths(6),
            '1_month' => $now->copy()->addMonth(),
            'custom' => $now->copy()->addDays($validated['duration_days'] ?? 365),
        };

        $store->update([
            'subscription_status' => 'active',
            'activated_at' => $now,
            'subscription_expires_at' => $expiresAt,
            'notes' => $validated['notes'] ? trim(($store->notes ? $store->notes . "\n" : '') . "[{$now->format('Y-m-d')} Aktivasi Manual]: " . $validated['notes']) : $store->notes,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Toko '{$store->name}' berhasil diaktifkan menjadi status Pro Aktif.",
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'subscription_status' => $store->subscription_status,
                'activated_at' => $store->activated_at?->toIso8601String(),
                'subscription_expires_at' => $store->subscription_expires_at?->toIso8601String(),
                'is_active' => $store->isActive(),
            ],
        ]);
    }

    /**
     * Extend a store's trial period.
     */
    public function extendTrial(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'days' => ['nullable', 'integer', 'min:1', 'max:90'],
        ]);

        $days = $validated['days'] ?? 14;
        $store = Store::findOrFail($id);

        $baseDate = ($store->trial_ends_at && $store->trial_ends_at->isFuture())
            ? $store->trial_ends_at
            : now();

        $newTrialEnd = $baseDate->copy()->addDays($days);

        $store->update([
            'subscription_status' => 'trial',
            'trial_ends_at' => $newTrialEnd,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Masa trial toko '{$store->name}' berhasil diperpanjang sebanyak {$days} hari hingga {$newTrialEnd->format('d M Y')}.",
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'subscription_status' => $store->subscription_status,
                'trial_ends_at' => $store->trial_ends_at?->toIso8601String(),
                'is_active' => $store->isActive(),
            ],
        ]);
    }

    /**
     * Toggle or manually set store status (active/trial/expired).
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:active,trial,expired'],
        ]);

        $store = Store::findOrFail($id);
        $newStatus = $validated['status'];

        $updateData = ['subscription_status' => $newStatus];
        if ($newStatus === 'active' && ! $store->activated_at) {
            $updateData['activated_at'] = now();
        }

        $store->update($updateData);

        return response()->json([
            'success' => true,
            'message' => "Status toko '{$store->name}' berhasil diubah menjadi '{$newStatus}'.",
            'data' => [
                'id' => $store->id,
                'name' => $store->name,
                'subscription_status' => $store->subscription_status,
                'is_active' => $store->isActive(),
                'is_expired' => $store->isExpired(),
            ],
        ]);
    }

    /**
     * Get list of generated license keys with filters.
     */
    public function licenses(Request $request): JsonResponse
    {
        $query = LicenseKey::query()
            ->with([
                'redeemedByStore:id,name',
                'redeemedByUser:id,name,email',
            ]);

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('license_key', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        $perPage = min((int) ($request->query('per_page', 20)), 100);
        $paginated = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Daftar kode lisensi berhasil dimuat.',
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    /**
     * Generate new batch of license keys.
     */
    public function generateLicenses(Request $request, LicenseService $licenseService): JsonResponse
    {
        $validated = $request->validate([
            'count' => ['required', 'integer', 'min:1', 'max:50'],
            'duration_type' => ['required', 'string', 'in:lifetime,1_year,6_months,1_month,custom'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:3650'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $count = $validated['count'];
        $durationType = $validated['duration_type'];
        $durationDays = $validated['duration_days'] ?? null;
        $notes = $validated['notes'] ?? null;

        $keys = $licenseService->createBatch($count, $durationType, $durationDays, $notes);

        return response()->json([
            'success' => true,
            'message' => "Berhasil men-generate {$count} kode voucher lisensi baru.",
            'data' => $keys,
        ], 201);
    }

    /**
     * Revoke an unredeemed license key.
     */
    public function revokeLicense(string $id): JsonResponse
    {
        $licenseKey = LicenseKey::findOrFail($id);

        if ($licenseKey->status === 'redeemed') {
            return response()->json([
                'success' => false,
                'message' => 'Kode lisensi yang sudah diklaim oleh toko tidak dapat dicabut.',
            ], 400);
        }

        $licenseKey->update(['status' => 'revoked']);

        return response()->json([
            'success' => true,
            'message' => "Kode lisensi '{$licenseKey->license_key}' berhasil dicabut.",
            'data' => $licenseKey,
        ]);
    }
}
