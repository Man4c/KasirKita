<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Services\InventoryService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StockOpnameController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Display a listing of stock opname sessions.
     */
    public function index(): JsonResponse
    {
        $opnames = StockOpname::with('user:id,name,role')
            ->withCount('items')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return $this->successResponse($opnames, 'Daftar riwayat stock opname berhasil diambil.');
    }

    /**
     * Store a new stock opname and optionally apply adjustments immediately.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string'],
            'apply_immediately' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.physical_stock' => ['required', 'numeric', 'min:0'],
            'items.*.reason' => ['nullable', 'string'],
        ]);

        $applyImmediately = $validated['apply_immediately'] ?? true;
        $user = $request->user();

        try {
            $opname = DB::transaction(function () use ($validated, $applyImmediately, $user) {
                $opnameNumber = 'SO-'.now()->format('Ymd').'-'.strtoupper(Str::random(4));

                $stockOpname = StockOpname::create([
                    'opname_number' => $opnameNumber,
                    'user_id' => $user->id,
                    'status' => $applyImmediately ? 'COMPLETED' : 'DRAFT',
                    'notes' => $validated['notes'] ?? null,
                    'conducted_at' => now(),
                ]);

                foreach ($validated['items'] as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $systemStock = (float) $product->stock;
                    $physicalStock = (float) $item['physical_stock'];
                    $difference = $physicalStock - $systemStock;
                    $unitCost = (float) $product->avg_cost;
                    $totalDifferenceCost = abs($difference) * $unitCost;

                    StockOpnameItem::create([
                        'stock_opname_id' => $stockOpname->id,
                        'product_id' => $product->id,
                        'system_stock' => $systemStock,
                        'physical_stock' => $physicalStock,
                        'difference' => $difference,
                        'unit_cost' => $unitCost,
                        'total_difference_cost' => $totalDifferenceCost,
                        'reason' => $item['reason'] ?? null,
                    ]);

                    // Apply adjustment if immediate
                    if ($applyImmediately && $difference !== 0) {
                        $this->inventoryService->adjustStock(
                            $product,
                            $physicalStock,
                            $item['reason'] ?? 'Penyesuaian Stock Opname',
                            $user,
                            $stockOpname->id
                        );
                    }
                }

                return $stockOpname->load('items.product');
            });

            return $this->successResponse($opname, 'Stock opname berhasil dicatat.', 201);
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * Display the specified stock opname session.
     */
    public function show(string $id): JsonResponse
    {
        $opname = StockOpname::with(['user:id,name,role', 'items.product:id,name,sku_barcode,price,avg_cost'])
            ->find($id);

        if (! $opname) {
            return $this->errorResponse('Data Stock Opname tidak ditemukan.', 404);
        }

        return $this->successResponse($opname, 'Detail stock opname berhasil diambil.');
    }

    /**
     * Complete and apply stock adjustment for a draft stock opname.
     */
    public function complete(Request $request, string $id): JsonResponse
    {
        $opname = StockOpname::with('items.product')->find($id);

        if (! $opname) {
            return $this->errorResponse('Data Stock Opname tidak ditemukan.', 404);
        }

        if ($opname->status === 'COMPLETED') {
            return $this->errorResponse('Stock Opname ini sudah berstatus selesai.', 422);
        }

        $user = $request->user();

        try {
            DB::transaction(function () use ($opname, $user) {
                foreach ($opname->items as $item) {
                    $product = $item->product;
                    if ($product) {
                        $this->inventoryService->adjustStock(
                            $product,
                            $item->physical_stock,
                            $item->reason ?? 'Penyesuaian Stock Opname '.$opname->opname_number,
                            $user,
                            $opname->id
                        );
                    }
                }

                $opname->update([
                    'status' => 'COMPLETED',
                    'conducted_at' => now(),
                ]);
            });

            return $this->successResponse($opname->fresh(['items.product']), 'Stock Opname berhasil diselesaikan dan stok telah disinkronkan.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
}
