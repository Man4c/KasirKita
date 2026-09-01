---
title: Mobile App (React Native Expo)
description: Aplikasi kasir dan pemantauan penjualan mobile berbasis React Native & Expo.
status: completed
priority: P1
effort: 16h
tags: [mobile, react-native, expo, securestore]
created: 2026-08-29
completed: 2026-08-29
assignee: Mobile Developer
---

# Mobile App (React Native Expo)

## Overview
Pengembangan aplikasi mobile kasir portabel menggunakan React Native dan Expo. Mendukung penyimpanan token aman via Expo SecureStore dan sinkronisasi real-time dengan backend Laravel.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Setup Proyek React Native Expo, Font Poppins (@expo-google-fonts/poppins) & Navigasi | completed |
| 2 | Konfigurasi SecureStore & Axios Bearer Token Interceptor | completed |
| 3 | UI Login & Otentikasi Pengguna Mobile | completed |
| 4 | UI Touch-Friendly Kasir Mobile & Keranjang Belanja | completed |
| 5 | UI Ringkasan Penjualan & Laporan Cepat untuk Owner | completed |

## Key Deliverables
- [x] Aplikasi mobile React Native Expo di folder `mobile/`.
- [x] Tipografi seragam dengan `@expo-google-fonts/poppins` (Regular, Medium, SemiBold, Bold).
- [x] Adapter penyimpanan kredensial token terenkripsi `expo-secure-store`.
- [x] Axios Interceptor dengan dukungan dinamis URL server API (dukungan emulator Android `10.0.2.2`, iOS, & LAN Wi-Fi).
- [x] Layar Kasir POS sentuh (*Touch-friendly*) dengan keranjang belanja *floating*, modal kalkulator tunai & kembalian otomatis.
- [x] Layar Dasbor Laporan Keuangan untuk memantau omzet, laba kotor HPP, dan peringatan stok menipis secara portabel.
