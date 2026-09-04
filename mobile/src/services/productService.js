import api from './api';
import { offlineStorage } from './offlineStorage';

/**
 * Service wrapper for Product & Inventory operations in Mobile app.
 * Handles API calls, error parsing, and local offline cache synchronization.
 */
export const productService = {
  /**
   * Fetch paginated products with optional search, category, and status filters.
   *
   * @param {Object} params - Query filters { search, category_id, is_active, low_stock, sort_by, sort_order, page, per_page }
   * @returns {Promise<{ products: Array, pagination: Object, fromCache: boolean }>}
   */
  async getProducts(params = {}) {
    try {
      const response = await api.get('/products', { params });
      const resData = response.data?.data;

      // When loading first page without specific filters, update local offline product cache
      const isCleanFirstPage =
        (!params.page || Number(params.page) === 1) &&
        !params.search &&
        !params.category_id &&
        !params.low_stock;

      const productsList = Array.isArray(resData?.data)
        ? resData.data
        : Array.isArray(resData)
        ? resData
        : [];

      if (isCleanFirstPage && productsList.length > 0) {
        // Asynchronously update local products cache in background
        offlineStorage.cacheCatalog({ products: productsList }).catch(() => {});
      }

      return {
        products: productsList,
        pagination: {
          currentPage: resData?.current_page || 1,
          lastPage: resData?.last_page || 1,
          total: resData?.total || productsList.length,
          perPage: resData?.per_page || 20,
        },
        fromCache: false,
      };
    } catch (err) {
      // Offline fallback: load cached products from disk
      const isNetworkError = !err.response || err.code === 'ECONNABORTED';
      if (isNetworkError) {
        const cached = await offlineStorage.getCachedCatalog();
        let localProducts = cached.products || [];

        // Apply local filtering if searching or filtering category
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          localProducts = localProducts.filter(
            (p) =>
              p.name?.toLowerCase().includes(q) ||
              p.sku_barcode?.toLowerCase().includes(q)
          );
        }
        if (params.category_id) {
          localProducts = localProducts.filter(
            (p) => p.category_id === params.category_id
          );
        }
        if (params.low_stock === true || params.low_stock === 'true') {
          localProducts = localProducts.filter(
            (p) => Number(p.stock || 0) <= Number(p.min_stock || 0)
          );
        }

        return {
          products: localProducts,
          pagination: {
            currentPage: 1,
            lastPage: 1,
            total: localProducts.length,
            perPage: localProducts.length,
          },
          fromCache: true,
        };
      }
      throw err;
    }
  },

  /**
   * Fetch single product detail by ID.
   *
   * @param {string} id - Product UUID
   * @returns {Promise<Object>}
   */
  async getProduct(id) {
    try {
      const response = await api.get(`/products/${id}`);
      const product = response.data?.data;
      if (product) {
        await offlineStorage.upsertCachedProduct(product);
      }
      return product;
    } catch (err) {
      // Offline fallback: find product in local cache
      const cached = await offlineStorage.getCachedCatalog();
      const found = (cached.products || []).find((p) => p.id === id);
      if (found) return found;
      throw err;
    }
  },

  /**
   * Create a new product. (Owner only)
   *
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async createProduct(payload) {
    const response = await api.post('/products', payload);
    const createdProduct = response.data?.data;

    // Immediately synchronize local catalog cache
    if (createdProduct) {
      await offlineStorage.upsertCachedProduct(createdProduct);
    }
    return createdProduct;
  },

  /**
   * Update existing product. (Owner only)
   *
   * @param {string} id - Product UUID
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async updateProduct(id, payload) {
    const response = await api.put(`/products/${id}`, payload);
    const updatedProduct = response.data?.data;

    // Immediately synchronize local catalog cache
    if (updatedProduct) {
      await offlineStorage.upsertCachedProduct(updatedProduct);
    }
    return updatedProduct;
  },

  /**
   * Soft-delete a product. (Owner only)
   *
   * @param {string} id - Product UUID
   * @returns {Promise<boolean>}
   */
  async deleteProduct(id) {
    await api.delete(`/products/${id}`);
    await offlineStorage.removeCachedProduct(id);
    return true;
  },

  /**
   * Restock product with Average Cost and optional supplier/notes. (Owner only)
   *
   * @param {string} id - Product UUID
   * @param {Object} data - { quantity, unit_cost, unit_id, supplier_id, notes }
   * @returns {Promise<Object>}
   */
  async restockProduct(id, data) {
    const response = await api.post(`/products/${id}/restock`, data);
    const updatedProduct = response.data?.data;

    // Immediately synchronize local catalog cache with new stock & avg_cost
    if (updatedProduct) {
      await offlineStorage.upsertCachedProduct(updatedProduct);
    }
    return updatedProduct;
  },

  /**
   * Get stock movement history of a product.
   *
   * @param {string} id - Product UUID
   * @param {number} page
   * @returns {Promise<Object>}
   */
  async getStockMovements(id, page = 1) {
    const response = await api.get(`/products/${id}/stock-movements`, {
      params: { page, per_page: 20 },
    });
    return response.data?.data;
  },

  /**
   * Fetch categories list for filters and dropdown pickers.
   *
   * @returns {Promise<Array>}
   */
  async getCategories() {
    try {
      const response = await api.get('/categories');
      const categories = response.data?.data || [];
      if (Array.isArray(categories) && categories.length > 0) {
        offlineStorage.cacheCatalog({ categories }).catch(() => {});
      }
      return categories;
    } catch (err) {
      // Offline fallback: load cached categories
      const cached = await offlineStorage.getCachedCatalog();
      return cached.categories || [];
    }
  },

  /**
   * Fetch units list for unit picker.
   *
   * @returns {Promise<Array>}
   */
  async getUnits() {
    try {
      const response = await api.get('/units');
      const units = response.data?.data || [];
      if (Array.isArray(units) && units.length > 0) {
        offlineStorage.cacheUnits(units).catch(() => {});
      }
      return units;
    } catch (err) {
      // Offline fallback: load cached units
      return await offlineStorage.getCachedUnits();
    }
  },

  /**
   * Fetch suppliers list for restock supplier picker.
   *
   * @returns {Promise<Array>}
   */
  async getSuppliers() {
    try {
      const response = await api.get('/suppliers', { params: { all: true } });
      return response.data?.data || [];
    } catch (err) {
      return [];
    }
  },
};

