<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaxAndFee;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaxAndFeeController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of taxes and fees.
     */
    public function index(Request $request): JsonResponse
    {
        $query = TaxAndFee::query();

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($type = $request->query('type')) {
            $query->where('type', strtoupper($type));
        }

        if ($request->has('is_tax')) {
            $isTax = filter_var($request->query('is_tax'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_tax', $isTax);
        }

        if ($applyTo = $request->query('apply_to')) {
            $query->where('apply_to', strtoupper($applyTo));
        }

        if ($request->has('is_active')) {
            $isActive = filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $isActive);
        }

        $items = $query->orderBy('is_tax', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        return $this->successResponse($items, 'Daftar pajak dan biaya berhasil diambil.');
    }

    /**
     * Store a newly created tax or fee.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:PERCENTAGE,FIXED'],
            'value' => ['required', 'numeric', 'min:0'],
            'apply_to' => ['required', 'string', 'in:ALL,SPECIFIC_PAYMENT,TAKEAWAY_ONLY,MANUAL'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'is_tax' => ['required', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $item = TaxAndFee::create([
            'name' => trim($validated['name']),
            'type' => $validated['type'],
            'value' => $validated['value'],
            'apply_to' => $validated['apply_to'],
            'payment_method' => $validated['payment_method'] ?? null,
            'is_tax' => $validated['is_tax'],
            'is_default' => $validated['is_default'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
        ]);

        return $this->successResponse($item, 'Komponen pajak/biaya berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified tax or fee.
     */
    public function show(string $id): JsonResponse
    {
        $item = TaxAndFee::find($id);

        if (! $item) {
            return $this->errorResponse('Komponen pajak/biaya tidak ditemukan.', 404);
        }

        return $this->successResponse($item, 'Detail komponen pajak/biaya berhasil diambil.');
    }

    /**
     * Update the specified tax or fee.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $item = TaxAndFee::find($id);

        if (! $item) {
            return $this->errorResponse('Komponen pajak/biaya tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'in:PERCENTAGE,FIXED'],
            'value' => ['sometimes', 'required', 'numeric', 'min:0'],
            'apply_to' => ['sometimes', 'required', 'string', 'in:ALL,SPECIFIC_PAYMENT,TAKEAWAY_ONLY,MANUAL'],
            'payment_method' => ['nullable', 'string', 'max:50'],
            'is_tax' => ['sometimes', 'required', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $item->update($validated);

        return $this->successResponse($item, 'Komponen pajak/biaya berhasil diperbarui.');
    }

    /**
     * Remove the specified tax or fee (Soft Delete).
     */
    public function destroy(string $id): JsonResponse
    {
        $item = TaxAndFee::find($id);

        if (! $item) {
            return $this->errorResponse('Komponen pajak/biaya tidak ditemukan.', 404);
        }

        $name = $item->name;
        $item->delete();

        return $this->successResponse(null, "Komponen \"{$name}\" berhasil dihapus.");
    }

    /**
     * Toggle status active/inactive.
     */
    public function toggleStatus(string $id): JsonResponse
    {
        $item = TaxAndFee::find($id);

        if (! $item) {
            return $this->errorResponse('Komponen pajak/biaya tidak ditemukan.', 404);
        }

        $item->is_active = ! $item->is_active;
        $item->save();

        $statusText = $item->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return $this->successResponse($item, "Komponen berhasil {$statusText}.");
    }
}
