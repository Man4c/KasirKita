import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Percent, X } from 'lucide-react-native';

export default function TaxFeeModal({
  visible,
  isLandscape,
  onClose,
  availableTaxes,
  selectedTaxId,
  onSelectTax,
  formatRp,
}) {
  return (
    <Modal visible={visible} animationType={isLandscape ? 'fade' : 'slide'} transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
        <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleBox}>
              <View style={styles.modalIconBox}>
                <Percent size={18} color="#fbbf24" />
              </View>
              <Text style={styles.modalTitle}>Pilih Tarif Pajak</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.closeBtn}>
              <X size={18} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* Option: Tanpa Pajak */}
            <TouchableOpacity
              style={[styles.taxOptionCard, selectedTaxId === '' && styles.taxOptionCardActive]}
              onPress={() => onSelectTax('')}
              activeOpacity={0.7}
            >
              <View style={styles.customerOptionInfo}>
                <Text style={styles.customerOptionName} numberOfLines={1}>Tanpa Pajak (0%)</Text>
                <Text style={styles.customerOptionSub} numberOfLines={2}>Tidak mengenakan pajak pada transaksi ini</Text>
              </View>
              {selectedTaxId === '' ? (
                <View style={[styles.taxOptionBadge, styles.taxOptionBadgeActive]}>
                  <Text style={styles.taxOptionBadgeTextActive}>Aktif</Text>
                </View>
              ) : (
                <View style={styles.taxOptionBadge}>
                  <Text style={styles.taxOptionBadgeTextInactive}>Pilih</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Options: Active Taxes */}
            {availableTaxes.map((tax) => {
              const isSelected = selectedTaxId === tax.id;
              const rateDisplay = tax.type === 'PERCENTAGE' ? `${parseFloat(tax.value)}%` : formatRp(tax.value);
              return (
                <TouchableOpacity
                  key={tax.id}
                  style={[styles.taxOptionCard, isSelected && styles.taxOptionCardActive]}
                  onPress={() => onSelectTax(tax.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerOptionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.customerOptionName} numberOfLines={1}>{tax.name}</Text>
                      <View style={styles.taxBadgeSmall}>
                        <Text style={styles.taxBadgeSmallText}>{rateDisplay}</Text>
                      </View>
                    </View>
                    <Text style={styles.customerOptionSub} numberOfLines={2}>
                      {tax.description || `${rateDisplay} dari subtotal belanja`}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View style={[styles.taxOptionBadge, styles.taxOptionBadgeActive]}>
                      <Text style={styles.taxOptionBadgeTextActive}>Aktif</Text>
                    </View>
                  ) : (
                    <View style={styles.taxOptionBadge}>
                      <Text style={styles.taxOptionBadgeTextInactive}>Pilih</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  modalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    flex: 1,
  },
  taxOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  taxOptionCardActive: {
    borderColor: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
  },
  customerOptionInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  customerOptionName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  customerOptionSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  taxBadgeSmall: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    flexShrink: 0,
  },
  taxBadgeSmallText: {
    color: '#fbbf24',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxOptionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
    flexShrink: 0,
  },
  taxOptionBadgeActive: {
    backgroundColor: '#fbbf24',
  },
  taxOptionBadgeTextInactive: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxOptionBadgeTextActive: {
    color: '#09090b',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
});
