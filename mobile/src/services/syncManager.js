import api from './api';
import { offlineStorage } from './offlineStorage';

class SyncManager {
  constructor() {
    this.isOnline = true;
    this.isSyncing = false;
    this.pendingCount = 0;
    this.subscribers = new Set();
    this.intervalId = null;
  }

  /**
   * Subscribe to sync state changes.
   * @param {Function} callback ({ isOnline, isSyncing, pendingCount })
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    // Initial emit
    callback({
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
    });

    return () => {
      this.subscribers.delete(callback);
    };
  }

  notify() {
    for (const sub of this.subscribers) {
      try {
        sub({
          isOnline: this.isOnline,
          isSyncing: this.isSyncing,
          pendingCount: this.pendingCount,
        });
      } catch (err) {
        console.warn('SyncManager subscriber error:', err);
      }
    }
  }

  /**
   * Initialize sync manager and start background heartbeat.
   */
  async init() {
    await this.refreshPendingCount();
    await this.checkConnectivity();

    // Periodic heartbeat every 20 seconds
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.heartbeat();
      }, 20000);
    }
  }

  destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async refreshPendingCount() {
    this.pendingCount = await offlineStorage.getPendingQueueCount();
    this.notify();
    return this.pendingCount;
  }

  /**
   * Check whether backend server is reachable.
   */
  async checkConnectivity() {
    try {
      const res = await api.get('/health', { timeout: 3500 });
      const online = res.status === 200;
      if (this.isOnline !== online) {
        this.isOnline = online;
        this.notify();
      }
      return online;
    } catch (err) {
      if (this.isOnline !== false) {
        this.isOnline = false;
        this.notify();
      }
      return false;
    }
  }

  /**
   * Periodic heartbeat: checks network and auto-syncs if online and pending items exist.
   */
  async heartbeat() {
    const online = await this.checkConnectivity();
    if (online) {
      await this.refreshPendingCount();
      if (this.pendingCount > 0 && !this.isSyncing) {
        await this.syncPendingTransactions();
      }
    }
  }

  /**
   * Process all pending offline transactions sequentially (FIFO).
   */
  async syncPendingTransactions() {
    if (this.isSyncing) return { success: false, message: 'Sinkronisasi sedang berlangsung' };

    const queue = await offlineStorage.getOfflineQueue();
    if (queue.length === 0) {
      this.pendingCount = 0;
      this.notify();
      return { success: true, count: 0 };
    }

    this.isSyncing = true;
    this.notify();

    let successCount = 0;
    let failCount = 0;

    for (const tx of queue) {
      try {
        const payload = {
          offline_id: tx.offline_id,
          created_at: tx.created_at,
          customer_id: tx.customer_id,
          customer_name: tx.customer_name,
          customer_phone: tx.customer_phone,
          discount_id: tx.discount_id,
          discount_code: tx.discount_code,
          discount_amount: tx.discount_amount,
          tax_amount: tx.tax_amount || 0,
          fee_amount: tx.fee_amount ?? tx.service_fee ?? 0,
          fee_details: tx.fee_details || [],
          cash_received: tx.cash_received || tx.paid_amount,
          change_amount: tx.change_amount || 0,
          paid_amount: tx.paid_amount,
          payment_method: tx.payment_method,
          notes: tx.notes,
          items: tx.items.map((item) => ({
            product_id: item.product_id || item.product?.id,
            quantity: item.quantity,
            unit_id: item.unit_id || null,
            conversion_id: item.conversion_id || null,
          })),
        };

        const res = await api.post('/pos/checkout', payload);
        if (res.status === 200 || res.status === 201) {
          await offlineStorage.removeOfflineQueueItem(tx.offline_id);
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        console.warn(`Gagal sinkronkan transaksi ${tx.offline_id}:`, err.message);
        failCount++;
        // If connection dropped mid-sync, stop loop
        if (!err.response) {
          this.isOnline = false;
          break;
        }
      }
    }

    this.isSyncing = false;
    await this.refreshPendingCount();

    return {
      success: successCount > 0,
      synced: successCount,
      failed: failCount,
      remaining: this.pendingCount,
    };
  }
}

export const syncManager = new SyncManager();
