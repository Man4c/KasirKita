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
import { X, Clock } from 'lucide-react-native';

const DAY_OPTIONS = [
  { days: 7, label: '+7 Hari (1 Minggu)' },
  { days: 14, label: '+14 Hari (2 Minggu)' },
  { days: 30, label: '+30 Hari (1 Bulan)' },
];

export default function ExtendTrialModal({ visible, store, onClose, onConfirm }) {
  const [selectedDays, setSelectedDays] = useState(7);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelectedDays(7);
      setNotes('');
      setLoading(false);
    }
  }, [visible]);

  if (!store) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onConfirm({
        days: selectedDays,
        notes: notes.trim() || `Perpanjangan masa uji coba +${selectedDays} hari oleh Superadmin`,
      });
      onClose();
    } catch (err) {
      Alert.alert('Gagal Perpanjang Trial', err.message || 'Terjadi kesalahan sistem.');
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
              <View style={styles.dragHandleBar} />

              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Clock size={20} color="#fbbf24" />
                  <Text style={styles.headerTitle}>Perpanjang Masa Trial</Text>
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
                <View style={styles.storeBanner}>
                  <Text style={styles.storeBannerName}>{store.name}</Text>
                  <Text style={styles.storeBannerTrial}>
                    Masa trial saat ini: {store.trial_ends_at ? store.trial_ends_at.substring(0, 10) : 'Sudah berakhir'}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>TAMBAH HARI PERCOBAAN</Text>
                <View style={styles.chipGrid}>
                  {DAY_OPTIONS.map((opt) => {
                    const isSelected = selectedDays === opt.days;
                    return (
                      <TouchableOpacity
                        key={opt.days}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setSelectedDays(opt.days)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.sectionLabel}>CATATAN ALASAN PERPANJANGAN</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Contoh: Permintaan tambahan waktu evaluasi fitur kasir"
                  placeholderTextColor="#71717a"
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                />
              </ScrollView>

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
                    <ActivityIndicator color="#18181b" size="small" />
                  ) : (
                    <>
                      <Clock size={16} color="#18181b" />
                      <Text style={styles.submitBtnText}>Perpanjang Sekarang</Text>
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
    maxHeight: '80%',
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
    borderLeftColor: '#fbbf24',
  },
  storeBannerName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  storeBannerTrial: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#fbbf24',
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
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: '#fbbf24',
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
    color: '#fbbf24',
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
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#18181b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
