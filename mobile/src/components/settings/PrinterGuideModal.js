import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import {
  BookOpen,
  X,
  Check,
} from 'lucide-react-native';

export default function PrinterGuideModal({
  visible,
  onClose,
}) {
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
                <BookOpen size={18} color="#fb7185" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Panduan Printer Bluetooth</Text>
                <Text style={styles.modalSubtitle}>4 langkah praktis menyambungkan printer</Text>
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
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Saya Mengerti</Text>
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
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  saveBtn: {
    flex: 1,
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
