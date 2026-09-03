import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { Receipt, ArrowRight, User, Banknote, QrCode, CreditCard } from 'lucide-react-native';

export default function RecentTransactionsSection({
  transactions = [],
  formatRp,
  onSelectTx,
  onViewAll,
}) {
  const getPaymentBadge = (method) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return { label: 'Tunai', icon: <Banknote size={11} color="#34d399" />, color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
      case 'QRIS':
        return { label: 'QRIS', icon: <QrCode size={11} color="#38bdf8" />, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
      case 'TRANSFER':
        return { label: 'Transfer', icon: <CreditCard size={11} color="#a78bfa" />, color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.12)' };
      default:
        return { label: method || 'Lainnya', icon: null, color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.12)' };
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconBox}>
            <Receipt size={15} color="#fb7185" />
          </View>
          <Text style={styles.cardTitle} numberOfLines={1}>
            10 Transaksi Penjualan Terakhir
          </Text>
        </View>

        {onViewAll && (
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={onViewAll}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Text style={styles.viewAllBtnText}>Riwayat</Text>
            <ArrowRight size={13} color="#fb7185" />
          </TouchableOpacity>
        )}
      </View>

      {/* List Content */}
      {transactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Belum ada riwayat transaksi penjualan.</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {transactions.slice(0, 10).map((tx, idx) => {
            const badge = getPaymentBadge(tx.payment_method);
            const customerName = tx.customer?.name || 'Umum';
            const invoice = tx.invoice_number || `TRX-${tx.id}`;
            const time = formatTime(tx.created_at);
            const isLast = idx === Math.min(transactions.length, 10) - 1;

            return (
              <TouchableOpacity
                key={tx.id || idx}
                style={[styles.txItem, !isLast && styles.txItemBorder]}
                activeOpacity={0.7}
                onPress={() => onSelectTx && onSelectTx(tx)}
              >
                {/* Left: Invoice, Customer, and Time */}
                <View style={styles.txLeft}>
                  <View style={styles.txInvoiceRow}>
                    <Text style={styles.txInvoice} numberOfLines={1}>
                      {invoice}
                    </Text>
                    <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                      {badge.icon}
                      <Text style={[styles.badgeLabel, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.txSubRow}>
                    <View style={styles.customerRow}>
                      <User size={11} color="#71717a" />
                      <Text style={styles.customerText} numberOfLines={1}>
                        {customerName}
                      </Text>
                    </View>
                    <Text style={styles.timeDot}>•</Text>
                    <Text style={styles.timeText}>{time}</Text>
                  </View>
                </View>

                {/* Right: Total Amount */}
                <View style={styles.txRight}>
                  <Text style={styles.txAmount} numberOfLines={1}>
                    {formatRp(tx.total_amount)}
                  </Text>
                  <Text style={styles.txStatusSuccess}>Sukses</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
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
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    gap: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  viewAllBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  listContainer: {
    width: '100%',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    gap: 8,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 39, 42, 0.6)',
  },
  txLeft: {
    flex: 1,
    minWidth: 0,
  },
  txInvoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  txInvoice: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    flexShrink: 0,
  },
  badgeLabel: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  txSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
    minWidth: 0,
  },
  customerText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
  },
  timeDot: {
    color: '#52525b',
    fontSize: 10,
  },
  timeText: {
    color: '#71717a',
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 0,
  },
  txRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  txAmount: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  txStatusSuccess: {
    color: '#34d399',
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
  },
});
