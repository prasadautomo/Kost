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
     - `http://localhost` (jika dijalankan via server lokal)
     - `null` (untuk file:// lokal – **penting!**)
   - Klik **Create**

## Langkah 4 – Salin Client ID

Setelah dibuat, akan muncul **Client ID** berbentuk:
```
123456789012-abcdefghijklmnop.apps.googleusercontent.com
```

## Langkah 5 – Isi Client ID di SiKost

Buka file `app.js`, cari baris ini di bagian paling atas:

```javascript
const GOOGLE_CLIENT_ID = 'GANTI_DENGAN_CLIENT_ID_ANDA';
```

Ganti `GANTI_DENGAN_CLIENT_ID_ANDA` dengan Client ID Anda.

---

## Catatan Penting

- **Mode Demo**: Jika belum mengisi Client ID, aplikasi berjalan dalam **Mode Demo** 
  dengan login manual (tanpa Google). Cocok untuk testing lokal.
- **File lokal**: Google Sign-In via `file://` mungkin diblokir browser.
  Untuk hasil terbaik, jalankan via server lokal:
  ```
  npx serve .
  ```
  Lalu buka `http://localhost:3000`
- **Manager pertama**: Akun Google pertama yang login otomatis menjadi Manager.
  Anda bisa mengubah role di halaman **Pengaturan → Manajemen Akses**.
