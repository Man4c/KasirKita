import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Linking,
  Image,
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
  Activity,
  KeyRound,
  MessageCircle,
  BookOpen,
  Info,
  Layers,
  Check,
  CheckCircle2,
  Wifi,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import api from '../services/api';
import { offlineStorage } from '../services/offlineStorage';
import { syncManager } from '../services/syncManager';
import { printerService } from '../services/printerService';
import { orientationService } from '../services/orientationService';
import { showAlert } from '../utils/alert';
import {
  UserProfileModal,
  ChangePasswordModal,
  StoreIdentityModal,
  PrinterSettingsModal,
  PrinterGuideModal,
  TestReceiptModal,
  SecurityAuditModal,
} from '../components/settings';
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
  const [showVoucherFeature, setShowVoucherFeature] = useState(true);
  const [showTaxFeature, setShowTaxFeature] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(true);
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
        if (typeof saved.showVoucherFeature === 'boolean') setShowVoucherFeature(saved.showVoucherFeature);
        if (typeof saved.showTaxFeature === 'boolean') setShowTaxFeature(saved.showTaxFeature);
        if (typeof saved.showBarcodeScanner === 'boolean') setShowBarcodeScanner(saved.showBarcodeScanner);
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
        showVoucherFeature,
        showTaxFeature,
        showBarcodeScanner,
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

  const handleOpenWhatsAppSupport = () => {
    const phone = '6281234567890';
    const text = encodeURIComponent('Halo Tim Bantuan KasirKita, saya butuh panduan terkait operasional kasir / printer.');
    const url = `https://wa.me/${phone}?text=${text}`;
    Linking.openURL(url).catch(() => {
      showAlert('Bantuan CS', 'Silakan hubungi WhatsApp CS KasirKita di: +62 812-3456-7890');
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
      showAlert('Sinkronisasi Berhasil', `Katalog offline dan pengaturan toko Anda sudah paling mutakhir${syncInfo}`);
    } catch (err) {
      setSyncing(false);
      showAlert('Info Sinkronisasi', 'Data lokal toko Anda aktif digunakan.');
    }
  };

  const handleSyncOfflineTransactions = async () => {
    setIsSyncingOffline(true);
    try {
      const result = await syncManager.syncPendingTransactions();
      if (result.success && result.synced > 0) {
        showAlert('Sukses', `${result.synced} nota transaksi offline berhasil disinkronkan ke server cloud.`);
      } else if (result.remaining === 0) {
        showAlert('Info', 'Tidak ada antrean transaksi offline yang tertunda.');
      } else {
        showAlert('Gagal', 'Server backend belum dapat dijangkau. Periksa koneksi internet Anda.');
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
      showAlert('Sukses', 'Cache katalog offline berhasil dibersihkan. Memori HP kini lebih lega dan katalog akan disegarkan otomatis dari server.');
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

  const isOnline = serverStatus === 'Online' || serverStatus === 'Terhubung' || serverStatus === 'Tersambung';
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
            onPress={() => setUserModalOpen(true)}
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
            onPress={() => setPasswordModalOpen(true)}
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
            onPress={() => setStoreModalOpen(true)}
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

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Fitur Voucher & Promo Diskon</Text>
              <Text style={styles.switchSubtitle}>Tampilkan tombol dan opsi voucher promo diskon pada layar kasir & checkout</Text>
            </View>
            <Switch
              value={showVoucherFeature}
              onValueChange={(val) => {
                setShowVoucherFeature(val);
                persistSettings({ showVoucherFeature: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showVoucherFeature ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Fitur Pajak di Kasir</Text>
              <Text style={styles.switchSubtitle}>Tampilkan opsi pilihan tarif pajak (PPN/PB1) pada kasir & checkout. Jika dimatikan, transaksi tanpa perhitungan pajak</Text>
            </View>
            <Switch
              value={showTaxFeature}
              onValueChange={(val) => {
                setShowTaxFeature(val);
                persistSettings({ showTaxFeature: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showTaxFeature ? '#ffffff' : '#a1a1aa'}
              style={{ flexShrink: 0 }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Fitur Scan Barcode</Text>
              <Text style={styles.switchSubtitle}>Tampilkan tombol scan barcode pada layar kasir. Jika dimatikan, ikon scanner tidak akan muncul di halaman kasir</Text>
            </View>
            <Switch
              value={showBarcodeScanner}
              onValueChange={(val) => {
                setShowBarcodeScanner(val);
                persistSettings({ showBarcodeScanner: val });
              }}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showBarcodeScanner ? '#ffffff' : '#a1a1aa'}
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

      {/* MODAL 0A: UBAH PROFIL PENGGUNA */}
      <UserProfileModal
        visible={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        user={user}
        updateUser={updateUser}
      />

      {/* MODAL 0B: GANTI KATA SANDI AKUN */}
      <ChangePasswordModal
        visible={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

      {/* MODAL 1: INFORMASI TOKO & STRUK */}
      <StoreIdentityModal
        visible={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        storeSettings={{
          storeName,
          storeAddress,
          storePhone,
          receiptFooter,
          storeLogo,
          showLogoOnReceipt,
          showPhoneOnReceipt,
        }}
        isOwner={user?.role === 'owner'}
        onSaveSuccess={async (updated) => {
          setStoreName(updated.storeName);
          setStoreAddress(updated.storeAddress);
          setStorePhone(updated.storePhone);
          setReceiptFooter(updated.receiptFooter);
          setStoreLogo(updated.storeLogo);
          setShowLogoOnReceipt(updated.showLogoOnReceipt);
          setShowPhoneOnReceipt(updated.showPhoneOnReceipt);

          await persistSettings({
            storeName: updated.storeName,
            storeAddress: updated.storeAddress,
            storePhone: updated.storePhone,
            receiptFooter: updated.receiptFooter,
            storeLogo: updated.storeLogo,
            showLogoOnReceipt: updated.showLogoOnReceipt,
            showPhoneOnReceipt: updated.showPhoneOnReceipt,
          });
        }}
      />

      {/* MODAL 2: PILIH PRINTER BLUETOOTH THERMAL */}
      <PrinterSettingsModal
        visible={printerModalOpen}
        onClose={() => setPrinterModalOpen(false)}
        selectedPrinter={selectedPrinter}
        onSelectPrinter={(printerId, connected, physical) => {
          setSelectedPrinter(printerId);
          setIsPrinterConnected(connected);
          setIsPhysicalPrinter(physical);
          persistSettings({ selectedPrinter: printerId, isPrinterConnected: connected });
        }}
        isPrinterConnected={isPrinterConnected}
        onToggleConnection={() => {
          const nextState = !isPrinterConnected;
          setIsPrinterConnected(nextState);
          persistSettings({ isPrinterConnected: nextState });
        }}
        isScanningBluetooth={isScanningBluetooth}
        setIsScanningBluetooth={setIsScanningBluetooth}
        isPhysicalPrinter={isPhysicalPrinter}
        setIsPhysicalPrinter={setIsPhysicalPrinter}
      />

      {/* MODAL 3: PREVIEW UJI CETAK STRUK */}
      <TestReceiptModal
        visible={testReceiptOpen}
        onClose={() => setTestReceiptOpen(false)}
        storeSettings={{
          storeName,
          storeAddress,
          storePhone,
          storeLogo,
          showLogoOnReceipt,
          showPhoneOnReceipt,
          receiptFooter,
        }}
        user={user}
        printTwoCopies={printTwoCopies}
      />

      {/* MODAL 4: PANDUAN PRINTER BLUETOOTH */}
      <PrinterGuideModal
        visible={printerGuideOpen}
        onClose={() => setPrinterGuideOpen(false)}
      />

      {/* MODAL 5: AUDIT & STATUS KEAMANAN SESI */}
      <SecurityAuditModal
        visible={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        isOnline={isOnline}
        serverPing={serverPing}
        user={user}
      />
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
