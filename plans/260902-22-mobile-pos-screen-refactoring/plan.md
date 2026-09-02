---
title: Modularisasi & Refactoring PosScreen KasirKita Mobile
description: Rencana refaktorisasi arsitektur PosScreen.js (4900 baris) menjadi modular, pemisahan stylesheet, useMemo kalkulasi transaksi, useReducer state machine, normalisasi API, dan konsolidasi offline fallback engine.
status: completed
priority: P1
effort: 6h
tags: [mobile, react-native, refactoring, clean-code, useReducer, useMemo, modularization, pos]
created: 2026-09-02
assignee: Mobile Frontend & Architecture Specialist
---

# Modularisasi & Refactoring PosScreen KasirKita Mobile

## Overview
PosScreen.js saat ini telah mencapai hampir 4.900 baris kode dengan ribuan baris StyleSheet terpusat di satu file. Dokumen rencana ini memecah perbaikan 6 temuan arsitektural menjadi tahapan eksekusi yang aman, modular, teruji, dan dapat dikembalikan (rollback) sewaktu-waktu tanpa risiko kehilangan data atau fungsionalitas transaksi kasir.

### 6 Poin Utama Refactoring:
1. **Modularisasi Komponen & Stylesheet:** Memecah komponen raksasa menjadi sub-komponen terisolasi di mobile/src/components/pos/ beserta stylesheet per bagian.
2. **Konsolidasi Offline Fallback:** Menyatukan logika penyelesaian transaksi tunai offline langsung dan network error ke dalam satu helper handleOfflineFallback.
3. **Helper Notifikasi Lintas Platform (showAlert):** Menghilangkan boilerplate duplikasi Platform.OS === 'web' ? window.alert(...) : Alert.alert(...).
4. **Optimasi Kinerja dengan useMemo:** Menghindari hitung ulang subtotal, pajak, diskon, dan fee berulang kali saat kasir sekadar mengetik pencarian produk.
5. **Normalisasi Respon Data Katalog:** Memetakan simbol satuan (base_unit / baseUnit) saat fetch agar tidak perlu ternary guard berulang di UI.
6. **Manajemen State Terpusat (useReducer):** Mengganti ~20 useState flat menjadi reducer terstruktur dengan action RESET_CHECKOUT, APPLY_PROMO, dan SET_CUSTOMER.

---

## Mekanisme Rollback & Keamanan Kode (Safety Net)

Untuk menjamin Anda dapat kembali ke kode awal 100% kapan saja:
1. **Git Tag Cadangan:** ackup-pos-before-refactor
   - Perintah kembali instan: git checkout backup-pos-before-refactor -- mobile/src/screens/PosScreen.js
2. **Git Branch Cadangan:** ackup-pos-before-refactor
   - Perintah pindah ke branch backup penuh: git checkout backup-pos-before-refactor
3. **File Fisik Cadangan:** mobile/src/screens/PosScreen.backup.js
   - Jika ingin membandingkan side-by-side atau me-restore manual tanpa git.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Safety Net & Shared Helpers:** Backup kode, buat helper mobile/src/utils/alert.js, dan fungsi normalisasi produk. | completed |
| 2 | **Data Normalization & Calculation Optimization:** Implementasi useMemo untuk ringkasan transaksi (subtotal, diskon, fee, pajak, total) dan normalisasi data di fetchData(). | completed |
| 3 | **Offline Fallback Extraction:** Ekstraksi fungsi tunggal handleOfflineFallback untuk transaksi offline & kegagalan jaringan. | completed |
| 4 | **State Machine Transition (useReducer / Custom Hook):** Migrasi ~20 useState menjadi reducer terstruktur dengan action RESET_CHECKOUT yang aman dari bug kebocoran state. | completed |
| 5 | **Component & Style Modularization:** Pemecahan PosScreen.js menjadi folder mobile/src/components/pos/ (ProductGrid, LandscapeRegisterPanel, PosCheckoutView, PosCartModal, CustomerPickerModal, PromoVoucherModal, TaxFeeModal, PosReceiptModal) dan pembersihan StyleSheet monolitik. | completed |
| 6 | **Verifikasi, Testing & Defensive UI Check:** Validasi flow checkout online & offline, kalkulasi keranjang, dan kepatuhan WCAG / defensive UI rules. | completed |
