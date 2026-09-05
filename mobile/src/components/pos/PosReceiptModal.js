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
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.receiptModalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.receiptSheet, isLandscape && styles.receiptSheetLandscape]}>
          {/* Drag Handle Bar (Mobile Bottom Sheet Pattern) */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header Bar */}
          <View style={styles.receiptTopBar}>
            <Text style={styles.receiptTopBarTitle}>Struk Transaksi</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.receiptCloseBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.receiptScroll}
            contentContainerStyle={styles.receiptScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <ReceiptView
              transaction={completedTx}
              storeSettings={storeSettings}
              formatRp={formatRp}
            />
          </ScrollView>

          {/* Action CTA Buttons (Sticky Footer) */}
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
              style={styles.newTxButton}
              onPress={handleSecondaryAction}
              activeOpacity={0.85}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  receiptSheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#27272a',
    width: '100%',
    maxWidth: 500,
    maxHeight: '92%',
    paddingTop: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  receiptSheetLandscape: {
    maxWidth: 520,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
  },
  receiptTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  receiptTopBarTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  receiptCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  printThermalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
  },
  printThermalButtonText: {
    color: '#d4d4d8',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  newTxButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e11d48',
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
  },
  newTxButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
