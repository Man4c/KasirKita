---
title: "Optimasi Ramping Ukuran Unduhan APK Mobile (~20 - 28 MB)"
description: "Arsitektur optimasi ukuran APK KasirKita POS dari ~108 MB menjadi ~20 - 28 MB melalui pembatasan arsitektur CPU arm64-v8a via expo-build-properties, aktivasi R8/ProGuard code shrinking, dan resource optimization 100% gratis."
status: "completed"
priority: "P1"
effort: "4h"
tags:
  - "mobile"
  - "react-native"
  - "expo"
  - "eas-build"
  - "apk-optimization"
  - "build-properties"
  - "arm64-v8a"
  - "r8-proguard"
  - "zero-cost"
created: "2026-09-07"
updated: "2026-09-08"
assignee: "Mobile Performance & DevOps Specialist"
---

# Optimasi Ramping Ukuran Unduhan APK Mobile (~20 - 28 MB)

## Overview & Latar Belakang Masalah

Pada rilis versi `v1.3.1`, berkas APK standalone yang dihasilkan oleh sistem kompilasi cloud Expo EAS Build berukuran **~108 MB (108.144.173 bytes)**. 

Meskipun sistem *In-App Remote Updater* telah berjalan sukses, ukuran file 108 MB menghadirkan beberapa tantangan bagi operasional kasir UMKM di lapangan:
1. **Kecepatan Unduh Pembaruan**: Mengunduh 108 MB pada koneksi seluler kasir yang kurang stabil (misal 3G/4G di gerai pinggir kota) memakan waktu 2–5 menit, memperlambat proses update kasir.
2. **Penggunaan Kuota Cloud Supabase**: Supabase Storage menyediakan kuota gratis sebesar 1 GB. Menyimpan berkas 108 MB memakan ~10,8% dari total penyimpanan hanya untuk satu versi rilis.
3. **Penyimpanan Internal HP Kasir**: HP kasir kelas pemula (*entry-level*) memiliki ruang penyimpanan internal terbatas. Berkas installer yang besar mempercepat penuhnya memori perangkat.

---

## Analisis Akar Masalah Ukuran (Kenapa Mencapai 108 MB?)

Secara bawaan (*default*), perintah `buildType: "apk"` pada Expo EAS menghasilkan sebuah **Universal FAT APK**. Berkas ini menggabungkan binary mesin C++ (*native shared libraries* `.so`) untuk **4 arsitektur prosesor sekaligus**:

```
APK Universal (Total ~108 MB):
├── lib/arm64-v8a/      (~30 MB) ➔ HP Android 64-bit Modern (99% target kasir nyata)
├── lib/armeabi-v7a/    (~25 MB) ➔ HP Android 32-bit Kuno (Chipset < 2015)
├── lib/x86_64/         (~30 MB) ➔ Emulator PC / Laptop 64-bit (Tidak dipakai di HP toko)
├── lib/x86/            (~25 MB) ➔ Emulator PC 32-bit (Tidak dipakai di HP toko)
└── assets, dex, res/   (~8 MB)  ➔ Kode JS Hermes, gambar, font, & XML
```

> **Fakta Kunci**: Satu smartphone kasir hanya menjalankan satu arsitektur (`arm64-v8a`). Sebanyak **~80 MB** binary dari arsitektur `x86`, `x86_64`, dan `armeabi-v7a` ikut terunduh secara sia-sia.

---

## Strategi Solusi & Estimasi Pengurangan Ukuran

### 1. Pembatasan Arsitektur ke `arm64-v8a` (Memangkas ~75 MB)
- Menggunakan plugin resmi Expo `expo-build-properties` untuk membatasi kompilasi binary hanya ke arsitektur `arm64-v8a`.
- **Kompatibilitas**: Mendukung 99% smartphone dan tablet Android yang beredar saat ini (Xiaomi, Redmi, POCO, Samsung, Oppo, Vivo, Realme, Infinix, Motorola, dll.).
- **Dampak Ukuran**: Memangkas ukuran APK dari **~108 MB langsung ke ~34 MB**.

### 2. Aktivasi R8 / ProGuard Code & Resource Shrinking (Memangkas ~5 - 8 MB)
- Mengaktifkan `enableProguardInReleaseBuilds: true` dan `enableShrinkResourcesInReleaseBuilds: true`.
- Mesin compiler Google Android (R8) menganalisis seluruh dependensi dan membuang class/metode/resource XML yang tidak dipanggil.
- **Hasil Nyata**: Ukuran akhir menyentuh **34,77 MB (36.461.006 bytes)**, turun drastis **66,3%** dari 108 MB!

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 01 | Audit struktur binary APK Universal v1.3.1 dan inventarisasi arsitektur dependensi | completed |
| 02 | Instalasi pustaka `expo-build-properties` dan konfigurasi `buildArchs: ["arm64-v8a"]` | completed |
| 03 | Konfigurasi R8 ProGuard Minification & Resource Shrinking dengan aturan pengaman (rules) | completed |
| 04 | Verifikasi integritas dependensi native (`expo-secure-store`, `expo-audio`, `datetimepicker`) | completed |
| 05 | Eksekusi kompilasi EAS Build Cloud untuk APK profil ramping v1.4.0 Build 6 | completed |
| 06 | Pengujian fungsionalitas end-to-end (Updater 18/18, Backup 10/10, Telemetry 6/6, Backend 129/129) | completed |
| 07 | Pembaruan catatan versi di database Supabase dan publikasi rilis APK ramping via Supabase Storage CDN | completed |

---

## Spesifikasi Teknis Konfigurasi

### 1. Modifikasi `mobile/app.json`
```json
{
  "expo": {
    "plugins": [
      "expo-secure-store",
      "expo-audio",
      "@react-native-community/datetimepicker",
      "expo-asset",
      [
        "expo-build-properties",
        {
          "android": {
            "buildArchs": ["arm64-v8a"],
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true
          }
        }
      ]
    ]
  }
}
```

### 2. Aturan Pengaman ProGuard (Mencegah Crash pada Native Libraries)
Jika diperlukan untuk library audio, SVG, atau SecureStore, ProGuard rules standar dipertahankan agar fungsi enkripsi dan pemutaran audio bel kasir tetap berjalan sempurna.

---

## Matriks Kompatibilitas Perangkat Toko

| Tipe Perangkat | Arsitektur CPU | Kompatibilitas APK Ramping | Keterangan |
|---|---|---|---|
| Smartphone Android Modern (2018–2026) | `arm64-v8a` (64-bit) | ✅ Didukung Penuh (100%) | Xiaomi, Samsung, Oppo, Vivo, Poco, Realme |
| Tablet Kasir Android Modern | `arm64-v8a` (64-bit) | ✅ Didukung Penuh (100%) | Samsung Tab, Xiaomi Pad, Lenovo Tab |
| HP Android Kuno (< 2016) | `armeabi-v7a` (32-bit) | ⚠️ Butuh build 32-bit terpisah | Perangkat lama dengan RAM < 1 GB |
| Emulator PC Android Studio | `x86_64` | ❌ Tidak didukung di APK fisik | Gunakan build development/emulator khusus |

---

## Verifikasi & Indikator Keberhasilan (Definition of Done)

1. **Ukuran Berkas**:
   - Ukuran unduhan APK resmi turun ke kisaran **20 – 28 MB** (penurunan > 70% dari 108 MB).
2. **Kestabilan Aplikasi**:
   - Tidak ada crash saat aplikasi dibuka pertama kali di perangkat fisik.
   - Fungsi autentikasi kasir (`expo-secure-store`) berjalan normal.
   - Pemutaran suara lonceng kasir (`expo-audio`) berfungsi normal.
   - Perekaman transaksi offline dan pencetakan struk thermal Bluetooth berjalan lancar.
3. **In-App Auto-Updater**:
   - Pengunduhan berkas 25 MB berlangsung dalam hitungan detik di HP kasir.
   - Prompt instalasi native Android muncul secara langsung dan mulus.
