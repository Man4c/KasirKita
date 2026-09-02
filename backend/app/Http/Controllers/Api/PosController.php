<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use App\Services\PosService;
use App\Traits\ApiResponse;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PosController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected PosService $posService
    ) {}

    /**
     * Process checkout transaction.
     */
    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'customer_name' => ['nullable', 'string', 'max:255'],
            'customer_phone' => ['nullable', 'string', 'max:50'],
            'discount_id' => ['nullable', 'exists:discounts,id'],
            'discount_code' => ['nullable', 'string', 'max:50'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'fee_amount' => ['nullable', 'numeric', 'min:0'],
            'fee_details' => ['nullable', 'array'],
            'paid_amount' => ['required', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'in:CASH,QRIS,TRANSFER,DEBIT'],
            'offline_id' => ['nullable', 'string', 'max:100'],
            'created_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'items.*.unit_id' => ['nullable', 'exists:units,id'],
            'items.*.conversion_id' => ['nullable', 'exists:product_unit_conversions,id'],
        ]);

        try {
            $transaction = $this->posService->checkout($validated, $request->user());

            return $this->successResponse($transaction, 'Transaksi penjualan berhasil diproses.', 201);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('POS Checkout Error: '.$e->getMessage().' in '.$e->getFile().':'.$e->getLine());
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    /**
     * Display listing of transactions with filtering.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::with(['cashier:id,name,role', 'items']);

        // Search by invoice or customer
        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'ilike', "%{$search}%")
                  ->orWhere('customer_name', 'ilike', "%{$search}%");
            });
        }

        // Filter by payment status
        if ($status = $request->query('status')) {
            $query->where('payment_status', strtoupper($status));
        }

        // Filter by payment method
        if ($method = $request->query('payment_method')) {
            $query->where('payment_method', strtoupper($method));
        }

        // Filter by date
        if ($startDate = $request->query('start_date')) {
            $query->whereDate('created_at', '>=', $startDate);
        }
        if ($endDate = $request->query('end_date')) {
            $query->whereDate('created_at', '<=', $endDate);
        }

        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 20));

        return $this->successResponse($transactions, 'Riwayat transaksi berhasil diambil.');
    }

    /**
     * Display details of a single transaction (Struk).
     */
    public function show(string $id): JsonResponse
    {
        $transaction = Transaction::with(['cashier:id,name,role', 'discount:id,code,name,type,value', 'items.product:id,name,sku_barcode'])
            ->find($id);

        if (! $transaction) {
            return $this->errorResponse('Transaksi tidak ditemukan.', 404);
        }

        return $this->successResponse($transaction, 'Detail struk transaksi berhasil diambil.');
    }

    /**
     * Cancel/Void a transaction and restore stocks.
     */
    public function cancel(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::with('items')->find($id);

        if (! $transaction) {
            return $this->errorResponse('Transaksi tidak ditemukan.', 404);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        try {
            $cancelled = $this->posService->cancelTransaction($transaction, $request->user(), $validated['reason']);

            return $this->successResponse($cancelled, 'Transaksi berhasil dibatalkan dan stok dikembalikan.');
        } catch (Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
