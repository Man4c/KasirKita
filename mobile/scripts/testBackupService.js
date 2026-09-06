/**
 * Deterministic Test Suite for KasirKita Backup & Restore Service
 * Directly imports and tests PRODUCTION modules:
 * - mobile/src/services/backupService.js
 * - mobile/src/services/offlineStorage.js
 * - mobile/src/services/storage.js
 *
 * Tests:
 * 1. Corrupt JSON & Malformed File Handling
 * 2. Non-KasirKita JSON Rejection
 * 3. Backward Compatibility & Sanitizer (Schema v1 -> v2)
 * 4. Multi-Device End-to-End Simulation (HP A -> HP B)
 *    - "Ganti HP" (Full with Offline Queue)
 *    - "Tambah HP" (Master Data Only, Queue Ignored)
 *    - Idempotent Queue Deduplication
 * 5. Smart Hybrid Export Verification (Local fallback)
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const babel = require('@babel/core');

// In-Memory AsyncStorage mock
const inMemoryStorage = {};
const mockAsyncStorage = {
  async getItem(k) { return inMemoryStorage[k] || null; },
  async setItem(k, v) { inMemoryStorage[k] = v; },
  async removeItem(k) { delete inMemoryStorage[k]; },
  async multiGet(keys) { return keys.map((k) => [k, inMemoryStorage[k] || null]); },
  async multiSet(pairs) { for (const [k, v] of pairs) inMemoryStorage[k] = v; },
};

// Loader that compiles React Native/Expo ES modules using Babel and runs them in a sandboxed context
function loadProductionModule(filePath, customResolver = {}) {
  const code = fs.readFileSync(filePath, 'utf8');
  const transformed = babel.transformSync(code, {
    presets: ['babel-preset-expo'],
    filename: filePath,
  });

  const exportsObj = {};
  const moduleObj = { exports: exportsObj };

  const customRequire = (id) => {
    if (customResolver[id]) return customResolver[id];
    if (id === '@react-native-async-storage/async-storage') return mockAsyncStorage;
    if (id === 'react-native') return { Platform: { OS: 'android' } };
    if (id === 'expo-secure-store') return { getItemAsync: async () => null, setItemAsync: async () => {} };
    if (id === 'expo-file-system') return {
      cacheDirectory: '/tmp/',
      EncodingType: { UTF8: 'utf8' },
      writeAsStringAsync: async () => {},
      readAsStringAsync: async () => '',
    };
    if (id === 'expo-sharing') return { isAvailableAsync: async () => true, shareAsync: async () => {} };
    if (id === 'expo-document-picker') return { getDocumentAsync: async () => ({ canceled: true }) };
    if (id.endsWith('app.json')) return { expo: { version: '1.3.0' } };
    return require(id);
  };

  const context = vm.createContext({
    require: customRequire,
    module: moduleObj,
    exports: exportsObj,
    console,
    setTimeout,
    clearTimeout,
    Date,
    JSON,
    Number,
    Array,
    String,
    Boolean,
    Error,
    Promise,
    Object,
    Math,
  });

  vm.runInContext(transformed.code, context);
  return moduleObj.exports;
}

// 1. Load actual production offlineStorage.js
const offlineStorageMod = loadProductionModule(
  path.resolve(__dirname, '../src/services/offlineStorage.js')
);
const offlineStorage = offlineStorageMod.offlineStorage;

// 2. Load actual production storage.js
const storageMod = loadProductionModule(
  path.resolve(__dirname, '../src/services/storage.js')
);
const storage = storageMod.storage;

// 3. Load actual production backupService.js
const backupServiceMod = loadProductionModule(
  path.resolve(__dirname, '../src/services/backupService.js'),
  {
    './offlineStorage': offlineStorageMod,
    './storage': storageMod,
    './api': { get: async () => ({ data: { success: false } }) },
  }
);
const service = backupServiceMod.backupService || backupServiceMod.default;

// RUN ALL TEST SUITES
async function runTests() {
  console.log('🧪 Memulai Pengujian Ketahanan & Validasi End-to-End Backup & Restore KasirKita (Production Source Code)...\n');

  console.log(`  🔍 Verifikasi Sumber Kode Produksi:`);
  console.log(`     - backupService: ${typeof service.parseAndValidateBackupContent} (dari mobile/src/services/backupService.js)`);
  console.log(`     - offlineStorage: ${typeof offlineStorage.cacheProducts} (dari mobile/src/services/offlineStorage.js)`);
  console.log(`     - storage: ${typeof storage.getSettings} (dari mobile/src/services/storage.js)\n`);

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

  await testAsync('Skenario D (Deduplikasi Intra-File): Berkas backup dengan offline_id kembar dalam satu payload hanya merestore 1 nota unik', async () => {
    for (const k in inMemoryStorage) delete inMemoryStorage[k];

    const duplicatePayload = {
      app: 'KasirKita',
      schema_version: 2,
      data: {
        store: { name: 'Toko Dedup Test' },
        offline_queue: [
          { offline_id: 'TX-IDENTICAL-001', invoice_number: 'INV-1' },
          { offline_id: 'TX-IDENTICAL-001', invoice_number: 'INV-1-DUP' }, // Duplikat dalam berkas yang sama
          { offline_id: 'TX-UNIQUE-002', invoice_number: 'INV-2' },
        ],
      },
    };

    const restoreRes = await service.restoreStoreBackup(duplicatePayload, { includeOfflineQueue: true });
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.restoredQueueCount, 2); // Hanya 2 item unik yang direstore, bukan 3!

    const queue = await offlineStorage.getOfflineQueue();
    assert.strictEqual(queue.length, 2);
    assert.strictEqual(queue[0].offline_id, 'TX-IDENTICAL-001');
    assert.strictEqual(queue[1].offline_id, 'TX-UNIQUE-002');
  });

  // --- SUITE 4: UJI SMART HYBRID EXPORT DARI KODE PRODUKSI ---
  console.log('\n--- SUITE 4: Uji Smart Hybrid Export (Kode Produksi backupService) ---');

  await testAsync('Export backup menghasilkan amplop berstandar KasirKita schema_version: 2', async () => {
    // Pastikan ada data di storage
    await storage.setSettings({ storeName: 'Toko Sukses Makmur', showBarcodeScanner: true });
    await offlineStorage.cacheProducts([{ id: 99, name: 'Kopi Hitam' }]);

    const exportRes = await service.exportStoreBackup({ forceLocal: true });
    assert.strictEqual(exportRes.success, true);
    assert.strictEqual(exportRes.summary.productsCount, 1);
    assert.strictEqual(exportRes.summary.sourceMode, 'Memori HP (Lokal)');
    assert(exportRes.filename.startsWith('kasirkita_backup_'));
  });

  console.log(`\n========================================`);
  console.log(`📊 Hasil Pengujian: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
