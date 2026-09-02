import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
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
  HelpCircle,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ isLandscape = false }) {
  const { user, logout } = useAuth();
  const [autoPrint, setAutoPrint] = useState(false);
  const [printTwoCopies, setPrintTwoCopies] = useState(false);
  const [showLogoOnReceipt, setShowLogoOnReceipt] = useState(true);
  const [showPhoneOnReceipt, setShowPhoneOnReceipt] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Apakah Anda yakin ingin keluar dari KasirKita?')) {
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

  const handleSyncData = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      if (Platform.OS === 'web') {
        window.alert('Data katalog, harga, dan pelanggan berhasil diperbarui!');
      } else {
        Alert.alert('Sinkronisasi Sukses', 'Data toko Anda sudah yang terbaru.');
      }
    }, 1000);
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

      {/* 2. Seksi Profil Akun & Usaha */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PROFIL & TOKO</Text>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatarBox}>
              <User size={24} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || 'Kasir Toko'}
              </Text>
              <View style={styles.roleBadgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>
                    {user?.role === 'owner' ? 'OWNER / PEMILIK' : 'KASIR'}
                  </Text>
                </View>
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {user?.email || 'user@kasirkita.local'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Seksi Perangkat Keras / Hardware */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PERANGKAT KERAS (HARDWARE)</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS === 'web') {
                window.alert('Fitur pairing printer Bluetooth siap dihubungkan pada perangkat mobile native!');
              } else {
                Alert.alert('Printer Thermal', 'Pencarian printer bluetooth thermal 58mm/80mm...');
              }
            }}
          >
            <View style={styles.menuIconBox}>
              <Printer size={18} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>Printer Bluetooth Thermal</Text>
              <Text style={styles.menuSubtitle}>Koneksi printer struk 58mm / 80mm</Text>
            </View>
            <ChevronRight size={18} color="#71717a" />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Cetak Struk Otomatis</Text>
              <Text style={styles.switchSubtitle}>Langsung cetak setelah bayar selesai</Text>
            </View>
            <Switch
              value={autoPrint}
              onValueChange={setAutoPrint}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={autoPrint ? '#ffffff' : '#a1a1aa'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Cetak 2 Salinan Struk</Text>
              <Text style={styles.switchSubtitle}>1 salinan kasir, 1 salinan pembeli</Text>
            </View>
            <Switch
              value={printTwoCopies}
              onValueChange={setPrintTwoCopies}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={printTwoCopies ? '#ffffff' : '#a1a1aa'}
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
              <Text style={styles.switchSubtitle}>Sertakan logo KasirKita pada struk</Text>
            </View>
            <Switch
              value={showLogoOnReceipt}
              onValueChange={setShowLogoOnReceipt}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showLogoOnReceipt ? '#ffffff' : '#a1a1aa'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Nomor WhatsApp Toko</Text>
              <Text style={styles.switchSubtitle}>Cetak kontak WA pada bagian atas struk</Text>
            </View>
            <Switch
              value={showPhoneOnReceipt}
              onValueChange={setShowPhoneOnReceipt}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={showPhoneOnReceipt ? '#ffffff' : '#a1a1aa'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.switchRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
              <Text style={styles.switchTitle}>Suara Beep Scanner</Text>
              <Text style={styles.switchSubtitle}>Bunyi konfirmasi saat scan barcode</Text>
            </View>
            <Switch
              value={soundBeep}
              onValueChange={setSoundBeep}
              trackColor={{ false: '#27272a', true: '#e11d48' }}
              thumbColor={soundBeep ? '#ffffff' : '#a1a1aa'}
            />
          </View>
        </View>
      </View>

      {/* 5. Seksi Sinkronisasi & Data */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>DATA & SINKRONISASI</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={handleSyncData}
            disabled={syncing}
          >
            <View style={styles.menuIconBox}>
              <RefreshCw size={18} color="#34d399" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.menuTitle}>
                {syncing ? 'Menyinkronkan...' : 'Perbarui Data Toko'}
              </Text>
              <Text style={styles.menuSubtitle}>Tarik produk & harga terbaru dari server</Text>
            </View>
            <CheckCircle2 size={18} color="#34d399" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Seksi Tentang Aplikasi & Keluar */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TENTANG & KEAMANAN</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Versi Aplikasi</Text>
            <Text style={styles.infoValue}>KasirKita Mobile v1.2.0</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>
              {Platform.OS === 'web' ? 'Web PWA' : Platform.OS === 'android' ? 'Android Native' : 'iOS Native'}
            </Text>
          </View>
        </View>

        {/* Tombol Logout Merah Elegan */}
        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <LogOut size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutButtonText}>Keluar Akun Kasir</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
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
});
