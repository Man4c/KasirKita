---
title: Mobile Offline-First Mode & Background Sync Engine
description: Pembangunan kapabilitas transaksi kasir offline-first penuh pada KasirKita Mobile, mencakup caching katalog produk lokal, antrean transaksi tunai offline, pemotongan stok lokal sementara, cetak struk bluetooth tanpa sinyal, dan sinkronisasi otomatis ke server Laravel saat internet kembali aktif.
status: completed
priority: P1
effort: 6h
tags: [mobile, react-native, expo, offline-first, sync-queue, pos, caching, bluetooth-printer]
created: 2026-09-02
assignee: Mobile Fullstack Specialist
---

# Mobile Offline-First Mode & Background Sync Engine

## Overview
Menghadirkan kemampuan **Offline-First** penuh pada KasirKita Mobile agar operasional kasir UMKM tidak pernah terganggu oleh mati lampu, sinyal seluler lemot, atau gangguan jaringan ISP. Kasir tetap dapat mencari produk, menghitung belanjaan, menerima uang tunai, memotong stok di HP, dan mencetak struk thermal Bluetooth secara instan tanpa internet.

### Komponen Utama:
1. **Local Catalog & Meta Caching (`offlineStorage.js`):**
   - Menyimpan seluruh data produk, kategori, tarif pajak, dan pelanggan ke `AsyncStorage`.
   - Jika saat membuka aplikasi internet mati, katalog tetap muncul seketika (*instant offline render*).
2. **Offline Transaction Queue (`offlineStorage.js`):**
   - Transaksi tunai (Cash) yang diselesaikan saat offline ditandai dengan nomor nota offline (misal: `OFF-YYYYMMDDHHMMSS-XXXX`).
   - Stok barang di memori lokal langsung dikurangi agar kasir tidak menjual barang melebihi stok yang ada.
   - Transaksi disimpan ke antrean lokal `KASIRKITA_OFFLINE_QUEUE`.
3. **Auto-Sync Engine (`syncManager.js`):**
   - Memantau status jaringan dan server backend secara berkala.
   - Saat terhubung kembali, secara otomatis mengirimkan transaksi yang tertunda ke backend Laravel secara berurutan (*FIFO*).
   - Menghapus transaksi dari antrean lokal setelah server merespons sukses (201 Created).
4. **Backend Idempotency & Real Timestamp (`PosController.php` & `PosService.php`):**
   - Mendukung parameter `offline_id` untuk mencegah duplikasi nota jika koneksi putus-nyambung.
   - Mendukung parameter `created_at` agar waktu transaksi di laporan keuangan mencerminkan waktu riil saat kasir melayani pembeli.
5. **Indikator Visual & Kontrol Kasir:**
   - Banner status jaringan ramah pengguna di bagian atas kasir POS (`PosScreen.js`).
   - Panel kontrol sinkronisasi manual di layar Pengaturan (`SettingsScreen.js`).

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Backend: Dukungan `offline_id` (idempotency) dan `created_at` asli pada checkout serta PHPUnit Feature Test | completed |
| 2 | Mobile Engine: Pembuatan modul `offlineStorage.js` (cache produk, stok lokal, antrean transaksi) | completed |
| 3 | Mobile Sync: Pembuatan modul `syncManager.js` (network detection & background auto-sync worker) | completed |
| 4 | Mobile POS Integration: Offline fallback loading & checkout tunai offline di `PosScreen.js` | completed |
| 5 | Mobile Settings Integration: Panel kartu antrean offline & tombol sinkronisasi manual di `SettingsScreen.js` | completed |
| 6 | Pengujian Otomatis, Verifikasi Lint/Defensive UI, dan Dokumentasi Arsitektur | completed |
