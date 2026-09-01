import axios from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';

// Default host: 10.0.2.2 for Android emulator, localhost for iOS/web
const DEFAULT_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000/api'
  : 'http://localhost:8000/api';

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
    const customUrl = await storage.getApiUrl();
    if (customUrl) {
      config.baseURL = customUrl;
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
