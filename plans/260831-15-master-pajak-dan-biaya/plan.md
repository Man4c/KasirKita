---
title: Master Pajak & Biaya Tambahan (Tax & Service Fees)
description: Modul data master pajak pertambahan nilai (PPN/PB1 Restoran), biaya admin pembayaran digital QRIS/EDC, biaya kemasan/kantong kresek takeaway, dan kalkulasi dinamis pada transaksi POS.
status: completed
priority: P2
effort: 5h
tags: [backend, database, tax, fees, qris-surcharge, packaging, pos]
created: 2026-08-31
completed: 2026-09-01
assignee: Fullstack Enterprise Developer
---

# Master Pajak & Biaya Tambahan (Tax & Service Fees)

## Overview
Menambahkan modul **Master Pajak & Biaya Tambahan (Tax & Service Fees)** ke dalam sistem KasirKita POS. Memungkinkan toko dan kafe mematuhi regulasi pajak lokal sekaligus mengelola biaya operasional tambahan secara fleksibel dan transparan:
1. **Pajak Restoran / Penjualan (PB1 / PPN):** Pajak 10% atau 11% yang dapat diatur include (harga sudah termasuk pajak) atau exclude (pajak ditambahkan di akhir tagihan).
2. **Biaya Tambahan Operasional (Packaging / Kantong Plastik):** Biaya kemasan atau kantong kresek (misal: Rp200/kantong) yang dapat di-toggle kasir secara cepat saat checkout.
3. **Biaya Layanan / Service Charge:** Biaya servis 5% khusus operasional kafe/resto.
4. **Biaya MDR / Admin Pembayaran Digital:** Biaya administrasi tambahan khusus metode bayar non-tunai (misal: surcharge QRIS 0.7% atau MDR EDC Kartu Debit).

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | Migrasi Database: Tabel `taxes_and_fees` (id, name, type [PERCENTAGE/FIXED], value, apply_to [ALL/SPECIFIC_PAYMENT/TAKEAWAY_ONLY/MANUAL], is_tax, is_default, is_active, soft_deletes) | completed |
| 2 | Backend API & Model Eloquent: Model `TaxAndFee`, CRUD `/api/taxes-and-fees`, dan logika engine kalkulasi pajak & biaya pada checkout POS | completed |
| 3 | Integrasi Layar Kasir POS (`/pos`): Saklar cepat biaya kantong kresek, kalkulasi pajak otomatis transparan, dan penyesuaian biaya admin saat beralih ke QRIS | completed |
| 4 | Struk Belanja & Pembukuan Kas: Snapshot nominal pajak (`tax_amount`) dan rincian biaya (`fee_amount`) tertera rinci pada struk belanja thermal dan buku kas | completed |
| 5 | Frontend Web Dashboard: Halaman Master Pajak & Biaya (`/taxes-and-fees`) di kelompok menu DATA MASTER dengan status aktif, filter tipe biaya, dan modal kelola data | completed |
| 6 | Integrasi Aplikasi Mobile Kasir: Tampilan rincian subtotal, pajak, dan biaya tambahan di modal keranjang belanja `PosScreen.js` | completed |
| 7 | Pengujian Otomatis (Feature Tests): Tes akurasi pembulatan pajak, aktivasi biaya QRIS saat bayar QRIS, dan pemisahan pembukuan kas netto vs bruto | completed |

---

## Key Deliverables
- [x] Tabel `taxes_and_fees` terpasang dengan filter trigger dinamis.
- [x] Endpoint REST API `/api/taxes-and-fees` terlindungi middleware otorisasi Owner.
- [x] Kasir POS (Web & Mobile) dapat menerapkan pajak dan biaya kemasan/admin secara akurat.
- [x] Struk belanja mencantumkan baris Pajak dan Biaya Tambahan secara terpisah dan jelas.
- [x] Halaman `/taxes-and-fees` aktif di Web Dashboard dengan standar Defensive UI Craft.
- [x] Seluruh automated feature tests lolos 100%.
