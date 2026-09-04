import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Zap,
  ZapOff,
  Keyboard,
  Check,
  Barcode,
  AlertCircle,
} from 'lucide-react-native';
import { soundService } from '../../services/soundService';
import api from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';

export default function PosBarcodeScannerView({
  isLandscape = false,
  compact = false,
  onScanProduct,
  onClose,
  products = [],
  soundBeep = true,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedFeedback, setScannedFeedback] = useState(null);
  const [isScanningActive, setIsScanningActive] = useState(false);
  const scanCooldownRef = useRef(false);
  const scanLaserAnim = useRef(new Animated.Value(0)).current;
  // Double-confirmation: require same barcode detected 2x consecutively
  const pendingCodeRef = useRef(null);
  const pendingTimerRef = useRef(null);

  // Animate scan laser line up and down continuously
  useEffect(() => {
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
  }, [scanLaserAnim]);

  // Warm-up delay 2s after camera mounts to prevent false triggers from ambient patterns
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsScanningActive(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Auto clear scan feedback after 2.5s
  useEffect(() => {
    if (scannedFeedback) {
      const timer = setTimeout(() => {
        setScannedFeedback(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scannedFeedback]);

  const handleBarcodeScanned = ({ data, type }) => {
    if (!isScanningActive || scanCooldownRef.current || !data) return;

    const cleanCode = String(data).trim();
    // Filter out accidental noise / false positive scans (less than 4 alphanumeric characters)
    if (cleanCode.length < 4) return;

    // Double-confirmation: same barcode must be detected 2x within 1.5s window
    if (pendingCodeRef.current === cleanCode) {
      // Confirmed! Same code detected twice — process it
      clearTimeout(pendingTimerRef.current);
      pendingCodeRef.current = null;
      pendingTimerRef.current = null;

      scanCooldownRef.current = true;
      processBarcode(cleanCode);

      // Debounce scan interval to prevent rapid duplicate triggers
      setTimeout(() => {
        scanCooldownRef.current = false;
      }, 2000);
    } else {
      // First detection — store as pending and wait for confirmation
      pendingCodeRef.current = cleanCode;
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = setTimeout(() => {
        // No second detection within 1.5s — discard (was a fleeting ambient barcode)
        pendingCodeRef.current = null;
      }, 1500);
    }
  };

  const processBarcode = async (rawCode) => {
    const code = rawCode ? String(rawCode).trim() : '';
    if (!code) return;

    const normalizedCode = code.toLowerCase();

    const matchProduct = (p) => {
      if (!p) return false;
      const matchSkuBarcode =
        p.sku_barcode && String(p.sku_barcode).trim().toLowerCase() === normalizedCode;
      const matchSku =
        p.sku && String(p.sku).trim().toLowerCase() === normalizedCode;
      const matchId = String(p.id).trim() === code;
      const matchConversions =
        Array.isArray(p.conversions) &&
        p.conversions.some(
          (c) =>
            c.sku_barcode &&
            String(c.sku_barcode).trim().toLowerCase() === normalizedCode
        );
      return matchSkuBarcode || matchSku || matchId || matchConversions;
    };

    // 1. Search in-memory products passed from PosScreen
    let found = products.find(matchProduct);

    // 2. Offline storage fallback (in case product was added/updated in local cache)
    if (!found) {
      try {
        const cached = await offlineStorage.getCachedCatalog();
        if (cached && Array.isArray(cached.products)) {
          found = cached.products.find(matchProduct);
        }
      } catch (_) {}
    }

    // 3. Online API fallback (in case product was added on web or exceeds initial page)
    if (!found) {
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(code)}&per_page=5`);
        if (res.data?.success && Array.isArray(res.data.data?.data)) {
          const apiProducts = res.data.data.data.map((p) => ({
            ...p,
            unitSymbol: p.base_unit?.symbol || p.baseUnit?.symbol || 'pcs',
          }));
          found = apiProducts.find(matchProduct);
          if (found) {
            // Also cache it locally for future offline scans
            await offlineStorage.upsertCachedProduct(found);
          }
        }
      } catch (_) {}
    }

    if (found) {
      const stockNum = parseFloat(found.stock) || 0;
      if (stockNum <= 0) {
        soundService.playScanError(soundBeep);
        setScannedFeedback({
          success: false,
          code,
          name: found.name,
          message: `Stok produk "${found.name}" habis!`,
        });
      } else {
        soundService.playScanSuccess(soundBeep);
        onScanProduct(found);
        setScannedFeedback({
          success: true,
          code,
          name: found.name,
          price: found.price,
          message: `Ditambahkan: ${found.name}`,
        });
      }
    } else {
      soundService.playScanError(soundBeep);
      setScannedFeedback({
        success: false,
        code,
        message: 'Barcode tidak dikenali',
        subtitle: `Kode ${code} belum terdaftar di katalog produk.`,
      });
    }
  };

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) return;
    processBarcode(trimmed);
    setManualCode('');
    setShowManualInput(false);
  };

  return (
    <View style={[styles.container, isLandscape && styles.containerLandscape]}>
      {/* Top Controls Bar (PORTRAIT ONLY - in Landscape, camera extends fully to top) */}
      {!isLandscape && (
        <View style={[styles.topBar, compact && styles.topBarCompact]}>
          <View style={styles.topBarLeft}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>SCANNER AKTIF</Text>
            </View>
          </View>

          <View style={styles.topBarRight}>
            <TouchableOpacity
              style={[styles.ctrlBtn, torch && styles.ctrlBtnActive]}
              onPress={() => setTorch(!torch)}
              activeOpacity={0.7}
            >
              {torch ? <Zap size={15} color="#fbbf24" /> : <ZapOff size={15} color="#a1a1aa" />}
              <Text style={[styles.ctrlBtnText, torch && { color: '#fbbf24' }]}>
                {torch ? 'Senter Nyala' : 'Senter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctrlBtn, showManualInput && styles.ctrlBtnActive]}
              onPress={() => setShowManualInput(!showManualInput)}
              activeOpacity={0.7}
            >
              <Keyboard size={15} color={showManualInput ? '#fb7185' : '#a1a1aa'} />
              <Text style={[styles.ctrlBtnText, showManualInput && { color: '#fb7185' }]}>
                Ketik barcode manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.okBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Check size={15} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.okBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Manual Barcode Input Row (PORTRAIT ONLY - Landscape uses inline input in bottom bar) */}
      {showManualInput && !isLandscape && (
        <View style={styles.manualInputRow}>
          <Barcode size={16} color="#fb7185" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.manualTextInput}
            placeholder="Ketik kode barcode / SKU..."
            placeholderTextColor="#71717a"
            value={manualCode}
            onChangeText={setManualCode}
            autoFocus={true}
            onSubmitEditing={handleManualSubmit}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.manualSubmitBtn, !manualCode.trim() && { opacity: 0.5 }]}
            onPress={handleManualSubmit}
            disabled={!manualCode.trim()}
          >
            <Text style={styles.manualSubmitBtnText}>Cari</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera Viewport Area */}
      <View style={styles.cameraViewport}>
        {Platform.OS === 'web' ? (
          <View style={styles.centerFeedback}>
            <Barcode size={44} color="#fb7185" style={{ marginBottom: 12 }} />
            <Text style={styles.permissionTitle}>Mode Scanner Barcode</Text>
            <Text style={styles.permissionSub}>
              Pemindaian kamera fisik aktif penuh di perangkat ponsel Android/iOS (Expo Go / APK). Di browser web desktop, Anda dapat menggunakan tombol "Ketik barcode manual" di bawah atau scanner barcode USB / Bluetooth.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={() => setShowManualInput(true)}
            >
              <Text style={styles.permissionBtnText}>Input Kode Barcode</Text>
            </TouchableOpacity>
          </View>
        ) : !permission ? (
          <View style={styles.centerFeedback}>
            <ActivityIndicator size="large" color="#e11d48" />
            <Text style={styles.permissionText}>Menyiapkan kamera...</Text>
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerFeedback}>
            <AlertCircle size={36} color="#fb7185" style={{ marginBottom: 10 }} />
            <Text style={styles.permissionTitle}>Izin Kamera Diperlukan</Text>
            <Text style={styles.permissionSub}>
              Aplikasi membutuhkan izin kamera untuk memindai barcode produk.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={requestPermission}
            >
              <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
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
                ],
              }}
              onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
            />

            {/* Viewfinder Target Overlay Mask (Placed on top of camera with absolute positioning) */}
            <View style={[StyleSheet.absoluteFill, styles.overlayMask]}>
              <View style={styles.targetFrame}>
                {/* 4 Corner Accents */}
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />

                {/* Laser scanline indicator (animated) */}
                <Animated.View
                  style={[
                    styles.scanLaser,
                    {
                      transform: [
                        {
                          translateY: scanLaserAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-70, 70],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              </View>
              <Text style={styles.targetInstruction}>Arahkan barcode produk ke kotak tengah</Text>
            </View>
          </>
        )}

        {/* Realtime Scan Result Toast / Feedback */}
        {scannedFeedback && (
          <View
            style={[
              styles.feedbackBanner,
              isLandscape && styles.feedbackBannerLandscape,
              scannedFeedback.success
                ? styles.feedbackBannerSuccess
                : styles.feedbackBannerError,
            ]}
          >
            {scannedFeedback.success ? (
              <Check size={16} color="#34d399" style={{ marginRight: 8 }} />
            ) : (
              <AlertCircle size={16} color="#fb7185" style={{ marginRight: 8 }} />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={[
                  styles.feedbackTitle,
                  scannedFeedback.success ? { color: '#34d399' } : { color: '#fb7185' },
                ]}
                numberOfLines={1}
              >
                {scannedFeedback.message}
              </Text>
              <Text style={styles.feedbackSub} numberOfLines={1}>
                {scannedFeedback.subtitle || `Kode: ${scannedFeedback.code}`}
              </Text>
            </View>
          </View>
        )}

        {/* Landscape Bottom Center Controls Overlay */}
        {isLandscape && (
          <View style={[styles.landscapeBottomBar, compact && styles.landscapeBottomBarCompact]}>
            {showManualInput ? (
              /* Inline Manual Barcode Input Mode */
              <>
                <View style={styles.bottomInlineInput}>
                  <Barcode size={14} color="#fb7185" style={{ marginRight: 6 }} />
                  <TextInput
                    style={styles.bottomInlineTextInput}
                    placeholder="Ketik kode barcode / SKU..."
                    placeholderTextColor="#71717a"
                    value={manualCode}
                    onChangeText={setManualCode}
                    autoFocus={true}
                    onSubmitEditing={handleManualSubmit}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[styles.bottomInlineSubmitBtn, !manualCode.trim() && { opacity: 0.5 }]}
                    onPress={handleManualSubmit}
                    disabled={!manualCode.trim()}
                  >
                    <Text style={styles.bottomInlineSubmitText}>Cari</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.bottomCtrlBtn}
                  onPress={() => { setShowManualInput(false); setManualCode(''); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.bottomCtrlBtnText}>✕</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Normal Controls Mode */
              <>
                {/* Torch / Flash Toggle */}
                <TouchableOpacity
                  style={[styles.bottomCtrlBtn, torch && styles.bottomCtrlBtnActive]}
                  onPress={() => setTorch(!torch)}
                  activeOpacity={0.7}
                >
                  {torch ? <Zap size={14} color="#fbbf24" /> : <ZapOff size={14} color="#a1a1aa" />}
                  <Text style={[styles.bottomCtrlBtnText, torch && { color: '#fbbf24' }]}>
                    {torch ? 'Senter Nyala' : 'Senter'}
                  </Text>
                </TouchableOpacity>

                {/* Manual Barcode Input Trigger */}
                <TouchableOpacity
                  style={styles.bottomCtrlBtn}
                  onPress={() => setShowManualInput(true)}
                  activeOpacity={0.7}
                >
                  <Keyboard size={14} color="#a1a1aa" />
                  <Text style={styles.bottomCtrlBtnText}>
                    Ketik barcode manual
                  </Text>
                </TouchableOpacity>

                {/* Selesai / OK Button */}
                <TouchableOpacity
                  style={styles.bottomOkBtn}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Check size={14} color="#ffffff" style={{ marginRight: 4 }} />
                  <Text style={styles.bottomOkBtnText}>OK</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  containerLandscape: {
    flex: 1.25,
    borderRightWidth: 1,
    borderRightColor: '#27272a',
  },
  topBar: {
    height: 48,
    maxHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  topBarCompact: {
    height: 40,
    maxHeight: 40,
    paddingHorizontal: 8,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    gap: 5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
  },
  liveText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    gap: 4,
  },
  ctrlBtnActive: {
    backgroundColor: '#26141a',
    borderColor: '#e11d48',
  },
  ctrlBtnText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  okBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  okBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  manualTextInput: {
    flex: 1,
    backgroundColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginRight: 8,
  },
  manualSubmitBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualSubmitBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cameraViewport: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  centerFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#09090b',
  },
  permissionTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 4,
  },
  permissionSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    maxWidth: 260,
    marginBottom: 16,
  },
  permissionText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  permissionBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  overlayMask: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  targetFrame: {
    width: 220,
    height: 160,
    borderRadius: 12,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#e11d48',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  scanLaser: {
    width: '90%',
    height: 2,
    backgroundColor: '#fb7185',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  targetInstruction: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 16,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  feedbackBanner: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 10,
  },
  feedbackBannerSuccess: {
    backgroundColor: 'rgba(6, 78, 59, 0.95)',
    borderColor: '#059669',
  },
  feedbackBannerError: {
    backgroundColor: 'rgba(76, 5, 25, 0.95)',
    borderColor: '#e11d48',
  },
  feedbackBannerLandscape: {
    bottom: 58,
  },
  landscapeBottomBar: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  landscapeBottomBarCompact: {
    bottom: 8,
    gap: 6,
  },
  bottomCtrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.8)',
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomCtrlBtnActive: {
    backgroundColor: 'rgba(38, 20, 26, 0.95)',
    borderColor: '#e11d48',
  },
  bottomCtrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  bottomOkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomOkBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  bottomInlineInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(63, 63, 70, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomInlineTextInput: {
    flex: 1,
    height: 28,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 6,
    paddingVertical: 0,
  },
  bottomInlineSubmitBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    height: 28,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomInlineSubmitText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  feedbackTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  feedbackSub: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
});
