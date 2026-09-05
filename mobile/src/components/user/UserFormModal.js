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
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Trash2,
} from 'lucide-react-native';
import { userService } from '../../services/userService';
import { showAlert } from '../../utils/alert';

export default function UserFormModal({
  visible,
  user,
  currentUserId,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(user?.id);
  const isSelf = String(user?.id) === String(currentUserId);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('cashier'); // 'cashier' | 'owner'
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setRole(user.role || 'cashier');
      setPassword('');
      setIsActive(user.is_active !== undefined ? Boolean(user.is_active) : true);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRole('cashier');
      setPassword('');
      setIsActive(true);
    }
    setShowPassword(false);
    setErrors({});
  }, [user, visible]);

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama lengkap staf wajib diisi.';
    }

    if (!email.trim()) {
      errs.email = 'Alamat email wajib diisi.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Format alamat email tidak valid.';
      }
    }

    if (phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      if (cleanPhone.length < 8) {
        errs.phone = 'Nomor telepon minimal 8 digit.';
      }
    }

    if (!isEditMode) {
      if (!password) {
        errs.password = 'Kata sandi / PIN wajib diisi untuk staf baru.';
      } else if (password.length < 6) {
        errs.password = 'Kata sandi minimal 6 karakter.';
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
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        role: role,
        is_active: isSelf ? true : isActive,
      };

      if (!isEditMode) {
        payload.password = password;
      }

      let result;
      if (isEditMode) {
        result = await userService.updateUser(user.id, payload);
        showAlert('Sukses', `Data staf "${result.name}" berhasil diperbarui.`);
      } else {
        result = await userService.createUser(payload);
        showAlert('Sukses', `Staf baru "${result.name}" berhasil didaftarkan.`);
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      }
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan data staf.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!user?.id) return;
    if (isSelf) {
      showAlert('Akses Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
      return;
    }

    const executeDelete = async () => {
      try {
        setDeleting(true);
        await userService.deleteUser(user.id);
        showAlert('Sukses', `Akun staf "${user.name}" berhasil dihapus.`);
        onSuccess();
        onClose();
      } catch (err) {
        showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus akun staf.');
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm) {
        const confirmed = window.confirm(
          `Apakah Anda yakin ingin menghapus akun staf "${user.name}"?\nData transaksi masa lalu yang diproses tetap aman tersimpan.`
        );
        if (confirmed) {
          executeDelete();
        }
      }
    } else {
      Alert.alert(
        'Hapus Akun Staf?',
        `Apakah Anda yakin ingin menghapus staf "${user.name}"? Data transaksi penjualan kasir ini tetap aman tersimpan.`,
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

  if (!visible) return null;

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
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          {/* Drag Handle Bar (Native Bottom Sheet Pattern) */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <User size={18} color="#fb7185" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Data Pengguna' : 'Tambah Staf Kasir Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Kelola Akun, Hak Akses & PIN Staf
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            {/* SECTION 1: Identitas Profil */}
            <Text style={styles.sectionHeader}>INFORMASI PROFIL STAF</Text>

            {/* Nama Lengkap */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <User size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>
                  Nama Lengkap <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>
              <TextInput
                style={[styles.input, Boolean(errors.name) && styles.inputError]}
                placeholder="Contoh: Budi Santoso"
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

            {/* Alamat Email (Login Username) */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Mail size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>
                  Email (ID Login) <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>
              <TextInput
                style={[styles.input, Boolean(errors.email) && styles.inputError]}
                placeholder="Contoh: kasir1@kasirkita.id"
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

            {/* Nomor Telepon */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Phone size={13} color="#a1a1aa" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Nomor WhatsApp / Kontak</Text>
              </View>
              <TextInput
                style={[styles.input, Boolean(errors.phone) && styles.inputError]}
                placeholder="Contoh: 08123456789"
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

            {/* SECTION 2: Hak Akses & Peran */}
            <Text style={styles.sectionHeader}>PERAN & HAK AKSES SISTEM</Text>

            {/* Role Picker Segment */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <ShieldCheck size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>Peran Akun Pengguna</Text>
              </View>
              <View style={styles.roleSegmentContainer}>
                {/* Cashier Option */}
                <TouchableOpacity
                  style={[
                    styles.roleOptionCard,
                    role === 'cashier' && styles.roleOptionCardSelected,
                    isSelf && styles.roleOptionCardDisabled,
                  ]}
                  onPress={() => !isSelf && setRole('cashier')}
                  disabled={isSelf}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleOptionTop}>
                    <Text
                      style={[
                        styles.roleOptionTitle,
                        role === 'cashier' && styles.roleOptionTitleSelected,
                      ]}
                    >
                      Kasir
                    </Text>
                    {role === 'cashier' && (
                      <View style={styles.selectedCheckWrap}>
                        <Check size={12} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.roleOptionDesc}>
                    Akses operasional POS, transaksi penjualan, dan cetak struk kasir.
                  </Text>
                </TouchableOpacity>

                {/* Owner Option */}
                <TouchableOpacity
                  style={[
                    styles.roleOptionCard,
                    role === 'owner' && styles.roleOptionCardSelectedOwner,
                    isSelf && styles.roleOptionCardDisabled,
                  ]}
                  onPress={() => !isSelf && setRole('owner')}
                  disabled={isSelf}
                  activeOpacity={0.7}
                >
                  <View style={styles.roleOptionTop}>
                    <Text
                      style={[
                        styles.roleOptionTitle,
                        role === 'owner' && styles.roleOptionTitleSelectedOwner,
                      ]}
                    >
                      Pemilik (Owner)
                    </Text>
                    {role === 'owner' && (
                      <View style={styles.selectedCheckWrapOwner}>
                        <Check size={12} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.roleOptionDesc}>
                    Akses penuh ke seluruh laporan, kelola master data, dan pengaturan toko.
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Input (Only when creating new user) */}
            {!isEditMode && (
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Lock size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                  <Text style={styles.fieldLabel}>
                    Kata Sandi Awal <Text style={styles.requiredStar}>*</Text>
                  </Text>
                </View>
                <View style={styles.passwordInputWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, Boolean(errors.password) && styles.inputError]}
                    placeholder="Minimal 6 karakter"
                    placeholderTextColor="#71717a"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? <EyeOff size={18} color="#a1a1aa" /> : <Eye size={18} color="#a1a1aa" />}
                  </TouchableOpacity>
                </View>
                {Boolean(errors.password) && (
                  <Text style={styles.errorInlineText}>
                    {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                  </Text>
                )}
              </View>
            )}

            {/* Status Aktif Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>Status Akun Aktif</Text>
                <Text style={styles.switchSubtitle}>
                  {isActive
                    ? 'Akun dapat masuk dan memproses transaksi kasir.'
                    : 'Akses login staf dibekukan sementara.'}
                </Text>
              </View>
              <Switch
                value={isActive}
                onValueChange={(val) => !isSelf && setIsActive(val)}
                disabled={isSelf}
                trackColor={{ false: '#3f3f46', true: '#e11d48' }}
                thumbColor={isActive ? '#fb7185' : '#a1a1aa'}
              />
            </View>

            {/* Danger Zone: Hapus Pengguna (Edit Mode & bukan diri sendiri) */}
            {isEditMode && !isSelf && (
              <View style={styles.dangerZoneBox}>
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
                      <Text style={styles.deleteBtnFullText}>Hapus Akun Staf</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Sticky Modal Footer: Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting || deleting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting || deleting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Daftarkan Staf'}
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
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '92%',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 4,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  headerTextGroup: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  formScroll: {
    paddingHorizontal: 18,
  },
  formScrollContent: {
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 6,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  requiredStar: {
    color: '#fb7185',
  },
  input: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: '#f4f4f5',
    fontSize: 13,
  },
  inputError: {
    borderColor: '#f87171',
  },
  passwordInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 42,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorInlineText: {
    fontSize: 12,
    color: '#f87171',
    marginTop: 4,
    marginLeft: 2,
  },
  roleSegmentContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOptionCard: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 12,
  },
  roleOptionCardSelected: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
  },
  roleOptionCardSelectedOwner: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  roleOptionCardDisabled: {
    opacity: 0.5,
  },
  roleOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  roleOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#a1a1aa',
  },
  roleOptionTitleSelected: {
    color: '#34d399',
  },
  roleOptionTitleSelectedOwner: {
    color: '#fb7185',
  },
  selectedCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckWrapOwner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOptionDesc: {
    fontSize: 12,
    color: '#71717a',
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  switchSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  dangerZoneBox: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  deleteBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.3)',
    backgroundColor: 'rgba(248, 113, 113, 0.08)',
  },
  deleteBtnFullText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#e11d48',
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
