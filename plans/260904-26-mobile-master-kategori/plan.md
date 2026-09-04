---
title: Master Kategori di Mobile
description: Perancangan dan implementasi layar manajemen Master Kategori pada aplikasi Mobile (React Native), mencakup katalog kategori dengan hitungan produk terkait, formulir tambah/edit kategori, proteksi penghapusan kategori bertaut, integrasi peluncur di Action Hub Dashboard, serta sinkronisasi otomatis dengan filter katalog kasir POS dan Master Produk.
status: pending
priority: P1
effort: 8h
tags: [mobile, master-kategori, category-management, offline-first, rbac, pos-sync]
created: 2026-09-04
assignee: Fullstack Mobile Specialist
---

# Master Kategori di Mobile

## Overview
Menyediakan modul **Manajemen Master Kategori langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*) dan Manajer UMKM. Fitur ini memungkinkan pengguna membuat, mengubah nama/deskripsi/slug, melihat jumlah produk aktif yang tergabung dalam kategori tersebut, serta menghapus kategori kosong langsung dari ponsel tanpa harus membuka Web Dashboard di laptop.

Saat ini tombol **"Kategori"** pada *Action Hub Dashboard* masih menampilkan dialog alert placeholder. Dengan implementasi modul ini, pengguna dapat mengatur departemen dan kategori barang toko secara mandiri, yang secara otomatis langsung memperbarui daftar filter kategori di layar **Kasir POS** (`PosScreen.js`) dan layar **Master Produk** (`ProductManagementScreen.js`).

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Kategori (`CategoryManagementScreen.js`)
- **Pencarian Cepat & Header Ringkas**:
  - Kolom pencarian instan nama kategori atau deskripsi.
  - Header dengan tombol kembali (`ChevronLeft`) menuju Dashboard dan tombol refresh data.
  - Ringkasan statistik ringkas: Total Kategori & Kategori Aktif Berisi Produk.
- **Daftar Kartu Kategori (*Defensive UI Standard*)**:
  - Ikon penanda visual kategori (`FolderTree` atau palet aksen warna dinamis).
  - Nama kategori (`font-bold`, kontras tinggi, `min-w-0 truncate`).
  - Slug unik kategori (`text-xs`, font monospace/muted).
  - Deskripsi opsional kategori.
  - **Badge Jumlah Produk**: Menampilkan hitungan `products_count` (misal: *"12 Produk"*, *"0 Produk"*).
  - Tag status: Indikator visual apakah kategori kosong (*Aman Dihapus*) atau memiliki relasi produk (*Terpakai*).
- **Aksi Tiap Kartu Kategori**:
  - Tombol **[ Edit ]**: Membuka modal formulir ubah kategori.
  - Tombol **[ Hapus ]**: Konfirmasi penghapusan aman dengan peringatan jika masih ada produk terkait.
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Kategori ]` menonjol di pojok kanan bawah untuk akses cepat.

### 2. Formulir Tambah / Edit Kategori (`CategoryFormModal.js`)
- **Input Data Kategori**:
  - **Nama Kategori** (wajib, misal: "Makanan Berat", "Minuman Dingin", "Snack").
  - **Slug Kategori** (opsional, otomatis digenerate dari nama, namun dapat dikustomisasi).
  - **Deskripsi** (opsional, catatan pengelompokan barang).
- **Validasi & Proteksi**:
  - Validasi nama minimal 2 karakter, pencegahan duplikasi nama.
  - Status loading & penanganan error backend (*422 Validation Error*).
- **Aksi Hapus Terpadu (Mode Edit)**:
  - Tombol **Hapus Kategori** di modal edit dengan proteksi validasi: menolak hapus jika `products_count > 0` sesuai aturan backend Laravel.

### 3. Layanan API & Offline Cache (`categoryService.js`)
- Menghubungkan aplikasi mobile ke REST API backend:
  - `GET /api/categories` (mengambil daftar kategori beserta `products_count`).
  - `GET /api/categories/{id}` (detail kategori & produk aktifnya).
  - `POST /api/categories` (membuat kategori baru).
  - `PUT /api/categories/{id}` (mengubah data kategori).
  - `DELETE /api/categories/{id}` (menghapus kategori kosong).
- **Offline Cache**: Menyimpan cache kategori di `offlineStorage.js` sehingga daftar kategori tetap dapat diakses saat koneksi internet offline/terputus.

### 4. Integrasi Navigasi, Action Hub, & Sinkronisasi POS
- **Peluncur Dashboard Action Hub**:
  - Menghubungkan tile tombol `Kategori` di `DashboardActionHub.js` ke layar `CategoryManagementScreen`.
- **Integrasi Navigasi App (`App.js`)**:
  - Pendaftaran rute internal `category_management` dengan proteksi Role Owner/Manager.
- **Sinkronisasi Reaktif**:
  - Saat kategori baru dibuat atau diedit, event/callback memperbarui:
    1. Filter kategori di `PosScreen.js`.
    2. Picker kategori di modal `ProductFormModal.js`.
    3. Filter kategori di `ProductManagementScreen.js`.

---

## Arsitektur Komponen & Struktur File

```
mobile/src/
├── screens/
│   └── CategoryManagementScreen.js    # Layar utama master kategori (list, search, summary)
├── components/category/
│   ├── CategoryCardItem.js            # Kartu item kategori (nama, slug, product badge, aksi)
│   └── CategoryFormModal.js           # Modal form tambah & edit kategori
└── services/
    └── categoryService.js             # Service wrapper API kategori & offline cache
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi endpoint `/api/categories` (CRUD + products_count protection) dan perancangan tata letak defensive UI layar master kategori | completed |
| 2 | **Mobile API Service (`categoryService.js`)**: Pembuatan modul layanan API kategori terintegrasi dengan penanganan error responsif dan fallback cache lokal `offlineStorage` | completed |
| 3 | **Komponen Kartu & Layar Utama (`CategoryCardItem.js` & `CategoryManagementScreen.js`)**: Pembuatan layar master kategori dengan pencarian real-time, badge jumlah produk, indikator kategori kosong, dan tombol aksi | completed |
| 4 | **Modal Formulir Tambah/Edit (`CategoryFormModal.js`)**: Pembuatan form modal interaktif dengan auto-generate slug, validasi field wajib, dan proteksi aksi hapus kategori | completed |
| 5 | **Integrasi Navigasi Hub Menu & Sinkronisasi POS/Produk**: Menghubungkan peluncur di `DashboardActionHub.js`, rute di `App.js` dengan hak akses Owner, dan sinkronisasi reaktif ke filter kasir POS & Master Produk | completed |
| 6 | **Pengujian Komprehensif & Verifikasi Impeccable**: Uji alur CRUD, uji proteksi penghapusan kategori berproduk, verifikasi linter `detect.mjs` (0 defect), dan uji bundling Expo Web | pending |
