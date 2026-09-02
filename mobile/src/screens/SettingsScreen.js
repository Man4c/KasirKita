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
  Linking,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
  MessageCircle,
  BookOpen,
  CircleAlert,
  Info,
  Image as ImageIcon,
  Upload,
  Camera,
  Layers,
  Bluetooth,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import api from '../services/api';
import ReceiptView from '../components/ReceiptView';
import { offlineStorage } from '../services/offlineStorage';
import { syncManager } from '../services/syncManager';
import { printerService } from '../services/printerService';
import { orientationService } from '../services/orientationService';
import appConfig from '../../app.json';

const APP_VERSION = appConfig?.expo?.version || '1.3.0';

export default function SettingsScreen({ isLandscape = false }) {
  const { user, logout, updateUser } = useAuth();

  // Settings State
  const [storeName, setStoreName] = useState('KasirKita Mart');
  const [storeAddress, setStoreAddress] = useState('Jl. Merdeka No. 12, Jakarta Pusat');
  const [storePhone, setStorePhone] = useState('0812-3456-7890');
  const [storeLogo, setStoreLogo] = useState(null);
  const [receiptFooter, setReceiptFooter] = useState('Terima kasih atas kunjungan Anda! Barang yang dibeli tidak dapat ditukar.');
  
  const [selectedPrinter, setSelectedPrinter] = useState('Panda PRJ-58D (Mode Simulasi)');
  const [isPrinterConnected, setIsPrinterConnected] = useState(true);
  const [paperSize, setPaperSize] = useState('58mm');
  const [isScanningBluetooth, setIsScanningBluetooth] = useState(false);
  const [isPhysicalPrinter, setIsPhysicalPrinter] = useState(false);
  const [autoPrint, setAutoPrint] = useState(false);
  const [printTwoCopies, setPrintTwoCopies] = useState(false);
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [showPhoneOnReceipt, setShowPhoneOnReceipt] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);
  const [showCustomerPicker, setShowCustomerPicker] = useState(true);
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
  const [cacheSize, setCacheSize] = useState('...');
  const [securityModalOpen, setSecurityModalOpen] = useState(false);

  // Form Temp States for User Profile Modal
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserPhone, setTempUserPhone] = useState('');
  const [savingUser, setSavingUser] = useState(false);
  const [userFormError, setUserFormError] = useState('');

  // Form Temp States for Password Modal
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormError, setPasswordFormError] = useState('');
  const [passwordFormSuccess, setPasswordFormSuccess] = useState('');

  // Form Temp States for Store Modal
  const [tempStoreName, setTempStoreName] = useState('');
  const [tempStoreAddress, setTempStoreAddress] = useState('');
  const [tempStorePhone, setTempStorePhone] = useState('');
  const [tempReceiptFooter, setTempReceiptFooter] = useState('');
  const [tempStoreLogo, setTempStoreLogo] = useState(null);
  const [tempShowLogoOnReceipt, setTempShowLogoOnReceipt] = useState(true);
  const [tempShowPhoneOnReceipt, setTempShowPhoneOnReceipt] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isSyncingOffline, setIsSyncingOffline] = useState(false);

  // Guide Modal State
  const [printerGuideOpen, setPrinterGuideOpen] = useState(false);

  // Load persistent settings on mount
  useEffect(() => {
    loadSettings();
    checkServerHealth();
    syncManager.init();

    const unsubscribe = syncManager.subscribe((state) => {
      setPendingOfflineCount(state.pendingCount);
      setIsSyncingOffline(state.isSyncing);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      // 1. Initial fast load from local offline storage
      const saved = await storage.getSettings();
      if (saved) {
        if (saved.storeName) setStoreName(saved.storeName);
        if (saved.storeAddress) setStoreAddress(saved.storeAddress);
        if (saved.storePhone) setStorePhone(saved.storePhone);
        if (saved.storeLogo) setStoreLogo(saved.storeLogo);
        if (saved.receiptFooter) setReceiptFooter(saved.receiptFooter);
        if (saved.selectedPrinter) setSelectedPrinter(saved.selectedPrinter);
        if (typeof saved.isPrinterConnected === 'boolean') setIsPrinterConnected(saved.isPrinterConnected);
        if (typeof saved.autoPrint === 'boolean') setAutoPrint(saved.autoPrint);
        if (typeof saved.printTwoCopies === 'boolean') setPrintTwoCopies(saved.printTwoCopies);
        if (typeof saved.showLogoOnReceipt === 'boolean') setShowLogoOnReceipt(saved.showLogoOnReceipt);
        if (typeof saved.showPhoneOnReceipt === 'boolean') setShowPhoneOnReceipt(saved.showPhoneOnReceipt);
        if (typeof saved.soundBeep === 'boolean') setSoundBeep(saved.soundBeep);
        if (typeof saved.showCustomerPicker === 'boolean') setShowCustomerPicker(saved.showCustomerPicker);
        if (saved.orientationPref) {
          setOrientationPref(saved.orientationPref);
          orientationService.applyPreference(saved.orientationPref);
        }
        if (saved.paperSize) {
          setPaperSize(saved.paperSize);
          printerService.setPaperSize(saved.paperSize);
        }
        await printerService.init();
      }

      // 1b. Calculate actual offline cache size
      try {
        const sz = await offlineStorage.getFormattedCacheSize();
        setCacheSize(sz);
      } catch (e) {
        setCacheSize('0 KB');
      }

      // 2. Fetch and synchronize latest store identity from Cloud backend
      const res = await api.get('/settings/store');
      if (res.data?.success && res.data?.data) {
        const cloud = res.data.data;
        if (cloud.name) setStoreName(cloud.name);
        if (cloud.address !== undefined) setStoreAddress(cloud.address || '');
        if (cloud.phone !== undefined) setStorePhone(cloud.phone || '');
        if (cloud.logo !== undefined) setStoreLogo(cloud.logo);
        if (cloud.receipt_footer !== undefined) setReceiptFooter(cloud.receipt_footer || '');
        if (typeof cloud.show_logo_on_receipt === 'boolean') setShowLogoOnReceipt(cloud.show_logo_on_receipt);
        if (typeof cloud.show_phone_on_receipt === 'boolean') setShowPhoneOnReceipt(cloud.show_phone_on_receipt);

        // Cache cloud identity to local storage
        await storage.setSettings({
          ...(saved || {}),
          storeName: cloud.name,
          storeAddress: cloud.address || '',
          storePhone: cloud.phone || '',
          storeLogo: cloud.logo,
          receiptFooter: cloud.receipt_footer || '',
          showLogoOnReceipt: cloud.show_logo_on_receipt,
          showPhoneOnReceipt: cloud.show_phone_on_receipt,
        });
      }
    } catch (err) {
      console.log('Error loading settings from cloud:', err.message);
    }
  };

  const persistSettings = async (overrides = {}) => {
    try {
      const current = {
        storeName,
        storeAddress,
        storePhone,
        storeLogo,
        receiptFooter,
        selectedPrinter,
        isPrinterConnected,
        autoPrint,
        printTwoCopies,
        showLogoOnReceipt,
        showPhoneOnReceipt,
        soundBeep,
        showCustomerPicker,
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
    setUserFormError('');
    setUserModalOpen(true);
  };

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
        setUserModalOpen(false);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan profil.';
      setUserFormError(msg);
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
    setPasswordFormError('');
    setPasswordFormSuccess('');
    setPasswordModalOpen(true);
  };

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
          setPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordFormSuccess('');
        }, 1000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mengubah kata sandi.';
      setPasswordFormError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleOpenStoreModal = () => {
    setTempStoreName(storeName);
    setTempStoreAddress(storeAddress);
    setTempStorePhone(storePhone);
    setTempReceiptFooter(receiptFooter);
    setTempStoreLogo(storeLogo);
    setTempShowLogoOnReceipt(showLogoOnReceipt);
    setTempShowPhoneOnReceipt(showPhoneOnReceipt);
    setStoreModalOpen(true);
  };

  const handlePickLogo = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        if (Platform.OS === 'web') {
          window.alert('Izin akses galeri diperlukan untuk memilih logo toko.');
        } else {
          Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk memilih foto logo toko.');
        }
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
      if (Platform.OS === 'web') {
        window.alert('Gagal membuka galeri gambar.');
      } else {
        Alert.alert('Gagal', 'Terjadi kendala saat membuka galeri gambar.');
      }
    }
  };

  const handleRemoveLogo = () => {
    setTempStoreLogo(null);
  };

  const handleSaveStoreModal = async () => {
    const newName = tempStoreName.trim() || 'KasirKita Mart';
    const newAddress = tempStoreAddress.trim();
    const newPhone = tempStorePhone.trim();
    const newFooter = tempReceiptFooter.trim();

    setSavingStore(true);
    try {
      // 1. If user is owner, sync to Cloud backend
      if (user?.role === 'owner') {
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

      // 2. Update local state
      setStoreName(newName);
      setStoreAddress(newAddress);
      setStorePhone(newPhone);
      setReceiptFooter(newFooter);
      setStoreLogo(tempStoreLogo);
      setShowLogoOnReceipt(tempShowLogoOnReceipt);
      setShowPhoneOnReceipt(tempShowPhoneOnReceipt);

      // 3. Persist locally to storage
      await persistSettings({
        storeName: newName,
        storeAddress: newAddress,
        storePhone: newPhone,
        receiptFooter: newFooter,
        storeLogo: tempStoreLogo,
        showLogoOnReceipt: tempShowLogoOnReceipt,
        showPhoneOnReceipt: tempShowPhoneOnReceipt,
      });

      setStoreModalOpen(false);
    } catch (err) {
      console.warn('Gagal menyimpan ke server cloud:', err.message);
      // Fallback local update
      setStoreName(newName);
      setStoreAddress(newAddress);
      setStorePhone(newPhone);
      setReceiptFooter(newFooter);
      setStoreLogo(tempStoreLogo);
      setShowLogoOnReceipt(tempShowLogoOnReceipt);
      setShowPhoneOnReceipt(tempShowPhoneOnReceipt);

      await persistSettings({
        storeName: newName,
        storeAddress: newAddress,
        storePhone: newPhone,
        receiptFooter: newFooter,
        storeLogo: tempStoreLogo,
        showLogoOnReceipt: tempShowLogoOnReceipt,
        showPhoneOnReceipt: tempShowPhoneOnReceipt,
      });

      setStoreModalOpen(false);
    } finally {
      setSavingStore(false);
    }
  };

  const handleOpenWhatsAppSupport = () => {
    const phone = '6281234567890';
    const text = encodeURIComponent('Halo Tim Bantuan KasirKita, saya butuh panduan terkait operasional kasir / printer.');
    const url = `https://wa.me/${phone}?text=${text}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') window.open(url, '_blank');
      else Alert.alert('Bantuan CS', 'Silakan hubungi WhatsApp CS KasirKita di: +62 812-3456-7890');
    });
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
      const [prodRes, catRes, custRes, promoRes, taxFeeRes, storeRes] = await Promise.all([
        api.get('/products?is_active=true&per_page=100'),
        api.get('/categories'),
        api.get('/customers?all=true'),
        api.get('/discounts?status=active&all=true').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/taxes-and-fees?is_active=true').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/settings/store').catch(() => ({ data: { success: false, data: null } })),
      ]);

      const prods = prodRes.data.success ? prodRes.data.data.data : [];
      const cats = catRes.data.success ? catRes.data.data : [];
      const custs = custRes.data.success ? custRes.data.data : [];
      const promos = promoRes.data.success ? promoRes.data.data : [];
      const tfData = taxFeeRes.data.success ? taxFeeRes.data.data : [];

      // Save fresh catalog snapshot to local offline cache
      await offlineStorage.cacheCatalog({
        products: prods,
        categories: cats,
        customers: custs,
        promos,
        taxesAndFees: tfData,
      });

      if (storeRes.data?.success && storeRes.data?.data) {
        const cloud = storeRes.data.data;
        if (cloud.name) setStoreName(cloud.name);
        if (cloud.address !== undefined) setStoreAddress(cloud.address || '');
        if (cloud.phone !== undefined) setStorePhone(cloud.phone || '');
        if (cloud.logo !== undefined) setStoreLogo(cloud.logo);
        if (cloud.receipt_footer !== undefined) setReceiptFooter(cloud.receipt_footer || '');
        if (typeof cloud.show_logo_on_receipt === 'boolean') setShowLogoOnReceipt(cloud.show_logo_on_receipt);
        if (typeof cloud.show_phone_on_receipt === 'boolean') setShowPhoneOnReceipt(cloud.show_phone_on_receipt);
      }

      // Also sync any pending offline transactions
      const syncRes = await syncManager.syncPendingTransactions();

      setSyncing(false);
      const syncInfo = syncRes.synced > 0 ? ` serta ${syncRes.synced} nota offline berhasil terunggah.` : '.';
      if (Platform.OS === 'web') {
        window.alert(`Data toko & katalog offline berhasil disinkronkan dari cloud server${syncInfo}`);
      } else {
        Alert.alert('Sinkronisasi Berhasil', `Katalog offline dan pengaturan toko Anda sudah paling mutakhir${syncInfo}`);
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

  const handleSyncOfflineTransactions = async () => {
    setIsSyncingOffline(true);
    try {
      const result = await syncManager.syncPendingTransactions();
      if (result.success && result.synced > 0) {
        if (Platform.OS === 'web') {
          window.alert(`Berhasil mengunggah ${result.synced} nota transaksi offline ke server cloud!`);
        } else {
          Alert.alert('Sukses', `${result.synced} nota transaksi offline berhasil disinkronkan ke server cloud.`);
        }
      } else if (result.remaining === 0) {
        if (Platform.OS === 'web') {
          window.alert('Semua nota transaksi offline sudah tersinkronkan.');
        } else {
          Alert.alert('Info', 'Tidak ada antrean transaksi offline yang tertunda.');
        }
      } else {
        if (Platform.OS === 'web') {
          window.alert('Server backend belum dapat dijangkau. Periksa koneksi internet Anda.');
        } else {
          Alert.alert('Gagal', 'Server backend belum dapat dijangkau. Periksa koneksi internet Anda.');
        }
      }
    } finally {
      setIsSyncingOffline(false);
    }
  };

  const handleClearCache = async () => {
    let currentSize = cacheSize;
    try {
      currentSize = await offlineStorage.getFormattedCacheSize();
      setCacheSize(currentSize);
    } catch (e) {
      // keep fallback
    }

    const executeClear = async () => {
      await offlineStorage.clearCatalogCache();
      const updatedSize = await offlineStorage.getFormattedCacheSize();
      setCacheSize(updatedSize);
      if (Platform.OS === 'web') {
        window.alert('Cache katalog offline berhasil dibersihkan. Memori HP kini lebih lega dan katalog akan disegarkan otomatis dari server.');
      } else {
        Alert.alert('Sukses', 'Cache katalog offline berhasil dibersihkan. Memori HP kini lebih lega dan katalog akan disegarkan otomatis dari server.');
      }
    };

    const confirmMsg = `Ukuran cache saat ini: ${currentSize}.\n\nApakah Anda yakin ingin membersihkan data katalog sementara di HP? Pengaturan toko dan antrean nota kasir tetap aman.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        await executeClear();
      }
    } else {
      Alert.alert(
        'Bersihkan Cache Penyimpanan',
        confirmMsg,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Bersihkan',
            style: 'destructive',
            onPress: executeClear,
          },
        ]
      );
    }
  };

  const isOnline = serverStatus === 'Tersambung';
  const isNativeKeystore = Platform.OS !== 'web';
  const securityTitle = isOnline ? 'Terenkripsi & Aman' : 'Mode Offline (Aman)';
  const securityColor = isOnline ? '#6ee7b7' : '#fde68a';

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
        <Text style={styles.headerTitle}>Pengaturan</Text>
        <Text style={styles.headerSubtitle}>Konfigurasi toko, printer, & preferensi kasir</Text>
      </View>

      {/* 2. Seksi Akun Pengguna */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>AKUN PENGGUNA</Text>
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
        </View>
      </View>

      {/* 3. Seksi Identitas Toko */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>IDENTITAS TOKO</Text>
        <View style={styles.card}>
          {/* Store Info Row (Clickable to Edit) */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleOpenStoreModal}
          >
            <View style={styles.menuIconBox}>
              {storeLogo ? (
                <Image source={{ uri: storeLogo }} style={{ width: 26, height: 26, borderRadius: 6 }} resizeMode="contain" />
              ) : (
                <Store size={18} color="#fb7185" />
              )}
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
            <View style={[styles.statusBadge, isPrinterConnected ? (isPhysicalPrinter ? styles.statusBadgeGreen : styles.statusBadgeAmber) : styles.statusBadgeGray]}>
              <Text style={[styles.statusBadgeText, isPrinterConnected ? (isPhysicalPrinter ? styles.statusBadgeTextGreen : styles.statusBadgeTextAmber) : styles.statusBadgeTextGray]}>
                {isPrinterConnected ? (isPhysicalPrinter ? 'Bluetooth' : 'Simulasi') : 'Terputus'}
              </Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0, marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Pilihan Lebar Kertas Thermal */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <View style={{ marginBottom: 10 }}>
              <Text style={styles.switchTitle}>Lebar Kertas Thermal</Text>
              <Text style={styles.switchSubtitle}>Format baris nota otomatis disesuaikan</Text>
            </View>
            <View style={styles.paperSizeRow}>
              {[
                { id: '58mm', title: '58 mm', desc: 'Mini Portable', spec: 'Format 32 Kolom' },
                { id: '80mm', title: '80 mm', desc: 'Desktop POS', spec: 'Format 48 Kolom' },
              ].map((opt) => {
                const isActive = paperSize === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.paperSizeBtn, isActive && styles.paperSizeBtnActive]}
                    onPress={() => {
                      setPaperSize(opt.id);
                      printerService.setPaperSize(opt.id);
                      persistSettings({ paperSize: opt.id });
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paperSizeBtnHeader}>
                      <Text style={[styles.paperSizeTitle, isActive && styles.paperSizeTitleActive]}>
                        {opt.title}
                      </Text>
                      {isActive ? (
                        <View style={styles.paperSizeCheckCircle}>
                          <Check size={11} color="#ffffff" />
                        </View>
                      ) : (
                        <View style={styles.paperSizeEmptyCircle} />
                      )}
                    </View>
                    <Text style={[styles.paperSizeDesc, isActive && styles.paperSizeDescActive]}>
                      {opt.desc}
                    </Text>
                    <Text style={[styles.paperSizeSpec, isActive && styles.paperSizeSpecActive]}>
                      {opt.spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Test Print Button */}
          <TouchableOpacity
            style={styles.actionBtnRow}
            activeOpacity={0.7}
            onPress={async () => {
              await printerService.printSample({
                storeName,
                storeAddress,
                storePhone,
                storeLogo,
                receiptFooter,
                showPhoneOnReceipt,
              });
              setTestReceiptOpen(true);
            }}
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

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Pemilihan Pelanggan di Kasir</Text>
              <Text style={styles.switchSubtitle}>Tampilkan kartu pemilihan pelanggan/member saat checkout. Jika dimatikan, pembeli otomatis tercatat sebagai Pelanggan Umum</Text>
            </View>
            <Switch
              value={showCustomerPicker}
              onValueChange={(val) => {
                setShowCustomerPicker(val);
                persistSettings({ showCustomerPicker: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showCustomerPicker ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          {/* Orientation Preference */}
          <View style={{ paddingVertical: 4 }}>
            <Text style={styles.switchTitle}>Orientasi Layar Kasir</Text>
            <Text style={styles.switchSubtitle}>Pilih mode rotasi tampilan kasir yang Anda sukai</Text>
            <View style={styles.orientationRow}>
              {[
                { id: 'AUTO', label: 'Otomatis' },
                { id: 'LANDSCAPE', label: 'Landscape' },
                { id: 'PORTRAIT', label: 'Portrait' },
              ].map((opt) => {
                const isActive = orientationPref === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.orientBtn, isActive && styles.orientBtnActive]}
                    onPress={async () => {
                      setOrientationPref(opt.id);
                      persistSettings({ orientationPref: opt.id });
                      await orientationService.applyPreference(opt.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.orientBtnText, isActive && styles.orientBtnTextActive]} numberOfLines={1}>
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
                <Wifi size={12} color="#6ee7b7" />
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

          {/* Offline Transaction Queue Status */}
          <View style={styles.menuRow}>
            <View style={[styles.menuIconBox, { backgroundColor: pendingOfflineCount > 0 ? 'rgba(245, 158, 11, 0.15)' : '#27272a' }]}>
              <Layers size={18} color={pendingOfflineCount > 0 ? '#f59e0b' : '#a1a1aa'} />
            </View>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <Text style={styles.menuTitle}>Antrean Transaksi Offline</Text>
              <Text style={styles.menuSubtitle}>
                {pendingOfflineCount > 0
                  ? `${pendingOfflineCount} nota tersimpan di HP belum terunggah`
                  : 'Semua transaksi kasir sudah tersinkronkan ke cloud'}
              </Text>
            </View>
            {pendingOfflineCount > 0 ? (
              <TouchableOpacity
                style={styles.syncOfflineBtn}
                onPress={handleSyncOfflineTransactions}
                disabled={isSyncingOffline}
                activeOpacity={0.8}
              >
                {isSyncingOffline ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <RefreshCw size={12} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.syncOfflineBtnText}>Kirim</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
            )}
          </View>

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
              <Text style={styles.menuSubtitle}>Segarkan data & memori katalog offline</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Seksi Bantuan & Panduan Kasir */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>BANTUAN & PANDUAN KASIR</Text>
        <View style={styles.card}>
          {/* WhatsApp CS Button */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleOpenWhatsAppSupport}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
              <MessageCircle size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Layanan Bantuan CS WhatsApp</Text>
              <Text style={styles.menuSubtitle}>Bantuan cepat kendala operasional kasir & printer</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Printer Troubleshooting Guide */}
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => setPrinterGuideOpen(true)}
          >
            <View style={styles.menuIconBox}>
              <BookOpen size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Panduan Printer Bluetooth</Text>
              <Text style={styles.menuSubtitle}>Solusi cepat jika printer tidak mau mencetak</Text>
            </View>
            <ChevronRight size={18} color="#a1a1aa" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 7. Seksi Tentang Aplikasi & Keluar */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TENTANG APLIKASI & SESI</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi Aplikasi</Text>
            <Text style={styles.infoValue}>KasirKita POS Mobile v{APP_VERSION}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tipe Aplikasi</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === 'web' ? 'KasirKita Web POS' : Platform.OS === 'android' ? 'KasirKita Android POS' : 'KasirKita iOS POS'}
            </Text>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            activeOpacity={0.7}
            onPress={() => setSecurityModalOpen(true)}
          >
            <Text style={[styles.infoLabel, { flexShrink: 0 }]}>Status Keamanan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1, justifyContent: 'flex-end' }}>
              <Shield size={14} color={securityColor} style={{ flexShrink: 0 }} />
              <Text
                style={[styles.infoValue, { color: securityColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {securityTitle}
              </Text>
              <ChevronRight size={14} color="#71717a" style={{ flexShrink: 0, marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
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
                onPress={() => setStoreModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, savingStore && { opacity: 0.8 }]}
                onPress={handleSaveStoreModal}
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

            {/* Real Bluetooth Scan Action */}
            <TouchableOpacity
              style={[styles.scanBluetoothBtn, isScanningBluetooth && { opacity: 0.8 }]}
              onPress={async () => {
                if (!printerService.isWebBluetoothSupported()) {
                  if (Platform.OS === 'web') {
                    window.alert('Web Bluetooth memerlukan peramban Google Chrome atau Microsoft Edge dengan fitur Bluetooth aktif.');
                  } else {
                    Alert.alert(
                      'Koneksi Bluetooth Smartphone',
                      'Saat ini aplikasi dibuka melalui wadah uji coba Expo Go di HP Anda. Akses perangkat keras Bluetooth printer fisik (seperti Panda PRJ-58D atau RPP02N) akan otomatis aktif penuh saat aplikasi di-build menjadi file APK resmi toko Anda.\n\nUntuk latihan dan uji cetak saat ini, silakan pilih model printer di daftar bawah agar format kertas struk (58mm/80mm) disesuaikan.',
                      [{ text: 'Paham & Lanjutkan', style: 'default' }]
                    );
                  }
                  return;
                }

                setIsScanningBluetooth(true);
                try {
                  const res = await printerService.scanAndConnectWebBluetooth();
                  setSelectedPrinter(res.name);
                  setIsPrinterConnected(true);
                  setIsPhysicalPrinter(true);
                  setPrinterModalOpen(false);
                  if (Platform.OS === 'web') {
                    window.alert(`Berhasil terhubung ke printer fisik: ${res.name}`);
                  } else {
                    Alert.alert('Bluetooth Terhubung', `Printer ${res.name} berhasil dipasangkan dan siap mencetak.`);
                  }
                } catch (err) {
                  if (err.message && !err.message.includes('User cancelled')) {
                    Alert.alert('Gagal Memindai', err.message);
                  }
                } finally {
                  setIsScanningBluetooth(false);
                }
              }}
              disabled={isScanningBluetooth}
              activeOpacity={0.8}
            >
              {isScanningBluetooth ? (
                <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
              ) : (
                <Bluetooth size={16} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.scanBluetoothBtnText}>
                {isScanningBluetooth
                  ? 'Memindai Bluetooth...'
                  : Platform.OS === 'web'
                  ? 'Pindai Printer Bluetooth (Web Bluetooth)'
                  : 'Hubungkan Printer Bluetooth HP'}
              </Text>
            </TouchableOpacity>

            <View style={{ marginVertical: 10, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins_600SemiBold', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Preset / Mode Simulasi Virtual
              </Text>
              <Text style={{ fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#a1a1aa' }}>
                Pilih profil di bawah jika belum ada printer fisik:
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {[
                { id: 'Panda PRJ-58D (Bluetooth Thermal)', desc: 'Ukuran 58mm • Standar POS Ritel' },
                { id: 'RPP02N Mini POS (58mm)', desc: 'Ukuran 58mm • Mini Saku Bluetooth' },
                { id: 'Thermal-80 Desktop POS (80mm)', desc: 'Ukuran 80mm • Kasir Minimarket / Resto' },
                { id: 'Iware MP-58A (Bluetooth Thermal)', desc: 'Ukuran 58mm • Portabel UMKM' },
                { id: 'Printer Virtual Kasir (Simulasi)', desc: 'Cetak ke layar & dialog cetak printer biasa' },
              ].map((p) => {
                const isSelected = selectedPrinter === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.printerOptionRow, isSelected && styles.printerOptionRowActive]}
                    onPress={async () => {
                      await printerService.setSimulationMode(p.id);
                      setSelectedPrinter(p.id);
                      setIsPrinterConnected(true);
                      setIsPhysicalPrinter(false);
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

            <ScrollView style={{ maxHeight: 460, width: '100%' }} showsVerticalScrollIndicator={false}>
              <ReceiptView
                transaction={{
                  invoice_number: 'INV-TEST-001',
                  created_at: new Date().toISOString(),
                  customer_name: 'Pelanggan Umum',
                  cashier_name: user?.name || 'Kasir Toko',
                  items: [
                    { product_name: 'Beras Ramos 5kg', quantity: 1, subtotal: 68000 },
                    { product_name: 'Minyak Goreng 2L', quantity: 1, subtotal: 34000 },
                  ],
                  subtotal: 102000,
                  discount_amount: 0,
                  tax_amount: 0,
                  fee_amount: 0,
                  total_amount: 102000,
                  payment_method: 'CASH',
                  paid_amount: 102000,
                  change_amount: 0,
                }}
                storeSettings={{
                  storeName,
                  storeAddress,
                  storePhone,
                  storeLogo,
                  showLogoOnReceipt,
                  showPhoneOnReceipt,
                  receiptFooter,
                }}
                isTestPrint={true}
                copyLabel={printTwoCopies ? 'SALINAN KASIR / TOKO' : null}
              />

              {printTwoCopies && (
                <>
                  <View style={{ marginVertical: 12, alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Poppins_500Medium', color: '#71717a', fontStyle: 'italic' }}>
                      - - - - - - - POTONG KERTAS (STRUK 2) - - - - - - -
                    </Text>
                  </View>
                  <ReceiptView
                    transaction={{
                      invoice_number: 'INV-TEST-001',
                      created_at: new Date().toISOString(),
                      customer_name: 'Pelanggan Umum',
                      cashier_name: user?.name || 'Kasir Toko',
                      items: [
                        { product_name: 'Beras Ramos 5kg', quantity: 1, subtotal: 68000 },
                        { product_name: 'Minyak Goreng 2L', quantity: 1, subtotal: 34000 },
                      ],
                      subtotal: 102000,
                      discount_amount: 0,
                      tax_amount: 0,
                      fee_amount: 0,
                      total_amount: 102000,
                      payment_method: 'CASH',
                      paid_amount: 102000,
                      change_amount: 0,
                    }}
                    storeSettings={{
                      storeName,
                      storeAddress,
                      storePhone,
                      storeLogo,
                      showLogoOnReceipt,
                      showPhoneOnReceipt,
                      receiptFooter,
                    }}
                    isTestPrint={true}
                    copyLabel="SALINAN PELANGGAN"
                  />
                </>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.testPrintConfirmBtn}
              onPress={async () => {
                setTestReceiptOpen(false);
                const res = await printerService.printSample({
                  storeName,
                  storeAddress,
                  storePhone,
                  storeLogo,
                  showPhoneOnReceipt,
                  receiptFooter,
                  printTwoCopies,
                });
                if (res.mode === 'bluetooth') {
                  if (Platform.OS === 'web') {
                    window.alert(res.message || 'Struk terkirim ke printer!');
                  } else {
                    Alert.alert('Sukses', res.message || 'Struk berhasil dicetak.');
                  }
                } else {
                  if (Platform.OS === 'web') {
                    window.print();
                  } else {
                    Alert.alert('Simulasi Cetak', `${res.copies} salinan struk disiapkan.`);
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Printer size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.testPrintConfirmBtnText}>
                {printTwoCopies ? 'Kirim Cetak 2 Salinan Struk' : 'Kirim Cetak ke Printer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: PANDUAN PRINTER BLUETOOTH */}
      <Modal
        visible={printerGuideOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPrinterGuideOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={styles.headerIconBox}>
                  <BookOpen size={18} color="#fb7185" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.modalTitle}>Panduan Printer Bluetooth</Text>
                  <Text style={styles.modalSubtitle}>4 langkah praktis menyambungkan printer</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setPrinterGuideOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <View style={styles.guideStepItem}>
                <View style={styles.guideStepBadge}>
                  <Text style={styles.guideStepBadgeText}>1</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.guideStepTitle}>Nyalakan Printer Kasir</Text>
                  <Text style={styles.guideStepDesc}>
                    Tekan tombol daya (power) printer hingga lampu indikator menyala biru/hijau dan kertas siap keluar.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepItem}>
                <View style={styles.guideStepBadge}>
                  <Text style={styles.guideStepBadgeText}>2</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.guideStepTitle}>Aktifkan Bluetooth Smartphone</Text>
                  <Text style={styles.guideStepDesc}>
                    Pastikan koneksi Bluetooth di HP Anda dalam kondisi aktif dan izin lokasi perangkat telah diberikan.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepItem}>
                <View style={styles.guideStepBadge}>
                  <Text style={styles.guideStepBadgeText}>3</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.guideStepTitle}>Pasangkan (Pairing) Perangkat</Text>
                  <Text style={styles.guideStepDesc}>
                    Buka menu Bluetooth HP, pilih nama printer Anda (misal: RPP02N atau Panda). Jika diminta PIN, ketik 0000 atau 1234.
                  </Text>
                </View>
              </View>

              <View style={styles.guideStepItem}>
                <View style={styles.guideStepBadge}>
                  <Text style={styles.guideStepBadgeText}>4</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.guideStepTitle}>Uji Cetak Struk Belanja</Text>
                  <Text style={styles.guideStepDesc}>
                    Kembali ke aplikasi KasirKita, pilih model printer Anda (58mm/80mm), lalu tekan tombol "Uji Cetak Struk Contoh".
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setPrinterGuideOpen(false)}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Saya Mengerti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: AUDIT & STATUS KEAMANAN SESI */}
      <Modal
        visible={securityModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSecurityModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={[styles.headerIconBox, { backgroundColor: isOnline ? '#062d22' : '#2e1d05', borderWidth: 1, borderColor: isOnline ? '#065f46' : '#78350f' }]}>
                  <Shield size={18} color={isOnline ? '#6ee7b7' : '#fde68a'} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.modalTitle}>Keamanan & Status Sesi</Text>
                  <Text style={styles.modalSubtitle}>Audit perlindungan data & enkripsi kasir</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setSecurityModalOpen(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Item 1: Brankas Hardware */}
              <View style={styles.guideStepCard}>
                <View style={styles.securityItemHeader}>
                  <Lock size={16} color="#6ee7b7" />
                  <Text style={styles.guideStepTitle}>Brankas Token Kasir</Text>
                  <View style={[styles.statusPill, styles.statusPillGreen]}>
                    <Text style={[styles.statusPillText, styles.statusPillTextGreen]}>Hardware AES-256</Text>
                  </View>
                </View>
                <Text style={styles.guideStepDesc}>
                  {Platform.OS === 'web'
                    ? 'Kunci otentikasi disimpan di browser sandboxed session storage dengan enkripsi aplikasi.'
                    : 'Token sesi kasir disimpan di brankas hardware bawaan HP (Android Keystore / Apple Keychain) dengan proteksi cipher AES-256 GCM.'}
                </Text>
              </View>

              {/* Item 2: Otentikasi Cloud & Jaringan */}
              <View style={styles.guideStepCard}>
                <View style={styles.securityItemHeader}>
                  <Activity size={16} color={isOnline ? '#6ee7b7' : '#fde68a'} />
                  <Text style={styles.guideStepTitle}>Otentikasi & Jaringan</Text>
                  <View style={[styles.statusPill, isOnline ? styles.statusPillGreen : styles.statusPillAmber]}>
                    <Text style={[styles.statusPillText, isOnline ? styles.statusPillTextGreen : styles.statusPillTextAmber]}>
                      {isOnline ? 'Tersambung (REST TLS)' : 'Offline (Lokal)'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.guideStepDesc}>
                  {isOnline
                    ? `Setiap transaksi divalidasi dengan signature digital Laravel Sanctum. Ping server saat ini: ${serverPing !== null ? serverPing + ' ms' : 'Normal'}.`
                    : 'Aplikasi sedang berjalan mandiri secara offline. Transaksi kasir aman tersimpan di memori perangkat.'}
                </Text>
              </View>

              {/* Item 3: Proteksi Nota Offline */}
              <View style={styles.guideStepCard}>
                <View style={styles.securityItemHeader}>
                  <CheckCircle2 size={16} color="#7dd3fc" />
                  <Text style={styles.guideStepTitle}>Integritas Data Transaksi</Text>
                  <View style={[styles.statusPill, styles.statusPillSky]}>
                    <Text style={[styles.statusPillText, styles.statusPillTextSky]}>Idempoten UUID</Text>
                  </View>
                </View>
                <Text style={styles.guideStepDesc}>
                  Setiap transaksi nota offline diberi ID acak unik (UUID) untuk mencegah duplikasi ganda saat sinkronisasi otomatis ke server.
                </Text>
              </View>

              {/* Item 4: Akun Kasir Aktif */}
              <View style={styles.guideStepCard}>
                <View style={styles.securityItemHeader}>
                  <User size={16} color="#fb7185" />
                  <Text style={styles.guideStepTitle}>Pemegang Sesi Login</Text>
                </View>
                <Text style={styles.guideStepDesc}>
                  Kasir: {user?.name || 'Kasir Toko'} ({user?.email || user?.phone || 'Aktif'}) • Peran: {user?.role || 'KASIR'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.saveBtn, { width: '100%' }]}
                onPress={() => setSecurityModalOpen(false)}
                activeOpacity={0.8}
              >
                <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveBtnText}>Tutup Informasi Keamanan</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: '#062d22',
    borderWidth: 1,
    borderColor: '#065f46',
  },
  statusBadgeAmber: {
    backgroundColor: '#2e1d05',
    borderWidth: 1,
    borderColor: '#78350f',
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
    color: '#6ee7b7',
  },
  statusBadgeTextAmber: {
    color: '#fde68a',
  },
  statusBadgeTextGray: {
    color: '#a1a1aa',
  },
  scanBluetoothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  scanBluetoothBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
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
    height: 42,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  orientBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  orientBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
    textAlign: 'center',
  },
  orientBtnTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
  },
  paperSizeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paperSizeBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    justifyContent: 'center',
  },
  paperSizeBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  paperSizeBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paperSizeTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#e4e4e7',
  },
  paperSizeTitleActive: {
    color: '#ffffff',
  },
  paperSizeCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperSizeEmptyCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#3f3f46',
  },
  paperSizeDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    marginBottom: 1,
  },
  paperSizeDescActive: {
    color: '#ffffff',
  },
  paperSizeSpec: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  paperSizeSpecActive: {
    color: '#ffffff',
  },
  cacheBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cacheBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
  },
  pingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#062d22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#065f46',
    flexShrink: 0,
  },
  pingBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6ee7b7',
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
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
  guideStepItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  guideStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  guideStepBadgeText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  guideStepTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    marginBottom: 2,
  },
  guideStepDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    lineHeight: 18,
  },
  guideStepCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    marginBottom: 10,
  },
  securityItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 'auto',
  },
  statusPillGreen: {
    backgroundColor: '#062d22',
    borderColor: '#065f46',
  },
  statusPillAmber: {
    backgroundColor: '#2e1d05',
    borderColor: '#78350f',
  },
  statusPillSky: {
    backgroundColor: '#082f49',
    borderColor: '#0369a1',
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusPillTextGreen: {
    color: '#6ee7b7',
  },
  statusPillTextAmber: {
    color: '#fde68a',
  },
  statusPillTextSky: {
    color: '#7dd3fc',
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
  logoStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  logoStatusTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    flex: 1,
    minWidth: 0,
  },
  logoStatusTitleActive: {
    color: '#34d399',
  },
  logoDeleteTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    flexShrink: 0,
    marginLeft: 6,
  },
  logoDeleteText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fb7185',
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
  testReceiptLogoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  testReceiptLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  testReceiptLogoPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  syncOfflineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b45309',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexShrink: 0,
  },
  syncOfflineBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
