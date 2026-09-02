import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  Printer,
  X,
  Check,
  Bluetooth,
} from 'lucide-react-native';
import { printerService } from '../../services/printerService';
import { showAlert } from '../../utils/alert';

export default function PrinterSettingsModal({
  visible,
  onClose,
  selectedPrinter,
  onSelectPrinter,
  isPrinterConnected,
  onToggleConnection,
  isScanningBluetooth,
  setIsScanningBluetooth,
  isPhysicalPrinter,
  setIsPhysicalPrinter,
}) {
  const handleScanBluetooth = async () => {
    if (!printerService.isWebBluetoothSupported()) {
      if (Platform.OS === 'web') {
        showAlert('Web Bluetooth', 'Web Bluetooth memerlukan peramban Google Chrome atau Microsoft Edge dengan fitur Bluetooth aktif.');
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
      onSelectPrinter(res.name, true, true);
      onClose();
      showAlert('Bluetooth Terhubung', `Printer ${res.name} berhasil dipasangkan dan siap mencetak.`);
    } catch (err) {
      if (err.message && !err.message.includes('User cancelled')) {
        showAlert('Gagal Memindai', err.message);
      }
    } finally {
      setIsScanningBluetooth(false);
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
                <Printer size={18} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Printer Bluetooth Thermal</Text>
                <Text style={styles.modalSubtitle}>Pilih perangkat printer kasir Anda</Text>
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

          {/* Real Bluetooth Scan Action */}
          <TouchableOpacity
            style={[styles.scanBluetoothBtn, isScanningBluetooth && { opacity: 0.8 }]}
            onPress={handleScanBluetooth}
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
                    onSelectPrinter(p.id, true, false);
                    onClose();
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
              onPress={onToggleConnection}
            >
              <Text style={styles.cancelBtnText}>
                {isPrinterConnected ? 'Putuskan Sambungan' : 'Sambungkan Ulang'}
              </Text>
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
  scanBluetoothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  scanBluetoothBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
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
});
