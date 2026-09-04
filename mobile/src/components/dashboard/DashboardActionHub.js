import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import {
  Package,
  ShoppingCart,
  Receipt,
  Settings,
  ChevronRight,
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
  const totalTrxToday = Number(sales?.transaction_count || 0);

  const handleMasterProductPress = () => {
    if (onOpenMasterProduct) {
      onOpenMasterProduct();
    } else {
      showAlert(
        'Master Produk (Plan #25)',
        'Layar Master Produk siap diimplementasikan! Anda dapat mengelola katalog, harga, stok, dan scan barcode kemasan fisik langsung dari HP.'
      );
    }
  };

  const handleNav = (tabKey) => {
    if (navigation?.navigate) {
      navigation.navigate(tabKey);
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Sparkles size={15} color="#fb7185" style={{ flexShrink: 0 }} />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Akses Cepat & Navigasi
          </Text>
        </View>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Owner Hub</Text>
        </View>
      </View>

      {/* 2x2 Interactive Action Cards Grid */}
      <View style={styles.grid}>
        {/* 1. Master Produk & Stok (Highlighted Hero Action) */}
        <TouchableOpacity
          style={[styles.actionCard, styles.productCardHero]}
          activeOpacity={0.75}
          onPress={handleMasterProductPress}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Package size={20} color="#34d399" />
            </View>
            <View style={styles.arrowBox}>
              <ChevronRight size={14} color="#a1a1aa" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Master Produk
            </Text>
            <View style={styles.statusRow}>
              {lowStock > 0 ? (
                <View style={styles.lowStockPill}>
                  <AlertTriangle size={12} color="#fbbf24" style={{ flexShrink: 0 }} />
                  <Text style={styles.lowStockText} numberOfLines={1}>
                    {lowStock} menipis
                  </Text>
                </View>
              ) : (
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {totalSku > 0 ? `${totalSku} produk aktif` : 'Kelola stok & harga'}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* 2. Kasir POS */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => handleNav('pos')}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(225, 29, 72, 0.15)' }]}>
              <ShoppingCart size={20} color="#fb7185" />
            </View>
            <View style={styles.arrowBox}>
              <ChevronRight size={14} color="#71717a" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Kasir POS
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              Buka terminal kasir
            </Text>
          </View>
        </TouchableOpacity>

        {/* 3. Riwayat Transaksi */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => handleNav('history')}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Receipt size={20} color="#fbbf24" />
            </View>
            <View style={styles.arrowBox}>
              <ChevronRight size={14} color="#71717a" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Riwayat Nota
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {totalTrxToday > 0 ? `${totalTrxToday} nota hari ini` : 'Cari & cetak struk'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* 4. Pengaturan Toko */}
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.75}
          onPress={() => handleNav('settings')}
        >
          <View style={styles.cardTop}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(129, 140, 248, 0.15)' }]}>
              <Settings size={20} color="#a5b4fc" />
            </View>
            <View style={styles.arrowBox}>
              <ChevronRight size={14} color="#71717a" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              Pengaturan
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              Printer & toko
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    minHeight: 106,
  },
  productCardHero: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: '#141c19',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    gap: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lowStockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  lowStockText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fbbf24',
  },
});
