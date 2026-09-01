---
title: Role-Based Access Control (RBAC)
description: Penerapan pembatasan menu dan hak akses akun Owner dan Kasir di Web, Mobile, dan Backend API.
status: completed
priority: P1
effort: 4h
tags: [security, rbac, frontend, mobile, backend]
created: 2026-08-30
completed: 2026-08-30
assignee: Fullstack Developer
---

# Role-Based Access Control (RBAC)

## Overview
Menerapkan sistem kontrol akses berbasis peran (*Role-Based Access Control*) untuk membedakan hak akses dan menu navigasi antara akun **Owner (Pemilik)** dan **Kasir (Cashier)** pada Web Dashboard, Mobile App, dan Backend API Laravel.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Middleware Backend Laravel (`role:owner`) & Proteksi API Keuangan | completed |
| 2 | Proteksi Navigasi Sidebar & Drawer Web Berdasarkan Role (`AppLayout.jsx`) | completed |
| 3 | Route Guards Frontend Web (`ProtectedRoute.jsx` & URL redirect) | completed |
| 4 | Filter Tab Bar Navigasi Mobile App (`mobile/App.js`) | completed |
| 5 | Pengujian Integrasi Multi-Akun & Validasi Build | completed |

## Key Deliverables
- [x] Middleware `CheckRole.php` di Backend Laravel membatasi endpoint keuangan & restock khusus role `owner`.
- [x] Sidebar Web memfilter menu navigasi secara dinamis (Kasir hanya melihat **Kasir POS** & **Riwayat Transaksi**).
- [x] Route Guard Web mengamankan URL `/dashboard`, `/inventory`, `/stock-opname`, dan `/cash-flow` dari akses manual kasir.
- [x] Mobile App menyembunyikan tab **Laporan Toko** saat login sebagai kasir.
- [x] Seluruh unit test backend (17 tests, 78 assertions) dan build frontend lolos 100%.
