import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, Scale, Sparkles, Check } from 'lucide-react-native';
import { unitService } from '../../services/unitService';
import { showAlert } from '../../utils/alert';

// Preset satuan populer UMKM Indonesia untuk 1-tap quick fill
const COMMON_PRESETS = [
  { name: 'Pieces / Buah', symbol: 'pcs' },
  { name: 'Dus / Karton', symbol: 'box' },
  { name: 'Botol', symbol: 'btl' },
  { name: 'Porsi', symbol: 'porsi' },
  { name: 'Cup / Gelas', symbol: 'cup' },
  { name: 'Kilogram', symbol: 'kg' },
  { name: 'Gram', symbol: 'gr' },
  { name: 'Liter', symbol: 'ltr' },
  { name: 'Pack / Bungkus', symbol: 'pack' },
  { name: 'Sachet', symbol: 'sachet' },
];

export default function UnitFormModal({
  visible,
  unit,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(unit?.id);

  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill form on edit or reset on create
  useEffect(() => {
    if (unit) {
      setName(unit.name || '');
      setSymbol(unit.symbol || '');
      setDescription(unit.description || '');
    } else {
      setName('');
      setSymbol('');
      setDescription('');
    }
    setErrors({});
  }, [unit, visible]);

  const handleApplyPreset = (preset) => {
    setName(preset.name);
    setSymbol(preset.symbol);
    setErrors({});
  };

  const handleSymbolChange = (val) => {
    const cleanVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setSymbol(cleanVal);
    if (errors.symbol) setErrors((prev) => ({ ...prev, symbol: null }));
  };

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama satuan wajib diisi';
    }
    if (!symbol.trim()) {
      errs.symbol = 'Simbol satuan wajib diisi (contoh: pcs, box, kg)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        symbol: symbol.trim().toLowerCase(),
        description: description.trim() || undefined,
      };

      let result;
      if (isEditMode) {
        result = await unitService.updateUnit(unit.id, payload);
        showAlert('Berhasil', `Satuan "${result.name}" (${result.symbol}) berhasil diperbarui!`);
      } else {
        result = await unitService.createUnit(payload);
        showAlert('Berhasil', `Satuan "${result.name}" (${result.symbol}) berhasil ditambahkan!`);
      }

      if (onSuccess) {
        onSuccess(result, isEditMode);
      }
    } catch (err) {
      console.warn('Gagal simpan satuan:', err.message);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan data satuan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Drag Handle Bar (Mobile Bottom Sheet Pattern) */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Scale size={20} color='#fb7185' />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Data Satuan' : 'Tambah Satuan Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isEditMode
                    ? 'Perbarui nama atau simbol satuan barang'
                    : 'Atur unit satuan penjualan produk (UoM)'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color='#a1a1aa' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Preset Cepat Satuan Populer */}
            {!isEditMode && (
              <View style={styles.presetSection}>
                <View style={styles.presetHeader}>
                  <Sparkles size={13} color='#fb7185' />
                  <Text style={styles.presetTitle}>Preset Cepat Rekomendasi</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetRow}
                >
                  {COMMON_PRESETS.map((p) => {
                    const isMatch = symbol === p.symbol;
                    return (
                      <TouchableOpacity
                        key={p.symbol}
                        style={[styles.presetChip, isMatch && styles.presetChipActive]}
                        onPress={() => handleApplyPreset(p)}
                      >
                        <Text style={[styles.presetChipText, isMatch && styles.presetChipTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Nama Satuan */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nama Satuan Lengkap <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder='Contoh: Pieces, Kilogram, Botol...'
                placeholderTextColor='#a1a1aa'
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Simbol Satuan (Unik) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Simbol Singkatan <Text style={styles.requiredMark}>*</Text>
                </Text>
                <Text style={styles.subLabel}>Huruf kecil, unik</Text>
              </View>
              <TextInput
                style={[styles.input, errors.symbol && styles.inputError]}
                placeholder='Contoh: pcs, box, kg, btl, cup'
                placeholderTextColor='#a1a1aa'
                value={symbol}
                onChangeText={handleSymbolChange}
                autoCapitalize='none'
                autoCorrect={false}
              />
              {errors.symbol ? (
                <Text style={styles.errorText}>{errors.symbol}</Text>
              ) : null}
            </View>

            {/* Deskripsi (Opsional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Keterangan Penggunaan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder='Catatan peruntukan satuan barang...'
                placeholderTextColor='#a1a1aa'
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical='top'
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size='small' color='#ffffff' />
              ) : (
                <>
                  <Check size={16} color='#ffffff' />
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Satuan'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#27272a',
    width: '100%',
    maxHeight: '90%',
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollBody: {
    padding: 16,
  },
  presetSection: {
    marginBottom: 14,
    backgroundColor: '#202023',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 10,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  presetTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#e4e4e7',
  },
  presetRow: {
    gap: 6,
    paddingVertical: 2,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  presetChipActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderColor: '#e11d48',
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  presetChipTextActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_600SemiBold',
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#e4e4e7',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  requiredMark: {
    color: '#f43f5e',
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#f4f4f5',
  },
  inputError: {
    borderColor: '#f43f5e',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#f43f5e',
    marginTop: 4,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e11d48',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
