import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Tax & Fee (TaxesAndFees) operations in Mobile app.
 * Handles API calls, input normalization, error parsing, and local offline cache synchronization.
 */
export const taxService = {
  /**
   * Fetch taxes and fees list with optional search, category (tax vs fee), type, and status filtering.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search, is_tax, type, apply_to, is_active }
   * @returns {Promise<{ items: Array, fromCache: boolean }>}
   */
  async getTaxesAndFees(params = {}) {
    try {
      const response = await api.get('/taxes-and-fees', { params });
      const rawData = response.data?.data;
      const list = Array.isArray(rawData) ? rawData : [];

      // Update offline storage cache for quick POS picker when without complex filter
      if (!params.search && params.is_active !== false && list.length > 0) {
        offlineStorage.cacheTaxesAndFees(list).catch(() => {});
      }

      return {
        items: list,
        fromCache: false,
      };
    } catch (err) {
      // Offline fallback: load cached taxes & fees from storage
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedTaxesAndFees();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.description?.toLowerCase().includes(q)
          );
        }

        if (params.is_tax !== undefined && params.is_tax !== null && params.is_tax !== '') {
          const isTaxBool = params.is_tax === true || params.is_tax === 'true' || params.is_tax === 1 || params.is_tax === '1';
          cached = cached.filter((item) => Boolean(item.is_tax) === isTaxBool);
        }

        if (params.type) {
          cached = cached.filter((item) => item.type === params.type.toUpperCase());
        }

        if (params.apply_to) {
          cached = cached.filter((item) => item.apply_to === params.apply_to.toUpperCase());
        }

        if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') {
          const isActiveBool = params.is_active === true || params.is_active === 'true' || params.is_active === 1 || params.is_active === '1';
          cached = cached.filter((item) => Boolean(item.is_active) === isActiveBool);
        }

        return {
          items: cached,
          fromCache: true,
        };
      }

      const message =
        err.response?.data?.message ||
        'Gagal mengambil daftar pajak dan biaya.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Fetch single tax or fee detail by ID.
   *
   * @param {string|number} id - Tax/Fee ID
   * @returns {Promise<Object>}
   */
  async getTaxAndFee(id) {
    try {
      const response = await api.get(`/taxes-and-fees/${id}`);
      return response.data?.data || null;
    } catch (err) {
      const cached = await offlineStorage.getCachedTaxesAndFees();
      const found = cached.find((item) => String(item.id) === String(id));
      if (found) return found;

      const message =
        err.response?.data?.message ||
        'Komponen pajak/biaya tidak ditemukan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Create a new tax or fee component.
   *
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createTaxAndFee(payload) {
    try {
      const response = await api.post('/taxes-and-fees', payload);
      const created = response.data?.data;
      if (created) {
        await offlineStorage.upsertCachedTaxAndFee(created);
      }
      return created;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal membuat komponen pajak/biaya baru.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Update an existing tax or fee component.
   *
   * @param {string|number} id - Tax/Fee ID
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateTaxAndFee(id, payload) {
    try {
      const response = await api.put(`/taxes-and-fees/${id}`, payload);
      const updated = response.data?.data;
      if (updated) {
        await offlineStorage.upsertCachedTaxAndFee(updated);
      }
      return updated;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal memperbarui data pajak/biaya.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Soft-delete a tax or fee component.
   *
   * @param {string|number} id - Tax/Fee ID
   * @returns {Promise<boolean>}
   */
  async deleteTaxAndFee(id) {
    try {
      await api.delete(`/taxes-and-fees/${id}`);
      await offlineStorage.removeCachedTaxAndFee(id);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal menghapus komponen pajak/biaya.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Toggle tax/fee active status directly.
   *
   * @param {string|number} id - Tax/Fee ID
   * @returns {Promise<Object>} Updated tax/fee item
   */
  async toggleStatus(id) {
    try {
      const response = await api.patch(`/taxes-and-fees/${id}/toggle-status`);
      const updated = response.data?.data;
      if (updated) {
        await offlineStorage.upsertCachedTaxAndFee(updated);
      }
      return updated;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal mengubah status aktif komponen pajak/biaya.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};

export default taxService;

