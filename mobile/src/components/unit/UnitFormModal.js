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
    <Modal visible={visible} animationType='fade' transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Scale size={20} color='#c084fc' />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'Edit Data Satuan' : 'Tambah Satuan Baru'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditMode
                    ? 'Perbarui nama atau simbol satuan barang'
                    : 'Atur unit satuan penjualan produk (UoM)'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color='#a1a1aa' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Preset Cepat Satuan Populer */}
            {!isEditMode && (
              <View style={styles.presetSection}>
                <View style={styles.presetHeader}>
                  <Sparkles size={13} color='#c084fc' />
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
                placeholderTextColor='#71717a'
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
                placeholderTextColor='#71717a'
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
                placeholderTextColor='#71717a'
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(192, 132, 252, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.3)',
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
  },
  scrollBody: {
    padding: 16,
  },
  presetSection: {
    marginBottom: 14,
    backgroundColor: 'rgba(192, 132, 252, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(192, 132, 252, 0.18)',
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
    color: '#c084fc',
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
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderColor: '#c084fc',
  },
  presetChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  presetChipTextActive: {
    color: '#c084fc',
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
    color: '#71717a',
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
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#9333ea',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
