import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Tags,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  FolderTree
} from 'lucide-react';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data kategori:', err);
      setErrorMessage('Gagal memuat daftar kategori.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setForm({ name: '', slug: '', description: '' });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug || '',
      description: cat.description || '',
    });
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMessage('Nama kategori wajib diisi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        setSuccessMessage('Kategori produk berhasil diperbarui.');
      } else {
        await api.post('/categories', payload);
        setSuccessMessage('Kategori produk baru berhasil ditambahkan.');
      }

      setIsModalOpen(false);
      fetchCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan kategori.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCat) return;
    try {
      setSubmitting(true);
      await api.delete(`/categories/${deleteConfirmCat.id}`);
      setSuccessMessage('Kategori berhasil dihapus.');
      setDeleteConfirmCat(null);
      fetchCategories();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menghapus kategori.';
      setErrorMessage(msg);
      setDeleteConfirmCat(null);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.slug && c.slug.toLowerCase().includes(search.toLowerCase())) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Tags className="w-6 h-6 text-rose-500 shrink-0" />
            <span>Master Kategori Produk</span>
          </h1>
          <p className="text-sm text-zinc-300 mt-1 max-w-lg leading-relaxed">
            Pengelompokan barang dagangan untuk mempermudah filter cepat di layar kasir POS dan katalog inventaris
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori</span>
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

      {/* Search & Counter Bar */}
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
            placeholder="Cari nama kategori atau slug..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
          />
        </div>
        <div className="text-xs text-zinc-400 font-mono shrink-0 px-1">
          Total: <strong className="text-zinc-200">{filteredCategories.length}</strong> kategori terdaftar
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-zinc-500 text-sm">
          Memuat data kategori produk...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div 
          style={{ backgroundColor: '#18181b' }}
          className="p-8 text-center rounded-2xl bg-zinc-900 border border-zinc-800/80"
        >
          <Tags className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-zinc-300 mb-1">Belum Ada Kategori</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Tambahkan kategori produk seperti Makanan, Minuman, atau Sembako untuk mengelompokkan barang dagangan toko.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              style={{ backgroundColor: '#18181b' }}
              className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-sm"
            >
              <div>
                {/* Header Card: Name & Actions */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-rose-400 shrink-0">
                      <FolderTree className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-base font-bold text-white truncate" title={cat.name}>
                        {cat.name}
                      </h2>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-mono text-xs shrink-0 whitespace-nowrap">
                        /{cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(cat)}
                      title="Edit Kategori"
                      className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmCat(cat)}
                      title="Hapus Kategori"
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 mt-2 mb-4 line-clamp-2 leading-relaxed">
                  {cat.description || <span className="italic text-zinc-400">Tidak ada deskripsi tambahan.</span>}
                </p>
              </div>

              {/* Card Footer: Usage Count & Status */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-zinc-300 font-medium whitespace-nowrap">
                  <Package className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>{cat.products_count ?? 0} produk</span>
                </div>

                {(cat.products_count ?? 0) > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-semibold shrink-0 whitespace-nowrap">
                    Digunakan
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700/60 text-zinc-400 text-xs font-semibold shrink-0 whitespace-nowrap">
                    Kosong
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Tags className="w-5 h-5 text-rose-500" />
              <span>{editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}</span>
            </h2>
            <p className="text-xs text-zinc-400 mb-5">
              {editingCategory ? 'Perbarui informasi kategori produk ini.' : 'Buat kategori baru untuk mengelompokkan produk Anda.'}
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
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Makanan, Minuman, Bumbu Dapur..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Slug / URL Identifier <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="otomatis dari nama jika dikosongkan"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-400 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Deskripsi / Keterangan <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat jenis produk yang masuk ke kategori ini..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-400 outline-none resize-none"
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
                  {submitting ? 'Menyimpan...' : editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 shadow-md relative animate-in fade-in zoom-in-95 duration-150 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-white mb-1.5">Hapus Kategori?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="text-zinc-200">"{deleteConfirmCat.name}"</strong>?
            </p>

            {(deleteConfirmCat.products_count ?? 0) > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300 text-xs text-left">
                <strong>Peringatan:</strong> Kategori ini masih memiliki {deleteConfirmCat.products_count} produk terhubung. Anda harus memindahkan produk ke kategori lain sebelum menghapus kategori ini.
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setDeleteConfirmCat(null)}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting || (deleteConfirmCat.products_count ?? 0) > 0}
                className="flex-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-md"
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
