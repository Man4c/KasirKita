import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Helper to calculate discount locally for offline POS checkout.
 * Mimics backend Discount model calculateDiscount logic.
 */
function calculateDiscountOffline(promo, subtotal) {
  const minPurchase = parseFloat(promo.min_purchase_amount || 0);
  if (subtotal < minPurchase) return 0;

  const val = parseFloat(promo.value || 0);
  let calculated = 0;

  if (promo.type === 'PERCENTAGE' || promo.type === 'MIN_SPEND') {
    calculated = (subtotal * val) / 100;
    if (promo.max_discount_amount !== null && promo.max_discount_amount !== undefined) {
      const maxDiscount = parseFloat(promo.max_discount_amount);
      if (maxDiscount > 0) {
        calculated = Math.min(calculated, maxDiscount);
      }
    }
  } else if (promo.type === 'FIXED') {
    calculated = Math.min(val, subtotal);
  }

  return Math.round(Math.max(0, calculated));
}

/**
 * Service wrapper for Discount & Voucher operations in Mobile app.
 * Handles API calls, error parsing, and local offline cache synchronization.
 */
export const discountService = {
  /**
   * Fetch discounts list with optional search and status filtering.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search, type, status, all }
   * @returns {Promise<{ discounts: Array, fromCache: boolean, pagination?: Object }>}
   */
  async getDiscounts(params = {}) {
    try {
      const response = await api.get('/discounts', { params });
      const rawData = response.data?.data;
      let discountsList = [];
      let pagination = null;

      if (Array.isArray(rawData)) {
        discountsList = rawData;
      } else if (rawData && Array.isArray(rawData.data)) {
        discountsList = rawData.data;
        pagination = {
          currentPage: rawData.current_page,
          lastPage: rawData.last_page,
          total: rawData.total,
        };
      }

      // Update offline storage cache for quick POS picker when without complex filter
      if (!params.search && (!params.status || params.status === 'active') && discountsList.length > 0) {
        offlineStorage.cachePromos(discountsList).catch(() => {});
      }

      return {
        discounts: discountsList,
        fromCache: false,
        pagination,
      };
    } catch (err) {
      // Offline fallback: load cached promos from storage
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedPromos();
        const now = new Date();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (p) =>
              p.code?.toLowerCase().includes(q) ||
              p.name?.toLowerCase().includes(q) ||
              p.description?.toLowerCase().includes(q)
          );
        }

        if (params.type) {
          cached = cached.filter((p) => p.type === params.type.toUpperCase());
        }

        if (params.status) {
          const s = params.status.toLowerCase();
          if (s === 'active') {
            cached = cached.filter((p) => {
              const isActive = p.is_active;
              const notExpired = !p.end_date || new Date(p.end_date) >= now;
              const quotaAvailable = p.quota === null || p.quota === undefined || (p.usage_count || 0) < p.quota;
              return isActive && notExpired && quotaAvailable;
            });
          } else if (s === 'inactive') {
            cached = cached.filter((p) => !p.is_active);
          } else if (s === 'expired') {
            cached = cached.filter((p) => {
              const dateExpired = p.end_date && new Date(p.end_date) < now;
              const quotaReached = p.quota !== null && p.quota !== undefined && (p.usage_count || 0) >= p.quota;
              return dateExpired || quotaReached;
            });
          }
        }

        return {
          discounts: cached,
          fromCache: true,
          pagination: null,
        };
      }
      throw err;
    }
  },

  /**
   * Fetch single discount detail with recent transaction logs.
   *
   * @param {string|number} id - Discount ID
   * @returns {Promise<Object>}
   */
  async getDiscount(id) {
    try {
      const response = await api.get(`/discounts/${id}`);
      return response.data?.data || null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Create a new master discount.
   *
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createDiscount(payload) {
    try {
      const response = await api.post('/discounts', payload);
      const created = response.data?.data;
      if (created) {
        await offlineStorage.upsertCachedPromo({
          ...created,
          usage_count: 0,
          transactions_count: 0,
        });
      }
      return created;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal membuat program promosi baru.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Update an existing discount.
   *
   * @param {string|number} id - Discount ID
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateDiscount(id, payload) {
    try {
      const response = await api.put(`/discounts/${id}`, payload);
      const updated = response.data?.data;
      if (updated) {
        await offlineStorage.upsertCachedPromo(updated);
      }
      return updated;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal memperbarui data promosi.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Soft-delete a discount.
   *
   * @param {string|number} id - Discount ID
   * @returns {Promise<boolean>}
   */
  async deleteDiscount(id) {
    try {
      await api.delete(`/discounts/${id}`);
      await offlineStorage.removeCachedPromo(id);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal menghapus program promosi.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Toggle discount active status directly.
   *
   * @param {string|number} id - Discount ID
   * @returns {Promise<Object>} Updated discount
   */
  async toggleStatus(id) {
    try {
      const response = await api.patch(`/discounts/${id}/toggle-status`);
      const updated = response.data?.data;
      if (updated) {
        await offlineStorage.upsertCachedPromo(updated);
      }
      return updated;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal mengubah status aktif promosi.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Check voucher validity and calculate discount for POS checkout.
   * Supports online validation via API with graceful fallback to offline local validation.
   *
   * @param {string} code - Voucher code
   * @param {number} subtotal - Current cart subtotal
   * @returns {Promise<Object>} Validation result
   */
  async checkVoucher(code, subtotal) {
    const formattedCode = (code || '').toUpperCase().trim();
    if (!formattedCode) {
      const error = new Error('Kode voucher tidak boleh kosong.');
      error.status = 422;
      throw error;
    }

    try {
      const response = await api.post('/discounts/check-voucher', {
        code: formattedCode,
        subtotal: parseFloat(subtotal) || 0,
      });
      return response.data?.data;
    } catch (err) {
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        // Offline check against local cache
        const cachedPromos = await offlineStorage.getCachedPromos();
        const promo = cachedPromos.find((p) => (p.code || '').toUpperCase() === formattedCode);

        if (!promo) {
          const error = new Error(`Kode voucher '${formattedCode}' tidak ditemukan (Offline).`);
          error.status = 404;
          throw error;
        }

        if (!promo.is_active) {
          const error = new Error(`Voucher '${promo.name}' sedang dinonaktifkan.`);
          error.status = 422;
          throw error;
        }

        const now = new Date();
        if (promo.end_date && new Date(promo.end_date) < now) {
          const error = new Error(`Voucher '${promo.name}' telah kadaluarsa.`);
          error.status = 422;
          throw error;
        }

        if (promo.start_date && new Date(promo.start_date) > now) {
          const error = new Error(`Voucher '${promo.name}' belum berlaku.`);
          error.status = 422;
          throw error;
        }

        if (promo.quota !== null && promo.quota !== undefined && (promo.usage_count || 0) >= promo.quota) {
          const error = new Error(`Kuota penukaran voucher '${promo.name}' telah habis.`);
          error.status = 422;
          throw error;
        }

        const minPurchase = parseFloat(promo.min_purchase_amount || 0);
        if (subtotal < minPurchase) {
          const error = new Error(`Minimal transaksi untuk voucher ini adalah Rp${minPurchase.toLocaleString('id-ID')}.`);
          error.status = 422;
          throw error;
        }

        const discountAmount = calculateDiscountOffline(promo, subtotal);

        return {
          valid: true,
          discount_id: promo.id,
          discount_code: promo.code,
          discount_name: promo.name,
          discount_type: promo.type,
          discount_value: parseFloat(promo.value),
          discount_amount: discountAmount,
          final_amount: Math.max(0, subtotal - discountAmount),
          fromCache: true,
        };
      }

      const message =
        err.response?.data?.message ||
        'Gagal memvalidasi kupon voucher.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};
