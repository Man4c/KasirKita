import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Staff & User management operations in Mobile app.
 * Handles API calls, input normalization, error parsing (422/403/400),
 * self-lockout guards, and local offline cache synchronization.
 */
export const userService = {
  /**
   * Fetch users/staff list with optional search, role, and active status filtering.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search, role, is_active, all, page }
   * @returns {Promise<{ items: Array, pagination: Object|null, fromCache: boolean }>}
   */
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
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
        offlineStorage.cacheUsers(list).catch(() => {});
      }

      return {
        items: list,
        pagination,
        fromCache: false,
      };
    } catch (err) {
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedUsers();

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (u) =>
              u.name?.toLowerCase().includes(q) ||
              u.email?.toLowerCase().includes(q) ||
              u.phone?.includes(q)
          );
        }

        if (params.role) {
          const r = String(params.role).toLowerCase();
          cached = cached.filter((u) => u.role?.toLowerCase() === r);
        }

        if (params.is_active !== undefined && params.is_active !== null && params.is_active !== '') {
          const isActiveBool =
            params.is_active === true ||
            params.is_active === 'true' ||
            params.is_active === 1 ||
            params.is_active === '1';
          cached = cached.filter((u) => Boolean(u.is_active) === isActiveBool);
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

      let message = err.response?.data?.message || 'Gagal mengambil daftar staf pengguna.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang memiliki akses ke modul Manajemen Staf.';
      }

      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Fetch single user detail with sales performance by ID.
   *
   * @param {string|number} id - User ID
   * @returns {Promise<Object>}
   */
  async getUserDetail(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data?.data || null;
    } catch (err) {
      let message = err.response?.data?.message || 'Gagal mengambil detail pengguna.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang memiliki hak melihat detail staf.';
      }
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Register a new staff / cashier account.
   *
   * @param {Object} payload - { name, email, phone, role, password, is_active }
   * @returns {Promise<Object>}
   */
  async createUser(payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        email: String(payload.email || '').toLowerCase().trim(),
        phone: payload.phone ? String(payload.phone).trim() : null,
        role: payload.role || 'cashier',
        password: String(payload.password || ''),
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.post('/users', cleanPayload);
      const created = response.data?.data;

      if (created) {
        await offlineStorage.upsertCachedUser(created).catch(() => {});
      }

      return created;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal mendaftarkan staf baru.';

      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak menambah akun staf.';
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
   * Update an existing user.
   *
   * @param {string|number} id - User ID
   * @param {Object} payload - Fields to update { name, email, phone, role, is_active }
   * @returns {Promise<Object>}
   */
  async updateUser(id, payload) {
    try {
      const cleanPayload = {
        name: String(payload.name || '').trim(),
        email: String(payload.email || '').toLowerCase().trim(),
        phone: payload.phone ? String(payload.phone).trim() : null,
        role: payload.role || 'cashier',
        is_active: payload.is_active !== undefined ? Boolean(payload.is_active) : true,
      };

      const response = await api.put(`/users/${id}`, cleanPayload);
      const updated = response.data?.data;

      if (updated) {
        await offlineStorage.upsertCachedUser(updated).catch(() => {});
      }

      return updated;
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal memperbarui data staf.';

      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak mengubah data staf.';
      } else if (err.response?.status === 400) {
        message = errorData?.message || 'Tindakan dibatalkan oleh sistem keamanan.';
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
   * Delete user by ID (Soft delete).
   *
   * @param {string|number} id - User ID
   * @returns {Promise<boolean>}
   */
  async deleteUser(id) {
    try {
      await api.delete(`/users/${id}`);
      await offlineStorage.removeCachedUser(id).catch(() => {});
      return true;
    } catch (err) {
      let message = err.response?.data?.message || 'Gagal menghapus data staf.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak menghapus data staf.';
      } else if (err.response?.status === 400) {
        message = err.response?.data?.message || 'Tidak dapat menghapus akun ini.';
      }
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },

  /**
   * Reset staff password and revoke active session tokens.
   *
   * @param {string|number} id - User ID
   * @param {string} newPassword - New password
   * @returns {Promise<string>}
   */
  async resetPassword(id, newPassword) {
    try {
      const response = await api.post(`/users/${id}/reset-password`, {
        new_password: String(newPassword || ''),
      });
      return response.data?.message || 'Kata sandi berhasil direset.';
    } catch (err) {
      const errorData = err.response?.data;
      let message = errorData?.message || 'Gagal mereset kata sandi staf.';

      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak mereset kata sandi.';
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
   * Toggle user active status.
   *
   * @param {string|number} id - User ID
   * @returns {Promise<Object>}
   */
  async toggleStatus(id) {
    try {
      const response = await api.patch(`/users/${id}/toggle-status`);
      const updated = response.data?.data;

      if (updated) {
        await offlineStorage.upsertCachedUser(updated).catch(() => {});
      }

      return updated;
    } catch (err) {
      let message = err.response?.data?.message || 'Gagal mengubah status aktif staf.';
      if (err.response?.status === 403) {
        message = 'Hanya pemilik (Owner) yang berhak mengubah status aktif.';
      } else if (err.response?.status === 400) {
        message = err.response?.data?.message || 'Tidak dapat menonaktifkan akun sendiri.';
      }
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};

export default userService;
