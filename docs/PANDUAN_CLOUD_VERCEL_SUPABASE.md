# 🚀 Panduan Menghubungkan SiKost ke Supabase Cloud & Vercel

Aplikasi **SiKost** kini telah mendukung **Cloud Authentication & Cloud Database** menggunakan **Supabase**, serta siap dideploy langsung ke **Vercel** agar dapat diakses dari HP, laptop, atau komputer manapun.

---

## 📑 Daftar Isi
1. [Langkah 1: Setup Supabase (Database & Cloud Auth)](#1-setup-supabase)
2. [Langkah 2: Menjalankan Skrip Database (SQL Schema)](#2-menjalankan-skrip-database)
3. [Langkah 3: Menghubungkan Supabase ke SiKost](#3-menghubungkan-supabase-ke-sikost)
4. [Langkah 4: Deploy Aplikasi ke Vercel](#4-deploy-ke-vercel)
5. [Migrasi Data Lokal ke Cloud](#5-migrasi-data-lokal-ke-cloud)

---

## 1. Setup Supabase

1. Kunjungi [https://supabase.com](https://supabase.com) dan klik **"Start your project"** (Bisa login gratis dengan akun GitHub atau Google).
2. Di dashboard, klik tombol **"New Project"**.
3. Isi informasi project:
   - **Name**: `sikost` (atau nama kost Anda)
   - **Database Password**: Buat password yang kuat dan catat.
   - **Region**: Pilih yang terdekat (misal: *Singapore* untuk Indonesia).
   - **Pricing Plan**: Pilih **Free Plan**.
4. Klik **"Create new project"** dan tunggu sekitar 1-2 menit hingga proses inisialisasi selesai.

---

## 2. Menjalankan Skrip Database

1. Di menu sidebar kiri dashboard Supabase, klik ikon **"SQL Editor"** (ikon terminal `>_`).
2. Klik tombol **"New query"** (atau lambang `+`).
3. Buka file [supabase_schema.sql](file:///c:/Users/Student/Documents/Kost/supabase_schema.sql) di repo ini, salin (**Copy**) seluruh isinya.
4. Tempel (**Paste**) ke dalam SQL Editor di Supabase.
5. Klik tombol hijau **"Run"** (atau tekan `Ctrl + Enter`).
6. Akan muncul pesan *"Success. No rows returned"*. Tabel `profiles`, `kost_pengaturan`, `penghuni`, `kamar`, dan `pembayaran` sudah berhasil dibuat otomatis dengan trigger keamanan dan Role-based access!

---

## 3. Menghubungkan Supabase ke SiKost

### Mendapatkan Kredensial:
1. Di dashboard Supabase, klik menu **Project Settings** (ikon gerigi ⚙️ di kiri bawah).
2. Pilih submenu **"API"**.
3. Di sana Anda akan melihat 2 nilai penting:
   - **Project URL**: berbentuk `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
   - **Project API keys** -> **`anon` `public`**: token panjang berawalan `eyJhbGciOi...`

### Memasukkan ke Aplikasi SiKost (Pilih salah satu cara):

#### Cara A: Langsung Lewat Tampilan Aplikasi (Paling Mudah)
1. Buka [index.html](file:///c:/Users/Student/Documents/Kost/index.html) di browser Anda.
2. Di layar login, klik tombol **"⚙️ Set Supabase"** (atau badge status di atas tombol form).
3. Masukkan **Project URL** dan **Anon Key** Anda, lalu klik **"Hubungkan & Simpan"**.
4. Status akan otomatis berubah menjadi: **🟢 Cloud Supabase Terhubung**!

#### Cara B: Lewat File `config.js`
Buka file [config.js](file:///c:/Users/Student/Documents/Kost/config.js) dan isi:
```javascript
window.SIKOST_CONFIG = {
  SUPABASE_URL: 'https://xxxxxxxxxxxxxxxxxxxx.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

---

## 4. Deploy ke Vercel

Aplikasi ini adalah *Pure Client-Side Web Application* yang sangat ringan, cepat, dan tidak memerlukan server Node.js khusus.

### Opsi A: Deploy via GitHub (Direkomendasikan)
1. Buat repository baru di [GitHub](https://github.com/new) (misal: `sikost`).
2. Push folder project ini ke repository GitHub Anda:
   ```bash
   git init
   git add .
   git commit -m "feat: SiKost dengan Supabase Cloud & Vercel"
   git branch -M main
   git remote add origin https://github.com/USERNAME-ANDA/sikost.git
   git push -u origin main
   ```
3. Buka [https://vercel.com](https://vercel.com) dan login.
4. Klik **"Add New..."** → **"Project"**.
5. Pilih repository GitHub `sikost` Anda, lalu klik **"Import"**.
6. Pada bagian Build & Development Settings, biarkan default (Framework Preset: **Other**).
7. Klik **"Deploy"**.
8. Dalam hitungan detik, website Anda sudah aktif di domain online seperti `https://sikost-xxxx.vercel.app`!

### Opsi B: Deploy via Vercel CLI (Langsung dari Terminal)
Jika Anda memiliki Node.js, Anda cukup menjalankan:
```powershell
npx vercel
```
Ikuti instruksi di layar, dan web Anda akan langsung terbit secara global.

---

## 5. Migrasi Data Lokal ke Cloud

Jika Anda sebelumnya sudah pernah memasukkan data kamar, penghuni, atau pembayaran di browser lokal dan ingin memindahkannya ke Supabase Cloud:

1. Masuk ke aplikasi sebagai Manager.
2. Buka menu **Pengaturan** di sidebar.
3. Klik tab **"⚡ Cloud Supabase"**.
4. Klik tombol ungu: **"☁️ Upload Data Lokal ke Supabase Cloud"**.
5. Seluruh data kamar, penghuni, pembayaran, dan profil kost lokal akan otomatis dimigrasikan ke database Supabase Anda!

---

## 👥 Akun & Peran Pengguna (Role)

- **Manager**: 
  - Akun pertama yang mendaftar di Cloud otomatis memiliki hak akses **Manager**.
  - Memiliki akses penuh ke Dashboard, Data Penghuni, Kamar, Pembayaran, dan Pengaturan.
- **Penghuni**:
- **Penghuni**:
  - Manager cukup mendaftarkan **Email Google** milik penghuni di menu Data Penghuni.
  - Penghuni cukup klik **"Masuk dengan Google (1-Klik)"** di HP atau laptop mereka tanpa perlu repot mengetik password! Sistem otomatis mendeteksi dan menghubungkan mereka ke kamar masing-masing.

---

## 6. Mengaktifkan Login Asli dengan Google (Live Google OAuth)

Aplikasi SiKost mendukung login resmi Google (**accounts.google.com**) agar Manager dan Penghuni dapat masuk langsung 1-klik dengan akun Google mereka:

> 🔒 **Aturan Keamanan Eksklusif**: HANYA **`gavinutomo4@gmail.com`** yang berhak menjadi **Manager 👑**. Semua akun Google lainnya secara otomatis berstatus **Penghuni 👤**!

### Langkah Cepat Setup Google OAuth di Supabase:
1. **Dapatkan Client ID & Secret dari Google Cloud**:
   - Kunjungi [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Buat OAuth Client ID (Tipe: *Web application*).
   - Pada kolom **Authorized redirect URIs**, masukkan:
     ```text
     https://tzplpnqtwcfchhmodphz.supabase.co/auth/v1/callback
     ```
   - Catat **Client ID** dan **Client Secret**.

2. **Aktifkan Google di Supabase Dashboard**:
   - Buka [Supabase Providers Dashboard](https://supabase.com/dashboard/project/tzplpnqtwcfchhmodphz/auth/providers).
   - Klik **Google** > Nyalakan toggle **Enable Google provider**.
   - Masukkan **Client ID** dan **Client Secret**, lalu klik **Save**.

3. **Atur Redirect URL di Supabase**:
   - Buka menu **Authentication** > **URL Configuration**.
   - Tambahkan URL web Anda di **Redirect URLs**:
     - `http://localhost:3000` (untuk server lokal)
     - `https://sikost.vercel.app` (untuk hosting Vercel Anda)
   - Klik **Save Changes**.

4. **Menjalankan di Komputer Lokal**:
   - Google OAuth melarang pengalihan ke URL `file:///`.
   - Jalankan server lokal bawaan SiKost dengan perintah:
     ```powershell
     powershell -File serve.ps1
     ```
   - Browser akan otomatis membuka `http://localhost:3000` dan login Google asli dapat langsung digunakan!
