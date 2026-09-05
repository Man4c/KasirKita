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
  FolderTree,
  Check,
  X,
  Package,
  ArrowRightLeft,
  Layers,
} from 'lucide-react-native';

export default function CategoryDeleteModal({
  visible,
  category,
  allCategories = [],
  onClose,
  onConfirm,
  loading = false,
}) {
  const [selectedAction, setSelectedAction] = useState('uncategorize'); // 'uncategorize' | 'reassign'
  const [targetCategoryId, setTargetCategoryId] = useState('');

  // Kategori alternatif yang bisa dipilih (mengecualikan kategori yang sedang dihapus)
  const availableCategories = (allCategories || []).filter(
    (c) => c.id !== category?.id
  );

  useEffect(() => {
    if (visible) {
      if (availableCategories.length > 0) {
        setTargetCategoryId(availableCategories[0].id);
      } else {
        setSelectedAction('uncategorize');
        setTargetCategoryId('');
      }
    }
  }, [visible, category]);

  const productCount = Number(category?.products_count || 0);

  const handleExecute = () => {
    if (selectedAction === 'reassign' && !targetCategoryId) {
      return;
    }
    onConfirm({
      action: selectedAction,
      target_category_id: selectedAction === 'reassign' ? targetCategoryId : undefined,
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
          {/* Drag Handle Bar */}
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
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Kategori Berisi Produk
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {category?.name} ({productCount} produk terkait)
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
                Terdapat <Text style={styles.infoBold}>{productCount} produk</Text> di dalam kategori <Text style={styles.infoBold}>"{category?.name}"</Text>. Produk tidak akan terhapus. Silakan tentukan tindakan untuk produk tersebut:
              </Text>
            </View>

            {/* Opsi 1: Pindahkan ke Kategori Lain (Reassign) */}
            {availableCategories.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  selectedAction === 'reassign' && styles.optionCardSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedAction('reassign')}
              >
                <View style={styles.optionHeader}>
                  <View style={styles.radioOuter}>
                    {selectedAction === 'reassign' && <View style={styles.radioInner} />}
                  </View>
                  <View style={styles.optionTitleCol}>
                    <View style={styles.optionTitleRow}>
                      <ArrowRightLeft size={15} color={selectedAction === 'reassign' ? '#38bdf8' : '#a1a1aa'} />
                      <Text style={[styles.optionTitle, selectedAction === 'reassign' && styles.optionTitleActive]}>
                        Pindahkan ke Kategori Lain
                      </Text>
                    </View>
                    <Text style={styles.optionDesc}>
                      Pindahkan semua {productCount} produk ke kategori alternatif secara instan.
                    </Text>
                  </View>
                </View>

                {/* Dropdown / Category Picker */}
                {selectedAction === 'reassign' && (
                  <View style={styles.pickerSection}>
                    <Text style={styles.pickerLabel}>Pilih Kategori Tujuan:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.categoryChipsRow}
                    >
                      {availableCategories.map((c) => {
                        const isChosen = targetCategoryId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.targetChip, isChosen && styles.targetChipActive]}
                            onPress={() => setTargetCategoryId(c.id)}
                            activeOpacity={0.7}
                          >
                            <FolderTree size={12} color={isChosen ? '#38bdf8' : '#a1a1aa'} />
                            <Text
                              style={[
                                styles.targetChipText,
                                isChosen && styles.targetChipTextActive,
                              ]}
                              numberOfLines={1}
                            >
                              {c.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Opsi 2: Jadikan Tanpa Kategori (Uncategorize) */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedAction === 'uncategorize' && styles.optionCardSelected,
              ]}
              activeOpacity={0.8}
              onPress={() => setSelectedAction('uncategorize')}
            >
              <View style={styles.optionHeader}>
                <View style={styles.radioOuter}>
                  {selectedAction === 'uncategorize' && <View style={styles.radioInner} />}
                </View>
                <View style={styles.optionTitleCol}>
                  <View style={styles.optionTitleRow}>
                    <Layers size={15} color={selectedAction === 'uncategorize' ? '#fb7185' : '#a1a1aa'} />
                    <Text style={[styles.optionTitle, selectedAction === 'uncategorize' && styles.optionTitleActive]}>
                      Jadikan "Tanpa Kategori"
                    </Text>
                  </View>
                  <Text style={styles.optionDesc}>
                    Semua {productCount} produk tetap aman di katalog & kasir POS, dan dapat difilter di tab "Tanpa Kategori".
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
                selectedAction === 'reassign' && !targetCategoryId && styles.submitBtnDisabled,
              ]}
              onPress={handleExecute}
              disabled={loading || (selectedAction === 'reassign' && !targetCategoryId)}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>
                    {selectedAction === 'reassign'
                      ? 'Pindahkan & Hapus'
                      : 'Lepas & Hapus'}
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
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 16,
      },
    }),
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
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  iconCircleWarning: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    flexShrink: 0,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#a1a1aa',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
    flexShrink: 0,
  },
  scrollBody: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  infoBannerText: {
    fontSize: 12,
    color: '#f4f4f5',
    lineHeight: 18,
    flex: 1,
  },
  infoBold: {
    fontWeight: '700',
    color: '#fbbf24',
  },
  optionCard: {
    backgroundColor: '#202024',
    borderWidth: 1.5,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  optionCardSelected: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#71717a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e11d48',
  },
  optionTitleCol: {
    flex: 1,
    minWidth: 0,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  optionTitleActive: {
    color: '#ffffff',
  },
  optionDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 17,
  },
  pickerSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d4d4d8',
    marginBottom: 8,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  targetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  targetChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  targetChipText: {
    fontSize: 12,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  targetChipTextActive: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3f3f46',
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  submitBtn: {
    flex: 1.5,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
