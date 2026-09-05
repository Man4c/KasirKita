import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Supplier & Distributor operations in Mobile app.
 * Handles API calls, input normalization, error parsing (422/403), and local offline cache synchronization.
 */
export const supplierService = {
  /**
   * Fetch suppliers list with optional search and active status filtering.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search, is_active, all, page }
   * @returns {Promise<{ items: Array, pagination: Object|null, fromCache: boolean }>}
   */
  async getSuppliers(params = {}) {
    try {
      const response = await api.get('/suppliers', { params });
      const rawData = response.data?.data;

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

      // Update offline storage cache for fast access
      if (!params.search && (!params.page || params.page === 1) && list.length > 0) {
        offlineStorage.cacheSuppliers(list).catch(() => {});
      }

      return {
        items: list,
        pagination,
        fromCache: false,
      };
    } catch (err) {
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedSuppliers();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (item) =>
              item.name?.toLowerCase().includes(q) ||
              item.contact_person?.toLowerCase().includes(q) ||
              item.phone?.includes(q) ||
              item.email?.toLowerCase().includes(q) ||
              item.bank_name?.toLowerCase().includes(q) ||
              item.bank_account?.includes(q)
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

      let message = err.response?.data?.message || 'Gagal mengambil daftar pemasok.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang memiliki akses ke modul Pemasok.';
      }

      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Fetch single supplier detail with restock history by ID.
   *
   * @param {string|number} id - Supplier ID
   * @returns {Promise<Object>}
   */
  async getSupplier(id) {
    try {
      const response = await api.get(`/suppliers/${id}`);
      return response.data?.data || null;
    } catch (err) {
      const cached = await offlineStorage.getCachedSuppliers();
      const found = cached.find((item) => String(item.id) === String(id));
      if (found) return found;

      let message = err.response?.data?.message || 'Data pemasok tidak ditemukan.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang memiliki akses ke modul Pemasok.';
      }

      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Create a new supplier.
   *
   * @param {Object} payload - { name, contact_person, phone, email, address, bank_name, bank_account, bank_holder, notes, is_active }
   * @returns {Promise<Object>}
   */
  async createSupplier(payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        contact_person: payload.contact_person ? String(payload.contact_person).trim() : null,
        phone: payload.phone ? String(payload.phone).trim() : null,
        email: payload.email ? String(payload.email).trim() : null,
        address: payload.address ? String(payload.address).trim() : null,
        bank_name: payload.bank_name ? String(payload.bank_name).trim() : null,
        bank_account: payload.bank_account ? String(payload.bank_account).trim() : null,
        bank_holder: payload.bank_holder ? String(payload.bank_holder).trim() : null,
        notes: payload.notes ? String(payload.notes).trim() : null,
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.post('/suppliers', cleanPayload);
      const created = response.data?.data;

      if (created) {
        await offlineStorage.upsertCachedSupplier(created).catch(() => {});
      }

      return created;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal mendaftarkan pemasok baru.';

      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak menambah data pemasok.';
      } else if (err.response?.status === 422 && errorData?.errors) {
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
   * Update an existing supplier.
   *
   * @param {string|number} id - Supplier ID
   * @param {Object} payload - Fields to update
   * @returns {Promise<Object>}
   */
  async updateSupplier(id, payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        contact_person: payload.contact_person ? String(payload.contact_person).trim() : null,
        phone: payload.phone ? String(payload.phone).trim() : null,
        email: payload.email ? String(payload.email).trim() : null,
        address: payload.address ? String(payload.address).trim() : null,
        bank_name: payload.bank_name ? String(payload.bank_name).trim() : null,
        bank_account: payload.bank_account ? String(payload.bank_account).trim() : null,
        bank_holder: payload.bank_holder ? String(payload.bank_holder).trim() : null,
        notes: payload.notes ? String(payload.notes).trim() : null,
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.put(`/suppliers/${id}`, cleanPayload);
      const updated = response.data?.data;

      if (updated) {
        await offlineStorage.upsertCachedSupplier(updated).catch(() => {});
      }

      return updated;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal memperbarui data pemasok.';

      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak mengubah data pemasok.';
      } else if (err.response?.status === 422 && errorData?.errors) {
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
   * Delete supplier by ID (Soft delete).
   *
   * @param {string|number} id - Supplier ID
   * @returns {Promise<boolean>}
   */
  async deleteSupplier(id) {
    try {
      await api.delete(`/suppliers/${id}`);
      await offlineStorage.removeCachedSupplier(id).catch(() => {});
      return true;
    } catch (err) {
      let message = err.response?.data?.message || 'Gagal menghapus data pemasok.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak menghapus data pemasok.';
      }
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Get paginated restock supply history for a specific supplier.
   *
   * @param {string|number} id - Supplier ID
   * @param {number} page - Page number
   * @returns {Promise<Object>}
   */
  async getSupplierHistory(id, page = 1) {
    try {
      const response = await api.get(`/suppliers/${id}/history`, {
        params: { page },
      });
      return response.data?.data || { data: [], current_page: 1, last_page: 1, total: 0 };
    } catch (err) {
      let message = err.response?.data?.message || 'Gagal mengambil riwayat pasokan pemasok.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang memiliki akses ke riwayat pasokan.';
      }
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};

export default supplierService;
