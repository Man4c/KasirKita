import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Shield,
  KeyRound,
  ExternalLink,
  Power,
  DollarSign,
  Receipt,
  Users as UsersIcon,
  ShieldCheck,
  User as UserIcon
} from 'lucide-react';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '' | 'cashier' | 'owner'

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  
  // Delete confirmation
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'cashier',
    password: '',
    is_active: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users?all=true');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Gagal memuat data pengguna:', err);
      setErrorMessage('Gagal memuat daftar staf toko.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      role: 'cashier',
      password: '',
      is_active: true,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setForm({
      name: u.name,
      email: u.email,
      phone: u.phone || '',
      role: u.role,
      password: '',
      is_active: u.is_active,
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openResetModal = (u) => {
    setResetModalUser(u);
    setNewPassword('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setErrorMessage('Nama dan email wajib diisi.');
      return;
    }

    if (!editingUser && (!form.password || form.password.length < 6)) {
      setErrorMessage('Kata sandi awal minimal 6 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      if (editingUser) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          is_active: form.is_active,
        };
        await api.put(`/users/${editingUser.id}`, payload);
        setSuccessMessage('Data pengguna berhasil diperbarui.');
      } else {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          password: form.password,
          is_active: form.is_active,
        };
        await api.post('/users', payload);
        setSuccessMessage('Akun staf kasir baru berhasil dibuat.');
      }

      setIsModalOpen(false);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan akun pengguna.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');
      await api.post(`/users/${resetModalUser.id}/reset-password`, {
        new_password: newPassword,
      });

      setSuccessMessage(`Kata sandi akun ${resetModalUser.name} berhasil direset.`);
      setResetModalUser(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mereset kata sandi.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (u) => {
    if (u.id === currentUser?.id) {
      setErrorMessage('Anda tidak dapat mengubah status aktif akun Anda sendiri.');
      return;
    }

    try {
      const res = await api.patch(`/users/${u.id}/toggle-status`);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        fetchUsers();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah status akun.';
      setErrorMessage(msg);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      setSubmitting(true);
      await api.delete(`/users/${deleteConfirmUser.id}`);
      setSuccessMessage('Akun staf berhasil dihapus.');
      setDeleteConfirmUser(null);
      fetchUsers();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus akun pengguna.';
      setErrorMessage(msg);
      setDeleteConfirmUser(null);
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

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.includes(term));
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const totalStaffCount = users.length;
  const activeCashiersCount = users.filter((u) => u.role === 'cashier' && u.is_active).length;
  const totalSalesAll = users.reduce((acc, u) => acc + Number(u.total_sales || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-6 h-6 text-rose-500 shrink-0" />
            <span>Master Pengguna & Staf Kasir</span>
          </h1>
          <p className="text-sm text-zinc-300 mt-1 max-w-lg leading-relaxed">
            Manajemen akun kasir, kontrol akses toko, reset kata sandi, dan ringkasan performa penjualan kasir
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
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

      {/* Quick Stats Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-rose-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-zinc-400 block font-medium">Total Akun Terdaftar</span>
            <span className="text-xl font-bold font-mono text-white">{totalStaffCount} pengguna</span>
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-zinc-400 block font-medium">Kasir Aktif Bertugas</span>
            <span className="text-xl font-bold font-mono text-emerald-400">{activeCashiersCount} kasir</span>
          </div>
        </div>

        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3.5 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-zinc-400 block font-medium">Total Omzet Penjualan Staf</span>
            <span className="text-lg sm:text-xl font-bold font-mono text-amber-400 truncate block">
              {formatRp(totalSalesAll)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div 
        style={{ backgroundColor: '#18181b' }}
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama staf, email login, atau nomor telepon..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {[
            { id: '', label: 'Semua Peran' },
            { id: 'cashier', label: 'Kasir Saja' },
            { id: 'owner', label: 'Pemilik (Owner)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                roleFilter === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Users Cards Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
          Memuat data staf toko...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80"
        >
          <UserCheck className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Tidak Ada Data Pengguna</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Tidak ditemukan pengguna yang sesuai dengan pencarian atau filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredUsers.map((u) => {
            const isSelf = u.id === currentUser?.id;
            const waUrl = formatWaUrl(u.phone);
            const initials = u.name
              ? u.name
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'US';

            return (
              <div
                key={u.id}
                style={{ backgroundColor: '#18181b' }}
                className={`bg-zinc-900 border rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm ${
                  !u.is_active ? 'opacity-70 border-zinc-800/50' : 'border-zinc-800/80'
                }`}
              >
                <div>
                  {/* Card Top: Avatar, Name, Role Badge, & Actions */}
                  <div className="flex items-start justify-between gap-2.5 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                          u.role === 'owner'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm sm:text-base font-bold text-white truncate" title={u.name}>
                            {u.name}
                          </h2>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs shrink-0 whitespace-nowrap font-medium border border-zinc-700/60">
                              Anda
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${
                              u.role === 'owner'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {u.role === 'owner' ? 'Owner' : 'Kasir'}
                          </span>

                          <span className="inline-flex items-center gap-1.5 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                u.is_active ? 'bg-emerald-400' : 'bg-zinc-500'
                              }`}
                            />
                            <span className={u.is_active ? 'text-emerald-400 font-medium' : 'text-zinc-500'}>
                              {u.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openResetModal(u)}
                        title="Reset Kata Sandi"
                        className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(u)}
                        title="Edit Profil"
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {!isSelf && (
                        <button
                          onClick={() => setDeleteConfirmUser(u)}
                          title="Hapus Akun"
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-zinc-300 mt-2 mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="text-zinc-200 truncate font-mono text-xs" title={u.email}>
                        {u.email}
                      </span>
                    </div>

                    {u.phone ? (
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="font-mono text-zinc-200 shrink-0 whitespace-nowrap">{u.phone}</span>
                        </div>
                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat WhatsApp"
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900/60 transition-colors"
                          >
                            <span>WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-zinc-400 italic">
                        <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>Belum ada no telepon</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Bottom: Performance Metrics & Toggle Status */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-zinc-400">Total Omzet Kasir</span>
                    <strong className="text-rose-400 font-mono text-xs sm:text-sm font-bold truncate">
                      {formatRp(u.total_sales)}
                    </strong>
                    <span className="text-xs text-zinc-400 font-mono">
                      {u.transactions_count ?? 0} transaksi
                    </span>
                  </div>

                  <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
                    <span className="text-xs text-zinc-400 mb-1">Status Akun</span>
                    {isSelf ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 text-xs font-semibold">
                        Aktif (Anda)
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.is_active ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          u.is_active
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-emerald-950/40 hover:text-emerald-400 hover:border-emerald-800'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add / Edit User */}
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
              <UserCheck className="w-5 h-5 text-rose-500" />
              <span>{editingUser ? 'Edit Akun Pengguna' : 'Tambah Akun Staf Baru'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              {editingUser ? 'Perbarui data profil dan hak akses staf toko.' : 'Daftarkan kasir baru untuk shift kerja toko Anda.'}
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
                  Nama Lengkap Staf <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Siti Nurhaliza (Kasir Shift Pagi)"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Email Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="kasir@toko.com"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nomor WhatsApp / HP
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Peran Akun (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={editingUser?.id === currentUser?.id}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none disabled:opacity-50"
                >
                  <option value="cashier">Kasir (Hanya Operasional Kasir POS & Pelanggan)</option>
                  <option value="owner">Pemilik Toko (Owner - Akses Semua Menu & Keuangan)</option>
                </select>
                {editingUser?.id === currentUser?.id && (
                  <span className="text-xs text-zinc-500 mt-1 block">Peran akun sendiri tidak dapat diubah.</span>
                )}
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Kata Sandi Awal <span className="text-rose-500">*</span> (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimal 6 karakter..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  />
                </div>
              )}

              {editingUser && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Status Akun</label>
                  <select
                    value={form.is_active ? '1' : '0'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}
                    disabled={editingUser?.id === currentUser?.id}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 outline-none disabled:opacity-50"
                  >
                    <option value="1">Aktif (Dapat Login ke Kasir)</option>
                    <option value="0">Nonaktif (Diblokir dari Login)</option>
                  </select>
                </div>
              )}

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
                  {submitting ? 'Menyimpan...' : editingUser ? 'Simpan Perubahan' : 'Buat Akun Staf'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setResetModalUser(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>Reset Kata Sandi</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-4">
              Atur kata sandi baru untuk akun <strong className="text-zinc-200">{resetModalUser.name}</strong>.
              Sesi login aktif kasir akan dicabut secara otomatis.
            </p>

            {errorMessage && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  autoFocus
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  {submitting ? 'Mereset...' : 'Simpan Kata Sandi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Hapus Akun Pengguna?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus akun staf{' '}
              <strong className="text-zinc-200">"{deleteConfirmUser.name}"</strong>?
              Riwayat penjualan kasir masa lalu akan tetap tercatat aman di sistem.
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirmUser(null)}
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
