import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Customer & Membership operations in Mobile app.
 * Handles API calls, input normalization, error parsing, and local offline cache synchronization.
 */
export const customerService = {
  /**
   * Fetch customers list with optional search, membership type, and active status filtering.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search, membership_type, is_active, all, page }
   * @returns {Promise<{ items: Array, pagination: Object|null, fromCache: boolean }>}
   */
  async getCustomers(params = {}) {
    try {
      const response = await api.get('/customers', { params });
      const rawData = response.data?.data;

      // When all=true is requested, rawData is a direct array
      let list = [];
      let pagination = null;

      if (Array.isArray(rawData)) {
        list = rawData;
      } else if (rawData && Array.isArray(rawData.data)) {
        list = rawData.data;
        pagination = {
          currentPage: rawData.current_page || 1,
          lastPage: rawData.last_page || 1,
          total: rawData.total || list.length,
          perPage: rawData.per_page || 15,
        };
      }

      // Update offline storage cache for POS customer picker when without complex filter
      if (!params.search && (!params.page || params.page === 1) && list.length > 0) {
        offlineStorage.cacheCustomers(list).catch(() => {});
      }

      return {
        items: list,
        pagination,
        fromCache: false,
      };
    } catch (err) {
      // Offline fallback: load cached customers from storage
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedCustomers();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.phone?.includes(q) ||
              item.email?.toLowerCase().includes(q)
          );
        }

        if (params.membership_type && params.membership_type !== 'ALL') {
          cached = cached.filter(
            (item) => item.membership_type?.toUpperCase() === params.membership_type.toUpperCase()
          );
        }

        if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') {
          const isActiveBool =
            params.is_active === true ||
            params.is_active === 'true' ||
            params.is_active === 1 ||
            params.is_active === '1';
          cached = cached.filter((item) => Boolean(item.is_active) === isActiveBool);
        }

        return {
          items: cached,
          pagination: {
            currentPage: 1,
            lastPage: 1,
            total: cached.length,
            perPage: cached.length,
          },
          fromCache: true,
        };
      }

      const message =
        err.response?.data?.message ||
        'Gagal mengambil daftar pelanggan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Fetch single customer detail with recent transaction history by ID.
   *
   * @param {string|number} id - Customer ID
   * @returns {Promise<Object>}
   */
  async getCustomer(id) {
    try {
      const response = await api.get(`/customers/${id}`);
      return response.data?.data || null;
    } catch (err) {
      const cached = await offlineStorage.getCachedCustomers();
      const found = cached.find((item) => String(item.id) === String(id));
      if (found) return found;

      const message =
        err.response?.data?.message ||
        'Data pelanggan tidak ditemukan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Create a new customer.
   *
   * @param {Object} payload - { name, phone, email, address, membership_type, notes, is_active }
   * @returns {Promise<Object>}
   */
  async createCustomer(payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        phone: payload.phone ? String(payload.phone).trim() : null,
        email: payload.email ? String(payload.email).trim() : null,
        address: payload.address ? String(payload.address).trim() : null,
        membership_type: (payload.membership_type || 'REGULAR').toUpperCase(),
        notes: payload.notes ? String(payload.notes).trim() : null,
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.post('/customers', cleanPayload);
      const created = response.data?.data;

      if (created) {
        await offlineStorage.upsertCachedCustomer(created).catch(() => {});
      }

      return created;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal mendaftarkan pelanggan baru.';

      // Extract specific 422 validation errors if available
      if (err.response?.status === 422 && errorData?.errors) {
        const errorKeys = Object.keys(errorData.errors);
        if (errorKeys.length > 0) {
          const firstErrList = errorData.errors[errorKeys[0]];
          if (Array.isArray(firstErrList) && firstErrList[0]) {
            message = firstErrList[0];
          }
        }
      }

      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = errorData?.errors || {};
      throw error;
    }
  },

  /**
   * Update an existing customer.
   *
   * @param {string|number} id - Customer ID
   * @param {Object} payload - Fields to update
   * @returns {Promise<Object>}
   */
  async updateCustomer(id, payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        phone: payload.phone ? String(payload.phone).trim() : null,
        email: payload.email ? String(payload.email).trim() : null,
        address: payload.address ? String(payload.address).trim() : null,
        membership_type: (payload.membership_type || 'REGULAR').toUpperCase(),
        notes: payload.notes ? String(payload.notes).trim() : null,
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.put(`/customers/${id}`, cleanPayload);
      const updated = response.data?.data;

      if (updated) {
        await offlineStorage.upsertCachedCustomer(updated).catch(() => {});
      }

      return updated;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal memperbarui data pelanggan.';

      if (err.response?.status === 422 && errorData?.errors) {
        const errorKeys = Object.keys(errorData.errors);
        if (errorKeys.length > 0) {
          const firstErrList = errorData.errors[errorKeys[0]];
          if (Array.isArray(firstErrList) && firstErrList[0]) {
            message = firstErrList[0];
          }
        }
      }

      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = errorData?.errors || {};
      throw error;
    }
  },

  /**
   * Delete customer by ID (Soft delete).
   *
   * @param {string|number} id - Customer ID
   * @returns {Promise<boolean>}
   */
  async deleteCustomer(id) {
    try {
      await api.delete(`/customers/${id}`);
      await offlineStorage.removeCachedCustomer(id).catch(() => {});
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal menghapus data pelanggan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Get paginated transaction history for a specific customer.
   *
   * @param {string|number} id - Customer ID
   * @param {number} page - Page number
   * @returns {Promise<Object>}
   */
  async getCustomerTransactions(id, page = 1) {
    try {
      const response = await api.get(`/customers/${id}/transactions`, {
        params: { page },
      });
      return response.data?.data || { data: [], current_page: 1, last_page: 1, total: 0 };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal mengambil riwayat transaksi pelanggan.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};

export default customerService;
