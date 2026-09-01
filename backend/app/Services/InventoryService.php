<?php

namespace App\Services;

use App\Models\CashFlow;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    /**
     * Restock product with Multi-UoM Average Cost calculation and stock movement record.
     *
     * @throws Exception
     */
    public function restock(Product $product, float|int $quantity, float $unitCost, ?string $unitId = null, ?string $notes = null, ?User $user = null, ?string $supplierId = null): Product
    {
        if ($quantity <= 0) {
            throw new Exception('Jumlah barang masuk harus lebih dari 0.');
        }

        if ($unitCost < 0) {
            throw new Exception('Harga beli/modal unit tidak boleh negatif.');
        }

        return DB::transaction(function () use ($product, $quantity, $unitCost, $unitId, $notes, $user, $supplierId) {
            // Lock row for update
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->firstOrFail();

            $conversionFactor = 1.0000;
            $unitName = $lockedProduct->baseUnit?->name ?? 'pcs';

            if ($unitId) {
                $conversion = $lockedProduct->conversions()->where('unit_id', $unitId)->first();
                if ($conversion) {
                    $conversionFactor = (float) $conversion->conversion_factor;
                    $unitName = $conversion->unit?->name ?? $unitName;
                }
            }

            $baseQuantity = (float) $quantity * $conversionFactor;
            $totalCost = (float) $quantity * $unitCost; // Actual purchasing expense
            $unitCostBase = $baseQuantity > 0 ? ($totalCost / $baseQuantity) : $unitCost;

            $currentStock = (float) $lockedProduct->stock;
            $currentAvgCost = (float) $lockedProduct->avg_cost;

            $newStock = $currentStock + $baseQuantity;

            // Moving Average Cost Formula:
            // ((Current Stock * Current Avg Cost) + Total Incoming Cost) / New Total Stock
            if ($newStock > 0) {
                $totalCurrentValue = $currentStock * $currentAvgCost;
                $totalIncomingValue = $totalCost;
                $newAvgCost = ($totalCurrentValue + $totalIncomingValue) / $newStock;
            } else {
                $newAvgCost = $unitCostBase;
            }

            // Update product stock and avg_cost (precision 4 decimal places)
            $lockedProduct->update([
                'stock' => $newStock,
                'avg_cost' => round($newAvgCost, 4),
            ]);

            // Record Stock Movement (IN)
            StockMovement::create([
                'product_id' => $lockedProduct->id,
                'user_id' => $user?->id,
                'supplier_id' => $supplierId,
                'type' => 'IN',
                'quantity' => $quantity,
                'unit_name' => $unitName,
                'conversion_factor' => $conversionFactor,
                'base_quantity' => $baseQuantity,
                'unit_cost' => round($unitCostBase, 4),
                'total_cost' => $totalCost,
                'balance_after' => $newStock,
                'reference_type' => 'Restock',
                'notes' => $notes ?? 'Restock '.$quantity.' '.$unitName.' ('.($baseQuantity != $quantity ? $baseQuantity.' base' : '').')',
            ]);

            // Record Cash Outflow (Purchase/Kulakan)
            CashFlow::create([
                'user_id' => $user?->id ?? DB::table('users')->value('id'),
                'supplier_id' => $supplierId,
                'type' => 'OUT',
                'category' => 'PURCHASE',
                'amount' => $totalCost,
                'flow_date' => now()->toDateString(),
                'notes' => 'Restock '.$lockedProduct->name.' ('.$quantity.' '.$unitName.' @ Rp'.number_format($unitCost, 0, ',', '.').')',
            ]);

            return $lockedProduct->fresh(['category', 'baseUnit', 'conversions.unit']);
        });
    }

    /**
     * Adjust stock through Stock Opname physical reconciliation.
     *
     * @throws Exception
     */
    public function adjustStock(Product $product, float|int $physicalStock, string $reason, ?User $user = null, ?string $stockOpnameId = null): StockMovement
    {
        if ($physicalStock < 0) {
            throw new Exception('Jumlah stok fisik tidak boleh negatif.');
        }

        return DB::transaction(function () use ($product, $physicalStock, $reason, $user, $stockOpnameId) {
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->firstOrFail();
            $systemStock = (float) $lockedProduct->stock;
            $difference = (float) $physicalStock - $systemStock;

            // Update product stock
            $lockedProduct->update([
                'stock' => $physicalStock,
            ]);

            $unitCost = (float) $lockedProduct->avg_cost;
            $totalDifferenceCost = abs($difference) * $unitCost;
            $unitName = $lockedProduct->baseUnit?->name ?? 'pcs';

            // Record Stock Movement (ADJUSTMENT)
            return StockMovement::create([
                'product_id' => $lockedProduct->id,
                'user_id' => $user?->id,
                'type' => 'ADJUSTMENT',
                'quantity' => $difference,
                'unit_name' => $unitName,
                'conversion_factor' => 1.0000,
                'base_quantity' => $difference,
                'unit_cost' => $unitCost,
                'total_cost' => $totalDifferenceCost,
                'balance_after' => $physicalStock,
                'reference_type' => 'StockOpname',
                'reference_id' => $stockOpnameId,
                'notes' => $reason.' (Stok Sistem: '.$systemStock.', Fisik: '.$physicalStock.')',
            ]);
        });
    }
}
