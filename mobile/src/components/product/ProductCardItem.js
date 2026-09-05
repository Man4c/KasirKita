import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Barcode,
  Edit3,
  PlusCircle,
  Eye,
  EyeOff,
} from 'lucide-react-native';

/**
 * ProductCardItem: Komponen kartu item produk modular.
 * Sesuai The Flexbox Pairing Rule, The Readability Floor Rule (font >= 12px),
 * dan The Data Table/Value Protection Rule (whitespace-nowrap).
 */
const ProductCardItem = React.memo(function ProductCardItem({
  item,
  formatRp,
  showCost = false,
  onToggleCost,
  onEdit,
  onRestock,
  userRole = 'owner',
}) {
  const stock = Number(item.stock || 0);
  const minStock = Number(item.min_stock || 0);
  const price = Number(item.price || 0);
  const avgCost = Number(item.avg_cost || 0);
  const unitSymbol = item.base_unit?.symbol || item.base_unit?.name || 'pcs';
  const categoryName = item.category?.name || 'Umum';

  // Hitung status stok
  const isOutOfStock = stock <= 0;
  const isLowStock = !isOutOfStock && stock <= minStock;
  const isSafeStock = !isOutOfStock && !isLowStock;
  const isInactive = item.is_active === false;

  // Margin laba estimasi
  const profitMargin =
    price > 0 && avgCost > 0
      ? Math.round(((price - avgCost) / price) * 100)
      : null;

  return (
    <TouchableOpacity
      style={[styles.card, isInactive && styles.cardInactive]}
      activeOpacity={userRole === 'owner' ? 0.88 : 1}
      onPress={() => userRole === 'owner' && onEdit && onEdit(item)}
    >
      {/* Baris Atas: Foto/Inisial + Info Nama & Kategori + Badge Stok */}
      <View style={styles.cardHeader}>
        <View style={styles.productIdentity}>
          <View
            style={[
              styles.avatarBox,
              isOutOfStock
                ? styles.avatarBoxOut
                : isLowStock
                ? styles.avatarBoxLow
                : styles.avatarBoxSafe,
            ]}
          >
            <Package
              size={18}
              color={
                isOutOfStock
                  ? '#f87171'
                  : isLowStock
                  ? '#fbbf24'
                  : '#34d399'
              }
            />
          </View>

          <View style={styles.titleCol}>
            <View style={styles.nameRow}>
              <Text style={styles.productName} numberOfLines={1}>
                {item.name}
              </Text>
              {isInactive && (
                <View style={styles.inactiveBadge}>
                  <Text style={styles.inactiveBadgeText}>Non-aktif</Text>
                </View>
              )}
            </View>

            <View style={styles.subMetaRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText} numberOfLines={1}>
                  {categoryName}
                </Text>
              </View>
              {item.sku_barcode ? (
                <View style={styles.barcodeWrapper}>
                  <Barcode size={12} color="#71717a" style={{ flexShrink: 0 }} />
                  <Text style={styles.barcodeText} numberOfLines={1}>
                    {item.sku_barcode}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Badge Status Kuantitas Stok */}
        <View
          style={[
            styles.stockPill,
            isOutOfStock
              ? styles.stockPillOut
              : isLowStock
              ? styles.stockPillLow
              : styles.stockPillSafe,
          ]}
        >
          {isOutOfStock ? (
            <XCircle size={12} color="#f87171" style={{ flexShrink: 0 }} />
          ) : isLowStock ? (
            <AlertTriangle size={12} color="#fbbf24" style={{ flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={12} color="#34d399" style={{ flexShrink: 0 }} />
          )}
          <Text
            style={[
              styles.stockPillText,
              isOutOfStock
                ? styles.stockTextOut
                : isLowStock
                ? styles.stockTextLow
                : styles.stockTextSafe,
            ]}
            numberOfLines={1}
          >
            {stock} {unitSymbol}
          </Text>
        </View>
      </View>

      {/* Baris Tengah: Harga Jual & Harga Modal (HPP) */}
      <View style={styles.priceRow}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Harga Jual</Text>
          <Text style={styles.priceValue} numberOfLines={1}>
            {formatRp(price)}
          </Text>
        </View>

        {userRole === 'owner' && (
          <View style={styles.costBox}>
            <View style={styles.costHeaderRow}>
              <Text style={styles.priceLabel}>HPP / Modal</Text>
              {onToggleCost && (
                <TouchableOpacity
                  onPress={onToggleCost}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {showCost ? (
                    <EyeOff size={12} color="#71717a" />
                  ) : (
                    <Eye size={12} color="#71717a" />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.costValue} numberOfLines={1}>
              {showCost ? formatRp(avgCost) : '••••••'}
              {showCost && profitMargin !== null && (
                <Text style={styles.marginText}> (+{profitMargin}%)</Text>
              )}
            </Text>
          </View>
        )}
      </View>

      {/* Baris Bawah: Tombol Aksi Cepat */}
      {userRole === 'owner' && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.restockBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e?.stopPropagation?.();
              onRestock && onRestock(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <PlusCircle size={14} color="#34d399" />
            <Text style={styles.restockBtnText}>Stok Masuk</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e?.stopPropagation?.();
              onEdit && onEdit(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit3 size={14} color="#e4e4e7" />
            <Text style={styles.editBtnText}>Edit Produk</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default ProductCardItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  cardInactive: {
    opacity: 0.65,
    borderColor: 'rgba(39, 39, 42, 0.6)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  productIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarBoxSafe: {
    backgroundColor: '#12261e',
    borderColor: 'rgba(52, 211, 153, 0.25)',
    borderWidth: 1,
  },
  avatarBoxLow: {
    backgroundColor: '#292010',
    borderColor: 'rgba(251, 191, 36, 0.25)',
    borderWidth: 1,
  },
  avatarBoxOut: {
    backgroundColor: '#2a1418',
    borderColor: 'rgba(248, 113, 113, 0.25)',
    borderWidth: 1,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  productName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: 'rgba(113, 113, 122, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  inactiveBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  categoryBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 7,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
    flexShrink: 0,
    maxWidth: 120,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
  barcodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  barcodeText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flex: 1,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  stockPillSafe: {
    backgroundColor: '#12261e',
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  stockPillLow: {
    backgroundColor: '#292010',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  stockPillOut: {
    backgroundColor: '#2a1418',
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  stockPillText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
  stockTextSafe: {
    color: '#34d399',
  },
  stockTextLow: {
    color: '#fbbf24',
  },
  stockTextOut: {
    color: '#f87171',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 12,
  },
  priceBox: {
    flex: 1,
    minWidth: 0,
  },
  priceLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  priceValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
    whiteSpace: 'nowrap',
  },
  costBox: {
    flex: 1,
    minWidth: 0,
    alignItems: 'flex-end',
  },
  costHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costValue: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    whiteSpace: 'nowrap',
  },
  marginText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#34d399',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39, 39, 42, 0.8)',
  },
  restockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#12261e',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderWidth: 1,
    height: 38,
    borderRadius: 8,
  },
  restockBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#34d399',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
    borderWidth: 1,
    height: 38,
    borderRadius: 8,
  },
  editBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
});
