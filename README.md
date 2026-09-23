# SiKost – Aplikasi Manajemen Kost

Aplikasi web manajemen kost berbasis HTML, CSS, dan JavaScript murni. **Tidak perlu server, tidak perlu install apapun** — cukup buka file `index.html` di browser.

## ✨ Fitur

- 🔐 **Login lokal** – email + password, aman dengan SHA-256
- 👥 **Data Penghuni** – lengkap: identitas, foto, KTP, kendaraan, kontak darurat
- 🛏 **Manajemen Kamar** – status terisi/kosong real-time
- 💳 **Pembayaran** – tracking lunas/belum per bulan
- 📊 **Dashboard** – KPI, grafik Chart.js, ringkasan bulanan
- 🌙 **Dark/Light Mode** – toggle tema
- 🖨️ **Cetak Kartu** – kartu data penghuni siap cetak
- 📥 **Export CSV** – ekspor data penghuni
- 💾 **Backup & Restore** – backup JSON, restore data
- 👤 **Role-Based** – Manager (akses penuh) dan Penghuni (lihat data sendiri)

## 🚀 Cara Pakai

1. **Clone / download** repo ini
2. Buka `index.html` langsung di browser (Chrome/Edge disarankan)
3. **Pertama kali:** isi form "Buat Akun Manager" → nama, email, password, nama kost
4. Mulai tambah data penghuni!

### Menambah Akun Penghuni
- Masuk sebagai Manager → **Pengaturan → Akun Penghuni**
- Isi nama, email, password untuk penghuni
- Hubungkan ke data penghuni yang sudah ada
- Penghuni bisa login dan melihat data mereka sendiri

## 📁 Struktur File

```
├── index.html    # Struktur & template HTML
├── style.css     # Design system & styling
├── app.js        # Logika aplikasi & autentikasi
└── README.md     # Dokumentasi ini
```

## 💾 Penyimpanan Data

Semua data tersimpan di **localStorage** browser — tidak ada server/database eksternal. Gunakan fitur **Backup** (Pengaturan → Data) secara berkala untuk menyimpan salinan data Anda.

## 🔐 Keamanan

- Password di-hash dengan **SHA-256** (Web Crypto API) — tidak disimpan teks biasa
- Data tersimpan lokal di perangkat Anda sendiri

## 🛠️ Teknologi

- HTML5 · CSS3 (Vanilla) · JavaScript (ES2020+)
- [Chart.js](https://www.chartjs.org/) v4 – grafik/visualisasi
- [Inter Font](https://fonts.google.com/specimen/Inter) – Google Fonts
- Web Crypto API (built-in browser) – hashing password

---

Made with ❤️ for kost management
