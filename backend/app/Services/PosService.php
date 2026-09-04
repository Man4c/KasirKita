<?php

namespace App\Services;

use App\Models\CashFlow;
use App\Models\Customer;
use App\Models\Discount;
use App\Models\Product;
use App\Models\ProductUnitConversion;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PosService
{
    /**
     * Process POS transaction checkout atomically with deadlock-free locking, Multi-UoM stock deduction, and cash flow recording.
     *
     * @param  array{
     *     customer_name?: string|null,
     *     discount_amount?: float|int,
     *     tax_amount?: float|int,
     *     paid_amount: float|int,
     *     payment_method: string,
     *     notes?: string|null,
     *     items: array<array{product_id: string, quantity: float|int, unit_id?: string|null, conversion_id?: string|null}>
     * }  $data
     *
     * @throws Exception
     */
    public function checkout(array $data, User $cashier): Transaction
    {
        if (empty($data['items'])) {
            throw new Exception('Keranjang transaksi kasir tidak boleh kosong.');
        }

        // Idempotency check: prevent duplicate checkout if offline_id already processed
        if (!empty($data['offline_id'])) {
            $existing = Transaction::with(['cashier:id,name,role', 'items'])
                ->where('offline_id', $data['offline_id'])
                ->first();
            if ($existing) {
                return $existing;
            }
        }

        return DB::transaction(function () use ($data, $cashier) {
            $subtotal = 0;
            $itemsToProcess = [];

            // 1. Deadlock Prevention: Deterministically pre-lock products by sorted ID
            $uniqueProductIds = collect($data['items'])->pluck('product_id')->unique()->sort()->values();
            $lockedProducts = Product::with(['baseUnit', 'conversions.unit'])
                ->whereIn('id', $uniqueProductIds)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($data['items'] as $item) {
                $qty = (float) $item['quantity'];
                if ($qty <= 0) {
                    throw new Exception('Jumlah item harus lebih dari 0.');
                }

                // Pessimistic lock for atomic stock deduction
                /** @var Product|null $product */
                $product = $lockedProducts->get($item['product_id']);

                if (! $product) {
                    throw new Exception("Produk dengan ID {$item['product_id']} tidak ditemukan.");
                }

                if (! $product->is_active) {
                    throw new Exception("Produk {$product->name} saat ini sedang dinonaktifkan.");
                }

                // Multi-UoM conversion resolution
                $conversionFactor = 1.0000;
                $unitName = $product->baseUnit?->name ?? 'pcs';
                $unitPrice = (float) $product->price;

                $conversion = null;
                if (! empty($item['conversion_id'])) {
                    $conversion = $product->conversions->firstWhere('id', $item['conversion_id']);
                } elseif (! empty($item['unit_id'])) {
                    $conversion = $product->conversions->firstWhere('unit_id', $item['unit_id']);
                }

                if ($conversion) {
                    $conversionFactor = (float) $conversion->conversion_factor;
                    $unitName = $conversion->unit?->name ?? $unitName;
                    $unitPrice = (float) $conversion->price;
                }

                $baseQuantity = $qty * $conversionFactor;

                if ((float) $product->stock < $baseQuantity) {
                    $availableDisplay = (float) $product->stock;
                    throw new Exception("Stok untuk '{$product->name}' tidak mencukupi. Sisa stok: {$availableDisplay} base unit, diminta: {$baseQuantity} base unit ({$qty} {$unitName}).");
                }

                $itemSubtotal = $qty * $unitPrice;
                $itemTotalCost = $baseQuantity * (float) $product->avg_cost;
                $subtotal += $itemSubtotal;

                $itemsToProcess[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_name' => $unitName,
                    'conversion_factor' => $conversionFactor,
                    'base_quantity' => $baseQuantity,
                    'unit_price' => $unitPrice,
                    'unit_cost' => (float) $product->avg_cost,
                    'subtotal' => $itemSubtotal,
                    'total_cost' => $itemTotalCost,
                ];
            }

            // 2. Calculations & Promo Voucher Validation
            $discountId = !empty($data['discount_id']) ? $data['discount_id'] : null;
            $discountCode = !empty($data['discount_code']) ? strtoupper(trim($data['discount_code'])) : null;
            $discountAmount = max(0, (float) ($data['discount_amount'] ?? 0));

            if ($discountCode || $discountId) {
                $discountQuery = Discount::query();
                if ($discountId) {
                    $discount = $discountQuery->find($discountId);
                } else {
                    $discount = $discountQuery->where('code', $discountCode)->first();
                }

                if ($discount) {
                    if (!$discount->is_active || $discount->isExpired() || $discount->isQuotaExceeded()) {
                        throw new Exception("Voucher promosi '{$discount->name}' tidak valid, telah kadaluarsa, atau kuota habis.");
                    }

                    if ($subtotal < (float) $discount->min_purchase_amount) {
                        $minRp = 'Rp' . number_format($discount->min_purchase_amount, 0, ',', '.');
                        throw new Exception("Minimal transaksi untuk menggunakan voucher '{$discount->name}' adalah {$minRp}.");
                    }

                    // Recalculate server-side to prevent client tampering
                    $discountAmount = $discount->calculateDiscount($subtotal);
                    $discountId = $discount->id;
                    $discountCode = $discount->code;

                    // Increment usage atomically
                    $discount->increment('usage_count');
                }
            }

            $taxAmount = max(0, (float) ($data['tax_amount'] ?? 0));
            $feeAmount = max(0, (float) ($data['fee_amount'] ?? 0));
            $feeDetails = $data['fee_details'] ?? null;
            $totalAmount = max(0, $subtotal - $discountAmount + $taxAmount + $feeAmount);
            $paidAmount = (float) $data['paid_amount'];
            $paymentMethod = strtoupper($data['payment_method'] ?? 'CASH');

            if ($paidAmount < $totalAmount) {
                throw new Exception('Nominal uang yang dibayarkan kurang dari total tagihan.');
            }

            $changeAmount = $paidAmount - $totalAmount;

            // Preserve original invoice number from offline client if provided
            $invoiceNumber = !empty($data['invoice_number'])
                ? $data['invoice_number']
                : (!empty($data['offline_id'])
                    ? 'INV-' . $data['offline_id']
                    : 'INV-'.now()->format('YmdHis').'-'.strtoupper(Str::random(4)));

            $customerId = !empty($data['customer_id']) ? $data['customer_id'] : null;
            $customerName = $data['customer_name'] ?? 'Pelanggan Umum';
            $customerPhone = $data['customer_phone'] ?? null;

            if ($customerId) {
                $customer = Customer::find($customerId);
                if ($customer) {
                    $customerName = $customer->name;
                    $customerPhone = $customer->phone ?? $customerPhone;
                }
            }

            // 3. Create Transaction Header
            $transactionData = [
                'invoice_number' => $invoiceNumber,
                'offline_id' => $data['offline_id'] ?? null,
                'user_id' => $cashier->id,
                'customer_id' => $customerId,
                'customer_name' => $customerName,
                'customer_phone' => $customerPhone,
                'discount_id' => $discountId,
                'discount_code' => $discountCode,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'fee_amount' => $feeAmount,
                'fee_details' => $feeDetails,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_method' => $paymentMethod,
                'payment_status' => 'COMPLETED',
                'notes' => $data['notes'] ?? null,
            ];

            if (!empty($data['created_at'])) {
                $transactionData['created_at'] = \Illuminate\Support\Carbon::parse($data['created_at']);
            }

            $transaction = Transaction::create($transactionData);

            // 4. Create Items & Deduct Stocks
            foreach ($itemsToProcess as $processed) {
                /** @var Product $product */
                $product = $processed['product'];
                $baseQty = $processed['base_quantity'];
                $newBalance = (float) $product->stock - $baseQty;

                // Save immutable transaction line item
                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_name' => $processed['unit_name'],
                    'conversion_factor' => $processed['conversion_factor'],
                    'quantity' => $processed['quantity'],
                    'base_quantity' => $baseQty,
                    'unit_price' => $processed['unit_price'],
                    'unit_cost' => $processed['unit_cost'],
                    'subtotal' => $processed['subtotal'],
                    'total_cost' => $processed['total_cost'],
                ]);

                // Update physical stock balance
                $product->update([
                    'stock' => $newBalance,
                ]);

                // Record Stock Movement (SALE)
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $cashier->id,
                    'type' => 'SALE',
                    'quantity' => -$processed['quantity'],
                    'unit_name' => $processed['unit_name'],
                    'conversion_factor' => $processed['conversion_factor'],
                    'base_quantity' => -$baseQty,
                    'unit_cost' => $processed['unit_cost'],
                    'total_cost' => $processed['total_cost'],
                    'balance_after' => $newBalance,
                    'reference_type' => 'Transaction',
                    'reference_id' => $transaction->id,
                    'notes' => 'Penjualan kasir #'.$invoiceNumber.' ('.$processed['quantity'].' '.$processed['unit_name'].')',
                ]);
            }

            // 5. Record Cash Flow Inflow
            CashFlow::create([
                'transaction_id' => $transaction->id,
                'user_id' => $cashier->id,
                'type' => 'IN',
                'category' => 'SALES',
                'amount' => $totalAmount,
                'flow_date' => now()->toDateString(),
                'notes' => 'Penjualan POS #'.$invoiceNumber.' ('.$paymentMethod.')',
            ]);

            return $transaction->load(['items.product', 'cashier:id,name,role']);
        });
    }

    /**
     * Cancel/Void transaction with stock restoration.
     *
     * @throws Exception
     */
    public function cancelTransaction(Transaction $transaction, User $canceller, string $reason): Transaction
    {
        if ($transaction->payment_status === 'CANCELLED') {
            throw new Exception('Transaksi ini sudah dibatalkan sebelumnya.');
        }

        return DB::transaction(function () use ($transaction, $canceller, $reason) {
            $transaction->load('items.product');

            // 1. Restore product stocks
            foreach ($transaction->items as $item) {
                if ($item->product) {
                    /** @var Product $product */
                    $product = Product::lockForUpdate()->find($item->product_id);
                    if ($product) {
                        $baseQtyToRestore = (float) ($item->base_quantity ?: $item->quantity);
                        $newStock = (float) $product->stock + $baseQtyToRestore;
                        $product->update(['stock' => $newStock]);

                        StockMovement::create([
                            'product_id' => $product->id,
                            'user_id' => $canceller->id,
                            'type' => 'IN',
                            'quantity' => $item->quantity,
                            'unit_name' => $item->unit_name,
                            'conversion_factor' => $item->conversion_factor,
                            'base_quantity' => $baseQtyToRestore,
                            'unit_cost' => $item->unit_cost,
                            'total_cost' => $item->total_cost,
                            'balance_after' => $newStock,
                            'reference_type' => 'TransactionCancel',
                            'reference_id' => $transaction->id,
                            'notes' => 'Pembatalan transaksi #'.$transaction->invoice_number.': '.$reason,
                        ]);
                    }
                }
            }

            // 2. Mark Transaction Cancelled
            $transaction->update([
                'payment_status' => 'CANCELLED',
                'notes' => ($transaction->notes ? $transaction->notes.' | ' : '').'Dibatalkan oleh '.$canceller->name.': '.$reason,
            ]);

            // 3. Record Reverse Cash Flow
            CashFlow::create([
                'user_id' => $canceller->id,
                'type' => 'OUT',
                'category' => 'EXPENSE',
                'amount' => $transaction->total_amount,
                'flow_date' => now()->toDateString(),
                'notes' => 'Void / Retur Penjualan #'.$transaction->invoice_number.': '.$reason,
            ]);

            return $transaction->fresh(['items.product', 'cashier:id,name,role']);
        });
    }
}
