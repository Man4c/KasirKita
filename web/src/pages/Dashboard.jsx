import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Receipt,
  Calendar,
  Layers,
  Printer,
  X,
  Eye
} from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [selectedTrendIdx, setSelectedTrendIdx] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail Struk Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [sumRes, trendRes, txRes] = await Promise.all([
        api.get('/finance/dashboard'),
        api.get('/finance/trends'),
        api.get('/pos/transactions?per_page=5')
      ]);

      if (sumRes.data.success) setSummary(sumRes.data.data);
      if (trendRes.data.success) {
        setTrends(trendRes.data.data);
        if (trendRes.data.data.length > 0) {
          setSelectedTrendIdx(trendRes.data.data.length - 1);
        }
      }
      if (txRes.data.success) setRecentTransactions(txRes.data.data.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
        Memuat data dashboard & analitik...
      </div>
    );
  }

  const sales = summary?.sales || {};
  const profit = summary?.profitability || {};
  const cash = summary?.cash_flow || {};
  const inv = summary?.inventory || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-rose-500" />
          <span>Dasbor Analitik & Laporan Keuangan</span>
        </h2>
        <p className="text-sm text-zinc-300 mt-1">
          Ringkasan performa penjualan, valuasi HPP Average Cost, dan arus kas toko
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-300">Total Omzet Penjualan</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-2 tracking-tight">
            {formatRp(sales.total_revenue)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400 font-medium">
            <span>{sales.total_transactions} transaksi</span> • <span>{sales.total_items_sold} item terjual</span>
          </div>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300">Laba Kotor (Gross Profit)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-2 tracking-tight">
              {formatRp(profit.gross_profit)}
            </p>
          </div>
          <div className="mt-2 text-xs text-zinc-400 font-medium">
            Margin: <span className="text-emerald-400 font-semibold">{profit.gross_profit_margin}%</span> (HPP: {formatRp(profit.total_cogs)})
          </div>
        </div>

        {/* Laba Bersih (Net Profit) */}
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300">Estimasi Laba Bersih</span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono mt-2 tracking-tight">
              {formatRp(profit.net_profit)}
            </p>
          </div>
          <div className="mt-2 text-xs text-zinc-400 font-medium">
            Beban Ops: <span className="text-zinc-200 font-semibold">{formatRp(profit.operational_expenses)}</span>
          </div>
        </div>

        {/* Valuasi Stok Toko */}
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-zinc-300">Valuasi Stok Barang</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white font-mono mt-2 tracking-tight">
              {formatRp(inv.total_stock_valuation)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            {inv.low_stock_products_count > 0 ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {inv.low_stock_products_count} produk stok menipis
              </span>
            ) : (
              <span className="text-zinc-400 font-medium">{inv.total_active_products} jenis produk aman</span>
            )}
          </div>
        </div>
      </div>

      {/* Sales Trend Visualizer */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl min-w-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2 pb-2.5 border-b border-zinc-800/60">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Grafik Tren Omzet 7 Hari Terakhir</span>
          </h3>
          <span className="text-xs font-medium text-zinc-400 font-mono">
            Total 7 Hari: <span className="text-white font-bold">{formatRp(trends.reduce((s, t) => s + (Number(t.revenue) || 0), 0))}</span>
          </span>
        </div>

        {/* Dynamic Tap-to-Inspect Status Row (Flattened - Zero Nested Cards) */}
        {trends.length > 0 && selectedTrendIdx !== null && trends[selectedTrendIdx] && (
          <div className="flex items-center justify-between text-xs font-mono mb-2 pt-1">
            <span className="text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Terpilih: <strong className="text-zinc-200">{trends[selectedTrendIdx].date}</strong></span>
            </span>
            <span className="text-rose-400 font-bold text-sm">
              {formatRp(trends[selectedTrendIdx].revenue)}
            </span>
          </div>
        )}

        {trends.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-zinc-400 text-sm">
            Belum ada data grafik penjualan pada periode ini.
          </div>
        ) : (
          <div className="h-48 sm:h-52 flex items-end gap-1 sm:gap-3 pt-2 pb-2 border-b border-zinc-800 w-full min-w-0">
            {trends.map((item, idx) => {
              const maxRevenue = Math.max(...trends.map((t) => Number(t.revenue) || 0), 50000);
              const rawRev = Number(item.revenue) || 0;
              const isSelected = selectedTrendIdx === idx;
              // Percentage calculation for non-zero vs zero days
              const heightPercent = rawRev > 0 
                ? Math.max(14, Math.round((rawRev / maxRevenue) * 100)) 
                : 4;

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedTrendIdx(idx)}
                  className="flex-1 min-w-0 h-full flex flex-col items-center justify-end group cursor-pointer"
                >
                  {/* Tooltip Value (Highlighted if active, or on mouse hover) */}
                  <div className={`text-xs font-bold font-mono transition-all mb-1.5 truncate text-center max-w-full ${
                    isSelected 
                      ? 'opacity-100 text-rose-400 font-extrabold scale-105' 
                      : 'opacity-0 group-hover:opacity-100 text-zinc-300'
                  }`}>
                    {rawRev > 0 ? formatRp(rawRev) : 'Rp0'}
                  </div>

                  {/* Bar Column with Flex-1 Height */}
                  <div className="w-full flex-1 flex items-end justify-center">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[36px] sm:max-w-[48px] rounded-t-md sm:rounded-t-lg transition-all duration-200 ${
                        rawRev > 0
                          ? isSelected
                            ? 'bg-gradient-to-t from-rose-500 to-red-400 ring-2 ring-rose-400/80 ring-offset-2 ring-offset-zinc-900 shadow-lg shadow-rose-950/60'
                            : 'bg-gradient-to-t from-rose-600 to-red-500 group-hover:from-rose-500 group-hover:to-red-400 shadow-md shadow-rose-950/40'
                          : isSelected
                            ? 'bg-zinc-700 ring-2 ring-zinc-500/80 ring-offset-2 ring-offset-zinc-900'
                            : 'bg-zinc-800/60 group-hover:bg-zinc-700/60'
                      }`}
                    ></div>
                  </div>

                  {/* Date button label */}
                  <span className={`text-xs font-mono whitespace-nowrap mt-2 px-1.5 py-0.5 rounded transition-colors ${
                    isSelected 
                      ? 'text-rose-400 font-bold bg-rose-500/10' 
                      : 'text-zinc-400 group-hover:text-zinc-200'
                  }`}>
                    {item.date?.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Transactions Section */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-xl min-w-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500 shrink-0" />
            <span>5 Transaksi Penjualan Terakhir</span>
          </h3>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors group cursor-pointer"
          >
            <span>Lihat Semua Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="pb-3.5 pr-4">Invoice</th>
                <th className="pb-3.5 px-4">Pelanggan</th>
                <th className="pb-3.5 px-4">Barang yang Dibeli</th>
                <th className="pb-3.5 px-4">Metode Bayar</th>
                <th className="pb-3.5 px-4">Total</th>
                <th className="pb-3.5 px-4">Status</th>
                <th className="pb-3.5 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Belum ada transaksi tercatat.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 font-sans transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-rose-400 whitespace-nowrap">
                      {tx.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-200 whitespace-nowrap">
                      {tx.customer_name || 'Pelanggan Umum'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-sans">
                      <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                        {tx.items && tx.items.length > 0 ? (
                          tx.items.map((item, i) => (
                            <span 
                              key={i} 
                              className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-800 text-xs text-zinc-200 border border-zinc-700/60 font-medium"
                            >
                              <span className="text-rose-400 font-bold mr-1.5">{Number(item.quantity)}x</span> {item.product_name}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-500 text-xs italic">-</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-medium text-xs whitespace-nowrap">
                      {tx.payment_method}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-zinc-100 whitespace-nowrap">
                      {formatRp(tx.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="capitalize">{tx.payment_status}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedTx(tx);
                          setReceiptModalOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5 text-rose-500" />
                        <span>Struk</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive List View (Flattened Hierarchy - Zero Nested Cards) */}
        <div className="md:hidden divide-y divide-zinc-800/80">
          {recentTransactions.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs font-sans">
              Belum ada transaksi tercatat.
            </div>
          ) : (
            recentTransactions.map((tx) => (
              <div key={tx.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-xs text-rose-400 min-w-0 truncate">{tx.invoice_number}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {tx.payment_status}
                  </span>
                </div>

                <div className="text-xs">
                  <p className="text-zinc-400 font-medium">Pelanggan: <span className="text-zinc-200 font-semibold">{tx.customer_name || 'Pelanggan Umum'}</span></p>
                </div>

                {/* Items preview */}
                {tx.items && tx.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tx.items.map((item, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/80 text-xs text-zinc-300 font-medium">
                        <span className="text-rose-400 font-bold mr-1">{Number(item.quantity)}x</span> {item.product_name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 gap-2">
                  <div className="min-w-0 truncate">
                    <span className="text-xs text-zinc-400 block uppercase font-mono">{tx.payment_method}</span>
                    <span className="text-sm font-bold text-white font-mono whitespace-nowrap">{formatRp(tx.total_amount)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTx(tx);
                      setReceiptModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Receipt size={14} className="text-rose-500" />
                    <span>Struk</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Unified Thermal Receipt Modal */}
      {receiptModalOpen && selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#ffffff' }}
            role="dialog" 
            aria-labelledby="receipt-dialog-title" 
            className="printable-receipt w-full max-w-sm text-zinc-900 rounded-2xl shadow-2xl p-6 relative font-mono text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Close Button */}
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="no-print absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Tutup struk"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 id="receipt-dialog-title" className="font-bold text-base uppercase text-zinc-900 font-sans tracking-tight">KasirKita POS</h2>
              <p className="text-xs text-zinc-600 font-sans">UMKM Ritel Modern</p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">{selectedTx.invoice_number}</p>
              <p className="text-xs text-zinc-500 font-mono">{new Date(selectedTx.created_at).toLocaleString('id-ID')}</p>
              <p className="text-xs text-zinc-700 mt-1 font-sans">Pelanggan: <span className="font-bold">{selectedTx.customer_name || 'Pelanggan Umum'}</span></p>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2 py-3 border-b border-dashed border-zinc-400">
              {selectedTx.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs gap-2">
                  <span className="min-w-0 truncate">{Number(item.quantity)}x {item.product_name}</span>
                  <span className="font-semibold shrink-0 whitespace-nowrap font-mono">{formatRp(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 py-3 text-xs">
              <div className="flex justify-between gap-2">
                <span>Subtotal:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(selectedTx.subtotal)}</span>
              </div>
              {Number(selectedTx.discount_amount) > 0 && (
                <div className="flex justify-between text-rose-600 font-medium gap-2">
                  <span>Diskon:</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">-{formatRp(selectedTx.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-dashed border-zinc-300 gap-2">
                <span>TOTAL:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(selectedTx.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 gap-2">
                <span>Metode:</span>
                <span className="uppercase shrink-0 whitespace-nowrap font-mono">{selectedTx.payment_method}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span>Bayar:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(selectedTx.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span>Kembali:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(selectedTx.change_amount)}</span>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-center py-2 text-xs text-zinc-500 border-t border-dashed border-zinc-400 font-sans">
              Terima kasih atas kunjungan Anda!
            </div>

            {/* Action Button */}
            <button
              onClick={() => window.print()}
              className="no-print w-full mt-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2.5 rounded-xl text-xs font-sans transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk Transaksi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
