import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Download,
  Upload,
  Database,
  CheckCircle2,
  Package,
  FolderTree,
  Users,
  Building2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  Copy,
} from 'lucide-react-native';

export default function BackupRestoreModal({
  visible,
  onClose,
  mode = 'inspect_backup', // 'offline_warning' | 'inspect_backup'
  pendingCount = 0,
  isSyncing = false,
  onSyncNow,
  onBackupFirst,
  onProceedAnyway,
  inspectedData = null,
  isRestoring = false,
  onConfirmRestore,
}) {
  const [selectedScenario, setSelectedScenario] = useState('full'); // 'full' (ganti HP) | 'catalog_only' (tambah HP)

  if (!visible) return null;

  const isWarningMode = mode === 'offline_warning';
  const summary = inspectedData?.summary || {};
  const hasOfflineQueueInFile = Boolean(summary.hasOfflineQueue && summary.queueCount > 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.headerIconBox,
                  isWarningMode
                    ? styles.iconBoxWarning
                    : styles.iconBoxInspect,
                ]}
              >
                {isWarningMode ? (
                  <AlertTriangle size={20} color="#f59e0b" />
                ) : (
                  <Database size={20} color="#fb7185" />
                )}
              </View>
              <View style={styles.headerTitles}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isWarningMode
                    ? 'Ada Nota Belum Terkirim!'
                    : 'Pratinjau Cadangan Data'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isWarningMode
                    ? `${pendingCount} transaksi kasir tersimpan lokal di HP ini`
                    : (inspectedData?.filename || 'berkas_cadangan.json')}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          {/* Body Content */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {isWarningMode ? (
              /* --- 1. Mode Peringatan Antrean Offline (Frictionless UX) --- */
              <View>
                <View style={styles.warningNoticeBox}>
                  <Text style={styles.warningNoticeTitle}>
                    Peringatan Perlindungan Transaksi
                  </Text>
                  <Text style={styles.warningNoticeDesc}>
                    HP ini masih menyimpan{' '}
                    <Text style={{ fontWeight: '700', color: '#f59e0b' }}>
                      {pendingCount} nota kasir offline
                    </Text>{' '}
                    yang belum terunggah ke server cloud. Mengimpor data baru
                    sekarang berisiko membuat transaksi belum sinkron tertimpa
                    atau terpisah.
                  </Text>
                </View>

                <Text style={styles.actionSectionTitle}>
                  PILIH TINDAKAN PENGAMANAN:
                </Text>

                {/* Opsi 1: Sinkronkan Sekarang */}
                <TouchableOpacity
                  style={[styles.actionCard, styles.actionCardPrimary]}
                  activeOpacity={0.8}
                  onPress={onSyncNow}
                  disabled={isSyncing}
                >
                  <View style={styles.actionCardIconBox}>
                    {isSyncing ? (
                      <ActivityIndicator size="small" color="#34d399" />
                    ) : (
                      <RefreshCw size={20} color="#34d399" />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.actionCardTitle}>
                      {isSyncing ? 'Sedang Mengunggah...' : 'Sinkronkan Sekarang (Disarankan)'}
                    </Text>
                    <Text style={styles.actionCardDesc}>
                      Unggah {pendingCount} nota ke server cloud saat ini juga, lalu lanjutkan pemulihan berkas.
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#34d399" style={{ flexShrink: 0 }} />
                </TouchableOpacity>

                {/* Opsi 2: Cadangkan Dulu */}
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={onBackupFirst}
                >
                  <View style={styles.actionCardIconBox}>
                    <Download size={20} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.actionCardTitle}>Cadangkan Data HP Ini Dulu</Text>
                    <Text style={styles.actionCardDesc}>
                      Buat berkas cadangan kondisi saat ini (termasuk {pendingCount} nota offline) sebagai jaring pengaman ekstra.
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
                </TouchableOpacity>

                {/* Opsi 3: Tetap Lanjutkan Tanpa Sinkron */}
                <TouchableOpacity
                  style={styles.actionCard}
                  activeOpacity={0.8}
                  onPress={onProceedAnyway}
                >
                  <View style={styles.actionCardIconBox}>
                    <Upload size={20} color="#a1a1aa" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.actionCardTitle}>Tetap Buka Berkas Cadangan</Text>
                    <Text style={styles.actionCardDesc}>
                      Lanjutkan proses pemilihan berkas cadangan tanpa menyinkronkan nota offline sekarang.
                    </Text>
                  </View>
                  <ArrowRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
                </TouchableOpacity>
              </View>
            ) : (
              /* --- 2. Mode Inspeksi Berkas & Skenario Pemulihan --- */
              <View>
                {/* Ringkasan Meta Berkas */}
                <View style={styles.metaBadgeStrip}>
                  <View style={styles.metaPill}>
                    <ShieldCheck size={14} color="#34d399" />
                    <Text style={styles.metaPillText}>
                      Skema v{inspectedData?.schemaVersion || 2}
                    </Text>
                  </View>
                  <View style={styles.metaPill}>
                    <Text style={styles.metaPillText}>
                      KasirKita v{inspectedData?.appVersion || '1.3.0'}
                    </Text>
                  </View>
                  {inspectedData?.storeName ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText} numberOfLines={1}>
                        {inspectedData.storeName}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Store Mismatch Warning Banner */}
                {inspectedData?.isStoreMismatch && (
                  <View style={styles.storeMismatchBox}>
                    <AlertCircle size={18} color="#fb7185" style={{ marginRight: 8, flexShrink: 0 }} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.storeMismatchTitle}>Peringatan: Berkas Milik Toko Lain</Text>
                      <Text style={styles.storeMismatchText}>
                        Berkas ini tercatat milik "{inspectedData?.storeName || 'Toko Lain'}" dan berbeda dengan toko yang sedang aktif. Pemulihan lintas toko ditolak demi keamanan.
                      </Text>
                    </View>
                  </View>
                )}

                {/* Data Grid Ringkasan */}
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Package size={16} color="#fb7185" />
                    <Text style={styles.statValue}>{summary.productsCount || 0}</Text>
                    <Text style={styles.statLabel}>Produk</Text>
                  </View>
                  <View style={styles.statBox}>
                    <FolderTree size={16} color="#38bdf8" />
                    <Text style={styles.statValue}>{summary.categoriesCount || 0}</Text>
                    <Text style={styles.statLabel}>Kategori</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Users size={16} color="#34d399" />
                    <Text style={styles.statValue}>{summary.customersCount || 0}</Text>
                    <Text style={styles.statLabel}>Pelanggan</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Building2 size={16} color="#f59e0b" />
                    <Text style={styles.statValue}>{summary.suppliersCount || 0}</Text>
                    <Text style={styles.statLabel}>Pemasok</Text>
                  </View>
                </View>

                {/* Skenario Khusus jika Berkas Mengandung Antrean Offline */}
                {hasOfflineQueueInFile ? (
                  <View style={styles.scenarioContainer}>
                    <View style={styles.queueAlertBox}>
                      <Layers size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                      <Text style={styles.queueAlertText}>
                        Berkas ini memuat{' '}
                        <Text style={{ fontWeight: '700', color: '#f59e0b' }}>
                          {summary.queueCount} nota kasir offline
                        </Text>{' '}
                        dari HP pembuat cadangan.
                      </Text>
                    </View>

                    <Text style={styles.actionSectionTitle}>
                      PILIH TUJUAN PEMULIHAN INI:
                    </Text>

                    {/* Skenario A: Ganti HP */}
                    <TouchableOpacity
                      style={[
                        styles.scenarioCard,
                        selectedScenario === 'full' && styles.scenarioCardActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedScenario('full')}
                    >
                      <View style={styles.scenarioRadioCircle}>
                        {selectedScenario === 'full' && (
                          <View style={styles.scenarioRadioInner} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Smartphone size={16} color="#fb7185" />
                          <Text style={styles.scenarioTitle}>
                            Ganti HP Kasir (Impor Lengkap)
                          </Text>
                        </View>
                        <Text style={styles.scenarioDesc}>
                          Pulihkan seluruh katalog BESERTA {summary.queueCount} nota offline ke HP ini. Pilih ini jika HP lama sudah tidak digunakan lagi / rusak.
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Skenario B: Tambah HP Baru */}
                    <TouchableOpacity
                      style={[
                        styles.scenarioCard,
                        selectedScenario === 'catalog_only' && styles.scenarioCardActive,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedScenario('catalog_only')}
                    >
                      <View style={styles.scenarioRadioCircle}>
                        {selectedScenario === 'catalog_only' && (
                          <View style={styles.scenarioRadioInner} />
                        )}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Copy size={16} color="#38bdf8" />
                          <Text style={styles.scenarioTitle}>
                            Tambah HP Baru (Hanya Master Data)
                          </Text>
                        </View>
                        <Text style={styles.scenarioDesc}>
                          Hanya pulihkan katalog produk, harga, & pengaturan. Abaikan {summary.queueCount} nota offline HP lama agar tidak terjadi duplikasi nota.
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cleanBackupNotice}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <Text style={styles.cleanBackupNoticeText}>
                      Berkas bersih tanpa nota gantung. Seluruh produk, harga, dan preferensi toko siap diselaraskan.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Sticky Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.7}
              onPress={onClose}
              disabled={isRestoring}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            {!isWarningMode && (
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  (isRestoring || inspectedData?.isStoreMismatch) && styles.confirmBtnDisabled,
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  onConfirmRestore({
                    includeOfflineQueue: hasOfflineQueueInFile && selectedScenario === 'full',
                  })
                }
                disabled={isRestoring || inspectedData?.isStoreMismatch}
              >
                {isRestoring ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Database size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmBtnText}>
                      {hasOfflineQueueInFile && selectedScenario === 'full'
                        ? 'Pulihkan Lengkap'
                        : 'Pulihkan Data'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#27272a',
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconBoxWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  iconBoxInspect: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  headerTitles: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    flexShrink: 0,
  },
  scrollBody: {
    maxHeight: 460,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  warningNoticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  warningNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  warningNoticeDesc: {
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
    includeFontPadding: false,
  },
  actionSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    minHeight: 64,
    borderWidth: 1,
    borderColor: '#3f3f46',
    gap: 12,
  },
  actionCardPrimary: {
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  actionCardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionCardDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
    lineHeight: 16,
    includeFontPadding: false,
  },
  metaBadgeStrip: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  metaPillText: {
    fontSize: 12,
    color: '#d4d4d8',
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  storeMismatchBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  storeMismatchTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fb7185',
    marginBottom: 2,
    includeFontPadding: false,
  },
  storeMismatchText: {
    fontSize: 12,
    color: '#e4e4e7',
    lineHeight: 18,
    includeFontPadding: false,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f4f4f5',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scenarioContainer: {
    marginTop: 4,
  },
  queueAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: 12,
  },
  queueAlertText: {
    fontSize: 12,
    color: '#fbbf24',
    flex: 1,
    includeFontPadding: false,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    gap: 12,
  },
  scenarioCardActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
    borderColor: '#e11d48',
  },
  scenarioRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#a1a1aa',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  scenarioRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e11d48',
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  scenarioDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 4,
    lineHeight: 16,
    includeFontPadding: false,
  },
  cleanBackupNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  cleanBackupNoticeText: {
    fontSize: 12,
    color: '#6ee7b7',
    flex: 1,
    includeFontPadding: false,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: '#27272a',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  confirmBtn: {
    flex: 1.6,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
