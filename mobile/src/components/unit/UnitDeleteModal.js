import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  AlertTriangle,
  Scale,
  Check,
  X,
  Package,
  ArrowRightLeft,
} from 'lucide-react-native';

export default function UnitDeleteModal({
  visible,
  unit,
  allUnits = [],
  onClose,
  onConfirm,
  loading = false,
}) {
  const [targetUnitId, setTargetUnitId] = useState('');

  // Satuan alternatif yang bisa dipilih (mengecualikan satuan yang sedang dihapus)
  const availableUnits = (allUnits || []).filter(
    (u) => u.id !== unit?.id
  );

  useEffect(() => {
    if (visible) {
      if (availableUnits.length > 0) {
        setTargetUnitId(availableUnits[0].id);
      } else {
        setTargetUnitId('');
      }
    }
  }, [visible, unit]);

  const productsCount = Number(unit?.products_count || 0);
  const conversionsCount = Number(unit?.conversions_count || 0);
  const totalUsage = productsCount + conversionsCount;

  const handleExecute = () => {
    if (!targetUnitId) return;
    onConfirm({
      action: 'reassign',
      target_unit_id: targetUnitId,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Drag Handle Bar (Mobile Bottom Sheet Pattern) */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircleWarning}>
                <AlertTriangle size={20} color="#fbbf24" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1} ellipsizeMode="tail">
                  Satuan Sedang Digunakan
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1} ellipsizeMode="tail">
                  {unit?.name} ({unit?.symbol}) • {totalUsage} produk terkait
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              disabled={loading}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Warning Message Box */}
            <View style={styles.infoBanner}>
              <Package size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
              <Text style={styles.infoBannerText}>
                Satuan <Text style={styles.infoBold}>"{unit?.name}" ({unit?.symbol})</Text> saat ini digunakan oleh{' '}
                <Text style={styles.infoBold}>{productsCount} produk dasar</Text>
                {conversionsCount > 0 ? (
                  <> dan <Text style={styles.infoBold}>{conversionsCount} varian konversi</Text></>
                ) : null}.
                Produk wajib memiliki satuan dasar. Silakan pilih satuan pengganti:
              </Text>
            </View>

            {/* Opsi Reassign Satuan Pengganti */}
            <View style={styles.optionCard}>
              <View style={styles.optionHeader}>
                <View style={styles.optionTitleRow}>
                  <ArrowRightLeft size={16} color="#38bdf8" />
                  <Text style={styles.optionTitle}>
                    Pindahkan ke Satuan Pengganti
                  </Text>
                </View>
                <Text style={styles.optionDesc}>
                  Seluruh {totalUsage} produk di atas otomatis berganti ke satuan baru secara aman tanpa merusak stok atau riwayat transaksi lama.
                </Text>
              </View>

              {availableUnits.length > 0 ? (
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerLabel}>Pilih Satuan Pengganti:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.unitChipsRow}
                  >
                    {availableUnits.map((u) => {
                      const isChosen = targetUnitId === u.id;
                      return (
                        <TouchableOpacity
                          key={u.id}
                          style={[styles.targetChip, isChosen && styles.targetChipActive]}
                          onPress={() => setTargetUnitId(u.id)}
                          activeOpacity={0.7}
                        >
                          <Scale size={12} color={isChosen ? '#38bdf8' : '#a1a1aa'} />
                          <Text
                            style={[
                              styles.targetChipText,
                              isChosen && styles.targetChipTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {u.name} ({u.symbol})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.noAlternativeBox}>
                  <Text style={styles.noAlternativeText}>
                    Tidak ada satuan alternatif lain di toko Anda. Buat satuan baru terlebih dahulu sebelum menghapus satuan ini.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!targetUnitId || availableUnits.length === 0) && styles.submitBtnDisabled,
              ]}
              onPress={handleExecute}
              disabled={loading || !targetUnitId || availableUnits.length === 0}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>
                    Pindahkan & Hapus
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '85%',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3f3f46',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  iconCircleWarning: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#fbbf24',
    lineHeight: 16,
    marginTop: 2,
    flexShrink: 1,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  scrollBody: {
    padding: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  infoBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#e4e4e7',
    lineHeight: 18,
    flex: 1,
  },
  infoBold: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#fbbf24',
  },
  optionCard: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  optionHeader: {
    marginBottom: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#38bdf8',
  },
  optionDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    lineHeight: 16,
  },
  pickerSection: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#3f3f46',
  },
  pickerLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#e4e4e7',
    marginBottom: 8,
  },
  unitChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  targetChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38bdf8',
  },
  targetChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  targetChipTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#38bdf8',
  },
  noAlternativeBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  noAlternativeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#f87171',
    lineHeight: 16,
  },
  modalFooter: {
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
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  submitBtn: {
    flex: 1.5,
    minHeight: 44,
    backgroundColor: '#e11d48',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnDisabled: {
    backgroundColor: '#3f3f46',
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
