import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import {
  Receipt,
  Calendar,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
} from 'lucide-react-native';

const getMethodIcon = (method) => {
  switch (method?.toUpperCase()) {
    case 'QRIS':
      return <QrCode size={13} color="#38bdf8" />;
    case 'TRANSFER':
      return <CreditCard size={13} color="#a78bfa" />;
    default:
      return <Banknote size={13} color="#34d399" />;
  }
};

/**
 * TransactionCardItem: Kartu riwayat transaksi modular berstandar Impeccable Defensive UI.
 * - The Flexbox Pairing Rule: min-w-0 truncate untuk teks dinamis, shrink-0 untuk nominal/badge.
 * - The Readability Floor Rule: seluruh teks minimum 12px (text-xs).
 * - Anti-Shift Typography: includeFontPadding: false dan textAlignVertical: 'center'.
 */
const TransactionCardItem = React.memo(function TransactionCardItem({
  item,
  onPress,
  formatRp,
}) {
  const isCancelled = item.payment_status === 'CANCELLED';
  const isOfflinePending = item.is_offline_pending;

  return (
    <TouchableOpacity
      style={[styles.txCard, isOfflinePending && styles.txCardOfflinePending]}
      activeOpacity={0.7}
      onPress={() => onPress(item)}
    >
      <View style={styles.txCardHeader}>
        <View style={styles.invoiceBadgeRow}>
          <Receipt size={14} color={isOfflinePending ? '#f59e0b' : '#fb7185'} style={{ flexShrink: 0 }} />
          <Text style={styles.invoiceNumber} numberOfLines={1} ellipsizeMode="tail">
            {item.invoice_number}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            isOfflinePending
              ? styles.statusBadgeOffline
              : isCancelled
              ? styles.statusBadgeCancelled
              : styles.statusBadgeSuccess,
          ]}
        >
          {isOfflinePending && <Clock size={10} color="#f59e0b" style={{ marginRight: 3, flexShrink: 0 }} />}
          <Text
            style={[
              styles.statusBadgeText,
              isOfflinePending
                ? styles.statusTextOffline
                : isCancelled
                ? styles.statusTextCancelled
                : styles.statusTextSuccess,
            ]}
          >
            {isOfflinePending ? 'Belum Sinkron' : isCancelled ? 'Dibatalkan' : 'Selesai'}
          </Text>
        </View>
      </View>

      <View style={styles.txMetaRow}>
        <View style={styles.metaItem}>
          <Calendar size={12} color="#71717a" style={{ flexShrink: 0 }} />
          <Text style={styles.metaText} numberOfLines={1}>
            {new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <User size={12} color="#71717a" style={{ flexShrink: 0 }} />
          <Text style={styles.metaText} numberOfLines={1} ellipsizeMode="tail">
            {item.customer_name || 'Pelanggan Umum'}
          </Text>
        </View>
      </View>

      <View style={styles.txCardFooter}>
        <View style={styles.methodBadge}>
          {getMethodIcon(item.payment_method)}
          <Text style={styles.methodBadgeText} numberOfLines={1}>
            {item.payment_method}
          </Text>
        </View>
        <Text style={styles.totalAmountText} numberOfLines={1}>
          {formatRp(item.total_amount || item.paid_amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export default TransactionCardItem;

const styles = StyleSheet.create({
  txCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  txCardOfflinePending: {
    borderColor: '#b45309',
    backgroundColor: '#1a1612',
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  invoiceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  invoiceNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    flexShrink: 0,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  statusBadgeOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    includeFontPadding: false,
    textAlignVertical: 'center',
    whiteSpace: 'nowrap',
  },
  statusTextSuccess: {
    color: '#34d399',
  },
  statusTextCancelled: {
    color: '#fb7185',
  },
  statusTextOffline: {
    color: '#f59e0b',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    flex: 1,
  },
  txCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
    gap: 8,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    flexShrink: 0,
  },
  methodBadgeText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  totalAmountText: {
    color: '#fb7185',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    flexShrink: 0,
    textAlign: 'right',
  },
});
