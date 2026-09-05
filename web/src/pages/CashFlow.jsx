import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Search,
  X,
  DollarSign
} from 'lucide-react';

export default function CashFlow() {
  const [flows, setFlows] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Add Cash Flow Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'OUT',
    category: 'OPERATIONAL',
    amount: '',
    flow_date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    fetchCashFlows();
    fetchSuppliers();
  }, [typeFilter, categoryFilter]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers?all=true');
      if (res.data.success) setSuppliers(res.data.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchCashFlows = async () => {
    try {
      setLoading(true);
      let url = '/finance/cash-flows?per_page=50';
      if (typeFilter) url += `&type=${typeFilter}`;
      if (categoryFilter) url += `&category=${categoryFilter}`;

      const res = await api.get(url);
      if (res.data.success) {
        setFlows(res.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching cash flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setForm({
      type: 'OUT',
      category: 'OPERATIONAL',
      amount: '',
      supplier_id: '',
      flow_date: new Date().toISOString().slice(0, 10),
      notes: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...form,
        supplier_id: form.supplier_id || null,
      };
      const res = await api.post('/finance/cash-flows', payload);
      if (res.data.success) {
        setModalOpen(false);
        fetchCashFlows();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal mencatat arus kas.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/finance/export?type=cashflows', '_blank');
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  const totalIn = flows.filter((f) => f.type === 'IN').reduce((s, f) => s + Number(f.amount), 0);
  const totalOut = flows.filter((f) => f.type === 'OUT').reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Wallet className="w-6 h-6 text-rose-500" />
            <span>Buku Arus Kas Toko (Cash Flow)</span>
          </h2>
          <p className="text-sm text-zinc-300 mt-1">
            Pencatatan seluruh pemasukan penjualan dan pengeluaran operasional toko
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran / Pemasukan</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-300">Total Pemasukan (Inflow)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono mt-2 tracking-tight">{formatRp(totalIn)}</p>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-300">Total Pengeluaran (Outflow)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono mt-2 tracking-tight">{formatRp(totalOut)}</p>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800/80 shadow-md"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-zinc-300">Kas Bersih (Net Cash)</span>
            <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white font-mono mt-2 tracking-tight">{formatRp(totalIn - totalOut)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900 border border-zinc-800/80 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Semua Tipe (IN & OUT)</option>
            <option value="IN">Pemasukan (IN)</option>
            <option value="OUT">Pengeluaran (OUT)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="">Semua Kategori</option>
            <option value="SALES">Penjualan Kasir (SALES)</option>
            <option value="OPERATIONAL">Beban Operasional (OPERATIONAL)</option>
            <option value="PURCHASE">Kulakan / Restock (PURCHASE)</option>
            <option value="OTHER">Lainnya (OTHER)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="pb-3.5 pr-4">Tanggal</th>
                <th className="pb-3.5 px-4">Tipe</th>
                <th className="pb-3.5 px-4">Kategori</th>
                <th className="pb-3.5 px-4">Nominal</th>
                <th className="pb-3.5 px-4">Dicatat Oleh</th>
                <th className="pb-3.5 pl-4">Catatan / Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Memuat data arus kas...
                  </td>
                </tr>
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Belum ada catatan arus kas.
                  </td>
                </tr>
              ) : (
                flows.map((f) => (
                  <tr key={f.id} className="hover:bg-zinc-800/30 font-sans transition-colors">
                    <td className="py-3.5 pr-4 text-zinc-300 font-mono whitespace-nowrap">
                      {f.flow_date
                        ? new Date(f.flow_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${f.type === 'IN' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                        <span className={f.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}>
                          {f.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-medium text-xs whitespace-nowrap">
                      {f.category}
                    </td>
                    <td
                      className={`py-3.5 px-4 font-bold font-mono whitespace-nowrap ${
                        f.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {f.type === 'IN' ? `+${formatRp(f.amount)}` : `-${formatRp(f.amount)}`}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">{f.user?.name || '-'}</td>
                    <td className="py-3.5 pl-4 text-zinc-300 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {f.supplier && (
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-rose-300 border border-zinc-700/60 font-semibold text-xs whitespace-nowrap">
                            {f.supplier.name}
                          </span>
                        )}
                        <span>{f.notes || '-'}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Cash Flow */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-md p-6 relative"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Catat Arus Kas Baru</span>
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal arus kas"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Tipe Arus Kas</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500 font-bold"
                  >
                    <option value="OUT">Pengeluaran (OUT)</option>
                    <option value="IN">Pemasukan (IN)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500"
                  >
                    <option value="OPERATIONAL">Beban Operasional (Listrik/Air/Gaji)</option>
                    <option value="PURCHASE">Kulakan / Belanja Modal</option>
                    <option value="SALES">Pendapatan Lainnya</option>
                    <option value="OTHER">Lain-lain</option>
                  </select>
                </div>
              </div>

              {form.type === 'OUT' && (
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">Pemasok / Rekanan (Opsional)</label>
                  <select
                    value={form.supplier_id || ''}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500"
                  >
                    <option value="">-- Tanpa Pemasok Tertaut --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contact_person ? `(${s.contact_person})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nominal (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="50000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-bold outline-none focus:border-rose-500 text-sm placeholder-zinc-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  style={{ colorScheme: 'dark' }}
                  value={form.flow_date}
                  onChange={(e) => setForm({ ...form, flow_date: e.target.value })}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {}
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Misal: Pembayaran listrik toko bulan Agustus"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-400 outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
