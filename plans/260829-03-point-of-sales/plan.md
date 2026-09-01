---
title: Point of Sales (Kasir)
description: Modul transaksi penjualan cepat, pemotongan stok real-time, dan struk belanja.
status: completed
priority: P1
effort: 10h
tags: [backend, pos, transactions, sales]
created: 2026-08-29
completed: 2026-08-29
assignee: Fullstack Developer
---

# Point of Sales (Kasir)

## Overview
Modul kasir untuk mencatat penjualan langsung secara cepat, mendukung multi-item belanja, kalkulasi diskon dan pajak, pemotongan stok otomatis secara atomic/transactional, serta pencatatan otomatis ke arus kas (*cash flow*).

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | API Checkout Transaksi Penjualan Multi-Item | completed |
| 2 | Pemotongan Stok Otomatis & Validasi Ketersediaan Stok | completed |
| 3 | Kalkulasi Subtotal, Diskon, Pajak & Uang Kembalian | completed |
| 4 | Generator Nomor Struk & Integrasi ke Arus Kas Toko | completed |

## Key Deliverables
- [x] Endpoint POST `/api/pos/checkout` dengan *pessimistic locking* (`lockForUpdate`) mencegah *race conditions*.
- [x] Pemotongan stok otomatis secara *real-time* dan mutasi kartu stok `SALE`.
- [x] Kalkulasi subtotal, diskon, pajak, nominal pembayaran, dan uang kembalian.
- [x] Generator nomor invoice struk otomatis (`INV-YYYYMMDD...`).
- [x] Integrasi otomatis ke arus kas masuk (*Cash Flow IN*).
- [x] Fitur pembatalan transaksi (*void / return*) yang mengembalikan stok dan mencatat arus kas keluar pembalik.
- [x] Automated Feature Tests passing 100% (13 tests, 58 assertions).
