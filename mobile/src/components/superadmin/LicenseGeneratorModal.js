import React, { useState } from 'react';
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
  Share,
  Alert,
} from 'react-native';
import { X, Ticket, Copy, Check, Sparkles } from 'lucide-react-native';

const DURATION_OPTIONS = [
  { key: '1_year', label: '1 Tahun' },
  { key: '6_months', label: '6 Bulan' },
  { key: '1_month', label: '1 Bulan' },
  { key: 'lifetime', label: 'Seumur Hidup' },
];

const COUNT_OPTIONS = [1, 5, 10, 20];

export default function LicenseGeneratorModal({ visible, onClose, onGenerate }) {
  const [durationType, setDurationType] = useState('1_year');
  const [count, setCount] = useState(5);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKeys, setGeneratedKeys] = useState([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const resetForm = () => {
    setDurationType('1_year');
    setCount(5);
    setNotes('');
    setLoading(false);
    setGeneratedKeys([]);
    setCopiedAll(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await onGenerate({
        duration_type: durationType,
        count: parseInt(count, 10),
        notes: notes.trim() || 'Batch cetak voucher mobile Superadmin',
      });
      if (res?.data?.license_keys) {
        setGeneratedKeys(res.data.license_keys);
      } else {
        handleClose();
      }
    } catch (err) {
      Alert.alert('Gagal Mencetak', err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = async () => {
    if (!generatedKeys.length) return;
    const textAll = generatedKeys.map((k) => k.license_key || k).join('\n');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(textAll).catch(() => {});
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
      return;
    }

    try {
      await Share.share({
        message: `Daftar Voucher Lisensi KasirKita POS:\n\n${textAll}`,
        title: 'Batch Voucher KasirKita POS',
      });
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetContainer}
            >
              <View style={styles.dragHandleBar} />

              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Sparkles size={20} color="#fbbf24" />
                  <Text style={styles.headerTitle}>
                    {generatedKeys.length ? 'Voucher Berhasil Dicetak!' : 'Cetak Voucher Lisensi Baru'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleClose}
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
                {generatedKeys.length > 0 ? (
                  /* Result View */
                  <View style={styles.resultContainer}>
                    <Text style={styles.resultHint}>
                      Sebanyak {generatedKeys.length} voucher serial key telah aktif dan siap dibagikan ke pemilik toko:
                    </Text>

                    <View style={styles.keysList}>
                      {generatedKeys.map((item, idx) => {
                        const code = item.license_key || item;
                        return (
                          <View key={idx} style={styles.keyRow}>
                            <Ticket size={14} color="#fbbf24" style={styles.keyIcon} />
                            <Text style={styles.codeText}>{code}</Text>
                          </View>
                        );
                      })}
                    </View>

                    <TouchableOpacity
                      style={[styles.copyAllBtn, copiedAll && styles.copyAllBtnSuccess]}
                      onPress={handleCopyAll}
                      activeOpacity={0.8}
                    >
                      {copiedAll ? (
                        <>
                          <Check size={16} color="#34d399" />
                          <Text style={[styles.copyAllBtnText, { color: '#34d399' }]}>Semua Kode Tersalin!</Text>
                        </>
                      ) : (
                        <>
                          <Copy size={16} color="#fbbf24" />
                          <Text style={styles.copyAllBtnText}>Salin & Bagikan Semua Kode</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Input Form View */
                  <>
                    <Text style={styles.sectionLabel}>PILIH PAKET DURASI</Text>
                    <View style={styles.chipRow}>
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

                    <Text style={styles.sectionLabel}>JUMLAH VOUCHER</Text>
                    <View style={styles.chipRow}>
                      {COUNT_OPTIONS.map((num) => {
                        const isSelected = count === num;
                        return (
                          <TouchableOpacity
                            key={num}
                            style={[styles.chip, styles.chipCount, isSelected && styles.chipSelected]}
                            onPress={() => setCount(num)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {num} Voucher
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.sectionLabel}>CATATAN DISTRIBUSI / EVENT</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Contoh: Promo Roadshow Door-to-Door Pasar Baru"
                      placeholderTextColor="#71717a"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={2}
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.footer}>
                {generatedKeys.length > 0 ? (
                  <TouchableOpacity
                    style={styles.closeFullBtn}
                    onPress={handleClose}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.closeFullBtnText}>Selesai & Tutup</Text>
                  </TouchableOpacity>
                ) : (
                  <>
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
                      onPress={handleGenerate}
                      disabled={loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator color="#18181b" size="small" />
                      ) : (
                        <>
                          <Sparkles size={16} color="#18181b" />
                          <Text style={styles.submitBtnText}>Cetak {count} Voucher</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
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
  sectionLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#d4d4d8',
    letterSpacing: 0.5,
    marginBottom: 8,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
  },
  chipCount: {
    minWidth: '22%',
    flex: 1,
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
  resultContainer: {
    paddingVertical: 4,
  },
  resultHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#34d399',
    marginBottom: 12,
    lineHeight: 18,
    includeFontPadding: false,
  },
  keysList: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  keyIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  codeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    color: '#ffffff',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  copyAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  copyAllBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copyAllBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#fbbf24',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
  closeFullBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFullBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
