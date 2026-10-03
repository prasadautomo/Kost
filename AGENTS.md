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
