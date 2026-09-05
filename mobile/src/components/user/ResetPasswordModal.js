import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
} from 'lucide-react-native';
import { userService } from '../../services/userService';
import { showAlert } from '../../utils/alert';

export default function ResetPasswordModal({
  visible,
  user,
  onClose,
  onSuccess,
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
  }, [user, visible]);

  const handleSubmit = async () => {
    if (!password) {
      setError('Kata sandi baru wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await userService.resetPassword(user.id, password);
      showAlert(
        'PIN Berhasil Direset',
        `Kata sandi untuk staf "${user.name}" telah diperbarui. Sesi login lama kasir otomatis dicabut demi keamanan.`
      );
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal mereset kata sandi staf.');
    } finally {
      setSubmitting(false);
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
          {/* Drag Handle Bar */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconWrap}>
                <KeyRound size={18} color="#fb7185" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Reset Kata Sandi / PIN
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Staf: {user?.name || 'Kasir'} ({user?.email || '-'})
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

          {/* Body Content */}
          <View style={styles.modalBody}>
            {/* Warning Banner */}
            <View style={styles.warningBox}>
              <AlertTriangle size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
              <Text style={styles.warningText}>
                Mereset kata sandi akan langsung mencabut sesi login staf ini. Staf wajib masuk ulang menggunakan kata sandi baru.
              </Text>
            </View>

            {/* Input Kata Sandi Baru */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Lock size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>
                  Kata Sandi Baru <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>
              <View style={styles.passwordInputWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Minimal 6 karakter"
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (error) setError('');
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
            </View>

            {/* Input Konfirmasi Kata Sandi */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Lock size={13} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.fieldLabel}>
                  Konfirmasi Kata Sandi Baru <Text style={styles.requiredStar}>*</Text>
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ulangi kata sandi baru"
                placeholderTextColor="#71717a"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={(t) => {
                  setConfirmPassword(t);
                  if (error) setError('');
                }}
              />
            </View>

            {Boolean(error) && (
              <Text style={styles.errorInlineText}>{error}</Text>
            )}
          </View>

          {/* Sticky Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Simpan Kata Sandi</Text>
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
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#fbbf24',
    lineHeight: 16,
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
    marginTop: 2,
    marginBottom: 8,
    marginLeft: 2,
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
