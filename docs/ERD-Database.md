# 🗄️ Skema Database & Entity Relationship Diagram (ERD) - KasirKita POS

Dokumen ini merinci desain arsitektur basis data **PostgreSQL** untuk KasirKita POS, yang mengintegrasikan sistem kasir multi-platform, pencatatan inventaris **Perpetual System**, kalkulasi **Average Cost (HPP)**, rekonsiliasi **Stock Opname**, dan laporan **Arus Kas (Cash Flow)**.

---

## 📊 Diagram Relasi Entitas (Mermaid ERD)

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : "processes"
    USERS ||--o{ STOCK_MOVEMENTS : "records"
    USERS ||--o{ STOCK_OPNAMES : "conducts"
    USERS ||--o{ CASH_FLOWS : "creates"
    
    CATEGORIES ||--o{ PRODUCTS : "contains"
    
    PRODUCTS ||--o{ TRANSACTION_ITEMS : "sold_in"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "tracks"
    PRODUCTS ||--o{ STOCK_OPNAME_ITEMS : "audited_in"
    
    TRANSACTIONS ||--|{ TRANSACTION_ITEMS : "includes"
    TRANSACTIONS ||--o| CASH_FLOWS : "generates"
    
    STOCK_OPNAMES ||--|{ STOCK_OPNAME_ITEMS : "contains"

    USERS {
        uuid id PK
        string name
        string email UK
        string password
        string role "owner / cashier"
        string phone
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        string name
        string slug UK
        text description
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        string name
        string sku_barcode UK
        text description
        decimal price "Harga Jual"
        decimal avg_cost "HPP Rata-rata"
        integer stock "Stok Real-time"
        integer min_stock "Batas Minimum Stok"
        string image_path
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        uuid user_id FK
        string type "IN / OUT / SALE / ADJUSTMENT"
        integer quantity
        decimal unit_cost "Harga beli / HPP unit"
        decimal total_cost
        integer balance_after "Sisa stok setelah mutasi"
        string reference_type "Transaction / StockOpname / Restock"
        uuid reference_id
        text notes
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        string invoice_number UK
        uuid user_id FK "Kasir"
        string customer_name
        decimal subtotal
        decimal discount_amount
        decimal tax_amount
        decimal total_amount
        decimal paid_amount
        decimal change_amount
        string payment_method "CASH / QRIS / TRANSFER"
        string payment_status "COMPLETED / CANCELLED"
        text notes
        timestamp created_at
        timestamp updated_at
    }

    TRANSACTION_ITEMS {
        uuid id PK
        uuid transaction_id FK
        uuid product_id FK
        string product_name "Snapshot nama saat transaksi"
        integer quantity
        decimal unit_price "Snapshot harga jual"
        decimal unit_cost "Snapshot HPP saat terjual"
        decimal subtotal
        decimal total_cost "HPP total (kalkulasi laba kotor)"
        timestamp created_at
    }

    STOCK_OPNAMES {
        uuid id PK
        string opname_number UK
        uuid user_id FK "Penanggung Jawab"
        string status "DRAFT / COMPLETED / CANCELLED"
        text notes
        timestamp conducted_at
        timestamp created_at
        timestamp updated_at
    }

    STOCK_OPNAME_ITEMS {
        uuid id PK
        uuid stock_opname_id FK
        uuid product_id FK
        integer system_stock "Stok sistem saat audit"
        integer physical_stock "Stok fisik nyata"
        integer difference "Selisih (+ / -)"
        decimal unit_cost "HPP saat opname"
        decimal total_difference_cost "Nilai nominal selisih"
        text reason
        timestamp created_at
    }

    CASH_FLOWS {
        uuid id PK
        uuid user_id FK
        uuid transaction_id FK "Nullable jika non-transaksi"
        string type "IN / OUT"
        string category "SALES / OPERATIONAL / PURCHASE / OTHER"
        decimal amount
        date flow_date
        text notes
        timestamp created_at
        timestamp updated_at
    }
```

---

## 🔍 Penjelasan Tabel & Implementasi Metode Bisnis

### 1. Tabel `products` & `stock_movements` (Perpetual & Average Cost)
- **Perpetual System:** Kolom `products.stock` selalu diperbarui secara instan dan setiap perubahannya tercatat di `stock_movements` dengan kolom `balance_after`.
- **Average Cost Calculation:** Saat restock (tipe `IN`), HPP diupdate:
  $$\text{avg\_cost}_{\text{baru}} = \frac{(\text{stock}_{\text{lama}} \times \text{avg\_cost}_{\text{lama}}) + (\text{qty}_{\text{masuk}} \times \text{unit\_cost}_{\text{masuk}})}{\text{stock}_{\text{lama}} + \text{qty}_{\text{masuk}}}$$

### 2. Tabel `transactions` & `transaction_items` (Point of Sales)
- Menyimpan snapshot `unit_price` dan `unit_cost` pada saat transaksi terjadi.
- Memungkinkan perhitungan **Laba Kotor Riil**:
  $$\text{Laba Kotor} = \text{subtotal} - \text{total\_cost}$$

### 3. Tabel `stock_opnames` & `stock_opname_items` (Rekonsiliasi Fisik)
- Mengunci data stok sistem dan membandingkannya dengan hitungan fisik lapangan.
- Jika status disetujui (`COMPLETED`), sistem otomatis membuat mutasi `ADJUSTMENT` di `stock_movements` untuk menyeimbangkan stok.

### 4. Tabel `cash_flows` (Dasbor Keuangan & Arus Kas)
- Menampung pemasukan otomatis dari kasir (`SALES`) dan pencatatan manual pengeluaran operasional toko (listrik, gaji, belanja modal).

---

## ⚡ Rekomendasi Indexing (PostgreSQL Performance)
1. `products(sku_barcode)` — Index B-Tree untuk scan barcode instan.
2. `products(category_id)` — Index B-Tree untuk filter katalog cepat.
3. `stock_movements(product_id, created_at)` — Index komposit untuk riwayat kartu stok.
4. `transactions(invoice_number)` — Unique index.
5. `transactions(created_at, user_id)` — Index untuk agregasi laporan penjualan harian.
6. `cash_flows(flow_date, type)` — Index untuk grafik arus kas cepat.
