import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Search,
  X,
  Store,
  Ticket,
  Sparkles,
  AlertCircle,
} from 'lucide-react-native';
import superAdminService from '../services/superAdminService';
import SuperAdminHeader from '../components/superadmin/SuperAdminHeader';
import SuperAdminStatsCards from '../components/superadmin/SuperAdminStatsCards';
import StoreCardItem from '../components/superadmin/StoreCardItem';
import LicenseCardItem from '../components/superadmin/LicenseCardItem';
import ActivateStoreModal from '../components/superadmin/ActivateStoreModal';
import ExtendTrialModal from '../components/superadmin/ExtendTrialModal';
import LicenseGeneratorModal from '../components/superadmin/LicenseGeneratorModal';

const STORE_FILTERS = [
  { key: 'all', label: 'Semua Toko' },
  { key: 'trial', label: 'Trial' },
  { key: 'active', label: 'Pro Aktif' },
  { key: 'expired', label: 'Kedaluwarsa' },
];

const LICENSE_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'available', label: 'Tersedia' },
  { key: 'redeemed', label: 'Terpakai' },
  { key: 'revoked', label: 'Dicabut' },
];

export default function SuperAdminScreen({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('stores'); // 'stores' | 'licenses'
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [licenses, setLicenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [licenseFilter, setLicenseFilter] = useState('all');

  // Modals state
  const [activateStore, setActivateStore] = useState(null);
  const [extendTrialStore, setExtendTrialStore] = useState(null);
  const [generatorModalVisible, setGeneratorModalVisible] = useState(false);

  // Load all initial data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 1. Stats
      const statsRes = await superAdminService.getStats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }

      // 2. Stores
      const storeParams = {};
      if (searchQuery.trim()) storeParams.search = searchQuery.trim();
      if (storeFilter !== 'all') storeParams.subscription_status = storeFilter;
      const storesRes = await superAdminService.getStores(storeParams);
      if (storesRes.success) {
        setStores(storesRes.data?.data || storesRes.data || []);
      }

      // 3. Licenses
      const licParams = {};
      if (searchQuery.trim()) licParams.search = searchQuery.trim();
      if (licenseFilter !== 'all') licParams.status = licenseFilter;
      const licRes = await superAdminService.getLicenses(licParams);
      if (licRes.success) {
        setLicenses(licRes.data?.data || licRes.data || []);
      }
    } catch (err) {
      Alert.alert('Gagal Memuat Data', err.message || 'Periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, storeFilter, licenseFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Store actions
  const handleConfirmActivate = async (payload) => {
    if (!activateStore) return;
    const res = await superAdminService.activateStore(activateStore.id, payload);
    if (res.success) {
      Alert.alert('Sukses', `Toko "${activateStore.name}" berhasil diaktifkan menjadi PRO!`);
      loadData(true);
    }
  };

  const handleConfirmExtendTrial = async (payload) => {
    if (!extendTrialStore) return;
    const res = await superAdminService.extendTrial(extendTrialStore.id, payload);
    if (res.success) {
      Alert.alert('Sukses', `Masa trial "${extendTrialStore.name}" berhasil diperpanjang.`);
      loadData(true);
    }
  };

  // License actions
  const handleGenerateLicenses = async (payload) => {
    const res = await superAdminService.generateLicenses(payload);
    loadData(true);
    return res;
  };

  const handleRevokeLicense = async (id) => {
    try {
      const res = await superAdminService.revokeLicense(id);
      if (res.success) {
        Alert.alert('Sukses', 'Voucher lisensi berhasil dicabut.');
        loadData(true);
      }
    } catch (err) {
      Alert.alert('Gagal Mencabut', err.message);
    }
  };

  // Render Header of the List (Stats, Tab Bar, Search, and Filters)
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      {/* Overview Analytics Cards */}
      <SuperAdminStatsCards stats={stats} />

      {/* Segmented Tab Switcher */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stores' && styles.tabButtonActive]}
          onPress={() => setActiveTab('stores')}
          activeOpacity={0.7}
        >
          <Store size={16} color={activeTab === 'stores' ? '#ffffff' : '#a1a1aa'} />
          <Text style={[styles.tabButtonText, activeTab === 'stores' && styles.tabButtonTextActive]}>
            Toko Mitra ({stores.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'licenses' && styles.tabButtonActive]}
          onPress={() => setActiveTab('licenses')}
          activeOpacity={0.7}
        >
          <Ticket size={16} color={activeTab === 'licenses' ? '#ffffff' : '#a1a1aa'} />
          <Text style={[styles.tabButtonText, activeTab === 'licenses' && styles.tabButtonTextActive]}>
            Bank Lisensi ({licenses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === 'stores' ? 'Cari nama toko, pemilik, no. WA...' : 'Cari serial key KK-PRO-...'}
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Button for Licenses Tab */}
        {activeTab === 'licenses' && (
          <TouchableOpacity
            style={styles.generateFab}
            onPress={() => setGeneratorModalVisible(true)}
            activeOpacity={0.8}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Sparkles size={16} color="#18181b" />
            <Text style={styles.generateFabText}>Cetak</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips Horizontal Scrollable Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsScroll}
        style={styles.filterPillsScrollWrapper}
      >
        {(activeTab === 'stores' ? STORE_FILTERS : LICENSE_FILTERS).map((filter) => {
          const currentFilter = activeTab === 'stores' ? storeFilter : licenseFilter;
          const isSelected = currentFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterPill, isSelected && styles.filterPillActive]}
              onPress={() => {
                if (activeTab === 'stores') {
                  setStoreFilter(filter.key);
                } else {
                  setLicenseFilter(filter.key);
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Empty List State
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={36} color="#71717a" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'stores' ? 'Tidak Ada Toko Mitra' : 'Tidak Ada Voucher Lisensi'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `Tidak ditemukan hasil untuk "${searchQuery}"`
          : activeTab === 'stores'
            ? 'Belum ada toko yang terdaftar pada filter ini.'
            : 'Belum ada voucher serial key. Tekan tombol "Cetak" untuk membuat voucher baru.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Fixed Header */}
      <SuperAdminHeader
        user={user}
        onRefresh={() => loadData(true)}
        onLogout={onLogout}
        refreshing={refreshing}
      />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbbf24" />
          <Text style={styles.loadingText}>Memuat Platform Superadmin...</Text>
        </View>
      ) : (
        <View style={styles.responsiveContainer}>
          <FlatList
            data={activeTab === 'stores' ? stores : licenses}
            keyExtractor={(item) => (activeTab === 'stores' ? `store-${item.id}` : `lic-${item.id}`)}
            renderItem={({ item }) =>
              activeTab === 'stores' ? (
                <StoreCardItem
                  store={item}
                  onActivate={(st) => setActivateStore(st)}
                  onExtendTrial={(st) => setExtendTrialStore(st)}
                />
              ) : (
                <LicenseCardItem
                  license={item}
                  onRevoke={handleRevokeLicense}
                />
              )
            }
            ListHeaderComponent={renderListHeader}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadData(true)}
                tintColor="#fbbf24"
                colors={['#fbbf24']}
              />
            }
          />
        </View>
      )}

      {/* Modals */}
      <ActivateStoreModal
        visible={!!activateStore}
        store={activateStore}
        onClose={() => setActivateStore(null)}
        onConfirm={handleConfirmActivate}
      />

      <ExtendTrialModal
        visible={!!extendTrialStore}
        store={extendTrialStore}
        onClose={() => setExtendTrialStore(null)}
        onConfirm={handleConfirmExtendTrial}
      />

      <LicenseGeneratorModal
        visible={generatorModalVisible}
        onClose={() => setGeneratorModalVisible(false)}
        onGenerate={handleGenerateLicenses}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  responsiveContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  listHeader: {
    paddingBottom: 4,
  },
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 44,
  },
  tabButtonActive: {
    backgroundColor: '#e11d48',
  },
  tabButtonText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabButtonTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#ffffff',
    height: '100%',
    padding: 0,
  },
  generateFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 14,
    flexShrink: 0,
  },
  generateFabText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#18181b',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterPillsScrollWrapper: {
    marginBottom: 8,
  },
  filterPillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterPillActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: '#f43f5e',
  },
  filterPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  filterPillTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
    includeFontPadding: false,
  },
});
