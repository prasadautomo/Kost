# Panduan Setup Google Sign-In untuk SiKost

## Langkah 1 – Buat Project di Google Cloud Console

1. Buka [https://console.cloud.google.com](https://console.cloud.google.com)
2. Klik dropdown project di atas → **"New Project"**
3. Isi nama project: `SiKost` → klik **Create**

## Langkah 2 – Aktifkan Google Sign-In API

1. Di sidebar kiri, pilih **"APIs & Services"** → **"Library"**
2. Cari `Google Identity` → pilih **"Google Identity Services"** → klik **Enable**

## Langkah 3 – Buat OAuth 2.0 Client ID

1. Di sidebar, pilih **"APIs & Services"** → **"Credentials"**
2. Klik **"+ Create Credentials"** → pilih **"OAuth client ID"**
3. Jika diminta, konfigurasi **OAuth consent screen** dulu:
   - User Type: **External**
   - App name: `SiKost`
   - Support email: email Anda
   - Simpan & lanjutkan (skip field lain)
4. Kembali buat OAuth client ID:
   - Application type: **Web application**
   - Name: `SiKost Web`
   - **Authorized JavaScript origins**: tambahkan:
     - `https://kost-5rxniz1mm-prasada.vercel.app` (domain Vercel Anda)
     - `http://localhost:3000` (server lokal)
     - `http://localhost`
   - **Authorized redirect URIs**: tambahkan:
     - `https://kost-5rxniz1mm-prasada.vercel.app`
     - `http://localhost:3000`
   - Klik **Create** (atau **Save**)

## Langkah 4 – Client ID SiKost Anda

Client ID Anda:
```
923123118444-je8bu4euke8hunresmb4cj67c5oi4mh0.apps.googleusercontent.com
```

Client ID ini sudah otomatis dipasang di `config.js`!

---

## Catatan Penting

- **File lokal**: Google Sign-In via `file://` diblokir oleh kebijakan keamanan browser (Google OAuth).
  Jalankan via server web lokal:
  ```powershell
  powershell -File serve.ps1
  ```
  Lalu buka `http://localhost:3000` di browser.
- **Manager pertama**: Akun Google pengelola yang login otomatis mendapatkan hak akses Manager.
  Anda bisa mengubah role di halaman **Pengaturan → Manajemen Akses**.
