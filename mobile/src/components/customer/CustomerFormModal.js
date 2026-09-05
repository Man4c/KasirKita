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
  User,
  Crown,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react-native';
import { customerService } from '../../services/customerService';
import { showAlert } from '../../utils/alert';

export default function CustomerFormModal({
  visible,
  customer,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(customer?.id);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [membershipType, setMembershipType] = useState('REGULAR'); // REGULAR | VIP | WHOLESALE
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset or fill form on modal open
  useEffect(() => {
    if (customer) {
      setName(customer.name || '');
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setMembershipType((customer.membership_type || 'REGULAR').toUpperCase());
      setIsActive(customer.is_active !== undefined ? Boolean(customer.is_active) : true);
      setNotes(customer.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setMembershipType('REGULAR');
      setIsActive(true);
      setNotes('');
    }
    setErrors({});
  }, [customer, visible]);

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama lengkap pelanggan wajib diisi.';
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8) {
        errs.phone = 'Nomor telepon/WhatsApp minimal 8 digit.';
      }
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Format alamat email tidak valid.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        membership_type: membershipType,
        is_active: isActive,
        notes: notes.trim() || null,
      };

      let result;
      if (isEditMode) {
        result = await customerService.updateCustomer(customer.id, payload);
        showAlert('Sukses', `Data pelanggan "${result.name}" berhasil diperbarui.`);
      } else {
        result = await customerService.createCustomer(payload);
        showAlert('Sukses', `Pelanggan "${result.name}" berhasil didaftarkan.`);
      }

      if (onSuccess) {
        onSuccess(result, isEditMode);
      }
      onClose();
    } catch (err) {
      console.warn('CustomerFormModal submit error:', err);
      if (err.errors) {
        setErrors(err.errors);
      }
      showAlert(
        'Gagal Menyimpan',
        err.message || 'Terjadi kesalahan saat menyimpan data pelanggan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!customer?.id) return;

    showAlert(
      'Hapus Pelanggan',
      `Yakin ingin menghapus data pelanggan "${customer.name}"? Riwayat transaksi lama akan tetap dipertahankan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await customerService.deleteCustomer(customer.id);
              showAlert('Sukses', 'Pelanggan berhasil dihapus.');
              if (onSuccess) {
                onSuccess(customer, true); // trigger reload
              }
              onClose();
            } catch (err) {
              showAlert('Gagal Hapus', err.message || 'Terjadi kendala menghapus data.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Membership Options Definition
  const membershipOptions = [
    {
      key: 'REGULAR',
      label: 'Reguler',
      desc: 'Pelanggan standar tanpa diskon tier khusus',
      color: '#2dd4bf',
      Icon: User,
    },
    {
      key: 'VIP',
      label: 'Member VIP',
      desc: 'Pelanggan prioritas dengan promo loyalitas ekstra',
      color: '#fbbf24',
      Icon: Crown,
    },
    {
      key: 'WHOLESALE',
      label: 'Grosir / Toko',
      desc: 'Pembeli partai besar dengan harga khusus kulakan',
      color: '#38bdf8',
      Icon: Building2,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <User size={20} color="#2dd4bf" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Pelanggan' : 'Daftar Pelanggan Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isEditMode
                    ? 'Perbarui nomor WhatsApp, tier member, atau alamat'
                    : 'Catat kontak member untuk pencatatan transaksi & struk WA'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={submitting || deleting}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          {/* Form Fields ScrollView */}
          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Field: Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nama Lengkap Pelanggan</Text>
                <Text style={styles.requiredMark}>*</Text>
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Misal: Ibu Siti Rahmawati, Toko Berkah"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* 2. Field: Nomor Telepon / WhatsApp */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Nomor Telepon / WhatsApp</Text>
                <Text style={styles.optionalMark}>(Opsional)</Text>
              </View>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Misal: 081234567890"
                placeholderTextColor="#71717a"
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
                keyboardType="phone-pad"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* 3. Selector: Tingkat Keanggotaan (Membership Tier) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                Tingkat Keanggotaan <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={styles.tierSelectorCol}>
                {membershipOptions.map((opt) => {
                  const isSelected = membershipType === opt.key;
                  const Icon = opt.Icon;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.tierOptionCard,
                        isSelected && {
                          borderColor: opt.color,
                          backgroundColor: `${opt.color}15`,
                        },
                      ]}
                      onPress={() => setMembershipType(opt.key)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.tierRadioWrap}>
                        <View
                          style={[
                            styles.radioOuter,
                            isSelected && { borderColor: opt.color },
                          ]}
                        >
                          {isSelected && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: opt.color },
                              ]}
                            />
                          )}
                        </View>
                      </View>

                      <View style={styles.tierInfoWrap}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Icon size={14} color={opt.color} style={{ flexShrink: 0 }} />
                          <Text
                            style={[
                              styles.tierTitle,
                              isSelected && { color: opt.color, fontFamily: 'Poppins_700Bold' },
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </View>
                        <Text style={styles.tierDesc}>{opt.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. Field: Email */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.optionalMark}>(Opsional)</Text>
              </View>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Misal: pelanggan@gmail.com"
                placeholderTextColor="#71717a"
                value={email}
                onChangeText={(val) => {
                  setEmail(val);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* 5. Field: Alamat */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Alamat Lengkap</Text>
                <Text style={styles.optionalMark}>(Opsional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Alamat rumah, kantor, atau tujuan pengiriman barang..."
                placeholderTextColor="#71717a"
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* 6. Switch: Status Aktif Pelanggan */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                <Text style={styles.switchLabel}>Status Aktif Pelanggan</Text>
                <Text style={styles.switchSubLabel}>
                  {isActive
                    ? 'Dapat dipilih kasir saat transaksi penjualan POS'
                    : 'Dinonaktifkan sementara dari kasir POS'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#3f3f46', true: '#2dd4bf' }}
                thumbColor={isActive ? '#ffffff' : '#a1a1aa'}
              />
            </View>

            {/* 7. Field: Catatan Khusus */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Catatan Khusus (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Misal: Pelanggan langganan kopi hitam, minta packing kardus rapat..."
                placeholderTextColor="#71717a"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {/* Danger Zone: Hapus Pelanggan (Edit Mode) */}
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
                      <Text style={styles.deleteBtnFullText}>Hapus Pelanggan Ini</Text>
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
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Check size={16} color="#09090b" />
                  <Text style={styles.submitButtonText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Daftarkan Pelanggan'}
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
  optionalMark: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
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
    minHeight: 60,
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
  tierSelectorCol: {
    gap: 8,
    marginTop: 6,
  },
  tierOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 10,
    gap: 10,
  },
  tierRadioWrap: {
    marginTop: 1,
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
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tierInfoWrap: {
    flex: 1,
    minWidth: 0,
  },
  tierTitle: {
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  tierDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 16,
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
    marginBottom: 14,
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
    paddingVertical: 11,
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
    backgroundColor: '#2dd4bf',
    paddingVertical: 11,
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
