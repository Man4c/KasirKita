import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Unit of Measure (UoM) operations in Mobile app.
 * Handles API calls, error parsing, and local offline cache synchronization.
 */
export const unitService = {
  /**
   * Fetch units list.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search }
   * @returns {Promise<{ units: Array, fromCache: boolean }>} 
   */
  async getUnits(params = {}) {
    try {
      const response = await api.get('/units', { params });
      const resData = response.data?.data;
      const unitsList = Array.isArray(resData) ? resData : [];

      // Update offline storage cache
      if (!params.search && unitsList.length > 0) {
        offlineStorage.cacheUnits(unitsList).catch(() => {});
      }

      return {
        units: unitsList,
        fromCache: false,
      };
    } catch (err) {
      // Offline fallback: load cached units from storage
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedUnits();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.symbol?.toLowerCase().includes(q) ||
              u.description?.toLowerCase().includes(q)
          );
        }

        return {
          units: cached,
          fromCache: true,
        };
      }
      throw err;
    }
  },

  /**
   * Fetch single unit detail.
   *
   * @param {string|number} id - Unit ID
   * @returns {Promise<Object>}
   */
  async getUnit(id) {
    try {
      const response = await api.get(`/units/${id}`);
      return response.data?.data || null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Create a new unit.
   *
   * @param {Object} payload - { name, symbol, description }
   * @returns {Promise<Object>}
   */
  async createUnit(payload) {
    try {
      const response = await api.post('/units', payload);
      const createdUnit = response.data?.data;
      if (createdUnit) {
        await offlineStorage.upsertCachedUnit({
          ...createdUnit,
          products_count: 0,
          conversions_count: 0,
        });
      }
      return createdUnit;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal membuat satuan baru.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Update an existing unit.
   *
   * @param {string|number} id - Unit ID
   * @param {Object} payload - { name, symbol, description }
   * @returns {Promise<Object>}
   */
  async updateUnit(id, payload) {
    try {
      const response = await api.put(`/units/${id}`, payload);
      const updatedUnit = response.data?.data;
      if (updatedUnit) {
        await offlineStorage.upsertCachedUnit(updatedUnit);
      }
      return updatedUnit;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal memperbarui satuan.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Delete a unit.
   *
   * @param {string|number} id - Unit ID
   * @returns {Promise<boolean>}
   */
  async deleteUnit(id) {
    try {
      await api.delete(`/units/${id}`);
      await offlineStorage.removeCachedUnit(id);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal menghapus satuan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};
