import api from './api.js';

export const superAdminService = {
  /**
   * Mengambil statistik ringkasan platform SaaS superadmin.
   */
  async getStats() {
    try {
      const res = await api.get('/superadmin/stats');
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal memuat statistik superadmin.');
    }
  },

  /**
   * Mengambil daftar toko mitra tenant dengan parameter filter.
   * @param {Object} params - { search, subscription_status, business_category }
   */
  async getStores(params = {}) {
    try {
      const res = await api.get('/superadmin/stores', { params });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal memuat daftar toko mitra.');
    }
  },

  /**
   * Mengaktifkan toko langsung di lapangan dengan durasi dan catatan pembayaran.
   * @param {string|number} id - Store ID
   * @param {Object} payload - { duration_type, duration_days, payment_notes }
   */
  async activateStore(id, payload) {
    try {
      const res = await api.post(`/superadmin/stores/${id}/activate`, payload);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal mengaktifkan toko mitra.');
    }
  },

  /**
   * Memperpanjang masa trial toko mitra.
   * @param {string|number} id - Store ID
   * @param {Object} payload - { days, notes }
   */
  async extendTrial(id, payload) {
    try {
      const res = await api.post(`/superadmin/stores/${id}/extend-trial`, payload);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal memperpanjang trial toko.');
    }
  },

  /**
   * Mengubah status operasional toko mitra langsung.
   * @param {string|number} id - Store ID
   * @param {Object} payload - { status, notes }
   */
  async toggleStatus(id, payload) {
    try {
      const res = await api.post(`/superadmin/stores/${id}/toggle-status`, payload);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal mengubah status toko.');
    }
  },

  /**
   * Mengambil daftar voucher serial key lisensi.
   * @param {Object} params - { status, search }
   */
  async getLicenses(params = {}) {
    try {
      const res = await api.get('/superadmin/licenses', { params });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal memuat bank lisensi.');
    }
  },

  /**
   * Mencetak batch serial key baru.
   * @param {Object} payload - { count, duration_type, duration_days, notes }
   */
  async generateLicenses(payload) {
    try {
      const res = await api.post('/superadmin/licenses/generate', payload);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal mencetak voucher lisensi.');
    }
  },

  /**
   * Mencabut lisensi yang belum terpakai.
   * @param {string|number} id - License ID
   */
  async revokeLicense(id) {
    try {
      const res = await api.post(`/superadmin/licenses/${id}/revoke`);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Gagal mencabut voucher lisensi.');
    }
  },
};

export default superAdminService;
