import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Clock,
  ExternalLink,
  Receipt,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';

export default function Customers() {
  const { isOwner } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMembership, setSelectedMembership] = useState('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deleteConfirmCust, setDeleteConfirmCust] = useState(null);
  
  // Transaction History Modal
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyTransactions, setHistoryTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    membership_type: 'REGULAR',
    notes: '',
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers?all=true');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat data pelanggan:', err);
      setErrorMessage('Gagal memuat daftar pelanggan toko.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      membership_type: 'REGULAR',
      notes: '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      membership_type: cust.membership_type || 'REGULAR',
      notes: cust.notes || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openHistoryModal = async (cust) => {
    setHistoryCustomer(cust);
    setHistoryLoading(true);
    setHistoryTransactions([]);
    try {
      const res = await api.get(`/customers/${cust.id}/transactions`);
      if (res.data.success) {
        setHistoryTransactions(res.data.data.data || []);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat transaksi:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        membership_type: form.membership_type,
        notes: form.notes.trim() || null,
      };

      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, payload);
        setSuccessMessage('Data pelanggan berhasil diperbarui.');
      } else {
        await api.post('/customers', payload);
        setSuccessMessage('Pelanggan baru berhasil didaftarkan.');
      }

      setIsModalOpen(false);
      fetchCustomers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data pelanggan.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCust) return;
    try {
      setSubmitting(true);
      await api.delete(`/customers/${deleteConfirmCust.id}`);
      setSuccessMessage('Data pelanggan berhasil dihapus.');
      setDeleteConfirmCust(null);
      fetchCustomers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus data pelanggan.';
      setErrorMessage(msg);
      setDeleteConfirmCust(null);
    } finally {
      setSubmitting(false);
    }
  };

  const formatRp = (num) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  const formatWaUrl = (phone) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    const matchesType =
      selectedMembership === 'ALL' || c.membership_type === selectedMembership;

    return matchesSearch && matchesType;
  });

  const getMembershipBadge = (type) => {
    switch (type) {
      case 'VIP':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-950/70 border border-purple-800/80 text-purple-300 text-xs font-semibold shrink-0 whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>VIP</span>
          </span>
        );
      case 'WHOLESALE':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 text-xs font-semibold shrink-0 whitespace-nowrap flex items-center gap-1">
            <Building2 className="w-3 h-3 text-amber-400" />
            <span>Grosir</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300 text-xs font-semibold shrink-0 whitespace-nowrap">
            Reguler
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-rose-500 shrink-0" />
            <span>Master Pelanggan & Keanggotaan</span>
          </h1>
          <p className="text-sm text-zinc-300 mt-1 max-w-lg leading-relaxed">
            Pengelolaan data member toko, nomor kontak WhatsApp untuk struk digital, dan pelacakan total akumulasi belanja
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs sm:text-sm animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Search & Membership Filter Bar */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama pelanggan, nomor WhatsApp/HP, atau email..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>

        {/* Membership Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
          {[
            { id: 'ALL', label: 'Semua' },
            { id: 'REGULAR', label: 'Reguler' },
            { id: 'VIP', label: 'VIP' },
            { id: 'WHOLESALE', label: 'Grosir' },
          ].map((tab) => {
            const isActive = selectedMembership === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedMembership(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-zinc-400 font-mono shrink-0 px-1">
          Total: <strong className="text-zinc-200">{filteredCustomers.length}</strong> pelanggan
        </div>
      </div>

      {/* Customers Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
          Memuat data pelanggan toko...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80"
        >
          <Users className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Belum Ada Data Pelanggan</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Daftarkan pelanggan tetap toko Anda untuk mempermudah transaksi di kasir POS dan pelacakan program langganan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredCustomers.map((cust) => {
            const waUrl = formatWaUrl(cust.phone);

            return (
              <div
                key={cust.id}
                style={{ backgroundColor: '#18181b' }}
                className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
              >
                <div>
                  {/* Card Header: Avatar, Name, Membership, & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center font-bold text-rose-400 shrink-0 text-sm">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-white truncate" title={cust.name}>
                          {cust.name}
                        </h2>
                        <div className="mt-1 flex items-center gap-1.5">
                          {getMembershipBadge(cust.membership_type)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openHistoryModal(cust)}
                        title="Riwayat Belanja"
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(cust)}
                        title="Edit Data Pelanggan"
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => setDeleteConfirmCust(cust)}
                          title="Hapus Pelanggan"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-zinc-300 mt-2 mb-3">
                    {cust.phone ? (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-mono text-zinc-200 shrink-0 whitespace-nowrap">{cust.phone}</span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka WhatsApp"
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 transition-colors"
                          >
                            <span>WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-zinc-400 italic">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>No. HP belum didaftarkan</span>
                      </div>
                    )}

                    {cust.address && (
                      <div className="flex items-start gap-2 text-zinc-400 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 leading-snug">{cust.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Metrics (Total Spent & Visit Count) */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400">Total Belanja</span>
                    <strong className="text-rose-400 font-mono text-xs sm:text-sm font-bold truncate">
                      {formatRp(cust.total_spent)}
                    </strong>
                  </div>

                  <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
                    <span className="text-xs text-zinc-400">Frekuensi</span>
                    <span className="text-zinc-200 font-mono font-semibold">
                      {cust.transactions_count ?? 0} transaksi
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit Customer */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-500" />
              <span>{editingCustomer ? 'Edit Profil Pelanggan' : 'Daftar Pelanggan Baru'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              {editingCustomer ? 'Perbarui data kontak dan tipe member pelanggan ini.' : 'Daftarkan member pelanggan untuk pencatatan transaksi kasir yang lebih rapi.'}
            </p>

            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nama Pelanggan / Toko <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso, Toko Berkah..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Nomor WhatsApp / HP <span className="text-zinc-400 font-normal">(Disarankan untuk struk WA)</span>
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Tipe Keanggotaan (Membership)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'REGULAR', label: 'Reguler', desc: 'Pelanggan umum terdaftar' },
                    { id: 'VIP', label: 'VIP Member', desc: 'Pelanggan prioritas' },
                    { id: 'WHOLESALE', label: 'Grosir', desc: 'Toko / Warung kulakan' },
                  ].map((m) => {
                    const isSelected = form.membership_type === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setForm({ ...form, membership_type: m.id })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{m.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Email <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@pelanggan.com"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Alamat Lengkap <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows="2"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Jalan, nomor rumah, RT/RW atau kelurahan..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-400 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Catatan Khusus <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Contoh: Suka minta struk rangkap, langganan rokok..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  {submitting ? 'Menyimpan...' : editingCustomer ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {historyCustomer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
          >
            <button
              onClick={() => setHistoryCustomer(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                <span>Riwayat Transaksi Belanja</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pelanggan: <strong className="text-zinc-200">{historyCustomer.name}</strong> ({historyCustomer.phone || 'Tanpa no. HP'})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/80 pr-1">
              {historyLoading ? (
                <div className="py-12 flex items-center justify-center text-zinc-500 text-xs font-sans">
                  Memuat data riwayat transaksi...
                </div>
              ) : historyTransactions.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs font-sans">
                  <Receipt className="w-8 h-8 text-zinc-600 mx-auto mb-2.5" />
                  <p className="font-semibold text-zinc-300">Belum Ada Riwayat Transaksi</p>
                  <p className="text-zinc-500 mt-1 max-w-sm mx-auto">
                    Belum ada riwayat transaksi penjualan yang tercatat untuk pelanggan ini.
                  </p>
                </div>
              ) : (
                historyTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-1 last:pb-1"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-rose-400 shrink-0">{tx.invoice_number}</span>
                        <span className="text-xs text-zinc-500">•</span>
                        <span className="text-xs text-zinc-400 shrink-0 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-300 mt-1">
                        Kasir: <strong className="text-zinc-200">{tx.cashier?.name || 'Kasir'}</strong> | Metode: <span className="font-semibold text-zinc-200">{tx.payment_method}</span>
                      </div>
                      {tx.items && tx.items.length > 0 && (
                        <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          Item: {tx.items.map((i) => `${Number(i.quantity)}x ${i.product_name}`).join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-zinc-500 block">Total Tagihan</span>
                      <strong className="text-sm font-bold font-mono text-zinc-100">
                        {formatRp(tx.total_amount)}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 mt-2 border-t border-zinc-800 flex justify-end">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCust && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Hapus Data Pelanggan?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus data pelanggan{' '}
              <strong className="text-zinc-200">"{deleteConfirmCust.name}"</strong>?
              Riwayat invoice transaksi belanja yang sudah selesai akan tetap tersimpan aman.
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirmCust(null)}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-colors cursor-pointer shadow-md"
              >
                {submitting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
