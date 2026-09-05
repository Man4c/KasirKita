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
  Users,
  RotateCw,
  WifiOff,
  ChevronLeft,
} from 'lucide-react-native';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import UserCardItem from '../components/user/UserCardItem';
import UserFormModal from '../components/user/UserFormModal';
import ResetPasswordModal from '../components/user/ResetPasswordModal';
import { showAlert } from '../utils/alert';

/**
 * Format Rupiah currency helper
 */
function formatRp(value) {
  const num = parseFloat(value || 0);
  return 'Rp' + num.toLocaleString('id-ID');
}

export default function UserManagementScreen({ navigation }) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const isOwner = user?.role === 'owner';

  // State Data
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | CASHIER | OWNER | INACTIVE
  const searchTimerRef = useRef(null);

  // Debounce search input 350ms
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 350);
  };

  const loadUsers = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const res = await userService.getUsers({ all: true });
        setItems(res.items || []);
        setIsOffline(Boolean(res.fromCache));
      } catch (err) {
        console.warn('Gagal memuat daftar pengguna:', err.message);
        showAlert('Peringatan', err.message || 'Gagal memuat data staf. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = () => {
    loadUsers(true);
  };

  // Open Create User Modal
  const handleOpenCreate = () => {
    setSelectedUserForEdit(null);
    setFormModalVisible(true);
  };

  // Open Edit User Modal
  const handleEditUser = useCallback((item) => {
    setSelectedUserForEdit(item);
    setFormModalVisible(true);
  }, []);

  // Open Reset Password Modal
  const handleResetPassword = useCallback((item) => {
    setSelectedUserForReset(item);
    setResetModalVisible(true);
  }, []);

  // Toggle User Active Status
  const handleToggleStatus = useCallback(
    async (targetUser) => {
      if (String(targetUser.id) === String(currentUserId)) {
        showAlert('Akses Ditolak', 'Anda tidak dapat mengubah status aktif akun Anda sendiri.');
        return;
      }

      const actionText = targetUser.is_active ? 'membekukan' : 'mengaktifkan';
      const executeToggle = async () => {
        try {
          await userService.toggleStatus(targetUser.id);
          showAlert(
            'Status Diperbarui',
            `Akun staf "${targetUser.name}" berhasil ${targetUser.is_active ? 'dibekukan' : 'diaktifkan'}.`
          );
          loadUsers(false);
        } catch (err) {
          showAlert('Gagal', err.message || 'Terjadi kesalahan saat mengubah status staf.');
        }
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(
            `Apakah Anda yakin ingin ${actionText} akses akun "${targetUser.name}"?`
          );
          if (confirmed) {
            executeToggle();
          }
        }
      } else {
        Alert.alert(
          `${targetUser.is_active ? 'Bekukan' : 'Aktifkan'} Staf?`,
          `Apakah Anda yakin ingin ${actionText} akun "${targetUser.name}"?`,
          [
            { text: 'Batal', style: 'cancel' },
            {
              text: targetUser.is_active ? 'Bekukan' : 'Aktifkan',
              style: targetUser.is_active ? 'destructive' : 'default',
              onPress: executeToggle,
            },
          ]
        );
      }
    },
    [currentUserId, loadUsers]
  );

  // Safe Delete User
  const handleDeleteUser = useCallback(
    (targetUser) => {
      if (String(targetUser.id) === String(currentUserId)) {
        showAlert('Akses Ditolak', 'Anda tidak dapat menghapus akun Anda sendiri.');
        return;
      }

      const executeDelete = async () => {
        try {
          await userService.deleteUser(targetUser.id);
          showAlert('Berhasil', `Akun staf "${targetUser.name}" berhasil dihapus.`);
          loadUsers(false);
        } catch (err) {
          showAlert('Gagal Menghapus', err.message || 'Terjadi kesalahan saat menghapus staf.');
        }
      };

      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(
            `Hapus staf "${targetUser.name}"?\nData transaksi masa lalu yang diproses kasir ini tetap tersimpan.`
          );
          if (confirmed) {
            executeDelete();
          }
        }
      } else {
        Alert.alert(
          'Hapus Akun Staf?',
          `Apakah Anda yakin ingin menghapus "${targetUser.name}"? Riwayat transaksi penjualan kasir tetap aman tersimpan.`,
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
    [currentUserId, loadUsers]
  );

  // Aggregated Metrics Calculation (Dihitung stabil dari master seluruh pengguna)
  const totalUsers = items.length;
  const totalCashiers = items.filter((u) => u.role === 'cashier').length;
  const totalOwners = items.filter((u) => u.role === 'owner').length;
  const activeCount = items.filter((u) => Boolean(u.is_active)).length;
  const totalAllSales = items.reduce((acc, curr) => acc + Number(curr.total_sales || 0), 0);

  // Client-side Filtered Items (Instan 0ms latency tanpa refetch & angka header stabil)
  const displayedItems = useMemo(() => {
    return items.filter((u) => {
      // 1. Filter Role / Status Tab
      if (roleFilter === 'CASHIER' && u.role !== 'cashier') return false;
      if (roleFilter === 'OWNER' && u.role !== 'owner') return false;
      if (roleFilter === 'INACTIVE' && u.is_active) return false;

      // 2. Filter Pencarian Realtime
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phone?.includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }

      return true;
    });
  }, [items, roleFilter, debouncedSearch]);

  // Tab Filter Chips
  const filterTabs = [
    { key: 'ALL', label: `Semua (${totalUsers})` },
    { key: 'CASHIER', label: `Kasir (${totalCashiers})` },
    { key: 'OWNER', label: `Owner (${totalOwners})` },
    { key: 'INACTIVE', label: `Nonaktif (${totalUsers - activeCount})` },
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
                Master Pengguna & Staf
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {totalUsers} staf ({activeCount} aktif) • Total Omset: {formatRp(totalAllSales)}
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
              Mode Offline: Menampilkan data cache lokal pengguna.
            </Text>
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Search size={16} color="#a1a1aa" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama staf, email login, telepon..."
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

        {/* Filter Tabs Row */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isSelected = roleFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
                onPress={() => setRoleFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Content: User Staff List */}
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#fb7185" />
            <Text style={styles.loadingText}>Memuat daftar staf & pengguna...</Text>
          </View>
        ) : (
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <UserCardItem
                item={item}
                currentUserId={currentUserId}
                onEdit={handleEditUser}
                onResetPassword={handleResetPassword}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDeleteUser}
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
                  <Users size={36} color="#52525b" />
                </View>
                <Text style={styles.emptyTitle}>
                  {debouncedSearch
                    ? 'Pengguna Tidak Ditemukan'
                    : roleFilter !== 'ALL'
                    ? 'Tidak Ada Pengguna di Tab Ini'
                    : 'Belum Ada Staf Kasir'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {debouncedSearch
                    ? `Tidak ada akun yang cocok dengan kata kunci "${debouncedSearch}". Periksa ejaan nama atau alamat email.`
                    : roleFilter !== 'ALL'
                    ? 'Tidak ada akun staf atau pengguna yang sesuai dengan filter yang Anda pilih.'
                    : 'Daftarkan kasir pertama Anda agar staf dapat memproses transaksi kasir dengan akun login mereka sendiri.'}
                </Text>

                {isOwner && !debouncedSearch && roleFilter === 'ALL' && (
                  <TouchableOpacity
                    style={styles.emptyActionBtn}
                    onPress={handleOpenCreate}
                    activeOpacity={0.8}
                  >
                    <Plus size={16} color="#ffffff" style={{ flexShrink: 0 }} />
                    <Text style={styles.emptyActionBtnText}>Daftarkan Staf Pertama</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button: Add Staff (Owner Only) */}
      {isOwner && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenCreate}
          activeOpacity={0.85}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={20} color="#ffffff" style={{ flexShrink: 0 }} />
          <Text style={styles.fabText}>Tambah Staf</Text>
        </TouchableOpacity>
      )}

      {/* Modal Formulir Tambah / Edit Pengguna */}
      <UserFormModal
        visible={formModalVisible}
        user={selectedUserForEdit}
        currentUserId={currentUserId}
        onClose={() => setFormModalVisible(false)}
        onSuccess={() => loadUsers(false)}
      />

      {/* Modal Reset Password / PIN */}
      <ResetPasswordModal
        visible={resetModalVisible}
        user={selectedUserForReset}
        onClose={() => setResetModalVisible(false)}
        onSuccess={() => loadUsers(false)}
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
    fontSize: 22,
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    marginTop: 2,
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
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    color: '#fb7185',
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
    height: 42,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#f4f4f5',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
    flexShrink: 0,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterPillActive: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a1a1aa',
  },
  filterPillTextActive: {
    color: '#fb7185',
    fontWeight: '600',
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 110,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e11d48',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 18,
  },
  emptyActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e11d48',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
      },
    }),
  },
  fabText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
