<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureStoreActive
{
    /**
     * Handle an incoming request and ensure store subscription is active.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! empty($user->store_id)) {
            $store = $user->store;

            if ($store && $store->isExpired()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Masa uji coba atau langganan toko Anda telah berakhir. Silakan lakukan aktivasi lisensi untuk melanjutkan transaksi.',
                    'error_code' => 'STORE_SUBSCRIPTION_EXPIRED',
                    'data' => [
                        'store_id' => $store->id,
                        'store_name' => $store->name,
                        'subscription_status' => 'expired',
                        'trial_ends_at' => $store->trial_ends_at?->toIso8601String(),
                    ],
                ], 403);
            }
        }

        return $next($request);
    }
}
