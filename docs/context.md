# Context Project

File ini adalah memory kerja untuk project **KasirKita POS**.
Update file ini setelah sesi kerja, setelah ada keputusan arsitektur baru, atau setelah perilaku UI/logic penting berubah.

## Ringkasan Project

- **Stack:**
  - Backend: Laravel REST API + Laravel Sanctum
  - Database: PostgreSQL
  - Frontend Web: React.js + Tailwind CSS
  - Frontend Mobile: React Native + Expo
  - Client Storage: SecureStore (Mobile), LocalStorage/Cookies (Web)
- **Tujuan:** Solusi operasional kasir (POS), inventaris (Perpetual & Average Cost), stock opname, dan laporan keuangan/arus kas untuk UMKM ritel.
- **Entry point:** Belum diinisialisasi (Proyek baru).
- **Folder penting:**
  - `docs/`: Dokumentasi teknis, PRD, instruksi memory agent.
  - `plans/`: Rencana modular dan pelacakan fase task untuk `plans-kanban`.
  - `graphify-out/`: Hasil analisis struktur kode dan visualisasi arsitektur.

## Progress Terbaru

- **Resolusi Anti-Patterns & Defect Impeccable pada Master Produk (`ProductManagementScreen.js`, `ProductCardItem.js`)**:
  - Menyelesaikan 7 AI tells dan 16 quality issues yang terdeteksi pada audit browser Master Produk:
    1. *Eliminasi AI Color Palette Cyan Neon*: Mengganti warna teks kategori cyan neon (`#38bdf8`) menjadi badge pill terstruktur dengan background `#27272a`, border `#3f3f46`, dan teks netral `#d4d4d8` yang tenang dan profesional.
    2. *Resolusi Flat Type Hierarchy*: Meningkatkan skala tipografi halaman (`screenTitle` dinaikkan dari 18px ke **22px**, `priceValue` 16px, `productName` 15px, `costValue` 13px, dan label 12px), sehingga rasio skala tipografi melompat ke $\ge 1.83:1$ dan memberikan ritme visual serta *scanability* yang tegas.
    3. *Perbaikan Kontras Ekstrem (WCAG AAA)*:
       - Chip Kategori Aktif: Mengganti teks `#fb7185` di atas `#e11d48` (1.7:1) menjadi background `#e11d48` dengan teks putih murni **`#ffffff`** (rasio kontras **6.3:1**).
       - Filter Status Tidak Aktif: Mengganti warna teks `#71717a` (3.7:1) menjadi **`#d4d4d8`** (rasio kontras **9.4:1** di atas `#18181b`) dan ikon `#a1a1aa`.
       - Badge Stok & Tombol "Stok Masuk": Mengganti background RGBA flattening yang terdeteksi rendah menjadi background gelap solid kontras tinggi (`#12261e` untuk safe/restock, `#292010` untuk low, `#2a1418` untuk out) dengan teks `#34d399`, `#fbbf24`, `#f87171` yang memiliki rasio kontras $\ge \mathbf{8.4:1}$ (lulus WCAG AAA).
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos verifikasi build Expo Web (`npx expo export --platform web`).

- **Penyelesaian Penuh Plan #28: Master Promosi & Voucher Diskon di Mobile (Fase 1 s/d Fase 6 - Status: COMPLETED)**:
  - Mengembangkan modul manajemen Master Promosi & Voucher Diskon lengkap di aplikasi Mobile (React Native) untuk Owner/Manager UMKM:
    1. *Layanan API & Cache Offline (`discountService.js`, `offlineStorage.js`)*: Mengelola CRUD promosi, paginasi, filter pencarian & status, toggle aktif/nonaktif atomik, serta validasi kupon checkout kasir (`checkVoucher`) yang dilengkapi **Graceful Offline Fallback** (`calculateDiscountOffline`) di memori lokal saat internet terputus.
    2. *Komponen Antarmuka Defensive UI (`PromoCardItem.js`, `PromoManagementScreen.js`)*: Desain kartu kupon tiket aksen Rose Brand (`#fb7185`), flexbox pairing aman `min-w-0 truncate` vs `shrink-0`, progress bar pemakaian kuota, saklar toggle instan `Switch`, 3 kartu metrik ringkasan, pencarian instan debounce 350ms, filter status tab chips (*Semua*, *Aktif*, *Non-Aktif*, *Kadaluarsa / Habis*), dan FAB `[ + Tambah Promo ]`.
    3. *Modal Formulir Tambah/Edit (`PromoFormModal.js`)*: Format huruf kapital otomatis kode voucher, selector 3 skema diskon (`PERCENTAGE`, `FIXED`, `MIN_SPEND`), batas maksimal nominal potongan, syarat minimal belanja, tanggal periode aktif 2-kolom, dan tombol hapus aman.
    4. *Integrasi Navigasi Hub Menu & RBAC Role Owner (`DashboardActionHub.js`, `DashboardScreen.js`, `mobile/App.js`)*: Menghubungkan tile "Promosi" pada Action Hub Dashboard langsung ke `PromoManagementScreen`, mempertahankan strictly 4 bottom navigation tabs, dan menyinkronkan data voucher ke modal promo kasir POS (`availablePromos`).
    5. *Pengujian Komprehensif & Verifikasi Kualitas*:
       - Backend Feature Tests: `php artisan test --filter=DiscountApiTest` $\rightarrow$ **8 passed, 34 assertions** (100% lolos).
       - Impeccable UI Linter: `detect.mjs` $\rightarrow$ **0 defects**.
       - Expo Web Bundling: `npx expo export --platform web` $\rightarrow$ **Web Bundled 698ms index.js (2322 modules), 0 errors**.
  - Plan #28 resmi berstatus **`completed`**.

- **Penyelesaian Plan #28 Fase 5: Integrasi Navigasi Hub Menu Dashboard & Sinkronisasi Kasir POS (`DashboardActionHub.js`, `DashboardScreen.js`, `App.js`)**:
  - Menghubungkan modul Master Promosi & Voucher Diskon ke arsitektur navigasi mobile aplikasi:
    1. *Peluncur Action Hub Dashboard (`DashboardActionHub.js`)*: Ubin **"Promosi"** (ikon tiket `TicketPercent`, aksen Rose Brand `#fb7185`) kini terhubung langsung ke callback `onOpenMasterPromo` menggantikan alert placeholder sebelumnya.
    2. *Layar Dashboard (`DashboardScreen.js`)*: Menghandle aksi launcher `onOpenMasterPromo` dan meneruskannya via `navigation.navigate('promo_management')`.
    3. *Rute Internal & Proteksi RBAC (`mobile/App.js`)*: Mendaftarkan route internal `promo_management` di bawah proteksi `user?.role === 'owner'`, dilengkapi navigasi `goBack` kembali ke Dashboard.
    4. *Preservasi Bottom Navigation Bar*: Menjaga strictly 4 tab utama (Dashboard, Kasir POS, Riwayat, Pengaturan) tanpa menambah tab baru demi kebersihan layout mobile.
    5. *Sinkronisasi Otomatis Kasir POS*: Pembaruan kupon dari Master Promo langsung tersinkronisasi ke katalog voucher POS (`availablePromos`) dan cache offline katalog (`offlineStorage.cacheCatalog` / `offlineStorage.cachePromos`).
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 5: `completed`.

- **Penyelesaian Plan #28 Fase 4: Modal Formulir Tambah & Edit Promosi (`PromoFormModal.js`)**:
  - Mengembangkan modal formulir interaktif [`mobile/src/components/promo/PromoFormModal.js`](file:///d:/Projects/KasirKita/mobile/src/components/promo/PromoFormModal.js) berstandar *Impeccable Defensive UI*:
    1. *Identitas & Kode Kupon*: Input otomatis huruf kapital dan pembersihan spasi (`toUpperCase().replace(/\s+/g, '')`), nama promosi publik, serta catatan deskripsi/syarat ketentuan.
    2. *Selector Skema Diskon*: Pilihan 3 chip tipe promosi fleksibel: `PERCENTAGE` (Diskon %), `FIXED` (Potongan Rp), dan `MIN_SPEND` (Min. Belanja).
    3. *Parameter & Batasan Promosi*: Input besaran diskon persen (1-100%) atau nominal rupiah, batas maksimal potongan nominal rupiah (khusus persentase), batas minimal belanja pelanggan, batas kuota total penukaran kupon, dan input 2-kolom tanggal mulai s/d selesai masa berlaku (`YYYY-MM-DD`).
    4. *Status & Proteksi Aksi*: Saklar toggle status aktif promo (`Switch`), tombol simpan dengan spinner saat proses submit, serta tombol hapus terproteksi konfirmasi aman di mode edit.
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 4: `completed`.

- **Penyelesaian Plan #28 Fase 3: Komponen Kartu Tiket Promo (`PromoCardItem.js`) & Layar Utama (`PromoManagementScreen.js`)**:
  - Mengembangkan tampilan antarmuka Master Promosi & Voucher Diskon berstandar *Impeccable Defensive UI*:
    1. *Kartu Tiket Promo (`PromoCardItem.js`)*: Desain bergaya voucher kupon dengan aksen Rose Brand (`#fb7185`), badge kode kupon dashed border, nilai diskon persentase/potongan nominal kontras tinggi, identitas promo terlindungi `min-w-0 truncate`, rincian syarat minimal belanja & masa berlaku tanggal, progress bar pemakaian kuota voucher, indikator status (*Aktif Digunakan*, *Non-Aktif*, *Kadaluarsa / Kuota Habis*), saklar toggle `Switch` instan, serta tombol aksi cepat [Edit] dan [Hapus].
    2. *Layar Utama (`PromoManagementScreen.js`)*: Header rapi dengan tombol kembali ke Dashboard dan refresh berputar, metrik ringkasan kupon (Total Promo, Voucher Aktif, Total Penggunaan), banner offline otomatis, pencarian instan debounce 350ms, filter status tab chips (*Semua*, *Aktif*, *Non-Aktif*, *Kadaluarsa / Habis*), FlatList dengan empty state terpadu, dan tombol FAB `[ + Tambah Promo ]`.
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 3: `completed`.

- **Penyelesaian Plan #28 Fase 2: Pembuatan Mobile API Service (`discountService.js`) & Cache Offline (`offlineStorage.js`)**:
  - Mengembangkan modul layanan API komprehensif [`mobile/src/services/discountService.js`](file:///d:/Projects/KasirKita/mobile/src/services/discountService.js):
    1. `getDiscounts(params)`: Mengambil daftar kupon diskon dengan dukungan paginasi, pencarian teks, filter tipe (`PERCENTAGE`, `FIXED`, `MIN_SPEND`), filter status (`active`, `inactive`, `expired`), dan pembaruan cache offline otomatis.
    2. `getDiscount(id)`: Mengambil rincian detail promo beserta riwayat 5 transaksi pemakai kupon.
    3. `createDiscount(payload)`: Membuat program promosi baru, mengkapitalisasi kode voucher, dan menyimpan ke cache lokal (`upsertCachedPromo`).
    4. `updateDiscount(id, payload)`: Menyunting parameter promo dan memperbarui snapshot lokal.
    5. `deleteDiscount(id)`: Menghapus promo dari backend dan cache lokal (`removeCachedPromo`).
    6. `toggleStatus(id)`: Saklar cepat aktifkan / nonaktifkan promo secara atomik.
    7. `checkVoucher(code, subtotal)`: Validasi kupon voucher online via API dengan *graceful offline fallback* kalkulasi lokal (`calculateDiscountOffline`), mengecek masa berlaku, kuota penggunaan, dan minimum pembelanjaan secara mandiri saat internet kasir terputus.
  - Memperkaya [`mobile/src/services/offlineStorage.js`](file:///d:/Projects/KasirKita/mobile/src/services/offlineStorage.js) dengan helper method: `cachePromos`, `getCachedPromos`, `upsertCachedPromo`, dan `removeCachedPromo`.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`) dan audit linter Impeccable (0 defects). Status Fase 2: `completed`.

- **Penyelesaian Plan #28 Fase 1: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend Master Promosi & Voucher (`plans/260904-28-mobile-master-promosi/plan.md`)**:
  - Memverifikasi endpoint backend REST API Laravel di `DiscountController.php`:
    1. `GET /api/discounts`: Mengambil daftar diskon & kupon dengan filter pencarian (`search`), tipe (`PERCENTAGE`, `FIXED`, `MIN_SPEND`), status (`active`, `inactive`, `expired`), dan relasi `transactions_count`.
    2. `POST /api/discounts` & `PUT /api/discounts/{id}`: Otorisasi Owner untuk membuat & menyunting kupon dengan validasi kode unik uppercase otomatis, nilai diskon, syarat minimal belanja, batas maksimal nominal potongan, periode aktif, dan batas kuota.
    3. `DELETE /api/discounts/{id}`: Soft delete promo dari sistem.
    4. `PATCH /api/discounts/{id}/toggle-status`: Saklar instan aktifkan / nonaktifkan promo tanpa membuka form modal.
    5. `POST /api/discounts/check-voucher`: Validasi kupon kasir saat checkout POS (`subtotal`, masa berlaku, batas kuota, minimum order).
  - Memverifikasi seluruh 8 feature tests backend di `tests/Feature/DiscountApiTest.php` (**8 passed, 34 assertions**).
  - Merancang arsitektur defensive UI: `PromoManagementScreen.js` (header, metrik promo, tab chip status, list voucher), kartu `PromoCardItem.js` (gaya tiket kupon aksen Rose Brand `#fb7185`, toggle saklar instan, progress kuota), modal `PromoFormModal.js` (tipe diskon, batas potongan, periode aktif, kuota), dan integrasi offline cache di `discountService.js`. Status Fase 1: `completed`.

- **Penyelesaian Penuh Plan #27: Master Satuan Barang di Mobile (Fase 1 s/d Fase 6 - Status: COMPLETED)**:
  - Mengembangkan modul manajemen Master Satuan Barang (*Unit of Measure / UoM*) lengkap di aplikasi Mobile (React Native) untuk Owner/Manager UMKM:
    1. *Layanan API & Cache Offline (`unitService.js`, `offlineStorage.js`)*: Mengelola CRUD satuan dengan sinkronisasi instan ke storage offline, pencarian lokal/server, serta penanganan error responsif (termasuk validasi simbol unik 422).
    2. *Komponen Antarmuka Defensive UI (`UnitCardItem.js`, `UnitManagementScreen.js`)*: Menampilkan identitas satuan dengan badge simbol ungu modern (`#c084fc`, misal `[ PCS ]`, `[ KG ]`, `[ BOX ]`), nama satuan `min-w-0 truncate`, statistik pemakaian produk dasar & konversi, status tag *"Digunakan Produk"* vs *"Bisa Dihapus"*, metrik ringkasan, pencarian instan, dan FAB tambah kilat.
    3. *Modal Formulir Tambah/Edit (`UnitFormModal.js`)*: Dilengkapi tombol chip preset rekomendasi satuan populer UMKM Indonesia (*pcs, box, btl, porsi, cup, kg, gr, ltr, pack, sachet*) untuk entri 1-ketukan, validasi simbol wajib, dan proteksi hapus satuan berelasi.
    4. *Integrasi Peluncur & Navigasi RBAC (`DashboardActionHub.js`, `DashboardScreen.js`, `App.js`)*: Menghubungkan ubin **"Satuan"** pada Action Hub Dashboard langsung ke `UnitManagementScreen` di bawah otorisasi Owner, dengan tombol kembali ke Dashboard dan tetap mempertahankan strictly 4 tab bottom navigation.
    5. *Pengujian Komprehensif & Verifikasi Kualitas*:
       - Backend Feature Tests: `php artisan test --filter=MultiUomTest` $\rightarrow$ **2 passed, 18 assertions** (100% lolos).
       - Impeccable UI Linter: `detect.mjs` $\rightarrow$ **0 defects**.
       - Expo Web Bundling: `npx expo export --platform web` $\rightarrow$ **Web Bundled 707ms index.js (2318 modules), 0 errors**.
  - Plan #27 resmi berstatus **`completed`**.

- **Penyelesaian Plan #27 Fase 3 & Fase 4: Komponen Kartu, Layar Utama (`UnitManagementScreen.js`), & Modal Form Tambah/Edit (`UnitFormModal.js`)**:
  - Mengembangkan antarmuka Master Satuan Barang mobile yang utuh dan berstandar *Impeccable Defensive UI*:
    1. *Kartu Satuan (`UnitCardItem.js`)*: Menampilkan identitas satuan dengan badge simbol kontras ungu modern (`#c084fc`, misal: `[ PCS ]`, `[ KG ]`, `[ BOX ]`), nama satuan `min-w-0 truncate`, rincian breakdown pemakaian produk dasar & varian multi-konversi, indikator status *"Digunakan Produk"* vs *"Belum Dipakai (Aman)"*, serta tombol aksi [Edit] dan [Hapus] (terproteksi jika berelasi).
    2. *Layar Utama (`UnitManagementScreen.js`)*: Header bersih dengan tombol kembali ke Dashboard & refresh, ringkasan metrik satuan total & satuan aktif dipakai produk, pencarian real-time (nama, simbol), banner offline otomatis, FlatList dengan empty state elegan, dan FAB `[ + ]`.
    3. *Modal Formulir (`UnitFormModal.js`)*: Formulir interaktif dengan preset cepat rekomendasi satuan populer UMKM Indonesia (*pcs, box, btl, porsi, cup, kg, gr, ltr, pack, sachet*) untuk pengisian 1-ketukan, validasi simbol wajib unik, dan penanganan error responsif.
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos verifikasi build Expo Web (`npx expo export --platform web`). Status Fase 3 & 4: `completed`.

- **Penyelesaian Plan #27 Fase 2: Pembuatan Mobile API Service (`unitService.js`) & Sinkronisasi Cache Offline Satuan (`offlineStorage.js`)**:
  - Mengembangkan service wrapper terintegrasi [`mobile/src/services/unitService.js`](file:///d:/Projects/KasirKita/mobile/src/services/unitService.js):
    1. `getUnits(params)`: Mengambil daftar satuan barang, mendukung filter pencarian lokal/server, dan meng-cache data lokal secara otomatis.
    2. `getUnit(id)`: Mengambil rincian data spesifik satuan.
    3. `createUnit(payload)`: Membuat satuan baru dengan validasi simbol unik dan penambahan atomik ke cache offline lokal (`upsertCachedUnit`).
    4. `updateUnit(id, payload)`: Menyunting nama, simbol, atau keterangan satuan serta memperbarui cache offline.
    5. `deleteUnit(id)`: Menghapus satuan tidak terpakai, membersihkan dari cache lokal (`removeCachedUnit`), dan menangani pesan error jika satuan masih terhubung produk aktif (`products_count > 0 || conversions_count > 0`).
    6. *Offline-First Fallback*: Saat offline, otomatis membaca data satuan dari `offlineStorage` dan menyaring kata kunci pencarian secara instan di memori.
  - Memperkaya [`mobile/src/services/offlineStorage.js`](file:///d:/Projects/KasirKita/mobile/src/services/offlineStorage.js) dengan helper method: `upsertCachedUnit` dan `removeCachedUnit`.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 2: `completed`.

- **Penyelesaian Plan #27 Fase 1: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend Master Satuan (`plans/260904-27-mobile-master-satuan/plan.md`)**:
  - Memverifikasi endpoint backend REST API Laravel:
    1. `GET /api/units`: Mengembalikan seluruh satuan dengan penghitungan relasi `products_count` (base unit) dan `conversions_count` (multi-UoM).
    2. `GET /api/units/{id}`: Mengambil detail satuan.
    3. `POST /api/units`: Menambahkan satuan baru (`name`, `symbol` unik, `description`) dengan otorisasi `role:owner`.
    4. `PUT /api/units/{id}`: Memperbarui data satuan dengan validasi `unique:units,symbol` except id.
    5. `DELETE /api/units/{id}`: Menghapus satuan, terproteksi dengan validasi error 422 jika `products_count > 0 || conversions_count > 0` (*"Satuan tidak dapat dihapus karena masih digunakan oleh produk aktif."*).
  - Merancang arsitektur komponen defensive UI: `UnitManagementScreen.js`, kartu `UnitCardItem.js` (badge aksen ungu `#c084fc`, flexbox pairing), modal `UnitFormModal.js` dengan chip preset cepat satuan populer UMKM (*pcs, box, btl, porsi, cup, kg, gr, ltr*), dan integrasi cache offline `offlineStorage.js`. Status Fase 1: `completed`.

- **Penyelesaian Plan #26 Fase 6: Pengujian Komprehensif & Finalisasi Master Kategori di Mobile (`plans/260904-26-mobile-master-kategori/plan.md`)**:
  - Melakukan serangkaian pengujian integrasi dan kualitas end-to-end:
    1. *Pengujian Backend*: Menambahkan feature tests baru pada `InventoryApiTest.php` (`test_category_cannot_be_deleted_if_has_products` dan `test_can_delete_empty_category`). Seluruh 7 feature tests backend inventaris & kategori lolos 100% (34 assertions).
    2. *Audit Impeccable UI*: Menjalankan `detect.mjs` di seluruh komponen modul (`CategoryCardItem.js`, `CategoryFormModal.js`, `CategoryManagementScreen.js`, `DashboardActionHub.js`, `DashboardScreen.js`, `App.js`) dan menghasilkan **0 defects**.
    3. *Verifikasi Build Expo Web*: Ekspor produksi `npx expo export --platform web` selesai dalam 753ms dengan 0 error/warning.
  - Modul **Master Kategori di Mobile (Plan #26)** resmi berstatus **`completed`** di seluruh 6 fase.

- **Penyelesaian Plan #26 Fase 5: Integrasi Navigasi Hub Menu Dashboard & Hak Akses Role Owner (`App.js`, `DashboardScreen.js`, `DashboardActionHub.js`)**:
  - Menghubungkan layar Master Kategori ke sistem navigasi aplikasi mobile:
    1. *Peluncur Action Hub*: Menghubungkan kartu **"Kategori"** pada `DashboardActionHub.js` via handler `onOpenMasterCategory` yang diteruskan dari `DashboardScreen.js`.
    2. *Bottom Navigation Bersih*: Mempertahankan strictly 4 tab navigasi utama (Dashboard, Kasir POS, Riwayat, Pengaturan) tanpa menambah tab baru.
    3. *Routing App Terproteksi Role*: Mendaftarkan rute internal `category_management` pada body screen `App.js` dengan proteksi peran khusus Owner (`user?.role === 'owner'`).
    4. *Navigasi Dua Arah*: Tombol kembali (`ChevronLeft`) di header `CategoryManagementScreen` mengembalikan navigasi secara presisi ke tampilan `Dashboard`.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 5: `completed`.

- **Penyelesaian Plan #26 Fase 3 & Fase 4: Komponen Kartu, Layar Utama (`CategoryManagementScreen.js`), & Modal Form Tambah/Edit (`CategoryFormModal.js`)**:
  - Mengembangkan antarmuka Master Kategori mobile yang utuh dan berstandar *Impeccable Defensive UI*:
    1. *Kartu Kategori (`CategoryCardItem.js`)*: Menampilkan identitas kategori dengan ikon `FolderTree`, nama tebal `min-w-0 truncate`, slug unik, badge jumlah produk berkait (`products_count`) aksen Sky (`#38bdf8`), indikator status keterpakaian produk (*"Terhubung Produk"* vs *"Belum Ada Produk"*), serta tombol aksi [Edit] dan [Hapus] (terproteksi jika berproduk).
    2. *Layar Utama (`CategoryManagementScreen.js`)*: Header bersih dengan tombol kembali ke Dashboard & refresh, ringkasan metrik kategori total & kategori berisi produk, pencarian real-time dengan debouncing 350ms, banner offline otomatis, FlatList dengan empty states elegan, dan Floating Action Button (FAB).
    3. *Modal Formulir (`CategoryFormModal.js`)*: Formulir responsif untuk tambah dan edit kategori dengan validasi nama wajib (minimal 2 karakter), auto-generate slug instan dari nama yang diketik, input kustom slug, textarea deskripsi opsional, dan penanganan error terpadu.
  - Lolos audit linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos verifikasi build Expo Web (`npx expo export --platform web`). Status Fase 3 & 4: `completed`.

- **Penyelesaian Plan #26 Fase 2: Pembuatan Mobile API Service (`categoryService.js`) & Sinkronisasi Cache Offline (`offlineStorage.js`)**:
  - Mengembangkan service wrapper terintegrasi [`mobile/src/services/categoryService.js`](file:///d:/Projects/KasirKita/mobile/src/services/categoryService.js):
    1. `getCategories(params)`: Mendukung pengambilan daftar kategori dengan filter pencarian dan pembaharuan cache lokal otomatis.
    2. `getCategory(id)`: Mengambil detail spesifik kategori berserta daftar produk aktifnya.
    3. `createCategory(payload)`: Membuat kategori baru dengan penanganan error validasi 422 dan penambahan instan ke cache offline lokal.
    4. `updateCategory(id, payload)`: Menyunting data kategori dengan sinkronisasi atomik ke cache offline.
    5. `deleteCategory(id)`: Menghapus kategori kosong dengan penghapusan otomatis dari cache lokal dan penanganan pesan error jika kategori masih berproduk.
    6. *Offline-First Fallback*: Saat offline (`ECONNABORTED` / tidak ada internet), otomatis membaca cache dari `offlineStorage` dan menyaring kata kunci pencarian secara lokal.
  - Memperkaya [`mobile/src/services/offlineStorage.js`](file:///d:/Projects/KasirKita/mobile/src/services/offlineStorage.js) dengan method pendukung: `cacheCategories`, `getCachedCategories`, `upsertCachedCategory`, dan `removeCachedCategory`.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`). Status Fase 2: `completed`.

- **Penyelesaian Plan #26 Fase 1: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend Master Kategori (`plans/260904-26-mobile-master-kategori/plan.md`)**:
  - Memverifikasi endpoint backend REST API Laravel:
    1. `GET /api/categories`: Mengambil seluruh kategori dengan penghitungan otomatis `products_count`.
    2. `GET /api/categories/{id}`: Mengambil detail kategori dan daftar produk aktifnya.
    3. `POST /api/categories`: Menambahkan kategori baru (`name`, `slug`, `description`) dengan middleware otorisasi `role:owner`.
    4. `PUT /api/categories/{id}`: Memperbarui nama, slug unik, dan deskripsi kategori (`role:owner`).
    5. `DELETE /api/categories/{id}`: Menghapus kategori, terproteksi dengan validasi penolakan error 422 jika kategori masih memiliki produk terkait (`products_count > 0`).
  - Merancang arsitektur defensive UI `CategoryManagementScreen.js`, kartu `CategoryCardItem.js`, dan formulir `CategoryFormModal.js` berstandar Impeccable (font minimal 12px, flexbox pairing kontras `#38bdf8`, dan dukungan cache offline). Status Fase 1: `completed`.

- **Pembuatan & Pendaftaran Dokumen Plan #28: Master Promosi & Voucher Diskon di Mobile (`plans/260904-28-mobile-master-promosi/plan.md`)**:
  - Menyusun rencana kerja modular lengkap 6 fase untuk manajemen Master Promosi & Voucher di aplikasi Mobile (React Native):
    1. *Fase 1*: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend (`/api/discounts` CRUD, `check-voucher`, `toggle-status`, filter status & tipe).
    2. *Fase 2*: Mobile API Service (`discountService.js`) terintegrasi penanganan status kuota/kadaluarsa dan fallback cache lokal `offlineStorage.js`.
    3. *Fase 3*: Komponen Kartu Tiket Voucher (`PromoCardItem.js`) & Layar Utama (`PromoManagementScreen.js`) berstandar Defensive UI Impeccable (badge kode `#fb7185`, copy-code, progress kuota, toggle switch instan).
    4. *Fase 4*: Modal Formulir Tambah/Edit Promo (`PromoFormModal.js`) dengan selector skema diskon (Persentase, Potongan Rp, Min. Belanja), auto-kapitalisasi kode kupon, dan batas maksimal potongan.
    5. *Fase 5*: Integrasi Navigasi Hub Menu Dashboard (`DashboardActionHub.js`), proteksi role Owner di `App.js`, dan sinkronisasi reaktif ke modal pemilihan voucher kasir POS (`PromoVoucherModal.js`).
    6. *Fase 6*: Pengujian Komprehensif, uji validasi checkout POS kupon aktif/kadaluarsa, audit linter `detect.mjs` (0 defect), dan Expo Web bundling.

- **Pembuatan & Pendaftaran Dokumen Plan #27: Master Satuan Barang di Mobile (`plans/260904-27-mobile-master-satuan/plan.md`)**:
  - Menyusun rencana kerja modular lengkap 6 fase untuk manajemen Master Satuan (UoM) di aplikasi Mobile (React Native):
    1. *Fase 1*: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend (`/api/units` CRUD + `withCount(['products', 'conversions'])`).
    2. *Fase 2*: Mobile API Service (`unitService.js`) terintegrasi validasi simbol unik dan fallback cache offline (`offlineStorage.js`).
    3. *Fase 3*: Komponen Kartu (`UnitCardItem.js`) & Layar Utama (`UnitManagementScreen.js`) berstandar Defensive UI Impeccable (badge simbol kontras `#c084fc`, usage counters, flexbox pairing).
    4. *Fase 4*: Modal Formulir Tambah/Edit Satuan (`UnitFormModal.js`) dengan chip preset satuan populer UMKM Indonesia (*pcs, box, btl, porsi, cup, kg, gr, ltr*) dan proteksi larangan hapus satuan berkait.
    5. *Fase 5*: Integrasi Navigasi Hub Menu Dashboard (`DashboardActionHub.js`), proteksi role Owner di `App.js`, dan sinkronisasi reaktif ke selector satuan pada Master Produk & POS.
    6. *Fase 6*: Pengujian Komprehensif, uji proteksi integritas data penghapusan satuan berproduk/konversi, audit linter `detect.mjs` (0 defect), dan Expo Web bundling.

- **Pembuatan & Pendaftaran Dokumen Plan #26: Master Kategori di Mobile (`plans/260904-26-mobile-master-kategori/plan.md`)**:
  - Menyusun rencana kerja modular lengkap 6 fase untuk manajemen Master Kategori di aplikasi Mobile (React Native):
    1. *Fase 1*: Spesifikasi UX/UI Wireframe & Pemetaan Kontrak Backend (`/api/categories` CRUD + `products_count` protection).
    2. *Fase 2*: Mobile API Service (`categoryService.js`) terintegrasi cache offline (`offlineStorage.js`).
    3. *Fase 3*: Komponen Kartu (`CategoryCardItem.js`) & Layar Utama (`CategoryManagementScreen.js`) berstandar Defensive UI Impeccable (minimum 12px, flexbox pairing).
    4. *Fase 4*: Modal Formulir Tambah/Edit Kategori (`CategoryFormModal.js`) dengan auto-generate slug & validasi.
    5. *Fase 5*: Integrasi Navigasi Hub Menu Dashboard (`DashboardActionHub.js`), proteksi role Owner di `App.js`, dan sinkronisasi reaktif ke filter kasir POS & Master Produk.
    6. *Fase 6*: Pengujian Komprehensif, uji proteksi penghapusan kategori bertaut produk, verifikasi linter `detect.mjs` (0 defect), dan Expo Web bundling.


- **Penataan Rapi & Presisi Header Scanner Barcode Mode Portrait (`PosBarcodeScannerView.js`)**:
  - **Penyebab Masalah**: Di mode Portrait, teks tombol *"Ketik barcode manual"* terlalu panjang sehingga terpotong (*"Ketik barcode man..."*) dan tombol aksi penting *"OK"* terdorong sepenuhnya keluar dari batas layar kanan HP (360px).
  - **Solusi & Penyempurnaan**:
    1. Memperpendek label kontrol tombol menjadi ringkas dan jelas: *"Manual"* (menggantikan *"Ketik barcode manual"*) dan *"Senter"* tanpa label status panjang.
    2. Menjadikan tombol selesai/tutup menjadi **`[ ✓ Selesai ]`** berwarna Rose Brand solid (`#e11d48`) dengan border kontras (`#f43f5e`), font 12px tebal, dan tinggi seragam **`height: 32`** dengan tombol lainnya.
    3. Merampingkan badge indikator live status kiri menjadi **`[ • SCANNER ]`** yang kompak dan elegan.
    4. Mengunci `height: 50` pada `topBar` dan menambahkan `flexShrink: 0` pada grup kontrol kanan sehingga seluruh tombol kini muat dengan lega, tidak ada teks yang terpotong, dan tombol selesai selalu terlihat 100% di layar 360px.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Penyelarasan Presisi Tinggi Wadah Tombol Scan Barcode & Pembesaran Ikon (`ProductFormModal.js`, `ProductManagementScreen.js`)**:
  - **Penyebab Masalah**: Wadah kotak merah tombol scan barcode di modal form tambah/edit produk tampak terlalu besar dan menonjol lebih tinggi dibandingkan kolom input di sampingnya (sebelumnya berukuran 44x44px sementara kolom input tidak memiliki tinggi eksplisit sehingga hanya ~38px).
  - **Solusi & Penyempurnaan**:
    1. Mengunci tinggi kolom `textInput` menjadi **`height: 42`** dan wadah tombol `scanTriggerBtn` menjadi **`width: 42, height: 42`** dengan `borderRadius: 10`. Keduanya kini **100% sejajar rata (*flush*) dan sama persis tingginya**.
    2. Menyesuaikan ukuran ikon `ScanBarcode` menjadi **`size={22}`** warna putih solid (sebelumnya `18`) di `ProductFormModal.js` dan `ProductManagementScreen.js`. Ikon kini tampil proporsional, jelas, dan dominan tanpa membuat layernya menonjol keluar kolom.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Eliminasi Padding Ganda Area Atas Layar Master Produk (`ProductManagementScreen.js`)**:
  - **Penyebab Masalah**: Muncul area kosong hitam yang terlalu lebar (*double top gap*) di atas header "Master Produk".
  - **Akar Masalah**: Komponen induk [`mobile/App.js`](file:///d:/Projects/KasirKita/mobile/App.js) sudah memiliki pembungkus utama ber-padding status bar sistem (`paddingTop: safeTopPadding`). Penggunaan `SafeAreaView` di dalam `ProductManagementScreen.js` menyebabkan padding status bar dihitung dua kali lipat (double insets).
  - **Solusi & Penyempurnaan**:
    1. Menghapus pembungkus `SafeAreaView` pada `ProductManagementScreen.js` dan menggantikannya dengan `<View style={styles.root}>` biasa (identik dengan arsitektur `DashboardScreen`, `PosScreen`, dan `TransactionHistoryScreen`).
    2. Menghilangkan ketergantungan import `SafeAreaView` yang tidak diperlukan.
    3. Jarak header "Master Produk" dari status bar atas kini pas, proporsional, dan serasi dengan layar lainnya di aplikasi.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Optimasi Ketahanan Layout Bar Filter Stok Master Produk (`ProductManagementScreen.js`)**:
  - **Penyebab Masalah**: Setelah menambahkan ikon Lucide pada filter stok, tombol filter ke-4 (`Non-Aktif`) terdorong keluar layar (*tergeser*) di HP dengan lebar sempit (360px) karena total lebar 4 pil melebihi ruang kontainer 328px.
  - **Solusi & Penyempurnaan**:
    1. Mengembalikan teks bersih tanpa ikon berlebih pada `Semua` dan `Non-Aktif` (ikon `<AlertTriangle>` dan `<XCircle>` tetap khusus menggantikan emoticon `⚠️` dan `🛑` pada `Menipis` dan `Habis`).
    2. Menerapkan `flex: 1` dengan `justifyContent: 'center'` pada `styles.stockFilterPill` sehingga ke-4 tombol filter membagi rata lebar baris (masing-masing 25%) secara presisi dan 100% sejajar dengan batas kartu produk di bawahnya.
    3. Tampilan menjadi rapi, seimbang, dan tidak ada lagi elemen yang tergeser atau terpotong pada layar 360px.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Migrasi `SafeAreaView` Modern & Penggantian Emoticon dengan Ikon Lucide di Master Produk (`ProductManagementScreen.js`, `ProductBarcodeScannerModal.js`)**:
  - **Penyelesaian Warning Deprecated `SafeAreaView`**:
    1. Mengganti import usang `SafeAreaView` dari package `react-native` dengan `SafeAreaView` standar resmi dari `react-native-safe-area-context` di [`ProductManagementScreen.js`](file:///d:/Projects/KasirKita/mobile/src/screens/ProductManagementScreen.js) dan [`ProductBarcodeScannerModal.js`](file:///d:/Projects/KasirKita/mobile/src/components/product/ProductBarcodeScannerModal.js).
    2. Menghilangkan pesan warning kuning `WARN SafeAreaView has been deprecated and will be removed in a future release`.
  - **Penggantian Emoticon dengan Ikon Vektor Lucide**:
    1. Mengganti emoticon teks `⚠️ Menipis` dan `🛑 Habis` pada filter pil status stok produk dengan ikon vektor konsisten:
       - Filter **Semua**: ikon `<Layers size={12} />`
       - Filter **Menipis**: ikon `<AlertTriangle size={12} color="#fbbf24" />`
       - Filter **Habis**: ikon `<XCircle size={12} color="#f87171" />`
       - Filter **Non-Aktif**: ikon `<EyeOff size={12} color="#a1a1aa" />`
    2. Memperbarui `styles.stockFilterPill` dengan tata letak `flexDirection: 'row'`, `alignItems: 'center'`, dan `gap: 4`.
    3. Seluruh modul Master Produk kini 100% bebas dari emoticon teks dan memiliki tampilan yang rapi, profesional, dan serasi.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Perbaikan Resolusi Barcode Scanner Kasir POS (`PosBarcodeScannerView.js`, `PosScreen.js`)**:
  - **Penyebab Masalah**: Saat kasir memindai barcode produk fisik (misal: barcode produk kemasan `8992931025202`), aplikasi memunculkan pesan `"Barcode tidak dikenali - Kode 8992931025202 belum terdaftar di katalog produk"`, padahal saat dicari via pencarian manual atau scanner di Master Produk, produk tersebut berhasil ditemukan.
  - **Akar Masalah**:
    1. Di `PosBarcodeScannerView.js`, logika pencocokan produk awalnya hanya memeriksa `(p.sku && p.sku.toLowerCase() === code.toLowerCase()) || String(p.id) === code`.
    2. Model produk backend menggunakan kolom database **`sku_barcode`** (bukan `sku`). Akibatnya, properti `p.sku` bernilai `undefined` sehingga kode barcode kemasan tidak pernah cocok.
    3. Selain itu, barcode untuk satuan konversi (`p.conversions[].sku_barcode`) belum tercakup dalam logika pencarian kamera scanner POS.
  - **Solusi & Penyempurnaan**:
    1. Memperbarui fungsi `processBarcode(code)` di `PosBarcodeScannerView.js` agar mencocokkan `p.sku_barcode` (diutamakan), `p.sku` (fallback), `String(p.id)`, dan barcode multi-satuan `p.conversions[].sku_barcode`.
    2. Menambahkan 3-Tier Fallback Resilience: jika produk belum ada di array memori POS, scanner otomatis mencari ke cache lokal (`offlineStorage.getCachedCatalog()`), lalu mencari ke endpoint backend API (`/products?search=...`). Jika ditemukan via fallback, produk otomatis dimasukkan ke cache lokal dan ditambahkan ke daftar produk aktif di `PosScreen.js`.
    3. Memperbarui `addToCart` di `PosScreen.js` agar produk hasil resolusi fallback scanner otomatis didaftarkan ke state `products`.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan lolos uji bundling Expo Web.

- **Eksekusi Plan #25 Fase 6: Integrasi Navigasi Hub Menu Dashboard & Hak Akses Role Owner (`App.js`, `DashboardScreen.js`, `DashboardActionHub.js`)**:
  - Mengintegrasikan layar Master Produk ke sistem navigasi aplikasi:
    1. *Akses Khusus Hub Menu*: Memastikan Bottom Navigation Bar tetap bersih hanya dengan 4 tab utama (Dashboard, Kasir POS, Riwayat, Pengaturan) sesuai permintaan, dan menjadikan kartu **Produk** di Hub Menu Dashboard sebagai pintu masuk utama ke layar `ProductManagementScreen`.
    2. *Routing Layar Terproteksi Role*: Menambahkan rute `product_management` pada body screen `App.js` dengan proteksi peran `user?.role === 'owner'`.
    3. *Navigasi Dua Arah*: Tombol kembali (`ChevronLeft`) di header `ProductManagementScreen` mengembalikan pengguna ke `Dashboard` secara mulus.
    4. *Sinkronisasi Katalog Otomatis*: Saat kembali ke kasir POS atau dashboard, perubahan produk seketika tercermin dari cache offline dan memori aplikasi.
  - Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dan sukses uji bundling Expo Web. Status Fase 6: `completed`.

- **Eksekusi Plan #25 Fase 5: Modal Penyesuaian Stok Cepat & Moving Average Cost (`QuickStockAdjustModal.js`)**:
  - Mengembangkan modal penyesuaian stok masuk kilat (`QuickStockAdjustModal.js`):
    1. *Kartu Status Terkini*: Menampilkan stok fisik terkini dan nilai modal HPP rata-rata berjalan (*Moving Average Cost*).
    2. *Input Restock Cepat*: Input jumlah barang masuk (otomatis mengambil simbol satuan unit produk) dan input harga kulakan/beli per unit.
    3. *Live Calculation Card*: Simulasi real-time perubahan estimasi stok total baru, nilai HPP rata-rata baru (rumus moving average: $((S_{current} \times C_{current}) + (S_{in} \times C_{in})) / (S_{current} + S_{in})$), serta total biaya pengeluaran kas.
    4. *Pemasok & Catatan*: Pemilihan supplier/distributor via chip selector dan kolom catatan/nomor faktur pembelian.
    5. *Kepatuhan Standar UI*: 0 defect pada `detect.mjs`, font minimal 12px, dan sukses lolos bundling Expo Web. Status Fase 5: `completed`.

- **Eksekusi Plan #25 Fase 4: Modal Form Tambah/Edit Produk & Integrasi Kamera Barcode (`ProductFormModal.js`, `ProductBarcodeScannerModal.js`)**:
  - Mengimplementasikan formulir lengkap pembuatan dan pembaruan produk dengan validasi ketat & scanner kamera:
    1. *Formulir Produk (`ProductFormModal.js`)*: Input nama produk (wajib), kategori picker chips, satuan unit picker chips (pcs, botol, box, porsi, cup, dll), input barcode terintegrasi kamera scanner, format rupiah otomatis untuk harga jual & modal HPP, input kuantitas stok awal & batas minimum stok alert, switch toggle visibilitas di kasir POS, dan tombol konfirmasi hapus produk (khusus edit).
    2. *Kamera Scanner Modal (`ProductBarcodeScannerModal.js`)*: Memanfaatkan `CameraView` dari `expo-camera` untuk mendeteksi berbagai format barcode kemasan fisik (EAN-13, EAN-8, UPC, Code-128, QR Code) lengkap dengan garis laser animasi, toggle senter flash (`torch`), audio feedback beep, dan auto-fill instan ke form.
    3. *Kepatuhan Standar UI*: 0 linting defect pada `detect.mjs`, seluruh font mematuhi *The Readability Floor Rule* ($\ge 12$px), dan lolos bundling Expo Web. Status Fase 4: `completed`.

- **Eksekusi Plan #25 Fase 3: Layar Utama Master Produk & Komponen Kartu Modular (`ProductManagementScreen.js`, `ProductCardItem.js`)**:
  - Mengembangkan tampilan antarmuka katalog produk mobile lengkap dengan prinsip *Defensive UI* dan *Impeccable Dark Mode*:
    1. *Komponen Kartu Produk (`ProductCardItem.js`)*: Menampilkan inisial/ikon produk dengan border status stok (Aman hijau, Menipis amber, Habis merah), nama produk, badge kategori, barcode/SKU, harga jual tebal kontras, dan modal/HPP rata-rata terproteksi toggle sensor mata `[ 👁️ ]` khusus role Owner.
    2. *Layar Manajemen Produk (`ProductManagementScreen.js`)*: Toolbar pencarian instan debounced (400ms), tombol pemicu scan barcode kemasan fisik, horizontal category chip selector, filter status stok (`Semua`, `⚠️ Menipis`, `🛑 Habis`, `Non-Aktif`), infinite scrolling paginasi (20 item per batch), pull-to-refresh, dan banner indikator mode offline.
    3. *Kepatuhan Standar UI*: Lolos uji linter Impeccable (`detect.mjs` $\rightarrow$ 0 defects) dengan font minimum 12px (*The Readability Floor Rule*), dan sukses uji bundling Expo Web. Status Fase 3: `completed`.

- **Eksekusi Plan #25 Fase 2: Pembuatan Modul Layanan API Produk & Sinkronisasi Cache Offline (`productService.js`, `offlineStorage.js`)**:
  - Mengembangkan service wrapper terpusat `mobile/src/services/productService.js`:
    1. *Operasi CRUD Produk*: `getProducts` (dengan filter terpaginasi), `getProduct`, `createProduct`, `updateProduct`, `deleteProduct` (soft-deletes), `restockProduct` (moving average cost), dan `getStockMovements`.
    2. *Metadata Master*: `getCategories` dan `getUnits` terintegrasi.
    3. *Sinkronisasi Cache Offline Otomatis*: Setiap kali produk dibuat, diperbarui, atau direstock, `offlineStorage.upsertCachedProduct` atau `removeCachedProduct` langsung dipanggil secara atomik agar katalog lokal di memori POS kasir dan storage disk tetap sinkron tanpa perlu koneksi internet ulang.
    4. *Offline Fallback Guard*: Menangani `Network Error` dengan menyajikan data katalog dari `AsyncStorage` lengkap dengan pencarian lokal client-side.
  - Menambahkan metode `upsertCachedProduct`, `removeCachedProduct`, `cacheUnits`, dan `getCachedUnits` ke `offlineStorage.js`.
  - Lolos uji bundling Expo Web (`Web Bundled index.js 2304 modules`). Status Fase 2: `completed`.

- **Eksekusi Plan #25 Fase 1: Spesifikasi UX/UI & Kontrak Endpoint API Master Produk Mobile (`docs/spesifikasi-master-produk-mobile.md`, `plans/260904-25-mobile-master-produk/plan.md`)**:
  - Menyelesaikan spesifikasi teknis dan perancangan wireframe antarmuka modul Master Produk Mobile:
    1. *Kontrak API Backend*: Memetakan endpoint RESTful Laravel terproteksi Sanctum & RBAC Role Owner (`GET/POST/PUT/DELETE /api/products`, `POST /api/products/{id}/restock`, `GET /api/categories`, `GET /api/units`) beserta struktur payload request, pagination query, dan format response JSON.
    2. *Wireframe UI*: Menjabarkan tata letak 3 komponen utama (Layar Daftar Produk dengan chip filter stok/kategori & FAB tambah produk, Modal Form Tambah/Edit Produk dengan tombol scan barcode kamera, dan Modal Quick Restock/Adjust Stok dengan rumus moving average).
    3. *Aturan Ketahanan*: Menetapkan integrasi parser nominal uang, verifikasi kamera barcode ganda (anti false-positive), dan sinkronisasi lokal ke memori katalog POS (`offlineStorage.js`).
  - Status Fase 1 diubah menjadi `completed`.

- **Penyempurnaan Hub Menu Master Data di Dashboard Mobile (`DashboardScreen.js`, `DashboardActionHub.js`)**:
  - Menata ulang tata letak Hub Menu di Dashboard Owner (posisi: setelah tombol *Perbarui Data* dan di atas grafik *Tren Omzet 7 Hari*).
  - Mengubah desain dari kartu persegi panjang 2-kolom besar menjadi **grid app-launcher 4-kolom kompak ("susunan 4x4")** dengan kotak item kecil berpusat (`alignItems: 'center', justifyContent: 'center'`):
    1. **Produk**: Ikon `Package` (emerald `#34d399`) dilengkapi indikator badge stok menipis jika terdeteksi.
    2. **Kategori**: Ikon `FolderTree` (sky `#38bdf8`) untuk manajemen kategori katalog.
    3. **Satuan**: Ikon `Scale` (purple `#c084fc`) untuk pengaturan unit jual (Pcs, Box, Kg, dll).
    4. **Promosi**: Ikon `TicketPercent` (rose `#fb7185`) untuk voucher dan diskon.
    5. **Pajak & Biaya**: Ikon `Percent` (amber `#fbbf24`) untuk tarif PPN / PB1 dan service charge.
    6. **Pelanggan**: Ikon `Users` (teal `#2dd4bf`) untuk direktori kontak & member pelanggan.
    7. **Pemasok**: Ikon `Truck` (orange `#fb923c`) untuk daftar supplier restock barang.
  - Memastikan ukuran tile ringkas sehingga tidak bersaing dengan kartu metrik omzet (KPI), memenuhi *The Readability Floor Rule* (seluruh font $\ge$ 12px), nol error pada linter `detect.mjs`, dan sukses bundling Expo Web.

- **Perencanaan Plan #25: Layar Master Produk & Inventaris di Mobile (`plans/260904-25-mobile-master-produk/plan.md`)**:
  - Menyusun rencana implementasi modul Master Produk langsung dari aplikasi HP bagi Owner dan Manajer:
    1. *Product Management Screen*: Katalog master produk dengan pencarian, filter kategori, filter stok menipis/habis/non-aktif, dan indikator status stok.
    2. *Product Form Modal*: Formulir tambah dan edit produk (nama, kategori, satuan, harga jual, harga modal HPP, batas minimum stok) dilengkapi tombol scan kamera barcode fisik kemasan.
    3. *Quick Stock Adjust Modal*: Penyesuaian stok kilat (+ / -) untuk barang masuk dari supplier, barang rusak, atau opname cepat.
    4. *Role-Based Access & Auto-Sync*: Hak akses khusus Owner/Manager, serta sinkronisasi otomatis ke memori kasir POS (`PosScreen.js`) dan cache offline tanpa perlu restart aplikasi.

- **Penyempurnaan Integritas Nota Transaksi Offline & Sinkronisasi Server (`Transaction.php`, `PosService.php`, `PosController.php`, `PosScreen.js`, `syncManager.js`, `ReceiptView.js`, `escposGenerator.js`, `printerService.js`)**:
  - Menyelesaikan 4 anomali data transaksi offline-first:
    1. **Preservasi Nomor Nota Cetak**: Server kini mempertahankan nomor faktur asli (`INV-OFF-...`) yang dikirim client saat sync, alih-alih menimpanya dengan nomor acak baru. Query pencarian server di `PosController.php` juga diperluas untuk mencari `offline_id` dan `invoice_number`, sehingga nota fisik di tangan pelanggan dapat dicari dua arah dengan instan.
    2. **Akurasi Waktu Transaksi (Timestamp)**: Menambahkan `'created_at'` ke `$fillable` model `Transaction.php` dan parsing Carbon di `PosService.php`, menjamin jam transaksi nyata saat offline (misal 14.42) tetap tercatat sebagai waktu penjualan asli di database server, bukan jam saat koneksi internet kembali pulih (14.44).
    3. **Perbaikan Subtotal Rp0**: Menambahkan field `subtotal: subtotal` pada payload kasir di `PosScreen.js` serta menambahkan kalkulasi subtotal defensif dari penjumlahan item pada `ReceiptView.js`, `escposGenerator.js`, dan `printerService.js` agar struk fisik dan virtual selalu menampilkan subtotal yang benar.
    4. **Preservasi Urutan Item**: Mengoptimasi locking produk via `whereIn('id', ...)->lockForUpdate()` untuk pencegahan deadlock, sekaligus menjaga urutan pembuatan item transaksi tetap persis sesuai keranjang kasir.
  - Lolos uji automated test suite backend (`php artisan test` $\rightarrow$ 70 passed, 313 assertions) dan uji bundling Expo Web (`npx expo export --platform web`).

- **Optimasi Non-Blocking UI Thread & Migrasi `requestIdleCallback` (`TransactionHistoryScreen.js`, `offlineStorage.js`)**:
  - Menyelesaikan warning deprecasi `InteractionManager has been deprecated ... use 'requestIdleCallback' instead`:
    1. Mengganti `InteractionManager` dengan utilitas modern `runWhenIdle(task, timeout = 2500)` yang memanfaatkan `requestIdleCallback` (dengan fallback `setTimeout(1200)` jika tidak didukung engine).
    2. Menghapus sepenuhnya import `InteractionManager` dari `react-native`, sehingga log console warning kuning bersih 100%.
    3. Menyisipkan *tick yield* ke JavaScript Event Loop (`await new Promise(r => setTimeout(r, 50))` & `setTimeout(r, 0)`) sebelum `cacheRecentTransactions` dan sebelum `AsyncStorage.multiSet`.
    4. Memberikan prioritas utama bagi antrean sentuhan kasir (scroll, tap kartu, dan ketik cari), menjamin antarmuka tetap berjalan mulus 60 FPS tanpa efek freeze.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Proteksi Ketahanan Cache Riwayat Transaksi Offline (`offlineStorage.js`, `TransactionHistoryScreen.js`)**:
  - Memastikan integritas `cacheRecentTransactions` terhadap *partial response* atau kegagalan jaringan:
    1. Guard ketat `newTransactions.length === 0`: jika response kosong atau bukan array, fungsi langsung keluar tanpa menyentuh cache disk.
    2. *Additive Merging & Attribute Preservation*: Menggunakan `existingMap` agar atribut lokal nota yang ada di disk tetap dipertahankan dan seluruh transaksi lama yang masih dalam jendela retensi 7 hari tetap utuh.
    3. Proteksi Filter: Hanya memicu update snapshot cache umum pada pemuatan halaman 1 tanpa filter pencarian (`!activeSearch && activeMethod === 'ALL'`).
    4. Kegagalan jaringan / timeout pada Axios langsung masuk ke blok `catch`, sehingga cache lama di disk tidak pernah tersentuh saat koneksi terputus di tengah jalan.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`).

- **Perbaikan Transaksi Checkout Offline Mode Kasir Mobile POS (`PosScreen.js`, `offlineStorage.js`, `syncManager.js`)**:
  - **Penyebab Masalah**: Saat menekan tombol *Selesaikan Pembayaran* di mode offline, muncul error promise `TypeError: undefined is not a function`. Hal ini terjadi karena `handleOfflineSuccess` di `PosScreen.js` memanggil `offlineStorage.queueTransaction(...)` yang metodenya belum didefinisikan pada objek `offlineStorage` (nama method aslinya adalah `enqueueOfflineTransaction`).
  - **Solusi & Penyempurnaan**:
    1. Menambahkan alias `queueTransaction(payload, userProfile)` di `offlineStorage.js` yang meneruskan pemanggilan ke `enqueueOfflineTransaction(payload, userProfile)` demi interoperabilitas dan backward compatibility.
    2. Memperbarui `handleOfflineSuccess` di `PosScreen.js`:
       - Mengambil data profil kasir yang aktif (`storage.getUser()`) untuk disematkan ke transaksi offline.
       - Menggunakan reducer checkout atomic `dispatch({ type: CHECKOUT_ACTION_TYPES.RESET_CHECKOUT, payload: { completedTx: offlineTx, defaultTaxId, defaultFeeIds } })` agar cart, promo, voucher, dan state pembayaran ter-reset bersih dan seragam dengan transaksi online.
       - Memotong stok produk lokal langsung di state memori POS (`setProducts(...)`) sehingga tampilan stok di kartu katalog POS seketika berkurang secara akurat tanpa perlu fetch server.
       - Menjalankan auto-print struk ke printer Bluetooth jika opsi auto-print aktif di pengaturan.
       - Melengkapi penanganan `try ... catch` dengan notifikasi alert yang ramah pengguna.
    3. Menambahkan payload fields `cash_received`, `fee_amount`, dan `change_amount` di `PosScreen.js` dan sinkronisasi payload di `syncManager.js` agar lolos validasi `PosController.php` saat antrean transaksi offline dikirim ke server.
  - Lolos uji bundling Expo Web (`npx expo export --platform web`) dan uji automated test backend (`php artisan test` $\rightarrow$ 69 passed, 301 assertions).

- **Pemeliharaan Keranjang & Pelepasan Kunci Auto-Rotate saat Switch Portrait (`PosScreen.js`, `App.js`)**:
  - Menyelesaikan masalah layar terkunci mati di Portrait setelah menekan tombol `[ 📱 Portrait ]`.
  - Mengubah siklus orientasi tombol: memutar layar ke Portrait sesaat (`PORTRAIT_UP`), lalu dalam 600ms otomatis melepaskan kuncinya kembali ke `AUTO` (`ScreenOrientation.unlockAsync()`). Dengan ini, sensor gravitasi auto-rotate perangkat tetap aktif dan HP bisa langsung kembali berputar ke Landscape saat dimiringkan kembali oleh kasir.
  - Memastikan state keranjang (*cart*) dan tab Kasir POS tetap aktif terjaga di mode Portrait (`onSwitchToPortrait` mengarahkan `activeTab` dan `portraitTab` ke `'pos'`), sehingga produk yang sudah dimasukkan ke keranjang tidak hilang saat beralih orientasi.
- **Perbaikan Jarak & Tata Letak Grid Kartu Produk Kasir (`ProductGrid.js`)**:
  - Menyelesaikan masalah jarak renggang asimetris pada item produk baris terakhir (kartu produk ganjil yang melebar memenuhi seluruh baris).
  - Mengimplementasikan `columnWrapperStyle={[styles.gridRow, ...]}` dengan aturan `gap` seragam horizontal dan vertikal pada FlatList 2-kolom.
  - Menghapus `margin: 4` individual pada kartu produk yang sebelumnya bertabrakan dengan flexbox gap.
  - Hasilnya: setiap kartu produk kini memiliki ukuran lebar 50% yang konsisten, jarak spasi antar-kartu rapi dan seragam di semua baris, baik saat jumlah produk genap maupun ganjil.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Standardisasi Presisi Tinggi Tombol Header Keranjang Kasir Landscape (`LandscapeRegisterPanel.js`)**:
  - Menyamakan tinggi ketiga tombol di header keranjang panel kanan: tombol **`[ 📱 Portrait ]`**, tombol hapus keranjang **`[ 🗑️ ]`**, dan tombol scan barcode **`[ 🔴 ]`** secara presisi menjadi **`height: 24px`** dengan sudut **`borderRadius: 6px`**.
  - Dimensi ini 100% identik dan sejajar sempurna dengan chip filter kategori produk (`catChipCompact`: padding vertical 2 + font 12 + border = 24px, borderRadius: 6px).
  - Menyesuaikan ukuran ikon menjadi `size={16}` (barcode) dan `size={15}` (sampah) agar proporsional dan tidak menabrak batas kotak tombol.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Penyelarasan Desain Tombol Hapus Keranjang (*Trash Clear Cart*) (`LandscapeRegisterPanel.js`)**:
  - Menyamakan warna ikon tempat sampah menjadi **putih solid (`#ffffff`)** dengan ukuran **`size={17}`** yang proporsional dan jelas.
  - Menyesuaikan kotak layer tombol menjadi warna **Rose Brand solid (`#e11d48`)** dengan border kontras (`#f43f5e`), dimensi tetap presisi **`28x28`**, dan sudut membulat `borderRadius: 8`, identik dan serasi dengan tombol scan barcode di sebelahnya.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Tombol Navigasi Mode "Portrait" pada Keranjang Layar Kasir Landscape (`LandscapeRegisterPanel.js`, `PosScreen.js`)**:
  - Menggantikan tombol *Pelanggan* yang sebelumnya berdesakan di header keranjang panel kanan mode landscape dengan tombol aksi **`[ 📱 Portrait ]`**.
  - Opsi pemilihan pelanggan tetap 100% lengkap dan elegan pada tampilan pembayaran kasir (*PosCheckoutView* di atas Total Tagihan) sesuai toggle pengaturan.
  - Saat tombol **`[ 📱 Portrait ]`** ditekan:
    - Memperbaiki pemanggilan storage ke metode yang benar (`storage.setSettings` bukan `saveSettings`).
    - Mereset preferensi orientasi ke `AUTO` dan secara langsung memanggil `orientationService.applyPreference('PORTRAIT')` sehingga layar seketika dipaksa berputar tegak lurus ke mode Portrait.
    - Pengguna dapat langsung mengakses seluruh menu/screen aplikasi (Dashboard, Riwayat, Pengaturan) tanpa kendala.
  - Tampilan header keranjang menjadi sangat lega, tidak tabrakan, dan proporsional.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Penyegaran Tampilan Tombol Scan Barcode Kasir POS (`ProductGrid.js`, `LandscapeRegisterPanel.js`)**:
  - Memperbesar ukuran ikon barcode scanner menjadi **`size={20}`** warna **putih solid (`#ffffff`)** persis sesuai permintaan.
  - Mengunci ukuran kotak layer/wadah tombol tetap ringkas dan presisi pada dimensi **`width: 28, height: 28`** (dengan perataan tengah `justifyContent: 'center', alignItems: 'center'`), sehingga layer tidak melebar dan tetap sejajar rapi dengan elemen sekitarnya (seperti tombol pencarian dan tombol clear cart).
  - Mengatur warna latar belakang tombol menjadi **Rose Brand (`#e11d48`)** dengan border kontras (`#f43f5e`).
  - Diterapkan secara seragam di layar kasir mode Portrait (`ProductGrid.js`) maupun panel register Landscape (`LandscapeRegisterPanel.js`).
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Arsitektur Offline-First & Pencarian Riwayat Transaksi (`TransactionHistoryScreen.js`, `offlineStorage.js`, `PosController.php`)**:
  - **Dukungan Offline-First Penuh (Pemisahan Prefetch Background vs Render Tampilan)**:
    - **Pemisahan Jalur Ambil Data**:
      - Layar UI tetap memuat **20 nota pertama** (`per_page: 20`) agar proses pembukaan layar dan pencarian awal di jaringan seluler/3G tetap instan dan tidak berat.
      - **Background Prefetch Senyap**: Terpisah di latar belakang (tanpa memblokir UI dan tanpa loading spinner), aplikasi memanggil `prefetchHistoryForOffline()` dengan rentang waktu **7 hari terakhir** (`start_date=...`) dan batas pengaman *safety cap* hingga **200 transaksi**. Dilengkapi *cooldown throttle* 15 menit agar tidak memboroskan kuota/baterai, kecuali saat user melakukan pull-to-refresh manual.
    - **Algoritma Akumulasi Cache (Merge + Dedup + Sort + Time Retention)**:
      - Alih-alih menimpa file, `cacheRecentTransactions` menggabungkan nota baru dan nota lama di memori HP, membuang duplikat berdasarkan ID/invoice unik, mempertahankan transaksi 7 hari terakhir, dan mengurutkannya dari yang terbaru.
    - **Integrasi Antrean Offline & Cetak Ulang Struk**:
      - Nota yang dibuat saat kasir offline (`INV-OFF-...`) otomatis disisipkan di urutan paling atas daftar riwayat lengkap dengan badge amber **`[ ⏳ Belum Sinkron ]`**.
      - Saat offline total (*Network Error*), layar riwayat otomatis beralih ke *Offline Fallback Mode*, menampilkan banner status `Mode Offline: Menampilkan X nota tersimpan di HP (7 hari terakhir)`, serta tetap mengizinkan kasir mencari, memfilter, dan **mencetak ulang struk offline ke printer Bluetooth thermal** tanpa internet.
      - Saat online kembali, antrean offline otomatis disinkronkan oleh `syncManager` dan layar riwayat kembali beralih ke pencarian server-side database PostgreSQL.
  - **Pencarian Cerdas Server-Side & Filtering Database**:
    - Memindahkan logika pencarian riwayat transaksi dari client-side (yang sebelumnya hanya memfilter 20 data halaman pertama) ke server-side query di backend Laravel [`PosController.php`](file:///d:/Projects/KasirKita/backend/app/Http/Controllers/Api/PosController.php).
    - Operator query dibuat driver-aware (`DB::getDriverName() === 'pgsql' ? 'ilike' : 'like'`), mendukung SQLite lokal dan PostgreSQL cloud tanpa error 500.
    - Query mencakup pencarian fleksibel berdasarkan `invoice_number`, `customer_name`, maupun nama kasir (`cashier.name`), dikombinasikan dengan filter metode pembayaran (`payment_method`).
  - **Indeks PostgreSQL `pg_trgm` & B-Tree (`2026_09_04_000001_add_trgm_and_indexes_to_transactions.php`)**:
    - Menambahkan migrasi database untuk mengaktifkan extension `pg_trgm` di PostgreSQL.
    - Menerapkan **GIN Trigram Indexes** (`gin_trgm_ops`) pada kolom `invoice_number` dan `customer_name` agar pencarian wildcard substring `ILIKE '%...%'` berjalan instan menggunakan index scan alih-alih sequential table scan.
    - Menambahkan index B-Tree komposit pada `payment_method` dan `payment_status`.
  - **Proteksi Race Condition, Debounce, & Memoization**:
    - Mengimplementasikan `debouncedSearch` (400ms) dan `AbortController` pada Axios di [`TransactionHistoryScreen.js`](file:///d:/Projects/KasirKita/mobile/src/screens/TransactionHistoryScreen.js).
    - Memisahkan kartu transaksi ke dalam komponen `TransactionCard` ter-memoize (`React.memo`) dengan `useCallback`, dan menyetel batching props FlatList (`initialNumToRender={8}`, `maxToRenderPerBatch={8}`, `windowSize={5}`) sehingga menghilangkan warning render lag Android.
  - **Perbaikan Navigasi Tombol Riwayat Dashboard & Paginasi Riwayat (`DashboardScreen.js`, `App.js`, `TransactionHistoryScreen.js`)**:
    - **Perbaikan Navigasi Tab Riwayat**:
      - Memperbaiki tautan tombol *"Riwayat →"* di bagian 10 Transaksi Penjualan Terakhir Dashboard ([`DashboardScreen.js`](file:///d:/Projects/KasirKita/mobile/src/screens/DashboardScreen.js)) yang sebelumnya memanggil `navigation.navigate('Riwayat')` sehingga salah diarahkan ke fallback Kasir POS. Sekarang memanggil `navigation.navigate('history')`, serta menambahkan normalisasi alias di `handleTabChange` ([`App.js`](file:///d:/Projects/KasirKita/mobile/App.js)), menjamin user langsung mendarat di tab Riwayat dengan ikon aktif menyala.
    - **Optimalisasi Performa & Infinite Scroll (Paginasi Cerdas)**:
      - Menjawab kekhawatiran beban data besar: backend Laravel secara bawaan membatasi beban melalui paginasi (`per_page: 20`), dan React Native menggunakan virtualisasi `<FlatList>` (hanya merender item yang tampak di layar HP sehingga memori tetap ringan).
      - Menambahkan mekanisme **Infinite Scroll / Load More** pada [`TransactionHistoryScreen.js`](file:///d:/Projects/KasirKita/mobile/src/screens/TransactionHistoryScreen.js) menggunakan `onEndReached` dan `onEndReachedThreshold={0.4}` dengan indikator pemuatan halus (`ListFooterComponent`). Saat kasir men-scroll ke bawah, 20 data berikutnya dimuat secara bertahap tanpa membuat aplikasi berat atau membebani kuota internet.
- **Perbaikan & Perapian Input Pencarian Riwayat Transaksi (`TransactionHistoryScreen.js`, `CustomerPickerModal.js`)**:
  - **Penyelarasan Vertikal Presisi (Android Defensive UI Craft)**:
    - Menetapkan tinggi tetap yang proporsional (`height: 44`) pada kotak search bar dan menghilangkan `paddingVertical` dinamis platform yang sebelumnya memicu pembengkakan tinggi input di Android (hingga >50px).
    - Menambahkan `height: '100%'`, `paddingVertical: 0`, `textAlignVertical: 'center'`, dan `includeFontPadding: false` pada `TextInput` Android, menghilangkan padding internal bawaan `EditText` dan font baseline offset yang membuat teks placeholder dan ikon kaca pembesar sebelumnya tidak sejajar vertikal.
  - **Interaksi & Fokus Visual**:
    - Menambahkan state `isSearchFocused` dengan border aktif kontras Rose Brand (`#e11d48`) dan background sedikit terang saat kolom pencarian aktif disentuh pengguna.
    - Ikon `Search` kini bertransisi warna menjadi `#fb7185` saat aktif, dan tombol hapus pencarian `(X)` dilengkapi badge bulat rapi ber-hitSlop sentuh ramah jari.
  - **Penataan Filter Chips**:
    - Mempertahankan kontainer baris `View` standar untuk deretan filter chip (`Semua`, `Tunai`, `QRIS`, `TRANSFER`) agar ketinggian tombol tidak terkompresi atau terpotong vertikal (menghindari clipping issue pada ScrollView horizontal tanpa ketinggian eksplisit).
  - Lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Penyelarasan Tampilan & Cetak Struk Transaksi (`printerService.js`, `ReceiptView.js`, `PosReceiptModal.js`, `escposGenerator.js`)**:
  - **Sinkronisasi Logo Toko**:
    - Menambahkan rendering logo toko (`storeLogo`) di header struk cetak web iframe (`printerService.printWebReceiptHtml`) yang sebelumnya terlewat, sehingga logo toko (seperti ikon toko/troli merah) muncul persis sama antara pratinjau modal (`ReceiptView.js`) dan struk fisik yang dicetak.
    - Menambahkan listener `onload` pada gambar di dalam iframe sebelum memanggil `print()`, menjamin logo telah ter-decode sempurna saat dialog cetak browser terbuka.
    - Menambahkan sinkronisasi identitas toko cloud (`getStoreSettings`) yang otomatis mengambil logo dari storage/API jika data lokal belum lengkap, serta melakukan background cache ke storage di `ReceiptView.js`.
  - **Penghapusan Watermark Branding Bawah**:
    - Menghapus teks tambahan *"KasirKita POS"* yang sebelumnya dicetak di bawah catatan kaki nota di `printWebReceiptHtml` dan `escposGenerator.js`.
    - Hasil cetak kini 100% konsisten dan bersih sesuai yang tampil di modal pratinjau struk (hanya menampilkan teks `receiptFooter` kustom toko tanpa disisipi teks branding tambahan).
- **Cetak Struk Web Murni Bersih via Dedicated Iframe (`printerService.printWebReceiptHtml`)**:
  - Menyelesaikan kendala halaman cetak putih kosong di browser dengan beralih ke pendekatan standar industri POS: menggunakan **dedicated hidden iframe** yang langsung merender dokumen HTML struk nota kasir murni.
  - Saat kasir menekan tombol **`[Cetak Struk]`** di browser/PC:
    - Dokumen HTML struk instan dibuat dengan layout kasir thermal presisi (lebar 76mm/80mm, nama toko, alamat, no. nota, rincian item, subtotal, diskon, pajak, total tebal, dan ucapan terima kasih).
    - Tidak menyertakan header modal dialog *"Struk Transaksi"*, tombol silang `(X)`, tombol `[Cetak Struk]`, maupun tombol `[Tutup]`.
    - Tidak bergantung pada CSS `visibility: hidden` modal React Native yang sebelumnya memicu preview putih kosong di Chrome.
  - Terintegrasi langsung di **`PosReceiptModal.js`** (layar Riwayat & Dashboard) dan **`PaymentSuccessModal.js`** (dialog sukses kasir).
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Standardisasi Modal Struk Transaksi Riwayat & Dashboard (`PosReceiptModal.js`, `TransactionHistoryScreen.js`)**:
  - Menyeragamkan modal tampilan struk transaksi antara layar **Dashboard** dan layar **Riwayat Transaksi** menggunakan komponen modular `PosReceiptModal`.
  - Mengganti teks tombol *"Transaksi Baru"* menjadi **"Tutup"** (default prop `closeBtnText="Tutup"`), sehingga kontekstual dan tepat saat digunakan untuk meninjau riwayat transaksi lama.
  - Membawa tombol **`[Cetak Struk]`** (dengan integrasi penuh ke printer thermal Bluetooth ESC/POS dan browser web print) ke layar Riwayat, memungkinkan kasir mencetak ulang struk lama kapan saja secara instan.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 defect) dan lolos uji bundling Expo Web (`npx expo export --platform web`).
- **Layar Modal "Pembayaran Berhasil!" Pasca-Checkout Kasir POS (`PaymentSuccessModal.js`, `PosScreen.js`)**:
  - Menggantikan tampilan struk kertas penuh yang sebelumnya langsung muncul otomatis setelah konfirmasi pembayaran dengan modal dialog ringkas dan elegan sesuai referensi pengguna:
    - **Ikon Status**: Centang putih tebal di dalam lingkaran hijau bernuansa sukses (`#22c55e`) dengan efek glowing halo.
    - **Judul**: *"Pembayaran Berhasil!"* teks tebal kontras tinggi.
    - **Nominal Transaksi**: Angka nominal total tagihan (misal: `Rp 72.150`) berwarna hijau cerah emerald dengan tipografi menonjol.
    - **No. Nota**: Menampilkan nomor nota pembayaran (contoh: `INV-210826-002`) dalam warna abu-abu bersih `#a1a1aa`.
    - **Ukuran Kompak & Adaptif Layar HP**:
      - Memperkecil dimensi kartu (`maxWidth: 310px`, padding ringkas) dan lingkaran ikon agar tidak memakan seluruh layar HP (termasuk saat orientasi landscape maupun layar tinggi terbatas).
    - **Animasi Centang Garis Mengalir Santai (*Smooth Progressive Stroke Drawing*)**:
      - Menggunakan vektor SVG presisi tinggi dengan interpolasi `strokeDashoffset` (panjang path 36 unit) dan durasi diperhalus menjadi 650ms.
      - Garis centang putih digambar secara mengalir dari kiri ke kanan dengan kecepatan yang pas, tidak terburu-buru, dan terlihat sangat sinematik.
    - **Layer Hijau Pendar Bernyawa (*Living Breathing Halo Pulse*)**:
      - Lingkaran pendar hijau transparan luar diperbesar hingga 92px (`rgba(34, 197, 94, 0.2)`).
      - Dilengkapi animasi denyut napas halus berulang (*gentle breathing pulse loop*: scale 0.98 $\leftrightarrow$ 1.08) yang membuat layer hijau di belakangnya terasa hidup, dinamis, dan memancarkan kepastian transaksi sukses secara organik.
    - **Posisi Centang Presisi Tengah (*Perfect Center Alignment*)**:
      - Vektor SVG dikalibrasikan tepat di koordinat pusat lingkaran `viewBox="0 0 24 24"` dengan titik temu siku di (9.5, 17.5), menjamin posisi centang seimbang dan presisi di tengah bulatan hijau.
    - **Pembersihan Warning Konsol Web (`useNativeDriver` & Clean SVG Path)**:
      - Menyesuaikan `useNativeDriver: Platform.OS !== 'web'` sehingga saat dijalankan di browser (React Native Web) animasi berjalan mulus tanpa warning missing `RCTAnimation`.
      - Mengganti pembungkus `Animated.createAnimatedComponent(Path)` dengan pembaruan state reaktif murni `drawAnim.addListener` $\rightarrow$ `currentOffset` pada `<Path />` standar, menghilangkan error React DOM `Received 'false' for a non-boolean attribute 'collapsable'`.
    - **Dua Tombol Aksi Ergonomis (Harmoni Emerald Green)**:
      - **[Cetak Struk]**: Tombol gelap netral (`#27272a` dengan border `#3f3f46` dan ikon printer putih `#e4e4e7`) yang tidak mencolok agar fokus utama tetap pada penyelesaian transaksi.
      - **[Selesai]**: Tombol hijau emerald solid (`#16a34a`) yang harmonis dengan ikon centang sukses dan nominal tagihan di atasnya.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 warning/defect) dan lolos verifikasi build bundle Expo Web (`npx expo export --platform web`).
- **Perbaikan Kontras Aksesibilitas WCAG AA Dashboard (`SalesTrendChart.js`, `RecentTransactionsSection.js`)**:
  - Memperbaiki isu *low contrast text* pada label tanggal aktif grafik tren omzet: mengganti latar transparan kemerahan menjadi warna tegas `#e11d48` dengan teks putih murni `#ffffff` (rasio kontras 5.2:1, melampaui standar WCAG AA 4.5:1).
  - Memperbaiki isu *low contrast text* pada badge metode pembayaran transaksi:
    - **Tunai**: teks `#6ee7b7` di atas latar `#064e3b` dengan border `#047857` (rasio kontras 7.8:1).
    - **QRIS**: teks `#7dd3fc` di atas latar `#0c4a6e` dengan border `#0284c7` (rasio kontras 6.9:1).
    - **Transfer**: teks `#c4b5fd` di atas latar `#3b0764` dengan border `#7c3aed` (rasio kontras 6.4:1).
  - Melakukan audit menyeluruh dan standarisasi ukuran font teks pendukung (*The Readability Floor Rule* minimal `12px` / `text-xs`) pada kedua komponen.
  - Lolos uji linter desain Impeccable (`detect.mjs` $\rightarrow$ 0 warning/defect) dan lolos build Expo Web.
- **Penataan Urutan Navigasi Tab Bottom Bar & Default Landing Screen (`App.js`)**:
  - Mengubah urutan navigasi tab bawah mobile menjadi:
    1. **Dashboard** (tab pertama aktif saat login dan setiap kali aplikasi dibuka)
    2. **Kasir POS**
    3. **Riwayat**
    4. **Pengaturan**
  - Menyematkan sinkronisasi sesi otentikasi (`useEffect` pada `user?.id`) agar saat aplikasi pertama kali dibuka atau dimuat ulang, layar yang pertama kali muncul dijamin selalu adalah **Dashboard**.
  - Layar orkestrator terhubung mulus dengan helper navigasi internal, memastikan tombol pintas (seperti tombol *"Riwayat"* di seksi transaksi dashboard) berpindah tab secara tepat.
- **Penambahan 10 Transaksi Penjualan Terakhir & Reposisi Tombol Perbarui Data (`RecentTransactionsSection.js`, `DashboardScreen.js`, `offlineStorage.js`)**:
  - Mereposisi tombol *"Perbarui Data"* tepat di bawah grid $2 \times 2$ kartu metrik dan **sebelum** grafik tren omzet agar aksi sinkronisasi metrik utama lebih ergonomis dan langsung terjangkau.
  - Menambahkan komponen baru `mobile/src/components/dashboard/RecentTransactionsSection.js`:
    - Menampilkan daftar 10 transaksi kasir terakhir lengkap dengan nomor invoice, badge metode bayar (Tunai/QRIS/Transfer), nama pelanggan, jam transaksi, dan status sukses.
    - Setiap item transaksi interaktif: saat disentuh, membuka modal struk detail pembayaran (`PosReceiptModal.js` + `ReceiptView.js`) dengan opsi cetak printer thermal / Bluetooth.
    - Tombol pintas header *"Riwayat"* untuk melompat langsung ke layar Riwayat Transaksi lengkap.
  - **Dukungan Offline-First Caching**:
    - Riwayat transaksi terbaru dicache via `cacheDashboardRecentTx()` di `offlineStorage.js` sehingga daftar transaksi tetap tampil instan saat offline.
  - Lolos uji linter desain (`detect.mjs` $\rightarrow$ 0 error) dan lolos verifikasi build bundle Expo Web (`npx expo export --platform web`).
- **Visualisasi Grafik Tren Omzet 7 Hari Interaktif di Dashboard Mobile (`SalesTrendChart.js`, `DashboardScreen.js`, `offlineStorage.js`)**:
  - Menambahkan komponen baru `mobile/src/components/dashboard/SalesTrendChart.js` yang menampilkan grafik batang vertikal harian 7 hari terakhir.
  - **Fitur Grafik**:
    - Header memuat judul grafis dengan ikon kalender mawar dan kalkulasi total omzet 7 hari terakhir (`Total 7 Hari: RpX`).
    - Bar batang vertikal proporsional dengan aksen warna Rose/Red, rounded corner atas, dan penanda status hari ini.
    - **Tap-to-Inspect Interaktif**: Saat batang tanggal disentuh, muncul baris inspektur yang merincikan tanggal, jumlah transaksi sukses, nominal omzet harian yang presisi, dan indikator angka ringkas di atas batang (`1.2jt` / `45k`).
  - **Dukungan Offline-First Caching**:
    - Data tren harian dari endpoint backend `GET /api/v1/finance/trends` disimpan ke cache lokal via `cacheDashboardTrends()` di `offlineStorage.js`.
    - Grafik tetap dapat ditampilkan langsung saat kasir sedang offline atau tanpa koneksi internet.
  - Lolos uji linter desain (`detect.mjs` $\rightarrow$ 0 error) dan lolos verifikasi build bundle Expo Web (`npx expo export --platform web`).
- **Refaktorisasi Modular, Offline-First, & Error Handling Layar Dashboard Mobile (`DashboardScreen.js`, `DashboardMetricsGrid.js`, `DashboardDetailModal.js`, `offlineStorage.js`, `format.js`)**:
  - Mengubah `DashboardScreen.js` dari monolitik (670 baris) menjadi **arsitektur modular** (~230 baris), mengikuti pola arsitektur `PosScreen` dan `SettingsScreen`.
  - Memisahkan komponen UI ke dalam folder baru `mobile/src/components/dashboard/`:
    - `DashboardMetricsGrid.js`: Mengatur layout grid $2 \times 2$ kartu metrik dan trigger modal dengan kepatuhan *Defensive UI Craft*.
    - `DashboardDetailModal.js`: Menggabungkan 4 modal tooltip yang sebelumnya duplikatif menjadi 1 komponen dinamis berbasis konfigurasi skema.
  - **Strategi Offline-First Caching**:
    - Menambahkan `cacheDashboardSummary()` dan `getCachedDashboardSummary()` di `offlineStorage.js`.
    - Saat Dashboard dibuka, aplikasi membaca cache lokal secara instan, lalu menyinkronkan data terbaru dari server di latar belakang.
    - Dilengkapi badge waktu sinkronisasi: *"Sinkron: 16:45"*.
  - **Penanganan Error & Tombol Coba Lagi**:
    - Jika koneksi terputus atau server offline, aplikasi menampilkan banner peringatan ramah pengguna dengan tombol *"Coba Lagi"*, tanpa silent-fail menjadi angka Rp0.
  - **Pemisahan State Loading & Refreshing**:
    - Tombol *"Perbarui Data"* kini memiliki spinner inline sendiri (`refreshing`). Layar tidak lagi berkedip/hilang saat menekan tombol refresh.
  - **Utility Universal Format Rupiah (`mobile/src/utils/format.js`)**:
    - Mengekstrak fungsi `formatRp` menjadi helper bersama terstandarisasi.
  - Lolos uji linter desain (`detect.mjs` $\rightarrow$ 0 error) dan lolos build bundle Expo Web (`npx expo export --platform web`).
- **Perbaikan Sinkronisasi Toggle Struk ke Backend Cloud (`SettingsScreen.js`, `StoreSetting.php`)**:
  - Memperbaiki bug di mana toggle *"Tampilkan Logo Toko"* dan *"Nomor WhatsApp Toko"* mati sendiri saat aplikasi dimuat ulang.
  - Saat switch digeser oleh pengguna, `persistSettings` kini langsung memperbarui database backend (`PUT /api/v1/settings/store`) dan local cache sekaligus, sehingga saat aplikasi dibuka kembali atau disinkronkan dari cloud, status toggle tetap **ON** dan tidak ter-reset ke `false`.
- **Pembersihan Toggle Struk Duplikat di Layar Pengaturan (`StoreIdentityModal.js`, `SettingsScreen.js`)**:
  - Menghapus toggle switch *"Tampilkan Logo Toko di Struk"* dan *"Tampilkan No. WhatsApp di Struk"* dari dalam modal Identitas Toko (`StoreIdentityModal.js`).
  - Mempertahankan toggle switch tersebut secara eksklusif dan terpusat di seksi utama **`PREFERENSI STRUK & KASIR`** pada `SettingsScreen.js` agar tidak terjadi duplikasi kontrol UI dan lebih mudah diakses oleh pengguna.
- **Perencanaan Plan #24: Cloud Sync Preferensi Toko & Cadangkan/Pulihkan Data Lokal (`plans/260903-24-cloud-sync-dan-data-backup-restore/plan.md`)**:
  - Menyusun arsitektur dan tahapan rencana kanban untuk 2 solusi multi-device tanpa hosting berbayar:
    1. *Solusi 1 (Cloud Free-Tier)*: Penyimpanan kolom JSONB preferensi di server backend & database gratis (Supabase/Neon + Render/Railway) agar toggle di HP 1 otomatis menyinkronkan HP 2.
    2. *Solusi 3 (Berkas Cadangan JSON)*: Jaring pengaman darurat offline untuk mengekspor dan memulihkan seluruh katalog, transaksi, dan setting via file sharing (WhatsApp/Google Drive).
- **Fitur Bunyi Beep Scanner Barcode & Integrasi Pengaturan Kasir (`soundService.js`, `PosBarcodeScannerView.js`, `PosScreen.js`)**:
  - **Audio Synthesizer & Player Multiplatform (`mobile/src/services/soundService.js`)**:
    - **Nada Sukses (High-Pitch)**: Frekuensi ~2000Hz selama 100ms dengan envelope fade-out halus layaknya scanner barcode kasir Honeywell/Datalogic.
    - **Nada Gagal / Tidak Ditemukan**: Frekuensi rendah ~600Hz selama 180ms sebagai audio warning.
    - **Dual Engine**: Menggunakan Web Audio API Synthesizer di platform Web, dan native `expo-audio` di perangkat Android/iOS (Expo Go & APK fisik).
  - **Tersambung ke Toggle Pengaturan**: Opsi *"Bunyi Beep Scanner"* di Pengaturan secara langsung mengontrol audio feedback di layar kasir POS. Jika toggle dimatikan (OFF), pemindaian berlangsung senyap (silent mode).
- **Fitur Toggle Scanner Barcode di Pengaturan & Integrasi Kasir POS (`SettingsScreen.js`, `PosScreen.js`)**:
  - **Toggle Pengaturan**: Menambahkan opsi Switch `"Fitur Scan Barcode"` pada bagian Preferensi Kasir (`SettingsScreen.js`) dengan penyimpanan persisten di storage lokal.
  - **Dinamis di POS (Landscape & Portrait)**: 
    - Saat toggle aktif (`true`), tombol scanner muncul di header keranjang (landscape) dan di samping pencarian katalog (portrait).
    - Saat toggle dinonaktifkan (`false`), tombol scanner disembunyikan sepenuhnya dari layar kasir dan mode scanner tidak dapat terbuka, memberikan ruang belanja yang bersih bagi toko yang tidak memerlukan scan barcode kamera.
  - **Penyempurnaan Tampilan Barcode Scanner (`PosBarcodeScannerView.js`)**:
    - Animasi garis laser scan merah yang bergerak naik-turun halus (60fps native driver).
    - Mode ketik manual terintegrasi inline di floating bottom bar landscape.
    - Double-confirmation scanner untuk mengeliminasi false positive scan dari tekstur lingkungan.
    - Format teks profesional: *"Barcode tidak dikenali - Kode [xxxx] belum terdaftar di katalog produk."*

- **Refaktorisasi & Modularisasi Layar Pengaturan Mobile (`SettingsScreen.js`) - Plan #23 SELESAI (100%)**:
  - Berhasil memecah file monolitik `SettingsScreen.js` dari **~2.940 baris** menjadi **~1.430 baris** (berkurang lebih dari 1.500 baris kode / 51% lebih ringkas) dengan mengekstrak 7 sub-komponen modal modular di `mobile/src/components/settings/`:
    1. `UserProfileModal.js`: Modal form edit profil nama dan telepon kasir beserta validasi mandiri.
    2. `ChangePasswordModal.js`: Modal form ganti kata sandi dengan toggle intip sandi dan validasi konfirmasi sandi.
    3. `StoreIdentityModal.js`: Modal profil toko lengkap dengan pemilih logo via ImagePicker, preview, serta toggle cetak logo/telepon nota.
    4. `PrinterSettingsModal.js`: Modal pemindai printer Bluetooth fisik (Web Bluetooth / native BLE) & preset simulasi (Panda, RPP02N, Thermal-80, Iware).
    5. `PrinterGuideModal.js`: Modal panduan 4 langkah mudah menyambungkan printer thermal kasir.
    6. `TestReceiptModal.js`: Modal pratinjau struk belanja kasir dengan opsi uji cetak 2 salinan (toko & pelanggan).
    7. `SecurityAuditModal.js`: Modal audit perlindungan brankas hardware AES-256, enkripsi TLS Sanctum, dan integritas UUID nota offline.
  - Menghapus lebih dari 20 temporary `useState` lokal form dan ratusan baris StyleSheet monolitik mati dari file utama.
  - Memperbaiki bug logic `isOnline` string mismatch dan silent network error handling pada sinkronisasi pengaturan toko.
  - Memastikan audit WCAG: seluruh ukuran teks mematuhi batas lantai keterbacaan (≥12px / `text-xs`) dan tidak ada font kustom yang terlalu kecil.
  - Bundling Expo Web lolos 100% (2.212 modules).

- **Toggle Pemilihan Pelanggan Kasir & Penataan Ulang Hierarki Checkout (`SettingsScreen.js`, `PosScreen.js`)**:
  - **Toggle Pengaturan**: Menambahkan opsi Switch `"Pemilihan Pelanggan di Kasir"` di Pengaturan Kasir (`SettingsScreen.js`) yang tersimpan secara persisten di storage. Bila dimatikan (OFF), kartu pelanggan di layar checkout akan disembunyikan sehingga layar lebih lega dan transaksi otomatis tercatat sebagai Pelanggan Umum.
  - **Penataan Ulang Urutan Checkout Kasir (Landscape & Portrait)**: Memastikan hierarki kasir di `PosScreen.js` tertata sesuai urutan ritel yang disepakati:
    1. **Daftar Pesanan** (Atas / Scrollable dengan item breakdown)
    2. **Pelanggan Umum / Member** (Kondisional sesuai toggle setting)
    3. **Voucher & Pajak** (Pill options cepat)
    4. **TOTAL TAGIHAN** (Banner merah di bagian bawah / pinned)
  - **Verifikasi Build**: Bundling Expo Android lolos 100% tanpa error (2.567 modules).

- **Penyempurnaan Hierarki Checkout & Keranjang POS Mobile (`PosCheckoutView.js`, `LandscapeRegisterPanel.js`)**:
  - **Badge Keranjang**: Mengubah warna background badge jumlah item pada header panel keranjang menjadi merah crimson khas KasirKita (`#e11d48`) dengan angka tebal putih (`#ffffff`, `Poppins_700Bold`), membuang teks "pcs" sehingga hanya menampilkan angka murni yang terpusat simetris (`includeFontPadding: false`).
  - **Penataan Ulang Hierarki Kolom Checkout (Landscape & Portrait)**:
    1. **Daftar Pesanan (Atas / Scrollable)**: Mengikuti hierarki alami nota kalkulasi ritel, daftar item dan subtotal diletakkan di urutan pertama dalam container `ScrollView` (`flex: 1`) sehingga bila item banyak, daftar pesanan dapat digulir tanpa mendorong keluar elemen penting lainnya.
    2. **Pelanggan Umum / Member**: Pemilihan pelanggan diposisikan mendahului diskon promo agar penentuan hak member dapat dilakukan sebelum kalkulasi voucher.
    3. **Voucher & Pajak**: Pill options untuk kode promo diskon dan tarif pajak (PPN/PB1).
    4. **TOTAL TAGIHAN (Bawah / Pinned Sticky Footer)**: Banner merah total tagihan dikunci di posisi paling bawah sehingga nominal akhir pembayaran selalu terlihat jelas tanpa tertutup/tenggelam oleh daftar belanjaan yang panjang.
  - **Presisi Typografi Numpad & Tombol Pembayaran**: Mengatasi isu intrinsik Android Google Font Poppins descender padding dengan menerapkan `includeFontPadding: false` dan `textAlignVertical: 'center'` pada seluruh tombol numpad, preset uang pas, tab metode pembayaran (TUNAI/QRIS/TRANSFER), dan tombol submit pembayaran.

- **Refaktorisasi & Modularisasi Skrip Layar Kasir Mobile (`PosScreen.js`) - Plan #22 SELESAI (100%)**:
  - Pemecahan file monolitik `PosScreen.js` (~4.900 baris) menjadi ~840 baris dengan mengekstrak 8 sub-komponen terisolasi di `mobile/src/components/pos/`:
    1. `CustomerPickerModal.js`: Modal pemilihan pelanggan & member dengan live search dan badge keanggotaan.
    2. `PromoVoucherModal.js`: Modal daftar voucher toko dan promo diskon aktif.
    3. `TaxFeeModal.js`: Modal pemilihan tarif pajak PPN/PB1 transaksi.
    4. `PosReceiptModal.js`: Modal nota struk thermal Bluetooth ESC/POS lengkap dengan opsi print fisik & simulasi.
    5. `PosCartModal.js`: Bottom sheet interaktif keranjang belanja khusus mode portrait.
    6. `ProductGrid.js`: Grid katalog produk responsive, toolbar pencarian, filter kategori, dan kartu stok.
    7. `LandscapeRegisterPanel.js`: Kolom kasir kanan persisten untuk mode tablet/landscape.
    8. `PosCheckoutView.js`: Tampilan dedicated checkout view (landscape 2-kolom & portrait) dengan input voucher, tabs metode pembayaran CASH/QRIS/TRANSFER, dan integrated cashier numpad 3x4 + quick nominal presets.
  - Pemangkasan ribuan baris StyleSheet monolitik mati dari `PosScreen.js`, menyisakan container dasar dan floating cart.
  - Integrasi custom hook `useCheckoutReducer` (`mobile/src/hooks/useCheckoutState.js`) menggantikan belasan state flat.
  - Audit Defensive UI & WCAG Accessibility: Semua ukuran font terkecil memenuhi batas lantai keterbacaan (≥12px / `text-xs`), flexbox pairing (`min-w-0 truncate` vs `shrink-0 whitespace-nowrap`), serta detektor Impeccable 0 defect (`[]`).
  - Verifikasi automated test PHPUnit (`EndToEndFlowTest`) lolos 100% (13 assertions) dan bundler Expo Web lulus 100% (2.204 modules).

- Inisialisasi arsitektur backend Laravel REST API & Laravel Sanctum di folder `backend/`.
- Perancangan ERD dan implementasi skema PostgreSQL lengkap dengan UUID & Indexing (`docs/ERD-Database.md`).
- Implementasi API Endpoint Otentikasi (`/api/auth/login`, `/api/auth/logout`, `/api/auth/me`, `/api/health`).
- Pembuatan Model Eloquent: `User`, `Category`, `Product`, `StockMovement`, `Transaction`, `TransactionItem`, `StockOpname`, `StockOpnameItem`, `CashFlow`.
- Implementasi `InventoryService` untuk perhitungan Moving Average Cost, Perpetual Restock, dan Penyesuaian Stock Opname.
- Implementasi `PosService` untuk checkout transaksi atomik (pessimistic locking), pemotongan stok otomatis real-time, penerbitan invoice struk, dan pembatalan transaksi (void).
- Implementasi `FinanceService` untuk ringkasan dasbor (omzet, total HPP/COGS, laba kotor, beban operasional, laba bersih, arus kas), grafik tren penjualan harian, pencatatan biaya operasional, dan ekspor laporan CSV.
- Pembuatan Frontend Web Dashboard di folder `web/` (React.js + Tailwind CSS + Google Font Poppins + Impeccable UI Craft tema Obsidian & Crimson).
- Pembuatan Mobile App di folder `mobile/` (React Native Expo + Expo SecureStore + `@expo-google-fonts/poppins` + Touch POS + Mobile Dashboard).
- Pengujian End-to-End (`backend/tests/Feature/EndToEndFlowTest.php`) dan panduan deployment produksi (`docs/DEPLOYMENT.md`).
- Modul `plans/260829-01-fondasi-dan-auth` **SELESAI (100%)**.
- Modul `plans/260829-02-manajemen-inventaris` **SELESAI (100%)**.
- Modul `plans/260829-03-point-of-sales` **SELESAI (100%)**.
- Modul `plans/260829-04-laporan-keuangan` **SELESAI (100%)**.
- Modul `plans/260829-05-frontend-web-dashboard` **SELESAI (100%)**.
- Modul `plans/260829-06-mobile-app` **SELESAI (100%)**.
- Modul `plans/260829-07-integrasi-dan-deployment` **SELESAI (100%)**.
- Modul `plans/260830-08-role-based-access-control` **SELESAI (100%)**.
- Modul `plans/260831-09-mobile-floating-cart-drawer` **SELESAI (100%)** (Floating Cart Bar & Bottom Sheet Drawer untuk POS Mobile Web).
- Modul `plans/260831-10-master-satuan-dan-multi-uom` **SELESAI (100%)**:
  - Tabel `units` dan `product_unit_conversions` dengan partial unique index (`WHERE is_base = true`), unique barcode, dan check constraint (`conversion_factor > 0`).
  - Presisi pecahan `DECIMAL(12,4)` & `DECIMAL(15,4)` untuk mencegah *rounding drift*.
  - Deadlock-free ordered pessimistic locking (`sortBy('product_id')`) di `PosService`.
  - Snapshot transaksi immutable (`unit_name`, `conversion_factor`, `base_quantity`, `avg_cost_at_sale`) dan soft delete FK `ON DELETE SET NULL`.
  - Frontend Web: Halaman Master Satuan (`/units`), Multi-Konversi di Modal Produk & Restock (`/inventory`), dan pemilihan satuan di POS (`/`).
  - Mobile App: Integrasi satuan pada payload checkout.
  - Automated feature tests 100% lulus (24 tests, 111 assertions).
- **Audit Fix Multi-UoM** (Poin Review User):
  - `RbacTest.php` (4 tests RBAC) yang hilang saat development UoM telah di-restore.
  - `ProductController::destroy()` dimigrasi ke SoftDeletes penuh (`$product->delete()` menggantikan `update(['is_active' => false])`). Semantik: `is_active = false` → nonaktif sementara (musiman), `delete()` → dihapus lunak permanen.
  - Test baru `test_soft_delete_hides_product_but_preserves_transaction_history` memverifikasi produk tersembunyi setelah delete tapi histori transaksi tetap utuh.
- **Instalasi & Integrasi Skills Antigravity**:
  - `plans-kanban` & `markdown-novel-viewer` terpasang di `.agents/skills/` dan global `~/.gemini/config/`.
  - `context7` terpasang dengan cross-platform runner `scripts/context7.cjs`.
  - `impeccable` (v4.1.2) terpasang resmi dengan 24 sub-perintah yang telah dipin dan didaftarkan sebagai slash command (`.agents/workflows/*.md` & global).
- **Perbaikan Anti-Patterns Mobile POS (`http://localhost:8081`)**:
  - *Monotonous spacing*: Menata ulang skala spasi pada modal checkout dan layar POS dari nilai seragam ~8px (62%) menjadi skala berirama (4px, 8px, 12-14px, 16px, 20-24px), mendistribusikan spasi secara proporsional (dominansi turun ke 29%, lulus uji detektor).
  - *Kalibrasi Tipografi Ergonomis Mobile*: Menyelaraskan skala font khusus viewport HP (Android/iOS 2-kolom kartu ~160dp). Menghindari font web yang terlalu bongsor (26px/19px) yang menyebabkan nama produk terlipat 3 baris dan kategori terpotong ("Minu..."). Dikalibrasi ke rasio proporsional Material 3: Brand 20px, Tabs 13px, Nama Produk 13px, Harga 15px (bold), Kategori/Stok 12px dengan padding kartu 12px agar teks muat rapi dan tidak terpotong.
  - *Format Stok Maksimal & Satuan Produk*: Memperbaiki notifikasi stok maksimal dari format desimal database mentah `"23.0000 unit"` menjadi format bersih dinamis sesuai satuan produk (`"Stok Beras Premium 5kg hanya tersisa 23 pcs"`), serta menambahkan visual disabled state (opacity 35%) pada tombol `[+]` saat jumlah di keranjang telah mencapai stok maksimal toko.
  - *Perbaikan Kontainer Modal Promo*: Memperbaiki typo nama style sheet `customerModalContent` ke `customerPickerSheet` sehingga modal promo memiliki padding 20px dan latar gelap solid (tidak lagi mepet ke pinggir).
  - *Readability floor*: Menjaga seluruh teks terkecil memenuhi standar WCAG (minimal 12px / `text-xs`).
- **Penyelarasan Layout Header & UI Craft di `/units`**:
  - Menyelaraskan layout header `/units` dengan halaman `/inventory`, `/transactions`, dan `/stock-opname`: menghilangkan kontainer card box tertutup, menghilangkan padding ganda (meratakan ke `<div className="space-y-6">`), menggunakan header terbuka dengan ikon inline, judul `h1` tegas, subjudul `max-w-lg leading-relaxed`, serta tombol aksi di kanan atas.
  - Menyelaraskan kotak pencarian ke dalam bar terstruktur `bg-zinc-900 border border-zinc-800/80 rounded-2xl p-3 sm:p-4 shadow-sm` lengkap dengan info total satuan di sisi kanan.
  - Memperbaiki hierarki heading (*skipped heading level*) dengan menyelaraskan judul kartu satuan dan modal ke tag semantik `<h2>`, memastikan struktur outline dokumen urut (`<h1>` -> `<h2>`).
  - Memperbaiki *hairline border with wide shadow* pada modal Tambah/Edit dan Hapus: mengganti `shadow-2xl` (blur 50px) dengan `shadow-md` (blur 6px) berpadu garis batas yang tegas (`border border-zinc-700/80`).
  - Memperbaiki *flat type hierarchy*: menaikkan ukuran `h1` dari `text-xl sm:text-2xl` ke `text-2xl sm:text-3xl` (24px - 30px), menghasilkan rasio kontras skala tipografi 2.5:1 terhadap ukuran dasar 12px (melampaui target minimum 2.0:1).
  - Memperbaiki *tiny body text*: mengganti teks bantuan `text-[11px]` menjadi ukuran standar `text-xs` (12px).
- **Perbaikan Impeccable UI Craft di `/inventory`**:
  - Memperbaiki *line length too long* pada subjudul header dengan menambahkan `max-w-lg leading-relaxed` (lebar ~72 karakter per baris, ideal di bawah batas 80 karakter WCAG/Impeccable).
  - Memperbaiki *nested cards* pada bagian konversi multi-satuan di modal produk: meratakan hierarki container kosong (`div.rounded-xl.bg-zinc-950/60.border`) menjadi tipografi datar `<p className="py-4 px-4 text-zinc-400 text-xs text-center italic max-w-md mx-auto leading-relaxed">` (membatasi panjang baris agar tidak melebihi 80 karakter), serta menyusun baris konversi menggunakan pemisah `divide-y divide-zinc-800/80`.
  - Memperbaiki *tiny body text*: mengeliminasi seluruh teks `text-[10px]` pada label dan teks bantuan input menjadi ukuran standar yang dapat dibaca `text-xs` (12px).
  - Merapikan elevasi modal produk, restock, dan histori mutasi menggunakan garis batas tegas `border-zinc-700/80` dan `shadow-md`.
- **Perbaikan Impeccable UI Craft di `/pos`**:
  - Memperbaiki baris kategori & stok produk agar tidak kolaps ke 2 baris: menambahkan `shrink-0 whitespace-nowrap` pada teks stok dan `truncate min-w-0` serta tooltip `title` pada nama kategori.
  - Menyelaraskan ketinggian judul produk lintas kartu dengan `min-h-[2.5rem] line-clamp-2 leading-snug` (tanpa fixed `h-10` agar tidak bentrok dengan `line-clamp-2`).
  - Memisahkan indikator keranjang belanja dari baris harga: mengimplementasikan badge melayang di sudut kanan atas kartu (`absolute -top-1.5 -right-1.5`) dengan ring dinamis (`ring-zinc-900 group-hover:ring-zinc-800`) dan padding asimetris pengaman pada grid (`pt-2.5 pr-2.5`) agar tidak terpotong oleh `overflow-y-auto` maupun scrollbar Windows tanpa mengorbankan alignment sisi kiri dengan search bar. Baris harga kini 100% leluasa untuk nominal besar.
  - Menaikkan teks satuan harga dari `text-[11px]` ke `text-xs` standar WCAG.
- **Pembersihan Massal & Penguatan Layout (Sweep & Harden Seluruh Web App)**:
  - Mengeliminasi seluruh sisa teks `< 12px` (`text-[10px]` dan `text-[11px]`) di `AppLayout.jsx`, `Dashboard.jsx`, `Inventory.jsx`, dan `Pos.jsx` menjadi `text-xs` (12px) standar WCAG.
  - Memperkuat modal Struk Thermal Belanja di `Transactions.jsx`, `Dashboard.jsx`, dan `Pos.jsx`: menerapkan `min-w-0 truncate` pada nama produk, serta `shrink-0 whitespace-nowrap font-mono` pada harga subtotal dan kalkulasi pembayaran agar tidak terlipat menjadi 2 baris pada kertas thermal sempit.
  - Memperkuat kartu metrik ringkasan di `Dashboard.jsx` dan `CashFlow.jsx`: menambahkan `shrink-0` pada kotak icon agar tidak gepeng saat layar menyempit, dan membungkus kartu dengan `flex flex-col justify-between` agar tinggi kartu sejajar rapi.
  - Memperbaiki anti-pattern *cramped padding* pada wadah tabel buku kas di `CashFlow.jsx`: mengembalikan padding container `p-5` (20px inset di semua sisi) selaras dengan `Inventory.jsx` dan `Transactions.jsx`, serta memformat string tanggal mentah ISO UTC (`2026-08-31T00:00:00.000000Z`) menjadi format tanggal lokal Indonesia yang ringkas dan manusiawi (`31 Agu 2026`).
  - Memperbaiki validasi dan skema Stock Opname desimal: mengubah aturan validasi backend `items.*.physical_stock` di `StockOpnameController.php` dari `integer` ke `numeric` (mendukung desimal multi-UoM), membuat migrasi alter tabel `stock_opname_items` (`system_stock`, `physical_stock`, `difference` menjadi `decimal(12, 4)`), dan memparsing input form di `StockOpname.jsx` agar tidak mengirim atau menampilkan desimal mentah `"48.0000"` melainkan angka bersih (`48` atau desimal terformat) beserta simbol satuan aslinya.
  - Memperbaiki tampilan kuantitas item penjualan di `Dashboard.jsx`, `Transactions.jsx`, dan `Pos.jsx`: membungkus `item.quantity` dengan `Number()` sehingga tidak merender desimal mentah 4 digit nol (`2.0000x`) melainkan kuantitas bersih (`2x`).
  - **Pembangunan Halaman Master Kategori Produk & Reorganisasi Sidebar**:
    - Membangun halaman antarmuka penuh Master Kategori di `Categories.jsx` (`/categories`): visual grid kartu kategori, pencarian live, penghitung produk terhubung (`products_count`), modal tambah kategori, modal edit kategori, dan modal konfirmasi hapus aman (mencegah penghapusan jika kategori masih memiliki produk terhubung).
    - Menata ulang sidebar navigasi di `AppLayout.jsx` menjadi 4 grup fungsional terstruktur: **Operasional Kasir** (Kasir POS, Riwayat Transaksi), **Inventaris & Kas** (Inventaris & HPP, Stock Opname, Buku Kas Toko), **Data Master** (Master Kategori, Master Satuan), dan **Laporan & Analitik** (Dashboard & Laporan).
    - Mengeliminasi anti-pattern Impeccable pada `/categories`: memperbaiki *hairline border with wide shadow* pada modal dengan mengganti `shadow-2xl` ke `shadow-md` (berkomitmen pada ketegasan batas tepi), dan memperbaiki *skipped heading level* dengan menyelaraskan judul kartu kategori dari `h3` menjadi `h2` di bawah heading halaman `h1`.
  - **Pembangunan Modul Plan #11: Master Pelanggan & Keanggotaan (Customer & Membership)**:
    - Migrasi database: membuat tabel `customers` (UUID, nama, no. WhatsApp/HP terindeks & unik, email, alamat, tipe keanggotaan: `REGULAR`, `VIP`, `WHOLESALE`, catatan, soft deletes) dan menambahkan kolom `customer_id` (`ON DELETE SET NULL`) serta `customer_phone` pada tabel `transactions`.
    - Backend API & Service: `CustomerController.php` (CRUD lengkap, pencarian live driver-aware PostgreSQL `ilike`/SQLite `like`, riwayat transaksi per pelanggan) dan `PosService.php` (mencatat `customer_id` dan snapshot nama/HP pelanggan saat transaksi).
    - Frontend Web: Halaman antarmuka lengkap `Customers.jsx` (`/customers`), kartu member dengan avatar inisial, tautan cepat WhatsApp (`wa.me`), filter keanggotaan, modal tambah/edit, modal riwayat transaksi, dan modal konfirmasi hapus.
    - Integrasi Kasir POS (`Pos.jsx`): Customer Selector interaktif di modal pembayaran (pencarian live pelanggan, opsi *Pelanggan Umum*, tombol cepat `+ Member Baru`), serta pencantuman nama & kontak WhatsApp pelanggan pada Struk Thermal Belanja.
    - Pengujian Otomatis: `CustomerApiTest.php` (7 test cases lolos 100%, total suite backend kini 31 tests, 141 assertions lolos).
    - Mengeliminasi anti-pattern Impeccable pada `/customers`: memperbaiki *nested cards* di dalam modal riwayat transaksi dengan meratakan hierarki visual (*flattening hierarchy*) — menghilangkan wadah kartu bergaris ganda di dalam modal dan menggantinya dengan deret pembatas garis halus (`divide-y`) serta teks status kosong yang tenang dan elegan.
  - **Pembangunan Modul Plan #12: Master Pemasok & Pembelian (Supplier & Procurement)**:
    - Migrasi database: membuat tabel `suppliers` (UUID, nama distributor, kontak sales/PIC, nomor telepon/WhatsApp, email, alamat, nama bank, nomor rekening, pemilik rekening, catatan, soft deletes) serta menambahkan kolom `supplier_id` (nullable FK, `ON DELETE SET NULL`) pada tabel `stock_movements` dan `cash_flows`.
    - Backend API & Service: `SupplierController.php` (CRUD lengkap, pencarian live driver-aware PostgreSQL `ilike`/SQLite `like`, histori pasokan per supplier), `InventoryService.php` (mencatat `supplier_id` pada mutasi stok masuk dan pengeluaran kas restock), `ProductController.php` (validasi dan pemrosesan `supplier_id`), serta `FinanceService.php` (mencatat `supplier_id` pada buku kas toko).
    - Frontend Web: Halaman antarmuka lengkap `Suppliers.jsx` (`/suppliers`), kartu distributor dengan info kontak sales, tautan WhatsApp langsung (`wa.me`), info rekening bank untuk transfer kulakan, metrik total belanja kulakan & frekuensi restock, modal tambah/edit, modal riwayat pasokan (desain datar tanpa nested cards), dan modal konfirmasi hapus aman.
    - Integrasi Restock Inventaris (`Inventory.jsx`): Dropdown pemilihan distributor/pemasok pada modal Restock Barang Masuk dengan UoM conversion preview.
    - Integrasi Buku Kas Toko (`CashFlow.jsx`): Dropdown rekanan pemasok pada pengeluaran kas (`OUT`) dan badge identitas supplier pada daftar arus kas.
    - Pengujian Otomatis: `SupplierApiTest.php` (6 test cases lolos 100%, total suite backend kini 37 tests, 167 assertions lolos).
  - **Pembangunan Modul Plan #13: Master Pengguna & Manajemen Staf Kasir (Staff & User Management)**:
    - Migrasi database: menambahkan `softDeletes()` pada tabel `users` untuk menjamin jejak audit transaksi dan operasional kasir masa lalu tetap valid.
    - Model Eloquent `User.php`: menambahkan trait `SoftDeletes` dan relasi `transactions()`, `cashFlows()`, `stockMovements()`.
    - Backend API & Service: `UserController.php` (CRUD staf kasir, pencarian live driver-aware, reset kata sandi staf dan pencabutan sesi token aktif, saklar toggle status aktif/nonaktif, serta proteksi anti-terkunci / *self-lockout protection* agar owner tidak dapat menghapus atau menonaktifkan akun sendiri).
    - Frontend Web: Halaman antarmuka lengkap `Users.jsx` (`/users`), kartu profil staf dengan inisial peran, status aktif, metrik total omzet dan frekuensi transaksi kasir, tombol reset kata sandi cepat, saklar status aktif/nonaktif, modal tambah/edit pengguna, dan modal konfirmasi hapus aman.
    - Standardisasi Layout Kartu Seluruh Data Master (`Users.jsx`, `Customers.jsx`, `Suppliers.jsx`, `Categories.jsx`, `Units.jsx`):
      - Mengeliminasi penyebab teks dan badge terpotong di seluruh halaman data master.
      - Mengubah pembagian kolom grid kartu dari 4 kolom sempit (`xl:grid-cols-4`, lebar ~250px) menjadi 3 kolom lapang (`xl:grid-cols-3`, lebar 350px–400px).
      - Menghapus kelas `truncate` yang tidak sengaja terpasang pada kontainer pembungkus induk (`div`) dan menggantikannya dengan `flex-1 min-w-0`.
      - Memastikan nama entitas, PIC sales, badge keanggotaan/peran, nomor rekening bank, dan nomor telepon memiliki ruang napas horizontal yang cukup dan tidak terpotong prematur.
    - Pengujian Otomatis: `UserApiTest.php` (8 test cases lolos 100%, total suite backend kini 45 tests, 200 assertions lolos).
  - **Pembangunan Modul Plan #14: Master Promosi & Diskon (Discounts & Vouchers)**:
    - Migrasi database: `discounts` (kode unik, tipe persen/nominal/min-spend, periode tanggal, kuota, usage_count) dan relasi pada `transactions`.
    - Model & Controller: `Discount.php` dan `DiscountController.php` (CRUD Owner, toggle status, dan endpoint verifikasi voucher keranjang POS `/api/discounts/check-voucher`).
    - Mesin Checkout: `PosService.php` verifikasi promo server-side anti-tampering dan peningkatan atomik kuota terpakai.
    - Frontend Web: `Discounts.jsx` (`/discounts`) kartu voucher 3 kolom, copy kupon, dan integrasi input voucher di keranjang POS (`Pos.jsx`).
    - Resolusi Anti-Patterns: Menambahkan `max-w-xl leading-relaxed` untuk membatasi panjang baris teks (<80 karakter), mengganti tag elemen angka metrik dari `<h3>` menjadi `<p>` untuk menjaga hierarki outline WCAG, meratakan (*flatten*) kotak kode kupon dan dropdown promo POS menjadi baris pemisah elegan (`border-y` dan `divide-y`) untuk mengeliminasi anti-pattern kartu bersarang (*nested cards*), serta menghapus input redundan "Diskon Lainnya" sehingga seluruh diskon terpusat rapi dan bersih pada panel voucher promo.
    - Pengujian Otomatis: `DiscountApiTest.php` (8 test cases lolos 100%, total suite backend kini 53 tests, 234 assertions lolos).
  - Menerapkan 3 Standar Ketahanan UI (*Defensive UI Craft*) secara permanen di `AGENTS.md`: *The Flexbox Pairing Rule*, *The Readability Floor Rule*, dan *The Data Table Protection Rule*.
- **Pembersihan & Penguatan Layout Aplikasi Mobile (React Native Expo)**:
  - Memperbaiki parsing angka stok produk di `PosScreen.js`: mengubah decimal PostgreSQL mentah (misal `"48.0000"`) menjadi angka bulat bersih (`48`), menghemat ruang horizontal dan menghilangkan penyebab teks stok turun 2 baris.
  - Memperbaiki `cardHeader` kartu produk mobile: menambahkan `alignItems: 'center'`, `gap: 6`, `flex: 1` pada kategori (`ellipsizeMode="tail"`), dan `flexShrink: 0` pada stok agar tidak saling menabrak.
  - Menyelaraskan ketinggian kartu produk mobile: mengunci `cardTitle` dengan `minHeight: 38` dan `lineHeight: 19` sehingga kartu 1-baris dan 2-baris selalu sejajar simetris di grid 2 kolom.
  - Memindahkan badge keranjang di kartu mobile menjadi floating badge pojok kanan atas kartu (`position: 'absolute', top: -6, right: -6`), membebaskan baris harga di bawah.
  - Melindungi baris item struk transaksi thermal mobile (`receiptItemPrice` diberi `flexShrink: 0, marginLeft: 8`).
  - **Integrasi Mobile Kasir POS (`PosScreen.js` - Plan #11 Phase 5)**:
    - Menambahkan kartu selector pelanggan (`customerCard`) di modal keranjang belanja dengan avatar ikon, badge tipe membership (`REGULAR`, `VIP`, `GROSIR`), dan nomor telepon.
    - Menambahkan Modal Customer Picker (`customerPickerSheet`) dengan kotak pencarian live untuk memilih member terdaftar atau opsi 'Pelanggan Umum (Tanpa Member)'.
    - Mengirimkan `customer_id`, `customer_name`, dan `customer_phone` pada payload checkout POS mobile `/api/pos/checkout`.
    - Menampilkan nama pelanggan dan nomor WhatsApp secara otomatis pada struk belanja thermal mobile (`receiptCustomer` & `receiptCustomerPhone`).
  - **Tampilan Satuan Unit Produk di Mobile (`PosScreen.js`)**:
    - Floating in-cart badge menampilkan kuantitas beserta satuan unit dasar (`${inCart.quantity} ${unitSymbol}`, misal: `17 pcs`) persis seperti di web.
    - Menampilkan label stok produk lengkap dengan satuan (`Stok: ${stockDisplay} ${unitSymbol}`).
    - Menampilkan harga produk per unit (`Rp ... /${unitSymbol}`).
    - Menampilkan harga per unit pada rincian item di modal keranjang belanja.
  - **Penyempurnaan Cerdas Form Tambah/Edit Produk & Inventaris Multi-UoM (8 Poin Solusi Komprehensif)**:
  1. *Validasi Format & Checksum Barcode (Poin 1)*: Validasi modulo-10 real-time untuk EAN-13 (lengkap dengan deteksi awalan 899 GS1 Indonesia), EAN-8, UPC-A, dan Custom SKU, serta tombol `Acak (899)` untuk membuat barcode valid dengan satu klik.
  2. *Validasi & Peringatan Keamanan Finansial HPP vs Harga Jual (Poin 2)*: Deteksi instan jika HPP > Harga Jual dengan banner peringatan kerugian mencolok (`Peringatan Rugi: HPP lebih tinggi dari Harga Jual`), serta banner hijau estimasi margin keuntungan kotor.
  3. *Toggle Penjualan Satuan Dasar (Poin 3)*: Switch interaktif `Produk ini dijual dalam Satuan Dasar`. Jika dimatikan, input harga dasar didisable dan menjadi opsional sehingga produk yang hanya dijual per Pack/Dus tidak dipaksa mengisi harga eceran dasar.
  4. *Validasi Konsistensi Harga & Deteksi Diskon Grosir (Poin 4)*: Cross-check otomatis kesetaraan harga kemasan terhadap harga dasar (`Setara Rp X / pcs`). Menampilkan lencana hijau `Hemat X% (Grosir)` atau peringatan kuning bila harga kemasan melonjak di atas eceran.
  5. *Visualisasi Hierarki Konversi Bertingkat (Poin 5)*: Rantai hierarki interaktif `1 Dus (40 pcs) → 1 Pack (10 pcs) → 1 Pcs (1 pcs)` yang diurutkan secara otomatis dari satuan terbesar ke terkecil.
  6. *Kalkulator Margin Real-time di Baris Konversi (Poin 6)*: Kartu konversi kemasan yang lapang dengan kalkulasi HPP kemasan (`HPP Dasar × Isi`) dan estimasi laba kotor per kemasan (`convMargin Rp / %`).
  7. *Quick-Add Kategori Produk (Poin 7)*: Tombol dan mini-modal inline `+ Kategori Baru` langsung dari form tanpa harus menutup atau me-refresh modal produk.
  8. *Indikator & Integrasi Satuan Utama Kasir POS (Poin 8)*: Pilihan `★ Jadikan Satuan POS` pada base unit dan kemasan konversi. Kartu produk di kasir POS (`Pos.jsx`) otomatis menampilkan harga satuan utama tersebut dan 1-klik langsung menambahkan satuan tersebut ke keranjang.
  - Skema database diperluas via migration `2026_08_31_144706_add_sales_and_pos_unit_settings_to_products.php` (`products.is_for_sale`, `products.default_pos_unit_id`, `product_unit_conversions.is_default_pos`).
  - **Resolusi Logika & UI Multi-UoM Form (Poin Review User)**:
    1. *Smart Reverse Unit Detection & 1-Click Swap*: Mengidentifikasi arah satuan hierarkis berdasarkan ranking unit fisik (`UNIT_BULK_RANK`). Jika pengguna keliru memilih satuan besar sebagai Satuan Dasar (misal Dus) dan satuan kecil sebagai Kemasan (misal Pack), sistem menampilkan peringatan edukatif ramah awam beserta tombol `Tukar Satuan (Jadikan Pack Satuan Dasar)`.
    2. *Label Isi Eksplisit & Presisi*: Mengeliminasi ambiguitas label dengan format `Isi per 1 {Kemasan} *` disertai suffix `{Base Unit}` dan panduan kalimat `1 [Kemasan] = X [Base Unit]`.
    3. *Koreksi Formula Kesetaraan Harga*: Perhitungan harga setara per base unit bekerja konsisten dengan relasi kemasan grosir (`Harga Kemasan / Faktor Isi = Harga Satuan Dasar`).
    4. *Eliminasi Nilai Misleading Rp0*: Field harga kemasan atau dasar yang masih kosong/placeholder tidak lagi memicu tampilan `Rp0` di diagram hierarki maupun baris setara, melainkan menampilkan status abu-abu `(Harga belum diisi)` serta menyembunyikan kalkulasi margin/hemat grosir hingga harga diisi nyata.
    5. *Label Tombol Konversi Dinamis*: Mengganti tombol statis `+ Tambah Konversi (Dus/Pack)` menjadi label reaktif `+ Tambah Konversi ({kemasan}/{dasar})` yang otomatis membaca unit dasar dan kandidat kemasan berikutnya.
    6. *Resolusi Anti-Pattern Nested Cards (Impeccable /distill)*: Mengeliminasi 3 kontainer bersarang di dalam modal form produk: kotak toggle penjualan dasar dibuat datar tanpa border/bg, kontainer rantai hierarki diratakan tanpa wrapper card, dan kartu-kartu baris konversi diubah menjadi seksi datar dengan pembatas garis horizontal bersih (`border-t`) serta aksen garis vertikal amber untuk Satuan POS.
    7. *Reset Bersih Baris Konversi Baru & Placeholder Dinamis*: Menghilangkan hardcoded initial value '12' pada fungsi penambahan baris kemasan baru (`handleAddConversionRow`) sehingga field Isi (`conversion_factor`) dan Harga selalu diawali string kosong murni (`''`) dengan placeholder abu-abu netral (`Contoh: 12`). Mengubah placeholder barcode dari teks statis "Barcode Dus" menjadi dinamis `Barcode ${convUnit.name}` sesuai satuan yang dipilih pada baris tersebut.
    8. *Format Rupiah Standar Tanpa 3 Desimal*: Memperbarui fungsi pemformatan mata uang `formatRp` agar membulatkan nominal mata uang Rupiah ke integer terdekat (misal: `Rp7.291,667` menjadi `Rp7.292`) sesuai kaidah akuntansi dan UX retail Indonesia.
    9. *Placeholder Barcode Ringkas & Harmonisasi Tombol Konversi*: Memperpendek nama satuan pada placeholder barcode menjadi nama utama (misal: `Barcode Dus` alih-alih `Barcode Dus / Karton`) agar tidak terpotong di layar laptop/tablet. Menetralkan label tombol tambah konversi menjadi `+ Tambah Satuan Kemasan` secara otomatis jika tebakan satuan berikutnya tidak seirama fisik dengan satuan dasar (misal `btl` vs `kg`).
    10. *Penyelarasan Bahasa Pasar Ramah UMKM ($impeccable clarify)*: Mengeliminasi seluruh istilah teknis developer `Base Unit` pada form produk dan modal restock menjadi istilah pasar yang akrab bagi pedagang: `Satuan Eceran Terkecil`, `Barcode Eceran`, `Harga Jual Eceran`, `Modal / HPP Eceran`, `Stok Awal Eceran`, dan `Peringatan Minimum Stok Eceran`.
    11. *Restrukturisasi Baris Konversi 2 Baris Lega ($impeccable layout)*: Mengubah grid 4-kolom yang sempit (`sm:grid-cols-4`) menjadi tata letak 2 baris bertingkat yang lega dan terstruktur (`sm:grid-cols-2` per baris: Baris 1 untuk Satuan Kemasan & Isi per Kemasan; Baris 2 untuk Harga Jual & Barcode Kemasan). Seluruh kotak input mendapatkan lebar ~300px, font monospaced angka bernapas lega, dan footer finansial tertata rapi mengikuti *Flexbox Pairing Rule*.
    12. *Polesan Akhir & Proteksi Data ($impeccable polish)*: Memisahkan modal produk menjadi sticky header, body formulir scrollable, dan sticky footer aksi (tombol Batal & Simpan Produk selalu menempel di bawah tanpa tergulung saat daftar kemasan panjang). Menambahkan proteksi *dirty-state* (`handleCloseProductModal`) agar data yang sedang diketik tidak hilang saat tidak sengaja klik backdrop luar modal. Menyeragamkan 100% sisa istilah `Satuan Dasar` menjadi `Satuan Eceran` serta menerapkan aturan *Flexbox Pairing* (`min-w-0 truncate` dipasangkan dengan `shrink-0`) pada judul kartu kemasan.
    13. *Standarisasi Input Form & Harmonisasi Badge Barcode*: Menyelaraskan seluruh input, select, dan placeholder pada baris kemasan agar 100% identik dengan form utama (`bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500`). Menyeragamkan badge barcode kemasan agar menampilkan ikon status valid (`CheckCircle2` hijau) persis seperti barcode eceran utama.
    14. *Resolusi Anti-Pattern Nested Cards & Hairline Shadow ($impeccable distill / polish)*: Mengeliminasi 3 temuan inspektur Impeccable pada modal produk: (1) Menghapus bayangan blur lebar 50px (`shadow-2xl`) dan berkomitmen pada batas tepi tegas yang presisi (`border border-zinc-700/80`), (2) Meratakan kontainer header dari kartu bersarang (`px-6 py-4 bg-zinc-900 border-b`) menjadi elemen judul datar dengan pembatas garis tipis bersih, (3) Meratakan kontainer footer aksi dari kartu bersarang (`px-6 py-4 bg-zinc-900/95`) menjadi baris tombol datar dengan pembatas atas (`pt-4 border-t border-zinc-800`) tanpa layer kontainer ganda.
    15. *Pola Default Alami & Progressive Disclosure Penjualan Eceran ($impeccable clarify / distill)*: Mengeliminasi baris checkbox mengambang `Produk ini dijual dalam Satuan Eceran` dan radio button statis POS yang membebani kognisi pedagang normal. Menjadikan penjualan eceran sebagai default aktif alami di mana Harga Jual dan Modal/HPP langsung siap diisi. Opsi toko grosir khusus (`Khusus grosir (tidak diecer ke pelanggan)`) diletakkan secara rapi tepat di bawah kotak input harga eceran, sehingga label kiri-kanan dan kedua kotak input tetap sejajar sempurna 1 baris tanpa teks terlipat. Indikator dan tombol Satuan Kasir POS hanya muncul secara kontekstual jika produk memiliki multi-satuan kemasan.
    16. *Otomatisasi Satuan Kasir POS untuk Produk Khusus Grosir*: Menyempurnakan reaktivitas UoM form: ketika opsi `Khusus grosir (tidak diecer ke pelanggan)` dicentang atau baris kemasan baru ditambahkan, sistem secara otomatis menetapkan kemasan pertama (misal: Galon) sebagai Satuan Kasir POS (`default_pos_unit_id`), mengaktifkan radio button, dan memunculkan badge kuning `⭐ Satuan Kasir POS` tanpa memaksa pengguna mengklik manual.
    17. *Aksi Hapus Produk & Modal Konfirmasi Ramah Awam*: Menambahkan tombol aksi Hapus Produk (ikon tong sampah `Trash2`) di kolom aksi tabel inventaris dan modal konfirmasi aman (*"Hapus Produk?"*). Produk yang dihapus menggunakan mekanisme *Soft Deletes* sehingga tersembunyi dari inventaris dan kasir POS aktif, sedangkan seluruh riwayat transaksi penjualan masa lalu tetap terjaga dan tercatat rapi.
    18. *Resolusi Nested Cards pada Modal Hapus Produk ($impeccable distill)*: Meratakan kontainer catatan edukasi pada modal hapus produk dari kotak bersarang ber-border (`bg-zinc-950 p-3 rounded-xl border border-zinc-800`) menjadi paragraf teks alami dengan ikon `Info`, mengeliminasi kedalaman visual berlebih dan membersihkan deteksi *Card inside card*.
    19. *Sinkronisasi Hitungan Penggunaan Satuan (Unit withCount)*: Memperbaiki penghitungan jumlah produk pada Master Satuan (`UnitController`) agar hanya menghitung produk aktif. Saat produk dihapus (soft delete), relasi konversi UoM kemasan otomatis dibersihkan, sehingga angka *"Digunakan: X produk"* pada kartu satuan (seperti Galon atau Liter) langsung kembali ke angka riil (0 produk) dan satuan dapat dihapus dengan aman jika tidak lagi digunakan.
    20. *Pembersihan Teks Bantuan Kuning Satuan Eceran ($impeccable distill)*: Mengeliminasi teks bantuan warna kuning amber 3-baris di bawah dropdown Satuan Eceran Terkecil yang terkesan seperti peringatan/error (*warning visual noise*) dan merusak perataan horizontal grid. Seluruh label dan input kini berada pada satu baseline horizontal yang rapi dan tenang.
    21. *Standarisasi Asterisk Wajib Isi Berwarna Merah (`text-rose-500`)*: Menyeragamkan seluruh tanda bintang wajib isi (`*`) di seluruh form aplikasi (Inventaris, Restock, POS Kasir, Pembatalan Transaksi, Arus Kas, Pelanggan, Pemasok, Kategori, Satuan, Promosi, Staf) menjadi warna merah tegas (`<span className="text-rose-500">*</span>`) untuk keterbacaan yang konsisten dan memenuhi standar WCAG.
    22. *Modul #15 Master Pajak & Biaya Tambahan (Tax & Service Fees)*:
      - Migrasi database tabel `taxes_and_fees` (PPN, PB1, Biaya Kantong Plastik, Service Charge, Admin QRIS) dan penambahan kolom `fee_amount` serta snapshot `fee_details` pada tabel `transactions`.
      - Model Eloquent `TaxAndFee`, seeder 5 komponen default ritel & kafe, serta controller REST API `/api/taxes-and-fees` dengan filter tipe, aktivasi toggle, dan proteksi otorisasi Owner.
      - Halaman Web Dashboard `/taxes-and-fees` di kelompok menu DATA MASTER lengkap dengan pratinjau kalkulasi simulasi live, metrik ringkasan, dan standar *Defensive UI Craft* (0 deteksi anti-pattern).
      - Integrasi POS Kasir Web (`Pos.jsx`) & Mobile (`PosScreen.js`): Kalkulasi pajak proporsional setelah diskon voucher, saklar cepat kemasan/kantong plastik, mode takeaway/bungkus, penyesuaian reaktif biaya admin QRIS saat checkout, serta pencatatan rincian terpisah pada struk belanja thermal.
      - 7 feature tests baru (`TaxAndFeeTest.php`), total test suite backend kini mencapai 60 tests (260 assertions) lolos 100%.
    23. *Resolusi Impeccable Line Length & Heading Hierarchy pada Master Pajak & Biaya ($typeset / $audit)*: Mengatur batas lebar teks subjudul header menjadi `max-w-md leading-relaxed` (~55-60 karakter/baris) untuk memenuhi standar kenyamanan baca mata (<80 karakter/baris), serta memperbaiki hierarki heading dari `<h3>` menjadi `<h2>` pada kartu komponen agar susunan heading halaman runtut (`<h1>` $\rightarrow$ `<h2>`) sesuai standar aksesibilitas WCAG.
    24. *Resolusi Impeccable Nested Cards pada Modal Tambah/Edit Master Pajak & Biaya ($distill / $arrange)*: Meratakan kotak simulasi tagihan di dalam modal dari kontainer bersarang ber-border (`bg-zinc-950/60 border border-zinc-800/80 rounded-xl`) menjadi baris tipografi datar alami yang rapi (`h-[38px]`), mengeliminasi kedalaman visual berlebih (*card inside card*) secara total.
    25. *Harmonisasi Layout Global Halaman Master Pajak & Biaya ($arrange / $layout)*: Menyeragamkan layout halaman `TaxesAndFees.jsx` agar 100% identik dan konsisten dengan `Master Promosi` dan halaman master lainnya: (1) Mengeliminasi kontainer `p-6 max-w-7xl mx-auto` yang menyebabkan padding ganda dan pembatasan lebar terpusat menjadi `space-y-6` standar, (2) Mengubah header judul dengan ikon langsung tanpa kotak pembungkus berlebih, (3) Menyeragamkan 3 kartu metrik statistik dengan kotak ikon kanan, (4) Mengganti filter tab pil dengan bar pencarian dan dropdown filter terpadu (*unified dark filter bar*).
  - Seluruh pengujian backend (`php artisan test`) lulus 100% (60 tests, 260 assertions) dan frontend build Vite (`npm run build`) sukses tanpa error.
  - **Integrasi Pajak & Biaya Tambahan di Mobile (`PosScreen.js` - Plan #15)**:
    - Menambahkan blok kontrol pemilihan pajak kasir berupa *horizontal chips*: `Tanpa Pajak (0%)`, `PPN (11%)`, `PB1 (10%)`, dll.
    - Menambahkan tombol chip saklar cepat biaya kemasan & operasional: `+ Bungkus (Rp...)` dan `+ Kantong Plastik (Rp200)`.
    - Menambahkan banner peringatan biaya admin QRIS saat kasir memilih metode pembayaran QRIS.
    - Menampilkan breakdown itemized biaya tambahan pada ringkasan tagihan belanja keranjang mobile.
    - Mencantumkan baris Pajak dan Biaya Tambahan secara terpisah pada struk belanja thermal mobile.
    - **Penyempurnaan Struk Thermal Web & Mobile**: Memperbaiki format desimal kuantitas barang pada struk mobile dari `1.0000x` menjadi `1x` menggunakan `Number(item.quantity)`, serta melengkapi baris `Pajak` dan `Biaya Tambahan` (beserta breakdown rincian komponennya) pada modal cetak ulang struk riwayat transaksi web (`Transactions.jsx`) dan modal POS (`Pos.jsx`).
    - **Resolusi Impeccable Low Contrast Text pada Chips Mobile (`PosScreen.js` - $colorize / $audit)**: Mengganti warna teks chip pajak & biaya kemasan aktif dari warna aksen pudar (`#fb7185` / `#fbbf24`) menjadi teks putih tegas (`#ffffff` tebal) di atas latar belakang solid (`#e11d48` / `#b45309`), menaikkan rasio kontras dari 1.4:1 menjadi > 4.8:1 sehingga memenuhi standar aksesibilitas WCAG AA (> 4.5:1). Serta menyempurnakan label agar tidak terjadi pengulangan persentase ganda seperti `PPN 11% (11%)`.
    - **Resolusi Centering Modal Struk Mobile (`PosScreen.js` - $layout / $arrange)**: Memisahkan pembungkus overlay struk thermal (`receiptModalOverlay`) dari `modalOverlay` umum bottom-sheet, menambahkan `justifyContent: 'center'`, `alignItems: 'center'`, `padding: 16`, serta `alignSelf: 'center'` pada `receiptSheet`, memastikan modal struk belanja mobile selalu presisi dan simetris di tengah layar tanpa mepet ke kiri.
  - **Integrasi Promosi & Kupon Voucher di Mobile (`PosScreen.js` - Plan #14)**:
    - Menambahkan input kupon voucher promo pada modal keranjang belanja kasir mobile.
    - Menambahkan tombol dan modal "Pilih Promo Toko" (`promoOptionCard`) untuk memilih dan menerapkan kupon promo aktif hanya dengan 1 ketukan.
    - Menampilkan badge hijau promo aktif (`promoAppliedRow`) dengan rincian kode kupon, nilai penghematan, dan tombol hapus kupon.
    - Memperbarui rincian kalkulasi belanja: Subtotal, Diskon Promo, dan Total Tagihan yang reaktif terhadap perubahan keranjang.
    - Mengirimkan `discount_id`, `discount_code`, dan `discount_amount` pada payload checkout kasir mobile.
    - Mencantumkan rincian potongan diskon dan kode kupon secara transparan pada struk belanja thermal mobile.
    - **Resolusi Anti-Pattern Spacing Rhythm (`PosScreen.js`)**: Mengeliminasi pengulangan monoton jarak (baik 4px maupun 8px) dengan menerapkan skala ritme spasial bergradasi yang dinamis: micro-grouping 4px-6px untuk teks harga & unit, compact 10px-12px untuk jarak antar-input form dan baris rincian nota, serta generous 14px-20px untuk pemisah seksi modal dan tombol aksi utama.
  - **Inisialisasi & Publikasi GitHub Repository**:
    - Proyek monorepo KasirKita POS resmi diinisialisasi dengan Git dan dipush ke repositori GitHub `https://github.com/Man4c/KasirKita.git` pada branch `main`.
    - Menyusun file `.gitignore` komprehensif di root untuk mengabaikan `node_modules/`, `vendor/`, file rahasia `.env`, build artifacts (`dist/`), serta cache temporary.
    - Menghapus nested git submodule pada `mobile/` agar seluruh codebase backend, frontend web, dan mobile app terkelola rapi dalam satu kesatuan monorepo.
  - **Penyelesaian Fase 1: Bottom Navigation Bar Mobile & Layar Riwayat Transaksi (`App.js` & `TransactionHistoryScreen.js` - Plan #18)**:
    - Mengeliminasi tombol tab bar atas dari header sehingga area layar kasir menjadi luas, lapang, dan bersih.
    - Mengimplementasikan **Bottom Navigation Bar** modern ramah jangkauan jempol (*Thumb Zone*): **Kasir POS**, **Laporan Toko** (khusus Owner), dan **Riwayat Transaksi** (staf kasir & owner).
    - Menghadirkan layar baru `TransactionHistoryScreen.js` dengan pencarian invoice, filter metode pembayaran (Tunai/QRIS/Transfer), dan modal cetak ulang struk thermal mobile.
    - Menerapkan desain `impeccable`: font `Poppins` minimal 12px, indikator aktif rose pill (`rgba(225, 29, 72, 0.16)`), rasio kontras tinggi `6.8:1` (WCAG AAA), dan bayangan dock bawah yang halus.
  - **Penyelesaian Fase 2: Deteksi Orientasi Cerdas & State Management Responsif (`App.js` & `app.json` - Plan #18)**:
    - Mengonfigurasi `app.json` ke `orientation: default` agar perangkat Android & iOS mengizinkan rotasi otomatis horizontal.
    - Mengintegrasikan `useWindowDimensions` di `App.js` untuk mendeteksi `isLandscape = width > height` secara reaktif.
    - Mengimplementasikan logika auto-switch: saat HP dimiringkan ke mode mendatar, otomatis mengarahkan antarmuka ke **Kasir POS (Terminal POS)** dan menyembunyikan Bottom Navigation Bar agar seluruh tinggi layar dialokasikan untuk operasional kasir.
    - Menghadirkan header lanskap kompak (tinggi ~36px) dengan badge `TERMINAL POS` dan pintasan tab miniatur.
    - Saat perangkat ditegakkan kembali ke Portrait, aplikasi secara cerdas memulihkan tab yang sedang dibuka sebelumnya (`portraitTab`) tanpa kehilangan state.
  - **Penyelesaian Fase 3: Perancangan Tata Letak Kasir 2 Kolom (*Split-Screen POS*) di Mode Landscape (`PosScreen.js` - Plan #18)**:
    - Mengonfigurasi antarmuka `PosScreen.js` untuk merender tata letak 2 kolom berdampingan saat `isLandscape === true`:
      - **Kolom Kiri (~60%):** Pencarian produk, filter kategori chips yang kompak, dan grid katalog barang responsif.
      - **Kolom Kanan (Lebar 350px):** Register Kasir permanen (*Persistent Visible Cart*) dengan daftar belanja aktif (+/- kuantitas, harga/item), pemilih member pelanggan, chip cepat kupon promo & pajak, rincian tagihan, serta tombol utama **"Bayar Kasir"**.
  - **Penyelesaian Fase 5: Pengujian Aksesibilitas WCAG AA, Defensive UI Craft, & Validasi Build Final (`App.js`, `PosScreen.js`, `TransactionHistoryScreen.js` - Plan #18)**:
    - Mengoreksi tumpang tindih visual (*overlap*) bilah status Android/iOS di mode landscape melalui kalkulasi *dynamic safe area padding* (`Math.max(insets.top, StatusBarNative.currentHeight)`) sehingga jam, baterai, dan ikon status tidak lagi menabrak teks brand dan tombol keluar.
    - Memindahkan tampilan sisa stok (`cardStock`) ke bagian footer kartu produk berdampingan dengan harga eceran, sehingga badge mengambang kuantitas keranjang (`floatingBadge`) di pojok kanan atas kartu tidak lagi menutupi angka stok.
    - Menambah bantalan bawah (*padding bottom*) katalog produk pada mode portrait (`paddingBottom: cart.length > 0 ? 170 : 100`) dan landscape (`paddingBottom: 36`) agar kartu terbawah tidak tertutup bilah keranjang mengambang atau bilah gestur sistem HP.
    - Menstandarisasi seluruh ukuran font di modul mobile ke $\ge 12\text{px}$ (*Readability Floor Rule* WCAG AAA, zero 10px/11px) dan memvalidasi seluruh build backend (60/60 test PHPUnit pass) dan web Vite build (100% pass).
    - **Solusi Keterbatasan Layar HP Kecil di Mode Landscape (`App.js` & `PosScreen.js`)**:
      - *Menghilangkan Bilah Header Atas di Mode Landscape*: Mode mendatar didedikasikan 100% sebagai Terminal Kasir penuh (*Immersive POS Terminal*), menghemat ~50px ruang vertikal. Akses menu Laporan, Riwayat Transaksi, dan Keluar difokuskan saat kasir memutar perangkat kembali ke mode Portrait.
      - *Bilah Alat Katalog Sejajar Horisontal (*Unified Search & Category Toolbar*)*: Menggabungkan kotak pencarian produk dan deretan chip filter kategori ke dalam 1 baris horizontal ramping (`landscapeToolbar`, tinggi ~36px), menghemat ~40px ruang vertikal tambahan.
      - *Total Penghematan Ruang Vertikal*: ~90px ruang vertikal berhasil dibebaskan, sehingga katalog produk dapat menampilkan hingga 2-3 baris kartu barang secara utuh di layar HP kecil.
      - *Perbaikan Modal Struk Belanja Kasir*: Mengeliminasi masalah struk belanja menyusut/hilang (*zero height flexbox collapse*) di mode portrait dengan menetapkan `height: '86%'` dan `minHeight: 180`, serta menambahkan bilah atas struk dengan tombol silang `X` untuk kenyamanan kasir.
      - *Penyederhanaan Modal Pembayaran Kasir Landscape (`PosScreen.js`)*: Menghilangkan tab ganda redundan ("Pembayaran" & "Daftar Item") karena daftar barang sudah terpampang jelas di kolom keranjang kanan. Memperkecil lebar modal dari 580px menjadi 420px kompak dengan padding 16px, menampilkan kartu ringkasan tagihan & pelanggan, metode bayar (Tunai/QRIS/Transfer), serta kolom input uang diterima dan kembalian secara langsung dalam satu tampilan utuh tanpa perlu scroll berlebih.
      - *Kondisionalitas Tombol & Seksi Voucher POS (`PosScreen.js` & `Pos.jsx`)*: Tombol pil "Voucher" di atas subtotal (pada mode landscape) dan seksi kupon voucher keranjang hanya akan ditampilkan apabila terdapat promosi yang sedang aktif (`availablePromos.length > 0`) atau terdapat voucher yang sedang terpasang (`appliedPromo`). Jika semua promosi di Master Promosi berstatus nonaktif (0 promo berjalan), tombol dan seksi voucher otomatis disembunyikan agar antarmuka kasir bersih dan bebas dari elemen kosong.
      - *Penyembunyian Subtotal Redundan Tanpa Penyesuaian Harga (`PosScreen.js`)*: Pada terminal kasir mobile (baik kolom keranjang kanan landscape maupun modal checkout portrait), baris "Subtotal" hanya akan ditampilkan jika terdapat komponen penyesuaian nilai tagihan (Diskon voucher > 0, Pajak > 0, atau Biaya Layanan > 0). Jika tidak ada diskon atau pajak aktif, Subtotal bernilai sama persis dengan TOTAL BAYAR sehingga baris Subtotal otomatis disembunyikan. Hal ini menghemat ~40px ruang vertikal di footer dan memberikan ruang pandang yang lebih lega untuk daftar barang belanjaan.
      - *Layar Pembayaran Penuh / Dedicated Checkout Screen (Fase 1, 2, 3, & 4 Selesai)*: Mengalihkan alur pembayaran dari *floating modal* yang sempit menjadi layar mandiri 100% (*Dedicated Checkout Screen*). Dilengkapi bilah navigasi atas dengan tombol kembali yang adaptif (`← Kembali ke Keranjang` di landscape dan `← Kembali` ringkas di portrait) agar tidak bertabrakan dengan judul *"Pembayaran Kasir"* dan badge item. Header aplikasi atas `KasirKita MOBILE` otomatis disembunyikan saat layar checkout aktif (`!isCheckoutActive`) sehingga bilah navigasi checkout langsung berada di posisi paling atas secara native dan bersih. Pada mode Landscape, antarmuka terbagi menjadi 2 kolom (Nota Kiri ~38% dan Terminal Kanan ~62%). Pada mode Portrait, seluruh alur pembayaran tertata dalam satu halaman penuh yang mengalir harmonis: Banner TOTAL TAGIHAN berlatar rose elegan, kartu identitas pelanggan/member aktif, rincian biaya penyesuaian otomatis, kartu daftar pesanan, pemilih metode pembayaran, live monitor penerimaan uang & kembalian, deretan chip nominal cepat, serta Numpad Kasir Virtual Portrait yang membebaskan kasir sepenuhnya dari kemunculan keyboard bawaan HP.

## Keputusan Arsitektur

- **Task & Progress Tracking:**
  - Menggunakan `plans-kanban` dengan struktur direktori `plans/YYMMDD-modul/plan.md`.
  - Dashboard web berjalan di background port 3500 dengan visualisasi Gantt timeline & progress bar.
  - Penambahan 5 rencana modul Data Master lanjutan (Telah Selesai 100%):
    1. `plans/260831-11-master-pelanggan/plan.md` (Prioritas P1: Data Pelanggan, Membership, No. WhatsApp struk digital, dan autocomplete di kasir POS).
    2. `plans/260831-12-master-pemasok-supplier/plan.md` (Prioritas P2: Data Pemasok/Distributor, kontak agen, relasi modal restock barang inventaris, dan audit pengeluaran kas kulakan).
    3. `plans/260831-13-master-pengguna-dan-kasir/plan.md` (Prioritas P2: Manajemen Akun Kasir oleh Owner, reset password, status aktif, dan proteksi RBAC).
    4. `plans/260831-14-master-promosi-dan-diskon/plan.md` (Prioritas P2: Diskon tanggal kembar, persentase/nominal/min-spend, kode voucher kupon, validasi checkout POS, dan kalkulasi otomatis).
    5. `plans/260831-15-master-pajak-dan-biaya/plan.md` (Prioritas P2: Pajak PB1/PPN, biaya kemasan/kantong kresek, surcharge MDR QRIS/EDC, dan integrasi struk).
  - Modul Mobile POS Lanjutan (Telah Selesai 100%):
    6. `plans/260901-18-mobile-bottom-navigation-dan-landscape-pos/plan.md` (Prioritas P1: Bottom Navigation Bar ramah jempol di mode Portrait, dan Mode Kasir Register 2-Kolom otomatis saat perangkat diputar mendatar ke Landscape).
    7. `plans/260902-19-mobile-dedicated-checkout-screen/plan.md` (Prioritas P1: Layar Pembayaran Penuh / Dedicated Checkout Screen dengan Tata Letak 2 Kolom Landscape dan Numpad Kasir Virtual Terintegrasi tanpa Keyboard HP - Telah Selesai 100%).
    8. **Peningkatan Mobile Tax Selector Modal**: Menambahkan `Tax Picker Sheet Modal` di Mobile POS (`PosScreen.js`). Jika toko memiliki lebih dari 1 pajak aktif (misal: PPN 11% dan PB1 Restoran 10%), kasir dapat memilih salah satu tarif pajak atau opsi 'Tanpa Pajak' via modal interaktif ramah sentuh baik di mode Landscape maupun mode Portrait Dedicated Checkout.
    9. **Interactive Cart Sheet & Penghapusan Barang di Mode Portrait**: Menambahkan Interactive Bottom Sheet Modal untuk melihat rincian keranjang pesanan langsung dari Floating Cart Bar di mode Portrait (`cartModalOpen`). Dilengkapi tombol pengurang `[-]`, penambah `[+]`, tombol hapus instan `[🗑️]`, dan tombol `Kosongkan Keranjang`. Menambahkan kontrol stepper dan hapus yang sama pada bagian 'Daftar Pesanan' di Layar Checkout Portrait (`checkoutItemStepperRow`) sehingga kasir dapat membatalkan atau merevisi jumlah barang yang tidak jadi dibeli tanpa perlu memutar perangkat ke mode Landscape.
    10. `plans/260902-20-mobile-screen-pengaturan/plan.md` (Prioritas P1: Layar Pengaturan / Settings Screen terpusat pada aplikasi mobile dengan label tab navigasi bawah 'Pengaturan', integrasi printer bluetooth thermal 58mm/80mm, modal preview uji cetak struk, kustomisasi informasi usaha/toko & footer nota, preferensi orientasi POS, status health ping latency server backend, pembersih cache offline, dan logout aman).
    11. **Fitur Upload Logo Toko & Komponen Struk Terpadu (`ReceiptView.js`)**:
      - Mengintegrasikan `expo-image-picker` dan `@react-native-async-storage/async-storage` untuk mengunggah dan menyimpan logo toko kustom secara persisten di aplikasi mobile.
      - Menghubungkan logo toko pada kartu `IDENTITAS TOKO` di layar Pengaturan.
      - Membangun komponen struk reusable terpadu `mobile/src/components/ReceiptView.js` yang digunakan secara konsisten dan identik di 3 tempat: (1) Selesai Pembayaran POS (`PosScreen.js`), (2) Detail Riwayat Transaksi (`TransactionHistoryScreen.js`), dan (3) Uji Cetak Struk (`SettingsScreen.js`).
      - Seluruh struk kini secara serentak membaca data toko dinamis: Logo toko, Nama usaha, Alamat, Nomor WhatsApp, format rincian barang, total, metode bayar, dan Catatan Kaki (*Footer*) dari pengaturan toko.
      - *Penyederhanaan UI Picker Logo*: Menghilangkan tombol hapus teks ganda dan baris status "Logo Terpasang" yang redundan pada modal Pengaturan Toko. Pengguna cukup fokus pada tombol aksi galeri ("Ganti / Pilih Logo") sementara penghapusan logo tetap dapat dilakukan via ikon silang merah (X) pada thumbnail pratinjau.
    12. **Sinkronisasi Cloud Identitas Toko Multi-Platform (Backend `store_settings` API)**:
      - Backend: Tabel database `store_settings`, model `StoreSetting`, dan API RESTful `GET /api/settings/store` serta `PUT /api/settings/store` (diproteksi hak akses `owner`).
      - Mobile: Sinkronisasi otomatis dua arah saat aplikasi dibuka dan saat Owner menekan simpan pengaturan toko, dengan fallback cache offline `AsyncStorage`.
      - Web React: Menampilkan nama toko dan logo toko pada sidebar desktop (`AppLayout.jsx`) serta struk belanja kasir web (`Pos.jsx`), memastikan konsistensi 100% antar perangkat (smartphone, laptop, dan tablet).
      - Pengujian Otomatis: `StoreSettingTest.php` (4 test cases, 12 assertions lolos 100%, total suite backend 66 tests lolos).
    13. `plans/260902-21-mobile-offline-first-mode/plan.md` (Prioritas P1: Mode Kasir Offline-First Penuh & Auto-Sync Engine):
      - Mobile Local Storage (`offlineStorage.js`): Menyimpan salinan katalog produk, kategori, pelanggan, voucher promo, dan tarif pajak offline. Mengurangi stok lokal di HP seketika saat penjualan tunai offline.
      - Offline Transaction Queue: Menampung transaksi offline dengan nomor faktur sementara (`INV-OFF-YYYYMMDDHHMMSS-XXXX`) dan timestamp transaksi asli.
      - Background Sync Engine (`syncManager.js`): Heartbeat otomatis mendeteksi koneksi pulih dan mengunggah seluruh nota antrean offline (*FIFO*) ke server backend.
      - Backend Idempotency & Real Timestamp: Kolom `offline_id` (`string(100)`, `unique`, `nullable`) pada tabel `transactions` untuk mencegah duplikasi stok/keuangan saat koneksi putus-nyambung.
      - UI Status: Banner mode offline di POS (`PosScreen.js`) dan kartu manajemen antrean offline di Pengaturan (`SettingsScreen.js`).
      - Pengujian Otomatis: `OfflineSyncTest.php` (2 test cases, 11 assertions lolos 100%, total suite backend kini 68 tests lolos).
    14. **Remediasi Anti-Pattern UI Craft (Impeccable: `/quieter`, `/distill`, `/typeset`, `/colorize`, & `/audit`)**:
      - Menghapus efek chromatic neon halo / colored glow (`boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)'` dan `shadowColor: '#e11d48'`) pada tombol *Keluar Akun Kasir* di `mobile/src/screens/SettingsScreen.js`.
      - Menggantinya dengan elevasi bayangan netral gelap (`boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'` & `shadowColor: '#000000'`) dipadukan dengan garis tepi subtil (`borderColor: 'rgba(255, 255, 255, 0.12)'`) untuk menghasilkan tampilan tombol yang kokoh, berwibawa, dan bebas dari distorsi cahaya buatan (AI slop) sesuai standar Impeccable Craft Floor.
      - **Optimasi Tipografi Judul Seksi (`/typeset`)**: Memperbaiki nilai *tracking* pada `styles.sectionHeader` dari `0.8` (~0.067em, yang memicu peringatan *wide letter spacing on body text* pada teks judul panjang > 20 karakter) menjadi `0.5` (~0.04em) serta mendeklarasikan `textTransform: 'uppercase'` secara eksplisit agar pengelompokan karakter tetap proporsional dan mudah dibaca kasir secara natural.
      - **Remediasi Kontras Teks WCAG AA (`/colorize` & `/audit`)**:
        - *Badge Status Printer Simulasi*: Mengganti latar tembus pandang pudar dengan latar dark amber bernuansa tegas (`backgroundColor: '#2e1d05'`, `borderColor: '#78350f'`) dan teks amber cerah (`#fde68a`), menaikkan rasio kontras dari 1.3:1 menjadi **12.8:1** (melampaui standar WCAG AAA).
        - *Badge Status Printer Bluetooth*: Menyelaraskan dengan dark emerald solid (`backgroundColor: '#062d22'`, `borderColor: '#065f46'`, teks `#6ee7b7`), rasio kontras **10.7:1**.
        - *Spesifikasi Lebar Kertas Aktif (`paperSizeSpecActive`)*: Mengganti teks `#fecdd3` di atas latar merah `#e11d48` menjadi putih murni `#ffffff`, menaikkan rasio kontras dari 3.3:1 menjadi **4.71:1** (memenuhi batas WCAG AA > 4.5:1).
        - *Spesifikasi Lebar Kertas Nonaktif (`paperSizeSpec`)*: Mengganti teks abu gelap `#71717a` di atas kartu `#18181b` menjadi `#a1a1aa`, menaikkan rasio kontras dari 3.7:1 menjadi **6.78:1** (memenuhi batas WCAG AA > 4.5:1).
        - *Badge Latensi Ping Server (`pingBadge`)*: Mengganti latar tembus pandang hijau pudar dengan latar dark emerald tegas (`backgroundColor: '#062d22'`, `borderColor: '#065f46'`) dan teks serta ikon WiFi hijau cerah (`#6ee7b7`), mengeliminasi benturan kontras identik 1.0:1 (`#34d399` on `#34d399`) menjadi rasio prima **10.7:1** (WCAG AAA).
        - *Pills Audit Keamanan Sesi (`statusPill`)*: Memperbarui pil status di Modal Keamanan dari inline `rgba(...)` dengan teks berwarna pudar (`#34d399`, `#fbbf24`, `#38bdf8` yang memicu temuan 1.0:1) menjadi varian solid beraksen gelap (`statusPillGreen` #062d22/teks #6ee7b7 rasio 10.7:1, `statusPillAmber` #2e1d05/teks #fde68a rasio 12.8:1, `statusPillSky` #082f49/teks #7dd3fc rasio 8.43:1), melampaui seluruh kriteria WCAG AAA.
        - *Kartu Katalog Produk Kasir & Register (`ProductGrid.js`, `LandscapeRegisterPanel.js`, `PosCheckoutView.js`)*: Mengganti warna teks nama kategori (`cardCategory`), unit satuan harga (`cardPriceUnit`), sub-status keranjang kosong (`registerEmptySub`), label total bayar register (`regTotalLabel`), sub-identitas pelanggan (`checkoutCustomerSub`), dan label display kalkulasi uang kasir (`cashDisplayLabel`) dari abu gelap `#71717a` (3.7:1) menjadi `#a1a1aa` (6.78:1), menuntaskan 10 temuan aksesibilitas kontras rendah di antarmuka kasir POS secara serentak.
        - *Badge Kuantitas Tagihan Checkout (`checkoutBillItemBadge`)*: Mengganti latar tembus pandang pudar dengan latar dark rose solid (`backgroundColor: '#3b0d19'`, `borderColor: '#881337'`) serta teks putih murni (`#ffffff`), menaikkan rasio kontras dari 1.7:1 (`#fb7185` on `#e11d48`) menjadi **16.2:1** (WCAG AAA). Sekaligus menyelaraskan chip dan pil opsi kilat di modal checkout (`checkoutMembershipBadge`, `regQuickPillActive`, `checkoutQuickChipActive`).
    15. **Universal Bluetooth Thermal ESC/POS Engine (Hardware-Ready)**:
      - `mobile/src/services/escposGenerator.js`: Pembangun binary ESC/POS standar industri mendukung ukuran kertas 58mm (32 kolom) & 80mm (48 kolom), tata letak dua sisi otomatis, pemisah garis, dan perintah feed/cutter.
      - `mobile/src/services/printerService.js`: Universal printer service mendukung Web Bluetooth API (`navigator.bluetooth`) untuk scanning & pairing printer fisik asli, pengiriman chunk 512-byte, serta fallback ke Mode Simulasi Virtual & dialog cetak printer biasa/PDF.
      - UI Pengaturan: Selektor lebar kertas 58mm/80mm, tombol pemindai Bluetooth nyata, badge status terhubung (Bluetooth vs Simulasi), dan tombol uji cetak.
      - POS Checkout: Tombol *"Cetak Struk"* di modal nota dan dukungan cetak otomatis (*Auto-Print*) saat pembayaran sukses.
  - Rencana Modul Aktif & Dalam Antrean:
    8. `plans/260831-16-master-meja-dan-antrean/plan.md` (Prioritas P2: Manajemen meja kafe/resto, indikator meja realtime Kosong/Terisi, split bill, antrean takeaway, dan slip order dapur).
    9. `plans/260831-17-master-cabang-dan-outlet/plan.md` (Prioritas P1: Multi-outlet, isolasi level stok per cabang, transfer stok antar cabang, penugasan staf kasir per gerai, dan konsolidasi omzet).
    10. `plans/260902-22-mobile-pos-screen-refactoring/plan.md` (Prioritas P1: Modularisasi & Refactoring PosScreen.js ~4900 baris, useMemo kalkulasi, useReducer state machine, normalisasi API, dan konsolidasi offline fallback).
- **Autentikasi Multi-Platform:**
  - Web: Laravel Sanctum berbasis stateful/cookies atau bearer token.
  - Mobile: Laravel Sanctum stateless bearer token disimpan di SecureStore.
  - Axios Interceptor untuk pembaruan dan penyisipan header bearer token otomatis.
- **Manajemen Inventaris:**
  - Metode pencatatan stok Perpetual System (update kartu stok langsung saat ada pergerakan barang).
  - Metode valuasi HPP (Harga Pokok Penjualan) menggunakan *Average Cost* (Biaya Rata-Rata).
- **Pengaturan Hardware & Penyimpanan Mobile (React Native):**
  - **Kunci Orientasi Layar Kasir:** Mengintegrasikan `expo-screen-orientation` via `orientationService.js` untuk mengontrol orientasi sistem operasi secara aktif: `AUTO` (`unlockAsync`), `LANDSCAPE` (`lockAsync(LANDSCAPE)`), dan `PORTRAIT` (`lockAsync(PORTRAIT_UP)`), disimpan persisten dan diterapkan otomatis saat app dibuka (`App.js`).
  - **Pembersih Cache Penyimpanan Fungsional:** Mengukur kapasitas data katalog offline aktual secara real time (`offlineStorage.getFormattedCacheSize()`), menampilkan badge ukuran dinamis pada baris pengaturan, memunculkan dialog konfirmasi kasir, dan membersihkan snapshot katalog lama secara aman tanpa menghapus antrean transaksi nota kasir offline (`KEYS.QUEUE`).

## Keputusan UI

- **Tipografi & Font:** Menggunakan **Poppins** sebagai standar tipografi utama di semua platform:
  - **Web (React + Tailwind):** Menggunakan Google Fonts `Poppins` (`font-sans: ['Poppins', 'sans-serif']` di Tailwind configuration).
  - **Mobile (React Native Expo):** Menggunakan `@expo-google-fonts/poppins` untuk konsistensi tampilan antar perangkat Android & iOS.
- **Palet Warna & Estetika Visual:** Sepenuhnya dikurasi dan diformulasikan oleh skill `impeccable` (mengeksplorasi kontras tinggi, kenyamanan operasional kasir, dan konsistensi lintas platform).
- Web Dashboard memiliki layout ringkas dengan header profil yang kompak.
- Mobile POS dirancang touch-friendly untuk transaksi kasir cepat.

## Keputusan Logic / Data

- Skema PostgreSQL mencakup Users, Products, Categories, Stock_Movements, Transactions, Transaction_Items, Cash_Flows.

## Catatan Verifikasi

- Server `plans-kanban` aktif berjalan di port 3500.
- Migrasi database 100% sukses tanpa error (`php artisan migrate:fresh`).
- Database seeder berjalan normal (`php artisan db:seed`).
- Automated Feature Test suite lulus 100% (17 tests, 77 assertions).
- Production Build Web React Vite lulus 100% (`web/dist/`).
- Mobile React Native Expo siap build via EAS (`mobile/`).

## Hal Yang Perlu Diperhatikan Agent

- Jangan ubah hal di luar task.
- Baca file terkait sebelum mengedit.
- Update `plans/` dan file ini setelah perubahan penting.
