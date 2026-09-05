import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RotateCw } from 'lucide-react-native';

/**
 * HistoryHeader: Header bar layar Riwayat Transaksi.
 * Mematuhi normalisasi margin horizontal 16px, paddingVertical 12px, borderBottomColor #27272a.
 */
export default function HistoryHeader({
  totalCount,
  onRefresh,
  refreshing,
  loading,
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle} numberOfLines={1}>
          {totalCount !== undefined
            ? `${totalCount} nota transaksi tercatat`
            : 'Daftar nota penjualan dan struk transaksi toko'}
        </Text>
      </View>

      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={onRefresh}
          disabled={refreshing || loading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#e11d48" />
          ) : (
            <RotateCw size={16} color="#a1a1aa" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 4,
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
