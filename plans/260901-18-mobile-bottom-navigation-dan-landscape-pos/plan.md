---
title: Mobile Bottom Navigation & Auto-Rotate Landscape POS
description: Perombakan sistem navigasi aplikasi mobile menjadi Bottom Navigation Bar ramah jempol untuk mode Portrait, serta mode kasir register profesional 2-kolom otomatis saat perangkat diputar ke Landscape.
status: pending
priority: P1
effort: 6h
tags: [mobile, react-native, expo, ui-ux, navigation, landscape-pos]
created: 2026-09-01
completed:
assignee: Mobile UI/UX Developer
---

# Mobile Bottom Navigation & Auto-Rotate Landscape POS

## Overview
Menyelesaikan keterbatasan ruang visual pada header aplikasi mobile kasir, serta menghadirkan pengalaman kasir setara mesin register tablet profesional melalui 2 pilar utama:
1. **Mode Tegak (Portrait):** Mengeliminasi tab navigasi atas yang memakan tempat, menggantikannya dengan **Bottom Navigation Bar** modern (Kasir POS, Laporan Toko, dan Riwayat Transaksi) yang ramah jangkauan jempol (*Thumb Zone*).
2. **Mode Mendatar (Landscape):** Otomatis mendeteksi saat perangkat dimiringkan (`width > height`), lalu mengonversi antarmuka menjadi **Mode Kasir Terminal 2 Kolom (*Split-Screen Register*)**:
   - **Kolom Kiri (60%):** Pencarian produk, filter kategori, dan katalog barang.
   - **Kolom Kanan (40%):** Keranjang belanja terbuka permanen dengan subtotal, pajak, biaya, dan tombol aksi bayar instan tanpa perlu buka-tutup drawer.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Eliminasi Top Header Tabs & Perancangan Bottom Navigation Bar (Portrait) di `App.js` | completed |
| 2 | Deteksi Orientasi Cerdas & State Management Responsif (`useWindowDimensions`) | completed |
| 3 | Perancangan Tata Letak Kasir 2 Kolom (*Split-Screen POS*) untuk Mode Landscape di `PosScreen.js` | completed |
| 4 | Integrasi Alur Checkout, Diskon, Pajak/Biaya, dan Struk Thermal pada Mode Landscape | pending |
| 5 | Pengujian Standar Aksesibilitas WCAG AA, Defensive UI Craft, & Validasi Build | pending |

---

## Key Deliverables

- [x] Area atas layar pada mode portrait menjadi luas dan bebas dari tombol tab bertumpuk.
- [x] Bilah navigasi bawah (*Bottom Navigation Bar*) terpasang dengan rapi, berikon, dan adaptif terhadap peran pengguna (kasir vs owner).
- [x] Deteksi otomatis transisi orientasi (Portrait $\leftrightarrow$ Landscape) berjalan mulus tanpa lag atau glitch UI.
- [x] Mode Landscape menampilkan tata letak 2 kolom: Katalog di kiri dan Keranjang Belanja permanen di kanan.
- [ ] Kasir dapat melakukan transaksi di mode landscape dengan cepat tanpa perlu membuka/menutup modal keranjang.
- [x] Seluruh komponen memenuhi standar WCAG (rasio kontras $\ge 4.5:1$, ukuran font $\ge 12\text{px}$, target sentuh nyaman $\ge 44\text{px}$).
