import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import appConfig from '../../app.json';

const INSTALLATION_KEY = 'kasirkita_device_installation_id';
const LAST_PING_KEY = 'kasirkita_last_telemetry_ping_ms';
const LAST_PING_VER_KEY = 'kasirkita_last_telemetry_ping_version';

// 3 Hours ping throttle to save network data & mobile battery
const THROTTLE_WINDOW_MS = 3 * 60 * 60 * 1000;

export const APP_VERSION = appConfig?.expo?.version || '1.3.1';
export const APP_VERSION_CODE = appConfig?.expo?.android?.versionCode || 5;

/**
 * Generate a random UUID v4 with 'inst_' prefix.
 * Compliant with RFC4122 v4 format without requiring heavy external dependencies.
 */
export function generateInstallationId() {
  const template = 'inst_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return template.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Retrieve or create a persistent anonymous Installation ID.
 * Stored securely across app updates via SecureStore (Native) or localStorage (Web).
 */
export async function getOrCreateInstallationId() {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') {
        let existingId = localStorage.getItem(INSTALLATION_KEY);
        if (!existingId) {
          existingId = generateInstallationId();
          localStorage.setItem(INSTALLATION_KEY, existingId);
        }
        return existingId;
      }
      return generateInstallationId();
    }

    // Native Mobile (Android & iOS)
    let id = await SecureStore.getItemAsync(INSTALLATION_KEY);
    if (!id) {
      // Check secondary AsyncStorage fallback
      id = await AsyncStorage.getItem(INSTALLATION_KEY);
    }

    if (!id) {
      id = generateInstallationId();
      await SecureStore.setItemAsync(INSTALLATION_KEY, id).catch(() => {});
      await AsyncStorage.setItem(INSTALLATION_KEY, id).catch(() => {});
    }

    return id;
  } catch (err) {
    if (__DEV__) {
      console.warn('[Telemetry] Error accessing secure store for installation ID:', err);
    }
    return generateInstallationId();
  }
}

/**
 * Extract safe hardware and OS metadata from React Native runtime.
 */
export function getDeviceMetadata() {
  const osName = Platform.OS === 'android' ? 'Android' : Platform.OS === 'ios' ? 'iOS' : 'Web';
  let deviceModel = 'Web Browser';
  let brand = 'Web';
  let osVersion = String(Platform.Version || 'Unknown');

  if (Platform.OS === 'android' && Platform.constants) {
    const constants = Platform.constants;
    deviceModel = constants.Model || 'Android Device';
    brand = constants.Brand || constants.Manufacturer || 'Android';
    osVersion = constants.Release ? `Android ${constants.Release}` : `API ${Platform.Version}`;
  } else if (Platform.OS === 'ios') {
    deviceModel = Platform.isPad ? 'iPad' : 'iPhone';
    brand = 'Apple';
    osVersion = `iOS ${Platform.Version}`;
  }

  return {
    device_model: deviceModel,
    brand: brand,
    os_name: osName,
    os_version: osVersion,
    app_version: APP_VERSION,
    app_version_code: APP_VERSION_CODE,
  };
}

export const telemetryService = {
  /**
   * Send heartbeat / installation activation ping to backend.
   *
   * @param {Object} options
   * @param {boolean} [options.force=false] - Ignore throttling window
   * @param {number} [options.timeout=4000] - Network timeout in milliseconds
   * @returns {Promise<{ success: boolean, isNew?: boolean, error?: string }>}
   */
  async recordDevicePing({ force = false, timeout = 4000 } = {}) {
    try {
      const now = Date.now();

      // Check throttling unless forced
      if (!force) {
        let lastPingMs = 0;
        let lastPingVer = '';

        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          lastPingMs = parseInt(localStorage.getItem(LAST_PING_KEY) || '0', 10);
          lastPingVer = localStorage.getItem(LAST_PING_VER_KEY) || '';
        } else {
          const storedMs = await AsyncStorage.getItem(LAST_PING_KEY).catch(() => '0');
          lastPingMs = parseInt(storedMs || '0', 10);
          lastPingVer = (await AsyncStorage.getItem(LAST_PING_VER_KEY).catch(() => '')) || '';
        }

        // If pinged recently on the same app version, skip to save device resources
        if (now - lastPingMs < THROTTLE_WINDOW_MS && lastPingVer === APP_VERSION) {
          return { success: true, throttled: true };
        }
      }

      const installationId = await getOrCreateInstallationId();
      const metadata = getDeviceMetadata();

      const payload = {
        installation_id: installationId,
        device_model: metadata.device_model,
        brand: metadata.brand,
        os_name: metadata.os_name,
        os_version: metadata.os_version,
        app_version: metadata.app_version,
        app_version_code: metadata.app_version_code,
        metadata: {
          timestamp_ms: now,
          platform_select: Platform.select({ android: 'android', ios: 'ios', default: 'web' }),
        },
      };

      const response = await api.post('/app/device-ping', payload, {
        timeout,
      });

      // Save successful ping timestamp
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem(LAST_PING_KEY, String(now));
        localStorage.setItem(LAST_PING_VER_KEY, APP_VERSION);
      } else {
        await AsyncStorage.setItem(LAST_PING_KEY, String(now)).catch(() => {});
        await AsyncStorage.setItem(LAST_PING_VER_KEY, APP_VERSION).catch(() => {});
      }

      const isNew = Boolean(response?.data?.data?.is_new);
      if (__DEV__) {
        console.log(`[Telemetry] Ping sent successfully. Is new install: ${isNew}`);
      }

      return {
        success: true,
        isNew,
        installationId,
      };
    } catch (err) {
      // Non-blocking: Fail completely silently so it never interrupts the cashier
      if (__DEV__) {
        console.warn('[Telemetry] Ping failed (non-blocking):', err?.message);
      }
      return {
        success: false,
        error: err?.message || 'Network unreachable',
      };
    }
  },
};

export default telemetryService;
