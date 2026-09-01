---
title: Master Pengguna & Manajemen Staf Kasir (Staff & User Management)
description: Modul data master pengguna dan manajemen akun kasir/staf oleh Owner, pembuatan akun kasir baru dari UI web, reset password kasir, pengaturan status aktif, dan audit ringkasan transaksi per kasir.
status: completed
priority: P2
effort: 4h
tags: [backend, auth, rbac, user-management, staff, security]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Pengguna & Manajemen Staf Kasir (Staff & User Management)

## Overview
Menambahkan modul **Master Pengguna & Staf Kasir (User & Staff Management)** ke dalam sistem KasirKita POS. Memberikan antarmuka visual khusus bagi Owner untuk membuat akun kasir baru (misal: *Kasir Shift Pagi - Ani*, *Kasir Shift Sore - Budi*), mereset kata sandi kasir yang lupa password, menonaktifkan akun kasir yang sudah resign/cuti, dan memantau performa penjualan per kasir.

### Prinsip Desain & Integritas Keamanan:
1. **Strict Role-Based Authorization (RBAC):** Hanya pengguna dengan peran `owner` yang berhak mengakses dan mengelola data staf kasir.
2. **Self-Lockout Prevention:** Owner dilarang keras menonaktifkan atau menghapus akun miliknya sendiri agar tidak terkunci dari sistem.
3. **Audit Trail Preservation:** Akun kasir yang dinonaktifkan tidak dihapus fisik (*soft-deletes / is_active flag*) agar riwayat transaksi dan audit kasir sebelumnya tetap utuh.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Database & Skema Pengguna: Penambahan kolom `phone` dan `is_active` (boolean default true) pada tabel `users` serta penyiapan policy otorisasi `UserPolicy` | completed |
| 2 | Backend API: CRUD endpoint `/api/users`, endpoint reset password `/api/users/{id}/reset-password`, dan endpoint ringkasan kinerja kasir `/api/users/{id}/performance` | completed |
| 3 | Keamanan & Validasi: Validasi password minimal 6 karakter, proteksi pencegahan self-delete/self-deactivate untuk akun yang sedang login, dan blokir login untuk kasir `is_active = false` | completed |
| 4 | Frontend Web Dashboard: Halaman Master Pengguna (`/users`) di kelompok menu DATA MASTER dengan kartu staf, badge peran (Owner / Cashier), status aktif, modal tambah kasir, dan modal reset password | completed |
| 5 | Sinkronisasi Header & Profil: Pembaruan dropdown profil dan data kasir aktif | completed |
| 6 | Pengujian Otomatis (Feature Tests): Tes otorisasi RBAC Owner-only, pembuatan kasir baru, tes reset password, proteksi self-delete, dan pencegahan login akun nonaktif | completed |

---

## Key Deliverables
- [x] Kolom `is_active` dan `phone` terpasang di database dengan filter login aktif.
- [x] Endpoint REST API `/api/users` terlindungi middleware otorisasi Owner.
- [x] Pemilik toko dapat membuat akun kasir baru dan mereset password kasir langsung dari dashboard.
- [x] Halaman `/users` aktif di Web Dashboard dengan standar Impeccable UI.
- [x] Seluruh automated feature tests lolos 100%.
