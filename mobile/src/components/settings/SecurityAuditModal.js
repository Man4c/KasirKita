import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import {
  Shield,
  X,
  Check,
  Lock,
  Activity,
  CheckCircle2,
  User,
} from 'lucide-react-native';

export default function SecurityAuditModal({
  visible,
  onClose,
  isOnline,
  serverPing,
  user,
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
              <View style={[styles.headerIconBox, { backgroundColor: isOnline ? '#062d22' : '#2e1d05', borderWidth: 1, borderColor: isOnline ? '#065f46' : '#78350f' }]}>
                <Shield size={18} color={isOnline ? '#6ee7b7' : '#fde68a'} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.modalTitle}>Keamanan & Status Sesi</Text>
                <Text style={styles.modalSubtitle}>Audit perlindungan data & enkripsi kasir</Text>
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
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Tutup Informasi Keamanan</Text>
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
