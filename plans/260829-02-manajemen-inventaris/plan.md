---
title: Manajemen Inventaris & HPP
description: Sistem inventaris perpetual, kalkulasi HPP Average Cost, dan modul stock opname.
status: completed
priority: P1
effort: 12h
tags: [backend, inventory, hpp, core]
created: 2026-08-29
completed: 2026-08-29
assignee: Fullstack Developer
---

# Manajemen Inventaris & HPP

## Overview
Implementasi modul inventaris toko ritel dengan pencatatan perpetual otomatis, kalkulasi Harga Pokok Penjualan (HPP) menggunakan metode Average Cost (Biaya Rata-Rata), serta penyesuaian stok fisik via Stock Opname.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | API CRUD Produk & Kategori Barang | completed |
| 2 | Algoritma Perpetual System & Pencatatan Kartu Stok | completed |
| 3 | Logika Valuasi HPP Average Cost (Biaya Rata-Rata) | completed |
| 4 | API Pencatatan Stok Masuk (Restock / Supplier) | completed |
| 5 | API Penyesuaian Stok (Stock Opname Fisik vs Sistem) | completed |

## Key Deliverables
- [x] API CRUD Kategori (`/api/categories`) & Produk (`/api/products`) dengan pagination, search, dan filter low stock.
- [x] Logika kartu stok digital di tabel `stock_movements` (`/api/products/{id}/stock-movements`).
- [x] Algoritma Moving Average Cost & Perpetual Restock (`/api/products/{id}/restock`).
- [x] Modul audit fisik & rekonsiliasi selisih stok Stock Opname (`/api/stock-opnames`).
- [x] Automated Feature Tests passing 100% (10 tests, 45 assertions).
