-- ============================================================
-- SIKOST: AKTIFKAN PENYIMPANAN WEB CLOUD (SUPABASE)
-- ============================================================
-- Jalankan skrip SQL ini di Supabase Dashboard Anda:
-- 1. Buka https://supabase.com/dashboard/project/tzplpnqtwcfchhmodphz/sql/new
-- 2. Salin dan tempel (Paste) seluruh teks SQL di bawah ini
-- 3. Klik tombol hijau "RUN" (atau tekan Ctrl+Enter)
-- ============================================================

-- METODE 0: Tambahkan kolom kost_id untuk isolasi data multi-cabang (jika belum ada)
ALTER TABLE IF EXISTS public.penghuni ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.kamar ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.pembayaran ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.pengeluaran ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.keluhan ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';

-- METODE 1: Nonaktifkan Row Level Security (RLS) agar Web Client langsung memiliki akses simpan penuh
ALTER TABLE IF EXISTS public.penghuni DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kamar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pembayaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kost_pengaturan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengumuman DISABLE ROW LEVEL SECURITY;

-- METODE 2 (Cadangan): Buat Policy Terbuka untuk Anon & Authenticated jika RLS di kemudian hari diaktifkan kembali
-- 1. Penghuni
DROP POLICY IF EXISTS "penghuni_web_all" ON public.penghuni;
DROP POLICY IF EXISTS "penghuni_manager_all" ON public.penghuni;
DROP POLICY IF EXISTS "penghuni_read_own" ON public.penghuni;
DROP POLICY IF EXISTS "penghuni_auth_all" ON public.penghuni;
CREATE POLICY "penghuni_web_all" ON public.penghuni FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Kamar
DROP POLICY IF EXISTS "kamar_web_all" ON public.kamar;
DROP POLICY IF EXISTS "kamar_manager_manage" ON public.kamar;
DROP POLICY IF EXISTS "kamar_read_all" ON public.kamar;
DROP POLICY IF EXISTS "kamar_auth_all" ON public.kamar;
CREATE POLICY "kamar_web_all" ON public.kamar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 3. Pembayaran
DROP POLICY IF EXISTS "pembayaran_web_all" ON public.pembayaran;
DROP POLICY IF EXISTS "pembayaran_manager_all" ON public.pembayaran;
DROP POLICY IF EXISTS "pembayaran_penghuni_select" ON public.pembayaran;
DROP POLICY IF EXISTS "pembayaran_penghuni_insert" ON public.pembayaran;
DROP POLICY IF EXISTS "pembayaran_auth_all" ON public.pembayaran;
CREATE POLICY "pembayaran_web_all" ON public.pembayaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Pengeluaran
DROP POLICY IF EXISTS "pengeluaran_web_all" ON public.pengeluaran;
DROP POLICY IF EXISTS "pengeluaran_manager_all" ON public.pengeluaran;
CREATE POLICY "pengeluaran_web_all" ON public.pengeluaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Kost Pengaturan
DROP POLICY IF EXISTS "kost_web_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_manage_manager" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_read_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_auth_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_anon_select" ON public.kost_pengaturan;
CREATE POLICY "kost_web_all" ON public.kost_pengaturan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. Profiles
DROP POLICY IF EXISTS "profiles_web_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_manager" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
CREATE POLICY "profiles_web_all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. Pengumuman
DROP POLICY IF EXISTS "pengumuman_web_all" ON public.pengumuman;
DROP POLICY IF EXISTS "pengumuman_manager_all" ON public.pengumuman;
DROP POLICY IF EXISTS "pengumuman_read_all" ON public.pengumuman;
CREATE POLICY "pengumuman_web_all" ON public.pengumuman FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Pastikan baris default pengaturan kost ada
INSERT INTO public.kost_pengaturan (id, nama, pemilik, alamat, hp, total_kamar)
VALUES ('default', 'Nama Kost Manager', '', '', '', 0)
ON CONFLICT (id) DO UPDATE SET
  nama = EXCLUDED.nama,
  updated_at = NOW();
