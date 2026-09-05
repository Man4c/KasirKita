import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WifiOff, Clock } from 'lucide-react-native';

/**
 * HistoryBanner: Banner status mode offline dan transaksi offline pending sync.
 */
export default function HistoryBanner({
  isOfflineMode,
  offlineQueueCount = 0,
  transactionsCount = 0,
}) {
  if (isOfflineMode) {
    return (
      <View style={styles.offlineBanner}>
        <WifiOff size={14} color="#f59e0b" style={{ marginRight: 8, flexShrink: 0 }} />
        <Text style={styles.offlineBannerText}>
          Mode Offline: Menampilkan {transactionsCount} nota tersimpan di HP (7 hari terakhir).
        </Text>
      </View>
    );
  }

  if (offlineQueueCount > 0) {
    return (
      <View style={styles.queueBanner}>
        <Clock size={14} color="#38bdf8" style={{ marginRight: 8, flexShrink: 0 }} />
        <Text style={styles.queueBannerText}>
          {offlineQueueCount} transaksi offline di HP menunggu sinkronisasi otomatis.
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#b45309',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  offlineBannerText: {
    color: '#fde68a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  queueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  queueBannerText: {
    color: '#bae6fd',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
});
