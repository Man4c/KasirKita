import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Store,
  X,
  Check,
  Image as ImageIcon,
  Upload,
} from 'lucide-react-native';
import api from '../../services/api';
import { showAlert } from '../../utils/alert';

export default function StoreIdentityModal({
  visible,
  onClose,
  storeSettings,
  onSaveSuccess,
  isOwner = false,
}) {
  const [tempStoreName, setTempStoreName] = useState('');
  const [tempStoreAddress, setTempStoreAddress] = useState('');
  const [tempStorePhone, setTempStorePhone] = useState('');
  const [tempReceiptFooter, setTempReceiptFooter] = useState('');
  const [tempStoreLogo, setTempStoreLogo] = useState(null);
  const [tempShowLogoOnReceipt, setTempShowLogoOnReceipt] = useState(true);
  const [tempShowPhoneOnReceipt, setTempShowPhoneOnReceipt] = useState(true);
  const [savingStore, setSavingStore] = useState(false);

  useEffect(() => {
    if (visible && storeSettings) {
      setTempStoreName(storeSettings.storeName || '');
      setTempStoreAddress(storeSettings.storeAddress || '');
      setTempStorePhone(storeSettings.storePhone || '');
      setTempReceiptFooter(storeSettings.receiptFooter || '');
      setTempStoreLogo(storeSettings.storeLogo || null);
      setTempShowLogoOnReceipt(typeof storeSettings.showLogoOnReceipt === 'boolean' ? storeSettings.showLogoOnReceipt : true);
      setTempShowPhoneOnReceipt(typeof storeSettings.showPhoneOnReceipt === 'boolean' ? storeSettings.showPhoneOnReceipt : true);
    }
  }, [visible, storeSettings]);

  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk memilih foto logo toko.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setTempStoreLogo(uri);
      }
    } catch (err) {
      console.warn('Gagal memilih logo:', err);
      showAlert('Gagal', 'Terjadi kendala saat membuka galeri gambar.');
    }
  };

  const handleRemoveLogo = () => {
    setTempStoreLogo(null);
  };

  const handleSave = async () => {
    const newName = tempStoreName.trim() || 'KasirKita Mart';
    const newAddress = tempStoreAddress.trim();
    const newPhone = tempStorePhone.trim();
    const newFooter = tempReceiptFooter.trim();

    const updatedData = {
      storeName: newName,
      storeAddress: newAddress,
      storePhone: newPhone,
      receiptFooter: newFooter,
      storeLogo: tempStoreLogo,
      showLogoOnReceipt: tempShowLogoOnReceipt,
      showPhoneOnReceipt: tempShowPhoneOnReceipt,
    };

    setSavingStore(true);
    try {
      if (isOwner) {
        await api.put('/settings/store', {
          name: newName,
          address: newAddress,
          phone: newPhone,
          logo: tempStoreLogo,
          receipt_footer: newFooter,
          show_logo_on_receipt: tempShowLogoOnReceipt,
          show_phone_on_receipt: tempShowPhoneOnReceipt,
        });
      }

      await onSaveSuccess(updatedData);
      onClose();
    } catch (err) {
      const isNetworkErr = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network');
      if (isNetworkErr) {
        console.warn('Gagal menyimpan ke server cloud (offline), menyimpan ke cache lokal:', err.message);
        await onSaveSuccess(updatedData);
        onClose();
      } else {
        const errMsg = err.response?.data?.message || 'Gagal menyimpan pengaturan toko ke server.';
        showAlert('Gagal Menyimpan', errMsg);
      }
    } finally {
      setSavingStore(false);
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
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <View style={styles.headerIconBox}>
                <Store size={18} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Informasi Toko & Struk</Text>
                <Text style={styles.modalSubtitle}>Kustomisasi data toko yang dicetak pada struk</Text>
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

          <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
            {/* Form Input: Logo Toko */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Logo Toko untuk Struk</Text>
              <View style={styles.logoPickerContainer}>
                {tempStoreLogo ? (
                  <View style={styles.logoPreviewWrapper}>
                    <Image source={{ uri: tempStoreLogo }} style={styles.logoPreviewImage} resizeMode="contain" />
                    <TouchableOpacity
                      style={styles.logoRemoveBadge}
                      onPress={handleRemoveLogo}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={12} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.logoEmptyBox}>
                    <ImageIcon size={28} color="#a1a1aa" />
                  </View>
                )}

                <View style={styles.logoInfoCol}>
                  <TouchableOpacity
                    style={styles.uploadLogoBtn}
                    onPress={handlePickLogo}
                    activeOpacity={0.8}
                  >
                    <Upload size={14} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.uploadLogoBtnText}>
                      {tempStoreLogo ? 'Ganti Logo dari Galeri' : 'Pilih Logo dari Galeri'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.logoHelpText}>
                    Format persegi 1:1 (PNG/JPG transparan)
                  </Text>
                </View>
              </View>
            </View>

            {/* Form Input: Nama Toko */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nama Usaha / Toko *</Text>
              <TextInput
                style={styles.formInput}
                value={tempStoreName}
                onChangeText={setTempStoreName}
                placeholder="Nama toko Anda..."
                placeholderTextColor="#71717a"
              />
            </View>

            {/* Form Input: Alamat */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Alamat Toko</Text>
              <TextInput
                style={styles.formInput}
                value={tempStoreAddress}
                onChangeText={setTempStoreAddress}
                placeholder="Alamat lengkap toko..."
                placeholderTextColor="#71717a"
              />
            </View>

            {/* Form Input: Nomor WhatsApp */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nomor WhatsApp / Telepon Toko</Text>
              <TextInput
                style={styles.formInput}
                value={tempStorePhone}
                onChangeText={setTempStorePhone}
                placeholder="0812-xxxx-xxxx"
                placeholderTextColor="#71717a"
                keyboardType="phone-pad"
              />
            </View>

            {/* Form Input: Pesan Penutup Struk */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Pesan Penutup Struk Belanja</Text>
              <TextInput
                style={[styles.formInput, { minHeight: 64, textAlignVertical: 'top' }]}
                value={tempReceiptFooter}
                onChangeText={setTempReceiptFooter}
                placeholder="Contoh: Terima kasih atas kunjungan Anda..."
                placeholderTextColor="#71717a"
                multiline
              />
            </View>

            <View style={styles.divider} />

            {/* Co-located Receipt Toggles */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Tampilkan Logo Toko di Struk</Text>
                <Text style={styles.switchSubtitle}>Cetak lambang ikon toko di baris teratas nota</Text>
              </View>
              <Switch
                value={tempShowLogoOnReceipt}
                onValueChange={setTempShowLogoOnReceipt}
                trackColor={{ false: '#27272a', true: '#e11d48' }}
                thumbColor={tempShowLogoOnReceipt ? '#fb7185' : '#71717a'}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                <Text style={styles.switchTitle}>Tampilkan No. WhatsApp di Struk</Text>
                <Text style={styles.switchSubtitle}>Cetak kontak WhatsApp toko untuk pesanan antar</Text>
              </View>
              <Switch
                value={tempShowPhoneOnReceipt}
                onValueChange={setTempShowPhoneOnReceipt}
                trackColor={{ false: '#27272a', true: '#e11d48' }}
                thumbColor={tempShowPhoneOnReceipt ? '#fb7185' : '#71717a'}
              />
            </View>
          </ScrollView>

          {/* Modal Actions */}
          <View style={styles.modalActionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, savingStore && { opacity: 0.8 }]}
              onPress={handleSave}
              disabled={savingStore}
              activeOpacity={0.8}
            >
              {savingStore ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Menyimpan ke Cloud...</Text>
                </>
              ) : (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
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
  logoPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#09090b',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
  },
  logoPreviewWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoPreviewImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  logoRemoveBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#09090b',
  },
  logoEmptyBox: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#18181b',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoInfoCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 6,
  },
  uploadLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  uploadLogoBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  logoHelpText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  switchSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 1,
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
