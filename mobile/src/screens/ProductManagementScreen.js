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
  Package,
  ScanBarcode,
  RotateCw,
  SlidersHorizontal,
  WifiOff,
  ChevronLeft,
  AlertTriangle,
  XCircle,
} from 'lucide-react-native';
import { productService } from '../services/productService';
import { formatRp } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import ProductCardItem from '../components/product/ProductCardItem';
import ProductFormModal from '../components/product/ProductFormModal';
import ProductBarcodeScannerModal from '../components/product/ProductBarcodeScannerModal';
import QuickStockAdjustModal from '../components/product/QuickStockAdjustModal';
import { showAlert } from '../utils/alert';

export default function ProductManagementScreen({
  navigation,
  onOpenRestock: externalOpenRestock,
}) {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [showCost, setShowCost] = useState(false);

  // Modals
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW' | 'OUT' | 'INACTIVE'
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  });

  const searchTimerRef = useRef(null);

  // Debounce search input 400ms
  const handleSearchChange = (text) => {
    setSearch(text);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(text);
    }, 400);
  };

  // Load initial data (products + categories + units)
  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadProducts(1, true);
  }, [debouncedSearch, selectedCategory, stockFilter]);

  const loadMetadata = async () => {
    try {
      const [cats, uns] = await Promise.all([
        productService.getCategories(),
        productService.getUnits(),
      ]);
      setCategories(cats);
      setUnits(uns);
    } catch (err) {
      console.log('Gagal memuat metadata:', err.message);
    }
  };

  const loadProducts = async (page = 1, isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = {
        page,
        per_page: 20,
      };

      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category_id = selectedCategory;

      if (stockFilter === 'LOW') {
        params.low_stock = true;
      } else if (stockFilter === 'OUT') {
        // Filtered locally below
      } else if (stockFilter === 'INACTIVE') {
        params.is_active = false;
      }

      const res = await productService.getProducts(params);
      let list = res.products || [];

      // Filter OUT stock locally if needed
      if (stockFilter === 'OUT') {
        list = list.filter((p) => Number(p.stock || 0) <= 0);
      }

      if (page === 1) {
        setProducts(list);
      } else {
        setProducts((prev) => {
          const map = new Map(prev.map((p) => [p.id, p]));
          list.forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }

      setPagination({
        currentPage: res.pagination?.currentPage || page,
        lastPage: res.pagination?.lastPage || 1,
        total: res.pagination?.total || list.length,
      });

      setIsOffline(res.fromCache);
    } catch (err) {
      console.log('Gagal memuat produk:', err.message);
      showAlert('Gagal Mengambil Produk', 'Tidak dapat terhubung ke server atau memuat katalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetadata();
    loadProducts(1, false);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore) return;
    if (pagination.currentPage < pagination.lastPage) {
      loadProducts(pagination.currentPage + 1, false);
    }
  };

  // Open Form Modal (Create / Edit)
  const handleOpenCreateProduct = () => {
    setSelectedProductForEdit(null);
    setFormModalVisible(true);
  };

  const handleEditProduct = useCallback((product) => {
    setSelectedProductForEdit(product);
    setFormModalVisible(true);
  }, []);

  const handleRestockProduct = useCallback(
    (product) => {
      if (externalOpenRestock) {
        externalOpenRestock(product);
      } else {
        setSelectedProductForRestock(product);
        setRestockModalVisible(true);
      }
    },
    [externalOpenRestock]
  );

  const renderProductItem = useCallback(
    ({ item }) => (
      <ProductCardItem
        item={item}
        formatRp={formatRp}
        showCost={showCost}
        onToggleCost={() => setShowCost((prev) => !prev)}
        onEdit={handleEditProduct}
        onRestock={handleRestockProduct}
        userRole={user?.role || 'cashier'}
      />
    ),
    [showCost, handleEditProduct, handleRestockProduct, user?.role]
  );

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Top Header Bar */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            {navigation?.goBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ChevronLeft size={20} color="#f4f4f5" />
              </TouchableOpacity>
            )}
            <View>
              <Text style={styles.screenTitle} numberOfLines={1}>
                Master Produk
              </Text>
              <Text style={styles.screenSubtitle} numberOfLines={1}>
                {pagination.total} produk terdaftar
              </Text>
            </View>
          </View>

          <View style={styles.headerActionGroup}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              <RotateCw size={16} color="#e4e4e7" />
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity
                style={styles.createBtnHeader}
                activeOpacity={0.8}
                onPress={handleOpenCreateProduct}
              >
                <Plus size={16} color="#ffffff" />
                <Text style={styles.createBtnHeaderText}>Produk</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <WifiOff size={13} color="#fbbf24" style={{ flexShrink: 0 }} />
            <Text style={styles.offlineBannerText} numberOfLines={1}>
              Mode Offline: Menampilkan katalog produk tersimpan di HP
            </Text>
          </View>
        )}

        {/* Search Bar & Barcode Scanner Trigger */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Search size={15} color={search ? '#fb7185' : '#71717a'} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama produk / barcode..."
              placeholderTextColor="#71717a"
              value={search}
              onChangeText={handleSearchChange}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => handleSearchChange('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={15} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.barcodeScanBtn}
            activeOpacity={0.7}
            onPress={() => setScannerModalVisible(true)}
          >
            <ScanBarcode size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Chips */}
        <View style={styles.chipSection}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: 'Semua Kategori' }, ...categories]}
            keyExtractor={(item) => String(item.id || 'all')}
            contentContainerStyle={styles.categoryChipList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  style={[styles.catChip, isSelected && styles.catChipActive]}
                  onPress={() => setSelectedCategory(item.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      isSelected && styles.catChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Secondary Stock Filter Pills */}
        <View style={styles.stockFilterRow}>
          <TouchableOpacity
            style={[styles.stockFilterPill, stockFilter === 'ALL' && styles.stockFilterPillActive]}
            onPress={() => setStockFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.stockFilterText, stockFilter === 'ALL' && styles.stockFilterTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stockFilterPill, stockFilter === 'LOW' && styles.stockFilterPillActiveLow]}
            onPress={() => setStockFilter('LOW')}
            activeOpacity={0.7}
          >
            <AlertTriangle
              size={12}
              color={stockFilter === 'LOW' ? '#fbbf24' : '#a1a1aa'}
            />
            <Text style={[styles.stockFilterText, stockFilter === 'LOW' && styles.stockFilterTextActiveLow]}>
              Menipis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stockFilterPill, stockFilter === 'OUT' && styles.stockFilterPillActiveOut]}
            onPress={() => setStockFilter('OUT')}
            activeOpacity={0.7}
          >
            <XCircle
              size={12}
              color={stockFilter === 'OUT' ? '#f87171' : '#a1a1aa'}
            />
            <Text style={[styles.stockFilterText, stockFilter === 'OUT' && styles.stockFilterTextActiveOut]}>
              Habis
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stockFilterPill, stockFilter === 'INACTIVE' && styles.stockFilterPillActiveInactive]}
            onPress={() => setStockFilter('INACTIVE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.stockFilterText, stockFilter === 'INACTIVE' && styles.stockFilterTextActiveInactive]}>
              Non-Aktif
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product List */}
        {loading && !refreshing ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#e11d48" />
            <Text style={styles.loadingText}>Memuat katalog produk...</Text>
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Package size={44} color="#52525b" />
            <Text style={styles.emptyTitle}>Produk Tidak Ditemukan</Text>
            <Text style={styles.emptySubtitle}>
              {search || selectedCategory || stockFilter !== 'ALL'
                ? 'Tidak ada produk yang cocok dengan kriteria filter Anda.'
                : 'Belum ada produk di toko Anda. Tekan tombol "+ Produk" di atas untuk memulai.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProductItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#e11d48"
                colors={['#e11d48']}
              />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#e11d48" />
                  <Text style={styles.footerLoaderText}>Memuat produk berikutnya...</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Product Form Modal (Tambah & Edit) */}
      <ProductFormModal
        visible={formModalVisible}
        product={selectedProductForEdit}
        categories={categories}
        units={units}
        onClose={() => setFormModalVisible(false)}
        onSaved={() => {
          loadProducts(1, false);
        }}
      />

      {/* Barcode Scanner Modal for Quick Filter/Search */}
      <ProductBarcodeScannerModal
        visible={scannerModalVisible}
        onClose={() => setScannerModalVisible(false)}
        onScanBarcode={(code) => {
          setSearch(code);
          setDebouncedSearch(code);
        }}
      />

      {/* Quick Stock Adjust / Restock Modal */}
      <QuickStockAdjustModal
        visible={restockModalVisible}
        product={selectedProductForRestock}
        onClose={() => setRestockModalVisible(false)}
        onSuccess={() => {
          loadProducts(1, false);
        }}
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
    backgroundColor: '#09090b',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e11d48',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  createBtnHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    whiteSpace: 'nowrap',
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fbbf24',
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
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
  barcodeScanBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chipSection: {
    marginBottom: 8,
  },
  categoryChipList: {
    gap: 6,
    paddingVertical: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  catChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  catChipText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    whiteSpace: 'nowrap',
  },
  catChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  stockFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  stockFilterPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  stockFilterPillActive: {
    backgroundColor: '#27272a',
    borderColor: '#52525b',
  },
  stockFilterPillActiveLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#fbbf24',
  },
  stockFilterPillActiveOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#f87171',
  },
  stockFilterPillActiveInactive: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
    borderColor: '#a1a1aa',
  },
  stockFilterText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
    whiteSpace: 'nowrap',
  },
  stockFilterTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  stockFilterTextActiveLow: {
    color: '#fbbf24',
    fontFamily: 'Poppins_600SemiBold',
  },
  stockFilterTextActiveOut: {
    color: '#f87171',
    fontFamily: 'Poppins_600SemiBold',
  },
  stockFilterTextActiveInactive: {
    color: '#d4d4d8',
    fontFamily: 'Poppins_600SemiBold',
  },
  listContent: {
    paddingBottom: 30,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#e4e4e7',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  footerLoaderText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
});
