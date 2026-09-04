---
title: Master Promosi & Voucher Diskon di Mobile
description: Perancangan dan implementasi modul manajemen Master Promosi & Voucher Diskon pada aplikasi Mobile (React Native), mencakup katalog promosi aktif/kadaluarsa, formulir tambah/edit promo (Persentase, Potongan Nominal, Min. Belanja), pengaturan kuota & masa berlaku, toggle saklar aktif/nonaktif, integrasi peluncur di Action Hub Dashboard, serta sinkronisasi dengan keranjang dan modal promo kasir POS.
status: pending
priority: P1
effort: 8h
tags: [mobile, master-promosi, discounts, vouchers, pricing, offline-first, rbac, pos-sync]
created: 2026-09-04
assignee: Fullstack Mobile Specialist
---

# Master Promosi & Voucher Diskon di Mobile

## Overview
Menyediakan modul **Manajemen Master Promosi & Voucher Diskon langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*) dan Manajer UMKM. Fitur ini memungkinkan pengguna membuat skema promosi penjualan menarik (diskon persentase, potongan nominal langsung, atau syarat minimal belanja), mengatur batas kuota penukaran dan periode aktif tanggal, menyalakan/mematikan promo secara instan (*toggle switch*), melihat riwayat transaksi yang memanfaatkan kupon, serta menghapus promo usang langsung dari genggaman ponsel tanpa harus membuka laptop atau Web Dashboard.

Sebelumnya, tombol **"Promosi"** pada *Action Hub Dashboard* (`DashboardActionHub.js`) masih menampilkan dialog alert placeholder. Dengan modul ini, pengguna dapat mengelola seluruh kampanye promosi toko secara mandiri, yang secara otomatis langsung memperbarui daftar voucher pada modal **Pilih Promo Toko** (`PromoVoucherModal.js`) dan kalkulasi checkout di **Kasir POS** (`PosScreen.js` / `PosCheckoutView.js`).

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Promosi (`PromoManagementScreen.js`)
- **Pencarian Cepat & Filter Status**:
  - Kolom pencarian instan nama promo atau kode voucher (misal: "HEMAT10", "PROMO GAJIAN").
  - Filter chip status: *Semua*, *Aktif*, *Non-Aktif*, dan *Kadaluarsa / Kuota Habis*.
  - Header dengan tombol navigasi kembali (`ChevronLeft`) menuju Dashboard dan tombol refresh data.
  - Kartu metrik ringkasan: Total Promo Berjalan, Voucher Aktif, dan Total Penggunaan Transaksi.
- **Daftar Kartu Kupon Promosi (*Defensive UI Standard*)**:
  - Tampilan kartu bergaya tiket/voucher kupon dengan aksen warna Rose Brand (`#fb7185`).
  - Badge kode kupon dengan tombol salin cepat (`[ PROMO10 ]`).
  - Nilai potongan harga yang kontras & jelas (misal: `Diskon 10%`, `Potongan Rp 15.000`).
  - Syarat & ketentuan ringkas: Minimal belanja (`min_purchase_amount`) & batas maksimal diskon (`max_discount_amount`).
  - **Indikator Kuota & Masa Berlaku**:
    - Progress kuota penukaran (misal: *35 / 100 digunakan* atau *Tanpa Batas Kuota*).
    - Periode berlaku: Tanggal mulai hingga tanggal selesai (dengan penanda otomatis status *Kadaluarsa* jika lewat tanggal).
  - **Aksi Cepat Tiap Kartu**:
    - Saklar toggle aktif/nonaktif (`Switch`) langsung dari kartu.
    - Tombol **[ Edit ]**: Membuka modal formulir ubah data promo.
    - Tombol **[ Hapus ]**: Konfirmasi dialog hapus aman (Soft Delete).
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Promo ]` di pojok kanan bawah layar untuk pembuatan promo baru secara kilat.

### 2. Formulir Tambah / Edit Promosi (`PromoFormModal.js`)
- **Identitas Promosi**:
  - **Kode Kupon / Voucher** (wajib, unik, huruf besar kapital otomatis, misal: `GAJIANHEMAT`, `DISKON50K`).
  - **Nama Promosi** (wajib, nama publik yang muncul di struk & daftar promo kasir).
  - **Deskripsi** (opsional, syarat & ketentuan promo).
- **Jenis Skema Diskon (Type Selector Chips)**:
  1. **Persentase (`PERCENTAGE`)**: Input nilai diskon persen (1 - 100%) dan batas maksimal potongan nominal (opsional).
  2. **Potongan Tetap (`FIXED`)**: Input potongan nominal langsung dalam rupiah (format Rp otomatis).
  3. **Minimal Belanja (`MIN_SPEND`)**: Diskon bersyarat yang mewajibkan total belanja melebihi nominal tertentu.
- **Batasan & Masa Berlaku**:
  - **Minimal Belanja** (opsional, default Rp0 / tanpa syarat belanja).
  - **Maksimal Potongan** (khusus tipe persentase).
  - **Kuota Penggunaan** (opsional, kosongkan jika tanpa batasan kuota).
  - **Periode Aktif**: Tanggal mulai & tanggal selesai (opsional).
- **Pengaturan Status**:
  - Toggle switch `Aktifkan Promo Sekarang`.
  - Tombol **Hapus Promo** (khusus mode edit dengan dialog konfirmasi aman).

### 3. Layanan API & Offline Cache (`discountService.js`)
- Menghubungkan aplikasi mobile ke REST API backend:
  - `GET /api/discounts` (daftar promosi dengan paginasi, search, dan filter type/status).
  - `GET /api/discounts?all=1` (daftar seluruh promo aktif untuk picker kasir).
  - `GET /api/discounts/{id}` (detail promosi & 5 transaksi terakhir pemakai kupon).
  - `POST /api/discounts` (membuat master promo baru).
  - `PUT /api/discounts/{id}` (mengubah parameter promo).
  - `DELETE /api/discounts/{id}` (soft-delete promo).
  - `PATCH /api/discounts/{id}/toggle-status` (saklar instan aktif/nonaktif).
  - `POST /api/discounts/check-voucher` (validasi kupon & kalkulasi potongan keranjang POS).
- **Offline Cache**: Menyimpan snapshot promo aktif di `offlineStorage.js` sehingga kasir POS tetap dapat mengenali diskon saat koneksi internet terputus.

### 4. Integrasi Navigasi, Action Hub, & Sinkronisasi Kasir POS
- **Peluncur Dashboard Action Hub**:
  - Mengarahkan tombol `Promosi` di `DashboardActionHub.js` langsung ke layar `PromoManagementScreen`.
- **Integrasi Navigasi App (`App.js`)**:
  - Mendaftarkan rute internal `promo_management` dengan proteksi Role Owner/Manager.
- **Sinkronisasi Reaktif Otomatis**:
  - Setiap kali promosi baru dibuat, diubah, atau statusnya dimatikan:
    1. Modal pemilih promo di kasir POS (`PromoVoucherModal.js`) langsung memuat ulang daftar voucher aktif.
    2. Keranjang checkout (`PosCheckoutView.js`) merevalidasi kode voucher yang sedang diaplikasikan.

---

## Arsitektur Komponen & Struktur File

```
mobile/src/
├── screens/
│   └── PromoManagementScreen.js       # Layar utama master promosi (list, search, status filter, summary)
├── components/promo/
│   ├── PromoCardItem.js               # Kartu item promo bergaya kupon tiket (kode, diskon, masa berlaku, toggle)
│   └── PromoFormModal.js              # Modal form tambah & edit promo (tipe diskon, kuota, periode, minimal belanja)
└── services/
    └── discountService.js             # Service wrapper API promosi & validasi voucher offline/online
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi endpoint `/api/discounts` (CRUD, check-voucher, toggle-status, filter active/expired) dan perancangan tata letak defensive UI tiket kupon promosi | pending |
| 2 | **Mobile API Service (`discountService.js`)**: Pembuatan modul layanan API diskon & voucher terintegrasi penanganan error validasi 422 (kode duplikat/kuota habis) dan fallback cache lokal `offlineStorage` | pending |
| 3 | **Komponen Kartu & Layar Utama (`PromoCardItem.js` & `PromoManagementScreen.js`)**: Pembuatan layar master promosi dengan pencarian real-time, filter status (Semua, Aktif, Non-Aktif, Kadaluarsa), kartu bergaya voucher dengan aksen Rose Brand (`#fb7185`), progress bar kuota, dan saklar toggle status instan | pending |
| 4 | **Modal Formulir Tambah/Edit (`PromoFormModal.js`)**: Pembuatan form modal interaktif dengan selector skema promo (Persentase, Potongan Rp, Min. Belanja), auto-format kapital kode voucher, batas maksimal diskon, tanggal aktif, dan proteksi hapus | pending |
| 5 | **Integrasi Navigasi Hub Menu & Sinkronisasi Kasir POS**: Menghubungkan peluncur di `DashboardActionHub.js`, rute di `App.js` dengan hak akses Owner, dan sinkronisasi reaktif ke modal pemilihan voucher (`PromoVoucherModal.js`) dan checkout POS | pending |
| 6 | **Pengujian Komprehensif & Verifikasi Impeccable**: Uji alur CRUD promo, uji validasi checkout POS dengan kupon promo aktif/kadaluarsa/kuota habis, verifikasi linter `detect.mjs` (0 defect), dan uji bundling Expo Web | pending |


