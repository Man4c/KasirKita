import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ClipboardCheck,
  Plus,
  History,
  AlertCircle,
  CheckCircle,
  X,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function StockOpname() {
  const [opnames, setOpnames] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Audit Session State
  const [newAuditModalOpen, setNewAuditModalOpen] = useState(false);
  const [auditItems, setAuditItems] = useState([]);
  const [auditNotes, setAuditNotes] = useState('Audit Rutin Stok Toko');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // View Detail State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOpname, setSelectedOpname] = useState(null);

  useEffect(() => {
    fetchOpnames();
    fetchProducts();
  }, []);

  const fetchOpnames = async () => {
    try {
      setLoading(true);
      const res = await api.get('/stock-opnames');
      if (res.data.success) setOpnames(res.data.data.data);
    } catch (err) {
      console.error('Error fetching opnames:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?is_active=true&per_page=100');
      if (res.data.success) {
        setProducts(res.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleOpenNewAudit = () => {
    // Populate audit items from products with clean parsed numbers
    const initialItems = products.map((p) => {
      const stockNum = Number(p.stock || 0);
      const cleanStock = Number.isInteger(stockNum) ? stockNum : Number(stockNum.toFixed(2));
      return {
        product_id: p.id,
        product_name: p.name,
        system_stock: cleanStock,
        physical_stock: cleanStock, // Default to clean system stock
        base_unit: p.base_unit?.symbol || 'pcs',
        reason: '',
      };
    });

    setAuditItems(initialItems);
    setAuditNotes('Audit Rutin Stok Toko');
    setFormError('');
    setNewAuditModalOpen(true);
  };

  const handleUpdatePhysicalStock = (productId, val) => {
    const num = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setAuditItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, physical_stock: num }
          : item
      )
    );
  };

  const handleUpdateReason = (productId, reason) => {
    setAuditItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, reason }
          : item
      )
    );
  };

  const handleSubmitAudit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const res = await api.post('/stock-opnames', {
        notes: auditNotes,
        apply_immediately: true,
        items: auditItems.map((i) => ({
          product_id: i.product_id,
          physical_stock: Number(i.physical_stock || 0),
          reason: i.reason || 'Penyesuaian Stock Opname',
        })),
      });

      if (res.data.success) {
        setNewAuditModalOpen(false);
        fetchOpnames();
        fetchProducts();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan stock opname.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewDetail = async (opnameId) => {
    try {
      const res = await api.get(`/stock-opnames/${opnameId}`);
      if (res.data.success) {
        setSelectedOpname(res.data.data);
        setDetailModalOpen(true);
      }
    } catch (err) {
      console.error('Error viewing opname detail:', err);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-rose-500" />
            <span>Stock Opname (Rekonsiliasi Fisik)</span>
          </h2>
          <p className="text-sm text-zinc-300 mt-1">
            Pencocokan jumlah stok fisik toko dengan catatan sistem dan koreksi selisih mutasi
          </p>
        </div>

        <button
          onClick={handleOpenNewAudit}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Mulai Sesi Audit Baru</span>
        </button>
      </div>

      {/* Opname History Table */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl"
      >
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4">Riwayat Sesi Audit</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="pb-3.5 pr-4">No. Opname</th>
                <th className="pb-3.5 px-4">Tanggal Audit</th>
                <th className="pb-3.5 px-4">Auditor</th>
                <th className="pb-3.5 px-4">Total Item Diaudit</th>
                <th className="pb-3.5 px-4">Status</th>
                <th className="pb-3.5 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Memuat riwayat stock opname...
                  </td>
                </tr>
              ) : opnames.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm font-sans">
                    Belum ada riwayat sesi stock opname.
                  </td>
                </tr>
              ) : (
                opnames.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-800/30 font-sans transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-rose-400 whitespace-nowrap">
                      {o.opname_number}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                      {new Date(o.conducted_at || o.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 whitespace-nowrap">
                      {o.user?.name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-mono whitespace-nowrap">
                      {o.items_count} produk
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
                        <span className="capitalize">{o.status}</span>
                      </div>
                    </td>
                    <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(o.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Audit Modal */}
      {newAuditModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 relative max-h-[90vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>Sesi Stock Opname Baru</span>
                </h2>
                <p className="text-xs md:text-sm text-zinc-300 mt-1">
                  Masukkan jumlah stok fisik nyata yang ditemukan di toko untuk setiap produk.
                </p>
              </div>
              <button
                onClick={() => setNewAuditModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal audit"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {formError}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Catatan Audit</label>
              <input
                type="text"
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Misal: Audit stok akhir bulan"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-400 outline-none focus:border-rose-500"
              />
            </div>

            {/* Audit Items Table */}
            <div className="flex-1 overflow-y-auto mb-4">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 font-semibold text-xs uppercase sticky top-0">
                  <tr>
                    <th className="py-3 px-3.5">Nama Produk</th>
                    <th className="py-3 px-3.5">Stok Sistem</th>
                    <th className="py-3 px-3.5">Stok Fisik Nyata</th>
                    <th className="py-3 px-3.5">Selisih (+/-)</th>
                    <th className="py-3 px-3.5">Alasan / Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {auditItems.map((item) => {
                    const diff = (Number(item.physical_stock) || 0) - Number(item.system_stock || 0);
                    const diffClean = Number.isInteger(diff) ? diff : Number(diff.toFixed(2));
                    return (
                      <tr key={item.product_id} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 px-3.5 font-sans font-medium text-zinc-200">
                          {item.product_name}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-400 font-bold whitespace-nowrap">
                          {item.system_stock} {item.base_unit}
                        </td>
                        <td className="py-2.5 px-3.5 whitespace-nowrap">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.physical_stock}
                            onChange={(e) => handleUpdatePhysicalStock(item.product_id, e.target.value)}
                            className="w-24 bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-lg px-2.5 py-1 text-center text-xs text-zinc-100 font-bold outline-none font-mono"
                          />
                        </td>
                        <td className="py-2.5 px-3.5 font-bold whitespace-nowrap">
                          <span
                            className={
                              diffClean === 0
                                ? 'text-zinc-500'
                                : diffClean > 0
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }
                          >
                            {diffClean > 0 ? `+${diffClean}` : diffClean}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-sans">
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(e) => handleUpdateReason(item.product_id, e.target.value)}
                            placeholder="Alasan selisih..."
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-lg px-2.5 py-1 text-xs text-zinc-300 placeholder-zinc-400 outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewAuditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitAudit}
                disabled={formLoading}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-950/40 cursor-pointer disabled:opacity-50"
              >
                {formLoading ? 'Menyimpan...' : 'Sinkronkan & Simpan Hasil Audit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {detailModalOpen && selectedOpname && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-3xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">
                  Rincian Hasil Stock Opname ({selectedOpname.opname_number})
                </h2>
                <p className="text-xs md:text-sm text-zinc-300 mt-1">{selectedOpname.notes}</p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup detail"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 font-semibold text-xs uppercase">
                  <tr>
                    <th className="py-3 px-3.5">Produk</th>
                    <th className="py-3 px-3.5">Stok Sistem</th>
                    <th className="py-3 px-3.5">Stok Fisik</th>
                    <th className="py-3 px-3.5">Selisih</th>
                    <th className="py-3 px-3.5">Nominal Selisih</th>
                    <th className="py-3 px-3.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {selectedOpname.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3.5 font-sans font-medium text-zinc-200">
                        {item.product?.name}
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-400">{item.system_stock}</td>
                      <td className="py-2.5 px-3.5 text-zinc-200 font-bold">{item.physical_stock}</td>
                      <td className={`py-2.5 px-3.5 font-bold ${item.difference === 0 ? 'text-zinc-500' : item.difference > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td className="py-2.5 px-3.5 text-zinc-200 font-mono">
                        {formatRp(item.total_difference_cost)}
                      </td>
                      <td className="py-2.5 px-3.5 font-sans text-zinc-300 text-xs">
                        {item.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
