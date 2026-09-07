import axios from 'axios';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

export const getHostIp = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || 'localhost';
  }

  // 1. Coba ambil dari NativeModules.SourceCode.scriptURL (paling akurat saat dev build / Metro di HP fisik)
  const scriptURL = NativeModules.SourceCode?.scriptURL;
  if (scriptURL) {
    const match = scriptURL.match(/:\/\/([^:/]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // 2. Coba dari Expo Constants
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return ip;
    }
  }

  // 3. Default fallback ke IP LAN laptop
  return '192.168.1.3';
};

// URL Production Server Render KasirKita
export const PRODUCTION_API_URL = 'https://kasirkita.onrender.com/api';

// Resolusi Base URL yang adaptif berdasarkan platform dan hostname
export const getDefaultBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    if (host === 'localhost' || host === '127.0.0.1') {
      return `http://${host}:8000/api`;
    }
    return PRODUCTION_API_URL;
  }

  // Jika aplikasi berjalan di mode Standalone Production (hasil EAS Build APK)
  if (!__DEV__) {
    return PRODUCTION_API_URL;
  }

  const host = getHostIp();

  // Jika di Android Studio Emulator (host terdeteksi localhost / 10.0.2.2)
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return 'http://10.0.2.2:8000/api';
  }

  // Untuk HP fisik Android atau iOS di jaringan Wi-Fi saat development
  return `http://${host}:8000/api`;
};

const DEFAULT_BASE_URL = getDefaultBaseUrl();

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 60000,
});

// Request Interceptor: Attach Token and Dynamic Base URL
api.interceptors.request.use(
  async (config) => {
    let customUrl = await storage.getApiUrl();
    const defaultUrl = getDefaultBaseUrl();

    // Auto-heal untuk platform Web:
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      if ((host === 'localhost' || host === '127.0.0.1') && customUrl && customUrl.includes('192.168.')) {
        customUrl = `http://${host}:8000/api`;
        await storage.setApiUrl(customUrl);
      }
    } else {
      // Auto-heal untuk platform Mobile (HP Fisik):
      const host = getHostIp();
      if (customUrl) {
        const isEmulatorUrl = customUrl.includes('10.0.2.2');
        const isMismatchedLan = customUrl.includes('192.168.') && !customUrl.includes(host);
        if (isEmulatorUrl && host !== 'localhost' && host !== '127.0.0.1' && host !== '10.0.2.2') {
          customUrl = defaultUrl;
          await storage.setApiUrl(customUrl);
        } else if (isMismatchedLan) {
          customUrl = defaultUrl;
          await storage.setApiUrl(customUrl);
        }
      }
    }

    if (customUrl) {
      config.baseURL = customUrl;
    } else {
      config.baseURL = defaultUrl;
    }

    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let onUnauthorizedHandler = null;

export const setOnUnauthorizedHandler = (handler) => {
  onUnauthorizedHandler = handler;
};

// Response Interceptor: 401 & Friendly Timeout/Network Error Handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await storage.clearAll();
      if (typeof onUnauthorizedHandler === 'function') {
        onUnauthorizedHandler();
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      error.message = 'Koneksi membutuhkan waktu lebih lama (server sedang bangun). Silakan ketuk tombol lagi.';
    } else if (error.message === 'Network Error') {
      error.message = 'Gagal terhubung ke server cloud. Pastikan internet aktif atau coba beberapa detik lagi.';
    }
    return Promise.reject(error);
  }
);

export default api;
