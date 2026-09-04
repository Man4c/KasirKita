import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Boxes,
  PlusCircle,
  Truck,
  FileText,
  AlertCircle,
  Calculator,
  ArrowRight,
} from 'lucide-react-native';
import { productService } from '../../services/productService';
import { formatRp } from '../../utils/format';
import { showAlert } from '../../utils/alert';

export default function QuickStockAdjustModal({
  visible,
  product,
  onClose,
  onSuccess,
}) {
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  const [suppliers, setSuppliers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Reset & load suppliers when modal opens
  useEffect(() => {
    if (visible && product) {
      setQuantity('');
      // Default unit cost to existing avg_cost if available
      const initialCost = product.avg_cost ? String(Math.round(Number(product.avg_cost))) : '';
      setUnitCost(initialCost);
      setSupplierId('');
      setNotes('');

      productService.getSuppliers().then((list) => {
        setSuppliers(list || []);
      });
    }
  }, [visible, product]);

  if (!visible || !product) return null;

  const currentStock = Number(product.stock || 0);
  const currentAvgCost = Number(product.avg_cost || 0);
  const unitSymbol = product.base_unit?.symbol || product.base_unit?.name || 'pcs';

  const incomingQty = Number(quantity || 0);
  const incomingCost = Number(unitCost || 0);

  // Moving Average Cost Simulation
  const newStock = currentStock + incomingQty;
  const totalIncomingCost = incomingQty * incomingCost;
  const currentTotalValuation = currentStock * currentAvgCost;
  const newAvgCost =
    newStock > 0 ? (currentTotalValuation + totalIncomingCost) / newStock : incomingCost;

  const handleQtyChange = (val) => {
    const clean = val.replace(/\D/g, '');
    setQuantity(clean);
  };

  const handleCostChange = (val) => {
    const clean = val.replace(/\D/g, '');
    setUnitCost(clean);
  };

  const handleSubmit = async () => {
    if (!incomingQty || incomingQty <= 0) {
      showAlert('Validasi Gagal', 'Jumlah barang masuk harus lebih dari 0.');
      return;
    }
    if (incomingCost < 0) {
      showAlert('Validasi Gagal', 'Harga beli/modal unit tidak boleh negatif.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        quantity: incomingQty,
        unit_cost: incomingCost,
        supplier_id: supplierId || null,
        notes: notes.trim() || null,
      };

      await productService.restockProduct(product.id, payload);

      showAlert(
        'Stok Berhasil Masuk',
        `Restock ${incomingQty} ${unitSymbol} untuk "${product.name}" berhasil dicatat.`
      );

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal mencatat restock barang.';
      showAlert('Gagal Restock', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <PlusCircle size={18} color="#34d399" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  Stok Masuk / Restock
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {product.name}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={submitting}>
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Status Stok & HPP Saat Ini */}
            <View style={styles.currentStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Stok Saat Ini</Text>
                <Text style={styles.statValue}>
                  {currentStock} <Text style={styles.unitText}>{unitSymbol}</Text>
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>HPP Rata-rata</Text>
                <Text style={styles.statValue}>{formatRp(currentAvgCost)}</Text>
              </View>
            </View>

            {/* Input Jumlah Barang Masuk */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Jumlah Masuk ({unitSymbol}) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                value={quantity}
                onChangeText={handleQtyChange}
              />
            </View>

            {/* Input Harga Beli / Kulakan per Unit */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Harga Modal Beli / Kulakan per {unitSymbol} (Rp) <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                placeholderTextColor="#71717a"
                keyboardType="numeric"
                value={unitCost ? Number(unitCost).toLocaleString('id-ID') : ''}
                onChangeText={handleCostChange}
              />
            </View>

            {/* Live Simulation Card (Moving Average & New Stock) */}
            {incomingQty > 0 && (
              <View style={styles.simulationCard}>
                <View style={styles.simHeader}>
                  <Calculator size={14} color="#38bdf8" />
                  <Text style={styles.simTitle}>Simulasi Perhitungan Otomatis</Text>
                </View>

                <View style={styles.simRow}>
                  <Text style={styles.simLabel}>Estimasi Stok Baru</Text>
                  <View style={styles.simValueWrapper}>
                    <Text style={styles.simOldValue}>{currentStock}</Text>
                    <ArrowRight size={12} color="#71717a" />
                    <Text style={styles.simNewStock}>{newStock} {unitSymbol}</Text>
                  </View>
                </View>

                <View style={styles.simRow}>
                  <Text style={styles.simLabel}>HPP Rata-rata Baru</Text>
                  <View style={styles.simValueWrapper}>
                    <Text style={styles.simOldValue}>{formatRp(currentAvgCost)}</Text>
                    <ArrowRight size={12} color="#71717a" />
                    <Text style={styles.simNewCost}>{formatRp(Math.round(newAvgCost))}</Text>
                  </View>
                </View>

                <View style={styles.simTotalRow}>
                  <Text style={styles.simTotalLabel}>Total Biaya Pembelian</Text>
                  <Text style={styles.simTotalValue}>{formatRp(totalIncomingCost)}</Text>
                </View>
              </View>
            )}

            {/* Pemasok / Supplier Picker Chips */}
            {suppliers.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>Pemasok / Distributor (Opsional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, !supplierId && styles.chipActive]}
                    onPress={() => setSupplierId('')}
                  >
                    <Text style={[styles.chipText, !supplierId && styles.chipTextActive]}>
                      Tanpa Pemasok
                    </Text>
                  </TouchableOpacity>
                  {suppliers.map((s) => {
                    const isSelected = supplierId === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setSupplierId(s.id)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                          {s.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Catatan Pasokan */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Catatan Pasokan / Invoice No. (Opsional)</Text>
              <TextInput
                style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
                placeholder="Contoh: Beli dari Pasar Induk / No. Faktur SP-982"
                placeholderTextColor="#71717a"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={{ height: 16 }} />
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={submitting}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#09090b" />
              ) : (
                <>
                  <Boxes size={16} color="#09090b" />
                  <Text style={styles.submitBtnText}>Simpan Stok Masuk</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#34d399',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  currentStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#27272a',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#f4f4f5',
  },
  unitText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#71717a',
  },
  formGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
    marginBottom: 5,
  },
  requiredStar: {
    color: '#fb7185',
  },
  textInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#f4f4f5',
  },
  simulationCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(56, 189, 248, 0.15)',
    paddingBottom: 6,
    marginBottom: 2,
  },
  simTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#38bdf8',
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  simValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simOldValue: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#71717a',
    textDecorationLine: 'line-through',
  },
  simNewStock: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#34d399',
  },
  simNewCost: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#38bdf8',
  },
  simTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.15)',
    paddingTop: 6,
    marginTop: 2,
  },
  simTotalLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#e4e4e7',
  },
  simTotalValue: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  chipActive: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: '#34d399',
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  chipTextActive: {
    color: '#34d399',
    fontFamily: 'Poppins_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#34d399',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#09090b',
  },
});
