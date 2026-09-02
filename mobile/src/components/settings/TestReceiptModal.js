import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import {
  Printer,
  X,
} from 'lucide-react-native';
import ReceiptView from '../ReceiptView';
import { printerService } from '../../services/printerService';
import { showAlert } from '../../utils/alert';

export default function TestReceiptModal({
  visible,
  onClose,
  storeSettings,
  user,
  printTwoCopies,
}) {
  const handlePrint = async () => {
    onClose();
    const res = await printerService.printSample({
      storeName: storeSettings.storeName,
      storeAddress: storeSettings.storeAddress,
      storePhone: storeSettings.storePhone,
      storeLogo: storeSettings.storeLogo,
      showPhoneOnReceipt: storeSettings.showPhoneOnReceipt,
      receiptFooter: storeSettings.receiptFooter,
      printTwoCopies,
    });

    if (res.mode === 'bluetooth') {
      showAlert('Cetak Berhasil', res.message || 'Struk terkirim ke printer!');
    } else {
      if (Platform.OS === 'web') {
        window.print();
      } else {
        Alert.alert('Simulasi Cetak', `${res.copies} salinan struk disiapkan.`);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayCenter}>
        <View style={styles.testReceiptCard}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: '#18181b' }]}>Uji Cetak Struk</Text>
            <TouchableOpacity onPress={onClose}>
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
              storeSettings={storeSettings}
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
                  storeSettings={storeSettings}
                  isTestPrint={true}
                  copyLabel="SALINAN PELANGGAN"
                />
              </>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.testPrintConfirmBtn}
            onPress={handlePrint}
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
  );
}

const styles = StyleSheet.create({
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  testReceiptCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  testPrintConfirmBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  testPrintConfirmBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
});
