---
title: Master Promosi & Diskon (Discounts & Vouchers)
description: Modul data master promosi toko, diskon tanggal kembar, diskon persentase/nominal, promo beli X gratis Y (Buy X Get Y), ambang batas minimal belanja, dan validasi voucher otomatis di kasir POS.
status: completed
priority: P2
effort: 6h
tags: [backend, database, discount, promo, voucher, pos, pricing]
created: 2026-08-31
completed: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Promosi & Diskon (Discounts & Vouchers)

## Overview
Menambahkan modul **Master Promosi & Diskon (Discounts & Vouchers)** ke dalam sistem KasirKita POS. Memungkinkan pemilik toko (Owner) merancang skema promosi penjualan yang menarik untuk meningkatkan omzet dan loyalitas pembeli, seperti:
1. **Diskon Persentase / Nominal Langsung:** Diskon 10% atau potongan langsung Rp10.000.
2. **Diskon Bertingkat / Minimal Belanja:** Diskon 5% jika belanja di atas Rp100.000.
3. **Diskon Event / Tanggal Kembar:** Flash sale promo 9.9, promo gajian, atau promo akhir pekan dengan periode tanggal aktif otomatis.
4. **Promo Bundling / Buy X Get Y:** Beli 2 gratis 1 pada produk tertentu.
5. **Kode Kupon / Voucher Toko:** Pelanggan atau kasir memasukkan kode kupon untuk klaim potongan harga.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `discounts` (id, code, name, type, value, min_purchase, max_discount, start_date, end_date, quota, usage_count, is_active, soft_deletes) dan penambahan `discount_id` & `discount_code` pada tabel `transactions` | completed |
| 2 | Backend API & Model Eloquent: Model `Discount`, CRUD `/api/discounts`, saklar status aktif, dan endpoint verifikasi voucher keranjang belanja `/api/discounts/check-voucher` | completed |
| 3 | Integrasi Mesin Transaksi Kasir POS (`/pos`): Mesin checkout POS memverifikasi keabsahan promo server-side, menghitung ulang potongan anti-tampering, dan menginkremen `usage_count` secara atomik | completed |
| 4 | Struk Belanja & Audit Keuangan: Pencatatan `discount_id`, `discount_code`, dan `discount_amount` pada tabel `transactions` serta pencetakan baris promo pada struk thermal | completed |
| 5 | Frontend Web Dashboard: Halaman Master Promosi (`/discounts`) di kelompok menu DATA MASTER dengan kartu kupon 3 kolom, copy code, filter tipe, kuota bar, dan modal kelola promo | completed |
| 6 | Integrasi Layar Kasir Web POS: Komponen input voucher langsung dan dropdown promo toko di keranjang kasir (`Pos.jsx`) | completed |
| 7 | Pengujian Otomatis (Feature Tests): Tes kalkulasi diskon persentase & nominal, pembatasan kuota, validasi minimal belanja, penolakan kupon kadaluarsa, dan integrasi checkout (`DiscountApiTest.php`) | completed |

---

## Key Deliverables
- [x] Tabel `discounts` terpasang dengan relasi aman ke transaksi penjualan.
- [x] Endpoint REST API `/api/discounts` terlindungi middleware otorisasi Owner dan `/api/discounts/check-voucher` dapat diakses seluruh staf kasir.
- [x] Kasir POS Web dapat mendeteksi promo otomatis atau menerima input kode voucher promo dengan kalkulasi real-time.
- [x] Struk belanja mencantumkan detail kode voucher dan potongan promo secara transparan.
- [x] Halaman `/discounts` aktif di Web Dashboard dengan standar Defensive UI Craft (3 kolom, anti-clipping).
- [x] Seluruh 53 automated feature tests backend lolos 100% (234 assertions).
