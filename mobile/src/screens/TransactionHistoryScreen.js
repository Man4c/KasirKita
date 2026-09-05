import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import api from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { formatRp } from '../utils/format';
import PosReceiptModal from '../components/pos/PosReceiptModal';
import TransactionCardItem from '../components/history/TransactionCardItem';
import HistoryHeader from '../components/history/HistoryHeader';
import HistorySearchBar from '../components/history/HistorySearchBar';
import HistoryBanner from '../components/history/HistoryBanner';
import HistoryEmptyState from '../components/history/HistoryEmptyState';

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

/**
 * TransactionHistoryScreen: Layar orkestrator riwayat transaksi modular.
 * Terintegrasi dengan sub-komponen history, offline-first caching, server-side search, dan thermal printing.
 */
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

  const handleSelectTx = useCallback((item) => {
    setSelectedTx(item);
    setReceiptModalOpen(true);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setFilterMethod('ALL');
  }, []);

  const renderTransactionItem = useCallback(
    ({ item }) => (
      <TransactionCardItem
        item={item}
        onPress={handleSelectTx}
        formatRp={formatRp}
      />
    ),
    [handleSelectTx]
  );

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <HistoryHeader
        totalCount={transactions.length}
        onRefresh={onRefresh}
        refreshing={refreshing}
        loading={loading}
      />

      {/* Search Input & Payment Method Filters */}
      <HistorySearchBar
        search={search}
        onSearchChange={setSearch}
        isSearchFocused={isSearchFocused}
        onSearchFocus={() => setIsSearchFocused(true)}
        onSearchBlur={() => setIsSearchFocused(false)}
        filterMethod={filterMethod}
        onFilterChange={setFilterMethod}
      />

      {/* Offline / Sync Banner Indicator */}
      <HistoryBanner
        isOfflineMode={isOfflineMode}
        offlineQueueCount={offlineQueueCount}
        transactionsCount={transactions.length}
      />

      {/* Transaction List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#e11d48" size="large" />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <HistoryEmptyState
          search={search}
          filterMethod={filterMethod}
          onResetFilters={handleResetFilters}
        />
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
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#e11d48" />
                <Text style={styles.footerLoaderText}>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
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
  footerLoader: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerLoaderText: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Poppins_400Regular',
  },
});
