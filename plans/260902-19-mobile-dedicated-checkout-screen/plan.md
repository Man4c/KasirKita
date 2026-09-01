---
title: Mobile Dedicated Checkout Screen & Integrated Cashier Numpad
description: Transformasi alur checkout kasir mobile dari modal mengambang sempit menjadi Layar Pembayaran Penuh (Dedicated Screen) dengan tata letak 2 kolom landscape dan Numpad Kasir Virtual terintegrasi tanpa keyboard HP.
status: in-progress
priority: P1
effort: 5h
tags: [mobile, react-native, expo, checkout, pos, numpad, landscape-pos, ui-ux]
created: 2026-09-02
assignee: Mobile UI/UX Specialist
---

# Mobile Dedicated Checkout Screen & Integrated Cashier Numpad

## Overview
Mengeliminasi masalah keterbatasan ruang dan keyboard bawaan HP yang menutupi antarmuka pada modal mengambang (*floating modal*), dengan mentransformasikan alur pembayaran menjadi **Layar Pembayaran Penuh (*Dedicated Checkout Screen*)** berstandar mesin POS modern dunia (setara Moka POS, Square, Pawoon):
1. **Layar Penuh Mandiri (*Zero Squeezed Modal*):** Begitu kasir menekan *"Bayar Kasir"*, aplikasi berpindah ke layar pembayaran 100% penuh dengan tombol navigasi `← Kembali ke Keranjang` di kiri atas.
2. **Tata Letak 2 Kolom Landscape Kasir:**
   - **Kolom Kiri (~38% lebar):** Panel Nota & Pelanggan — menampilkan angka **TOTAL BAYAR** besar mencolok, kartu identitas pelanggan/member, rincian potongan diskon/pajak, serta daftar ringkas belanjaan.
   - **Kolom Kanan (~62% lebar):** Terminal Pembayaran — pilihan metode `[ Tunai ]`, `[ QRIS ]`, `[ Transfer ]`.
3. **Numpad Kasir Virtual Terintegrasi (*Zero Native Keyboard Needed*):**
   - Kasir **tidak perlu lagi memunculkan keyboard sistem Android/iOS** yang memakan setengah layar.
   - Tersedia tombol angka besar $(1\text{–}9, 0, 00, \text{Hapus/C})$, nominal uang pas, dan pecahan cepat $(50\text{rb}, 100\text{rb}, 200\text{rb})$ yang nyaman ditekan jempol kasir.
   - Monitor nilai uang diterima dan kembalian hijau emerald terang langsung reaktif seketika.
4. **Tombol Konfirmasi Kokoh:** Tombol merah besar **"SELESAIKAN PEMBAYARAN"** selalu terlihat di posisi paling strategis tanpa risiko tertutup elemen apa pun.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Perancangan Arsitektur Transisi Layar Checkout Penuh & Header Navigasi Kembali (`PosScreen.js`) | completed |
| 2 | Perancangan Kolom Kiri Landscape: Panel Nota Tagihan, Ringkasan Belanja, & Member Pelanggan | completed |
| 3 | Perancangan Kolom Kanan Landscape: Terminal Pembayaran & Numpad Kasir Virtual Terintegrasi | pending |
| 4 | Adaptasi Responsif Layar Penuh pada Mode Portrait (Single Full-Page Checkout Flow) | pending |
| 5 | Pengujian Standar Aksesibilitas WCAG AA, Defensive UI Craft, & Validasi Build Final | pending |

---

## Key Deliverables

- [x] Transisi mulus dari kasir ke layar pembayaran penuh saat tombol *"Bayar Kasir"* ditekan.
- [x] Tombol `← Kembali ke Keranjang` memudahkan kasir jika pelanggan ingin menambah pesanan.
- [x] Kolom kiri menampilkan ringkasan nota, total tagihan besar, dan identitas pembeli secara elegan.
- [ ] Kolom kanan dilengkapi Numpad Kasir Virtual sentuh jempol (0-9, 00, C, Pas, 50k, 100k, 200k) tanpa keyboard HP.
- [ ] Kembalian dihitung otomatis dan ditampilkan dengan teks emerald bold yang jelas.
- [ ] Tombol *"Selesaikan Pembayaran"* selalu terlihat dan responsif terhadap status validasi pembayaran.
- [ ] Bekerja optimal dan proporsional baik pada mode Landscape maupun Portrait.
