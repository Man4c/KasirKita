---
title: Master Pemasok & Pembelian (Supplier & Procurement)
description: Modul data master pemasok/distributor barang toko, kontak sales/agen, nomor rekening supplier, pencatatan supplier saat restock inventaris, dan riwayat pengeluaran kas pembelian.
status: completed
priority: P2
effort: 5h
tags: [backend, database, supplier, inventory, procurement, cash-flow]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Pemasok & Pembelian (Supplier & Procurement)

## Overview
Menambahkan modul **Master Pemasok (Supplier / Distributor)** ke dalam sistem KasirKita POS. Memungkinkan pemilik toko mengelola data distributor resmi, mencatat kontak sales agen, merekam supplier rujukan saat melakukan restock barang di menu *Inventaris*, dan menautkan pengeluaran kulakan di *Buku Kas Toko* langsung ke data pemasok terkait.

### Prinsip Desain & Integritas Data:
1. **Taut Terpadu Restock & Kas Toko:** Saat melakukan *Restock Barang* di halaman Inventaris atau mencatat kas keluar `PURCHASE` di Buku Kas, pemilik toko dapat memilih nama supplier yang memasok barang.
2. **Audit Riwayat Pasokan & Pembayaran:** Memungkinkan pemilik melihat ringkasan total uang yang telah dibelanjakan ke masing-masing supplier dan histori mutasi barang masuk.
3. **Safe Deletion & Foreign Keys:** Menambahkan `supplier_id` di `stock_movements` dan `cash_flows` dengan `ON DELETE SET NULL` dan `SoftDeletes` untuk menjaga jejak audit akuntansi.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `suppliers` (id, name, contact_person, phone, email, address, bank_account, notes, is_active, soft_deletes) & alter tabel `stock_movements` dan `cash_flows` (add `supplier_id` nullable FK) | completed |
| 2 | Backend API & Eloquent Model: Model `Supplier`, CRUD endpoint `/api/suppliers`, filter pencarian, dan histori pasokan per supplier `/api/suppliers/{id}/history` | completed |
| 3 | Integrasi Restock Inventaris (`/inventory`): Dropdown pemilihan supplier pada modal Restock Barang beserta pembuatan otomatis catatan mutasi masuk bertaut supplier | completed |
| 4 | Integrasi Buku Kas Toko (`/cash-flow`): Input pilihan supplier saat mencatat pengeluaran tipe `PURCHASE` (kulakan barang) untuk mempermudah audit arus kas keluar | completed |
| 5 | Frontend Web Dashboard: Halaman Master Pemasok (`/suppliers`) di kelompok menu DATA MASTER dengan kartu distributor, kontak sales, total volume belanja, dan modal kelola data | completed |
| 6 | Pengujian Otomatis (Feature Tests): Tes CRUD Pemasok, validasi relasi restock inventaris, integrasi buku kas toko, dan verifikasi soft deletes | completed |

---

## Key Deliverables
- [x] Tabel `suppliers` terpasang lengkap dengan indeks kontak dan nomor rekening distributor.
- [x] Endpoint REST API `/api/suppliers` dengan otorisasi Owner-only.
- [x] Modal Restock di Inventaris mendukung pemilihan supplier dan input nomor faktur distributor.
- [x] Catatan arus kas keluar tipe `PURCHASE` dapat terhubung ke akun supplier.
- [x] Halaman `/suppliers` aktif di Web Dashboard dengan standar Impeccable UI.
- [x] Seluruh automated feature tests lolos 100%.
