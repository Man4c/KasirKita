---
title: Master Pajak & Biaya Layanan di Mobile
description: Perancangan dan implementasi modul manajemen Master Pajak (PPN/PB1 Resto) & Biaya Layanan (Service Charge, Admin Fee, Packaging) pada aplikasi Mobile (React Native), mencakup katalog pajak & biaya, formulir tambah/edit dengan skema persentase dan nominal, filter trigger transaksi (Semua, Bawa Pulang, Pilihan Kasir, Khusus Pembayaran), saklar status aktif/nonaktif instan, integrasi peluncur di Action Hub Dashboard, serta sinkronisasi reaktif dengan modal kasir POS dan keranjang checkout.
status: pending
priority: P1
effort: 6h
tags: [mobile, master-pajak, tax, service-fee, pricing, offline-first, rbac, pos-sync]
created: 2026-09-05
assignee: Fullstack Mobile Specialist
---

# Master Pajak & Biaya Layanan di Mobile

## Overview
Menyediakan modul **Manajemen Master Pajak & Biaya Tambahan langsung dari aplikasi Mobile (HP)** untuk pemilik toko (*Owner*) dan Manajer UMKM. Fitur ini memungkinkan pengguna mengonfigurasi komponen pajak pertambahan nilai (seperti PPN 11% atau PB1 Resto 10%) dan biaya operasional layanan (seperti Biaya Layanan/Service Charge 5%, Biaya Kemasan/Kantong Kresek Takeaway, atau Biaya Admin Digital), mengatur aturan penerapan (*apply_to*), menyalakan/mematikan komponen secara instan (*toggle switch*), serta mengelola tarif langsung dari smartphone tanpa perlu membuka laptop atau Web Dashboard.

Sebelumnya, tombol **"Pajak"** pada *Action Hub Dashboard* (`DashboardActionHub.js`) masih menampilkan dialog alert placeholder. Dengan modul ini, pemilik usaha dapat mengelola seluruh konfigurasi pajak dan biaya tambahan toko secara mandiri. Perubahan data pajak dan biaya akan langsung ter-sinkronisasi secara reaktif ke modal pemilihan pajak di kasir POS (`TaxFeeModal.js`) dan kalkulasi keranjang checkout (`PosCheckoutView.js`).

---

## Fitur Utama & Kebutuhan Pengguna

### 1. Layar Daftar Master Pajak & Biaya (`TaxManagementScreen.js`)
- **Navigasi & Ringkasan Metrik**:
  - Tombol kembali (`ChevronLeft`) menuju Dashboard dan tombol refresh data berputar.
  - Kartu metrik ringkasan (*Defensive UI Card*): Total Komponen Aktif, Total Pajak Terdaftar, dan Total Biaya Layanan.
- **Pencarian Cepat & Filter Tab Segmented**:
  - Kolom pencarian instan nama komponen atau deskripsi (misal: "PPN", "PB1", "Service Charge", "Plastik").
  - Tab filter segmentasi:
    - **Semua**: Seluruh komponen pajak dan biaya tambahan.
    - **Pajak**: Komponen wajib pajak (`is_tax = true`).
    - **Biaya Layanan**: Komponen biaya operasional toko (`is_tax = false`).
  - Filter chip status: *Semua*, *Aktif*, dan *Non-Aktif*.
- **Daftar Kartu Pajak & Biaya (*Defensive UI Standard*)**:
  - Flexbox pairing: Nama komponen teks dinamis (`min-w-0 truncate`) berpasangan dengan badge tarif dan badge tipe (`shrink-0 whitespace-nowrap`).
  - Badge identitas visual yang kontras:
    - Badge **Pajak** (Aksen Kuning/Amber `#fbbf24`).
    - Badge **Biaya Layanan** (Aksen Ungu/Indigo `#c084fc`).
  - Nilai tarif yang jelas: `11%` (Persentase) atau `Rp 2.000` (Nominal Tetap).
  - Badge Aturan Penerapan (*Apply To*):
    - `Semua Transaksi` (`ALL`)
    - `Bawa Pulang / Takeaway` (`TAKEAWAY_ONLY`)
    - `Pilihan Kasir` (`MANUAL`)
    - `Khusus Pembayaran Digital` (`SPECIFIC_PAYMENT`)
  - **Aksi Cepat Tiap Kartu**:
    - Saklar toggle aktif/nonaktif (`Switch`) langsung dari kartu.
    - Tombol **[ Edit ]**: Membuka modal formulir ubah data pajak/biaya.
    - Tombol **[ Hapus ]**: Konfirmasi dialog hapus aman (Soft Delete).
- **Floating Action Button (FAB)**:
  - Tombol `[ + Tambah ]` di pojok kanan bawah layar untuk pembuatan komponen pajak/biaya baru.

### 2. Formulir Tambah / Edit Pajak & Biaya (`TaxFormModal.js`)
- **Klasifikasi Komponen**:
  - Selector jenis komponen: **Pajak** (`is_tax: true`) vs **Biaya Layanan** (`is_tax: false`).
  - Nama Komponen (wajib, misal: "PPN 11%", "PB1 Restoran", "Service Charge", "Kantong Kresek").
  - Deskripsi singkat (opsional, catatan penerapan).
- **Skema Tarif & Nilai**:
  - Selector tipe tarif: **Persentase (%)** vs **Nominal Tetap (Rp)**.
  - Input nilai: Angka persentase (0 - 100%) atau nominal rupiah dengan format Rp otomatis.
  - *Live Preview Kalkulasi*: Simulasi nilai tagihan pajak/biaya pada contoh transaksi belanja Rp100.000 agar pengguna dapat memastikan ketepatan konfigurasi sebelum menyimpan.
- **Aturan Penerapan (*Apply To*)**:
  - Pilihan aturan trigger:
    1. **Semua Transaksi (`ALL`)**: Otomatis dihitung pada setiap transaksi baru.
    2. **Pilihan Kasir (`MANUAL`)**: Kasir dapat memilih/menyalakan secara manual di POS.
    3. **Bawa Pulang Saja (`TAKEAWAY_ONLY`)**: Hanya berlaku jika jenis pesanan Takeaway (misal: biaya kemasan).
    4. **Metode Pembayaran Khusus (`SPECIFIC_PAYMENT`)**: Otomatis ditambahkan jika metode bayar tertentu dipilih (misal: QRIS / Kartu Debit).
- **Pengaturan Tambahan**:
  - Toggle switch `Aktifkan Sekarang`.
  - Toggle switch `Jadikan Default` (otomatis terpilih saat awal transaksi POS dibuat).
  - Tombol **Hapus Komponen** (khusus mode edit dengan konfirmasi aman).

### 3. Layanan API Mobile & Offline Storage (`taxService.js`)
- Terhubung dengan endpoint REST API backend:
  - `GET /api/taxes-and-fees` (daftar pajak & biaya lengkap dengan search dan filter).
  - `GET /api/taxes-and-fees/{id}` (detail satu komponen).
  - `POST /api/taxes-and-fees` (tambah komponen baru).
  - `PUT /api/taxes-and-fees/{id}` (update komponen).
  - `DELETE /api/taxes-and-fees/{id}` (soft-delete komponen).
  - `PATCH /api/taxes-and-fees/{id}/toggle-status` (saklar toggle instan aktif/nonaktif).
- **Dukungan Offline Cache**:
  - Menyimpan snapshot daftar pajak dan biaya aktif ke `offlineStorage.js` (`@pos_taxes_fees_cache`).
  - Kasir POS tetap dapat mengenali dan menghitung pajak & biaya saat offline tanpa koneksi internet.

### 4. Integrasi Navigasi Dashboard & Kasir POS
- **Peluncur Dashboard Action Hub**:
  - Menghubungkan tile `Pajak` di `DashboardActionHub.js` ke rute `tax_management`.
- **Integrasi Navigasi App (`App.js`)**:
  - Mendaftarkan rute internal `tax_management` dengan proteksi hak akses Owner/Manager.
- **Sinkronisasi Reaktif Kasir POS**:
  - Saat ada pajak/biaya baru dibuat, diubah tarifnya, atau diubah status aktifnya:
    1. Modal pemilih pajak kasir (`TaxFeeModal.js`) langsung memuat ulang daftar tarif pajak aktif.
    2. Kalkulasi keranjang checkout (`useCheckoutState.js` / `PosCheckoutView.js`) merevalidasi pajak terpilih secara akurat.

---

## Arsitektur Komponen & Struktur File

```
mobile/src/
├── screens/
│   └── TaxManagementScreen.js         # Layar utama master pajak & biaya (list, tab filter, metrik, search)
├── components/tax/
│   ├── TaxCardItem.js                 # Kartu item pajak/biaya (nama, tipe, tarif, aturan apply_to, toggle switch)
│   └── TaxFormModal.js                # Modal form tambah & edit (tipe persen/Rp, aturan trigger, live preview)
└── services/
    └── taxService.js                  # Layanan API pajak & biaya serta manajemen cache lokal offline
```

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend**: Verifikasi kontrak API `/api/taxes-and-fees` (GET, POST, PUT, DELETE, toggle-status, skema PERCENTAGE/FIXED, dan filter `apply_to`), serta perancangan visual kartu pajak dan biaya dengan standar defensive UI. | completed |
| 2 | **Mobile API Service (`taxService.js`)**: Pembuatan modul layanan API terintegrasi penanganan error validasi 422, otorisasi RBAC role Owner/Manager, dan sinkronisasi cache lokal offline (`offlineStorage.js`). | completed |
| 3 | **Komponen Kartu & Layar Utama (`TaxCardItem.js` & `TaxManagementScreen.js`)**: Implementasi layar master pajak & biaya dengan FlatList tervirtualisasi, segmented tab (Semua, Pajak, Biaya Layanan), filter status aktif, kartu item dengan badge visual cerah (Amber & Purple), dan saklar toggle status instan. | completed |
| 4 | **Modal Formulir Tambah/Edit (`TaxFormModal.js`)**: Pembuatan formulir modal interaktif dengan selector tipe komponen (Pajak vs Biaya), selector skema tarif (Persen vs Rupiah), aturan trigger (*apply_to*), switch default, live preview kalkulasi transaksi Rp100.000, dan tombol hapus aman. | completed |
| 5 | **Integrasi Navigasi Hub Menu & Sinkronisasi Kasir POS**: Menghubungkan peluncur di `DashboardActionHub.js`, rute di `App.js` dengan proteksi Role Owner, serta sinkronisasi reaktif ke modal pemilihan pajak kasir (`TaxFeeModal.js`) dan hook checkout (`useCheckoutState.js`). | completed |
| 6 | **Audit Kualitas, Defensive UI Check, & Uji Coba Multi-Platform**: Menjalankan pengecekan linter (`node detect.mjs`), pengujian rendering Web (`npx expo export --platform web`), verifikasi kepatuhan WCAG readability floor (min. 12px), dan verifikasi sinkronisasi offline-first. | completed |

---

## Standar Defensive UI & Impeccable Craft
1. **The Flexbox Pairing Rule**: Setiap kontainer informasi pada kartu item dan baris modal wajib menggunakan `min-w-0 truncate` untuk nama/keterangan pajak dan `shrink-0 whitespace-nowrap` untuk badge tarif dan nilai rupiah.
2. **The Readability Floor Rule**: Seluruh label dan badge status wajib memiliki ukuran minimal `text-xs` (12px) tanpa pengecualian font mikro.
3. **Data Protection Rule**: Seluruh indikator persentase (`11%`), nominal mata uang (`Rp 2.000`), dan badge trigger penerapan wajib berstatus `whitespace-nowrap` agar tidak patah 2 baris saat layar ponsel menyempit.
4. **Keyboard Resilience**: Formulir modal dilengkapi dengan `KeyboardAvoidingView` dan `ScrollView` berketinggian dinamis agar input tarif tidak tertutup keyboard virtual perangkat mobile.


