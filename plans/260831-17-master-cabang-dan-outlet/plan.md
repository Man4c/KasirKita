---
title: Master Cabang & Multi-Outlet (Multi-Branch Management)
description: Modul data master cabang toko fisik, pemisahan stok inventaris per cabang, transfer stok antar cabang (inter-branch transfer), penugasan staf kasir per outlet, dan konsolidasi laporan omzet multi-outlet.
status: pending
priority: P1
effort: 8h
tags: [backend, database, multi-branch, outlet, inventory-transfer, enterprise]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Cabang & Multi-Outlet (Multi-Branch Management)

## Overview
Menambahkan modul **Master Cabang & Multi-Outlet (Multi-Branch Management)** ke dalam sistem KasirKita POS. Memungkinkan pemilik usaha UMKM yang sedang berekspansi mengelola lebih dari satu gerai fisik (misal: *Cabang Pusat Pasar Baru, Cabang Mall Sukamaju, Cabang Food Court*) dalam satu aplikasi terpusat:
1. **Isolasi Stok Inventaris per Cabang:** Tiap cabang memiliki jumlah stok fisik masing-masing sehingga penjualan di Cabang A tidak mengurangi stok di Cabang B.
2. **Transfer Stok Antar Cabang (*Inter-Branch Stock Transfer*):** Kirim stok berlebih dari gudang/pusat ke cabang yang kehabisan stok dengan nomor jalan kirim dan konfirmasi terima barang.
3. **Penugasan Staf Kasir per Outlet:** Akun kasir hanya dapat bertransaksi pada cabang tempat kasir tersebut ditugaskan, sementara Owner dapat memantau seluruh cabang.
4. **Konsolidasi Laporan Keuangan:** Owner dapat memantau kinerja per cabang secara terpisah atau melihat total konsolidasi seluruh outlet toko.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `branches` / `outlets` (id, code, name, address, phone, pic_name, is_main, is_active, soft_deletes) dan pivot tabel `branch_product_stocks` untuk saldo stok per cabang | pending |
| 2 | Relasi Transaksi & Mutasi Cabang: Penambahan kolom `branch_id` pada tabel `transactions`, `stock_movements`, `cash_flows`, dan relasi penugasan staf `users` | pending |
| 3 | Backend API & Model Eloquent: Model `Branch`, CRUD `/api/branches`, dan modul transfer stok antar cabang `/api/stock-transfers` (kirim & terima barang) | pending |
| 4 | Outlet Switcher & Multi-Tenant Context: Middleware penentu konteks cabang aktif untuk kasir dan dropdown pemilih outlet di header dashboard Owner | pending |
| 5 | Struk Belanja per Cabang: Header struk thermal otomatis mencetak nama cabang, alamat gerai, dan nomor kontak cabang yang bersangkutan | pending |
| 6 | Frontend Web Dashboard: Halaman Master Cabang (`/branches`) di kelompok menu DATA MASTER dengan kartu outlet, status cabang utama/pusat, dan modal kelola cabang | pending |
| 7 | Integrasi Aplikasi Mobile Kasir: Sinkronisasi pemilihan outlet saat login kasir pada aplikasi mobile `LoginScreen.js` dan `PosScreen.js` | pending |
| 8 | Pengujian Otomatis (Feature Tests): Tes pemisahan stok antar cabang, tes mutasi transfer stok, dan tes pembatasan akses kasir ke cabang lain | pending |

---

## Key Deliverables
- [ ] Tabel `branches` dan `branch_product_stocks` terpasang dengan isolasi data multi-cabang.
- [ ] Endpoint REST API `/api/branches` dan `/api/stock-transfers` terlindungi otorisasi Owner.
- [ ] Kasir POS hanya memotong stok cabang aktif saat transaksi.
- [ ] Struk thermal mencetak identitas spesifik cabang toko.
- [ ] Halaman `/branches` aktif di Web Dashboard dengan standar Defensive UI Craft.
- [ ] Seluruh automated feature tests lolos 100%.
