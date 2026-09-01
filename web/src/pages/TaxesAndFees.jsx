import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  ReceiptText,
  Plus,
  Search,
  Percent,
  Coins,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  CheckCircle2,
  Power,
  Info,
  Layers,
  ShoppingBag,
  CreditCard,
  Package,
  HelpCircle,
} from 'lucide-react';

export default function TaxesAndFees() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, TAX, FEE
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    type: 'PERCENTAGE',
    value: '',
    apply_to: 'ALL',
    payment_method: '',
    is_tax: false,
    is_default: false,
    is_active: true,
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch Taxes and Fees from API
  const fetchItems = async () => {
    try {
      setLoading(true);
      const res = await api.get('/taxes-and-fees');
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data pajak dan biaya:', err);
      setErrorMessage('Gagal memuat data pajak dan biaya.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const formatRp = (val) => {
    return 'Rp' + Number(val || 0).toLocaleString('id-ID');
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      type: item.type,
      value: Number(item.value).toString(),
      apply_to: item.apply_to,
      payment_method: item.payment_method || '',
      is_tax: Boolean(item.is_tax),
      is_default: Boolean(item.is_default),
      is_active: Boolean(item.is_active),
      description: item.description || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (item) => {
    try {
      const res = await api.patch(`/taxes-and-fees/${item.id}/toggle-status`);
      if (res.data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i))
        );
        const statusText = !item.is_active ? 'diaktifkan' : 'dinonaktifkan';
        setSuccessMessage(`Komponen "${item.name}" berhasil ${statusText}.`);
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Gagal mengubah status.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      apply_to: formData.apply_to,
      payment_method: formData.apply_to === 'SPECIFIC_PAYMENT' ? formData.payment_method : null,
      is_tax: formData.is_tax,
      is_default: formData.is_default,
      is_active: formData.is_active,
      description: formData.description.trim() || null,
    };

    try {
      if (editingItem) {
        await api.put(`/taxes-and-fees/${editingItem.id}`, payload);
        setSuccessMessage('Komponen pajak/biaya berhasil diperbarui.');
      } else {
        await api.post('/taxes-and-fees', payload);
        setSuccessMessage('Komponen pajak/biaya baru berhasil ditambahkan.');
      }
      setIsModalOpen(false);
      fetchItems();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      setSubmitting(true);
      await api.delete(`/taxes-and-fees/${deleteConfirmItem.id}`);
      setSuccessMessage('Komponen pajak/biaya berhasil dihapus.');
      setDeleteConfirmItem(null);
      fetchItems();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Gagal menghapus komponen.');
      setDeleteConfirmItem(null);
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchTab =
      activeTab === 'ALL'
        ? true
        : activeTab === 'TAX'
        ? Boolean(item.is_tax)
        : !Boolean(item.is_tax);

    const matchStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? Boolean(item.is_active)
        : !Boolean(item.is_active);

    return matchSearch && matchTab && matchStatus;
  });

  const totalActive = items.filter((i) => i.is_active).length;
  const totalTaxes = items.filter((i) => i.is_tax).length;
  const totalFees = items.filter((i) => !i.is_tax).length;

  // Live calculation preview
  const sampleBaseAmount = 100000;
  const previewCalculation = () => {
    const val = parseFloat(formData.value) || 0;
    if (formData.type === 'PERCENTAGE') {
      const calc = (sampleBaseAmount * val) / 100;
      return `${formatRp(calc)} (dari Rp100.000)`;
    }
    return formatRp(val);
  };

  const getApplyToBadge = (item) => {
    if (item.apply_to === 'ALL') {
      return (
        <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-semibold whitespace-nowrap shrink-0">
          Semua Transaksi
        </span>
      );
    }
    if (item.apply_to === 'SPECIFIC_PAYMENT') {
      return (
        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
          <CreditCard className="w-3 h-3" />
          Khusus {item.payment_method || 'Digital'}
        </span>
      );
    }
    if (item.apply_to === 'TAKEAWAY_ONLY') {
      return (
        <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
          <ShoppingBag className="w-3 h-3" />
          Bawa Pulang
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0">
        <Package className="w-3 h-3" />
        Pilihan Kasir
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500 shrink-0" />
            <span>Master Pajak & Biaya</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Konfigurasi tarif PPN/PB1 restoran, biaya kemasan kantong plastik, service charge, dan MDR QRIS kasir POS.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pajak / Biaya</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Total Komponen</span>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono">{items.length}</p>
            <span className="text-xs text-zinc-400">Komponen terdaftar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-rose-400">
            <ReceiptText className="w-6 h-6" />
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Komponen Aktif</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono">{totalActive}</p>
            <span className="text-xs text-zinc-400">Siap dipakai di POS</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Power className="w-6 h-6" />
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Pajak & Biaya</span>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 font-mono mt-1">{totalTaxes} Pajak / {totalFees} Biaya</p>
            <span className="text-xs text-zinc-400">Konfigurasi terpasang</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-cyan-400">
            <Percent className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Unified Search & Filter Bar */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama pajak atau biaya (misal: PPN, Kantong Plastik, QRIS)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Semua Tipe ({items.length})</option>
            <option value="TAX">Pajak Penjualan ({totalTaxes})</option>
            <option value="FEE">Biaya & Layanan ({totalFees})</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Hanya Aktif</option>
            <option value="INACTIVE">Hanya Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Grid of Taxes & Fees */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500 text-sm">
          Memuat data pajak dan biaya...
        </div>
      ) : filteredItems.length === 0 ? (
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80"
        >
          <ReceiptText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Belum Ada Pajak atau Biaya</h2>
          <p className="text-xs text-zinc-500">Tidak ada komponen yang sesuai dengan kriteria filter atau pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const isPercent = item.type === 'PERCENTAGE';
            const displayValue = isPercent
              ? `${Number(item.value)}%`
              : formatRp(item.value);

            return (
              <div
                key={item.id}
                style={{ backgroundColor: '#18181b' }}
                className={`p-5 rounded-2xl bg-zinc-900 border transition-all duration-200 flex flex-col justify-between ${
                  item.is_active
                    ? 'border-zinc-800 hover:border-zinc-700/80'
                    : 'border-zinc-800/60 opacity-60'
                }`}
              >
                <div>
                  {/* Top Row: Category Badge, Name, & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.is_tax ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold whitespace-nowrap shrink-0">
                            Pajak (Tax)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold whitespace-nowrap shrink-0">
                            Biaya Tambahan
                          </span>
                        )}

                        {item.is_default && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold whitespace-nowrap shrink-0">
                            Default POS
                          </span>
                        )}
                      </div>

                      <h2 className="font-bold text-base text-zinc-100 truncate" title={item.name}>
                        {item.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit Komponen"
                        aria-label="Edit komponen"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmItem(item)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Hapus Komponen"
                        aria-label="Hapus komponen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Value Row */}
                  <div className="my-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono whitespace-nowrap">
                      {displayValue}
                    </span>
                    <span className="text-xs text-zinc-400 whitespace-nowrap">
                      {isPercent ? 'dari subtotal belanja' : 'per transaksi'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                    {item.description || 'Tidak ada deskripsi tambahan.'}
                  </p>
                </div>

                {/* Bottom Row: Rule Badge & Active Status Toggle */}
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    {getApplyToBadge(item)}
                  </div>

                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                      item.is_active
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Klik untuk mengubah status aktif"
                  >
                    <Power className="w-3 h-3" />
                    <span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Tax & Fee */}
      {isModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 relative shadow-xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Pajak / Biaya' : 'Tambah Pajak / Biaya Baru'}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Konfigurasi aturan pengenaan biaya di kasir POS
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="pt-4 space-y-4 text-xs">
              {/* Nama Komponen */}
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nama Pajak / Biaya <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: PPN 11%, Biaya Kantong Plastik, Surcharge QRIS"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500"
                />
              </div>

              {/* Tipe Pajak / Biaya */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Klasifikasi <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.is_tax ? 'TAX' : 'FEE'}
                    onChange={(e) => setFormData({ ...formData, is_tax: e.target.value === 'TAX' })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="TAX">Pajak Penjualan (PPN/PB1)</option>
                    <option value="FEE">Biaya Operasional / Layanan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Format Perhitungan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500 font-semibold"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Nominal Tetap (Rp)</option>
                  </select>
                </div>
              </div>

              {/* Nilai dan Live Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Besaran Nilai ({formData.type === 'PERCENTAGE' ? '%' : 'Rp'}) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={formData.type === 'PERCENTAGE' ? '0.01' : '1'}
                      min="0"
                      required
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder={formData.type === 'PERCENTAGE' ? '11' : '200'}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 font-mono font-bold outline-none focus:border-rose-500 pr-10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold pointer-events-none">
                      {formData.type === 'PERCENTAGE' ? '%' : 'Rp'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">
                    Simulasi Belanja Rp100.000
                  </label>
                  <div className="h-[38px] flex items-center text-xs">
                    <span className="text-zinc-400 mr-1.5 font-medium">Beban:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      +{previewCalculation()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aturan Pemicu (Apply To) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Berlaku Pada <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.apply_to}
                    onChange={(e) => setFormData({ ...formData, apply_to: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500"
                  >
                    <option value="ALL">Semua Transaksi</option>
                    <option value="SPECIFIC_PAYMENT">Khusus Metode Pembayaran Tertentu</option>
                    <option value="TAKEAWAY_ONLY">Khusus Pembelian Bawa Pulang</option>
                    <option value="MANUAL">Pilihan Kasir (Manual di POS)</option>
                  </select>
                </div>

                {formData.apply_to === 'SPECIFIC_PAYMENT' ? (
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Metode Pembayaran Pemicu <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.payment_method}
                      onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500"
                    >
                      <option value="">Pilih Metode</option>
                      <option value="QRIS">QRIS</option>
                      <option value="TRANSFER">Transfer Bank</option>
                      <option value="DEBIT">Kartu Debit / EDC</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">
                      Otomatis Terpilih (Default)
                    </label>
                    <label className="inline-flex items-center gap-2 h-9 text-xs text-zinc-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.is_default}
                        onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-0 bg-zinc-950 cursor-pointer"
                      />
                      <span>Aktif otomatis saat checkout kasir</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Keterangan Tambahan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Catatan regulasi pajak daerah atau tujuan operasional biaya ini..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition-colors text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold cursor-pointer transition-colors text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Menyimpan...' : editingItem ? 'Perbarui' : 'Simpan Komponen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deleteConfirmItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmItem(null);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 relative shadow-xl">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Hapus Komponen?</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Konfirmasi penghapusan pajak/biaya</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-white">"{deleteConfirmItem.name}"</strong>?
            </p>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>Komponen akan diarsipkan. Riwayat transaksi masa lalu yang pernah memuat komponen ini tetap aman dan tercatat.</span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmItem(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold cursor-pointer transition-colors text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{submitting ? 'Menghapus...' : 'Ya, Hapus Komponen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
