import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Modal,
} from 'react-native';
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  RotateCw,
  HelpCircle,
  X,
} from 'lucide-react-native';
import api from '../services/api';

export default function DashboardScreen({ isLandscape = false }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMarginInfo, setShowMarginInfo] = useState(false);

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

      {/* 2-Column Grid Rows */}
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

            <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{formatRp(sales.total_revenue)}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.cardSub} numberOfLines={1}>
                {sales.total_transactions || 0} trx • {sales.total_items_sold || 0} item
              </Text>
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

            <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{formatRp(profit.gross_profit)}</Text>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={styles.marginInfoTrigger}
                onPress={() => setShowMarginInfo(true)}
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

            <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{formatRp(profit.net_profit)}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.cardSub} numberOfLines={1}>
                Beban: {formatRp(profit.operational_expenses)}
              </Text>
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

            <Text style={styles.cardValue} numberOfLines={1} adjustsFontSizeToFit>{formatRp(inv.total_stock_valuation)}</Text>

            <View style={styles.cardFooter}>
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
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={fetchSummary} activeOpacity={0.8}>
        <RotateCw size={14} color="#f4f4f5" />
        <Text style={styles.refreshBtnText}>Perbarui Data</Text>
      </TouchableOpacity>

      {/* Margin Info Tooltip Modal */}
      <Modal
        visible={showMarginInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMarginInfo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMarginInfo(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={18} color="#34d399" />
                <Text style={styles.modalTitle}>Rincian Laba Kotor & Margin</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowMarginInfo(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#a1a1aa" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalContent}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Omzet Penjualan</Text>
                <Text style={styles.calcValue}>{formatRp(sales.total_revenue)}</Text>
              </View>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Total HPP (Modal Barang)</Text>
                <Text style={[styles.calcValue, { color: '#fb7185' }]}>
                  - {formatRp(profit.total_cogs)}
                </Text>
              </View>

              <View style={styles.calcDivider} />

              <View style={styles.calcRow}>
                <Text style={styles.calcLabelBold}>Laba Kotor (Gross Profit)</Text>
                <Text style={[styles.calcValueBold, { color: '#34d399' }]}>
                  {formatRp(profit.gross_profit)}
                </Text>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabelBold}>Persentase Margin</Text>
                <Text style={[styles.calcValueBold, { color: '#34d399' }]}>
                  {profit.gross_profit_margin || 0}%
                </Text>
              </View>

              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>
                  💡 <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#e4e4e7' }}>Arti Margin {profit.gross_profit_margin || 0}%:</Text> Dari setiap Rp100 penjualan, toko menghasilkan keuntungan kotor sebesar Rp{Math.round(profit.gross_profit_margin || 0)} sebelum dikurangi beban biaya operasional.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setShowMarginInfo(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseBtnText}>Mengerti</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    marginBottom: 14,
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
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 2,
  },
  refreshBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  marginInfoTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18181b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      },
    }),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginBottom: 14,
  },
  modalContent: {
    gap: 10,
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calcLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  calcValue: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  calcDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 4,
  },
  calcLabelBold: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  calcValueBold: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  formulaBox: {
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  formulaText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    lineHeight: 18,
  },
  modalCloseBtn: {
    backgroundColor: '#e11d48',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
