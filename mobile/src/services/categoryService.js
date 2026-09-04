import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Category operations in Mobile app.
 * Handles API calls, error parsing, and local offline cache synchronization.
 */
export const categoryService = {
  /**
   * Fetch categories list.
   * Auto-refreshes local offline cache when successful.
   *
   * @param {Object} params - Query filters { search }
   * @returns {Promise<{ categories: Array, fromCache: boolean }>} 
   */
  async getCategories(params = {}) {
    try {
      const response = await api.get('/categories', { params });
      const resData = response.data?.data;
      const categoriesList = Array.isArray(resData) ? resData : [];

      // Update offline storage cache
      if (!params.search && categoriesList.length > 0) {
        offlineStorage.cacheCategories(categoriesList).catch(() => {});
      }

      return {
        categories: categoriesList,
        fromCache: false,
      };
    } catch (err) {
      // Offline fallback: load cached categories from storage
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        let cached = await offlineStorage.getCachedCategories();
        if (!cached || cached.length === 0) {
          const catalog = await offlineStorage.getCachedCatalog();
          cached = catalog.categories || [];
        }

        if (params.search) {
          const q = params.search.toLowerCase().trim();
          cached = cached.filter(
            (c) =>
              c.name?.toLowerCase().includes(q) ||
              c.description?.toLowerCase().includes(q) ||
              c.slug?.toLowerCase().includes(q)
          );
        }

        return {
          categories: cached,
          fromCache: true,
        };
      }
      throw err;
    }
  },

  /**
   * Fetch single category detail with its products.
   *
   * @param {string|number} id - Category ID
   * @returns {Promise<Object>}
   */
  async getCategory(id) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data?.data || null;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Create a new category.
   *
   * @param {Object} payload - { name, slug, description }
   * @returns {Promise<Object>}
   */
  async createCategory(payload) {
    try {
      const response = await api.post('/categories', payload);
      const createdCategory = response.data?.data;
      if (createdCategory) {
        await offlineStorage.upsertCachedCategory({
          ...createdCategory,
          products_count: 0,
        });
      }
      return createdCategory;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal membuat kategori baru.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Update an existing category.
   *
   * @param {string|number} id - Category ID
   * @param {Object} payload - { name, slug, description }
   * @returns {Promise<Object>}
   */
  async updateCategory(id, payload) {
    try {
      const response = await api.put(`/categories/${id}`, payload);
      const updatedCategory = response.data?.data;
      if (updatedCategory) {
        await offlineStorage.upsertCachedCategory(updatedCategory);
      }
      return updatedCategory;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Gagal memperbarui kategori.');
      const error = new Error(message);
      error.status = err.response?.status;
      error.errors = err.response?.data?.errors;
      throw error;
    }
  },

  /**
   * Delete a category.
   *
   * @param {string|number} id - Category ID
   * @returns {Promise<boolean>}
   */
  async deleteCategory(id) {
    try {
      await api.delete(`/categories/${id}`);
      await offlineStorage.removeCachedCategory(id);
      return true;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Gagal menghapus kategori.';
      const error = new Error(message);
      error.status = err.response?.status;
      throw error;
    }
  },
};
