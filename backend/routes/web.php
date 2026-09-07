<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'app' => 'KasirKita POS API',
        'status' => 'online',
        'version' => '1.3.0',
        'timestamp' => now()->toIso8601String(),
    ]);
});
