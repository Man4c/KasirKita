import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'kasirkita_bearer_token';
const USER_KEY = 'kasirkita_user_profile';
const API_URL_KEY = 'kasirkita_api_base_url';

export const storage = {
  async setToken(token) {
    if (Platform.OS === 'web') {
      localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async getToken() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setUser(user) {
    const json = JSON.stringify(user);
    if (Platform.OS === 'web') {
      localStorage.setItem(USER_KEY, json);
      return;
    }
    await SecureStore.setItemAsync(USER_KEY, json);
  },

  async getUser() {
    let json;
    if (Platform.OS === 'web') {
      json = localStorage.getItem(USER_KEY);
    } else {
      json = await SecureStore.getItemAsync(USER_KEY);
    }
    return json ? JSON.parse(json) : null;
  },

  async setApiUrl(url) {
    if (Platform.OS === 'web') {
      localStorage.setItem(API_URL_KEY, url);
      return;
    }
    await SecureStore.setItemAsync(API_URL_KEY, url);
  },

  async getApiUrl() {
    if (Platform.OS === 'web') {
      return localStorage.getItem(API_URL_KEY);
    }
    return await SecureStore.getItemAsync(API_URL_KEY);
  },

  async getSettings() {
    try {
      let json;
      if (Platform.OS === 'web') {
        json = localStorage.getItem('kasirkita_app_settings');
      } else {
        json = await AsyncStorage.getItem('kasirkita_app_settings');
        // Fallback backward compatibility with old SecureStore settings
        if (!json) {
          json = await SecureStore.getItemAsync('kasirkita_app_settings');
        }
      }
      return json ? JSON.parse(json) : null;
    } catch (e) {
      return null;
    }
  },

  async setSettings(settings) {
    try {
      const json = JSON.stringify(settings);
      if (Platform.OS === 'web') {
        localStorage.setItem('kasirkita_app_settings', json);
        return;
      }
      await AsyncStorage.setItem('kasirkita_app_settings', json);
    } catch (e) {
      console.warn('Gagal menyimpan pengaturan:', e);
    }
  },

  async clearAll() {
    if (Platform.OS === 'web') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  },
};
