import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, Platform } from 'react-native';
import {
  CircleDollarSign,
  TrendingUp,
  Wallet,
  Boxes,
  X,
} from 'lucide-react-native';

export default function DashboardDetailModal({
  activeModal,
  onClose,
  sales = {},
  profit = {},
  inv = {},
  formatRp,
}) {
  if (!activeModal) return null;

  const getModalConfig = () => {
    switch (activeModal) {
      case 'omzet':
        return {
          title: 'Rincian Omzet Penjualan',
          icon: <CircleDollarSign size={18} color="#fb7185" />,
          rows: [
            { label: 'Total Uang Masuk Penjualan', value: formatRp(sales.total_revenue) },
            { label: 'Total Transaksi Sukses', value: `${sales.total_transactions || 0} struk / nota` },
            { label: 'Total Kuantitas Barang Terjual', value: `${sales.total_items_sold || 0} pcs / item` },
            { label: 'Rata-rata Belanja per Pelanggan', value: formatRp(sales.average_transaction_value) },
            ...(Number(sales.total_discount || 0) > 0
              ? [{ label: 'Total Potongan Diskon Diberikan', value: `- ${formatRp(sales.total_discount)}`, color: '#fb7185' }]
              : []),
          ],
          highlightRow: null,
          formulaTitle: 'Arti Omzet:',
          formulaText: 'Seluruh nilai bruto uang penjualan yang diterima kasir pada periode ini sebelum dikurangi modal barang kulakan dan biaya operasional toko.',
        };

      case 'gross_profit':
        return {
          title: 'Rincian Laba Kotor & Margin',
          icon: <TrendingUp size={18} color="#34d399" />,
          rows: [
            { label: 'Omzet Penjualan', value: formatRp(sales.total_revenue) },
            { label: 'Total HPP (Modal Barang)', value: `- ${formatRp(profit.total_cogs)}`, color: '#fb7185' },
          ],
          highlightRow: [
            { label: 'Laba Kotor (Gross Profit)', value: formatRp(profit.gross_profit), color: '#34d399' },
            { label: 'Persentase Margin', value: `${profit.gross_profit_margin || 0}%`, color: '#34d399' },
          ],
          formulaTitle: `Arti Margin ${profit.gross_profit_margin || 0}%:`,
          formulaText: `Dari setiap Rp100 penjualan, toko menghasilkan keuntungan kotor sebesar Rp${Math.round(profit.gross_profit_margin || 0)} sebelum dikurangi beban biaya operasional.`,
        };

      case 'net_profit':
        return {
          title: 'Rincian Estimasi Laba Bersih',
          icon: <Wallet size={18} color="#38bdf8" />,
          rows: [
            { label: 'Laba Kotor (Omzet - HPP)', value: formatRp(profit.gross_profit), color: '#34d399' },
            { label: 'Beban Biaya Operasional', value: `- ${formatRp(profit.operational_expenses)}`, color: '#fb7185' },
          ],
          highlightRow: [
            { label: 'Estimasi Laba Bersih', value: formatRp(profit.net_profit), color: '#38bdf8' },
          ],
          formulaTitle: 'Arti Laba Bersih:',
          formulaText: 'Keuntungan riil toko yang siap dinikmati pemilik setelah seluruh biaya modal barang dan pengeluaran operasional (sewa, listrik, gaji, plastik) terlunasi.',
        };

      case 'inventory':
        return {
          title: 'Rincian Aset Stok Toko',
          icon: <Boxes size={18} color="#a78bfa" />,
          rows: [
            { label: 'Total Nilai Uang Mengendap (Aset)', value: formatRp(inv.total_stock_valuation), isBold: true, color: '#a78bfa' },
            { label: 'Total Jenis Produk Aktif', value: `${inv.total_active_products || 0} varian` },
            {
              label: 'Status Peringatan Stok',
              value: inv.low_stock_products_count > 0 ? `${inv.low_stock_products_count} produk perlu restock` : 'Semua stok aman',
              color: inv.low_stock_products_count > 0 ? '#fbbf24' : '#34d399',
            },
          ],
          highlightRow: null,
          formulaTitle: 'Arti Valuasi Stok:',
          formulaText: 'Total uang modal toko yang saat ini berwujud barang di etalase/gudang, dihitung berdasarkan rumus: (Stok Tersedia × Harga Pokok Rata-rata).',
        };

      default:
        return null;
    }
  };

  const config = getModalConfig();
  if (!config) return null;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={styles.modalHeaderLeft}>
              {config.icon}
              <Text style={styles.modalTitle}>{config.title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />

          {/* Content Rows */}
          <View style={styles.modalContent}>
            {config.rows.map((row, idx) => (
              <View style={styles.calcRow} key={idx}>
                <Text style={styles.calcLabel}>{row.label}</Text>
                <Text style={[styles.calcValue, row.color && { color: row.color }, row.isBold && styles.calcValueBold]}>
                  {row.value}
                </Text>
              </View>
            ))}

            {config.highlightRow && (
              <>
                <View style={styles.calcDivider} />
                {config.highlightRow.map((row, idx) => (
                  <View style={styles.calcRow} key={`hl-${idx}`}>
                    <Text style={styles.calcLabelBold}>{row.label}</Text>
                    <Text style={[styles.calcValueBold, row.color && { color: row.color }]}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Formula / Education Note */}
            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>
                💡 <Text style={{ fontFamily: 'Poppins_600SemiBold', color: '#e4e4e7' }}>{config.formulaTitle}</Text> {config.formulaText}
              </Text>
            </View>
          </View>

          {/* Close Action */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.modalCloseBtnText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
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
    flex: 1,
    marginRight: 8,
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
    flex: 1,
    marginRight: 8,
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
