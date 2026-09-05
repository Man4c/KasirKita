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
  ReceiptText,
  Coins,
  RotateCw,
  WifiOff,
  ChevronLeft,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react-native';
import { taxService } from '../services/taxService';
import { useAuth } from '../context/AuthContext';
import TaxCardItem from '../components/tax/TaxCardItem';
import TaxFormModal from '../components/tax/TaxFormModal';
import { showAlert } from '../utils/alert';

export default function TaxManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [togglingId, setTogglingId] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | TAX | FEE
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

  const loadItems = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await taxService.getTaxesAndFees({
        search: debouncedSearch.trim() || undefined,
        is_tax: activeTab === 'ALL' ? undefined : activeTab === 'TAX',
        is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
      });
      setItems(res.items || []);
      setIsOffline(Boolean(res.fromCache));
    } catch (err) {
      console.warn('Gagal memuat daftar pajak & biaya:', err.message);
      showAlert('Peringatan', 'Gagal memuat data pajak dan biaya toko. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, activeTab, statusFilter]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleRefresh = () => {
    loadItems(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setSelectedItemForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Modal
  const handleEditItem = useCallback((item) => {
    setSelectedItemForEdit(item);
    setFormModalVisible(true);
  }, []);

  // Toggle Active Status with optimistic UI and loading protection
  const handleToggleStatus = useCallback(async (item) => {
    if (togglingId === item.id) return; // Prevent double-trigger
    const originalState = item.is_active;
    const newStatus = !originalState;

    setTogglingId(item.id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, is_active: newStatus } : i))
    );

    try {
      const updated = await taxService.toggleStatus(item.id);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, ...updated } : i))
      );
    } catch (err) {
      // Revert upon failure
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: originalState } : i))
      );
      showAlert('Gagal Mengubah Status', err.message || 'Terjadi kesalahan saat mengubah status.');
    } finally {
      setTogglingId(null);
    }
  }, [togglingId]);

  // Delete item confirmation
  const handleDeleteItem = useCallback((item) => {
    const labelType = item.is_tax ? 'Pajak' : 'Biaya Layanan';
    showAlert(
      `Hapus ${labelType}`,
      `Apakah Anda yakin ingin menghapus komponen "${item.name}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await taxService.deleteTaxAndFee(item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
              showAlert('Berhasil', `Komponen "${item.name}" telah dihapus.`);
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus komponen.');
            }
          },
        },
      ]
    );
  }, []);

  // Modal save success callback
  const handleFormSuccess = (savedItem, isEditMode) => {
    if (isEditMode) {
      setItems((prev) =>
        prev.map((i) => (i.id === savedItem.id ? { ...i, ...savedItem } : i))
      );
    } else {
      setItems((prev) => [savedItem, ...prev]);
    }
  };

  // Calculated Metrics
  const totalItems = items.length;
  const activeCount = items.filter((i) => i.is_active).length;
  const taxCount = items.filter((i) => i.is_tax).length;
  const feeCount = items.filter((i) => !i.is_tax).length;

  // Segmented Type Tabs
  const tabOptions = [
    { key: 'ALL', label: 'Semua' },
    { key: 'TAX', label: 'Pajak' },
    { key: 'FEE', label: 'Biaya Layanan' },
  ];

  // Status Filter Options
  const statusOptions = [
    { key: 'ALL', label: 'Semua Status' },
    { key: 'ACTIVE', label: 'Aktif' },
    { key: 'INACTIVE', label: 'Nonaktif' },
  ];

  // Memoized renderItem for FlatList performance
  const renderTaxItem = useCallback(
    ({ item }) => (
      <TaxCardItem
        item={item}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onToggleStatus={handleToggleStatus}
        isToggling={togglingId === item.id}
        userRole={user?.role}
      />
    ),
    [handleEditItem, handleDeleteItem, handleToggleStatus, togglingId, user?.role]
  );

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (navigation?.goBack) {
                  navigation.goBack();
                } else if (navigation?.navigate) {
                  navigation.navigate('dashboard');
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <ChevronLeft size={20} color="#f4f4f5" />
            </TouchableOpacity>
            <View style={styles.screenTitleContainer}>
              <Text style={styles.screenTitle} numberOfLines={1}>
                Master Pajak & Biaya
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalItems} komponen terdaftar ({activeCount} aktif)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleRefresh}
            disabled={refreshing || loading}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#fbbf24" />
            ) : (
              <RotateCw size={16} color="#e4e4e7" />
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Alert Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data cache pajak & biaya lokal.
            </Text>
          </View>
        )}

        {/* Summary Metrics Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#202024', borderColor: 'rgba(251, 191, 36, 0.4)' }]}>
              <ReceiptText size={14} color="#fbbf24" />
            </View>
            <Text style={[styles.metricVal, { color: '#fbbf24' }]}>{taxCount}</Text>
            <Text style={styles.metricLabel}>Pajak (PPN/PB1)</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#202024', borderColor: 'rgba(96, 165, 250, 0.4)' }]}>
              <Coins size={14} color="#60a5fa" />
            </View>
            <Text style={[styles.metricVal, { color: '#60a5fa' }]}>{feeCount}</Text>
            <Text style={styles.metricLabel}>Biaya Layanan</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: '#202024', borderColor: 'rgba(52, 211, 153, 0.4)' }]}>
              <CheckCircle2 size={14} color="#34d399" />
            </View>
            <Text style={[styles.metricVal, { color: '#34d399' }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Aktif Digunakan</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color="#a1a1aa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama komponen atau deskripsi..."
              placeholderTextColor="#a1a1aa"
              value={search}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setDebouncedSearch('');
                }}
                style={styles.clearSearchBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Segmented Category Tabs (Semua, Pajak, Biaya Layanan) */}
        <View style={styles.tabsContainer}>
          {tabOptions.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]} numberOfLines={1}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Status Filter Row */}
        <View style={styles.filterRow}>
          {statusOptions.map((opt) => {
            const isSelected = statusFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setStatusFilter(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

      {/* Main Tax/Fee FlatList */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text style={styles.loadingText}>Memuat data pajak & biaya...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderTaxItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fbbf24"
              colors={['#fbbf24']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ReceiptText size={32} color="#a1a1aa" />
              </View>
              <Text style={styles.emptyTitle}>
                {debouncedSearch
                  ? 'Komponen Tidak Ditemukan'
                  : 'Belum Ada Komponen Pajak / Biaya'}
              </Text>
              <Text style={styles.emptyDesc}>
                {debouncedSearch
                  ? `Tidak ada komponen yang cocok dengan kata kunci "${debouncedSearch}".`
                  : 'Tambahkan tarif PPN, PB1 restoran, atau biaya layanan untuk transaksi toko.'}
              </Text>
              {isOwner && !debouncedSearch && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={handleOpenCreate}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#09090b" />
                  <Text style={styles.emptyActionBtnText}>Tambah Komponen</Text>
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
          onPress={handleOpenCreate}
        >
          <Plus size={20} color="#09090b" />
          <Text style={styles.fabText}>Tambah Pajak / Biaya</Text>
        </TouchableOpacity>
      )}

      {/* Tax Form Modal */}
      <TaxFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        taxAndFee={selectedItemForEdit}
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
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  offlineBannerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingBottom: 10,
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    alignItems: 'center',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  metricVal: {
    color: '#f4f4f5',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  metricLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
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
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  tabBtnText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabBtnTextActive: {
    color: '#fbbf24',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
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
    backgroundColor: '#202024',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  filterPillText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
    textAlign: 'center',
  },
  filterPillTextActive: {
    color: '#fbbf24',
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  listContent: {
    paddingTop: 2,
    paddingBottom: 88,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyActionBtnText: {
    color: '#09090b',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbbf24',
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
    color: '#09090b',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
});
