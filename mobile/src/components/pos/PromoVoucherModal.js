import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { TicketPercent, X } from 'lucide-react-native';

export default function PromoVoucherModal({
  visible,
  isLandscape,
  onClose,
  availablePromos,
  appliedPromo,
  onApplyPromo,
  formatRp,
}) {
  return (
    <Modal visible={visible} animationType={isLandscape ? 'fade' : 'slide'} transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
        <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TicketPercent size={20} color="#fb7185" />
              <Text style={styles.modalTitle}>Pilih Promo Toko</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {availablePromos.map((promo) => {
              const isSelected = appliedPromo?.discount_code === promo.code;
              const isPercentage = promo.type === 'PERCENTAGE' || promo.type === 'MIN_SPEND';
              const discountDisplay = isPercentage ? `${parseFloat(promo.value)}%` : formatRp(promo.value);

              return (
                <TouchableOpacity
                  key={promo.id}
                  style={[styles.promoOptionCard, isSelected && styles.promoOptionCardActive]}
                  onPress={() => onApplyPromo(promo.code)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.promoOptionCode}>{promo.code}</Text>
                      <View style={styles.promoOptionBadge}>
                        <Text style={styles.promoOptionBadgeText}>
                          {promo.type === 'PERCENTAGE' ? 'Diskon %' : promo.type === 'FIXED' ? 'Potongan Rp' : 'Min. Belanja'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.promoOptionName}>{promo.name}</Text>
                    {parseFloat(promo.min_purchase_amount) > 0 && (
                      <Text style={styles.promoOptionTerm}>
                        Min. belanja: {formatRp(promo.min_purchase_amount)}
                      </Text>
                    )}
                  </View>

                  <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                    <Text style={styles.promoOptionVal}>{discountDisplay}</Text>
                    <View style={[styles.promoOptionActionBtn, isSelected && styles.promoOptionActionBtnActive]}>
                      <Text style={[styles.promoOptionActionBtnText, isSelected && styles.promoOptionActionBtnTextActive]}>
                        {isSelected ? 'Terpasang' : 'Pilih'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {availablePromos.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                  Belum ada program promo aktif saat ini.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalOverlayLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customerPickerSheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  customerPickerSheetLandscape: {
    width: 480,
    maxHeight: '85%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  promoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  promoOptionCardActive: {
    borderColor: '#e11d48',
    backgroundColor: '#26141a',
  },
  promoOptionCode: {
    color: '#fb7185',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  promoOptionBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  promoOptionBadgeText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoOptionName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  promoOptionTerm: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  promoOptionVal: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  promoOptionActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
  },
  promoOptionActionBtnActive: {
    backgroundColor: '#e11d48',
  },
  promoOptionActionBtnText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoOptionActionBtnTextActive: {
    color: '#ffffff',
  },
});
