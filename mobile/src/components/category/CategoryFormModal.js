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
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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
              <View style={styles.iconCircle}>
                <FolderTree size={20} color='#fb7185' />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {isEditMode ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {isEditMode
                    ? 'Perbarui data pengelompokan produk toko'
                    : 'Kelompokkan produk agar kasir mudah mencari barang'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color='#a1a1aa' />
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
                placeholderTextColor='#a1a1aa'
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
                  placeholderTextColor='#a1a1aa'
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
                placeholderTextColor='#a1a1aa'
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    borderBottomWidth: 0,
    borderColor: '#27272a',
    width: '100%',
    maxHeight: '90%',
    paddingTop: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
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
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
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
    lineHeight: 16,
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
    color: '#a1a1aa',
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
    color: '#a1a1aa',
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
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#18181b',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
  },
  submitBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#e11d48',
  },
  submitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
});
