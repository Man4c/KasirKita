import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Receipt, RotateCcw } from 'lucide-react-native';

/**
 * HistoryEmptyState: Tampilan saat riwayat transaksi kosong atau tidak ditemukan.
 */
export default function HistoryEmptyState({
  search,
  filterMethod,
  onResetFilters,
}) {
  const isFiltered = Boolean(search || (filterMethod && filterMethod !== 'ALL'));

  return (
    <View style={styles.emptyBox}>
      <View style={styles.iconCircle}>
        <Receipt size={32} color="#71717a" />
      </View>
      <Text style={styles.emptyTitle}>
        {isFiltered ? 'Tidak Ada Transaksi Ditemukan' : 'Belum Ada Transaksi'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isFiltered
          ? 'Coba ganti kata kunci pencarian atau sesuaikan filter metode pembayaran.'
          : 'Transaksi penjualan kasir yang telah selesai akan otomatis tercatat di sini.'}
      </Text>
      {isFiltered && onResetFilters && (
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={onResetFilters}
          activeOpacity={0.7}
        >
          <RotateCcw size={13} color="#fb7185" style={{ marginRight: 6 }} />
          <Text style={styles.resetBtnText}>Reset Filter & Pencarian</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 280,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
    lineHeight: 18,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  resetBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
});
