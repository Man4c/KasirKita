import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import api from './api';
import appConfig from '../../app.json';

export const APP_VERSION = appConfig?.expo?.version || '1.3.0';

let activeDownloadResumable = null;

/**
 * Parse semantic version string to array of integers [major, minor, patch].
 * Strips leading 'v' and handles missing components gracefully.
 *
 * @param {string} versionStr - e.g. "1.4.0", "v1.4.0"
 * @returns {number[]} [major, minor, patch]
 */
export function parseSemver(versionStr) {
  if (!versionStr || typeof versionStr !== 'string') return [0, 0, 0];
  const cleaned = versionStr.trim().replace(/^v/i, '');
  const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

/**
 * Compare two semantic version strings.
 * Returns true if remote is strictly newer than local.
 *
 * @param {string} remote - Remote version string from server
 * @param {string} local - Currently installed local version string
 * @returns {boolean}
 */
export function isNewerVersion(remote, local) {
  const [rMajor, rMinor, rPatch] = parseSemver(remote);
  const [lMajor, lMinor, lPatch] = parseSemver(local);

  if (rMajor > lMajor) return true;
  if (rMajor < lMajor) return false;
  if (rMinor > lMinor) return true;
  if (rMinor < lMinor) return false;
  return rPatch > lPatch;
}

/**
 * Format bytes into human-readable string (KB, MB).
 *
 * @param {number} bytes
 * @returns {string} e.g. "45.2 MB"
 */
export function formatBytes(bytes) {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const updaterService = {
  /**
   * Check if an app update is available from the server.
   * Calls GET /api/app/version with short timeout.
   *
   * @param {Object} options
   * @param {number} [options.timeout=5000] - Request timeout in ms
   * @returns {Promise<Object>}
   */
  async checkForUpdate({ timeout = 5000 } = {}) {
    try {
      const response = await api.get('/app/version', { timeout });
      if (response?.data?.success && response.data.data) {
        const serverData = response.data.data;
        const latestVersion = serverData.latest_version || APP_VERSION;
        const hasUpdate = isNewerVersion(latestVersion, APP_VERSION);

        return {
          hasUpdate,
          currentVersion: APP_VERSION,
          latestVersion,
          latestVersionCode: serverData.latest_version_code || 0,
          minSupportedVersion: serverData.min_supported_version || '1.0.0',
          apkUrl: serverData.apk_url || null,
          apkSizeBytes: serverData.apk_size_bytes || 0,
          changelog: Array.isArray(serverData.changelog) ? serverData.changelog : [],
          releaseDate: serverData.release_date || null,
          isMandatory: Boolean(serverData.is_mandatory),
          serverReachable: true,
        };
      }

      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        serverReachable: true,
        error: 'Format data versi server tidak valid',
      };
    } catch (error) {
      // Non-blocking: Server sleeping, network unreachable, or offline
      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION,
        serverReachable: false,
        error: error?.message || 'Tidak dapat menghubungi server pembaruan',
      };
    }
  },

  /**
   * Download APK file into local device cache directory with progress tracking.
   *
   * @param {string} apkUrl - Direct download link to APK file
   * @param {Object} options
   * @param {Function} [options.onProgress] - Callback ({ totalBytesWritten, totalBytesExpectedToWrite, percent })
   * @returns {Promise<{ uri: string }>}
   */
  async downloadApk(apkUrl, { onProgress } = {}) {
    if (!apkUrl) {
      throw new Error('Tautan unduhan APK tidak valid atau belum tersedia.');
    }

    // Target local path in app cache directory
    const filename = `KasirKita-update-${Date.now()}.apk`;
    const targetFileUri = `${FileSystem.cacheDirectory}${filename}`;

    try {
      // Clean up previous cached APKs to conserve device space
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir) {
        const existingFiles = await FileSystem.readDirectoryAsync(cacheDir).catch(() => []);
        const oldApks = existingFiles.filter((f) => f.startsWith('KasirKita-update-') && f.endsWith('.apk'));
        for (const oldApk of oldApks) {
          await FileSystem.deleteAsync(`${cacheDir}${oldApk}`, { idempotent: true }).catch(() => {});
        }
      }
    } catch {
      // Non-fatal cleanup error
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      targetFileUri,
      {},
      (progressData) => {
        const total = progressData.totalBytesExpectedToWrite;
        const written = progressData.totalBytesWritten;
        const percent = total > 0 ? Math.min(100, Math.round((written / total) * 100)) : 0;

        if (typeof onProgress === 'function') {
          onProgress({
            totalBytesWritten: written,
            totalBytesExpectedToWrite: total,
            percent,
          });
        }
      }
    );

    activeDownloadResumable = downloadResumable;

    try {
      const result = await downloadResumable.downloadAsync();
      activeDownloadResumable = null;

      if (!result || !result.uri) {
        throw new Error('Gagal menyelesaikan pengunduhan berkas pembaruan.');
      }

      return { uri: result.uri };
    } catch (err) {
      activeDownloadResumable = null;
      throw err;
    }
  },

  /**
   * Cancel currently active download resumable.
   */
  async cancelDownload() {
    if (activeDownloadResumable) {
      try {
        await activeDownloadResumable.cancelAsync();
      } catch {
        // Ignore cancellation error
      }
      activeDownloadResumable = null;
    }
  },

  /**
   * Launch native Android package installer for downloaded APK.
   * Uses Android Scoped Storage compliant Content URI.
   *
   * @param {string} localFileUri - Absolute file:// URI in device cache
   */
  async installApk(localFileUri) {
    if (Platform.OS !== 'android') {
      throw new Error('Pemasangan langsung APK hanya didukung pada sistem operasi Android.');
    }

    if (!localFileUri) {
      throw new Error('Berkas instalasi APK tidak ditemukan.');
    }

    // Convert file:// to content:// URI for Android 7.0+ (API 24+) Scoped Storage compliance
    const contentUri = await FileSystem.getContentUriAsync(localFileUri);

    if (!contentUri) {
      throw new Error('Gagal membuat Content URI untuk berkas instalasi.');
    }

    return IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // Intent.FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
  },
};
