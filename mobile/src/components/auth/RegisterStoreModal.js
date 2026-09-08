import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Store,
  User,
  Phone,
  Mail,
  Lock,
  MapPin,
  X,
  Check,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  UtensilsCrossed,
  Wrench,
  HelpCircle,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const BUSINESS_TYPES = [
  { id: 'retail', label: 'Ritel / Toko', icon: ShoppingBag, desc: 'Sembako, kelontong, baju, aksesoris' },
  { id: 'fnb', label: 'F&B / Kuliner', icon: UtensilsCrossed, desc: 'Cafe, resto, warung makan, kedai kopi' },
  { id: 'service', label: 'Jasa / Servis', icon: Wrench, desc: 'Bengkel, salon, laundry, cuci mobil' },
  { id: 'other', label: 'Lainnya', icon: HelpCircle, desc: 'Usaha umum lainnya' },
];

export default function RegisterStoreModal({ visible, onClose, apiUrl = null }) {
  const { registerStore } = useAuth();
  const scrollViewRef = useRef(null);

  const [storeName, setStoreName] = useState('');
  const [businessType, setBusinessType] = useState('retail');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resetForm = () => {
    setStoreName('');
    setBusinessType('retail');
    setOwnerName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setAddress('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const triggerError = (msg) => {
    setError(msg);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      triggerError('Nama toko wajib diisi.');
      return;
    }
    if (!ownerName.trim()) {
      triggerError('Nama pemilik toko wajib diisi.');
      return;
    }
    if (!phone.trim()) {
      triggerError('Nomor WhatsApp / HP wajib diisi.');
      return;
    }
    if (!email.trim()) {
      triggerError('Email akun wajib diisi.');
      return;
    }
    if (!password || password.length < 6) {
      triggerError('Kata sandi minimal 6 karakter.');
      return;
    }

    setError('');
    setLoading(true);

    const payload = {
      store_name: storeName.trim(),
      business_type: businessType,
      owner_name: ownerName.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      password,
      address: address.trim() || null,
    };

    const res = await registerStore(payload, apiUrl);

    if (!res.success) {
      triggerError(res.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalBackdrop}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.sheetContainer}>
          {/* Drag Handle Bar */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Sparkles size={20} color="#fb7185" />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={styles.headerTitle}>Buka Toko Baru</Text>
                <Text style={styles.headerSubtitle}>Gratis coba 14 hari penuh • Langsung siap jualan</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <X size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Error Box */}
            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#fb7185" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Trial Guarantee Callout */}
            <View style={styles.trialCallout}>
              <Text style={styles.trialCalloutTitle}>🎉 Uji Coba Gratis Tanpa Komitmen</Text>
              <Text style={styles.trialCalloutText}>
                Semua fitur POS, master produk, transaksi kasir, dan laporan dapat langsung Anda gunakan tanpa kartu kredit.
              </Text>
            </View>

            {/* 1. Nama Toko */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Toko / Usaha <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.inputRow}>
                <Store size={16} color="#fb7185" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Toko Berkah Jaya, Cafe Kopi Senja"
                  placeholderTextColor="#71717a"
                  value={storeName}
                  onChangeText={setStoreName}
                />
              </View>
            </View>

            {/* 2. Jenis Usaha (Quick Chips) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jenis Usaha (Untuk Template Kategori & Satuan)</Text>
              <View style={styles.businessTypeGrid}>
                {BUSINESS_TYPES.map((bt) => {
                  const isSelected = businessType === bt.id;
                  const IconComp = bt.icon;
                  return (
                    <TouchableOpacity
                      key={bt.id}
                      style={[styles.typeChip, isSelected && styles.typeChipActive]}
                      onPress={() => setBusinessType(bt.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.typeIconBox, isSelected && styles.typeIconBoxActive]}>
                        <IconComp size={16} color={isSelected ? '#ffffff' : '#a1a1aa'} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.typeLabel, isSelected && styles.typeLabelActive]} numberOfLines={1}>
                          {bt.label}
                        </Text>
                        <Text style={styles.typeDesc} numberOfLines={1}>
                          {bt.desc}
                        </Text>
                      </View>
                      {isSelected ? (
                        <View style={styles.checkCircle}>
                          <Check size={11} color="#ffffff" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 3. Nama Pemilik */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Pemilik (Owner) <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.inputRow}>
                <User size={16} color="#fb7185" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor="#71717a"
                  value={ownerName}
                  onChangeText={setOwnerName}
                />
              </View>
            </View>

            {/* 4. Nomor WhatsApp */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nomor WhatsApp / HP <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.inputRow}>
                <Phone size={16} color="#fb7185" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="081234567890"
                  placeholderTextColor="#71717a"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* 5. Email Akun */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Akun Login <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.inputRow}>
                <Mail size={16} color="#fb7185" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="owner@toko.com"
                  placeholderTextColor="#71717a"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* 6. Kata Sandi */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kata Sandi (Minimal 6 Karakter) <Text style={styles.requiredMark}>*</Text></Text>
              <View style={styles.inputRow}>
                <Lock size={16} color="#fb7185" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1, minWidth: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#71717a"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#a1a1aa" />
                  ) : (
                    <Eye size={18} color="#a1a1aa" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* 7. Alamat Toko (Opsional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Alamat Toko (Opsional)</Text>
              <View style={styles.inputRow}>
                <MapPin size={16} color="#a1a1aa" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Jl. Pasar Baru No. 10, Kota"
                  placeholderTextColor="#71717a"
                  value={address}
                  onChangeText={setAddress}
                />
              </View>
            </View>
          </ScrollView>

          {/* Inline Footer Error Bar */}
          {error ? (
            <View style={styles.footerErrorBar}>
              <AlertCircle size={14} color="#fb7185" style={{ marginRight: 8, flexShrink: 0 }} />
              <Text style={styles.footerErrorText} numberOfLines={2}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Sticky Bottom Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View style={styles.submitContent}>
                  <Text style={styles.submitBtnText}>Daftar & Buka Toko</Text>
                  <Sparkles size={16} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#09090b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '92%',
    display: 'flex',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  scrollBody: {
    flexShrink: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#fb7185',
    flex: 1,
    includeFontPadding: false,
  },
  trialCallout: {
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.2)',
    borderRadius: 12,
    padding: 14,
  },
  trialCalloutTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#fb7185',
    marginBottom: 4,
    includeFontPadding: false,
  },
  trialCalloutText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#d4d4d8',
    lineHeight: 18,
    includeFontPadding: false,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
  },
  requiredMark: {
    color: '#fb7185',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  inputIcon: {
    marginRight: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#f4f4f5',
    minHeight: 44,
    paddingVertical: 8,
  },
  eyeBtn: {
    padding: 6,
    flexShrink: 0,
  },
  businessTypeGrid: {
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 10,
    gap: 10,
    minHeight: 48,
  },
  typeChipActive: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  typeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  typeIconBoxActive: {
    backgroundColor: '#e11d48',
  },
  typeLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#f4f4f5',
    includeFontPadding: false,
  },
  typeLabelActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_600SemiBold',
  },
  typeDesc: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
    backgroundColor: '#09090b',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  submitBtn: {
    flex: 1.8,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  footerErrorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(225, 29, 72, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  footerErrorText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#fb7185',
    flex: 1,
    includeFontPadding: false,
    lineHeight: 16,
  },
});
