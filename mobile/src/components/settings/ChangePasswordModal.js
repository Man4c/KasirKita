import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  KeyRound,
  X,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import api from '../../services/api';

export default function ChangePasswordModal({
  visible,
  onClose,
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState('');
  const [passwordFormSuccess, setPasswordFormSuccess] = useState('');

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordFormError('');
      setPasswordFormSuccess('');
    }
  }, [visible]);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      setPasswordFormError('Masukkan kata sandi saat ini.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFormError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFormError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setPasswordFormError('');
    setSavingPassword(true);
    try {
      const res = await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.data && res.data.success) {
        setPasswordFormSuccess('Kata sandi berhasil diubah!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengubah kata sandi.';
      setPasswordFormError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <View style={styles.headerIconBox}>
                <KeyRound size={18} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Ganti Kata Sandi</Text>
                <Text style={styles.modalSubtitle}>Tingkatkan keamanan akun kasir Anda</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            {passwordFormError ? (
              <View style={styles.inlineErrorBox}>
                <CircleAlert size={14} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.inlineErrorText}>{passwordFormError}</Text>
              </View>
            ) : null}

            {passwordFormSuccess ? (
              <View style={[styles.inlineErrorBox, styles.inlineSuccessBox]}>
                <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
                <Text style={[styles.inlineErrorText, { color: '#34d399' }]}>{passwordFormSuccess}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kata Sandi Saat Ini *</Text>
              <View style={[styles.passwordInputRow, passwordFormError ? styles.inputErrorBorder : null]}>
                <TextInput
                  style={styles.passwordTextInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Masukkan sandi saat ini..."
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} color="#a1a1aa" />
                  ) : (
                    <Eye size={18} color="#a1a1aa" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Kata Sandi Baru * (Min. 6 Karakter)</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  style={styles.passwordTextInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Masukkan sandi baru..."
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  {showNewPassword ? (
                    <EyeOff size={18} color="#a1a1aa" />
                  ) : (
                    <Eye size={18} color="#a1a1aa" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Konfirmasi Kata Sandi Baru *</Text>
              <View style={styles.passwordInputRow}>
                <TextInput
                  style={styles.passwordTextInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Ulangi sandi baru..."
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#a1a1aa" />
                  ) : (
                    <Eye size={18} color="#a1a1aa" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleChangePassword}
              activeOpacity={0.8}
              disabled={savingPassword}
            >
              {savingPassword ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Perbarui Sandi</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 14,
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  closeBtn: {
    padding: 4,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  inlineSuccessBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  inlineErrorText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fb7185',
    flex: 1,
  },
  inputErrorBorder: {
    borderColor: '#fb7185',
  },
  formGroup: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    marginBottom: 6,
  },
  passwordInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
  },
  passwordTextInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  eyeBtn: {
    padding: 6,
    flexShrink: 0,
    marginLeft: 6,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e11d48',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
});
