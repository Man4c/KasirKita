---
title: Master Meja & Spot Antrean (Tables & Dine-In/Takeaway Queue)
description: Modul data master manajemen meja makan, nomor antrean pesanan kafe/pujasera, status meja (Kosong, Terisi, Reservasi), split bill/gabung meja, dan pemetaan pesanan kasir POS ke meja pelanggan.
status: pending
priority: P2
effort: 6h
tags: [backend, database, fnb, tables, cafe, dining, pos, queue]
created: 2026-08-31
assignee: Fullstack Enterprise Developer
---

# Master Meja & Spot Antrean (Tables & Dine-In/Takeaway Queue)

## Overview
Menambahkan modul **Master Meja & Spot Antrean (Tables & Dine-In/Takeaway Queue)** ke dalam sistem KasirKita POS. Dirancang khusus jika aplikasi digunakan oleh pelaku usaha F&B (Kedai Kopi, Kafe, Restoran, Pujasera, atau Warung Makan):
1. **Pemetaan Meja & Area Makan:** Penataan nomor meja berdasarkan zona (misal: Area Indoor, Outdoor Smoking, Lantai 2, VIP Room).
2. **Indikator Status Meja Real-time:** Status visual meja (*Hijau: Kosong/Tersedia, Merah: Terisi/Sedang Makan, Kuning: Reservasi*).
3. **Pilihan Layanan Kasir (Dine-In vs Takeaway):** Kasir memilih apakah pesanan adalah Makan di Tempat (pilih meja) atau Bungkus / Bawa Pulang (mendapatkan nomor antrean / buzzer).
4. **Otomasi Pembebasan Meja (*Auto-Release*):** Meja otomatis berstatus Kosong (*Available*) saat tagihan kasir telah dibayar lunas atau ditutup.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `dining_tables` (id, table_number, name, zone/area, capacity, status [AVAILABLE/OCCUPIED/RESERVED], active_transaction_id, is_active, soft_deletes) dan penambahan `table_id` & `dining_type` di tabel `transactions` | pending |
| 2 | Backend API & Model Eloquent: Model `DiningTable`, CRUD `/api/tables`, dan endpoint realtime pengubah status meja `/api/tables/{id}/status` | pending |
| 3 | Integrasi Alur Transaksi Kasir POS: Modal pilihan Makan di Tempat (*Dine-in*) vs Bawa Pulang (*Takeaway*), visualisasi denah meja, dan pemetaan transaksi ke nomor meja | pending |
| 4 | Struk Pesanan Dapur & Pelanggan: Struk transaksi thermal dan slip order dapur mencantumkan identitas nomor meja atau nomor antrean bawa pulang | pending |
| 5 | Frontend Web Dashboard: Halaman Master Meja (`/tables`) di kelompok menu DATA MASTER dengan denah visual status meja, filter area/zona, dan modal kelola meja | pending |
| 6 | Integrasi Aplikasi Mobile Kasir: Pemilih meja cepat dan indikator meja terisi pada aplikasi kasir mobile `PosScreen.js` | pending |
| 7 | Pengujian Otomatis (Feature Tests): Tes perubahan status meja saat checkout, pencegahan dobel pesan pada meja terisi, dan pelepasan meja otomatis saat pembayaran selesai | pending |

---

## Key Deliverables
- [ ] Tabel `dining_tables` terpasang dengan relasi aman ke transaksi aktif.
- [ ] Endpoint REST API `/api/tables` terlindungi middleware otorisasi.
- [ ] Kasir POS (Web & Mobile) dapat menetapkan nomor meja atau nomor antrean takeaway.
- [ ] Struk thermal dan slip dapur mencetak nomor meja secara jelas.
- [ ] Halaman `/tables` aktif di Web Dashboard dengan visualisasi status meja interaktif.
- [ ] Seluruh automated feature tests lolos 100%.
