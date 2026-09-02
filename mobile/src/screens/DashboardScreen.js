import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
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
        <Text style={styles.headerTitle}>Laporan Toko Hari Ini</Text>
        <Text style={styles.headerSubtitle}>Ringkasan performa penjualan dan keuangan</Text>
      </View>

      {/* Card 1: Omzet */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Total Omzet Penjualan</Text>
          <CircleDollarSign size={16} color="#fb7185" />
        </View>
        <Text style={styles.cardValue}>{formatRp(sales.total_revenue)}</Text>
        <Text style={styles.cardSub}>
          {sales.total_transactions} transaksi • {sales.total_items_sold} item terjual
        </Text>
      </View>

      {/* Card 2: Laba Kotor */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Laba Kotor (Gross Profit)</Text>
          <TrendingUp size={16} color="#34d399" />
        </View>
        <Text style={[styles.cardValue, { color: '#34d399' }]}>{formatRp(profit.gross_profit)}</Text>
        <Text style={styles.cardSub}>
          Margin Laba: {profit.gross_profit_margin}% (HPP: {formatRp(profit.total_cogs)})
        </Text>
      </View>

      {/* Card 3: Laba Bersih */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Estimasi Laba Bersih</Text>
          <Wallet size={16} color="#38bdf8" />
        </View>
        <Text style={styles.cardValue}>{formatRp(profit.net_profit)}</Text>
        <Text style={styles.cardSub}>
          Beban Ops: {formatRp(profit.operational_expenses)}
        </Text>
      </View>

      {/* Card 4: Inventory Health */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Valuasi Aset Stok Barang</Text>
          <Boxes size={16} color="#a78bfa" />
        </View>
        <Text style={styles.cardValue}>{formatRp(inv.total_stock_valuation)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {inv.low_stock_products_count > 0 ? (
            <>
              <AlertTriangle size={14} color="#fbbf24" />
              <Text style={[styles.cardSub, { color: '#fbbf24', marginTop: 0 }]}>
                {inv.low_stock_products_count} produk stok menipis!
              </Text>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} color="#34d399" />
              <Text style={[styles.cardSub, { color: '#34d399', marginTop: 0 }]}>
                Semua stok produk aman
              </Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchSummary}>
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
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
  },
  cardValue: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    marginTop: 6,
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
    backgroundColor: '#27272a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  refreshBtnText: {
    color: '#f4f4f5',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
