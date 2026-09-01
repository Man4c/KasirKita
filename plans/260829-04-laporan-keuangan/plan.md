---
title: Laporan Keuangan & Arus Kas
description: Rekapitulasi penjualan, laporan arus kas (cash flow), dan analitik laba rugi.
status: completed
priority: P2
effort: 8h
tags: [backend, finance, analytics, reports]
created: 2026-08-29
completed: 2026-08-29
assignee: Fullstack Developer
---

# Laporan Keuangan & Arus Kas

## Overview
Menyajikan laporan keuangan otomatis untuk pemilik usaha (UMKM), mencakup arus kas masuk/keluar, omzet penjualan harian/mingguan/bulanan, dan estimasi laba kotor & bersih berdasarkan HPP Average Cost.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | API Rekapitulasi Penjualan (Harian, Mingguan, Bulanan) | completed |
| 2 | API Laporan Arus Kas Masuk & Keluar (Cash Flow) | completed |
| 3 | API Kalkulasi Laba Kotor & Bersih Berbasis HPP | completed |
| 4 | Endpoint Ekspor Laporan (PDF / Excel / CSV) | completed |

## Key Deliverables
- [x] Dashboard metric summary (`GET /api/finance/dashboard`): omzet, total transaksi, total HPP, laba kotor, beban operasional, laba bersih, dan arus kas.
- [x] Sales trend charts (`GET /api/finance/trends`).
- [x] Manajemen Arus Kas Masuk/Keluar (`GET|POST /api/finance/cash-flows`).
- [x] Fitur ekspor laporan CSV stream (`GET /api/finance/export`).
- [x] Automated Feature Tests passing 100% (16 tests, 64 assertions).
