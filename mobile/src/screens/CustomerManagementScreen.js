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
  Users,
  Crown,
  Building2,
  UserCheck,
  RotateCw,
  WifiOff,
  ChevronLeft,
  SlidersHorizontal,
} from 'lucide-react-native';
import { customerService } from '../services/customerService';
import { useAuth } from '../context/AuthContext';
import CustomerCardItem from '../components/customer/CustomerCardItem';
import CustomerFormModal from '../components/customer/CustomerFormModal';
import { showAlert } from '../utils/alert';

/**
 * Format Rupiah currency helper
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function CustomerManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals (akan dihubungkan di Fase 4)
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | VIP | WHOLESALE | REGULAR
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

  const loadCustomers = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await customerService.getCustomers({
          search: debouncedSearch.trim() || undefined,
          membership_type: activeTab === 'ALL' ? undefined : activeTab,
          is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        });
        setItems(res.items || []);
        setIsOffline(Boolean(res.fromCache));
      } catch (err) {
        console.warn('Gagal memuat daftar pelanggan:', err.message);
        showAlert('Peringatan', 'Gagal memuat data pelanggan toko. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [debouncedSearch, activeTab, statusFilter]
  );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleRefresh = () => {
    loadCustomers(true);
  };

  // Open Create Customer Modal
  const handleOpenCreate = () => {
    setSelectedCustomerForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit Customer Modal
  const handleEditCustomer = useCallback((customer) => {
    setSelectedCustomerForEdit(customer);
    setFormModalVisible(true);
  }, []);

  // Form Success callback
  const handleFormSuccess = () => {
    loadCustomers(false);
  };

  // Delete Customer with Confirmation
  const handleDeleteCustomer = useCallback(
    (customer) => {
      showAlert(
        'Hapus Pelanggan',
        `Apakah Anda yakin ingin menghapus data pelanggan "${customer.name}"? Riwayat transaksi lama tetap tersimpan.`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: async () => {
              try {
                await customerService.deleteCustomer(customer.id);
                setItems((prev) => prev.filter((i) => i.id !== customer.id));
                showAlert('Berhasil', 'Pelanggan berhasil dihapus.');
              } catch (err) {
                showAlert('Error', err.message || 'Gagal menghapus pelanggan.');
              }
            },
          },
        ]
      );
    },
    []
  );

  // Summary Metrics Aggregations
  const totalCustomers = items.length;
  const vipCount = items.filter((i) => (i.membership_type || '').toUpperCase() === 'VIP').length;
  const wholesaleCount = items.filter((i) => (i.membership_type || '').toUpperCase() === 'WHOLESALE').length;
  const regularCount = items.filter((i) => {
    const type = (i.membership_type || '').toUpperCase();
    return type === 'REGULAR' || !type;
  }).length;
  const totalAccumulatedSpent = items.reduce((acc, curr) => acc + Number(curr.total_spent || 0), 0);

  const renderCustomerItem = useCallback(
    ({ item }) => (
      <CustomerCardItem
        item={item}
        onEdit={handleEditCustomer}
        onDelete={handleDeleteCustomer}
        userRole={user?.role}
      />
    ),
    [handleEditCustomer, handleDeleteCustomer, user?.role]
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
                Master Pelanggan
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalCustomers} pelanggan terdaftar ({vipCount} VIP, {wholesaleCount} Grosir)
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
              <ActivityIndicator size="small" color="#2dd4bf" />
            ) : (
              <RotateCw size={16} color="#e4e4e7" />
            )}
          </TouchableOpacity>
        </View>

        {/* Offline Alert Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#2dd4bf" style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data cache pelanggan lokal.
            </Text>
          </View>
        )}

        {/* Summary Metrics Cards */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(45, 212, 191, 0.15)', borderColor: 'rgba(45, 212, 191, 0.3)' }]}>
              <Users size={14} color="#2dd4bf" />
            </View>
            <Text style={[styles.metricVal, { color: '#2dd4bf' }]}>{totalCustomers}</Text>
            <Text style={styles.metricLabel}>Total Pelanggan</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: 'rgba(251, 191, 36, 0.3)' }]}>
              <Crown size={14} color="#fbbf24" />
            </View>
            <Text style={[styles.metricVal, { color: '#fbbf24' }]}>{vipCount}</Text>
            <Text style={styles.metricLabel}>Member VIP</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
              <Building2 size={14} color="#38bdf8" />
            </View>
            <Text style={[styles.metricVal, { color: '#38bdf8' }]}>{wholesaleCount}</Text>
            <Text style={styles.metricLabel}>Member Grosir</Text>
          </View>
        </View>

        {/* Search Bar Input */}
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama pelanggan, nomor WhatsApp, email..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {Boolean(search) && (
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              style={styles.searchClearBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Filter Tabs: Keanggotaan */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'ALL' && styles.tabButtonActive]}
            onPress={() => setActiveTab('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
              Semua ({totalCustomers})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'VIP' && styles.tabButtonActiveVip]}
            onPress={() => setActiveTab('VIP')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'VIP' && styles.tabTextActiveVip]}>
              VIP ({vipCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'WHOLESALE' && styles.tabButtonActiveWholesale]}
            onPress={() => setActiveTab('WHOLESALE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'WHOLESALE' && styles.tabTextActiveWholesale]}>
              Grosir ({wholesaleCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'REGULAR' && styles.tabButtonActive]}
            onPress={() => setActiveTab('REGULAR')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'REGULAR' && styles.tabTextActive]}>
              Reguler ({regularCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Status Filter Chips Row */}
        <View style={styles.statusChipsRow}>
          <View style={styles.statusChipPrefix}>
            <SlidersHorizontal size={12} color="#71717a" />
            <Text style={styles.statusChipPrefixText}>Status:</Text>
          </View>

          <TouchableOpacity
            style={[styles.statusChip, statusFilter === 'ALL' && styles.statusChipActive]}
            onPress={() => setStatusFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusChipText, statusFilter === 'ALL' && styles.statusChipTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusChip, statusFilter === 'ACTIVE' && styles.statusChipActive]}
            onPress={() => setStatusFilter('ACTIVE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusChipText, statusFilter === 'ACTIVE' && styles.statusChipTextActive]}>
              Aktif
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusChip, statusFilter === 'INACTIVE' && styles.statusChipActive]}
            onPress={() => setStatusFilter('INACTIVE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statusChipText, statusFilter === 'INACTIVE' && styles.statusChipTextActive]}>
              Nonaktif
            </Text>
          </TouchableOpacity>
        </View>

        {/* Customers FlatList */}
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2dd4bf" />
            <Text style={styles.loadingText}>Memuat data pelanggan...</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#2dd4bf"
                colors={['#2dd4bf']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Users size={32} color="#a1a1aa" />
                </View>
                <Text style={styles.emptyTitle}>
                  {debouncedSearch
                    ? 'Pelanggan Tidak Ditemukan'
                    : 'Belum Ada Pelanggan Terdaftar'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {debouncedSearch
                    ? `Tidak ada pelanggan yang cocok dengan kata kunci "${debouncedSearch}".`
                    : 'Daftarkan pelanggan atau member tetap untuk mencatat riwayat transaksi dan loyalty point.'}
                </Text>
                {isOwner && !debouncedSearch && (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={handleOpenCreate}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#09090b" />
                    <Text style={styles.emptyActionBtnText}>Daftarkan Pelanggan</Text>
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
          <Text style={styles.fabText}>Tambah Pelanggan</Text>
        </TouchableOpacity>
      )}

      {/* Customer Form Modal */}
      <CustomerFormModal
        visible={formModalVisible}
        onClose={() => setFormModalVisible(false)}
        customer={selectedCustomerForEdit}
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
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: -2,
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
    marginLeft: 8,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 12,
  },
  offlineBannerText: {
    color: '#2dd4bf',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-start',
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricVal: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.5,
    marginBottom: 1,
  },
  metricLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 14,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
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
  searchClearBtn: {
    padding: 4,
    flexShrink: 0,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#121215',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 3,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#27272a',
  },
  tabButtonActiveVip: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  tabButtonActiveWholesale: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  tabTextActive: {
    color: '#2dd4bf',
    fontFamily: 'Poppins_600SemiBold',
  },
  tabTextActiveVip: {
    color: '#fbbf24',
    fontFamily: 'Poppins_600SemiBold',
  },
  tabTextActiveWholesale: {
    color: '#38bdf8',
    fontFamily: 'Poppins_600SemiBold',
  },
  statusChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  statusChipPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  statusChipPrefixText: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statusChipActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    borderColor: '#2dd4bf',
  },
  statusChipText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  statusChipTextActive: {
    color: '#2dd4bf',
    fontFamily: 'Poppins_600SemiBold',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 88,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIconBox: {
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
    backgroundColor: '#2dd4bf',
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
    backgroundColor: '#2dd4bf',
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
