<?php

namespace App\Services;

use App\Models\CashFlow;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceService
{
    /**
     * Get high-level summary metrics for Dashboard.
     */
    public function getDashboardSummary(?string $startDate = null, ?string $endDate = null): array
    {
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : now()->startOfMonth();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : now()->endOfDay();

        // 1. Transactions & Sales Metrics
        $transactionQuery = Transaction::where('payment_status', 'COMPLETED')
            ->whereBetween('created_at', [$start, $end]);

        $totalSales = (float) (clone $transactionQuery)->sum('total_amount');
        $totalTransactions = (clone $transactionQuery)->count();
        $totalDiscount = (float) (clone $transactionQuery)->sum('discount_amount');

        // 2. Cost of Goods Sold (COGS / Total HPP)
        $cogs = (float) TransactionItem::whereHas('transaction', function ($q) use ($start, $end) {
            $q->where('payment_status', 'COMPLETED')
              ->whereBetween('created_at', [$start, $end]);
        })->sum('total_cost');

        $totalItemsSold = (int) TransactionItem::whereHas('transaction', function ($q) use ($start, $end) {
            $q->where('payment_status', 'COMPLETED')
              ->whereBetween('created_at', [$start, $end]);
        })->sum('quantity');

        // 3. Gross Profit (Laba Kotor)
        $grossProfit = $totalSales - $cogs;

        // 4. Cash Flows (Inflow vs Outflow)
        $cashInflow = (float) CashFlow::where('type', 'IN')
            ->whereDate('flow_date', '>=', $start->toDateString())
            ->whereDate('flow_date', '<=', $end->toDateString())
            ->sum('amount');

        $cashOutflow = (float) CashFlow::where('type', 'OUT')
            ->whereDate('flow_date', '>=', $start->toDateString())
            ->whereDate('flow_date', '<=', $end->toDateString())
            ->sum('amount');

        // Operating Expenses (Non-Purchase Outflow)
        $operationalExpenses = (float) CashFlow::where('type', 'OUT')
            ->where('category', 'OPERATIONAL')
            ->whereDate('flow_date', '>=', $start->toDateString())
            ->whereDate('flow_date', '<=', $end->toDateString())
            ->sum('amount');

        // Net Profit = Gross Profit - Operational Expenses
        $netProfit = $grossProfit - $operationalExpenses;

        // 5. Inventory Health
        $lowStockCount = Product::where('is_active', true)
            ->whereColumn('stock', '<=', 'min_stock')
            ->count();

        $totalProductsCount = Product::where('is_active', true)->count();
        $totalStockValue = (float) Product::where('is_active', true)
            ->selectRaw('SUM(stock * avg_cost) as total_value')
            ->value('total_value');

        return [
            'period' => [
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
            ],
            'sales' => [
                'total_revenue' => $totalSales,
                'total_transactions' => $totalTransactions,
                'total_items_sold' => $totalItemsSold,
                'total_discount' => $totalDiscount,
                'average_transaction_value' => $totalTransactions > 0 ? round($totalSales / $totalTransactions, 2) : 0,
            ],
            'profitability' => [
                'total_cogs' => $cogs,
                'gross_profit' => $grossProfit,
                'operational_expenses' => $operationalExpenses,
                'net_profit' => $netProfit,
                'gross_profit_margin' => $totalSales > 0 ? round(($grossProfit / $totalSales) * 100, 2) : 0,
            ],
            'cash_flow' => [
                'total_inflow' => $cashInflow,
                'total_outflow' => $cashOutflow,
                'net_cash' => $cashInflow - $cashOutflow,
            ],
            'inventory' => [
                'total_active_products' => $totalProductsCount,
                'low_stock_products_count' => $lowStockCount,
                'total_stock_valuation' => $totalStockValue,
            ],
        ];
    }

    /**
     * Get sales chart trends grouped by daily.
     */
    public function getSalesTrends(?string $startDate = null, ?string $endDate = null): array
    {
        $start = $startDate ? Carbon::parse($startDate)->startOfDay() : now()->subDays(6)->startOfDay();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : now()->endOfDay();

        $rawSales = Transaction::where('payment_status', 'COMPLETED')
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as date, COUNT(id) as count, SUM(total_amount) as revenue')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get()
            ->keyBy('date');

        // Fill all dates in the range so the chart shows a continuous daily trend
        $results = [];
        $current = $start->copy();
        while ($current->lte($end)) {
            $dateStr = $current->toDateString();
            $item = $rawSales->get($dateStr);
            $results[] = [
                'date' => $dateStr,
                'count' => $item ? (int) $item->count : 0,
                'revenue' => $item ? (float) $item->revenue : 0.0,
            ];
            $current->addDay();
        }

        return $results;
    }

    /**
     * Record an operating expense or manual cash flow.
     */
    public function recordCashFlow(array $data, User $user): CashFlow
    {
        return CashFlow::create([
            'user_id' => $user->id,
            'supplier_id' => $data['supplier_id'] ?? null,
            'type' => strtoupper($data['type']),
            'category' => strtoupper($data['category']),
            'amount' => (float) $data['amount'],
            'flow_date' => $data['flow_date'] ?? now()->toDateString(),
            'notes' => $data['notes'] ?? null,
        ]);
    }
}
