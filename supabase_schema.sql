-- ============================================================
-- SIKOST – Supabase Cloud Database Schema & Setup v4.1
-- Enterprise Security · Strict RLS · Finansial & Operasional
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
  bank_nama TEXT DEFAULT '',
  bank_rekening TEXT DEFAULT '',
  bank_atas_nama TEXT DEFAULT '',
  qris_url TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrasi kolom tambahan jika tabel sudah ada sebelumnya
ALTER TABLE public.kost_pengaturan ADD COLUMN IF NOT EXISTS bank_nama TEXT DEFAULT '';
ALTER TABLE public.kost_pengaturan ADD COLUMN IF NOT EXISTS bank_rekening TEXT DEFAULT '';
ALTER TABLE public.kost_pengaturan ADD COLUMN IF NOT EXISTS bank_atas_nama TEXT DEFAULT '';
ALTER TABLE public.kost_pengaturan ADD COLUMN IF NOT EXISTS qris_url TEXT DEFAULT '';

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
  deposit NUMERIC DEFAULT 0,
  catatan_deposit TEXT,
  darurat_nama TEXT,
  darurat_hub TEXT,
  darurat_hp TEXT,
  darurat_alamat TEXT,
  foto TEXT,
  foto_ktp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.penghuni ADD COLUMN IF NOT EXISTS deposit NUMERIC DEFAULT 0;
ALTER TABLE public.penghuni ADD COLUMN IF NOT EXISTS catatan_deposit TEXT;

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
  status TEXT DEFAULT 'lunas', -- 'lunas', 'menunggu', 'batal'
  tgl_bayar TIMESTAMPTZ DEFAULT NOW(),
  bukti_transfer TEXT,
  catatan_bayar TEXT,
  denda NUMERIC DEFAULT 0,
  listrik_extra NUMERIC DEFAULT 0,
  verified_at TIMESTAMPTZ
);

ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS bukti_transfer TEXT;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS catatan_bayar TEXT;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS denda NUMERIC DEFAULT 0;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS listrik_extra NUMERIC DEFAULT 0;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 6. Tabel Pengeluaran Kost (Fitur Pembukuan & Laba Rugi)
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id TEXT PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL, -- 'Listrik/PLN', 'Air/PDAM', 'WiFi/Internet', 'Kebersihan/Sampah', 'Perbaikan/Maintenance', 'Gaji/Operasional', 'Lainnya'
  jumlah NUMERIC NOT NULL DEFAULT 0,
  keterangan TEXT DEFAULT '',
  bukti_nota TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Keluhan / Maintenance Penghuni
CREATE TABLE IF NOT EXISTS public.keluhan (
  id TEXT PRIMARY KEY,
  penghuni_id TEXT NOT NULL REFERENCES public.penghuni(id) ON DELETE CASCADE,
  kamar TEXT NOT NULL,
  judul TEXT NOT NULL,
  kategori TEXT DEFAULT 'Lainnya', -- 'AC', 'Listrik', 'Air/Plumbing', 'WiFi', 'Pintu/Kunci', 'Kebersihan', 'Lainnya'
  deskripsi TEXT NOT NULL,
  foto TEXT,
  status TEXT DEFAULT 'menunggu', -- 'menunggu', 'diproses', 'selesai'
  respon_manager TEXT,
  tgl_lapor TIMESTAMPTZ DEFAULT NOW(),
  tgl_selesai TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Papan Pengumuman / Broadcast Kost
CREATE TABLE IF NOT EXISTS public.pengumuman (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  isi TEXT NOT NULL,
  tanggal DATE DEFAULT CURRENT_DATE,
  prioritas TEXT DEFAULT 'info', -- 'info', 'penting', 'urgent'
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DATA AWAL (SEED)
-- ============================================================
INSERT INTO public.kost_pengaturan (id, nama, pemilik, alamat, hp, total_kamar, bank_nama, bank_rekening, bank_atas_nama)
VALUES ('default', 'SiKost Makmur', 'Budi Santoso', 'Jl. Utama Kost No. 1', '081234567890', 10, 'BCA', '1234567890', 'Budi Santoso')
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
-- HELPER FUNCTIONS FOR STRICT RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_penghuni_id()
RETURNS TEXT AS $$
DECLARE
  pid TEXT;
BEGIN
  SELECT penghuni_id INTO pid FROM public.profiles WHERE id = auth.uid();
  RETURN pid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STRICT ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kost_pengaturan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penghuni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pembayaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengeluaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keluhan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumuman ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "profiles_all" ON public.profiles;
CREATE POLICY "profiles_select_own_or_manager" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_manager());

CREATE POLICY "profiles_update_own_or_manager" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_manager())
  WITH CHECK (id = auth.uid() OR public.is_manager());

CREATE POLICY "profiles_insert_own_or_manager" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_manager());

CREATE POLICY "profiles_delete_manager" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_manager());

-- 2. Kost Pengaturan (Boleh dibaca semua, hanya diedit Manager)
DROP POLICY IF EXISTS "kost_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_auth_all" ON public.kost_pengaturan;
DROP POLICY IF EXISTS "kost_anon_select" ON public.kost_pengaturan;

CREATE POLICY "kost_read_all" ON public.kost_pengaturan
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "kost_manage_manager" ON public.kost_pengaturan
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- 3. Penghuni (Manager akses penuh, Penghuni hanya data miliknya)
DROP POLICY IF EXISTS "penghuni_auth_all" ON public.penghuni;
CREATE POLICY "penghuni_manager_all" ON public.penghuni
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

CREATE POLICY "penghuni_read_own" ON public.penghuni
  FOR SELECT TO authenticated
  USING (id = public.get_my_penghuni_id());

-- 4. Kamar (Semua bisa lihat status kamar, Manager bisa kelola)
DROP POLICY IF EXISTS "kamar_auth_all" ON public.kamar;
CREATE POLICY "kamar_read_all" ON public.kamar
  FOR SELECT TO authenticated, anon
  USING (true);

CREATE POLICY "kamar_manager_manage" ON public.kamar
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- 5. Pembayaran (Manager kelola semua, Penghuni bisa baca pembayaran miliknya & kirim konfirmasi)
DROP POLICY IF EXISTS "pembayaran_auth_all" ON public.pembayaran;
CREATE POLICY "pembayaran_manager_all" ON public.pembayaran
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

CREATE POLICY "pembayaran_penghuni_select" ON public.pembayaran
  FOR SELECT TO authenticated
  USING (penghuni_id = public.get_my_penghuni_id());

CREATE POLICY "pembayaran_penghuni_insert" ON public.pembayaran
  FOR INSERT TO authenticated
  WITH CHECK (penghuni_id = public.get_my_penghuni_id());

-- 6. Pengeluaran (Hanya Manager yang boleh akses & kelola)
DROP POLICY IF EXISTS "pengeluaran_manager_all" ON public.pengeluaran;
CREATE POLICY "pengeluaran_manager_all" ON public.pengeluaran
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- 7. Keluhan / Maintenance
DROP POLICY IF EXISTS "keluhan_manager_all" ON public.keluhan;
CREATE POLICY "keluhan_manager_all" ON public.keluhan
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

CREATE POLICY "keluhan_penghuni_own" ON public.keluhan
  FOR SELECT TO authenticated
  USING (penghuni_id = public.get_my_penghuni_id());

CREATE POLICY "keluhan_penghuni_insert" ON public.keluhan
  FOR INSERT TO authenticated
  WITH CHECK (penghuni_id = public.get_my_penghuni_id());

-- 8. Pengumuman
DROP POLICY IF EXISTS "pengumuman_read_all" ON public.pengumuman;
CREATE POLICY "pengumuman_read_all" ON public.pengumuman
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pengumuman_manager_all" ON public.pengumuman
  FOR ALL TO authenticated
  USING (public.is_manager())
  WITH CHECK (public.is_manager());

-- ============================================================
-- ENABLE SUPABASE REALTIME REPLICATION
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'penghuni'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.penghuni;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'kamar'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.kamar;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pembayaran'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pembayaran;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pengeluaran'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pengeluaran;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'keluhan'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.keluhan;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'pengumuman'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pengumuman;
  END IF;
END $$;

-- Selesai! Skrip SQL aman, mutakhir, dan siap digunakan di Supabase.
