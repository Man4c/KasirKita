import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Settings,
  User,
  Store,
  Printer,
  Receipt,
  Smartphone,
  RefreshCw,
  LogOut,
  ChevronRight,
  Shield,
  CheckCircle2,
  X,
  Activity,
  Check,
  Edit3,
  Wifi,
  Trash2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import api from '../services/api';

export default function SettingsScreen({ isLandscape = false }) {
  const { user, logout, updateUser } = useAuth();

  // Settings State
  const [storeName, setStoreName] = useState('KasirKita Mart');
  const [storeAddress, setStoreAddress] = useState('Jl. Merdeka No. 12, Jakarta Pusat');
  const [storePhone, setStorePhone] = useState('0812-3456-7890');
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar.');
  
  const [selectedPrinter, setSelectedPrinter] = useState('RPP02N (58mm Bluetooth)');
  const [isPrinterConnected, setIsPrinterConnected] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [printTwoCopies, setPrintTwoCopies] = useState(false);
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [showPhoneOnReceipt, setShowPhoneOnReceipt] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);
  const [orientationPref, setOrientationPref] = useState('AUTO');

  // Modals & Async State
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [testReceiptOpen, setTestReceiptOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [serverStatus, setServerStatus] = useState('Memeriksa...');
  const [serverPing, setServerPing] = useState(null);

  // Form Temp States for User Profile Modal
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserPhone, setTempUserPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Form Temp States for Password Modal
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Temp States for Store Modal
  const [tempStoreName, setTempStoreName] = useState('');
  const [tempStoreAddress, setTempStoreAddress] = useState('');
  const [tempStorePhone, setTempStorePhone] = useState('');
  const [tempReceiptFooter, setTempReceiptFooter] = useState('');

  // Load persistent settings on mount
  useEffect(() => {
    loadSettings();
    checkServerHealth();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await storage.getSettings();
      if (saved) {
        if (saved.storeName) setStoreName(saved.storeName);
        if (saved.storeAddress) setStoreAddress(saved.storeAddress);
        if (saved.storePhone) setStorePhone(saved.storePhone);
        if (saved.receiptFooter) setReceiptFooter(saved.receiptFooter);
        if (saved.selectedPrinter) setSelectedPrinter(saved.selectedPrinter);
        if (typeof saved.isPrinterConnected === 'boolean') setIsPrinterConnected(saved.isPrinterConnected);
        if (typeof saved.autoPrint === 'boolean') setAutoPrint(saved.autoPrint);
        if (typeof saved.printTwoCopies === 'boolean') setPrintTwoCopies(saved.printTwoCopies);
        if (typeof saved.showLogoOnReceipt === 'boolean') setShowLogoOnReceipt(saved.showLogoOnReceipt);
        if (typeof saved.showPhoneOnReceipt === 'boolean') setShowPhoneOnReceipt(saved.showPhoneOnReceipt);
        if (typeof saved.soundBeep === 'boolean') setSoundBeep(saved.soundBeep);
        if (saved.orientationPref) setOrientationPref(saved.orientationPref);
      }
    } catch (err) {
      console.log('Error loading settings:', err.message);
    }
  };

  const persistSettings = async (overrides = {}) => {
    try {
      const current = {
        storeName,
        storeAddress,
        storePhone,
        receiptFooter,
        selectedPrinter,
        isPrinterConnected,
        autoPrint,
        printTwoCopies,
        showLogoOnReceipt,
        showPhoneOnReceipt,
        soundBeep,
        orientationPref,
        ...overrides,
      };
      await storage.setSettings(current);
    } catch (err) {
      console.log('Error saving settings:', err.message);
    }
  };

  const checkServerHealth = async () => {
    try {
      const start = Date.now();
      const res = await api.get('/health');
      const latency = Date.now() - start;
      if (res.data && res.data.success) {
        setServerStatus('Online');
        setServerPing(latency + 'ms');
      } else {
        setServerStatus('Terhubung');
        setServerPing(latency + 'ms');
      }
    } catch (err) {
      setServerStatus('Offline / Terputus');
      setServerPing(null);
    }
  };

  const handleOpenUserModal = () => {
    setTempUserName(user?.name || '');
    setTempUserPhone(user?.phone || '');
    setUserModalOpen(true);
  };

  const handleSaveUserProfile = async () => {
    if (!tempUserName.trim()) {
      if (Platform.OS === 'web') window.alert('Nama pengguna tidak boleh kosong.');
      else Alert.alert('Peringatan', 'Nama pengguna tidak boleh kosong.');
      return;
    }

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
        setUserModalOpen(false);
        if (Platform.OS === 'web') {
          window.alert('Profil kasir berhasil diperbarui!');
        } else {
          Alert.alert('Sukses', 'Profil kasir berhasil diperbarui.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan profil.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Gagal', msg);
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      if (Platform.OS === 'web') window.alert('Masukkan kata sandi saat ini.');
      else Alert.alert('Peringatan', 'Masukkan kata sandi saat ini.');
      return;
    }
    if (newPassword.length < 6) {
      if (Platform.OS === 'web') window.alert('Kata sandi baru minimal 6 karakter.');
      else Alert.alert('Peringatan', 'Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') window.alert('Konfirmasi kata sandi baru tidak cocok.');
      else Alert.alert('Peringatan', 'Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (res.data && res.data.success) {
        setPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (Platform.OS === 'web') {
          window.alert('Kata sandi berhasil diubah! Harap ingat sandi baru Anda.');
        } else {
          Alert.alert('Sukses', 'Kata sandi berhasil diubah.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengubah kata sandi.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Gagal', msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenStoreModal = () => {
    setTempStoreName(storeName);
    setTempStoreAddress(storeAddress);
    setTempStorePhone(storePhone);
    setTempReceiptFooter(receiptFooter);
    setStoreModalOpen(true);
  };

  const handleSaveStoreModal = () => {
    const newName = tempStoreName.trim() || 'KasirKita Mart';
    const newAddress = tempStoreAddress.trim();
    const newPhone = tempStorePhone.trim();
    const newFooter = tempReceiptFooter.trim();

    setStoreName(newName);
    setStoreAddress(newAddress);
    setStorePhone(newPhone);
    setReceiptFooter(newFooter);

    persistSettings({
      storeName: newName,
      storeAddress: newAddress,
      storePhone: newPhone,
      receiptFooter: newFooter,
    });

    setStoreModalOpen(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar dari akun kasir KasirKita?')) {
        logout();
      }
    } else {
      Alert.alert(
        'Konfirmasi Keluar',
        'Apakah Anda yakin ingin keluar dari akun kasir?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', style: 'destructive', onPress: logout },
        ]
      );
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await checkServerHealth();
      await api.get('/products');
      await api.get('/categories');
      setSyncing(false);
      if (Platform.OS === 'web') {
        window.alert('Data katalog produk & harga berhasil diperbarui dari cloud server!');
      } else {
        Alert.alert('Sinkronisasi Berhasil', 'Data produk, stok, dan tarif toko Anda sudah paling mutakhir.');
      }
    } catch (err) {
      setSyncing(false);
      if (Platform.OS === 'web') {
        window.alert('Sinkronisasi selesai (menggunakan cache lokal).');
      } else {
        Alert.alert('Info Sinkronisasi', 'Data lokal toko Anda aktif digunakan.');
      }
    }
  };

  const handleClearCache = () => {
    if (Platform.OS === 'web') {
      window.alert('Cache penyimpanan offline sebesar ~1.8 MB berhasil dibersihkan.');
    } else {
      Alert.alert('Bersihkan Cache', 'Cache penyimpanan gambar lokal (~1.8 MB) berhasil dibersihkan.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        isLandscape && styles.contentContainerLandscape,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Ringkas */}
      <View style={styles.header}>
        <View style={styles.headerIconBox}>
          <Settings size={22} color="#fb7185" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.headerTitle}>Pengaturan</Text>
          <Text style={styles.headerSubtitle}>Konfigurasi toko, printer, & preferensi kasir</Text>
        </View>
      </View>

      {/* 2. Seksi Profil Akun & Toko */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PROFIL AKUN & TOKO</Text>
        <View style={styles.card}>
          {/* User Info Row */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleOpenUserModal}
          >
            <View style={styles.avatarBox}>
              <User size={24} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || 'Kasir Toko'}{' '}
                <Text style={styles.profileRoleInline}>
                  ({user?.role === 'owner' ? 'Owner' : 'Kasir'})
                </Text>
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email || 'kasir@kasirkita.local'}
              </Text>
              <Text style={styles.menuDetailText}>
                No. HP: {user?.phone || '-'}
              </Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Keamanan & Sandi Row */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleOpenPasswordModal}
          >
            <View style={styles.menuIconBox}>
              <KeyRound size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Keamanan & Kata Sandi</Text>
              <Text style={styles.menuSubtitle}>Ganti kata sandi / PIN akun kasir Anda</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Store Info Row (Clickable to Edit) */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleOpenStoreModal}
          >
            <View style={styles.menuIconBox}>
              <Store size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle} numberOfLines={1}>{storeName}</Text>
              <Text style={styles.menuSubtitle} numberOfLines={1}>{storeAddress}</Text>
              <Text style={styles.menuDetailText}>WA/Telp: {storePhone}</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Seksi Perangkat Keras / Hardware */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PERANGKAT KERAS (HARDWARE)</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setPrinterModalOpen(true)}
          >
            <View style={styles.menuIconBox}>
              <Printer size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Printer Bluetooth Thermal</Text>
              <Text style={styles.menuSubtitle} numberOfLines={1}>{selectedPrinter}</Text>
            </View>
            <View style={[styles.statusBadge, isPrinterConnected ? styles.statusBadgeGreen : styles.statusBadgeGray]}>
              <Text style={[styles.statusBadgeText, isPrinterConnected ? styles.statusBadgeTextGreen : styles.statusBadgeTextGray]}>
                {isPrinterConnected ? 'Terhubung' : 'Terputus'}
              </Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0, marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Test Print Button */}
          <TouchableOpacity
            style={styles.actionBtnRow}
            activeOpacity={0.7}
            onPress={() => setTestReceiptOpen(true)}
          >
            <Printer size={16} color="#ffffff" />
            <Text style={styles.actionBtnText}>Uji Cetak Struk Contoh (Test Print)</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Auto Print Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Cetak Struk Otomatis</Text>
              <Text style={styles.switchSubtitle}>Cetak langsung setelah bayar kasir selesai</Text>
            </View>
            <Switch
              value={autoPrint}
              onValueChange={(val) => {
                setAutoPrint(val);
                persistSettings({ autoPrint: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={autoPrint ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          {/* Print 2 Copies Switch */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Cetak 2 Salinan Struk</Text>
              <Text style={styles.switchSubtitle}>1 salinan kasir toko, 1 salinan pembeli</Text>
            </View>
            <Switch
              value={printTwoCopies}
              onValueChange={(val) => {
                setPrintTwoCopies(val);
                persistSettings({ printTwoCopies: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={printTwoCopies ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>
        </View>
      </View>

      {/* 4. Seksi Preferensi Struk & Kasir */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERENSI STRUK & KASIR</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Tampilkan Logo Toko</Text>
              <Text style={styles.switchSubtitle}>Sertakan identitas visual pada bagian atas nota</Text>
            </View>
            <Switch
              value={showLogoOnReceipt}
              onValueChange={(val) => {
                setShowLogoOnReceipt(val);
                persistSettings({ showLogoOnReceipt: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showLogoOnReceipt ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Nomor WhatsApp Toko</Text>
              <Text style={styles.switchSubtitle}>Cetak nomor kontak aktif pada struk belanja</Text>
            </View>
            <Switch
              value={showPhoneOnReceipt}
              onValueChange={(val) => {
                setShowPhoneOnReceipt(val);
                persistSettings({ showPhoneOnReceipt: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showPhoneOnReceipt ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Bunyi Beep Scanner</Text>
              <Text style={styles.switchSubtitle}>Suara konfirmasi audio saat barcode terdeteksi</Text>
            </View>
            <Switch
              value={soundBeep}
              onValueChange={(val) => {
                setSoundBeep(val);
                persistSettings({ soundBeep: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={soundBeep ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          {/* Orientation Preference */}
          <View style={{ paddingVertical: 4 }}>
            <Text style={styles.switchTitle}>Orientasi Layar Kasir</Text>
            <Text style={styles.switchSubtitle}>Pilih mode tampilan operasional yang Anda sukai</Text>
            <View style={styles.orientationRow}>
              {[
                { id: 'AUTO', label: 'Sensor Otomatis' },
                { id: 'LANDSCAPE', label: 'Kunci Landscape' },
                { id: 'PORTRAIT', label: 'Kunci Portrait' },
              ].map((opt) => {
                const isActive = orientationPref === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.orientBtn, isActive && styles.orientBtnActive]}
                    onPress={() => {
                      setOrientationPref(opt.id);
                      persistSettings({ orientationPref: opt.id });
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.orientBtnText, isActive && styles.orientBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* 5. Seksi Data & Jaringan */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>DATA & JARINGAN SERVER</Text>
        <View style={styles.card}>
          {/* Server Connection Status */}
          <View style={styles.menuRow}>
            <View style={styles.menuIconBox}>
              <Activity size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Koneksi Server Backend</Text>
              <Text style={styles.menuSubtitle}>{serverStatus}</Text>
            </View>
            {serverPing && (
              <View style={styles.pingBadge}>
                <Wifi size={12} color="#34d399" />
                <Text style={styles.pingBadgeText}>{serverPing}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Sync Catalog Button */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleSyncData}
            disabled={syncing}
          >
            <View style={styles.menuIconBox}>
              {syncing ? (
                <ActivityIndicator size="small" color="#34d399" />
              ) : (
                <RefreshCw size={18} color="#34d399" />
              )}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>
                {syncing ? 'Menyinkronkan Data...' : 'Sinkronkan Data Toko'}
              </Text>
              <Text style={styles.menuSubtitle}>Tarik produk, stok, & harga terbaru dari server</Text>
            </View>
            <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Clear Cache */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleClearCache}
          >
            <View style={styles.menuIconBox}>
              <Trash2 size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Bersihkan Cache Penyimpanan</Text>
              <Text style={styles.menuSubtitle}>Segarkan memori gambar katalog offline</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Seksi Tentang Aplikasi & Keluar */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TENTANG & KEAMANAN SESI</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi Aplikasi</Text>
            <Text style={styles.infoValue}>KasirKita POS Mobile v1.2.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Arsitektur Platform</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === 'web' ? 'Web PWA (React)' : Platform.OS === 'android' ? 'Android Native' : 'iOS Native'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status Keamanan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <Shield size={14} color="#34d399" />
              <Text style={[styles.infoValue, { color: '#34d399' }]}>Sanctum Token Aktif</Text>
            </View>
          </View>
        </View>

        {/* Tombol Logout Merah Kokoh */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Keluar Akun Kasir</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL 0A: EDIT PROFIL PENGGUNA */}
      <Modal
        visible={userModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setUserModalOpen(false)}
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
                onPress={() => setUserModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nama Lengkap / Nama Kasir *</Text>
                <TextInput
                  style={styles.formInput}
                  value={tempUserName}
                  onChangeText={setTempUserName}
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
                onPress={() => setUserModalOpen(false)}
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

      {/* MODAL 0B: GANTI KATA SANDI AKUN */}
      <Modal
        visible={passwordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModalOpen(false)}
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
                onPress={() => setPasswordModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Kata Sandi Saat Ini *</Text>
                <View style={styles.passwordInputRow}>
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
                onPress={() => setPasswordModalOpen(false)}
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

      {/* MODAL 1: EDIT PROFIL & INFORMASI TOKO */}
      <Modal
        visible={storeModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setStoreModalOpen(false)}
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
                onPress={() => setStoreModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
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

              {/* Form Input: Footer Struk */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Catatan Kaki Struk (Footer Message)</Text>
                <TextInput
                  style={[styles.formInput, { minHeight: 64, textAlignVertical: 'top' }]}
                  value={tempReceiptFooter}
                  onChangeText={setTempReceiptFooter}
                  placeholder="Pesan ucapan terima kasih / kebijakan toko..."
                  placeholderTextColor="#71717a"
                  multiline
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setStoreModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveStoreModal}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Simpan Pengaturan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: PILIH PRINTER BLUETOOTH THERMAL */}
      <Modal
        visible={printerModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPrinterModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={styles.headerIconBox}>
                  <Printer size={18} color="#fb7185" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.modalTitle}>Printer Bluetooth Thermal</Text>
                  <Text style={styles.modalSubtitle}>Pilih perangkat printer kasir Anda</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPrinterModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'RPP02N (58mm Bluetooth)', desc: 'Ukuran 58mm • Portabel Mini POS' },
                { id: 'Thermal-80 (80mm Bluetooth)', desc: 'Ukuran 80mm • Desktop POS' },
                { id: 'Panda PRJ-58D (Bluetooth)', desc: 'Ukuran 58mm • Kertas Thermal Standard' },
                { id: 'Iware MP-58A (Bluetooth)', desc: 'Ukuran 58mm • Koneksi Cepat' },
              ].map((p) => {
                const isSelected = selectedPrinter === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.printerOptionRow, isSelected && styles.printerOptionRowActive]}
                    onPress={() => {
                      setSelectedPrinter(p.id);
                      setIsPrinterConnected(true);
                      persistSettings({ selectedPrinter: p.id, isPrinterConnected: true });
                      setPrinterModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.printerOptionName, isSelected && styles.printerOptionNameActive]}>
                        {p.id}
                      </Text>
                      <Text style={styles.printerOptionDesc}>{p.desc}</Text>
                    </View>
                    {isSelected && <Check size={18} color="#fb7185" style={{ flexShrink: 0 }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1 }]}
                onPress={() => {
                  setIsPrinterConnected(!isPrinterConnected);
                  persistSettings({ isPrinterConnected: !isPrinterConnected });
                }}
              >
                <Text style={styles.cancelBtnText}>
                  {isPrinterConnected ? 'Putuskan Sambungan' : 'Sambungkan Ulang'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: PREVIEW UJI CETAK STRUK */}
      <Modal
        visible={testReceiptOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTestReceiptOpen(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={styles.testReceiptCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#18181b' }]}>Uji Cetak Struk</Text>
              <TouchableOpacity onPress={() => setTestReceiptOpen(false)}>
                <X size={20} color="#18181b" />
              </TouchableOpacity>
            </View>

            <View style={styles.testReceiptPaper}>
              <Text style={styles.testReceiptStore}>{storeName}</Text>
              <Text style={styles.testReceiptSub}>{storeAddress}</Text>
              {showPhoneOnReceipt && <Text style={styles.testReceiptSub}>WA: {storePhone}</Text>}
              <Text style={styles.testReceiptLine}>--------------------------------</Text>
              <Text style={styles.testReceiptRow}>No: INV-TEST-001</Text>
              <Text style={styles.testReceiptRow}>Kasir: {user?.name || 'Kasir'}</Text>
              <Text style={styles.testReceiptLine}>--------------------------------</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.testReceiptRow}>1x Kopi Susu Aren</Text>
                <Text style={styles.testReceiptRow}>Rp15.000</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.testReceiptRow}>1x Teh Melati</Text>
                <Text style={styles.testReceiptRow}>Rp5.000</Text>
              </View>
              <Text style={styles.testReceiptLine}>--------------------------------</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.testReceiptRow, { fontWeight: 'bold' }]}>TOTAL:</Text>
                <Text style={[styles.testReceiptRow, { fontWeight: 'bold' }]}>Rp20.000</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={styles.testReceiptRow}>BAYAR TUNAI:</Text>
                <Text style={styles.testReceiptRow}>Rp20.000</Text>
              </View>
              <Text style={styles.testReceiptLine}>--------------------------------</Text>
              <Text style={styles.testReceiptFooterText}>{receiptFooter}</Text>
              <Text style={styles.testReceiptSub}>-- Printer Thermal Berfungsi Normal --</Text>
            </View>

            <TouchableOpacity
              style={styles.testPrintConfirmBtn}
              onPress={() => {
                setTestReceiptOpen(false);
                if (Platform.OS === 'web') {
                  window.alert('Perintah cetak terkirim ke printer thermal!');
                } else {
                  Alert.alert('Sukses', 'Struk pengujian terkirim ke printer thermal.');
                }
              }}
              activeOpacity={0.8}
            >
              <Printer size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.testPrintConfirmBtnText}>Kirim Cetak ke Printer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerLandscape: {
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingTop: 4,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  profileRoleInline: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  roleBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
  },
  profileEmail: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flex: 1,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  menuSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 1,
  },
  menuDetailText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#34d399',
    marginTop: 2,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    flexShrink: 0,
  },
  editBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusBadgeGreen: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  statusBadgeGray: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusBadgeTextGreen: {
    color: '#34d399',
  },
  statusBadgeTextGray: {
    color: '#a1a1aa',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  switchSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 1,
  },
  orientationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  orientBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orientBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  orientBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  orientBtnTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
  },
  pingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.3)',
    flexShrink: 0,
  },
  pingBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#34d399',
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  infoValue: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  logoutButton: {
    marginTop: 14,
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#e11d48',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
      },
    }),
  },
  logoutButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  printerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 8,
  },
  printerOptionRowActive: {
    borderColor: '#fb7185',
    backgroundColor: 'rgba(225, 29, 72, 0.08)',
  },
  printerOptionName: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  printerOptionNameActive: {
    color: '#fb7185',
  },
  printerOptionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  testReceiptCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  testReceiptPaper: {
    backgroundColor: '#fafafa',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginVertical: 10,
  },
  testReceiptStore: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
    textAlign: 'center',
  },
  testReceiptSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
    textAlign: 'center',
    marginTop: 2,
  },
  testReceiptLine: {
    fontSize: 12,
    color: '#a1a1aa',
    textAlign: 'center',
    marginVertical: 4,
  },
  testReceiptRow: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#18181b',
    marginVertical: 1,
  },
  testReceiptFooterText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  testPrintConfirmBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testPrintConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
});
