import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  FolderTree,
  RotateCw,
  WifiOff,
  ChevronLeft,
  Package,
  Sparkles,
} from 'lucide-react-native';
import { categoryService } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import CategoryCardItem from '../components/category/CategoryCardItem';
import CategoryFormModal from '../components/category/CategoryFormModal';
import { showAlert } from '../utils/alert';

export default function CategoryManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef(null);

  // Debounce search input 350ms
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 350);
  };

  const loadCategories = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await categoryService.getCategories({
        search: debouncedSearch.trim() || undefined,
      });
      setCategories(res.categories || []);
      setIsOffline(Boolean(res.fromCache));
    } catch (err) {
      console.warn('Gagal memuat daftar kategori:', err.message);
      showAlert('Peringatan', 'Gagal memuat data kategori. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRefresh = () => {
    loadCategories(true);
  };

  // Open Create Modal
  const handleOpenCreateCategory = () => {
    setSelectedCategoryForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Modal
  const handleEditCategory = useCallback((cat) => {
    setSelectedCategoryForEdit(cat);
    setFormModalVisible(true);
  }, []);

  // Delete Category confirmation
  const handleDeleteCategory = useCallback((cat) => {
    const count = Number(cat.products_count || 0);
    if (count > 0) {
      showAlert(
        'Kategori Tidak Dapat Dihapus',
        `Kategori "${cat.name}" masih menaungi ${count} produk. Harap pindahkan atau kosongkan produk terlebih dahulu sebelum menghapus kategori ini.`
      );
      return;
    }

    showAlert(
      'Hapus Kategori',
      `Apakah Anda yakin ingin menghapus kategori "${cat.name}"? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await categoryService.deleteCategory(cat.id);
              setCategories((prev) => prev.filter((c) => c.id !== cat.id));
              showAlert('Berhasil', `Kategori "${cat.name}" telah dihapus.`);
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus kategori.');
            }
          },
        },
      ]
    );
  }, []);

  // Modal save success callback
  const handleFormSuccess = (savedCategory, isEditMode) => {
    if (isEditMode) {
      setCategories((prev) =>
        prev.map((c) => (c.id === savedCategory.id ? { ...c, ...savedCategory } : c))
      );
    } else {
      setCategories((prev) => [savedCategory, ...prev]);
    }
    setFormModalVisible(false);
  };

  // Summary counts
  const totalCategories = categories.length;
  const activeCategoriesWithProducts = categories.filter(
    (c) => Number(c.products_count || 0) > 0
  ).length;

  const renderItem = useCallback(
    ({ item }) => (
      <CategoryCardItem
        item={item}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
        userRole={user?.role || 'owner'}
      />
    ),
    [handleEditCategory, handleDeleteCategory, user?.role]
  );

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {navigation?.goBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color='#f4f4f5' />
              </TouchableOpacity>
            )}
            <View style={styles.screenTitleContainer}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                Master Kategori
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalCategories} kategori terdaftar
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleRefresh}
            disabled={refreshing}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <RotateCw size={16} color='#e4e4e7' />
          </TouchableOpacity>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color='#fbbf24' style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data kategori lokal
            </Text>
          </View>
        )}

        {/* Summary Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Total Kategori</Text>
              <FolderTree size={14} color='#f43f5e' />
            </View>
            <Text style={styles.metricValue}>{totalCategories}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricLabel}>Ada Produk</Text>
              <Package size={14} color='#34d399' />
            </View>
            <Text style={styles.metricValue}>{activeCategoriesWithProducts}</Text>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={16} color='#a1a1aa' style={{ flexShrink: 0 }} />
            <TextInput
              style={styles.searchInput}
              placeholder='Cari kategori, slug, deskripsi...'
              placeholderTextColor='#a1a1aa'
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setDebouncedSearch('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={15} color='#a1a1aa' />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* List Content */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size='large' color='#e11d48' />
            <Text style={styles.loadingText}>Memuat master kategori...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            updateCellsBatchingPeriod={50}
            removeClippedSubviews={Platform.OS === 'android'}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor='#e11d48'
                colors={['#e11d48']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FolderTree size={48} color='#3f3f46' />
                <Text style={styles.emptyTitle}>
                  {search.trim() ? 'Kategori Tidak Ditemukan' : 'Belum Ada Kategori'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {search.trim()
                    ? `Tidak ada kategori yang cocok dengan "${search}"`
                    : 'Mulai kelompokkan produk toko Anda dengan menambahkan kategori pertama.'}
                </Text>
                {isOwner && !search.trim() && (
                  <TouchableOpacity
                    style={styles.emptyCreateBtn}
                    onPress={handleOpenCreateCategory}
                  >
                    <Plus size={16} color='#ffffff' />
                    <Text style={styles.emptyCreateBtnText}>Tambah Kategori</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button (FAB) */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={handleOpenCreateCategory}
        >
          <Plus size={22} color='#ffffff' />
        </TouchableOpacity>
      )}

      {/* Modal Form Tambah / Edit Kategori */}
      {formModalVisible && (
        <CategoryFormModal
          visible={formModalVisible}
          category={selectedCategoryForEdit}
          onClose={() => setFormModalVisible(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  screenTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
    color: '#f4f4f5',
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fbbf24',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 0,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#f4f4f5',
  },
  searchRow: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#f4f4f5',
    paddingVertical: 0,
  },
  listContainer: {
    paddingBottom: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
