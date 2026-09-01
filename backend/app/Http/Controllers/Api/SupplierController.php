<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of suppliers with aggregated metrics.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::withCount('stockMovements as restocks_count')
            ->withSum(['cashFlows as total_purchases' => function ($q) {
                $q->where('category', 'PURCHASE');
            }], 'amount');

        // Search by company name, contact person, or phone
        if ($search = $request->query('search')) {
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('name', $operator, "%{$search}%")
                    ->orWhere('contact_person', $operator, "%{$search}%")
                    ->orWhere('phone', $operator, "%{$search}%")
                    ->orWhere('email', $operator, "%{$search}%");
            });
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Dropdown listing without pagination
        if ($request->boolean('all')) {
            $suppliers = $query->orderBy('name', 'asc')->get();
            return $this->successResponse($suppliers, 'Daftar semua pemasok berhasil diambil.');
        }

        $suppliers = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->successResponse($suppliers, 'Daftar pemasok berhasil diambil.');
    }

    /**
     * Store a newly created supplier.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account' => ['nullable', 'string', 'max:100'],
            'bank_holder' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['is_active'] = $validated['is_active'] ?? true;

        $supplier = Supplier::create($validated);

        return $this->successResponse($supplier, 'Pemasok berhasil didaftarkan.', 201);
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $id): JsonResponse
    {
        $supplier = Supplier::withCount('stockMovements as restocks_count')
            ->withSum(['cashFlows as total_purchases' => function ($q) {
                $q->where('category', 'PURCHASE');
            }], 'amount')
            ->with(['stockMovements' => function ($q) {
                $q->with('product:id,name,sku_barcode')
                    ->orderBy('created_at', 'desc')
                    ->limit(10);
            }])
            ->find($id);

        if (! $supplier) {
            return $this->errorResponse('Pemasok tidak ditemukan.', 404);
        }

        return $this->successResponse($supplier, 'Detail pemasok berhasil diambil.');
    }

    /**
     * Update the specified supplier.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (! $supplier) {
            return $this->errorResponse('Pemasok tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string', 'max:100'],
            'bank_account' => ['nullable', 'string', 'max:100'],
            'bank_holder' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $supplier->update($validated);

        return $this->successResponse($supplier, 'Data pemasok berhasil diperbarui.');
    }

    /**
     * Remove the specified supplier (Soft Delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (! $supplier) {
            return $this->errorResponse('Pemasok tidak ditemukan.', 404);
        }

        $supplier->delete();

        return $this->successResponse(null, 'Pemasok berhasil dihapus.');
    }

    /**
     * Get restock supply and cash flow history for a supplier.
     */
    public function history(Request $request, string $id): JsonResponse
    {
        $supplier = Supplier::find($id);

        if (! $supplier) {
            return $this->errorResponse('Pemasok tidak ditemukan.', 404);
        }

        $movements = $supplier->stockMovements()
            ->with(['product:id,name,sku_barcode', 'user:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse($movements, 'Riwayat pasokan barang berhasil diambil.');
    }
}
