<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DiscountController extends Controller
{
    use ApiResponse;

    /**
     * Display listing of discounts with search and filter.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Discount::withCount('transactions');

        // Search by code or name
        if ($search = $request->query('search')) {
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('code', $operator, "%{$search}%")
                    ->orWhere('name', $operator, "%{$search}%")
                    ->orWhere('description', $operator, "%{$search}%");
            });
        }

        // Filter by discount type
        if ($type = $request->query('type')) {
            $query->where('type', strtoupper($type));
        }

        // Filter by status (active, expired, inactive)
        if ($status = $request->query('status')) {
            $status = strtolower($status);
            if ($status === 'active') {
                $query->active();
            } elseif ($status === 'inactive') {
                $query->where('is_active', false);
            } elseif ($status === 'expired') {
                $query->where(function ($q) {
                    $q->where('end_date', '<', now())
                        ->orWhere(function ($q2) {
                            $q2->whereNotNull('quota')
                                ->whereColumn('usage_count', '>=', 'quota');
                        });
                });
            }
        }

        if ($request->boolean('all')) {
            $discounts = $query->orderBy('created_at', 'desc')->get();
            return $this->successResponse($discounts, 'Daftar semua promosi berhasil diambil.');
        }

        $discounts = $query->orderBy('created_at', 'desc')->paginate(15);

        return $this->successResponse($discounts, 'Daftar promosi dan diskon berhasil diambil.');
    }

    /**
     * Store a newly created discount.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', 'unique:discounts,code'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:PERCENTAGE,FIXED,MIN_SPEND'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_purchase_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'quota' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $discount = Discount::create([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_purchase_amount' => $validated['min_purchase_amount'] ?? 0,
            'max_discount_amount' => $validated['max_discount_amount'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'quota' => $validated['quota'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return $this->successResponse($discount, 'Master promosi berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified discount details.
     */
    public function show(string $id): JsonResponse
    {
        $discount = Discount::withCount('transactions')
            ->with(['transactions' => function ($q) {
                $q->select('id', 'invoice_number', 'discount_id', 'discount_amount', 'total_amount', 'created_at')
                    ->orderBy('created_at', 'desc')
                    ->limit(5);
            }])
            ->find($id);

        if (! $discount) {
            return $this->errorResponse('Promosi tidak ditemukan.', 404);
        }

        return $this->successResponse($discount, 'Detail promosi berhasil diambil.');
    }

    /**
     * Update the specified discount.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $discount = Discount::find($id);

        if (! $discount) {
            return $this->errorResponse('Promosi tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:50', "unique:discounts,code,{$id}"],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type' => ['required', 'string', 'in:PERCENTAGE,FIXED,MIN_SPEND'],
            'value' => ['required', 'numeric', 'min:0'],
            'min_purchase_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'quota' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['required', 'boolean'],
        ]);

        $discount->update([
            'code' => strtoupper(trim($validated['code'])),
            'name' => trim($validated['name']),
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'],
            'value' => $validated['value'],
            'min_purchase_amount' => $validated['min_purchase_amount'] ?? 0,
            'max_discount_amount' => $validated['max_discount_amount'] ?? null,
            'start_date' => $validated['start_date'] ?? null,
            'end_date' => $validated['end_date'] ?? null,
            'quota' => $validated['quota'] ?? null,
            'is_active' => $validated['is_active'],
        ]);

        return $this->successResponse($discount, 'Data promosi berhasil diperbarui.');
    }

    /**
     * Remove the specified discount (Soft Delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $discount = Discount::find($id);

        if (! $discount) {
            return $this->errorResponse('Promosi tidak ditemukan.', 404);
        }

        $discount->delete();

        return $this->successResponse(null, 'Promosi berhasil dihapus.');
    }

    /**
     * Toggle discount active status.
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $discount = Discount::find($id);

        if (! $discount) {
            return $this->errorResponse('Promosi tidak ditemukan.', 404);
        }

        $discount->is_active = ! $discount->is_active;
        $discount->save();

        $statusText = $discount->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return $this->successResponse($discount, "Promosi berhasil {$statusText}.");
    }

    /**
     * Check voucher code validity and calculate discount for POS checkout cart.
     */
    public function checkVoucher(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
            'subtotal' => ['required', 'numeric', 'min:0'],
        ]);

        $code = strtoupper(trim($validated['code']));
        $subtotal = (float) $validated['subtotal'];

        /** @var Discount|null $discount */
        $discount = Discount::where('code', $code)->first();

        if (! $discount) {
            return $this->errorResponse("Kode voucher '{$code}' tidak ditemukan.", 404);
        }

        if (! $discount->is_active) {
            return $this->errorResponse("Voucher '{$discount->name}' sedang dinonaktifkan.", 422);
        }

        if ($discount->isExpired()) {
            return $this->errorResponse("Voucher '{$discount->name}' telah kadaluarsa atau belum berlaku.", 422);
        }

        if ($discount->isQuotaExceeded()) {
            return $this->errorResponse("Kuota penukaran voucher '{$discount->name}' telah habis.", 422);
        }

        if ($subtotal < (float) $discount->min_purchase_amount) {
            $minRp = 'Rp' . number_format($discount->min_purchase_amount, 0, ',', '.');
            return $this->errorResponse("Minimal transaksi untuk menggunakan voucher ini adalah {$minRp}.", 422);
        }

        $discountAmount = $discount->calculateDiscount($subtotal);

        return $this->successResponse([
            'valid' => true,
            'discount_id' => $discount->id,
            'discount_code' => $discount->code,
            'discount_name' => $discount->name,
            'discount_type' => $discount->type,
            'discount_value' => (float) $discount->value,
            'discount_amount' => $discountAmount,
            'final_amount' => max(0, $subtotal - $discountAmount),
        ], "Voucher '{$discount->name}' berhasil diterapkan!");
    }
}
