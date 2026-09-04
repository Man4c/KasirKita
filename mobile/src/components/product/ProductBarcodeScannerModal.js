import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Zap, ZapOff, Camera, AlertCircle } from 'lucide-react-native';
import { soundService } from '../../services/soundService';

export default function ProductBarcodeScannerModal({
  visible,
  onClose,
  onScanBarcode,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const scanCooldownRef = useRef(false);
  const scanLaserAnim = useRef(new Animated.Value(0)).current;

  // Laser animation loop
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLaserAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLaserAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible, scanLaserAnim]);

  // Activate scanner after 1.2s to prevent misread on open
  useEffect(() => {
    if (visible) {
      scanCooldownRef.current = false;
      const timer = setTimeout(() => {
        setIsScanningActive(true);
      }, 1200);
      return () => clearTimeout(timer);
    } else {
      setIsScanningActive(false);
      setTorch(false);
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data, type }) => {
    if (!isScanningActive || scanCooldownRef.current) return;
    if (!data) return;

    scanCooldownRef.current = true;
    setIsScanningActive(false);

    try {
      soundService?.playBeep && soundService.playBeep();
    } catch (_) {}

    if (onScanBarcode) {
      onScanBarcode(String(data).trim());
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color="#f4f4f5" />
          </TouchableOpacity>

          <Text style={styles.topTitle} numberOfLines={1}>
            Scan Barcode Kemasan
          </Text>

          <TouchableOpacity
            style={[styles.torchBtn, torch && styles.torchBtnActive]}
            onPress={() => setTorch((prev) => !prev)}
          >
            {torch ? (
              <Zap size={18} color="#fbbf24" />
            ) : (
              <ZapOff size={18} color="#a1a1aa" />
            )}
          </TouchableOpacity>
        </View>

        {/* Camera Viewport Area */}
        <View style={styles.viewport}>
          {!permission ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#e11d48" />
              <Text style={styles.hintText}>Memeriksa izin kamera...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.centerBox}>
              <Camera size={48} color="#f87171" />
              <Text style={styles.errorTitle}>Izin Kamera Diperlukan</Text>
              <Text style={styles.errorSubtitle}>
                Aplikasi membutuhkan akses kamera HP untuk memindai barcode produk fisik secara otomatis.
              </Text>
              <TouchableOpacity
                style={styles.permissionBtn}
                onPress={requestPermission}
              >
                <Text style={styles.permissionBtnText}>Berikan Izin Kamera</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{
                  barcodeTypes: [
                    'ean13',
                    'ean8',
                    'upc_a',
                    'upc_e',
                    'code128',
                    'qr',
                    'code39',
                  ],
                }}
                onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
              />

              {/* Viewfinder Target Mask */}
              <View style={[StyleSheet.absoluteFill, styles.overlayMask]}>
                <View style={styles.targetFrame}>
                  {/* 4 Corner Accents */}
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  {/* Animated Laser */}
                  <Animated.View
                    style={[
                      styles.scanLaser,
                      {
                        transform: [
                          {
                            translateY: scanLaserAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 160],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                </View>

                <Text style={styles.scanInstruction}>
                  Arahkan kamera tepat ke garis barcode kemasan
                </Text>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#18181b',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  torchBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#fbbf24',
    borderWidth: 1,
  },
  viewport: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  hintText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  errorTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#f87171',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  permissionBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  overlayMask: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetFrame: {
    width: 260,
    height: 180,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#fb7185',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 10,
  },
  scanLaser: {
    height: 2,
    backgroundColor: '#fb7185',
    shadowColor: '#fb7185',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  scanInstruction: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#ffffff',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
