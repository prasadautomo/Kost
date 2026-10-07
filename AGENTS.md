# Aturan Pengembangan SiKost (Agent Rules)

## 📌 Aturan Wajib: Auto-Sync ke GitHub
**SETIAP KALI** pengguna memberikan prompt dan terjadi perubahan pada kode, file, atau dokumentasi:
1. Agent **WAJIB** secara otomatis melakukan commit dan push ke remote GitHub repository (`origin/main`).
2. Jangan menunggu pengguna meminta "update ke github" atau "push ke github".
3. Lakukan langkah ini secara otomatis sebelum memberikan respon akhir kepada pengguna:
   ```powershell
   git add -A
   git commit -m "<deskripsi perubahan yang jelas dan informatif>"
   git push origin main
   ```
4. Pastikan `git status` dalam kondisi bersih (`working tree clean`) setelah setiap tugas selesai.

## 📌 Aturan Pembersihan Kode (Zero Dead-Code Policy)
Ketika pengguna meminta menghapus fitur, menu, atau komponen ("hapus dan jangan tinggalkan kodenya"):
1. **Markup & DOM**: Hapus elemen HTML, ID, class spesifik, dan container layout terkait.
2. **JavaScript & Logika**: Hapus semua event listener (`addEventListener`), fungsi utilitas, manipulasi DOM, state array (seperti `settingAutoFields`), dan timer yang berkaitan.
3. **No Dangling Listeners**: Jangan pernah menyisakan pemanggilan listener pada elemen yang sudah dihapus.
4. **Verifikasi**: Jalankan pengujian otomatis untuk memastikan tidak ada `TypeError` (null reference) atau syntax error.

## 📌 Standar Desain & UI/UX SiKost
1. **True Pitch-Black Dark Mode**:
   - Gunakan palet dark mode pekat (near-black, e.g. `#08090C` untuk body, `#0E1015` untuk surface card), hindari warna abu-abu terang/kusam.
   - Pertahankan kontras teks tinggi (putih/off-white) sesuai prinsip Anti-Slop UI.
2. **Identitas Multi-Cabang Konsisten**:
   - Brand sidebar utama secara permanen menampilkan **Kost Manager** (Portal Multi-Cabang).
   - Nama cabang individual hanya berganti pada topbar switcher dan modul operasional cabang terkait.
3. **Resilient Empty State**:
   - Jangan menyembunyikan kontainer komponen interaktif ketika data kosong (misal Action Center / Tindakan Mendesak).
   - Tampilkan kartu status kosong (*"Semua operasional cabang ini beres!"*) agar tombol filter, toggle cabang, dan fungsi lainnya tetap dapat diakses pengguna.
