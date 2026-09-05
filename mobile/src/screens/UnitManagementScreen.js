import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Scale,
  RotateCw,
  WifiOff,
  ChevronLeft,
  Package,
} from 'lucide-react-native';
import { unitService } from '../services/unitService';
import { useAuth } from '../context/AuthContext';
import UnitCardItem from '../components/unit/UnitCardItem';
import UnitFormModal from '../components/unit/UnitFormModal';
import { showAlert } from '../utils/alert';

export default function UnitManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedUnitForEdit, setSelectedUnitForEdit] = useState(null);

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

  const loadUnits = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await unitService.getUnits();
      setUnits(res.units || []);
      setIsOffline(Boolean(res.fromCache));
    } catch (err) {
      console.warn('Gagal memuat daftar satuan:', err.message);
      showAlert('Peringatan', 'Gagal memuat data satuan barang. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadUnits();
  }, [loadUnits]);

  const handleRefresh = () => {
    loadUnits(true);
  };

  // Open Create Modal
  const handleOpenCreateUnit = () => {
    setSelectedUnitForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Modal
  const handleEditUnit = useCallback((unit) => {
    setSelectedUnitForEdit(unit);
    setFormModalVisible(true);
  }, []);

  // Delete Unit confirmation
  const handleDeleteUnit = useCallback((unit) => {
    const productsCount = Number(unit.products_count || 0);
    const conversionsCount = Number(unit.conversions_count || 0);
    const totalUsage = productsCount + conversionsCount;

    if (totalUsage > 0) {
      showAlert(
        'Satuan Tidak Dapat Dihapus',
        `Satuan "${unit.name}" (${unit.symbol}) masih digunakan oleh ${productsCount} produk dasar dan ${conversionsCount} varian multi-konversi. Hapus keterkaitan produk terlebih dahulu.`
      );
      return;
    }

    showAlert(
      'Hapus Satuan',
      `Apakah Anda yakin ingin menghapus satuan "${unit.name}" (${unit.symbol})? Tindakan ini tidak dapat dibatalkan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await unitService.deleteUnit(unit.id);
              setUnits((prev) => prev.filter((u) => u.id !== unit.id));
              showAlert('Berhasil', `Satuan "${unit.name}" telah dihapus.`);
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus satuan.');
            }
          },
        },
      ]
    );
  }, []);

  // Modal save success callback
  const handleFormSuccess = (savedUnit, isEditMode) => {
    if (isEditMode) {
      setUnits((prev) =>
        prev.map((u) => (u.id === savedUnit.id ? { ...u, ...savedUnit } : u))
      );
    } else {
      setUnits((prev) => [savedUnit, ...prev]);
    }
    setFormModalVisible(false);
  };

  // Summary counts (Dihitung stabil dari master seluruh satuan barang)
  const totalUnits = units.length;
  const activeUnitsWithUsage = units.filter(
    (u) => Number(u.products_count || 0) + Number(u.conversions_count || 0) > 0
  ).length;

  // Client-side Filtered Items (Instan 0ms latency tanpa refetch & angka header stabil)
  const displayedUnits = useMemo(() => {
    if (!debouncedSearch.trim()) return units;
    const q = debouncedSearch.toLowerCase().trim();
    return units.filter((u) => {
      const matchName = u.name?.toLowerCase().includes(q);
      const matchSymbol = u.symbol?.toLowerCase().includes(q);
      const matchDesc = u.description?.toLowerCase().includes(q);
      return matchName || matchSymbol || matchDesc;
    });
  }, [units, debouncedSearch]);

  const renderItem = useCallback(
    ({ item }) => (
      <UnitCardItem
        item={item}
        onEdit={handleEditUnit}
        onDelete={handleDeleteUnit}
        userRole={user?.role || 'owner'}
      />
    ),
    [handleEditUnit, handleDeleteUnit, user?.role]
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
                Master Satuan
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalUnits} satuan terdaftar • {activeUnitsWithUsage} digunakan produk
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
            <WifiOff size={13} color='#fb7185' style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data cache lokal satuan.
            </Text>
          </View>
        )}

        {/* Search Input Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={16} color='#a1a1aa' style={{ flexShrink: 0 }} />
            <TextInput
              style={styles.searchInput}
              placeholder='Cari satuan (nama, simbol pcs, box, kg)...'
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
            <Text style={styles.loadingText}>Memuat master satuan...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedUnits}
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
                <Scale size={48} color='#3f3f46' />
                <Text style={styles.emptyTitle}>
                  {debouncedSearch.trim() ? 'Satuan Tidak Ditemukan' : 'Belum Ada Satuan Barang'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {debouncedSearch.trim()
                    ? `Tidak ada satuan yang cocok dengan "${debouncedSearch}"`
                    : 'Daftarkan unit satuan barang Anda seperti pcs, box, kg, atau botol untuk mempermudah penjualan.'}
                </Text>
                {isOwner && !debouncedSearch.trim() && (
                  <TouchableOpacity
                    style={styles.emptyCreateBtn}
                    onPress={handleOpenCreateUnit}
                  >
                    <Plus size={16} color='#ffffff' />
                    <Text style={styles.emptyCreateBtnText}>Tambah Satuan</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button (FAB) Owner */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={handleOpenCreateUnit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color='#ffffff' style={{ flexShrink: 0 }} />
          <Text style={styles.fabText}>Tambah Satuan</Text>
        </TouchableOpacity>
      )}

      {/* Modal Form Tambah / Edit Satuan */}
      {formModalVisible && (
        <UnitFormModal
          visible={formModalVisible}
          unit={selectedUnitForEdit}
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
    gap: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fb7185',
    flex: 1,
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
    paddingBottom: 100,
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
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});
