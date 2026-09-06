---
title: Cloud Sync Preferences & Local Data Backup-Restore
description: Perancangan dua jalur sinkronisasi multi-device tanpa hosting berbayar (Solusi 1 Cloud Free-Tier dengan Cron Terjadwal Jam Sibuk & Solusi 3 Cadangkan/Pulihkan File JSON Berversi Aman) agar preferensi toggle, katalog produk, dan data kasir identik antar-HP.
status: completed
priority: P1
effort: 8h
tags: [cloud-sync, backup-restore, json-export, settings, multi-device, offline-first, free-tier, scheduled-cron, schema-versioning]
created: 2026-09-03
updated: 2026-09-06
assignee: Fullstack Architecture Specialist
---

# Cloud Sync Preferences & Local Data Backup-Restore

## Overview
Menyediakan solusi interoperabilitas multi-device untuk toko UMKM yang **tidak memiliki server lokal/laptop di toko dan tidak ingin sewa hosting berbayar**.

Fitur ini menggabungkan dua strategi komplementer yang telah disempurnakan:
1. **Solusi 1: Cloud Sync (Free-Tier Backend & DB dengan Cron Terjadwal Jam Sibuk)**
   - Jalur utama otomatis via internet gratis (Supabase / Neon DB + Render / Railway Backend).
   - Sinkronisasi profil toko dan seluruh toggle preferensi POS (Pajak, Voucher, Pelanggan, Barcode Scanner, Beep) secara hierarkis (Owner-driven top-down).
   - Cron keep-alive dibatasi secara cerdas hanya pada jam operasional/sibuk toko untuk menjaga kuota 750 jam/bulan Render tetap aman.
   - Pemuatan lokal instan (*Cache-First Fallback*): saat HP kasir dibuka tanpa internet, preferensi lokal langsung aktif 0ms tanpa loading spinner.
2. **Solusi 3: Cadangkan & Pulihkan Berkas JSON (Emergency Safety Net Berversi & Anti-Data Loss)**
   - Jalur darurat offline murni tanpa internet.
   - Ekspor seluruh database lokal (produk, kategori, riwayat transaksi, preferensi toggle) menjadi berkas terstruktur `.json` dengan metadata `schema_version`.
   - Proteksi ketat saat pemulihan (*restore*): blokir pemulihan jika ada transaksi kasir offline yang belum tersinkron dengan aksi langsung di tempat (*Frictionless UX*: tombol *Sinkronkan Sekarang*, *Cadangkan Dulu*, *Batal*), serta metode penggabungan (*merge by UUID*) agar tidak ada data transaksi yang tertimpa.
   - Header kasir dan modal sukses pembayaran tetap bersih (informasi antrean transaksi terpusat rapi di menu Pengaturan).

---

## Arsitektur & Spesifikasi Solusi

### 1. Solusi 1: Cloud Sync Preferensi Toko (Free-Tier Ready: Supabase + Render)
- **Infrastruktur Cloud Rp 0 (Free-Tier):**
  - **Database (Supabase)**: Database cloud PostgreSQL gratis (500 MB kapasitas, native connection pgsql).
  - **Backend (Render.com)**: Web Service container Laravel gratis dengan koneksi otomatis ke GitHub.
  - **Keep-Alive Ping Terjadwal Khusus Jam Sibuk (Schedule-Bounded Ping)**:
    - Paket gratis Render memiliki batas kuota 750 jam compute gratis per bulan.
    - **Jadwal Cron Terbatas**: Webhook cron gratis (via `cron-job.org`) disetel memanggil `GET /api/v1/health` setiap 10 menit **hanya pada jam operasional toko** (misalnya pk 08.00 – 21.00 WIB = 13 jam/hari x 30 hari = 390 jam).
    - **Efisiensi Kuota**: Pada malam hari (pk 21.01 – 07.59), server dibiarkan tidur (*sleep*). Dengan konsumsi hanya 390 jam/bulan, sisa kuota Render masih tersisa ~360 jam (sangat aman dari resiko suspensi di akhir bulan).
    - **Proteksi Offline-First**: Jika kasir melayani transaksi di luar jam cron atau saat server sedang bangun (*cold-start* 20–30 detik), kasir langsung bisa checkout & cetak struk tanpa terhambat sama sekali. Server akan otomatis bangun sendiri begitu ada transaksi masuk.
- **Backend API (`backend/app/Models/StoreSetting.php` & `SettingsController.php`):**
  - Menambahkan kolom `preferences` berformat `JSONB` pada tabel `store_settings`.
  - Menyimpan status: `show_barcode_scanner`, `sound_beep`, `show_customer_picker`, `show_voucher_feature`, `show_tax_feature`, `auto_print`, `print_two_copies`.
  - Endpoint `PUT /api/v1/settings/preferences` khusus role `owner` (RBAC) untuk memperbarui preferensi secara atomik.
  - Endpoint `GET /api/v1/settings/store` mengembalikan preferensi toko bersama data identitas toko untuk semua role.
- **Pola Sinkronisasi Top-Down (Owner-Driven, Zero-Conflict):**
  - Hanya akun **Owner** (HP 1) yang berwenang mengubah dan mengunggah (*write*) preferensi ke cloud.
  - Akun **Kasir** (HP 2) bersifat *Read-Only Sync*: saat aplikasi kasir dibuka, sistem mengambil preferensi toko terbaru dari cloud dan menyelaraskan toggle lokal tanpa resiko konflik penimpaan (*zero-conflict*).
  - **Cache-First Fallback**: Jika HP kasir dinyalakan saat offline/tanpa internet, aplikasi langsung memuat preferensi lokal terakhir dalam 0ms. Pengecekan cloud berjalan di latar belakang dengan timeout 3 detik, mencegah layar macet (*infinite loading*).
- **Penempatan Microcopy Penenang Kasir (Sesuai Opsi 3 Terpilih):**
  - Header kasir dipertahankan persis seperti sekarang (tombol *Keluar* tetap ada di pojok kanan atas, tidak ditambahkan badge awan yang mengganggu tampilan katalog kasir).
  - Modal sukses pembayaran tetap bersih (tanpa teks offline).
  - Di menu **Pengaturan ➔ Data & Jaringan Server ➔ Antrean Transaksi Offline**, teks antrean nota disempurnakan:
    > *"🟢 Tersimpan aman di memori HP. Otomatis terunggah ke cloud saat server aktif besok pagi."*
    Lengkap dengan tombol manual **`[Kirim]`** jika kasir ingin memaksa membangunkan server malam itu juga.

---

### 2. Solusi 3: Ekspor / Impor Cadangan Data Mandiri (JSON Backup with Safety Net)
- **Metadata Skema Berkas (`schema_version` & Integritas Data):**
  - Setiap berkas cadangan wajib menyertakan envelope metadata:
    ```json
    {
      "app": "KasirKita",
      "schema_version": 2,
      "exported_at": "2026-09-06T12:00:00Z",
      "app_version": "1.3.0",
      "data": {
        "store": { ... },
        "categories": [ ... ],
        "units": [ ... ],
        "products": [ ... ],
        "customers": [ ... ],
        "taxes_and_fees": [ ... ],
        "discounts": [ ... ],
        "preferences": { ... }
      }
    }
    ```
  - **Fungsi Migrator / Sanitizer**: Jika file backup berasal dari versi lama (`schema_version < 2`), modul impor secara otomatis memvalidasi dan mengisi nilai bawaan (misal: menyematkan default `base_unit_id: 'pcs'` pada produk) agar tidak merusak database.
- **Strategi Pemulihan Data (*Upsert Katalog & Proteksi Antrean Transaksi*):**
  - **Master Data (Katalog, Kategori, Pelanggan, Pajak)**: Dipulihkan dengan metode **Upsert by UUID** (menambahkan item baru dan memperbarui item yang sudah ada tanpa menghapus data lain secara sembrono).
  - **Proteksi Antrean Transaksi Offline (Frictionless UX)**:
    - Sebelum memulihkan data, sistem memeriksa antrean transaksi lokal di perangkat.
    - Jika masih terdapat transaksi kasir offline yang belum tersinkronkan ke server cloud, proses restore **DIBLOKIR SEMENTARA** dengan dialog tindakan langsung di tempat:
      1. **Tombol "Sinkronkan Sekarang" (Hijau)**: Langsung mengunggah transaksi offline saat itu juga, lalu otomatis melanjutkan proses restore setelah berhasil.
      2. **Tombol "Cadangkan Dulu"**: Mengekspor file cadangan kondisi saat ini sebagai jaring pengaman tambahan sebelum restore.
      3. **Tombol "Batal"**: Menutup dialog tanpa mengubah data.
    - Transaksi lokal yang sudah tersinkron digabungkan (*merge by UUID*) untuk mencegah risiko data transaksi hilang.
- **Modul Layanan (`mobile/src/services/backupService.js`):**
  - `exportStoreBackup()`: Mengumpulkan seluruh data lokal, menghitung checksum, dan mengompres berkas JSON.
  - `importStoreBackup(jsonData)`: Memverifikasi `schema_version`, menjalankan sanitizer, memvalidasi integritas, dan menerapkan upsert aman.
- **Interaksi Berkas (`expo-file-system` & `expo-sharing`):**
  - Fitur bagikan berkas backup langsung ke WhatsApp, Google Drive, Bluetooth, atau unduh ke folder perangkat.
  - Fitur pilih berkas backup menggunakan document picker native.
- **UI Kontrol Pengaturan (`mobile/src/screens/SettingsScreen.js`):**
  - Menambahkan seksi kartu *"Pencadangan & Pemulihan Data"* di layar Pengaturan.
  - Tombol **"Cadangkan Data (JSON)"** dengan rincian jumlah item dan tanggal.
  - Tombol **"Pulihkan Data (JSON)"** dengan dialog konfirmasi peringatan bertingkat sebelum eksekusi.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| **1** | Spesifikasi Skema Data, Metadata `schema_version`, & Kontrak API Preferensi Toko | completed |
| **2** | Backend: Migrasi Kolom `preferences` JSONB & Endpoint API Settings (Role Owner Only) | completed |
| **3** | Mobile: Modul Backup Service (`exportStoreBackup` & `importStoreBackup` dengan Migrator Versi & Proteksi Transaksi) | completed |
| **4** | Mobile: Integrasi UI Cadangkan & Pulihkan Berkas di `SettingsScreen.js` (dengan Dialog Keamanan Frictionless) | completed |
| **5** | Mobile: Integrasi Sinkronisasi Top-Down Preferensi Cloud (Owner Write, Cashier Read-Only Cache-First) & Microcopy Pengaturan | completed |
| **6** | Pengujian Validasi Multi-Device, Uji Berkas Skema Lama/Rusak, Uji Proteksi Overwrite Transaksi, & Verifikasi Build | completed |