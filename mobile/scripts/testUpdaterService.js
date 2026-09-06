/**
 * Deterministic Test Suite for KasirKita In-App Remote Updater Service
 * Directly imports and tests PRODUCTION module:
 * - mobile/src/services/updaterService.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vm = require('vm');
const babel = require('@babel/core');

let mockApiGet = null;
let mockIntentLaunched = null;
let mockContentUriCalled = null;

// Sandboxed loader compiling React Native ES modules with babel-preset-expo
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
      return { Platform: { OS: 'android' } };
    }
    if (id === 'expo-file-system/legacy' || id === 'expo-file-system') {
      return {
        cacheDirectory: 'file:///data/user/0/com.kasirkita.pos/cache/',
        readDirectoryAsync: async () => ['KasirKita-update-old.apk', 'other.tmp'],
        deleteAsync: async () => {},
        getContentUriAsync: async (uri) => {
          mockContentUriCalled = uri;
          return 'content://com.kasirkita.pos.fileprovider/cache/KasirKita-update.apk';
        },
        createDownloadResumable: (url, target, options, cb) => ({
          downloadAsync: async () => {
            if (cb) cb({ totalBytesWritten: 100, totalBytesExpectedToWrite: 100 });
            return { uri: target, status: 200 };
          },
          cancelAsync: async () => {},
        }),
      };
    }
    if (id === 'expo-intent-launcher') {
      return {
        startActivityAsync: async (action, options) => {
          mockIntentLaunched = { action, options };
          return { resultCode: -1 };
        },
      };
    }
    if (id === './api') {
      return {
        get: async (url, config) => {
          if (mockApiGet) return mockApiGet(url, config);
          return { data: { success: true, data: { latest_version: '1.4.0' } } };
        },
      };
    }
    if (id.endsWith('app.json')) {
      return { expo: { version: '1.3.0' } };
    }
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
    isNaN,
    parseFloat,
    parseInt,
  });

  vm.runInContext(transformed.code, context);
  return moduleObj.exports;
}

// Load production updaterService module
const updaterModule = loadProductionModule(
  path.resolve(__dirname, '../src/services/updaterService.js')
);

const {
  updaterService,
  parseSemver,
  isNewerVersion,
  formatBytes,
  APP_VERSION,
} = updaterModule;

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    console.error(`  ❌ ${name}:`, err.message);
  }
}

async function runAsyncTests() {
  console.log('\n========================================');
  console.log('🧪 Testing KasirKita UpdaterService');
  console.log('========================================\n');

  // 1. parseSemver
  console.log('1. Testing parseSemver:');
  test('Standard Semver "1.4.0"', () => {
    const res = parseSemver('1.4.0');
    assert.strictEqual(res[0], 1);
    assert.strictEqual(res[1], 4);
    assert.strictEqual(res[2], 0);
  });
  test('Prefix v "v2.10.5"', () => {
    const res = parseSemver('v2.10.5');
    assert.strictEqual(res[0], 2);
    assert.strictEqual(res[1], 10);
    assert.strictEqual(res[2], 5);
  });
  test('Missing patch "1.3"', () => {
    const res = parseSemver('1.3');
    assert.strictEqual(res[0], 1);
    assert.strictEqual(res[1], 3);
    assert.strictEqual(res[2], 0);
  });
  test('Empty string and null fallback', () => {
    const resEmpty = parseSemver('');
    const resNull = parseSemver(null);
    assert.strictEqual(resEmpty[0], 0);
    assert.strictEqual(resNull[0], 0);
  });

  // 2. isNewerVersion
  console.log('\n2. Testing isNewerVersion:');
  test('Minor upgrade: 1.4.0 > 1.3.0 is true', () => {
    assert.strictEqual(isNewerVersion('1.4.0', '1.3.0'), true);
  });
  test('Patch upgrade: 1.3.1 > 1.3.0 is true', () => {
    assert.strictEqual(isNewerVersion('1.3.1', '1.3.0'), true);
  });
  test('Major upgrade: 2.0.0 > 1.9.9 is true', () => {
    assert.strictEqual(isNewerVersion('2.0.0', '1.9.9'), true);
  });
  test('Equal version: 1.3.0 > 1.3.0 is false', () => {
    assert.strictEqual(isNewerVersion('1.3.0', '1.3.0'), false);
  });
  test('Older version: 1.2.9 > 1.3.0 is false', () => {
    assert.strictEqual(isNewerVersion('1.2.9', '1.3.0'), false);
  });
  test('Numeric comparison prevents string sorting bug: 1.10.0 > 1.9.0 is true', () => {
    assert.strictEqual(isNewerVersion('1.10.0', '1.9.0'), true);
  });

  // 3. formatBytes
  console.log('\n3. Testing formatBytes:');
  test('0 and null return "0 B"', () => {
    assert.strictEqual(formatBytes(0), '0 B');
    assert.strictEqual(formatBytes(null), '0 B');
  });
  test('1 KB formatted correctly', () => {
    assert.strictEqual(formatBytes(1024), '1 KB');
  });
  test('50 MB formatted correctly', () => {
    assert.strictEqual(formatBytes(52428800), '50 MB');
  });

  // 4. checkForUpdate
  console.log('\n4. Testing updaterService.checkForUpdate:');
  total++;
  try {
    mockApiGet = async () => ({
      data: {
        success: true,
        data: {
          latest_version: '1.4.0',
          latest_version_code: 140,
          apk_url: 'https://test.supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk',
          apk_size_bytes: 45000000,
          changelog: ['Fitur pembaruan otomatis'],
          is_mandatory: false,
        },
      },
    });
    const checkResult = await updaterService.checkForUpdate();
    assert.strictEqual(checkResult.hasUpdate, true);
    assert.strictEqual(checkResult.latestVersion, '1.4.0');
    assert.strictEqual(checkResult.apkUrl.includes('KasirKita-v1.4.0.apk'), true);
    passed++;
    console.log('  ✅ Server has newer version returns hasUpdate: true');
  } catch (e) {
    console.error('  ❌ checkForUpdate newer version:', e.message);
  }

  total++;
  try {
    mockApiGet = async () => ({
      data: {
        success: true,
        data: {
          latest_version: '1.3.0',
        },
      },
    });
    const checkResult = await updaterService.checkForUpdate();
    assert.strictEqual(checkResult.hasUpdate, false);
    passed++;
    console.log('  ✅ Server has same version returns hasUpdate: false');
  } catch (e) {
    console.error('  ❌ checkForUpdate same version:', e.message);
  }

  total++;
  try {
    mockApiGet = async () => {
      throw new Error('Network request failed / Offline');
    };
    const checkResult = await updaterService.checkForUpdate();
    assert.strictEqual(checkResult.hasUpdate, false);
    assert.strictEqual(checkResult.serverReachable, false);
    passed++;
    console.log('  ✅ Network failure safely handled without crashing');
  } catch (e) {
    console.error('  ❌ checkForUpdate network failure:', e.message);
  }

  // 5. downloadApk and installApk
  console.log('\n5. Testing downloadApk & installApk:');
  total++;
  try {
    let progressReported = null;
    const downloadRes = await updaterService.downloadApk('https://test.supabase.co/update.apk', {
      onProgress: (p) => { progressReported = p; },
    });
    assert.strictEqual(downloadRes.uri.includes('KasirKita-update-'), true);
    assert.strictEqual(progressReported.percent, 100);
    passed++;
    console.log('  ✅ downloadApk tracks progress and returns target file URI');
  } catch (e) {
    console.error('  ❌ downloadApk:', e.message);
  }

  total++;
  try {
    await updaterService.installApk('file:///data/cache/KasirKita-update.apk');
    assert.strictEqual(mockContentUriCalled, 'file:///data/cache/KasirKita-update.apk');
    assert.strictEqual(mockIntentLaunched.action, 'android.intent.action.VIEW');
    assert.strictEqual(mockIntentLaunched.options.type, 'application/vnd.android.package-archive');
    assert.strictEqual(mockIntentLaunched.options.flags, 1);
    passed++;
    console.log('  ✅ installApk creates Content URI and triggers Android IntentLauncher');
  } catch (e) {
    console.error('  ❌ installApk:', e.message);
  }

  console.log(`\n========================================`);
  console.log(`📊 Result: ${passed}/${total} tests passed.`);
  console.log(`========================================\n`);

  if (passed !== total) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAsyncTests();
