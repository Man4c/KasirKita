---
title: "Sistem Multi-Tenant, Registrasi Toko Baru & Manajemen Lisensi Toko"
description: "Arsitektur multi-tenancy KasirKita POS berbasis isolasi store_id, Global Scope BelongsToStore, Composite Unique Barcode per toko, registrasi mandiri di mobile, lisensi hibrida (Trial 14 hari + Kode Aktivasi), Web Superadmin, dan notifikasi Telegram."
status: "in_progress"
priority: "P1"
effort: "16h"
tags:
  - "multi-tenant"
  - "backend"
  - "mobile"
  - "licensing"
  - "superadmin"
  - "telegram"
  - "saas"
created: "2026-09-08"
assignee: "Antigravity"
---

# Sistem Multi-Tenant, Registrasi Toko Baru & Manajemen Lisensi Toko

## Overview
Transformasi arsitektur **KasirKita POS** dari *single-store* menjadi **Multi-Tenant (SaaS)** yang memungkinkan aplikasi dijual langsung dari toko ke toko (*door-to-door*) secara aman. Setiap toko memiliki ruang data mandiri yang terisolasi total, dilengkapi alur registrasi toko baru yang ramah UMKM, perlindungan anti-pembajakan melalui lisensi hibrida (*Trial 14 Hari + Kode Aktivasi Permanen*), Web Superadmin sebagai markas kendali pengembang, dan notifikasi alert instan ke Telegram pribadi pemilik aplikasi.

---

## Arsitektur & Prinsip Desain

1. **Pragmatic Multi-Tenancy (Single DB, Row-Level `store_id`)**:
   - Menghindari kompleksitas multi-database (hemat resource server Render & Supabase gratis).
   - Setiap baris data bisnis (`products`, `transactions`, `customers`, dll) wajib memiliki cap `store_id`.
   - Menggunakan Laravel Global Scope `BelongsToStore` agar penyaringan `WHERE store_id = ...` terjadi otomatis di level framework.
2. **Kemandirian Barcode per Toko (Composite Unique)**:
   - Menghapus constraint lama `UNIQUE(barcode)` dan menggantinya dengan `UNIQUE(store_id, barcode)` agar dua toko yang berbeda dapat memasukkan barang yang sama (misal sama-sama menjual Indomie) tanpa error duplikasi.
3. **Migrasi Atomik Data Existing (Toko #1)**:
   - Seluruh data yang saat ini sudah ada di database dikelompokkan ke dalam toko default perdana (`KasirKita Mart & Cafe`), menjamin 0% risiko data rusak atau hilang.
4. **Lisensi Hibrida (The Pragmatic Hybrid)**:
   - Status Toko:
     - `trial`: Baru mendaftar, gratis 14 hari penuh.
     - `active`: Telah membayar dan diaktifkan (via Kode Serial di HP atau Web Superadmin).
     - `expired`: Masa trial habis tanpa aktivasi; fitur jualan/cetak struk terkunci, hanya bisa melihat rekap data lama.
5. **Pemisahan Peran Pengelolaan (Web Superadmin vs Telegram Alert)**:
   - **Web Superadmin (`/superadmin`)**: Menangani tabel lengkap daftar toko, pencarian, filter status, analitik, dan generator kode lisensi.
   - **Telegram Bot**: Murni sebagai radar pemberitahuan instan (*push alert*) saat ada toko baru mendaftar di lapangan.
   - **Kode Serial (Voucher)**: Senjata cepat aktivasi di HP toko saat pembeli membayar tunai di tempat.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Skema Database Multi-Tenant & Migrasi Atomik Toko #1**: Pembuatan tabel `stores`, penambahan kolom `store_id` berindeks ke seluruh tabel bisnis, migrasi data lama ke toko perdana, dan migrasi constraint `UNIQUE(store_id, barcode)`. | completed |
| 2 | **Global Scope `BelongsToStore` & Subscription Guard**: Pembuatan Trait Laravel untuk penyaringan otomatis seluruh query model bisnis, penanganan data baru otomatis, serta middleware `EnsureStoreActive` untuk memblokir transaksi pada toko berstatus `expired`. | completed |
| 3 | **Backend Auth, Registrasi Toko & Template Data Bawaan**: Endpoint `POST /api/auth/register-store` dengan auto-provisioning template data awal (satuan, kategori) sesuai kategori usaha (Ritel, F&B, Jasa), serta webhook alert Telegram pemilik. | pending |
| 4 | **Sistem Lisensi & Generator Kode Aktivasi**: Tabel `license_keys`, generator kode serial acak berformat `KK-PRO-XXXX-XXXX`, dan endpoint `POST /api/store/activate-license` untuk klaim lisensi di HP toko. | pending |
| 5 | **Antarmuka Mobile (React Native)**: Layar *"Daftar Toko Baru"* di `LoginScreen.js`, layar status lisensi di Pengaturan HP dengan input kode aktivasi, lock-screen ramah saat expired, serta pengamanan `store_id` pada file cadangan (`backupService.js`). | pending |
| 6 | **Portal Web Superadmin (`/superadmin`)**: Halaman manajemen toko responsif mobile di Web React: kartu statistik (Total, Trial, Active, Expired), tabel toko dengan search & filter, generator lisensi, dan tombol toggle aktivasi langsung. | pending |
| 7 | **Pengujian Komprehensif & Dokumentasi**: Automated test suite (isolasi data antar toko, benturan barcode beda toko, guard expired, registrasi), audit Impeccable, dan pembaruan `docs/context.md`. | pending |

---

## Standar Kualitas & Ketahanan

1. **Zero Data Leakage**: Tidak boleh ada query di controller maupun service layer yang mengeksekusi `Product::all()` atau `Transaction::get()` tanpa klausul `store_id`.
2. **Safe Backup Envelope**: Berkas cadangan JSON (`schema_version: 3`) wajib mengunci `store_id` untuk mencegah pemulihan file toko A ke toko B.
3. **Defensive UI & WCAG**: Seluruh layar registrasi dan modal lisensi di mobile wajib memenuhi standar `impeccable` (touch target ≥ 44dp, font minimal 12px, dan anti-shift typography `includeFontPadding: false`).
