<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isSuperAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Halaman ini hanya untuk Superadmin pengembang KasirKita.',
                'error_code' => 'SUPERADMIN_ACCESS_REQUIRED',
            ], 403);
        }

        return $next($request);
    }
}
