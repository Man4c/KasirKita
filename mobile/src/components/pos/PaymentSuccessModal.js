import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Check, Printer } from 'lucide-react-native';
import { printerService } from '../../services/printerService';
import { showAlert } from '../../utils/alert';

export default function PaymentSuccessModal({
  visible,
  isLandscape = false,
  onClose,
  completedTx,
  formatRp,
}) {
  const { height } = useWindowDimensions();
  const isShortScreen = height < 500 || (isLandscape && height < 440);

  // Animation values for checkmark pop & bounce
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.92)).current;
  const cardOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      cardScaleAnim.setValue(0.92);
      cardOpacityAnim.setValue(0);

      // 1. Card entry animation (smooth fade & slight scale)
      Animated.parallel([
        Animated.timing(cardOpacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.spring(cardScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Icon pop with spring physics
      Animated.sequence([
        Animated.delay(60),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.spring(checkAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

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
        <Animated.View
          style={[
            styles.card,
            isLandscape && styles.cardLandscape,
            isShortScreen && styles.cardCompact,
            {
              opacity: cardOpacityAnim,
              transform: [{ scale: cardScaleAnim }],
            },
          ]}
        >
          {/* Green Circle with Animated Pop & Checkmark */}
          <Animated.View
            style={[
              styles.iconHalo,
              isShortScreen && styles.iconHaloCompact,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={[styles.iconCircle, isShortScreen && styles.iconCircleCompact]}>
              <Animated.View
                style={{
                  transform: [{ scale: checkAnim }],
                }}
              >
                <Check
                  size={isShortScreen ? 24 : 30}
                  color="#ffffff"
                  strokeWidth={3.5}
                />
              </Animated.View>
            </View>
          </Animated.View>

          {/* Title */}
          <Text style={[styles.title, isShortScreen && styles.titleCompact]}>
            Pembayaran Berhasil!
          </Text>

          {/* Total Amount in Emerald Green */}
          <Text
            style={[styles.amount, isShortScreen && styles.amountCompact]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatRp(total)}
          </Text>

          {/* Invoice Number */}
          <Text
            style={[styles.invoiceNumber, isShortScreen && styles.invoiceNumberCompact]}
            numberOfLines={1}
          >
            {invoice}
          </Text>

          {/* Action Buttons: Cetak Struk & Selesai */}
          <View style={[styles.actionRow, isShortScreen && styles.actionRowCompact]}>
            {/* Cetak Struk: Dark Neutral Outlined Button */}
            <TouchableOpacity
              style={[styles.printBtn, isShortScreen && styles.btnCompact]}
              onPress={handlePrint}
              activeOpacity={0.7}
            >
              <Printer size={15} color="#e4e4e7" />
              <Text style={styles.printBtnText}>Cetak Struk</Text>
            </TouchableOpacity>

            {/* Selesai: Solid Emerald Green Button */}
            <TouchableOpacity
              style={[styles.doneBtn, isShortScreen && styles.btnCompact]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Selesai</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 310,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
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
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      },
    }),
  },
  cardLandscape: {
    maxWidth: 340,
    paddingVertical: 18,
  },
  cardCompact: {
    maxWidth: 320,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  iconHalo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconHaloCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 8,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
  iconCircleCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 2,
  },
  amount: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#22c55e',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 2,
  },
  amountCompact: {
    fontSize: 19,
    marginBottom: 1,
  },
  invoiceNumber: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
    marginBottom: 18,
  },
  invoiceNumberCompact: {
    fontSize: 11,
    marginBottom: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
  },
  actionRowCompact: {
    gap: 8,
  },
  printBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 10,
  },
  btnCompact: {
    paddingVertical: 8,
    borderRadius: 10,
  },
  printBtnText: {
    fontSize: 12,
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
    borderRadius: 12,
    paddingVertical: 10,
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
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
});
