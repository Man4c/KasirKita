import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { Check, Printer, ArrowRight } from 'lucide-react-native';
import { printerService } from '../../services/printerService';
import { showAlert } from '../../utils/alert';

export default function PaymentSuccessModal({
  visible,
  isLandscape = false,
  onClose,
  completedTx,
  formatRp,
}) {
  if (!completedTx) return null;

  const total = completedTx.total_amount || 0;
  const invoice = completedTx.invoice_number || `INV-${completedTx.id || ''}`;

  const handlePrint = async () => {
    try {
      const res = await printerService.printReceipt(completedTx);
      if (res.mode === 'bluetooth') {
        showAlert('Sukses', 'Struk berhasil dicetak ke printer Bluetooth.');
      } else {
        if (Platform.OS === 'web') {
          window.print();
        } else {
          showAlert(
            'Simulasi Cetak',
            'Perintah cetak ESC/POS disiapkan (Mode Simulasi). Hubungkan printer Bluetooth fisik di menu Pengaturan jika sudah ada perangkat.'
          );
        }
      }
    } catch (err) {
      showAlert('Gagal Cetak', 'Terjadi kesalahan saat memproses cetak struk: ' + err.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, isLandscape && styles.cardLandscape]}>
          {/* Green Circle with White Checkmark Icon */}
          <View style={styles.iconHalo}>
            <View style={styles.iconCircle}>
              <Check size={36} color="#ffffff" strokeWidth={3.5} />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Pembayaran Berhasil!</Text>

          {/* Total Amount in Emerald Green */}
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
            {formatRp(total)}
          </Text>

          {/* Invoice Number */}
          <Text style={styles.invoiceNumber} numberOfLines={1}>
            {invoice}
          </Text>

          {/* Action Buttons: Cetak Struk & Selesai */}
          <View style={styles.actionRow}>
            {/* Cetak Struk: Dark Neutral Outlined Button */}
            <TouchableOpacity
              style={styles.printBtn}
              onPress={handlePrint}
              activeOpacity={0.7}
            >
              <Printer size={16} color="#e4e4e7" />
              <Text style={styles.printBtnText}>Cetak Struk</Text>
            </TouchableOpacity>

            {/* Selesai: Solid Emerald Green Button */}
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      },
    }),
  },
  cardLandscape: {
    maxWidth: 380,
    paddingVertical: 24,
  },
  iconHalo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#22c55e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
      },
    }),
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  amount: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#22c55e',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 26,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
    borderRadius: 14,
    paddingVertical: 12,
  },
  printBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    whiteSpace: 'nowrap',
  },
  doneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#16a34a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
      },
    }),
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
});
