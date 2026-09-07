---
title: "Pelacakan Instalasi Perangkat & Pengguna Aktif (App Installation & Telemetry Tracking)"
description: "Arsitektur pelacakan instalasi riil dan pengguna aktif aplikasi KasirKita POS berbasis Supabase PostgreSQL dan SecureStore device telemetry tanpa mengotori dashboard kasir toko."
status: "completed"
priority: "P1"
effort: "4h"
tags:
  - "backend"
  - "mobile"
  - "telemetry"
  - "supabase"
  - "analytics"
  - "active-users"
created: "2026-09-08"
completed: "2026-09-08"
assignee: "Antigravity"
---

# Pelacakan Instalasi Perangkat & Pengguna Aktif (App Installation & Telemetry Tracking)

## Overview
Menyediakan sistem pelacakan otomatis untuk memantau **jumlah perangkat HP riil yang telah memasang aplikasi (*Total Installs*)** dan **pengguna aktif harian (*Daily Active Users*)** KasirKita POS. Data tersimpan rapi di database PostgreSQL Supabase dan dapat dipantau langsung oleh pemilik aplikasi melalui Supabase Table Editor tanpa mengotori antarmuka (*UI*) dashboard operasional kasir/toko.

---

## Phase Breakdown

| Phase | Description | Status |
|---|---|---|
| 1 | **Skema Database & Model Backend**: Pembuatan tabel `app_installations` dan model Eloquent `AppInstallation.php` dengan indeks pada `installation_id` dan `last_active_at`. | completed |
| 2 | **Backend API & Pengujian Otomatis**: Endpoint `POST /api/app/device-ping` dan `GET /api/app/download` pada `AppTelemetryController.php`, dilengkapi automated test suite `AppTelemetryTest.php`. | completed |
| 3 | **Mobile Telemetry Service (`telemetryService.js`)**: Pembuatan service di React Native dengan generator UUID persisten di `SecureStore`, ekstraksi metadata perangkat (model, brand, OS, app version), dan mekanisme ping senyap non-blocking. | completed |
| 4 | **Integrasi Lifecycle Aplikasi (`App.js`)**: Pemanggilan ping otomatis saat aplikasi pertama kali dibuka (startup background timer). | completed |
| 5 | **Verifikasi Kualitas & Pengujian End-to-End**: Uji coba unit test backend, verifikasi standalone mobile script, uji coba bundling web, dan dokumentasi arsitektur di `docs/context.md`. | completed |
