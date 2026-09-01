import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Receipt,
  Search,
  Printer,
  X,
  AlertCircle,
  Ban,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail / Receipt Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Cancel / Void Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Pelanggan membatalkan pesanan');
  const [cancellingTx, setCancellingTx] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, paymentMethodFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = '/pos/transactions?per_page=50';
      if (statusFilter) url += `&status=${statusFilter}`;
      if (paymentMethodFilter) url += `&payment_method=${paymentMethodFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        setTransactions(res.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    return (
      t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.customer_name && t.customer_name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleOpenReceipt = async (id) => {
    try {
      const res = await api.get(`/pos/transactions/${id}`);
      if (res.data.success) {
        setSelectedTx(res.data.data);
        setReceiptModalOpen(true);
      }
    } catch (err) {
      console.error('Error opening receipt:', err);
    }
  };

  const handleOpenCancel = (tx) => {
    setCancellingTx(tx);
    setCancelReason('Pelanggan membatalkan pesanan');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingTx) return;
    setCancelLoading(true);
    try {
      const res = await api.post(`/pos/transactions/${cancellingTx.id}/cancel`, {
        reason: cancelReason,
      });
      if (res.data.success) {
        setCancelModalOpen(false);
        fetchTransactions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan transaksi.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Receipt className="w-6 h-6 text-rose-500" />
          <span>Riwayat Transaksi Penjualan</span>
        </h2>
        <p className="text-sm text-zinc-300 mt-1">
          Catatan seluruh invoice struk belanja kasir dan status pembayaran
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900 border border-zinc-800/80 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nomor invoice atau nama pelanggan..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="">Semua Metode</option>
            <option value="CASH">Tunai (CASH)</option>
            <option value="QRIS">QRIS</option>
            <option value="TRANSFER">Transfer Bank</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="">Semua Status</option>
            <option value="COMPLETED">Selesai (Lunas)</option>
            <option value="CANCELLED">Dibatalkan (Void)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="pb-3.5 pr-4">No. Invoice</th>
                <th className="pb-3.5 px-4">Waktu</th>
                <th className="pb-3.5 px-4">Pelanggan</th>
                <th className="pb-3.5 px-4">Kasir</th>
                <th className="pb-3.5 px-4">Metode Bayar</th>
                <th className="pb-3.5 px-4">Total Belanja</th>
                <th className="pb-3.5 px-4">Status</th>
                <th className="pb-3.5 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Memuat riwayat transaksi...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isCancelled = tx.payment_status === 'CANCELLED';
                  return (
                    <tr key={tx.id} className="hover:bg-zinc-800/30 font-sans transition-colors">
                      <td className="py-3.5 pr-4 font-mono font-bold text-rose-400">
                        {tx.invoice_number}
                      </td>
                      <td className="py-3.5 pr-4 text-zinc-400 font-mono text-xs whitespace-nowrap">
                        {new Date(tx.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-200 min-w-0 max-w-[200px] truncate">
                        {tx.customer_name || 'Pelanggan Umum'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 truncate max-w-[150px]">
                        {tx.cashier?.name || 'Kasir'}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-medium text-xs whitespace-nowrap">
                        {tx.payment_method}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-zinc-100 whitespace-nowrap">
                        {formatRp(tx.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isCancelled ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                          <span className={isCancelled ? 'text-rose-400' : 'text-emerald-400'}>
                            {tx.payment_status}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenReceipt(tx.id)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-rose-500" />
                            <span>Struk</span>
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => handleOpenCancel(tx)}
                              title="Batalkan Transaksi / Retur"
                              className="p-1.5 rounded-xl hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
                              aria-label="Batalkan transaksi"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unified Thermal Receipt Modal */}
      {receiptModalOpen && selectedTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#ffffff' }}
            role="dialog" 
            aria-labelledby="tx-receipt-title" 
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
              <h2 id="tx-receipt-title" className="font-bold text-base uppercase text-zinc-900 font-sans tracking-tight">KasirKita POS</h2>
              <p className="text-xs text-zinc-600 font-sans">UMKM Ritel Modern</p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">{selectedTx.invoice_number}</p>
              <p className="text-xs text-zinc-500 font-mono">{new Date(selectedTx.created_at).toLocaleString('id-ID')}</p>
              <p className="text-xs text-zinc-700 mt-1 font-sans">Kasir: <span className="font-bold">{selectedTx.cashier?.name || '-'}</span> • Pelanggan: <span className="font-bold">{selectedTx.customer_name || 'Pelanggan Umum'}</span></p>
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
                <div className="flex justify-between text-rose-600 font-semibold gap-2">
                  <span>Diskon {selectedTx.discount_code ? `(${selectedTx.discount_code})` : ''}:</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">-{formatRp(selectedTx.discount_amount)}</span>
                </div>
              )}
              {Number(selectedTx.tax_amount) > 0 && (
                <div className="flex justify-between text-zinc-700 font-medium gap-2">
                  <span>Pajak (PPN/PB1):</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(selectedTx.tax_amount)}</span>
                </div>
              )}
              {Number(selectedTx.fee_amount) > 0 && (
                <>
                  <div className="flex justify-between text-zinc-700 font-medium gap-2">
                    <span>Biaya Tambahan:</span>
                    <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(selectedTx.fee_amount)}</span>
                  </div>
                  {Array.isArray(selectedTx.fee_details) && selectedTx.fee_details.map((f, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-500 text-xs pl-2 gap-2">
                      <span>• {f.name}:</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(f.amount)}</span>
                    </div>
                  ))}
                </>
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

            {selectedTx.payment_status === 'CANCELLED' && (
              <div className="mt-2 p-2 rounded-lg bg-rose-100 text-rose-700 text-center font-bold text-xs">
                STATUS: DIBATALKAN / VOID
              </div>
            )}

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
              <span>Cetak Ulang Struk</span>
            </button>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && cancellingTx && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 relative"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>Batalkan Transaksi ({cancellingTx.invoice_number})</span>
                </h2>
                <p className="text-xs md:text-sm text-zinc-300 mt-1">
                  Pembatalan transaksi akan mengembalikan seluruh stok barang ke sistem secara otomatis.
                </p>
              </div>
              <button
                onClick={() => setCancelModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal pembatalan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Alasan Pembatalan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Salah input pesanan / retur barang..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
              >
                {cancelLoading ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
