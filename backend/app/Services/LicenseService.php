<?php

namespace App\Services;

use App\Models\LicenseKey;
use App\Models\Store;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;
use Throwable;

class LicenseService
{
    public function __construct(
        protected TelegramNotificationService $telegramService
    ) {}

    /**
     * Generate a cryptographically secure, collision-free serial key formatted as KK-PRO-XXXX-XXXX.
     * Uses Crockford-style Base32 characters (excluding 0, O, 1, I to avoid human transcription errors).
     */
    public function generateUniqueKeyString(): string
    {
        $pool = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        $poolLength = strlen($pool);

        do {
            $part1 = '';
            for ($i = 0; $i < 4; $i++) {
                $part1 .= $pool[random_int(0, $poolLength - 1)];
            }

            $part2 = '';
            for ($i = 0; $i < 4; $i++) {
                $part2 .= $pool[random_int(0, $poolLength - 1)];
            }

            $key = "KK-PRO-{$part1}-{$part2}";
        } while (LicenseKey::where('license_key', $key)->exists());

        return $key;
    }

    /**
     * Create a single new license key record.
     */
    public function createKey(string $durationType = 'lifetime', ?int $durationDays = null, ?string $notes = null): LicenseKey
    {
        if ($durationType === '1_year' && empty($durationDays)) {
            $durationDays = 365;
        } elseif ($durationType === '1_month' && empty($durationDays)) {
            $durationDays = 30;
        } elseif ($durationType === 'lifetime') {
            $durationDays = null;
        }

        return LicenseKey::create([
            'license_key' => $this->generateUniqueKeyString(),
            'status' => 'available',
            'duration_type' => $durationType,
            'duration_days' => $durationDays,
            'notes' => $notes,
        ]);
    }

    /**
     * Generate a batch of new license keys in a single transaction.
     *
     * @return array<LicenseKey>
     */
    public function createBatch(int $count = 1, string $durationType = 'lifetime', ?int $durationDays = null, ?string $notes = null): array
    {
        $count = max(1, min(100, $count)); // safety cap per generation

        return DB::transaction(function () use ($count, $durationType, $durationDays, $notes) {
            $keys = [];
            for ($i = 0; $i < $count; $i++) {
                $keys[] = $this->createKey($durationType, $durationDays, $notes);
            }
            return $keys;
        });
    }

    /**
     * Normalize user-typed license key string for forgiving human input:
     * Accepts "kk-pro-xxxx-xxxx", "KKPROXXXXXXXX", "XXXX-XXXX", or "XXXXXXXX".
     */
    public function normalizeKey(string $input): string
    {
        $clean = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $input));

        // Format 1: full string with prefix without dashes, e.g. "KKPROA8F29X3K" (13 chars)
        if (str_starts_with($clean, 'KKPRO') && strlen($clean) === 13) {
            return 'KK-PRO-' . substr($clean, 5, 4) . '-' . substr($clean, 9, 4);
        }

        // Format 2: raw 8 characters without prefix, e.g. "A8F29X3K"
        if (strlen($clean) === 8) {
            return 'KK-PRO-' . substr($clean, 0, 4) . '-' . substr($clean, 4, 4);
        }

        // Fallback: standard upper trimmed with proper single dash spacing if matched
        return strtoupper(trim($input));
    }

    /**
     * Activate a license key for a given store.
     *
     * @throws InvalidArgumentException
     * @return array{store: Store, license: LicenseKey}
     */
    public function activateLicense(Store $store, User $user, string $rawKey): array
    {
        $formattedKey = $this->normalizeKey($rawKey);

        return DB::transaction(function () use ($store, $user, $formattedKey) {
            /** @var LicenseKey|null $license */
            $license = LicenseKey::where('license_key', $formattedKey)
                ->lockForUpdate()
                ->first();

            if (! $license) {
                throw new InvalidArgumentException('Kode lisensi tidak valid atau tidak ditemukan.');
            }

            if ($license->isRedeemed()) {
                throw new InvalidArgumentException('Kode lisensi ini sudah pernah digunakan oleh toko lain.');
            }

            if ($license->isRevoked()) {
                throw new InvalidArgumentException('Kode lisensi ini telah dinonaktifkan.');
            }

            if (! $license->isAvailable()) {
                throw new InvalidArgumentException('Status kode lisensi tidak valid untuk aktivasi.');
            }

            $now = now();
            $subscriptionExpiresAt = null;

            if ($license->duration_type !== 'lifetime' && ! empty($license->duration_days)) {
                // If the store already has an active non-expired period, stack on top of it
                $baseDate = ($store->subscription_expires_at && $store->subscription_expires_at->isFuture())
                    ? $store->subscription_expires_at
                    : $now;

                $subscriptionExpiresAt = $baseDate->copy()->addDays($license->duration_days);
            }

            // 1. Mark license as redeemed
            $license->update([
                'status' => 'redeemed',
                'redeemed_by_store_id' => $store->id,
                'redeemed_by_user_id' => $user->id,
                'redeemed_at' => $now,
            ]);

            // 2. Activate store subscription
            $store->update([
                'subscription_status' => 'active',
                'license_key' => $license->license_key,
                'activated_at' => $now,
                'subscription_expires_at' => $subscriptionExpiresAt,
            ]);

            $store->refresh();

            // 3. Send fail-safe Telegram alert to app owner
            try {
                $this->telegramService->notifyLicenseActivated($store, $user, $license);
            } catch (Throwable $e) {
                Log::warning('Telegram alert license activation failed: ' . $e->getMessage());
            }

            return [
                'store' => $store,
                'license' => $license,
            ];
        });
    }
}
