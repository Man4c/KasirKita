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
  Alert,
} from 'react-native';
import {
  Search,
  X,
  Plus,
  Truck,
  Building2,
  Package,
  RotateCw,
  WifiOff,
  ChevronLeft,
  Coins,
  CheckCircle2,
} from 'lucide-react-native';
import { supplierService } from '../services/supplierService';
import { useAuth } from '../context/AuthContext';
import SupplierCardItem from '../components/supplier/SupplierCardItem';
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
        const res = await supplierService.getSuppliers({
          search: debouncedSearch.trim() || undefined,
          is_active: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
        });
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
    [debouncedSearch, statusFilter]
  );

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleRefresh = () => {
    loadSuppliers(true);
  };

  // Open Create Supplier Modal (Placeholder until Phase 4)
  const handleOpenCreate = () => {
    setSelectedSupplierForEdit(null);
    setFormModalVisible(true);
    showAlert(
      'Tambah Pemasok',
      'Modal formulir pendaftaran distributor baru akan diaktifkan penuh pada pengerjaan Fase 4.'
    );
  };

  // Open Edit Supplier Modal (Placeholder until Phase 4)
  const handleEditSupplier = useCallback((supplier) => {
    setSelectedSupplierForEdit(supplier);
    setFormModalVisible(true);
    showAlert(
      'Edit Pemasok',
      `Modal edit data pemasok "${supplier.name}" akan diaktifkan penuh pada pengerjaan Fase 4.`
    );
  }, []);

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

  // Aggregated Metrics Calculation
  const totalCount = items.length;
  const totalRestocks = items.reduce((acc, curr) => acc + Number(curr.restocks_count || 0), 0);
  const totalPurchasesAmount = items.reduce((acc, curr) => acc + Number(curr.total_purchases || 0), 0);

  // Status Filter Chips
  const statusChips = [
    { key: 'ALL', label: 'Semua Pemasok' },
    { key: 'ACTIVE', label: 'Aktif' },
    { key: 'INACTIVE', label: 'Nonaktif' },
  ];

  return (
    <View style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
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
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="#f4f4f5" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Master Pemasok
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Distributor & Rekening Transfer
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={handleRefresh}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCw size={18} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {/* Offline Warning Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan data cache lokal pemasok
            </Text>
          </View>
        )}

        {/* Metrics Summary Strip */}
        <View style={styles.metricsContainer}>
          {/* Card 1: Total Pemasok */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapOrange}>
              <Truck size={14} color="#fb923c" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue} numberOfLines={1}>
                {totalCount}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Pemasok
              </Text>
            </View>
          </View>

          {/* Card 2: Total Restock Pasokan */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapEmerald}>
              <Package size={14} color="#34d399" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricValue} numberOfLines={1}>
                {totalRestocks}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Restock Masuk
              </Text>
            </View>
          </View>

          {/* Card 3: Total Pengeluaran Kulakan */}
          <View style={styles.metricCard}>
            <View style={styles.metricIconWrapBlue}>
              <Coins size={14} color="#38bdf8" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricValueSpent} numberOfLines={1}>
                {formatRp(totalPurchasesAmount)}
              </Text>
              <Text style={styles.metricLabel} numberOfLines={1}>
                Total Belanja
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Search size={16} color="#71717a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari pemasok, sales, no HP, rekening..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={handleSearchChange}
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
              <X size={15} color="#a1a1aa" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <View style={styles.statusChipsRow}>
          {statusChips.map((chip) => {
            const isSelected = statusFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[styles.statusChip, isSelected && styles.statusChipActive]}
                onPress={() => setStatusFilter(chip.key)}
                activeOpacity={0.7}
              >
                {isSelected && <CheckCircle2 size={12} color="#fb923c" style={{ flexShrink: 0 }} />}
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && styles.statusChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content: Supplier List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#fb923c" />
          <Text style={styles.loadingText}>Memuat data distributor & pemasok...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
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
            items.length === 0 && styles.listContentEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#fb923c"
              colors={['#fb923c']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Building2 size={36} color="#52525b" />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? 'Pemasok Tidak Ditemukan' : 'Belum Ada Pemasok'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? `Tidak ada distributor yang cocok dengan kata kunci "${search}". Periksa ejaan nama atau nomor telepon.`
                  : 'Daftarkan distributor barang pertama Anda untuk mengelola kontak sales, nomor rekening, dan riwayat pasokan barang.'}
              </Text>

              {isOwner && !search && (
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={handleOpenCreate}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#09090b" style={{ flexShrink: 0 }} />
                  <Text style={styles.emptyActionBtnText}>Daftarkan Pemasok Pertama</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Floating Action Button: Add Supplier */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={18} color="#09090b" style={{ flexShrink: 0 }} />
          <Text style={styles.fabText}>Tambah Pemasok</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    backgroundColor: '#121215',
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 12,
    minWidth: 0,
  },
  headerTitle: {
    color: '#f4f4f5',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 1,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  offlineBannerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    minWidth: 0,
  },
  metricIconWrapOrange: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricIconWrapEmerald: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricIconWrapBlue: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metricContent: {
    flex: 1,
    minWidth: 0,
  },
  metricValue: {
    color: '#f4f4f5',
    fontSize: 14,
    fontWeight: '700',
  },
  metricValueSpent: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#71717a',
    fontSize: 12,
    marginTop: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: '#f4f4f5',
    fontSize: 13,
    padding: 0,
  },
  clearSearchBtn: {
    padding: 4,
    flexShrink: 0,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  statusChipActive: {
    backgroundColor: 'rgba(251, 146, 60, 0.12)',
    borderColor: 'rgba(251, 146, 60, 0.35)',
  },
  statusChipText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '500',
  },
  statusChipTextActive: {
    color: '#fb923c',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 90,
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
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 300,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fb923c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '700',
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fb923c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(251, 146, 60, 0.4)',
      },
    }),
  },
  fabText: {
    color: '#09090b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
