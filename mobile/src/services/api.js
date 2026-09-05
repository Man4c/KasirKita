import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

// Resolusi Base URL yang adaptif berdasarkan platform dan hostname
export const getDefaultBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000/api`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api';
  }
  return 'http://192.168.1.3:8000/api';
};

const DEFAULT_BASE_URL = getDefaultBaseUrl();

const api = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach Token and Dynamic Base URL
api.interceptors.request.use(
  async (config) => {
    let customUrl = await storage.getApiUrl();

    // Auto-heal untuk platform Web:
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const host = window.location.hostname || 'localhost';
      // Jika diakses dari localhost tetapi customUrl tersimpan IP LAN lain (seperti 192.168.x.x),
      // otomatis arahkan ke localhost agar tidak timeout ke IP yang mati
      if ((host === 'localhost' || host === '127.0.0.1') && customUrl && customUrl.includes('192.168.')) {
        customUrl = `http://${host}:8000/api`;
        await storage.setApiUrl(customUrl);
      }
    }

    if (customUrl) {
      config.baseURL = customUrl;
    } else {
      config.baseURL = getDefaultBaseUrl();
    }

    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 Handler
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await storage.clearAll();
    }
    return Promise.reject(error);
  }
);

export default api;
