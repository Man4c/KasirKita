<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashFlow;
use App\Models\Transaction;
use App\Services\FinanceService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected FinanceService $financeService
    ) {}

    /**
     * Get high-level finance metrics for Dashboard.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $summary = $this->financeService->getDashboardSummary($startDate, $endDate);

        return $this->successResponse($summary, 'Ringkasan keuangan dasbor berhasil diambil.');
    }

    /**
     * Get sales trends for charts.
     */
    public function trends(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $trends = $this->financeService->getSalesTrends($startDate, $endDate);

        return $this->successResponse($trends, 'Grafik tren penjualan berhasil diambil.');
    }

    /**
     * Display list of cash flows.
     */
    public function cashFlows(Request $request): JsonResponse
    {
        $query = CashFlow::with(['user:id,name,role', 'transaction:id,invoice_number', 'supplier:id,name']);

        if ($type = $request->query('type')) {
            $query->where('type', strtoupper($type));
        }

        if ($category = $request->query('category')) {
            $query->where('category', strtoupper($category));
        }

        if ($startDate = $request->query('start_date')) {
            $query->where('flow_date', '>=', $startDate);
        }

        if ($endDate = $request->query('end_date')) {
            $query->where('flow_date', '<=', $endDate);
        }

        $flows = $query->orderBy('flow_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 20));

        return $this->successResponse($flows, 'Data arus kas berhasil diambil.');
    }

    /**
     * Store manual cash flow (e.g. operational expense).
     */
    public function storeCashFlow(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:IN,OUT'],
            'category' => ['required', 'string', 'in:SALES,OPERATIONAL,PURCHASE,OTHER'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'flow_date' => ['nullable', 'date'],
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $cashFlow = $this->financeService->recordCashFlow($validated, $request->user());

        return $this->successResponse($cashFlow->load(['user:id,name,role', 'supplier:id,name']), 'Catatan arus kas berhasil disimpan.', 201);
    }

    /**
     * Export report data as CSV.
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        $type = $request->query('type', 'transactions'); // 'transactions' or 'cashflows'
        $filename = "laporan_{$type}_".now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return response()->stream(function () use ($type) {
            $handle = fopen('php://output', 'w');

            if ($type === 'transactions') {
                fputcsv($handle, ['Invoice', 'Tanggal', 'Kasir', 'Pelanggan', 'Subtotal', 'Diskon', 'Total', 'Metode Bayar', 'Status']);
                $transactions = Transaction::with('cashier')->orderBy('created_at', 'desc')->get();
                foreach ($transactions as $t) {
                    fputcsv($handle, [
                        $t->invoice_number,
                        $t->created_at->format('Y-m-d H:i:s'),
                        $t->cashier?->name ?? '-',
                        $t->customer_name,
                        $t->subtotal,
                        $t->discount_amount,
                        $t->total_amount,
                        $t->payment_method,
                        $t->payment_status,
                    ]);
                }
            } else {
                fputcsv($handle, ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Pencatat', 'Catatan']);
                $flows = CashFlow::with('user')->orderBy('flow_date', 'desc')->get();
                foreach ($flows as $f) {
                    fputcsv($handle, [
                        $f->flow_date,
                        $f->type,
                        $f->category,
                        $f->amount,
                        $f->user?->name ?? '-',
                        $f->notes,
                    ]);
                }
            }

            fclose($handle);
        }, 200, $headers);
    }
}
