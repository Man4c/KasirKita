import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Search, X, PackageSearch, RotateCcw } from 'lucide-react-native';

export default function ProductGrid({
  isLandscape,
  compact,
  search,
  onSearchChange,
  categories,
  selectedCat,
  onSelectCat,
  products,
  loading,
  cart,
  onAddToCart,
  formatRp,
}) {
  const selectedCatObj = categories.find((c) => c.id === selectedCat);

  return (
    <View style={[styles.catalogCol, isLandscape && styles.landscapeCatalogCol]}>
      {/* Catalog Toolbar */}
      <View
        style={[
          styles.landscapeToolbar,
          !isLandscape && styles.portraitToolbar,
          compact && styles.landscapeToolbarCompact,
        ]}
      >
        {/* Search Box */}
        {!isLandscape ? (
          <View
            style={[
              styles.portraitSearchPill,
              search.length > 0 && styles.portraitSearchPillActive,
            ]}
          >
            <Search size={13} color={search ? '#fb7185' : '#a1a1aa'} style={{ marginRight: 5 }} />
            <TextInput
              style={[
                styles.portraitSearchPillInput,
                { width: search ? Math.min(100, Math.max(34, search.length * 9)) : 32 },
              ]}
              placeholder="Cari"
              placeholderTextColor="#a1a1aa"
              value={search}
              onChangeText={onSearchChange}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 4 }}
              >
                <X size={13} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View
            style={[
              styles.landscapeSearchBox,
              compact && styles.landscapeSearchBoxCompact,
            ]}
          >
            <Search size={14} color="#a1a1aa" style={{ marginRight: 6 }} />
            <TextInput
              style={[styles.landscapeSearchInput, compact && styles.landscapeSearchInputCompact]}
              placeholder="Cari produk..."
              placeholderTextColor="#71717a"
              value={search}
              onChangeText={onSearchChange}
            />
            {search.length > 0 && (
              <TouchableOpacity
                onPress={() => onSearchChange('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color="#a1a1aa" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.toolbarDivider} />

        {/* Categories Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.landscapeCatScrollContent}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={[styles.catChip, styles.catChipCompact, selectedCat === 'ALL' && styles.catChipActive]}
            onPress={() => onSelectCat('ALL')}
          >
            <Text
              style={[
                styles.catChipText,
                styles.catChipTextCompact,
                selectedCat === 'ALL' && styles.catChipTextActive,
              ]}
            >
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, styles.catChipCompact, selectedCat === c.id && styles.catChipActive]}
              onPress={() => onSelectCat(c.id)}
            >
              <Text
                style={[
                  styles.catChipText,
                  styles.catChipTextCompact,
                  selectedCat === c.id && styles.catChipTextActive,
                ]}
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#e11d48" size="large" />
          <Text style={styles.loadingText}>Memuat katalog produk...</Text>
        </View>
      ) : (
        <FlatList
          key={isLandscape ? 'grid-landscape' : 'grid-portrait'}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[
            styles.gridContent,
            { paddingBottom: cart.length > 0 ? 170 : 100 },
            products.length === 0 && { flexGrow: 1 },
            isLandscape && styles.gridContentLandscape,
            compact && styles.gridContentCompactLandscape,
          ]}
          ListEmptyComponent={
            <View style={[styles.emptyProductsContainer, compact && styles.emptyProductsContainerCompact]}>
              <View style={styles.emptyIconCircle}>
                <PackageSearch size={compact ? 28 : 36} color="#71717a" />
              </View>
              <Text style={[styles.emptyProductsTitle, compact && { fontSize: 13 }]}>
                {search.trim() ? 'Produk Tidak Ditemukan' : 'Belum Ada Produk'}
              </Text>
              <Text style={styles.emptyProductsSub}>
                {search.trim()
                  ? `Tidak ada produk yang cocok dengan pencarian "${search}".`
                  : selectedCat !== 'ALL'
                  ? `Belum ada produk di kategori ${selectedCatObj?.name || 'ini'}.`
                  : 'Belum ada produk aktif yang tersedia di katalog kasir.'}
              </Text>
              {(search.trim() || selectedCat !== 'ALL') && (
                <TouchableOpacity
                  style={styles.emptyResetBtn}
                  onPress={() => {
                    if (search.trim()) onSearchChange('');
                    if (selectedCat !== 'ALL') onSelectCat('ALL');
                  }}
                  activeOpacity={0.7}
                >
                  <RotateCcw size={12} color="#fb7185" style={{ marginRight: 6 }} />
                  <Text style={styles.emptyResetBtnText}>
                    {search.trim() && selectedCat !== 'ALL'
                      ? 'Reset Filter & Pencarian'
                      : search.trim()
                      ? 'Hapus Pencarian'
                      : 'Tampilkan Semua Kategori'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const inCart = cart.find((i) => i.product.id === item.id);
            const stockNum = Number(item.stock || 0);
            const stockDisplay = Number.isInteger(stockNum) ? stockNum : stockNum.toFixed(1);
            const minStockNum = Number(item.min_stock || 0);
            const isOutOfStock = stockNum <= 0;
            const isLowStock = stockNum <= minStockNum;
            const unitSymbol = item.unitSymbol || item.base_unit?.symbol || item.baseUnit?.symbol || 'pcs';

            return (
              <TouchableOpacity
                style={[
                  styles.productCard,
                  isLandscape && styles.productCardLandscape,
                  compact && styles.productCardCompactLandscape,
                  isOutOfStock && styles.productOutOfStock,
                ]}
                onPress={() => !isOutOfStock && onAddToCart(item)}
                disabled={isOutOfStock}
                activeOpacity={0.7}
              >
                {inCart && (
                  <View style={[styles.floatingBadge, compact && styles.floatingBadgeCompact]}>
                    <Text style={styles.floatingBadgeText}>
                      {inCart.quantity} {unitSymbol}
                    </Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
                    {item.category?.name || 'Umum'}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.cardTitle,
                    isLandscape && styles.cardTitleLandscape,
                    compact && styles.cardTitleCompactLandscape,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                    <Text style={styles.cardPrice}>{formatRp(item.price)}</Text>
                    <Text style={styles.cardPriceUnit}>/{unitSymbol}</Text>
                  </View>
                  <Text
                    style={[styles.cardStock, isLowStock && styles.cardStockLow]}
                    numberOfLines={1}
                  >
                    {stockDisplay} {unitSymbol}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  catalogCol: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  landscapeCatalogCol: {
    flex: 1.25,
    borderRightWidth: 1,
    borderRightColor: '#27272a',
  },
  portraitToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 6,
  },
  landscapeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#18181b',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 8,
  },
  landscapeToolbarCompact: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 6,
  },
  portraitSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 9999,
    paddingHorizontal: 8,
    height: 28,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  portraitSearchPillActive: {
    borderColor: '#fb7185',
    backgroundColor: '#26141a',
  },
  portraitSearchPillInput: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  landscapeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 9999,
    paddingHorizontal: 10,
    height: 30,
    borderWidth: 1,
    borderColor: '#3f3f46',
    width: 140,
  },
  landscapeSearchBoxCompact: {
    height: 26,
    width: 120,
    paddingHorizontal: 8,
  },
  landscapeSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 0,
  },
  landscapeSearchInputCompact: {
    fontSize: 12,
  },
  toolbarDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#3f3f46',
  },
  landscapeCatScrollContent: {
    paddingRight: 8,
    alignItems: 'center',
    gap: 4,
  },
  catChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  catChipCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  catChipText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  catChipTextCompact: {
    fontSize: 12,
  },
  catChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
  },
  gridContent: {
    padding: 10,
    gap: 8,
  },
  gridContentLandscape: {
    padding: 8,
    gap: 6,
  },
  gridContentCompactLandscape: {
    padding: 6,
    gap: 4,
  },
  productCard: {
    flex: 1,
    margin: 4,
    backgroundColor: '#18181b',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    position: 'relative',
  },
  productCardLandscape: {
    margin: 3,
    padding: 8,
    borderRadius: 10,
  },
  productCardCompactLandscape: {
    margin: 2,
    padding: 6,
    borderRadius: 8,
  },
  productOutOfStock: {
    opacity: 0.4,
  },
  floatingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#e11d48',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    zIndex: 2,
  },
  floatingBadgeCompact: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    top: 4,
    right: 4,
  },
  floatingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardHeader: {
    marginBottom: 4,
  },
  cardCategory: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  cardTitleLandscape: {
    fontSize: 12,
    marginBottom: 4,
  },
  cardTitleCompactLandscape: {
    fontSize: 12,
    marginBottom: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
  },
  cardPrice: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  cardPriceUnit: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cardStock: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 0,
  },
  cardStockLow: {
    color: '#f59e0b',
    fontFamily: 'Poppins_600SemiBold',
  },
  emptyProductsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 260,
  },
  emptyProductsContainerCompact: {
    padding: 16,
    minHeight: 200,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  emptyProductsTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyProductsSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  emptyResetBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});
