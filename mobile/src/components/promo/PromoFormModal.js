import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, TicketPercent } from 'lucide-react-native';

export default function PromoFormModal({
  visible,
  onClose,
  promo,
  onSuccess,
}) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TicketPercent size={20} color="#fb7185" />
              <Text style={styles.modalTitle}>
                {promo ? 'Edit Program Promosi' : 'Tambah Promosi Baru'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color="#d4d4d8" />
            </TouchableOpacity>
          </View>
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 13, fontFamily: 'Poppins_400Regular' }}>
              Formulir promosi akan disempurnakan pada Fase 4.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 480,
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
});
