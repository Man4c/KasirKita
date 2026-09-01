---
title: Mobile Floating Cart Bar & Bottom Drawer POS
description: Perancangan keranjang belanja mengambang dan bottom drawer responsif pada halaman Kasir POS untuk mengatasi masalah tertutupnya katalog produk saat banyak barang dibeli di layar HP.
status: completed
priority: P1
effort: 3h
tags: [frontend, ui-ux, mobile-responsive, pos]
created: 2026-08-31
completed: 2026-08-31
assignee: Frontend UI/UX Developer
---

# Mobile Floating Cart Bar & Bottom Drawer POS

## Overview
Menyelesaikan masalah tata letak pada halaman **Kasir POS Web** (`/`) saat dibuka di layar HP/Mobile. Ketika banyak barang yang berbeda ditambahkan ke keranjang, panel keranjang tidak lagi memanjang ke atas atau menutupi katalog produk.

Arsitektur yang diterapkan:
1. **Desktop / Tablet Lebar (`lg:flex`):** Tetap menggunakan panel samping (*side-by-side*) permanen di sebelah kanan (`w-96`).
2. **Mobile (`lg:hidden`):** Seluruh layar HP 100% didedikasikan untuk katalog produk & filter kategori. Keranjang belanja tampil dalam bentuk **Bilah Mengambang (*Floating Bottom Bar*)** saat ada $\ge 1$ item, dan rincian lengkapnya terbuka melalui **Bottom Sheet / Drawer** yang elegan saat ditekan.

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Pemisahan Layout Desktop (`hidden lg:flex`) vs Mobile (`lg:hidden`) di `Pos.jsx` | completed |
| 2 | Perancangan Komponen Bilah Keranjang Mengambang (*Floating Bottom Cart Bar*) | completed |
| 3 | Perancangan Komponen Lembar Keranjang Geser (*Mobile Cart Bottom Drawer / Sheet*) | completed |
| 4 | Integrasi Alur Pembayaran & Modal Checkout dari Bottom Drawer | completed |
| 5 | Pengujian Aksesibilitas, Impeccable Zero Anti-Pattern, & Validasi Build | completed |

## Key Deliverables
- [x] Layar katalog produk di HP tidak lagi terdorong atau tertutup oleh keranjang belanja (`pb-24 lg:pb-2` & `flex-1`).
- [x] Floating bottom bar muncul secara dinamis saat keranjang memiliki $\ge 1$ item dengan badge jumlah dan total nominal belanja.
- [x] Bottom drawer menampilkan daftar item belanja (+/- kuantitas, hapus), input diskon, dan tombol *Bayar Sekarang*.
- [x] Tampilan Desktop tidak terpengaruh dan tetap menggunakan side panel `w-96` yang kokoh.
- [x] Lolos pemindaian Impeccable 100% bebas dari *anti-patterns* (zero cramped padding, zero clipping, proper typography).
