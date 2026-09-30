# SiKost – Aplikasi Manajemen Kost (Cloud & Vercel Ready)

Aplikasi web manajemen kost modern dengan dukungan **Cloud Database & Cloud Authentication (Supabase)** dan siap dideploy langsung ke **Vercel**. Juga dilengkapi dengan **Offline Fallback** sehingga tetap dapat berjalan tanpa server.

---

## ✨ Fitur Utama

- ⚡ **Cloud Supabase** – Database PostgreSQL cloud, realtime sync & auth aman
- 🚀 **Vercel Ready** – Siap dideploy ke Vercel dalam 1 menit
- 🔐 **Dual Mode Authentication** – Cloud Login (Supabase Auth) + Fallback Login Lokal (SHA-256)
- 👥 **Data Penghuni Lengkap** – Identitas, foto, KTP, kendaraan, kontak darurat, dan pekerjaan
- 🛏 **Manajemen Kamar** – Tracking kamar terisi, kosong, tipe, dan harga real-time
- 💳 **Pembayaran & Tagihan** – Pencatatan lunas/belum bayar per bulan otomatis
- 📊 **Dashboard Interaktif** – KPI ringkasan, grafik okupansi & pendapatan via Chart.js
- 👤 **Role-Based Access** – Role **Manager** (akses penuh) & **Penghuni** (melihat data hunian pribadi)
- 🖨️ **Cetak Kartu & Laporan** – Kartu data penghuni siap cetak & Export CSV
- ☁️ **1-Click Cloud Migration** – Pindahkan seluruh data lokal ke cloud dengan satu klik tombol

---

## 📁 Struktur File

```
├── index.html                       # Tampilan utama & modal aplikasi
├── style.css                        # Design system & responsive UI
├── app.js                           # Logika aplikasi, Supabase client & state sync
├── config.js                        # Konfigurasi Supabase Project URL & Anon Key
├── supabase_schema.sql              # Skrip SQL tabel, trigger, dan RLS untuk Supabase
├── vercel.json                      # Konfigurasi deployment Vercel
├── package.json                     # Konfigurasi package & scripts
├── PANDUAN_CLOUD_VERCEL_SUPABASE.md # Panduan langkah demi langkah setup Supabase & Vercel
└── README.md                        # Dokumentasi ini
```

---

## 🚀 Memulai Cepat

### 1. Menjalankan di Komputer Lokal
Buka file `index.html` langsung di browser, atau jalankan server lokal:
```powershell
npx serve .
```

### 2. Menghubungkan ke Supabase Cloud
1. Buat project gratis di [Supabase](https://supabase.com).
2. Jalankan isi skrip `supabase_schema.sql` di Supabase SQL Editor.
3. Masukkan **Project URL** dan **Anon Key** Anda langsung lewat tombol **"⚙️ Set Supabase"** di aplikasi atau melalui file `config.js`.

> 📖 **Panduan Lengkap Setup:** Silakan baca file [PANDUAN_CLOUD_VERCEL_SUPABASE.md](PANDUAN_CLOUD_VERCEL_SUPABASE.md).

### 3. Deploy ke Vercel
Import repository project ini ke [Vercel](https://vercel.com) atau jalankan `npx vercel` dari terminal. Aplikasi Anda akan langsung aktif online!
