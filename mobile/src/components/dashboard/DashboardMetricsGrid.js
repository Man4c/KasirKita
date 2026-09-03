import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react-native';

export default function DashboardMetricsGrid({
  sales = {},
  profit = {},
  inv = {},
  formatRp,
  onOpenModal,
}) {
  return (
    <View style={styles.gridContainer}>
      {/* Row 1: Omzet & Laba Kotor */}
      <View style={styles.gridRow}>
        {/* Card 1: Omzet Penjualan */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
              <CircleDollarSign size={15} color="#fb7185" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Omzet</Text>
          </View>

          <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatRp(sales.total_revenue)}
          </Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cardSubTrigger}
              onPress={() => onOpenModal('omzet')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.cardSub} numberOfLines={1}>
                {sales.total_transactions || 0} trx • {sales.total_items_sold || 0} item
              </Text>
              <HelpCircle size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 2: Laba Kotor */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
              <TrendingUp size={15} color="#34d399" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Laba Kotor</Text>
          </View>

          <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatRp(profit.gross_profit)}
          </Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cardSubTrigger}
              onPress={() => onOpenModal('gross_profit')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.cardSub} numberOfLines={1}>
                Margin: {profit.gross_profit_margin || 0}%
              </Text>
              <HelpCircle size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Row 2: Laba Bersih & Valuasi Stok */}
      <View style={styles.gridRow}>
        {/* Card 3: Estimasi Laba Bersih */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Wallet size={15} color="#38bdf8" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Laba Bersih</Text>
          </View>

          <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatRp(profit.net_profit)}
          </Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cardSubTrigger}
              onPress={() => onOpenModal('net_profit')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.cardSub} numberOfLines={1}>
                Beban: {formatRp(profit.operational_expenses)}
              </Text>
              <HelpCircle size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Card 4: Valuasi Aset Stok Barang */}
        <View style={styles.gridCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
              <Boxes size={15} color="#a78bfa" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Valuasi Stok</Text>
          </View>

          <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatRp(inv.total_stock_valuation)}
          </Text>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.cardSubTrigger}
              onPress={() => onOpenModal('inventory')}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <View style={styles.stockStatusRow}>
                {inv.low_stock_products_count > 0 ? (
                  <>
                    <AlertTriangle size={12} color="#fbbf24" style={{ flexShrink: 0 }} />
                    <Text style={[styles.cardSub, { color: '#fbbf24' }]} numberOfLines={1}>
                      {inv.low_stock_products_count} menipis
                    </Text>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} color="#34d399" style={{ flexShrink: 0 }} />
                    <Text style={[styles.cardSub, { color: '#34d399' }]} numberOfLines={1}>
                      Aman
                    </Text>
                  </>
                )}
              </View>
              <HelpCircle size={12} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    marginBottom: 10,
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    flex: 1,
    minWidth: 0,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 6,
  },
  cardSubTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flexShrink: 1,
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
});
