---
title: Master Pelanggan & Keanggotaan (Customer & Membership)
description: Modul data master pelanggan terdaftar, tipe keanggotaan (Reguler, Member VIP, Grosir), nomor WhatsApp untuk struk digital, riwayat akumulasi belanja, dan pencatatan transaksi POS.
status: completed
priority: P1
effort: 5h
tags: [backend, database, customer, pos, membership, whatsapp-receipt]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Pelanggan & Keanggotaan (Customer & Membership)

## Overview
Menambahkan modul **Master Pelanggan (Customer / Member)** ke dalam sistem KasirKita POS. Memungkinkan kasir memilih pelanggan terdaftar saat transaksi di kasir POS, mencatat nomor WhatsApp untuk struk digital, mengelompokkan pelanggan berdasarkan tipe keanggotaan (*Reguler, Member VIP, Grosir*), dan melacak total riwayat akumulasi belanja per pelanggan.

### Prinsip Desain & Integritas Data:
1. **Pemisahan Entitas & Fleksibilitas POS:** Transaksi kasir tetap mendukung *Pelanggan Walk-in / Umum* tanpa paksaan mendaftar, sekaligus mendukung *Pelanggan Terdaftar* dengan lookup instan nama/no HP.
2. **Immutable Snapshot & Safe Cascade:** Menambahkan `customer_id` di tabel `transactions` dengan `ON DELETE SET NULL`. Nama pelanggan saat transaksi (`customer_name`) tetap dipertahankan sebagai snapshot historis anti-retroaktif.
3. **Standar Ketahanan UI (Defensive UI Craft):** Halaman kartu profil pelanggan menggunakan `min-w-0 truncate` pada nama/alamat, `shrink-0 whitespace-nowrap` pada nomor telepon dan badge status, serta tipografi standar WCAG $\ge$ 12px.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `customers` (id, name, phone, email, address, membership_type, notes, is_active, soft_deletes) & alter tabel `transactions` (add `customer_id` nullable FK) | completed |
| 2 | Backend API & Eloquent Model: Model `Customer`, CRUD endpoint `/api/customers`, pencarian live no HP/nama, dan riwayat transaksi pelanggan `/api/customers/{id}/transactions` | completed |
| 3 | Integrasi Layar Kasir POS (`/pos`): Komponen Customer Selector dengan autocomplete live search, tombol cepat tambah pelanggan baru dari kasir, dan penulisan otomatis data pelanggan di struk | completed |
| 4 | Frontend Web Dashboard: Halaman Master Pelanggan (`/customers`) di kelompok menu DATA MASTER dengan kartu profil, filter member, metrik belanja, dan modal kelola data | completed |
| 5 | Integrasi Aplikasi Mobile: Customer picker dan display member di `PosScreen.js` mobile app | completed |
| 6 | Pengujian Otomatis (Feature Tests): Tes CRUD Pelanggan, validasi nomor telepon unik, relasi transaksi POS, dan proteksi soft-deletes | completed |

---

## Key Deliverables
- [x] Tabel `customers` terpasang dengan nomor telepon terindeks dan relasi nullable ke `transactions`.
- [x] Endpoint REST API `/api/customers` dengan validasi FormRequest dan paginasi teroptimasi.
- [x] Layar Kasir POS (`/pos`) memiliki pencarian pelanggan cepat (<200ms) tanpa reload halaman.
- [x] Integrasi Customer Picker dan tampilan nomor WA pada struk di aplikasi mobile (`PosScreen.js`).
- [x] Struk belanja thermal mencantumkan identitas pelanggan terdaftar.
- [x] Halaman `/customers` aktif di Web Dashboard dengan standar Impeccable UI.
- [x] Seluruh automated feature tests lolos 100%.
