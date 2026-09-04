import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Package,
  FolderTree,
  Scale,
  TicketPercent,
  Percent,
  Users,
  Truck,
  Sparkles,
  AlertTriangle,
} from 'lucide-react-native';
import { showAlert } from '../../utils/alert';

export default function DashboardActionHub({
  navigation,
  sales = {},
  inv = {},
  onOpenMasterProduct,
}) {
  const lowStock = Number(inv?.low_stock_count || 0);
  const totalSku = Number(inv?.total_items || 0);

  const handleMasterProduct = () => {
    if (onOpenMasterProduct) {
      onOpenMasterProduct();
    } else {
      showAlert(
        'Master Produk (Plan #25)',
        'Layar Master Produk siap dikerjakan! Kelola katalog produk, edit harga & stok, serta scan barcode fisik kemasan langsung dari ponsel.'
      );
    }
  };

  const handleMasterAction = (title, description) => {
    showAlert(title, description);
  };

  // Master Data launcher items (4 columns per row, compact centered square tiles)
  const masterItems = [
    {
      id: 'product',
      name: 'Produk',
      icon: Package,
      color: '#34d399',
      bgColor: 'rgba(16, 185, 129, 0.16)',
      badge: lowStock > 0 ? `${lowStock} tipis` : null,
      badgeColor: '#fbbf24',
      badgeBg: 'rgba(245, 158, 11, 0.2)',
      onPress: handleMasterProduct,
    },
    {
      id: 'category',
      name: 'Kategori',
      icon: FolderTree,
      color: '#38bdf8',
      bgColor: 'rgba(56, 189, 248, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Kategori',
          'Kelola pengelompokan produk, departemen barang, dan tata letak kategori di kasir POS.'
        ),
    },
    {
      id: 'unit',
      name: 'Satuan',
      icon: Scale,
      color: '#c084fc',
      bgColor: 'rgba(192, 132, 252, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Satuan',
          'Atur unit satuan penjualan produk (Pcs, Box, Kg, Liter, Cup, Porsi, dll).'
        ),
    },
    {
      id: 'promo',
      name: 'Promosi',
      icon: TicketPercent,
      color: '#fb7185',
      bgColor: 'rgba(251, 113, 133, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Promosi',
          'Atur diskon bertingkat, voucher promo kasir, dan harga spesial periode tertentu.'
        ),
    },
    {
      id: 'tax_fee',
      name: 'Pajak & Biaya',
      icon: Percent,
      color: '#fbbf24',
      bgColor: 'rgba(251, 191, 36, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Pajak & Biaya',
          'Kelola pengaturan tarif PPN / PB1 resto dan biaya layanan (service charge).'
        ),
    },
    {
      id: 'customer',
      name: 'Pelanggan',
      icon: Users,
      color: '#2dd4bf',
      bgColor: 'rgba(45, 212, 191, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Pelanggan',
          'Data kontak pelanggan tetap, riwayat belanja member, dan poin loyalitas.'
        ),
    },
    {
      id: 'supplier',
      name: 'Pemasok',
      icon: Truck,
      color: '#fb923c',
      bgColor: 'rgba(251, 146, 60, 0.16)',
      badge: null,
      onPress: () =>
        handleMasterAction(
          'Master Pemasok',
          'Daftar kontak distributor/supplier untuk pencatatan restock pasokan barang.'
        ),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Sparkles size={14} color="#fb7185" style={{ flexShrink: 0 }} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Master Data & Katalog
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Owner</Text>
        </View>
      </View>

      {/* 4-Column Grid: Compact Centered Square Tiles */}
      <View style={styles.gridContainer}>
        {masterItems.map((item) => {
          const IconComp = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.gridTile}
              activeOpacity={0.7}
              onPress={item.onPress}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <IconComp size={20} color={item.color} />
                {item.badge && (
                  <View style={[styles.tileBadge, { backgroundColor: item.badgeBg }]}>
                    <Text style={[styles.tileBadgeText, { color: item.badgeColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.tileLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#e4e4e7',
    letterSpacing: -0.2,
  },
  roleBadge: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    flexShrink: 0,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fb7185',
    whiteSpace: 'nowrap',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 12,
  },
  gridTile: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  tileBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  tileBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    lineHeight: 14,
  },
  tileLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: '92%',
  },
});
