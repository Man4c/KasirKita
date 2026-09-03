import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
} from 'lucide-react-native';
import api from '../services/api';

export default function DashboardScreen({ isLandscape = false }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/finance/dashboard');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.log('Error fetching dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#e11d48" size="large" />
        <Text style={styles.loadingText}>Memuat ringkasan toko...</Text>
      </View>
    );
  }

  const sales = summary?.sales || {};
  const profit = summary?.profitability || {};
  const cash = summary?.cash_flow || {};
  const inv = summary?.inventory || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Ringkasan performa penjualan dan keuangan hari ini</Text>
      </View>

      {/* Card 1: Omzet Penjualan */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
              <CircleDollarSign size={18} color="#fb7185" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Total Omzet Penjualan</Text>
          </View>
        </View>

        <Text style={styles.cardValue}>{formatRp(sales.total_revenue)}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardSub}>
            {sales.total_transactions || 0} transaksi • {sales.total_items_sold || 0} item terjual
          </Text>
        </View>
      </View>

      {/* Card 2: Laba Kotor */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
              <TrendingUp size={18} color="#34d399" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Laba Kotor (Gross Profit)</Text>
          </View>
        </View>

        <Text style={styles.cardValue}>{formatRp(profit.gross_profit)}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardSub}>
            Margin: {profit.gross_profit_margin || 0}% • HPP: {formatRp(profit.total_cogs)}
          </Text>
        </View>
      </View>

      {/* Card 3: Estimasi Laba Bersih */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Wallet size={18} color="#38bdf8" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Estimasi Laba Bersih</Text>
          </View>
        </View>

        <Text style={styles.cardValue}>{formatRp(profit.net_profit)}</Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardSub}>
            Beban Operasional: {formatRp(profit.operational_expenses)}
          </Text>
        </View>
      </View>

      {/* Card 4: Valuasi Aset Stok Barang */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(167, 139, 250, 0.12)' }]}>
              <Boxes size={18} color="#a78bfa" />
            </View>
            <Text style={styles.cardLabel} numberOfLines={1}>Valuasi Aset Stok Barang</Text>
          </View>
        </View>

        <Text style={styles.cardValue}>{formatRp(inv.total_stock_valuation)}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.stockStatusRow}>
            {inv.low_stock_products_count > 0 ? (
              <>
                <AlertTriangle size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
                <Text style={[styles.cardSub, { color: '#fbbf24' }]}>
                  {inv.low_stock_products_count} produk stok menipis!
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} color="#34d399" style={{ flexShrink: 0 }} />
                <Text style={[styles.cardSub, { color: '#34d399' }]}>
                  Semua stok produk aman ({inv.total_active_products || 0} aktif)
                </Text>
              </>
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchSummary} activeOpacity={0.8}>
        <RotateCw size={15} color="#f4f4f5" />
        <Text style={styles.refreshBtnText}>Perbarui Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    flex: 1,
  },
  cardValue: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  stockStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  refreshBtn: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  refreshBtnText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
