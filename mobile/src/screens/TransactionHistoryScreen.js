import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  Search,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Banknote,
  QrCode,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  Clock,
} from 'lucide-react-native';
import api from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import PosReceiptModal from '../components/pos/PosReceiptModal';

/**
 * Run non-urgent background task when JS thread is idle without blocking UI.
 * Modern replacement for deprecated InteractionManager using requestIdleCallback with graceful fallback.
 */
const runWhenIdle = (task, timeout = 2500) => {
  if (typeof requestIdleCallback === 'function') {
    return requestIdleCallback(task, { timeout });
  }
  return setTimeout(task, 1200);
};

const getMethodIcon = (method) => {
  switch (method) {
    case 'QRIS':
      return <QrCode size={13} color="#38bdf8" />;
    case 'TRANSFER':
      return <CreditCard size={13} color="#a78bfa" />;
    default:
      return <Banknote size={13} color="#34d399" />;
  }
};

const filterOfflineItems = (items, searchTxt, methodFilter) => {
  if (!Array.isArray(items)) return [];
  const q = (searchTxt || '').toLowerCase().trim();
  return items.filter((item) => {
    const matchMethod =
      !methodFilter || methodFilter === 'ALL' || item.payment_method === methodFilter;
    if (!matchMethod) return false;
    if (!q) return true;

    const matchInvoice = item.invoice_number && item.invoice_number.toLowerCase().includes(q);
    const matchCust = item.customer_name && item.customer_name.toLowerCase().includes(q);
    const cashierName = item.cashier?.name || item.cashier_name || '';
    const matchCashier = cashierName.toLowerCase().includes(q);

    return matchInvoice || matchCust || matchCashier;
  });
};

const TransactionCard = React.memo(function TransactionCard({ item, onPress, formatRp }) {
  const isCancelled = item.payment_status === 'CANCELLED';
  const isOfflinePending = item.is_offline_pending;

  return (
    <TouchableOpacity
      style={[styles.txCard, isOfflinePending && styles.txCardOfflinePending]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={styles.txCardHeader}>
        <View style={styles.invoiceBadgeRow}>
          <Receipt size={14} color={isOfflinePending ? '#f59e0b' : '#fb7185'} />
          <Text style={styles.invoiceNumber} numberOfLines={1}>
            {item.invoice_number}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isOfflinePending
              ? styles.statusBadgeOffline
              : isCancelled
              ? styles.statusBadgeCancelled
              : styles.statusBadgeSuccess,
          ]}
        >
          {isOfflinePending && <Clock size={10} color="#f59e0b" style={{ marginRight: 3 }} />}
          <Text
            style={[
              styles.statusBadgeText,
              isOfflinePending
                ? styles.statusTextOffline
                : isCancelled
                ? styles.statusTextCancelled
                : styles.statusTextSuccess,
            ]}
          >
            {isOfflinePending ? 'Belum Sinkron' : isCancelled ? 'Dibatalkan' : 'Selesai'}
          </Text>
        </View>
      </View>

      <View style={styles.txMetaRow}>
        <View style={styles.metaItem}>
          <Calendar size={12} color="#71717a" />
          <Text style={styles.metaText}>
            {new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <User size={12} color="#71717a" />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.customer_name || 'Pelanggan Umum'}
          </Text>
        </View>
      </View>

      <View style={styles.txCardFooter}>
        <View style={styles.methodBadge}>
          {getMethodIcon(item.payment_method)}
          <Text style={styles.methodBadgeText}>{item.payment_method}</Text>
        </View>
        <Text style={styles.totalAmountText}>{formatRp(item.total_amount || item.paid_amount)}</Text>
      </View>
    </TouchableOpacity>
  );
});

export default function TransactionHistoryScreen({ isLandscape = false }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterMethod, setFilterMethod] = useState('ALL'); // ALL, CASH, QRIS, TRANSFER
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const abortControllerRef = useRef(null);

  // Debounce search input (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch from server whenever debouncedSearch or filterMethod changes
  useEffect(() => {
    setPage(1);
    fetchTransactions(1, false, debouncedSearch, filterMethod);
  }, [debouncedSearch, filterMethod]);

  const fetchTransactions = async (
    pageNum = 1,
    isRefresh = false,
    activeSearch = debouncedSearch,
    activeMethod = filterMethod
  ) => {
    // 1. Cancel previous pending request to prevent race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (pageNum === 1 && !isRefresh) {
        setLoading(true);
      }

      // Ambil antrean transaksi offline yang tersimpan di HP
      const offlineQueue = await offlineStorage.getOfflineQueue();
      setOfflineQueueCount(offlineQueue.length);

      const params = {
        page: pageNum,
        per_page: 20,
      };
      if (activeSearch && activeSearch.trim()) {
        params.search = activeSearch.trim();
      }
      if (activeMethod && activeMethod !== 'ALL') {
        params.payment_method = activeMethod;
      }

      const res = await api.get('/pos/transactions', {
        params,
        signal: controller.signal,
      });

      if (res.data?.success) {
        setIsOfflineMode(false);
        const paginated = res.data.data;
        const list = paginated?.data || (Array.isArray(paginated) ? paginated : []);
        const currentPage = paginated?.current_page || pageNum;
        const lastPage = paginated?.last_page || 1;

        if (pageNum === 1) {
          // Filter antrean offline lokal sesuai kata kunci & filter metode
          const matchedQueue = filterOfflineItems(offlineQueue, activeSearch, activeMethod);
          const queueIds = new Set(matchedQueue.map((q) => q.id || q.offline_id));
          const uniqueServerList = list.filter((t) => !queueIds.has(t.id));

          // Tempatkan antrean offline lokal di paling atas
          setTransactions([...matchedQueue, ...uniqueServerList]);

          // Perbarui snapshot cache riwayat lokal untuk offline fallback (hanya saat daftar umum, tanpa filter pencarian)
          if (!activeSearch && (!activeMethod || activeMethod === 'ALL')) {
            offlineStorage.cacheRecentTransactions(list);
          }

          // Jalankan background prefetch senyap (7 hari terakhir, max 200) secara non-blocking saat thread idle
          runWhenIdle(() => {
            offlineStorage.prefetchHistoryForOffline(api);
          });
        } else {
          setTransactions((prev) => {
            const existingIds = new Set(prev.map((t) => t.id || t.offline_id));
            const newItems = list.filter((t) => !existingIds.has(t.id));
            return [...prev, ...newItems];
          });
        }
        setPage(currentPage);
        setHasMore(currentPage < lastPage);
      }
    } catch (err) {
      if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') {
        return; // Silently ignore request cancellation from faster typing
      }
      console.log('API error / Offline, fallback to local storage:', err.message);
      setIsOfflineMode(true);

      // Fallback Mode Offline: Baca antrean lokal + cache riwayat terakhir
      const offlineQueue = await offlineStorage.getOfflineQueue();
      setOfflineQueueCount(offlineQueue.length);

      const { transactions: cachedList } = await offlineStorage.getCachedRecentTransactions();

      const combined = [];
      const seen = new Set();
      for (const item of [...offlineQueue, ...cachedList]) {
        const idKey = item.id || item.offline_id || item.invoice_number;
        if (idKey && !seen.has(idKey)) {
          seen.add(idKey);
          combined.push(item);
        }
      }

      const filteredOffline = filterOfflineItems(combined, activeSearch, activeMethod);
      setTransactions(filteredOffline);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setLoadingMore(true);
      fetchTransactions(page + 1, false, debouncedSearch, filterMethod);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchTransactions(1, true, debouncedSearch, filterMethod);
    // Jalankan background prefetch paksa saat user menarik layar (pull to refresh)
    offlineStorage.prefetchHistoryForOffline(api, true);
  };

  const formatRp = useCallback((num) => 'Rp' + Number(num || 0).toLocaleString('id-ID'), []);

  const handleSelectTx = useCallback((item) => {
    setSelectedTx(item);
    setReceiptModalOpen(true);
  }, []);

  const renderTransactionItem = useCallback(
    ({ item }) => (
      <TransactionCard
        item={item}
        onPress={handleSelectTx}
        formatRp={formatRp}
      />
    ),
    [handleSelectTx, formatRp]
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          Daftar nota penjualan dan struk transaksi toko
        </Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Search
          size={16}
          color={isSearchFocused || search ? '#fb7185' : '#a1a1aa'}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari no. invoice / pelanggan..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.searchClearBtn}
            activeOpacity={0.7}
          >
            <X size={12} color="#d4d4d8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        {['ALL', 'CASH', 'QRIS', 'TRANSFER'].map((method) => {
          const isSelected = filterMethod === method;
          const label =
            method === 'ALL'
              ? 'Semua'
              : method === 'CASH'
              ? 'Tunai'
              : method;
          return (
            <TouchableOpacity
              key={method}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setFilterMethod(method)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Offline / Sync Banner Indicator */}
      {isOfflineMode ? (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#f59e0b" style={{ marginRight: 8, flexShrink: 0 }} />
          <Text style={styles.offlineBannerText}>
            Mode Offline: Menampilkan {transactions.length} nota tersimpan di HP (7 hari terakhir).
          </Text>
        </View>
      ) : offlineQueueCount > 0 ? (
        <View style={styles.queueBanner}>
          <Clock size={14} color="#38bdf8" style={{ marginRight: 8, flexShrink: 0 }} />
          <Text style={styles.queueBannerText}>
            {offlineQueueCount} transaksi offline di HP menunggu sinkronisasi otomatis.
          </Text>
        </View>
      ) : null}

      {/* Transaction List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#e11d48" size="large" />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Receipt size={40} color="#3f3f46" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>
            {search || filterMethod !== 'ALL'
              ? 'Tidak Ada Transaksi Ditemukan'
              : 'Belum Ada Transaksi'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {search || filterMethod !== 'ALL'
              ? 'Coba ganti kata kunci pencarian atau reset filter metode pembayaran.'
              : 'Transaksi penjualan yang selesai akan muncul di sini.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => (item.id || item.uuid || item.invoice_number).toString()}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#e11d48" />
                <Text style={{ color: '#71717a', fontSize: 12, marginTop: 4, fontFamily: 'Poppins_400Regular' }}>
                  Memuat transaksi lainnya...
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e11d48"
              colors={['#e11d48']}
            />
          }
        />
      )}

      {/* Thermal Receipt Modal (Standardized with Print & Tutup buttons) */}
      <PosReceiptModal
        visible={receiptModalOpen}
        isLandscape={isLandscape}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTx(null);
        }}
        completedTx={selectedTx}
        closeBtnText="Tutup"
        formatRp={formatRp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBarFocused: {
    borderColor: '#e11d48',
    backgroundColor: '#1c1917',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  filterChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#b45309',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineBannerText: {
    color: '#fde68a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  queueBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  queueBannerText: {
    color: '#bae6fd',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  syncNowBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    flexShrink: 0,
  },
  syncNowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardList: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
  },
  txCardPending: {
    borderColor: '#b45309',
    backgroundColor: '#1a1612',
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  invoiceNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statusTextSuccess: {
    color: '#34d399',
  },
  statusTextCancelled: {
    color: '#fb7185',
  },
  statusTextOffline: {
    color: '#f59e0b',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  txCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
  },
  methodBadgeText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  totalAmountText: {
    color: '#fb7185',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    alignSelf: 'center',
  },
  modalCloseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#18181b',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomColor: '#d4d4d8',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  receiptBrand: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  receiptSubtitleText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#52525b',
  },
  receiptInvoice: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#27272a',
    marginTop: 6,
  },
  receiptDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
  },
  receiptCustomer: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    marginTop: 6,
  },
  receiptItemsList: {
    paddingVertical: 10,
    borderBottomColor: '#d4d4d8',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flex: 1,
    marginRight: 8,
  },
  receiptItemPrice: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
  },
  receiptSummary: {
    paddingVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptRowLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#52525b',
  },
  receiptRowValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d4d4d8',
    marginVertical: 6,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  receiptTotalValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#e11d48',
  },
  receiptFooterText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#71717a',
    marginTop: 10,
    marginBottom: 14,
  },
  closeModalBtn: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
