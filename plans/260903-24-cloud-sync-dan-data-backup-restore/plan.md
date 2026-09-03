---
title: Cloud Sync Preferences & Local Data Backup-Restore
description: Perancangan dua jalur sinkronisasi multi-device tanpa hosting berbayar (Solusi 1 Cloud Free-Tier & Solusi 3 Cadangkan/Pulihkan File JSON) agar preferensi toggle, katalog produk, dan data kasir identik antar-HP.
status: pending
priority: P1
effort: 8h
tags: [cloud-sync, backup-restore, json-export, settings, multi-device, offline-first, free-tier]
created: 2026-09-03
assignee: Fullstack Architecture Specialist
---

# Cloud Sync Preferences & Local Data Backup-Restore

## Overview
Menyediakan solusi interoperabilitas multi-device untuk toko UMKM yang **tidak memiliki server lokal/laptop di toko dan tidak ingin sewa hosting berbayar**. 

Fitur ini menggabungkan dua strategi komplementer:
1. **Solusi 1: Cloud Sync (Free-Tier Backend & DB)**
   - Jalur utama otomatis via internet gratis (Supabase / Neon DB + Render / Railway Backend).
   - Sinkronisasi profil toko dan seluruh toggle preferensi POS (Pajak, Voucher, Pelanggan, Barcode Scanner, Beep) antar-perangkat (HP 1 ke HP 2).
2. **Solusi 3: Cadangkan & Pulihkan Berkas JSON (Emergency Safety Net)**
   - Jalur darurat offline murni tanpa internet.
   - Ekspor seluruh database lokal (produk, kategori, riwayat transaksi, preferensi toggle) menjadi berkas terenkripsi/terstruktur `.json`.
   - Impor / pulihkan berkas backup di HP mana pun melalui picker berkas, WhatsApp, atau Bluetooth file sharing.

---

## Arsitektur & Spesifikasi Solusi

### 1. Solusi 1: Cloud Sync Preferensi Toko (Free-Tier Ready: Supabase + Render)
- **Infrastruktur Cloud Rp 0 (Free-Tier):**
  - **Database (Supabase)**: Database cloud PostgreSQL gratis (500 MB kapasitas, native connection pgsql).
  - **Backend (Render.com)**: Web Service container Laravel gratis dengan koneksi otomatis ke GitHub.
  - **Keep-Alive Ping Strategy (Pencegahan Cold-Start Render)**:
    - Paket gratis Render memiliki idle timeout 15 menit (masuk mode sleep).
    - Setup webhook cron gratis (via `cron-job.org` atau `UptimeRobot`) yang memanggil `GET /api/v1/health` setiap 10 menit selama jam buka toko, menjaga container tetap melek tanpa cold-start.
    - Dilindungi oleh arsitektur *Offline-First* KasirKita: jika server sedang wake-up, kasir tetap bisa checkout & cetak struk tanpa delay.
- **Backend API (`backend/app/Models/StoreSetting.php` & `SettingsController.php`):**
  - Menambahkan kolom `preferences` berformat `JSONB` pada tabel `store_settings`.
  - Menyimpan status: `show_barcode_scanner`, `sound_beep`, `show_customer_picker`, `show_voucher_feature`, `show_tax_feature`, `auto_print`, `print_two_copies`.
  - Endpoint `PUT /api/v1/settings/preferences` untuk memperbarui preferensi secara atomik.
  - Endpoint `GET /api/v1/settings/store` mengembalikan preferensi toko bersama data identitas toko.
- **Mobile Integration (`mobile/src/screens/SettingsScreen.js` & `PosScreen.js`):**
  - Saat Owner mengubah toggle di HP 1, aplikasi memperbarui memori lokal dan mengirim update ke API.
  - Saat HP 2 dibuka, aplikasi mengambil snapshot preferensi terbaru dari cloud dan menyinkronkan switch lokal.

### 2. Solusi 3: Ekspor / Impor Cadangan Data Mandiri (JSON Backup)
- **Modul Layanan (`mobile/src/services/backupService.js`):**
  - `exportStoreBackup()`: Mengumpulkan data profil toko, katalog produk, kategori, pelanggan, transaksi antrean offline, dan preferensi pengaturan ke objek JSON terstruktur lengkap dengan metadata timestamp dan checksum versi skema.
  - `importStoreBackup(jsonData)`: Memvalidasi integritas berkas, melakukan sanitasi skema, dan menyimpan ulang seluruh dataset ke memori lokal `AsyncStorage`.
- **Interaksi Berkas (`expo-file-system` & `expo-sharing`):**
  - Fitur simpan/bagikan berkas backup langsung ke WhatsApp, Google Drive, atau folder dokumen HP.
  - Fitur pilih berkas backup menggunakan document picker native.
- **UI Kontrol Pengaturan (`mobile/src/screens/SettingsScreen.js`):**
  - Menambahkan seksi kartu *"Pencadangan & Pemulihan Data"* di layar Pengaturan.
  - Tombol **"Cadangkan Data (JSON)"** dengan konfirmasi tanggal dan ukuran data.
  - Tombol **"Pulihkan Data (JSON)"** dengan dialog konfirmasi peringatan sebelum menimpa data.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Spesifikasi Skema Data & Kontrak API Preferensi Toko (Cloud Sync) | pending |
| 2 | Backend: Migrasi Kolom Preferences JSONB & Endpoint API Settings | pending |
| 3 | Mobile: Modul Backup Service (`exportStoreBackup` & `importStoreBackup`) | pending |
| 4 | Mobile: Integrasi UI Cadangkan & Pulihkan Berkas di `SettingsScreen.js` | pending |
| 5 | Mobile: Integrasi Sinkronisasi Dua Arah Preferensi Cloud di HP 1 & HP 2 | pending |
| 6 | Pengujian Validasi Multi-Device, Uji Berkas Rusak/Incompatible, & Verifikasi Build | pending |