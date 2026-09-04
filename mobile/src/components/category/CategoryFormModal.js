import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { X, FolderTree, Sparkles, Check, Trash2, Tag, FileText } from 'lucide-react-native';
import { categoryService } from '../../services/categoryService';
import { showAlert } from '../../utils/alert';

export default function CategoryFormModal({
  visible,
  category,
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(category?.id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Pre-fill form on edit or reset on create
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setDescription(category.description || '');
      setIsCustomSlug(true);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIsCustomSlug(false);
    }
    setErrors({});
  }, [category, visible]);

  // Auto-generate slug when name changes if user hasn't typed a custom slug
  const handleNameChange = (val) => {
    setName(val);
    if (errors.name) setErrors((prev) => ({ ...prev, name: null }));

    if (!isCustomSlug && !isEditMode) {
      const generatedSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSlugChange = (val) => {
    setIsCustomSlug(true);
    const cleanSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '');
    setSlug(cleanSlug);
    if (errors.slug) setErrors((prev) => ({ ...prev, slug: null }));
  };

  const validateForm = () => {
    const errs = {};
    if (!name.trim()) {
      errs.name = 'Nama kategori wajib diisi';
    } else if (name.trim().length < 2) {
      errs.name = 'Nama kategori minimal 2 karakter';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || undefined,
        description: description.trim() || undefined,
      };

      let result;
      if (isEditMode) {
        result = await categoryService.updateCategory(category.id, payload);
        showAlert('Berhasil', `Kategori "${result.name}" berhasil diperbarui!`);
      } else {
        result = await categoryService.createCategory(payload);
        showAlert('Berhasil', `Kategori "${result.name}" berhasil ditambahkan!`);
      }

      if (onSuccess) {
        onSuccess(result, isEditMode);
      }
    } catch (err) {
      console.warn('Gagal simpan kategori:', err.message);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType='fade' transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <FolderTree size={20} color='#38bdf8' />
              </View>
              <View>
                <Text style={styles.modalTitle}>
                  {isEditMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditMode
                    ? 'Perbarui data pengelompokan produk toko'
                    : 'Kelompokkan produk agar kasir mudah mencari barang'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color='#a1a1aa' />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Nama Kategori (Wajib) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Nama Kategori <Text style={styles.requiredMark}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder='Contoh: Makanan Berat, Minuman Dingin...'
                placeholderTextColor='#71717a'
                value={name}
                onChangeText={handleNameChange}
              />
              {errors.name ? (
                <Text style={styles.errorText}>{errors.name}</Text>
              ) : null}
            </View>

            {/* Slug URL (Opsional) */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Slug Identifikasi</Text>
                <Text style={styles.subLabel}>Otomatis dari nama</Text>
              </View>
              <View style={styles.slugInputWrapper}>
                <Text style={styles.slugPrefix}>/</Text>
                <TextInput
                  style={styles.slugInput}
                  placeholder='makanan-berat'
                  placeholderTextColor='#71717a'
                  value={slug}
                  onChangeText={handleSlugChange}
                  autoCapitalize='none'
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Deskripsi (Opsional) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Deskripsi (Opsional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder='Catatan tambahan atau peruntukan kategori barang ini...'
                placeholderTextColor='#71717a'
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical='top'
              />
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size='small' color='#ffffff' />
              ) : (
                <>
                  <Check size={16} color='#ffffff' />
                  <Text style={styles.submitBtnText}>
                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Kategori'}
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
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  scrollBody: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#e4e4e7',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#71717a',
  },
  requiredMark: {
    color: '#f43f5e',
  },
  input: {
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
  inputError: {
    borderColor: '#f43f5e',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#f43f5e',
    marginTop: 4,
  },
  slugInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  slugPrefix: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#71717a',
    marginRight: 4,
    flexShrink: 0,
  },
  slugInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#f4f4f5',
    paddingVertical: 0,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#27272a',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0284c7',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
