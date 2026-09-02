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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Percent size={20} color="#fb7185" />
              <Text style={styles.modalTitle}>Pilih Tarif Pajak</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#d4d4d8" />
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
                <Text style={styles.customerOptionName}>Tanpa Pajak (0%)</Text>
                <Text style={styles.customerOptionSub}>Tidak mengenakan pajak pada transaksi ini</Text>
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
                      <Text style={styles.customerOptionName}>{tax.name}</Text>
                      <View style={styles.membershipBadgeSmall}>
                        <Text style={styles.membershipBadgeSmallText}>{rateDisplay}</Text>
                      </View>
                    </View>
                    <Text style={styles.customerOptionSub}>
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
  modalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
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
    borderColor: 'transparent',
  },
  taxOptionCardActive: {
    borderColor: '#e11d48',
    backgroundColor: '#26141a',
  },
  customerOptionInfo: {
    flex: 1,
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
  membershipBadgeSmall: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  membershipBadgeSmallText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxOptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
  },
  taxOptionBadgeActive: {
    backgroundColor: '#e11d48',
  },
  taxOptionBadgeTextInactive: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxOptionBadgeTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
