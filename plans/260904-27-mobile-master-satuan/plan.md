---
title: Master Satuan Barang di Mobile
description: Perancangan dan implementasi modul manajemen Master Satuan Barang (Unit of Measure / UoM) pada aplikasi Mobile (React Native), mencakup katalog satuan dengan hitungan produk & konversi terkait, formulir tambah/edit simbol & nama satuan, proteksi penghapusan satuan yang digunakan produk, integrasi peluncur di Action Hub Dashboard, serta sinkronisasi dengan unit picker di Master Produk dan Kasir POS.
status: pending
priority: P1
effort: 8h
tags: [mobile, master-satuan, uom, unit-management, offline-first, rbac, product-sync]
created: 2026-09-04
assignee: Fullstack Mobile Specialist
---

# Master Satuan Barang di Mobile

## Overview
Menyediakan modul **Manajemen Master Satuan Barang (*Unit of Measure / UoM*) langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*) dan Manajer UMKM. Fitur ini memungkinkan pengguna membuat, mengubah nama satuan, simbol satuan (misal: `pcs`, `kg`, `box`, `cup`, `botol`), serta deskripsi penggunaan satuan, melihat hitungan produk yang menggunakannya sebagai *Base Unit* maupun satuan *Konversi Multi-UoM*, dan menghapus satuan yang tidak lagi digunakan langsung dari genggaman ponsel tanpa harus membuka laptop atau Web Dashboard.

Sebelumnya, tombol **"Satuan"** pada *Action Hub Dashboard* (`DashboardActionHub.js`) masih memicu dialog alert placeholder. Dengan implementasi modul ini, pengguna dapat mengelola master satuan toko secara mandiri, yang secara otomatis langsung memperbarui daftar pilihan unit satuan pada modal **Tambah/Edit Produk** (`ProductFormModal.js`), modal **Penyesuaian Stok** (`QuickStockAdjustModal.js`), dan selector satuan di katalog **Kasir POS** (`PosScreen.js`).

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Satuan (`UnitManagementScreen.js`)
- **Pencarian Cepat & Header Ringkas**:
  - Kolom pencarian instan nama satuan atau simbol (misal: "botol", "kg", "pcs").
  - Header dengan tombol navigasi kembali (`ChevronLeft`) menuju Dashboard dan tombol refresh data.
  - Kartu ringkasan metrik: Total Satuan Terdaftar & Satuan Aktif Digunakan Produk.
- **Daftar Kartu Satuan (*Defensive UI Standard*)**:
  - Badge simbol satuan dengan kontras tinggi (misal: `[ PCS ]`, `[ KG ]`, `[ BOX ]`) dengan styling aksen ungu modern (`#c084fc`).
  - Nama lengkap satuan (`font-bold`, kontras jelas, `min-w-0 truncate`).
  - Deskripsi opsional peruntukan satuan.
  - **Badge Jumlah Penggunaan**:
    - Menampilkan hitungan `products_count` (sebagai satuan dasar produk).
    - Menampilkan hitungan `conversions_count` (sebagai satuan multi-konversi grosir/eceran).
  - Indikator status keterpakaian: Tag hijau *"Digunakan Produk"* vs tag abu-abu *"Bisa Dihapus"*.
- **Aksi Cepat Tiap Kartu**:
  - Tombol **[ Edit ]**: Membuka modal formulir ubah data satuan.
  - Tombol **[ Hapus ]**: Konfirmasi dialog hapus aman (dilengkapi validasi penolakan jika satuan masih digunakan produk aktif).
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Satuan ]` di pojok kanan bawah layar untuk entri kilat.

### 2. Formulir Tambah / Edit Satuan (`UnitFormModal.js`)
- **Input Data Satuan**:
  - **Nama Satuan** (wajib, misal: *"Pieces"*, *"Kilogram"*, *"Karton / Dus"*, *"Botol"*).
  - **Simbol Satuan** (wajib, unik, huruf kecil/singkatan, misal: `pcs`, `kg`, `box`, `btl`, `cup`). Otomatis di-trim dan divalidasi keunikan simbolnya.
  - **Deskripsi / Keterangan** (opsional, penjelasan konteks penggunaan).
  - **Preset Cepat (Quick Chips)**: Tombol chip rekomendasi satuan umum untuk ritel/F&B Indonesia (*pcs, btl, box, porsi, cup, kg, gr, ltr, sachet, pack*) untuk pengisian instan 1-ketukan (*one-tap autofill*).
- **Validasi & Penanganan Error**:
  - Validasi simbol wajib diisi dan belum pernah terdaftar (*422 Unprocessable Content - Unique Symbol*).
  - Proteksi aksi hapus di mode edit: Menolak proses hapus jika `products_count > 0` atau `conversions_count > 0` sesuai aturan integritas data backend Laravel.

### 3. Layanan API & Offline Cache (`unitService.js`)
- Menghubungkan aplikasi mobile ke REST API backend:
  - `GET /api/units` (mengambil daftar satuan dengan hitungan relasi `products` & `conversions`).
  - `GET /api/units/{id}` (detail satuan).
  - `POST /api/units` (membuat master satuan baru).
  - `PUT /api/units/{id}` (mengubah nama, simbol, atau deskripsi).
  - `DELETE /api/units/{id}` (menghapus satuan tidak terpakai).
- **Offline Cache**: Menyimpan cache data satuan di `offlineStorage.js` sehingga form produk dan pemilihan satuan di POS tetap dapat beroperasi lancar saat koneksi internet offline.

### 4. Integrasi Navigasi, Action Hub, & Sinkronisasi Produk
- **Peluncur Dashboard Action Hub**:
  - Mengarahkan tombol `Satuan` di `DashboardActionHub.js` langsung ke layar `UnitManagementScreen`.
- **Integrasi Navigasi App (`App.js`)**:
  - Mendaftarkan rute internal `unit_management` dengan proteksi Role Owner/Manager.
- **Sinkronisasi Reaktif Otomatis**:
  - Setiap kali satuan baru ditambahkan atau diubah, pembaruan otomatis tercermin pada:
    1. Selector satuan dasar di form Master Produk (`ProductFormModal.js`).
    2. Pilihan satuan pada modal penyesuaian stok kilat (`QuickStockAdjustModal.js`).
    3. Katalog multi-satuan di layar kasir POS (`PosScreen.js`).

---

## Arsitektur Komponen & Struktur File

```
mobile/src/
├── screens/
│   └── UnitManagementScreen.js        # Layar utama master satuan (list, search, summary metrics)
├── components/unit/
│   ├── UnitCardItem.js                # Kartu item satuan (simbol badge, nama, usage count, aksi)
│   └── UnitFormModal.js               # Modal form tambah & edit satuan dengan preset chips
└── services/
    └── unitService.js                 # Service wrapper API satuan & sinkronisasi cache offline
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi endpoint `/api/units` (CRUD + withCount products & conversions) dan perancangan tata letak defensive UI layar master satuan | pending |
| 2 | **Mobile API Service (`unitService.js`)**: Pembuatan modul layanan API satuan terintegrasi dengan penanganan error responsif, parser validasi 422 simbol unik, dan fallback cache lokal `offlineStorage` | pending |
| 3 | **Komponen Kartu & Layar Utama (`UnitCardItem.js` & `UnitManagementScreen.js`)**: Pembuatan layar master satuan dengan pencarian real-time, badge simbol bergaya ungu modern, statistik penggunaan produk, dan tombol aksi cepat | pending |
| 4 | **Modal Formulir Tambah/Edit (`UnitFormModal.js`)**: Pembuatan form modal interaktif dengan chip preset satuan populer Indonesia (pcs, box, btl, kg, dll), validasi simbol unik, dan proteksi penghapusan satuan berelasi | pending |
| 5 | **Integrasi Navigasi Hub Menu & Sinkronisasi Master Produk/POS**: Menghubungkan peluncur di `DashboardActionHub.js`, rute di `App.js` dengan hak akses Owner, dan sinkronisasi reaktif ke selector satuan di form produk & POS | pending |
| 6 | **Pengujian Komprehensif & Verifikasi Impeccable**: Uji alur CRUD, uji proteksi penghapusan satuan bertaut produk/konversi, verifikasi linter `detect.mjs` (0 defect), dan uji bundling Expo Web | pending |

