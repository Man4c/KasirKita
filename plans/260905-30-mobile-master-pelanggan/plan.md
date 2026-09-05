---
title: Master Pelanggan & Keanggotaan di Mobile
description: Perancangan dan implementasi modul manajemen Master Pelanggan (Customer) dan Keanggotaan (Membership REGULAR, VIP, WHOLESALE) pada aplikasi Mobile (React Native), mencakup ringkasan metrik total belanja dan kunjungan, pencarian cepat nama/telepon, filter level member, formulir modal tambah/edit pelanggan, integrasi WhatsApp direct call/chat, tombol aksi hub dashboard, serta sinkronisasi reaktif dengan Customer Picker kasir POS.
status: pending
priority: P1
effort: 6h
tags: [mobile, master-pelanggan, customer, membership, pos-sync, whatsapp, offline-first, rbac]
created: 2026-09-05
assignee: Fullstack Mobile Specialist
---

# Master Pelanggan & Keanggotaan di Mobile

## Overview
Menyediakan modul **Manajemen Master Pelanggan (Customer & Membership) langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*) dan Manajer kasir UMKM. Fitur ini memungkinkan pengguna mencatat kontak pelanggan setia, mengatur tingkat keanggotaan (*Reguler*, *VIP*, *Grosir/Wholesale*), memantau akumulasi riwayat belanja dan frekuensi kunjungan transaksi, melakukan panggilan/chat WhatsApp langsung, serta mengelola data pelanggan secara mandiri tanpa harus membuka Web Dashboard.

Sebelumnya, tombol **"Pelanggan"** pada *Action Hub Dashboard* (`DashboardActionHub.js`) masih menampilkan alert dialog placeholder. Dengan modul ini, pemilik usaha dapat mengelola basis data pelanggan toko langsung dari genggaman. Perubahan data pelanggan akan tersinkronisasi secara instan ke modal pemilihan pelanggan di kasir POS (`CustomerPickerModal.js` / `PosCheckoutView.js`) dan penyimpanan lokal offline (`offlineStorage.js`).

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Pelanggan (`CustomerManagementScreen.js`)
- **Navigasi & Ringkasan Metrik**:
  - Tombol kembali (`ChevronLeft`) ke Dashboard dan tombol refresh data interaktif.
  - Kartu metrik ringkasan (*Defensive UI Card*): Total Pelanggan, Member VIP/Grosir, dan Total Akumulasi Belanja Pelanggan.
- **Pencarian Cepat & Filter Segmented**:
  - Kolom pencarian debounced 350ms (nama, nomor telepon WhatsApp, atau email).
  - Tab segmented keanggotaan:
    - **Semua**: Seluruh pelanggan terdaftar.
    - **VIP**: Pelanggan kategori VIP khusus loyalty.
    - **Grosir**: Pelanggan kategori partai besar / wholesale.
    - **Reguler**: Pelanggan umum/standar.
  - Filter chip status: *Semua*, *Aktif*, dan *Nonaktif*.
- **Daftar Kartu Pelanggan (*CustomerCardItem.js*)**:
  - Flexbox pairing: Nama pelanggan dan kontak (`min-w-0 truncate`) berpasangan dengan badge membership dan status (`shrink-0 whitespace-nowrap`).
  - Badge membership yang mencolok:
    - **VIP**: Aksen Emas/Amber (`#fbbf24`).
    - **WHOLESALE**: Aksen Biru Laut (`#38bdf8`).
    - **REGULAR**: Aksen Teal/Emerald (`#2dd4bf`).
  - Indikator metrik mikro: Total transaksi belanja (misal: "12 Transaksi") dan akumulasi nominal belanja (misal: "Rp 1.450.000").
  - Aksi cepat: Tombol WhatsApp/Telepon langsung (`Linking.openURL`), tombol Edit, dan tombol Hapus aman.
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah Pelanggan ]` mengambang di kanan bawah untuk pendaftaran member baru.

### 2. Formulir Tambah / Edit Pelanggan (`CustomerFormModal.js`)
- **Identitas Pelanggan**:
  - Nama Lengkap (wajib).
  - Nomor Telepon / WhatsApp (wajib, unik, validasi angka).
  - Email (opsional).
  - Alamat Domisili / Pengiriman (opsional).
- **Tingkat Keanggotaan & Status**:
  - Segmented selector: `REGULAR`, `VIP`, `WHOLESALE`.
  - Saklar status pelanggan aktif/nonaktif.
  - Catatan preferensi belanja / alergi / instruksi toko (opsional).
- **Aksi Simpan & Hapus**:
  - Tombol simpan dengan indikator loading state.
  - Tombol hapus aman khusus mode pengeditan (soft delete).

### 3. Layanan API & Penyimpanan Offline (`customerService.js` & `offlineStorage.js`)
- Wrapper API ke endpoint `/api/customers` dengan penanganan error validasi 422 (nomor HP duplikat, dll).
- Sinkronisasi snapshot lokal ke storage `@kasirkita_offline_customers` untuk menjamin pencarian pelanggan tetap berfungsi saat toko tanpa jaringan internet.

---

## Arsitektur File & Struktur Komponen

```text
mobile/src/
├── screens/
│   └── CustomerManagementScreen.js     # Layar utama master pelanggan (metrik, filter tab, FlatList, search)
├── components/customer/
│   ├── CustomerCardItem.js             # Kartu item profil member (nama, nomor WA, badge VIP/Grosir, total belanja)
│   └── CustomerFormModal.js            # Modal form pendaftaran/edit pelanggan & pemilihan membership
└── services/
    └── customerService.js              # Layanan API pelanggan (CRUD, query filter, offline fallback)
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi endpoint `/api/customers` (GET paginasi, pencarian nama/phone, filter membership, POST, PUT, DELETE), serta perancangan tata letak kartu profil member dengan standar defensive UI. | completed |
| 2 | **Mobile API Service (`customerService.js`) & Caching Offline**: Implementasi modul API service terintegrasi validasi error 422, format nomor telepon Indonesia, dan sinkronisasi cache lokal offline (`offlineStorage.js`). | completed |
| 3 | **Komponen Kartu & Layar Utama (`CustomerCardItem.js` & `CustomerManagementScreen.js`)**: Pembuatan kartu pelanggan dengan badge membership VIP/Grosir, metrik total belanja, aksi cepat kontak WhatsApp, tab segmented, dan FlatList tervirtualisasi. | completed |
| 4 | **Modal Formulir Tambah/Edit (`CustomerFormModal.js`)**: Pembuatan modal interaktif pendaftaran/edit member dengan selector tipe membership, validasi nomor HP unik, catatan khusus, dan tombol hapus aman. | pending |
| 5 | **Integrasi Navigasi Hub Menu & Sinkronisasi Kasir POS**: Menghubungkan launcher di `DashboardActionHub.js`, registrasi rute di `App.js` dengan proteksi peran Owner/Manager, serta sinkronisasi reaktif ke Customer Picker di kasir POS. | pending |
| 6 | **Audit Kualitas, Defensive UI Check, & Uji Coba Multi-Platform**: Audit linter (`node detect.mjs`), uji ekspor Web (`npx expo export --platform web`), verifikasi kepatuhan WCAG readability floor (min. 12px), dan verifikasi sinkronisasi offline-first. | pending |

---

## Standar Defensive UI & Impeccable Craft
1. **The Flexbox Pairing Rule**: Setiap kontainer informasi pada kartu member wajib menggunakan `min-w-0 truncate` untuk nama pelanggan dan alamat, berpasangan dengan `shrink-0 whitespace-nowrap` untuk badge tipe keanggotaan dan akumulasi belanja.
2. **The Readability Floor Rule**: Seluruh label dan nilai teks wajib berukuran minimal `text-xs` (12px) tanpa font mikro di bawah standar WCAG.
3. **Action Target Protection**: Tombol kontak cepat (WhatsApp / Telepon) memiliki touch target minimal 44x44 dp agar ramah sentuhan kasir pada layar ponsel kecil.
4. **Resilience & Feedback**: Form modal dilengkapi `KeyboardAvoidingView` dan feedback error validasi field inline (khususnya validasi nomor WhatsApp duplikat).
