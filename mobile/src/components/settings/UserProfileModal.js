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
  User,
  X,
  Check,
  CircleAlert,
} from 'lucide-react-native';
import api from '../../services/api';

export default function UserProfileModal({
  visible,
  onClose,
  user,
  updateUser,
}) {
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserPhone, setTempUserPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  useEffect(() => {
    if (visible && user) {
      setTempUserName(user.name || '');
      setTempUserPhone(user.phone || '');
      setUserFormError('');
    }
  }, [visible, user]);

  const handleSaveUserProfile = async () => {
    if (!tempUserName.trim()) {
      setUserFormError('Nama lengkap pengguna wajib diisi.');
      return;
    }

    setUserFormError('');
    setSavingUser(true);
    try {
      const res = await api.put('/auth/profile', {
        name: tempUserName.trim(),
        phone: tempUserPhone.trim() || null,
      });

      if (res.data && res.data.success) {
        if (updateUser) {
          updateUser(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan profil.';
      setUserFormError(msg);
    } finally {
      setSavingUser(false);
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
                <User size={18} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Ubah Profil Pengguna</Text>
                <Text style={styles.modalSubtitle}>Perbarui nama dan kontak akun kasir Anda</Text>
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
            {userFormError ? (
              <View style={styles.inlineErrorBox}>
                <CircleAlert size={14} color="#fb7185" style={{ flexShrink: 0 }} />
                <Text style={styles.inlineErrorText}>{userFormError}</Text>
              </View>
            ) : null}

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Lengkap / Nama Kasir *</Text>
              <TextInput
                style={[styles.formInput, userFormError ? styles.inputErrorBorder : null]}
                value={tempUserName}
                onChangeText={(val) => {
                  setTempUserName(val);
                  if (userFormError) setUserFormError('');
                }}
                placeholder="Nama kasir Anda..."
                placeholderTextColor="#71717a"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nomor HP / WhatsApp Aktif</Text>
              <TextInput
                style={styles.formInput}
                value={tempUserPhone}
                onChangeText={setTempUserPhone}
                placeholder="0812-xxxx-xxxx"
                placeholderTextColor="#71717a"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Terdaftar (Hanya Baca)</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: '#18181b', color: '#a1a1aa' }]}
                value={user?.email || ''}
                editable={false}
              />
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
              onPress={handleSaveUserProfile}
              activeOpacity={0.8}
              disabled={savingUser}
            >
              {savingUser ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Simpan Perubahan</Text>
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
  formInput: {
    backgroundColor: '#09090b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
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
