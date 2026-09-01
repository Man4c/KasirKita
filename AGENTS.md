# AGENTS.md

Project ini adalah **KasirKita POS** (Aplikasi Kasir & POS Multi-Platform Web & Mobile untuk UMKM).

Sebelum mengerjakan task, baca:

1. `docs/index.md`
2. `docs/context.md`
3. `docs/PRD-KasirKita.md`
4. Modul task terkait di `plans/`
5. `graphify-out/GRAPH_REPORT.md` jika tersedia
6. `graphify-out/graph.json` jika tersedia

Setelah sesi kerja atau ada keputusan penting, update `docs/context.md` dan `plans/`.

## Working Rules

- **Frontend & UI/UX Craft:** WAJIB selalu menggunakan skill `impeccable` untuk setiap pekerjaan frontend (Web React & Mobile React Native), perancangan UI, tata letak, komponen, dan perbaikan tampilan.
- **Standar Ketahanan Layout (Defensive UI Craft):**
  1. *The Flexbox Pairing Rule:* Setiap kontainer 2-sisi (`flex justify-between`), teks dinamis (nama produk/kategori/pelanggan) WAJIB memakai `min-w-0 truncate`, dan pasangan lawannya (harga, stok, badge status, ikon) WAJIB memakai `shrink-0 whitespace-nowrap`.
  2. *The Readability Floor Rule:* Dilarang keras menggunakan ukuran font kustom di bawah 12px (`text-[10px]`, `text-[11px]`). Ukuran teks terkecil yang diizinkan adalah `text-xs` (12px) demi memenuhi standar keterbacaan WCAG.
  3. *The Data Table Protection Rule:* Seluruh sel tabel untuk nominal mata uang, kuantitas stok, tanggal/jam, badge status, dan tombol aksi WAJIB memakai `whitespace-nowrap` agar tidak terlipat/patah 2 baris saat layar menyempit.
- Selalu gunakan bahasa yang mudah dipahami orang awam saat menjelaskan.
- Jangan refactor besar kecuali dibutuhkan oleh task.
- Ikuti pola file dan style yang sudah ada.
- Jangan revert perubahan user yang tidak terkait.
- Gunakan tool edit yang aman.
- Jalankan test/check yang relevan setelah perubahan.

## Project Memory

- Progress terbaru dan keputusan arsitektur hidup di `docs/context.md`.
- Rencana dan status task per modul hidup di `plans/`.
- Jika ada perubahan penting pada UI, logic, storage, API, struktur file, atau dependency, update `docs/context.md` dan modul terkait di `plans/`.
