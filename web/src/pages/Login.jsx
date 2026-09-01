import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/');
      } else {
        setError(res.message || 'Login gagal. Periksa kembali email dan kata sandi.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (type) => {
    if (type === 'owner') {
      setEmail('owner@kasirkita.com');
      setPassword('password123');
    } else {
      setEmail('kasir@kasirkita.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 px-4 py-8 relative overflow-hidden font-sans">
      {/* Background Decorative Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div 
        style={{ backgroundColor: '#18181b' }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 rounded-2xl shadow-xl p-6 sm:p-8 relative z-10"
      >
        {/* Brand Header Lockup */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-md shadow-rose-950/40">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              KasirKita <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-rose-500 text-white shadow-sm">POS</span>
            </h1>
          </div>
          <p className="text-sm text-zinc-300 font-medium">Aplikasi Kasir & Manajemen Inventaris UMKM</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Email Akun</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Kata Sandi</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-400 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Masuk ke Kasir'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <p className="text-xs text-zinc-400 text-center mb-3 font-semibold uppercase tracking-wider">
            Akun Demo Siap Pakai:
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillCredentials('owner')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-semibold text-rose-400">Pemilik (Owner)</p>
              <p className="text-xs text-zinc-400 mt-0.5">Akses semua laporan</p>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('cashier')}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 text-left transition-all cursor-pointer"
            >
              <p className="text-xs font-semibold text-emerald-400">Kasir Toko</p>
              <p className="text-xs text-zinc-400 mt-0.5">Akses penjualan POS</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
