import { Alert, Platform } from 'react-native';

/**
 * Universal alert helper for React Native and Web.
 * On web, Alert.alert can be inconsistent or drop titles depending on runtime.
 */
export const showAlert = (title, message = '', buttons) => {
  // If buttons are provided and contain interactive options (like confirm / delete)
  if (Array.isArray(buttons) && buttons.length > 0) {
    if (Platform.OS === 'web') {
      const cancelBtn = buttons.find((b) => b.style === 'cancel');
      const confirmBtn = buttons.find((b) => b.style !== 'cancel') || buttons[0];

      if (buttons.length > 1 && typeof window !== 'undefined' && window.confirm) {
        const text = title && message ? `${title}\n\n${message}` : (title || message || '');
        const ok = window.confirm(text);
        if (ok && confirmBtn && confirmBtn.onPress) {
          confirmBtn.onPress();
        } else if (!ok && cancelBtn && cancelBtn.onPress) {
          cancelBtn.onPress();
        }
        return;
      }
    }

    Alert.alert(title || '', message || '', buttons);
    return;
  }

  // Single OK notification alert
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
