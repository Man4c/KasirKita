<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppVersionController extends Controller
{
    /**
     * Get the latest mobile app version metadata.
     * Public endpoint: Accessible by any client without authentication.
     */
    public function getVersion(): JsonResponse
    {
        $setting = StoreSetting::first();
        $versionData = $setting ? $setting->app_version : config('app_version', StoreSetting::DEFAULT_APP_VERSION);

        return response()->json([
            'success' => true,
            'data' => $versionData,
        ]);
    }

    /**
     * Update mobile app version and release information.
     * Restricted to Owner role via Sanctum middleware.
     */
    public function updateVersion(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latest_version' => ['required', 'string', 'max:20', 'regex:/^\d+\.\d+\.\d+$/'],
            'latest_version_code' => ['nullable', 'integer', 'min:1'],
            'min_supported_version' => ['nullable', 'string', 'max:20'],
            'apk_url' => ['required', 'url', 'max:500'],
            'apk_size_bytes' => ['nullable', 'integer', 'min:0'],
            'changelog' => ['required', 'array', 'min:1'],
            'changelog.*' => ['string', 'max:255'],
            'release_date' => ['nullable', 'date_format:Y-m-d'],
            'is_mandatory' => ['nullable', 'boolean'],
        ], [
            'latest_version.regex' => 'Format versi harus SemVer valid (contoh: 1.4.0).',
            'apk_url.url' => 'Tautan unduhan APK harus berupa URL yang valid.',
            'changelog.required' => 'Catatan perubahan (changelog) wajib diisi minimal 1 poin.',
        ]);

        if (empty($validated['release_date'])) {
            $validated['release_date'] = now()->toDateString();
        }

        if (!isset($validated['is_mandatory'])) {
            $validated['is_mandatory'] = false;
        }

        if (empty($validated['latest_version_code'])) {
            $parts = explode('.', $validated['latest_version']);
            $validated['latest_version_code'] = (int) sprintf('%d%02d%02d', $parts[0] ?? 1, $parts[1] ?? 0, $parts[2] ?? 0);
        }

        $setting = StoreSetting::firstOrCreate([], [
            'name' => 'KasirKita POS',
        ]);

        $setting->update([
            'app_version' => $validated,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Versi aplikasi berhasil diperbarui.',
            'data' => $setting->fresh()->app_version,
        ]);
    }
}
