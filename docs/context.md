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
    12. **Sinkronisasi Cloud Identitas Toko Multi-Platform (Backend `store_settings` API)**:
      - Backend: Tabel database `store_settings`, model `StoreSetting`, dan API RESTful `GET /api/settings/store` serta `PUT /api/settings/store` (diproteksi hak akses `owner`).
      - Mobile: Sinkronisasi otomatis dua arah saat aplikasi dibuka dan saat Owner menekan simpan pengaturan toko, dengan fallback cache offline `AsyncStorage`.
      - Web React: Menampilkan nama toko dan logo toko pada sidebar desktop (`AppLayout.jsx`) serta struk belanja kasir web (`Pos.jsx`), memastikan konsistensi 100% antar perangkat (smartphone, laptop, dan tablet).
      - Pengujian Otomatis: `StoreSettingTest.php` (4 test cases, 12 assertions lolos 100%, total suite backend 66 tests lolos).
  - Rencana Modul Aktif & Dalam Antrean:
    8. `plans/260831-16-master-meja-dan-antrean/plan.md` (Prioritas P2: Manajemen meja kafe/resto, indikator meja realtime Kosong/Terisi, split bill, antrean takeaway, dan slip order dapur).
    9. `plans/260831-17-master-cabang-dan-outlet/plan.md` (Prioritas P1: Multi-outlet, isolasi level stok per cabang, transfer stok antar cabang, penugasan staf kasir per gerai, dan konsolidasi omzet).
- **Autentikasi Multi-Platform:**
  - Web: Laravel Sanctum berbasis stateful/cookies atau bearer token.
  - Mobile: Laravel Sanctum stateless bearer token disimpan di SecureStore.
  - Axios Interceptor untuk pembaruan dan penyisipan header bearer token otomatis.
- **Manajemen Inventaris:**
  - Metode pencatatan stok Perpetual System (update kartu stok langsung saat ada pergerakan barang).
  - Metode valuasi HPP (Harga Pokok Penjualan) menggunakan *Average Cost* (Biaya Rata-Rata).

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
