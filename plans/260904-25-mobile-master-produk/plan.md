---
title: Master Produk & Inventaris di Mobile
description: Perancangan dan implementasi layar manajemen Master Produk pada aplikasi Mobile (React Native), mencakup katalog master produk, formulir tambah/edit produk, scan barcode kemasan fisik via kamera, penyesuaian stok cepat, dan sinkronisasi real-time dengan katalog kasir POS.
status: pending
priority: P1
effort: 10h
tags: [mobile, master-produk, inventory, product-management, camera-scanner, offline-first, rbac]
created: 2026-09-04
assignee: Fullstack Mobile Specialist
---

# Master Produk & Inventaris di Mobile

## Overview
Menyediakan modul **Manajemen Master Produk langsung dari aplikasi Mobile (HP)** untuk pemilik toko (Owner) dan Manajer UMKM, sehingga mereka dapat menambah produk baru, mengedit harga/nama/kategori, scan barcode fisik kemasan menggunakan kamera HP, dan menyesuaikan stok langsung di genggaman tanpa harus membuka laptop atau Web Dashboard.

Saat ini aplikasi mobile baru menyediakan POS kasir (*read-only* katalog), sehingga jika toko kedatangan barang baru atau ingin mengganti harga di toko fisik, pemilik harus membuka Web Dashboard. Fitur ini menutup gap operasional tersebut secara tuntas.

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Produk (`ProductManagementScreen.js`)
- **Pencarian Cepat & Filter**:
  - Kolom pencarian teks (nama produk, barcode/SKU).
  - Chip horizontal filter kategori (Semua, Makanan, Minuman, Sembako, dsb).
  - Chip filter status stok: *Semua*, *Stok Rendah (< min_stock)*, *Stok Habis (0)*, dan *Non-Aktif*.
- **Kartu Produk yang Informatif (Defensive UI Standard)**:
  - Foto produk (thumbnail kecil) atau placeholder inisial nama jika belum ada foto.
  - Nama produk dan nama kategori.
  - Barcode / SKU yang tertera.
  - **Harga Jual** (teks kontras tebal).
  - **Harga Modal / HPP (`avg_cost`)** (khusus role Owner/Manager dengan opsi sembunyikan/sensor).
  - **Badge Status Stok**:
    - Hijau: Stok aman (> min_stock).
    - Oranye/Kuning: Stok menipis ($\le$ min_stock).
    - Merah: Stok habis (0).
- **Aksi Cepat Tiap Produk**:
  - Tombol **[ Sesuaikan Stok ]** (Quick Stock Adjustment).
  - Tombol **[ Edit Produk ]** (Buka form modal lengkap).
  - Toggle switch aktif/nonaktif produk langsung dari kartu.
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Produk ]` yang menonjol di pojok kanan bawah.

### 2. Formulir Tambah / Edit Produk (`ProductFormModal.js`)
- **Data Identitas Produk**:
  - Nama Produk (wajib).
  - Kategori Produk (dropdown picker dari data kategori toko).
  - Satuan Dasar / Base Unit (dropdown picker dari master satuan, misal pcs, botol, porsi, kg).
  - Barcode / SKU:
    - Input teks manual.
    - **Tombol Kamera Barcode Scanner**: Membuka kamera HP untuk scan barcode kemasan fisik secara instan dan otomatis mengisi kolom barcode tanpa salah ketik.
- **Data Harga & Modal**:
  - Harga Jual (wajib, input format nominal mata uang Rp).
  - Harga Beli / Modal HPP Awal (opsional, untuk perhitungan laba kotor).
- **Pengaturan Stok**:
  - Stok Saat Ini (input kuantitas).
  - Batas Minimum Stok (*Minimum Stock Alert threshold*).
- **Pengaturan Tambahan**:
  - Status Aktif / Dijual di Kasir (switch toggle).
  - Tombol **Hapus Produk** (khusus mode edit dengan dialog konfirmasi keamanan).

### 3. Modal Penyesuaian Stok Cepat (`QuickStockAdjustModal.js`)
- Memungkinkan kasir/owner mencatat stok masuk atau koreksi stok tanpa perlu membuka formulir lengkap.
- Opsi jenis penyesuaian:
  - **Barang Masuk / Pembelian**: Menambah stok (+).
  - **Barang Keluar / Rusak / Kadaluarsa**: Mengurangi stok (-).
  - **Koreksi Stok Nyata (Opname Cepat)**: Menimpa stok menjadi angka fisik terkini.
- Kolom catatan alasan penyesuaian.

### 4. Integrasi Navigasi & Hak Akses (RBAC)
- **Akses Tab Menu**:
  - **Role Owner / Manager**: Ditambahkan tab navigasi **"Produk"** di bottom bar atau shortcut cepat di DashboardScreen (`[ 📦 Kelola Produk ]`) dan SettingsScreen.
  - **Role Kasir**: Tab Produk dapat disembunyikan atau dibatasi menjadi *view-only* (tidak dapat mengubah harga jual atau melihat HPP modal).
- **Sinkronisasi Otomatis ke Kasir POS**:
  - Saat produk baru ditambahkan atau harga diedit di Master Produk, katalog produk di memori POS (`PosScreen.js`) dan cache offline (`offlineStorage.js`) seketika diperbarui secara atomik tanpa perlu restart aplikasi.

---

## Arsitektur Komponen & Struktur File

```
mobile/src/
├── screens/
│   └── ProductManagementScreen.js     # Layar utama master produk (list, search, filter)
├── components/product/
│   ├── ProductCardItem.js             # Komponen kartu produk modular
│   ├── ProductFormModal.js            # Modal form input tambah/edit produk
│   ├── QuickStockAdjustModal.js       # Modal penyesuaian stok cepat (+ / -)
│   └── ProductBarcodeScannerModal.js  # Modal scanner kamera barcode untuk form produk
└── services/
    └── productService.js              # Service wrapper API produk & penyesuaian stok
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Spesifikasi UX/UI Wireframe & Kontrak Endpoint API Backend Produk (`/api/products`, `/api/categories`, `/api/units`) | completed |
| 2 | Mobile: Pembuatan Modul Layanan API Produk (`productService.js`) lengkap dengan integrasi cache offline | completed |
| 3 | Mobile: Pembuatan Layar Utama Master Produk (`ProductManagementScreen.js`) & Komponen Kartu (`ProductCardItem.js`) | completed |
| 4 | Mobile: Pembuatan Modal Form Tambah/Edit Produk (`ProductFormModal.js`) dengan Validasi & Integrasi Kamera Barcode | completed |
| 5 | Mobile: Pembuatan Modal Penyesuaian Stok Cepat (`QuickStockAdjustModal.js`) | pending |
| 6 | Mobile: Integrasi Navigasi Bottom Bar, Hak Akses Role Owner/Kasir di `App.js`, dan Auto-Refresh Katalog POS | pending |
| 7 | Pengujian Komprehensif: Uji CRUD, Uji Kamera Barcode, Uji Offline Fallback, Verifikasi Linter Impeccable, & Build Expo | pending |
