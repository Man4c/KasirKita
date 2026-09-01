import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Package,
  Plus,
  Search,
  ArrowUpDown,
  History,
  AlertTriangle,
  Edit2,
  X,
  Check,
  TrendingUp,
  Boxes,
  Layers,
  Scale,
  Trash2,
  Barcode,
  Sparkles,
  Star,
  ArrowRight,
  Info,
  CheckCircle2,
  HelpCircle,
  Lock,
} from 'lucide-react';

// Barcode validation helper (EAN-13, EAN-8, UPC-A, or Custom SKU)
const validateBarcode = (barcode) => {
  if (!barcode || !barcode.trim()) return null;
  const clean = barcode.trim();
  const isNumeric = /^\d+$/.test(clean);

  if (isNumeric && clean.length === 13) {
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checksum = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(clean[12], 10);
    const isIndo = clean.startsWith('899');
    if (checksum === lastDigit) {
      return {
        status: 'valid',
        type: 'EAN-13',
        label: isIndo ? 'EAN-13 Indonesia (899)' : 'EAN-13 Valid',
        color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
      };
    } else {
      return {
        status: 'invalid',
        type: 'EAN-13',
        label: `EAN-13: Digit terakhir harusnya ${checksum}`,
        color: 'text-rose-400 border-rose-500/40 bg-rose-500/10'
      };
    }
  }

  if (isNumeric && clean.length === 8) {
    return { status: 'valid', type: 'EAN-8', label: 'EAN-8 Standard', color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' };
  }

  if (isNumeric && clean.length === 12) {
    return { status: 'valid', type: 'UPC-A', label: 'UPC-A Standard', color: 'text-sky-400 border-sky-500/40 bg-sky-500/10' };
  }

  return {
    status: 'info',
    type: 'CUSTOM',
    label: isNumeric ? `${clean.length} Digit Numerik` : 'Custom SKU / Alfanumerik',
    color: 'text-zinc-400 border-zinc-700 bg-zinc-800/40'
  };
};

const generateRandomEan13 = () => {
  const prefix = '899';
  const middle = Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);
  const code12 = prefix + middle;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code12[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const checksum = (10 - (sum % 10)) % 10;
  return code12 + checksum;
};

// Unit hierarchy ranking for smart direction detection
const UNIT_BULK_RANK = {
  dus: 100,
  karton: 100,
  bal: 90,
  slop: 80,
  lusin: 70,
  lsn: 70,
  rcg: 60,
  renceng: 60,
  kg: 50,
  l: 50,
  liter: 50,
  pack: 30,
  bungkus: 30,
  btl: 20,
  botol: 20,
  g: 10,
  gram: 10,
  ml: 10,
  pcs: 5,
  buah: 5,
  butir: 5,
  biji: 5,
};

// Unit physical family grouping to avoid mismatched unit suggestions (e.g. btl -> kg)
const UNIT_FAMILY_GROUPS = {
  packaging: ['pcs', 'buah', 'btl', 'botol', 'butir', 'biji', 'pack', 'bungkus', 'dus', 'karton', 'krat', 'bal', 'slop', 'lusin', 'lsn', 'rcg', 'renceng'],
  weight: ['g', 'gram', 'kg', 'kilogram', 'ons', 'ton', 'kuintal'],
  volume: ['ml', 'liter', 'l', 'galon'],
};

const getUnitFamily = (symbol) => {
  const s = (symbol || '').toLowerCase();
  for (const [group, members] of Object.entries(UNIT_FAMILY_GROUPS)) {
    if (members.includes(s)) return group;
  }
  return 'other';
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [stockHistoryModalOpen, setStockHistoryModalOpen] = useState(false);
  const [stockMovements, setStockMovements] = useState([]);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);

  // Form State - Product
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    base_unit_id: '',
    default_pos_unit_id: '',
    is_for_sale: true,
    sku_barcode: '',
    price: '',
    avg_cost: '',
    stock: '',
    min_stock: '5',
    description: '',
    conversions: [],
  });

  // Quick Category Modal State
  const [quickCategoryModalOpen, setQuickCategoryModalOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [quickCategoryDesc, setQuickCategoryDesc] = useState('');
  const [quickCategoryLoading, setQuickCategoryLoading] = useState(false);

  const handleQuickAddCategory = async (e) => {
    e.preventDefault();
    if (!quickCategoryName.trim()) return;
    setQuickCategoryLoading(true);
    try {
      const res = await api.post('/categories', {
        name: quickCategoryName.trim(),
        description: quickCategoryDesc.trim() || null,
      });
      if (res.data.success) {
        const newCat = res.data.data;
        setCategories((prev) => [...prev, newCat]);
        setProductForm((prev) => ({ ...prev, category_id: newCat.id }));
        setQuickCategoryModalOpen(false);
        setQuickCategoryName('');
        setQuickCategoryDesc('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan kategori baru.');
    } finally {
      setQuickCategoryLoading(false);
    }
  };

  // Form State - Restock
  const [suppliers, setSuppliers] = useState([]);
  const [restockSupplierId, setRestockSupplierId] = useState('');
  const [restockUnitId, setRestockUnitId] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const [restockUnitCost, setRestockUnitCost] = useState('');
  const [restockNotes, setRestockNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchUnits();
    fetchSuppliers();
  }, [selectedCategory, lowStockOnly]);

  const fetchSuppliers = async () => {
    try {
      const res = await api.get('/suppliers?all=true');
      if (res.data.success) setSuppliers(res.data.data);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/products?per_page=100';
      if (selectedCategory) url += `&category_id=${selectedCategory}`;
      if (lowStockOnly) url += '&low_stock=true';

      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) setCategories(res.data.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get('/units');
      if (res.data.success) setUnits(res.data.data);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchName = p.name.toLowerCase().includes(search.toLowerCase());
    const matchBarcode = p.sku_barcode && p.sku_barcode.toLowerCase().includes(search.toLowerCase());
    const matchConversionBarcode = p.conversions?.some(
      (c) => c.sku_barcode && c.sku_barcode.toLowerCase().includes(search.toLowerCase())
    );
    return matchName || matchBarcode || matchConversionBarcode;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    const defaultBaseUnit = units.find((u) => u.symbol === 'pcs') || units[0];
    const defaultBaseUnitId = defaultBaseUnit?.id ? String(defaultBaseUnit.id) : '';
    setProductForm({
      name: '',
      category_id: categories[0]?.id || '',
      base_unit_id: defaultBaseUnitId,
      default_pos_unit_id: defaultBaseUnitId,
      is_for_sale: true,
      sku_barcode: '',
      price: '',
      avg_cost: '',
      stock: '0',
      min_stock: '5',
      description: '',
      conversions: [],
    });
    setFormError('');
    setProductModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    const baseIdStr = product.base_unit_id ? String(product.base_unit_id) : (units[0]?.id ? String(units[0].id) : '');
    const defaultPosIdStr = product.default_pos_unit_id ? String(product.default_pos_unit_id) : baseIdStr;

    const nonBaseConversions = (product.conversions || [])
      .filter((c) => !c.is_base)
      .map((c) => ({
        unit_id: String(c.unit_id),
        conversion_factor: c.conversion_factor,
        price: c.price,
        sku_barcode: c.sku_barcode || '',
        is_default_pos: c.is_default_pos || String(defaultPosIdStr) === String(c.unit_id),
      }));

    setProductForm({
      name: product.name,
      category_id: product.category_id || '',
      base_unit_id: baseIdStr,
      default_pos_unit_id: defaultPosIdStr,
      is_for_sale: product.is_for_sale !== false,
      sku_barcode: product.sku_barcode || '',
      price: product.price,
      avg_cost: product.avg_cost,
      stock: product.stock,
      min_stock: product.min_stock,
      description: product.description || '',
      conversions: nonBaseConversions,
    });
    setFormError('');
    setProductModalOpen(true);
  };

  const handleAddConversionRow = () => {
    const availableUnits = units.filter(
      (u) => String(u.id) !== String(productForm.base_unit_id) && !productForm.conversions.some((c) => String(c.unit_id) === String(u.id))
    );
    if (availableUnits.length === 0) return;

    const baseFamily = selectedBaseUnit ? getUnitFamily(selectedBaseUnit.symbol) : 'other';
    const harmoniousUnits = availableUnits.filter((u) => {
      const candidateFamily = getUnitFamily(u.symbol);
      return baseFamily !== 'other' && candidateFamily === baseFamily;
    });

    const candidateUnit = (harmoniousUnits.length > 0 ? harmoniousUnits : availableUnits).find((u) =>
      ['dus', 'karton', 'krat', 'pack', 'bal', 'slop', 'kg', 'liter'].includes(u.symbol.toLowerCase())
    ) || (harmoniousUnits.length > 0 ? harmoniousUnits[0] : availableUnits[0]);

    const newUnitId = String(candidateUnit.id);
    const shouldBeDefaultPos = !productForm.is_for_sale && (
      !productForm.default_pos_unit_id ||
      String(productForm.default_pos_unit_id) === String(productForm.base_unit_id) ||
      productForm.conversions.length === 0
    );

    setProductForm({
      ...productForm,
      default_pos_unit_id: shouldBeDefaultPos ? newUnitId : productForm.default_pos_unit_id,
      conversions: [
        ...productForm.conversions,
        {
          unit_id: newUnitId,
          conversion_factor: '',
          price: '',
          sku_barcode: '',
          is_default_pos: shouldBeDefaultPos,
        },
      ],
    });
  };

  const handleRemoveConversionRow = (idx) => {
    const removedUnitId = String(productForm.conversions[idx]?.unit_id);
    const updated = [...productForm.conversions];
    updated.splice(idx, 1);
    let newDefaultPos = productForm.default_pos_unit_id;
    if (String(newDefaultPos) === removedUnitId) {
      newDefaultPos = productForm.is_for_sale
        ? String(productForm.base_unit_id)
        : (updated[0]?.unit_id ? String(updated[0].unit_id) : '');
    }
    setProductForm({
      ...productForm,
      conversions: updated,
      default_pos_unit_id: newDefaultPos,
    });
  };

  const handleUpdateConversionRow = (idx, field, value) => {
    const updated = [...productForm.conversions];
    const oldUnitId = String(updated[idx].unit_id);
    updated[idx][field] = field === 'unit_id' ? String(value) : value;
    let newDefaultPos = productForm.default_pos_unit_id;
    if (field === 'unit_id' && String(newDefaultPos) === oldUnitId) {
      newDefaultPos = String(value);
    }
    setProductForm({
      ...productForm,
      conversions: updated,
      default_pos_unit_id: newDefaultPos,
    });
  };

  const handleSwapUnits = (idx) => {
    const conv = productForm.conversions[idx];
    if (!conv) return;

    const oldBaseUnitId = String(productForm.base_unit_id);
    const newBaseUnitId = String(conv.unit_id);

    const updatedConversions = [...productForm.conversions];
    updatedConversions[idx] = {
      ...conv,
      unit_id: oldBaseUnitId,
    };

    setProductForm((prev) => ({
      ...prev,
      base_unit_id: newBaseUnitId,
      default_pos_unit_id: String(prev.default_pos_unit_id) === oldBaseUnitId ? newBaseUnitId : prev.default_pos_unit_id,
      conversions: updatedConversions,
    }));
  };

  const handleCloseProductModal = () => {
    if (!editingProduct) {
      const isDirty = Boolean(
        productForm.name ||
        productForm.price ||
        productForm.sku_barcode ||
        productForm.conversions.length > 0
      );
      if (isDirty && !window.confirm('Tutup tanpa menyimpan? Data produk yang baru diinput akan hilang.')) {
        return;
      }
    }
    setProductModalOpen(false);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    if (!productForm.is_for_sale && productForm.conversions.length === 0) {
      setFormError('Jika Satuan Eceran tidak dijual, Anda wajib menambahkan minimal 1 Satuan Kemasan untuk dijual ke pelanggan.');
      setFormLoading(false);
      return;
    }

    const payload = { ...productForm };
    if (!payload.is_for_sale) {
      if (!payload.default_pos_unit_id || String(payload.default_pos_unit_id) === String(payload.base_unit_id)) {
        payload.default_pos_unit_id = payload.conversions[0]?.unit_id ? String(payload.conversions[0].unit_id) : '';
      }
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan produk.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    try {
      setLoading(true);
      await api.delete(`/products/${deleteConfirmProduct.id}`);
      setDeleteConfirmProduct(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus produk.');
      setDeleteConfirmProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockUnitId(product.base_unit_id);
    setRestockSupplierId('');
    setRestockQty('10');
    setRestockUnitCost(product.avg_cost.toString());
    setRestockNotes('Restock kulakan');
    setFormError('');
    setRestockModalOpen(true);
  };

  // Calculate live moving average cost preview with UoM conversion factor
  const selectedRestockConversion = restockProduct?.conversions?.find(
    (c) => c.unit_id === restockUnitId && !c.is_base
  );
  const conversionFactor = selectedRestockConversion ? Number(selectedRestockConversion.conversion_factor) : 1;
  const chosenUnitName = selectedRestockConversion?.unit?.name || restockProduct?.base_unit?.name || 'pcs';

  const previewCurrentStock = restockProduct ? Number(restockProduct.stock) : 0;
  const previewCurrentCost = restockProduct ? Number(restockProduct.avg_cost) : 0;
  const inputQty = Number(restockQty) || 0;
  const inputUnitCost = Number(restockUnitCost) || 0;

  const baseQtyIncoming = inputQty * conversionFactor;
  const totalPurchaseCost = inputQty * inputUnitCost;
  const previewTotalStock = previewCurrentStock + baseQtyIncoming;
  const previewNewAvgCost = previewTotalStock > 0
    ? ((previewCurrentStock * previewCurrentCost) + totalPurchaseCost) / previewTotalStock
    : (baseQtyIncoming > 0 ? totalPurchaseCost / baseQtyIncoming : 0);

  const handleSaveRestock = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await api.post(`/products/${restockProduct.id}/restock`, {
        quantity: inputQty,
        unit_cost: inputUnitCost,
        unit_id: restockUnitId,
        supplier_id: restockSupplierId || null,
        notes: restockNotes,
      });
      setRestockModalOpen(false);
      fetchProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Gagal mencatat restock.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewHistory = async (product) => {
    setSelectedProductForHistory(product);
    try {
      const res = await api.get(`/products/${product.id}/stock-movements`);
      if (res.data.success) {
        setStockMovements(res.data.data.data);
        setStockHistoryModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching stock movements:', err);
    }
  };

  const formatRp = (num) => {
    const val = Number(num || 0);
    if (Math.abs(val) >= 100 || Number.isInteger(val)) {
      return 'Rp' + Math.round(val).toLocaleString('id-ID');
    }
    return 'Rp' + val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  // Derived calculations for Product Form (Poin 1, 2, 4, 5, 6, 8)
  const selectedBaseUnit = units.find((u) => String(u.id) === String(productForm.base_unit_id));
  const baseBarcodeValidation = validateBarcode(productForm.sku_barcode);

  const basePriceNum = parseFloat(productForm.price) || 0;
  const baseCostNum = parseFloat(productForm.avg_cost) || 0;
  const baseMarginRp = basePriceNum - baseCostNum;
  const baseMarginPct = basePriceNum > 0 ? ((baseMarginRp / basePriceNum) * 100).toFixed(1) : 0;
  const isLossBase = productForm.is_for_sale && baseCostNum > basePriceNum && basePriceNum > 0;
  const isZeroMarginBase = productForm.is_for_sale && baseCostNum === basePriceNum && basePriceNum > 0;
  const isProfitBase = productForm.is_for_sale && basePriceNum > baseCostNum && baseCostNum > 0;

  // Build sorted hierarchy chain for visual display (Poin 5)
  const allUnitsHierarchy = [
    {
      name: selectedBaseUnit?.name || '-',
      symbol: selectedBaseUnit?.symbol || '-',
      factor: 1,
      price: productForm.is_for_sale
        ? (productForm.price !== '' && !isNaN(productForm.price) && Number(productForm.price) > 0 ? basePriceNum : null)
        : 'GUDANG',
      is_base: true,
      is_default_pos: String(productForm.default_pos_unit_id) === String(productForm.base_unit_id),
    },
    ...productForm.conversions.map((c) => {
      const u = units.find((un) => String(un.id) === String(c.unit_id));
      const hasFactor = c.conversion_factor !== '' && c.conversion_factor !== null && !isNaN(c.conversion_factor) && Number(c.conversion_factor) > 0;
      const hasPrice = c.price !== '' && c.price !== null && !isNaN(c.price) && Number(c.price) > 0;
      return {
        name: u?.name || 'Kemasan',
        symbol: u?.symbol || '-',
        factor: hasFactor ? parseFloat(c.conversion_factor) : null,
        price: hasPrice ? parseFloat(c.price) : null,
        is_base: false,
        is_default_pos: String(productForm.default_pos_unit_id) === String(c.unit_id),
      };
    }),
  ].sort((a, b) => {
    const factorA = a.factor !== null ? a.factor : -1;
    const factorB = b.factor !== null ? b.factor : -1;
    return factorB - factorA;
  });

  // Available units that haven't been added yet
  const availableUnitsToAdd = units.filter(
    (u) => String(u.id) !== String(productForm.base_unit_id) && !productForm.conversions.some((c) => String(c.unit_id) === String(u.id))
  );
  const baseFamily = selectedBaseUnit ? getUnitFamily(selectedBaseUnit.symbol) : 'other';
  const harmoniousUnits = availableUnitsToAdd.filter((u) => {
    const candidateFamily = getUnitFamily(u.symbol);
    return baseFamily !== 'other' && candidateFamily === baseFamily;
  });

  const nextHarmoniousUnit = harmoniousUnits.find((u) =>
    ['dus', 'karton', 'krat', 'pack', 'bal', 'slop', 'kg', 'liter'].includes(u.symbol.toLowerCase())
  ) || harmoniousUnits[0];

  // Hanya tampilkan saran tebakan satuan jika satuan berikutnya SEIRAMA (satu famili fisik)
  const addConversionBtnLabel = nextHarmoniousUnit && selectedBaseUnit
    ? `Tambah Konversi (${nextHarmoniousUnit.symbol}/${selectedBaseUnit.symbol})`
    : 'Tambah Satuan Kemasan';

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-500" />
            <span>Manajemen Inventaris & Multi-Satuan (UoM)</span>
          </h2>
          <p className="text-sm text-zinc-300 mt-1 max-w-lg leading-relaxed">
            Sistem perpetual otomatis, multi-konversi satuan (Dus / Pcs / Kg), dan valuasi HPP Moving Average Cost
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-zinc-900 border border-zinc-800/80 p-3.5 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produk atau scan barcode..."
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 rounded-xl px-10 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:border-rose-500"
          >
            <option value="">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
              lowStockOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Stok Menipis</span>
          </button>
        </div>
      </div>

      {/* Product Catalog Table */}
      <div 
        style={{ backgroundColor: '#18181b' }} 
        className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-5 shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="pb-3.5 pr-4">Nama Produk & Barcode</th>
                <th className="pb-3.5 px-4">Satuan & Konversi</th>
                <th className="pb-3.5 px-4">Harga Jual Base</th>
                <th className="pb-3.5 px-4">HPP Base (Avg Cost)</th>
                <th className="pb-3.5 px-4">Stok Base Saat Ini</th>
                <th className="pb-3.5 pl-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm">
                    Memuat data produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-400 text-sm">
                    Tidak ada data produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = Number(p.stock) <= Number(p.min_stock);
                  const nonBase = (p.conversions || []).filter((c) => !c.is_base);
                  const baseUnitSymbol = p.base_unit?.symbol || 'pcs';

                  return (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-zinc-100 text-sm">{p.name}</p>
                        <p className="text-xs text-zinc-400 font-mono mt-0.5">{p.sku_barcode || '-'}</p>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700/70 text-rose-400 font-mono text-xs font-bold w-fit uppercase shrink-0 whitespace-nowrap">
                            <Scale className="w-3 h-3" />
                            Base: {p.base_unit?.name || 'Pieces'}
                          </span>
                          {nonBase.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {nonBase.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-xs text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 font-mono shrink-0 whitespace-nowrap"
                                >
                                  1 {c.unit?.symbol} = {Number(c.conversion_factor)} {baseUnitSymbol} ({formatRp(c.price)})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-sm text-zinc-100 whitespace-nowrap">
                        {formatRp(p.price)}
                        <span className="text-xs font-normal text-zinc-400 ml-1">/{baseUnitSymbol}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-300 font-medium font-mono text-xs whitespace-nowrap">
                        {formatRp(p.avg_cost)}
                        <span className="text-xs font-normal text-zinc-500 ml-1">/{baseUnitSymbol}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono text-xs font-semibold whitespace-nowrap">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isLow ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                          <span className={isLow ? 'text-amber-300 font-bold' : 'text-zinc-200'}>
                            {Number(p.stock)} {baseUnitSymbol}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRestock(p)}
                            title="Restock Barang Masuk"
                            className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => handleViewHistory(p)}
                            title="Kartu Stok Mutasi"
                            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                            aria-label="Riwayat mutasi stok"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Produk"
                            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                            aria-label="Edit produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmProduct(p)}
                            title="Hapus Produk"
                            className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            aria-label="Hapus produk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Product with Multi-UoM Conversions */}
      {productModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseProductModal(); }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-rose-500 shrink-0" />
                <span>{editingProduct ? 'Perbarui Data Produk' : 'Tambah Produk Baru'}</span>
              </h2>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal produk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {formError}
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveProduct} className="pt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Contoh: Kopi Susu Aren Botol 250ml"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 7. Kategori with Quick Add */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-300">Kategori</label>
                    <button
                      type="button"
                      onClick={() => setQuickCategoryModalOpen(true)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                      title="Tambah kategori baru tanpa menutup modal"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Kategori Baru</span>
                    </button>
                  </div>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 outline-none focus:border-rose-500"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Satuan Eceran Terkecil */}
                <div>
                  <div className="flex items-center justify-between mb-1 min-h-[20px]">
                    <label className="font-semibold text-zinc-300">
                      Satuan Eceran Terkecil <span className="text-rose-500">*</span>
                    </label>
                  </div>
                  <select
                    required
                    value={productForm.base_unit_id}
                    onChange={(e) => {
                      const newBaseId = String(e.target.value);
                      setProductForm((prev) => ({
                        ...prev,
                        base_unit_id: newBaseId,
                        default_pos_unit_id: String(prev.default_pos_unit_id) === String(prev.base_unit_id) ? newBaseId : prev.default_pos_unit_id,
                        conversions: prev.conversions.filter((c) => String(c.unit_id) !== newBaseId),
                      }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-semibold outline-none focus:border-rose-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* 1. Barcode Eceran with Validation & Random Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-zinc-300">Barcode Eceran</label>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, sku_barcode: generateRandomEan13() })}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                      title="Generate barcode acak 13 digit EAN-13 Indonesia valid"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Acak (899)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={productForm.sku_barcode}
                    onChange={(e) => setProductForm({ ...productForm, sku_barcode: e.target.value })}
                    placeholder="899100... atau SKU"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-rose-500"
                  />
                  {baseBarcodeValidation && (
                    <div className={`mt-1.5 px-2 py-1 rounded-md border text-xs flex items-center gap-1.5 font-medium ${baseBarcodeValidation.color}`}>
                      {baseBarcodeValidation.status === 'valid' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : baseBarcodeValidation.status === 'invalid' ? (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <Info className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span className="truncate">{baseBarcodeValidation.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2 & 6. Harga Jual & Modal / HPP with Margin/Loss Real-time Warnings */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-zinc-300 whitespace-nowrap">
                        Harga Jual Eceran (Rp) {productForm.is_for_sale && <span className="text-rose-500">*</span>}
                      </label>
                      {productForm.is_for_sale && productForm.conversions.length > 0 && (
                        String(productForm.default_pos_unit_id) === String(productForm.base_unit_id) ? (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            Satuan POS
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, default_pos_unit_id: String(productForm.base_unit_id) })}
                            className="text-xs text-zinc-400 hover:text-amber-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors shrink-0 whitespace-nowrap"
                            title="Jadikan Satuan Eceran sebagai default transaksi kasir POS"
                          >
                            <Star className="w-2.5 h-2.5" />
                            Jadikan Satuan POS
                          </button>
                        )
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="number"
                        required={productForm.is_for_sale}
                        disabled={!productForm.is_for_sale}
                        min="0"
                        value={productForm.is_for_sale ? productForm.price : ''}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder={productForm.is_for_sale ? 'Contoh: 15000' : 'Tidak dijual eceran (Gudang)'}
                        className={`w-full bg-zinc-950 border rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500 font-bold ${
                          !productForm.is_for_sale
                            ? 'border-amber-500/30 opacity-60 cursor-not-allowed bg-zinc-950/80 text-amber-300/80'
                            : 'border-zinc-800'
                        }`}
                      />
                      {!productForm.is_for_sale && (
                        <Lock className="w-3.5 h-3.5 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1">
                      <label className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!productForm.is_for_sale}
                          onChange={(e) => {
                            const isWholesaleOnly = e.target.checked;
                            const forSale = !isWholesaleOnly;
                            setProductForm((prev) => {
                              let newDefaultPos = prev.default_pos_unit_id;
                              if (forSale) {
                                if (!newDefaultPos || !prev.conversions.some((c) => String(c.unit_id) === String(newDefaultPos))) {
                                  newDefaultPos = String(prev.base_unit_id);
                                }
                              } else {
                                if (String(newDefaultPos) === String(prev.base_unit_id) || !newDefaultPos) {
                                  newDefaultPos = prev.conversions[0]?.unit_id ? String(prev.conversions[0].unit_id) : '';
                                }
                              }
                              return {
                                ...prev,
                                is_for_sale: forSale,
                                default_pos_unit_id: newDefaultPos,
                              };
                            });
                          }}
                          className="w-3.5 h-3.5 rounded border-zinc-700 text-rose-500 focus:ring-0 bg-zinc-950 cursor-pointer"
                        />
                        <span className={!productForm.is_for_sale ? 'text-amber-400 font-semibold' : ''}>
                          Khusus grosir (tidak diecer ke pelanggan)
                        </span>
                      </label>

                      {!productForm.is_for_sale && (
                        <p className="text-xs text-amber-400/90 flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Satuan eceran hanya untuk stok gudang. Tambahkan minimal 1 satuan kemasan di bawah untuk dijual ke pelanggan.</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1 whitespace-nowrap">Modal / HPP Eceran (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      disabled={!!editingProduct}
                      value={productForm.avg_cost}
                      onChange={(e) => setProductForm({ ...productForm, avg_cost: e.target.value })}
                      placeholder="Contoh: 9000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Real-time Loss Warning / Margin Banner */}
                {isLossBase && (
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      <strong>Peringatan Rugi:</strong> Modal/HPP ({formatRp(baseCostNum)}) lebih tinggi dari Harga Jual ({formatRp(basePriceNum)}). Anda berpotensi rugi <strong>{formatRp(Math.abs(baseMarginRp))} ({baseMarginPct}%)</strong> per {selectedBaseUnit?.symbol || '-'}!
                    </span>
                  </div>
                )}

                {isZeroMarginBase && (
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Harga Jual sama persis dengan Modal/HPP (Margin Keuntungan 0%).</span>
                  </div>
                )}

                {isProfitBase && (
                  <div className="flex items-center justify-between text-xs text-emerald-400 py-1 px-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Estimasi Keuntungan Eceran:
                    </span>
                    <span className="font-bold font-mono">
                      +{formatRp(baseMarginRp)} ({baseMarginPct}%)
                    </span>
                  </div>
                )}
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">Stok Awal Eceran</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="0"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-zinc-300 mb-1">Peringatan Minimum Stok Eceran</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.min_stock}
                      onChange={(e) => setProductForm({ ...productForm, min_stock: e.target.value })}
                      placeholder="5"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-400 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              )}

              {/* 4, 5, 6, 8. Multi-UoM Conversions Section */}
              <div className="pt-3 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-white text-xs sm:text-sm">Konversi Satuan Grosir / Kemasan Lain</span>
                  </div>
                  <button
                    type="button"
                    disabled={availableUnitsToAdd.length === 0}
                    onClick={handleAddConversionRow}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{addConversionBtnLabel}</span>
                  </button>
                </div>

                {/* Visual Hierarchy Chain (Poin 5) */}
                {allUnitsHierarchy.length > 1 && (
                  <div className="py-2 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-rose-400" />
                      <span>Rantai Hierarki Satuan & Harga Jual:</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {allUnitsHierarchy.map((u, i) => (
                        <React.Fragment key={i}>
                          <div className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                            u.is_default_pos
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-bold'
                              : 'bg-zinc-900 border-zinc-700 text-zinc-200'
                          }`}>
                            {u.is_default_pos && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                            <span>
                              {u.is_base
                                ? `1 ${u.name} (${u.symbol})`
                                : u.factor !== null
                                ? `1 ${u.name} = ${u.factor} ${selectedBaseUnit?.symbol || '-'}`
                                : `1 ${u.name} (Isi belum ditentukan)`
                              }
                            </span>
                            {u.price === 'GUDANG' ? (
                              <span className="text-zinc-500 italic ml-1">(Gudang)</span>
                            ) : u.price !== null && u.price > 0 ? (
                              <span className="font-mono text-rose-400 font-bold ml-1">{formatRp(u.price)}</span>
                            ) : (
                              <span className="text-zinc-500 italic ml-1">(Harga belum diisi)</span>
                            )}
                          </div>
                          {i < allUnitsHierarchy.length - 1 && (
                            <ArrowRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {productForm.conversions.length === 0 ? (
                  <p className="py-4 px-4 text-zinc-400 text-xs text-center italic max-w-md mx-auto leading-relaxed">
                    Belum ada satuan kemasan. Produk ini hanya disimpan dan direstock dalam Satuan Eceran.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {productForm.conversions.map((conv, idx) => {
                      const convUnit = units.find((u) => String(u.id) === String(conv.unit_id));
                      const shortConvUnitName = convUnit ? convUnit.name.split('/')[0].trim() : 'Kemasan';
                      const convFactor = parseFloat(conv.conversion_factor) || 1;
                      const hasConvPrice = conv.price !== '' && conv.price !== null && !isNaN(conv.price) && Number(conv.price) > 0;
                      const convPrice = hasConvPrice ? parseFloat(conv.price) : 0;
                      const equivalentPricePerBase = convFactor > 0 ? convPrice / convFactor : 0;
                      const convHpp = baseCostNum * convFactor;
                      const convMargin = convPrice - convHpp;
                      const convMarginPct = convPrice > 0 ? ((convMargin / convPrice) * 100).toFixed(1) : 0;
                      const convBarcodeValidation = validateBarcode(conv.sku_barcode);

                      const expectedRetailTotal = basePriceNum * convFactor;
                      const diffRetail = convPrice - expectedRetailTotal;
                      const diffRetailPct = expectedRetailTotal > 0 ? (((convPrice - expectedRetailTotal) / expectedRetailTotal) * 100).toFixed(1) : 0;

                      const isDefaultPosThis = String(productForm.default_pos_unit_id) === String(conv.unit_id);

                      // Smart reverse unit detection (misal Base Unit = Dus, Kemasan = Pack)
                      const baseSymbolLower = (selectedBaseUnit?.symbol || '').toLowerCase();
                      const convSymbolLower = (convUnit?.symbol || '').toLowerCase();
                      const baseRank = UNIT_BULK_RANK[baseSymbolLower] || 0;
                      const convRank = UNIT_BULK_RANK[convSymbolLower] || 0;
                      const isReverseUnit = baseRank > 0 && convRank > 0 && baseRank > convRank;

                      return (
                        <div
                          key={idx}
                          className={`pt-3.5 pb-2 ${
                            idx > 0 ? 'border-t border-zinc-800/80' : ''
                          } ${
                            isDefaultPosThis ? 'pl-3 border-l-2 border-l-amber-500' : ''
                          } space-y-2.5 transition-all`}
                        >
                          {/* Card Header with Defensive Truncate */}
                          <div className="flex items-center justify-between gap-2 pb-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-bold text-zinc-200 text-xs truncate">
                                Satuan #{idx + 1}: {convUnit ? `${convUnit.name} (${convUnit.symbol})` : 'Pilih Kemasan'}
                              </span>
                              {isDefaultPosThis && (
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold flex items-center gap-1 shrink-0 whitespace-nowrap">
                                  <Star className="w-3 h-3 fill-amber-400" />
                                  Satuan Kasir POS
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <label className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 font-semibold cursor-pointer select-none whitespace-nowrap">
                                <input
                                  type="radio"
                                  name="default_pos_unit"
                                  checked={isDefaultPosThis}
                                  onChange={() => setProductForm({ ...productForm, default_pos_unit_id: String(conv.unit_id) })}
                                  className="text-amber-500 focus:ring-0 cursor-pointer"
                                />
                                <span>Jadikan Satuan POS</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveConversionRow(idx)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                                title="Hapus Konversi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Reverse Unit Alert & One-click Fix (Poin 1 & Poin 2) */}
                          {isReverseUnit && (
                            <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                                <span>
                                  <strong>Arah Satuan Terbalik:</strong> Satuan Eceran ({selectedBaseUnit?.name}) umumnya lebih besar dari Satuan Kemasan ({convUnit?.name}). Dalam sistem kasir & stok, Satuan Eceran harus selalu menjadi satuan fisik terkecil (misal {convUnit?.name}).
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleSwapUnits(idx)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 font-bold border border-amber-500/50 text-xs shrink-0 cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                              >
                                Tukar: Jadikan {convUnit?.symbol} Satuan Eceran
                              </button>
                            </div>
                          )}

                          {/* Inputs Grid: Restructured to 2 spacious rows ($layout) */}
                          <div className="space-y-3">
                            {/* Baris 1: Spesifikasi Kemasan & Jumlah Isi */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-zinc-300 mb-1">
                                  Satuan Kemasan <span className="text-rose-500">*</span>
                                </label>
                                <select
                                  value={conv.unit_id}
                                  onChange={(e) => handleUpdateConversionRow(idx, 'unit_id', e.target.value)}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 font-semibold outline-none focus:border-rose-500"
                                >
                                  {units
                                    .filter((u) => String(u.id) !== String(productForm.base_unit_id))
                                    .map((u) => (
                                      <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>
                                    ))}
                                </select>
                              </div>

                              <div>
                                <label className="block font-semibold text-zinc-300 mb-1">
                                  Isi per 1 {convUnit?.symbol || 'Kemasan'} <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    step="0.0001"
                                    min="0.0001"
                                    required
                                    value={conv.conversion_factor}
                                    onChange={(e) => handleUpdateConversionRow(idx, 'conversion_factor', e.target.value)}
                                    placeholder="Contoh: 12"
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-rose-500 pr-14"
                                  />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono pointer-events-none">
                                    {selectedBaseUnit?.symbol || '-'}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-1">
                                  1 {convUnit?.symbol || 'kemasan'} = {conv.conversion_factor || '...'} {selectedBaseUnit?.symbol || '-'}
                                </p>
                              </div>
                            </div>

                            {/* Baris 2: Harga Jual & Barcode Kemasan */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-semibold text-zinc-300 mb-1">
                                  Harga Jual 1 {convUnit?.symbol ? convUnit.symbol : 'Kemasan'} (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={conv.price}
                                  onChange={(e) => handleUpdateConversionRow(idx, 'price', e.target.value)}
                                  placeholder={
                                    productForm.price && conv.conversion_factor
                                      ? `Contoh: ${Number(productForm.price) * Number(conv.conversion_factor)}`
                                      : 'Contoh: 120000'
                                  }
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 font-mono font-bold outline-none focus:border-rose-500"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="font-semibold text-zinc-300">Barcode Kemasan</label>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateConversionRow(idx, 'sku_barcode', generateRandomEan13())}
                                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                                    title="Generate barcode acak 13 digit EAN-13 Indonesia valid"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    <span>Acak (899)</span>
                                  </button>
                                </div>
                                <input
                                  type="text"
                                  value={conv.sku_barcode || ''}
                                  onChange={(e) => handleUpdateConversionRow(idx, 'sku_barcode', e.target.value)}
                                  placeholder={`Barcode ${shortConvUnitName}`}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 font-mono outline-none focus:border-rose-500"
                                />
                                {convBarcodeValidation && (
                                  <div className={`mt-1.5 px-2 py-1 rounded-md border text-xs flex items-center gap-1.5 font-medium ${convBarcodeValidation.color}`}>
                                    {convBarcodeValidation.status === 'valid' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    ) : convBarcodeValidation.status === 'invalid' ? (
                                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    ) : (
                                      <Info className="w-3.5 h-3.5 shrink-0" />
                                    )}
                                    <span className="truncate">{convBarcodeValidation.label}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Footer: Kesetaraan Eceran, Diskon Grosir, & Margin */}
                          <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex flex-wrap items-center gap-2 text-zinc-400 min-w-0">
                              {hasConvPrice ? (
                                <>
                                  <span className="whitespace-nowrap">
                                    Setara: <strong className="text-zinc-200 font-mono">{formatRp(equivalentPricePerBase)}</strong>/{selectedBaseUnit?.symbol || '-'}
                                  </span>
                                  {productForm.is_for_sale && basePriceNum > 0 && diffRetailPct < 0 && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shrink-0 whitespace-nowrap">
                                      Hemat {Math.abs(diffRetailPct)}% (Grosir)
                                    </span>
                                  )}
                                  {productForm.is_for_sale && basePriceNum > 0 && Number(diffRetailPct) > 20 && (
                                    <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30 shrink-0 whitespace-nowrap">
                                      +{diffRetailPct}% lebih mahal dari total eceran
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-zinc-500 italic whitespace-nowrap">
                                  Setara: (Harga kemasan belum diisi)
                                </span>
                              )}
                            </div>

                            {hasConvPrice && baseCostNum > 0 && (
                              <div className="flex items-center gap-2 font-mono text-xs shrink-0 whitespace-nowrap">
                                <span className="text-zinc-400">Modal/HPP: {formatRp(convHpp)}</span>
                                <span className={`font-bold ${convMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  Margin: {convMargin >= 0 ? `+${formatRp(convMargin)}` : formatRp(convMargin)} ({convMarginPct}%)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseProductModal}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/40 cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Restock with Multi-UoM Conversion Preview */}
      {restockModalOpen && restockProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 relative"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>Restock Barang Masuk</span>
                </h2>
                <p className="text-xs md:text-sm text-zinc-300 mt-1">{restockProduct.name}</p>
              </div>
              <button
                onClick={() => setRestockModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup modal restock"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveRestock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Pemasok / Distributor (Opsional)</label>
                <select
                  value={restockSupplierId}
                  onChange={(e) => setRestockSupplierId(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold outline-none focus:border-rose-500"
                >
                  <option value="">-- Tanpa Pemasok / Pembelian Umum --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.contact_person ? `(${s.contact_person})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Satuan Pembelian (Kulakan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={restockUnitId}
                  onChange={(e) => {
                    setRestockUnitId(e.target.value);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 font-semibold outline-none focus:border-rose-500"
                >
                  <option value={restockProduct.base_unit_id}>
                    {restockProduct.base_unit?.name || 'Satuan Eceran'} (1x Eceran)
                  </option>
                  {(restockProduct.conversions || [])
                    .filter((c) => !c.is_base)
                    .map((c) => (
                      <option key={c.unit_id} value={c.unit_id}>
                        {c.unit?.name} ({Number(c.conversion_factor)} {restockProduct.base_unit?.symbol || 'pcs'})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Jumlah Masuk ({chosenUnitName}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    min="0.0001"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    placeholder="10"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-400 font-bold font-mono outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-300 mb-1">
                    Harga Beli / {chosenUnitName} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={restockUnitCost}
                    onChange={(e) => setRestockUnitCost(e.target.value)}
                    placeholder="10000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-400 font-bold font-mono outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Catatan / Supplier</label>
                <input
                  type="text"
                  value={restockNotes}
                  onChange={(e) => setRestockNotes(e.target.value)}
                  placeholder="Restock Toko Sejahtera"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 placeholder-zinc-400 outline-none focus:border-rose-500"
                />
              </div>

              {/* Moving Average Cost Formula Preview Section */}
              <div className="py-3 border-t border-b border-zinc-800 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Kalkulasi Otomatis Modal / HPP Eceran:</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400 font-mono">
                  <div>Stok Fisik Saat Ini: <span className="font-semibold text-zinc-200">{previewCurrentStock} {restockProduct.base_unit?.symbol || 'pcs'}</span></div>
                  <div>HPP Eceran Saat Ini: <span className="font-semibold text-zinc-200">{formatRp(previewCurrentCost)}</span></div>
                  <div>Penambahan Eceran: <span className="font-semibold text-emerald-400">+{baseQtyIncoming} {restockProduct.base_unit?.symbol || 'pcs'}</span></div>
                  <div>Total Kas Keluar: <span className="font-semibold text-rose-400">{formatRp(totalPurchaseCost)}</span></div>
                  <div>Total Stok Eceran Baru: <span className="font-semibold text-emerald-400">{previewTotalStock} {restockProduct.base_unit?.symbol || 'pcs'}</span></div>
                  <div>HPP Eceran Baru: <span className="font-semibold text-rose-400">{formatRp(previewNewAvgCost)}</span></div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/40 cursor-pointer"
                >
                  {formLoading ? 'Memproses...' : 'Konfirmasi Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Stock Card History */}
      {stockHistoryModalOpen && selectedProductForHistory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }} 
            className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-md p-6 relative max-h-[85vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-rose-500 shrink-0" />
                  <span>Kartu Stok Mutasi (Digital Stock Card)</span>
                </h2>
                <p className="text-xs md:text-sm text-zinc-300 mt-1">{selectedProductForHistory.name}</p>
              </div>
              <button
                onClick={() => setStockHistoryModalOpen(false)}
                className="p-1.5 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup riwayat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 text-zinc-400 font-semibold text-xs uppercase">
                  <tr>
                    <th className="py-3 px-3.5">Tanggal</th>
                    <th className="py-3 px-3.5">Tipe</th>
                    <th className="py-3 px-3.5">Mutasi</th>
                    <th className="py-3 px-3.5">Sisa Stok</th>
                    <th className="py-3 px-3.5">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-zinc-400 text-sm font-sans">
                        Belum ada riwayat mutasi stok.
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-800/30">
                        <td className="py-2.5 px-3.5 text-zinc-300 text-xs font-mono">
                          {new Date(m.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                m.type === 'IN'
                                  ? 'bg-emerald-400'
                                  : m.type === 'SALE'
                                  ? 'bg-rose-400'
                                  : 'bg-amber-400'
                              }`}
                            ></span>
                            <span
                              className={
                                m.type === 'IN'
                                  ? 'text-emerald-400'
                                  : m.type === 'SALE'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }
                            >
                              {m.type}
                            </span>
                          </div>
                        </td>
                        <td className={`py-2.5 px-3.5 font-bold ${m.quantity > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-100 font-bold">
                          {m.balance_after}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-300 text-xs font-sans">
                          {m.notes || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Category Modal */}
      {quickCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div 
            style={{ backgroundColor: '#18181b' }} 
            className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-xl p-5 relative"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-500" />
                <span>Tambah Kategori Baru</span>
              </h3>
              <button
                onClick={() => setQuickCategoryModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                aria-label="Tutup modal tambah kategori"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">
                  Nama Kategori <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  placeholder="Contoh: Makanan Instan, Sembako, Minuman"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Deskripsi (Opsional)</label>
                <input
                  type="text"
                  value={quickCategoryDesc}
                  onChange={(e) => setQuickCategoryDesc(e.target.value)}
                  placeholder="Keterangan singkat kategori..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQuickCategoryModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={quickCategoryLoading || !quickCategoryName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {quickCategoryLoading ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Produk */}
      {deleteConfirmProduct && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteConfirmProduct(null); }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 relative">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Hapus Produk?</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Konfirmasi penghapusan barang inventaris</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 mb-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-white">"{deleteConfirmProduct.name}"</strong>?
            </p>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
              <span>Produk akan diarsipkan dari daftar aktif inventaris. Riwayat transaksi kasir di masa lalu tetap aman dan tercatat.</span>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold cursor-pointer transition-colors text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold cursor-pointer transition-colors text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Produk</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
