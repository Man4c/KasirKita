import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { Store } from 'lucide-react-native';
import { storage } from '../services/storage';

export const defaultFormatRp = (val) => 'Rp' + Number(val || 0).toLocaleString('id-ID');

export default function ReceiptView({
  transaction,
  storeSettings: propStoreSettings,
  formatRp = defaultFormatRp,
  isTestPrint = false,
}) {
  const [localSettings, setLocalSettings] = useState(null);

  useEffect(() => {
    if (!propStoreSettings) {
      storage.getSettings().then((saved) => {
        if (saved) setLocalSettings(saved);
      });
    }
  }, [propStoreSettings]);

  const settings = propStoreSettings || localSettings || {};
  const storeName = settings.storeName || 'KasirKita Mart';
  const storeAddress = settings.storeAddress || 'Jl. Merdeka No. 12, Jakarta';
  const storePhone = settings.storePhone || '0812-3456-7890';
  const storeLogo = settings.storeLogo || null;
  const showLogo = typeof settings.showLogoOnReceipt === 'boolean' ? settings.showLogoOnReceipt : true;
  const showPhone = typeof settings.showPhoneOnReceipt === 'boolean' ? settings.showPhoneOnReceipt : true;
  const receiptFooter = settings.receiptFooter || 'Terima kasih atas kunjungan Anda!';

  const tx = transaction || {};
  const items = tx.items || [];
  const cashierName = tx.cashier?.name || tx.cashier_name || 'Kasir';
  const customerName = tx.customer_name || 'Pelanggan Umum';
  const customerPhone = tx.customer_phone || null;
  const invoiceNumber = tx.invoice_number || 'INV-000000000000';
  const txDate = tx.created_at
    ? new Date(tx.created_at).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const subtotal = Number(tx.subtotal || 0);
  const discountAmount = Number(tx.discount_amount || 0);
  const discountCode = tx.discount_code || '';
  const taxAmount = Number(tx.tax_amount || 0);
  const feeAmount = Number(tx.fee_amount || 0);
  const feeDetails = Array.isArray(tx.fee_details) ? tx.fee_details : [];
  const totalAmount = Number(tx.total_amount || 0);
  const paymentMethod = tx.payment_method || 'CASH';
  const paidAmount = Number(tx.paid_amount || 0);
  const changeAmount = Number(tx.change_amount || 0);

  return (
    <View style={styles.paper}>
      {/* 1. Header Toko & Logo */}
      <View style={styles.header}>
        {showLogo ? (
          <View style={styles.logoBox}>
            {storeLogo ? (
              <Image source={{ uri: storeLogo }} style={styles.logoImg} resizeMode="contain" />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Store size={22} color="#52525b" />
              </View>
            )}
          </View>
        ) : null}

        <Text style={styles.storeName}>{storeName}</Text>
        {storeAddress ? <Text style={styles.storeSub}>{storeAddress}</Text> : null}
        {showPhone && storePhone ? <Text style={styles.storeSub}>WA: {storePhone}</Text> : null}
      </View>

      {/* Dashed Line */}
      <View style={styles.dividerDashed} />

      {/* 2. Metadata Transaksi */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>No. Nota</Text>
          <Text style={styles.metaValue}>{invoiceNumber}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Waktu</Text>
          <Text style={styles.metaValue}>{txDate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Kasir</Text>
          <Text style={styles.metaValue}>{cashierName}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Pelanggan</Text>
          <Text style={styles.metaValue}>
            {customerName}
            {customerPhone ? ` (${customerPhone})` : ''}
          </Text>
        </View>
      </View>

      {/* Dashed Line */}
      <View style={styles.dividerDashed} />

      {/* 3. Daftar Produk Belanja */}
      <View style={styles.itemsSection}>
        {items.map((item, idx) => {
          const qty = Number(item.quantity || 1);
          const name = item.product_name || item.name || 'Produk';
          const lineTotal = Number(item.subtotal || item.total_price || item.price * qty || 0);

          return (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={2}>
                {qty}x {name}
              </Text>
              <Text style={styles.itemPrice}>{formatRp(lineTotal)}</Text>
            </View>
          );
        })}
      </View>

      {/* Dashed Line */}
      <View style={styles.dividerDashed} />

      {/* 4. Rincian Pembayaran */}
      <View style={styles.summarySection}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatRp(subtotal)}</Text>
        </View>

        {discountAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: '#e11d48' }]}>
              Diskon {discountCode ? `(${discountCode})` : ''}
            </Text>
            <Text style={[styles.summaryValue, { color: '#e11d48', fontWeight: 'bold' }]}>
              -{formatRp(discountAmount)}
            </Text>
          </View>
        ) : null}

        {taxAmount > 0 ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pajak (PPN/PB1)</Text>
            <Text style={styles.summaryValue}>+{formatRp(taxAmount)}</Text>
          </View>
        ) : null}

        {feeAmount > 0 ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Biaya Tambahan</Text>
              <Text style={styles.summaryValue}>+{formatRp(feeAmount)}</Text>
            </View>
            {feeDetails.map((f, idx) => (
              <View key={idx} style={[styles.summaryRow, { paddingLeft: 8 }]}>
                <Text style={[styles.summaryLabel, { fontSize: 12, color: '#71717a' }]}>• {f.name}</Text>
                <Text style={[styles.summaryValue, { fontSize: 12, color: '#52525b' }]}>
                  +{formatRp(f.amount)}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        {/* Total Highlight */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatRp(totalAmount)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Metode Bayar</Text>
          <Text style={[styles.summaryValue, { textTransform: 'uppercase' }]}>{paymentMethod}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Uang Diterima</Text>
          <Text style={styles.summaryValue}>{formatRp(paidAmount)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Kembalian</Text>
          <Text style={styles.summaryValue}>{formatRp(changeAmount)}</Text>
        </View>
      </View>

      {/* Dashed Line */}
      <View style={styles.dividerDashed} />

      {/* 5. Catatan Kaki / Footer */}
      <View style={styles.footerSection}>
        <Text style={styles.footerText}>{receiptFooter}</Text>
        {isTestPrint ? (
          <Text style={styles.testPrintBadge}>-- Uji Cetak Printer Thermal Normal --</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    marginVertical: 4,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBox: {
    marginBottom: 6,
    alignItems: 'center',
  },
  logoImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  storeName: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
    textAlign: 'center',
  },
  storeSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
    textAlign: 'center',
    marginTop: 2,
  },
  dividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: '#d4d4d8',
    borderStyle: 'dashed',
    marginVertical: 8,
  },
  metaSection: {
    gap: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#71717a',
  },
  metaValue: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flexShrink: 0,
  },
  itemsSection: {
    gap: 6,
    paddingVertical: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
    flexShrink: 0,
  },
  summarySection: {
    gap: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flexShrink: 0,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e4e4e7',
    paddingVertical: 6,
    marginVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
    flexShrink: 0,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  testPrintBadge: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#059669',
    textAlign: 'center',
    marginTop: 6,
  },
});
