import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  ArrowRight,
  ShoppingCart,
} from 'lucide-react-native';
import api from '../services/api';
import { storage } from '../services/storage';
import { offlineStorage } from '../services/offlineStorage';
import { syncManager } from '../services/syncManager';
import { printerService } from '../services/printerService';
import { showAlert } from '../utils/alert';
import { useCheckoutReducer, CHECKOUT_ACTION_TYPES } from '../hooks/useCheckoutState';
import PosCartModal from '../components/pos/PosCartModal';
import CustomerPickerModal from '../components/pos/CustomerPickerModal';
import PromoVoucherModal from '../components/pos/PromoVoucherModal';
import TaxFeeModal from '../components/pos/TaxFeeModal';
import PaymentSuccessModal from '../components/pos/PaymentSuccessModal';
import ProductGrid from '../components/pos/ProductGrid';
import LandscapeRegisterPanel from '../components/pos/LandscapeRegisterPanel';
import PosCheckoutView from '../components/pos/PosCheckoutView';
import PosBarcodeScannerView from '../components/pos/PosBarcodeScannerView';

export default function PosScreen({ isLandscape = false, isCompactLandscape = false, onCheckoutStateChange }) {
  const { width, height } = useWindowDimensions();
  const compact = isCompactLandscape || (isLandscape && height < 440);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Unified Checkout & Cart State Machine (useReducer)
  const [checkoutState, dispatch] = useCheckoutReducer();
  const {
    cart,
    isCheckoutView,
    cartModalOpen,
    paidAmount,
    selectedCustomer,
    customerModalOpen,
    customerSearch,
    paymentMethod,
    checkoutLoading,
    appliedPromo,
    discount,
    voucherInput,
    voucherLoading,
    promoModalOpen,
    selectedTaxId,
    taxModalOpen,
    selectedManualFeeIds,
    isTakeaway,
    completedTx,
    receiptModalOpen,
  } = checkoutState;

  // User Preference: show/hide customer picker, voucher, tax, and barcode scanner in checkout
  const [showCustomerPicker, setShowCustomerPicker] = useState(true);
  const [showVoucherFeature, setShowVoucherFeature] = useState(true);
  const [showTaxFeature, setShowTaxFeature] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(true);
  const [soundBeep, setSoundBeep] = useState(true);

  // Barcode Scanner Mode State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);

  useEffect(() => {
    if (onCheckoutStateChange) {
      onCheckoutStateChange(isCheckoutView);
    }
  }, [isCheckoutView, onCheckoutStateChange]);

  // Checkout State Action Wrappers
  const setCart = (action) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CART, payload: action });
  const setIsCheckoutView = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CHECKOUT_VIEW, payload: val });
  const setCartModalOpen = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CART_MODAL, payload: val });
  const setPaidAmount = (action) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_PAID_AMOUNT, payload: action });
  const setSelectedCustomer = (cust) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CUSTOMER, payload: cust });
  const setCustomerModalOpen = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CUSTOMER_MODAL, payload: val });
  const setCustomerSearch = (txt) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CUSTOMER_SEARCH, payload: txt });
  const setPaymentMethod = (method) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_PAYMENT_METHOD, payload: method });
  const setCheckoutLoading = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_CHECKOUT_LOADING, payload: val });
  const setAppliedPromo = (promo) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_APPLIED_PROMO, payload: { promo, discount } });
  const setDiscount = (amt) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_DISCOUNT, payload: amt });
  const setVoucherInput = (txt) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_VOUCHER_INPUT, payload: txt });
  const setVoucherLoading = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_VOUCHER_LOADING, payload: val });
  const setPromoModalOpen = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_PROMO_MODAL, payload: val });
  const setSelectedTaxId = (taxId) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_SELECTED_TAX_ID, payload: taxId });
  const setTaxModalOpen = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_TAX_MODAL, payload: val });
  const setSelectedManualFeeIds = (fees) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_SELECTED_MANUAL_FEES, payload: fees });
  const setIsTakeaway = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_IS_TAKEAWAY, payload: val });
  const setCompletedTx = (tx) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_COMPLETED_TX, payload: tx });
  const setReceiptModalOpen = (val) => dispatch({ type: CHECKOUT_ACTION_TYPES.SET_RECEIPT_MODAL, payload: val });

  // Taxes & Promos Reference State
  const [taxesAndFees, setTaxesAndFees] = useState([]);
  const [availablePromos, setAvailablePromos] = useState([]);

  // Offline-First Network Connectivity State
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    fetchData();
    syncManager.init();

    // Load checkout feature preferences from persisted settings
    storage.getSettings().then((saved) => {
      if (saved) {
        if (typeof saved.showCustomerPicker === 'boolean') {
          setShowCustomerPicker(saved.showCustomerPicker);
        }
        if (typeof saved.showVoucherFeature === 'boolean') {
          setShowVoucherFeature(saved.showVoucherFeature);
        }
        if (typeof saved.showTaxFeature === 'boolean') {
          setShowTaxFeature(saved.showTaxFeature);
        }
        if (typeof saved.showBarcodeScanner === 'boolean') {
          setShowBarcodeScanner(saved.showBarcodeScanner);
        }
        if (typeof saved.soundBeep === 'boolean') {
          setSoundBeep(saved.soundBeep);
        }
      }
    });

    const unsubscribe = syncManager.subscribe((state) => {
      setIsOnline(state.isOnline);
    });

    return () => {
      unsubscribe();
    };
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

      const prods = prodRes.data.success
        ? prodRes.data.data.data.map((p) => ({
            ...p,
            unitSymbol: p.base_unit?.symbol || p.baseUnit?.symbol || 'pcs',
          }))
        : [];
      const cats = catRes.data.success ? catRes.data.data : [];
      const custs = custRes.data.success ? custRes.data.data : [];
      const promos = promoRes.data.success ? promoRes.data.data : [];
      const tfData = taxFeeRes.data.success ? taxFeeRes.data.data : [];

      setProducts(prods);
      setCategories(cats);
      setCustomers(custs);
      setAvailablePromos(promos);
      setTaxesAndFees(tfData);

      const defTax = tfData.find((i) => i.is_tax && i.is_default);
      if (defTax) setSelectedTaxId(defTax.id);
      const defFees = tfData.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
      setSelectedManualFeeIds(defFees);

      // Cache catalog offline snapshot
      await offlineStorage.cacheCatalog({
        products: prods,
        categories: cats,
        customers: custs,
        promos,
        taxesAndFees: tfData,
      });
    } catch (err) {
      console.log('PosScreen fetchData offline fallback:', err);
      // Fallback: Read from local SQLite/AsyncStorage cache
      const cached = await offlineStorage.getCachedCatalog();
      if (cached) {
        setProducts(
          (cached.products || []).map((p) => ({
            ...p,
            unitSymbol: p.unitSymbol || p.base_unit?.symbol || p.baseUnit?.symbol || 'pcs',
          }))
        );
        setCategories(cached.categories || []);
        setCustomers(cached.customers || []);
        setAvailablePromos(cached.promos || []);
        setTaxesAndFees(cached.taxesAndFees || []);

        const defTax = (cached.taxesAndFees || []).find((i) => i.is_tax && i.is_default);
        if (defTax) setSelectedTaxId(defTax.id);
        const defFees = (cached.taxesAndFees || [])
          .filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default)
          .map((i) => i.id);
        setSelectedManualFeeIds(defFees);
      } else {
        showAlert('Error', 'Gagal memuat data POS dan tidak ada cache offline.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Cart Operations
  const addToCart = (product) => {
    const existing = cart.find((i) => i.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const availableStock = parseFloat(product.stock) || 0;

    if (currentQty + 1 > availableStock) {
      showAlert(
        'Stok Tidak Cukup',
        'Stok produk "' + product.name + '" hanya tersisa ' + availableStock + ' ' + (product.unitSymbol || 'pcs') + '.'
      );
      return;
    }

    if (existing) {
      setCart(
        cart.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, unit_id: product.base_unit_id || null }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const availableStock = parseFloat(item.product.stock) || 0;
    if (newQty > availableStock) {
      showAlert(
        'Stok Tidak Cukup',
        'Stok produk "' + item.product.name + '" hanya tersisa ' + availableStock + ' ' + (item.product.unitSymbol || 'pcs') + '.'
      );
      return;
    }

    setCart(
      cart.map((i) =>
        i.product.id === productId ? { ...i, quantity: newQty } : i
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.product.id !== productId));
  };

  // Memoized Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  const activeTax = useMemo(() => {
    if (!showTaxFeature) return null;
    return taxesAndFees.find((i) => i.id === selectedTaxId && i.is_tax);
  }, [taxesAndFees, selectedTaxId, showTaxFeature]);

  const taxAmount = useMemo(() => {
    if (!showTaxFeature || !activeTax) return 0;
    const taxableBase = Math.max(0, subtotal - discount);
    if (activeTax.type === 'PERCENTAGE') {
      return Math.round((taxableBase * parseFloat(activeTax.value)) / 100);
    }
    return Math.round(parseFloat(activeTax.value));
  }, [activeTax, subtotal, discount, showTaxFeature]);

  const takeawayFees = useMemo(() => {
    return taxesAndFees.filter((i) => !i.is_tax && i.apply_to === 'TAKEAWAY');
  }, [taxesAndFees]);

  const manualFees = useMemo(() => {
    return taxesAndFees.filter((i) => !i.is_tax && selectedManualFeeIds.includes(i.id));
  }, [taxesAndFees, selectedManualFeeIds]);

  const activeFees = useMemo(() => {
    const list = [...manualFees];
    if (isTakeaway) {
      list.push(...takeawayFees);
    }
    return list;
  }, [manualFees, isTakeaway, takeawayFees]);

  const feeAmount = useMemo(() => {
    return activeFees.reduce((acc, f) => {
      const base = Math.max(0, subtotal - discount);
      if (f.type === 'PERCENTAGE') {
        return acc + Math.round((base * parseFloat(f.value)) / 100);
      }
      return acc + Math.round(parseFloat(f.value));
    }, 0);
  }, [activeFees, subtotal, discount]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subtotal - discount + taxAmount + feeAmount);
  }, [subtotal, discount, taxAmount, feeAmount]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((acc, i) => acc + i.quantity, 0);
  }, [cart]);

  const hasBillAdjustments = useMemo(() => {
    return discount > 0 || taxAmount > 0 || feeAmount > 0;
  }, [discount, taxAmount, feeAmount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, (Number(paidAmount) || 0) - totalAmount);
  }, [paidAmount, totalAmount]);

  const feeDetails = useMemo(() => {
    return activeFees.map((f) => {
      const base = Math.max(0, subtotal - discount);
      const amt = f.type === 'PERCENTAGE' ? Math.round((base * parseFloat(f.value)) / 100) : Math.round(parseFloat(f.value));
      return { id: f.id, name: f.name, amount: amt, type: f.type, value: f.value };
    });
  }, [activeFees, subtotal, discount]);

  const availableTaxes = useMemo(() => {
    return taxesAndFees.filter((i) => i.is_tax && i.is_active);
  }, [taxesAndFees]);

  // Numpad & Quick Nominals
  const handleNumpadDigit = (digit) => {
    setPaidAmount((prev) => {
      const current = prev || '';
      if (current === '0' && digit === '0') return '0';
      if (current === '0' && digit !== '000') return digit;
      if (current.length >= 10) return current;
      return current + digit;
    });
  };

  const handleNumpadBackspace = () => {
    setPaidAmount((prev) => {
      if (!prev || prev.length <= 1) return '';
      return prev.slice(0, -1);
    });
  };

  const handleNominalShortcut = (val) => {
    setPaidAmount(val.toString());
  };

  // Promo Handlers
  const handleApplyVoucher = async (codeToVerify) => {
    const code = (codeToVerify || voucherInput).trim().toUpperCase();
    if (!code) {
      showAlert('Error', 'Masukkan kode voucher terlebih dahulu.');
      return;
    }

    try {
      setVoucherLoading(true);
      const res = await api.post('/discounts/check-voucher', {
        code,
        cart_total: subtotal,
      });

      if (res.data.success) {
        const promo = res.data.data;
        let disc = 0;
        if (promo.discount_type === 'PERCENTAGE') {
          disc = Math.round((subtotal * parseFloat(promo.discount_value)) / 100);
          if (promo.max_discount && disc > parseFloat(promo.max_discount)) {
            disc = Math.round(parseFloat(promo.max_discount));
          }
        } else {
          disc = Math.round(parseFloat(promo.discount_value));
        }

        if (disc > subtotal) disc = subtotal;

        setAppliedPromo(promo);
        setDiscount(disc);
        setVoucherInput('');
        setPromoModalOpen(false);
        showAlert('Sukses', 'Voucher "' + promo.discount_code + '" berhasil dipasang!');
      }
    } catch (err) {
      showAlert('Voucher Tidak Valid', err.response?.data?.message || 'Kode voucher tidak valid atau syarat tidak terpenuhi.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setVoucherInput('');
  };

  // Filtered Products & Customers
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCat === 'ALL' || p.category_id === selectedCat;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [products, selectedCat, search]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (!customerSearch) return true;
      const s = customerSearch.toLowerCase();
      return (c.name && c.name.toLowerCase().includes(s)) || (c.phone && c.phone.includes(s));
    });
  }, [customers, customerSearch]);

  // Consolidated Offline Fallback Handler
  const handleOfflineSuccess = async (payload, receiptItems) => {
    const offlineTx = await offlineStorage.queueTransaction(payload, receiptItems);
    setCompletedTx(offlineTx);
    setPaidAmount('');
    setCart([]);
    setAppliedPromo(null);
    setDiscount(0);
    setReceiptModalOpen(true);
    setIsCheckoutView(false);

    // Auto-print receipt if enabled
    try {
      const savedSettings = await storage.getSettings();
      if (savedSettings?.autoPrint) {
        await printerService.printReceipt(offlineTx);
      }
    } catch (e) {}
  };

  // Process Checkout
  const handleProcessCheckout = async () => {
    if (cart.length === 0) {
      showAlert('Keranjang Kosong', 'Silakan pilih produk terlebih dahulu.');
      return;
    }

    const paidNum = Number(paidAmount) || 0;
    if (paymentMethod === 'CASH' && paidNum < totalAmount) {
      showAlert('Pembayaran Kurang', 'Uang diterima (' + formatRp(paidNum) + ') kurang dari total tagihan (' + formatRp(totalAmount) + ').');
      return;
    }

    try {
      setCheckoutLoading(true);

      const receiptItems = cart.map((i) => ({
        product_id: i.product.id,
        product_name: i.product.name,
        quantity: i.quantity,
        unit_name: i.product.unitSymbol || 'pcs',
        price: Number(i.product.price),
        subtotal: Number(i.product.price) * Number(i.quantity),
      }));

      const payload = {
        payment_method: paymentMethod,
        total_amount: totalAmount,
        paid_amount: paymentMethod === 'CASH' ? paidNum : totalAmount,
        change_amount: paymentMethod === 'CASH' ? changeAmount : 0,
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: selectedCustomer ? selectedCustomer.name : 'Pelanggan Umum',
        customer_phone: selectedCustomer ? selectedCustomer.phone : null,
        discount_code: appliedPromo ? appliedPromo.discount_code : null,
        discount_amount: discount,
        tax_id: selectedTaxId || null,
        tax_amount: taxAmount,
        service_fee: feeAmount,
        fee_details: feeDetails,
        notes: isTakeaway ? 'BUNGKUS / TAKEAWAY' : null,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_id: i.unit_id || i.product.base_unit_id || null,
          product_name: i.product.name,
          price: i.product.price,
          subtotal: Number(i.product.price) * Number(i.quantity),
        })),
      };

      // 1. Direct offline handling if offline
      if (!isOnline && paymentMethod === 'CASH') {
        await handleOfflineSuccess(payload, receiptItems);
        return;
      }

      if (!isOnline && paymentMethod !== 'CASH') {
        showAlert(
          'Perlu Koneksi Internet',
          'Metode pembayaran QRIS dan Transfer memerlukan koneksi internet aktif. Silakan pilih metode TUNAI untuk bertransaksi offline.'
        );
        return;
      }

      // 2. Online checkout attempt
      try {
        const res = await api.post('/pos/checkout', payload);
        if (res.data.success) {
          const defTax = taxesAndFees.find((i) => i.is_tax && i.is_default);
          const defFees = taxesAndFees.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
          dispatch({
            type: CHECKOUT_ACTION_TYPES.RESET_CHECKOUT,
            payload: {
              completedTx: res.data.data,
              defaultTaxId: defTax ? defTax.id : '',
              defaultFeeIds: defFees,
            },
          });

          // Auto-print receipt if enabled
          try {
            const savedSettings = await storage.getSettings();
            if (savedSettings?.autoPrint) {
              await printerService.printReceipt(res.data.data);
            }
          } catch (e) {}

          fetchData();
        }
      } catch (err) {
        const isNetworkErr = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network');
        if (isNetworkErr && paymentMethod === 'CASH') {
          // Fallback to offline queue
          await handleOfflineSuccess(payload, receiptItems);
          return;
        }

        if (isNetworkErr && paymentMethod !== 'CASH') {
          showAlert(
            'Perlu Internet',
            'Pembayaran non-tunai memerlukan koneksi internet aktif. Silakan pilih metode TUNAI saat offline.'
          );
          return;
        }

        showAlert('Gagal', err.response?.data?.message || 'Terjadi kesalahan transaksi.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatRp = (num) => 'Rp' + Number(num || 0).toLocaleString('id-ID');

  return (
    <View style={[styles.container, isLandscape && styles.landscapeRoot]}>
      {!isCheckoutView ? (
        <>
          {/* LEFT COLUMN: Catalog & Products Component OR Barcode Scanner View */}
          {isLandscape && isBarcodeScannerOpen && showBarcodeScanner ? (
            <PosBarcodeScannerView
              isLandscape={isLandscape}
              compact={compact}
              products={products}
              soundBeep={soundBeep}
              onScanProduct={addToCart}
              onClose={() => setIsBarcodeScannerOpen(false)}
            />
          ) : (
            <ProductGrid
              isLandscape={isLandscape}
              compact={compact}
              search={search}
              onSearchChange={setSearch}
              categories={categories}
              selectedCat={selectedCat}
              onSelectCat={setSelectedCat}
              products={filteredProducts}
              loading={loading}
              cart={cart}
              onAddToCart={addToCart}
              formatRp={formatRp}
              onOpenBarcodeScanner={showBarcodeScanner ? () => setIsBarcodeScannerOpen(true) : undefined}
            />
          )}

          {/* RIGHT COLUMN (LANDSCAPE ONLY): Persistent Cashier Register Panel */}
          {isLandscape && (
            <LandscapeRegisterPanel
              compact={compact}
              totalItemsCount={totalItemsCount}
              selectedCustomer={selectedCustomer}
              showCustomerPicker={showCustomerPicker}
              showVoucherFeature={showVoucherFeature}
              showTaxFeature={showTaxFeature}
              onOpenCustomerModal={() => setCustomerModalOpen(true)}
              isScanMode={isBarcodeScannerOpen}
              onToggleScanMode={showBarcodeScanner ? () => setIsBarcodeScannerOpen(!isBarcodeScannerOpen) : undefined}
              cart={cart}
              onClearCart={() => setCart([])}
              onUpdateQuantity={updateQuantity}
              availablePromos={availablePromos}
              appliedPromo={appliedPromo}
              onOpenPromoModal={() => setPromoModalOpen(true)}
              onRemovePromo={handleRemovePromo}
              takeawayFees={takeawayFees}
              isTakeaway={isTakeaway}
              onToggleTakeaway={() => setIsTakeaway(!isTakeaway)}
              availableTaxes={availableTaxes}
              selectedTaxId={selectedTaxId}
              activeTax={activeTax}
              onSelectTax={setSelectedTaxId}
              onOpenTaxModal={() => setTaxModalOpen(true)}
              hasBillAdjustments={hasBillAdjustments}
              subtotal={subtotal}
              discount={discount}
              taxAmount={taxAmount}
              feeAmount={feeAmount}
              totalAmount={totalAmount}
              onProceedToCheckout={() => {
                setPaidAmount(totalAmount.toString());
                setIsCheckoutView(true);
              }}
              formatRp={formatRp}
            />
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
        <PosCheckoutView
          isLandscape={isLandscape}
          compact={compact}
          onCloseCheckout={() => setIsCheckoutView(false)}
          totalItemsCount={totalItemsCount}
          totalAmount={totalAmount}
          selectedCustomer={selectedCustomer}
          showCustomerPicker={showCustomerPicker}
          showVoucherFeature={showVoucherFeature}
          showTaxFeature={showTaxFeature}
          onOpenCustomerModal={() => setCustomerModalOpen(true)}
          onClearCustomer={() => setSelectedCustomer(null)}
          hasBillAdjustments={hasBillAdjustments}
          subtotal={subtotal}
          discount={discount}
          appliedPromo={appliedPromo}
          taxAmount={taxAmount}
          activeTax={activeTax}
          feeAmount={feeAmount}
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          availablePromos={availablePromos}
          onOpenPromoModal={() => setPromoModalOpen(true)}
          onRemovePromo={handleRemovePromo}
          voucherInput={voucherInput}
          onChangeVoucherInput={setVoucherInput}
          onApplyVoucher={handleApplyVoucher}
          voucherLoading={voucherLoading}
          takeawayFees={takeawayFees}
          isTakeaway={isTakeaway}
          onToggleTakeaway={() => setIsTakeaway(!isTakeaway)}
          availableTaxes={availableTaxes}
          selectedTaxId={selectedTaxId}
          onSelectTax={setSelectedTaxId}
          onOpenTaxModal={() => setTaxModalOpen(true)}
          paymentMethod={paymentMethod}
          onSelectPaymentMethod={setPaymentMethod}
          paidAmount={paidAmount}
          onNumpadDigit={handleNumpadDigit}
          onNumpadBackspace={handleNumpadBackspace}
          onNominalShortcut={handleNominalShortcut}
          feeDetails={feeDetails}
          checkoutLoading={checkoutLoading}
          onProcessCheckout={handleProcessCheckout}
          formatRp={formatRp}
        />
      )}

      {/* Extracted Modular Components */}
      <PosCartModal
        visible={cartModalOpen}
        isLandscape={isLandscape}
        onClose={() => setCartModalOpen(false)}
        cart={cart}
        totalItemsCount={totalItemsCount}
        totalAmount={totalAmount}
        formatRp={formatRp}
        onClearCart={() => setCart([])}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onProceedToCheckout={() => {
          setCartModalOpen(false);
          setPaidAmount(totalAmount.toString());
          setIsCheckoutView(true);
        }}
      />

      <CustomerPickerModal
        visible={customerModalOpen}
        isLandscape={isLandscape}
        onClose={() => setCustomerModalOpen(false)}
        customers={filteredCustomers}
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
        search={customerSearch}
        onSearchChange={setCustomerSearch}
        formatRp={formatRp}
      />

      <PromoVoucherModal
        visible={promoModalOpen}
        isLandscape={isLandscape}
        onClose={() => setPromoModalOpen(false)}
        availablePromos={availablePromos}
        appliedPromo={appliedPromo}
        onApplyPromo={handleApplyVoucher}
        formatRp={formatRp}
      />

      <TaxFeeModal
        visible={taxModalOpen}
        isLandscape={isLandscape}
        onClose={() => setTaxModalOpen(false)}
        availableTaxes={availableTaxes}
        selectedTaxId={selectedTaxId}
        onSelectTax={setSelectedTaxId}
        formatRp={formatRp}
      />

      <PaymentSuccessModal
        visible={receiptModalOpen}
        isLandscape={isLandscape}
        onClose={() => dispatch({ type: CHECKOUT_ACTION_TYPES.NEW_TRANSACTION })}
        completedTx={completedTx}
        formatRp={formatRp}
      />

      {/* Portrait Barcode Scanner Modal */}
      {!isLandscape && (
        <Modal
          visible={isBarcodeScannerOpen && showBarcodeScanner}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setIsBarcodeScannerOpen(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#09090b' }}>
            <PosBarcodeScannerView
              isLandscape={false}
              compact={compact}
              products={products}
              soundBeep={soundBeep}
              onScanProduct={addToCart}
              onClose={() => setIsBarcodeScannerOpen(false)}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  landscapeRoot: {
    flexDirection: 'row',
    flex: 1,
    height: '100%',
    overflow: 'hidden',
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
});
