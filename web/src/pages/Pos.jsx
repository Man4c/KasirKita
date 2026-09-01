import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Printer,
  X,
  AlertCircle,
  ShoppingBag,
  Tag,
  ArrowRight,
  Users,
  UserCheck,
  Sparkles,
  TicketPercent,
  ChevronDown,
  Percent,
  Package,
  ReceiptText
} from 'lucide-react';

export default function Pos() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Discount & Vouchers
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [availablePromos, setAvailablePromos] = useState([]);
  const [promoPickerOpen, setPromoPickerOpen] = useState(false);

  // Taxes & Additional Fees
  const [taxesAndFees, setTaxesAndFees] = useState([]);
  const [selectedTaxId, setSelectedTaxId] = useState('');
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [selectedManualFeeIds, setSelectedManualFeeIds] = useState([]);

  // Mobile Drawer State
  const [mobileCartDrawerOpen, setMobileCartDrawerOpen] = useState(false);

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paidAmount, setPaidAmount] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Customer Selection & Quick Register
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [quickAddModalOpen, setQuickAddModalOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: '', phone: '', membership_type: 'REGULAR' });
  const [quickAddSubmitting, setQuickAddSubmitting] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

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
        // Pre-select default tax if present
        const defaultTax = tfData.find((i) => i.is_tax && i.is_default);
        if (defaultTax) setSelectedTaxId(defaultTax.id);
        // Pre-select default manual fees
        const defFees = tfData.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
        setSelectedManualFeeIds(defFees);
      }
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAddCustomer = async (e) => {
    e.preventDefault();
    if (!quickAddForm.name.trim()) {
      setQuickAddError('Nama pelanggan wajib diisi.');
      return;
    }
    try {
      setQuickAddSubmitting(true);
      setQuickAddError('');
      const res = await api.post('/customers', {
        name: quickAddForm.name.trim(),
        phone: quickAddForm.phone.trim() || null,
        membership_type: quickAddForm.membership_type,
      });
      if (res.data.success) {
        const newCust = res.data.data;
        setCustomers((prev) => [newCust, ...prev]);
        setSelectedCustomer(newCust);
        setCustomerDropdownOpen(false);
        setQuickAddModalOpen(false);
        setQuickAddForm({ name: '', phone: '', membership_type: 'REGULAR' });
      }
    } catch (err) {
      setQuickAddError(err.response?.data?.message || 'Gagal mendaftarkan pelanggan baru.');
    } finally {
      setQuickAddSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku_barcode && p.sku_barcode.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const addToCart = (product, chosenUnit = null) => {
    if (Number(product.stock) <= 0) return;

    const baseUnitId = product.base_unit_id || product.conversions?.find(c => c.is_base)?.unit_id;
    const baseUnitName = product.base_unit?.name || product.base_unit?.symbol || 'pcs';
    const targetUnitId = chosenUnit ? chosenUnit.unit_id : baseUnitId;
    const targetUnitName = chosenUnit ? chosenUnit.unit?.name : baseUnitName;
    const targetPrice = chosenUnit ? Number(chosenUnit.price) : Number(product.price);
    const targetFactor = chosenUnit ? Number(chosenUnit.conversion_factor) : 1;
    const cartKey = `${product.id}-${targetUnitId}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      if (existing) {
        const totalBaseQtyNeeded = (existing.quantity + 1) * targetFactor;
        if (totalBaseQtyNeeded > Number(product.stock)) return prev;
        return prev.map((item) =>
          item.cartKey === cartKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          cartKey,
          product,
          unit_id: targetUnitId,
          unit_name: targetUnitName,
          price: targetPrice,
          factor: targetFactor,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (cartKey, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartKey === cartKey) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const totalBaseQtyNeeded = newQty * item.factor;
            if (totalBaseQtyNeeded > Number(item.product.stock)) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const changeItemUnit = (cartKey, newUnitId) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartKey !== cartKey) return item;
        const conv = item.product.conversions?.find((c) => c.unit_id === newUnitId);
        const newFactor = conv ? Number(conv.conversion_factor) : 1;
        const newPrice = conv ? Number(conv.price) : Number(item.product.price);
        const newUnitName = conv?.unit?.name || item.product.base_unit?.name || 'pcs';
        const newCartKey = `${item.product.id}-${newUnitId}`;

        return {
          ...item,
          cartKey: newCartKey,
          unit_id: newUnitId,
          unit_name: newUnitName,
          price: newPrice,
          factor: newFactor,
        };
      })
    );
  };

  const removeFromCart = (cartKey) => {
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAppliedPromo(null);
    setVoucherInput('');
    setVoucherError('');
    setSelectedCustomer(null);
    setCustomerName('');
    setIsTakeaway(false);
    const defaultTax = taxesAndFees.find((i) => i.is_tax && i.is_default);
    setSelectedTaxId(defaultTax ? defaultTax.id : '');
    const defFees = taxesAndFees.filter((i) => !i.is_tax && i.apply_to === 'MANUAL' && i.is_default).map((i) => i.id);
    setSelectedManualFeeIds(defFees);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * Number(item.price), 0);
  const netSubtotal = Math.max(0, subtotal - Number(discount));

  // Taxes
  const availableTaxes = taxesAndFees.filter((i) => i.is_tax && i.is_active);
  const activeTax = availableTaxes.find((i) => i.id === selectedTaxId);
  const taxAmount = activeTax
    ? activeTax.type === 'PERCENTAGE'
      ? Math.round((netSubtotal * Number(activeTax.value)) / 100)
      : Math.round(Number(activeTax.value))
    : 0;

  // Fees
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

  // Re-calculate applied promo when subtotal changes
  useEffect(() => {
    if (appliedPromo) {
      if (subtotal <= 0) {
        handleRemovePromo();
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
  }, [subtotal]);

  // Handle applying a voucher code
  const handleApplyVoucher = async (codeToApply) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    if (!code) return;
    if (subtotal <= 0) {
      setVoucherError('Tambahkan produk ke keranjang terlebih dahulu.');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

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
        setPromoPickerOpen(false);
      }
    } catch (err) {
      console.error('Gagal menerapkan voucher:', err);
      setVoucherError(err.response?.data?.message || 'Kode voucher tidak valid.');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscount(0);
    setVoucherInput('');
    setVoucherError('');
  };

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaidAmount(totalAmount.toString());
    setCheckoutError('');
    setCheckoutModalOpen(true);
  };

  const handleProcessCheckout = async () => {
    if (Number(paidAmount) < totalAmount && paymentMethod === 'CASH') {
      setCheckoutError('Nominal pembayaran kurang dari total belanja.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError('');

    try {
      const payload = {
        customer_id: selectedCustomer ? selectedCustomer.id : null,
        customer_name: selectedCustomer ? selectedCustomer.name : (customerName.trim() || 'Pelanggan Umum'),
        customer_phone: selectedCustomer?.phone || null,
        discount_id: appliedPromo ? appliedPromo.discount_id : null,
        discount_code: appliedPromo ? appliedPromo.discount_code : null,
        discount_amount: appliedPromo ? appliedPromo.discount_amount : Number(discount),
        tax_amount: taxAmount,
        fee_amount: feeAmount,
        fee_details: feeDetails,
        paid_amount: paymentMethod === 'CASH' ? Number(paidAmount) : totalAmount,
        payment_method: paymentMethod,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          unit_id: i.unit_id,
        })),
      };

      const res = await api.post('/pos/checkout', payload);
      if (res.data.success) {
        setCompletedTransaction(res.data.data);
        setCheckoutModalOpen(false);
        setReceiptModalOpen(true);
        clearCart();
        fetchData(); // Refresh product stocks
      }
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Gagal memproses transaksi.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatRp = (num) => {
    return 'Rp' + Number(num || 0).toLocaleString('id-ID');
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col lg:flex-row gap-5 select-none min-h-0">
      {/* Left: Product Catalog & Category Tabs */}
      <section aria-labelledby="catalog-heading" className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <h2 id="catalog-heading" className="sr-only">Katalog Produk</h2>

        {/* Search Bar & Barcode Scanner */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk atau scan barcode..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-10 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1 shrink-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            Semua Produk
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/40'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              Memuat katalog produk...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-zinc-900/40 border border-zinc-800/60 rounded-2xl">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-3 text-zinc-500">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-base font-semibold text-zinc-200">Tidak ada produk yang cocok</p>
              <p className="text-xs text-zinc-500 mt-1">Coba gunakan kata kunci pencarian atau kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-2.5 pr-2.5 pb-24 lg:pb-2">
              {filteredProducts.map((p) => {
                const totalInCartBase = cart
                  .filter((i) => i.product.id === p.id)
                  .reduce((s, i) => s + i.quantity * i.factor, 0);
                const isOutOfStock = Number(p.stock) <= 0;
                const nonBase = (p.conversions || []).filter((c) => !c.is_base);
                const baseUnitSymbol = p.base_unit?.symbol || 'pcs';
                const isBaseForSale = p.is_for_sale !== false;
                const defaultPosUnitConversion = p.default_pos_unit_id && p.default_pos_unit_id !== p.base_unit_id
                  ? p.conversions?.find(c => c.unit_id === p.default_pos_unit_id)
                  : (!isBaseForSale && nonBase.length > 0 ? nonBase[0] : null);

                const primaryDisplayUnit = defaultPosUnitConversion
                  ? defaultPosUnitConversion.unit?.symbol || defaultPosUnitConversion.unit?.name || 'unit'
                  : baseUnitSymbol;

                const primaryDisplayPrice = defaultPosUnitConversion
                  ? Number(defaultPosUnitConversion.price)
                  : Number(p.price);

                const handleCardClick = () => {
                  if (isOutOfStock) return;
                  if (defaultPosUnitConversion) {
                    addToCart(p, defaultPosUnitConversion);
                  } else if (isBaseForSale) {
                    addToCart(p);
                  } else if (nonBase.length > 0) {
                    addToCart(p, nonBase[0]);
                  }
                };

                return (
                  <div
                    key={p.id}
                    className={`relative flex flex-col justify-between p-4 rounded-2xl transition-all group ${
                      isOutOfStock
                        ? 'opacity-40 bg-zinc-900/40 border border-zinc-800/40 cursor-not-allowed'
                        : 'bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-950/20'
                    }`}
                  >
                    {/* Floating In-Cart Badge */}
                    {totalInCartBase > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-950/50 font-mono ring-2 ring-zinc-900 group-hover:ring-zinc-800 transition-all z-10 whitespace-nowrap">
                        {totalInCartBase} {baseUnitSymbol}
                      </span>
                    )}

                    <div onClick={handleCardClick} className="cursor-pointer">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span 
                          className="text-xs font-medium text-zinc-400 truncate min-w-0"
                          title={p.category?.name || 'Umum'}
                        >
                          {p.category?.name || 'Umum'}
                        </span>
                        <span
                          className={`text-xs font-semibold shrink-0 whitespace-nowrap ${
                            Number(p.stock) <= Number(p.min_stock)
                              ? 'text-amber-400'
                              : 'text-zinc-500'
                          }`}
                        >
                          Stok: {Number(p.stock)} {baseUnitSymbol}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-zinc-100 line-clamp-2 min-h-[2.5rem] group-hover:text-rose-400 transition-colors leading-snug">
                        {p.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800/70">
                      <div onClick={handleCardClick} className="cursor-pointer">
                        <span className="text-lg font-bold text-white tracking-tight font-mono">
                          {formatRp(primaryDisplayPrice)}
                        </span>
                        <span className="text-xs text-zinc-400 ml-1">/{primaryDisplayUnit}</span>
                      </div>

                      {/* Multi-Unit Quick Add Buttons */}
                      {(nonBase.length > 0 || !isBaseForSale) && !isOutOfStock && (
                        <div className="mt-2 pt-2 border-t border-zinc-800/50 flex flex-wrap gap-1">
                          {isBaseForSale && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(p);
                              }}
                              className={`px-2 py-1 rounded text-xs font-semibold border transition-colors shrink-0 whitespace-nowrap ${
                                !defaultPosUnitConversion
                                  ? 'bg-zinc-700 text-white border-zinc-600'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700/80'
                              }`}
                            >
                              +1 {baseUnitSymbol}
                            </button>
                          )}
                          {nonBase.map((c) => {
                            const isDefault = defaultPosUnitConversion?.unit_id === c.unit_id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(p, c);
                                }}
                                className={`px-2 py-1 rounded text-xs font-semibold border transition-colors shrink-0 whitespace-nowrap ${
                                  isDefault
                                    ? 'bg-rose-500/25 text-rose-200 border-rose-500/50 font-bold'
                                    : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-white border-rose-500/30'
                                }`}
                              >
                                +1 {c.unit?.symbol} ({formatRp(c.price)})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Right: Desktop Cart & Checkout Panel */}
      <section aria-labelledby="cart-heading" className="hidden lg:flex w-96 flex-col bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-rose-500" />
            <h2 id="cart-heading" className="font-bold text-base text-zinc-100">Keranjang Belanja</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono whitespace-nowrap">
              {cart.reduce((s, i) => s + i.quantity, 0)} baris
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer font-medium"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-4 divide-y divide-zinc-800/60">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 my-auto">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-3 text-zinc-600">
                <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
              </div>
              <p className="text-base font-semibold text-zinc-200">Keranjang masih kosong</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-[220px]">Pilih produk di sebelah kiri untuk menambah ke transaksi</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartKey}
                className="py-3 flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-zinc-200 truncate group-hover:text-rose-400 transition-colors">
                    {item.product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-rose-400 font-semibold font-mono">
                      {formatRp(item.price)}
                    </span>
                    <span className="text-xs text-zinc-400 bg-zinc-800/90 px-1.5 py-0.5 rounded border border-zinc-700/60 font-mono uppercase font-bold">
                      {item.unit_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.cartKey, -1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
                    aria-label="Kurangi jumlah"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-bold text-white w-6 text-center font-mono">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartKey, 1)}
                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
                    aria-label="Tambah jumlah"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.cartKey)}
                    className="w-7 h-7 rounded-lg hover:bg-rose-500/15 hover:text-rose-400 flex items-center justify-center text-zinc-500 transition-colors cursor-pointer ml-0.5"
                    aria-label="Hapus item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Calculations & Bill Summary */}
        <div className="p-4 border-t border-zinc-800/80 space-y-2.5 mt-auto">
          <div className="flex justify-between items-center text-zinc-400 text-xs font-medium">
            <span>Subtotal</span>
            <span className="font-semibold text-zinc-200 font-mono text-sm">{formatRp(subtotal)}</span>
          </div>

          {/* Promo & Voucher Section (Only shown if active promo exists or one is applied) */}
          {(availablePromos.length > 0 || appliedPromo) && (
            <div className="pt-2 border-t border-zinc-800/60">
              {appliedPromo ? (
                <div className="py-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <TicketPercent className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-400 tracking-wider">
                          {appliedPromo.discount_code}
                        </span>
                        <span className="text-emerald-400 font-bold font-mono shrink-0 whitespace-nowrap">
                          (-{formatRp(discount)})
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 truncate">{appliedPromo.discount_name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Batalkan kupon promo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium flex items-center gap-1">
                      <TicketPercent className="w-3.5 h-3.5 text-rose-400" />
                      <span>Kupon / Voucher</span>
                    </span>
                    {availablePromos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setPromoPickerOpen(!promoPickerOpen)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        {promoPickerOpen ? 'Tutup' : `Pilih Promo (${availablePromos.length})`}
                      </button>
                    )}
                  </div>

                  {/* Promo Picker Flat List (No Nested Box) */}
                  {promoPickerOpen && availablePromos.length > 0 && (
                    <div className="py-1 divide-y divide-zinc-800/80 max-h-36 overflow-y-auto">
                      {availablePromos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleApplyVoucher(p.code)}
                          className="w-full text-left py-1.5 px-0.5 hover:text-rose-400 flex items-center justify-between text-xs cursor-pointer gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-rose-400 block">{p.code}</span>
                            <span className="text-zinc-400 truncate block text-xs">{p.name}</span>
                          </div>
                          <span className="text-xs font-semibold text-emerald-400 shrink-0 whitespace-nowrap">
                            {p.type === 'PERCENTAGE' || p.type === 'MIN_SPEND' ? `${parseFloat(p.value)}%` : formatRp(p.value)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Kode promo (misal: HEMAT10)..."
                      value={voucherInput}
                      onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                      className="w-full px-2.5 py-1 text-xs bg-zinc-950/80 border border-zinc-800 focus:border-rose-500 rounded-lg text-zinc-200 font-mono uppercase placeholder-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      disabled={!voucherInput.trim() || voucherLoading}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap"
                    >
                      {voucherLoading ? 'Cek...' : 'Pakai'}
                    </button>
                  </div>

                  {voucherError && (
                    <p className="text-xs text-rose-400 leading-tight">{voucherError}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tax Selector */}
          {availableTaxes.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs gap-2">
              <span className="text-zinc-400 font-medium flex items-center gap-1 shrink-0">
                <Percent className="w-3.5 h-3.5 text-rose-400" />
                <span>Pajak (PPN/PB1)</span>
              </span>
              <select
                value={selectedTaxId}
                onChange={(e) => setSelectedTaxId(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-lg px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer truncate max-w-[150px]"
              >
                <option value="">Tanpa Pajak (0%)</option>
                {availableTaxes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({Number(t.value)}%)
                  </option>
                ))}
              </select>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="truncate">Tarif ({activeTax?.name}):</span>
              <span className="font-mono font-semibold text-zinc-200 shrink-0 whitespace-nowrap">+{formatRp(taxAmount)}</span>
            </div>
          )}

          {/* Operational & Packaging Fees */}
          {taxesAndFees.filter((i) => !i.is_tax && i.is_active && (i.apply_to === 'MANUAL' || i.apply_to === 'TAKEAWAY_ONLY')).length > 0 && (
            <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-xs">
              <span className="text-zinc-400 font-medium flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                <span>Kemasan & Layanan</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {taxesAndFees
                  .filter((i) => !i.is_tax && i.is_active && i.apply_to === 'TAKEAWAY_ONLY')
                  .map((tFee) => (
                    <button
                      key={tFee.id}
                      type="button"
                      onClick={() => setIsTakeaway(!isTakeaway)}
                      className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        isTakeaway
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                      }`}
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Bungkus (+{formatRp(tFee.value)})</span>
                    </button>
                  ))}

                {taxesAndFees
                  .filter((i) => !i.is_tax && i.is_active && i.apply_to === 'MANUAL')
                  .map((mFee) => {
                    const isChecked = selectedManualFeeIds.includes(mFee.id);
                    return (
                      <button
                        key={mFee.id}
                        type="button"
                        onClick={() => {
                          setSelectedManualFeeIds((prev) =>
                            isChecked ? prev.filter((id) => id !== mFee.id) : [...prev, mFee.id]
                          );
                        }}
                        className={`px-2 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-300'
                        }`}
                      >
                        <Package className="w-3 h-3" />
                        <span>{mFee.name} (+{mFee.type === 'PERCENTAGE' ? `${Number(mFee.value)}%` : formatRp(mFee.value)})</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Fee Total Row if > 0 */}
          {feeAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="truncate">Biaya Tambahan ({feeDetails.length}):</span>
              <span className="font-mono font-semibold text-zinc-200 shrink-0 whitespace-nowrap">+{formatRp(feeAmount)}</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-300">Total Tagihan</span>
            <span className="text-2xl font-bold text-rose-500 font-mono tracking-tight">{formatRp(totalAmount)}</span>
          </div>

          {/* Quick Pay CTA Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full mt-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Banknote className="w-4 h-4" />
            <span>Bayar Sekarang ({formatRp(totalAmount)})</span>
          </button>
        </div>
      </section>

      {/* Mobile Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 shadow-lg flex items-center justify-between gap-3">
            <button
              onClick={() => setMobileCartDrawerOpen(true)}
              className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-rose-500 text-white font-bold shrink-0 shadow-sm">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-zinc-900 text-white text-xs font-bold rounded-full border border-rose-500 font-mono">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="truncate">
                <span className="text-xs text-zinc-400 font-medium block">Total Tagihan</span>
                <span className="text-base font-bold text-white font-mono">{formatRp(totalAmount)}</span>
              </div>
            </button>

            <button
              onClick={() => setMobileCartDrawerOpen(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Keranjang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer (Slide-up Bottom Sheet) */}
      {mobileCartDrawerOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col justify-end animate-in fade-in duration-200">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-h-[85vh] flex flex-col p-4 sm:p-6 shadow-xl animate-in slide-in-from-bottom duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingBag className="w-5 h-5 text-rose-500 shrink-0" />
                <h2 className="font-bold text-sm sm:text-base text-white truncate">Keranjang Belanja</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono whitespace-nowrap shrink-0">
                  {cart.reduce((s, i) => s + i.quantity, 0)} item
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-zinc-400 hover:text-rose-400 font-medium px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Kosongkan
                  </button>
                )}
                <button
                  onClick={() => setMobileCartDrawerOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                  aria-label="Tutup keranjang"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Items List */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-zinc-800/60 max-h-[40vh]">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs font-sans">
                  Keranjang belanja kosong.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.cartKey} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-200 truncate">
                        {item.product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-rose-400 font-semibold font-mono">
                          {formatRp(item.price)}
                        </span>
                        <span className="text-xs text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 font-mono uppercase font-bold">
                          {item.unit_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.cartKey, -1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-white w-6 text-center font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.cartKey, 1)}
                        className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 transition-colors cursor-pointer"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.cartKey)}
                        className="w-7 h-7 rounded-lg hover:bg-rose-500/15 hover:text-rose-400 flex items-center justify-center text-zinc-500 transition-colors cursor-pointer ml-0.5"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Footer Calculations */}
            <div className="pt-3 border-t border-zinc-800 space-y-2.5 mt-auto">
              <div className="flex justify-between items-center text-zinc-400 text-xs font-medium">
                <span>Subtotal</span>
                <span className="font-semibold text-zinc-200 font-mono text-sm">{formatRp(subtotal)}</span>
              </div>

              {appliedPromo && (
                <div className="flex items-center justify-between text-xs font-medium text-emerald-400">
                  <span className="flex items-center gap-1">
                    <TicketPercent className="w-3.5 h-3.5" />
                    <span>Diskon Promo ({appliedPromo.discount_code})</span>
                  </span>
                  <span className="font-semibold font-mono">-{formatRp(discount)}</span>
                </div>
              )}

              {/* Tax in Mobile Drawer */}
              {availableTaxes.length > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-400 gap-2">
                  <span className="flex items-center gap-1 shrink-0">
                    <Percent className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pajak (PPN/PB1)</span>
                  </span>
                  <select
                    value={selectedTaxId}
                    onChange={(e) => setSelectedTaxId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-lg px-2 py-1 text-xs text-zinc-200 outline-none cursor-pointer truncate max-w-[150px]"
                  >
                    <option value="">Tanpa Pajak (0%)</option>
                    {availableTaxes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({Number(t.value)}%)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="truncate">Tarif ({activeTax?.name}):</span>
                  <span className="font-mono font-semibold text-zinc-200 shrink-0 whitespace-nowrap">+{formatRp(taxAmount)}</span>
                </div>
              )}

              {/* Fees in Mobile Drawer */}
              {feeAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="truncate">Biaya Tambahan ({feeDetails.length}):</span>
                  <span className="font-mono font-semibold text-zinc-200 shrink-0 whitespace-nowrap">+{formatRp(feeAmount)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-300">Total Tagihan</span>
                <span className="text-2xl font-bold text-rose-500 font-mono tracking-tight">{formatRp(totalAmount)}</span>
              </div>

              <button
                onClick={() => {
                  setMobileCartDrawerOpen(false);
                  handleOpenCheckout();
                }}
                disabled={cart.length === 0}
                className="w-full mt-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <Banknote className="w-4 h-4" />
                <span>Bayar Sekarang ({formatRp(totalAmount)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            role="dialog" 
            aria-labelledby="checkout-title" 
            className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl p-6 relative animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 id="checkout-title" className="text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Penyelesaian Pembayaran</span>
              </h2>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup dialog pembayaran"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Total Bill Summary Section (Non-card divider) */}
            <div className="text-center py-3 mb-4 border-b border-zinc-800">
              <p className="text-xs text-zinc-400 font-medium">Total yang harus dibayar</p>
              <p className="text-2xl font-bold text-rose-500 font-mono mt-1 tracking-tight">{formatRp(totalAmount)}</p>
            </div>

            {/* Customer Selector & Quick Register */}
            <div className="mb-4 relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-zinc-300">
                  Pelanggan / Member
                </label>
                <button
                  type="button"
                  onClick={() => setQuickAddModalOpen(true)}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Member Baru</span>
                </button>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-rose-500/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-rose-400 text-xs shrink-0">
                      {selectedCustomer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">{selectedCustomer.name}</span>
                        {selectedCustomer.membership_type === 'VIP' && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-800 text-purple-300 text-xs font-semibold">VIP</span>
                        )}
                        {selectedCustomer.membership_type === 'WHOLESALE' && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-800 text-amber-300 text-xs font-semibold">Grosir</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 font-mono truncate">{selectedCustomer.phone || 'Tanpa no HP'}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerName('');
                    }}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setCustomerName(e.target.value);
                          setCustomerDropdownOpen(true);
                        }}
                        onFocus={() => setCustomerDropdownOpen(true)}
                        placeholder="Ketik nama atau pilih member..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
                      className="px-3 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs text-zinc-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Pilih</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </button>
                  </div>

                  {customerDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1 divide-y divide-zinc-800/60">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerName('Pelanggan Umum');
                          setCustomerSearch('');
                          setCustomerDropdownOpen(false);
                        }}
                        className="w-full p-2 text-left rounded-lg hover:bg-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-between cursor-pointer"
                      >
                        <span>Pelanggan Umum (Walk-in)</span>
                        <span className="text-xs text-zinc-400 font-normal">Default</span>
                      </button>

                      {customers
                        .filter((c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerSearch))
                        )
                        .slice(0, 8)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerName(c.name);
                              setCustomerSearch('');
                              setCustomerDropdownOpen(false);
                            }}
                            className="w-full p-2 text-left rounded-lg hover:bg-zinc-800 text-xs flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-bold text-white block truncate">{c.name}</span>
                              <span className="text-zinc-400 font-mono text-xs">{c.phone || 'Tanpa no. HP'}</span>
                            </div>
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold uppercase bg-zinc-800 text-zinc-300 shrink-0">
                              {c.membership_type}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Tunai', icon: Banknote },
                  { id: 'QRIS', label: 'QRIS', icon: QrCode },
                  { id: 'TRANSFER', label: 'Transfer', icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-rose-500/15 border-rose-500 text-rose-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === 'QRIS' && feeDetails.some((f) => f.name.toLowerCase().includes('qris')) && (
                <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <QrCode className="w-3.5 h-3.5 shrink-0" />
                    <span>Biaya Admin QRIS:</span>
                  </span>
                  <span className="font-bold font-mono shrink-0 whitespace-nowrap">
                    +{formatRp(feeDetails.filter((f) => f.name.toLowerCase().includes('qris')).reduce((s, f) => s + f.amount, 0))}
                  </span>
                </div>
              )}
            </div>

            {/* Cash Input & Quick Chips */}
            {paymentMethod === 'CASH' && (
              <div className="mb-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Uang Diterima</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3.5 py-2 text-sm text-zinc-100 font-mono font-bold outline-none"
                  />
                </div>

                {/* Quick Cash Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    { label: 'Uang Pas', val: totalAmount },
                    { label: '50.000', val: 50000 },
                    { label: '100.000', val: 100000 },
                    { label: '200.000', val: 200000 },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setPaidAmount(chip.val.toString())}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium font-mono text-zinc-300 whitespace-nowrap cursor-pointer transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Change preview (Borderless row) */}
                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-zinc-300 font-medium">Kembalian:</span>
                  <span className={`font-bold text-base font-mono ${changeAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatRp(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleProcessCheckout}
              disabled={checkoutLoading}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {checkoutLoading ? 'Menyimpan...' : 'Konfirmasi & Selesaikan'}
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal from POS */}
      {quickAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }}
            className="w-full max-w-sm bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 shadow-md relative animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <span>Tambah Member Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuickAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {quickAddError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {quickAddError}
              </div>
            )}

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nama Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                  placeholder="Nama lengkap atau toko..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={quickAddForm.phone}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Tipe Member</label>
                <select
                  value={quickAddForm.membership_type}
                  onChange={(e) => setQuickAddForm({ ...quickAddForm, membership_type: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                >
                  <option value="REGULAR">Reguler</option>
                  <option value="VIP">VIP Member</option>
                  <option value="WHOLESALE">Grosir / Warung</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickAddSubmitting}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  {quickAddSubmitting ? 'Menyimpan...' : 'Simpan & Pilih'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Thermal Receipt Modal */}
      {receiptModalOpen && completedTransaction && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#ffffff' }}
            role="dialog" 
            aria-labelledby="receipt-title" 
            className="printable-receipt w-full max-w-sm text-zinc-900 rounded-2xl shadow-2xl p-6 relative font-mono text-xs animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Close Button */}
            <button
              onClick={() => setReceiptModalOpen(false)}
              className="no-print absolute right-3.5 top-3.5 text-zinc-400 hover:text-zinc-800 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
              aria-label="Tutup struk"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-3 border-b border-dashed border-zinc-400">
              <h2 id="receipt-title" className="font-bold text-base uppercase text-zinc-900 font-sans tracking-tight">KasirKita POS</h2>
              <p className="text-xs text-zinc-600 font-sans">UMKM Ritel Modern</p>
              <p className="text-xs text-zinc-500 mt-1 font-mono">{completedTransaction.invoice_number}</p>
              <p className="text-xs text-zinc-500 font-mono">{new Date(completedTransaction.created_at).toLocaleString('id-ID')}</p>
              <p className="text-xs text-zinc-700 mt-1 font-sans">
                Pelanggan: <span className="font-bold">{completedTransaction.customer_name || 'Pelanggan Umum'}</span>
                {completedTransaction.customer_phone && (
                  <span className="text-zinc-500 block font-mono text-xs">WA: {completedTransaction.customer_phone}</span>
                )}
              </p>
            </div>

            {/* Receipt Items */}
            <div className="space-y-2 py-3 border-b border-dashed border-zinc-400">
              {completedTransaction.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs gap-2">
                  <span className="min-w-0 truncate">{Number(item.quantity)}x {item.product_name}</span>
                  <span className="font-semibold shrink-0 whitespace-nowrap font-mono">{formatRp(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 py-3 text-xs">
              <div className="flex justify-between gap-2">
                <span>Subtotal:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(completedTransaction.subtotal)}</span>
              </div>
              {Number(completedTransaction.discount_amount) > 0 && (
                <div className="flex justify-between text-rose-600 font-medium gap-2">
                  <span>Diskon {completedTransaction.discount_code ? `(${completedTransaction.discount_code})` : ''}:</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">-{formatRp(completedTransaction.discount_amount)}</span>
                </div>
              )}
              {Number(completedTransaction.tax_amount) > 0 && (
                <div className="flex justify-between text-zinc-700 font-medium gap-2">
                  <span>Pajak (PPN/PB1):</span>
                  <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(completedTransaction.tax_amount)}</span>
                </div>
              )}
              {Number(completedTransaction.fee_amount) > 0 && (
                <>
                  <div className="flex justify-between text-zinc-700 font-medium gap-2">
                    <span>Biaya Tambahan:</span>
                    <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(completedTransaction.fee_amount)}</span>
                  </div>
                  {Array.isArray(completedTransaction.fee_details) && completedTransaction.fee_details.map((f, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-500 text-xs pl-2 gap-2">
                      <span>• {f.name}:</span>
                      <span className="shrink-0 whitespace-nowrap font-mono">+{formatRp(f.amount)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between font-bold text-sm pt-1.5 border-t border-dashed border-zinc-300 gap-2">
                <span>TOTAL:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(completedTransaction.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 gap-2">
                <span>Metode:</span>
                <span className="uppercase shrink-0 whitespace-nowrap font-mono">{completedTransaction.payment_method}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span>Bayar:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(completedTransaction.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-xs gap-2">
                <span>Kembali:</span>
                <span className="shrink-0 whitespace-nowrap font-mono">{formatRp(completedTransaction.change_amount)}</span>
              </div>
            </div>

            {/* Footer Greeting */}
            <div className="text-center py-2 text-xs text-zinc-500 border-t border-dashed border-zinc-400 font-sans">
              Terima kasih atas kunjungan Anda!
            </div>

            {/* Action Buttons */}
            <div className="no-print flex gap-2 mt-3 font-sans">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setReceiptModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-rose-950/30"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
