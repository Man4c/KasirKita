<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Unit;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnitController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of units with product counts.
     */
    public function index(): JsonResponse
    {
        $units = Unit::withCount([
                'products',
                'conversions' => fn($q) => $q->whereHas('product'),
            ])
            ->orderBy('name')
            ->get();

        return $this->successResponse($units, 'Daftar satuan barang berhasil diambil.');
    }

    /**
     * Store a newly created unit.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'symbol' => ['required', 'string', 'max:50', 'unique:units,symbol'],
            'description' => ['nullable', 'string'],
        ]);

        $unit = Unit::create($validated);

        return $this->successResponse($unit, 'Satuan barang berhasil dibuat.', 201);
    }

    /**
     * Display the specified unit.
     */
    public function show(string $id): JsonResponse
    {
        $unit = Unit::withCount([
                'products',
                'conversions' => fn($q) => $q->whereHas('product'),
            ])->find($id);

        if (! $unit) {
            return $this->errorResponse('Satuan barang tidak ditemukan.', 404);
        }

        return $this->successResponse($unit, 'Detail satuan barang berhasil diambil.');
    }

    /**
     * Update the specified unit.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $unit = Unit::find($id);

        if (! $unit) {
            return $this->errorResponse('Satuan barang tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'symbol' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('units', 'symbol')->ignore($unit->id)],
            'description' => ['nullable', 'string'],
        ]);

        $unit->update($validated);

        return $this->successResponse($unit, 'Satuan barang berhasil diperbarui.');
    }

    /**
     * Remove the specified unit (with Smart Reassign & Soft Delete support).
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $unit = Unit::withCount([
                'products',
                'conversions' => fn($q) => $q->whereHas('product'),
            ])->find($id);

        if (! $unit) {
            return $this->errorResponse('Satuan barang tidak ditemukan.', 404);
        }

        $totalUsage = $unit->products_count + $unit->conversions_count;

        if ($totalUsage > 0) {
            $action = $request->input('action');

            if ($action === 'reassign') {
                $targetUnitId = $request->input('target_unit_id');
                if (! $targetUnitId) {
                    return $this->errorResponse('Pilih satuan tujuan pengganti produk.', 422);
                }

                if ($targetUnitId === $unit->id) {
                    return $this->errorResponse('Satuan pengganti tidak boleh sama dengan satuan yang akan dihapus.', 422);
                }

                $targetUnit = Unit::find($targetUnitId);
                if (! $targetUnit) {
                    return $this->errorResponse('Satuan tujuan pengganti tidak ditemukan.', 404);
                }

                // 1. Reassign produk dasar yang menggunakan base_unit_id = $unit->id
                \App\Models\Product::where('base_unit_id', $unit->id)->update([
                    'base_unit_id' => $targetUnitId,
                ]);

                // 2. Tangani tabel konversi multi-satuan
                // Hapus entri konversi yang sudah ada duplikatnya di produk terkait dengan targetUnitId
                $existingProductIdsWithTarget = \App\Models\ProductUnitConversion::where('unit_id', $targetUnitId)
                    ->pluck('product_id');

                // Jika produk sudah memiliki konversi ke targetUnitId, hapus konversi unit lama
                \App\Models\ProductUnitConversion::where('unit_id', $unit->id)
                    ->whereIn('product_id', $existingProductIdsWithTarget)
                    ->delete();

                // Untuk produk yang belum memiliki konversi ke targetUnitId, alihkan ke targetUnitId
                \App\Models\ProductUnitConversion::where('unit_id', $unit->id)->update([
                    'unit_id' => $targetUnitId,
                ]);
            } else {
                return $this->errorResponse(
                    "Satuan \"{$unit->name}\" ({$unit->symbol}) masih digunakan oleh {$unit->products_count} produk dan {$unit->conversions_count} varian konversi. Harap tentukan satuan pengganti.",
                    422,
                    [
                        'products_count' => $unit->products_count,
                        'conversions_count' => $unit->conversions_count,
                        'requires_action' => true,
                    ]
                );
            }
        }

        // Hapus sisa referensi konversi jika ada
        \App\Models\ProductUnitConversion::where('unit_id', $id)->delete();

        // Soft Delete unit
        $unit->delete();

        return $this->successResponse(null, 'Satuan barang berhasil dihapus.');
    }
}
