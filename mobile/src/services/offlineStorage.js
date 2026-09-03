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
  DASHBOARD_LAST_SYNC: 'kasirkita_offline_dashboard_last_sync',
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
};
