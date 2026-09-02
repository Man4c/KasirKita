import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

export const orientationService = {
  /**
   * Apply screen orientation preference:
   * - 'AUTO': ScreenOrientation.unlockAsync() (frees orientation to follow device sensor)
   * - 'LANDSCAPE': ScreenOrientation.lockAsync(OrientationLock.LANDSCAPE)
   * - 'PORTRAIT': ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP)
   */
  async applyPreference(pref = 'AUTO') {
    try {
      if (pref === 'LANDSCAPE') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else if (pref === 'PORTRAIT') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        // AUTO - follow gravity sensor
        await ScreenOrientation.unlockAsync();
      }
    } catch (err) {
      // Graceful fallback for web/desktop where screen orientation lock might require fullscreen or is unsupported
      console.warn('Screen orientation lock notice:', err.message);
    }
  },
};
