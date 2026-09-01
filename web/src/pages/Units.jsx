import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Scale,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  Layers
} from 'lucide-react';

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [deleteConfirmUnit, setDeleteConfirmUnit] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    symbol: '',
    description: '',
  });

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const res = await api.get('/units');
      if (res.data.success) {
        setUnits(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data satuan:', err);
      setErrorMessage('Gagal memuat daftar satuan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const openAddModal = () => {
    setEditingUnit(null);
    setForm({ name: '', symbol: '', description: '' });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (unit) => {
    setEditingUnit(unit);
    setForm({
      name: unit.name,
      symbol: unit.symbol,
      description: unit.description || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.symbol.trim()) {
      setErrorMessage('Nama satuan dan simbol wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      if (editingUnit) {
        await api.put(`/units/${editingUnit.id}`, form);
        setSuccessMessage('Satuan barang berhasil diperbarui.');
      } else {
        await api.post('/units', form);
        setSuccessMessage('Satuan barang baru berhasil ditambahkan.');
      }

      setIsModalOpen(false);
      fetchUnits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUnit) return;
    try {
      setSubmitting(true);
      await api.delete(`/units/${deleteConfirmUnit.id}`);
      setSuccessMessage('Satuan berhasil dihapus.');
      setDeleteConfirmUnit(null);
      fetchUnits();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus satuan.';
      setErrorMessage(msg);
      setDeleteConfirmUnit(null);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUnits = units.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.symbol.toLowerCase().includes(search.toLowerCase()) ||
      (u.description && u.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-rose-500 shrink-0" />
            <span>Master Satuan Barang (UoM)</span>
          </h1>
          <p className="text-sm text-zinc-300 mt-1 max-w-lg leading-relaxed">
            Standarisasi unit kemasan, eceran, dan rasio konversi grosir
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Satuan</span>
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

      {/* Search Bar */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama satuan atau simbol (contoh: Pcs, Dus, kg)..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>
        <div className="text-xs text-zinc-400 font-mono shrink-0 px-1">
          Total: <strong className="text-zinc-200">{filteredUnits.length}</strong> satuan terdaftar
        </div>
      </div>

      {/* Units Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
          Memuat data satuan barang...
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80">
          <Scale className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Belum Ada Data Satuan</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Tambahkan satuan standar seperti Pcs, Dus, Kilogram, atau Botol untuk produk Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              style={{ backgroundColor: '#18181b' }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white truncate">{unit.name}</h2>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/80 text-rose-400 font-mono text-xs font-bold uppercase">
                      {unit.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(unit)}
                      title="Edit Satuan"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmUnit(unit)}
                      title="Hapus Satuan"
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 min-h-[32px] line-clamp-2">
                  {unit.description || 'Tidak ada keterangan tambahan.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Digunakan: <strong className="text-zinc-200">{(unit.products_count || 0) + (unit.conversions_count || 0)}</strong> produk</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-md space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-rose-500" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {editingUnit ? 'Edit Satuan Barang' : 'Tambah Satuan Barang Baru'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Nama Satuan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pieces / Buah, Dus / Karton, Kilogram"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Simbol / Singkatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: pcs, dus, kg, btl, pack"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value.toLowerCase() })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-rose-500"
                />
                <p className="text-xs text-zinc-400 mt-1.5">Simbol harus unik (huruf kecil tanpa spasi).</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  Deskripsi / Keterangan
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Digunakan untuk kemasan grosir isi 12/24 unit"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs sm:text-sm focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold transition-colors"
                >
                  {submitting ? 'Menyimpan...' : editingUnit ? 'Perbarui Satuan' : 'Simpan Satuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-sm p-5 shadow-md space-y-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hapus Satuan "{deleteConfirmUnit.name}"?</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Satuan yang sedang digunakan oleh katalog produk tidak dapat dihapus.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUnit(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-semibold"
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
