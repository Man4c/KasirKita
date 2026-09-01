<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of customers with aggregated metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::withCount('transactions')
            ->withSum('transactions as total_spent', 'total_amount');

        // Search by name or phone
        if ($search = $request->query('search')) {
            $operator = \Illuminate\Support\Facades\DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('name', $operator, "%{$search}%")
                    ->orWhere('phone', $operator, "%{$search}%")
                    ->orWhere('email', $operator, "%{$search}%");
            });
        }

        // Filter by membership_type
        if ($type = $request->query('membership_type')) {
            $query->where('membership_type', strtoupper($type));
        }

        // Filter active
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // If requesting all (for POS checkout dropdown)
        if ($request->boolean('all')) {
            $customers = $query->orderBy('name', 'asc')->get();
            return $this->successResponse($customers, 'Daftar semua pelanggan berhasil diambil.');
        }

        $customers = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->successResponse($customers, 'Daftar pelanggan berhasil diambil.');
    }

    /**
     * Store a newly created customer.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50', 'unique:customers,phone'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'membership_type' => ['nullable', 'string', 'in:REGULAR,VIP,WHOLESALE'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['membership_type'] = strtoupper($validated['membership_type'] ?? 'REGULAR');
        $validated['is_active'] = $validated['is_active'] ?? true;

        $customer = Customer::create($validated);

        return $this->successResponse($customer, 'Pelanggan berhasil didaftarkan.', 201);
    }

    /**
     * Display the specified customer.
     */
    public function show(string $id): JsonResponse
    {
        $customer = Customer::withCount('transactions')
            ->withSum('transactions as total_spent', 'total_amount')
            ->with(['transactions' => function ($q) {
                $q->orderBy('created_at', 'desc')->limit(10);
            }])
            ->find($id);

        if (! $customer) {
            return $this->errorResponse('Pelanggan tidak ditemukan.', 404);
        }

        return $this->successResponse($customer, 'Detail pelanggan berhasil diambil.');
    }

    /**
     * Update the specified customer.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (! $customer) {
            return $this->errorResponse('Pelanggan tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('customers', 'phone')->ignore($customer->id),
            ],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'membership_type' => ['nullable', 'string', 'in:REGULAR,VIP,WHOLESALE'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if (isset($validated['membership_type'])) {
            $validated['membership_type'] = strtoupper($validated['membership_type']);
        }

        $customer->update($validated);

        return $this->successResponse($customer, 'Data pelanggan berhasil diperbarui.');
    }

    /**
     * Remove the specified customer (Soft Delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (! $customer) {
            return $this->errorResponse('Pelanggan tidak ditemukan.', 404);
        }

        $customer->delete();

        return $this->successResponse(null, 'Pelanggan berhasil dihapus.');
    }

    /**
     * Get paginated transaction history for a specific customer.
     */
    public function transactions(Request $request, string $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (! $customer) {
            return $this->errorResponse('Pelanggan tidak ditemukan.', 404);
        }

        $transactions = $customer->transactions()
            ->with(['cashier:id,name,role', 'items'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse($transactions, 'Riwayat transaksi pelanggan berhasil diambil.');
    }
}
