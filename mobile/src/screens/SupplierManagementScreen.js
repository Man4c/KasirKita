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
  Alert,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  Building2,
  RotateCw,
  WifiOff,
  ChevronLeft,
} from 'lucide-react-native';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import SupplierCardItem from '../components/supplier/SupplierCardItem';
import SupplierFormModal from '../components/supplier/SupplierFormModal';
import { showAlert } from '../utils/alert';

/**
 * Format Rupiah currency helper
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function SupplierManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals (akan dihubungkan di Fase 4)
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | ACTIVE | INACTIVE
  const searchTimerRef = useRef(null);

  // Debounce search input 350ms
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 350);
  };

  const loadSuppliers = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await supplierService.getSuppliers({ all: true });
        setItems(res.items || []);
        setIsOffline(Boolean(res.fromCache));
      } catch (err) {
        console.warn('Gagal memuat daftar pemasok:', err.message);
        showAlert('Peringatan', err.message || 'Gagal memuat data pemasok. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleRefresh = () => {
    loadSuppliers(true);
  };

  // Open Create Supplier Modal
  const handleOpenCreate = () => {
    setSelectedSupplierForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Supplier Modal
  const handleEditSupplier = useCallback((supplier) => {
    setSelectedSupplierForEdit(supplier);
    setFormModalVisible(true);
  }, []);

  // Modal Success callback
  const handleFormSuccess = () => {
    loadSuppliers(false);
  };

  // Safe Delete Supplier
  const handleDeleteSupplier = useCallback(
    (supplier) => {
      if (!isOwner) {
        showAlert('Akses Ditolak', 'Hanya pemilik (Owner) yang berhak menghapus data pemasok.');
        return;
      }

      const executeDelete = async () => {
        try {
          await supplierService.deleteSupplier(supplier.id);
          showAlert('Berhasil', `Data pemasok "${supplier.name}" berhasil dihapus.`);
          loadSuppliers(false);
        } catch (err) {
          showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus pemasok.');
        }
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(
            `Hapus pemasok "${supplier.name}"?\nData riwayat pasokan barang tetap aman tersimpan.`
          );
          if (confirmed) {
            executeDelete();
          }
        }
      } else {
        Alert.alert(
          'Hapus Pemasok?',
          `Apakah Anda yakin ingin menghapus pemasok "${supplier.name}"? Riwayat pasokan sebelumnya tetap tersimpan.`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: 'Hapus',
              style: 'destructive',
              onPress: executeDelete,
            },
          ]
        );
      }
    },
    [isOwner, loadSuppliers]
  );

  // Aggregated Metrics Calculation (Dihitung stabil dari master seluruh pemasok toko)
  const totalCount = items.length;
  const activeCount = items.filter((item) => Boolean(item.is_active)).length;
  const totalRestocks = items.reduce((acc, curr) => acc + Number(curr.restocks_count || 0), 0);
  const totalPurchasesAmount = items.reduce((acc, curr) => acc + Number(curr.total_purchases || 0), 0);

  // Client-side Filtered Items (Instan 0ms latency tanpa refetch & angka header stabil)
  const displayedItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Filter Status Aktif
      if (statusFilter === 'ACTIVE' && !item.is_active) return false;
      if (statusFilter === 'INACTIVE' && item.is_active) return false;

      // 2. Filter Pencarian
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchContact = item.contact_person?.toLowerCase().includes(q);
        const matchPhone = item.phone?.includes(q);
        const matchEmail = item.email?.toLowerCase().includes(q);
        const matchBank = item.bank_account?.includes(q) || item.bank_name?.toLowerCase().includes(q);
        if (!matchName && !matchContact && !matchPhone && !matchEmail && !matchBank) return false;
      }

      return true;
    });
  }, [items, statusFilter, debouncedSearch]);

  // Status Filter Chips
  const statusChips = [
    { key: 'ALL', label: 'Semua Status' },
    { key: 'ACTIVE', label: 'Aktif' },
    { key: 'INACTIVE', label: 'Nonaktif' },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation && navigation.canGoBack && navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation && navigation.navigate) {
                  navigation.navigate('dashboard');
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={20} color="#f4f4f5" />
            </TouchableOpacity>

            <View style={styles.screenTitleContainer}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                Master Pemasok
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalCount} distributor ({activeCount} aktif) • Kulakan: {formatRp(totalPurchasesAmount)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleRefresh}
            disabled={refreshing || loading}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fb7185" />
            ) : (
              <RotateCw size={16} color="#e4e4e7" />
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Warning Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#fb7185" style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data cache lokal pemasok.
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color="#a1a1aa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama pemasok, sales, telepon, rekening..."
              placeholderTextColor="#a1a1aa"
              value={search}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity
                style={styles.clearSearchBtn}
                onPress={() => {
                  setSearch('');
                  setDebouncedSearch('');
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filter Row */}
        <View style={styles.filterRow}>
          {statusChips.map((chip) => {
            const isSelected = statusFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setStatusFilter(chip.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Content: Supplier List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#fb7185" />
            <Text style={styles.loadingText}>Memuat data distributor & pemasok...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <SupplierCardItem
                item={item}
                onEdit={handleEditSupplier}
                onDelete={handleDeleteSupplier}
                userRole={user?.role}
              />
            )}
            contentContainerStyle={[
              styles.listContent,
              displayedItems.length === 0 && styles.listContentEmpty,
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#fb7185"
                colors={['#fb7185']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Building2 size={36} color="#52525b" />
                </View>
                <Text style={styles.emptyTitle}>
                  {debouncedSearch
                    ? 'Pemasok Tidak Ditemukan'
                    : statusFilter !== 'ALL'
                    ? 'Tidak Ada Pemasok di Filter Ini'
                    : 'Belum Ada Pemasok'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {debouncedSearch
                    ? `Tidak ada distributor yang cocok dengan kata kunci "${debouncedSearch}". Periksa ejaan nama atau nomor telepon.`
                    : statusFilter !== 'ALL'
                    ? 'Tidak ada distributor yang sesuai dengan filter status yang Anda pilih.'
                    : 'Daftarkan distributor barang pertama Anda untuk mengelola kontak sales, nomor rekening, dan riwayat pasokan barang.'}
                </Text>

                {isOwner && !debouncedSearch && statusFilter === 'ALL' && (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={handleOpenCreate}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#ffffff" style={{ flexShrink: 0 }} />
                    <Text style={styles.emptyActionBtnText}>Daftarkan Pemasok Pertama</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button: Add Supplier */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color="#ffffff" style={{ flexShrink: 0 }} />
          <Text style={styles.fabText}>Tambah Pemasok</Text>
        </TouchableOpacity>
      )}

      {/* Modal Formulir Tambah / Edit Pemasok */}
      <SupplierFormModal
        visible={formModalVisible}
        supplier={selectedSupplierForEdit}
        onClose={() => setFormModalVisible(false)}
        onSuccess={handleFormSuccess}
      />
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
    flex: 1,
    minWidth: 0,
    gap: 10,
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
    color: '#f4f4f5',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
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
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  filterPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterPillActive: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderWidth: 1,
    borderColor: '#e11d48',
  },
  filterPillText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterPillTextActive: {
    color: '#fb7185',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  listContent: {
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#f4f4f5',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
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
