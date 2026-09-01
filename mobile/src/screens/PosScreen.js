import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Search,
  ArrowRight,
  X,
  Minus,
  Plus,
  Banknote,
  QrCode,
  CreditCard,
  Receipt,
  Users,
  Check,
  TicketPercent,
  Sparkles,
  Percent,
  Package,
} from 'lucide-react-native';
import api from '../services/api';

export default function PosScreen({ isLandscape = false }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart & Checkout Modal
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [paidAmount, setPaidAmount] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = Pelanggan Umum
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Promo & Voucher State
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [promoModalOpen, setPromoModalOpen] = useState(false);

  // Taxes & Additional Fees State
  const [taxesAndFees, setTaxesAndFees] = useState([]);
  const [selectedTaxId, setSelectedTaxId] = useState('');
  const [selectedManualFeeIds, setSelectedManualFeeIds] = useState([]);
  const [isTakeaway, setIsTakeaway] = useState(false);

  // Success / Receipt Modal
  const [completedTx, setCompletedTx] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes, custRes, promoRes, taxFeeRes] = await Promise.all([
        api.get('/products?is_active=true&per_page=100'),
        api.get('/categories'),
        api.get('/customers?all=true'),
        api.get('/discounts?status=active&all=true').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/taxes-and-fees?is_active=true').catch(() => ({ data: { success: false, data: [] } })),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (custRes.data.success) setCustomers(custRes.data.data);
      if (promoRes.data.success) setAvailablePromos(promoRes.data.data);
      if (taxFeeRes.data.success) {
        const tfData = taxFeeRes.data.data;
        setTaxesAndFees(tfData);
        const defTax = tfData.find((i) => i.is_tax && i.is_default);
        if (defTax) setSelectedTaxId(defTax.id);
        const defFees = tfData.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
        setSelectedManualFeeIds(defFees);
      }
    } catch (err) {
      console.log('Error fetching POS data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCat === 'ALL' || p.category_id === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku_barcode && p.sku_barcode.includes(search));
    return matchCat && matchSearch;
  });

  const filteredCustomers = customers.filter((c) => {
    const term = customerSearch.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone && c.phone.includes(term));
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const availableStock = parseFloat(product.stock) || 0;
      const unit = product.base_unit?.symbol || product.baseUnit?.symbol || 'pcs';

      if (existing) {
        if (existing.quantity >= availableStock) {
          Alert.alert('Stok Tidak Cukup', `Stok ${product.name} hanya tersisa ${availableStock} ${unit}.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            const availableStock = parseFloat(item.product.stock) || 0;
            const unit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';

            if (newQty > availableStock) {
              Alert.alert('Stok Maksimal', `Stok ${item.product.name} hanya tersisa ${availableStock} ${unit}.`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.quantity * Number(item.product.price), 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const netSubtotal = Math.max(0, subtotal - discount);

  const activeTax = taxesAndFees.find((t) => t.id === selectedTaxId && t.is_tax);
  const taxAmount = activeTax
    ? activeTax.type === 'PERCENTAGE'
      ? Math.round((netSubtotal * Number(activeTax.value)) / 100)
      : Math.round(Number(activeTax.value))
    : 0;

  const applicableFees = taxesAndFees.filter((i) => {
    if (i.is_tax || !i.is_active) return false;
    if (i.apply_to === 'ALL' && i.is_default) return true;
    if (i.apply_to === 'SPECIFIC_PAYMENT' && i.payment_method === paymentMethod) return true;
    if (i.apply_to === 'TAKEAWAY_ONLY' && isTakeaway) return true;
    if (i.apply_to === 'MANUAL' && selectedManualFeeIds.includes(i.id)) return true;
    return false;
  });

  const feeDetails = applicableFees.map((f) => {
    const amt = f.type === 'PERCENTAGE'
      ? Math.round((netSubtotal * Number(f.value)) / 100)
      : Math.round(Number(f.value));
    return {
      id: f.id,
      name: f.name,
      type: f.type,
      value: Number(f.value),
      amount: amt,
    };
  });

  const feeAmount = feeDetails.reduce((sum, f) => sum + f.amount, 0);
  const totalAmount = Math.max(0, netSubtotal + taxAmount + feeAmount);
  const changeAmount = Number(paidAmount) >= totalAmount ? Number(paidAmount) - totalAmount : 0;

  const availableTaxes = taxesAndFees.filter((i) => i.is_tax && i.is_active);
  const takeawayFees = taxesAndFees.filter((i) => !i.is_tax && i.is_active && i.apply_to === 'TAKEAWAY_ONLY');
  const manualFees = taxesAndFees.filter((i) => !i.is_tax && i.is_active && i.apply_to === 'MANUAL');

  // Re-calculate applied promo when subtotal changes
  useEffect(() => {
    if (appliedPromo) {
      if (subtotal <= 0) {
        setAppliedPromo(null);
        setDiscount(0);
        return;
      }
      if (appliedPromo.discount_type === 'PERCENTAGE' || appliedPromo.discount_type === 'MIN_SPEND') {
        const calculated = (subtotal * appliedPromo.discount_value) / 100;
        const finalDiscount = appliedPromo.max_discount_amount
          ? Math.min(calculated, parseFloat(appliedPromo.max_discount_amount))
          : calculated;
        setDiscount(Math.round(Math.max(0, finalDiscount)));
      } else if (appliedPromo.discount_type === 'FIXED') {
        setDiscount(Math.min(appliedPromo.discount_value, subtotal));
      }
    }
  }, [subtotal, appliedPromo]);

  const handleApplyVoucher = async (codeToApply) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) return;
    if (subtotal <= 0) {
      Alert.alert('Perhatian', 'Tambahkan produk ke keranjang terlebih dahulu.');
      return;
    }

    setVoucherLoading(true);
    try {
      const res = await api.post('/discounts/check-voucher', {
        code,
        subtotal,
      });

      if (res.data.success) {
        const promoData = res.data.data;
        setAppliedPromo(promoData);
        setDiscount(promoData.discount_amount);
        setVoucherInput('');
        setPromoModalOpen(false);
        Alert.alert('Sukses', `Kupon ${promoData.discount_code} berhasil diterapkan!`);
      }
    } catch (err) {
      Alert.alert('Kupon Tidak Valid', err.response?.data?.message || 'Kode promo tidak dapat digunakan.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setVoucherInput('');
  };

  const handleProcessCheckout = async () => {
    if (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount) {
      Alert.alert('Nominal Kurang', 'Nominal uang diterima kurang dari total belanja.');
      return;
    }

    setCheckoutLoading(true);
    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        customer_name: selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum',
        customer_phone: selectedCustomer?.phone || null,
        discount_id: appliedPromo?.discount_id || null,
        discount_code: appliedPromo?.discount_code || null,
        discount_amount: discount,
        tax_amount: taxAmount,
        fee_amount: feeAmount,
        fee_details: feeDetails,
        paid_amount: paymentMethod === 'CASH' ? Number(paidAmount) : totalAmount,
        payment_method: paymentMethod,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_id: i.unit_id || i.product.base_unit_id || null,
        })),
      };

      const res = await api.post('/pos/checkout', payload);
      if (res.data.success) {
        setCompletedTx(res.data.data);
        setCart([]);
        setPaidAmount('');
        setSelectedCustomer(null);
        setAppliedPromo(null);
        setDiscount(0);
        setVoucherInput('');
        setIsTakeaway(false);
        const defTax = taxesAndFees.find((i) => i.is_tax && i.is_default);
        setSelectedTaxId(defTax ? defTax.id : '');
        const defFees = taxesAndFees.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
        setSelectedManualFeeIds(defFees);
        setCartModalOpen(false);
        setReceiptModalOpen(true);
        fetchData();
      }
    } catch (err) {
      Alert.alert('Gagal', err.response?.data?.message || 'Terjadi kesalahan transaksi.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Search size={16} color="#a1a1aa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk atau barcode..."
            placeholderTextColor="#a1a1aa"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View style={styles.catContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.catChip, selectedCat === 'ALL' && styles.catChipActive]}
            onPress={() => setSelectedCat('ALL')}
          >
            <Text style={[styles.catChipText, selectedCat === 'ALL' && styles.catChipTextActive]}>
              Semua
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}
              onPress={() => setSelectedCat(c.id)}
            >
              <Text style={[styles.catChipText, selectedCat === c.id && styles.catChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products Grid */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color="#e11d48" size="large" />
          <Text style={styles.loadingText}>Memuat katalog produk...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => {
            const inCart = cart.find((i) => i.product.id === item.id);
            const stockNum = Number(item.stock || 0);
            const stockDisplay = Number.isInteger(stockNum) ? stockNum : stockNum.toFixed(1);
            const minStockNum = Number(item.min_stock || 0);
            const isOutOfStock = stockNum <= 0;
            const isLowStock = stockNum <= minStockNum;
            const unitSymbol = item.base_unit?.symbol || item.baseUnit?.symbol || 'pcs';

            return (
              <TouchableOpacity
                style={[styles.productCard, isOutOfStock && styles.productOutOfStock]}
                onPress={() => !isOutOfStock && addToCart(item)}
                disabled={isOutOfStock}
                activeOpacity={0.7}
              >
                {inCart && (
                  <View style={styles.floatingBadge}>
                    <Text style={styles.floatingBadgeText}>
                      {inCart.quantity} {unitSymbol}
                    </Text>
                  </View>
                )}

                <View style={styles.cardHeader}>
                  <Text style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
                    {item.category?.name || 'Umum'}
                  </Text>
                  <Text
                    style={[styles.cardStock, isLowStock && styles.cardStockLow]}
                    numberOfLines={1}
                  >
                    {stockDisplay} {unitSymbol}
                  </Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
                  {item.name}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                    <Text style={styles.cardPrice}>{formatRp(item.price)}</Text>
                    <Text style={styles.cardPriceUnit}>/{unitSymbol}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <View style={styles.floatingCart}>
          <View>
            <Text style={styles.cartBarCount}>{totalItemsCount} Item</Text>
            <Text style={styles.cartBarTotal}>{formatRp(totalAmount)}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => {
              setPaidAmount(totalAmount.toString());
              setCartModalOpen(true);
            }}
          >
            <Text style={styles.cartBarButtonText}>Bayar Kasir</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Cart & Checkout Modal */}
      <Modal visible={cartModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detail Keranjang & Pembayaran</Text>
              <TouchableOpacity onPress={() => setCartModalOpen(false)}>
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            {/* Cart Items List */}
            <ScrollView style={styles.modalScroll}>
              {cart.map((item) => {
                const itemUnit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                return (
                  <View key={item.product.id} style={styles.modalItemRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.modalItemName}>{item.product.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Text style={styles.modalItemPrice}>{formatRp(item.product.price)}</Text>
                        <Text style={styles.modalItemUnit}>/{itemUnit}</Text>
                      </View>
                    </View>
                    <View style={styles.qtyControl}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, -1)}>
                        <Minus size={14} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[
                          styles.qtyBtn,
                          item.quantity >= (parseFloat(item.product.stock) || 0) && { opacity: 0.35 },
                        ]}
                        onPress={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus size={14} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Promo & Voucher Section */}
              {appliedPromo ? (
                <View style={styles.promoAppliedRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <TicketPercent size={18} color="#34d399" />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.promoCodeText}>{appliedPromo.discount_code}</Text>
                        <Text style={styles.promoDiscountText}>(-{formatRp(discount)})</Text>
                      </View>
                      <Text style={styles.promoNameText} numberOfLines={1}>{appliedPromo.discount_name}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={handleRemovePromo} style={styles.promoRemoveBtn}>
                    <X size={16} color="#fb7185" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.promoInputSection}>
                  <View style={styles.promoHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <TicketPercent size={14} color="#fb7185" />
                      <Text style={styles.promoHeaderTitle}>Kupon / Voucher</Text>
                    </View>
                    {availablePromos.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setPromoModalOpen(true)}
                        style={styles.promoPickBtn}
                      >
                        <Sparkles size={12} color="#fb7185" style={{ marginRight: 6 }} />
                        <Text style={styles.promoPickBtnText}>Pilih Promo ({availablePromos.length})</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.promoInputRow}>
                    <TextInput
                      style={styles.promoTextInput}
                      placeholder="Kode promo (misal: HEMAT10)..."
                      placeholderTextColor="#a1a1aa"
                      value={voucherInput}
                      onChangeText={(t) => setVoucherInput(t.toUpperCase())}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={[styles.promoApplyBtn, (!voucherInput.trim() || voucherLoading) && styles.promoApplyBtnDisabled]}
                      onPress={() => handleApplyVoucher()}
                      disabled={!voucherInput.trim() || voucherLoading}
                    >
                      {voucherLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.promoApplyBtnText}>Pakai</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Taxes & Additional Fees Controls */}
              {(availableTaxes.length > 0 || takeawayFees.length > 0 || manualFees.length > 0) && (
                <View style={styles.taxFeeControlSection}>
                  {/* Tax Selector */}
                  {availableTaxes.length > 0 && (
                    <View style={styles.taxSelectorBlock}>
                      <View style={styles.taxSelectorHeader}>
                        <Percent size={13} color="#fb7185" />
                        <Text style={styles.taxSelectorTitle}>Pajak Penjualan (PPN/PB1):</Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.taxChipsRow}>
                        <TouchableOpacity
                          style={[styles.taxChip, !selectedTaxId && styles.taxChipActive]}
                          onPress={() => setSelectedTaxId('')}
                        >
                          <Text style={[styles.taxChipText, !selectedTaxId && styles.taxChipTextActive]}>
                            Tanpa Pajak (0%)
                          </Text>
                        </TouchableOpacity>
                        {availableTaxes.map((t) => {
                          const isSelected = selectedTaxId === t.id;
                          return (
                            <TouchableOpacity
                              key={t.id}
                              style={[styles.taxChip, isSelected && styles.taxChipActive]}
                              onPress={() => setSelectedTaxId(t.id)}
                            >
                              <Text style={[styles.taxChipText, isSelected && styles.taxChipTextActive]}>
                                {t.name.includes('%') ? t.name : `${t.name} (${Number(t.value)}%)`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Operational & Packaging Fees Chips */}
                  {(takeawayFees.length > 0 || manualFees.length > 0) && (
                    <View style={[styles.feeSelectorBlock, availableTaxes.length > 0 && { marginTop: 10 }]}>
                      <View style={styles.taxSelectorHeader}>
                        <Package size={13} color="#fbbf24" />
                        <Text style={styles.taxSelectorTitle}>Kemasan & Layanan:</Text>
                      </View>
                      <View style={styles.feeChipsWrap}>
                        {takeawayFees.map((tFee) => (
                          <TouchableOpacity
                            key={tFee.id}
                            style={[styles.feeChip, isTakeaway && styles.feeChipActive]}
                            onPress={() => setIsTakeaway(!isTakeaway)}
                          >
                            <Text style={[styles.feeChipText, isTakeaway && styles.feeChipTextActive]}>
                              {isTakeaway ? '✓ ' : '+ '}Bungkus ({formatRp(tFee.value)})
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {manualFees.map((mFee) => {
                          const isChecked = selectedManualFeeIds.includes(mFee.id);
                          return (
                            <TouchableOpacity
                              key={mFee.id}
                              style={[styles.feeChip, isChecked && styles.feeChipActive]}
                              onPress={() => {
                                setSelectedManualFeeIds((prev) =>
                                  isChecked ? prev.filter((id) => id !== mFee.id) : [...prev, mFee.id]
                                );
                              }}
                            >
                              <Text style={[styles.feeChipText, isChecked && styles.feeChipTextActive]}>
                                {isChecked ? '✓ ' : '+ '}{mFee.name} (+{mFee.type === 'PERCENTAGE' ? `${Number(mFee.value)}%` : formatRp(mFee.value)})
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Bill Summary */}
              <View style={styles.billSummaryBox}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal</Text>
                  <Text style={styles.billValue}>{formatRp(subtotal)}</Text>
                </View>
                {discount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={[styles.billLabel, { color: '#34d399' }]}>
                      Diskon Promo ({appliedPromo?.discount_code})
                    </Text>
                    <Text style={[styles.billValue, { color: '#34d399', fontWeight: 'bold' }]}>
                      -{formatRp(discount)}
                    </Text>
                  </View>
                )}
                {taxAmount > 0 && (
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>Pajak ({activeTax?.name})</Text>
                    <Text style={[styles.billValue, { color: '#fb7185' }]}>+{formatRp(taxAmount)}</Text>
                  </View>
                )}
                {feeAmount > 0 && (
                  <>
                    <View style={styles.billRow}>
                      <Text style={styles.billLabel}>Biaya Tambahan ({feeDetails.length})</Text>
                      <Text style={[styles.billValue, { color: '#fb7185' }]}>+{formatRp(feeAmount)}</Text>
                    </View>
                    {feeDetails.map((f, idx) => (
                      <View key={idx} style={[styles.billRow, { paddingLeft: 8, marginBottom: 2 }]}>
                        <Text style={[styles.billLabel, { fontSize: 11, color: '#a1a1aa' }]}>• {f.name}</Text>
                        <Text style={[styles.billValue, { fontSize: 11, color: '#fb7185' }]}>+{formatRp(f.amount)}</Text>
                      </View>
                    ))}
                  </>
                )}
                <View style={styles.totalRowDivided}>
                  <Text style={styles.totalLabel}>Total Tagihan:</Text>
                  <Text style={styles.totalValue}>{formatRp(totalAmount)}</Text>
                </View>
              </View>

              {/* Customer / Member Selector */}
              <View style={styles.customerCard}>
                <View style={styles.customerCardLeft}>
                  <View style={[styles.customerAvatar, selectedCustomer && styles.customerAvatarMember]}>
                    <Users size={16} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.customerLabel}>Pelanggan Transaksi</Text>
                    <Text style={styles.customerValue} numberOfLines={1} ellipsizeMode="tail">
                      {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum (Walk-in)'}
                    </Text>
                    {selectedCustomer && (
                      <View style={styles.customerBadgeRow}>
                        <View style={styles.membershipBadge}>
                          <Text style={styles.membershipBadgeText}>
                            {selectedCustomer.membership_type || 'REGULAR'}
                          </Text>
                        </View>
                        {selectedCustomer.phone && (
                          <Text style={styles.customerPhoneText} numberOfLines={1}>
                            {selectedCustomer.phone}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.customerPickerBtn}
                  onPress={() => setCustomerModalOpen(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.customerPickerBtnText}>
                    {selectedCustomer ? 'Ubah' : 'Pilih'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Payment Method */}
              <View style={styles.methodRow}>
                {[
                  { id: 'CASH', label: 'Tunai', icon: Banknote },
                  { id: 'QRIS', label: 'QRIS', icon: QrCode },
                  { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.methodBtn, isSelected && styles.methodBtnActive]}
                      onPress={() => setPaymentMethod(m.id)}
                    >
                      <Icon size={15} color={isSelected ? '#ffffff' : '#d4d4d8'} />
                      <Text style={[styles.methodBtnText, isSelected && styles.methodBtnTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* QRIS Surcharge Alert */}
              {paymentMethod === 'QRIS' && feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                <View style={styles.qrisFeeAlert}>
                  <QrCode size={14} color="#fbbf24" />
                  <Text style={styles.qrisFeeAlertText}>
                    Biaya Admin QRIS: +{formatRp(feeDetails.filter((f) => f.name.toLowerCase().includes('qris')).reduce((s, f) => s + f.amount, 0))}
                  </Text>
                </View>
              )}

              {paymentMethod === 'CASH' && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.inputLabel}>Uang Diterima (Rp):</Text>
                  <TextInput
                    style={styles.cashInput}
                    keyboardType="numeric"
                    value={paidAmount}
                    onChangeText={setPaidAmount}
                  />

                  <View style={styles.chipsRow}>
                    {[totalAmount, 50000, 100000, 200000].map((val, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.chipBtn}
                        onPress={() => setPaidAmount(val.toString())}
                      >
                        <Text style={styles.chipBtnText}>{idx === 0 ? 'Pas' : formatRp(val)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.changeRow}>
                    <Text style={styles.changeLabel}>Kembalian:</Text>
                    <Text style={styles.changeValue}>{formatRp(changeAmount)}</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.paySubmitBtn, checkoutLoading && styles.paySubmitBtnDisabled]}
              onPress={handleProcessCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.paySubmitText}>Konfirmasi Pembayaran</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Mobile Customer Picker Modal */}
      <Modal
        visible={customerModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCustomerModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customerPickerSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Pelanggan / Member</Text>
              <TouchableOpacity onPress={() => setCustomerModalOpen(false)}>
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.customerSearchBox}>
              <Search size={16} color="#a1a1aa" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.customerSearchInput}
                placeholder="Cari nama atau no. telepon member..."
                placeholderTextColor="#a1a1aa"
                value={customerSearch}
                onChangeText={setCustomerSearch}
              />
              {customerSearch ? (
                <TouchableOpacity onPress={() => setCustomerSearch('')}>
                  <X size={16} color="#a1a1aa" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Option: Pelanggan Umum */}
              <TouchableOpacity
                style={[
                  styles.customerOptionItem,
                  !selectedCustomer && styles.customerOptionItemActive,
                ]}
                onPress={() => {
                  setSelectedCustomer(null);
                  setCustomerModalOpen(false);
                }}
              >
                <View style={styles.customerOptionInfo}>
                  <Text style={styles.customerOptionName}>Pelanggan Umum (Tanpa Member)</Text>
                  <Text style={styles.customerOptionSub}>Transaksi walk-in standar tanpa akun member</Text>
                </View>
                {!selectedCustomer && (
                  <Check size={18} color="#fb7185" />
                )}
              </TouchableOpacity>

              {/* Registered Members List */}
              {filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <TouchableOpacity
                    key={cust.id}
                    style={[
                      styles.customerOptionItem,
                      isSelected && styles.customerOptionItemActive,
                    ]}
                    onPress={() => {
                      setSelectedCustomer(cust);
                      setCustomerModalOpen(false);
                    }}
                  >
                    <View style={styles.customerOptionInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.customerOptionName} numberOfLines={1}>
                          {cust.name}
                        </Text>
                        <View style={styles.membershipBadgeSmall}>
                          <Text style={styles.membershipBadgeSmallText}>
                            {cust.membership_type || 'REGULAR'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.customerOptionSub}>
                        {cust.phone ? `WA: ${cust.phone}` : 'Tanpa No. HP'}
                        {cust.total_spent ? ` • Belanja: ${formatRp(cust.total_spent)}` : ''}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={18} color="#fb7185" />
                    )}
                  </TouchableOpacity>
                );
              })}

              {filteredCustomers.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                    Tidak ada member yang cocok dengan pencarian.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Promo Picker Modal */}
      <Modal visible={promoModalOpen} animationType="slide" transparent onRequestClose={() => setPromoModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.customerPickerSheet}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TicketPercent size={20} color="#fb7185" />
                <Text style={styles.modalTitle}>Pilih Promo Toko</Text>
              </View>
              <TouchableOpacity onPress={() => setPromoModalOpen(false)}>
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {availablePromos.map((promo) => {
                const isSelected = appliedPromo?.discount_code === promo.code;
                const isPercentage = promo.type === 'PERCENTAGE' || promo.type === 'MIN_SPEND';
                const discountDisplay = isPercentage ? `${parseFloat(promo.value)}%` : formatRp(promo.value);

                return (
                  <TouchableOpacity
                    key={promo.id}
                    style={[styles.promoOptionCard, isSelected && styles.promoOptionCardActive]}
                    onPress={() => handleApplyVoucher(promo.code)}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.promoOptionCode}>{promo.code}</Text>
                        <View style={styles.promoOptionBadge}>
                          <Text style={styles.promoOptionBadgeText}>
                            {promo.type === 'PERCENTAGE' ? 'Diskon %' : promo.type === 'FIXED' ? 'Potongan Rp' : 'Min. Belanja'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.promoOptionName}>{promo.name}</Text>
                      {parseFloat(promo.min_purchase_amount) > 0 && (
                        <Text style={styles.promoOptionTerm}>
                          Min. belanja: {formatRp(promo.min_purchase_amount)}
                        </Text>
                      )}
                    </View>

                    <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                      <Text style={styles.promoOptionVal}>{discountDisplay}</Text>
                      <View style={[styles.promoOptionActionBtn, isSelected && styles.promoOptionActionBtnActive]}>
                        <Text style={[styles.promoOptionActionBtnText, isSelected && styles.promoOptionActionBtnTextActive]}>
                          {isSelected ? 'Terpasang' : 'Pilih'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {availablePromos.length === 0 && (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Text style={{ color: '#a1a1aa', fontSize: 12, fontFamily: 'Poppins_400Regular' }}>
                    Belum ada program promo aktif saat ini.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mobile Thermal Receipt Modal */}
      <Modal
        visible={receiptModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReceiptModalOpen(false)}
      >
        <View style={styles.receiptModalOverlay}>
          <View style={styles.receiptSheet}>
            {/* Store Header */}
            <View style={styles.receiptHeader}>
              <Text style={styles.receiptBrand}>KasirKita POS</Text>
              <Text style={styles.receiptSubtitle}>UMKM Ritel Modern</Text>
              <Text style={styles.receiptInvoice}>{completedTx?.invoice_number}</Text>
              <Text style={styles.receiptDate}>
                {completedTx ? new Date(completedTx.created_at).toLocaleString('id-ID') : ''}
              </Text>
              <Text style={styles.receiptCustomer}>
                Pelanggan: <Text style={{ fontWeight: 'bold' }}>{completedTx?.customer_name || 'Pelanggan Umum'}</Text>
              </Text>
              {completedTx?.customer_phone ? (
                <Text style={styles.receiptCustomerPhone}>
                  WA: {completedTx.customer_phone}
                </Text>
              ) : null}
            </View>

            {/* Receipt Items */}
            <ScrollView style={styles.receiptItemsList} showsVerticalScrollIndicator={false}>
              {completedTx?.items?.map((item, idx) => (
                <View key={idx} style={styles.receiptItemRow}>
                  <Text style={styles.receiptItemName} numberOfLines={1} ellipsizeMode="tail">
                    {Number(item.quantity)}x {item.product_name}
                  </Text>
                  <Text style={styles.receiptItemPrice}>{formatRp(item.subtotal)}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Calculations */}
            <View style={styles.receiptSummary}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Subtotal:</Text>
                <Text style={styles.receiptRowValue}>{formatRp(completedTx?.subtotal)}</Text>
              </View>
              {Number(completedTx?.discount_amount) > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptRowLabel, { color: '#e11d48' }]}>
                    Diskon {completedTx?.discount_code ? `(${completedTx.discount_code})` : ''}:
                  </Text>
                  <Text style={[styles.receiptRowValue, { color: '#e11d48', fontWeight: 'bold' }]}>
                    -{formatRp(completedTx.discount_amount)}
                  </Text>
                </View>
              )}
              {Number(completedTx?.tax_amount) > 0 && (
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptRowLabel}>Pajak (PPN/PB1):</Text>
                  <Text style={styles.receiptRowValue}>+{formatRp(completedTx?.tax_amount)}</Text>
                </View>
              )}
              {Number(completedTx?.fee_amount) > 0 && (
                <>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptRowLabel}>Biaya Tambahan:</Text>
                    <Text style={styles.receiptRowValue}>+{formatRp(completedTx?.fee_amount)}</Text>
                  </View>
                  {Array.isArray(completedTx?.fee_details) && completedTx.fee_details.map((f, idx) => (
                    <View key={idx} style={[styles.receiptRow, { paddingLeft: 8 }]}>
                      <Text style={[styles.receiptRowLabel, { fontSize: 11, color: '#71717a' }]}>• {f.name}:</Text>
                      <Text style={[styles.receiptRowValue, { fontSize: 11, color: '#52525b' }]}>+{formatRp(f.amount)}</Text>
                    </View>
                  ))}
                </>
              )}
              <View style={styles.receiptTotalRow}>
                <Text style={styles.receiptTotalLabel}>TOTAL:</Text>
                <Text style={styles.receiptTotalValue}>{formatRp(completedTx?.total_amount)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Metode Bayar:</Text>
                <Text style={styles.receiptRowValue}>{completedTx?.payment_method}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Uang Diterima:</Text>
                <Text style={styles.receiptRowValue}>{formatRp(completedTx?.paid_amount)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptRowLabel}>Kembalian:</Text>
                <Text style={styles.receiptRowValue}>{formatRp(completedTx?.change_amount)}</Text>
              </View>
            </View>

            <Text style={styles.receiptFooter}>Terima kasih atas kunjungan Anda!</Text>

            {/* Action CTA */}
            <TouchableOpacity
              style={styles.newTxButton}
              onPress={() => setReceiptModalOpen(false)}
            >
              <Text style={styles.newTxButtonText}>Transaksi Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  searchContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#ffffff',
  },
  catContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  catChipText: {
    color: '#d4d4d8',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  catChipTextActive: {
    color: '#ffffff',
  },
  gridContent: {
    padding: 10,
    paddingBottom: 100,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    margin: 4,
    justifyContent: 'space-between',
    minHeight: 120,
    position: 'relative',
  },
  productOutOfStock: {
    opacity: 0.4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  cardCategory: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    flex: 1,
    marginRight: 4,
  },
  cardStock: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    flexShrink: 0,
  },
  cardStockLow: {
    color: '#fbbf24',
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    marginBottom: 6,
    minHeight: 36,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
  },
  cardPriceUnit: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  floatingBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#18181b',
    zIndex: 10,
    elevation: 4,
  },
  floatingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#a1a1aa',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    marginTop: 8,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
      },
    }),
  },
  cartBarCount: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  cartBarTotal: {
    color: '#fb7185',
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  cartBarButton: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  cartBarButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  modalClose: {
    color: '#d4d4d8',
    fontSize: 20,
    padding: 6,
  },
  modalScroll: {
    maxHeight: 380,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
  },
  modalItemName: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalItemPrice: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  modalItemUnit: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    minWidth: 20,
    textAlign: 'center',
  },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomColor: '#27272a',
    borderBottomWidth: 1,
  },
  totalLabel: {
    color: '#d4d4d8',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  totalValue: {
    color: '#fb7185',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
  },
  methodBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  methodBtnText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  methodBtnTextActive: {
    color: '#ffffff',
  },
  inputLabel: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginBottom: 6,
  },
  cashInput: {
    backgroundColor: '#09090b',
    borderColor: '#27272a',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  chipBtnText: {
    color: '#f4f4f5',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    padding: 14,
    backgroundColor: '#09090b',
    borderRadius: 10,
  },
  changeLabel: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  changeValue: {
    color: '#34d399',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  paySubmitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  paySubmitBtnDisabled: {
    opacity: 0.6,
  },
  paySubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
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
  receiptSubtitle: {
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
    maxHeight: 140,
    paddingVertical: 10,
    borderBottomColor: '#d4d4d8',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
  },
  receiptItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  receiptItemName: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#18181b',
    flex: 1,
  },
  receiptItemPrice: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
    flexShrink: 0,
    marginLeft: 10,
  },
  receiptSummary: {
    paddingVertical: 10,
    gap: 6,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomColor: '#e4e4e7',
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#18181b',
  },
  receiptTotalValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#e11d48',
    flexShrink: 0,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    flexShrink: 0,
  },
  receiptFooter: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#52525b',
    marginTop: 8,
    paddingTop: 10,
    borderTopColor: '#d4d4d8',
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  newTxButton: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  newTxButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  customerCard: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  customerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  customerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerAvatarMember: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  customerLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  customerValue: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  customerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  membershipBadge: {
    backgroundColor: '#be123c',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  membershipBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  customerPhoneText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  customerPickerBtn: {
    backgroundColor: '#3f3f46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  customerPickerBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  customerPickerSheet: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  customerSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#09090b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#27272a',
    marginBottom: 12,
  },
  customerSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  customerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  customerOptionItemActive: {
    borderColor: '#fb7185',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  customerOptionInfo: {
    flex: 1,
    marginRight: 8,
  },
  customerOptionName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  customerOptionSub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  membershipBadgeSmall: {
    backgroundColor: '#be123c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  membershipBadgeSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  receiptCustomerPhone: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  // Promo & Voucher Styles
  promoAppliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    marginBottom: 10,
  },
  promoCodeText: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  promoDiscountText: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoNameText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  promoRemoveBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
  },
  promoInputSection: {
    marginTop: 14,
    marginBottom: 12,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  promoHeaderTitle: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoPickBtnText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promoTextInput: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoApplyBtn: {
    backgroundColor: '#e11d48',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnDisabled: {
    opacity: 0.4,
  },
  promoApplyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  billSummaryBox: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 12,
    marginTop: 14,
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  billValue: {
    color: '#e4e4e7',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  totalRowDivided: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(39, 39, 42, 0.6)',
  },
  promoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  promoOptionCardActive: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  promoOptionCode: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  promoOptionBadge: {
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  promoOptionBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoOptionName: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  promoOptionTerm: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 1,
  },
  promoOptionVal: {
    color: '#34d399',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 4,
  },
  promoOptionActionBtn: {
    backgroundColor: '#3f3f46',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  promoOptionActionBtnActive: {
    backgroundColor: '#10b981',
  },
  promoOptionActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  promoOptionActionBtnTextActive: {
    color: '#ffffff',
  },
  taxFeeControlSection: {
    backgroundColor: '#27272a',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  taxSelectorBlock: {},
  feeSelectorBlock: {},
  taxSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  taxSelectorTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#e4e4e7',
  },
  taxChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  taxChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  taxChipActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  taxChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  taxChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
  },
  feeChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  feeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  feeChipActive: {
    backgroundColor: '#b45309',
    borderColor: '#f59e0b',
  },
  feeChipText: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  feeChipTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
  },
  qrisFeeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    padding: 10,
    backgroundColor: '#78350f',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
  },
  qrisFeeAlertText: {
    color: '#fef3c7',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});
