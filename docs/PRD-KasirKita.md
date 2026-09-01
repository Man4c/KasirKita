**Informasi Utama**

* **Nama Proyek:** KasirKita POS  
* **Jenis Proyek:** Aplikasi Multi-Platform (Web Dashboard & Mobile App)

**Latar Belakang** Proyek pribadi yang dibangun untuk menjawab dan memberikan solusi atas berbagai permasalahan operasional harian yang kerap dihadapi oleh para pelaku UMKM.

**Masalah yang Ingin Diselesaikan**

* Pengguna kewalahan dalam melakukan pencatatan transaksi secara manual.  
* Pengguna kesulitan untuk melacak jumlah stok barang yang masuk dan keluar secara akurat.  
* Pengguna tidak dapat mengetahui dengan pasti total pemasukan dan pengeluaran usahanya.

**Target Pengguna** Orang-orang yang memiliki toko atau bisnis penjualan ritel berskala UMKM.

**Peran Anda** Full Stack Developer (Solo / Tanpa Tim)

**Fitur Utama**

* **Point of Sales (Kasir):** Mencatat setiap transaksi penjualan secara cepat dan otomatis, menggantikan proses pencatatan di buku manual.  
* **Manajemen Inventaris (Perpetual System & Average Cost):** Memantau ketersediaan stok secara *real-time* yang terpotong otomatis setiap terjadi transaksi, dilengkapi dengan kalkulasi Harga Pokok Penjualan (HPP) menggunakan perhitungan biaya rata-rata.  
* **Stock Opname:** Fasilitas penyesuaian inventaris untuk mencocokkan jumlah stok fisik di toko dengan data di dalam sistem.  
* **Dasbor Laporan Keuangan:** Menyajikan ringkasan dan kalkulasi otomatis mengenai arus kas, total pemasukan, serta pengeluaran toko.  
* **Akses Multi-Platform:** Memungkinkan pemilik bisnis memantau penjualan secara terpusat dari kasir web maupun perangkat *mobile*.

**Teknologi yang Digunakan**

* **Frontend:** React.js dengan Tailwind CSS (Web) & React Native via Expo (Mobile)  
* **Backend & API:** Laravel (REST API) dilengkapi Laravel Sanctum  
* **Database & Storage:** PostgreSQL  
* **Cloud & Deployment:** Belum diketahui (akan dikonfigurasi saat rilis production)  
* **Tools & Lainnya:** HTTP Interceptors, SecureStore (Mobile Storage), LocalStorage/Cookies (Web Storage)

**Proses Pengerjaan** Proyek ini dikembangkan menggunakan metode Agile untuk mengakomodasi iterasi yang dinamis. Alur pengerjaan dimulai dari riset dan konseptualisasi ruang lingkup fitur utama, penyusunan *user flow*, serta skema database PostgreSQL. Selanjutnya, desain antarmuka (UI/UX) dikembangkan melalui *wireframe* dan UI untuk web serta *mobile* demi menjaga konsistensi tata letak. Fleksibilitas Agile sangat membantu dalam menyempurnakan detail antarmuka, seperti meminimalisir ukuran menu *dropdown* profil di sudut kanan atas agar tata letaknya lebih kompak dan tidak mengambil terlalu banyak ruang layar. Setelah desain siap, pengembangan *backend* dijalankan menggunakan Laravel (REST API & Sanctum), lalu diintegrasikan ke *frontend*. Pengujian fungsionalitas *end-to-end* dan penanganan *bug* dilakukan untuk memastikan kelancaran API sebelum masuk ke tahap *deployment* (hosting Laravel & build Expo).

**Tantangan Teknis** Tantangan paling rumit yang dihadapi adalah mengelola autentikasi berbasis token (Laravel Sanctum) dan sinkronisasi status data secara bersamaan di dua *client* yang berbeda (React Web berbasis peramban dan React Native Expo berbasis mobile). Kendala utama muncul saat penanganan state sesi, perbedaan mekanisme penyimpanan token (*SecureStore* di mobile vs *cookie/localStorage* di web), serta isu Cross-Origin Resource Sharing (CORS) saat pengujian lokal antar-perangkat.

**Solusi yang Diterapkan** Masalah ini diselesaikan dengan menyusun standarisasi *interceptor* HTTP pada *client* untuk memperbarui *bearer token* secara otomatis. Rute autentikasi API dipisah menjadi jalur *stateful* dan *stateless*, serta skema respons JSON di Laravel dioptimalkan agar konsisten saat dikonsumsi oleh antarmuka web maupun mobile.

**Hasil Akhir** Aplikasi kasir ini berhasil memangkas waktu pencatatan transaksi manual dan menyajikan visibilitas stok serta arus kas secara *real-time* dan akurat bagi pelaku UMKM.

**Pelajaran yang Diperoleh** Pemahaman teknis meningkat signifikan dalam merancang arsitektur multi-platform terintegrasi (React Web, React Native Expo, Laravel Sanctum, dan PostgreSQL), mengelola *state management* lintas platform, serta menangani otentikasi berbasis token secara aman.

**Pengembangan Selanjutnya**

* Penambahan fitur cetak struk via printer Bluetooth.  
* Fitur *scan* barcode barang untuk mempercepat pencarian produk.  
* Mode *offline-first* dengan sinkronisasi otomatis.  
* Penerapan analitik prediksi stok berbasis data historis penjualan.

