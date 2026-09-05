import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { RotateCw, AlertCircle, WifiOff } from 'lucide-react-native';
import api from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { formatRp } from '../utils/format';
import DashboardMetricsGrid from '../components/dashboard/DashboardMetricsGrid';
import DashboardDetailModal from '../components/dashboard/DashboardDetailModal';
import SalesTrendChart from '../components/dashboard/SalesTrendChart';
import RecentTransactionsSection from '../components/dashboard/RecentTransactionsSection';
import DashboardActionHub from '../components/dashboard/DashboardActionHub';
import PosReceiptModal from '../components/pos/PosReceiptModal';

export default function DashboardScreen({ isLandscape = false, navigation }) {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  /**
   * Load data: read local cache first for instant display, then sync from cloud.
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Read cached snapshot if available
      const [cachedSummary, cachedTrends, cachedTx] = await Promise.all([
        offlineStorage.getCachedDashboardSummary(),
        offlineStorage.getCachedDashboardTrends(),
        offlineStorage.getCachedDashboardRecentTx(),
      ]);

      if (cachedSummary?.summary) {
        setSummary(cachedSummary.summary);
        setLoading(false);
        if (cachedSummary.lastSync) {
          setLastSyncTime(new Date(cachedSummary.lastSync));
        }
      }
      if (Array.isArray(cachedTrends) && cachedTrends.length > 0) {
        setTrends(cachedTrends);
      }
      if (Array.isArray(cachedTx) && cachedTx.length > 0) {
        setRecentTransactions(cachedTx);
      }

      // 2. Fetch fresh data from backend
      await fetchSummary(false);
    } catch (err) {
      console.log('Error during initial dashboard load:', err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch latest financial data, trends, and recent transactions from backend.
   * @param {boolean} isManualRefresh
   */
  const fetchSummary = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const [resSummary, resTrends, resTx] = await Promise.allSettled([
        api.get('/finance/dashboard'),
        api.get('/finance/trends'),
        api.get('/pos/transactions?per_page=10'),
      ]);

      let hasSuccess = false;

      // Process dashboard summary
      if (resSummary.status === 'fulfilled' && resSummary.value.data?.success) {
        const freshSummary = resSummary.value.data.data;
        setSummary(freshSummary);
        await offlineStorage.cacheDashboardSummary(freshSummary);
        hasSuccess = true;
      }

      // Process sales trends
      if (resTrends.status === 'fulfilled' && resTrends.value.data?.success) {
        const freshTrends = resTrends.value.data.data;
        setTrends(freshTrends);
        await offlineStorage.cacheDashboardTrends(freshTrends);
        hasSuccess = true;
      }

      // Process recent transactions
      if (resTx.status === 'fulfilled' && resTx.value.data?.success) {
        const txList = resTx.value.data.data?.data || resTx.value.data.data || [];
        if (Array.isArray(txList)) {
          setRecentTransactions(txList);
          await offlineStorage.cacheDashboardRecentTx(txList);
          hasSuccess = true;
        }
      }

      if (hasSuccess) {
        setLastSyncTime(new Date());
      } else {
        const errVal = resSummary.status === 'rejected' ? resSummary.reason : resTrends.reason;
        throw errVal || new Error('Gagal memuat ringkasan toko');
      }
    } catch (err) {
      console.log('Error fetching dashboard data:', err?.message);
      const isNetworkErr =
        err?.message?.includes('Network') ||
        err?.code === 'ECONNABORTED' ||
        !err?.response;

      setError(
        isNetworkErr
          ? 'Koneksi terputus atau server offline. Menampilkan data cache lokal.'
          : (err?.response?.data?.message || 'Gagal memperbarui data finansial toko.')
      );
    } finally {
      if (isManualRefresh) setRefreshing(false);
    }
  };

  // Instant non-blocking render: do not block screen with full-page spinner.
  // Render the dashboard shell and cards immediately for sub-second LCP.
  const isInitialLoading = loading && !summary;
  const sales = summary?.sales || {};
  const profit = summary?.profitability || {};
  const inv = summary?.inventory || {};

  const formatLastSync = (date) => {
    if (!date) return null;
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          {lastSyncTime ? (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>
                Sinkron: {formatLastSync(lastSyncTime)}
              </Text>
            </View>
          ) : isInitialLoading ? (
            <View style={[styles.syncBadge, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <ActivityIndicator size="small" color="#fb7185" />
              <Text style={styles.syncBadgeText}>Memuat...</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.headerSubtitle}>
          Ringkasan performa penjualan dan keuangan hari ini
        </Text>
      </View>

      {/* Error / Offline Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <View style={styles.errorBannerLeft}>
            <WifiOff size={16} color="#f87171" style={{ flexShrink: 0 }} />
            <Text style={styles.errorBannerText} numberOfLines={2}>
              {error}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchSummary(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.retryBtnText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 2x2 Metrics Grid Component */}
      <DashboardMetricsGrid
        sales={sales}
        profit={profit}
        inv={inv}
        formatRp={formatRp}
        onOpenModal={(type) => setActiveModal(type)}
      />

      {/* Refresh Button with Dedicated Inline Spinner (Placed before Tren Omzet) */}
      <TouchableOpacity
        style={[styles.refreshBtn, refreshing && styles.refreshBtnDisabled]}
        onPress={() => fetchSummary(true)}
        activeOpacity={0.8}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#f4f4f5" />
        ) : (
          <RotateCw size={14} color="#f4f4f5" />
        )}
        <Text style={styles.refreshBtnText}>
          {refreshing ? 'Memperbarui...' : 'Perbarui Data'}
        </Text>
      </TouchableOpacity>

      {/* Hub Menu: Akses Cepat & Navigasi Operasional Toko */}
      <DashboardActionHub
        navigation={navigation}
        sales={sales}
        inv={inv}
        onOpenMasterProduct={() => {
          if (navigation?.navigate) {
            navigation.navigate('product_management');
          }
        }}
        onOpenMasterCategory={() => {
          if (navigation?.navigate) {
            navigation.navigate('category_management');
          }
        }}
        onOpenMasterUnit={() => {
          if (navigation?.navigate) {
            navigation.navigate('unit_management');
          }
        }}
        onOpenMasterPromo={() => {
          if (navigation?.navigate) {
            navigation.navigate('promo_management');
          }
        }}
        onOpenMasterTax={() => {
          if (navigation?.navigate) {
            navigation.navigate('tax_management');
          }
        }}
      />

      {/* 7-Day Sales Trend Interactive Chart */}
      <SalesTrendChart trends={trends} formatRp={formatRp} />

      {/* 10 Recent Transactions Section */}
      <RecentTransactionsSection
        transactions={recentTransactions}
        formatRp={formatRp}
        onSelectTx={(tx) => {
          setSelectedTx(tx);
          setReceiptModalOpen(true);
        }}
        onViewAll={() => navigation?.navigate && navigation.navigate('history')}
      />

      {/* Modular Detail Tooltip Modal */}
      <DashboardDetailModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        sales={sales}
        profit={profit}
        inv={inv}
        formatRp={formatRp}
      />

      {/* Struk Transaksi Modal */}
      <PosReceiptModal
        visible={receiptModalOpen}
        isLandscape={isLandscape}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTx(null);
        }}
        completedTx={selectedTx}
        onNewTransaction={() => {
          setReceiptModalOpen(false);
          setSelectedTx(null);
        }}
        formatRp={formatRp}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  syncBadge: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  syncBadgeText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  errorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    whiteSpace: 'nowrap',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  refreshBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  refreshBtnDisabled: {
    opacity: 0.7,
  },
  refreshBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
