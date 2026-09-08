import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ticket } from 'lucide-react-native';

export default function SuperAdminStatsCards({ stats }) {
  const totalStores = stats?.total_stores ?? 0;
  const trialStores = stats?.trial_stores ?? 0;
  const activeStores = stats?.active_stores ?? 0;
  const expiredStores = stats?.expired_stores ?? 0;
  const licenses = stats?.licenses ?? { total: 0, available: 0, redeemed: 0 };

  return (
    <View style={styles.container}>
      <View style={styles.dashboardCard}>
        {/* 4-Pillar Executive KPI Strip */}
        <View style={styles.kpiRow}>
          {/* Total Toko */}
          <View style={styles.kpiColumn}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiPip, { backgroundColor: '#38bdf8' }]} />
              <Text style={styles.kpiLabel}>Total</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#ffffff' }]}>{totalStores}</Text>
          </View>

          <View style={styles.kpiDivider} />

          {/* Trial Aktif */}
          <View style={styles.kpiColumn}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiPip, { backgroundColor: '#fbbf24' }]} />
              <Text style={styles.kpiLabel}>Trial</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>{trialStores}</Text>
          </View>

          <View style={styles.kpiDivider} />

          {/* Pro Aktif */}
          <View style={styles.kpiColumn}>
            <View style={styles.kpiHeader}>
              <View style={[styles.kpiPip, { backgroundColor: '#34d399' }]} />
              <Text style={styles.kpiLabel}>Pro Aktif</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#34d399' }]}>{activeStores}</Text>
          </View>

          <View style={styles.kpiDivider} />

          {/* Kedaluwarsa */}
          <View style={styles.kpiColumn}>
            <View style={styles.kpiHeader}>
              <View
                style={[
                  styles.kpiPip,
                  { backgroundColor: expiredStores > 0 ? '#fb7185' : '#71717a' },
                ]}
              />
              <Text
                style={[styles.kpiLabel, expiredStores > 0 && { color: '#fb7185' }]}
              >
                Expired
              </Text>
            </View>
            <Text
              style={[
                styles.kpiValue,
                { color: expiredStores > 0 ? '#fb7185' : '#71717a' },
              ]}
            >
              {expiredStores}
            </Text>
          </View>
        </View>

        {/* Integrated Mini Bank Voucher Strip */}
        <View style={styles.voucherStrip}>
          <View style={styles.voucherLeft}>
            <Ticket size={13} color="#fbbf24" style={styles.voucherIcon} />
            <Text style={styles.voucherTitle}>Bank Voucher:</Text>
          </View>
          <View style={styles.voucherMetrics}>
            <View style={styles.voucherBadge}>
              <Text style={styles.voucherBadgeLabel}>Tersedia </Text>
              <Text style={styles.voucherBadgeGreen}>{licenses.available}</Text>
            </View>
            <Text style={styles.voucherSeparator}>•</Text>
            <View style={styles.voucherBadge}>
              <Text style={styles.voucherBadgeLabel}>Terpakai </Text>
              <Text style={styles.voucherBadgeBlue}>{licenses.redeemed}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dashboardCard: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    overflow: 'hidden',
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  kpiColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  kpiPip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
  kpiLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#a1a1aa',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  kpiValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 20,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#27272a',
    flexShrink: 0,
  },
  voucherStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#202024',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  voucherLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  voucherIcon: {
    marginRight: 6,
    flexShrink: 0,
  },
  voucherTitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#d4d4d8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voucherMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
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
  voucherBadgeGreen: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#34d399',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voucherBadgeBlue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    color: '#38bdf8',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  voucherSeparator: {
    color: '#52525b',
    fontSize: 12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
