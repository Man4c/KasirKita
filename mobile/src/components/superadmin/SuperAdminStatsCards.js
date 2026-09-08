import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Store, Clock, Crown, AlertTriangle, Ticket } from 'lucide-react-native';

export default function SuperAdminStatsCards({ stats }) {
  const totalStores = stats?.total_stores ?? 0;
  const trialStores = stats?.trial_stores ?? 0;
  const activeStores = stats?.active_stores ?? 0;
  const expiredStores = stats?.expired_stores ?? 0;
  const licenses = stats?.licenses ?? { total: 0, available: 0, redeemed: 0 };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Total Toko */}
        <View style={[styles.card, styles.totalCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Store size={18} color="#38bdf8" />
            </View>
            <Text style={styles.cardLabel}>Total Toko</Text>
          </View>
          <Text style={styles.cardValue}>{totalStores}</Text>
          <Text style={styles.cardHint}>Semua tenant</Text>
        </View>

        {/* Trial Aktif */}
        <View style={[styles.card, styles.trialCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Clock size={18} color="#f59e0b" />
            </View>
            <Text style={styles.cardLabel}>Trial Aktif</Text>
          </View>
          <Text style={[styles.cardValue, { color: '#fbbf24' }]}>{trialStores}</Text>
          <Text style={styles.cardHint}>Masa uji coba</Text>
        </View>

        {/* Pro Aktif */}
        <View style={[styles.card, styles.activeCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Crown size={18} color="#10b981" />
            </View>
            <Text style={styles.cardLabel}>Pro Aktif</Text>
          </View>
          <Text style={[styles.cardValue, { color: '#34d399' }]}>{activeStores}</Text>
          <Text style={styles.cardHint}>Berlangganan resmi</Text>
        </View>

        {/* Kedaluwarsa */}
        <View style={[styles.card, styles.expiredCard]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
              <AlertTriangle size={18} color="#f43f5e" />
            </View>
            <Text style={styles.cardLabel}>Kedaluwarsa</Text>
          </View>
          <Text style={[styles.cardValue, { color: '#fb7185' }]}>{expiredStores}</Text>
          <Text style={styles.cardHint}>Perlu tindak lanjut</Text>
        </View>
      </View>

      {/* Mini Bank Voucher Strip */}
      <View style={styles.voucherStrip}>
        <View style={styles.voucherStripLeft}>
          <Ticket size={16} color="#fbbf24" style={styles.ticketIcon} />
          <Text style={styles.voucherStripTitle}>Bank Voucher Lisensi:</Text>
        </View>
        <View style={styles.voucherMetricsRow}>
          <View style={styles.voucherBadge}>
            <Text style={styles.voucherBadgeLabel}>Tersedia: </Text>
            <Text style={[styles.voucherBadgeValue, { color: '#34d399' }]}>{licenses.available}</Text>
          </View>
          <View style={styles.voucherBadge}>
            <Text style={styles.voucherBadgeLabel}>Terpakai: </Text>
            <Text style={[styles.voucherBadgeValue, { color: '#38bdf8' }]}>{licenses.redeemed}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#18181b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  totalCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  trialCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  activeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  expiredCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#f43f5e',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: '#ffffff',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cardHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#71717a',
    includeFontPadding: false,
    textAlignVertical: 'center',
    marginTop: 2,
  },
  voucherStrip: {
    marginTop: 10,
    backgroundColor: '#18181b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  voucherStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  ticketIcon: {
    marginRight: 6,
  },
  voucherStripTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voucherMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  voucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherBadgeLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voucherBadgeValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
