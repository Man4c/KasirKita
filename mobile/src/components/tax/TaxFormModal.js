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
  ReceiptText,
  Coins,
  Percent,
  Layers,
  CreditCard,
  ShoppingBag,
  Package,
  Trash2,
  Check,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { taxService } from '../../services/taxService';
import { showAlert } from '../../utils/alert';

/**
 * Helper format Rupiah display
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

/**
 * Helper pemformatan ribuan angka input Rupiah
 */
function formatRupiahInput(val) {
  const clean = String(val || '').replace(/\D/g, '');
  if (!clean) return '';
  return Number(clean).toLocaleString('id-ID');
}

/**
 * Helper parse angka murni dari input Rupiah atau Persentase
 */
function parseNumberValue(val) {
  if (typeof val === 'number') return val;
  const clean = String(val || '').replace(/\./g, '').replace(/,/g, '.');
  return parseFloat(clean) || 0;
}

/**
 * Template Cepat Regulasi & Standar Bisnis Indonesia
 */
const PRESET_TEMPLATES = [
  {
    id: 'ppn_11',
    label: '🏛️ PPN 11%',
    badge: 'Nasional',
    badgeColor: '#fbbf24',
    name: 'PPN 11%',
    is_tax: true,
    type: 'PERCENTAGE',
    value: '11',
    apply_to: 'ALL',
    is_default: true,
    description: 'Pajak Pertambahan Nilai nasional sesuai regulasi perpajakan',
  },
  {
    id: 'pb1_10',
    label: '🍽️ PB1 Resto 10%',
    badge: 'Resto & Kafe',
    badgeColor: '#fb923c',
    name: 'PB1 Restoran 10%',
    is_tax: true,
    type: 'PERCENTAGE',
    value: '10',
    apply_to: 'ALL',
    is_default: true,
    description: 'Pajak Barang & Jasa Tertentu (PBJT) restoran daerah',
  },
  {
    id: 'bungkus_2000',
    label: '📦 Biaya Bungkus',
    badge: 'Takeaway',
    badgeColor: '#60a5fa',
    name: 'Biaya Kemasan Bungkus',
    is_tax: false,
    type: 'FIXED',
    value: '2.000',
    apply_to: 'TAKEAWAY_ONLY',
    is_default: true,
    description: 'Biaya wadah atau kemasan khusus pesanan bawa pulang',
  },
  {
    id: 'service_5',
    label: '🤝 Service 5%',
    badge: 'Layanan',
    badgeColor: '#34d399',
    name: 'Biaya Layanan Toko',
    is_tax: false,
    type: 'PERCENTAGE',
    value: '5',
    apply_to: 'ALL',
    is_default: true,
    description: 'Biaya servis operasional dan pelayanan toko',
  },
];

export default function TaxFormModal({
  visible,
  taxAndFee,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(taxAndFee?.id);

  // Form states
  const [name, setName] = useState('');
  const [isTax, setIsTax] = useState(true); // true = Pajak | false = Biaya Layanan
  const [type, setType] = useState('PERCENTAGE'); // PERCENTAGE | FIXED
  const [value, setValue] = useState('');
  const [applyTo, setApplyTo] = useState('ALL'); // ALL | SPECIFIC_PAYMENT | TAKEAWAY_ONLY | MANUAL
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [isDefault, setIsDefault] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  // Reset or fill form on modal open
  useEffect(() => {
    if (taxAndFee) {
      setName(taxAndFee.name || '');
      setIsTax(taxAndFee.is_tax !== undefined ? Boolean(taxAndFee.is_tax) : true);
      const feeType = taxAndFee.type || 'PERCENTAGE';
      setType(feeType);

      const rawVal = taxAndFee.value !== undefined && taxAndFee.value !== null ? parseFloat(taxAndFee.value) : '';
      if (feeType === 'FIXED') {
        setValue(formatRupiahInput(rawVal));
      } else {
        setValue(rawVal !== '' ? String(rawVal) : '');
      }

      setApplyTo(taxAndFee.apply_to || 'ALL');
      setPaymentMethod(taxAndFee.payment_method || 'QRIS');
      setIsDefault(Boolean(taxAndFee.is_default));
      setIsActive(taxAndFee.is_active !== undefined ? Boolean(taxAndFee.is_active) : true);
      setDescription(taxAndFee.description || '');
    } else {
      setName('');
      setIsTax(true);
      setType('PERCENTAGE');
      setValue('');
      setApplyTo('ALL');
      setPaymentMethod('QRIS');
      setIsDefault(false);
      setIsActive(true);
      setDescription('');
    }
    setSelectedPresetId(null);
    setErrors({});
  }, [taxAndFee, visible]);

  // Handle Preset Click
  const handleApplyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setName(preset.name);
    setIsTax(preset.is_tax);
    setType(preset.type);
    setValue(preset.value);
    setApplyTo(preset.apply_to);
    setIsDefault(preset.is_default);
    setDescription(preset.description);
    setErrors({});
  };

  // Switch rate type with proper formatting
  const handleTypeChange = (newType) => {
    if (newType === type) return;
    const currentNum = parseNumberValue(value);
    setType(newType);
    if (newType === 'FIXED') {
      setValue(currentNum > 0 ? formatRupiahInput(currentNum) : '');
    } else {
      setValue(currentNum > 0 ? String(Math.min(currentNum, 100)) : '');
    }
    if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
  };

  // Live calculation preview on Rp100.000 simulation
  const previewCalculation = () => {
    const numVal = parseNumberValue(value);
    if (type === 'PERCENTAGE') {
      const calc = (100000 * numVal) / 100;
      return `+${formatRp(calc)} (dari Rp100.000)`;
    }
    return `+${formatRp(numVal)} per transaksi`;
  };

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama komponen wajib diisi (contoh: PPN 11%)';
    }

    const numVal = parseNumberValue(value);
    if (!value || isNaN(numVal) || numVal < 0) {
      errs.value = 'Nilai tarif harus berupa angka positif (min. 0)';
    } else if (type === 'PERCENTAGE' && numVal > 100) {
      errs.value = 'Tarif persentase maksimal 100%';
    }

    if (applyTo === 'SPECIFIC_PAYMENT' && !paymentMethod) {
      errs.paymentMethod = 'Metode pembayaran pemicu wajib dipilih';
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
        is_tax: isTax,
        type: type,
        value: parseNumberValue(value),
        apply_to: applyTo,
        payment_method: applyTo === 'SPECIFIC_PAYMENT' ? paymentMethod : null,
        is_default: isDefault,
        is_active: isActive,
        description: description.trim() || undefined,
      };

      let result;
      if (isEditMode) {
        result = await taxService.updateTaxAndFee(taxAndFee.id, payload);
        showAlert('Berhasil', `Komponen "${result.name}" berhasil diperbarui!`);
      } else {
        result = await taxService.createTaxAndFee(payload);
        showAlert('Berhasil', `Komponen "${result.name}" berhasil ditambahkan!`);
      }

      if (onSuccess) {
        onSuccess(result, isEditMode);
      }
      onClose();
    } catch (err) {
      console.warn('Gagal simpan pajak/biaya:', err.message);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan komponen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!taxAndFee?.id) return;

    const labelType = taxAndFee.is_tax ? 'Pajak' : 'Biaya Layanan';
    showAlert(
      `Hapus ${labelType}`,
      `Apakah Anda yakin ingin menghapus komponen "${taxAndFee.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await taxService.deleteTaxAndFee(taxAndFee.id);
              showAlert('Berhasil', `Komponen "${taxAndFee.name}" telah dihapus.`);
              if (onSuccess) {
                onSuccess({ id: taxAndFee.id, _deleted: true }, true);
              }
              onClose();
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus komponen.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const applyToOptions = [
    { key: 'ALL', label: 'Semua Transaksi', desc: 'Otomatis dihitung pada seluruh transaksi baru' },
    { key: 'MANUAL', label: 'Pilihan Kasir', desc: 'Dapat dinyalakan/dipilih manual kasir di POS' },
    { key: 'TAKEAWAY_ONLY', label: 'Bawa Pulang Saja', desc: 'Khusus pesanan bawa pulang / takeaway' },
    { key: 'SPECIFIC_PAYMENT', label: 'Khusus Pembayaran', desc: 'Hanya aktif pada metode pembayaran tertentu' },
  ];

  const paymentOptions = [
    { key: 'QRIS', label: 'QRIS' },
    { key: 'TRANSFER', label: 'Transfer' },
    { key: 'DEBIT', label: 'Debit/EDC' },
  ];

  if (!visible) return null;

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
              <View
                style={[
                  styles.iconCircle,
                  { borderColor: isTax ? 'rgba(251, 191, 36, 0.4)' : 'rgba(96, 165, 250, 0.4)' },
                ]}
              >
                {isTax ? (
                  <ReceiptText size={20} color="#fbbf24" />
                ) : (
                  <Coins size={20} color="#60a5fa" />
                )}
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Komponen' : 'Tambah Pajak / Biaya'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isTax ? 'Konfigurasi tarif pajak penjualan' : 'Konfigurasi biaya layanan toko'}
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

          {/* Form Scrollable Body */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Quick Preset Chips Regulasi Indonesia (Khusus Create Mode) */}
            {!isEditMode && (
              <View style={styles.presetSection}>
                <View style={styles.presetHeader}>
                  <Zap size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <Text style={styles.presetTitle}>Template Cepat Regulasi</Text>
                  <Text style={styles.presetSubtitle}>1-ketuk untuk isi otomatis</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.presetChipsList}
                >
                  {PRESET_TEMPLATES.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <TouchableOpacity
                        key={preset.id}
                        style={[
                          styles.presetChip,
                          isSelected && {
                            borderColor: preset.badgeColor,
                            backgroundColor: `${preset.badgeColor}1c`,
                          },
                        ]}
                        onPress={() => handleApplyPreset(preset)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      >
                        <Text
                          style={[
                            styles.presetChipLabel,
                            isSelected && { color: '#ffffff', fontFamily: 'Poppins_600SemiBold' },
                          ]}
                        >
                          {preset.label}
                        </Text>
                        <View style={[styles.presetBadge, { backgroundColor: `${preset.badgeColor}22` }]}>
                          <Text style={[styles.presetBadgeText, { color: preset.badgeColor }]}>
                            {preset.badge}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* 1. Klasifikasi Jenis Komponen */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Klasifikasi Komponen <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeOptionBtn, isTax && styles.typeOptionBtnTaxActive]}
                  onPress={() => setIsTax(true)}
                  activeOpacity={0.7}
                >
                  <ReceiptText size={15} color={isTax ? '#fbbf24' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, isTax && styles.typeOptionTextTaxActive]}>
                    Pajak (PPN/PB1)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOptionBtn, !isTax && styles.typeOptionBtnFeeActive]}
                  onPress={() => setIsTax(false)}
                  activeOpacity={0.7}
                >
                  <Coins size={15} color={!isTax ? '#60a5fa' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, !isTax && styles.typeOptionTextFeeActive]}>
                    Biaya Layanan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Field: Nama Komponen */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nama {isTax ? 'Pajak' : 'Biaya Layanan'}</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder={isTax ? 'Misal: PPN 11%, PB1 Resto 10%' : 'Misal: Service Charge 5%, Biaya Bungkus'}
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* 3. Selector: Format Skema Tarif */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Format Skema Tarif</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeOptionBtn, type === 'PERCENTAGE' && styles.typeOptionBtnRateActive]}
                  onPress={() => handleTypeChange('PERCENTAGE')}
                  activeOpacity={0.7}
                >
                  <Percent size={14} color={type === 'PERCENTAGE' ? '#09090b' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, type === 'PERCENTAGE' && styles.typeOptionTextRateActive]}>
                    Persentase (%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeOptionBtn, type === 'FIXED' && styles.typeOptionBtnRateActive]}
                  onPress={() => handleTypeChange('FIXED')}
                  activeOpacity={0.7}
                >
                  <Coins size={14} color={type === 'FIXED' ? '#09090b' : '#a1a1aa'} />
                  <Text style={[styles.typeOptionText, type === 'FIXED' && styles.typeOptionTextRateActive]}>
                    Nominal Tetap (Rp)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Field: Besaran Nilai Tarif & Live Preview */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>
                  Besaran Nilai ({type === 'PERCENTAGE' ? '%' : 'Rp'})
                </Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, errors.value && styles.inputError]}
                placeholder={type === 'PERCENTAGE' ? 'Misal: 11' : 'Misal: 2.000'}
                placeholderTextColor="#71717a"
                value={value}
                onChangeText={(val) => {
                  if (type === 'FIXED') {
                    setValue(formatRupiahInput(val));
                  } else {
                    setValue(val.replace(/[^0-9.]/g, ''));
                  }
                  if (errors.value) setErrors((prev) => ({ ...prev, value: null }));
                }}
                keyboardType={type === 'FIXED' ? 'number-pad' : 'decimal-pad'}
              />
              {errors.value && <Text style={styles.errorText}>{errors.value}</Text>}

              {/* Live Preview Calculation */}
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Simulasi Belanja Rp100.000:</Text>
                <Text style={styles.previewValue}>{previewCalculation()}</Text>
              </View>
            </View>

            {/* 5. Aturan Pemicu Transaksi (Apply To) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Aturan Penerapan pada Transaksi <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.applyToOptionsCol}>
                {applyToOptions.map((opt) => {
                  const isSelected = applyTo === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.applyOptionCard, isSelected && styles.applyOptionCardActive]}
                      onPress={() => setApplyTo(opt.key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.applyOptionRadio}>
                        <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>
                      </View>
                      <View style={styles.applyOptionInfo}>
                        <Text style={[styles.applyOptionTitle, isSelected && styles.applyOptionTitleActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.applyOptionDesc}>
                          {opt.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 6. Metode Pembayaran Pemicu (Jika SPECIFIC_PAYMENT) */}
            {applyTo === 'SPECIFIC_PAYMENT' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Metode Pembayaran Pemicu</Text>
                <View style={styles.typeSelectorRow}>
                  {paymentOptions.map((pOpt) => {
                    const isPSelected = paymentMethod === pOpt.key;
                    return (
                      <TouchableOpacity
                        key={pOpt.key}
                        style={[styles.typeOptionBtn, isPSelected && styles.typeOptionBtnActive]}
                        onPress={() => setPaymentMethod(pOpt.key)}
                        activeOpacity={0.7}
                      >
                        <CreditCard size={13} color={isPSelected ? '#ffffff' : '#a1a1aa'} />
                        <Text style={[styles.typeOptionText, isPSelected && styles.typeOptionTextActive]}>
                          {pOpt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.paymentMethod && <Text style={styles.errorText}>{errors.paymentMethod}</Text>}
              </View>
            )}

            {/* 7. Toggle Switches: Default POS & Status Aktif */}
            <View style={styles.switchesSection}>
              {applyTo !== 'SPECIFIC_PAYMENT' && (
                <View style={styles.switchRow}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={14} color="#34d399" style={{ flexShrink: 0 }} />
                      <Text style={styles.switchLabel}>Jadikan Default POS</Text>
                    </View>
                    <Text style={styles.switchSubLabel}>
                      Otomatis langsung terpilih saat membuka keranjang kasir baru
                    </Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: '#3f3f46', true: '#10b981' }}
                    thumbColor={isDefault ? '#ffffff' : '#a1a1aa'}
                  />
                </View>
              )}

              <View style={[styles.switchRow, { marginBottom: 0 }]}>
                <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <Text style={styles.switchLabel}>Status Aktif Komponen</Text>
                  <Text style={styles.switchSubLabel}>
                    {isActive
                      ? 'Dapat dihitung dan digunakan di kasir POS'
                      : 'Dinonaktifkan sementara dari kasir'}
                  </Text>
                </View>
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  trackColor={{ false: '#3f3f46', true: isTax ? '#fbbf24' : '#60a5fa' }}
                  thumbColor={isActive ? '#ffffff' : '#a1a1aa'}
                />
              </View>
            </View>

            {/* 8. Field: Keterangan Tambahan */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Keterangan Tambahan (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Catatan regulasi pajak daerah atau tujuan operasional biaya ini..."
                placeholderTextColor="#71717a"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Danger Zone: Hapus Komponen */}
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
                      <Text style={styles.deleteBtnFullText}>Hapus Komponen Ini</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Sticky Modal Footer: Action Buttons (Selalu terlihat di zona nyaman jempol) */}
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
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Check size={16} color="#09090b" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Komponen'}
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
    maxHeight: '92%',
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
    paddingHorizontal: 18,
    paddingBottom: 14,
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
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  formScroll: {
    maxHeight: '100%',
  },
  formScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 24,
  },
  presetSection: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  presetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  presetTitle: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  presetSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 'auto',
  },
  presetChipsList: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  presetChipLabel: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  presetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  presetBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  fieldGroup: {
    marginBottom: 14,
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
    gap: 8,
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
    paddingHorizontal: 8,
    gap: 6,
  },
  typeOptionBtnTaxActive: {
    backgroundColor: '#78350f22',
    borderColor: '#fbbf24',
  },
  typeOptionTextTaxActive: {
    color: '#fbbf24',
    fontFamily: 'Poppins_600SemiBold',
  },
  typeOptionBtnFeeActive: {
    backgroundColor: '#0284c722',
    borderColor: '#60a5fa',
  },
  typeOptionTextFeeActive: {
    color: '#60a5fa',
    fontFamily: 'Poppins_600SemiBold',
  },
  typeOptionBtnRateActive: {
    backgroundColor: '#f4f4f5',
    borderColor: '#f4f4f5',
  },
  typeOptionTextRateActive: {
    color: '#09090b',
    fontFamily: 'Poppins_600SemiBold',
  },
  typeOptionBtnActive: {
    backgroundColor: '#27272a',
    borderColor: '#60a5fa',
  },
  typeOptionText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
  },
  typeOptionTextActive: {
    color: '#60a5fa',
    fontFamily: 'Poppins_600SemiBold',
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  previewLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  previewValue: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  applyToOptionsCol: {
    gap: 8,
    marginTop: 6,
  },
  applyOptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  applyOptionCardActive: {
    borderColor: '#fbbf24',
    backgroundColor: '#78350f11',
  },
  applyOptionRadio: {
    marginTop: 2,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#52525b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#fbbf24',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
  },
  applyOptionInfo: {
    flex: 1,
  },
  applyOptionTitle: {
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  applyOptionTitleActive: {
    color: '#fbbf24',
  },
  applyOptionDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
  },
  switchesSection: {
    marginBottom: 14,
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 12,
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
    marginTop: 2,
  },
  dangerZone: {
    marginTop: 6,
    marginBottom: 6,
  },
  deleteBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    minHeight: 44,
    paddingVertical: 12,
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
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelButton: {
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
    backgroundColor: '#fbbf24',
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#09090b',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
