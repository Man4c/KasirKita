import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  PRODUCTS: 'kasirkita_offline_products',
  CATEGORIES: 'kasirkita_offline_categories',
  CUSTOMERS: 'kasirkita_offline_customers',
  PROMOS: 'kasirkita_offline_promos',
  TAXES_FEES: 'kasirkita_offline_taxes_fees',
  QUEUE: 'kasirkita_offline_transaction_queue',
  LAST_SYNC: 'kasirkita_offline_last_sync_timestamp',
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
};
