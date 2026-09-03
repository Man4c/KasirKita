import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardCheck,
  Receipt,
  Wallet,
  LogOut,
  User,
  ChevronDown,
  Clock,
  Store,
  Scale,
  Tags,
  Users,
  Truck,
  UserCheck,
  TicketPercent,
  ReceiptText,
  Menu,
  X
} from 'lucide-react';
import api from '../../services/api';

export default function AppLayout() {
  const { user, logout, isOwner } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [storeInfo, setStoreInfo] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api.get('/settings/store').then((res) => {
      if (res.data?.success && res.data?.data) {
        setStoreInfo(res.data.data);
      }
    }).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Operasional Kasir',
      items: [
        { to: '/', label: 'Kasir POS', icon: ShoppingCart, exact: true, roles: ['cashier', 'owner'] },
        { to: '/transactions', label: 'Riwayat Transaksi', icon: Receipt, roles: ['cashier', 'owner'] },
      ],
    },
    {
      title: 'Inventaris & Kas',
      items: [
        { to: '/inventory', label: 'Inventaris & HPP', icon: Package, roles: ['owner'] },
        { to: '/stock-opname', label: 'Stock Opname', icon: ClipboardCheck, roles: ['owner'] },
        { to: '/cash-flow', label: 'Buku Kas Toko', icon: Wallet, roles: ['owner'] },
      ],
    },
    {
      title: 'Data Master',
      items: [
        { to: '/customers', label: 'Master Pelanggan', icon: Users, roles: ['cashier', 'owner'] },
        { to: '/suppliers', label: 'Master Pemasok', icon: Truck, roles: ['owner'] },
        { to: '/users', label: 'Master Pengguna', icon: UserCheck, roles: ['owner'] },
        { to: '/discounts', label: 'Master Promosi', icon: TicketPercent, roles: ['owner'] },
        { to: '/taxes-and-fees', label: 'Master Pajak & Biaya', icon: ReceiptText, roles: ['owner'] },
        { to: '/categories', label: 'Master Kategori', icon: Tags, roles: ['owner'] },
        { to: '/units', label: 'Master Satuan', icon: Scale, roles: ['owner'] },
      ],
    },
    {
      title: 'Laporan & Analitik',
      items: [
        { to: '/dashboard', label: 'Dashboard & Laporan', icon: LayoutDashboard, roles: ['owner'] },
      ],
    },
  ];

  const currentRole = user?.role || 'cashier';

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans">
      {/* Sidebar Desktop */}
      <aside 
        style={{ backgroundColor: '#18181b' }} 
        className="hidden md:flex flex-col w-64 bg-zinc-900 border-r border-zinc-800/80 z-20 select-none"
      >
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b border-zinc-800/80">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/80 overflow-hidden shrink-0 shadow-inner">
            {storeInfo?.logo ? (
              <img 
                src={storeInfo.logo} 
                alt={storeInfo.name} 
                className="w-full h-full object-cover object-center" 
              />
            ) : (
              <Store className="w-5 h-5 text-rose-500" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-bold text-sm tracking-tight text-white truncate">
              {storeInfo?.name || 'KasirKita Mart'}
            </h1>
            <p className="text-xs text-zinc-400 font-normal truncate">
              {storeInfo?.address || 'KasirKita POS'}
            </p>
          </div>
        </div>

        {/* Nav Links Grouped */}
        <div className="flex-1 py-4 px-3 space-y-4 overflow-y-auto">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(currentRole));
            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact 
                    ? location.pathname === item.to 
                    : location.pathname.startsWith(item.to);

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-rose-500 text-white font-semibold shadow-md shadow-rose-950/30'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-800/70'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer User Profile */}
        <div className="p-3 border-t border-zinc-800/80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-200 font-bold text-xs shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-zinc-200 truncate">{user?.name || 'Kasir'}</p>
                <p className="text-xs text-zinc-400 capitalize">{user?.role || 'cashier'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Keluar / Logout"
              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-zinc-950">
        {/* Compact Header Bar */}
        <header className="h-16 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-6 flex items-center justify-between select-none z-10">
          {/* Mobile Menu Button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              aria-label="Buka menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-300 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-zinc-800">
              <Clock className="w-4 h-4 text-rose-500" />
              <span className="font-mono text-xs">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} • {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Compact Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-all text-xs font-medium text-zinc-200"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="max-w-[120px] truncate">{user?.name || 'Kasir'}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <div 
                style={{ backgroundColor: '#18181b' }}
                className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onClick={() => setProfileOpen(false)}
              >
                <div className="px-3.5 py-2 border-b border-zinc-800 text-xs">
                  <p className="font-bold text-sm text-white">{user?.name || 'Kasir'}</p>
                  <p className="text-xs text-zinc-300 truncate mt-0.5">{user?.email || 'kasir@kasirkita.com'}</p>
                  <span className="inline-block mt-2 text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500 text-white shrink-0 whitespace-nowrap">
                    {user?.role || 'cashier'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-zinc-900 border-b border-zinc-800 p-3 space-y-3 z-30 max-h-[80vh] overflow-y-auto">
            {navSections.map((section, sIdx) => {
              const visibleItems = section.items.filter((item) => item.roles.includes(currentRole));
              if (visibleItems.length === 0) return null;

              return (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {section.title}
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                            isActive ? 'bg-rose-500 text-white font-semibold shadow-md shadow-rose-950/30' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Page View Outlet */}
        <main style={{ backgroundColor: '#09090b' }} className="flex-1 overflow-y-auto min-w-0 p-4 md:p-6 bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
