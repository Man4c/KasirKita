# Spesifikasi UX/UI Wireframe & Kontrak Endpoint API - Master Produk Mobile (Plan #25 Fase 1)

Dokumen ini mendefinisikan arsitektur data, kontrak endpoint REST API, alur interaksi pengguna, serta spesifikasi desain antarmuka (UI/UX) untuk modul **Master Produk & Inventaris di Mobile (KasirKita POS)**.

---

## 1. Kontrak Endpoint API Backend

Aplikasi mobile KasirKita berinteraksi dengan backend Laravel melalui endpoint-endpoint terproteksi berikut (Base URL: `/api`):

### A. Katalog Produk (`/api/products`)

| Method | Endpoint | Hak Akses | Deskripsi & Parameter Query |
|---|---|---|---|
| `GET` | `/api/products` | All Staff (Kasir, Manager, Owner) | Mengambil daftar produk terpaginasi.<br>**Query Params:**<br>- `search`: string (nama produk, SKU/barcode)<br>- `category_id`: string UUID<br>- `is_active`: boolean (`true`/`false`)<br>- `low_stock`: boolean (`true` memfilter `stock <= min_stock`)<br>- `sort_by`: `name` \| `price` \| `stock` \| `created_at`<br>- `sort_order`: `asc` \| `desc`<br>- `per_page`: number (default: `15`, mobile disarankan: `20`) |
| `GET` | `/api/products/{id}` | All Staff | Mengambil detail lengkap satu produk beserta kategori, unit dasar, konversi UoM, dan 10 riwayat mutasi stok terakhir. |
| `POST` | `/api/products` | Role `owner` | Membuat master produk baru.<br>**Payload:**<br>- `name` (required, string)<br>- `category_id` (nullable, UUID)<br>- `base_unit_id` (nullable, UUID, fallback: pcs)<br>- `sku_barcode` (nullable, string, unique)<br>- `price` (required/nullable, numeric $\ge 0$)<br>- `avg_cost` (nullable, numeric $\ge 0$)<br>- `stock` (nullable, numeric $\ge 0$, otomatis mencatat `StockMovement` InitialStock)<br>- `min_stock` (nullable, numeric $\ge 0$)<br>- `is_active` (boolean, default: true)<br>- `is_for_sale` (boolean, default: true)<br>- `description` (nullable, string) |
| `PUT` | `/api/products/{id}` | Role `owner` | Memperbarui data produk & konversi satuan.<br>**Payload:** sama dengan `POST /api/products` (kecuali `stock` dan `avg_cost` tidak diubah langsung melalui PUT untuk menjaga integritas kartu stok). |
| `POST` | `/api/products/{id}/restock` | Role `owner` | Menambah stok produk (Restock/Pembelian) dengan metode *Moving Average Cost* otomatis dan pencatatan kas keluar (*CashFlow Purchase*).<br>**Payload:**<br>- `quantity` (required, numeric $> 0$)<br>- `unit_cost` (required, numeric $\ge 0$)<br>- `unit_id` (nullable, UUID)<br>- `supplier_id` (nullable, UUID)<br>- `notes` (nullable, string) |
| `DELETE` | `/api/products/{id}` | Role `owner` | Menghapus produk secara *SoftDeletes* (produk tersembunyi namun riwayat transaksi lama tetap aman). |
| `GET` | `/api/products/{id}/stock-movements` | Role `owner` | Mengambil riwayat buku besar kartu stok (`StockMovement`) produk terpaginasi. |

---

### B. Master Kategori & Satuan Pendukung

| Method | Endpoint | Hak Akses | Deskripsi & Kegunaan di Mobile |
|---|---|---|---|
| `GET` | `/api/categories` | All Staff | Mengambil seluruh daftar kategori produk untuk dropdown filter dan form picker. |
| `GET` | `/api/units` | All Staff | Mengambil seluruh satuan barang (pcs, box, kg, botol, porsi, dll) untuk pemilihan base unit. |

---

### C. Format Response API

Format respon konsisten menggunakan trait `ApiResponse`:

```json
{
  "success": true,
  "message": "Daftar produk berhasil diambil.",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": "9cf6d22c-a871-464e-9d29-a720ddb27ec4",
        "category_id": "7b8e1f02-990b-483b-b72e-d002f232c91a",
        "base_unit_id": "3a1c89f2-2591-4d3f-9174-897b212f43bb",
        "name": "Kopi Susu Gula Aren",
        "sku_barcode": "8992753210112",
        "price": "18000.00",
        "avg_cost": "9500.00",
        "stock": "45.00",
        "min_stock": "10.00",
        "is_active": true,
        "is_for_sale": true,
        "category": {
          "id": "7b8e1f02-990b-483b-b72e-d002f232c91a",
          "name": "Minuman"
        },
        "base_unit": {
          "id": "3a1c89f2-2591-4d3f-9174-897b212f43bb",
          "name": "Cup",
          "symbol": "cup"
        }
      }
    ],
    "last_page": 3,
    "total": 52
  }
}
```

---

## 2. Spesifikasi UI/UX & Wireframe Layar

Sesuai prinsip **The Flexbox Pairing Rule**, **The Readability Floor Rule (Font $\ge$ 12px)**, dan estetika **Impeccable Dark Mode**:

### Wireframe 1: Layar Utama Master Produk (`ProductManagementScreen.js`)

```
+-------------------------------------------------------------+
| [< Kembali]         Master Produk & Stok         [🔍 Search] |
+-------------------------------------------------------------+
| [ Input Cari Produk / Scan Barcode...               [📷 Scan] |
+-------------------------------------------------------------+
| Chip Kategori: ( Semua ) [ Makanan ] [ Minuman ] [ Snack ]  |
| Chip Stok:     ( Semua ) [ ⚠️ Menipis ] [ 🛑 Habis ]         |
+-------------------------------------------------------------+
| Total 52 Produk  •  3 Stok Menipis                          |
+-------------------------------------------------------------+
| +---------------------------------------------------------+ |
| | [Ikon/Img]  Kopi Susu Gula Aren          [Badge: 45 cup]| |
| |             Minuman • Barcode: 899275...  (Stok Aman)   | |
| |             Harga: Rp18.000                             | |
| |             Modal: Rp9.500 (Margin 47%)                 | |
| |             ------------------------------------------- | |
| |             [ 📦 + Stok Masuk ]    [ ✏️ Edit Produk ]   | |
| +---------------------------------------------------------+ |
| +---------------------------------------------------------+ |
| | [Ikon/Img]  Roti Bakar Coklat            [Badge: 2 porsi]| |
| |             Makanan • SKU: RT-002         (⚠️ Menipis)  | |
| |             Harga: Rp15.000                             | |
| |             Modal: Rp7.000                              | |
| |             ------------------------------------------- | |
| |             [ 📦 + Stok Masuk ]    [ ✏️ Edit Produk ]   | |
| +---------------------------------------------------------+ |
|                                                             |
|                                         +-----------------+ |
|                                         | [ + Produk Baru ] | | (FAB)
|                                         +-----------------+ |
+-------------------------------------------------------------+
```

---

### Wireframe 2: Formulir Tambah / Edit Produk (`ProductFormModal.js`)

```
+-------------------------------------------------------------+
| [X Tutup]             Tambah Produk Baru            [Simpan]|
+-------------------------------------------------------------+
| [ Informasi Dasar ]                                         |
| Nama Produk *                                               |
| [ Masukkan nama produk...                                 ] |
|                                                             |
| Kategori Produk                                             |
| [ Pilih Kategori (Minuman / Makanan / dll)            (v) ] |
|                                                             |
| Barcode / SKU                                               |
| +------------------------------------------+ +------------+ |
| | 8992753210112                            | | [📷 Scan]  | |
| +------------------------------------------+ +------------+ |
|                                                             |
| Satuan Dasar (Base Unit) *                                  |
| [ Pcs / Cup / Botol / Porsi                           (v) ] |
|                                                             |
| [ Harga & Nilai Modal ]                                     |
| Harga Jual (Rp) *                                           |
| [ Rp 18.000                                               ] |
|                                                             |
| Harga Modal / HPP Awal (Rp)                                 |
| [ Rp 9.500                                                ] |
|                                                             |
| [ Pengaturan Stok & Alert ]                                 |
| Stok Awal                                                   |
| [ 45                                                      ] |
|                                                             |
| Batas Minimal Stok (Alert Menipis)                          |
| [ 10                                                      ] |
|                                                             |
| [v] Dijual di Kasir POS (Produk Aktif)                      |
|                                                             |
| [ Tombol Hapus Produk ] (Khusus mode edit)                  |
+-------------------------------------------------------------+
```

---

### Wireframe 3: Modal Penyesuaian / Restock Cepat (`QuickStockAdjustModal.js`)

```
+-------------------------------------------------------------+
| [X]                   Stok Masuk / Restock                  |
+-------------------------------------------------------------+
| Produk: Kopi Susu Gula Aren                                 |
| Stok Saat Ini: 45 cup  •  Modal Rata-rata: Rp9.500          |
|-------------------------------------------------------------|
| Jumlah Masuk (+):                                           |
| [ 20                                               (cup)  ] |
|                                                             |
| Harga Beli / Kulakan per Cup (Rp):                          |
| [ Rp 9.200                                                ] |
|                                                             |
| Estimasi Stok Baru: 65 cup                                  |
| Estimasi HPP Baru: Rp9.408 (Moving Average)                 |
|                                                             |
| Catatan / Supplier (Opsional):                              |
| [ Pembelian dari Toko Bahan Sejahtera...                  ] |
|                                                             |
| +---------------------------------------------------------+ |
| | [ Batal ]                   [ Simpan Restock Masuk ]    | |
| +---------------------------------------------------------+ |
+-------------------------------------------------------------+
```

---

## 3. Aturan Ketahanan & Validasi (Defensive Rules)

1. **Format Input Angka Nominal**:
   - Kolom harga jual, harga modal, dan kuantitas stok otomatis dibersihkan dari karakter non-numerik menggunakan parser defensif.
2. **Kamera Barcode Scanner Double-Confirmation**:
   - Memakai debounce dan verifikasi pembacaan kamera yang identik dengan modul kasir POS (`PosBarcodeScannerView.js`), menjamin barcode tidak terisi dua kali atau salah baca akibat pantulan cahaya.
3. **Penyelarasan Cache Offline Kasir POS**:
   - Setelah produk berhasil disimpan, dibuat, atau stoknya disesuaikan, sistem memanggil `offlineStorage.cacheCatalog(...)` secara lokal agar katalog produk kasir POS seketika tersinkronisasi tanpa kasir perlu reload aplikasi.
