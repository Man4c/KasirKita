---
title: Master Satuan & Multi-UoM Conversion Engine
description: Arsitektur Master Satuan Barang (UoM) dengan Multi-Konversi pecahan (DECIMAL 12,4), Single Source of Truth Base Unit, Partial Unique Index, Deadlock-Free Ordered Locking, dan Immutable Transaction Snapshots.
status: completed
priority: P1
effort: 6h
tags: [backend, database, inventory, pos, multi-uom, enterprise-architecture]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Satuan & Multi-UoM Conversion Engine

## Overview
Menerapkan sistem **Master Satuan Barang (*Unit of Measure / UoM*)** dan **Multi-Konversi Satuan Terpadu** pada KasirKita POS. Memungkinkan toko ritel & grosir membeli barang dalam kemasan besar (Dus, Karton, Renceng) dan menjual dalam satuan eceran (Pcs, Botol, Butir) atau pecahan timbangan (Kg, Gram, Ons, Liter, Gelas).

### Prinsip Desain:
1. **Single Source of Truth in Base Unit:** Stok fisik (`stock`) dan HPP (`avg_cost`) internal dicatat dalam satuan terkecil dengan presisi `DECIMAL(12,4)` & `DECIMAL(15,4)`.
2. **Database-Level Partial Unique Index:** Mencegah duplikasi base unit per produk (`WHERE is_base = true`).
3. **Check Constraint:** `conversion_factor > 0`.
4. **Deadlock-Free Pessimistic Locking:** Sorting `product_id` deterministik sebelum `lockForUpdate()`.
5. **Immutable Historical Snapshot:** `transaction_items` mencatat snapshot nama satuan, harga, HPP saat jual, dan `ON DELETE SET NULL` dengan `SoftDeletes`.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `units`, `product_unit_conversions`, Constraints, FK on delete set null, & Chunked Backfill | completed |
| 2 | Backend API & Eloquent Models: CRUD Master Satuan, Relasi Produk-UoM, & Validation Rules | completed |
| 3 | Logic Engine (`InventoryService` & `PosService`): Deadlock-free ordered lock, konversi stok base, dan snapshot transaksi | completed |
| 4 | Frontend Web Dashboard: Halaman Master Satuan (`/units`), Form Produk dengan Multi-Konversi, & Opsi Satuan di Restock/POS | completed |
| 5 | Mobile POS: Integrasi multi-satuan dan deteksi barcode varian satuan | completed |
| 6 | Pengujian Otomatis (Concurrency Lock Test, Multi-UoM Conversion, & Rounding Drift Validation) | completed |

## Key Deliverables
- [x] Tabel `units` & `product_unit_conversions` terpasang dengan Partial Unique Index, Unique Barcode, dan Check Constraint.
- [x] Seluruh data produk eksisting ter-backfill otomatis via `chunkById(200)` tanpa downtime.
- [x] `PosService` mengunci baris produk secara terurut (`sortBy('product_id')`) untuk mencegah deadlock antar-kasir.
- [x] `transaction_items` merekam snapshot satuan dan HPP historis anti-retroaktif.
- [x] Halaman Master Satuan (`/units`) aktif di Web Dashboard dengan standardisasi Impeccable UI.
- [x] Seluruh automated feature tests lolos 100%.
