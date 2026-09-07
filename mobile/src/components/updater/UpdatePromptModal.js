import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  ArrowUpCircle,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react-native';
import { updaterService, formatBytes } from '../../services/updaterService';

export default function UpdatePromptModal({
  visible,
  updateInfo,
  onClose,
  onInstallStarted,
}) {
  // States: 'PROMPT' | 'DOWNLOADING' | 'READY' | 'ERROR'
  const [downloadState, setDownloadState] = useState('PROMPT');
  const [progress, setProgress] = useState({
    totalBytesWritten: 0,
    totalBytesExpectedToWrite: 0,
    percent: 0,
  });
  const [downloadedUri, setDownloadedUri] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset states whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      setDownloadState('PROMPT');
      setProgress({ totalBytesWritten: 0, totalBytesExpectedToWrite: 0, percent: 0 });
      setDownloadedUri(null);
      setErrorMessage('');
    } else {
      updaterService.cancelDownload();
    }
  }, [visible]);

  if (!visible || !updateInfo) return null;

  const isMandatory = Boolean(updateInfo.isMandatory);
  const changelogs = Array.isArray(updateInfo.changelog) && updateInfo.changelog.length > 0
    ? updateInfo.changelog
    : ['Peningkatan performa dan kestabilan sistem kasir'];

  const handleStartDownload = async () => {
    if (!updateInfo.apkUrl) {
      setErrorMessage('Tautan unduhan APK belum tersedia di server.');
      setDownloadState('ERROR');
      return;
    }

    setDownloadState('DOWNLOADING');
    setProgress({ totalBytesWritten: 0, totalBytesExpectedToWrite: updateInfo.apkSizeBytes || 0, percent: 0 });
    setErrorMessage('');

    try {
      const result = await updaterService.downloadApk(updateInfo.apkUrl, {
        onProgress: (p) => setProgress(p),
      });

      if (result?.uri) {
        setDownloadedUri(result.uri);
        setDownloadState('READY');
        // If mandatory or auto-trigger enabled, we can immediately prompt installer
        handleLaunchInstaller(result.uri);
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Gagal mengunduh berkas pembaruan. Silakan periksa jaringan internet.');
      setDownloadState('ERROR');
    }
  };

  const handleCancelDownload = async () => {
    await updaterService.cancelDownload();
    setDownloadState('PROMPT');
    setProgress({ totalBytesWritten: 0, totalBytesExpectedToWrite: 0, percent: 0 });
  };

  const handleLaunchInstaller = async (uriOverride) => {
    const uriToInstall = uriOverride || downloadedUri;
    if (!uriToInstall) return;

    try {
      if (typeof onInstallStarted === 'function') {
        onInstallStarted();
      }
      await updaterService.installApk(uriToInstall);
    } catch (err) {
      setErrorMessage(err?.message || 'Gagal membuka penginstal aplikasi Android.');
      setDownloadState('ERROR');
    }
  };

  const handleOpenInBrowser = async () => {
    if (updateInfo?.apkUrl) {
      try {
        await Linking.openURL(updateInfo.apkUrl);
      } catch {
        setErrorMessage('Tidak dapat membuka peramban web pada perangkat.');
        setDownloadState('ERROR');
      }
    }
  };

  const handleBackdropPress = () => {
    if (downloadState !== 'DOWNLOADING' && !isMandatory) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (!isMandatory && downloadState !== 'DOWNLOADING') {
          onClose();
        }
      }}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <TouchableOpacity
          style={styles.modalCard}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Modal Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <ArrowUpCircle size={22} color="#fb7185" />
              </View>
              <View style={styles.headerTitles}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Pembaruan KasirKita
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isMandatory ? 'Pembaruan Wajib Tersedia' : 'Versi baru siap dipasang'}
                </Text>
              </View>
            </View>

            {!isMandatory && downloadState !== 'DOWNLOADING' && (
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Tutup dialog pembaruan"
              >
                <X size={20} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>

          {/* Version Comparison Bar */}
          <View style={styles.versionBar}>
            <View style={styles.versionBadgeCurrent}>
              <Text style={styles.versionLabelCurrent}>Versi Saat Ini</Text>
              <Text style={styles.versionTextCurrent}>v{updateInfo.currentVersion}</Text>
            </View>

            <View style={styles.versionArrowContainer}>
              <ArrowRight size={18} color="#71717a" />
            </View>

            <View style={styles.versionBadgeNew}>
              <Text style={styles.versionLabelNew}>Versi Terbaru</Text>
              <Text style={styles.versionTextNew}>v{updateInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Meta Info (Size & Release Date) */}
          <View style={styles.metaRow}>
            {updateInfo.apkSizeBytes > 0 && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  Ukuran: {formatBytes(updateInfo.apkSizeBytes)}
                </Text>
              </View>
            )}
            {updateInfo.releaseDate && (
              <View style={styles.metaChip}>
                <Text style={styles.metaChipText}>
                  Rilis: {updateInfo.releaseDate}
                </Text>
              </View>
            )}
            {isMandatory && (
              <View style={[styles.metaChip, styles.mandatoryChip]}>
                <Text style={styles.mandatoryChipText}>Wajib</Text>
              </View>
            )}
          </View>

          {/* Mandatory Warning Banner */}
          {isMandatory && (
            <View style={styles.mandatoryBanner}>
              <ShieldAlert size={16} color="#fbbf24" style={{ marginRight: 8 }} />
              <Text style={styles.mandatoryBannerText}>
                Pembaruan ini memuat perbaikan penting dan wajib dipasang untuk melanjutkan.
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Changelog Section */}
            <View style={styles.changelogCard}>
              <View style={styles.changelogHeader}>
                <Sparkles size={16} color="#fb7185" style={{ marginRight: 6 }} />
                <Text style={styles.changelogTitle}>Catatan Perubahan</Text>
              </View>
              {changelogs.map((item, index) => (
                <View key={index} style={styles.changelogItem}>
                  <View style={styles.changelogDot} />
                  <Text style={styles.changelogText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* State: DOWNLOADING */}
            {downloadState === 'DOWNLOADING' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Mengunduh pembaruan...</Text>
                  <Text style={styles.progressPercent}>{progress.percent}%</Text>
                </View>

                {/* Progress Bar Track */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(4, Math.min(100, progress.percent))}%` },
                    ]}
                  />
                </View>

                <View style={styles.progressFooter}>
                  <Text style={styles.progressBytes}>
                    {formatBytes(progress.totalBytesWritten)} /{' '}
                    {formatBytes(progress.totalBytesExpectedToWrite || updateInfo.apkSizeBytes)}
                  </Text>
                  <Text style={styles.progressHint}>Supabase Cloud CDN</Text>
                </View>
              </View>
            )}

            {/* State: READY */}
            {downloadState === 'READY' && (
              <View style={styles.readyBanner}>
                <CheckCircle2 size={20} color="#34d399" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.readyTitle}>Unduhan Selesai!</Text>
                  <Text style={styles.readySub}>
                    Ketuk tombol di bawah untuk memasang pembaruan. Data kasir Anda tetap aman.
                  </Text>
                </View>
              </View>
            )}

            {/* State: ERROR */}
            {downloadState === 'ERROR' && (
              <View style={styles.errorBanner}>
                <AlertCircle size={20} color="#f87171" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorTitle}>Gagal Mengunduh</Text>
                  <Text style={styles.errorSub}>{errorMessage}</Text>
                </View>
              </View>
            )}

            {/* Data Safety Reassurance */}
            <View style={styles.safetyBox}>
              <ShieldCheck size={16} color="#34d399" style={{ flexShrink: 0, marginTop: 1, marginRight: 8 }} />
              <Text style={styles.safetyText}>
                <Text style={styles.safetyBold}>Data kasir terjamin aman:</Text> Riwayat nota, pengaturan, dan transaksi offline tidak akan hilang setelah pembaruan.
              </Text>
            </View>
          </ScrollView>

          {/* Sticky Footer Actions */}
          <View style={styles.footerContainer}>
            {downloadState === 'PROMPT' && (
              <View style={styles.footerButtonRow}>
                {!isMandatory && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Nanti Saja</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.primaryBtn, isMandatory && { flex: 1 }]}
                  onPress={handleStartDownload}
                  activeOpacity={0.8}
                >
                  <Download size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.primaryBtnText}>Perbarui Sekarang</Text>
                </TouchableOpacity>
              </View>
            )}

            {downloadState === 'DOWNLOADING' && (
              <TouchableOpacity
                style={styles.cancelDownloadBtn}
                onPress={handleCancelDownload}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelDownloadBtnText}>Batal Unduh</Text>
              </TouchableOpacity>
            )}

            {downloadState === 'READY' && (
              <View style={styles.readyActionColumn}>
                <TouchableOpacity
                  style={styles.installBtn}
                  onPress={() => handleLaunchInstaller()}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.installBtnText}>Pasang Pembaruan Sekarang</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.browserFallbackBtn}
                  onPress={handleOpenInBrowser}
                  activeOpacity={0.8}
                >
                  <ExternalLink size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                  <Text style={styles.browserFallbackBtnText}>Pasang / Unduh Lewat Browser</Text>
                </TouchableOpacity>

                <Text style={styles.fallbackHelpText}>
                  Tips: Jika dialog instalasi tidak muncul otomatis di layar HP, ketuk tombol browser di atas. Data transaksi Anda tetap aman.
                </Text>
              </View>
            )}

            {downloadState === 'ERROR' && (
              <View style={{ width: '100%', gap: 10 }}>
                <View style={styles.footerButtonRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelBtnText}>Tutup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleStartDownload}
                    activeOpacity={0.8}
                  >
                    <RefreshCw size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryBtnText}>Coba Lagi</Text>
                  </TouchableOpacity>
                </View>

                {Boolean(updateInfo?.apkUrl) && (
                  <TouchableOpacity
                    style={styles.browserFallbackBtn}
                    onPress={handleOpenInBrowser}
                    activeOpacity={0.8}
                  >
                    <ExternalLink size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                    <Text style={styles.browserFallbackBtnText}>Unduh Manual via Browser</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#27272a',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    marginHorizontal: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  versionBadgeCurrent: {
    alignItems: 'flex-start',
    flex: 1,
  },
  versionLabelCurrent: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  versionTextCurrent: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  versionArrowContainer: {
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionBadgeNew: {
    alignItems: 'flex-end',
    flex: 1,
  },
  versionLabelNew: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  versionTextNew: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  metaChip: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaChipText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mandatoryChip: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  mandatoryChipText: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#fbbf24',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  mandatoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  mandatoryBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#fbbf24',
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scrollArea: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  changelogCard: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  changelogTitle: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  changelogDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
    marginTop: 6,
    marginRight: 8,
  },
  changelogText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#d4d4d8',
    flex: 1,
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressContainer: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressPercent: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#fb7185',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e11d48',
    borderRadius: 4,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBytes: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  progressHint: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  readyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  readyTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#34d399',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  readySub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#a1a1aa',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#f87171',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  errorSub: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#a1a1aa',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(39, 39, 42, 0.5)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 4,
  },
  safetyText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#a1a1aa',
    lineHeight: 17,
    includeFontPadding: false,
  },
  safetyBold: {
    fontFamily: 'Poppins-Medium',
    color: '#f4f4f5',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  footerButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#27272a',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  primaryBtn: {
    flex: 1.6,
    minHeight: 46,
    backgroundColor: '#e11d48',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cancelDownloadBtn: {
    width: '100%',
    minHeight: 46,
    backgroundColor: '#27272a',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelDownloadBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#f87171',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  installBtn: {
    width: '100%',
    minHeight: 46,
    backgroundColor: '#10b981',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installBtnText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  readyActionColumn: {
    width: '100%',
    gap: 8,
  },
  browserFallbackBtn: {
    width: '100%',
    minHeight: 46,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browserFallbackBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#38bdf8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  fallbackHelpText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#71717a',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 16,
    includeFontPadding: false,
  },
});
