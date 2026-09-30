-- ============================================================
-- SIKOST – Supabase Cloud Database Schema & Setup
-- ============================================================
-- Salin dan tempel (Copy & Paste) seluruh skrip ini ke dalam:
-- Supabase Dashboard -> Project Anda -> SQL Editor -> Klik "New query" -> Run
-- ============================================================

-- 1. Tabel Profil Pengguna (terhubung ke auth.users Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'manager', -- 'manager' atau 'penghuni'
  penghuni_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Pengaturan Kost
CREATE TABLE IF NOT EXISTS public.kost_pengaturan (
  id TEXT PRIMARY KEY DEFAULT 'default',
  nama TEXT DEFAULT 'SiKost',
  pemilik TEXT DEFAULT '',
  alamat TEXT DEFAULT '',
  hp TEXT DEFAULT '',
  total_kamar INTEGER DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Data Penghuni
CREATE TABLE IF NOT EXISTS public.penghuni (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  hp TEXT NOT NULL,
  kamar TEXT NOT NULL,
  tgl_masuk TEXT NOT NULL,
  nik TEXT,
  gender TEXT,
  tempat_lahir TEXT,
  tgl_lahir TEXT,
  alamat_ktp TEXT,
  email TEXT,
  pekerjaan TEXT,
  lantai TEXT,
  tgl_keluar TEXT,
  status TEXT DEFAULT 'aktif',
  catatan TEXT,
  kendaraan TEXT DEFAULT 'tidak ada',
  merk1 TEXT,
  plat1 TEXT,
  merk2 TEXT,
  plat2 TEXT,
  sewa NUMERIC DEFAULT 0,
  tempo TEXT,
  catatan_bayar TEXT,
  darurat_nama TEXT,
  darurat_hub TEXT,
  darurat_hp TEXT,
  darurat_alamat TEXT,
  foto TEXT,
  foto_ktp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Data Kamar
CREATE TABLE IF NOT EXISTS public.kamar (
  id TEXT PRIMARY KEY,
  no TEXT NOT NULL UNIQUE,
  lantai TEXT DEFAULT '1',
  tipe TEXT DEFAULT 'Standar',
  harga NUMERIC DEFAULT 0,
  fasilitas TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pembayaran
CREATE TABLE IF NOT EXISTS public.pembayaran (
  id TEXT PRIMARY KEY,
  penghuni_id TEXT NOT NULL REFERENCES public.penghuni(id) ON DELETE CASCADE,
  bulan TEXT NOT NULL,
  jumlah NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'lunas',
  tgl_bayar TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================
INSERT INTO public.kost_pengaturan (id, nama, pemilik, alamat, hp, total_kamar)
VALUES ('default', 'SiKost Makmur', 'Pengelola Kost', 'Jl. Utama Kost No. 1', '081234567890', 10)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGER OTOMATIS: BUAT PROFIL SAAT USER MENDAFTAR DI SUPABASE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_count INTEGER;
  assigned_role TEXT;
  assigned_nama TEXT;
BEGIN
  -- Hitung jumlah profil saat ini
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- Akun pertama yang mendaftar otomatis menjadi Manager
  IF user_count = 0 THEN
    assigned_role := 'manager';
  ELSE
    assigned_role := COALESCE(new.raw_user_meta_data->>'role', 'penghuni');
  END IF;

  assigned_nama := COALESCE(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1));

  INSERT INTO public.profiles (id, nama, email, role, penghuni_id)
  VALUES (
    new.id,
    assigned_nama,
    new.email,
    assigned_role,
    new.raw_user_meta_data->>'penghuni_id'
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    penghuni_id = COALESCE(EXCLUDED.penghuni_id, profiles.penghuni_id),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kost_pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penghuni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policy
DROP POLICY IF EXISTS "profiles_auth_all" ON public.profiles;
CREATE POLICY "profiles_auth_all" ON public.profiles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Kost Pengaturan Policy
DROP POLICY IF EXISTS "kost_auth_all" ON public.kost_pengaturan;
CREATE POLICY "kost_auth_all" ON public.kost_pengaturan
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "kost_anon_select" ON public.kost_pengaturan;
CREATE POLICY "kost_anon_select" ON public.kost_pengaturan
  FOR SELECT TO anon
  USING (true);

-- 3. Penghuni Policy
DROP POLICY IF EXISTS "penghuni_auth_all" ON public.penghuni;
CREATE POLICY "penghuni_auth_all" ON public.penghuni
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Kamar Policy
DROP POLICY IF EXISTS "kamar_auth_all" ON public.kamar;
CREATE POLICY "kamar_auth_all" ON public.kamar
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Pembayaran Policy
DROP POLICY IF EXISTS "pembayaran_auth_all" ON public.pembayaran;
CREATE POLICY "pembayaran_auth_all" ON public.pembayaran
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Selesai! Skrip SQL siap digunakan di Supabase.
