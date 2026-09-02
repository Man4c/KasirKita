---
title: Mobile Screen Pengaturan (Store, Hardware & POS Preferences)
description: Pembuatan layar Pengaturan (Settings) komprehensif pada aplikasi Mobile KasirKita dengan tab navigasi bawah bertuliskan 'Pengaturan', mencakup profil toko, integrasi printer bluetooth thermal, preferensi struk, sinkronisasi data, dan manajemen akun.
status: in-progress
priority: P1
effort: 6h
tags: [mobile, react-native, expo, settings, pengaturan, bluetooth-printer, receipt, profile, ui-ux]
created: 2026-09-02
assignee: Mobile UI/UX Specialist
---

# Mobile Screen Pengaturan (Store, Hardware & POS Preferences)

## Overview
Menghadirkan layar **Pengaturan** (*Settings Screen*) terpusat pada KasirKita Mobile dengan label tombol navigasi bawah **"Pengaturan"** (bukan *"Setting"*). Layar ini dirancang khusus untuk kenyamanan dan keandalan operasional kasir UMKM di lapangan, mencakup pengaturan printer thermal, preferensi transaksi, kustomisasi struk, sinkronisasi katalog, serta akun kasir/owner.

### Struktur Fitur Layar Pengaturan:
1. **Profil Akun & Toko (Store & Profile Identity):**
   - Kartu identitas pengguna aktif (Nama, Role: *Owner* / *Kasir*, Email/Username).
   - Profil Usaha (Nama Toko, Alamat, No. WhatsApp/Telepon Toko).
2. **Perangkat Keras / Hardware (Printer Thermal & Scanner):**
   - Status & Koneksi Printer Bluetooth Thermal (58mm / 80mm).
   - Tombol Uji Cetak (*Test Print Sample Receipt*).
   - Switch *Auto-Print Struk* setelah pembayaran sukses.
3. **Preferensi Transaksi & Struk (Receipt & Checkout Preferences):**
   - Pengaturan footer struk belanja (catatan terima kasih/kebijakan retur).
   - Tampilkan Logo Toko & Kontak WhatsApp pada struk.
   - Konfigurasi Pembulatan Nominal Kasir (*Cash Rounding*).
4. **Tampilan & Antarmuka Kasir (Interface & UX):**
   - Preferensi orientasi layar (*Auto Gyro*, *Kunci Landscape POS*, *Kunci Portrait*).
   - Pengaturan tata letak katalog produk (Grid 2 Kolom, Grid 3 Kolom Kompak, atau List Baris).
5. **Data, Jaringan & Sinkronisasi (Sync & Storage):**
   - Status koneksi API Backend server dan latensi ping.
   - Tombol *Sinkronisasi Ulang Data* (produk, kategori, pajak, pelanggan).
   - Bersihkan Cache Penyimpanan Lokal.
6. **Tentang Aplikasi & Sesi (About & Security):**
   - Versi Aplikasi (`KasirKita Mobile POS v1.2.0`).
   - Tombol Keluar Akun (*Logout*) dengan dialog konfirmasi aman.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Pendaftaran Tab Navigasi Bawah 'Pengaturan' dengan Ikon `Settings` di `mobile/App.js` | completed |
| 2 | Pembuatan Komponen Layar `mobile/src/screens/SettingsScreen.js` dengan Desain Modular & Defensive UI | completed |
| 3 | Implementasi Seksi Profil Pengguna, Info Toko, & Keamanan Akun | completed |
| 4 | Implementasi Seksi Perangkat Keras (Pengaturan Printer Bluetooth & Opsi Cetak Struk) | completed |
| 5 | Implementasi Seksi Preferensi Struk, Tampilan POS, & Sinkronisasi Data | completed |
| 6 | Verifikasi Aksesibilitas WCAG AA, Build Web & Mobile, serta Dokumentasi Arsitektur | in-progress |

---

## Key Deliverables

- [x] Tab bilah navigasi bawah menampilkan label **"Pengaturan"** dengan ikon `Settings` (Lucide) proporsional.
- [x] Layar `SettingsScreen.js` dengan arsitektur kartu yang rapi, hierarki visual jelas, dan kontras tinggi standar WCAG AA.
- [x] Seksi identitas pengguna aktif dan toko yang informatif.
- [x] Konfigurasi printer bluetooth thermal dan toggle cetak otomatis.
- [x] Kustomisasi teks footer struk belanja.
- [x] Tombol sinkronisasi ulang data katalog offline/online.
- [x] Tombol logout terpusat dengan modal konfirmasi aman.
- [x] Mendukung mode Portrait dan Landscape secara fleksibel.
