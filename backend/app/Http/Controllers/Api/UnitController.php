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
     * Remove the specified unit.
     */
    public function destroy(string $id): JsonResponse
    {
        $unit = Unit::withCount([
                'products',
                'conversions' => fn($q) => $q->whereHas('product'),
            ])->find($id);

        if (! $unit) {
            return $this->errorResponse('Satuan barang tidak ditemukan.', 404);
        }

        if ($unit->products_count > 0 || $unit->conversions_count > 0) {
            return $this->errorResponse('Satuan tidak dapat dihapus karena masih digunakan oleh produk aktif.', 422);
        }

        \App\Models\ProductUnitConversion::where('unit_id', $id)->delete();
        \App\Models\Product::withTrashed()->where('base_unit_id', $id)->update(['base_unit_id' => null]);

        $unit->delete();

        return $this->successResponse(null, 'Satuan barang berhasil dihapus.');
    }
}
