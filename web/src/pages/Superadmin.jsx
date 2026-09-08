import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Ticket,
  Copy,
  Check,
  MessageCircle,
  Users,
  Package,
  Receipt,
  Plus,
  KeyRound,
  ChevronRight,
  X,
  Sparkles,
  Ban
} from 'lucide-react';
import api from '../services/api';

export default function Superadmin() {

  // Active Tab: 'stores' | 'licenses'
  const [activeTab, setActiveTab] = useState('stores');

  // Stats State
  const [stats, setStats] = useState({
    total_stores: 0,
    trial_stores: 0,
    active_stores: 0,
    expired_stores: 0,
    licenses: {
      total: 0,
      available: 0,
      redeemed: 0,
      revoked: 0,
    },
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Stores State
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storeSearch, setStoreSearch] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState('all');
  const [storeCategoryFilter, setStoreCategoryFilter] = useState('all');
  const [storesMeta, setStoresMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Licenses State
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(true);
  const [licenseSearch, setLicenseSearch] = useState('');
  const [licenseStatusFilter, setLicenseStatusFilter] = useState('all');
  const [licensesMeta, setLicensesMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Modals & Action States
  const [activateModalStore, setActivateModalStore] = useState(null);
  const [activateDurationType, setActivateDurationType] = useState('1_year');
  const [activateDurationDays, setActivateDurationDays] = useState('365');
  const [activateNotes, setActivateNotes] = useState('');
  const [activatingLoading, setActivatingLoading] = useState(false);

  const [extendModalStore, setExtendModalStore] = useState(null);
  const [extendDays, setExtendDays] = useState(14);
  const [extendingLoading, setExtendingLoading] = useState(false);

  // License Generator State
  const [genCount, setGenCount] = useState(5);
  const [genDurationType, setGenDurationType] = useState('1_year');
  const [genDurationDays, setGenDurationDays] = useState('365');
  const [genNotes, setGenNotes] = useState('');
  const [generatingLoading, setGeneratingLoading] = useState(false);
  const [recentlyGeneratedKeys, setRecentlyGeneratedKeys] = useState([]);

  // Toast / Feedback State
  const [feedback, setFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const showToast = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const copyToClipboard = (text, keyId = null) => {
    navigator.clipboard.writeText(text);
    if (keyId) {
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    }
    showToast(`Disalin: ${text}`);
  };

  // Fetch Stats
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/superadmin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch superadmin stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Stores
  const fetchStores = async (page = 1) => {
    setStoresLoading(true);
    try {
      const params = {
        page,
        per_page: 20,
      };
      if (storeSearch.trim()) params.search = storeSearch.trim();
      if (storeStatusFilter !== 'all') params.status = storeStatusFilter;
      if (storeCategoryFilter !== 'all') params.business_type = storeCategoryFilter;

      const res = await api.get('/superadmin/stores', { params });
      if (res.data?.success) {
        setStores(res.data.data);
        setStoresMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      showToast('Gagal memuat data toko', 'error');
    } finally {
      setStoresLoading(false);
    }
  };

  // Fetch Licenses
  const fetchLicenses = async (page = 1) => {
    setLicensesLoading(true);
    try {
      const params = {
        page,
        per_page: 20,
      };
      if (licenseSearch.trim()) params.search = licenseSearch.trim();
      if (licenseStatusFilter !== 'all') params.status = licenseStatusFilter;

      const res = await api.get('/superadmin/licenses', { params });
      if (res.data?.success) {
        setLicenses(res.data.data);
        setLicensesMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to fetch licenses:', err);
      showToast('Gagal memuat bank lisensi', 'error');
    } finally {
      setLicensesLoading(false);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchStats();
    fetchStores(1);
    fetchLicenses(1);
  }, []);

  // Debounced search / filter triggers
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStores(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [storeSearch, storeStatusFilter, storeCategoryFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLicenses(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [licenseSearch, licenseStatusFilter]);

  // Handle Direct Store Activation
  const handleActivateStore = async (e) => {
    e.preventDefault();
    if (!activateModalStore) return;

    setActivatingLoading(true);
    try {
      const payload = {
        duration_type: activateDurationType,
        notes: activateNotes.trim() || undefined,
      };
      if (activateDurationType === 'custom') {
        payload.duration_days = parseInt(activateDurationDays, 10) || 30;
      }

      const res = await api.post(`/superadmin/stores/${activateModalStore.id}/activate`, payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Toko berhasil diaktifkan');
        setActivateModalStore(null);
        setActivateNotes('');
        fetchStats();
        fetchStores(storesMeta.current_page);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengaktifkan toko';
      showToast(msg, 'error');
    } finally {
      setActivatingLoading(false);
    }
  };

  // Handle Extend Trial
  const handleExtendTrial = async (e) => {
    e.preventDefault();
    if (!extendModalStore) return;

    setExtendingLoading(true);
    try {
      const res = await api.post(`/superadmin/stores/${extendModalStore.id}/extend-trial`, {
        days: extendDays,
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Masa trial berhasil diperpanjang');
        setExtendModalStore(null);
        fetchStats();
        fetchStores(storesMeta.current_page);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal memperpanjang masa trial';
      showToast(msg, 'error');
    } finally {
      setExtendingLoading(false);
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (store, targetStatus) => {
    if (!window.confirm(`Ubah status toko "${store.name}" menjadi "${targetStatus}"?`)) {
      return;
    }

    try {
      const res = await api.post(`/superadmin/stores/${store.id}/toggle-status`, {
        status: targetStatus,
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Status berhasil diubah');
        fetchStats();
        fetchStores(storesMeta.current_page);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah status';
      showToast(msg, 'error');
    }
  };

  // Handle Generate License Keys
  const handleGenerateLicenses = async (e) => {
    e.preventDefault();
    setGeneratingLoading(true);
    try {
      const payload = {
        count: parseInt(genCount, 10) || 1,
        duration_type: genDurationType,
        notes: genNotes.trim() || undefined,
      };
      if (genDurationType === 'custom') {
        payload.duration_days = parseInt(genDurationDays, 10) || 30;
      }

      const res = await api.post('/superadmin/licenses/generate', payload);
      if (res.data?.success) {
        showToast(res.data.message || 'Voucher lisensi berhasil dibuat!');
        setRecentlyGeneratedKeys(res.data.data || []);
        fetchStats();
        fetchLicenses(1);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat kode lisensi';
      showToast(msg, 'error');
    } finally {
      setGeneratingLoading(false);
    }
  };

  // Handle Revoke License
  const handleRevokeLicense = async (license) => {
    if (!window.confirm(`Yakin ingin mencabut lisensi ${license.license_key}?`)) {
      return;
    }

    try {
      const res = await api.post(`/superadmin/licenses/${license.id}/revoke`);
      if (res.data?.success) {
        showToast(res.data.message || 'Lisensi berhasil dicabut');
        fetchStats();
        fetchLicenses(licensesMeta.current_page);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mencabut lisensi';
      showToast(msg, 'error');
    }
  };

  // Format Helper: Clean Indonesian WhatsApp link
  const getWhatsAppLink = (phone, storeName) => {
    if (!phone) return null;
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    const text = encodeURIComponent(
      `Halo Pemilik Toko ${storeName}, kami dari Tim KasirKita POS. Bagaimana kabar operasional kasir tokonya hari ini?`
    );
    return `https://wa.me/${clean}?text=${text}`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold animate-in fade-in slide-in-from-top-3 duration-200 ${
            feedback.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="truncate max-w-sm">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-white/10 rounded-lg shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 md:p-6 backdrop-blur-md shadow-lg">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPERADMIN SAAS</span>
            </div>
            <span className="text-xs text-zinc-500">•</span>
            <span className="text-xs font-medium text-zinc-400 truncate">
              Pusat Kendali Pengembang KasirKita
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Portal Manajemen Toko & Lisensi
          </h1>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Kelola seluruh ekosistem toko mitra, pantau masa trial 14 hari, aktivasi cepat toko saat transaksi di tempat (*door-to-door*), dan distribusikan kode voucher serial.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              fetchStats();
              if (activeTab === 'stores') fetchStores(storesMeta.current_page);
              else fetchLicenses(licensesMeta.current_page);
              showToast('Data berhasil diperbarui');
            }}
            disabled={statsLoading || storesLoading || licensesLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(statsLoading || storesLoading || licensesLoading) ? 'animate-spin' : ''}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Toko */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-zinc-400 truncate">Total Toko Mitra</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-white whitespace-nowrap">
              {stats.total_stores}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">Semua penyewa SaaS terdaftar</p>
          </div>
        </div>

        {/* Toko Masa Trial */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-amber-400 truncate">Toko Masa Trial</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-amber-300 whitespace-nowrap">
              {stats.trial_stores}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">Aktif dalam 14 hari pertama</p>
          </div>
        </div>

        {/* Toko Pro Aktif */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-emerald-400 truncate">Toko Pro Aktif</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-emerald-400 whitespace-nowrap">
              {stats.active_stores}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">Langganan berbayar / permanen</p>
          </div>
        </div>

        {/* Toko Expired */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-rose-400 truncate">Toko Kedaluwarsa</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl md:text-3xl font-black text-rose-400 whitespace-nowrap">
              {stats.expired_stores}
            </div>
            <p className="text-xs text-zinc-500 mt-1 truncate">Perlu follow-up penawaran</p>
          </div>
        </div>
      </div>

      {/* License Vault Mini Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-800/80 border border-zinc-800 rounded-2xl p-3.5 md:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Ticket className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-zinc-200">Bank Voucher Lisensi Serial</p>
            <p className="text-zinc-400 truncate">
              Voucher siap aktivasi offline di lapangan tanpa koneksi internet ke admin panel.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 shrink-0">
            <span className="text-zinc-400">Tersedia:</span>
            <span className="font-bold text-emerald-400 whitespace-nowrap">
              {stats.licenses?.available || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 shrink-0">
            <span className="text-zinc-400">Terklaim:</span>
            <span className="font-bold text-zinc-300 whitespace-nowrap">
              {stats.licenses?.redeemed || 0}
            </span>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2.5 py-1 rounded-lg border border-zinc-700/60 shrink-0">
            <span className="text-zinc-400">Total:</span>
            <span className="font-bold text-zinc-200 whitespace-nowrap">
              {stats.licenses?.total || 0}
            </span>
          </div>
          <button
            onClick={() => setActiveTab('licenses')}
            className="flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors ml-1 cursor-pointer shrink-0"
          >
            <span>Buka Bank Lisensi</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('stores')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'stores'
              ? 'text-rose-500 border-b-2 border-rose-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Daftar Toko Mitra</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold ml-1 shrink-0 whitespace-nowrap">
            {stats.total_stores}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('licenses')}
          className={`flex items-center gap-2 pb-3 px-3 text-sm font-bold transition-all relative cursor-pointer ${
            activeTab === 'licenses'
              ? 'text-rose-500 border-b-2 border-rose-500'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Bank & Generator Lisensi</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-semibold ml-1 shrink-0 whitespace-nowrap">
            {stats.licenses?.available || 0} Siap Pakai
          </span>
        </button>
      </div>

      {/* TAB 1: MANAJEMEN TOKO */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
            {/* Search Box */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Cari nama toko, nomor HP, pemilik..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              {storeSearch && (
                <button
                  onClick={() => setStoreSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'trial', label: 'Trial' },
                { id: 'active', label: 'Pro Aktif' },
                { id: 'expired', label: 'Kedaluwarsa' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setStoreStatusFilter(pill.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    storeStatusFilter === pill.id
                      ? 'bg-rose-500 text-white shadow-sm shadow-rose-950/40'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/60'
                  }`}
                >
                  {pill.label}
                </button>
              ))}

              {/* Category Filter */}
              <select
                value={storeCategoryFilter}
                onChange={(e) => setStoreCategoryFilter(e.target.value)}
                className="bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer shrink-0"
              >
                <option value="all">Semua Kategori</option>
                <option value="retail">Ritel</option>
                <option value="fnb">F&B</option>
                <option value="service">Jasa</option>
                <option value="other">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Stores Table Container */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">Toko & Kategori</th>
                    <th className="py-3 px-4 whitespace-nowrap">Pemilik & Kontak</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status Langganan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Data Bisnis</th>
                    <th className="py-3 px-4 whitespace-nowrap">Terdaftar</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Aksi Pengembang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {storesLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                        Memuat data toko mitra...
                      </td>
                    </tr>
                  ) : stores.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-zinc-500">
                        <Building2 className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                        Tidak ditemukan toko yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    stores.map((store) => {
                      const waLink = getWhatsAppLink(store.phone || store.owner?.phone, store.name);

                      return (
                        <tr key={store.id} className="hover:bg-zinc-800/40 transition-colors">
                          {/* 1. Toko & Kategori */}
                          <td className="py-3.5 px-4 min-w-[200px]">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-300 font-black text-sm shrink-0">
                                {store.name?.charAt(0)?.toUpperCase() || 'T'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-zinc-100 text-sm truncate">{store.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className="text-xs uppercase font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50 shrink-0 whitespace-nowrap">
                                    {store.business_type || 'Ritel'}
                                  </span>
                                  {store.license_key && (
                                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 shrink-0 whitespace-nowrap" title="Kode Lisensi Terpasang">
                                      {store.license_key}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Pemilik & Kontak */}
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <p className="font-semibold text-zinc-200 truncate">{store.owner?.name || 'Tanpa Pemilik'}</p>
                            <p className="text-xs text-zinc-400 truncate">{store.owner?.email || '-'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs font-mono text-zinc-300 whitespace-nowrap">
                                {store.phone || store.owner?.phone || '-'}
                              </span>
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Kirim pesan WhatsApp langsung"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors shrink-0 whitespace-nowrap"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  <span>WA</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* 3. Status Langganan & Masa Aktif */}
                          <td className="py-3.5 px-4 whitespace-nowrap min-w-[170px]">
                            {store.subscription_status === 'active' && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs shrink-0 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>PRO AKTIF</span>
                                </span>
                                <p className="text-xs text-zinc-400 mt-1 whitespace-nowrap">
                                  {store.subscription_expires_at
                                    ? `Sampai ${new Date(store.subscription_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                                    : 'Akses Permanen'}
                                </p>
                              </div>
                            )}

                            {store.subscription_status === 'trial' && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs shrink-0 whitespace-nowrap">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>TRIAL 14 HARI</span>
                                </span>
                                <p className="text-xs text-amber-400/90 mt-1 whitespace-nowrap">
                                  {store.days_remaining !== null
                                    ? store.days_remaining > 0
                                      ? `Sisa ${store.days_remaining} hari`
                                      : 'Hari ini berakhir'
                                    : '-'}
                                </p>
                              </div>
                            )}

                            {store.subscription_status === 'expired' && (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs shrink-0 whitespace-nowrap">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>KEDALUWARSA</span>
                                </span>
                                <p className="text-xs text-rose-400/80 mt-1 whitespace-nowrap">Fitur POS Terkunci</p>
                              </div>
                            )}
                          </td>

                          {/* 4. Data Bisnis */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-zinc-300">
                            <div className="flex items-center gap-3">
                              <span title="Total Produk" className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap">
                                <Package className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{store.products_count || 0}</span>
                              </span>
                              <span title="Total Transaksi" className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap">
                                <Receipt className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{store.transactions_count || 0}</span>
                              </span>
                              <span title="Total Staf Kasir" className="flex items-center gap-1 text-xs shrink-0 whitespace-nowrap">
                                <Users className="w-3.5 h-3.5 text-zinc-500" />
                                <span>{store.users_count || 0}</span>
                              </span>
                            </div>
                          </td>

                          {/* 5. Tanggal Daftar */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-zinc-400">
                            {store.created_at
                              ? new Date(store.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>

                          {/* 6. Aksi Cepat Pengembang */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Tombol Aktivasi Langsung */}
                              <button
                                onClick={() => {
                                  setActivateModalStore(store);
                                  setActivateDurationType('1_year');
                                  setActivateNotes('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
                                title="Aktivasi status Pro toko ini"
                              >
                                Aktifkan
                              </button>

                              {/* Tombol Perpanjang Trial */}
                              <button
                                onClick={() => {
                                  setExtendModalStore(store);
                                  setExtendDays(14);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-white border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap"
                                title="Beri tambahan masa trial"
                              >
                                +Trial
                              </button>

                              {/* Quick Toggle Expire / Active */}
                              {store.subscription_status === 'active' ? (
                                <button
                                  onClick={() => handleToggleStatus(store, 'expired')}
                                  className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700/50 transition-colors cursor-pointer shrink-0"
                                  title="Kunci / Set Expired"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(store, 'active')}
                                  className="p-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 border border-zinc-700/50 transition-colors cursor-pointer shrink-0"
                                  title="Buka Kunci / Set Active"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
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

            {/* Pagination Controls */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
              <span className="whitespace-nowrap">
                Menampilkan {stores.length} dari {storesMeta.total} toko
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={storesMeta.current_page <= 1}
                  onClick={() => fetchStores(storesMeta.current_page - 1)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Sebelumnya
                </button>
                <span className="font-semibold text-zinc-200 whitespace-nowrap">
                  Halaman {storesMeta.current_page} dari {storesMeta.last_page || 1}
                </span>
                <button
                  disabled={storesMeta.current_page >= storesMeta.last_page}
                  onClick={() => fetchStores(storesMeta.current_page + 1)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANK & GENERATOR LISENSI */}
      {activeTab === 'licenses' && (
        <div className="space-y-6">
          {/* License Generator Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Generator Kode Serial Voucher Lisensi</h2>
                <p className="text-xs text-zinc-400">
                  Cetak sekumpulan serial key acak anti-benturan berformat <span className="font-mono text-rose-300 font-bold">KK-PRO-XXXX-XXXX</span> untuk penjualan langsung.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateLicenses} className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Jumlah Voucher
                </label>
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="1">1 Voucher (Satuan)</option>
                  <option value="3">3 Voucher</option>
                  <option value="5">5 Voucher (Rekomendasi Lapangan)</option>
                  <option value="10">10 Voucher (Satu Batch)</option>
                  <option value="25">25 Voucher</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Masa Berlaku
                </label>
                <select
                  value={genDurationType}
                  onChange={(e) => setGenDurationType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="1_year">1 Tahun (365 Hari)</option>
                  <option value="6_months">6 Bulan (180 Hari)</option>
                  <option value="1_month">1 Bulan (30 Hari)</option>
                  <option value="lifetime">Permanen / Seumur Hidup</option>
                  <option value="custom">Kustom Hari...</option>
                </select>
              </div>

              {genDurationType === 'custom' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Durasi (Hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={genDurationDays}
                    onChange={(e) => setGenDurationDays(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="Contoh: 90"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Catatan Distribusi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={genNotes}
                    onChange={(e) => setGenNotes(e.target.value)}
                    placeholder="Misal: Batch Promo Ruko Pasar Baru"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={generatingLoading}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-lg shadow-rose-950/40 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {generatingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Generate Voucher Sekarang</span>
                </button>
              </div>
            </form>

            {/* Recently Generated Cards Banner */}
            {recentlyGeneratedKeys.length > 0 && (
              <div className="mt-4 p-3.5 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{recentlyGeneratedKeys.length} Kode Baru Selesai Dibuat:</span>
                  </span>
                  <button
                    onClick={() => {
                      const allKeys = recentlyGeneratedKeys.map((k) => k.license_key).join('\n');
                      copyToClipboard(allKeys);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Salin Semua Kode</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {recentlyGeneratedKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs"
                    >
                      <span className="font-mono font-bold text-white tracking-wide">
                        {k.license_key}
                      </span>
                      <button
                        onClick={() => copyToClipboard(k.license_key, k.id)}
                        className="text-zinc-400 hover:text-rose-300 p-1 cursor-pointer"
                        title="Salin kode"
                      >
                        {copiedKey === k.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Licenses Bank Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={licenseSearch}
                  onChange={(e) => setLicenseSearch(e.target.value)}
                  placeholder="Cari kode serial atau catatan..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-9 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
                />
                {licenseSearch && (
                  <button
                    onClick={() => setLicenseSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  { id: 'all', label: 'Semua Status' },
                  { id: 'available', label: 'Tersedia' },
                  { id: 'redeemed', label: 'Terklaim' },
                  { id: 'revoked', label: 'Dicabut' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    onClick={() => setLicenseStatusFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      licenseStatusFilter === pill.id
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-700/60'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap">Kode Serial Lisensi</th>
                      <th className="py-3 px-4 whitespace-nowrap">Durasi</th>
                      <th className="py-3 px-4 whitespace-nowrap">Status</th>
                      <th className="py-3 px-4 whitespace-nowrap">Penggunaan / Toko</th>
                      <th className="py-3 px-4 whitespace-nowrap">Catatan</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70">
                    {licensesLoading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-zinc-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-rose-500 mb-2" />
                          Memuat data bank lisensi...
                        </td>
                      </tr>
                    ) : licenses.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-zinc-500">
                          <KeyRound className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
                          Belum ada kode lisensi yang cocok. Silakan generate baru di atas.
                        </td>
                      </tr>
                    ) : (
                      licenses.map((lic) => (
                        <tr key={lic.id} className="hover:bg-zinc-800/40 transition-colors">
                          {/* 1. Kode Serial */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-zinc-100">
                            <div className="flex items-center gap-2">
                              <span className="text-sm tracking-wide text-zinc-100 font-bold">
                                {lic.license_key}
                              </span>
                              <button
                                onClick={() => copyToClipboard(lic.license_key, lic.id)}
                                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                                title="Salin kode"
                              >
                                {copiedKey === lic.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 2. Durasi */}
                          <td className="py-3 px-4 whitespace-nowrap text-zinc-300 font-medium">
                            {lic.duration_type === 'lifetime' && 'Permanen (Seumur Hidup)'}
                            {lic.duration_type === '1_year' && '1 Tahun (365 Hari)'}
                            {lic.duration_type === '6_months' && '6 Bulan (180 Hari)'}
                            {lic.duration_type === '1_month' && '1 Bulan (30 Hari)'}
                            {lic.duration_type === 'custom' && `${lic.duration_days} Hari`}
                          </td>

                          {/* 3. Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {lic.status === 'available' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-xs shrink-0 whitespace-nowrap">
                                Tersedia
                              </span>
                            )}
                            {lic.status === 'redeemed' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 font-bold text-xs shrink-0 whitespace-nowrap">
                                Terklaim
                              </span>
                            )}
                            {lic.status === 'revoked' && (
                              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold text-xs shrink-0 whitespace-nowrap">
                                Dicabut
                              </span>
                            )}
                          </td>

                          {/* 4. Penggunaan */}
                          <td className="py-3 px-4 min-w-[160px]">
                            {lic.redeemed_by_store ? (
                              <div>
                                <p className="font-bold text-zinc-200 truncate">
                                  {lic.redeemed_by_store.name}
                                </p>
                                <p className="text-xs text-zinc-500 truncate">
                                  {lic.redeemed_at
                                    ? new Date(lic.redeemed_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric',
                                      })
                                    : '-'}
                                </p>
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic">Belum diklaim</span>
                            )}
                          </td>

                          {/* 5. Catatan */}
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                            {lic.notes || '-'}
                          </td>

                          {/* 6. Aksi */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {lic.status === 'available' && (
                              <button
                                onClick={() => handleRevokeLicense(lic)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 border border-zinc-700/50 text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                                title="Cabut lisensi ini"
                              >
                                Cabut
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-xs text-zinc-400">
                <span className="whitespace-nowrap">
                  Menampilkan {licenses.length} dari {licensesMeta.total} voucher
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={licensesMeta.current_page <= 1}
                    onClick={() => fetchLicenses(licensesMeta.current_page - 1)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Sebelumnya
                  </button>
                  <span className="font-semibold text-zinc-200 whitespace-nowrap">
                    Halaman {licensesMeta.current_page} dari {licensesMeta.last_page || 1}
                  </span>
                  <button
                    disabled={licensesMeta.current_page >= licensesMeta.last_page}
                    onClick={() => fetchLicenses(licensesMeta.current_page + 1)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-40 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: AKTIVASI TOKO LANGSUNG */}
      {activateModalStore && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Aktivasi Manual Pro
                </span>
                <h3 className="text-base font-bold text-white truncate">
                  {activateModalStore.name}
                </h3>
              </div>
              <button
                onClick={() => setActivateModalStore(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleActivateStore} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Pilih Masa Berlaku Berlangganan
                </label>
                <select
                  value={activateDurationType}
                  onChange={(e) => setActivateDurationType(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1_year">1 Tahun Penuh (365 Hari) - Standar Tahunan</option>
                  <option value="6_months">6 Bulan (180 Hari) - Semester</option>
                  <option value="1_month">1 Bulan (30 Hari) - Bulanan</option>
                  <option value="lifetime">Permanen / Seumur Hidup (Tanpa Batas)</option>
                  <option value="custom">Kustom (Jumlah Hari Tertentu)</option>
                </select>
              </div>

              {activateDurationType === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Jumlah Hari Aktif
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={activateDurationDays}
                    onChange={(e) => setActivateDurationDays(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Contoh: 100"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Catatan Pembayaran / Transaksi (Opsional)
                </label>
                <textarea
                  rows="2"
                  value={activateNotes}
                  onChange={(e) => setActivateNotes(e.target.value)}
                  placeholder="Misal: Diterima tunai Rp 600.000 di toko oleh Antigravity"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200/90 leading-relaxed">
                Toko akan langsung berstatus <strong className="text-emerald-300 font-semibold">PRO AKTIF</strong> seketika, dan kunci transaksi pada aplikasi kasir HP mereka otomatis terbuka.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivateModalStore(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={activatingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {activatingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Konfirmasi Aktifkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PERPANJANG TRIAL */}
      {extendModalStore && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Perpanjang Trial
                </span>
                <h3 className="text-base font-bold text-white truncate">
                  {extendModalStore.name}
                </h3>
              </div>
              <button
                onClick={() => setExtendModalStore(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExtendTrial} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Pilih Tambahan Hari Uji Coba
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setExtendDays(d)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        extendDays === d
                          ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-sm'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                      }`}
                    >
                      +{d} Hari
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-200/90 leading-relaxed">
                Menambah {extendDays} hari uji coba gratis dari tanggal kedaluwarsa toko saat ini. Toko yang terkunci akan kembali terbuka normal.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendModalStore(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={extendingLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold shadow-lg shadow-amber-950/40 transition-all cursor-pointer disabled:opacity-50"
                >
                  {extendingLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                  <span>Simpan Perpanjangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
