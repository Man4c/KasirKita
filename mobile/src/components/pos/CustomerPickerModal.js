import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Search, X, Check } from 'lucide-react-native';

export default function CustomerPickerModal({
  visible,
  isLandscape,
  onClose,
  customers,
  selectedCustomer,
  onSelectCustomer,
  search,
  onSearchChange,
  formatRp,
}) {
  return (
    <Modal
      visible={visible}
      animationType={isLandscape ? 'fade' : 'slide'}
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
        <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pilih Pelanggan / Member</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#d4d4d8" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.customerSearchBox}>
            <Search size={16} color="#a1a1aa" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.customerSearchInput}
              placeholder="Cari nama atau no. telepon member..."
              placeholderTextColor="#a1a1aa"
              value={search}
              onChangeText={onSearchChange}
            />
            {search ? (
              <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            ) : null}
          </View>

          <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            {/* Option: Pelanggan Umum */}
            <TouchableOpacity
              style={[
                styles.customerOptionItem,
                !selectedCustomer && styles.customerOptionItemActive,
              ]}
              onPress={() => onSelectCustomer(null)}
              activeOpacity={0.7}
            >
              <View style={styles.customerOptionInfo}>
                <Text style={styles.customerOptionName}>Pelanggan Umum (Tanpa Member)</Text>
                <Text style={styles.customerOptionSub}>Transaksi walk-in standar tanpa akun member</Text>
              </View>
              {!selectedCustomer && (
                <Check size={18} color="#fb7185" />
              )}
            </TouchableOpacity>

            {/* Registered Members List */}
            {customers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              return (
                <TouchableOpacity
                  key={cust.id}
                  style={[
                    styles.customerOptionItem,
                    isSelected && styles.customerOptionItemActive,
                  ]}
                  onPress={() => onSelectCustomer(cust)}
                  activeOpacity={0.7}
                >
                  <View style={styles.customerOptionInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.customerOptionName} numberOfLines={1}>
                        {cust.name}
                      </Text>
                      <View style={styles.membershipBadgeSmall}>
                        <Text style={styles.membershipBadgeSmallText}>
                          {cust.membership_type || 'REGULAR'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.customerOptionSub}>
                      {cust.phone ? `WA: ${cust.phone}` : 'Tanpa No. HP'}
                      {cust.total_spent ? ` • Belanja: ${formatRp(cust.total_spent)}` : ''}
                    </Text>
                  </View>
                  {isSelected && (
                    <Check size={18} color="#fb7185" />
                  )}
                </TouchableOpacity>
              );
            })}

            {customers.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                  Tidak ada member yang cocok dengan pencarian.
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
  customerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  customerSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  customerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  customerOptionItemActive: {
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
});
