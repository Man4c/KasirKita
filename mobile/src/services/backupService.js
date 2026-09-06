import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import api from './api';
import { storage } from './storage';
import { offlineStorage } from './offlineStorage';
import appConfig from '../../app.json';

export const CURRENT_SCHEMA_VERSION = 2;
export const APP_VERSION = appConfig?.expo?.version || '1.3.0';

export const backupService = {
  /**
   * Export full store backup as a structured JSON file.
   * Smart Hybrid Strategy:
   * 1. If online & no unpushed offline transactions: attempts a 2.5s quick fetch
   *    from backend cloud API to ensure freshest master catalog.
   * 2. If offline or there are pending offline transactions: exports directly
   *    from local AsyncStorage cache (0ms delay).
   */
  async exportStoreBackup({ forceLocal = false } = {}) {
    try {
      const offlineQueue = await offlineStorage.getOfflineQueue();
      const hasPendingQueue = Array.isArray(offlineQueue) && offlineQueue.length > 0;

      let storeData = null;
      let categoriesData = [];
      let unitsData = [];
      let productsData = [];
      let customersData = [];
      let suppliersData = [];
      let taxesData = [];
      let discountsData = [];
      let preferencesData = null;

      let fetchedFromCloud = false;

      // Try fetching fresh master data if online, forceLocal is false, and no pending transactions
      if (!forceLocal && !hasPendingQueue) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Cloud fetch timeout')), 2500)
          );

          const fetchPromise = Promise.all([
            api.get('/settings/store').catch(() => null),
            api.get('/categories').catch(() => null),
            api.get('/units').catch(() => null),
            api.get('/products?per_page=500&is_active=all').catch(() => null),
            api.get('/customers?all=true').catch(() => null),
            api.get('/suppliers?all=true').catch(() => null),
            api.get('/taxes-and-fees').catch(() => null),
            api.get('/discounts?all=true').catch(() => null),
          ]);

          const [storeRes, catRes, unitRes, prodRes, custRes, suppRes, taxRes, discRes] =
            await Promise.race([fetchPromise, timeoutPromise]);

          if (prodRes?.data?.success && catRes?.data?.success) {
            fetchedFromCloud = true;
            storeData = storeRes?.data?.data || null;
            categoriesData = catRes?.data?.data || [];
            unitsData = unitRes?.data?.data || [];
            const prodList = prodRes?.data?.data;
            productsData = prodList?.data || (Array.isArray(prodList) ? prodList : []);
            customersData = custRes?.data?.data || [];
            suppliersData = suppRes?.data?.data || [];
            taxesData = taxRes?.data?.data || [];
            discountsData = discRes?.data?.data || [];
            preferencesData = storeData?.preferences || null;
          }
        } catch (cloudErr) {
          // Fallback seamlessly to local offline cache
          fetchedFromCloud = false;
        }
      }

      // If not fetched from cloud (offline or pending queue present), read from local cache
      if (!fetchedFromCloud) {
        const localSettings = await storage.getSettings();
        storeData = {
          name: localSettings?.storeName || 'KasirKita Mart',
          address: localSettings?.storeAddress || '',
          phone: localSettings?.storePhone || '',
          logo: localSettings?.storeLogo || null,
          receipt_footer: localSettings?.receiptFooter || '',
          show_logo_on_receipt: localSettings?.showLogoOnReceipt ?? true,
          show_phone_on_receipt: localSettings?.showPhoneOnReceipt ?? true,
        };

        categoriesData = await offlineStorage.getCachedCategories();
        unitsData = await offlineStorage.getCachedUnits();
        productsData = await offlineStorage.getCachedProducts();
        customersData = await offlineStorage.getCachedCustomers();
        suppliersData = await offlineStorage.getCachedSuppliers();
        taxesData = await offlineStorage.getCachedTaxesAndFees();
        discountsData = await offlineStorage.getCachedPromos();

        preferencesData = {
          show_barcode_scanner: localSettings?.showBarcodeScanner ?? true,
          sound_beep: localSettings?.soundBeep ?? true,
          show_customer_picker: localSettings?.showCustomerPicker ?? true,
          show_voucher_feature: localSettings?.showVoucherFeature ?? true,
          show_tax_feature: localSettings?.showTaxFeature ?? true,
          auto_print: localSettings?.autoPrint ?? false,
          print_two_copies: localSettings?.printTwoCopies ?? false,
          paper_size: localSettings?.paperSize || '58mm',
        };
      }

      // Construct standardized backup envelope with versioning
      const backupEnvelope = {
        app: 'KasirKita',
        schema_version: CURRENT_SCHEMA_VERSION,
        exported_at: new Date().toISOString(),
        app_version: APP_VERSION,
        source_device: {
          platform: Platform.OS,
          has_offline_queue: hasPendingQueue,
          queue_count: offlineQueue?.length || 0,
          source_mode: fetchedFromCloud ? 'cloud_snapshot' : 'local_storage',
        },
        data: {
          store: storeData,
          categories: categoriesData,
          units: unitsData,
          products: productsData,
          customers: customersData,
          suppliers: suppliersData,
          taxes_and_fees: taxesData,
          discounts: discountsData,
          preferences: preferencesData,
          offline_queue: offlineQueue || [],
        },
      };

      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const filename = `kasirkita_backup_${dateStr}.json`;
      const jsonString = JSON.stringify(backupEnvelope, null, 2);

      // Web platform export via browser download
      if (Platform.OS === 'web') {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        // Native mobile platform export via FileSystem & Sharing
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonString, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Simpan atau Bagikan Cadangan Data KasirKita',
            UTI: 'public.json',
          });
        }
      }

      return {
        success: true,
        filename,
        summary: {
          productsCount: productsData.length,
          categoriesCount: categoriesData.length,
          unitsCount: unitsData.length,
          customersCount: customersData.length,
          suppliersCount: suppliersData.length,
          taxesCount: taxesData.length,
          discountsCount: discountsData.length,
          queueCount: offlineQueue?.length || 0,
          hasOfflineQueue: hasPendingQueue,
          sourceMode: fetchedFromCloud ? 'Cloud API' : 'Memori HP (Lokal)',
        },
      };
    } catch (err) {
      console.warn('Gagal mengekspor data cadangan:', err.message);
      return {
        success: false,
        message: err.message || 'Gagal mengekspor data cadangan',
      };
    }
  },

  /**
   * Pick and inspect a backup JSON file before restoration.
   * Runs schema sanitizer to support backward compatibility with schema_version 1.
   */
  async pickAndInspectBackupFile() {
    try {
      let rawJsonContent = null;
      let filename = 'backup.json';

      if (Platform.OS === 'web') {
        rawJsonContent = await new Promise((resolve, reject) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json,application/json';
          input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (!file) {
              resolve(null);
              return;
            }
            filename = file.name;
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = () => reject(new Error('Gagal membaca berkas JSON'));
            reader.readAsText(file);
          };
          input.click();
        });

        if (!rawJsonContent) {
          return { canceled: true };
        }
      } else {
        const pickerRes = await DocumentPicker.getDocumentAsync({
          type: ['application/json', 'text/json', '*/*'],
          copyToCacheDirectory: true,
        });

        if (pickerRes.canceled || !pickerRes.assets?.[0]?.uri) {
          return { canceled: true };
        }

        const asset = pickerRes.assets[0];
        filename = asset.name || 'backup.json';
        rawJsonContent = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      }

      return this.parseAndValidateBackupContent(rawJsonContent, filename);
    } catch (err) {
      return {
        canceled: false,
        valid: false,
        message: err.message || 'Format berkas tidak valid',
      };
    }
  },

  /**
   * Parse and validate raw backup JSON string.
   * Runs schema sanitizer to support backward compatibility with schema_version 1.
   */
  parseAndValidateBackupContent(rawJsonContent, filename = 'backup.json') {
    try {
      if (!rawJsonContent || typeof rawJsonContent !== 'string') {
        throw new Error('Berkas cadangan kosong atau tidak terbaca.');
      }

      let parsed = null;
      try {
        parsed = JSON.parse(rawJsonContent);
      } catch (e) {
        throw new Error('Berkas yang dipilih bukan format JSON yang valid (sintaks rusak atau terpotong).');
      }

      if (!parsed || typeof parsed !== 'object' || parsed.app !== 'KasirKita') {
        throw new Error('Berkas bukan merupakan cadangan resmi KasirKita POS.');
      }

      if (!parsed.data || typeof parsed.data !== 'object') {
        throw new Error('Struktur data dalam berkas cadangan tidak lengkap.');
      }

      const schemaVersion = Number(parsed.schema_version) || 1;
      const data = parsed.data || {};

      // Schema Migrator / Sanitizer for backward compatibility
      if (schemaVersion < 2) {
        // Sanitize products without multi-UoM base_unit_id
        if (Array.isArray(data.products)) {
          data.products = data.products.map((p) => ({
            ...p,
            base_unit_id: p.base_unit_id || p.unit_id || 'pcs',
            default_pos_unit_id: p.default_pos_unit_id || p.base_unit_id || p.unit_id || 'pcs',
          }));
        }

        // Sanitize default preferences
        if (!data.preferences) {
          data.preferences = {
            show_barcode_scanner: true,
            sound_beep: true,
            show_customer_picker: true,
            show_voucher_feature: true,
            show_tax_feature: true,
            auto_print: false,
            print_two_copies: false,
            paper_size: '58mm',
          };
        }
      }

      const queue = Array.isArray(data.offline_queue) ? data.offline_queue : [];

      return {
        canceled: false,
        valid: true,
        filename,
        schemaVersion,
        exportedAt: parsed.exported_at || null,
        appVersion: parsed.app_version || '1.0.0',
        payload: parsed,
        summary: {
          productsCount: Array.isArray(data.products) ? data.products.length : 0,
          categoriesCount: Array.isArray(data.categories) ? data.categories.length : 0,
          unitsCount: Array.isArray(data.units) ? data.units.length : 0,
          customersCount: Array.isArray(data.customers) ? data.customers.length : 0,
          suppliersCount: Array.isArray(data.suppliers) ? data.suppliers.length : 0,
          taxesCount: Array.isArray(data.taxes_and_fees) ? data.taxes_and_fees.length : 0,
          discountsCount: Array.isArray(data.discounts) ? data.discounts.length : 0,
          queueCount: queue.length,
          hasOfflineQueue: queue.length > 0,
        },
      };
    } catch (err) {
      return {
        canceled: false,
        valid: false,
        message: err.message || 'Format berkas tidak valid',
      };
    }
  },

  /**
   * Apply validated backup data into local storage.
   *
   * @param {Object} backupPayload Envelope backup object
   * @param {Object} options
   * @param {boolean} options.includeOfflineQueue Whether to restore offline transactions queue (Ganti HP mode)
   */
  async restoreStoreBackup(backupPayload, { includeOfflineQueue = false } = {}) {
    try {
      if (!backupPayload || !backupPayload.data) {
        throw new Error('Data cadangan kosong atau tidak valid.');
      }

      const data = backupPayload.data;

      // 1. Restore Master Data Catalog
      if (Array.isArray(data.categories)) {
        await offlineStorage.cacheCategories(data.categories);
      }
      if (Array.isArray(data.units)) {
        await offlineStorage.cacheUnits(data.units);
      }
      if (Array.isArray(data.products)) {
        await offlineStorage.cacheProducts(data.products);
      }
      if (Array.isArray(data.customers)) {
        await offlineStorage.cacheCustomers(data.customers);
      }
      if (Array.isArray(data.suppliers)) {
        await offlineStorage.cacheSuppliers(data.suppliers);
      }
      if (Array.isArray(data.taxes_and_fees)) {
        await offlineStorage.cacheTaxesAndFees(data.taxes_and_fees);
      }
      if (Array.isArray(data.discounts)) {
        await offlineStorage.cachePromos(data.discounts);
      }

      // 2. Restore Store Identity & POS Feature Preferences
      const currentSettings = (await storage.getSettings()) || {};
      const incomingStore = data.store || {};
      const incomingPrefs = data.preferences || {};

      const mergedSettings = {
        ...currentSettings,
        ...(incomingStore.name ? { storeName: incomingStore.name } : {}),
        ...(incomingStore.address !== undefined ? { storeAddress: incomingStore.address } : {}),
        ...(incomingStore.phone !== undefined ? { storePhone: incomingStore.phone } : {}),
        ...(incomingStore.logo !== undefined ? { storeLogo: incomingStore.logo } : {}),
        ...(incomingStore.receipt_footer !== undefined ? { receiptFooter: incomingStore.receipt_footer } : {}),
        ...(typeof incomingStore.show_logo_on_receipt === 'boolean' ? { showLogoOnReceipt: incomingStore.show_logo_on_receipt } : {}),
        ...(typeof incomingStore.show_phone_on_receipt === 'boolean' ? { showPhoneOnReceipt: incomingStore.show_phone_on_receipt } : {}),

        // Toggle preferensi POS
        showBarcodeScanner: incomingPrefs.show_barcode_scanner ?? incomingPrefs.showBarcodeScanner ?? currentSettings.showBarcodeScanner ?? true,
        soundBeep: incomingPrefs.sound_beep ?? incomingPrefs.soundBeep ?? currentSettings.soundBeep ?? true,
        showCustomerPicker: incomingPrefs.show_customer_picker ?? incomingPrefs.showCustomerPicker ?? currentSettings.showCustomerPicker ?? true,
        showVoucherFeature: incomingPrefs.show_voucher_feature ?? incomingPrefs.showVoucherFeature ?? currentSettings.showVoucherFeature ?? true,
        showTaxFeature: incomingPrefs.show_tax_feature ?? incomingPrefs.showTaxFeature ?? currentSettings.showTaxFeature ?? true,
        autoPrint: incomingPrefs.auto_print ?? incomingPrefs.autoPrint ?? currentSettings.autoPrint ?? false,
        printTwoCopies: incomingPrefs.print_two_copies ?? incomingPrefs.printTwoCopies ?? currentSettings.printTwoCopies ?? false,
        paperSize: incomingPrefs.paper_size || incomingPrefs.paperSize || currentSettings.paperSize || '58mm',
      };

      await storage.setSettings(mergedSettings);

      // 3. Handle Offline Queue (Ganti HP mode vs Tambah HP mode)
      let restoredQueueCount = 0;
      if (includeOfflineQueue && Array.isArray(data.offline_queue) && data.offline_queue.length > 0) {
        const existingQueue = await offlineStorage.getOfflineQueue();
        for (const incomingTx of data.offline_queue) {
          if (!incomingTx || !incomingTx.offline_id) continue;
          const exists = existingQueue.some((q) => q.offline_id === incomingTx.offline_id);
          if (!exists) {
            const added = await offlineStorage.addOfflineQueue(incomingTx);
            if (added) {
              existingQueue.push(incomingTx);
              restoredQueueCount++;
            }
          }
        }
      }

      return {
        success: true,
        restoredSettings: mergedSettings,
        restoredQueueCount,
        summary: {
          products: data.products?.length || 0,
          categories: data.categories?.length || 0,
          customers: data.customers?.length || 0,
          queueRestored: restoredQueueCount,
        },
      };
    } catch (err) {
      console.warn('Gagal memulihkan data cadangan:', err.message);
      return {
        success: false,
        message: err.message || 'Gagal memulihkan data cadangan',
      };
    }
  },
};

export default backupService;
