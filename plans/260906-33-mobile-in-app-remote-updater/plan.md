---
title: "Pembaruan Jarak Jauh APK Otomatis (In-App Remote Updater)"
description: "Arsitektur pembaruan jarak jauh aplikasi Android (In-App Self Updater) berbasis Supabase Storage (1 GB CDN Gratis), Render backend API versi ringan, dan download intent installer native pada React Native Expo tanpa biaya hosting tambahan."
status: "in-progress"
priority: "P1"
effort: "6h"
tags:
  - "mobile"
  - "react-native"
  - "expo"
  - "remote-update"
  - "in-app-updater"
  - "apk-distribution"
  - "supabase-storage"
  - "render"
  - "free-tier"
  - "android-intent"
created: "2026-09-06"
updated: "2026-09-06"
assignee: "Fullstack Architecture Specialist"
---

# Pembaruan Jarak Jauh APK Otomatis (In-App Remote Updater)

## Overview & Latar Belakang

KasirKita POS beroperasi pada tablet dan smartphone Android di berbagai gerai/toko UMKM. Dalam skenario operasional nyata:
1. **Outlet Berada di Luar Jangkauan Fisik**: Gerai kasir sering berada di lokasi berbeda dengan pemilik/developer toko (bahkan beda kota), sehingga pembaruan aplikasi dengan mencolok kabel USB ke laptop kasir di lokasi tidak memungkinkan.
2. **Keterbatasan Render Free-Tier**: Server Render gratis memiliki *ephemeral disk* (file terhapus saat server tidur/restart) dan kuota resource terbatas. Menyajikan unduhan file APK sebesar 40–80 MB langsung dari Render berisiko menghabiskan kuota dan memperlambat respon server.
3. **Pemanfaatan Supabase Storage (1 GB Gratis)**: Supabase menyediakan penyimpanan file publik (S3-compatible bucket) gratis hingga 1 GB dengan CDN Cloudflare global berkecepatan tinggi yang aktif 24 jam non-stop, terpisah dari siklus hidup server Render.
4. **Distribusi Tanpa Biaya (Rp 0)**: Memungkinkan pembaruan APK jarak jauh yang mulus, aman, dan tanpa biaya registrasi Google Play Store Console ($25) atau layanan cloud berbayar.

Solusi **In-App Remote Updater** ini memungkinkan HP kasir secara otomatis mendeteksi adanya versi baru, mengunduh file instalasi APK langsung dari Supabase Storage dengan tampilan progress bar yang informatif, dan memicu dialog instalasi resmi Android (`android.intent.action.VIEW`) tanpa menghilangkan data lokal (`AsyncStorage`, riwayat nota offline, maupun sesi login kasir).

---

## Arsitektur & Alur Kerja Sistem

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALUR PENGEMBANG / OWNER                         │
└────────────────────────────────────────────────────────────────────────┘
  1. Build APK Rilis Terbaru (misal: KasirKita-v1.4.0.apk)
  2. Upload APK ke Bucket Publik Supabase Storage ("apk-releases")
  3. Konfigurasi Nomor Versi & Catatan Rilis di Backend Render / Env
                               │
                               ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ALUR APLIKASI KASIR                             │
└────────────────────────────────────────────────────────────────────────┘
  1. Pengecekan Versi:
     - Otomatis: Pengecekan non-blocking di latar belakang saat aplikasi dibuka.
     - Manual: Kasir menekan "Periksa Pembaruan" di menu Pengaturan.
  2. Bandingkan Versi Aplikasi vs Versi Server (SemVer comparison):
     - Jika Server > Lokal: Munculkan Bottom Sheet "Pembaruan Tersedia".
  3. Unduh APK dari Supabase Storage:
     - Download stream ke cache lokal via expo-file-system/legacy.
     - Tampilan progress bar interaktif (0% -> 100%, persentase & ukuran MB).
  4. Pemicu Instalasi Native (Intent Launcher):
     - Dapatkan Content URI aman melalui FileSystem.getContentUriAsync().
     - Buka prompt instalasi resmi Android via expo-intent-launcher.
     - Pengguna menekan tombol "Perbarui" / "Install" bawaan OS Android.
```

---

## Spesifikasi Teknis Komponen

### 1. Supabase Storage (Host Berkas APK)
- **Bucket Publik**: `apk-releases` (Public Access: Read-only untuk publik).
- **Struktur File**: `apk-releases/KasirKita-v{MAJOR}.{MINOR}.{PATCH}.apk` (contoh: `KasirKita-v1.4.0.apk`).
- **CDN Cloudflare Supabase**: Menyediakan unduhan cepat, stabil, dan selalu tersedia meskipun container Render sedang cold-start/sleep.

### 2. Backend Render / Laravel API (Penyedia Metadata Versi)
- **Endpoint Publik Ringan**: `GET /api/app/version`
  - Payload respons super ringkas (~250 bytes), ramah kuota bandwith Render:
    ```json
    {
      "success": true,
      "data": {
        "latest_version": "1.4.0",
        "latest_version_code": 140,
        "min_supported_version": "1.0.0",
        "apk_url": "https://[project-ref].supabase.co/storage/v1/object/public/apk-releases/KasirKita-v1.4.0.apk",
        "apk_size_bytes": 52428800,
        "changelog": [
          "Penyempurnaan pemulihan cadangan data lokal dan cloud",
          "Optimasi kestabilan transaksi kasir saat offline",
          "Pembaruan tampilan dialog dan navigasi pengaturan"
        ],
        "release_date": "2026-09-06",
        "is_mandatory": false
      }
    }
    ```
- **Fallback Dinamis**: Nilai versi dikonfigurasi melalui database (`store_settings` / `app_version`) dengan fallback aman ke `config/app.php` atau `.env`.

### 3. Modul Mobile Service (`mobile/src/services/updaterService.js`)
- **Semver Comparator (`isNewerVersion(remote, local)`)**:
  - Menguraikan `MAJOR.MINOR.PATCH` secara deterministik dan akurat (misal `1.4.0` > `1.3.0`).
- **Pemeriksa Versi (`checkForUpdate()`)**:
  - Memanggil `GET /api/app/version` dengan batas timeout 4 detik (agar tidak memperlambat start aplikasi jika sinyal lemah).
- **Pengunduh APK Resumable (`downloadApk(downloadUrl, onProgress)`)**:
  - Menggunakan `FileSystem.createDownloadResumable` dari `expo-file-system/legacy`.
  - Callback progres: `{ totalBytesWritten, totalBytesExpectedToWrite, percent }`.
- **Eksekutor Instalasi Android (`installApk(fileUri)`)**:
  - Konversi file URI ke Content URI melalui `FileSystem.getContentUriAsync(fileUri)` untuk memenuhi aturan Android Nougat+ (API 24+) Scoped Storage.
  - Membuka installer native Android:
    ```javascript
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: contentUri,
      flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      type: 'application/vnd.android.package-archive',
    });
    ```

### 4. UI Bottom Sheet Modal (`mobile/src/components/updater/UpdatePromptModal.js`)
- Mengikuti standar **Impeccable Craft**:
  - **Palet Tema**: Dark/Rose KasirKita (`#09090b`, `#18181b`, `#27272a`, `#e11d48`, `#fb7185`).
  - **Status Standby**: Menampilkan badge versi baru, tanggal rilis, dan daftar poin perbaikan (*changelog*).
  - **Status Mengunduh**: Progress bar halus dengan warna aksen Rose, teks persentase (`68%`), dan rasio unduhan (`34.2 MB / 50.1 MB`).
  - **Kontrol Aksi**:
    - Tombol utama: *"Perbarui Sekarang"* (atau *"Pasang Sekarang"* saat download selesai).
    - Tombol sekunder: *"Nanti Saja"* (disembunyikan jika `is_mandatory: true`).
    - Tombol *"Batal"* selama pengunduhan aktif.

### 5. Integrasi Layar Pengaturan (`mobile/src/screens/SettingsScreen.js`)
- Kartu menu *"Pembaruan Sistem"* di seksi Perangkat & Aplikasi.
- Menampilkan nomor versi aktif saat ini (misal: `v1.3.0`).
- Badge status visual: `"Versi Terbaru"` (hijau emerald) atau `"Ada Pembaruan"` (rose/amber).
- Tombol interaktif `"Periksa Pembaruan"` dengan indikator loading aktif saat memeriksa ke server.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 01 | Spesifikasi Arsitektur, Skema Metadata Versi, & Supabase Storage Bucket Setup | completed |
| 02 | Backend Laravel: Endpoint `GET /api/app/version` & Fallback Config | completed |
| 03 | Mobile Service: `updaterService.js` (Semver check, Download Resumable, & Native Intent Installer) | completed |
| 04 | Mobile UI: `UpdatePromptModal.js` (Impeccable Bottom Sheet, Progress Bar, & Changelog List) | completed |
| 05 | Mobile Integration: Integrasi `SettingsScreen.js` & Non-blocking Startup Check | in-progress |
| 06 | Pengujian Validasi, Simulasi Mock Update APK, & SOP Panduan Rilis untuk Owner | pending |

---

## Standar Defensive UI & Impeccable Craft

1. **The Flexbox Pairing Rule**:
   - Judul modal dan nomor versi menggunakan `flexShrink: 1` dengan `truncate`.
   - Badge tipe update (`Wajib` / `Opsional`) di sisi kanan menggunakan `flexShrink: 0`.
2. **The Readability Floor Rule**:
   - Seluruh teks ukuran minimum `12px` (tidak ada font 10px / 11px).
3. **The Anti-Shift Typography Rule**:
   - Seluruh teks tombol, badge, dan persentase unduhan pada React Native menyertakan `includeFontPadding: false` dan `textAlignVertical: 'center'`.
4. **Touch Target Protection**:
   - Seluruh tombol aksi modal dan dismiss memiliki `minHeight: 44` dp dan `hitSlop` proporsional.
5. **Non-Intrusive Error Handling**:
   - Jika HP kasir sedang offline atau koneksi internet terputus di tengah unduhan, sistem menampilkan pesan ramah tanpa memblokir kasir dari bertransaksi.
