import { Platform } from 'react-native';

// Web Audio synthesizer for desktop/web browser
let webAudioCtx = null;

function getWebAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!webAudioCtx) {
    webAudioCtx = new AudioContextClass();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

/**
 * Play a synthesizer tone via Web Audio API
 * @param {number} freq Frequency in Hz
 * @param {number} duration Duration in ms
 * @param {string} type Wave type: 'sine' | 'square' | 'triangle'
 */
function playWebTone(freq = 1900, duration = 120, type = 'sine') {
  try {
    const ctx = getWebAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Smooth envelope attack and release
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (err) {
    console.log('[soundService] Web Audio error:', err);
  }
}

/**
 * Generate a short standard WAV beep sound as a base64 Data URI
 * Frequency: ~1900Hz (standard Honeywell/Datalogic scanner tone)
 */
function generateBeepWavDataUri(freq = 1900, durationMs = 120, sampleRate = 8000) {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2; // 16-bit PCM (2 bytes per sample)
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // fmt sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, 1, true); // NumChannels (Mono)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample (16 bits)

  // data sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Write sine wave samples with fade-out envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const fadeOut = Math.max(0, 1 - (i / numSamples));
    const sample = Math.sin(2 * Math.PI * freq * t) * 0.45 * fadeOut;
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    view.setInt16(44 + i * 2, intSample, true);
  }

  // Convert buffer to base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa !== 'undefined' 
    ? btoa(binary) 
    : Buffer.from(binary, 'binary').toString('base64');

  return `data:audio/wav;base64,${base64}`;
}

// Precomputed data URIs for instant playback
const SUCCESS_BEEP_URI = generateBeepWavDataUri(2000, 100);
const ERROR_BEEP_URI = generateBeepWavDataUri(600, 200);

let nativeSuccessPlayer = null;
let nativeErrorPlayer = null;

class SoundService {
  constructor() {
    this.initialized = false;
  }

  async initNativePlayers() {
    if (this.initialized || Platform.OS === 'web') return;
    try {
      const { createAudioPlayer } = require('expo-audio');
      if (createAudioPlayer) {
        nativeSuccessPlayer = createAudioPlayer(SUCCESS_BEEP_URI);
        nativeErrorPlayer = createAudioPlayer(ERROR_BEEP_URI);
        this.initialized = true;
      }
    } catch (e) {
      console.log('[soundService] Native audio init note:', e.message);
    }
  }

  /**
   * Play standard high-pitched crisp scanner beep (Success)
   */
  async playScanSuccess(enabled = true) {
    if (!enabled) return;

    if (Platform.OS === 'web') {
      playWebTone(2000, 100, 'sine');
      return;
    }

    try {
      if (!this.initialized) {
        await this.initNativePlayers();
      }
      if (nativeSuccessPlayer) {
        nativeSuccessPlayer.seekTo(0);
        nativeSuccessPlayer.play();
      }
    } catch (err) {
      console.log('[soundService] Error playing scan beep:', err);
    }
  }

  /**
   * Play low dual warning beep (Error / Not found / Out of stock)
   */
  async playScanError(enabled = true) {
    if (!enabled) return;

    if (Platform.OS === 'web') {
      playWebTone(600, 180, 'triangle');
      return;
    }

    try {
      if (!this.initialized) {
        await this.initNativePlayers();
      }
      if (nativeErrorPlayer) {
        nativeErrorPlayer.seekTo(0);
        nativeErrorPlayer.play();
      }
    } catch (err) {
      console.log('[soundService] Error playing error beep:', err);
    }
  }
}

export const soundService = new SoundService();