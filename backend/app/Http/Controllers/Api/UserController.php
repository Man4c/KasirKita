<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of staff and users with transaction metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::withCount('transactions as transactions_count')
            ->withSum(['transactions as total_sales' => function ($q) {
                $q->where('payment_status', 'COMPLETED');
            }], 'total_amount');

        // Search by name, email, or phone
        if ($search = $request->query('search')) {
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('name', $operator, "%{$search}%")
                    ->orWhere('email', $operator, "%{$search}%")
                    ->orWhere('phone', $operator, "%{$search}%");
            });
        }

        // Filter by role (owner, cashier)
        if ($role = $request->query('role')) {
            $query->where('role', strtolower($role));
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->boolean('all')) {
            $users = $query->orderBy('role', 'asc')->orderBy('name', 'asc')->get();
            return $this->successResponse($users, 'Daftar semua pengguna berhasil diambil.');
        }

        $users = $query->orderBy('role', 'asc')->orderBy('created_at', 'desc')->paginate(15);

        return $this->successResponse($users, 'Daftar staf dan pengguna berhasil diambil.');
    }

    /**
     * Store a newly created user / cashier account.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:owner,cashier'],
            'password' => ['required', 'string', 'min:6'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->successResponse($user, 'Akun staf berhasil dibuat.', 201);
    }

    /**
     * Display the specified user details and sales performance.
     */
    public function show(string $id): JsonResponse
    {
        $user = User::withCount('transactions as transactions_count')
            ->withSum(['transactions as total_sales' => function ($q) {
                $q->where('payment_status', 'COMPLETED');
            }], 'total_amount')
            ->with(['transactions' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(5);
            }])
            ->find($id);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        return $this->successResponse($user, 'Detail pengguna berhasil diambil.');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', "unique:users,email,{$id}"],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:owner,cashier'],
            'is_active' => ['required', 'boolean'],
        ]);

        // Self-lockout protection
        if ($request->user()->id === $user->id) {
            if (! $validated['is_active']) {
                return $this->errorResponse('Anda tidak dapat menonaktifkan akun Anda sendiri.', 400);
            }
            if ($validated['role'] !== 'owner') {
                return $this->errorResponse('Anda tidak dapat mengubah peran akun Anda sendiri.', 400);
            }
        }

        $user->update([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
            'is_active' => $validated['is_active'],
        ]);

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return $this->successResponse($user, 'Data pengguna berhasil diperbarui.');
    }

    /**
     * Remove the specified user (Soft Delete).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        // Self-lockout protection
        if ($request->user()->id === $user->id) {
            return $this->errorResponse('Anda tidak dapat menghapus akun Anda sendiri.', 400);
        }

        // Prevent deleting the sole remaining owner
        if ($user->isOwner() && User::where('role', 'owner')->count() <= 1) {
            return $this->errorResponse('Tidak dapat menghapus satu-satunya akun pemilik toko.', 400);
        }

        // Revoke tokens and soft delete
        $user->tokens()->delete();
        $user->delete();

        return $this->successResponse(null, 'Akun staf berhasil dihapus.');
    }

    /**
     * Reset staff password and revoke active session tokens.
     */
    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'new_password' => ['required', 'string', 'min:6'],
        ]);

        $user->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        // Revoke old tokens so cashier is required to re-login with new password
        $user->tokens()->delete();

        return $this->successResponse(null, 'Kata sandi berhasil direset. Sesi staf telah dicabut untuk keamanan.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $user = User::find($id);

        if (! $user) {
            return $this->errorResponse('Pengguna tidak ditemukan.', 404);
        }

        // Self-lockout protection
        if ($request->user()->id === $user->id) {
            return $this->errorResponse('Anda tidak dapat mengubah status aktif akun Anda sendiri.', 400);
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return $this->successResponse($user, "Akun staf berhasil {$statusText}.");
    }
}
