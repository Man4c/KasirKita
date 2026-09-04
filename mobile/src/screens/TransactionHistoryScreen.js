import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import {
  Search,
  Receipt,
  Calendar,
  User,
  CreditCard,
  Banknote,
  QrCode,
  X,
  Printer,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import api from '../services/api';
import PosReceiptModal from '../components/pos/PosReceiptModal';

export default function TransactionHistoryScreen({ isLandscape = false }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filterMethod, setFilterMethod] = useState('ALL'); // ALL, CASH, QRIS, TRANSFER
  const [selectedTx, setSelectedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pos/transactions');
      if (res.data.success) {
        // Backend returns paginated data: res.data.data.data or res.data.data
        const list = res.data.data?.data || res.data.data || [];
        setTransactions(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.log('Error fetching transactions:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  const filteredTransactions = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch =
      (tx.invoice_number && tx.invoice_number.toLowerCase().includes(q)) ||
      (tx.customer_name && tx.customer_name.toLowerCase().includes(q)) ||
      (tx.cashier?.name && tx.cashier.name.toLowerCase().includes(q));

    const matchMethod = filterMethod === 'ALL' || tx.payment_method === filterMethod;

    return matchSearch && matchMethod;
  });

  const getMethodIcon = (method) => {
    switch (method) {
      case 'QRIS':
        return <QrCode size={13} color="#38bdf8" />;
      case 'TRANSFER':
        return <CreditCard size={13} color="#a78bfa" />;
      default:
        return <Banknote size={13} color="#34d399" />;
    }
  };

  const renderTransactionItem = ({ item }) => {
    const isCancelled = item.payment_status === 'CANCELLED';
    return (
      <TouchableOpacity
        style={styles.txCard}
        activeOpacity={0.7}
        onPress={() => {
          setSelectedTx(item);
          setReceiptModalOpen(true);
        }}
      >
        <View style={styles.txCardHeader}>
          <View style={styles.invoiceBadgeRow}>
            <Receipt size={14} color="#fb7185" />
            <Text style={styles.invoiceNumber} numberOfLines={1}>
              {item.invoice_number}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isCancelled ? styles.statusBadgeCancelled : styles.statusBadgeSuccess,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isCancelled ? styles.statusTextCancelled : styles.statusTextSuccess,
              ]}
            >
              {isCancelled ? 'Dibatalkan' : 'Selesai'}
            </Text>
          </View>
        </View>

        <View style={styles.txMetaRow}>
          <View style={styles.metaItem}>
            <Calendar size={12} color="#71717a" />
            <Text style={styles.metaText}>
              {new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <User size={12} color="#71717a" />
            <Text style={styles.metaText} numberOfLines={1}>
              {item.customer_name || 'Pelanggan Umum'}
            </Text>
          </View>
        </View>

        <View style={styles.txCardFooter}>
          <View style={styles.methodBadge}>
            {getMethodIcon(item.payment_method)}
            <Text style={styles.methodBadgeText}>{item.payment_method}</Text>
          </View>
          <Text style={styles.totalAmountText}>{formatRp(item.total_amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          Daftar nota penjualan dan struk transaksi toko
        </Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
        <Search
          size={16}
          color={isSearchFocused || search ? '#fb7185' : '#a1a1aa'}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari no. invoice / pelanggan..."
          placeholderTextColor="#71717a"
          value={search}
          onChangeText={setSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          returnKeyType="search"
          clearButtonMode="never"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.searchClearBtn}
            activeOpacity={0.7}
          >
            <X size={12} color="#d4d4d8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
        style={{ flexGrow: 0 }}
      >
        {['ALL', 'CASH', 'QRIS', 'TRANSFER'].map((method) => {
          const isSelected = filterMethod === method;
          const label =
            method === 'ALL'
              ? 'Semua'
              : method === 'CASH'
              ? 'Tunai'
              : method;
          return (
            <TouchableOpacity
              key={method}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setFilterMethod(method)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Transaction List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#e11d48" size="large" />
          <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Receipt size={40} color="#3f3f46" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
          <Text style={styles.emptySubtitle}>
            Transaksi penjualan yang selesai akan muncul di sini.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#e11d48"
              colors={['#e11d48']}
            />
          }
        />
      )}

      {/* Thermal Receipt Modal (Standardized with Print & Tutup buttons) */}
      <PosReceiptModal
        visible={receiptModalOpen}
        isLandscape={isLandscape}
        onClose={() => {
          setReceiptModalOpen(false);
          setSelectedTx(null);
        }}
        completedTx={selectedTx}
        closeBtnText="Tutup"
        formatRp={formatRp}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchBarFocused: {
    borderColor: '#e11d48',
    backgroundColor: '#1c1917',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    height: '100%',
    paddingVertical: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  searchClearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  filterChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  filterChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  txCard: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  txCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  invoiceNumber: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  statusBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  statusTextSuccess: {
    color: '#34d399',
  },
  statusTextCancelled: {
    color: '#fb7185',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '48%',
  },
  metaText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  txCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 10,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#27272a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  methodBadgeText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  totalAmountText: {
    color: '#fb7185',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  emptySubtitle: {
    color: '#71717a',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 4,
  },
  receiptModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  receiptSheet: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    alignSelf: 'center',
  },
  modalCloseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    marginBottom: 10,
  },
  modalTitle: {
    color: '#18181b',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalCloseBtn: {
    padding: 4,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomColor: '#d4d4d8',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  receiptBrand: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  receiptSubtitleText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#52525b',
  },
  receiptInvoice: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#27272a',
    marginTop: 6,
  },
  receiptDate: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#52525b',
  },
  receiptCustomer: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    marginTop: 6,
  },
  receiptItemsList: {
    paddingVertical: 10,
    borderBottomColor: '#d4d4d8',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptItemName: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flex: 1,
    marginRight: 8,
  },
  receiptItemPrice: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
  },
  receiptSummary: {
    paddingVertical: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  receiptRowLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#52525b',
  },
  receiptRowValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d4d4d8',
    marginVertical: 6,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  receiptTotalValue: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#e11d48',
  },
  receiptFooterText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#71717a',
    marginTop: 10,
    marginBottom: 14,
  },
  closeModalBtn: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
});
