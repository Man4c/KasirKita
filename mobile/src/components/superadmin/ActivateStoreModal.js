import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { X, CheckCircle2, ShieldAlert } from 'lucide-react-native';

const DURATION_OPTIONS = [
  { key: '1_year', label: '1 Tahun (Rekomendasi)' },
  { key: '6_months', label: '6 Bulan' },
  { key: '1_month', label: '1 Bulan' },
  { key: 'lifetime', label: 'Seumur Hidup (Permanen)' },
];

export default function ActivateStoreModal({ visible, store, onClose, onConfirm }) {
  const [durationType, setDurationType] = useState('1_year');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setDurationType('1_year');
      setPaymentNotes('');
      setLoading(false);
    }
  }, [visible]);

  if (!store) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm({
        duration_type: durationType,
        payment_notes: paymentNotes.trim() || 'Aktivasi langsung oleh Superadmin',
      });
      onClose();
    } catch (err) {
      Alert.alert('Gagal Aktivasi', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              {/* Drag Handle */}
              <View style={styles.dragHandleBar} />

              {/* Modal Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <Text style={styles.headerTitle}>Aktivasi Langsung Toko</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={20} color="#a1a1aa" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.contentScroll}
                contentContainerStyle={styles.contentContainer}
                keyboardShouldPersistTaps="handled"
              >
                {/* Store Info Banner */}
                <View style={styles.storeBanner}>
                  <Text style={styles.storeBannerName}>{store.name}</Text>
                  <Text style={styles.storeBannerOwner}>
                    Pemilik: {store.owner?.name || 'Belum ada'} ({store.phone || store.owner?.phone || '-'})
                  </Text>
                </View>

                {/* Duration Presets */}
                <Text style={styles.sectionLabel}>PILIH DURASI AKTIVASI</Text>
                <View style={styles.chipGrid}>
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = durationType === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setDurationType(opt.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Payment Notes Input */}
                <Text style={styles.sectionLabel}>CATATAN PEMBAYARAN TUNAI / AUDIT</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Pembayaran tunai Rp 1.500.000 lunas di tempat"
                  placeholderTextColor="#71717a"
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  multiline
                  numberOfLines={2}
                />

                <View style={styles.infoBox}>
                  <ShieldAlert size={16} color="#fbbf24" style={styles.infoBoxIcon} />
                  <Text style={styles.infoBoxText}>
                    Toko mitra akan langsung aktif berstatus PRO seketika tanpa memerlukan kode voucher di HP pembeli.
                  </Text>
                </View>
              </ScrollView>

              {/* Sticky Footer Action Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <CheckCircle2 size={16} color="#ffffff" />
                      <Text style={styles.submitBtnText}>Aktifkan Sekarang</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '85%',
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentScroll: {
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingVertical: 14,
  },
  storeBanner: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  storeBannerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  storeBannerOwner: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#d4d4d8',
    letterSpacing: 0.5,
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipGrid: {
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#27272a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    minHeight: 44,
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipTextSelected: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#34d399',
  },
  textInput: {
    backgroundColor: '#27272a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 14,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  infoBoxIcon: {
    marginRight: 8,
    marginTop: 2,
    flexShrink: 0,
  },
  infoBoxText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 18,
    includeFontPadding: false,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  submitBtn: {
    flex: 1.5,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
