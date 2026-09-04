import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PRODUCTS: 'kasirkita_offline_products',
  CATEGORIES: 'kasirkita_offline_categories',
  CUSTOMERS: 'kasirkita_offline_customers',
  PROMOS: 'kasirkita_offline_promos',
  TAXES_FEES: 'kasirkita_offline_taxes_fees',
  QUEUE: 'kasirkita_offline_transaction_queue',
  LAST_SYNC: 'kasirkita_offline_last_sync_timestamp',
  DASHBOARD_SUMMARY: 'kasirkita_offline_dashboard_summary',
  DASHBOARD_TRENDS: 'kasirkita_offline_dashboard_trends',
  DASHBOARD_RECENT_TX: 'kasirkita_offline_dashboard_recent_tx',
  DASHBOARD_LAST_SYNC: 'kasirkita_offline_dashboard_last_sync',
  HISTORY_CACHE: 'kasirkita_offline_history_cache',
  HISTORY_LAST_SYNC: 'kasirkita_offline_history_last_sync',
  HISTORY_LAST_PREFETCH: 'kasirkita_offline_history_last_prefetch',
};

export const offlineStorage = {
  /**
   * Save catalog snapshots to offline cache.
   */
  async cacheCatalog({ products, categories, customers, promos, taxesAndFees }) {
    try {
      const items = [];
      if (Array.isArray(products)) items.push([KEYS.PRODUCTS, JSON.stringify(products)]);
      if (Array.isArray(categories)) items.push([KEYS.CATEGORIES, JSON.stringify(categories)]);
      if (Array.isArray(customers)) items.push([KEYS.CUSTOMERS, JSON.stringify(customers)]);
      if (Array.isArray(promos)) items.push([KEYS.PROMOS, JSON.stringify(promos)]);
      if (Array.isArray(taxesAndFees)) items.push([KEYS.TAXES_FEES, JSON.stringify(taxesAndFees)]);
      items.push([KEYS.LAST_SYNC, new Date().toISOString()]);

      await AsyncStorage.multiSet(items);
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache katalog offline:', err.message);
      return false;
    }
  },

  /**
   * Get cached catalog data for offline POS operation.
   */
  async getCachedCatalog() {
    try {
      const pairs = await AsyncStorage.multiGet([
        KEYS.PRODUCTS,
        KEYS.CATEGORIES,
        KEYS.CUSTOMERS,
        KEYS.PROMOS,
        KEYS.TAXES_FEES,
        KEYS.LAST_SYNC,
      ]);

      const data = {};
      for (const [key, value] of pairs) {
        if (!value) continue;
        if (key === KEYS.PRODUCTS) data.products = JSON.parse(value);
        else if (key === KEYS.CATEGORIES) data.categories = JSON.parse(value);
        else if (key === KEYS.CUSTOMERS) data.customers = JSON.parse(value);
        else if (key === KEYS.PROMOS) data.promos = JSON.parse(value);
        else if (key === KEYS.TAXES_FEES) data.taxesAndFees = JSON.parse(value);
        else if (key === KEYS.LAST_SYNC) data.lastSync = value;
      }
      return data;
    } catch (err) {
      console.warn('Gagal membaca cache katalog offline:', err.message);
      return {};
    }
  },

  /**
   * Update stock of a product in local cache when offline sale occurs.
   */
  async deductLocalProductStock(items) {
    try {
      const raw = await AsyncStorage.getItem(KEYS.PRODUCTS);
      if (!raw) return;
      const products = JSON.parse(raw);

      for (const item of items) {
        const prod = products.find((p) => p.id === item.product_id || p.id === item.product?.id);
        if (prod) {
          const qty = Number(item.quantity) || 1;
          const currentStock = Number(prod.stock) || 0;
          prod.stock = Math.max(0, currentStock - qty);
        }
      }

      await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
    } catch (err) {
      console.warn('Gagal memotong stok lokal offline:', err.message);
    }
  },

  /**
   * Enqueue an offline transaction.
   * Assigns an offline ID, temporary offline invoice, and deducts local stock.
   */
  async enqueueOfflineTransaction(payload, userProfile) {
    try {
      const timestamp = new Date();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const dateStr = timestamp.toISOString().replace(/[-:T]/g, '').substring(0, 14);
      const offlineId = `OFF-${dateStr}-${randomSuffix}`;
      const offlineInvoice = `INV-OFF-${dateStr}-${randomSuffix}`;

      const offlineTx = {
        ...payload,
        id: offlineId,
        offline_id: offlineId,
        invoice_number: offlineInvoice,
        created_at: timestamp.toISOString(),
        payment_status: 'COMPLETED',
        cashier_name: userProfile?.name || 'Kasir',
        is_offline_pending: true,
      };

      // 1. Deduct stock in local cache
      if (Array.isArray(payload.items)) {
        await this.deductLocalProductStock(payload.items);
      }

      // 2. Add to offline queue
      const existingQueueRaw = await AsyncStorage.getItem(KEYS.QUEUE);
      const queue = existingQueueRaw ? JSON.parse(existingQueueRaw) : [];
      queue.push(offlineTx);
      await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));

      return offlineTx;
    } catch (err) {
      console.error('Gagal menampung transaksi offline:', err);
      throw err;
    }
  },

  /**
   * Alias for enqueueOfflineTransaction for backward compatibility.
   */
  async queueTransaction(payload, userProfile) {
    return this.enqueueOfflineTransaction(payload, userProfile);
  },

  /**
   * Get all pending offline transactions.
   */
  async getOfflineQueue() {
    try {
      const raw = await AsyncStorage.getItem(KEYS.QUEUE);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.warn('Gagal membaca antrean offline:', err.message);
      return [];
    }
  },

  /**
   * Remove a successfully synced transaction from queue.
   */
  async removeOfflineQueueItem(offlineId) {
    try {
      const queue = await this.getOfflineQueue();
      const updated = queue.filter((t) => t.offline_id !== offlineId);
      await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(updated));
      return updated.length;
    } catch (err) {
      console.warn('Gagal menghapus item antrean offline:', err.message);
    }
  },

  /**
   * Get count of pending offline transactions.
   */
  async getPendingQueueCount() {
    const queue = await this.getOfflineQueue();
    return queue.length;
  },

  /**
   * Clear entire queue.
   */
  async clearOfflineQueue() {
    await AsyncStorage.removeItem(KEYS.QUEUE);
  },

  /**
   * Get size of offline catalog cache in bytes.
   */
  async getCatalogCacheSize() {
    try {
      const pairs = await AsyncStorage.multiGet([
        KEYS.PRODUCTS,
        KEYS.CATEGORIES,
        KEYS.CUSTOMERS,
        KEYS.PROMOS,
        KEYS.TAXES_FEES,
        KEYS.LAST_SYNC,
      ]);
      let totalBytes = 0;
      for (const [_, val] of pairs) {
        if (val) {
          totalBytes += typeof val === 'string' ? val.length : 0;
        }
      }
      return totalBytes;
    } catch {
      return 0;
    }
  },

  /**
   * Get formatted cache size string (e.g. '240.5 KB', '1.2 MB').
   */
  async getFormattedCacheSize() {
    const bytes = await this.getCatalogCacheSize();
    if (bytes === 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  },

  /**
   * Cache dashboard financial summary for offline review.
   */
  async cacheDashboardSummary(summary) {
    try {
      if (!summary) return false;
      const now = new Date().toISOString();
      await AsyncStorage.multiSet([
        [KEYS.DASHBOARD_SUMMARY, JSON.stringify(summary)],
        [KEYS.DASHBOARD_LAST_SYNC, now],
      ]);
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache dashboard:', err.message);
      return false;
    }
  },

  /**
   * Get cached dashboard financial summary.
   */
  async getCachedDashboardSummary() {
    try {
      const pairs = await AsyncStorage.multiGet([
        KEYS.DASHBOARD_SUMMARY,
        KEYS.DASHBOARD_LAST_SYNC,
      ]);
      const summaryStr = pairs[0]?.[1];
      const lastSync = pairs[1]?.[1];
      return {
        summary: summaryStr ? JSON.parse(summaryStr) : null,
        lastSync: lastSync || null,
      };
    } catch (err) {
      console.warn('Gagal membaca cache dashboard:', err.message);
      return { summary: null, lastSync: null };
    }
  },

  /**
   * Cache sales trends (7 days) for offline display.
   */
  async cacheDashboardTrends(trends) {
    try {
      if (!Array.isArray(trends)) return false;
      await AsyncStorage.setItem(KEYS.DASHBOARD_TRENDS, JSON.stringify(trends));
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache tren dashboard:', err.message);
      return false;
    }
  },

  /**
   * Get cached sales trends.
   */
  async getCachedDashboardTrends() {
    try {
      const val = await AsyncStorage.getItem(KEYS.DASHBOARD_TRENDS);
      return val ? JSON.parse(val) : [];
    } catch (err) {
      console.warn('Gagal membaca cache tren dashboard:', err.message);
      return [];
    }
  },

  /**
   * Cache recent transactions for offline display.
   */
  async cacheDashboardRecentTx(transactions) {
    try {
      if (!Array.isArray(transactions)) return false;
      await AsyncStorage.setItem(KEYS.DASHBOARD_RECENT_TX, JSON.stringify(transactions));
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache transaksi terbaru dashboard:', err.message);
      return false;
    }
  },

  /**
   * Get cached recent transactions.
   */
  async getCachedDashboardRecentTx() {
    try {
      const val = await AsyncStorage.getItem(KEYS.DASHBOARD_RECENT_TX);
      return val ? JSON.parse(val) : [];
    } catch (err) {
      console.warn('Gagal membaca cache transaksi terbaru dashboard:', err.message);
      return [];
    }
  },

  /**
   * Cache transaction history list for offline fallback.
   * Performs merge, deduplication, time-based retention (default 7 days), and safety cap (default 200 items).
   */
  async cacheRecentTransactions(newTransactions, options = {}) {
    try {
      // Guard: Jangan proses jika bukan array atau jika array kosong (mencegah overwrite dengan data parsial kosong)
      if (!Array.isArray(newTransactions) || newTransactions.length === 0) return false;
      const { maxDays = 7, maxCap = 200 } = options;

      const { transactions: existing } = await this.getCachedRecentTransactions();
      const cutoffTime = Date.now() - maxDays * 24 * 60 * 60 * 1000;

      // Peta data lama yang sudah ada di disk
      const existingMap = new Map();
      for (const item of existing) {
        const key = item.id || item.offline_id || item.invoice_number;
        if (key) existingMap.set(key, item);
      }

      const map = new Map();
      // 1. Masukkan data transaksi baru (gabungkan atribut lama jika ada agar detail lokal tidak hilang)
      for (const item of newTransactions) {
        const key = item.id || item.offline_id || item.invoice_number;
        if (!key) continue;
        const oldItem = existingMap.get(key);
        map.set(key, oldItem ? { ...oldItem, ...item } : item);
      }

      // 2. Pertahankan seluruh transaksi lama yang masih dalam jendela retensi waktu (default 7 hari)
      for (const item of existing) {
        const key = item.id || item.offline_id || item.invoice_number;
        if (!key || map.has(key)) continue;

        const itemTime = item.created_at ? new Date(item.created_at).getTime() : 0;
        if (itemTime >= cutoffTime) {
          map.set(key, item);
        }
      }

      // 3. Urutkan berdasarkan created_at descending (terbaru di atas)
      const merged = Array.from(map.values()).sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      });

      // 4. Terapkan safety cap batas maksimum
      const capped = merged.slice(0, maxCap);
      const now = new Date().toISOString();

      await AsyncStorage.multiSet([
        [KEYS.HISTORY_CACHE, JSON.stringify(capped)],
        [KEYS.HISTORY_LAST_SYNC, now],
      ]);
      return true;
    } catch (err) {
      console.warn('Gagal menyimpan cache riwayat transaksi:', err.message);
      return false;
    }
  },

  /**
   * Get cached transaction history list.
   */
  async getCachedRecentTransactions() {
    try {
      const pairs = await AsyncStorage.multiGet([
        KEYS.HISTORY_CACHE,
        KEYS.HISTORY_LAST_SYNC,
      ]);
      const dataStr = pairs[0]?.[1];
      const lastSync = pairs[1]?.[1];
      return {
        transactions: dataStr ? JSON.parse(dataStr) : [],
        lastSync: lastSync || null,
      };
    } catch (err) {
      console.warn('Gagal membaca cache riwayat transaksi:', err.message);
      return { transactions: [], lastSync: null };
    }
  },

  /**
   * Check whether background prefetch should run (cooldown 15 minutes).
   */
  async shouldRunHistoryPrefetch(cooldownMinutes = 15) {
    try {
      const last = await AsyncStorage.getItem(KEYS.HISTORY_LAST_PREFETCH);
      if (!last) return true;
      const elapsedMs = Date.now() - new Date(last).getTime();
      return elapsedMs > cooldownMinutes * 60 * 1000;
    } catch {
      return true;
    }
  },

  /**
   * Record last prefetch timestamp.
   */
  async recordHistoryPrefetchTimestamp() {
    try {
      await AsyncStorage.setItem(KEYS.HISTORY_LAST_PREFETCH, new Date().toISOString());
    } catch (err) {
      console.warn('Gagal menyimpan timestamp prefetch riwayat:', err.message);
    }
  },

  /**
   * Background silent prefetch for offline history resilience.
   * Pulls transactions from past 7 days (up to 200 items) in background without blocking UI.
   */
  async prefetchHistoryForOffline(apiClient, force = false) {
    try {
      if (!force) {
        const shouldRun = await this.shouldRunHistoryPrefetch(15);
        if (!shouldRun) return false;
      }

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const startDateStr = sevenDaysAgo.toISOString().split('T')[0];

      const res = await apiClient.get('/pos/transactions', {
        params: {
          start_date: startDateStr,
          per_page: 200,
        },
      });

      if (res.data?.success) {
        const paginated = res.data.data;
        const list = paginated?.data || (Array.isArray(paginated) ? paginated : []);
        if (list.length > 0) {
          await this.cacheRecentTransactions(list, { maxDays: 7, maxCap: 200 });
        }
        await this.recordHistoryPrefetchTimestamp();
        return true;
      }
      return false;
    } catch (err) {
      // Silent catch: do not disrupt UI or show error popups
      console.log('Background prefetch history silent skip:', err.message);
      return false;
    }
  },
};
