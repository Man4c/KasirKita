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
  ScrollView,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  TicketPercent,
  RotateCw,
  WifiOff,
  ChevronLeft,
  Coins,
  Users,
  CheckCircle2,
} from 'lucide-react-native';
import { discountService } from '../services/discountService';
import { useAuth } from '../context/AuthContext';
import PromoCardItem from '../components/promo/PromoCardItem';
import PromoFormModal from '../components/promo/PromoFormModal';
import { showAlert } from '../utils/alert';

export default function PromoManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedPromoForEdit, setSelectedPromoForEdit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | inactive | expired
  const searchTimerRef = useRef(null);

  // Debounce search input 350ms
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 350);
  };

  const loadDiscounts = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await discountService.getDiscounts({
        search: debouncedSearch.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        all: true,
      });
      setDiscounts(res.discounts || []);
      setIsOffline(Boolean(res.fromCache));
    } catch (err) {
      console.warn('Gagal memuat daftar promosi:', err.message);
      showAlert('Peringatan', 'Gagal memuat data program promosi toko. Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const handleRefresh = () => {
    loadDiscounts(true);
  };

  // Open Create Modal
  const handleOpenCreatePromo = () => {
    setSelectedPromoForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Modal
  const handleEditPromo = useCallback((promo) => {
    setSelectedPromoForEdit(promo);
    setFormModalVisible(true);
  }, []);

  // Toggle Promo Active Status with optimistic UI
  const handleToggleStatus = useCallback(async (promo) => {
    const originalState = promo.is_active;
    const newStatus = !originalState;

    // Optimistic update
    setDiscounts((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, is_active: newStatus } : p))
    );

    try {
      const updated = await discountService.toggleStatus(promo.id);
      setDiscounts((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, ...updated } : p))
      );
    } catch (err) {
      // Revert upon failure
      setDiscounts((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, is_active: originalState } : p))
      );
      showAlert('Gagal Mengubah Status', err.message || 'Terjadi kesalahan saat mengubah status promosi.');
    }
  }, []);

  // Delete Promo confirmation
  const handleDeletePromo = useCallback((promo) => {
    showAlert(
      'Hapus Program Promosi',
      `Apakah Anda yakin ingin menghapus voucher "${promo.name}" (${promo.code})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await discountService.deleteDiscount(promo.id);
              setDiscounts((prev) => prev.filter((p) => p.id !== promo.id));
              showAlert('Berhasil', `Voucher promosi "${promo.name}" telah dihapus.`);
            } catch (err) {
              showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus promosi.');
            }
          },
        },
      ]
    );
  }, []);

  // Modal save success callback
  const handleFormSuccess = (savedPromo, isEditMode) => {
    if (isEditMode) {
      setDiscounts((prev) =>
        prev.map((p) => (p.id === savedPromo.id ? { ...p, ...savedPromo } : p))
      );
    } else {
      setDiscounts((prev) => [savedPromo, ...prev]);
    }
  };

  // Calculated Metrics
  const now = new Date();
  const totalPromos = discounts.length;
  const activePromos = discounts.filter((p) => {
    const isActive = p.is_active;
    const notExpired = !p.end_date || new Date(p.end_date) >= now;
    const quotaAvailable = p.quota === null || p.quota === undefined || (p.usage_count || 0) < p.quota;
    return isActive && notExpired && quotaAvailable;
  }).length;
  const totalUsages = discounts.reduce((acc, curr) => acc + (Number(curr.usage_count) || 0), 0);

  // Status Filter Chips Options
  const filterOptions = [
    { key: 'all', label: 'Semua' },
    { key: 'active', label: 'Aktif' },
    { key: 'inactive', label: 'Non-Aktif' },
    { key: 'expired', label: 'Kadaluarsa / Habis' },
  ];

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
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
          <View style={styles.titleContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <TicketPercent size={18} color="#fb7185" />
              <Text style={styles.headerTitle} numberOfLines={1}>
                Master Promosi
              </Text>
            </View>
            <Text style={styles.headerSubtitle}>Kelola voucher diskon & kupon kasir</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={handleRefresh}
          disabled={refreshing || loading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#fb7185" />
          ) : (
            <RotateCw size={18} color="#f4f4f5" />
          )}
        </TouchableOpacity>
      </View>

      {/* Offline Alert Banner */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <WifiOff size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
          <Text style={styles.offlineBannerText}>
            Mode Offline: Menampilkan data cache voucher promosi lokal.
          </Text>
        </View>
      )}

      {/* Summary Metrics Cards */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <View style={styles.metricIconWrap}>
            <TicketPercent size={14} color="#fb7185" />
          </View>
          <Text style={styles.metricVal}>{totalPromos}</Text>
          <Text style={styles.metricLabel}>Total Promo</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#27272a', borderColor: '#3f3f46' }]}>
            <CheckCircle2 size={14} color="#34d399" />
          </View>
          <Text style={[styles.metricVal, { color: '#34d399' }]}>{activePromos}</Text>
          <Text style={styles.metricLabel}>Voucher Aktif</Text>
        </View>

        <View style={styles.metricCard}>
          <View style={[styles.metricIconWrap, { backgroundColor: '#27272a', borderColor: '#3f3f46' }]}>
            <Users size={14} color="#f4f4f5" />
          </View>
          <Text style={styles.metricVal}>{totalUsages}</Text>
          <Text style={styles.metricLabel}>Total Dipakai</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color="#a1a1aa" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari kode promo atau nama voucher..."
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

      {/* Status Filter Chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsScroll}
        >
          {filterOptions.map((opt) => {
            const isSelected = statusFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setStatusFilter(opt.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Promo FlatList */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#fb7185" />
          <Text style={styles.loadingText}>Memuat program promosi...</Text>
        </View>
      ) : (
        <FlatList
          data={discounts}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <PromoCardItem
              item={item}
              onEdit={handleEditPromo}
              onDelete={handleDeletePromo}
              onToggleStatus={handleToggleStatus}
              userRole={user?.role}
            />
          )}
          contentContainerStyle={styles.listContent}
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
              <View style={styles.emptyIconCircle}>
                <TicketPercent size={32} color="#a1a1aa" />
              </View>
              <Text style={styles.emptyTitle}>
                {debouncedSearch
                  ? 'Promosi Tidak Ditemukan'
                  : 'Belum Ada Program Promosi'}
              </Text>
              <Text style={styles.emptyDesc}>
                {debouncedSearch
                  ? `Tidak ada kupon yang cocok dengan kata kunci "${debouncedSearch}".`
                  : 'Buat kupon diskon pertama untuk menarik pelanggan dan meningkatkan penjualan kasir.'}
              </Text>
              {isOwner && !debouncedSearch && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={handleOpenCreatePromo}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#ffffff" />
                  <Text style={styles.emptyActionBtnText}>Buat Promo Baru</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) Owner */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={handleOpenCreatePromo}
        >
          <Plus size={20} color="#ffffff" />
          <Text style={styles.fabText}>Tambah Promo</Text>
        </TouchableOpacity>
      )}

      {/* Promo Form Modal */}
      <PromoFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        promo={selectedPromoForEdit}
        onSuccess={handleFormSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#f4f4f5',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  offlineBannerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
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
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  metricLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
  filterSection: {
    paddingBottom: 8,
  },
  filterChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  filterChipText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 80,
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
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
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
    fontFamily: 'Poppins_600SemiBold',
  },
});
