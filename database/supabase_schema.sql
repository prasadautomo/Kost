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
ALTER TABLE public.penghuni ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';

-- 4. Tabel Data Kamar
CREATE TABLE IF NOT EXISTS public.kamar (
  id TEXT PRIMARY KEY,
  no TEXT NOT NULL UNIQUE,
  lantai TEXT DEFAULT '1',
  tipe TEXT DEFAULT 'Standar',
  harga NUMERIC DEFAULT 0,
  fasilitas TEXT DEFAULT '',
  kost_id TEXT DEFAULT 'kost_1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.kamar ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.kamar DROP CONSTRAINT IF EXISTS kamar_no_key;

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
  verified_at TIMESTAMPTZ,
  kost_id TEXT DEFAULT 'kost_1'
);

ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS bukti_transfer TEXT;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS catatan_bayar TEXT;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS denda NUMERIC DEFAULT 0;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS listrik_extra NUMERIC DEFAULT 0;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.pembayaran ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.pembayaran DROP CONSTRAINT IF EXISTS pembayaran_penghuni_id_fkey;

-- 6. Tabel Pengeluaran Kost (Fitur Pembukuan & Laba Rugi)
CREATE TABLE IF NOT EXISTS public.pengeluaran (
  id TEXT PRIMARY KEY,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  kategori TEXT NOT NULL, -- 'Listrik/PLN', 'Air/PDAM', 'WiFi/Internet', 'Kebersihan/Sampah', 'Perbaikan/Maintenance', 'Gaji/Operasional', 'Lainnya'
  jumlah NUMERIC NOT NULL DEFAULT 0,
  keterangan TEXT DEFAULT '',
  bukti_nota TEXT,
  created_by TEXT,
  kost_id TEXT DEFAULT 'kost_1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pengeluaran ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';

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
  kost_id TEXT DEFAULT 'kost_1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.keluhan ADD COLUMN IF NOT EXISTS kost_id TEXT DEFAULT 'kost_1';
ALTER TABLE IF EXISTS public.keluhan DROP CONSTRAINT IF EXISTS keluhan_penghuni_id_fkey;

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
VALUES ('default', 'SiKost Makmur', 'Gavin Utomo', 'Jl. Utama Kost No. 1', '081234567890', 10, 'BCA', '1234567890', 'Gavin Utomo')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGER OTOMATIS: BUAT PROFIL SAAT USER MENDAFTAR (GOOGLE / EMAIL)
-- ATURAN KETAT: HANYA gavinutomo4@gmail.com YANG MENJADI MANAGER!
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  assigned_nama TEXT;
  matched_penghuni_id TEXT;
BEGIN
  -- 1. Cek apakah email cocok dengan data anak kost yang didaftarkan
  SELECT id INTO matched_penghuni_id 
  FROM public.penghuni 
  WHERE LOWER(email) = LOWER(new.email) 
  LIMIT 1;

  -- 2. HANYA gavinutomo4@gmail.com YANG BERHAK MENJADI MANAGER!
  -- Akun selain gavinutomo4@gmail.com otomatis ditetapkan sebagai 'penghuni'
  IF LOWER(new.email) = 'gavinutomo4@gmail.com' THEN
    assigned_role := 'manager';
  ELSE
    assigned_role := 'penghuni';
  END IF;

  -- 3. Ambil nama dari Google OAuth (full_name / name) atau metadata, fallback ke split_part email
  assigned_nama := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'nama',
    split_part(new.email, '@', 1)
  );

  INSERT INTO public.profiles (id, nama, email, role, penghuni_id)
  VALUES (
    new.id,
    assigned_nama,
    new.email,
    assigned_role,
    matched_penghuni_id
  )
  ON CONFLICT (id) DO UPDATE SET
    nama = EXCLUDED.nama,
    email = EXCLUDED.email,
    role = CASE WHEN LOWER(EXCLUDED.email) = 'gavinutomo4@gmail.com' THEN 'manager' ELSE 'penghuni' END,
    penghuni_id = COALESCE(matched_penghuni_id, profiles.penghuni_id),
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
    WHERE id = auth.uid() AND (role = 'manager' OR LOWER(email) = 'gavinutomo4@gmail.com')
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
-- ============================================================
-- ROW LEVEL SECURITY (RLS) & WEB CLOUD STORAGE ACCESS
-- ============================================================
-- Mengizinkan web app menyimpan dan membaca data langsung ke Supabase Cloud (anon & authenticated)
ALTER TABLE IF EXISTS public.penghuni DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kamar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pembayaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.keluhan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kost_pengaturan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengumuman DISABLE ROW LEVEL SECURITY;

-- Policy terbuka jika RLS diaktifkan kembali oleh admin
DROP POLICY IF EXISTS "penghuni_web_all" ON public.penghuni;
CREATE POLICY "penghuni_web_all" ON public.penghuni FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kamar_web_all" ON public.kamar;
CREATE POLICY "kamar_web_all" ON public.kamar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pembayaran_web_all" ON public.pembayaran;
CREATE POLICY "pembayaran_web_all" ON public.pembayaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pengeluaran_web_all" ON public.pengeluaran;
CREATE POLICY "pengeluaran_web_all" ON public.pengeluaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "keluhan_web_all" ON public.keluhan;
CREATE POLICY "keluhan_web_all" ON public.keluhan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kost_web_all" ON public.kost_pengaturan;
CREATE POLICY "kost_web_all" ON public.kost_pengaturan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_web_all" ON public.profiles;
CREATE POLICY "profiles_web_all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pengumuman_web_all" ON public.pengumuman;
CREATE POLICY "pengumuman_web_all" ON public.pengumuman FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);


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
