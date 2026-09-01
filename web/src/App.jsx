import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Pos from './pages/Pos';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Units from './pages/Units';
import Categories from './pages/Categories';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import StockOpname from './pages/StockOpname';
import Transactions from './pages/Transactions';
import CashFlow from './pages/CashFlow';
import Discounts from './pages/Discounts';
import TaxesAndFees from './pages/TaxesAndFees';

function AuthGuard({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500 text-sm font-sans">
        Memverifikasi sesi KasirKita...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            {/* Accessible by Cashier & Owner */}
            <Route index element={<Pos />} />
            <Route path="transactions" element={<Transactions />} />

            {/* Owner-Only Routes */}
            <Route
              path="dashboard"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="inventory"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Inventory />
                </AuthGuard>
              }
            />
            <Route
              path="units"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Units />
                </AuthGuard>
              }
            />
            <Route
              path="categories"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Categories />
                </AuthGuard>
              }
            />
            <Route
              path="customers"
              element={
                <AuthGuard allowedRoles={['owner', 'cashier']}>
                  <Customers />
                </AuthGuard>
              }
            />
            <Route
              path="suppliers"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Suppliers />
                </AuthGuard>
              }
            />
            <Route
              path="users"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Users />
                </AuthGuard>
              }
            />
            <Route
              path="discounts"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <Discounts />
                </AuthGuard>
              }
            />
            <Route
              path="taxes-and-fees"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <TaxesAndFees />
                </AuthGuard>
              }
            />
            <Route
              path="stock-opname"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <StockOpname />
                </AuthGuard>
              }
            />
            <Route
              path="cash-flow"
              element={
                <AuthGuard allowedRoles={['owner']}>
                  <CashFlow />
                </AuthGuard>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
