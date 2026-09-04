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
  Switch,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Save,
  ScanBarcode,
  Trash2,
  AlertCircle,
  Package,
  Layers,
  DollarSign,
  Scale,
} from 'lucide-react-native';
import { productService } from '../../services/productService';
import { showAlert } from '../../utils/alert';
import ProductBarcodeScannerModal from './ProductBarcodeScannerModal';

export default function ProductFormModal({
  visible,
  product = null, // null jika tambah baru, object jika edit
  categories = [],
  units = [],
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(product && product.id);

  // Form states
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [baseUnitId, setBaseUnitId] = useState('');
  const [skuBarcode, setSkuBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [avgCost, setAvgCost] = useState('');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('5');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isForSale, setIsForSale] = useState(true);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Initialize form when opened
  useEffect(() => {
    if (visible) {
      if (product) {
        setName(product.name || '');
        setCategoryId(product.category_id || '');
        setBaseUnitId(product.base_unit_id || '');
        setSkuBarcode(product.sku_barcode || '');
        setPrice(product.price ? String(Math.round(Number(product.price))) : '');
        setAvgCost(product.avg_cost ? String(Math.round(Number(product.avg_cost))) : '');
        setStock(product.stock !== undefined ? String(Number(product.stock)) : '0');
        setMinStock(product.min_stock !== undefined ? String(Number(product.min_stock)) : '5');
        setDescription(product.description || '');
        setIsActive(product.is_active !== false);
        setIsForSale(product.is_for_sale !== false);
      } else {
        // Reset to clean defaults
        setName('');
        setCategoryId(categories[0]?.id || '');
        setBaseUnitId(units.find((u) => u.symbol?.toLowerCase() === 'pcs')?.id || units[0]?.id || '');
        setSkuBarcode('');
        setPrice('');
        setAvgCost('');
        setStock('0');
        setMinStock('5');
        setDescription('');
        setIsActive(true);
        setIsForSale(true);
      }
    }
  }, [visible, product, categories, units]);

  // Clean raw digits for currency inputs
  const handlePriceChange = (val) => {
    const digits = val.replace(/\D/g, '');
    setPrice(digits);
  };

  const handleCostChange = (val) => {
    const digits = val.replace(/\D/g, '');
    setAvgCost(digits);
  };

  const formatDisplayRp = (val) => {
    if (!val) return '';
    return Number(val).toLocaleString('id-ID');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showAlert('Validasi Gagal', 'Nama produk wajib diisi.');
      return;
    }
    if (!price || Number(price) <= 0) {
      showAlert('Validasi Gagal', 'Harga jual produk wajib diisi dan harus lebih dari Rp0.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: name.trim(),
        category_id: categoryId || null,
        base_unit_id: baseUnitId || null,
        sku_barcode: skuBarcode.trim() || null,
        price: Number(price),
        avg_cost: avgCost ? Number(avgCost) : 0,
        min_stock: Number(minStock) || 0,
        is_active: isActive,
        is_for_sale: isForSale,
        description: description.trim() || null,
      };

      if (!isEdit) {
        payload.stock = Number(stock) || 0;
        await productService.createProduct(payload);
        showAlert('Berhasil', `Produk "${name}" berhasil ditambahkan ke katalog.`);
      } else {
        await productService.updateProduct(product.id, payload);
        showAlert('Berhasil', `Perubahan produk "${name}" berhasil disimpan.`);
      }

      if (onSaved) onSaved();
      if (onClose) onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Terjadi kesalahan sistem.';
      showAlert('Gagal Menyimpan', errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isEdit) return;

    const executeDelete = async () => {
      try {
        setDeleting(true);
        await productService.deleteProduct(product.id);
        showAlert('Berhasil', `Produk "${product.name}" berhasil dihapus.`);
        if (onSaved) onSaved();
        if (onClose) onClose();
      } catch (err) {
        showAlert('Gagal Menghapus', err.response?.data?.message || err.message);
      } finally {
        setDeleting(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Yakin ingin menghapus produk "${product.name}"?`)) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Konfirmasi Hapus Produk',
        `Apakah Anda yakin ingin menghapus produk "${product.name}"? Riwayat transaksi lama tetap tersimpan aman.`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header Modal */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconBox}>
                <Package size={18} color="#fb7185" />
              </View>
              <View>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {isEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
                </Text>
                <Text style={styles.headerSubtitle} numberOfLines={1}>
                  {isEdit ? 'Perbarui informasi katalog & harga' : 'Lengkapi informasi produk & stok awal'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} disabled={saving || deleting}>
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Form Scrollable Body */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Section 1: Identitas Produk */}
            <Text style={styles.sectionHeading}>Informasi Dasar</Text>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>
                Nama Produk <Text style={styles.requiredStar}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Contoh: Kopi Susu Aren"
                placeholderTextColor="#a1a1aa"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Kategori Picker Chips */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {categories.map((c) => {
                  const isSelected = categoryId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.pickerChip, isSelected && styles.pickerChipActive]}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Satuan Dasar (Base Unit) */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Satuan Dasar (Unit)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
                {units.map((u) => {
                  const isSelected = baseUnitId === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.pickerChip, isSelected && styles.pickerChipActive]}
                      onPress={() => setBaseUnitId(u.id)}
                    >
                      <Text style={[styles.pickerChipText, isSelected && styles.pickerChipTextActive]}>
                        {u.name} ({u.symbol})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Barcode Scanner Input */}
            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Kode Barcode / SKU</Text>
              <View style={styles.barcodeInputGroup}>
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="Scan atau ketik kode barcode kemasan"
                  placeholderTextColor="#a1a1aa"
                  value={skuBarcode}
                  onChangeText={setSkuBarcode}
                />
                <TouchableOpacity
                  style={styles.scanTriggerBtn}
                  activeOpacity={0.7}
                  onPress={() => setScannerOpen(true)}
                >
                  <ScanBarcode size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 2: Harga & Modal */}
            <Text style={styles.sectionHeading}>Harga & Nilai Modal</Text>

            <View style={styles.twoColRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>
                  Harga Jual (Rp) <Text style={styles.requiredStar}>*</Text>
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  value={formatDisplayRp(price)}
                  onChangeText={handlePriceChange}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>HPP / Modal (Rp)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  value={formatDisplayRp(avgCost)}
                  onChangeText={handleCostChange}
                />
              </View>
            </View>

            {/* Section 3: Pengaturan Stok */}
            <Text style={styles.sectionHeading}>Manajemen Stok</Text>

            <View style={styles.twoColRow}>
              {!isEdit && (
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Stok Awal</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    placeholderTextColor="#a1a1aa"
                    keyboardType="numeric"
                    value={stock}
                    onChangeText={setStock}
                  />
                </View>
              )}

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Batas Stok Menipis</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  value={minStock}
                  onChangeText={setMinStock}
                />
              </View>
            </View>

            {/* Section 4: Toggle Status */}
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Tersedia di Kasir POS</Text>
                <Text style={styles.toggleDesc}>Tampilkan produk di terminal penjualan kasir</Text>
              </View>
              <Switch
                value={isForSale}
                onValueChange={setIsForSale}
                thumbColor={isForSale ? '#e11d48' : '#a1a1aa'}
                trackColor={{ false: '#27272a', true: 'rgba(225, 29, 72, 0.4)' }}
              />
            </View>

            {/* Tombol Hapus Produk (Khusus Edit) */}
            {isEdit && (
              <TouchableOpacity
                style={styles.deleteBtn}
                activeOpacity={0.7}
                onPress={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#f87171" />
                ) : (
                  <>
                    <Trash2 size={16} color="#f87171" />
                    <Text style={styles.deleteBtnText}>Hapus Produk dari Katalog</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving || deleting}>
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving || deleting}>
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={16} color="#ffffff" />
                  <Text style={styles.saveBtnText}>
                    {isEdit ? 'Simpan Perubahan' : 'Tambah Produk'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Barcode Scanner Camera Modal */}
      <ProductBarcodeScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanBarcode={(code) => setSkuBarcode(code)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  headerRow: {
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
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
    marginTop: 10,
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
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
    height: 42,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#f4f4f5',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  pickerChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  pickerChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  pickerChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  barcodeInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  toggleDesc: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  deleteBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f87171',
  },
  footerRow: {
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
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#e11d48',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
