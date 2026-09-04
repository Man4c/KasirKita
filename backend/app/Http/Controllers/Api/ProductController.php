<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductUnitConversion;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Services\InventoryService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Display a listing of products with search, category, UoM, and conversions.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'baseUnit', 'defaultPosUnit', 'conversions.unit']);

        // Search by name or barcode (matches base or conversion barcode)
        if ($search = $request->query('search')) {
            $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $operator) {
                $q->where('name', $operator, "%{$search}%")
                  ->orWhere('sku_barcode', $operator, "%{$search}%")
                  ->orWhereHas('conversions', function ($cq) use ($search, $operator) {
                      $cq->where('sku_barcode', $operator, "%{$search}%");
                  });
            });
        }

        // Filter by category
        if ($categoryId = $request->query('category_id')) {
            $query->where('category_id', $categoryId);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        // Filter by low stock
        if ($request->query('low_stock') === 'true') {
            $query->whereColumn('stock', '<=', 'min_stock');
        }

        // Sorting
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $allowedSorts = ['name', 'price', 'stock', 'avg_cost', 'created_at'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $perPage = (int) $request->query('per_page', 15);
        $products = $query->paginate($perPage);

        return $this->successResponse($products, 'Daftar produk berhasil diambil.');
    }

    /**
     * Store a newly created product with base unit and optional conversions.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'base_unit_id' => ['nullable', 'exists:units,id'],
            'default_pos_unit_id' => ['nullable', 'exists:units,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku_barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku_barcode')->whereNull('deleted_at'), 'unique:product_unit_conversions,sku_barcode'],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'avg_cost' => ['nullable', 'numeric', 'min:0'],
            'stock' => ['nullable', 'numeric', 'min:0'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'image_path' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'is_for_sale' => ['nullable', 'boolean'],
            'conversions' => ['nullable', 'array'],
            'conversions.*.unit_id' => ['required_with:conversions', 'exists:units,id'],
            'conversions.*.conversion_factor' => ['required_with:conversions', 'numeric', 'gt:0'],
            'conversions.*.price' => ['required_with:conversions', 'numeric', 'min:0'],
            'conversions.*.sku_barcode' => ['nullable', 'string', 'max:100', 'unique:product_unit_conversions,sku_barcode', Rule::unique('products', 'sku_barcode')->whereNull('deleted_at')],
            'conversions.*.is_default_pos' => ['nullable', 'boolean'],
        ]);

        // Fallback default base unit if not specified
        if (empty($validated['base_unit_id'])) {
            $validated['base_unit_id'] = Unit::where('symbol', 'pcs')->value('id') ?? Unit::first()?->id;
        }

        $isForSale = $validated['is_for_sale'] ?? true;
        if (! $isForSale && empty($validated['price'])) {
            $validated['price'] = 0;
        }

        if (empty($validated['default_pos_unit_id'])) {
            $validated['default_pos_unit_id'] = $validated['base_unit_id'];
        }

        $initialStock = (float) ($validated['stock'] ?? 0);
        $initialCost = (float) ($validated['avg_cost'] ?? 0);

        $product = DB::transaction(function () use ($validated, $initialStock, $initialCost, $request) {
            $product = Product::create($validated);

            // Create additional non-base conversions if provided
            if (! empty($validated['conversions'])) {
                foreach ($validated['conversions'] as $conv) {
                    if ($conv['unit_id'] !== $product->base_unit_id) {
                        ProductUnitConversion::create([
                            'product_id' => $product->id,
                            'unit_id' => $conv['unit_id'],
                            'conversion_factor' => $conv['conversion_factor'],
                            'sku_barcode' => $conv['sku_barcode'] ?? null,
                            'price' => $conv['price'],
                            'is_base' => false,
                            'is_default_pos' => $conv['is_default_pos'] ?? false,
                        ]);
                    }
                }
            }

            // 3. Record Initial Stock Movement
            if ($initialStock > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()?->id,
                    'type' => 'IN',
                    'quantity' => $initialStock,
                    'unit_name' => $product->baseUnit?->name ?? 'pcs',
                    'conversion_factor' => 1.0000,
                    'base_quantity' => $initialStock,
                    'unit_cost' => $initialCost,
                    'total_cost' => $initialStock * $initialCost,
                    'balance_after' => $initialStock,
                    'reference_type' => 'InitialStock',
                    'notes' => 'Stok awal produk baru',
                ]);
            }

            return $product;
        });

        return $this->successResponse($product->load(['category', 'baseUnit', 'defaultPosUnit', 'conversions.unit']), 'Produk berhasil ditambahkan.', 201);
    }

    /**
     * Display the specified product with all UoM conversions.
     */
    public function show(string $id): JsonResponse
    {
        $product = Product::with(['category', 'baseUnit', 'conversions.unit', 'stockMovements' => function ($q) {
            $q->orderBy('created_at', 'desc')->limit(10);
        }])->find($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan.', 404);
        }

        return $this->successResponse($product, 'Detail produk berhasil diambil.');
    }

    /**
     * Update the specified product and its conversions.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'base_unit_id' => ['nullable', 'exists:units,id'],
            'default_pos_unit_id' => ['nullable', 'exists:units,id'],
            'name' => ['required', 'string', 'max:255'],
            'sku_barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku_barcode')->ignore($product->id)->whereNull('deleted_at')],
            'description' => ['nullable', 'string'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'image_path' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'is_for_sale' => ['nullable', 'boolean'],
            'conversions' => ['nullable', 'array'],
            'conversions.*.unit_id' => ['required_with:conversions', 'exists:units,id'],
            'conversions.*.conversion_factor' => ['required_with:conversions', 'numeric', 'gt:0'],
            'conversions.*.price' => ['required_with:conversions', 'numeric', 'min:0'],
            'conversions.*.sku_barcode' => ['nullable', 'string', 'max:100'],
            'conversions.*.is_default_pos' => ['nullable', 'boolean'],
        ]);

        $isForSale = $validated['is_for_sale'] ?? $product->is_for_sale ?? true;
        if (! $isForSale && ! isset($validated['price'])) {
            $validated['price'] = 0;
        }

        DB::transaction(function () use ($product, $validated) {
            $product->update($validated);

            $baseUnitId = $product->base_unit_id;

            // Sync base conversion
            ProductUnitConversion::updateOrCreate(
                ['product_id' => $product->id, 'is_base' => true],
                [
                    'unit_id' => $baseUnitId,
                    'conversion_factor' => 1.0000,
                    'sku_barcode' => $product->sku_barcode,
                    'price' => $product->price,
                ]
            );

            // Sync non-base conversions if provided
            if (isset($validated['conversions'])) {
                // Delete non-base conversions not in payload
                $incomingUnitIds = collect($validated['conversions'])->pluck('unit_id')->filter(fn ($u) => $u !== $baseUnitId)->all();
                ProductUnitConversion::where('product_id', $product->id)
                    ->where('is_base', false)
                    ->whereNotIn('unit_id', $incomingUnitIds)
                    ->delete();

                foreach ($validated['conversions'] as $conv) {
                    if ($conv['unit_id'] !== $baseUnitId) {
                        ProductUnitConversion::updateOrCreate(
                            ['product_id' => $product->id, 'unit_id' => $conv['unit_id']],
                            [
                                'conversion_factor' => $conv['conversion_factor'],
                                'sku_barcode' => $conv['sku_barcode'] ?? null,
                                'price' => $conv['price'],
                                'is_base' => false,
                                'is_default_pos' => $conv['is_default_pos'] ?? false,
                            ]
                        );
                    }
                }
            }
        });

        return $this->successResponse($product->fresh(['category', 'baseUnit', 'defaultPosUnit', 'conversions.unit']), 'Data produk berhasil diperbarui.');
    }

    /**
     * Restock product with Average Cost and optional UoM.
     */
    public function restock(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_cost' => ['required', 'numeric', 'min:0'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string'],
        ]);

        try {
            $updatedProduct = $this->inventoryService->restock(
                $product,
                (float) $validated['quantity'],
                (float) $validated['unit_cost'],
                $validated['unit_id'] ?? null,
                $validated['notes'] ?? null,
                $request->user(),
                $validated['supplier_id'] ?? null
            );

            return $this->successResponse($updatedProduct, 'Restock produk berhasil dicatat.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Get stock movement history for a product.
     */
    public function stockMovements(Request $request, string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan.', 404);
        }

        $movements = StockMovement::with('user:id,name,role')
            ->where('product_id', $id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 20));

        return $this->successResponse($movements, 'Riwayat mutasi kartu stok berhasil diambil.');
    }

    /**
     * Soft-delete a product.
     *
     * Semantik: `is_active = false` → sementara tidak dijual (produk musiman).
     *           `delete()` (SoftDeletes) → dihapus permanen secara lunak, tersembunyi dari semua query.
     *           Histori transaksi tetap aman karena FK `nullOnDelete()` dan snapshot immutable.
     */
    public function destroy(string $id): JsonResponse
    {
        $product = Product::find($id);

        if (! $product) {
            return $this->errorResponse('Produk tidak ditemukan.', 404);
        }

        $productName = $product->name;

        // Bersihkan data konversi satuan UoM kemasan dari produk ini
        $product->conversions()->delete();

        // SoftDeletes: set deleted_at, otomatis tersembunyi dari semua Eloquent query
        $product->delete();

        return $this->successResponse(null, "Produk \"{$productName}\" berhasil dihapus.");
    }
}
