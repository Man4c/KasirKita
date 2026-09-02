---
title: Modularisasi & Refactoring SettingsScreen KasirKita Mobile
description: Rencana refaktorisasi arsitektur SettingsScreen.js (~2900 baris) menjadi modular, mengekstrak 7 modal ke folder mobile/src/components/settings/, pemisahan stylesheet, dan manajemen state preferensi kasir.
status: pending
priority: P2
effort: 4h
tags: [mobile, react-native, settings, modularization, refactoring, clean-code]
created: 2026-09-02
assignee: Mobile Frontend & Architecture Specialist
---

# Modularisasi & Refactoring SettingsScreen KasirKita Mobile

## Overview
Saat ini `SettingsScreen.js` memiliki ukuran ~2.915 baris kode yang menggabungkan seluruh menu preferensi aplikasi (Profil User, Ganti Password, Identitas Toko & Logo, Manajemen Printer Bluetooth ESC/POS, Panduan Printer, Pratinjau Struk, Audit Keamanan Data, dan Sinkronisasi Offline) beserta ribuan baris StyleSheet dalam satu file monolitik.

Rencana modul **#23** ini memecah komponen besar tersebut menjadi modul-modul terisolasi yang bersih, mudah di-maintain, dan aman di masa mendatang.

---

## 7 Sub-Komponen yang Akan Diekstrak ke `mobile/src/components/settings/`:

1. **`UserProfileModal.js`**: Modal edit nama, nomor telepon, dan status role pengguna.
2. **`ChangePasswordModal.js`**: Modal form ganti kata sandi dengan toggle intip password dan validasi keamanan.
3. **`StoreIdentityModal.js`**: Modal konfigurasi identitas toko, upload logo (Base64/URI), preview logo, dan pengaturan visibilitas struk.
4. **`PrinterSettingsModal.js`**: Modal pemindaian Bluetooth, pemilihan ukuran kertas 58mm/80mm, dan status koneksi printer thermal.
5. **`PrinterGuideModal.js`**: Modal instruksi & panduan pairing printer Bluetooth Android/iOS/Web.
6. **`TestReceiptModal.js`**: Modal preview simulasi struk test print thermal.
7. **`SecurityAuditModal.js`**: Modal audit keamanan data enkripsi lokal (AES-256 Keystore) & status TLS REST API.

---

## Mekanisme Rollback & Keamanan Kode (Safety Net)

Untuk menjamin keamanan kode selama refactoring:
1. **Git Commit Checkpoint:** Sebelum refactoring dimulai, branch `main` berada pada titik commit bersih.
2. **File Backup:** Membuat backup sementara `SettingsScreen.backup.js` atau Git Tag sebelum pemecahan komponen.
3. **Verifikasi Metro Bundler:** Setiap ekstraksi sub-komponen diverifikasi menggunakan `npx expo export --platform web`.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Safety Net & Setup:** Buat folder `mobile/src/components/settings/` dan persiapkan interface props untuk setiap sub-komponen. | completed |
| 2 | **User & Password Modals Extraction:** Ekstraksi `UserProfileModal.js` dan `ChangePasswordModal.js` beserta StyleSheet lokal. | completed |
| 3 | **Store Identity Modal Extraction:** Ekstraksi `StoreIdentityModal.js` (ImagePicker, upload logo, switch toggle logo/telepon). | completed |
| 4 | **Printer & Hardware Modals Extraction:** Ekstraksi `PrinterSettingsModal.js`, `PrinterGuideModal.js`, dan `TestReceiptModal.js`. | pending |
| 5 | **Security Modal & Orchestrator Cleanup:** Ekstraksi `SecurityAuditModal.js`, integrasi seluruh modal ke `SettingsScreen.js`, dan pembersihan StyleSheet monolitik. | pending |
| 6 | **Testing, WCAG Readability & Verification:** Verifikasi seluruh alur penyimpanan setting, live Bluetooth scan, dark mode UI craft, dan commit Git final. | pending |
