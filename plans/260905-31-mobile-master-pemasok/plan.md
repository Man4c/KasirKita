---
title: Master Pemasok & Distributor di Mobile
description: Perancangan dan implementasi modul manajemen Master Pemasok (Supplier & Distributor) pada aplikasi Mobile (React Native), mencakup ringkasan metrik total pengeluaran kulakan dan frekuensi pasokan barang, pencarian nama distributor/sales, informasi rekening bank transfer untuk restock, formulir modal tambah/edit supplier, tombol aksi hub dashboard, serta integrasi kontak darurat pasokan barang.
status: pending
priority: P2
effort: 5h
tags: [mobile, master-pemasok, supplier, procurement, inventory, bank-account, rbac]
created: 2026-09-05
assignee: Fullstack Mobile Specialist
---

# Master Pemasok & Distributor di Mobile

## Overview
Menyediakan modul **Manajemen Master Pemasok (Supplier / Distributor) langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*). Fitur ini memungkinkan pengguna mencatat identitas distributor resmi, nama kontak sales agen (*Contact Person*), nomor telepon pemesanan barang, alamat gudang distributor, nomor rekening bank untuk pembayaran kulakan/transfer faktur, serta memantau ringkasan total volume pembelian kas belanja toko (*Total Purchases*) dan riwayat frekuensi pasokan masuk (*Restocks Count*).

Sebelumnya, tombol **"Pemasok"** pada *Action Hub Dashboard* (`DashboardActionHub.js`) masih menampilkan alert dialog placeholder. Dengan modul ini, pemilik UMKM dapat mengakses dan memperbarui kontak distributor barang langsung dari ponsel saat bertransaksi di luar toko atau saat menerima barang kiriman kurir distributor.

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Pemasok (`SupplierManagementScreen.js`)
- **Navigasi & Ringkasan Metrik**:
  - Tombol kembali (`ChevronLeft`) ke Dashboard dan tombol refresh data.
  - Tiga kartu metrik ringkasan (*Defensive UI Card*):
    - **Total Pemasok Terdaftar**: Jumlah entitas supplier aktif.
    - **Total Restock**: Akumulasi frekuensi mutasi barang masuk yang tercatat dari pemasok.
    - **Total Belanja Pembelian**: Nilai nominal uang kas yang dibelanjakan ke supplier (`PURCHASE`).
- **Pencarian Cepat & Filter Status**:
  - Kolom pencarian debounced 350ms (nama supplier, nama contact person, no HP sales, atau email).
  - Filter chip status: *Semua*, *Aktif*, dan *Nonaktif*.
- **Daftar Kartu Pemasok (*SupplierCardItem.js*)**:
  - Flexbox pairing: Nama perusahaan supplier (`min-w-0 truncate`) berpasangan dengan badge status dan bank tag (`shrink-0 whitespace-nowrap`).
  - Badge identitas visual oranye hangat (`#fb923c` / `#ea580c`).
  - Informasi kontak & sales person: Ikon orang untuk *Contact Person*, ikon telepon untuk nomor sales.
  - Kartu Rekening Bank (*Bank Info Box*): Nama Bank (BCA/Mandiri/BRI), nomor rekening, dan atas nama pemilik rekening lengkap dengan tombol salin instan (*Copy to clipboard*).
  - Indikator metrik pasokan: "X kali restock" dan "Total belanja Rp Y".
  - Aksi cepat: Panggilan telepon langsung (`Linking.openURL`), tombol Edit data, dan tombol Hapus aman.
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Pemasok ]` mengambang di kanan bawah layar untuk mendaftarkan distributor baru.

### 2. Formulir Tambah / Edit Pemasok (`SupplierFormModal.js`)
- **Informasi Distributor**:
  - Nama Perusahaan / Supplier (wajib, misal: "PT Sumber Pangan Sejahtera", "CV Berkah Jaya").
  - Nama Contact Person / Sales (opsional, misal: "Budi Santoso - Sales Area").
  - Nomor Telepon / WA (opsional, validasi nomor).
  - Email Perusahaan (opsional).
  - Alamat Kantor / Gudang Pengiriman (opsional).
- **Informasi Rekening Bank**:
  - Nama Bank (opsional, misal: BCA, BRI, Mandiri, BNI).
  - Nomor Rekening (opsional, numerik).
  - Nama Pemilik Rekening (opsional).
- **Status & Catatan**:
  - Saklar status pemasok aktif/nonaktif.
  - Catatan termin pembayaran (misal: "Tempo 14 hari", "Wajib bayar tunai di muka").
- **Aksi Simpan & Hapus**:
  - Tombol Simpan Perubahan dengan indikator proses.
  - Tombol Hapus Pemasok aman khusus mode edit (soft delete).

### 3. Layanan API & Penyimpanan Offline (`supplierService.js` & `offlineStorage.js`)
- Wrapper API ke endpoint `/api/suppliers` (Owner only RBAC) dengan penanganan validasi 422 dan otorisasi 403.
- Caching snapshot ke storage `@kasirkita_offline_suppliers` agar data distributor tetap dapat diakses saat koneksi internet offline.

---

## Arsitektur File & Struktur Komponen

```text
mobile/src/
├── screens/
│   └── SupplierManagementScreen.js     # Layar utama master supplier (metrik, filter status, FlatList, search)
├── components/supplier/
│   ├── SupplierCardItem.js             # Kartu distributor (nama, sales, rekening bank, metrik pasokan)
│   └── SupplierFormModal.js            # Modal formulir tambah/edit supplier & data perbankan
└── services/
    └── supplierService.js              # Layanan API supplier (CRUD, search, offline caching)
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi endpoint `/api/suppliers` (GET paginasi, query search, filter status, POST, PUT, DELETE), serta perancangan visual kartu distributor dan info rekening bank dengan standar defensive UI. | completed |
| 2 | **Mobile API Service (`supplierService.js`) & Caching Offline**: Implementasi modul API service dengan proteksi role Owner (403), validasi payload 422, dan fallback ke cache lokal offline (`offlineStorage.js`). | completed |
| 3 | **Komponen Kartu & Layar Utama (`SupplierCardItem.js` & `SupplierManagementScreen.js`)**: Pembuatan kartu supplier dengan badge oranye, info rekening bank (copyable), metrik total pasokan/belanja, aksi panggilan telepon langsung, dan FlatList tervirtualisasi. | completed |
| 4 | **Modal Formulir Tambah/Edit (`SupplierFormModal.js`)**: Pembuatan modal interaktif penambahan/pengeditan data distributor, contact person, rekening bank transfer, catatan tempo pembayaran, dan tombol hapus aman. | pending |
| 5 | **Integrasi Navigasi Hub Menu & Proteksi RBAC**: Menghubungkan tile Pemasok di `DashboardActionHub.js`, registrasi rute di `App.js` dengan proteksi peran khusus Owner, dan aksi kembali ke Dashboard. | pending |
| 6 | **Audit Kualitas, Defensive UI Check, & Uji Coba Multi-Platform**: Audit linter (`node detect.mjs`), uji ekspor Web (`npx expo export --platform web`), verifikasi kepatuhan WCAG readability floor (min. 12px), dan verifikasi sinkronisasi offline-first. | pending |

---

## Standar Defensive UI & Impeccable Craft
1. **The Flexbox Pairing Rule**: Setiap kontainer informasi pada kartu pemasok wajib menggunakan `min-w-0 truncate` untuk nama distributor dan alamat gudang, berpasangan dengan `shrink-0 whitespace-nowrap` untuk badge status dan nomor rekening.
2. **The Readability Floor Rule**: Seluruh teks, nomor rekening, dan label wajib berukuran minimal `text-xs` (12px) tanpa font mikro di bawah standar WCAG.
3. **Copy-to-Clipboard Feedback**: Interaksi salin nomor rekening bank dilengkapi toast/feedback visual instan untuk kenyamanan pemilik toko saat akan melakukan transfer m-Banking.
4. **Resilience & Feedback**: Form modal dilengkapi `KeyboardAvoidingView` dan ScrollView dinamis agar input rekening bank tidak terpotong keyboard virtual.
