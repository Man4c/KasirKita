---
title: "Master Pengguna & Staf Kasir Mobile (React Native)"
description: "Implementasi layar manajemen staf, kasir, dan manajer pada aplikasi mobile KasirKita dengan standar Impeccable UI/UX, Native Bottom Sheet, Tap-to-Edit, Reset Password Sheet, dan proteksi RBAC Owner."
status: "done"
priority: "P2"
effort: "5h"
tags:
  - "mobile"
  - "react-native"
  - "master-data"
  - "rbac"
  - "impeccable"
created: "2026-09-05"
assignee: "Antigravity"
---

# Master Pengguna & Staf Kasir Mobile (React Native)

## Overview & Latar Belakang
Manajemen pengguna dan staf kasir di aplikasi mobile saat ini belum memiliki layar tersendiri, meskipun backend `/api/users` sudah mendukung penuh operasi CRUD, toggle status aktif, dan reset password dengan proteksi Role-Based Access Control (RBAC `role:owner`). 

Owner toko yang mengelola outlet dan kasir dari smartphone membutuhkan kemampuan untuk:
1. Menambah kasir atau staf baru secara cepat tanpa harus membuka laptop/web dashboard.
2. Memantau performa ringkas staf (jumlah transaksi & total penjualan yang dihasilkan staf).
3. Mereset PIN/password kasir yang lupa password saat pergantian shift secara langsung dari lantai kasir.
4. Menonaktifkan akses staf yang cuti atau telah keluar (*freeze access*).
5. Mencegah kesalahan fatal seperti *self-deactivation* atau *self-deletion* pada akun owner yang sedang login.

Implementasi ini mengikuti standar ketat **Impeccable Craft**, palet Dark/Rose KasirKita (`#09090b`, `#18181b`, `#27272a`, `#e11d48`, `#fb7185`), **Native Bottom Sheet Modal**, **Tap-to-Edit**, **Touch Target >= 44dp**, dan **Extended FAB** dengan teks `"Tambah Staf"`.

---

## Fitur Utama & Kebutuhan Pengguna

1. **Role-Based Access Control (RBAC):**
   - Hanya user dengan `role === 'owner'` yang dapat mengakses modul ini. Jika kasir mencoba mengakses, tampilkan denied feedback atau sembunyikan launcher tile dari Action Hub & Settings.
   - Proteksi akun mandiri: Owner yang sedang login tidak boleh menonaktifkan status dirinya sendiri atau menghapus akunnya sendiri.
2. **Katalog & Filter Pengguna:**
   - Pencarian real-time (Nama, Email, Username).
   - Filter Tabs: `Semua`, `Kasir`, `Manajer`, `Owner`, `Nonaktif`.
3. **User Card Item (Tap-to-Edit):**
   - Seluruh kartu berstatus *touchable* (ketuk di mana saja untuk edit detail profil & role).
   - Avatar inisial dengan badge role (`Kasir`: Rose/Emerald, `Manajer`: Amber/Sky, `Owner`: Rose Brand).
   - Ringkasan performa staf: badge jumlah transaksi & total omset yang ditangani.
   - Quick action: Tombol "Reset Password" & switch toggle aktif/nonaktif dengan konfirmasi dialog aman.
4. **Native Bottom Sheet Form (`UserFormModal.js`):**
   - Backdrop semi-transparan yang dapat ditutup dengan tap.
   - Drag handle bar di bagian atas.
   - Form input: Nama Lengkap, Username, Email, Role (`cashier`, `manager`), dan Password awal (jika tambah baru).
   - Sticky footer action buttons: `Batal` (44dp) dan `Simpan Perubahan` (44dp).
5. **Reset Password Sheet (`ResetPasswordModal.js`):**
   - Bottom sheet khusus untuk mengganti password kasir/staf dengan validasi konfirmasi password baru secara ringkas.
6. **Extended Floating Action Button (FAB):**
   - Tombol mengambang di pojok kanan bawah dengan teks `"Tambah Staf"` dan ikon `Plus`, memenuhi standar ergonomi jempol.

---

## Arsitektur File & Struktur Komponen

```
mobile/
├── src/
│   ├── api/
│   │   └── userService.js               # Service API get, create, update, delete, resetPassword, toggleStatus
│   ├── components/
│   │   ├── user/
│   │   │   ├── UserCardItem.js          # Komponen kartu pengguna (Tap-to-Edit, metrics, status toggle)
│   │   │   ├── UserFormModal.js         # Native Bottom Sheet Form (Tambah / Edit Staf)
│   │   │   └── ResetPasswordModal.js    # Native Bottom Sheet untuk Reset Password
│   │   └── dashboard/
│   │       └── DashboardActionHub.js    # Tambah launcher tile "Kelola Staf" (Owner-only)
│   └── screens/
│       ├── UserManagementScreen.js      # Screen utama daftar staf, filter, search, FAB
│       └── SettingsScreen.js            # Menu shortcut ke "Kelola Staf"
└── App.js                               # Registrasi rute 'user_management' dengan guard role
```

---

## Phase Breakdown

| Phase | Task Description | Status |
|---|---|:---:|
| **Phase 1: API Service & State** | Pembuatan `userService.js` mengintegrasikan endpoint backend `/api/users` (list, create, update, delete, reset-password, toggle-status). | `done` |
| **Phase 2: UserCardItem Component** | Desain kartu staf dengan Tap-to-Edit, avatar inisial, badge role, metric performa, flexbox pairing defense, dan touch target >= 44dp. | `done` |
| **Phase 3: Native Bottom Sheets** | Pembuatan `UserFormModal.js` (tambah/edit staf) dan `ResetPasswordModal.js` dengan animasi slide, backdrop dismiss, drag handle, dan sticky footer. | `done` |
| **Phase 4: Main Screen & Filter** | Pembuatan `UserManagementScreen.js` dengan header standar KasirKita, tab filter role, search input, list refreshable, empty state, dan Extended FAB. | `done` |
| **Phase 5: Navigation & Action Hub** | Registrasi rute di `App.js`, penambahan tile di `DashboardActionHub.js` dan `SettingsScreen.js` dengan proteksi `user?.role === 'owner'`. | `done` |
| **Phase 6: Impeccable Audit & QA** | Verifikasi kepatuhan terhadap The Readability Floor Rule (>= 12px), The Flexbox Pairing Rule, kontras warna, dan konfirmasi dialog. | `done` |

---

## Standar Defensive UI & Impeccable Craft

1. **The Flexbox Pairing Rule:**
   - Pada baris kartu nama staf (`flexDirection: 'row', justifyContent: 'space-between'`), nama staf dan username wajib memiliki `flexShrink: 1` dengan `numberOfLines={1}`.
   - Badge role atau status aktif di sisi kanan wajib memiliki `flexShrink: 0`.
2. **The Readability Floor Rule:**
   - Seluruh teks label, sub-teks, dan badge menggunakan ukuran font minimum `12px` (dilarang menggunakan font 10px atau 11px).
3. **Touch Target Protection:**
   - Tombol aksi cepat (Reset Password, Switch toggle, Close modal) wajib memiliki dimensi fisik atau `hitSlop` minimum >= 44 x 44 dp.
   - Sticky footer submit buttons wajib memiliki `minHeight: 44` dp.
4. **Self-Destruction Guard (RBAC Safety):**
   - Jika `user.id === currentLoggedInUser.id`:
     - Sembunyikan atau disable tombol hapus (*Delete*).
     - Sembunyikan atau disable switch toggle status aktif.
     - Tampilkan badge khusus `(Anda)` untuk mencegah kebingungan owner.
