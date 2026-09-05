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
  Switch,
} from 'react-native';
import {
  X,
  TicketPercent,
  Coins,
  Percent,
  Calendar,
  Users,
  Trash2,
  Check,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { discountService } from '../../services/discountService';
import { showAlert } from '../../utils/alert';

/**
 * Helper to format ISO date string to YYYY-MM-DD
 */
function toDateInputString(dateVal) {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
}

export default function PromoFormModal({
  visible,
  promo,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(promo?.id);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('PERCENTAGE'); // PERCENTAGE | FIXED | MIN_SPEND
  const [value, setValue] = useState('');
  const [minPurchaseAmount, setMinPurchaseAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [quota, setQuota] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  // Date Picker state: null | 'start' | 'end'
  const [activePicker, setActivePicker] = useState(null);

  const handleDateValueChange = (selectedDate) => {
    if (!selectedDate) {
      setActivePicker(null);
      return;
    }
    const formatted = toDateInputString(selectedDate);
    if (activePicker === 'start') {
      setStartDate(formatted);
    } else if (activePicker === 'end') {
      setEndDate(formatted);
      if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
    }
    setActivePicker(null);
  };

  const handleDateDismiss = () => {
    setActivePicker(null);
  };

  // Reset or fill form on modal open
  useEffect(() => {
    if (promo) {
      setCode(promo.code || '');
      setName(promo.name || '');
      setDescription(promo.description || '');
      setType(promo.type || 'PERCENTAGE');
      setValue(promo.value !== undefined && promo.value !== null ? String(parseFloat(promo.value)) : '');
      setMinPurchaseAmount(
        parseFloat(promo.min_purchase_amount) > 0 ? String(parseFloat(promo.min_purchase_amount)) : ''
      );
      setMaxDiscountAmount(
        promo.max_discount_amount ? String(parseFloat(promo.max_discount_amount)) : ''
      );
      setStartDate(toDateInputString(promo.start_date));
      setEndDate(toDateInputString(promo.end_date));
      setQuota(promo.quota ? String(promo.quota) : '');
      setIsActive(Boolean(promo.is_active));
    } else {
      setCode('');
      setName('');
      setDescription('');
      setType('PERCENTAGE');
      setValue('');
      setMinPurchaseAmount('');
      setMaxDiscountAmount('');
      setStartDate('');
      setEndDate('');
      setQuota('');
      setIsActive(true);
    }
    setErrors({});
  }, [promo, visible]);

  // Code input uppercase & remove whitespace
  const handleCodeChange = (text) => {
    const formatted = text.toUpperCase().replace(/\s+/g, '');
    setCode(formatted);
    if (errors.code) setErrors((prev) => ({ ...prev, code: null }));
  };

  const validateForm = () => {
    const errs = {};
    if (!code.trim()) {
      errs.code = 'Kode kupon wajib diisi (contoh: HEMAT10)';
    }
    if (!name.trim()) {
      errs.name = 'Nama promosi wajib diisi';
    }

    const numVal = parseFloat(value);
    if (!value || isNaN(numVal) || numVal <= 0) {
      errs.value = 'Nilai diskon harus lebih besar dari 0';
    } else if ((type === 'PERCENTAGE' || type === 'MIN_SPEND') && numVal > 100) {
      errs.value = 'Diskon persentase maksimal 100%';
    }

    if (type === 'MIN_SPEND') {
      const minBuy = parseFloat(minPurchaseAmount);
      if (!minPurchaseAmount || isNaN(minBuy) || minBuy <= 0) {
        errs.minPurchaseAmount = 'Tipe Min. Belanja mewajibkan syarat nominal belanja';
      }
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      errs.endDate = 'Tanggal selesai tidak boleh sebelum tanggal mulai';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        description: description.trim() || undefined,
        type: type,
        value: parseFloat(value),
        min_purchase_amount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
        max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        start_date: startDate ? `${startDate}T00:00:00` : null,
        end_date: endDate ? `${endDate}T23:59:59` : null,
        quota: quota ? parseInt(quota, 10) : null,
        is_active: isActive,
      };

      let result;
      if (isEditMode) {
        result = await discountService.updateDiscount(promo.id, payload);
        showAlert('Berhasil', `Program promosi "${result.name}" berhasil diperbarui!`);
      } else {
        result = await discountService.createDiscount(payload);
        showAlert('Berhasil', `Program promosi "${result.name}" (${result.code}) berhasil dibuat!`);
      }

      if (onSuccess) {
        onSuccess(result, isEditMode);
      }
      onClose();
    } catch (err) {
      console.warn('Gagal simpan promosi:', err.message);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan promosi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!promo?.id) return;

    showAlert(
      'Hapus Promosi',
      `Apakah Anda yakin ingin menghapus voucher "${promo.name}" (${promo.code})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await discountService.deleteDiscount(promo.id);
              showAlert('Berhasil', `Voucher "${promo.name}" telah dihapus.`);
              if (onSuccess) {
                onSuccess({ id: promo.id, _deleted: true }, true);
              }
              onClose();
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus promosi.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <TicketPercent size={20} color="#fb7185" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Program Promosi' : 'Tambah Promosi Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={2}>
                  {isEditMode
                    ? 'Perbarui skema diskon & masa berlaku kupon'
                    : 'Atur diskon belanja untuk transaksi kasir'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Field: Kode Kupon */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Kode Kupon / Voucher</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, styles.codeInput, errors.code && styles.inputError]}
                placeholder="Misal: HEMAT10, GAJIAN50K"
                placeholderTextColor="#a1a1aa"
                value={code}
                onChangeText={handleCodeChange}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
            </View>

            {/* Field: Nama Promosi */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nama Promosi</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Misal: Diskon Hemat Gajian 10%"
                placeholderTextColor="#a1a1aa"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Selector: Tipe Diskon */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Skema Diskon</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeOptionBtn, type === 'PERCENTAGE' && styles.typeOptionBtnActive]}
                  onPress={() => setType('PERCENTAGE')}
                  activeOpacity={0.7}
                >
                  <Percent size={14} color={type === 'PERCENTAGE' ? '#ffffff' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, type === 'PERCENTAGE' && styles.typeOptionTextActive]}>
                    Diskon %
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOptionBtn, type === 'FIXED' && styles.typeOptionBtnActive]}
                  onPress={() => setType('FIXED')}
                  activeOpacity={0.7}
                >
                  <Coins size={14} color={type === 'FIXED' ? '#ffffff' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, type === 'FIXED' && styles.typeOptionTextActive]}>
                    Diskon Rp
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOptionBtn, type === 'MIN_SPEND' && styles.typeOptionBtnActive]}
                  onPress={() => setType('MIN_SPEND')}
                  activeOpacity={0.7}
                >
                  <TicketPercent size={14} color={type === 'MIN_SPEND' ? '#ffffff' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, type === 'MIN_SPEND' && styles.typeOptionTextActive]}>
                    Min. Belanja
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Field: Nilai Diskon */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  {type === 'FIXED' ? 'Nominal Potongan (Rp)' : 'Persentase Diskon (%)'}
                </Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, errors.value && styles.inputError]}
                placeholder={type === 'FIXED' ? 'Misal: 15000' : 'Misal: 10 (untuk 10%)'}
                placeholderTextColor="#a1a1aa"
                value={value}
                onChangeText={(val) => {
                  setValue(val.replace(/[^0-9.]/g, ''));
                  if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                }}
                keyboardType="numeric"
              />
              {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}
            </View>

            {/* Field: Batas Maksimal Potongan (Khusus Persentase / Min Spend) */}
            {(type === 'PERCENTAGE' || type === 'MIN_SPEND') && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Maksimal Potongan (Rp, Opsional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: 25.000 (Opsional)"
                  placeholderTextColor="#a1a1aa"
                  value={maxDiscountAmount}
                  onChangeText={(val) => setMaxDiscountAmount(val.replace(/[^0-9]/g, ''))}
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* Field: Minimal Pembelian */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Minimal Pembelian (Rp)</Text>
                {type === 'MIN_SPEND' && <Text style={styles.requiredMark}>*</Text>}
              </View>
              <TextInput
                style={[styles.input, errors.minPurchaseAmount && styles.inputError]}
                placeholder="Contoh: 50.000 (0 = Tanpa minimal)"
                placeholderTextColor="#a1a1aa"
                value={minPurchaseAmount}
                onChangeText={(val) => {
                  setMinPurchaseAmount(val.replace(/[^0-9]/g, ''));
                  if (errors.minPurchaseAmount) setErrors((prev) => ({ ...prev, minPurchaseAmount: null }));
                }}
                keyboardType="numeric"
              />
              {errors.minPurchaseAmount && (
                <Text style={styles.errorText}>{errors.minPurchaseAmount}</Text>
              )}
            </View>

            {/* Field 2 Kolom: Tanggal Mulai & Tanggal Selesai (Interactive Date Pickers) */}
            <View style={styles.twoColRow}>
              <View style={styles.halfCol}>
                <Text style={styles.label}>Mulai Berlaku</Text>
                <TouchableOpacity
                  style={[styles.datePickerTrigger, startDate && styles.datePickerTriggerFilled]}
                  onPress={() => setActivePicker('start')}
                  activeOpacity={0.75}
                >
                  <Calendar size={15} color={startDate ? '#fb7185' : '#a1a1aa'} style={{ flexShrink: 0 }} />
                  <Text
                    style={[styles.datePickerText, !startDate && styles.datePickerPlaceholder]}
                    numberOfLines={1}
                  >
                    {startDate || 'Pilih Tanggal'}
                  </Text>
                  {Boolean(startDate) && (
                    <TouchableOpacity
                      onPress={() => setStartDate('')}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={styles.dateClearBtn}
                    >
                      <X size={13} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.halfCol}>
                <Text style={styles.label}>Selesai Berlaku</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerTrigger,
                    endDate && styles.datePickerTriggerFilled,
                    errors.endDate && styles.inputError,
                  ]}
                  onPress={() => setActivePicker('end')}
                  activeOpacity={0.75}
                >
                  <Calendar size={15} color={endDate ? '#fb7185' : '#a1a1aa'} style={{ flexShrink: 0 }} />
                  <Text
                    style={[styles.datePickerText, !endDate && styles.datePickerPlaceholder]}
                    numberOfLines={1}
                  >
                    {endDate || 'Pilih Tanggal'}
                  </Text>
                  {Boolean(endDate) && (
                    <TouchableOpacity
                      onPress={() => {
                        setEndDate('');
                        if (errors.endDate) setErrors((prev) => ({ ...prev, endDate: null }));
                      }}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      style={styles.dateClearBtn}
                    >
                      <X size={13} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}

            {/* Native / Web DatePicker Component */}
            {activePicker && (
              <DateTimePicker
                value={
                  activePicker === 'start'
                    ? startDate
                      ? new Date(startDate)
                      : new Date()
                    : endDate
                    ? new Date(endDate)
                    : new Date()
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onValueChange={handleDateValueChange}
                onDismiss={handleDateDismiss}
              />
            )}

            {/* Field: Batas Kuota */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Batas Kuota Pemakaian (Opsional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 100 (Opsional)"
                placeholderTextColor="#a1a1aa"
                value={quota}
                onChangeText={(val) => setQuota(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>

            {/* Field: Deskripsi */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Keterangan / Syarat Promo (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Catatan ketentuan pemakaian promo..."
                placeholderTextColor="#a1a1aa"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Toggle: Aktifkan Promo */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.switchLabel}>Status Aktif Kupon</Text>
                <Text style={styles.switchSubLabel}>
                  {isActive
                    ? 'Kupon dapat digunakan di kasir POS'
                    : 'Kupon dinonaktifkan sementara'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#3f3f46', true: '#e11d48' }}
                thumbColor={isActive ? '#ffffff' : '#a1a1aa'}
              />
            </View>

            {/* Danger Zone: Hapus Program Promo */}
            {isEditMode && (
              <View style={styles.dangerZone}>
                <TouchableOpacity
                  style={styles.deleteBtnFull}
                  onPress={handleDelete}
                  disabled={submitting || deleting}
                  activeOpacity={0.8}
                >
                  {deleting ? (
                    <ActivityIndicator size="small" color="#f87171" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#f87171" />
                      <Text style={styles.deleteBtnFullText}>Hapus Program Promo Ini</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Modal Footer: Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={submitting || deleting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting || deleting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Simpan' : 'Buat Promo'}
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
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  modalSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
  formScroll: {
    paddingVertical: 12,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  halfCol: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  label: {
    color: '#e4e4e7',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 4,
  },
  requiredMark: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  input: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  datePickerTriggerFilled: {
    borderColor: '#3f3f46',
    backgroundColor: '#18181b',
  },
  datePickerText: {
    flex: 1,
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  datePickerPlaceholder: {
    color: '#71717a',
    fontFamily: 'Poppins_400Regular',
  },
  dateClearBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeInput: {
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
    color: '#fb7185',
  },
  textArea: {
    minHeight: 64,
  },
  inputError: {
    borderColor: '#f87171',
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 4,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  typeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 4,
  },
  typeOptionBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  typeOptionText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  switchLabel: {
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  switchSubLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  dangerZone: {
    marginTop: 10,
    marginBottom: 4,
  },
  deleteBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  deleteBtnFullText: {
    color: '#f87171',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cancelButtonText: {
    color: '#d4d4d8',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
  },
  submitButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
