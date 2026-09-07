<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppInstallation;
use App\Models\StoreSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AppTelemetryController extends Controller
{
    /**
     * Record an installation / heartbeat ping from a mobile or web client.
     * Public endpoint: Accessible by any client without authentication.
     */
    public function ping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'installation_id' => ['required', 'string', 'max:64'],
            'device_model' => ['nullable', 'string', 'max:100'],
            'brand' => ['nullable', 'string', 'max:50'],
            'os_name' => ['nullable', 'string', 'max:30'],
            'os_version' => ['nullable', 'string', 'max:50'],
            'app_version' => ['nullable', 'string', 'max:20'],
            'app_version_code' => ['nullable', 'integer', 'min:1'],
            'metadata' => ['nullable', 'array'],
        ]);

        $installationId = trim($validated['installation_id']);
        $now = now();
        $ip = $request->ip();
        $userId = $request->user()?->id;

        $installation = AppInstallation::where('installation_id', $installationId)->first();

        if (! $installation) {
            // First-time activation / new installation
            $installation = AppInstallation::create([
                'installation_id' => $installationId,
                'device_model' => $validated['device_model'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'os_name' => $validated['os_name'] ?? 'Android',
                'os_version' => $validated['os_version'] ?? null,
                'app_version' => $validated['app_version'] ?? '1.3.1',
                'app_version_code' => $validated['app_version_code'] ?? null,
                'ip_address' => $ip,
                'first_installed_at' => $now,
                'last_active_at' => $now,
                'total_pings' => 1,
                'user_id' => $userId,
                'metadata' => $validated['metadata'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Instalasi baru berhasil dicatat.',
                'data' => [
                    'is_new' => true,
                    'installation_id' => $installation->installation_id,
                    'first_installed_at' => $installation->first_installed_at->toIso8601String(),
                ],
            ], 201);
        }

        // Existing device returning (heartbeat / active user session)
        $updateData = [
            'last_active_at' => $now,
            'total_pings' => $installation->total_pings + 1,
            'ip_address' => $ip,
        ];

        if (! empty($validated['device_model'])) {
            $updateData['device_model'] = $validated['device_model'];
        }
        if (! empty($validated['brand'])) {
            $updateData['brand'] = $validated['brand'];
        }
        if (! empty($validated['os_name'])) {
            $updateData['os_name'] = $validated['os_name'];
        }
        if (! empty($validated['os_version'])) {
            $updateData['os_version'] = $validated['os_version'];
        }
        if (! empty($validated['app_version'])) {
            $updateData['app_version'] = $validated['app_version'];
        }
        if (! empty($validated['app_version_code'])) {
            $updateData['app_version_code'] = $validated['app_version_code'];
        }
        if ($userId) {
            $updateData['user_id'] = $userId;
        }
        if (isset($validated['metadata'])) {
            $updateData['metadata'] = array_merge($installation->metadata ?? [], $validated['metadata']);
        }

        $installation->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Sinyal keaktifan perangkat berhasil diperbarui.',
            'data' => [
                'is_new' => false,
                'installation_id' => $installation->installation_id,
                'total_pings' => $installation->total_pings,
                'last_active_at' => $installation->last_active_at->toIso8601String(),
            ],
        ]);
    }

    /**
     * Download counter & redirect endpoint for KasirKita APK.
     * Accessible by public without auth.
     */
    public function download(Request $request): RedirectResponse|JsonResponse
    {
        $setting = StoreSetting::first();
        $versionData = $setting ? $setting->app_version : config('app_version', StoreSetting::DEFAULT_APP_VERSION);
        $apkUrl = $versionData['apk_url'] ?? null;

        if (empty($apkUrl)) {
            return response()->json([
                'success' => false,
                'message' => 'Berkas APK belum dikonfigurasi di server.',
            ], 404);
        }

        // Log the download event for telemetry
        Log::info('KasirKita APK download requested', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'apk_url' => $apkUrl,
            'time' => now()->toIso8601String(),
        ]);

        return redirect()->away($apkUrl, 302);
    }
}
