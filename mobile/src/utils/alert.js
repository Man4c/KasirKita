import { Alert, Platform } from 'react-native';

/**
 * Universal alert helper for React Native and Web.
 * On web, Alert.alert can be inconsistent or drop titles depending on runtime.
 */
export const showAlert = (title, message = '') => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) {
      const text = title && message ? `${title}\n\n${message}` : (title || message || '');
      window.alert(text);
      return;
    }
  }
  Alert.alert(title || '', message || '');
};

export default showAlert;
