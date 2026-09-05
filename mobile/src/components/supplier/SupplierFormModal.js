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
  Alert,
} from 'react-native';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Trash2,
  Check,
  Truck,
} from 'lucide-react-native';
import { supplierService } from '../../services/supplierService';
import { showAlert } from '../../utils/alert';

const POPULAR_BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI', 'BSI', 'CIMB'];

export default function SupplierFormModal({
  visible,
  supplier,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(supplier?.id);

  // Form states
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  // Reset or fill form on modal open
  useEffect(() => {
    if (supplier) {
      setName(supplier.name || '');
      setContactPerson(supplier.contact_person || '');
      setPhone(supplier.phone || '');
      setEmail(supplier.email || '');
      setAddress(supplier.address || '');
      setBankName(supplier.bank_name || '');
      setBankAccount(supplier.bank_account || '');
      setBankHolder(supplier.bank_holder || '');
      setNotes(supplier.notes || '');
      setIsActive(supplier.is_active !== undefined ? Boolean(supplier.is_active) : true);
    } else {
      setName('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setAddress('');
      setBankName('');
      setBankAccount('');
      setBankHolder('');
      setNotes('');
      setIsActive(true);
    }
    setErrors({});
  }, [supplier, visible]);

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama perusahaan atau distributor wajib diisi.';
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8) {
        errs.phone = 'Nomor telepon/sales minimal 8 digit.';
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
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        bank_name: bankName.trim() || null,
        bank_account: bankAccount.trim() || null,
        bank_holder: bankHolder.trim() || null,
        notes: notes.trim() || null,
        is_active: isActive,
      };

      let result;
      if (isEditMode) {
        result = await supplierService.updateSupplier(supplier.id, payload);
        showAlert('Sukses', `Data pemasok "${result.name}" berhasil diperbarui.`);
      } else {
        result = await supplierService.createSupplier(payload);
        showAlert('Sukses', `Pemasok "${result.name}" berhasil didaftarkan.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan data pemasok.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!supplier?.id) return;

    const executeDelete = async () => {
      try {
        setDeleting(true);
        await supplierService.deleteSupplier(supplier.id);
        showAlert('Sukses', `Data pemasok "${supplier.name}" berhasil dihapus.`);
        onSuccess();
        onClose();
      } catch (err) {
        showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus pemasok.');
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(
          `Apakah Anda yakin ingin menghapus pemasok "${supplier.name}"?\nRiwayat pasokan sebelumnya tetap tersimpan.`
        );
        if (confirmed) {
          executeDelete();
        }
      }
    } else {
      Alert.alert(
        'Hapus Pemasok?',
        `Apakah Anda yakin ingin menghapus pemasok "${supplier.name}"? Riwayat transaksi kulakan dan pasokan barang tetap aman tersimpan.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: executeDelete,
          },
        ]
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <Truck size={18} color="#fb923c" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Data Pemasok' : 'Tambah Pemasok Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Distributor & Rekening Transfer Kulakan
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Form Body Scrollable */}
          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* SECTION 1: Identitas Distributor */}
            <Text style={styles.sectionHeader}>INFORMASI PERUSAHAAN / DISTRIBUTOR</Text>

            {/* Nama Pemasok (Wajib) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Building2 size={13} color="#fb923c" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Nama Perusahaan / Distributor *</Text>
              </View>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Contoh: PT Sumber Pangan Sejahtera, CV Berkah"
                placeholderTextColor="#71717a"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                }}
              />
              {Boolean(errors.name) && (
                <Text style={styles.errorInlineText}>
                  {Array.isArray(errors.name) ? errors.name[0] : errors.name}
                </Text>
              )}
            </View>

            {/* Contact Person (PIC) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <User size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Contact Person / Sales PIC</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Budi Santoso (Sales Area)"
                placeholderTextColor="#71717a"
                value={contactPerson}
                onChangeText={setContactPerson}
              />
            </View>

            {/* Nomor Telepon / WA */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Phone size={13} color="#34d399" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Nomor Telepon / WhatsApp</Text>
              </View>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                placeholder="Contoh: 081234567890"
                placeholderTextColor="#71717a"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                }}
              />
              {Boolean(errors.phone) && (
                <Text style={styles.errorInlineText}>
                  {Array.isArray(errors.phone) ? errors.phone[0] : errors.phone}
                </Text>
              )}
            </View>

            {/* Email Perusahaan */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Mail size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Alamat Email</Text>
              </View>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Contoh: order@sumberpangan.com"
                placeholderTextColor="#71717a"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                }}
              />
              {Boolean(errors.email) && (
                <Text style={styles.errorInlineText}>
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </Text>
              )}
            </View>

            {/* Alamat Gudang / Kantor */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <MapPin size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Alamat Kantor / Gudang Distributor</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Contoh: Kawasan Industri Pergudangan Blok C No. 12"
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={2}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* SECTION 2: Rekening Bank Transfer */}
            <Text style={styles.sectionHeader}>INFORMASI REKENING PEMBAYARAN KULAKAN</Text>

            {/* Nama Bank */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <CreditCard size={13} color="#fb923c" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Nama Bank</Text>
              </View>
              {/* Quick Bank Chips */}
              <View style={styles.bankChipsRow}>
                {POPULAR_BANKS.map((b) => {
                  const isSelected = bankName.toUpperCase() === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                      onPress={() => setBankName(b)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.bankChipText, isSelected && styles.bankChipTextSelected]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Atau ketik nama bank lain..."
                placeholderTextColor="#71717a"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            {/* Nomor Rekening */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nomor Rekening</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: 1234567890"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                value={bankAccount}
                onChangeText={setBankAccount}
              />
            </View>

            {/* Nama Pemilik Rekening */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Atas Nama Pemilik Rekening</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: PT Sumber Pangan Sejahtera"
                placeholderTextColor="#71717a"
                value={bankHolder}
                onChangeText={setBankHolder}
              />
            </View>

            {/* SECTION 3: Status & Catatan */}
            <Text style={styles.sectionHeader}>STATUS & CATATAN KERJASAMA</Text>

            {/* Status Aktif */}
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Status Pemasok Aktif</Text>
                <Text style={styles.switchDesc}>
                  Pemasok aktif dapat dipilih saat mencatat mutasi restock barang masuk
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: '#3f3f46', true: '#ea580c' }}
                thumbColor={isActive ? '#fb923c' : '#a1a1aa'}
              />
            </View>

            {/* Catatan / Ketentuan Tempo */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <FileText size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Catatan / Termin Pembayaran</Text>
              </View>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Contoh: Tempo 14 hari, minimum order Rp 1.000.000"
                placeholderTextColor="#71717a"
                multiline
                numberOfLines={2}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            {isEditMode && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={submitting || deleting}
                activeOpacity={0.7}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#f87171" />
                ) : (
                  <>
                    <Trash2 size={16} color="#f87171" />
                    <Text style={styles.deleteBtnText}>Hapus</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting || deleting}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting || deleting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Check size={16} color="#09090b" />
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Daftarkan Pemasok'}
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '92%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    flexShrink: 0,
  },
  formScroll: {
    maxHeight: 520,
  },
  formScrollContent: {
    padding: 16,
    gap: 14,
  },
  sectionHeader: {
    color: '#fb923c',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 6,
    marginBottom: 2,
  },
  fieldGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    color: '#e4e4e7',
    fontSize: 13,
    fontWeight: '600',
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
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorInlineText: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 2,
  },
  bankChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  bankChip: {
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  bankChipSelected: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    borderColor: '#fb923c',
  },
  bankChipText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600',
  },
  bankChipTextSelected: {
    color: '#fb923c',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#121215',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  switchInfo: {
    flex: 1,
    minWidth: 0,
  },
  switchLabel: {
    color: '#f4f4f5',
    fontSize: 13,
    fontWeight: '600',
  },
  switchDesc: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 'auto',
  },
  deleteBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    color: '#d4d4d8',
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fb923c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '700',
  },
});
