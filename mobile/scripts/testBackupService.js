/**
 * Deterministic Test Suite for KasirKita Backup & Restore Service
 * Tests:
 * 1. Corrupt JSON & Malformed File Handling
 * 2. Non-KasirKita JSON Rejection
 * 3. Backward Compatibility & Sanitizer (Schema v1 -> v2)
 * 4. Multi-Device End-to-End Simulation (HP A -> HP B)
 *    - "Ganti HP" (Full with Offline Queue)
 *    - "Tambah HP" (Master Data Only, Queue Ignored)
 *    - Idempotent Queue Deduplication
 */

const assert = require('assert');

// Mock AsyncStorage in-memory for testing restoreStoreBackup
const inMemoryStorage = {};
const mockAsyncStorage = {
  async getItem(key) {
    return inMemoryStorage[key] || null;
  },
  async setItem(key, value) {
    inMemoryStorage[key] = value;
  },
  async removeItem(key) {
    delete inMemoryStorage[key];
  },
  async multiGet(keys) {
    return keys.map((k) => [k, inMemoryStorage[k] || null]);
  },
  async multiSet(pairs) {
    for (const [k, v] of pairs) {
      inMemoryStorage[k] = v;
    }
  },
};

// Pure test harness for backupService logic
function createTestHarness() {
  const KEYS = {
    PRODUCTS: 'kasirkita_offline_products',
    CATEGORIES: 'kasirkita_offline_categories',
    UNITS: 'kasirkita_offline_units',
    CUSTOMERS: 'kasirkita_offline_customers',
    SUPPLIERS: 'kasirkita_offline_suppliers',
    TAXES_FEES: 'kasirkita_offline_taxes_fees',
    PROMOS: 'kasirkita_offline_promos',
    QUEUE: 'kasirkita_offline_transaction_queue',
    SETTINGS: 'kasirkita_app_settings',
  };

  const offlineStorage = {
    async cacheProducts(p) { await mockAsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(p)); },
    async getCachedProducts() { const raw = await mockAsyncStorage.getItem(KEYS.PRODUCTS); return raw ? JSON.parse(raw) : []; },
    async cacheCategories(c) { await mockAsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(c)); },
    async getCachedCategories() { const raw = await mockAsyncStorage.getItem(KEYS.CATEGORIES); return raw ? JSON.parse(raw) : []; },
    async cacheUnits(u) { await mockAsyncStorage.setItem(KEYS.UNITS, JSON.stringify(u)); },
    async getCachedUnits() { const raw = await mockAsyncStorage.getItem(KEYS.UNITS); return raw ? JSON.parse(raw) : []; },
    async cacheCustomers(c) { await mockAsyncStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(c)); },
    async getCachedCustomers() { const raw = await mockAsyncStorage.getItem(KEYS.CUSTOMERS); return raw ? JSON.parse(raw) : []; },
    async cacheSuppliers(s) { await mockAsyncStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(s)); },
    async getCachedSuppliers() { const raw = await mockAsyncStorage.getItem(KEYS.SUPPLIERS); return raw ? JSON.parse(raw) : []; },
    async cacheTaxesAndFees(t) { await mockAsyncStorage.setItem(KEYS.TAXES_FEES, JSON.stringify(t)); },
    async getCachedTaxesAndFees() { const raw = await mockAsyncStorage.getItem(KEYS.TAXES_FEES); return raw ? JSON.parse(raw) : []; },
    async cachePromos(p) { await mockAsyncStorage.setItem(KEYS.PROMOS, JSON.stringify(p)); },
    async getCachedPromos() { const raw = await mockAsyncStorage.getItem(KEYS.PROMOS); return raw ? JSON.parse(raw) : []; },
    async getOfflineQueue() { const raw = await mockAsyncStorage.getItem(KEYS.QUEUE); return raw ? JSON.parse(raw) : []; },
    async addOfflineQueue(item) {
      const q = await this.getOfflineQueue();
      q.push(item);
      await mockAsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(q));
    },
  };

  const storage = {
    async getSettings() { const raw = await mockAsyncStorage.getItem(KEYS.SETTINGS); return raw ? JSON.parse(raw) : null; },
    async setSettings(s) { await mockAsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(s)); },
  };

  // Import pure logic functions identical to backupService.js
  const service = {
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
          if (Array.isArray(data.products)) {
            data.products = data.products.map((p) => ({
              ...p,
              base_unit_id: p.base_unit_id || p.unit_id || 'pcs',
              default_pos_unit_id: p.default_pos_unit_id || p.base_unit_id || p.unit_id || 'pcs',
            }));
          }

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

    async restoreStoreBackup(backupPayload, { includeOfflineQueue = false } = {}) {
      try {
        if (!backupPayload || !backupPayload.data) {
          throw new Error('Data cadangan kosong atau tidak valid.');
        }

        const data = backupPayload.data;

        if (Array.isArray(data.categories)) await offlineStorage.cacheCategories(data.categories);
        if (Array.isArray(data.units)) await offlineStorage.cacheUnits(data.units);
        if (Array.isArray(data.products)) await offlineStorage.cacheProducts(data.products);
        if (Array.isArray(data.customers)) await offlineStorage.cacheCustomers(data.customers);
        if (Array.isArray(data.suppliers)) await offlineStorage.cacheSuppliers(data.suppliers);
        if (Array.isArray(data.taxes_and_fees)) await offlineStorage.cacheTaxesAndFees(data.taxes_and_fees);
        if (Array.isArray(data.discounts)) await offlineStorage.cachePromos(data.discounts);

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

        let restoredQueueCount = 0;
        if (includeOfflineQueue && Array.isArray(data.offline_queue) && data.offline_queue.length > 0) {
          const existingQueue = await offlineStorage.getOfflineQueue();
          for (const incomingTx of data.offline_queue) {
            if (!incomingTx || !incomingTx.offline_id) continue;
            const exists = existingQueue.some((q) => q.offline_id === incomingTx.offline_id);
            if (!exists) {
              await offlineStorage.addOfflineQueue(incomingTx);
              restoredQueueCount++;
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
        return {
          success: false,
          message: err.message || 'Gagal memulihkan data cadangan',
        };
      }
    },
  };

  return { service, offlineStorage, storage };
}

// RUN ALL TEST SUITES
async function runTests() {
  console.log('🧪 Memulai Pengujian Ketahanan & Validasi End-to-End Backup & Restore KasirKita...\n');

  const { service, offlineStorage, storage } = createTestHarness();

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}:`, e.message);
      failed++;
    }
  }

  // --- SUITE 1: UJI BERKAS RUSAK & INVALID INPUT ---
  console.log('--- SUITE 1: Uji Berkas Rusak & Penanganan Error Ramah Pengguna ---');

  test('Berkas JSON terpotong (truncated / kurung hilang saat kirim WA) ditolak dengan pesan jelas', () => {
    const truncatedJson = '{"app": "KasirKita", "schema_version": 2, "data": {"products": [{"id": 1, "name": "Teh"';
    const res = service.parseAndValidateBackupContent(truncatedJson);
    assert.strictEqual(res.valid, false);
    assert(res.message.includes('bukan format JSON yang valid'));
  });

  test('Berkas JSON valid tapi BUKAN KasirKita ditolak dengan pesan jelas', () => {
    const foreignJson = JSON.stringify({ app: 'AplikasiLainPOS', version: 1, items: [] });
    const res = service.parseAndValidateBackupContent(foreignJson);
    assert.strictEqual(res.valid, false);
    assert(res.message.includes('bukan merupakan cadangan resmi KasirKita POS'));
  });

  test('Berkas KasirKita tapi tanpa data (data: null) ditolak dengan aman', () => {
    const emptyDataJson = JSON.stringify({ app: 'KasirKita', schema_version: 2, data: null });
    const res = service.parseAndValidateBackupContent(emptyDataJson);
    assert.strictEqual(res.valid, false);
    assert(res.message.includes('Struktur data'));
  });

  test('String kosong atau tipe bukan string ditolak tanpa throw crash', () => {
    const res = service.parseAndValidateBackupContent('');
    assert.strictEqual(res.valid, false);
    assert(res.message.includes('kosong atau tidak terbaca'));
  });

  // --- SUITE 2: UJI MIGRATOR & SANITIZER SKEMA LAMA (SCHEMA_VERSION 1) ---
  console.log('\n--- SUITE 2: Uji Sanitizer & Migrator Skema Lama (schema_version: 1) ---');

  test('Berkas cadangan v1 tanpa base_unit_id disanitasi otomatis dengan default pcs', () => {
    const legacyV1Payload = {
      app: 'KasirKita',
      schema_version: 1,
      app_version: '1.0.0',
      data: {
        products: [
          { id: 101, name: 'Kopi Kenangan Sachet', price: 3000, stock: 50 },
          { id: 102, name: 'Beras Ramos 5kg', price: 70000, stock: 10, unit_id: 'kg' },
        ],
        categories: [{ id: 1, name: 'Minuman' }],
      },
    };

    const res = service.parseAndValidateBackupContent(JSON.stringify(legacyV1Payload));
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.schemaVersion, 1);
    // Verifikasi produk 101 mendapatkan default base_unit_id 'pcs'
    assert.strictEqual(res.payload.data.products[0].base_unit_id, 'pcs');
    assert.strictEqual(res.payload.data.products[0].default_pos_unit_id, 'pcs');
    // Verifikasi produk 102 mempertahankan 'kg' dari unit_id lama
    assert.strictEqual(res.payload.data.products[1].base_unit_id, 'kg');
    // Verifikasi preferensi default 8 toggle diinjeksi
    assert.strictEqual(res.payload.data.preferences.show_barcode_scanner, true);
    assert.strictEqual(res.payload.data.preferences.paper_size, '58mm');
  });

  // --- SUITE 3: UJI END-TO-END MULTI-DEVICE SIMULATION (HP A -> HP B) ---
  console.log('\n--- SUITE 3: Uji End-to-End Multi-Device (Simulasi HP A ke HP B) ---');

  const hpABackupPayload = {
    app: 'KasirKita',
    schema_version: 2,
    exported_at: '2026-09-06T12:00:00Z',
    app_version: '1.3.0',
    data: {
      store: {
        name: 'Toko Sumber Barokah (HP A)',
        address: 'Jl. Ahmad Yani No. 5',
        phone: '0812-9999-8888',
      },
      products: [
        { id: 1, name: 'Teh Botol Melati 350ml', price: 5000, stock: 24, base_unit_id: 'btl' },
        { id: 2, name: 'Mie Instan Goreng', price: 3500, stock: 40, base_unit_id: 'pack' },
      ],
      categories: [
        { id: 1, name: 'Minuman' },
        { id: 2, name: 'Makanan' },
      ],
      customers: [
        { id: 1, name: 'Pelanggan Umum' },
        { id: 2, name: 'Budi Santoso' },
      ],
      preferences: {
        show_barcode_scanner: false,
        sound_beep: false,
        show_tax_feature: true,
        auto_print: true,
        paper_size: '80mm',
      },
      offline_queue: [
        { offline_id: 'TX-OFFLINE-A-001', invoice_number: 'INV-A01', paid_amount: 10000 },
        { offline_id: 'TX-OFFLINE-A-002', invoice_number: 'INV-A02', paid_amount: 7000 },
      ],
    },
  };

  await testAsync('Skenario A ("Ganti HP"): Seluruh master data & 2 nota offline dipulihkan ke HP B', async () => {
    // Reset storage simulasi HP B
    for (const k in inMemoryStorage) delete inMemoryStorage[k];

    const restoreRes = await service.restoreStoreBackup(hpABackupPayload, { includeOfflineQueue: true });
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.restoredQueueCount, 2);

    // Cek produk di HP B
    const prods = await offlineStorage.getCachedProducts();
    assert.strictEqual(prods.length, 2);
    assert.strictEqual(prods[0].name, 'Teh Botol Melati 350ml');

    // Cek preferensi di HP B (mengikuti HP A)
    const settings = await storage.getSettings();
    assert.strictEqual(settings.showBarcodeScanner, false);
    assert.strictEqual(settings.autoPrint, true);
    assert.strictEqual(settings.paperSize, '80mm');

    // Cek antrean offline di HP B
    const queue = await offlineStorage.getOfflineQueue();
    assert.strictEqual(queue.length, 2);
    assert.strictEqual(queue[0].offline_id, 'TX-OFFLINE-A-001');
    assert.strictEqual(queue[1].offline_id, 'TX-OFFLINE-A-002');
  });

  await testAsync('Skenario B ("Tambah HP Baru"): Master data dipulihkan tapi antrean offline diabaikan', async () => {
    // Reset storage simulasi HP B
    for (const k in inMemoryStorage) delete inMemoryStorage[k];

    const restoreRes = await service.restoreStoreBackup(hpABackupPayload, { includeOfflineQueue: false });
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.restoredQueueCount, 0);

    // Produk & kategori tetap terpulihkan
    const prods = await offlineStorage.getCachedProducts();
    assert.strictEqual(prods.length, 2);

    // Antrean offline HP B harus KOSONG (0 nota)
    const queue = await offlineStorage.getOfflineQueue();
    assert.strictEqual(queue.length, 0);
  });

  await testAsync('Skenario C (Deduplikasi Idempoten): Restore berulang kali tidak menduplikasi antrean nota', async () => {
    // 1. Inisialisasi HP B dengan pemulihan pertama (2 nota offline)
    for (const k in inMemoryStorage) delete inMemoryStorage[k];
    const firstRestore = await service.restoreStoreBackup(hpABackupPayload, { includeOfflineQueue: true });
    assert.strictEqual(firstRestore.restoredQueueCount, 2);

    // 2. Pemulihan kedua kali menggunakan file yang sama (includeOfflineQueue = true)
    const secondRestore = await service.restoreStoreBackup(hpABackupPayload, { includeOfflineQueue: true });
    assert.strictEqual(secondRestore.success, true);
    // Tidak ada item baru yang ditambahkan karena offline_id sudah ada di antrean
    assert.strictEqual(secondRestore.restoredQueueCount, 0);

    const queue = await offlineStorage.getOfflineQueue();
    assert.strictEqual(queue.length, 2); // Tetap 2, tidak menjadi 4!
  });

  console.log(`\n========================================`);
  console.log(`📊 Hasil Pengujian: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
