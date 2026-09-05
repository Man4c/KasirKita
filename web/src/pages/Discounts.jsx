import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  TicketPercent,
  Plus,
  Search,
  Percent,
  Coins,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  X,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  Power,
  Layers,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function Discounts() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deleteConfirmDiscount, setDeleteConfirmDiscount] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    start_date: '',
    end_date: '',
    quota: '',
    is_active: true,
  });

  const [hasMinPurchase, setHasMinPurchase] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchDiscounts();
  }, [selectedType, selectedStatus]);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const params = { all: true };
      if (selectedType) params.type = selectedType;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/discounts', { params });
      setDiscounts(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat master promosi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const openAddModal = () => {
    setEditingDiscount(null);
    setHasMinPurchase(false);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      start_date: '',
      end_date: '',
      quota: '',
      is_active: true,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingDiscount(item);
    const resolvedType = item.type === 'MIN_SPEND' ? 'PERCENTAGE' : (item.type || 'PERCENTAGE');
    const hasMin = Boolean(parseFloat(item.min_purchase_amount) > 0 || item.type === 'MIN_SPEND');
    setHasMinPurchase(hasMin);
    setFormData({
      code: item.code || '',
      name: item.name || '',
      description: item.description || '',
      type: resolvedType,
      value: item.value ? parseFloat(item.value).toString() : '',
      min_purchase_amount: hasMin && item.min_purchase_amount ? parseFloat(item.min_purchase_amount).toString() : '',
      max_discount_amount: item.max_discount_amount ? parseFloat(item.max_discount_amount).toString() : '',
      start_date: item.start_date ? item.start_date.substring(0, 10) : '',
      end_date: item.end_date ? item.end_date.substring(0, 10) : '',
      quota: item.quota !== null ? item.quota.toString() : '',
      is_active: item.is_active,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setFormLoading(true);

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        type: formData.type,
        value: parseFloat(formData.value) || 0,
        min_purchase_amount: hasMinPurchase && formData.min_purchase_amount ? parseFloat(formData.min_purchase_amount) : 0,
        max_discount_amount: formData.type === 'PERCENTAGE' && formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
        start_date: formData.start_date ? `${formData.start_date} 00:00:00` : null,
        end_date: formData.end_date ? `${formData.end_date} 23:59:59` : null,
        quota: formData.quota ? parseInt(formData.quota, 10) : null,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, payload);
      } else {
        await api.post('/discounts', payload);
      }

      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      console.error('Error simpan promosi:', err);
      const msg = err.response?.data?.message || 'Gagal menyimpan data promosi. Periksa input kembali.';
      setErrorMessage(msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await api.patch(`/discounts/${item.id}/toggle-status`);
      setDiscounts((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, is_active: !d.is_active } : d))
      );
    } catch (err) {
      console.error('Gagal mengubah status promosi:', err);
      alert('Gagal mengubah status aktif promosi.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmDiscount) return;
    try {
      await api.delete(`/discounts/${deleteConfirmDiscount.id}`);
      setDeleteConfirmDiscount(null);
      fetchDiscounts();
    } catch (err) {
      console.error('Gagal menghapus promosi:', err);
      alert(err.response?.data?.message || 'Gagal menghapus promosi.');
    }
  };

  const formatRp = (val) => {
    const num = parseFloat(val) || 0;
    return 'Rp' + num.toLocaleString('id-ID');
  };

  // Filter live search
  const filteredDiscounts = discounts.filter((d) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.code?.toLowerCase().includes(s) ||
      d.name?.toLowerCase().includes(s) ||
      d.description?.toLowerCase().includes(s)
    );
  });

  // Calculate Metrics
  const totalDiscounts = discounts.length;
  const activeDiscountsCount = discounts.filter((d) => {
    if (!d.is_active) return false;
    const now = new Date();
    if (d.end_date && new Date(d.end_date) < now) return false;
    if (d.quota !== null && d.usage_count >= d.quota) return false;
    return true;
  }).length;
  const totalRedemptions = discounts.reduce((acc, curr) => acc + (curr.usage_count || 0), 0);

  const getPromoStatusBadge = (d) => {
    if (!d.is_active) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs font-semibold shrink-0 whitespace-nowrap border border-zinc-700/60">
          Nonaktif
        </span>
      );
    }

    const now = new Date();
    if (d.end_date && new Date(d.end_date) < now) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-400 text-xs font-semibold shrink-0 whitespace-nowrap border border-rose-800/80">
          Kadaluarsa
        </span>
      );
    }

    if (d.start_date && new Date(d.start_date) > now) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-950/60 text-amber-400 text-xs font-semibold shrink-0 whitespace-nowrap border border-amber-800/80">
          Akan Datang
        </span>
      );
    }

    if (d.quota !== null && d.usage_count >= d.quota) {
      return (
        <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 text-xs font-semibold shrink-0 whitespace-nowrap border border-zinc-700/60">
          Kuota Habis
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-400 text-xs font-semibold shrink-0 whitespace-nowrap border border-emerald-800/80 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Aktif</span>
      </span>
    );
  };

  const getDiscountTypeLabel = (type, val, maxVal) => {
    const num = parseFloat(val) || 0;
    if (type === 'PERCENTAGE') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-emerald-400 font-bold text-sm sm:text-base">
            Diskon {num}%
          </span>
          {maxVal && parseFloat(maxVal) > 0 && (
            <span className="text-xs text-zinc-400">
              (Maks. {formatRp(maxVal)})
            </span>
          )}
        </div>
      );
    }
    if (type === 'FIXED') {
      return (
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold text-sm sm:text-base">
            Potongan {formatRp(num)}
          </span>
        </div>
      );
    }
    if (type === 'MIN_SPEND') {
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-amber-400 font-bold text-sm sm:text-base">
            Diskon {num}%
          </span>
          {maxVal && parseFloat(maxVal) > 0 && (
            <span className="text-xs text-zinc-400">
              (Maks. {formatRp(maxVal)})
            </span>
          )}
        </div>
      );
    }
    return <span className="text-zinc-200">{num}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TicketPercent className="w-7 h-7 sm:w-8 sm:h-8 text-rose-500" />
            <span>Master Promosi & Diskon</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl leading-relaxed">
            Atur diskon tanggal kembar, potongan harga minimal belanja, dan kupon voucher otomatis di kasir POS.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md shadow-rose-600/20 active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Promosi</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Total Promosi</span>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1 font-mono">{totalDiscounts}</p>
            <span className="text-xs text-zinc-400">Promo terdaftar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-rose-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Promo Berjalan</span>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 font-mono">{activeDiscountsCount}</p>
            <span className="text-xs text-zinc-400">Siap dipakai di POS</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between shadow-sm"
        >
          <div>
            <span className="text-xs text-zinc-400 font-medium">Total Penukaran</span>
            <p className="text-xl sm:text-2xl font-bold text-rose-400 font-mono mt-1">{totalRedemptions}x</p>
            <span className="text-xs text-zinc-400">Klaim kupon voucher</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari kode promo (misal: HEMAT10), nama event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="">Semua Tipe Diskon</option>
            <option value="PERCENTAGE">Persentase (%)</option>
            <option value="FIXED">Potongan Nominal (Rp)</option>
            <option value="MIN_SPEND">Minimal Belanja</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-zinc-950/80 border border-zinc-800 rounded-xl text-zinc-300 focus:outline-none focus:border-rose-500 transition-colors cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="active">Aktif Berjalan</option>
            <option value="expired">Kadaluarsa / Habis</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Grid Kartu Promosi */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-56 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-pulse" />
          ))}
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80"
        >
          <TicketPercent className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Belum Ada Program Promosi</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Buat kupon promo tanggal kembar, diskon persentase, atau potongan belanja untuk menarik lebih banyak pembeli.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredDiscounts.map((d) => {
            const isPercentage = d.type === 'PERCENTAGE' || d.type === 'MIN_SPEND';
            const quotaUsage = d.quota ? `${d.usage_count || 0} / ${d.quota}` : `${d.usage_count || 0}x (Tanpa batas)`;
            const quotaPercent = d.quota ? Math.min(100, Math.round(((d.usage_count || 0) / d.quota) * 100)) : null;

            return (
              <div
                key={d.id}
                style={{ backgroundColor: '#18181b' }}
                className={`bg-zinc-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm relative overflow-hidden ${
                  !d.is_active ? 'opacity-70 border-zinc-800/50' : 'border-zinc-800/80'
                }`}
              >
                <div>
                  {/* Card Header: Icon, Name, Status, & Actions */}
                  <div className="flex items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                        isPercentage 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isPercentage ? <Percent className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm sm:text-base font-bold text-white truncate" title={d.name}>
                            {d.name}
                          </h2>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {getPromoStatusBadge(d)}
                          <span className="text-xs text-zinc-400">
                            {d.type === 'PERCENTAGE' ? 'Diskon Persen' : d.type === 'FIXED' ? 'Potongan Tetap' : 'Minimal Belanja'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEditModal(d)}
                        title="Edit Promosi"
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmDiscount(d)}
                        title="Hapus Promosi"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Promo Code & Copy (Flattened - No Nested Container) */}
                  <div className="mt-3 py-2 border-y border-zinc-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-zinc-400 shrink-0">Kode Kupon:</span>
                      <span className="font-mono text-sm sm:text-base font-extrabold text-rose-400 tracking-wider">
                        {d.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopyCode(d.code)}
                      className="px-2.5 py-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      title="Salin kode voucher"
                    >
                      {copiedCode === d.code ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Discount Details & Terms */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div>
                      {getDiscountTypeLabel(d.type, d.value, d.max_discount_amount)}
                    </div>

                    {parseFloat(d.min_purchase_amount) > 0 ? (
                      <div className="text-zinc-300 flex items-center gap-1.5">
                        <span className="text-zinc-400">Min. Belanja:</span>
                        <strong className="text-zinc-200 font-mono font-medium">{formatRp(d.min_purchase_amount)}</strong>
                      </div>
                    ) : (
                      <div className="text-zinc-400 italic">
                        Tanpa batas minimal belanja
                      </div>
                    )}

                    {/* Active Period */}
                    {(d.start_date || d.end_date) ? (
                      <div className="text-zinc-400 flex items-center gap-1.5 pt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-mono text-zinc-300 text-xs truncate">
                          {d.start_date ? d.start_date.substring(0, 10) : 'Kapan saja'} s/d {d.end_date ? d.end_date.substring(0, 10) : 'Seterusnya'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-zinc-400 flex items-center gap-1.5 pt-0.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Masa berlaku selamanya</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Quota Progress & Status Toggle */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs text-zinc-400">Klaim Kupon:</span>
                    <strong className="text-zinc-200 font-mono text-xs font-semibold">
                      {quotaUsage}
                    </strong>
                    {quotaPercent !== null && (
                      <div className="w-full max-w-[140px] h-1.5 rounded-full bg-zinc-800 mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-rose-500 rounded-full transition-all" 
                          style={{ width: `${quotaPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
                    <span className="text-xs text-zinc-400 mb-1">Status Promo</span>
                    <button
                      onClick={() => handleToggleStatus(d)}
                      title={d.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        d.is_active
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-800'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      <span>{d.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Promosi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <TicketPercent className="w-5 h-5 text-rose-500" />
              <span>{editingDiscount ? 'Edit Master Promosi' : 'Tambah Promosi Baru'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              Tentukan kode kupon, nilai diskon, dan kriteria pemakaian di kasir POS.
            </p>

            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Kode Kupon POS <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: DISKON99"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono uppercase tracking-wider focus:outline-none focus:border-rose-500"
                  />
                  <span className="text-xs text-zinc-400 mt-1 block">Otomatis kapital</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tipe Diskon <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="PERCENTAGE">Persentase (%)</option>
                    <option value="FIXED">Potongan Nominal (Rp)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Promosi / Event <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Promo Tanggal Kembar 9.9 Super Diskon"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className={`grid grid-cols-1 ${formData.type === 'PERCENTAGE' ? 'sm:grid-cols-2' : ''} gap-4`}>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Besaran Nilai Diskon <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder={formData.type === 'FIXED' ? '15000' : '10'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full pl-3 pr-10 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-bold">
                      {formData.type === 'FIXED' ? 'Rp' : '%'}
                    </span>
                  </div>
                </div>

                {formData.type === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Maksimal Potongan (Plafon Rp, Opsional)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="Kosongkan jika tanpa batas"
                      value={formData.max_discount_amount}
                      onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                    />
                  </div>
                )}
              </div>

              {/* Toggle: Syarat Minimal Belanja */}
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Syarat Minimal Belanja
                  </span>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {hasMinPurchase
                      ? 'Promo hanya berlaku jika total belanja kasir memenuhi batas minimal'
                      : 'Promo berlaku untuk semua nilai belanja tanpa batas minimal'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !hasMinPurchase;
                    setHasMinPurchase(next);
                    if (!next) {
                      setFormData((prev) => ({ ...prev, min_purchase_amount: '' }));
                    }
                  }}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    hasMinPurchase ? 'bg-rose-600' : 'bg-zinc-800'
                  }`}
                  aria-pressed={hasMinPurchase}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      hasMinPurchase ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Input Minimal Belanja (Progressive Disclosure) */}
              {hasMinPurchase && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Minimal Pembelian (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required={hasMinPurchase}
                    placeholder="Contoh: 50.000"
                    value={formData.min_purchase_amount}
                    onChange={(e) => setFormData({ ...formData, min_purchase_amount: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tanggal Mulai Berlaku
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Tanggal Berakhir Promo
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Kuota Penggunaan (Kupon)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Kosongkan jika tanpa batas kuota"
                    value={formData.quota}
                    onChange={(e) => setFormData({ ...formData, quota: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded bg-zinc-900 border-zinc-700 focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-zinc-300">
                      Aktifkan promosi ini di POS
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Catatan / Deskripsi Promo (Opsional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Catatan tambahan mengenai syarat promo ini..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer flex items-center gap-2"
                >
                  {formLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{editingDiscount ? 'Simpan Perubahan' : 'Buat Promosi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteConfirmDiscount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-xl text-center animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Hapus Promosi?</h3>
            <p className="text-xs text-zinc-400 mb-5">
              Promosi <strong className="text-rose-400 font-mono">{deleteConfirmDiscount.code}</strong> ({deleteConfirmDiscount.name}) akan dinonaktifkan dan dihapus dari daftar.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmDiscount(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
