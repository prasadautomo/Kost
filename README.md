# SiKost v4.1 – Aplikasi Manajemen Kost Modern (Cloud, PWA & Enterprise Edition)

Aplikasi web manajemen kost modern dengan dukungan **Cloud Database & Cloud Authentication (Supabase)**, **PWA (Progressive Web App)**, dan siap dideploy langsung ke **Vercel** maupun dijalankan secara offline via browser lokal.

---

## ✨ Fitur Lengkap & Peningkatan v4.1

### 1. 🛡️ Keamanan & Kepatuhan Privasi Data
- 🔐 **Strict Row Level Security (RLS)** – Policy database diperketat menggunakan fungsi `is_manager()`. Akun Penghuni hanya memiliki akses ke data miliknya sendiri.
- 👁️ **Masking NIK & Proteksi KTP** – NIK disensor secara otomatis (`3201••••••••0001`) demi privasi dan UU PDP, dengan tombol toggle intip khusus pengelola.
- 🖼️ **Kompresi Gambar Otomatis (Anti-Crash LocalStorage)** – Setiap foto profil, KTP, nota, dan bukti transfer otomatis di-resize dan dikompresi via HTML5 Canvas ke ~60–120 KB, mencegah error kuota penyimpanan browser.

### 2. 💰 Keuangan & Pembukuan Komprehensif
- 💸 **Pencatatan Pengeluaran Operasional** – Kategori lengkap (Listrik/PLN, Air/PDAM, WiFi, Sampah/Kebersihan, Maintenance/Servis, Gaji Petugas).
- 📊 **Arus Kas & Laba Bersih (Net Profit)** – Dashboard otomatis menghitung: `Laba Bersih = Pemasukan Terkumpul - Total Pengeluaran Operasional` dilengkapi grafik interaktif Chart.js.
- 🧾 **Kwitansi Pembayaran Resmi** – Generator bukti bayar digital dengan stempel LUNAS, nomor invoice unik, kalimat terbilang rupiah, dan tombol 1-klik cetak/PDF atau bagikan ke WhatsApp penghuni.
- 🏦 **Pengaturan Rekening & QRIS** – Rekening bank dan QRIS pengelola otomatis tercantum di portal anak kost dan template WhatsApp pengingat tagihan.
- 🛡️ **Pencatatan Uang Jaminan (Deposit)** – Pengelolaan deposit sewa kamar saat masuk dan status pengembalian saat keluar.

### 3. 🛠️ Operasional & Pengalaman Penghuni (Tenant Portal)
- 💳 **Konfirmasi Pembayaran Mandiri** – Anak kost dapat mengunggah bukti transfer bank langsung dari portal mereka. Pengelola menerima notifikasi badge dan dapat menyetujui/menolak dalam 1 klik.
- 📢 **Papan Pengumuman Kost (Broadcast)** – Pengelola dapat menyiarkan pengumuman penting (*Info, Penting, Urgent*) yang langsung tampil di dashboard dan portal penghuni.
- 📄 **Surat Perjanjian Sewa Kost (SPK)** – Generator kontrak sewa kamar kost standar hukum siap cetak mencakup identitas para pihak, pasal hak & kewajiban, tata tertib kost, dan kolom tanda tangan bermaterai.
- 📱 **Peringatan Jatuh Tempo Cerdas (H-3)** – Indikator warna jatuh tempo (hijau, kuning H-3, merah telat) dan tautan WhatsApp pengingat otomatis.

### 4. ⚡ Performa, Offline & Cloud Modern
- 📱 **PWA (Progressive Web App)** – Dilengkapi `manifest.json` dan `sw.js` (Service Worker) sehingga dapat di-install langsung di layar utama smartphone Android/iOS layaknya aplikasi native Play Store.
- ⚡ **Supabase Realtime Sync** – Pembaruan data di satu perangkat langsung tersinkronisasi otomatis ke perangkat lainnya secara real-time tanpa perlu refresh browser.
- ☁️ **1-Click Cloud Migration** – Pindahkan seluruh data lokal (kamar, penghuni, pembayaran, pengeluaran) ke Supabase Cloud dengan sekali klik.

---

## 📁 Struktur File

```
├── index.html                       # Tampilan antarmuka utama, modal & responsive layout
├── style.css                        # Design system, glassmorphism dark mode, dan print stylesheet
├── app.js                           # Logika aplikasi, canvas compressor, state manager & realtime client
├── config.js                        # Konfigurasi Supabase Project URL & Anon Key
├── supabase_schema.sql              # Skrip SQL tabel, trigger, dan strict RLS policies untuk Supabase
├── manifest.json                    # Web App Manifest untuk dukungan PWA
├── sw.js                            # Service Worker untuk caching aset dan offline capability
├── vercel.json                      # Konfigurasi deployment Vercel
├── package.json                     # Konfigurasi package & scripts
├── PANDUAN_CLOUD_VERCEL_SUPABASE.md # Panduan langkah demi langkah setup Supabase & Vercel
└── README.md                        # Dokumentasi lengkap proyek
```

---

## 🚀 Panduan Memulai

### 1. Menjalankan di Komputer Lokal
Buka file `index.html` langsung di browser Chrome/Edge/Firefox, atau jalankan server statis:
```powershell
npx serve .
```

### 2. Setup Supabase Cloud & Database
1. Buat project gratis di [Supabase](https://supabase.com).
2. Buka **SQL Editor** di Supabase Dashboard -> **New query**.
3. Salin seluruh isi file [supabase_schema.sql](supabase_schema.sql) lalu klik tombol **Run**.
4. Di aplikasi SiKost, klik menu **Pengaturan -> Cloud Supabase** atau tombol **"⚙️ Set Supabase"** di layar login, lalu masukkan **Project URL** dan **Anon Key** Anda.
5. Klik **"☁️ Upload Seluruh Data ke Supabase Cloud"** jika ingin memigrasikan data yang sudah ada di browser.

### 3. Deploy ke Vercel
Push repository ini ke GitHub lalu import project ke [Vercel](https://vercel.com). Aplikasi akan otomatis aktif online dengan sertifikat SSL gratis!
