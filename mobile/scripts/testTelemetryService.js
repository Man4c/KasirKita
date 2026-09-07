/**
 * Deterministic Test Suite for KasirKita Telemetry & Installation Tracking Service
 * Tests PRODUCTION module:
 * - mobile/src/services/telemetryService.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');

let mockApiPost = null;
let mockSecureStoreData = {};
let mockAsyncStorageData = {};

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
    if (id === 'react-native') {
      return {
        Platform: {
          OS: 'android',
          Version: 34,
          constants: {
            Model: 'SM-A546E',
            Brand: 'samsung',
            Manufacturer: 'samsung',
            Release: '14',
          },
          select: (obj) => obj.android || obj.default,
        },
      };
    }
    if (id === 'expo-secure-store') {
      return {
        getItemAsync: async (key) => mockSecureStoreData[key] || null,
        setItemAsync: async (key, val) => {
          mockSecureStoreData[key] = val;
        },
      };
    }
    if (id === '@react-native-async-storage/async-storage') {
      return {
        getItem: async (key) => mockAsyncStorageData[key] || null,
        setItem: async (key, val) => {
          mockAsyncStorageData[key] = val;
        },
      };
    }
    if (id === './api') {
      return {
        post: async (url, data, opts) => {
          if (mockApiPost) return mockApiPost(url, data, opts);
          return { data: { success: true, data: { is_new: true } } };
        },
      };
    }
    if (id === '../../app.json') {
      return {
        expo: {
          version: '1.3.1',
          android: { versionCode: 5 },
        },
      };
    }
    return require(id);
  };

  const fn = new Function('require', 'module', 'exports', '__DEV__', transformed.code);
  fn(customRequire, moduleObj, exportsObj, true);

  return moduleObj.exports;
}

async function runTests() {
  console.log('=== Running Telemetry Service Tests ===\n');

  const telemetryModule = loadProductionModule(
    path.join(__dirname, '../src/services/telemetryService.js')
  );

  // 1. Test UUID Generator format
  console.log('Test 1: UUID Generator format...');
  const uuid1 = telemetryModule.generateInstallationId();
  const uuid2 = telemetryModule.generateInstallationId();
  assert(uuid1.startsWith('inst_'), 'UUID must start with inst_');
  assert(uuid1.length === 41, `Expected length 41, got ${uuid1.length}`);
  assert(uuid1 !== uuid2, 'Consecutive UUIDs must be distinct');
  console.log('  PASS (Generated:', uuid1, ')');

  // 2. Test getOrCreateInstallationId persistence
  console.log('\nTest 2: Installation ID persistence via SecureStore...');
  mockSecureStoreData = {};
  mockAsyncStorageData = {};
  const idFirst = await telemetryModule.getOrCreateInstallationId();
  const idSecond = await telemetryModule.getOrCreateInstallationId();
  assert.strictEqual(idFirst, idSecond, 'Should return the same ID on subsequent calls');
  assert(mockSecureStoreData['kasirkita_device_installation_id'], 'ID must be saved to SecureStore');
  console.log('  PASS (Persisted ID:', idFirst, ')');

  // 3. Test getDeviceMetadata extraction
  console.log('\nTest 3: Extract Device Metadata on Android...');
  const meta = telemetryModule.getDeviceMetadata();
  assert.strictEqual(meta.device_model, 'SM-A546E');
  assert.strictEqual(meta.brand, 'samsung');
  assert.strictEqual(meta.os_name, 'Android');
  assert.strictEqual(meta.os_version, 'Android 14');
  assert.strictEqual(meta.app_version, '1.3.1');
  assert.strictEqual(meta.app_version_code, 5);
  console.log('  PASS (Metadata:', meta, ')');

  // 4. Test recordDevicePing execution
  console.log('\nTest 4: recordDevicePing records new install successfully...');
  let sentPayload = null;
  mockApiPost = async (url, payload) => {
    sentPayload = payload;
    return { data: { success: true, data: { is_new: true } } };
  };

  const pingResult = await telemetryModule.telemetryService.recordDevicePing({ force: true });
  assert.strictEqual(pingResult.success, true);
  assert.strictEqual(pingResult.isNew, true);
  assert.strictEqual(sentPayload.device_model, 'SM-A546E');
  assert.strictEqual(sentPayload.installation_id, idFirst);
  console.log('  PASS (Ping recorded with payload:', sentPayload.installation_id, ')');

  // 5. Test Throttling
  console.log('\nTest 5: recordDevicePing throttles immediate repeated calls...');
  let apiCallCount = 0;
  mockApiPost = async () => {
    apiCallCount++;
    return { data: { success: true, data: { is_new: false } } };
  };

  const throttledResult = await telemetryModule.telemetryService.recordDevicePing({ force: false });
  assert.strictEqual(throttledResult.success, true);
  assert.strictEqual(throttledResult.throttled, true);
  assert.strictEqual(apiCallCount, 0, 'API should not be called when throttled');
  console.log('  PASS (Successfully throttled)');

  // 6. Test Fail-safe error handling (Offline / Network Error)
  console.log('\nTest 6: recordDevicePing fails gracefully on network drop without throwing...');
  mockApiPost = async () => {
    throw new Error('Network timeout');
  };

  const failResult = await telemetryModule.telemetryService.recordDevicePing({ force: true });
  assert.strictEqual(failResult.success, false);
  assert(failResult.error.includes('Network timeout'));
  console.log('  PASS (Failed safely and silently)');

  console.log('\nAll 6 Telemetry Service tests PASSED successfully!\n');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
