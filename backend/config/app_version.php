<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Mobile App Version & In-App Remote Updater Configuration
    |--------------------------------------------------------------------------
    |
    | Default values for KasirKita POS Mobile client updates.
    | These values serve as a fallback when database store_settings.app_version
    | is not yet configured. Can be overridden via .env or Render dashboard.
    |
    */

    'latest_version' => env('APP_LATEST_VERSION', '1.3.0'),
    'latest_version_code' => (int) env('APP_LATEST_VERSION_CODE', 130),
    'min_supported_version' => env('APP_MIN_SUPPORTED_VERSION', '1.0.0'),
    'apk_url' => env('APP_APK_URL', null),
    'apk_size_bytes' => (int) env('APP_APK_SIZE_BYTES', 0),
    'changelog' => env('APP_CHANGELOG')
        ? array_filter(array_map('trim', explode(';', env('APP_CHANGELOG'))))
        : [
            'Pembaruan sistem dan perbaikan performa kasir',
        ],
    'release_date' => env('APP_RELEASE_DATE', '2026-09-06'),
    'is_mandatory' => filter_var(env('APP_IS_MANDATORY', false), FILTER_VALIDATE_BOOLEAN),
];
