import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  KeyRound,
  ShieldCheck,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Award,
  Clock,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function LicenseActivationModal({ visible, onClose, onSuccess }) {
  const { activateLicense, store, user } = useAuth();

  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const resetForm = () => {
    setLicenseKey('');
    setError('');
    setSuccessResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleKeyChange = (text) => {
    // Keep it uppercase
    setLicenseKey(text.toUpperCase());
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Harap masukkan kode lisensi / serial key.');
      return;
    }

    if (user?.role !== 'owner') {
      setError('Hanya akun Pemilik Toko (Owner) yang berhak mengaktifkan lisensi.');
      return;
    }

    setError('');
    setLoading(true);

    const res = await activateLicense(licenseKey.trim());

    if (!res.success) {
      setError(res.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSuccessResult(res.data);
    if (onSuccess) {
      onSuccess(res.data);
    }
  };

  const getDurationInfo = () => {
    if (!successResult) return { label: 'Seumur Hidup (Lifetime)', isLifetime: true };

    const lic = successResult.license || {};
    const st = successResult.store || {};
    const type = lic.duration_type;
    const days = lic.duration_days;
    const expiresAt = st.subscription_expires_at;

    let dateStr = '';
    if (expiresAt) {
      try {
        const d = new Date(expiresAt);
        dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        dateStr = '';
      }
    }

    if (type === 'lifetime' || !expiresAt) {
      return {
        label: 'Seumur Hidup (Lifetime)',
        detail: 'Permanen',
        isLifetime: true,
      };
    }

    let typeText = 'Kustom';
    if (type === '1_month' || days === 30) typeText = '1 Bulan (30 Hari)';
    else if (type === '6_months' || days === 180) typeText = '6 Bulan (180 Hari)';
    else if (type === '1_year' || days === 365) typeText = '1 Tahun (365 Hari)';
    else if (days) typeText = `${days} Hari`;

    return {
      label: dateStr ? `${typeText} • s/d ${dateStr}` : typeText,
      detail: dateStr ? `s/d ${dateStr}` : typeText,
      isLifetime: false,
    };
  };

  const durationInfo = getDurationInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.sheetContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <KeyRound size={20} color="#fb7185" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>Aktivasi Lisensi PRO</Text>
                <Text style={styles.headerSubtitle}>Masukkan serial key untuk membuka akses kasir penuh</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {successResult ? (
              /* Success State */
              <View style={styles.successState}>
                <View style={styles.successIconBox}>
                  <ShieldCheck size={36} color="#34d399" />
                </View>
                <Text style={styles.successTitle}>Aktivasi Berhasil!</Text>
                <Text style={styles.successDesc}>
                  Selamat, toko <Text style={{ color: '#f4f4f5', fontFamily: 'Poppins_600SemiBold' }}>{successResult.store?.name || store?.name || 'Anda'}</Text> kini telah berstatus PRO AKTIF {durationInfo.isLifetime ? '(Permanen)' : `(${durationInfo.detail})`}. Semua fitur kasir terbuka penuh!
                </Text>

                <View style={styles.successCard}>
                  <View style={styles.successRow}>
                    <Text style={styles.successLabel}>Serial Key Terpasang:</Text>
                    <Text style={styles.successValue}>{successResult.license?.license_key || licenseKey}</Text>
                  </View>
                  <View style={styles.successRow}>
                    <Text style={styles.successLabel}>Masa Berlaku:</Text>
                    <Text style={[styles.successValue, { color: '#34d399' }]}>{durationInfo.label}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.finishBtn}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.finishBtnText}>Tutup & Lanjutkan Kasir</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Form Input State */
              <>
                {/* Error Box */}
                {error ? (
                  <View style={styles.errorBox}>
                    <AlertCircle size={16} color="#fb7185" style={{ marginRight: 8, flexShrink: 0 }} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Current Store Status Banner */}
                <View style={styles.currentStatusBanner}>
                  <View style={styles.statusBannerLeft}>
                    <Clock size={16} color={store?.is_expired ? '#f87171' : '#fbbf24'} />
                    <Text style={styles.statusBannerText}>
                      Status Saat Ini:{' '}
                      <Text
                        style={{
                          color: store?.is_expired ? '#f87171' : store?.is_trial ? '#fbbf24' : '#34d399',
                          fontFamily: 'Poppins_600SemiBold',
                        }}
                      >
                        {store?.is_expired
                          ? 'KEDALUWARSA (Terkunci)'
                          : store?.is_trial
                          ? 'TRIAL (Uji Coba)'
                          : 'AKTIF (PRO)'}
                      </Text>
                    </Text>
                  </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                  <Sparkles size={18} color="#fb7185" style={{ flexShrink: 0, marginTop: 2 }} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.infoTitle}>Dapatkan Kode Aktivasi Resmi</Text>
                    <Text style={styles.infoText}>
                      Kode aktivasi dapat diperoleh langsung saat pembelian aplikasi dari agen/sales KasirKita atau hubungi layanan bantuan resmi.
                    </Text>
                  </View>
                </View>

                {/* Input Field */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Masukkan Kode Serial Lisensi</Text>
                  <View style={styles.inputRow}>
                    <KeyRound size={16} color="#fb7185" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="KK-PRO-XXXX-XXXX"
                      placeholderTextColor="#71717a"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      value={licenseKey}
                      onChangeText={handleKeyChange}
                    />
                  </View>
                  <Text style={styles.hintText}>
                    Format 16 karakter: Contoh `KK-PRO-7K8M-9Q2X` (bisa diketik tanpa tanda strip).
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleClose}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                    onPress={handleActivate}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={styles.submitContent}>
                        <Award size={16} color="#ffffff" />
                        <Text style={styles.submitBtnText}>Aktifkan Lisensi</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '88%',
    display: 'flex',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scrollBody: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#fb7185',
    flex: 1,
    includeFontPadding: false,
  },
  currentStatusBanner: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBannerText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 12,
    padding: 14,
  },
  infoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fb7185',
    marginBottom: 4,
    includeFontPadding: false,
  },
  infoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
    includeFontPadding: false,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#f4f4f5',
    letterSpacing: 1.2,
    minHeight: 44,
  },
  hintText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
    includeFontPadding: false,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  submitBtn: {
    flex: 1.8,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: '#34d399',
    includeFontPadding: false,
  },
  successDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    includeFontPadding: false,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginVertical: 8,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
  },
  successValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#f4f4f5',
    includeFontPadding: false,
  },
  finishBtn: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  finishBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
