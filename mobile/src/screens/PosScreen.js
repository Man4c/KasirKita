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
  useWindowDimensions,
} from 'react-native';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  X,
  Minus,
  Plus,
  Banknote,
  QrCode,
  CreditCard,
  Receipt,
  Users,
  Check,
  Delete,
  TicketPercent,
  Sparkles,
  Percent,
  Package,
  Trash2,
  ShoppingCart,
  ChevronDown,
import api from '../services/api';
import ReceiptView from '../components/ReceiptView';

export default function PosScreen({ isLandscape = false, isCompactLandscape = false, onCheckoutStateChange }) {
  const { width, height } = useWindowDimensions();
  const compact = isCompactLandscape || (isLandscape && height < 440);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cart & Checkout Screen View State
  const [isCheckoutView, setIsCheckoutView] = useState(false);

  useEffect(() => {
    if (onCheckoutStateChange) {
      onCheckoutStateChange(isCheckoutView);
    }
  }, [isCheckoutView, onCheckoutStateChange]);
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
  const [taxModalOpen, setTaxModalOpen] = useState(false);
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

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  useEffect(() => {
    if (isCheckoutView && cart.length === 0) {
      setIsCheckoutView(false);
    }
  }, [isCheckoutView, cart.length]);

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
  const hasBillAdjustments = discount > 0 || taxAmount > 0 || feeAmount > 0;

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

  const handleNumpadDigit = (digit) => {
    setPaidAmount((prev) => {
      const current = (prev || '').toString().trim();
      if (!current || current === '0') {
        return digit === '00' ? '0' : digit;
      }
      if (current.length >= 10) return current;
      return current + digit;
    });
  };

  const handleNumpadBackspace = () => {
    setPaidAmount((prev) => {
      const current = (prev || '').toString().trim();
      if (current.length <= 1) return '';
      return current.slice(0, -1);
    });
  };

  const handleNumpadClear = () => {
    setPaidAmount('');
  };

  const handleNominalShortcut = (val) => {
    setPaidAmount(val.toString());
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
        setIsCheckoutView(false);
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
    <View style={[styles.container, isLandscape && styles.landscapeRoot]}>
      {!isCheckoutView ? (
        <>
          {/* LEFT COLUMN: Catalog & Products */}
          <View style={[styles.catalogCol, isLandscape && styles.landscapeCatalogCol]}>
        {/* Catalog Toolbar: Unified 1-Row Toolbar in both Portrait & Landscape */}
        <View style={[
          styles.landscapeToolbar,
          !isLandscape && styles.portraitToolbar,
          compact && styles.landscapeToolbarCompact,
        ]}>
          {/* Search Box / Pill */}
          {!isLandscape ? (
            <View style={[
              styles.portraitSearchPill,
              search.length > 0 && styles.portraitSearchPillActive,
            ]}>
              <Search size={13} color={search ? '#fb7185' : '#a1a1aa'} style={{ marginRight: 5 }} />
              <TextInput
                style={[
                  styles.portraitSearchPillInput,
                  { width: search ? Math.min(100, Math.max(34, search.length * 9)) : 32 },
                ]}
                placeholder="Cari"
                placeholderTextColor="#a1a1aa"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: 4 }}>
                  <X size={13} color="#a1a1aa" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[
              styles.landscapeSearchBox,
              compact && styles.landscapeSearchBoxCompact,
            ]}>
              <Search size={14} color="#a1a1aa" style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.landscapeSearchInput, compact && styles.landscapeSearchInputCompact]}
                placeholder="Cari produk..."
                placeholderTextColor="#71717a"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={14} color="#a1a1aa" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Separator Divider */}
          <View style={styles.toolbarDivider} />

          {/* Horizontal Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.landscapeCatScrollContent}
            style={{ flex: 1 }}
          >
            <TouchableOpacity
              style={[styles.catChip, styles.catChipCompact, selectedCat === 'ALL' && styles.catChipActive]}
              onPress={() => setSelectedCat('ALL')}
            >
              <Text style={[styles.catChipText, styles.catChipTextCompact, selectedCat === 'ALL' && styles.catChipTextActive]}>
                Semua
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catChip, styles.catChipCompact, selectedCat === c.id && styles.catChipActive]}
                onPress={() => setSelectedCat(c.id)}
              >
                <Text style={[styles.catChipText, styles.catChipTextCompact, selectedCat === c.id && styles.catChipTextActive]}>
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
            key={isLandscape ? 'grid-landscape' : 'grid-portrait'}
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={[
              styles.gridContent,
              { paddingBottom: cart.length > 0 ? 170 : 100 },
              isLandscape && styles.gridContentLandscape,
              compact && styles.gridContentCompactLandscape,
            ]}
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
                  style={[
                    styles.productCard,
                    isLandscape && styles.productCardLandscape,
                    compact && styles.productCardCompactLandscape,
                    isOutOfStock && styles.productOutOfStock,
                  ]}
                  onPress={() => !isOutOfStock && addToCart(item)}
                  disabled={isOutOfStock}
                  activeOpacity={0.7}
                >
                  {inCart && (
                    <View style={[styles.floatingBadge, compact && styles.floatingBadgeCompact]}>
                      <Text style={styles.floatingBadgeText}>
                        {inCart.quantity} {unitSymbol}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardHeader}>
                    <Text style={styles.cardCategory} numberOfLines={1} ellipsizeMode="tail">
                      {item.category?.name || 'Umum'}
                    </Text>
                  </View>

                  <Text style={[styles.cardTitle, isLandscape && styles.cardTitleLandscape, compact && styles.cardTitleCompactLandscape]} numberOfLines={1} ellipsizeMode="tail">
                    {item.name}
                  </Text>

                  <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                      <Text style={styles.cardPrice}>{formatRp(item.price)}</Text>
                      <Text style={styles.cardPriceUnit}>/{unitSymbol}</Text>
                    </View>
                    <Text
                      style={[styles.cardStock, isLowStock && styles.cardStockLow]}
                      numberOfLines={1}
                    >
                      {stockDisplay} {unitSymbol}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      {/* RIGHT COLUMN (LANDSCAPE ONLY): Persistent Cashier Register Panel */}
      {isLandscape && (
        <View style={[styles.landscapeRegisterCol, compact && styles.landscapeRegisterColCompact]}>
          {/* Register Column Header */}
          <View style={[styles.registerHeader, styles.landscapeRegisterHeader, compact && styles.landscapeRegisterHeaderCompact]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              <ShoppingCart size={compact ? 14 : 16} color="#fb7185" />
              <Text style={styles.registerTitle}>Keranjang</Text>
              <View style={styles.registerCountBadge}>
                <Text style={styles.registerCountText}>{totalItemsCount}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {/* Customer Chip */}
              <TouchableOpacity
                style={styles.regCustomerBtn}
                onPress={() => setCustomerModalOpen(true)}
              >
                <Users size={12} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
                <Text
                  style={[styles.regCustomerBtnText, selectedCustomer && { color: '#fb7185', fontWeight: 'bold' }]}
                  numberOfLines={1}
                >
                  {selectedCustomer ? selectedCustomer.name : 'Pelanggan'}
                </Text>
              </TouchableOpacity>

              {/* Clear Cart Button */}
              {cart.length > 0 && (
                <TouchableOpacity
                  style={styles.regClearBtn}
                  onPress={() => setCart([])}
                >
                  <Trash2 size={13} color="#fb7185" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cart Item Rows */}
          {cart.length === 0 ? (
            <View style={[styles.registerEmptyBox, compact && styles.registerEmptyBoxCompact]}>
              <ShoppingCart size={compact ? 28 : 36} color="#71717a" style={{ marginBottom: compact ? 6 : 12 }} />
              <Text style={[styles.registerEmptyTitle, compact && { fontSize: 13 }]}>Keranjang Kosong</Text>
              <Text style={styles.registerEmptySub}>Pilih produk di kiri untuk memulai pesanan.</Text>
            </View>
          ) : (
            <ScrollView style={[styles.registerItemsScroll, compact && styles.registerItemsScrollCompact]} showsVerticalScrollIndicator={true}>
              {cart.map((item) => {
                const itemUnit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                return (
                  <View key={item.product.id} style={[styles.regItemRow, compact && styles.regItemRowCompact]}>
                    <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <Text style={styles.regItemName} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text style={styles.regItemPrice}>
                        {formatRp(item.product.price)} x {item.quantity} = <Text style={{ color: '#fb7185', fontWeight: 'bold' }}>{formatRp(item.product.price * item.quantity)}</Text>
                      </Text>
                    </View>

                    {/* Qty Controls */}
                    <View style={styles.regQtyBox}>
                      <TouchableOpacity
                        style={styles.regQtyBtn}
                        onPress={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus size={12} color="#ffffff" />
                      </TouchableOpacity>
                      <Text style={styles.regQtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[
                          styles.regQtyBtn,
                          item.quantity >= (parseFloat(item.product.stock) || 0) && { opacity: 0.35 },
                        ]}
                        onPress={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus size={12} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Register Footer */}
          <View style={[styles.registerFooter, compact && styles.registerFooterCompact]}>
            {/* Quick Fee & Promo Pills (Only render if there are active promos, takeaway fees, or taxes) */}
            {((availablePromos.length > 0 || appliedPromo) || takeawayFees.length > 0 || availableTaxes.length > 0) && (
              <View style={[styles.regQuickOptionsRow, compact && styles.regQuickOptionsRowCompact]}>
                {/* Promo button - only visible if active voucher exists or one is applied */}
                {(availablePromos.length > 0 || appliedPromo) && (
                  <TouchableOpacity
                    style={[styles.regQuickPill, compact && styles.regQuickPillCompact, appliedPromo && styles.regQuickPillPromoActive]}
                    onPress={() => {
                      if (appliedPromo) {
                        handleRemovePromo();
                      } else {
                        setPromoModalOpen(true);
                      }
                    }}
                  >
                    <TicketPercent size={12} color={appliedPromo ? '#ffffff' : '#a1a1aa'} />
                    <Text style={[styles.regQuickPillText, appliedPromo && styles.regQuickPillPromoTextActive]}>
                      {appliedPromo ? appliedPromo.discount_code : 'Voucher'}
                    </Text>
                    {appliedPromo && <X size={11} color="#ffffff" style={{ marginLeft: 2 }} />}
                  </TouchableOpacity>
                )}

                {/* Takeaway toggle */}
                {takeawayFees.length > 0 && (
                  <TouchableOpacity
                    style={[styles.regQuickPill, compact && styles.regQuickPillCompact, isTakeaway && styles.regQuickPillActive]}
                    onPress={() => setIsTakeaway(!isTakeaway)}
                  >
                    <Package size={12} color={isTakeaway ? '#ffffff' : '#a1a1aa'} />
                    <Text style={[styles.regQuickPillText, isTakeaway && styles.regQuickPillTextActive]}>
                      {isTakeaway ? 'Bungkus (+)' : 'Dine In'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Tax status chip */}
                {availableTaxes.length > 0 && (
                  <TouchableOpacity
                    style={[styles.regQuickPill, compact && styles.regQuickPillCompact, selectedTaxId && styles.regQuickPillActive]}
                    onPress={() => {
                      if (availableTaxes.length > 1) {
                        setTaxModalOpen(true);
                      } else {
                        if (selectedTaxId) {
                          setSelectedTaxId('');
                        } else {
                          setSelectedTaxId(availableTaxes[0]?.id || '');
                        }
                      }
                    }}
                  >
                    <Percent size={12} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} />
                    <Text style={[styles.regQuickPillText, selectedTaxId && styles.regQuickPillTextActive]}>
                      {selectedTaxId ? activeTax?.name || 'Pajak' : 'Tanpa Pajak'}
                    </Text>
                    {availableTaxes.length > 1 && (
                      <ChevronDown size={10} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} style={{ marginLeft: 2 }} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bill Summary Rows (Only show Subtotal & adjustments if there are discounts, taxes, or fees) */}
            {hasBillAdjustments && (
              <View style={[styles.regSummaryBox, compact && styles.regSummaryBoxCompact]}>
                <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                  <Text style={styles.regSummaryLabel}>Subtotal</Text>
                  <Text style={styles.regSummaryValue}>{formatRp(subtotal)}</Text>
                </View>
                {discount > 0 && (
                  <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                    <Text style={[styles.regSummaryLabel, { color: '#34d399' }]}>Diskon</Text>
                    <Text style={[styles.regSummaryValue, { color: '#34d399' }]}>-{formatRp(discount)}</Text>
                  </View>
                )}
                {taxAmount > 0 && (
                  <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                    <Text style={styles.regSummaryLabel}>Pajak ({activeTax?.name})</Text>
                    <Text style={[styles.regSummaryValue, { color: '#fb7185' }]}>+{formatRp(taxAmount)}</Text>
                  </View>
                )}
                {feeAmount > 0 && (
                  <View style={[styles.regSummaryRow, compact && styles.regSummaryRowCompact]}>
                    <Text style={styles.regSummaryLabel}>Biaya Layanan</Text>
                    <Text style={[styles.regSummaryValue, { color: '#fb7185' }]}>+{formatRp(feeAmount)}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Total Row & Pay Button */}
            <View style={[
              styles.regPayRow,
              compact && styles.regPayRowCompact,
              (!hasBillAdjustments && !((availablePromos.length > 0 || appliedPromo) || takeawayFees.length > 0 || availableTaxes.length > 0)) && { borderTopWidth: 0, paddingTop: 0 }
            ]}>
              <View>
                <Text style={styles.regTotalLabel}>TOTAL BAYAR</Text>
                <Text style={[styles.regTotalAmount, compact && styles.regTotalAmountCompact]}>{formatRp(totalAmount)}</Text>
              </View>

              <TouchableOpacity
                style={[styles.regPayButton, compact && styles.regPayButtonCompact, cart.length === 0 && { opacity: 0.4 }]}
                disabled={cart.length === 0}
                onPress={() => {
                  setPaidAmount(totalAmount.toString());
                  setIsCheckoutView(true);
                }}
              >
                <Text style={[styles.regPayButtonText, compact && styles.regPayButtonTextCompact]}>Bayar Kasir</Text>
                <ArrowRight size={compact ? 13 : 15} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Floating Bottom Cart Bar (Portrait Only) */}
      {!isLandscape && cart.length > 0 && (
        <View style={styles.floatingCart}>
          <TouchableOpacity
            style={styles.floatingCartInfoBtn}
            onPress={() => setCartModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.floatingCartIconBox}>
              <ShoppingCart size={16} color="#fb7185" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.cartBarCount}>{totalItemsCount} Item</Text>
                <View style={styles.cartBarEditBadge}>
                  <Text style={styles.cartBarEditBadgeText}>Edit</Text>
                </View>
              </View>
              <Text style={styles.cartBarTotal}>{formatRp(totalAmount)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cartBarButton}
            onPress={() => {
              setPaidAmount(totalAmount.toString());
              setIsCheckoutView(true);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.cartBarButtonText}>Bayar Kasir</Text>
            <ArrowRight size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

        </>
      ) : (
        /* DEDICATED FULL-SCREEN CHECKOUT SCREEN */
        <View style={styles.checkoutRoot}>
          {/* Top Navigation Bar */}
          <View style={[styles.checkoutHeader, isLandscape && styles.checkoutHeaderLandscape, compact && styles.checkoutHeaderCompact]}>
            <TouchableOpacity
              style={styles.checkoutBackBtn}
              onPress={() => setIsCheckoutView(false)}
              activeOpacity={0.7}
            >
              <ArrowLeft size={18} color="#fb7185" style={{ marginRight: 6 }} />
              <Text style={styles.checkoutBackText}>
                {isLandscape ? 'Kembali ke Keranjang' : 'Kembali'}
              </Text>
            </TouchableOpacity>

            <View style={styles.checkoutTitleBox}>
              <Text style={styles.checkoutTitleText}>Pembayaran Kasir</Text>
            </View>

            <View style={styles.checkoutHeaderRight}>
              <View style={styles.checkoutItemBadge}>
                <ShoppingCart size={13} color="#fb7185" style={{ marginRight: 5 }} />
                <Text style={styles.checkoutItemBadgeText}>{totalItemsCount} Item</Text>
              </View>
            </View>
          </View>

          {/* Checkout Screen Body */}
          {isLandscape ? (
            <View style={styles.checkoutBodyLandscape}>
              {/* Left Column (~38% width): Note, Items & Customer Summary */}
              <View style={[styles.checkoutLeftColLandscape, compact && styles.checkoutLeftColCompactLandscape]}>
                {/* 1. Total Tagihan Banner */}
                <View style={[styles.checkoutBillBanner, compact && styles.checkoutBillBannerCompact]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.checkoutBillBannerLabel}>TOTAL TAGIHAN</Text>
                    <Text style={[styles.checkoutBillBannerAmount, compact && styles.checkoutBillBannerAmountCompact]} numberOfLines={1}>
                      {formatRp(totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.checkoutBillItemBadge}>
                    <Text style={styles.checkoutBillItemBadgeText}>{totalItemsCount} pcs</Text>
                  </View>
                </View>

                {/* 2. Customer / Member Card */}
                <View style={[styles.checkoutCustomerCard, compact && styles.checkoutCustomerCardCompact]}>
                  <View style={styles.checkoutCustomerCardLeft}>
                    <View style={[styles.checkoutCustomerAvatar, selectedCustomer && styles.checkoutCustomerAvatarActive]}>
                      <Users size={14} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.checkoutCustomerName} numberOfLines={1} ellipsizeMode="tail">
                        {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum'}
                      </Text>
                      {selectedCustomer ? (
                        <View style={styles.checkoutCustomerMetaRow}>
                          <View style={styles.checkoutMembershipBadge}>
                            <Text style={styles.checkoutMembershipBadgeText}>
                              {selectedCustomer.membership_type || 'REGULAR'}
                            </Text>
                          </View>
                          {selectedCustomer.phone && (
                            <Text style={styles.checkoutCustomerPhone} numberOfLines={1}>
                              {selectedCustomer.phone}
                            </Text>
                          )}
                        </View>
                      ) : (
                        <Text style={styles.checkoutCustomerSub}>Walk-in (Tanpa Member)</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.checkoutCustomerCardRight}>
                    {selectedCustomer && (
                      <TouchableOpacity
                        style={styles.checkoutCustomerResetBtn}
                        onPress={() => setSelectedCustomer(null)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={13} color="#a1a1aa" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.checkoutCustomerChangeBtn}
                      onPress={() => setCustomerModalOpen(true)}
                    >
                      <Text style={styles.checkoutCustomerChangeBtnText}>
                        {selectedCustomer ? 'Ganti' : 'Pilih'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Transaction Options (Promo Voucher, Bungkus, Pajak) */}
                {((availablePromos.length > 0 || appliedPromo) || takeawayFees.length > 0 || availableTaxes.length > 0) && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {/* Promo Voucher */}
                    {(availablePromos.length > 0 || appliedPromo) && (
                      <TouchableOpacity
                        style={[styles.regQuickPill, appliedPromo && styles.regQuickPillPromoActive]}
                        onPress={() => {
                          if (appliedPromo) {
                            handleRemoveVoucher();
                          } else {
                            setPromoModalOpen(true);
                          }
                        }}
                      >
                        <TicketPercent size={12} color={appliedPromo ? '#ffffff' : '#a1a1aa'} />
                        <Text style={[styles.regQuickPillText, appliedPromo && styles.regQuickPillPromoTextActive]}>
                          {appliedPromo ? appliedPromo.discount_code : 'Voucher'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Bungkus / Takeaway */}
                    {takeawayFees.length > 0 && (
                      <TouchableOpacity
                        style={[styles.regQuickPill, isTakeaway && styles.regQuickPillActive]}
                        onPress={() => setIsTakeaway((prev) => !prev)}
                      >
                        <Package size={12} color={isTakeaway ? '#ffffff' : '#a1a1aa'} />
                        <Text style={[styles.regQuickPillText, isTakeaway && styles.regQuickPillTextActive]}>
                          Bungkus
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Tax status chip */}
                    {availableTaxes.length > 0 && (
                      <TouchableOpacity
                        style={[styles.regQuickPill, selectedTaxId && styles.regQuickPillActive]}
                        onPress={() => {
                          if (availableTaxes.length > 1) {
                            setTaxModalOpen(true);
                          } else {
                            if (selectedTaxId) {
                              setSelectedTaxId('');
                            } else {
                              setSelectedTaxId(availableTaxes[0]?.id || '');
                            }
                          }
                        }}
                      >
                        <Percent size={12} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} />
                        <Text style={[styles.regQuickPillText, selectedTaxId && styles.regQuickPillTextActive]}>
                          {selectedTaxId ? activeTax?.name || 'Pajak' : 'Tanpa Pajak'}
                        </Text>
                        {availableTaxes.length > 1 && (
                          <ChevronDown size={10} color={selectedTaxId ? '#ffffff' : '#a1a1aa'} style={{ marginLeft: 2 }} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* 3. Financial Breakdown (Subtotal, Diskon, Pajak, Biaya Layanan) */}
                {hasBillAdjustments && (
                  <View style={[styles.checkoutAdjustmentsBox, compact && styles.checkoutAdjustmentsBoxCompact]}>
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={styles.checkoutAdjustmentLabel}>Subtotal</Text>
                      <Text style={styles.checkoutAdjustmentVal}>{formatRp(subtotal)}</Text>
                    </View>
                    {discount > 0 && (
                      <View style={styles.checkoutAdjustmentRow}>
                        <Text style={[styles.checkoutAdjustmentLabel, { color: '#34d399' }]} numberOfLines={1}>
                          Diskon ({appliedPromo?.discount_code || 'Promo'})
                        </Text>
                        <Text style={[styles.checkoutAdjustmentVal, { color: '#34d399' }]}>
                          -{formatRp(discount)}
                        </Text>
                      </View>
                    )}
                    {taxAmount > 0 && (
                      <View style={styles.checkoutAdjustmentRow}>
                        <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                          Pajak ({activeTax?.name || 'PPN'})
                        </Text>
                        <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                          +{formatRp(taxAmount)}
                        </Text>
                      </View>
                    )}
                    {feeAmount > 0 && (
                      <View style={styles.checkoutAdjustmentRow}>
                        <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>Biaya Layanan</Text>
                        <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                          +{formatRp(feeAmount)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* 4. Order Items Header */}
                <View style={styles.checkoutItemsHeader}>
                  <Text style={styles.checkoutItemsTitle}>Daftar Pesanan ({cart.length})</Text>
                  <Text style={styles.checkoutItemsTotalQty}>{totalItemsCount} Total Qty</Text>
                </View>

                {/* 5. Scrollable Items List */}
                <ScrollView
                  style={styles.checkoutItemsScrollLandscape}
                  contentContainerStyle={{ paddingBottom: 8 }}
                  showsVerticalScrollIndicator={false}
                >
                  {cart.map((item) => {
                    const itemUnit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                    return (
                      <View key={item.product.id} style={[styles.checkoutItemRowMini, compact && styles.checkoutItemRowMiniCompact]}>
                        <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                          <Text style={styles.checkoutItemNameMini} numberOfLines={1} ellipsizeMode="tail">
                            {item.product.name}
                          </Text>
                          <Text style={styles.checkoutItemPriceMini}>
                            {item.quantity} {itemUnit} x {formatRp(item.product.price)}
                          </Text>
                        </View>
                        <Text style={styles.checkoutItemSubtotalMini}>
                          {formatRp(item.quantity * Number(item.product.price))}
                        </Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Right Column (~62% width): Payment Terminal & Numpad */}
              <View style={styles.checkoutRightColLandscape}>
                {/* 1. Payment Method Selector */}
                <View style={styles.checkoutMethodRow}>
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
                        style={[styles.checkoutMethodBtn, isSelected && styles.checkoutMethodBtnActive, compact && styles.checkoutMethodBtnCompact]}
                        onPress={() => setPaymentMethod(m.id)}
                        activeOpacity={0.7}
                      >
                        <Icon size={14} color={isSelected ? '#ffffff' : '#d4d4d8'} />
                        <Text style={[styles.checkoutMethodBtnText, isSelected && styles.checkoutMethodBtnTextActive]}>
                          {m.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 2. Terminal Content */}
                {paymentMethod === 'CASH' ? (
                  <View style={styles.checkoutCashTerminal}>
                    {/* Cash Monitor Display (Uang Diterima & Kembalian) */}
                    <View style={[styles.cashDisplayBox, compact && styles.cashDisplayBoxCompact]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.cashDisplayLabel}>Uang Diterima:</Text>
                        <Text style={[styles.cashDisplayAmount, compact && styles.cashDisplayAmountCompact]} numberOfLines={1}>
                          {paidAmount ? formatRp(Number(paidAmount)) : 'Rp0'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                        <Text style={styles.cashDisplayLabel}>
                          {Number(paidAmount) >= totalAmount ? 'Kembalian:' : 'Kurang:'}
                        </Text>
                        <Text style={[
                          styles.cashDisplayChange,
                          compact && styles.cashDisplayChangeCompact,
                          Number(paidAmount) >= totalAmount ? styles.cashDisplayChangePositive : styles.cashDisplayChangeNegative
                        ]}>
                          {Number(paidAmount) >= totalAmount
                            ? formatRp(changeAmount)
                            : `-${formatRp(totalAmount - (Number(paidAmount) || 0))}`}
                        </Text>
                      </View>
                      {paidAmount ? (
                        <TouchableOpacity
                          style={styles.cashDisplayClearBtn}
                          onPress={handleNumpadClear}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <X size={14} color="#a1a1aa" />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {/* Integrated Cashier Numpad & Quick Presets */}
                    <View style={styles.numpadContainer}>
                      {/* Left: 3x4 Number Keypad */}
                      <View style={styles.numpadGrid}>
                        <View style={styles.numpadRow}>
                          {['1', '2', '3'].map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                              onPress={() => handleNumpadDigit(d)}
                              activeOpacity={0.6}
                            >
                              <Text style={[styles.numpadKeyText, compact && styles.numpadKeyTextCompact]}>{d}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.numpadRow}>
                          {['4', '5', '6'].map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                              onPress={() => handleNumpadDigit(d)}
                              activeOpacity={0.6}
                            >
                              <Text style={[styles.numpadKeyText, compact && styles.numpadKeyTextCompact]}>{d}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.numpadRow}>
                          {['7', '8', '9'].map((d) => (
                            <TouchableOpacity
                              key={d}
                              style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                              onPress={() => handleNumpadDigit(d)}
                              activeOpacity={0.6}
                            >
                              <Text style={[styles.numpadKeyText, compact && styles.numpadKeyTextCompact]}>{d}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <View style={styles.numpadRow}>
                          <TouchableOpacity
                            style={[styles.numpadKey, styles.numpadKeySecondary, compact && styles.numpadKeyCompact]}
                            onPress={() => handleNumpadDigit('00')}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.numpadKeyText, styles.numpadKeyTextSecondary, compact && styles.numpadKeyTextCompact]}>00</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.numpadKey, compact && styles.numpadKeyCompact]}
                            onPress={() => handleNumpadDigit('0')}
                            activeOpacity={0.6}
                          >
                            <Text style={[styles.numpadKeyText, compact && styles.numpadKeyTextCompact]}>0</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.numpadKey, styles.numpadKeyDelete, compact && styles.numpadKeyCompact]}
                            onPress={handleNumpadBackspace}
                            activeOpacity={0.6}
                          >
                            <Delete size={compact ? 16 : 18} color="#fb7185" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Right: Quick Cash Presets Column */}
                      <View style={styles.numpadPresetsCol}>
                        <TouchableOpacity
                          style={[
                            styles.numpadPresetBtn,
                            styles.numpadPresetBtnPas,
                            compact && styles.numpadPresetBtnCompact,
                            Number(paidAmount) === totalAmount && styles.numpadPresetBtnActivePas
                          ]}
                          onPress={() => handleNominalShortcut(totalAmount)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.numpadPresetText,
                              compact && styles.numpadPresetTextCompact,
                              Number(paidAmount) === totalAmount ? styles.numpadPresetTextActive : styles.numpadPresetTextPas
                            ]}
                          >
                            Uang Pas
                          </Text>
                        </TouchableOpacity>

                        {[50000, 100000, 200000].map((val) => {
                          const isSelected = Number(paidAmount) === val;
                          return (
                            <TouchableOpacity
                              key={val}
                              style={[
                                styles.numpadPresetBtn,
                                compact && styles.numpadPresetBtnCompact,
                                isSelected && styles.numpadPresetBtnActive
                              ]}
                              onPress={() => handleNominalShortcut(val)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.numpadPresetText,
                                  compact && styles.numpadPresetTextCompact,
                                  isSelected && styles.numpadPresetTextActive
                                ]}
                              >
                                {formatRp(val)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                ) : paymentMethod === 'QRIS' ? (
                  <View style={styles.checkoutQrisTerminal}>
                    <View style={styles.checkoutQrisCard}>
                      <View style={styles.checkoutQrisIconBox}>
                        <QrCode size={36} color="#fb7185" />
                      </View>
                      <Text style={styles.checkoutQrisTitle}>Pindai QRIS Statis / EDC</Text>
                      <Text style={styles.checkoutQrisSub}>
                        Minta pembeli scan kode QRIS kasir dan konfirmasi pembayaran di aplikasi e-wallet / m-banking.
                      </Text>
                      {feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                        <View style={styles.qrisFeeAlert}>
                          <QrCode size={14} color="#fbbf24" />
                          <Text style={styles.qrisFeeAlertText}>
                            Biaya Admin QRIS: +{formatRp(feeDetails.filter((f) => f.name.toLowerCase().includes('qris')).reduce((s, f) => s + f.amount, 0))}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.checkoutTransferTerminal}>
                    <View style={styles.checkoutTransferCard}>
                      <View style={styles.checkoutTransferIconBox}>
                        <CreditCard size={36} color="#60a5fa" />
                      </View>
                      <Text style={styles.checkoutTransferTitle}>Transfer Bank / EDC</Text>
                      <Text style={styles.checkoutTransferSub}>
                        Pastikan mutasi dana atau struk EDC telah keluar sebelum mengonfirmasi pembayaran.
                      </Text>
                    </View>
                  </View>
                )}

                {/* 3. Main Action CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.checkoutSubmitBtn,
                    compact && styles.checkoutSubmitBtnCompact,
                    (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount) && styles.checkoutSubmitBtnDisabled,
                    checkoutLoading && styles.checkoutSubmitBtnDisabled
                  ]}
                  onPress={handleProcessCheckout}
                  disabled={checkoutLoading || (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount)}
                  activeOpacity={0.8}
                >
                  {checkoutLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <View style={styles.checkoutSubmitBtnContent}>
                      <Check size={17} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.checkoutSubmitBtnText}>
                        {paymentMethod === 'CASH' && Number(paidAmount) < totalAmount
                          ? `Uang Kurang (${formatRp(totalAmount - (Number(paidAmount) || 0))})`
                          : 'Selesaikan Pembayaran'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* Portrait Dedicated Checkout View */
            <ScrollView style={styles.checkoutBodyPortrait} contentContainerStyle={{ padding: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
              {/* 1. Total Tagihan Banner */}
              <View style={styles.checkoutBillBannerPortrait}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.checkoutBillBannerLabel}>TOTAL TAGIHAN</Text>
                  <Text style={styles.checkoutBillBannerAmountPortrait} numberOfLines={1}>
                    {formatRp(totalAmount)}
                  </Text>
                </View>
                <View style={styles.checkoutBillItemBadge}>
                  <Text style={styles.checkoutBillItemBadgeText}>{totalItemsCount} pcs</Text>
                </View>
              </View>

              {/* 2. Customer / Member Card */}
              <View style={styles.checkoutCustomerCardPortrait}>
                <View style={styles.checkoutCustomerCardLeft}>
                  <View style={[styles.checkoutCustomerAvatar, selectedCustomer && styles.checkoutCustomerAvatarActive]}>
                    <Users size={16} color={selectedCustomer ? '#fb7185' : '#a1a1aa'} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.checkoutCustomerName} numberOfLines={1} ellipsizeMode="tail">
                      {selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum'}
                    </Text>
                    {selectedCustomer ? (
                      <View style={styles.checkoutCustomerMetaRow}>
                        <View style={styles.checkoutMembershipBadge}>
                          <Text style={styles.checkoutMembershipBadgeText}>
                            {selectedCustomer.membership_type || 'REGULAR'}
                          </Text>
                        </View>
                        {selectedCustomer.phone && (
                          <Text style={styles.checkoutCustomerPhone} numberOfLines={1}>
                            {selectedCustomer.phone}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.checkoutCustomerSub}>Walk-in (Tanpa Member)</Text>
                    )}
                  </View>
                </View>

                <View style={styles.checkoutCustomerCardRight}>
                  {selectedCustomer && (
                    <TouchableOpacity
                      style={styles.checkoutCustomerResetBtn}
                      onPress={() => setSelectedCustomer(null)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color="#a1a1aa" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.checkoutCustomerChangeBtn}
                    onPress={() => setCustomerModalOpen(true)}
                  >
                    <Text style={styles.checkoutCustomerChangeBtnText}>
                      {selectedCustomer ? 'Ganti' : 'Pilih'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 3. Financial Adjustments Breakdown (if any discount, tax, or fees) */}
              {hasBillAdjustments && (
                <View style={styles.checkoutAdjustmentsBoxPortrait}>
                  <View style={styles.checkoutAdjustmentRow}>
                    <Text style={styles.checkoutAdjustmentLabel}>Subtotal</Text>
                    <Text style={styles.checkoutAdjustmentVal}>{formatRp(subtotal)}</Text>
                  </View>
                  {discount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={[styles.checkoutAdjustmentLabel, { color: '#34d399' }]} numberOfLines={1}>
                        Diskon ({appliedPromo?.discount_code || 'Promo'})
                      </Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#34d399' }]}>
                        -{formatRp(discount)}
                      </Text>
                    </View>
                  )}
                  {taxAmount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>
                        Pajak ({activeTax?.name || 'PPN'})
                      </Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                        +{formatRp(taxAmount)}
                      </Text>
                    </View>
                  )}
                  {feeAmount > 0 && (
                    <View style={styles.checkoutAdjustmentRow}>
                      <Text style={styles.checkoutAdjustmentLabel} numberOfLines={1}>Biaya Layanan</Text>
                      <Text style={[styles.checkoutAdjustmentVal, { color: '#fb7185' }]}>
                        +{formatRp(feeAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* 4. Order Items Card */}
              <View style={styles.checkoutOrderCardPortrait}>
                <View style={styles.checkoutItemsHeader}>
                  <Text style={styles.checkoutItemsTitle}>Daftar Pesanan ({cart.length})</Text>
                  <Text style={styles.checkoutItemsTotalQty}>{totalItemsCount} Total Qty</Text>
                </View>
                {cart.map((item) => {
                  const itemUnit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                  const availableStock = parseFloat(item.product.stock) || 0;
                  return (
                    <View key={item.product.id} style={styles.checkoutItemRowMiniPortrait}>
                      <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <Text style={styles.checkoutItemNameMini} numberOfLines={1} ellipsizeMode="tail">
                          {item.product.name}
                        </Text>
                        <Text style={styles.checkoutItemPriceMini}>
                          {item.quantity} {itemUnit} x {formatRp(item.product.price)} = <Text style={{ color: '#fb7185', fontWeight: 'bold' }}>{formatRp(item.quantity * Number(item.product.price))}</Text>
                        </Text>
                      </View>

                      {/* Stepper Controls & Delete (Portrait Checkout) */}
                      <View style={styles.checkoutItemStepperRow}>
                        <TouchableOpacity
                          style={styles.checkoutItemStepBtn}
                          onPress={() => updateQuantity(item.product.id, -1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={11} color="#ffffff" />
                        </TouchableOpacity>

                        <Text style={styles.checkoutItemQtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={[
                            styles.checkoutItemStepBtn,
                            item.quantity >= availableStock && { opacity: 0.35 },
                          ]}
                          onPress={() => updateQuantity(item.product.id, 1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={11} color="#ffffff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.checkoutItemDeleteBtn}
                          onPress={() => removeFromCart(item.product.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Trash2 size={13} color="#fb7185" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* 5. Payment Method Selector */}
              <Text style={styles.checkoutSectionLabelPortrait}>Metode Pembayaran</Text>
              <View style={styles.checkoutMethodRowPortrait}>
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
                      style={[styles.checkoutMethodBtnPortrait, isSelected && styles.checkoutMethodBtnActive]}
                      onPress={() => setPaymentMethod(m.id)}
                      activeOpacity={0.7}
                    >
                      <Icon size={16} color={isSelected ? '#ffffff' : '#d4d4d8'} />
                      <Text style={[styles.checkoutMethodBtnText, isSelected && styles.checkoutMethodBtnTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 6. Mode Content */}
              {paymentMethod === 'CASH' ? (
                <View style={{ marginTop: 2 }}>
                  {/* Live Cash Monitor Display (Uang Diterima & Kembalian) */}
                  <View style={styles.cashDisplayBoxPortrait}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.cashDisplayLabel}>Uang Diterima:</Text>
                      <Text style={styles.cashDisplayAmountPortrait} numberOfLines={1}>
                        {paidAmount ? formatRp(Number(paidAmount)) : 'Rp0'}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Text style={styles.cashDisplayLabel}>
                        {Number(paidAmount) >= totalAmount ? 'Kembalian:' : 'Kurang:'}
                      </Text>
                      <Text style={[
                        styles.cashDisplayChangePortrait,
                        Number(paidAmount) >= totalAmount ? styles.cashDisplayChangePositive : styles.cashDisplayChangeNegative
                      ]}>
                        {Number(paidAmount) >= totalAmount
                          ? formatRp(changeAmount)
                          : `-${formatRp(totalAmount - (Number(paidAmount) || 0))}`}
                      </Text>
                    </View>
                    {paidAmount ? (
                      <TouchableOpacity
                        style={styles.cashDisplayClearBtn}
                        onPress={handleNumpadClear}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={14} color="#a1a1aa" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Quick Cash Presets Row */}
                  <View style={styles.numpadPresetsRowPortrait}>
                    <TouchableOpacity
                      style={[
                        styles.numpadPresetChipPortrait,
                        styles.numpadPresetBtnPas,
                        Number(paidAmount) === totalAmount && styles.numpadPresetBtnActivePas
                      ]}
                      onPress={() => handleNominalShortcut(totalAmount)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.numpadPresetText,
                          Number(paidAmount) === totalAmount ? styles.numpadPresetTextActive : styles.numpadPresetTextPas
                        ]}
                      >
                        Uang Pas
                      </Text>
                    </TouchableOpacity>

                    {[50000, 100000, 200000].map((val) => {
                      const isSelected = Number(paidAmount) === val;
                      return (
                        <TouchableOpacity
                          key={val}
                          style={[
                            styles.numpadPresetChipPortrait,
                            isSelected && styles.numpadPresetBtnActive
                          ]}
                          onPress={() => handleNominalShortcut(val)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.numpadPresetText,
                              isSelected && styles.numpadPresetTextActive
                            ]}
                          >
                            {formatRp(val)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Integrated Numpad Grid (Portrait) */}
                  <View style={styles.numpadGridPortrait}>
                    <View style={styles.numpadRowPortrait}>
                      {['1', '2', '3'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={styles.numpadKeyPortrait}
                          onPress={() => handleNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.numpadKeyText}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRowPortrait}>
                      {['4', '5', '6'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={styles.numpadKeyPortrait}
                          onPress={() => handleNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.numpadKeyText}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRowPortrait}>
                      {['7', '8', '9'].map((d) => (
                        <TouchableOpacity
                          key={d}
                          style={styles.numpadKeyPortrait}
                          onPress={() => handleNumpadDigit(d)}
                          activeOpacity={0.6}
                        >
                          <Text style={styles.numpadKeyText}>{d}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.numpadRowPortrait}>
                      <TouchableOpacity
                        style={[styles.numpadKeyPortrait, styles.numpadKeySecondary]}
                        onPress={() => handleNumpadDigit('00')}
                        activeOpacity={0.6}
                      >
                        <Text style={[styles.numpadKeyText, styles.numpadKeyTextSecondary]}>00</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.numpadKeyPortrait}
                        onPress={() => handleNumpadDigit('0')}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.numpadKeyText}>0</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.numpadKeyPortrait, styles.numpadKeyDelete]}
                        onPress={handleNumpadBackspace}
                        activeOpacity={0.6}
                      >
                        <Delete size={20} color="#fb7185" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : paymentMethod === 'QRIS' ? (
                <View style={[styles.checkoutQrisCard, { marginTop: 8, maxWidth: '100%' }]}>
                  <View style={styles.checkoutQrisIconBox}>
                    <QrCode size={40} color="#fb7185" />
                  </View>
                  <Text style={styles.checkoutQrisTitle}>Pindai QRIS Statis / EDC</Text>
                  <Text style={styles.checkoutQrisSub}>
                    Minta pembeli scan kode QRIS kasir dan konfirmasi pembayaran di aplikasi e-wallet / m-banking.
                  </Text>
                  {feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                    <View style={styles.qrisFeeAlert}>
                      <QrCode size={14} color="#fbbf24" />
                      <Text style={styles.qrisFeeAlertText}>
                        Biaya Admin QRIS: +{formatRp(feeDetails.filter((f) => f.name.toLowerCase().includes('qris')).reduce((s, f) => s + f.amount, 0))}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[styles.checkoutTransferCard, { marginTop: 8, maxWidth: '100%' }]}>
                  <View style={styles.checkoutTransferIconBox}>
                    <CreditCard size={40} color="#60a5fa" />
                  </View>
                  <Text style={styles.checkoutTransferTitle}>Transfer Bank / EDC</Text>
                  <Text style={styles.checkoutTransferSub}>
                    Pastikan mutasi dana atau struk EDC telah keluar sebelum mengonfirmasi pembayaran.
                  </Text>
                </View>
              )}

              {/* 7. Action CTA Button */}
              <TouchableOpacity
                style={[
                  styles.checkoutSubmitBtn,
                  { marginTop: 16, paddingVertical: 14, borderRadius: 14 },
                  (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount) && styles.checkoutSubmitBtnDisabled,
                  checkoutLoading && styles.checkoutSubmitBtnDisabled
                ]}
                onPress={handleProcessCheckout}
                disabled={checkoutLoading || (paymentMethod === 'CASH' && Number(paidAmount) < totalAmount)}
                activeOpacity={0.8}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={styles.checkoutSubmitBtnContent}>
                    <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={[styles.checkoutSubmitBtnText, { fontSize: 14 }]}>
                      {paymentMethod === 'CASH' && Number(paidAmount) < totalAmount
                        ? `Uang Kurang (${formatRp(totalAmount - (Number(paidAmount) || 0))})`
                        : 'Selesaikan Pembayaran'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      )}

      {/* Interactive Cart Bottom Sheet (Portrait Only) */}
      <Modal
        visible={cartModalOpen && !isLandscape}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCartModalOpen(false)}
      >
        <View style={styles.cartSheetOverlay}>
          <TouchableOpacity
            style={styles.cartSheetBackdrop}
            activeOpacity={1}
            onPress={() => setCartModalOpen(false)}
          />
          <View style={styles.cartSheetContent}>
            {/* Header */}
            <View style={styles.cartSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <View style={styles.cartSheetHeaderIcon}>
                  <ShoppingCart size={16} color="#fb7185" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.cartSheetTitle}>Keranjang Pesanan</Text>
                  <Text style={styles.cartSheetSubtitle}>{cart.length} jenis • {totalItemsCount} total item</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {cart.length > 0 && (
                  <TouchableOpacity
                    style={styles.cartSheetClearBtn}
                    onPress={() => {
                      setCart([]);
                      setCartModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={13} color="#fb7185" />
                    <Text style={styles.cartSheetClearText}>Kosongkan</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setCartModalOpen(false)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={20} color="#d4d4d8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <View style={styles.cartSheetEmptyBox}>
                <ShoppingCart size={38} color="#3f3f46" />
                <Text style={styles.cartSheetEmptyTitle}>Keranjang Kosong</Text>
                <Text style={styles.cartSheetEmptySub}>Pilih produk dari katalog untuk memulai transaksi.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                {cart.map((item) => {
                  const itemUnit = item.product.base_unit?.symbol || item.product.baseUnit?.symbol || 'pcs';
                  const itemPrice = Number(item.product.price);
                  const itemSubtotal = item.quantity * itemPrice;
                  const availableStock = parseFloat(item.product.stock) || 0;

                  return (
                    <View key={item.product.id} style={styles.cartSheetItemRow}>
                      {/* Item Info (Left) */}
                      <View style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                        <Text style={styles.cartSheetItemName} numberOfLines={1} ellipsizeMode="tail">
                          {item.product.name}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <Text style={styles.cartSheetItemPrice}>{formatRp(itemPrice)}/{itemUnit}</Text>
                          <Text style={styles.cartSheetItemDot}>•</Text>
                          <Text style={styles.cartSheetItemSubtotal}>{formatRp(itemSubtotal)}</Text>
                        </View>
                      </View>

                      {/* Stepper Controls & Delete (Right) */}
                      <View style={styles.cartSheetStepperRow}>
                        <TouchableOpacity
                          style={styles.cartSheetStepBtn}
                          onPress={() => updateQuantity(item.product.id, -1)}
                          activeOpacity={0.7}
                        >
                          <Minus size={13} color="#ffffff" />
                        </TouchableOpacity>

                        <Text style={styles.cartSheetQtyText}>{item.quantity}</Text>

                        <TouchableOpacity
                          style={[
                            styles.cartSheetStepBtn,
                            item.quantity >= availableStock && { opacity: 0.35 },
                          ]}
                          onPress={() => updateQuantity(item.product.id, 1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={13} color="#ffffff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cartSheetDeleteBtn}
                          onPress={() => removeFromCart(item.product.id)}
                          activeOpacity={0.7}
                          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        >
                          <Trash2 size={15} color="#fb7185" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Footer Summary & Pay Button */}
            {cart.length > 0 && (
              <View style={styles.cartSheetFooter}>
                <View style={styles.cartSheetTotalRow}>
                  <View>
                    <Text style={styles.cartSheetTotalLabel}>Total Pesanan</Text>
                    <Text style={styles.cartSheetTotalQty}>{totalItemsCount} pcs barang</Text>
                  </View>
                  <Text style={styles.cartSheetTotalVal}>{formatRp(totalAmount)}</Text>
                </View>

                <TouchableOpacity
                  style={styles.cartSheetPayBtn}
                  onPress={() => {
                    setCartModalOpen(false);
                    setPaidAmount(totalAmount.toString());
                    setIsCheckoutView(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cartSheetPayBtnText}>Lanjut Pembayaran ({formatRp(totalAmount)})</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={customerModalOpen}
        animationType={isLandscape ? 'fade' : 'slide'}
        transparent={true}
        onRequestClose={() => setCustomerModalOpen(false)}
      >
        <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
          <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
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
      <Modal visible={promoModalOpen} animationType={isLandscape ? 'fade' : 'slide'} transparent onRequestClose={() => setPromoModalOpen(false)}>
        <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
          <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
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

      {/* Tax Picker Modal */}
      <Modal visible={taxModalOpen} animationType={isLandscape ? 'fade' : 'slide'} transparent onRequestClose={() => setTaxModalOpen(false)}>
        <View style={[styles.modalOverlay, isLandscape && styles.modalOverlayLandscape]}>
          <View style={[styles.customerPickerSheet, isLandscape && styles.customerPickerSheetLandscape]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Percent size={20} color="#fb7185" />
                <Text style={styles.modalTitle}>Pilih Tarif Pajak</Text>
              </View>
              <TouchableOpacity onPress={() => setTaxModalOpen(false)}>
                <X size={20} color="#d4d4d8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {/* Option: Tanpa Pajak */}
              <TouchableOpacity
                style={[styles.taxOptionCard, selectedTaxId === '' && styles.taxOptionCardActive]}
                onPress={() => {
                  setSelectedTaxId('');
                  setTaxModalOpen(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.customerOptionInfo}>
                  <Text style={styles.customerOptionName}>Tanpa Pajak (0%)</Text>
                  <Text style={styles.customerOptionSub}>Tidak mengenakan pajak pada transaksi ini</Text>
                </View>
                {selectedTaxId === '' ? (
                  <View style={[styles.taxOptionBadge, styles.taxOptionBadgeActive]}>
                    <Text style={styles.taxOptionBadgeTextActive}>Aktif</Text>
                  </View>
                ) : (
                  <View style={styles.taxOptionBadge}>
                    <Text style={styles.taxOptionBadgeTextInactive}>Pilih</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Options: Active Taxes */}
              {availableTaxes.map((tax) => {
                const isSelected = selectedTaxId === tax.id;
                const rateDisplay = tax.type === 'PERCENTAGE' ? `${parseFloat(tax.value)}%` : formatRp(tax.value);
                return (
                  <TouchableOpacity
                    key={tax.id}
                    style={[styles.taxOptionCard, isSelected && styles.taxOptionCardActive]}
                    onPress={() => {
                      setSelectedTaxId(tax.id);
                      setTaxModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.customerOptionInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.customerOptionName}>{tax.name}</Text>
                        <View style={styles.membershipBadgeSmall}>
                          <Text style={styles.membershipBadgeSmallText}>{rateDisplay}</Text>
                        </View>
                      </View>
                      <Text style={styles.customerOptionSub}>
                        {tax.description || `${rateDisplay} dari subtotal belanja`}
                      </Text>
                    </View>

                    {isSelected ? (
                      <View style={[styles.taxOptionBadge, styles.taxOptionBadgeActive]}>
                        <Text style={styles.taxOptionBadgeTextActive}>Aktif</Text>
                      </View>
                    ) : (
                      <View style={styles.taxOptionBadge}>
                        <Text style={styles.taxOptionBadgeTextInactive}>Pilih</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Mobile Thermal Receipt Modal */}
      <Modal
        visible={receiptModalOpen}
        animationType={isLandscape ? 'fade' : 'slide'}
        transparent={true}
        onRequestClose={() => setReceiptModalOpen(false)}
      >
        <View style={styles.receiptModalOverlay}>
          <View style={[styles.receiptSheet, isLandscape && styles.receiptSheetLandscape]}>
            {/* Modal Header Bar */}
            <View style={styles.receiptTopBar}>
              <Text style={styles.receiptTopBarTitle}>Struk Transaksi</Text>
              <TouchableOpacity
                onPress={() => setReceiptModalOpen(false)}
                style={styles.receiptCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#71717a" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.receiptScroll}
              contentContainerStyle={styles.receiptScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <ReceiptView
                transaction={completedTx}
                formatRp={formatRp}
              />
            </ScrollView>

            {/* Action CTA */}
            <TouchableOpacity
              style={styles.newTxButton}
              onPress={() => {
                setIsCheckoutView(false);
                setReceiptModalOpen(false);
              }}
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
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  catChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#18181b',
    borderColor: '#27272a',
    borderWidth: 1,
    marginRight: 10,
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
    marginBottom: 4,
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
    marginBottom: 4,
    minHeight: 36,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  floatingCartInfoBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingCartIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cartBarCount: {
    color: '#d4d4d8',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartBarEditBadge: {
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  cartBarEditBadgeText: {
    color: '#fb7185',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartBarTotal: {
    color: '#fb7185',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  cartBarButton: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexShrink: 0,
  },
  cartBarButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  cartSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  cartSheetBackdrop: {
    flex: 1,
  },
  cartSheetContent: {
    backgroundColor: '#18181b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    padding: 20,
    maxHeight: '85%',
  },
  cartSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 10,
  },
  cartSheetHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartSheetTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  cartSheetSubtitle: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetClearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cartSheetClearText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  cartSheetEmptyTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetEmptySub: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  cartSheetItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  cartSheetItemName: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetItemPrice: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetItemDot: {
    color: '#52525b',
    fontSize: 12,
  },
  cartSheetItemSubtotal: {
    color: '#34d399',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cartSheetStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  cartSheetStepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  cartSheetQtyText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    minWidth: 24,
    textAlign: 'center',
  },
  cartSheetDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    marginLeft: 4,
  },
  cartSheetFooter: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    gap: 12,
  },
  cartSheetTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartSheetTotalLabel: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  cartSheetTotalQty: {
    color: '#a1a1aa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  cartSheetTotalVal: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  cartSheetPayBtn: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  cartSheetPayBtnText: {
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
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 380,
    height: '86%',
    maxHeight: 680,
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  receiptTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    flexShrink: 0,
  },
  receiptTopBarTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#18181b',
  },
  receiptCloseBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#f4f4f5',
  },
  receiptScroll: {
    flex: 1,
    width: '100%',
    minHeight: 180,
  },
  receiptScrollContent: {
    paddingTop: 10,
    paddingBottom: 12,
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
    marginTop: 10,
    flexShrink: 0,
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
  taxOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: '#27272a',
    borderWidth: 1.5,
    borderColor: '#3f3f46',
  },
  taxOptionCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#132820',
  },
  taxOptionBadge: {
    backgroundColor: '#3f3f46',
    width: 58,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taxOptionBadgeActive: {
    backgroundColor: '#059669',
  },
  taxOptionBadgeTextInactive: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  taxOptionBadgeTextActive: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
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
  landscapeRoot: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
  },
  catalogCol: {
    flex: 1,
  },
  landscapeCatalogCol: {
    flex: 1,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    overflow: 'hidden',
  },
  landscapeToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#09090b',
    gap: 12,
    flexShrink: 0,
  },
  landscapeToolbarCompact: {
    paddingHorizontal: 10,
    height: 44,
    gap: 8,
  },
  portraitToolbar: {
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  landscapeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    width: 175,
    flexShrink: 0,
  },
  portraitSearchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    height: 34,
    flexShrink: 0,
  },
  portraitSearchPillActive: {
    borderColor: '#fb7185',
    backgroundColor: '#241217',
  },
  portraitSearchPillInput: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    padding: 0,
    height: '100%',
  },
  landscapeSearchBoxCompact: {
    width: 140,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  landscapeSearchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    padding: 0,
    height: 28,
  },
  landscapeSearchInputCompact: {
    fontSize: 12,
    height: 26,
  },
  toolbarDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#27272a',
    marginHorizontal: 4,
    flexShrink: 0,
  },
  landscapeCatScrollContent: {
    alignItems: 'center',
    paddingRight: 12,
  },
  catChipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderRadius: 20,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catChipTextCompact: {
    fontSize: 12,
  },
  gridContentLandscape: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  gridContentCompactLandscape: {
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 16,
  },
  productCardLandscape: {
    padding: 14,
    margin: 6,
    borderRadius: 14,
  },
  productCardCompactLandscape: {
    padding: 8,
    margin: 4,
    borderRadius: 12,
    minHeight: 82,
  },
  cardTitleLandscape: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  cardTitleCompactLandscape: {
    fontSize: 12,
    marginBottom: 3,
    lineHeight: 16,
  },
  floatingBadgeCompact: {
    top: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  landscapeRegisterCol: {
    width: 360,
    height: '100%',
    backgroundColor: '#18181b',
    borderLeftWidth: 1,
    borderLeftColor: '#27272a',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  landscapeRegisterColCompact: {
    width: 325,
  },
  registerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#141416',
    flexShrink: 0,
  },
  landscapeRegisterHeader: {
    height: 50,
    paddingVertical: 0,
    paddingHorizontal: 16,
  },
  landscapeRegisterHeaderCompact: {
    height: 44,
    paddingVertical: 0,
    paddingHorizontal: 10,
  },
  registerHeaderCompact: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  registerTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  registerCountBadge: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  registerCountText: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  regCustomerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    maxWidth: 130,
  },
  regCustomerBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
  },
  regClearBtn: {
    padding: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderRadius: 10,
  },
  registerEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  registerEmptyBoxCompact: {
    padding: 12,
    gap: 6,
  },
  registerEmptyTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#f4f4f5',
  },
  registerEmptySub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
    marginTop: 4,
  },
  registerItemsScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  registerItemsScrollCompact: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  regItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  regItemRowCompact: {
    paddingVertical: 6,
  },
  regItemName: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  regItemPrice: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 4,
  },
  regQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    borderRadius: 10,
    padding: 3,
    gap: 6,
    flexShrink: 0,
  },
  regQtyBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: '#3f3f46',
  },
  regQtyText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    minWidth: 20,
    textAlign: 'center',
  },
  registerFooter: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    backgroundColor: '#141416',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    flexShrink: 0,
  },
  registerFooterCompact: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 10,
  },
  regQuickOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  regQuickOptionsRowCompact: {
    gap: 6,
    marginBottom: 6,
  },
  regQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  regQuickPillCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  regQuickPillActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  regQuickPillPromoActive: {
    backgroundColor: '#047857',
    borderColor: '#10b981',
  },
  regQuickPillPromoTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  regQuickPillText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#d4d4d8',
  },
  regQuickPillTextActive: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
  },
  regSummaryBox: {
    marginBottom: 12,
    gap: 6,
  },
  regSummaryBoxCompact: {
    marginBottom: 6,
    gap: 2,
  },
  regSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  regSummaryRowCompact: {
    paddingVertical: 0,
  },
  regSummaryLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  regSummaryValue: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    flexShrink: 0,
  },
  regPayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 16,
  },
  regPayRowCompact: {
    paddingTop: 8,
  },
  regTotalLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  regTotalAmount: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
  },
  regTotalAmountCompact: {
    fontSize: 16,
  },
  regPayButton: {
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    flexShrink: 0,
  },
  regPayButtonCompact: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  regPayButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
  },
  regPayButtonTextCompact: {
    fontSize: 12,
  },
  modalOverlayLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentLandscape: {
    borderRadius: 20,
    maxWidth: 420,
    width: '100%',
    maxHeight: '94%',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalLandscapeScroll: {
    maxHeight: 240,
  },
  landscapeBillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  landscapeBillLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginBottom: 2,
  },
  landscapeBillTotal: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fb7185',
  },
  landscapeBillCustomer: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    maxWidth: 140,
  },
  landscapeSectionLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
    marginBottom: 6,
  },
  landscapeMethodBtn: {
    paddingVertical: 8,
  },
  landscapeCashBox: {
    marginTop: 8,
    backgroundColor: '#141416',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  paySubmitBtnLandscape: {
    marginTop: 10,
    paddingVertical: 11,
    borderRadius: 12,
  },
  paySubmitTextLandscape: {
    fontSize: 14,
  },
  customerPickerSheetLandscape: {
    maxWidth: 500,
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignSelf: 'center',
  },
  receiptSheetLandscape: {
    maxWidth: 420,
    height: '94%',
    maxHeight: '94%',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
  },
  checkoutRoot: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  checkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#141416',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    flexShrink: 0,
  },
  checkoutHeaderLandscape: {
    height: 48,
    paddingHorizontal: 16,
  },
  checkoutHeaderCompact: {
    height: 44,
    paddingHorizontal: 12,
  },
  checkoutBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 6,
    paddingRight: 10,
  },
  checkoutBackText: {
    color: '#fb7185',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutTitleBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
  },
  checkoutHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutItemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutItemBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  checkoutBodyLandscape: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    overflow: 'hidden',
  },
  checkoutLeftColLandscape: {
    width: '38%',
    maxWidth: 380,
    borderRightWidth: 1,
    borderRightColor: '#27272a',
    backgroundColor: '#111113',
    padding: 14,
  },
  checkoutLeftColCompactLandscape: {
    width: '36%',
    maxWidth: 320,
    padding: 10,
  },
  checkoutRightColLandscape: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 14,
    justifyContent: 'space-between',
  },
  checkoutBillBanner: {
    backgroundColor: '#1c1215',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  checkoutBillBannerCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  checkoutBillBannerLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  checkoutBillBannerAmount: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  checkoutBillBannerAmountCompact: {
    fontSize: 17,
  },
  checkoutBillItemBadge: {
    backgroundColor: '#881337',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9f1239',
  },
  checkoutBillItemBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  checkoutCustomerCard: {
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutCustomerCardCompact: {
    padding: 6,
    marginBottom: 6,
  },
  checkoutCustomerCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  checkoutCustomerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkoutCustomerAvatarActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
  },
  checkoutCustomerName: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  checkoutCustomerSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
  },
  checkoutCustomerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  checkoutMembershipBadge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  checkoutMembershipBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
    textTransform: 'uppercase',
  },
  checkoutCustomerPhone: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    maxWidth: 110,
  },
  checkoutCustomerCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  checkoutCustomerResetBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  checkoutCustomerChangeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#27272a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutCustomerChangeBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#fb7185',
  },
  checkoutAdjustmentsBox: {
    backgroundColor: '#141416',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 4,
  },
  checkoutAdjustmentsBoxCompact: {
    paddingVertical: 4,
    marginBottom: 6,
    gap: 2,
  },
  checkoutAdjustmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutAdjustmentLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    flex: 1,
    minWidth: 0,
  },
  checkoutAdjustmentVal: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    flexShrink: 0,
  },
  checkoutItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    marginBottom: 4,
  },
  checkoutItemsTitle: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
  },
  checkoutItemsTotalQty: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  checkoutItemsScrollLandscape: {
    flex: 1,
    marginTop: 2,
  },
  checkoutItemRowMini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  checkoutItemRowMiniCompact: {
    paddingVertical: 4,
  },
  checkoutItemNameMini: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#ffffff',
  },
  checkoutItemPriceMini: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    marginTop: 2,
  },
  checkoutItemSubtotalMini: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fb7185',
    flexShrink: 0,
  },
  checkoutMethodRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  checkoutMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  checkoutMethodBtnCompact: {
    paddingVertical: 5,
    borderRadius: 8,
  },
  checkoutMethodBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  checkoutMethodBtnText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#a1a1aa',
  },
  checkoutMethodBtnTextActive: {
    color: '#ffffff',
  },
  checkoutCashTerminal: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cashDisplayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  cashDisplayBoxCompact: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  cashDisplayLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#a1a1aa',
  },
  cashDisplayAmount: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#34d399',
  },
  cashDisplayAmountCompact: {
    fontSize: 16,
  },
  cashDisplayChange: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  cashDisplayChangeCompact: {
    fontSize: 14,
  },
  cashDisplayChangePositive: {
    color: '#34d399',
  },
  cashDisplayChangeNegative: {
    color: '#fbbf24',
  },
  cashDisplayClearBtn: {
    padding: 4,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  numpadContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  numpadGrid: {
    flex: 3,
    gap: 6,
  },
  numpadRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  numpadKey: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyCompact: {
    borderRadius: 8,
  },
  numpadKeyText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
  },
  numpadKeyTextCompact: {
    fontSize: 14,
  },
  numpadKeySecondary: {
    backgroundColor: '#1f1f23',
  },
  numpadKeyTextSecondary: {
    color: '#fb7185',
    fontSize: 14,
  },
  numpadKeyDelete: {
    backgroundColor: '#241217',
    borderColor: '#4c1d24',
  },
  numpadPresetsCol: {
    flex: 1.4,
    gap: 6,
  },
  numpadPresetBtn: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  numpadPresetBtnCompact: {
    borderRadius: 8,
  },
  numpadPresetBtnPas: {
    backgroundColor: '#132820',
    borderColor: '#059669',
  },
  numpadPresetBtnActive: {
    backgroundColor: '#e11d48',
    borderColor: '#f43f5e',
  },
  numpadPresetBtnActivePas: {
    backgroundColor: '#047857',
    borderColor: '#10b981',
  },
  numpadPresetText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
  },
  numpadPresetTextCompact: {
    fontSize: 12,
  },
  numpadPresetTextPas: {
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    color: '#34d399',
  },
  numpadPresetTextActive: {
    color: '#ffffff',
  },
  checkoutQrisTerminal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  checkoutTransferTerminal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  checkoutQrisCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 18,
    alignItems: 'center',
  },
  checkoutTransferCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#141416',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 18,
    alignItems: 'center',
  },
  checkoutQrisIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#241217',
    borderWidth: 1,
    borderColor: '#4c1d24',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkoutTransferIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#131e2e',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  checkoutQrisTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  checkoutTransferTitle: {
    fontSize: 14,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  checkoutQrisSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
  },
  checkoutTransferSub: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#a1a1aa',
    textAlign: 'center',
  },
  checkoutSubmitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  checkoutSubmitBtnCompact: {
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 6,
  },
  checkoutSubmitBtnDisabled: {
    backgroundColor: '#27272a',
    opacity: 0.6,
  },
  checkoutSubmitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutSubmitBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
  },
  checkoutBillBannerPortrait: {
    backgroundColor: '#1c1215',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  checkoutBillBannerAmountPortrait: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    marginTop: 2,
  },
  checkoutCustomerCardPortrait: {
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutAdjustmentsBoxPortrait: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 6,
  },
  checkoutOrderCardPortrait: {
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 14,
    marginBottom: 14,
  },
  checkoutItemRowMiniPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  checkoutItemStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  checkoutItemStepBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  checkoutItemQtyText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    minWidth: 18,
    textAlign: 'center',
  },
  checkoutItemDeleteBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(225, 29, 72, 0.25)',
    marginLeft: 2,
  },
  checkoutSectionLabelPortrait: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#d4d4d8',
    marginBottom: 8,
  },
  checkoutMethodRowPortrait: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  checkoutMethodBtnPortrait: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
  },
  cashDisplayBoxPortrait: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141416',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  cashDisplayAmountPortrait: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#34d399',
    marginTop: 2,
  },
  cashDisplayChangePortrait: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
  },
  numpadPresetsRowPortrait: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  numpadPresetChipPortrait: {
    flex: 1,
    backgroundColor: '#18181b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadGridPortrait: {
    gap: 8,
    marginBottom: 14,
  },
  numpadRowPortrait: {
    flexDirection: 'row',
    gap: 8,
  },
  numpadKeyPortrait: {
    flex: 1,
    height: 48,
    backgroundColor: '#18181b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutBodyPortrait: {
    flex: 1,
    backgroundColor: '#09090b',
  },
});
