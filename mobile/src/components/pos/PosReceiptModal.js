import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StyleSheet,
} from 'react-native';
import { X, Printer } from 'lucide-react-native';
import ReceiptView from '../ReceiptView';
import { printerService } from '../../services/printerService';
import { showAlert } from '../../utils/alert';

export default function PosReceiptModal({
  visible,
  isLandscape,
  onClose,
  completedTx,
  onNewTransaction,
  closeBtnText = 'Tutup',
  formatRp,
  storeSettings,
}) {
  const handleSecondaryAction = onNewTransaction || onClose;

  return (
    <Modal
      visible={visible}
      animationType={isLandscape ? 'fade' : 'slide'}
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.receiptModalOverlay}>
        <View style={[styles.receiptSheet, isLandscape && styles.receiptSheetLandscape]}>
          {/* Modal Header Bar */}
          <View style={styles.receiptTopBar}>
            <Text style={styles.receiptTopBarTitle}>Struk Transaksi</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.receiptCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#71717a" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.receiptScroll}
            contentContainerStyle={styles.receiptScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <ReceiptView
              transaction={completedTx}
              storeSettings={storeSettings}
              formatRp={formatRp}
            />
          </ScrollView>

          {/* Action CTA Buttons */}
          <View style={styles.receiptActionRow}>
            <TouchableOpacity
              style={styles.printThermalButton}
              activeOpacity={0.8}
              onPress={async () => {
                if (!completedTx) return;
                const res = await printerService.printReceipt(completedTx, storeSettings);
                if (res.mode === 'bluetooth') {
                  showAlert('Sukses', 'Struk berhasil dicetak ke printer Bluetooth.');
                } else {
                  if (Platform.OS === 'web') {
                    await printerService.printWebReceiptHtml(completedTx, storeSettings);
                  } else {
                    showAlert('Simulasi Cetak', 'Perintah cetak ESC/POS disiapkan (Mode Simulasi). Hubungkan printer Bluetooth fisik di menu Pengaturan jika sudah ada perangkat.');
                  }
                }
              }}
            >
              <Printer size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.printThermalButtonText}>Cetak Struk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.newTxButton, { flex: 1, marginTop: 0 }]}
              onPress={handleSecondaryAction}
              activeOpacity={0.8}
            >
              <Text style={styles.newTxButtonText}>{closeBtnText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptSheet: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  receiptSheetLandscape: {
    maxWidth: 480,
  },
  receiptTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  receiptTopBarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  receiptCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  receiptScroll: {
    flexGrow: 0,
  },
  receiptScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  receiptActionRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  printThermalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3f3f46',
    paddingVertical: 12,
    borderRadius: 12,
  },
  printThermalButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  newTxButton: {
    backgroundColor: '#e11d48',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTxButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});
