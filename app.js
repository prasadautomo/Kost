/* ============================================================
   SIKOST – app.js  v4.1 (Enterprise Cloud & Offline PWA Edition)
   Supabase Auth · Realtime Sync · Strict RLS · Finansial & Operasional
   Auto Image Compression · Kwitansi & Kontrak Sewa · Tiket Keluhan
   ============================================================ */
'use strict';

// ── STATE ────────────────────────────────────────────────────
let S = {
  penghuni:   [],
  kamar:      [],
  pembayaran: [],
  pengeluaran:[], // [{id, tanggal, kategori, jumlah, keterangan, buktiNota, createdBy}]
  keluhan:    [], // [{id, penghuniId, kamar, judul, kategori, deskripsi, foto, status, responManager, tglLapor, tglSelesai}]
  akun:       [],
  kost: {
    nama: 'Kost Griya Harmoni',
    pemilik: 'Gavin Utomo',
    kota: 'Sleman, Yogyakarta',
    alamat: 'Jl. Kaliurang KM 5, Gg. Megatruh No. 12, Sleman, DI Yogyakarta',
    hp: '081234567890',
    totalKamar: 8,
    bankNama: 'Bank BCA',
    bankRekening: '8465-1234-90',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  },
  activeKostId: 'kost_1',
  properties: [],
  propertiesData: {}
};
window.S = S;

let currentUser  = null; // akun object
let editId       = null;
let detailId     = null;
let currentView  = 'grid';
let confirmCb    = null;
const CHARTS     = {};
const unmaskedNiks = new Set(); // ID penghuni yang NIK-nya sedang di-unmask

// ── SUPABASE CLIENT & CLOUD STATE ────────────────────────────
let sbClient         = null;
let isCloudConnected = false;
let realtimeChannel  = null;

function getSupabaseConfig() {
  const saved = localStorage.getItem('sk3_supabase_config');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.key) return { url: parsed.url.trim(), key: parsed.key.trim() };
    } catch {}
  }
  if (window.SIKOST_CONFIG?.SUPABASE_URL && window.SIKOST_CONFIG?.SUPABASE_ANON_KEY) {
    const url = window.SIKOST_CONFIG.SUPABASE_URL.trim();
    const key = window.SIKOST_CONFIG.SUPABASE_ANON_KEY.trim();
    if (url && key) return { url, key };
  }
  return null;
}

function initSupabase() {
  const cfg = getSupabaseConfig();
  if (cfg && cfg.url && cfg.key && window.supabase) {
    try {
      sbClient = window.supabase.createClient(cfg.url, cfg.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      setupRealtime();
      return true;
    } catch (err) {
      console.warn('Inisialisasi Supabase gagal:', err);
      sbClient = null;
      return false;
    }
  }
  sbClient = null;
  return false;
}

async function testSupabaseConnection(url, key) {
  if (!url || !key) return { success: false, message: 'URL dan Key tidak boleh kosong.' };
  try {
    const testClient = window.supabase.createClient(url, key, { auth: { persistSession: false } });
    const { error } = await testClient.from('kost_pengaturan').select('id').limit(1);
    if (error && error.message && (error.message.includes('FetchError') || error.message.includes('Failed to fetch'))) {
      return { success: false, message: 'Gagal terhubung ke host Supabase. Periksa URL Anda.' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message || 'Koneksi gagal.' };
  }
}

function updateCloudStatusUI(connected, url = '') {
  isCloudConnected = connected;
  let domain = 'Supabase Cloud';
  if (url) {
    try { domain = new URL(url).hostname; } catch {}
  }

  const loginPill = $('login-cloud-pill');
  const loginText = $('login-cloud-text');
  if (loginPill && loginText) {
    loginPill.className = 'cloud-pill ' + (connected ? 'connected' : 'disconnected');
    loginText.textContent = connected ? `🟢 Cloud Supabase (${domain})` : '☁️ Mode Lokal (Klik hubungkan Supabase)';
  }

  const topbarBtn = $('topbar-cloud-btn');
  const topbarText = $('topbar-cloud-text');
  if (topbarBtn && topbarText) {
    topbarBtn.className = 'cloud-btn ' + (connected ? 'connected' : 'disconnected');
    topbarText.textContent = connected ? 'Cloud Aktif' : 'Supabase (Offline)';
  }

  const settingsStatus = $('settings-cloud-status-text');
  const settingsEndpoint = $('settings-cloud-endpoint');
  if (settingsStatus) {
    settingsStatus.textContent = connected ? '🟢 Terhubung ke Supabase Cloud (Realtime Aktif)' : '🔴 Belum Terhubung (Mode Penyimpanan Lokal)';
    settingsStatus.style.color = connected ? 'var(--green)' : 'var(--red)';
  }
  if (settingsEndpoint) {
    settingsEndpoint.textContent = connected ? `Project URL: ${url}` : 'Data saat ini tersimpan di browser lokal Anda.';
  }
}

// ── REALTIME REPLICATION ─────────────────────────────────────
function setupRealtime() {
  if (!sbClient) return;
  try {
    if (realtimeChannel) {
      sbClient.removeChannel(realtimeChannel);
    }
    realtimeChannel = sbClient.channel('sikost_realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        // Debounce fetching on external changes
        if (currentUser) {
          DB.fetchData(false);
        }
      })
      .subscribe();
  } catch (err) {
    console.warn('Gagal mengaktifkan Realtime Supabase:', err);
  }
}

// ── IMAGE COMPRESSION (Client-side HTML5 Canvas) ─────────────
// Mengubah foto 3MB-10MB menjadi ~60KB-120KB agar LocalStorage tidak crash
function compressImage(file, maxWidth = 900, maxHeight = 900, quality = 0.75) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan gambar.'));
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Gagal memproses gambar.'));
      img.src = ev.target.result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas.'));
    reader.readAsDataURL(file);
  });
}

// ── MULTI-KOST SEED DATA GENERATOR (5 CABANG TERPISAH) ─────────
function generateInitialMultiKostData() {
  const bln = thisMonth();

  // CABANG 1: Kost Griya Harmoni (Yogyakarta)
  const kost1 = {
    id: 'kost_1',
    nama: 'Kost Griya Harmoni',
    pemilik: 'Gavin Utomo',
    kota: 'Sleman, Yogyakarta',
    alamat: 'Jl. Kaliurang KM 5, Gg. Megatruh No. 12, Sleman, DI Yogyakarta',
    hp: '081234567890',
    totalKamar: 8,
    bankNama: 'Bank BCA',
    bankRekening: '8465-1234-90',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };
  const kamar1 = [
    { id: 'km_101', no: '101', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed 160x200, Lemari 2 Pintu, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_102', no: '102', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed, Lemari, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_103', no: '103', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_104', no: '104', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_201', no: '201', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_202', no: '202', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_203', no: '203', lantai: '2', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Springbed, Lemari 2 Pintu, Meja Kerja' },
    { id: 'km_204', no: '204', lantai: '2', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur, Lemari, Meja' }
  ];
  const penghuni1 = [
    {
      id: 'p_dimas',
      nama: 'Dimas Prasetyo',
      hp: '081288991122',
      kamar: '101',
      lantai: '1',
      tglMasuk: '2025-08-01',
      nik: '3201123456780001',
      gender: 'Laki-laki',
      tempatLahir: 'Jakarta',
      tglLahir: '2001-05-14',
      alamatKtp: 'Jl. Tebet Barat Dalam No. 45, Jakarta Selatan',
      email: 'dimas@sikost.id',
      pekerjaan: 'Mahasiswa Teknik Sipil UGM',
      status: 'aktif',
      kendaraan: 'motor',
      merk1: 'Honda Vario 160',
      plat1: 'B 3456 TXY',
      sewa: 1500000,
      tempo: 5,
      deposit: 500000,
      catatanDeposit: 'Uang jaminan kunci & remote AC',
      catatanBayar: 'Termasuk iuran sampah',
      daruratNama: 'Bambang Prasetyo',
      daruratHub: 'Orang Tua',
      daruratHp: '081122334455',
      daruratAlamat: 'Jakarta Selatan'
    },
    {
      id: 'p_anisa',
      nama: 'Anisa Rahmawati',
      hp: '085712345678',
      kamar: '102',
      lantai: '1',
      tglMasuk: '2025-06-15',
      nik: '3302198765430002',
      gender: 'Perempuan',
      tempatLahir: 'Semarang',
      tglLahir: '1999-10-22',
      alamatKtp: 'Jl. Pandanaran No. 18, Semarang',
      email: 'anisa.rahma@techcorp.com',
      pekerjaan: 'Software Engineer Tokopedia',
      status: 'aktif',
      kendaraan: 'mobil',
      merk1: 'Honda Brio RS',
      plat1: 'AB 1234 CD',
      sewa: 1500000,
      tempo: 1,
      deposit: 500000,
      catatanDeposit: 'Uang jaminan fasilitas kamar',
      daruratNama: 'Sri Wahyuni',
      daruratHub: 'Orang Tua',
      daruratHp: '081399001122',
      daruratAlamat: 'Semarang'
    },
    {
      id: 'p_rizky',
      nama: 'Rizky Fauzi',
      hp: '081399887766',
      kamar: '103',
      lantai: '1',
      tglMasuk: '2025-09-01',
      nik: '3273112233440003',
      gender: 'Laki-laki',
      tempatLahir: 'Bandung',
      tglLahir: '2000-03-08',
      alamatKtp: 'Jl. Dago Asri No. 7, Bandung',
      email: 'rizky.fauzi.design@gmail.com',
      pekerjaan: 'Freelance UI/UX Designer',
      status: 'aktif',
      kendaraan: 'motor',
      merk1: 'Yamaha NMAX',
      plat1: 'D 4821 KLO',
      sewa: 950000,
      tempo: 10,
      deposit: 300000,
      catatanDeposit: 'Lunas',
      daruratNama: 'Hendrawan',
      daruratHub: 'Saudara',
      daruratHp: '081566778899',
      daruratAlamat: 'Bandung'
    },
    {
      id: 'p_kevin',
      nama: 'Kevin Sanjaya',
      hp: '082155443322',
      kamar: '201',
      lantai: '2',
      tglMasuk: '2025-04-10',
      nik: '3171056677880004',
      gender: 'Laki-laki',
      tempatLahir: 'Surabaya',
      tglLahir: '1997-12-05',
      alamatKtp: 'Jl. Dharmahusada Indah No. 20, Surabaya',
      email: 'kevin.sanjaya@startup.io',
      pekerjaan: 'Product Manager FinTech',
      status: 'aktif',
      kendaraan: 'mobil',
      merk1: 'Toyota Yaris GR Sport',
      plat1: 'L 9012 EFG',
      sewa: 1850000,
      tempo: 1,
      deposit: 500000,
      catatanDeposit: 'Disimpan',
      daruratNama: 'Gunawan Sanjaya',
      daruratHub: 'Orang Tua',
      daruratHp: '081299887700',
      daruratAlamat: 'Surabaya'
    },
    {
      id: 'p_nadya',
      nama: 'dr. Nadya Aurelia',
      hp: '081877665544',
      kamar: '202',
      lantai: '2',
      tglMasuk: '2025-07-01',
      nik: '3578012345670005',
      gender: 'Perempuan',
      tempatLahir: 'Malang',
      tglLahir: '1996-08-17',
      alamatKtp: 'Jl. Ijen No. 34, Malang',
      email: 'nadya.aurelia.md@rsup.go.id',
      pekerjaan: 'Dokter Residen RSUP Sardjito',
      status: 'aktif',
      kendaraan: 'motor & mobil',
      merk1: 'Honda Scoopy',
      plat1: 'N 2345 HIJ',
      merk2: 'Mazda 2 Hatchback',
      plat2: 'N 6789 KLM',
      sewa: 1850000,
      tempo: 5,
      deposit: 500000,
      daruratNama: 'Prof. dr. Bambang Aurelius',
      daruratHub: 'Orang Tua',
      daruratHp: '081133445566',
      daruratAlamat: 'Malang'
    },
    {
      id: 'p_fajar',
      nama: 'Fajar Nugroho',
      hp: '085233445566',
      kamar: '203',
      lantai: '2',
      tglMasuk: '2025-10-01',
      nik: '3374023456780006',
      gender: 'Laki-laki',
      tempatLahir: 'Solo',
      tglLahir: '2002-01-30',
      alamatKtp: 'Jl. Slamet Riyadi No. 112, Surakarta',
      email: 'fajar.nugroho@student.ugm.ac.id',
      pekerjaan: 'Mahasiswa Fakultas Hukum UGM',
      status: 'aktif',
      kendaraan: 'tidak ada',
      sewa: 1500000,
      tempo: 1,
      deposit: 500000,
      daruratNama: 'Widodo Nugroho',
      daruratHub: 'Orang Tua',
      daruratHp: '085211223344',
      daruratAlamat: 'Solo'
    }
  ];
  const pembayaran1 = [
    { id: 'pb_1', penghuniId: 'p_dimas', bulan: bln, jumlah: 1500000, status: 'lunas', tglBayar: `${bln}-03T09:30:00Z` },
    { id: 'pb_2', penghuniId: 'p_anisa', bulan: bln, jumlah: 1500000, status: 'lunas', tglBayar: `${bln}-01T14:15:00Z` },
    { id: 'pb_3', penghuniId: 'p_kevin', bulan: bln, jumlah: 1850000, status: 'lunas', tglBayar: `${bln}-01T10:00:00Z` }
  ];
  const pengeluaran1 = [
    { id: 'exp_1_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 650000, keterangan: 'Beli token listrik utama & pompa air Yogya', createdBy: 'Gavin Utomo' },
    { id: 'exp_1_2', tanggal: `${bln}-03`, kategori: 'WiFi/Internet', jumlah: 450000, keterangan: 'Langganan Indihome 100 Mbps Sleman', createdBy: 'Gavin Utomo' },
    { id: 'exp_1_3', tanggal: `${bln}-05`, kategori: 'Kebersihan/Sampah', jumlah: 150000, keterangan: 'Iuran sampah RT & kebersihan lorong', createdBy: 'Gavin Utomo' },
    { id: 'exp_1_4', tanggal: `${bln}-07`, kategori: 'Perbaikan/Maintenance', jumlah: 250000, keterangan: 'Servis kran air wastafel lantai 1', createdBy: 'Gavin Utomo' }
  ];
  const keluhan1 = [
    { id: 'klh_1_1', penghuniId: 'p_rizky', kamar: '103', judul: 'Kran kamar mandi menetes terus', kategori: 'Air/Plumbing', deskripsi: 'Kran air di kamar mandi tidak bisa ditutup rapat, menetes semalaman.', status: 'selesai', responManager: 'Kran sudah diganti dengan yang baru oleh tukang ledeng tgl 7.', tglLapor: `${bln}-06T10:00:00Z`, tglSelesai: `${bln}-07T14:00:00Z` },
    { id: 'klh_1_2', penghuniId: 'p_dimas', kamar: '101', judul: 'Remote AC baterai habis & AC kurang dingin', kategori: 'AC', deskripsi: 'Remote AC tidak merespon saat ditekan.', status: 'diproses', responManager: 'Teknisi AC dijadwalkan cuci AC besok.', tglLapor: `${bln}-10T12:30:00Z`, tglSelesai: null }
  ];


  // CABANG 2: Kost Graha Asri Dago (Bandung)
  const kost2 = {
    id: 'kost_2',
    nama: 'Kost Graha Asri Dago',
    pemilik: 'Gavin Utomo',
    kota: 'Dago, Bandung',
    alamat: 'Jl. Cisitu Lama No. 28, Dago, Coblong, Kota Bandung, Jawa Barat',
    hp: '081388224411',
    totalKamar: 8,
    bankNama: 'Bank Mandiri',
    bankRekening: '131-00-9876543-1',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };
  const kamar2 = [
    { id: 'km_2_A01', no: 'A-01', lantai: '1', tipe: 'Studio Dago', harga: 1700000, fasilitas: 'AC, Kasur Queen Size, Meja Belajar Kayu Jati, Kamar Mandi Dalam' },
    { id: 'km_2_A02', no: 'A-02', lantai: '1', tipe: 'Studio Dago', harga: 1700000, fasilitas: 'AC, Kasur Queen Size, Lemari Pakaian, Water Heater' },
    { id: 'km_2_A03', no: 'A-03', lantai: '1', tipe: 'Deluxe Asri', harga: 1600000, fasilitas: 'AC, Kasur Springbed, Meja Kerja, KM Dalam' },
    { id: 'km_2_A04', no: 'A-04', lantai: '1', tipe: 'Standar Bandung', harga: 1200000, fasilitas: 'Exhaust Fan, Kasur Busa, Lemari, KM Luar' },
    { id: 'km_2_B01', no: 'B-01', lantai: '2', tipe: 'Executive Suite', harga: 1950000, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Bukit Dago' },
    { id: 'km_2_B02', no: 'B-02', lantai: '2', tipe: 'Executive Suite', harga: 1950000, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Dago' },
    { id: 'km_2_B03', no: 'B-03', lantai: '2', tipe: 'Deluxe Asri', harga: 1600000, fasilitas: 'AC, Kasur Springbed, Lemari 2 Pintu' },
    { id: 'km_2_B04', no: 'B-04', lantai: '2', tipe: 'Standar Bandung', harga: 1200000, fasilitas: 'Exhaust Fan, Meja, Lemari' }
  ];
  const penghuni2 = [
    { id: 'p_bdg_arya', nama: 'Arya Pratama', hp: '081211223301', kamar: 'A-01', lantai: '1', tglMasuk: '2025-05-10', nik: '3273010101990001', gender: 'Laki-laki', tempatLahir: 'Bandung', tglLahir: '2001-02-14', alamatKtp: 'Jl. Riau No. 12, Bandung', email: 'arya.pratama@itb.ac.id', pekerjaan: 'Mahasiswa Teknik Informatika ITB', status: 'aktif', sewa: 1700000, tempo: 10, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_bella', nama: 'Bella Safitri', hp: '081211223302', kamar: 'A-02', lantai: '1', tglMasuk: '2025-07-01', nik: '3273010202990002', gender: 'Perempuan', tempatLahir: 'Bogor', tglLahir: '1998-09-20', alamatKtp: 'Jl. Pajajaran No. 44, Bogor', email: 'bella.safitri.arch@gmail.com', pekerjaan: 'Arsitek PT Wijaya Karya', status: 'aktif', sewa: 1700000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_eko', nama: 'Eko Prasetyo', hp: '081211223303', kamar: 'A-03', lantai: '1', tglMasuk: '2025-08-15', nik: '3273010303990003', gender: 'Laki-laki', tempatLahir: 'Cirebon', tglLahir: '2000-11-12', alamatKtp: 'Jl. Tuparev No. 8, Cirebon', email: 'eko.designer@creativeagency.id', pekerjaan: 'Graphic Designer Agensi Bandung', status: 'aktif', sewa: 1600000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_chandra', nama: 'Chandra Wijaya', hp: '081211223304', kamar: 'B-01', lantai: '2', tglMasuk: '2025-04-01', nik: '3273010404990004', gender: 'Laki-laki', tempatLahir: 'Jakarta', tglLahir: '1997-04-25', alamatKtp: 'Jl. Fatmawati No. 9, Jakarta Selatan', email: 'chandra.wijaya@shopee.com', pekerjaan: 'Data Analyst Shopee Bandung Hub', status: 'aktif', sewa: 1950000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_dea', nama: 'Dea Amanda', hp: '081211223305', kamar: 'B-02', lantai: '2', tglMasuk: '2025-06-20', nik: '3273010505990005', gender: 'Perempuan', tempatLahir: 'Sukabumi', tglLahir: '2002-06-18', alamatKtp: 'Jl. Suryakencana No. 15, Sukabumi', email: 'dea.amanda@unpad.ac.id', pekerjaan: 'Mahasiswi FK Universitas Padjadjaran', status: 'aktif', sewa: 1950000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' }
  ];
  const pembayaran2 = [
    { id: 'pb_2_1', penghuniId: 'p_bdg_arya', bulan: bln, jumlah: 1700000, status: 'lunas', tglBayar: `${bln}-05T11:00:00Z` },
    { id: 'pb_2_2', penghuniId: 'p_bdg_chandra', bulan: bln, jumlah: 1950000, status: 'lunas', tglBayar: `${bln}-02T08:30:00Z` },
    { id: 'pb_2_3', penghuniId: 'p_bdg_dea', bulan: bln, jumlah: 1950000, status: 'lunas', tglBayar: `${bln}-04T13:20:00Z` }
  ];
  const pengeluaran2 = [
    { id: 'exp_2_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 720000, keterangan: 'Token listrik gedung utama Dago Bandung', createdBy: 'Gavin Utomo' },
    { id: 'exp_2_2', tanggal: `${bln}-03`, kategori: 'WiFi/Internet', jumlah: 500000, keterangan: 'Biznet Fiber 150 Mbps Dago', createdBy: 'Gavin Utomo' },
    { id: 'exp_2_3', tanggal: `${bln}-06`, kategori: 'Kebersihan/Sampah', jumlah: 200000, keterangan: 'Perawatan taman & kebersihan lorong Dago', createdBy: 'Gavin Utomo' }
  ];
  const keluhan2 = [
    { id: 'klh_2_1', penghuniId: 'p_bdg_chandra', kamar: 'B-01', judul: 'Lampu koridor lantai 2 redup', kategori: 'Listrik', deskripsi: 'Lampu LED koridor depan kamar B-01 berkedip', status: 'selesai', responManager: 'Diganti bohlam LED Philips 14W.', tglLapor: `${bln}-04T18:00:00Z`, tglSelesai: `${bln}-05T10:00:00Z` }
  ];


  // CABANG 3: Kost Puri Indah Tebet (Jakarta Selatan)
  const kost3 = {
    id: 'kost_3',
    nama: 'Kost Puri Indah Tebet',
    pemilik: 'Gavin Utomo',
    kota: 'Tebet, Jakarta Selatan',
    alamat: 'Jl. Tebet Barat Dalam VII No. 14, Tebet, Jakarta Selatan, DKI Jakarta',
    hp: '081199887722',
    totalKamar: 8,
    bankNama: 'Bank BCA',
    bankRekening: '5271-8899-00',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };
  const kamar3 = [
    { id: 'km_3_101', no: '101', lantai: '1', tipe: 'Executive Studio', harga: 2500000, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
    { id: 'km_3_102', no: '102', lantai: '1', tipe: 'Executive Studio', harga: 2500000, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
    { id: 'km_3_103', no: '103', lantai: '1', tipe: 'Deluxe Room', harga: 2200000, fasilitas: 'AC Inverter, Single Bed 120, Lemari 2 Pintu, KM Dalam' },
    { id: 'km_3_201', no: '201', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
    { id: 'km_3_202', no: '202', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
    { id: 'km_3_203', no: '203', lantai: '2', tipe: 'Deluxe Room', harga: 2200000, fasilitas: 'AC, Kasur Springbed, Meja Kerja Ergonomis' },
    { id: 'km_3_301', no: '301', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' },
    { id: 'km_3_302', no: '302', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' }
  ];
  const penghuni3 = [
    { id: 'p_jkt_farhan', nama: 'Farhan Ramadhan', hp: '081122334401', kamar: '101', lantai: '1', tglMasuk: '2025-03-01', nik: '3174010101980001', gender: 'Laki-laki', tempatLahir: 'Jakarta', tglLahir: '1996-08-14', alamatKtp: 'Jl. Rawamangun No. 10, Jakarta Timur', email: 'farhan.ramadhan@mandirisec.co.id', pekerjaan: 'Investment Banker SCBD', status: 'aktif', sewa: 2500000, tempo: 1, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_gita', nama: 'Gita Permata', hp: '081122334402', kamar: '102', lantai: '1', tglMasuk: '2025-05-15', nik: '3174010202980002', gender: 'Perempuan', tempatLahir: 'Surabaya', tglLahir: '1998-03-22', alamatKtp: 'Jl. Manyar Kertoarjo No. 22, Surabaya', email: 'gita.permata@pwc.com', pekerjaan: 'Senior Tax Consultant PwC Indonesia', status: 'aktif', sewa: 2500000, tempo: 1, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_haris', nama: 'Haris Setiawan', hp: '081122334403', kamar: '201', lantai: '2', tglMasuk: '2025-02-01', nik: '3174010303980003', gender: 'Laki-laki', tempatLahir: 'Medan', tglLahir: '1995-12-09', alamatKtp: 'Jl. Gatot Subroto No. 5, Medan', email: 'haris.setiawan@lawfirm.id', pekerjaan: 'Corporate Legal Counsel Kuningan', status: 'aktif', sewa: 2800000, tempo: 5, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_indah', nama: 'Indah Savira', hp: '081122334404', kamar: '202', lantai: '2', tglMasuk: '2025-06-10', nik: '3174010404980004', gender: 'Perempuan', tempatLahir: 'Palembang', tglLahir: '1999-07-30', alamatKtp: 'Jl. Sudirman No. 80, Palembang', email: 'indah.savira@techunicorn.com', pekerjaan: 'HR Business Partner Tech Unicorn', status: 'aktif', sewa: 2800000, tempo: 5, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_joko', nama: 'Joko Triyono', hp: '081122334405', kamar: '301', lantai: '3', tglMasuk: '2025-01-15', nik: '3174010505980005', gender: 'Laki-laki', tempatLahir: 'Solo', tglLahir: '1994-05-18', alamatKtp: 'Jl. Adisucipto No. 100, Solo', email: 'joko.triyono@goto.com', pekerjaan: 'Staff Backend Engineer GoTo', status: 'aktif', sewa: 3000000, tempo: 1, deposit: 1500000, catatanDeposit: 'Lunas' }
  ];
  const pembayaran3 = [
    { id: 'pb_3_1', penghuniId: 'p_jkt_farhan', bulan: bln, jumlah: 2500000, status: 'lunas', tglBayar: `${bln}-01T15:00:00Z` },
    { id: 'pb_3_2', penghuniId: 'p_jkt_haris', bulan: bln, jumlah: 2800000, status: 'lunas', tglBayar: `${bln}-03T11:45:00Z` },
    { id: 'pb_3_3', penghuniId: 'p_jkt_joko', bulan: bln, jumlah: 3000000, status: 'lunas', tglBayar: `${bln}-01T09:15:00Z` }
  ];
  const pengeluaran3 = [
    { id: 'exp_3_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 1450000, keterangan: 'Tagihan PLN pascabayar gedung Tebet', createdBy: 'Gavin Utomo' },
    { id: 'exp_3_2', tanggal: `${bln}-03`, kategori: 'WiFi/Internet', jumlah: 650000, keterangan: 'First Media Corporate Dedicated 200 Mbps', createdBy: 'Gavin Utomo' },
    { id: 'exp_3_3', tanggal: `${bln}-05`, kategori: 'Perbaikan/Maintenance', jumlah: 800000, keterangan: 'Iuran satpam & cleaning service lingkungan Tebet', createdBy: 'Gavin Utomo' }
  ];
  const keluhan3 = [
    { id: 'klh_3_1', penghuniId: 'p_jkt_haris', kamar: '201', judul: 'Suhu air water heater kurang panas', kategori: 'Fasilitas Kamar', deskripsi: 'Pemanas air otomatis mati setelah 2 menit', status: 'selesai', responManager: 'Termostat water heater diservis dan normal kembali.', tglLapor: `${bln}-05T20:00:00Z`, tglSelesai: `${bln}-06T15:00:00Z` }
  ];


  // CABANG 4: Kost Surya Kencana Gubeng (Surabaya)
  const kost4 = {
    id: 'kost_4',
    nama: 'Kost Surya Kencana Gubeng',
    pemilik: 'Gavin Utomo',
    kota: 'Gubeng, Surabaya',
    alamat: 'Jl. Dharmawangsa Barat No. 55, Airlangga, Gubeng, Surabaya, Jawa Timur',
    hp: '081277113399',
    totalKamar: 8,
    bankNama: 'Bank BNI',
    bankRekening: '045-8899-123',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };
  const kamar4 = [
    { id: 'km_4_G01', no: 'G-01', lantai: '1', tipe: 'Modern Compact AC', harga: 1650000, fasilitas: 'AC Daikin 1/2 PK, Springbed, Meja Belajar, KM Dalam Shower' },
    { id: 'km_4_G02', no: 'G-02', lantai: '1', tipe: 'Modern Compact AC', harga: 1650000, fasilitas: 'AC Daikin 1/2 PK, Springbed, Meja Belajar, KM Dalam Shower' },
    { id: 'km_4_G03', no: 'G-03', lantai: '1', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Exhaust Fan, Meja, Lemari 2 Pintu, KM Luar Bersih' },
    { id: 'km_4_G04', no: 'G-04', lantai: '1', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Exhaust Fan, Meja, Lemari 2 Pintu, KM Luar Bersih' },
    { id: 'km_4_U01', no: 'U-01', lantai: '2', tipe: 'Deluxe Airlangga', harga: 1800000, fasilitas: 'AC, Kulkas Pribadi, Kasur King Size, Smart TV 32"' },
    { id: 'km_4_U02', no: 'U-02', lantai: '2', tipe: 'Deluxe Airlangga', harga: 1800000, fasilitas: 'AC, Kulkas Pribadi, Kasur King Size, Smart TV 32"' },
    { id: 'km_4_U03', no: 'U-03', lantai: '2', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Kipas Angin Dinding, Kasur, Meja Belajar' },
    { id: 'km_4_U04', no: 'U-04', lantai: '2', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Kipas Angin Dinding, Kasur, Meja Belajar' }
  ];
  const penghuni4 = [
    { id: 'p_sby_kenzo', nama: 'Kenzo Raditya', hp: '081333445501', kamar: 'G-01', lantai: '1', tglMasuk: '2025-08-01', nik: '3578010101990001', gender: 'Laki-laki', tempatLahir: 'Surabaya', tglLahir: '2001-07-11', alamatKtp: 'Jl. Kertajaya Indah No. 12, Surabaya', email: 'kenzo.raditya@unair.ac.id', pekerjaan: 'Mahasiswa Kedokteran Unair', status: 'aktif', sewa: 1650000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_larasati', nama: 'Larasati Putri', hp: '081333445502', kamar: 'G-02', lantai: '1', tglMasuk: '2025-06-01', nik: '3578010202990002', gender: 'Perempuan', tempatLahir: 'Gresik', tglLahir: '1998-10-15', alamatKtp: 'Jl. RA Kartini No. 30, Gresik', email: 'dr.larasati.p@rssoetomo.go.id', pekerjaan: 'Dokter Muda RSUD Dr. Soetomo', status: 'aktif', sewa: 1650000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_oscar', nama: 'Oscar Ferdinand', hp: '081333445503', kamar: 'G-03', lantai: '1', tglMasuk: '2025-09-10', nik: '3578010303990003', gender: 'Laki-laki', tempatLahir: 'Sidoarjo', tglLahir: '2000-01-20', alamatKtp: 'Jl. Pahlawan No. 4, Sidoarjo', email: 'oscar.kuliner@gmail.com', pekerjaan: 'Owner Cafe & Kuliner Gubeng', status: 'aktif', sewa: 1300000, tempo: 10, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_ilham', nama: 'M. Ilham Fauzan', hp: '081333445504', kamar: 'U-01', lantai: '2', tglMasuk: '2025-05-20', nik: '3578010404990004', gender: 'Laki-laki', tempatLahir: 'Kediri', tglLahir: '2001-09-05', alamatKtp: 'Jl. Dhoho No. 70, Kediri', email: 'ilham.fauzan@its.ac.id', pekerjaan: 'Mahasiswa Teknik Mesin ITS', status: 'aktif', sewa: 1800000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_nadia', nama: 'Nadia Zahrani', hp: '081333445505', kamar: 'U-02', lantai: '2', tglMasuk: '2025-07-15', nik: '3578010505990005', gender: 'Perempuan', tempatLahir: 'Mojokerto', tglLahir: '1999-12-01', alamatKtp: 'Jl. Gajah Mada No. 18, Mojokerto', email: 'nadia.zahrani@ey.com', pekerjaan: 'Senior Auditor KAP Ernst & Young Surabaya', status: 'aktif', sewa: 1800000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' }
  ];
  const pembayaran4 = [
    { id: 'pb_4_1', penghuniId: 'p_sby_kenzo', bulan: bln, jumlah: 1650000, status: 'lunas', tglBayar: `${bln}-03T10:15:00Z` },
    { id: 'pb_4_2', penghuniId: 'p_sby_larasati', bulan: bln, jumlah: 1650000, status: 'lunas', tglBayar: `${bln}-01T16:00:00Z` },
    { id: 'pb_4_3', penghuniId: 'p_sby_ilham', bulan: bln, jumlah: 1800000, status: 'lunas', tglBayar: `${bln}-02T13:40:00Z` }
  ];
  const pengeluaran4 = [
    { id: 'exp_4_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 850000, keterangan: 'Token listrik AC Surabaya musim kemarau', createdBy: 'Gavin Utomo' },
    { id: 'exp_4_2', tanggal: `${bln}-04`, kategori: 'WiFi/Internet', jumlah: 420000, keterangan: 'MyRepublic Ultra Fast 100 Mbps Surabaya', createdBy: 'Gavin Utomo' },
    { id: 'exp_4_3', tanggal: `${bln}-07`, kategori: 'Lainnya', jumlah: 160000, keterangan: 'Isi ulang galon air minum & dispenser lantai 1-2', createdBy: 'Gavin Utomo' }
  ];
  const keluhan4 = [
    { id: 'klh_4_1', penghuniId: 'p_sby_ilham', kamar: 'U-01', judul: 'Galon air dispenser lantai 2 habis', kategori: 'Fasilitas Bersama', deskripsi: 'Dispenser air minum lantai 2 sudah kosong', status: 'selesai', responManager: 'Galon baru sudah diantarkan dan dipasang.', tglLapor: `${bln}-06T09:00:00Z`, tglSelesai: `${bln}-06T11:00:00Z` }
  ];


  // CABANG 5: Kost Cendana Residence (Malang)
  const kost5 = {
    id: 'kost_5',
    nama: 'Kost Cendana Residence',
    pemilik: 'Gavin Utomo',
    kota: 'Lowokwaru, Malang',
    alamat: 'Jl. Bendungan Sigura-gura No. 42, Lowokwaru, Kota Malang, Jawa Timur',
    hp: '081544228866',
    totalKamar: 8,
    bankNama: 'Bank BRI',
    bankRekening: '0038-01-029384-50-2',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };
  const kamar5 = [
    { id: 'km_5_01', no: '01', lantai: '1', tipe: 'Panorama View', harga: 1350000, fasilitas: 'Kasur Springbed Comfort, Meja Belajar Besar, Lemari 2 Pintu, KM Dalam' },
    { id: 'km_5_02', no: '02', lantai: '1', tipe: 'Panorama View', harga: 1350000, fasilitas: 'Kasur Springbed Comfort, Meja Belajar Besar, Lemari 2 Pintu, KM Dalam' },
    { id: 'km_5_03', no: '03', lantai: '1', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Busa Tebal, Meja, Lemari, KM Luar Bersih' },
    { id: 'km_5_04', no: '04', lantai: '1', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Busa Tebal, Meja, Lemari, KM Luar Bersih' },
    { id: 'km_5_05', no: '05', lantai: '2', tipe: 'Balkon Gunung', harga: 1450000, fasilitas: 'Kasur Queen, Balkon Hadap Gunung Panderman, Meja Belajar, KM Dalam' },
    { id: 'km_5_06', no: '06', lantai: '2', tipe: 'Balkon Gunung', harga: 1450000, fasilitas: 'Kasur Queen, Balkon Hadap Gunung Panderman, Meja Belajar, KM Dalam' },
    { id: 'km_5_07', no: '07', lantai: '2', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Springbed, Meja Kayu Pinus, Lemari' },
    { id: 'km_5_08', no: '08', lantai: '2', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Springbed, Meja Kayu Pinus, Lemari' }
  ];
  const penghuni5 = [
    { id: 'p_mlg_putri', nama: 'Putri Maharani', hp: '081555667701', kamar: '01', lantai: '1', tglMasuk: '2025-08-15', nik: '3573010101990001', gender: 'Perempuan', tempatLahir: 'Malang', tglLahir: '2002-04-03', alamatKtp: 'Jl. Soekarno Hatta No. 8, Malang', email: 'putri.maharani@student.ub.ac.id', pekerjaan: 'Mahasiswi FIA Universitas Brawijaya', status: 'aktif', sewa: 1350000, tempo: 1, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_qori', nama: 'Qori Alamsyah', hp: '081555667702', kamar: '02', lantai: '1', tglMasuk: '2025-07-01', nik: '3573010202990002', gender: 'Laki-laki', tempatLahir: 'Probolinggo', tglLahir: '2001-08-25', alamatKtp: 'Jl. Panglima Sudirman No. 14, Probolinggo', email: 'qori.alamsyah@polinema.ac.id', pekerjaan: 'Mahasiswa TI Polinema Malang', status: 'aktif', sewa: 1350000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_rendy', nama: 'Rendy Pratama', hp: '081555667703', kamar: '03', lantai: '1', tglMasuk: '2025-09-01', nik: '3573010303990003', gender: 'Laki-laki', tempatLahir: 'Pasuruan', tglLahir: '2000-02-17', alamatKtp: 'Jl. Hayam Wuruk No. 5, Pasuruan', email: 'rendy.coffee@gmail.com', pekerjaan: 'Head Barista Coffee Shop Suhat', status: 'aktif', sewa: 1150000, tempo: 10, deposit: 300000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_salsabila', nama: 'Salsabila Nur', hp: '081555667704', kamar: '05', lantai: '2', tglMasuk: '2025-06-10', nik: '3573010404990004', gender: 'Perempuan', tempatLahir: 'Blitar', tglLahir: '2002-10-10', alamatKtp: 'Jl. Merdeka No. 90, Blitar', email: 'salsabila.nur@um.ac.id', pekerjaan: 'Mahasiswi Sastra Inggris UM', status: 'aktif', sewa: 1450000, tempo: 1, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_taufik', nama: 'Taufik Hidayat', hp: '081555667705', kamar: '06', lantai: '2', tglMasuk: '2025-05-01', nik: '3573010505990005', gender: 'Laki-laki', tempatLahir: 'Tulungagung', tglLahir: '1998-05-20', alamatKtp: 'Jl. Diponegoro No. 33, Tulungagung', email: 'taufik.freelance@gmail.com', pekerjaan: 'Freelance Fullstack Web Developer', status: 'aktif', sewa: 1450000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' }
  ];
  const pembayaran5 = [
    { id: 'pb_5_1', penghuniId: 'p_mlg_putri', bulan: bln, jumlah: 1350000, status: 'lunas', tglBayar: `${bln}-01T11:00:00Z` },
    { id: 'pb_5_2', penghuniId: 'p_mlg_salsabila', bulan: bln, jumlah: 1450000, status: 'lunas', tglBayar: `${bln}-02T15:20:00Z` },
    { id: 'pb_5_3', penghuniId: 'p_mlg_taufik', bulan: bln, jumlah: 1450000, status: 'lunas', tglBayar: `${bln}-03T09:40:00Z` }
  ];
  const pengeluaran5 = [
    { id: 'exp_5_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 550000, keterangan: 'Token listrik pompa & penerangan Malang', createdBy: 'Gavin Utomo' },
    { id: 'exp_5_2', tanggal: `${bln}-04`, kategori: 'WiFi/Internet', jumlah: 380000, keterangan: 'Indihome 100 Mbps Lowokwaru', createdBy: 'Gavin Utomo' },
    { id: 'exp_5_3', tanggal: `${bln}-06`, kategori: 'Kebersihan/Sampah', jumlah: 120000, keterangan: 'Iuran kebersihan RT & pembuangan sampah', createdBy: 'Gavin Utomo' }
  ];
  const keluhan5 = [
    { id: 'klh_5_1', penghuniId: 'p_mlg_salsabila', kamar: '05', judul: 'Gantungan jemuran balkon perlu diperkuat', kategori: 'Balkon', deskripsi: 'Tali kawat jemuran di balkon kamar 05 kendur', status: 'selesai', responManager: 'Kawat jemuran diganti kawat baja baru.', tglLapor: `${bln}-05T14:00:00Z`, tglSelesai: `${bln}-06T10:00:00Z` }
  ];


  const properties = [
    { id: 'kost_1', nama: kost1.nama, kota: kost1.kota, alamat: kost1.alamat, hp: kost1.hp, pemilik: kost1.pemilik, totalKamar: kost1.totalKamar },
    { id: 'kost_2', nama: kost2.nama, kota: kost2.kota, alamat: kost2.alamat, hp: kost2.hp, pemilik: kost2.pemilik, totalKamar: kost2.totalKamar },
    { id: 'kost_3', nama: kost3.nama, kota: kost3.kota, alamat: kost3.alamat, hp: kost3.hp, pemilik: kost3.pemilik, totalKamar: kost3.totalKamar },
    { id: 'kost_4', nama: kost4.nama, kota: kost4.kota, alamat: kost4.alamat, hp: kost4.hp, pemilik: kost4.pemilik, totalKamar: kost4.totalKamar },
    { id: 'kost_5', nama: kost5.nama, kota: kost5.kota, alamat: kost5.alamat, hp: kost5.hp, pemilik: kost5.pemilik, totalKamar: kost5.totalKamar }
  ];

  const propertiesData = {
    kost_1: { kost: kost1, kamar: kamar1, penghuni: penghuni1, pembayaran: pembayaran1, pengeluaran: pengeluaran1, keluhan: keluhan1 },
    kost_2: { kost: kost2, kamar: kamar2, penghuni: penghuni2, pembayaran: pembayaran2, pengeluaran: pengeluaran2, keluhan: keluhan2 },
    kost_3: { kost: kost3, kamar: kamar3, penghuni: penghuni3, pembayaran: pembayaran3, pengeluaran: pengeluaran3, keluhan: keluhan3 },
    kost_4: { kost: kost4, kamar: kamar4, penghuni: penghuni4, pembayaran: pembayaran4, pengeluaran: pengeluaran4, keluhan: keluhan4 },
    kost_5: { kost: kost5, kamar: kamar5, penghuni: penghuni5, pembayaran: pembayaran5, pengeluaran: pengeluaran5, keluhan: keluhan5 }
  };

  return { properties, propertiesData };
}

// ── DEMO SEED DATA GENERATOR ─────────────────────────────────
function seedDemoData(force = false) {
  if (!force && S.propertiesData && S.propertiesData.kost_1 && S.propertiesData.kost_5) return;

  // Cek apakah ada data yang tersimpan sebelumnya di localStorage
  if (!force && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('sk3_properties_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.kost_1 && parsed.kost_5) {
          S.propertiesData = parsed;
          return;
        }
      } catch {}
    }
  }

  const initData = generateInitialMultiKostData();
  S.properties = initData.properties;
  S.propertiesData = initData.propertiesData;
  S.activeKostId = S.activeKostId || 'kost_1';

  const cur = S.propertiesData[S.activeKostId] || S.propertiesData.kost_1;
  S.kost = { ...cur.kost };
  S.kamar = [...cur.kamar];
  S.penghuni = [...cur.penghuni];
  S.pembayaran = [...cur.pembayaran];
  S.pengeluaran = [...cur.pengeluaran];
  S.keluhan = [...cur.keluhan];

  S.akun = [
    { id: 'akun_mgr_gavin', nama: 'Gavin Utomo (Owner)', email: 'gavinutomo4@gmail.com', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'manager', penghuniId: null },
    { id: 'akun_mgr_prasada', nama: 'Prasada Utomo (Manager)', email: 'prasadautomo@gmail.com', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'manager', penghuniId: null }
  ];

  LS.save();
}

// ── MULTI-KOST SWITCHER & HANDLERS ────────────────────────────
function switchKost(targetKostId) {
  if (!S.propertiesData || !S.propertiesData[targetKostId]) {
    console.warn('Cabang kost tidak ditemukan:', targetKostId);
    return;
  }

  // 1. Simpan data aktif saat ini ke bucket cabangnya
  if (S.activeKostId && S.propertiesData[S.activeKostId]) {
    S.propertiesData[S.activeKostId] = {
      kost: { ...S.kost },
      penghuni: [...S.penghuni],
      kamar: [...S.kamar],
      pembayaran: [...S.pembayaran],
      pengeluaran: [...S.pengeluaran],
      keluhan: [...S.keluhan]
    };
  }

  // 2. Muat cabang sasaran
  S.activeKostId = targetKostId;
  const target = S.propertiesData[targetKostId];
  S.kost = { ...target.kost };
  S.penghuni = [...target.penghuni];
  S.kamar = [...target.kamar];
  S.pembayaran = [...target.pembayaran];
  S.pengeluaran = [...target.pengeluaran];
  S.keluhan = [...target.keluhan];

  // 3. Simpan state terisolasi
  LS.save();

  // 4. Update UI labels & dropdown
  updatePropertySwitcherUI();

  // 5. Tutup dropdown bila terbuka
  const dd = $('property-dropdown-menu');
  const btn = $('btn-property-switch');
  if (dd) dd.style.display = 'none';
  if (btn) btn.classList.remove('open');

  // 6. Refresh halaman yang sedang aktif
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'dashboard';
  navigateTo(activePage);

  toast(`🏢 Beralih ke ${S.kost.nama} (${target.kost.kota || target.kost.alamat.split(',')[0]})`, 'success');
}
window.switchKost = switchKost;

function updatePropertySwitcherUI() {
  const activeNameEl = $('topbar-prop-name');
  const activeLocEl = $('topbar-prop-loc');
  const sbNameEl = $('sb-kost-name');
  const sbLocEl = $('sb-kost-loc');

  const locText = '📍 ' + (S.kost.kota || (S.kost.alamat ? S.kost.alamat.split(',')[0] : 'Indonesia'));

  if (activeNameEl) activeNameEl.textContent = S.kost.nama || 'SiKost';
  if (activeLocEl)  activeLocEl.textContent  = locText;
  if (sbNameEl)     sbNameEl.textContent     = S.kost.nama || 'SiKost';
  if (sbLocEl)      sbLocEl.textContent      = locText;

  const switcherWrap = $('topbar-property-selector');
  if (switcherWrap) {
    switcherWrap.style.display = (currentUser?.role === 'manager') ? 'block' : 'none';
  }

  const ddList = $('prop-dd-list');
  if (ddList && S.propertiesData) {
    ddList.innerHTML = (S.properties || []).map(p => {
      const data = S.propertiesData[p.id];
      if (!data) return '';
      const isActive = p.id === S.activeKostId;
      const penghuniCount = (data.penghuni || []).filter(x => x.status === 'aktif').length;
      const totalKamar = data.kost?.totalKamar || (data.kamar ? data.kamar.length : 8);

      return `
        <div class="prop-dd-item ${isActive ? 'active' : ''}" onclick="switchKost('${p.id}')">
          <div class="prop-dd-item-icon">🏢</div>
          <div class="prop-dd-item-info">
            <div class="prop-dd-item-name">${data.kost.nama}</div>
            <div class="prop-dd-item-loc">📍 ${data.kost.kota || data.kost.alamat.split(',')[0]}</div>
            <div class="prop-dd-item-meta">${penghuniCount} Penghuni Aktif · ${totalKamar} Kamar</div>
          </div>
          ${isActive ? '<span class="badge badge-accent" style="font-size:0.68rem">Aktif</span>' : ''}
        </div>
      `;
    }).join('');
  }

  renderMultiKostCards();
  renderSettingsCabangList();
}
window.updatePropertySwitcherUI = updatePropertySwitcherUI;

function renderMultiKostCards() {
  const container = $('multi-kost-cards-grid');
  if (!container || !S.propertiesData) return;

  container.innerHTML = (S.properties || []).map(p => {
    const data = S.propertiesData[p.id];
    if (!data) return '';
    const isActive = p.id === S.activeKostId;
    const aktifPenghuni = (data.penghuni || []).filter(x => x.status === 'aktif');
    const terisiCount = [...new Set(aktifPenghuni.map(x => x.kamar).filter(Boolean))].length;
    const totalKamar = data.kost?.totalKamar || (data.kamar ? data.kamar.length : 8);
    const targetPendapatan = aktifPenghuni.reduce((sum, x) => sum + (Number(x.sewa) || 0), 0);
    const pct = totalKamar > 0 ? Math.round((terisiCount / totalKamar) * 100) : 0;

    return `
      <div class="kost-branch-card ${isActive ? 'active-branch' : ''}">
        <div class="branch-card-header">
          <div class="branch-card-icon">🏢</div>
          <div style="flex:1;min-width:0">
            <div class="branch-card-title">${data.kost.nama}</div>
            <div class="branch-card-loc">📍 ${data.kost.kota || data.kost.alamat.split(',')[0]}</div>
          </div>
          ${isActive ? '<span class="badge badge-accent" style="font-size:0.68rem">✓ Aktif</span>' : ''}
        </div>
        
        <div class="branch-card-stats">
          <div>
            <div style="color:var(--text-3);font-size:0.7rem">Okupansi</div>
            <div style="font-weight:800;color:var(--text)">${terisiCount} / ${totalKamar} (${pct}%)</div>
          </div>
          <div style="text-align:right">
            <div style="color:var(--text-3);font-size:0.7rem">Target Sewa</div>
            <div style="font-weight:800;color:var(--green)">${rp(targetPendapatan)}</div>
          </div>
        </div>

        <button type="button" class="branch-card-btn ${isActive ? 'btn-ghost' : 'btn-primary'}" onclick="switchKost('${p.id}')">
          ${isActive ? '✓ Sedang Dikelola' : 'Kelola Cabang Ini ⚡'}
        </button>
      </div>
    `;
  }).join('');
}
window.renderMultiKostCards = renderMultiKostCards;

function renderSettingsCabangList() {
  const container = $('settings-cabang-list');
  if (!container || !S.propertiesData) return;

  container.innerHTML = (S.properties || []).map(p => {
    const data = S.propertiesData[p.id];
    if (!data) return '';
    const isActive = p.id === S.activeKostId;
    const aktifPenghuni = (data.penghuni || []).filter(x => x.status === 'aktif');
    const terisiCount = [...new Set(aktifPenghuni.map(x => x.kamar).filter(Boolean))].length;
    const totalKamar = data.kost?.totalKamar || (data.kamar ? data.kamar.length : 8);

    return `
      <div class="panel" style="padding:16px 20px;border-radius:12px;background:var(--surface-2);border:${isActive ? '2px solid var(--accent)' : '1px solid var(--border)'}">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:44px;height:44px;border-radius:12px;background:var(--surface);display:flex;align-items:center;justify-content:center;font-size:1.4rem;border:1px solid var(--border)">🏢</div>
            <div>
              <div style="font-weight:800;font-size:1.02rem;color:var(--text)">
                ${data.kost.nama} 
                ${isActive ? '<span class="badge badge-accent" style="margin-left:6px;font-size:0.7rem">Sedang Aktif</span>' : ''}
              </div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:2px">📍 ${data.kost.alamat}</div>
              <div style="font-size:0.74rem;color:var(--text-2);margin-top:2px">
                Okupansi: <strong>${terisiCount}/${totalKamar} kamar terisi</strong> · 📞 Telp/WA: ${data.kost.hp || '–'} · 🏦 ${data.kost.bankNama || 'Bank'}: ${data.kost.bankRekening || '–'} (a.n ${data.kost.bankAtasNama || '–'})
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn-outline btn-sm" onclick="openEditCabang('${p.id}')">✏️ Edit Info</button>
            <button class="btn-primary btn-sm" onclick="switchKost('${p.id}')">
              ${isActive ? '✓ Sedang Dikelola' : 'Beralih ke Cabang Ini ⚡'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderSettingsCabangList = renderSettingsCabangList;

// ── STORAGE ──────────────────────────────────────────────────
const LS = {
  save() {
    try {
      // Sinkronkan data cabang yang sedang aktif ke dalam bucket propertiesData
      if (S.activeKostId && S.propertiesData) {
        S.propertiesData[S.activeKostId] = {
          kost: { ...S.kost },
          penghuni: [...S.penghuni],
          kamar: [...S.kamar],
          pembayaran: [...S.pembayaran],
          pengeluaran: [...S.pengeluaran],
          keluhan: [...S.keluhan]
        };
      }

      // Sinkronkan ke daftar properties (5 cabang)
      if (Array.isArray(S.properties) && S.activeKostId && S.kost) {
        const prop = S.properties.find(p => p.id === S.activeKostId);
        if (prop) {
          prop.nama = S.kost.nama || prop.nama;
          prop.pemilik = S.kost.pemilik || prop.pemilik;
          prop.alamat = S.kost.alamat || prop.alamat;
          prop.hp = S.kost.hp || prop.hp;
          prop.totalKamar = S.kost.totalKamar || prop.totalKamar;
          prop.kota = S.kost.kota || (S.kost.alamat ? S.kost.alamat.split(',')[0].trim() : prop.kota);
        }
      }

      localStorage.setItem('sk3_properties_data', JSON.stringify(S.propertiesData));
      localStorage.setItem('sk3_active_kost_id',  S.activeKostId || 'kost_1');
      localStorage.setItem('sk3_properties',       JSON.stringify(S.properties));

      // Simpan cabang aktif ke key standar untuk kompatibilitas test runner & modul
      localStorage.setItem('sk3_penghuni',    JSON.stringify(S.penghuni));
      localStorage.setItem('sk3_kamar',       JSON.stringify(S.kamar));
      localStorage.setItem('sk3_pembayaran',  JSON.stringify(S.pembayaran));
      localStorage.setItem('sk3_pengeluaran', JSON.stringify(S.pengeluaran));
      localStorage.setItem('sk3_keluhan',     JSON.stringify(S.keluhan));
      localStorage.setItem('sk3_akun',        JSON.stringify(S.akun));
      localStorage.setItem('sk3_kost',        JSON.stringify(S.kost));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }
  },
  load() {
    const rawPropertiesData = localStorage.getItem('sk3_properties_data');
    const savedActiveId = localStorage.getItem('sk3_active_kost_id');
    const rawKost = localStorage.getItem('sk3_kost');

    if (rawPropertiesData) {
      try {
        S.propertiesData = JSON.parse(rawPropertiesData);
        S.activeKostId = savedActiveId || 'kost_1';
        const rawProps = localStorage.getItem('sk3_properties');
        if (rawProps) S.properties = JSON.parse(rawProps);

        if (!S.propertiesData.kost_1 || !S.propertiesData.kost_5) {
          seedDemoData(true);
        } else {
          const cur = S.propertiesData[S.activeKostId] || S.propertiesData.kost_1;
          S.kost = { ...cur.kost };

          // Muat override sk3_kost mandiri jika ada
          if (rawKost) {
            try {
              const parsedKost = JSON.parse(rawKost);
              if (parsedKost && parsedKost.nama) {
                S.kost = { ...S.kost, ...parsedKost };
                if (S.propertiesData[S.activeKostId]) {
                  S.propertiesData[S.activeKostId].kost = { ...S.kost };
                }
              }
            } catch {}
          }

          S.penghuni = cur.penghuni || [];
          S.kamar = cur.kamar || [];
          S.pembayaran = cur.pembayaran || [];
          S.pengeluaran = cur.pengeluaran || [];
          S.keluhan = cur.keluhan || [];
        }
      } catch (e) {
        console.warn('Load multi-kost failed, fallback to seed:', e);
        seedDemoData(true);
      }
    } else {
      seedDemoData(true);
    }

    const rawAkun = localStorage.getItem('sk3_akun');
    if (rawAkun) {
      try { S.akun = JSON.parse(rawAkun); } catch {}
    }
  },
  saveSession(u) { localStorage.setItem('sk3_session', JSON.stringify(u)); },
  loadSession()  { const v = localStorage.getItem('sk3_session'); return v ? JSON.parse(v) : null; },
  clearSession() { localStorage.removeItem('sk3_session'); }
};

// Segera muat state saat app.js dievaluasi agar tidak tertimpa
try { LS.load(); } catch (e) { console.warn('Early LS.load warning:', e); }

// ── CRYPTO ────────────────────────────────────────────────────
async function hashPw(pw) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── UTILS ────────────────────────────────────────────────────
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const rp   = n  => 'Rp ' + (Number(n)||0).toLocaleString('id-ID');
const fmtD = s  => s ? new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}) : '–';
const init = n  => (n||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
const esc  = s  => (s == null ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
const ageOf = tgl => {
  if (!tgl) return null;
  const d=new Date(tgl), now=new Date();
  let a=now.getFullYear()-d.getFullYear();
  if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate())) a--;
  return a;
};
const durasi = tgl => {
  if (!tgl) return '–';
  const hari=Math.floor((Date.now()-new Date(tgl))/86400000);
  if(hari<30) return hari+' hari';
  if(hari<365) return Math.floor(hari/30)+' bulan';
  return Math.floor(hari/365)+' tahun '+Math.floor((Math.floor(hari/30))%12)+' bulan';
};
function thisMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
window.thisMonth = thisMonth;
window.todayYMD = todayYMD;
window.rp = rp;

// Terbilang Rupiah Helper (untuk Kwitansi Resmi)
function terbilang(n) {
  n = Math.floor(Math.abs(Number(n) || 0));
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  if (n < 12) return huruf[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  return terbilang(Math.floor(n / 1000000000)) + ' Miliar ' + terbilang(n % 1000000000);
}

// NIK Masking Helper (Melindungi Privasi UU PDP)
function maskNik(nik, id) {
  if (!nik) return '–';
  if (unmaskedNiks.has(id)) {
    return `${nik} <button class="nik-toggle-btn" onclick="toggleMaskNik('${id}')" title="Sembunyikan NIK">👁️ Tutup</button>`;
  }
  const clean = String(nik).trim();
  const masked = clean.length > 8 ? clean.slice(0, 4) + '••••••••' + clean.slice(-4) : '••••••••••••';
  return `<span class="nik-masked">${masked}</span> <button class="nik-toggle-btn" onclick="toggleMaskNik('${id}')" title="Lihat NIK">👁️ Buka</button>`;
}

window.toggleMaskNik = function(id) {
  if (unmaskedNiks.has(id)) unmaskedNiks.delete(id);
  else unmaskedNiks.add(id);
  renderPenghuni();
};

function toast(msg, type='ok') {
  const w = $('toast-wrap') || document.body;
  const el = document.createElement('div');
  el.className = 'toast ' + (type === 'err' ? 'err' : type === 'ok' ? 'ok' : '');
  el.textContent = msg;
  w.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = '0.3s';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

function confirm_dlg(title, msg, cb, btnLabel='Ya, Lanjutkan') {
  $('confirm-title').textContent = title;
  $('confirm-message').textContent = msg;
  $('confirm-ok').textContent = btnLabel;
  confirmCb = cb;
  openModal('modal-confirm');
}

const $ = id => document.getElementById(id);
const openModal  = id => { const el=$(id); if(el) el.classList.add('open'); };
const closeModal = id => { const el=$(id); if(el) el.classList.remove('open'); };

// ── PASSWORD TOGGLE ──────────────────────────────────────────
document.addEventListener('click', e => {
  const btn = e.target.closest('.pw-eye');
  if (!btn) return;
  const inp = $(btn.dataset.target);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.textContent = inp.type === 'password' ? '👁' : '🙈';
});

// ── SCREEN ROUTING ────────────────────────────────────────────
function showScreen(name) {
  ['screen-login', 'screen-app'].forEach(id => {
    const el = $(id); if (el) el.style.display = 'none';
  });
  const target = $(name); if (target) target.style.display = 'flex';
}

// ── MAPPERS (JS State <-> Supabase DB) ────────────────────────
function mapPenghuniToDb(p) {
  return {
    id: p.id,
    nama: p.nama || '',
    hp: p.hp || '',
    kamar: p.kamar || '',
    tgl_masuk: p.tglMasuk || '',
    nik: p.nik || '',
    gender: p.gender || '',
    tempat_lahir: p.tempatLahir || '',
    tgl_lahir: p.tglLahir || null,
    alamat_ktp: p.alamatKtp || '',
    email: p.email || '',
    pekerjaan: p.pekerjaan || '',
    lantai: p.lantai || '',
    tgl_keluar: p.tglKeluar || null,
    status: p.status || 'aktif',
    catatan: p.catatan || '',
    kendaraan: p.kendaraan || 'tidak ada',
    merk1: p.merk1 || '',
    plat1: p.plat1 || '',
    merk2: p.merk2 || '',
    plat2: p.plat2 || '',
    sewa: Number(p.sewa) || 0,
    tempo: p.tempo || '',
    catatan_bayar: p.catatanBayar || '',
    deposit: Number(p.deposit) || 0,
    catatan_deposit: p.catatanDeposit || '',
    darurat_nama: p.daruratNama || '',
    darurat_hub: p.daruratHub || '',
    darurat_hp: p.daruratHp || '',
    darurat_alamat: p.daruratAlamat || '',
    foto: p.foto || null,
    foto_ktp: p.fotoKtp || null,
    updated_at: new Date().toISOString()
  };
}

function mapPenghuniFromDb(r) {
  return {
    id: r.id,
    nama: r.nama || '',
    hp: r.hp || '',
    kamar: r.kamar || '',
    tglMasuk: r.tgl_masuk || '',
    nik: r.nik || '',
    gender: r.gender || '',
    tempatLahir: r.tempat_lahir || '',
    tglLahir: r.tgl_lahir || '',
    alamatKtp: r.alamat_ktp || '',
    email: r.email || '',
    pekerjaan: r.pekerjaan || '',
    lantai: r.lantai || '',
    tglKeluar: r.tgl_keluar || '',
    status: r.status || 'aktif',
    catatan: r.catatan || '',
    kendaraan: r.kendaraan || 'tidak ada',
    merk1: r.merk1 || '',
    plat1: r.plat1 || '',
    merk2: r.merk2 || '',
    plat2: r.plat2 || '',
    sewa: Number(r.sewa) || 0,
    tempo: r.tempo || '',
    catatanBayar: r.catatan_bayar || '',
    deposit: Number(r.deposit) || 0,
    catatanDeposit: r.catatan_deposit || '',
    daruratNama: r.darurat_nama || '',
    daruratHub: r.darurat_hub || '',
    daruratHp: r.darurat_hp || '',
    daruratAlamat: r.darurat_alamat || '',
    foto: r.foto || null,
    fotoKtp: r.foto_ktp || null,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString()
  };
}

function mapBayarToDb(b) {
  return {
    id: b.id,
    penghuni_id: b.penghuniId,
    bulan: b.bulan,
    jumlah: Number(b.jumlah) || 0,
    status: b.status || 'lunas',
    tgl_bayar: b.tglBayar || new Date().toISOString(),
    bukti_transfer: b.buktiTransfer || null,
    catatan_bayar: b.catatanBayar || null,
    denda: Number(b.denda) || 0,
    listrik_extra: Number(b.listrikExtra) || 0,
    verified_at: b.verifiedAt || null
  };
}

function mapBayarFromDb(r) {
  return {
    id: r.id,
    penghuniId: r.penghuni_id,
    bulan: r.bulan,
    jumlah: Number(r.jumlah) || 0,
    status: r.status || 'lunas',
    tglBayar: r.tgl_bayar,
    buktiTransfer: r.bukti_transfer,
    catatanBayar: r.catatan_bayar,
    denda: Number(r.denda) || 0,
    listrikExtra: Number(r.listrik_extra) || 0,
    verifiedAt: r.verified_at
  };
}

// ── DB CLOUD SYNC LAYER ──────────────────────────────────────
const DB = {
  async fetchData(renderNow = true) {
    if (!sbClient) return;
    try {
      // 1. Penghuni
      const { data: pList } = await sbClient.from('penghuni').select('*').order('created_at', { ascending: false });
      if (pList && pList.length > 0) S.penghuni = pList.map(mapPenghuniFromDb);

      // 2. Kamar
      const { data: kList } = await sbClient.from('kamar').select('*').order('no', { ascending: true });
      if (kList && kList.length > 0) {
        S.kamar = kList;
      }

      // 3. Pembayaran
      const { data: bList } = await sbClient.from('pembayaran').select('*');
      if (bList && bList.length > 0) S.pembayaran = bList.map(mapBayarFromDb);

      // 4. Pengeluaran
      const { data: expList } = await sbClient.from('pengeluaran').select('*').order('tanggal', { ascending: false });
      if (expList && expList.length > 0) S.pengeluaran = expList.map(x => ({
        id: x.id,
        tanggal: x.tanggal,
        kategori: x.kategori,
        jumlah: Number(x.jumlah) || 0,
        keterangan: x.keterangan || '',
        buktiNota: x.bukti_nota,
        createdBy: x.created_by
      }));

      // 5. Keluhan
      const { data: klhList } = await sbClient.from('keluhan').select('*').order('created_at', { ascending: false });
      if (klhList && klhList.length > 0) S.keluhan = klhList.map(x => ({
        id: x.id,
        penghuniId: x.penghuni_id,
        kamar: x.kamar,
        judul: x.judul,
        kategori: x.kategori,
        deskripsi: x.deskripsi,
        foto: x.foto,
        status: x.status,
        responManager: x.respon_manager,
        tglLapor: x.tgl_lapor,
        tglSelesai: x.tgl_selesai
      }));

      // 6. Kost Pengaturan
      const { data: kRow } = await sbClient.from('kost_pengaturan').select('*').limit(1).maybeSingle();
      if (kRow) {
        const cloudHasData = kRow.nama && kRow.nama !== 'SiKost';
        const localHasData = S.kost.nama && S.kost.nama !== 'SiKost';

        if (cloudHasData || !localHasData) {
          S.kost = {
            ...S.kost,
            nama: kRow.nama || S.kost.nama || 'SiKost',
            pemilik: kRow.pemilik || S.kost.pemilik || '',
            alamat: kRow.alamat || S.kost.alamat || '',
            hp: kRow.hp || S.kost.hp || '',
            totalKamar: kRow.total_kamar || S.kost.totalKamar || 10,
            bankNama: kRow.bank_nama || S.kost.bankNama || '',
            bankRekening: kRow.bank_rekening || S.kost.bankRekening || '',
            bankAtasNama: kRow.bank_atas_nama || S.kost.bankAtasNama || '',
            qrisUrl: kRow.qris_url || S.kost.qrisUrl || ''
          };
        } else if (localHasData) {
          // Cloud masih default/kosong tapi lokal sudah kustom, sinkronkan ke cloud
          await DB.saveKost();
        }
      }

      // 8. Profiles (Jika Manager)
      if (currentUser?.role === 'manager') {
        const { data: prList } = await sbClient.from('profiles').select('*');
        if (prList) {
          S.akun = prList.map(p => ({
            id: p.id,
            nama: p.nama,
            email: p.email,
            role: p.role,
            penghuniId: p.penghuni_id
          }));
        }
      }

      LS.save();

      if (renderNow) {
        updateSidebarBadges();
        if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
        if ($('page-penghuni')?.classList.contains('active')) renderPenghuni();
        if ($('page-kamar')?.classList.contains('active')) renderKamar();
        if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
        if ($('page-pengeluaran')?.classList.contains('active')) renderPengeluaran();
        if ($('page-keluhan')?.classList.contains('active')) renderKeluhan();
        if ($('page-pengaturan')?.classList.contains('active')) renderPengaturan();
        if ($('sb-kost-name')) $('sb-kost-name').textContent = S.kost.nama || 'SiKost';
      }
    } catch (e) {
      console.warn('Gagal sinkron data Supabase:', e);
    }
  },

  async savePenghuni(d) {
    if (sbClient) {
      try { await sbClient.from('penghuni').upsert(mapPenghuniToDb(d)); } catch (e) { console.warn(e); }
    }
  },
  async deletePenghuni(id) {
    if (sbClient) {
      try { await sbClient.from('penghuni').delete().eq('id', id); } catch (e) { console.warn(e); }
    }
  },
  async saveKamar(k) {
    if (sbClient) {
      try {
        await sbClient.from('kamar').upsert({
          id: k.id,
          no: k.no,
          lantai: k.lantai || '1',
          tipe: k.tipe || 'Standar',
          harga: Number(k.harga) || 0,
          fasilitas: k.fasilitas || ''
        });
      } catch (e) { console.warn(e); }
    }
  },
  async deleteKamar(id) {
    if (sbClient) {
      try { await sbClient.from('kamar').delete().eq('id', id); } catch (e) { console.warn(e); }
    }
  },
  async savePembayaran(pb) {
    if (sbClient) {
      try { await sbClient.from('pembayaran').upsert(mapBayarToDb(pb)); } catch (e) { console.warn(e); }
    }
  },
  async deletePembayaran(penghuniId, bulan) {
    if (sbClient) {
      try { await sbClient.from('pembayaran').delete().match({ penghuni_id: penghuniId, bulan: bulan }); } catch (e) { console.warn(e); }
    }
  },
  async savePengeluaran(exp) {
    if (sbClient) {
      try {
        await sbClient.from('pengeluaran').upsert({
          id: exp.id,
          tanggal: exp.tanggal,
          kategori: exp.kategori,
          jumlah: Number(exp.jumlah) || 0,
          keterangan: exp.keterangan || '',
          bukti_nota: exp.buktiNota || null,
          created_by: exp.createdBy || currentUser?.nama
        });
      } catch (e) { console.warn(e); }
    }
  },
  async deletePengeluaran(id) {
    if (sbClient) {
      try { await sbClient.from('pengeluaran').delete().eq('id', id); } catch (e) { console.warn(e); }
    }
  },
  async saveKeluhan(klh) {
    if (sbClient) {
      try {
        await sbClient.from('keluhan').upsert({
          id: klh.id,
          penghuni_id: klh.penghuniId,
          kamar: klh.kamar,
          judul: klh.judul,
          kategori: klh.kategori || 'Lainnya',
          deskripsi: klh.deskripsi,
          foto: klh.foto || null,
          status: klh.status || 'menunggu',
          respon_manager: klh.responManager || null,
          tgl_lapor: klh.tglLapor,
          tgl_selesai: klh.tglSelesai || null
        });
      } catch (e) { console.warn(e); }
    }
  },

  async saveKost() {
    if (sbClient) {
      try {
        await sbClient.from('kost_pengaturan').upsert({
          id: 'default',
          nama: S.kost.nama,
          pemilik: S.kost.pemilik,
          alamat: S.kost.alamat,
          hp: S.kost.hp,
          total_kamar: Number(S.kost.totalKamar) || 10,
          bank_nama: S.kost.bankNama || '',
          bank_rekening: S.kost.bankRekening || '',
          bank_atas_nama: S.kost.bankAtasNama || '',
          qris_url: S.kost.qrisUrl || '',
          updated_at: new Date().toISOString()
        });
      } catch (e) { console.warn(e); }
    }
  },

  async uploadLocalToCloud(silent = false) {
    if (!sbClient) {
      if (!silent) toast('Supabase belum terhubung! Atur URL dan Anon Key terlebih dahulu.', 'err');
      return;
    }
    if (!silent) toast('Mengunggah seluruh data ke Supabase Cloud... ⏳');
    try {
      await this.saveKost();
      for (const k of S.kamar) await this.saveKamar(k);
      for (const p of S.penghuni) await this.savePenghuni(p);
      for (const pb of S.pembayaran) await this.savePembayaran(pb);
      for (const exp of S.pengeluaran) await this.savePengeluaran(exp);
      for (const klh of S.keluhan) await this.saveKeluhan(klh);

      if (!silent) toast('Semua data lokal berhasil diunggah ke Supabase Cloud! 🎉');
      await this.fetchData(true);
    } catch (err) {
      console.error(err);
      if (!silent) toast('Gagal migrasi data: ' + err.message, 'err');
    }
  }
};

// ── PROFIL USER SUPABASE ──────────────────────────────────────
async function fetchOrCreateProfile(user, fallbackNama = '', fallbackRole = 'manager') {
  if (!sbClient || !user) return null;
  const userEmail = (user.email || '').toLowerCase().trim();
  const googleName = user.user_metadata?.full_name || user.user_metadata?.name || fallbackNama || user.email.split('@')[0];

  try {
    // 1. Cek profil yang sudah ada di Supabase
    let { data: p } = await sbClient.from('profiles').select('*').eq('id', user.id).maybeSingle();
    
    // 2. Cek apakah email user cocok dengan salah satu penghuni kost
    let matchedPenghuniId = p?.penghuni_id || user.user_metadata?.penghuni_id || null;
    if (!matchedPenghuniId) {
      // Cek di memori lokal dahulu
      const localMatched = S.penghuni.find(x => (x.email || '').toLowerCase().trim() === userEmail);
      if (localMatched) {
        matchedPenghuniId = localMatched.id;
      } else {
        // Cek langsung ke database Supabase
        const { data: dbMatched } = await sbClient.from('penghuni').select('id').ilike('email', userEmail).maybeSingle();
        if (dbMatched) matchedPenghuniId = dbMatched.id;
      }
    }

    if (p) {
      // Jika profil ada tapi belum terhubung ke penghuni, hubungkan sekarang
      // Role check: gavinutomo4@gmail.com & prasadautomo@gmail.com berhak menjadi manager!
      const isManagerEmail = (userEmail === 'gavinutomo4@gmail.com' || userEmail === 'prasadautomo@gmail.com');
      const enforcedRole = isManagerEmail ? 'manager' : 'penghuni';

      if (p.role !== enforcedRole) {
        p.role = enforcedRole;
        await sbClient.from('profiles').update({ role: enforcedRole }).eq('id', user.id);
      }

      if (!p.penghuni_id && matchedPenghuniId && !isManagerEmail) {
        p.penghuni_id = matchedPenghuniId;
        await sbClient.from('profiles').update({ penghuni_id: matchedPenghuniId }).eq('id', user.id);
      }
      return {
        id: p.id,
        nama: p.nama || googleName,
        email: p.email || user.email,
        role: enforcedRole,
        penghuniId: isManagerEmail ? null : (p.penghuni_id || matchedPenghuniId || null)
      };
    }

    // 3. Jika belum ada profil: gavinutomo4@gmail.com & prasadautomo@gmail.com berhak menjadi manager!
    const isManager = (userEmail === 'gavinutomo4@gmail.com' || userEmail === 'prasadautomo@gmail.com');
    const assignedRole = isManager ? 'manager' : 'penghuni';

    const newP = {
      id: user.id,
      nama: googleName,
      email: user.email,
      role: assignedRole,
      penghuni_id: isManager ? null : matchedPenghuniId
    };

    await sbClient.from('profiles').upsert(newP);
    return newP;
  } catch (err) {
    console.warn('Ambil/buat profil user gagal:', err);
    return {
      id: user.id,
      nama: googleName,
      email: user.email,
      role: fallbackRole,
      penghuniId: null
    };
  }
}

// ── GOOGLE 1-KLIK LOGIN (TAHU BERES) ──────────────────────────
const btnLoginGoogle        = $('btn-login-google');
const modalGoogleAuth              = $('modal-google-auth');
const modalGoogleClose             = $('modal-google-close');
const googleAccountsList           = $('google-accounts-list');
const inlineGoogleAccountsList     = $('inline-google-accounts-list');
const btnToggleCustomGoogle        = $('btn-toggle-custom-google');
const formCustomGoogle             = $('form-custom-google');
const customGoogleEmail            = $('custom-google-email');
const customGoogleNama             = $('custom-google-nama');
const btnToggleInlineCustomGoogle  = $('btn-toggle-inline-custom-google');
const formInlineCustomGoogle       = $('form-inline-custom-google');
const inlineCustomGoogleEmail      = $('inline-custom-google-email');
const googleLiveOauthBox           = $('google-live-oauth-box');
const btnTriggerLiveOauth          = $('btn-trigger-live-oauth');

function createGoogleAccountCard(acc, isInline = false) {
  const card = document.createElement('div');
  card.className = 'google-acc-card';
  const inisial = '👑';

  card.innerHTML = `
    <div class="google-acc-avatar mgr">
      <span>${inisial}</span>
      <div class="google-badge-dot">
        <svg viewBox="0 0 24 24" style="width:10px;height:10px"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/></svg>
      </div>
    </div>
    <div class="google-acc-meta">
      <div class="google-acc-name">${esc(acc.nama)}</div>
      <div class="google-acc-sub">
        <span>${esc(acc.email)}</span>
      </div>
    </div>
    <span class="google-acc-role mgr">Manager 👑</span>
  `;

  card.addEventListener('click', () => {
    closeModalGoogle();
    loginWithAkun(acc);
    toast(`Masuk sebagai ${acc.nama} (${acc.role}) via Google! 🚀`);
  });

  return card;
}

function renderGoogleAccounts() {
  if (!S.propertiesData || !S.propertiesData.kost_1) {
    seedDemoData(false);
  }

  // 1. Akun Manager: sinkronkan dengan nama pemilik di pengaturan kost
  const mgrNama = (S.kost?.pemilik ? S.kost.pemilik + ' (Owner)' : 'Gavin Utomo (Owner)');
  const mgrEmail = 'gavinutomo4@gmail.com';
  let mgr = S.akun.find(a => a.email && a.email.toLowerCase() === mgrEmail);
  if (!mgr) {
    mgr = { id: 'akun_mgr_gavin', nama: mgrNama, email: mgrEmail, role: 'manager', penghuniId: null };
    S.akun.push(mgr);
    LS.save();
  } else if (S.kost?.pemilik) {
    mgr.nama = mgrNama;
  }

  let prasad = S.akun.find(a => a.email && a.email.toLowerCase() === 'prasadautomo@gmail.com');
  if (!prasad) {
    prasad = { id: 'akun_mgr_prasad', nama: 'Prasada Utomo (Manager)', email: 'prasadautomo@gmail.com', role: 'manager', penghuniId: null };
    S.akun.push(prasad);
    LS.save();
  }

  const allAccounts = [mgr, prasad];

  // Render to modal list
  const mList = document.getElementById('google-accounts-list');
  if (mList) {
    mList.innerHTML = '';
    allAccounts.forEach(acc => {
      mList.appendChild(createGoogleAccountCard(acc, false));
    });
  }

  // Render to inline list on login screen
  const iList = document.getElementById('inline-google-accounts-list');
  if (iList) {
    iList.innerHTML = '';
    allAccounts.forEach(acc => {
      iList.appendChild(createGoogleAccountCard(acc, true));
    });
  }
}

// Render akun Google langsung saat script dimuat
try { renderGoogleAccounts(); } catch (e) { console.warn(e); }

function openModalGoogle() {
  renderGoogleAccounts();
  if (modalGoogleAuth) modalGoogleAuth.classList.add('open');
  if (googleLiveOauthBox) {
    googleLiveOauthBox.style.display = sbClient ? 'block' : 'none';
  }
}

function closeModalGoogle() {
  if (modalGoogleAuth) modalGoogleAuth.classList.remove('open');
  if (formCustomGoogle) formCustomGoogle.style.display = 'none';
}

if (modalGoogleClose) {
  modalGoogleClose.addEventListener('click', closeModalGoogle);
}
if (modalGoogleAuth) {
  modalGoogleAuth.addEventListener('click', (e) => {
    if (e.target === modalGoogleAuth) closeModalGoogle();
  });
}

if (btnToggleCustomGoogle && formCustomGoogle) {
  btnToggleCustomGoogle.addEventListener('click', () => {
    const isHidden = formCustomGoogle.style.display === 'none';
    formCustomGoogle.style.display = isHidden ? 'block' : 'none';
    if (isHidden && customGoogleEmail) customGoogleEmail.focus();
  });
}

if (btnToggleInlineCustomGoogle && formInlineCustomGoogle) {
  btnToggleInlineCustomGoogle.addEventListener('click', () => {
    const isHidden = formInlineCustomGoogle.style.display === 'none';
    formInlineCustomGoogle.style.display = isHidden ? 'block' : 'none';
    if (isHidden && inlineCustomGoogleEmail) inlineCustomGoogleEmail.focus();
  });
}

function handleCustomGoogleLogin(rawEmail, rawNama) {
  const email = (rawEmail || '').trim().toLowerCase();
  const namaInput = (rawNama || '').trim() || email.split('@')[0];
  if (!email) return;

  closeModalGoogle();

  let akun = S.akun.find(a => a.email && a.email.toLowerCase() === email);
  if (!akun) {
    const isOwner = (email === 'gavinutomo4@gmail.com' || email === 'prasadautomo@gmail.com');
    akun = {
      id: 'akun_' + uid(),
      nama: isOwner ? (email === 'prasadautomo@gmail.com' ? 'Prasad Automo' : 'Gavin Utomo (Owner)') : (namaInput || 'Manager'),
      email: email,
      role: 'manager',
      penghuniId: null
    };
    S.akun.push(akun);
    LS.save();
  }
  loginWithAkun(akun);
  toast(`Berhasil masuk sebagai ${akun.nama} (${akun.role}) via Google! 🚀`);
}

if (formCustomGoogle) {
  formCustomGoogle.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCustomGoogleLogin(customGoogleEmail.value, customGoogleNama?.value);
  });
}

if (formInlineCustomGoogle) {
  formInlineCustomGoogle.addEventListener('submit', (e) => {
    e.preventDefault();
    handleCustomGoogleLogin(inlineCustomGoogleEmail.value, '');
  });
}

// ── GOOGLE LIVE OAUTH & IDENTITY SERVICES ─────────────────────
function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function handleGoogleUserProfile(profile) {
  if (!profile || !profile.email) {
    toast('Gagal memproses data akun Google', 'err');
    return;
  }
  const email = profile.email.toLowerCase();
  const nama = profile.name || email.split('@')[0];
  const avatar = profile.picture || '';

  // STRICT SECURITY RULE: gavinutomo4@gmail.com & prasadautomo@gmail.com BERHAK MENJADI MANAGER!
  const isMgr = (email === 'gavinutomo4@gmail.com' || email === 'prasadautomo@gmail.com');
  const role = isMgr ? 'manager' : 'penghuni';

  // Cek apakah email cocok dengan penghuni yang terdaftar
  const matchedP = S.penghuni.find(p => p.email && p.email.toLowerCase() === email);

  let akun = S.akun.find(a => a.email && a.email.toLowerCase() === email);
  if (!akun) {
    akun = {
      id: 'google_' + (profile.sub || uid()),
      email,
      nama: isMgr ? (email === 'prasadautomo@gmail.com' ? (profile.name || 'Prasad Automo') : 'Gavin Utomo (Owner)') : nama,
      avatar,
      role,
      penghuniId: matchedP ? matchedP.id : null,
      googleAuth: true
    };
    S.akun.push(akun);
    LS.save();
  } else {
    akun.nama = isMgr ? (email === 'prasadautomo@gmail.com' ? (profile.name || akun.nama || 'Prasad Automo') : 'Gavin Utomo (Owner)') : (akun.nama || nama);
    akun.avatar = avatar || akun.avatar;
    akun.role = role;
    if (matchedP && !akun.penghuniId) akun.penghuniId = matchedP.id;
    LS.save();
  }

  // Jika Supabase terhubung, buat profil
  if (sbClient) {
    try {
      await fetchOrCreateProfile({ id: akun.id, email: akun.email, user_metadata: { full_name: nama, avatar_url: avatar } });
    } catch (e) {
      console.warn('Sync profile Supabase warning:', e);
    }
  }

  loginWithAkun(akun);
  toast(`Berhasil masuk via Google: ${nama} (${isMgr ? 'Manager 👑' : 'Penghuni 👤'})! 🚀`);
}

async function handleGoogleCredentialResponse(response) {
  const payload = decodeJwt(response.credential);
  if (payload) {
    await handleGoogleUserProfile(payload);
  } else {
    toast('Gagal membaca kredensial akun Google', 'err');
  }
}

function initGoogleIdentityServices() {
  const clientId = window.SIKOST_CONFIG?.GOOGLE_CLIENT_ID || localStorage.getItem('sk3_google_client_id');
  if (!clientId) return;

  if (!window.google?.accounts?.id) {
    let retries = 0;
    const interval = setInterval(() => {
      retries++;
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initGoogleIdentityServices();
      } else if (retries > 30) {
        clearInterval(interval);
      }
    }, 250);
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    });

    const container = document.getElementById('g_id_signin');
    if (container) {
      container.innerHTML = '';
    }

    window.google.accounts.id.prompt();
  } catch (err) {
    console.warn('Inisialisasi Google Identity Services warning:', err);
  }
}

async function triggerRealGoogleLogin() {
  // 1. Cek apakah dijalankan dari protokol file:///
  if (window.location.protocol === 'file:') {
    openModal('modal-google-protocol');
    return;
  }

  const clientId = window.SIKOST_CONFIG?.GOOGLE_CLIENT_ID || localStorage.getItem('sk3_google_client_id');
  if (!clientId) {
    toast('Google Client ID belum diatur. Membuka pemilih akun 1-Klik...', 'info');
    openModalGoogle();
    return;
  }

  const btn = $('btn-login-google');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px"></span> Membuka Google...`;
  }

  // 2. Tunggu Google Identity Services SDK siap (maksimal 3 detik)
  if (!window.google?.accounts?.oauth2) {
    let waited = 0;
    while (!window.google?.accounts?.oauth2 && waited < 15) {
      await new Promise(r => setTimeout(r, 200));
      waited++;
    }
  }

  // 3. Buka Google OAuth 2.0 Real Pop-up (accounts.google.com)
  if (window.google?.accounts?.oauth2) {
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
          if (tokenResponse && tokenResponse.access_token) {
            try {
              const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await res.json();
              if (profile && profile.email) {
                await handleGoogleUserProfile(profile);
              }
            } catch (err) {
              console.error('Fetch Google userinfo error:', err);
              toast('Gagal mengambil profil akun Google', 'err');
            }
          }
        },
        error_callback: (err) => {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
          }
          console.warn('Google OAuth popup error:', err);
          if (err && err.type === 'popup_closed') {
            toast('Login Google dibatalkan.', 'info');
          } else {
            toast('Pop-up Google: ' + (err?.message || 'Pastikan http://localhost:3000 terdaftar di Authorized origins'), 'err');
            openModalGoogle();
          }
        }
      });

      tokenClient.requestAccessToken({ prompt: 'select_account' });
      return;
    } catch (e) {
      console.warn('Google OAuth popup initiation error:', e);
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    }
  }

  // 4. Jika One-Tap tersedia, coba prompt
  if (window.google?.accounts?.id) {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
    try {
      window.google.accounts.id.prompt();
      return;
    } catch (e) {}
  }

  // 5. Fallback ke pemilih akun SiKost
  if (btn) {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
  openModalGoogle();
}

function handleGoogleLoginClick() {
  triggerRealGoogleLogin();
}

if (btnTriggerLiveOauth) {
  btnTriggerLiveOauth.addEventListener('click', triggerRealGoogleLogin);
}

if (btnLoginGoogle) {
  btnLoginGoogle.addEventListener('click', handleGoogleLoginClick);
}

// Modal Google Setup Listeners
if ($('modal-google-setup-close')) {
  $('modal-google-setup-close').addEventListener('click', () => closeModal('modal-google-setup'));
}
if ($('btn-google-setup-done')) {
  $('btn-google-setup-done').addEventListener('click', () => closeModal('modal-google-setup'));
}
if ($('link-google-setup-from-modal')) {
  $('link-google-setup-from-modal').addEventListener('click', (e) => {
    e.preventDefault();
    closeModalGoogle();
    openModal('modal-google-setup');
  });
}
if ($('btn-copy-callback')) {
  $('btn-copy-callback').addEventListener('click', () => {
    const inp = $('google-callback-url');
    if (inp) {
      navigator.clipboard.writeText(inp.value).then(() => {
        toast('Redirect URL disalin ke clipboard! 📋');
      }).catch(() => {
        inp.select();
        document.execCommand('copy');
        toast('Redirect URL disalin! 📋');
      });
    }
  });
}

// Modal Protocol Listeners
if ($('modal-google-proto-close')) {
  $('modal-google-proto-close').addEventListener('click', () => closeModal('modal-google-protocol'));
}
if ($('btn-proto-close')) {
  $('btn-proto-close').addEventListener('click', () => closeModal('modal-google-protocol'));
}
if ($('btn-proto-simulasi')) {
  $('btn-proto-simulasi').addEventListener('click', () => {
    closeModal('modal-google-protocol');
    const details = $('details-simulasi-google');
    if (details) details.open = true;
    openModalGoogle();
  });
}

// ── LOGIN / REGISTER TABS (FALLBACK GUARD) ────────────────────
const tabBtnLogin = $('tab-btn-login');
const tabBtnReg   = $('tab-btn-register');
const formLogin   = $('form-login');
const formReg     = $('form-register');

if (tabBtnLogin && tabBtnReg && formLogin && formReg) {
  tabBtnLogin.addEventListener('click', () => {
    tabBtnLogin.classList.add('active');
    tabBtnReg.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display   = 'none';
  });
  tabBtnReg.addEventListener('click', () => {
    tabBtnReg.classList.add('active');
    tabBtnLogin.classList.remove('active');
    formLogin.style.display = 'none';
    formReg.style.display   = 'block';
  });
}

if (formLogin) {
  formLogin.addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = $('login-email').value.trim().toLowerCase();
    const pw    = $('login-pw').value;
    const btn   = $('btn-submit-login');
    btn.disabled = true;
    try {
      if (sbClient) {
        const { data, error } = await sbClient.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        const profile = await fetchOrCreateProfile(data.user);
        loginWithAkun(profile);
      } else {
        const akun = S.akun.find(a => a.email === email);
        if (!akun) throw new Error('Email tidak ditemukan.');
        loginWithAkun(akun);
      }
    } catch (err) {
      toast('Login gagal: ' + err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  });
}

if (formReg) {
  formReg.addEventListener('submit', async function(e) {
    e.preventDefault();
    const nama  = $('reg-nama').value.trim();
    const email = $('reg-email').value.trim().toLowerCase();
    const pw    = $('reg-pw').value;
    const role  = (email === 'gavinutomo4@gmail.com') ? 'manager' : 'penghuni';
    const btn   = $('btn-submit-reg');
    btn.disabled = true;
    try {
      if (sbClient) {
        const { data, error } = await sbClient.auth.signUp({ email, password: pw, options: { data: { nama, role } } });
        if (error) throw error;
        const profile = await fetchOrCreateProfile(data.user, nama, role);
        loginWithAkun(profile);
      }
    } catch (err) {
      toast('Daftar gagal: ' + err.message, 'err');
    } finally {
      btn.disabled = false;
    }
  });
}

let propertySwitcherEventsBound = false;
function setupPropertySwitcherEvents() {
  if (propertySwitcherEventsBound) return;
  propertySwitcherEventsBound = true;

  const btn = $('btn-property-switch');
  const dd = $('property-dropdown-menu');

  if (btn && dd) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isClosed = dd.style.display === 'none' || !dd.style.display;
      dd.style.display = isClosed ? 'block' : 'none';
      btn.classList.toggle('open', isClosed);
      btn.setAttribute('aria-expanded', isClosed ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#topbar-property-selector')) {
        dd.style.display = 'none';
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

function loginWithAkun(akun) {
  currentUser = akun;
  LS.saveSession(akun);
  enterApp();
}

// ── LOGOUT ────────────────────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  confirm_dlg('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari SiKost?', async () => {
    currentUser = null;
    LS.clearSession();
    if ($('login-kost-title')) $('login-kost-title').textContent = S.kost?.nama || 'SiKost';
    showScreen('screen-login');
    renderGoogleAccounts();
    toast('Anda telah keluar.');
    if (sbClient) {
      try { await sbClient.auth.signOut(); } catch {}
    }
  }, 'Keluar');
});

function enterApp() {
  showScreen('screen-app');
  buildSidebar();
  renderUserChip();
  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost?.nama || 'SiKost';
  if ($('sb-kost-name'))     $('sb-kost-name').textContent     = S.kost?.nama || 'SiKost';
  if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost?.nama || 'SiKost';
  document.title = (S.kost?.nama || 'SiKost') + ' – Manajemen Kost Modern';
  updatePropertySwitcherUI();
  setupPropertySwitcherEvents();
  const urlPage = new URLSearchParams(window.location.search).get('page') || (location.hash ? location.hash.replace('#', '') : '');
  const firstPage = PAGE_TITLES[urlPage] ? urlPage : 'dashboard';
  navigateTo(firstPage);

  if (sbClient) {
    DB.fetchData();
  }
}

// ── SIDEBAR NAVIGATION ITEMS ─────────────────────────────────
const NAV_MANAGER = [
  { id:'dashboard',   icon:'▦',  label:'Dashboard' },
  { id:'penghuni',    icon:'👥', label:'Data Penghuni', badge:true },
  { id:'kamar',       icon:'🛏',  label:'Kamar' },
  { id:'pembayaran',  icon:'💳', label:'Pembayaran', badgePending:true },
  { id:'pengeluaran', icon:'💸', label:'Pengeluaran' },
  { id:'keluhan',     icon:'🛠️', label:'Keluhan', badgeKeluhan:true },
  { id:'pengaturan',  icon:'⚙',  label:'Pengaturan' },
];

function buildSidebar() {
  const items = NAV_MANAGER;
  $('sidebar-nav').innerHTML = items.map(item => `
    <a href="#" class="nav-item" data-page="${item.id}" id="nav-${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label-text">${item.label}</span>
      <span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>
    </a>`).join('');

  $('sidebar-nav').querySelectorAll('.nav-item').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); })
  );
  $('sb-role-badge').textContent = 'Manager';
  $('sb-role-badge').className   = 'brand-role';
  $('sb-kost-name').textContent  = S.kost.nama || 'SiKost';
  updateSidebarBadges();
}

function updateSidebarBadges() {
  const bPenghuni = $('badge-penghuni');
  if (bPenghuni) {
    bPenghuni.textContent = S.penghuni.length;
    bPenghuni.style.display = S.penghuni.length > 0 ? 'inline-block' : 'none';
  }
  const pendingBayar = S.pembayaran.filter(pb => pb.status === 'menunggu').length;
  const bBayar = $('badge-pembayaran');
  if (bBayar) {
    bBayar.textContent = pendingBayar;
    bBayar.style.display = pendingBayar > 0 ? 'inline-block' : 'none';
    bBayar.style.background = 'var(--orange)';
  }
  const pendingKeluhan = S.keluhan.filter(k => k.status === 'menunggu').length;
  const bKeluhan = $('badge-keluhan');
  if (bKeluhan) {
    bKeluhan.textContent = pendingKeluhan;
    bKeluhan.style.display = pendingKeluhan > 0 ? 'inline-block' : 'none';
    bKeluhan.style.background = 'var(--red)';
  }
}

function renderUserChip() {
  $('user-name').textContent  = currentUser.nama  || '–';
  $('user-email').textContent = currentUser.email || '–';
  $('user-avatar-fallback').textContent = init(currentUser.nama);
}

// ── NAVIGATION ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  penghuni:    'Data Penghuni',
  kamar:       'Manajemen Kamar',
  pembayaran:  'Pembayaran & Tagihan',
  pengeluaran: 'Pengeluaran & Pembukuan',
  keluhan:     'Tiket Keluhan & Perbaikan',
  pengaturan:  'Pengaturan Sistem',
  profil:      'Profil Akun'
};

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = $('page-' + page); if (pageEl) pageEl.classList.add('active');
  const navEl  = $('nav-' + page);  if (navEl)  navEl.classList.add('active');
  $('topbar-title').textContent = PAGE_TITLES[page] || page;

  $('btn-tambah-penghuni').style.display = (page === 'penghuni') ? 'inline-flex' : 'none';
  $('btn-export-csv').style.display      = (page === 'penghuni') ? 'inline-flex' : 'none';

  if (page === 'dashboard')   renderDashboard();
  if (page === 'penghuni')    renderPenghuni();
  if (page === 'kamar')       renderKamar();
  if (page === 'pembayaran')  renderPembayaran();
  if (page === 'pengeluaran') renderPengeluaran();
  if (page === 'keluhan')     renderKeluhan();
  if (page === 'pengaturan')  renderPengaturan();
  if (page === 'profil')      renderProfil();

  updateSidebarBadges();
}

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (btn && !btn.classList.contains('nav-item')) { e.preventDefault(); navigateTo(btn.dataset.page); }
});

// ── THEME TOGGLE ─────────────────────────────────────────────
$('theme-toggle').addEventListener('click', () => {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  $('theme-icon').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('sk3_theme', isDark ? 'light' : 'dark');
  if ($('page-dashboard').classList.contains('active')) renderCharts();
});

// ── ACTION CENTER: FOKUS & TUGAS HARI INI ──────────────────────
let activeActionFilter = 'all';

function renderDashActionCenter() {
  const container = $('dash-action-center');
  if (!container) return;

  const now = new Date();
  const nowDay = now.getDate();
  const curMonth = thisMonth();

  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const payments = S.pembayaran.filter(pb => pb.bulan === curMonth);

  // 1. Tagihan Jatuh Tempo & Menunggak
  const dueItems = [];
  aktif.forEach(p => {
    const pb = payments.find(x => x.penghuniId === p.id);
    const isLunas = pb?.status === 'lunas';
    if (!isLunas) {
      const tempo = Number(p.tempo) || 1;
      const diff = tempo - nowDay;
      let statusLabel = '';
      let badgeClass = 'badge-orange';
      if (diff < 0) {
        statusLabel = `Terlambat ${Math.abs(diff)} hari (Tempo Tgl ${tempo})`;
        badgeClass = 'badge-red';
      } else if (diff <= 3) {
        statusLabel = diff === 0 ? 'Jatuh Tempo Hari Ini!' : `H-${diff} Tempo (Tgl ${tempo})`;
        badgeClass = 'badge-orange';
      } else {
        statusLabel = `Tempo Tgl ${tempo}`;
        badgeClass = 'badge-blue';
      }
      dueItems.push({ type: 'tagihan', p, diff, statusLabel, badgeClass });
    }
  });

  dueItems.sort((a,b) => a.diff - b.diff);

  // 2. Keluhan Fasilitas Baru
  const complaintItems = S.keluhan.filter(k => k.status === 'menunggu').map(k => ({ type: 'keluhan', k }));

  // 3. Kamar Siap Huni (Kosong)
  const occRooms = new Set(aktif.map(p => p.kamar).filter(Boolean));
  const emptyRooms = S.kamar.filter(k => !occRooms.has(k.no)).map(k => ({ type: 'kamar_kosong', k }));

  const totalActions = dueItems.length + complaintItems.length + emptyRooms.length;

  if (totalActions === 0) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  let displayItems = [];
  if (activeActionFilter === 'tagihan') displayItems = dueItems;
  else if (activeActionFilter === 'keluhan') displayItems = complaintItems;
  else if (activeActionFilter === 'kamar') displayItems = emptyRooms;
  else displayItems = [...dueItems.slice(0, 4), ...complaintItems.slice(0, 2), ...emptyRooms.slice(0, 2)];

  container.innerHTML = `
    <div class="dash-action-header">
      <div class="dash-action-title-group">
        <div class="dash-action-icon-badge">⚡</div>
        <div>
          <h2 class="dash-action-heading">Fokus &amp; Tugas Hari Ini</h2>
          <div class="dash-action-subtitle">Ringkasan cepat tindakan operasional yang memerlukan perhatian Anda</div>
        </div>
      </div>
      <div class="dash-action-tabs">
        <button type="button" class="dash-action-tab ${activeActionFilter === 'all' ? 'active' : ''}" onclick="switchActionFilter('all')">
          Semua (${totalActions})
        </button>
        <button type="button" class="dash-action-tab ${activeActionFilter === 'tagihan' ? 'active' : ''}" onclick="switchActionFilter('tagihan')">
          ⚠️ Tagihan (${dueItems.length})
        </button>
        <button type="button" class="dash-action-tab ${activeActionFilter === 'keluhan' ? 'active' : ''}" onclick="switchActionFilter('keluhan')">
          🛠️ Keluhan (${complaintItems.length})
        </button>
        <button type="button" class="dash-action-tab ${activeActionFilter === 'kamar' ? 'active' : ''}" onclick="switchActionFilter('kamar')">
          🛏️ Kamar Kosong (${emptyRooms.length})
        </button>
      </div>
    </div>
    <div class="dash-action-grid">
      ${displayItems.map(item => {
        if (item.type === 'tagihan') {
          const { p, statusLabel, badgeClass } = item;
          return `
            <div class="action-card" style="border-left:4px solid ${badgeClass === 'badge-red' ? 'var(--red)' : 'var(--orange)'}">
              <div class="action-card-top">
                <div class="action-card-main">
                  <div class="action-card-icon">👤</div>
                  <div>
                    <div class="action-card-title">${p.nama} (Kamar ${p.kamar || '–'})</div>
                    <div class="action-card-sub">Tagihan: <strong>${rp(p.sewa)}</strong></div>
                  </div>
                </div>
                <span class="badge ${badgeClass}">${statusLabel}</span>
              </div>
              <div class="action-card-actions">
                <button type="button" class="btn-wa btn-sm" onclick="kirimWaTagihan('${p.id}', '${curMonth}')" title="Kirim WA Pengingat">📱 Kirim WA</button>
                <button type="button" class="btn-primary btn-sm" onclick="quickPayTenant('${p.id}', '${curMonth}')" title="Tandai langsung lunas">⚡ 1-Klik Lunas</button>
              </div>
            </div>
          `;
        } else if (item.type === 'keluhan') {
          const { k } = item;
          return `
            <div class="action-card" style="border-left:4px solid var(--purple)">
              <div class="action-card-top">
                <div class="action-card-main">
                  <div class="action-card-icon">🛠️</div>
                  <div>
                    <div class="action-card-title">${k.judul || 'Keluhan Fasilitas'}</div>
                    <div class="action-card-sub">Kamar ${k.kamar || '–'} · ${fmtD(k.tglLapor)}</div>
                  </div>
                </div>
                <span class="badge badge-purple">Menunggu</span>
              </div>
              <div class="action-card-actions">
                <button type="button" class="btn-primary btn-sm" onclick="openResponKeluhan('${k.id}')">Tindak Lanjut →</button>
              </div>
            </div>
          `;
        } else if (item.type === 'kamar_kosong') {
          const { k } = item;
          return `
            <div class="action-card" style="border-left:4px solid var(--text-4)">
              <div class="action-card-top">
                <div class="action-card-main">
                  <div class="action-card-icon">🛏️</div>
                  <div>
                    <div class="action-card-title">Kamar ${k.no} (${k.tipe || 'Standar'})</div>
                    <div class="action-card-sub">Lantai ${k.lantai || '1'} · ${rp(k.harga || 0)}/bln</div>
                  </div>
                </div>
                <span class="badge badge-gray">Siap Huni</span>
              </div>
              <div class="action-card-actions">
                <button type="button" class="btn-primary btn-sm" onclick="openModalPenghuniWithRoom('${k.no}')">+ Isi Penghuni</button>
              </div>
            </div>
          `;
        }
        return '';
      }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:16px;color:var(--text-3);font-size:0.85rem">Tidak ada item tindakan pada filter ini.</div>'}
    </div>
  `;
}

window.switchActionFilter = function(f) {
  activeActionFilter = f;
  renderDashActionCenter();
};

// ── DASHBOARD (Manager) ───────────────────────────────────────
function renderDashboard() {
  const h = new Date().getHours();
  const greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  $('dash-greeting').textContent = greet + ', ' + (currentUser?.nama?.split(' ')[0] || '') + ' 👋';
  $('dash-date').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  renderDashActionCenter();


  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const kamarTerisi = [...new Set(aktif.map(p => p.kamar).filter(Boolean))].length;
  const targetPendapatan = aktif.reduce((s, p) => s + (Number(p.sewa) || 0), 0);
  const bln = thisMonth();
  
  // Pemasukan bulan ini
  const lunasList = S.pembayaran.filter(pb => pb.bulan === bln && pb.status === 'lunas');
  const terkumpul = lunasList.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);

  // Pengeluaran bulan ini
  const expBulanIni = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(bln));
  const totalPengeluaran = expBulanIni.reduce((s, x) => s + (Number(x.jumlah) || 0), 0);

  // Laba Bersih (Net Profit)
  const labaBersih = terkumpul - totalPengeluaran;

  // 6 Kartu KPI Utama: Penghuni, Kamar, Target Sewa, Pemasukan, Pengeluaran, Laba Bersih
  $('kpi-row').innerHTML = `
    <div class="kpi">
      <div class="kpi-label">Total Penghuni <span style="font-size:1.1rem">👥</span></div>
      <div class="kpi-value">${S.penghuni.length}</div>
      <div class="kpi-sub">${aktif.length} aktif saat ini</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Kamar Terisi <span style="font-size:1.1rem">🛏</span></div>
      <div class="kpi-value">${kamarTerisi}</div>
      <div class="kpi-sub">dari ${S.kost.totalKamar || '?'} total kamar</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Pendapatan / Bulan <span style="font-size:1.1rem">🎯</span></div>
      <div class="kpi-value" style="font-size:1.05rem">${rp(targetPendapatan)}</div>
      <div class="kpi-sub">target bulanan</div>
    </div>
    <div class="kpi" data-page="pembayaran" style="cursor:pointer" title="Lihat riwayat pembayaran sewa">
      <div class="kpi-label">Terkumpul Bulan Ini <span style="font-size:1.1rem">💰</span></div>
      <div class="kpi-value" style="font-size:1.05rem;color:var(--green)">${rp(terkumpul)}</div>
      <div class="kpi-sub">${lunasList.length} dari ${aktif.length} penghuni lunas →</div>
    </div>
    <div class="kpi" data-page="pengeluaran" style="cursor:pointer" title="Kelola catatan pengeluaran operasional">
      <div class="kpi-label">Pengeluaran Bulan Ini <span style="font-size:1.1rem">💸</span></div>
      <div class="kpi-value" style="font-size:1.05rem;color:var(--red)">${rp(totalPengeluaran)}</div>
      <div class="kpi-sub">${expBulanIni.length} pengeluaran tercatat →</div>
    </div>
    <div class="kpi" data-page="pengeluaran" style="cursor:pointer" title="Rincian laba bersih operasional">
      <div class="kpi-label">Laba Bersih <span style="font-size:1.1rem">📈</span></div>
      <div class="kpi-value" style="font-size:1.05rem;color:${labaBersih >= 0 ? 'var(--accent-light, #818cf8)' : 'var(--red)'}">${rp(labaBersih)}</div>
      <div class="kpi-sub">${labaBersih >= 0 ? 'Surplus operasional' : 'Defisit operasional'} →</div>
    </div>
  `;

  // Baris Notifikasi Cepat (Keluhan Pending & Konfirmasi Transfer Pending)
  const alertsRow = $('dash-alerts-row');
  if (alertsRow) {
    const pendingBayar = S.pembayaran.filter(pb => pb.status === 'menunggu').length;
    const pendingKeluhan = S.keluhan.filter(k => k.status === 'menunggu').length;
    let alertsHtml = '';

    if (pendingBayar > 0) {
      alertsHtml += `
        <div class="dash-alert-item warning">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem">💳</span>
            <div><strong>${pendingBayar} Pembayaran Menunggu Verifikasi</strong><div style="font-size:0.75rem;color:var(--text-3)">Ada bukti transfer sewa yang belum disetujui.</div></div>
          </div>
          <button class="btn-primary btn-sm" onclick="navigateTo('pembayaran')">Review Pembayaran →</button>
        </div>`;
    }
    if (pendingKeluhan > 0) {
      alertsHtml += `
        <div class="dash-alert-item danger">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem">🛠️</span>
            <div><strong>${pendingKeluhan} Tiket Keluhan Baru</strong><div style="font-size:0.75rem;color:var(--text-3)">Anak kost melaporkan kendala fasilitas kamar.</div></div>
          </div>
          <button class="btn-danger btn-sm" onclick="navigateTo('keluhan')">Tindak Lanjut →</button>
        </div>`;
    }

    if (alertsHtml) {
      alertsRow.innerHTML = alertsHtml;
      alertsRow.style.display = 'block';
    } else {
      alertsRow.style.display = 'none';
    }
  }

  // Tabel Penghuni Terbaru
  const latest = [...S.penghuni].sort((a,b) => (b.tglMasuk||'').localeCompare(a.tglMasuk||'')).slice(0,6);
  $('tbody-terbaru').innerHTML = latest.map(p => `
    <tr>
      <td><strong>${p.nama}</strong></td>
      <td>${p.kamar ? 'Kamar ' + p.kamar : '–'}</td>
      <td>${fmtD(p.tglMasuk)}</td>
      <td>${p.status === 'aktif' ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Keluar</span>'}</td>
    </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:20px;font-size:0.8rem">Belum ada penghuni.</td></tr>`;

  // Tabel Pengeluaran Operasional Terbaru di Dashboard
  const tbodyDashPengeluaran = $('tbody-dash-pengeluaran');
  if (tbodyDashPengeluaran) {
    const listExp = [...S.pengeluaran].sort((a,b) => (b.tanggal||'').localeCompare(a.tanggal||'')).slice(0, 5);
    tbodyDashPengeluaran.innerHTML = listExp.map(exp => `
      <tr>
        <td>${fmtD(exp.tanggal)}</td>
        <td><span class="badge badge-purple">${exp.kategori}</span></td>
        <td><strong>${exp.keterangan || '–'}</strong></td>
        <td><strong style="color:var(--red)">${rp(exp.jumlah)}</strong></td>
        <td>${exp.buktiNota ? `<a href="${exp.buktiNota}" target="_blank" title="Lihat Bukti Nota"><img src="${exp.buktiNota}" style="width:32px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '<span style="color:var(--text-4)">–</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-outline btn-sm" onclick="editPengeluaran('${exp.id}')">Edit</button>
            <button type="button" class="btn-danger btn-sm" onclick="hapusPengeluaran('${exp.id}')">Hapus</button>
          </div>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-3);font-size:0.85rem">Belum ada catatan pengeluaran operasional. <button type="button" class="text-btn" onclick="openModalCatatPengeluaran()" style="margin-left:6px;font-weight:700">+ Catat Pengeluaran Pertama</button></td></tr>`;
  }

  // Quick Kamar Chips
  const allKamar = [...new Set([...S.kamar.map(k=>k.no), ...S.penghuni.map(p=>p.kamar).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const occ = {}; aktif.forEach(p => p.kamar && (occ[p.kamar] = true));
  $('quick-kamar').innerHTML = allKamar.map(no => `<span class="qk-chip ${occ[no] ? 'terisi' : 'kosong'}">${no}</span>`).join('') || '<span style="font-size:0.78rem;color:var(--text-3);padding:12px;display:block">Belum ada kamar.</span>';

  renderCharts();
  renderMultiKostCards();
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const pageDashboard = $('page-dashboard');
  if (pageDashboard && !pageDashboard.classList.contains('active')) return;

  const aktif = S.penghuni.filter(p => p.status === 'aktif').length;
  const nonAktif = S.penghuni.length - aktif;
  const motor = S.penghuni.filter(p => p.kendaraan === 'motor').length;
  const mobil = S.penghuni.filter(p => p.kendaraan === 'mobil').length;
  const both  = S.penghuni.filter(p => p.kendaraan === 'motor & mobil').length;
  const noKen = S.penghuni.length - motor - mobil - both;

  const bln = thisMonth();
  const lunasList = S.pembayaran.filter(pb => pb.bulan === bln && pb.status === 'lunas');
  const totalPemasukan = lunasList.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);
  const totalPengeluaran = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(bln)).reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  const laba = totalPemasukan - totalPengeluaran;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const tick   = isDark ? '#94a3b8' : '#64748b';
  const grid   = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const donut  = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: tick, font: { family:'Plus Jakarta Sans', size:11, weight:'600' }, padding:12, boxWidth:10, usePointStyle:true }
      }
    }
  };

  // Chart Cashflow (Pemasukan vs Pengeluaran & Laba)
  if (CHARTS.cashflow) CHARTS.cashflow.destroy();
  const ctxCashflow = $('chart-cashflow');
  if (ctxCashflow) {
    CHARTS.cashflow = new Chart(ctxCashflow, {
      type: 'bar',
      data: {
        labels: ['Pemasukan', 'Pengeluaran', 'Laba Bersih'],
        datasets: [{
          data: [totalPemasukan, totalPengeluaran, Math.max(0, laba)],
          backgroundColor: ['#10b981', '#f43f5e', '#6366f1'],
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick, font: { family:'Plus Jakarta Sans', size:11, weight:'600' } }, grid: { display: false } },
          y: { ticks: { color: tick, font: { family:'Plus Jakarta Sans', size:10 }, callback: v => 'Rp ' + (v/1000).toLocaleString('id-ID') + 'k' }, grid: { color: grid } }
        }
      }
    });
    $('cashflow-legend').innerHTML = `
      <div class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Pemasukan: ${rp(totalPemasukan)}</div>
      <div class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span>Pengeluaran: ${rp(totalPengeluaran)}</div>
      <div class="legend-item"><span class="legend-dot" style="background:#6366f1"></span>Laba: ${rp(laba)}</div>
    `;
  }

  // Chart Status Hunian
  if (CHARTS.status) CHARTS.status.destroy();
  CHARTS.status = new Chart($('chart-status'), {
    type: 'doughnut',
    data: {
      labels: ['Aktif', 'Tidak Aktif'],
      datasets: [{ data: [aktif, nonAktif], backgroundColor: ['#10b981', '#64748b'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: donut
  });

  // Chart Kendaraan
  if (CHARTS.kendaraan) CHARTS.kendaraan.destroy();
  CHARTS.kendaraan = new Chart($('chart-kendaraan'), {
    type: 'doughnut',
    data: {
      labels: ['Motor', 'Mobil', 'Motor & Mobil', 'Tidak Ada'],
      datasets: [{ data: [motor, mobil, both, noKen], backgroundColor: ['#6366f1', '#a855f7', '#f59e0b', '#64748b'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: donut
  });
}

// ── PENGHUNI RENDER ───────────────────────────────────────────
function getPenghuniFiltered() {
  const q  = $('cari-penghuni')?.value.toLowerCase() || '';
  const fs = $('filter-status')?.value || '';
  const fk = $('filter-kendaraan')?.value || '';
  return S.penghuni.filter(p => {
    const mQ = !q || (p.nama||'').toLowerCase().includes(q) || (p.nik||'').toLowerCase().includes(q) || (p.kamar||'').toLowerCase().includes(q);
    const mS = !fs || p.status === fs;
    const mK = !fk || p.kendaraan === fk;
    return mQ && mS && mK;
  });
}

function renderPenghuni() {
  const list = getPenghuniFiltered();
  const isEmpty = list.length === 0;
  $('empty-penghuni').style.display = isEmpty ? 'block' : 'none';

  if (currentView === 'grid') {
    $('penghuni-grid').style.display = isEmpty ? 'none' : 'grid';
    $('penghuni-list-wrap').style.display = 'none';
    $('penghuni-grid').innerHTML = list.map(p => {
      const av = p.foto ? `<img class="pg-avatar" src="${p.foto}" alt="${p.nama}"/>` : `<div class="pg-avatar-ph">${init(p.nama)}</div>`;
      return `
        <div class="pg-card ${p.status!=='aktif'?'inactive':''}" onclick="openDetail('${p.id}')">
          ${av}
          <div class="pg-name">${p.nama}</div>
          <div class="pg-meta">Kamar ${p.kamar||'–'} · Lantai ${p.lantai||'1'}</div>
          <div class="pg-tags">
            ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}
            ${p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge badge-blue">${p.kendaraan}</span>`:''}
          </div>
          <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:10px">${rp(p.sewa)}/bln</div>
          <div class="pg-actions" onclick="event.stopPropagation()">
            <button class="btn-outline btn-sm" onclick="openEdit('${p.id}')">Edit</button>
            <button class="btn-danger btn-sm" onclick="hapusPenghuni('${p.id}')">Hapus</button>
          </div>
        </div>`;
    }).join('');
  } else {
    $('penghuni-grid').style.display = 'none';
    $('penghuni-list-wrap').style.display = isEmpty ? 'none' : 'block';
    $('tbody-penghuni').innerHTML = list.map((p, idx) => `
      <tr onclick="openDetail('${p.id}')" style="cursor:pointer">
        <td>${idx + 1}</td>
        <td><strong>${p.nama}</strong><br><small style="color:var(--text-4)">${p.hp||'–'}</small></td>
        <td onclick="event.stopPropagation()">${maskNik(p.nik, p.id)}</td>
        <td>Kamar ${p.kamar||'–'}</td>
        <td>${p.hp||'–'}</td>
        <td>${p.kendaraan||'tidak ada'}</td>
        <td>${rp(p.sewa)}</td>
        <td>${p.deposit ? rp(p.deposit) : '–'}</td>
        <td>${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}</td>
        <td onclick="event.stopPropagation()">
          <button class="btn-outline btn-sm" onclick="openEdit('${p.id}')">Edit</button>
        </td>
      </tr>`).join('');
  }
}

$('cari-penghuni').addEventListener('input', renderPenghuni);
$('filter-status').addEventListener('change', renderPenghuni);
$('filter-kendaraan').addEventListener('change', renderPenghuni);
$('btn-grid-view').addEventListener('click', () => { currentView='grid'; $('btn-grid-view').classList.add('active'); $('btn-list-view').classList.remove('active'); renderPenghuni(); });
$('btn-list-view').addEventListener('click', () => { currentView='list'; $('btn-list-view').classList.add('active'); $('btn-grid-view').classList.remove('active'); renderPenghuni(); });

// ── PENGHUNI MODAL (TAMBAH / EDIT) ────────────────────────────
function populateKamarSelect(currentKamar = '') {
  const sel = $('field-kamar-select');
  const tip = $('field-kamar-tip');
  if (!sel) return;

  const occ = {};
  S.penghuni.filter(p => p.status === 'aktif').forEach(p => {
    if (p.kamar) occ[p.kamar] = p.nama;
  });

  const rooms = [...S.kamar].sort((a,b) => (a.no||'').localeCompare(b.no||'', undefined, { numeric: true }));
  let opts = '<option value="">-- Pilih Kamar Kosong --</option>';
  
  let currentFound = false;
  rooms.forEach(k => {
    const isOccupied = !!occ[k.no] && k.no !== currentKamar;
    const isCurrent = k.no === currentKamar;
    if (isCurrent) currentFound = true;
    
    if (!isOccupied || isCurrent) {
      opts += `<option value="${k.no}"${isCurrent ? ' selected' : ''}>Kamar ${k.no} (${k.tipe || 'Standar'} - Lt ${k.lantai || '1'} - ${rp(k.harga || 0)}/bln)</option>`;
    }
  });

  sel.innerHTML = opts;
  if (currentKamar) {
    if (currentFound) {
      sel.value = currentKamar;
      sel.style.display = 'block';
      $('field-kamar').style.display = 'none';
      $('field-kamar').value = currentKamar;
    } else {
      sel.value = '';
      sel.style.display = 'none';
      $('field-kamar').style.display = 'block';
      $('field-kamar').value = currentKamar;
    }
  } else {
    sel.style.display = 'block';
    $('field-kamar').style.display = 'none';
    $('field-kamar').value = '';
  }

  if (tip) tip.style.display = 'none';
}

function openModalPenghuni(id = null, preselectedKamar = null) {
  editId = id;
  switchFTab('identitas');
  $('form-penghuni').reset();
  $('prev-foto').style.display = 'none'; $('ph-foto').style.display = 'flex';
  $('prev-ktp').style.display  = 'none'; $('ph-ktp').style.display  = 'flex';

  if (id) {
    const p = S.penghuni.find(x => x.id === id);
    if (!p) return;
    $('modal-penghuni-title').textContent = 'Edit Data Penghuni';
    $('field-id').value           = p.id;
    $('field-nama').value         = p.nama || '';
    $('field-nik').value          = p.nik || '';
    $('field-gender').value       = p.gender || 'Laki-laki';
    $('field-tempat-lahir').value = p.tempatLahir || '';
    $('field-tgl-lahir').value    = p.tglLahir || '';
    $('field-alamat-ktp').value   = p.alamatKtp || '';
    $('field-hp').value           = p.hp || '';
    $('field-email').value        = p.email || '';
    $('field-pekerjaan').value    = p.pekerjaan || '';
    $('field-kamar').value        = p.kamar || '';
    populateKamarSelect(p.kamar || '');
    $('field-lantai').value       = p.lantai || '';
    $('field-tgl-masuk').value    = p.tglMasuk || '';
    $('field-tgl-keluar').value   = p.tglKeluar || '';
    $('field-status').value       = p.status || 'aktif';
    $('field-catatan').value      = p.catatan || '';
    $('field-kendaraan').value    = p.kendaraan || 'tidak ada';
    $('field-merk-1').value       = p.merk1 || '';
    $('field-plat-1').value       = p.plat1 || '';
    $('field-merk-2').value       = p.merk2 || '';
    $('field-plat-2').value       = p.plat2 || '';
    $('field-sewa').value         = p.sewa || '';
    $('field-tempo').value        = p.tempo || '';
    $('field-deposit').value      = p.deposit || '';
    $('field-catatan-deposit').value = p.catatanDeposit || '';
    $('field-catatan-bayar').value= p.catatanBayar || '';
    $('field-darurat-nama').value = p.daruratNama || '';
    $('field-darurat-hub').value  = p.daruratHub || '';
    $('field-darurat-hp').value   = p.daruratHp || '';
    $('field-darurat-alamat').value = p.daruratAlamat || '';
    toggleKendaraan(p.kendaraan);

    if (p.foto)    { $('prev-foto').src = p.foto; $('prev-foto').style.display = 'block'; $('ph-foto').style.display = 'none'; }
    if (p.fotoKtp) { $('prev-ktp').src = p.fotoKtp; $('prev-ktp').style.display = 'block'; $('ph-ktp').style.display = 'none'; }
  } else {
    $('modal-penghuni-title').textContent = 'Tambah Penghuni Baru';
    $('field-id').value = '';
    $('field-status').value = 'aktif';
    $('field-gender').value = 'Laki-laki';
    $('field-kendaraan').value = 'tidak ada';
    toggleKendaraan('tidak ada');
    
    const roomToSelect = preselectedKamar || '';
    populateKamarSelect(roomToSelect);
    if (roomToSelect) {
      $('field-kamar').value = roomToSelect;
      const matched = S.kamar.find(k => k.no === roomToSelect);
      if (matched) {
        if (matched.lantai) $('field-lantai').value = matched.lantai;
        if (matched.harga) $('field-sewa').value = matched.harga;
        const tip = $('field-kamar-tip');
        if (tip) {
          tip.textContent = `✓ Otomatis terisi: Kamar ${matched.no} (Lt ${matched.lantai || 1}) · Sewa ${rp(matched.harga || 0)}/bln`;
          tip.style.display = 'block';
        }
      }
    }
  }
  openModal('modal-penghuni');
}

window.openModalPenghuniWithRoom = function(roomNo) {
  openModalPenghuni(null, roomNo);
};

window.openEdit = id => openModalPenghuni(id);
$('btn-tambah-penghuni').addEventListener('click', () => openModalPenghuni());
$('modal-penghuni-close').addEventListener('click', () => closeModal('modal-penghuni'));
$('btn-batal-penghuni').addEventListener('click', () => closeModal('modal-penghuni'));
$('modal-penghuni').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-penghuni'); });

// Smart Kamar select change listener
const selKamarEl = $('field-kamar-select');
if (selKamarEl) {
  selKamarEl.addEventListener('change', function() {
    const val = this.value;
    $('field-kamar').value = val;
    const tip = $('field-kamar-tip');
    if (!val) {
      if (tip) tip.style.display = 'none';
      return;
    }
    const matched = S.kamar.find(k => k.no === val);
    if (matched) {
      if (matched.lantai) $('field-lantai').value = matched.lantai;
      if (matched.harga) $('field-sewa').value = matched.harga;
      if (tip) {
        tip.textContent = `✓ Otomatis terisi: Lantai ${matched.lantai || 1} & Sewa ${rp(matched.harga || 0)}/bln`;
        tip.style.display = 'block';
      }
    } else if (tip) {
      tip.style.display = 'none';
    }
  });
}

const btnToggleKamarEl = $('btn-toggle-manual-kamar');
if (btnToggleKamarEl) {
  btnToggleKamarEl.addEventListener('click', function() {
    const sel = $('field-kamar-select');
    const inp = $('field-kamar');
    if (inp.style.display === 'none') {
      inp.style.display = 'block';
      sel.style.display = 'none';
      inp.value = sel.value;
      this.textContent = '📋 Pilih dari List';
    } else {
      inp.style.display = 'none';
      sel.style.display = 'block';
      this.textContent = '✏️ Input Manual';
    }
  });
}

function switchFTab(name) {
  document.querySelectorAll('.ftab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.ftab-content').forEach(c => c.classList.remove('active'));
  const btn = document.querySelector(`.ftab[data-tab="${name}"]`);
  const con = $('ftab-' + name);
  if (btn) btn.classList.add('active'); if (con) con.classList.add('active');
}
document.querySelectorAll('.ftab').forEach(b => b.addEventListener('click', () => switchFTab(b.dataset.tab)));

window.toggleKendaraan = function(val) {
  const show1 = val && val !== 'tidak ada', show2 = val === 'motor & mobil';
  ['ken-row1a','ken-row1b'].forEach(id => { const el=$(id); if(el) el.style.display = show1?'block':'none'; });
  ['ken-row2a','ken-row2b'].forEach(id => { const el=$(id); if(el) el.style.display = show2?'block':'none'; });
};

// Auto Compress Photo on Selection
function setupCompressedPhoto(inputId, prevId, phId) {
  $(inputId).addEventListener('change', async function() {
    const f = this.files[0]; if (!f) return;
    try {
      toast('Mengompres foto... ⏳');
      const dataUrl = await compressImage(f, 900, 900, 0.75);
      $(prevId).src = dataUrl;
      $(prevId).style.display = 'block';
      $(phId).style.display = 'none';
      toast('Foto berhasil dioptimalkan! ✅');
    } catch (err) {
      toast('Gagal memproses gambar: ' + err.message, 'err');
    }
  });
}
setupCompressedPhoto('field-foto','prev-foto','ph-foto');
setupCompressedPhoto('field-ktp','prev-ktp','ph-ktp');

$('form-penghuni').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama     = $('field-nama').value.trim();
  const hp       = $('field-hp').value.trim();
  const kamar    = $('field-kamar').value.trim();
  const tglMasuk = $('field-tgl-masuk').value;

  if (!nama)     { toast('Nama wajib diisi!','err'); switchFTab('identitas'); return; }
  if (!hp)       { toast('No. HP wajib diisi!','err'); switchFTab('identitas'); return; }
  if (!kamar)    { toast('Nomor kamar wajib diisi!','err'); switchFTab('hunian'); return; }
  if (!tglMasuk) { toast('Tanggal masuk wajib diisi!','err'); switchFTab('hunian'); return; }

  const foto    = $('prev-foto').style.display !== 'none' ? $('prev-foto').src : null;
  const fotoKtp = $('prev-ktp').style.display !== 'none' ? $('prev-ktp').src : null;

  const d = {
    id: editId || uid(),
    nama, hp, kamar, tglMasuk,
    nik: $('field-nik').value.trim(),
    gender: $('field-gender').value,
    tempatLahir: $('field-tempat-lahir').value.trim(),
    tglLahir: $('field-tgl-lahir').value,
    alamatKtp: $('field-alamat-ktp').value.trim(),
    email: $('field-email').value.trim(),
    pekerjaan: $('field-pekerjaan').value.trim(),
    lantai: $('field-lantai').value.trim(),
    tglKeluar: $('field-tgl-keluar').value,
    status: $('field-status').value,
    catatan: $('field-catatan').value.trim(),
    kendaraan: $('field-kendaraan').value,
    merk1: $('field-merk-1').value.trim(),
    plat1: $('field-plat-1').value.trim(),
    merk2: $('field-merk-2').value.trim(),
    plat2: $('field-plat-2').value.trim(),
    sewa: $('field-sewa').value,
    tempo: $('field-tempo').value,
    deposit: $('field-deposit').value,
    catatanDeposit: $('field-catatan-deposit').value.trim(),
    catatanBayar: $('field-catatan-bayar').value.trim(),
    daruratNama: $('field-darurat-nama').value.trim(),
    daruratHub: $('field-darurat-hub').value,
    daruratHp: $('field-darurat-hp').value.trim(),
    daruratAlamat: $('field-darurat-alamat').value.trim(),
    foto, fotoKtp,
    createdAt: editId ? (S.penghuni.find(p=>p.id===editId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (editId) {
    const i = S.penghuni.findIndex(p => p.id === editId);
    if (i !== -1) S.penghuni[i] = d;
    toast('Data penghuni diperbarui! ✅');
  } else {
    S.penghuni.unshift(d);
    toast('Penghuni berhasil ditambahkan! 🎉');
  }

  LS.save();
  closeModal('modal-penghuni');
  renderPenghuni();
  if ($('page-dashboard').classList.contains('active')) renderDashboard();

  await DB.savePenghuni(d);
});

window.hapusPenghuni = function(id) {
  const p = S.penghuni.find(x => x.id === id);
  confirm_dlg('Hapus Penghuni', `Hapus data penghuni "${p?.nama||id}"?`, async () => {
    S.penghuni = S.penghuni.filter(x => x.id !== id);
    LS.save();
    renderPenghuni();
    if ($('page-dashboard').classList.contains('active')) renderDashboard();
    toast('Penghuni dihapus.');
    await DB.deletePenghuni(id);
  }, 'Hapus');
};

// ── DETAIL PENGHUNI MODAL ─────────────────────────────────────
window.openDetail = function(id) {
  detailId = id;
  const p = S.penghuni.find(x => x.id === id);
  if (!p) return;
  const bln = thisMonth(), pb = S.pembayaran.find(x => x.penghuniId === p.id && x.bulan === bln);
  const age = ageOf(p.tglLahir);
  const av = p.foto ? `<img class="d-avatar" src="${p.foto}" alt="${p.nama}"/>` : `<div class="d-avatar-ph">${init(p.nama)}</div>`;

  $('detail-title').textContent = p.nama;
  $('detail-body').innerHTML = `
    <div class="detail-hero">
      ${av}
      <div>
        <div class="d-name">${p.nama}</div>
        <div class="d-tags">
          ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}
          ${pb?.status==='lunas'?'<span class="badge badge-green">Lunas Bulan Ini</span>':'<span class="badge badge-red">Belum Bayar</span>'}
          <span class="badge badge-blue">Kamar ${p.kamar||'–'}</span>
        </div>
        <div class="d-meta">${p.pekerjaan||'–'} · Masuk: ${fmtD(p.tglMasuk)} (${durasi(p.tglMasuk)})</div>
      </div>
    </div>
    <div class="detail-sections">
      <div class="d-section">
        <h4>🪪 Identitas</h4>
        <div class="d-row"><div class="d-key">NIK (Terproteksi)</div><div class="d-val">${maskNik(p.nik, p.id)}</div></div>
        <div class="d-row"><div class="d-key">Jenis Kelamin</div><div class="d-val">${p.gender||'–'}</div></div>
        <div class="d-row"><div class="d-key">TTL</div><div class="d-val">${p.tempatLahir?p.tempatLahir+', ':''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</div></div>
        <div class="d-row"><div class="d-key">Alamat KTP</div><div class="d-val">${p.alamatKtp||'–'}</div></div>
        <div class="d-row"><div class="d-key">Email</div><div class="d-val">${p.email||'–'}</div></div>
      </div>
      <div class="d-section">
        <h4>🏠 Hunian &amp; Kontak</h4>
        <div class="d-row"><div class="d-key">Kamar / Lantai</div><div class="d-val">Kamar ${p.kamar||'–'} (Lantai ${p.lantai||'1'})</div></div>
        <div class="d-row"><div class="d-key">No. HP / WA</div><div class="d-val">${p.hp||'–'}</div></div>
        <div class="d-row"><div class="d-key">Kontak Darurat</div><div class="d-val">${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</div></div>
        <div class="d-row"><div class="d-key">HP Darurat</div><div class="d-val">${p.daruratHp||'–'}</div></div>
      </div>
      <div class="d-section">
        <h4>💳 Keuangan &amp; Sewa</h4>
        <div class="d-row"><div class="d-key">Sewa Bulanan</div><div class="d-val">${rp(p.sewa)}</div></div>
        <div class="d-row"><div class="d-key">Jatuh Tempo</div><div class="d-val">${p.tempo?'Tanggal '+p.tempo+' setiap bulan':'–'}</div></div>
        <div class="d-row"><div class="d-key">Uang Jaminan / Deposit</div><div class="d-val" style="color:var(--orange)">${p.deposit?rp(p.deposit):'Rp 0'} ${p.catatanDeposit?'('+p.catatanDeposit+')':''}</div></div>
        <div class="d-row"><div class="d-key">Status Bulan Ini</div><div class="d-val">${pb?.status==='lunas'?'✅ Lunas':'❌ Belum Bayar'}</div></div>
      </div>
      <div class="d-section">
        <h4>🚗 Kendaraan</h4>
        <div class="d-row"><div class="d-key">Kepemilikan</div><div class="d-val">${p.kendaraan||'Tidak ada'}</div></div>
        ${p.merk1?`<div class="d-row"><div class="d-key">Kendaraan 1</div><div class="d-val">${p.merk1}${p.plat1?' ('+p.plat1+')':''}</div></div>`:''}
        ${p.merk2?`<div class="d-row"><div class="d-key">Kendaraan 2</div><div class="d-val">${p.merk2}${p.plat2?' ('+p.plat2+')':''}</div></div>`:''}
      </div>
    </div>
    ${p.fotoKtp?`<div class="d-ktp"><h4>📷 Dokumen KTP (Hanya Akses Manager)</h4><img src="${p.fotoKtp}" alt="KTP"/></div>`:''}
  `;

  const btnWa = $('btn-wa-detail');
  if (btnWa) {
    if (p.hp) {
      const cleanHp = p.hp.replace(/\D/g, '').replace(/^0/, '62');
      btnWa.href = `https://wa.me/${cleanHp}`;
      btnWa.style.display = 'inline-flex';
    } else {
      btnWa.style.display = 'none';
    }
  }

  openModal('modal-detail');
};

$('detail-close').addEventListener('click', () => closeModal('modal-detail'));
$('modal-detail').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-detail'); });
$('btn-edit-detail').addEventListener('click', () => { closeModal('modal-detail'); openEdit(detailId); });
$('btn-hapus-detail').addEventListener('click', () => { closeModal('modal-detail'); hapusPenghuni(detailId); });
$('btn-print-detail').addEventListener('click', () => { const p = S.penghuni.find(x => x.id === detailId); if (p) printKartu(p); });
$('btn-print-spk').addEventListener('click', () => { const p = S.penghuni.find(x => x.id === detailId); if (p) printSpk(p); });

// ── CETAK SURAT PERJANJIAN SEWA KOST (SPK) ────────────────────
window.printSpk = function(p) {
  const tglNow = new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Perjanjian Sewa Kost – ${p.nama}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; color: #111; padding: 40px 50px; max-width: 800px; margin: 0 auto; line-height: 1.5; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline; margin-bottom: 4px; text-transform: uppercase; }
    .subhead { text-align: center; font-size: 12px; margin-bottom: 24px; }
    p { margin-bottom: 10px; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
    td { padding: 4px 6px; vertical-align: top; }
    td.label { width: 180px; font-weight: bold; }
    .pasal-title { text-align: center; font-weight: bold; margin-top: 16px; margin-bottom: 6px; font-size: 13px; }
    .sig-table { width: 100%; margin-top: 40px; }
    .sig-table td { text-align: center; width: 50%; padding-top: 60px; font-weight: bold; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>SURAT PERJANJIAN SEWA MENYEWA KAMAR KOST</h1>
  <div class="subhead">${S.kost.nama || 'SiKost'} – No: SPK/${new Date().getFullYear()}/${p.kamar || '00'}</div>

  <p>Pada hari ini, telah dibuat dan disepakati perjanjian sewa kamar kost antara pihak-pihak sebagai berikut:</p>
  
  <table>
    <tr><td class="label">1. Nama Pengelola / Pemilik</td><td>: ${S.kost.pemilik || 'Pengelola Kost'}</td></tr>
    <tr><td class="label">   Alamat Kost</td><td>: ${S.kost.alamat || '–'}</td></tr>
    <tr><td class="label">   No. Telepon / WA</td><td>: ${S.kost.hp || '–'}</td></tr>
    <tr><td colspan="2">Selanjutnya disebut sebagai <strong>PIHAK PERTAMA (Pemilik/Pengelola)</strong>.</td></tr>
  </table>

  <table>
    <tr><td class="label">2. Nama Penghuni (Penyewa)</td><td>: ${p.nama}</td></tr>
    <tr><td class="label">   NIK KTP</td><td>: ${p.nik || '–'}</td></tr>
    <tr><td class="label">   Tempat / Tgl Lahir</td><td>: ${p.tempatLahir ? p.tempatLahir + ', ' : ''}${fmtD(p.tglLahir)}</td></tr>
    <tr><td class="label">   No. HP / WA</td><td>: ${p.hp || '–'}</td></tr>
    <tr><td class="label">   Pekerjaan / Instansi</td><td>: ${p.pekerjaan || '–'}</td></tr>
    <tr><td colspan="2">Selanjutnya disebut sebagai <strong>PIHAK KEDUA (Penyewa)</strong>.</td></tr>
  </table>

  <p>Kedua belah pihak telah bersepakat untuk mengikatkan diri dalam Perjanjian Sewa Kamar Kost dengan ketentuan sebagai berikut:</p>

  <div class="pasal-title">PASAL 1 – OBJEK SEWA &amp; FASILITAS</div>
  <p>PIHAK PERTAMA menyewakan kepada PIHAK KEDUA 1 (satu) unit Kamar Nomor <strong>${p.kamar || '–'}</strong> (Lantai ${p.lantai || '1'}) di ${S.kost.nama || 'Kost'} beserta fasilitas yang melekat pada kamar tersebut.</p>

  <div class="pasal-title">PASAL 2 – HARGA SEWA &amp; CARA PEMBAYARAN</div>
  <p>1. Biaya sewa kamar disepakati sebesar <strong>${rp(p.sewa)}</strong> per bulan.<br>
     2. Pembayaran wajib dilakukan selambat-lambatnya tanggal <strong>${p.tempo || '1'}</strong> setiap bulannya.<br>
     3. PIHAK KEDUA telah menyerahkan Uang Jaminan (Deposit) sebesar <strong>${p.deposit ? rp(p.deposit) : 'Rp 0'}</strong> yang akan dikembalikan secara utuh pada saat masa sewa berakhir setelah dipastikan tidak ada tunggakan dan kerusakan fasilitas.</p>

  <div class="pasal-title">PASAL 3 – TATA TERTIB &amp; LARANGAN</div>
  <p>1. PIHAK KEDUA wajib menjaga kebersihan, ketertiban, dan keamanan lingkungan kost.<br>
     2. Dilarang keras membawa, menyimpan, atau mengonsumsi minuman keras, narkotika, dan obat-obatan terlarang.<br>
     3. Dilarang membawa tamu lawan jenis ke dalam kamar tidur di luar jam kunjungan yang telah ditentukan.<br>
     4. Segala kerusakan fasilitas akibat kelalaian PIHAK KEDUA menjadi tanggung jawab PIHAK KEDUA.</p>

  <div class="pasal-title">PASAL 4 – BERAKHIRNYA PERJANJIAN</div>
  <p>Apabila PIHAK KEDUA bermaksud untuk berhenti menyewa, wajib memberitahukan kepada PIHAK PERTAMA sekurang-kurangnya 14 (empat belas) hari sebelum tanggal jatuh tempo berikutnya.</p>

  <table class="sig-table">
    <tr>
      <td>
        PIHAK PERTAMA<br>(Pengelola Kost)<br><br><br><br>
        ( ${S.kost.pemilik || 'Pengelola Kost'} )
      </td>
      <td>
        ${S.kost.alamat ? S.kost.alamat.split(',')[0] : 'Indonesia'}, ${tglNow}<br>
        PIHAK KEDUA<br>(Penyewa)<br><br><br><br>
        ( ${p.nama} )
      </td>
    </tr>
  </table>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 300);
};

// ── PRINT KARTU DATA PENGHUNI ─────────────────────────────────
window.printKartu = function(p) {
  const age = ageOf(p.tglLahir);
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Kartu Penghuni – ${p.nama}</title>
<style>
body{font-family:Arial,sans-serif;color:#111;padding:30px;max-width:640px;margin:0 auto}
h1{font-size:17px;font-weight:800;margin-bottom:2px}.sub{color:#666;font-size:11px;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #000}
.hero{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}
img.av{width:80px;height:80px;object-fit:cover;border:1px solid #ccc;border-radius:4px}
.av-ph{width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#555;border-radius:4px}
h2{font-size:15px;margin:0 0 4px}.badges{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px}
.badge{border:1px solid #333;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700}
table{width:100%;border-collapse:collapse;font-size:11px}
td{padding:5px 7px;border:1px solid #ddd;vertical-align:top}
td:first-child{font-weight:700;width:150px;background:#f5f5f5}
.sh{background:#111;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 7px}
@media print{body{padding:10px}}
</style></head><body>
<h1>KARTU DATA PENGHUNI KOST</h1><div class="sub">${S.kost.nama} · ${S.kost.alamat||'–'} · HP: ${S.kost.hp||'–'}</div>
<div class="hero">${p.foto?`<img class="av" src="${p.foto}" alt="${p.nama}"/>`:`<div class="av-ph">${init(p.nama)}</div>`}
<div><h2>${p.nama}</h2><div class="badges"><span class="badge">Kamar ${p.kamar||'–'}</span><span class="badge">${p.status==='aktif'?'Aktif':'Tidak Aktif'}</span>${p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge">${p.kendaraan}</span>`:''}</div><div style="font-size:11px;color:#666">Masuk: ${fmtD(p.tglMasuk)} · ${durasi(p.tglMasuk)}</div></div></div>
<table>
<tr><td colspan="2" class="sh">Identitas</td></tr>
<tr><td>NIK</td><td>${p.nik||'–'}</td></tr>
<tr><td>Jenis Kelamin</td><td>${p.gender||'–'}</td></tr>
<tr><td>Tgl Lahir</td><td>${p.tempatLahir?p.tempatLahir+', ':''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</td></tr>
<tr><td>Alamat KTP</td><td>${p.alamatKtp||'–'}</td></tr>
<tr><td>Pekerjaan</td><td>${p.pekerjaan||'–'}</td></tr>
<tr><td colspan="2" class="sh">Kontak</td></tr>
<tr><td>HP / WA</td><td>${p.hp||'–'}</td></tr>
<tr><td>Email</td><td>${p.email||'–'}</td></tr>
<tr><td colspan="2" class="sh">Hunian & Sewa</td></tr>
<tr><td>Kamar</td><td>${p.kamar||'–'} ${p.lantai?'(Lantai '+p.lantai+')':''}</td></tr>
<tr><td>Tanggal Masuk</td><td>${fmtD(p.tglMasuk)}</td></tr>
<tr><td>Sewa / Bulan</td><td>${rp(p.sewa)}</td></tr>
<tr><td>Uang Jaminan (Deposit)</td><td>${p.deposit?rp(p.deposit):'Rp 0'}</td></tr>
<tr><td colspan="2" class="sh">Kendaraan</td></tr>
<tr><td>Kepemilikan</td><td>${p.kendaraan||'Tidak ada'}</td></tr>
${p.merk1?`<tr><td>Kendaraan 1</td><td>${p.merk1}${p.plat1?' · Plat: '+p.plat1:''}</td></tr>`:''}
${p.merk2?`<tr><td>Kendaraan 2</td><td>${p.merk2}${p.plat2?' · Plat: '+p.plat2:''}</td></tr>`:''}
<tr><td colspan="2" class="sh">Kontak Darurat</td></tr>
<tr><td>Nama</td><td>${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</td></tr>
<tr><td>HP Darurat</td><td>${p.daruratHp||'–'}</td></tr>
</table>
</body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 300);
};

// ── KAMAR (ROOMS) ─────────────────────────────────────────────
let activeFloorFilter = '';

function renderKamar() {
  const filter = $('filter-kamar-status')?.value || '';
  const occ = {};
  S.penghuni.filter(p => p.status === 'aktif').forEach(p => {
    if (p.kamar) { if (!occ[p.kamar]) occ[p.kamar] = []; occ[p.kamar].push(p); }
  });

  const list = [...S.kamar].sort((a,b) => (a.no||'').localeCompare(b.no||'', undefined, { numeric: true }));

  // Render Floor Tabs
  const floorTabsEl = $('km-floor-tabs');
  if (floorTabsEl) {
    const floors = [...new Set(list.map(k => String(k.lantai || '1')))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
    floorTabsEl.innerHTML = `
      <button type="button" class="km-floor-tab ${activeFloorFilter === '' ? 'active' : ''}" onclick="setFloorFilter('')">Semua Lantai</button>
      ${floors.map(fl => `
        <button type="button" class="km-floor-tab ${activeFloorFilter === fl ? 'active' : ''}" onclick="setFloorFilter('${fl}')">Lantai ${fl}</button>
      `).join('')}
    `;
  }

  const kpiEl = $('kpi-kamar-row');
  if (kpiEl) {
    const total = list.length;
    const terisi = Object.keys(occ).length;
    const kosong = Math.max(0, total - terisi);
    const persen = total > 0 ? Math.round((terisi / total) * 100) : 0;
    kpiEl.innerHTML = `
      <div class="kpi"><div class="kpi-label">Total Kamar</div><div class="kpi-value">${total}</div><div class="kpi-sub">kapasitas terdaftar</div></div>
      <div class="kpi"><div class="kpi-label">Kamar Terisi</div><div class="kpi-value" style="color:var(--green)">${terisi}</div><div class="kpi-sub">sedang berpenghuni</div></div>
      <div class="kpi"><div class="kpi-label">Kamar Kosong</div><div class="kpi-value" style="color:var(--orange)">${kosong}</div><div class="kpi-sub">siap disewakan</div></div>
      <div class="kpi"><div class="kpi-label">Tingkat Okupansi</div><div class="kpi-value" style="color:var(--accent-light)">${persen}%</div><div class="kpi-sub">tingkat keterisian</div></div>
    `;
  }

  const curMonth = thisMonth();
  const filtered = list.filter(k => {
    const t = !!occ[k.no];
    if (filter === 'terisi' && !t) return false;
    if (filter === 'kosong' && t) return false;
    if (activeFloorFilter && String(k.lantai || '1') !== activeFloorFilter) return false;
    return true;
  });

  $('kamar-grid').innerHTML = filtered.map(k => {
    const isTerisi = !!occ[k.no], pen = occ[k.no] || [];
    const p = pen[0];
    let isLunas = false;
    if (p) {
      const pb = S.pembayaran.find(x => x.penghuniId === p.id && x.bulan === curMonth && x.status === 'lunas');
      isLunas = !!pb;
    }

    const cardClass = isTerisi ? (isLunas ? 'terisi' : 'menunggak') : 'kosong';
    let statusBadge = '';
    let quickActionBtn = '';

    if (isTerisi && p) {
      if (isLunas) {
        statusBadge = `<span class="badge badge-green">Lunas</span>`;
        quickActionBtn = `<button type="button" class="btn-ghost btn-sm" onclick="showKwitansi('${p.id}','${curMonth}')" title="Lihat kwitansi lunas">🧾 Kwitansi</button>`;
      } else {
        statusBadge = `<span class="badge badge-red">Belum Lunas</span>`;
        quickActionBtn = `
          <button type="button" class="btn-primary btn-sm" onclick="quickPayTenant('${p.id}','${curMonth}')" title="1-Klik Lunas">⚡ 1-Klik Lunas</button>
          <button type="button" class="btn-wa btn-sm" onclick="kirimWaTagihan('${p.id}','${curMonth}')" title="Kirim WA">📱 WA</button>
        `;
      }
    } else {
      statusBadge = `<span class="badge badge-gray">🟢 Siap Huni</span>`;
      quickActionBtn = `<button type="button" class="btn-primary btn-sm" onclick="openModalPenghuniWithRoom('${k.no}')">+ Masukkan Penghuni</button>`;
    }

    return `<div class="km-card enhanced ${cardClass}">
      <div>
        <div class="km-badge-row">
          <div class="km-no">${k.no}</div>
          ${statusBadge}
        </div>
        <div class="km-lbl">Lantai ${k.lantai||'1'} · ${k.tipe||'Standar'}</div>
        
        <div class="km-card-tenant-box">
          ${isTerisi ? `
            <div class="km-name" style="font-weight:700;color:var(--text)">${pen.map(x=>x.nama).join(', ')}</div>
            ${p?.hp ? `<div style="font-size:0.75rem;color:var(--text-3);margin-top:2px">📞 ${p.hp}</div>` : ''}
          ` : `
            <div class="km-name" style="color:var(--text-4);font-weight:normal;font-style:italic">Siap Huni</div>
          `}
        </div>

        ${k.harga?`<div class="km-info" style="font-weight:700;color:var(--accent-light)">${rp(k.harga)}/bln</div>`:''}
        ${k.fasilitas?`<div class="km-info" style="font-size:0.75rem;color:var(--text-3)">${k.fasilitas}</div>`:''}
      </div>

      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
          ${quickActionBtn}
        </div>
        <div class="km-actions">
          <button class="btn-outline btn-sm" onclick="editKamar('${k.id}')">Edit</button>
          <button class="btn-danger btn-sm" onclick="hapusKamar('${k.id}')">Hapus</button>
        </div>
      </div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="empty-emoji">🛏</div><p class="empty-title">Belum ada kamar</p><p class="empty-sub">Klik "Tambah Kamar" untuk mengelola kamar.</p></div>`;
}

window.setFloorFilter = function(fl) {
  activeFloorFilter = fl;
  renderKamar();
};

window.quickPayTenant = async function(pid, bln = thisMonth()) {
  const p = S.penghuni.find(x => x.id === pid);
  if (!p) return;
  const [y, mo] = bln.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  confirm_dlg(
    'Konfirmasi Pembayaran Cepat ⚡',
    `Tandai pembayaran sewa bulan <strong>${blnLabel}</strong> untuk <strong>${p.nama}</strong> (Kamar ${p.kamar || ''}) sebesar <strong>${rp(p.sewa)}</strong> telah <strong>LUNAS</strong>?`,
    async () => {
      await tandaiBayar(pid, bln, p.sewa || 0);
      renderDashboard();
      renderKamar();
      renderPembayaran();
      toast(`Pembayaran ${p.nama} (${blnLabel}) Lunas! 🧾`, 'ok');
    },
    '⚡ Ya, Lunas Sekarang'
  );
};

$('filter-kamar-status').addEventListener('change', renderKamar);
$('btn-tambah-kamar').addEventListener('click', () => {
  $('modal-kamar-title').textContent = 'Tambah Kamar';
  $('form-kamar').reset();
  $('field-kamar-id').value = '';
  openModal('modal-kamar');
});
$('modal-kamar-close').addEventListener('click', () => closeModal('modal-kamar'));
$('btn-batal-kamar').addEventListener('click', () => closeModal('modal-kamar'));
$('modal-kamar').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-kamar'); });

$('form-kamar').addEventListener('submit', async function(e) {
  e.preventDefault();
  const no = $('field-no-kamar').value.trim(); if (!no) { toast('Nomor kamar wajib!','err'); return; }
  const id = $('field-kamar-id').value || uid();
  const d = {
    id, no,
    lantai: $('field-lantai-kamar').value.trim() || '1',
    tipe: $('field-tipe-kamar').value,
    harga: $('field-harga-kamar').value,
    fasilitas: $('field-fasilitas').value.trim()
  };
  const i = S.kamar.findIndex(k => k.id === id);
  if (i !== -1) { S.kamar[i] = d; toast('Kamar diperbarui!'); }
  else { S.kamar.push(d); toast('Kamar ditambahkan!'); }
  LS.save(); closeModal('modal-kamar'); renderKamar();
  await DB.saveKamar(d);
});

window.editKamar = function(id) {
  const k = S.kamar.find(x => x.id === id); if (!k) return;
  $('modal-kamar-title').textContent = 'Edit Kamar';
  $('field-kamar-id').value = k.id;
  $('field-no-kamar').value = k.no || '';
  $('field-lantai-kamar').value = k.lantai || '';
  $('field-tipe-kamar').value = k.tipe || 'Standar';
  $('field-harga-kamar').value = k.harga || '';
  $('field-fasilitas').value = k.fasilitas || '';
  openModal('modal-kamar');
};

window.hapusKamar = function(id) {
  const k = S.kamar.find(x => x.id === id);
  confirm_dlg('Hapus Kamar', `Hapus kamar ${k?.no||id}?`, async () => {
    S.kamar = S.kamar.filter(x => x.id !== id);
    LS.save(); renderKamar(); toast('Kamar dihapus.');
    await DB.deleteKamar(id);
  }, 'Hapus');
};

// ── PEMBAYARAN & TAGIHAN ──────────────────────────────────────
function renderPembayaran() {
  const sel = $('filter-bulan-bayar');
  const months = []; const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(ym);
  }
  const cur = sel.value || months[0];
  sel.innerHTML = months.map(m => {
    const [y, mo] = m.split('-');
    const lbl = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return `<option value="${m}"${m === cur ? ' selected' : ''}>${lbl}</option>`;
  }).join('');

  const bln = sel.value || months[0];
  const [y, mo] = bln.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const payments = S.pembayaran.filter(pb => pb.bulan === bln);
  const lunas = payments.filter(pb => pb.status === 'lunas');
  const pending = payments.filter(pb => pb.status === 'menunggu');
  const belum = Math.max(0, aktif.length - lunas.length);
  const terkumpul = lunas.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);

  $('kpi-bayar').innerHTML = `
    <div class="kpi"><div class="kpi-label">Sudah Bayar</div><div class="kpi-value" style="color:var(--green)">${lunas.length}</div><div class="kpi-sub">penghuni lunas</div></div>
    <div class="kpi"><div class="kpi-label">Belum Bayar</div><div class="kpi-value" style="color:var(--red)">${belum}</div><div class="kpi-sub">penghuni aktif</div></div>
    <div class="kpi"><div class="kpi-label">Terkumpul</div><div class="kpi-value" style="font-size:1.15rem;color:var(--green)">${rp(terkumpul)}</div><div class="kpi-sub">bulan ${blnLabel}</div></div>
    <div class="kpi"><div class="kpi-label">Total Tagihan</div><div class="kpi-value" style="font-size:1.15rem">${rp(aktif.reduce((s,p)=>s+(Number(p.sewa)||0),0))}</div><div class="kpi-sub">keseluruhan</div></div>
  `;

  // Section Verifikasi Pembayaran Pending
  const panelPending = $('panel-verifikasi-bayar');
  const tbodyPending = $('tbody-pending-bayar');
  const countPending = $('badge-count-pending-bayar');
  if (panelPending && tbodyPending) {
    if (pending.length > 0) {
      panelPending.style.display = 'block';
      countPending.textContent = `${pending.length} Menunggu Verifikasi`;
      tbodyPending.innerHTML = pending.map(pb => {
        const p = S.penghuni.find(x => x.id === pb.penghuniId);
        return `<tr>
          <td><strong>${p?.nama || '–'}</strong></td>
          <td>Kamar ${p?.kamar || '–'}</td>
          <td>${blnLabel}</td>
          <td><strong style="color:var(--green)">${rp(pb.jumlah)}</strong></td>
          <td>${fmtD(pb.tglBayar)}</td>
          <td>${pb.buktiTransfer ? `<a href="${pb.buktiTransfer}" target="_blank"><img src="${pb.buktiTransfer}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '–'}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn-primary btn-sm" onclick="setujuiBayar('${pb.id}')">✅ Setujui</button>
              <button class="btn-danger btn-sm" onclick="tolakBayar('${pb.id}')">❌ Tolak</button>
            </div>
          </td>
        </tr>`;
      }).join('');
    } else {
      panelPending.style.display = 'none';
    }
  }

  // Filter Status Bayar
  const filterStat = $('filter-status-bayar')?.value || '';
  const nowDay = new Date().getDate();

  $('tbody-pembayaran').innerHTML = aktif.filter(p => {
    const pb = payments.find(x => x.penghuniId === p.id);
    const isLunas = pb?.status === 'lunas';
    if (filterStat === 'lunas') return isLunas;
    if (filterStat === 'belum') return !isLunas;
    return true;
  }).map(p => {
    const pb = payments.find(x => x.penghuniId === p.id);
    const isLunas = pb?.status === 'lunas';
    const isPending = pb?.status === 'menunggu';

    // Status Jatuh Tempo
    let tempoBadge = '<span class="badge badge-gray">–</span>';
    if (p.tempo) {
      const diff = Number(p.tempo) - nowDay;
      if (isLunas) {
        tempoBadge = `<span class="badge badge-green">Tgl ${p.tempo} (Lunas)</span>`;
      } else if (diff < 0) {
        tempoBadge = `<span class="badge badge-red">Terlambat (${Math.abs(diff)} hari)</span>`;
      } else if (diff <= 3) {
        tempoBadge = `<span class="badge badge-orange">H-${diff} Tempo (Tgl ${p.tempo})</span>`;
      } else {
        tempoBadge = `<span class="badge badge-blue">Tgl ${p.tempo}</span>`;
      }
    }

    let statusCell = isLunas ? '<span class="badge badge-green">Lunas</span>' : (isPending ? '<span class="badge badge-orange">Menunggu Verifikasi</span>' : '<span class="badge badge-red">Belum Bayar</span>');

    let aksiCell = '';
    if (isLunas) {
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-ghost btn-sm" onclick="showKwitansi('${p.id}','${bln}')">🧾 Kwitansi</button>
          <button class="btn-outline btn-sm" onclick="batalBayar('${p.id}','${bln}')" title="Batalkan status lunas">Batalkan</button>
        </div>`;
    } else if (isPending) {
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-primary btn-sm" onclick="setujuiBayar('${pb.id}')">Setujui</button>
          <button class="btn-wa" onclick="kirimWaTagihan('${p.id}','${bln}')">📱 WA</button>
        </div>`;
    } else {
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-primary btn-sm" onclick="tandaiBayar('${p.id}','${bln}',${p.sewa||0})">✅ Tandai Lunas</button>
          <button class="btn-wa" onclick="kirimWaTagihan('${p.id}','${bln}')">📱 WA</button>
        </div>`;
    }

    return `<tr>
      <td><strong>${p.nama}</strong></td>
      <td>Kamar ${p.kamar||'–'}</td>
      <td>${blnLabel}</td>
      <td>${tempoBadge}</td>
      <td>${rp(p.sewa)}</td>
      <td>${statusCell}</td>
      <td>${aksiCell}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-3)">Tidak ada data pembayaran yang sesuai.</td></tr>`;
}

$('filter-bulan-bayar').addEventListener('change', renderPembayaran);
$('filter-status-bayar').addEventListener('change', renderPembayaran);

window.kirimWaTagihan = function(pid, bln) {
  const p = S.penghuni.find(x => x.id === pid);
  if (!p) return;
  if (!p.hp) { toast('Nomor HP penghuni belum diisi!', 'err'); return; }

  const cleanHp = p.hp.replace(/\D/g, '').replace(/^0/, '62');
  const [y, mo] = bln.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Sertakan info rekening bank & nomor kamar secara otomatis
  let rekInfo = '';
  if (S.kost.bankNama && S.kost.bankRekening) {
    rekInfo = `\n\nPembayaran dapat ditransfer ke:\n🏦 ${S.kost.bankNama}: *${S.kost.bankRekening}*\n👤 a.n ${S.kost.bankAtasNama || S.kost.pemilik}`;
  }

  let text = '';
  if (S.kost.waTemplate && S.kost.waTemplate.trim()) {
    text = S.kost.waTemplate
      .replace(/{nama}/g, p.nama)
      .replace(/{kamar}/g, p.kamar || '')
      .replace(/{bulan}/g, blnLabel)
      .replace(/{nominal}/g, rp(p.sewa))
      .replace(/{kost}/g, S.kost.nama || 'Kost')
      .replace(/{bank}/g, S.kost.bankNama || 'Bank')
      .replace(/{rekening}/g, S.kost.bankRekening || '')
      .replace(/{pemilik}/g, S.kost.bankAtasNama || S.kost.pemilik || '')
      .replace(/{tempo}/g, p.tempo || S.kost.tempoDefault || 5);
  } else {
    text = `Halo Kak ${p.nama}, mengingatkan tagihan sewa kamar ${p.kamar || ''} di ${S.kost.nama || 'Kost'} untuk bulan ${blnLabel} sebesar *${rp(p.sewa)}* telah jatuh tempo.${rekInfo}\n\nMohon konfirmasi atau kirimkan bukti transfer jika sudah membayar ya. Terima kasih banyak! 🙏`;
  }
  
  const targetUrl = `https://wa.me/${cleanHp}?text=${encodeURIComponent(text)}`;
  window.__lastOpenedUrl = targetUrl;
  window.open(targetUrl, '_blank');
};

window.tandaiBayar = async function(pid, bln, jumlah) {
  let pb = S.pembayaran.find(x => x.penghuniId === pid && x.bulan === bln);
  if (pb) {
    pb.status = 'lunas'; pb.jumlah = jumlah; pb.tglBayar = new Date().toISOString(); pb.verifiedAt = new Date().toISOString();
  } else {
    pb = { id: uid(), penghuniId: pid, bulan: bln, jumlah, status: 'lunas', tglBayar: new Date().toISOString(), verifiedAt: new Date().toISOString() };
    S.pembayaran.push(pb);
  }
  LS.save(); renderPembayaran(); toast('Pembayaran dicatat Lunas! 💰');
  await DB.savePembayaran(pb);
  updateSidebarBadges();
};

window.batalBayar = async function(pid, bln) {
  S.pembayaran = S.pembayaran.filter(pb => !(pb.penghuniId === pid && pb.bulan === bln));
  LS.save(); renderPembayaran(); toast('Status pembayaran direset.');
  await DB.deletePembayaran(pid, bln);
  updateSidebarBadges();
};

window.setujuiBayar = async function(pbId) {
  const pb = S.pembayaran.find(x => x.id === pbId);
  if (!pb) return;
  pb.status = 'lunas';
  pb.verifiedAt = new Date().toISOString();
  LS.save(); renderPembayaran(); toast('Pembayaran disetujui & lunas! ✅');
  await DB.savePembayaran(pb);
  updateSidebarBadges();
};

window.tolakBayar = async function(pbId) {
  confirm_dlg('Tolak Pembayaran', 'Tolak konfirmasi transfer ini?', async () => {
    S.pembayaran = S.pembayaran.filter(x => x.id !== pbId);
    LS.save(); renderPembayaran(); toast('Konfirmasi pembayaran ditolak.');
    if (sbClient) {
      try { await sbClient.from('pembayaran').delete().eq('id', pbId); } catch {}
    }
    updateSidebarBadges();
  }, 'Tolak');
};

// ── KWITANSI DIGITAL RESMI ────────────────────────────────────
let activeKwitansiData = null;

window.showKwitansi = function(penghuniId, bulan) {
  const p = S.penghuni.find(x => x.id === penghuniId);
  const pb = S.pembayaran.find(x => x.penghuniId === penghuniId && x.bulan === bulan);
  if (!p || !pb) return;

  const [y, mo] = bulan.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const invoiceNo = `KW-${bulan.replace('-', '')}-${(p.kamar || '00').padStart(3, '0')}`;
  const tglBayar = pb.tglBayar ? fmtD(pb.tglBayar) : fmtD(new Date());

  activeKwitansiData = { p, pb, blnLabel, invoiceNo, tglBayar };

  $('modal-kwitansi-body').innerHTML = `
    <div class="kwitansi-sheet" id="kwitansi-print-area">
      <div class="kwitansi-header">
        <div>
          <h2 style="font-size:1.3rem;font-weight:900;margin:0;letter-spacing:-0.03em">${S.kost.nama || 'SiKost'}</h2>
          <div style="font-size:0.75rem;color:#64748b;margin-top:2px">${S.kost.alamat || 'Alamat Kost'} · Telp/WA: ${S.kost.hp || '–'}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.75rem;font-weight:700;color:#64748b">NO. BUKTI PEMBAYARAN</div>
          <div style="font-size:0.95rem;font-weight:800;font-family:var(--font-mono)">${invoiceNo}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #e2e8f0">
        <div>
          <div style="font-size:0.72rem;color:#64748b;font-weight:700;text-transform:uppercase">Diterima Dari:</div>
          <div style="font-size:1.1rem;font-weight:800">${p.nama}</div>
          <div style="font-size:0.8rem;color:#475569">Kamar ${p.kamar || '–'} (Lantai ${p.lantai || '1'})</div>
        </div>
        <div class="stamp-lunas">LUNAS</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.85rem">
        <thead>
          <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1">
            <th style="padding:10px;text-align:left;color:#475569">Rincian Pembayaran</th>
            <th style="padding:10px;text-align:right;color:#475569">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom:1px solid #f1f5f9">
            <td style="padding:12px 10px">Sewa Kamar ${p.kamar || ''} Periode Bulan <strong>${blnLabel}</strong></td>
            <td style="padding:12px 10px;text-align:right;font-weight:700">${rp(pb.jumlah)}</td>
          </tr>
          ${pb.denda ? `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 10px">Denda Keterlambatan</td><td style="padding:8px 10px;text-align:right">${rp(pb.denda)}</td></tr>` : ''}
          ${pb.listrikExtra ? `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 10px">Biaya Listrik Tambahan</td><td style="padding:8px 10px;text-align:right">${rp(pb.listrikExtra)}</td></tr>` : ''}
          <tr style="background:#f8fafc;font-weight:800;font-size:0.95rem">
            <td style="padding:12px 10px">TOTAL DITERIMA</td>
            <td style="padding:12px 10px;text-align:right;color:#059669">${rp(pb.jumlah)}</td>
          </tr>
        </tbody>
      </table>

      <div style="background:#f8fafc;padding:12px 14px;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:24px">
        <div style="font-size:0.72rem;color:#64748b;font-weight:700">TERBILANG:</div>
        <div style="font-size:0.82rem;font-weight:700;font-style:italic;color:#1e293b">"${terbilang(pb.jumlah)} Rupiah"</div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div style="font-size:0.75rem;color:#64748b">
          Tanggal Bayar: <strong>${tglBayar}</strong><br>
          Metode: Transfer Bank / Tunai
        </div>
        <div style="text-align:center">
          <div style="font-size:0.75rem;color:#64748b;margin-bottom:40px">Pengelola Kost,</div>
          <div style="font-size:0.85rem;font-weight:800;border-bottom:1px solid #000;padding-bottom:2px">${S.kost.pemilik || 'Budi Santoso'}</div>
        </div>
      </div>
    </div>
  `;

  openModal('modal-kwitansi');
};

$('modal-kwitansi-close').addEventListener('click', () => closeModal('modal-kwitansi'));
$('modal-kwitansi').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-kwitansi'); });

$('btn-print-kwitansi').addEventListener('click', () => {
  if (!activeKwitansiData) return;
  const area = $('kwitansi-print-area').outerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kwitansi_${activeKwitansiData.invoiceNo}</title><style>body{padding:20px;font-family:'Plus Jakarta Sans',sans-serif;color:#000}</style></head><body>${area}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 250);
});

$('btn-wa-kwitansi').addEventListener('click', () => {
  if (!activeKwitansiData) return;
  const { p, pb, blnLabel, invoiceNo, tglBayar } = activeKwitansiData;
  if (!p.hp) { toast('Nomor HP penghuni tidak tersedia!', 'err'); return; }
  const cleanHp = p.hp.replace(/\D/g, '').replace(/^0/, '62');
  const text = `Halo Kak ${p.nama}, terima kasih! Pembayaran sewa kamar ${p.kamar || ''} di ${S.kost.nama || 'Kost'} untuk bulan *${blnLabel}* sebesar *${rp(pb.jumlah)}* telah kami terima dan tercatat *LUNAS* pada ${tglBayar}. (No. Bukti: ${invoiceNo}). 🙏`;
  window.open(`https://wa.me/${cleanHp}?text=${encodeURIComponent(text)}`, '_blank');
});

// ── PENGELUARAN (EXPENSE MANAGEMENT) ──────────────────────────
function renderPengeluaran() {
  if (!Array.isArray(S.pengeluaran)) S.pengeluaran = [];

  const sel = $('filter-bulan-pengeluaran');
  if (sel) {
    const curVal = sel.value;
    const expenseMonths = [...new Set(S.pengeluaran.map(x => (x.tanggal || '').slice(0, 7)).filter(Boolean))];
    const now = new Date();
    const recentMonths = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      recentMonths.push(ym);
    }
    const allMonths = [...new Set([...recentMonths, ...expenseMonths])].sort().reverse();

    // Default: bulan berjalan bila baru dimuat, pertahankan seleksi jika sudah ada
    let cur = curVal;
    if (curVal === undefined || curVal === null || !sel.dataset.initialized) {
      cur = thisMonth();
      sel.dataset.initialized = 'true';
    }

    sel.innerHTML = `<option value=""${cur === '' ? ' selected' : ''}>Semua Bulan (Riwayat Lengkap)</option>` +
      allMonths.map(m => {
        const [y, mo] = m.split('-');
        const lbl = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        return `<option value="${m}"${m === cur ? ' selected' : ''}>${lbl}</option>`;
      }).join('');
    sel.value = cur;
  }

  const bln = sel?.value || '';
  const katFilter = $('filter-kategori-pengeluaran')?.value || '';
  const qCari = ($('cari-pengeluaran')?.value || '').toLowerCase().trim();

  // Filter list
  const list = S.pengeluaran.filter(x => {
    const mBln = !bln || (x.tanggal || '').startsWith(bln);
    const mKat = !katFilter || x.kategori === katFilter;
    const mCari = !qCari ||
      (x.keterangan || '').toLowerCase().includes(qCari) ||
      (x.kategori || '').toLowerCase().includes(qCari) ||
      (x.tanggal || '').toLowerCase().includes(qCari) ||
      String(x.jumlah || '').includes(qCari);
    return mBln && mKat && mCari;
  });

  const totalFiltered = list.reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  const avg = list.length > 0 ? Math.round(totalFiltered / list.length) : 0;

  // Cari kategori pengeluaran terbesar
  const catSums = {};
  list.forEach(x => {
    const k = x.kategori || 'Lainnya';
    catSums[k] = (catSums[k] || 0) + (Number(x.jumlah) || 0);
  });
  let maxCatName = '–';
  let maxCatVal = 0;
  for (const [k, v] of Object.entries(catSums)) {
    if (v > maxCatVal) { maxCatVal = v; maxCatName = k; }
  }
  const maxCatPct = totalFiltered > 0 ? Math.round((maxCatVal / totalFiltered) * 100) : 0;

  let blnLabel = 'semua riwayat';
  if (bln) {
    const [y, mo] = bln.split('-');
    blnLabel = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  }

  const kpiEl = $('kpi-pengeluaran');
  if (kpiEl) {
    kpiEl.innerHTML = `
      <div class="kpi">
        <div class="kpi-label">Total Pengeluaran <span style="font-size:1.1rem">💸</span></div>
        <div class="kpi-value" style="color:var(--red)">${rp(totalFiltered)}</div>
        <div class="kpi-sub">${blnLabel}</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Jumlah Transaksi <span style="font-size:1.1rem">📝</span></div>
        <div class="kpi-value">${list.length}</div>
        <div class="kpi-sub">catatan operasional</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Rata-rata Transaksi <span style="font-size:1.1rem">⚖️</span></div>
        <div class="kpi-value">${rp(avg)}</div>
        <div class="kpi-sub">biaya per transaksi</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Kategori Terbesar <span style="font-size:1.1rem">📊</span></div>
        <div class="kpi-value" style="font-size:1.05rem;color:var(--accent-light)">${maxCatName}</div>
        <div class="kpi-sub">${maxCatVal > 0 ? `${rp(maxCatVal)} (${maxCatPct}%)` : 'belum ada data'}</div>
      </div>
    `;
  }

  // Render Grafik Pengeluaran
  renderPengeluaranCharts(list);

  // Tabel Pengeluaran
  const tbodyEl = $('tbody-pengeluaran');
  if (tbodyEl) {
    tbodyEl.innerHTML = list.map(exp => `
      <tr>
        <td>${fmtD(exp.tanggal)}</td>
        <td><span class="badge badge-purple">${exp.kategori}</span></td>
        <td><strong>${exp.keterangan || '–'}</strong></td>
        <td><strong style="color:var(--red)">${rp(exp.jumlah)}</strong></td>
        <td>${exp.buktiNota ? `<a href="${exp.buktiNota}" target="_blank" title="Lihat Bukti Nota"><img src="${exp.buktiNota}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '<span style="color:var(--text-4)">–</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-outline btn-sm" onclick="editPengeluaran('${exp.id}')">Edit</button>
            <button type="button" class="btn-danger btn-sm" onclick="hapusPengeluaran('${exp.id}')">Hapus</button>
          </div>
        </td>
      </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">Belum ada catatan pengeluaran operasional yang sesuai kriteria filter.</td></tr>`;
  }
}

// ── GRAFIK ANALISIS PENGELUARAN ──────────────────────────────
function renderPengeluaranCharts(list) {
  if (typeof Chart === 'undefined') return;
  const pagePengeluaran = $('page-pengeluaran');
  if (!pagePengeluaran || !pagePengeluaran.classList.contains('active')) return;

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  const tick   = isDark ? '#94a3b8' : '#64748b';
  const grid   = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';

  // 1. Chart Komposisi Kategori (Donut)
  const catMap = {};
  list.forEach(x => {
    const k = x.kategori || 'Lainnya';
    catMap[k] = (catMap[k] || 0) + (Number(x.jumlah) || 0);
  });

  const catLabels = Object.keys(catMap);
  const catValues = Object.values(catMap);
  const catPalette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  if (CHARTS.pengeluaranKat) {
    try { CHARTS.pengeluaranKat.destroy(); } catch (e) {}
  }
  const ctxKat = $('chart-pengeluaran-kategori');
  if (ctxKat) {
    if (catValues.length === 0) {
      catLabels.push('Belum Ada Data');
      catValues.push(1);
    }
    CHARTS.pengeluaranKat = new Chart(ctxKat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catValues,
          backgroundColor: catPalette.slice(0, catLabels.length),
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false }
        }
      }
    });

    const legendEl = $('pengeluaran-kategori-legend');
    if (legendEl) {
      if (Object.keys(catMap).length > 0) {
        const total = catValues.reduce((a, b) => a + b, 0);
        legendEl.innerHTML = catLabels.map((lbl, idx) => {
          const val = catMap[lbl] || 0;
          const pct = total > 0 ? Math.round((val / total) * 100) : 0;
          return `<div class="legend-item"><span class="legend-dot" style="background:${catPalette[idx % catPalette.length]}"></span><strong>${lbl}:</strong> ${rp(val)} (${pct}%)</div>`;
        }).join('');
      } else {
        legendEl.innerHTML = '<span style="color:var(--text-3);font-size:0.8rem">Belum ada pengeluaran pada filter ini.</span>';
      }
    }
  }

  // 2. Chart Tren Pengeluaran 6 Bulan Terakhir
  const now = new Date();
  const monthsTren = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsTren.push(ym);
  }

  const trenLabels = monthsTren.map(m => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('id-ID', { month: 'short' });
  });

  const trenValues = monthsTren.map(m => {
    return S.pengeluaran
      .filter(x => (x.tanggal || '').startsWith(m))
      .reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  });

  if (CHARTS.pengeluaranTren) {
    try { CHARTS.pengeluaranTren.destroy(); } catch (e) {}
  }
  const ctxTren = $('chart-pengeluaran-tren');
  if (ctxTren) {
    CHARTS.pengeluaranTren = new Chart(ctxTren, {
      type: 'bar',
      data: {
        labels: trenLabels,
        datasets: [{
          label: 'Pengeluaran',
          data: trenValues,
          backgroundColor: '#f43f5e',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick, font: { family:'Plus Jakarta Sans', size:11, weight:'600' } }, grid: { display: false } },
          y: { ticks: { color: tick, font: { family:'Plus Jakarta Sans', size:10 }, callback: v => 'Rp ' + (v/1000).toLocaleString('id-ID') + 'k' }, grid: { color: grid } }
        }
      }
    });

    const trenLegendEl = $('pengeluaran-tren-legend');
    if (trenLegendEl) {
      const avg6 = Math.round(trenValues.reduce((a, b) => a + b, 0) / 6);
      trenLegendEl.innerHTML = `
        <div class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span>Rata-rata 6 Bulan Terakhir: <strong>${rp(avg6)}</strong> / bulan</div>
      `;
    }
  }
}

// ── EKSPOR CSV PENGELUARAN ───────────────────────────────────
function exportPengeluaranCsv() {
  if (!S.pengeluaran || S.pengeluaran.length === 0) {
    toast('Belum ada catatan pengeluaran untuk diekspor.', 'err');
    return;
  }

  const rows = [
    ['ID', 'Tanggal', 'Kategori', 'Keterangan', 'Nominal (Rp)', 'Bukti Nota URL', 'Dicatat Oleh']
  ];

  S.pengeluaran.forEach(x => {
    rows.push([
      x.id || '',
      x.tanggal || '',
      `"${(x.kategori || '').replace(/"/g, '""')}"`,
      `"${(x.keterangan || '').replace(/"/g, '""')}"`,
      Number(x.jumlah) || 0,
      `"${(x.buktiNota || '').replace(/"/g, '""')}"`,
      `"${(x.createdBy || '').replace(/"/g, '""')}"`
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  const filename = `Pengeluaran_${(S.kost.nama || 'SiKost').replace(/\s+/g, '_')}_${thisMonth()}.csv`;
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast(`Laporan pengeluaran berhasil diunduh (${filename})! 📥`, 'success');
}
window.exportPengeluaranCsv = exportPengeluaranCsv;

$('filter-bulan-pengeluaran')?.addEventListener('change', renderPengeluaran);
$('filter-kategori-pengeluaran')?.addEventListener('change', renderPengeluaran);
$('cari-pengeluaran')?.addEventListener('input', renderPengeluaran);
$('btn-export-pengeluaran-csv')?.addEventListener('click', exportPengeluaranCsv);

window.openModalCatatPengeluaran = function() {
  const titleEl = $('modal-pengeluaran-title');
  if (titleEl) titleEl.textContent = 'Catat Pengeluaran Baru';
  const formEl = $('form-pengeluaran');
  if (formEl) formEl.reset();
  const idEl = $('field-pengeluaran-id');
  if (idEl) idEl.value = '';
  const tglEl = $('field-pengeluaran-tgl');
  if (tglEl) tglEl.value = todayYMD();
  const prevNota = $('prev-pengeluaran-nota');
  if (prevNota) { prevNota.src = ''; prevNota.style.display = 'none'; }
  const btnHapusNota = $('btn-hapus-nota');
  if (btnHapusNota) btnHapusNota.style.display = 'none';
  const hintEl = $('field-pengeluaran-jumlah-hint');
  if (hintEl) hintEl.style.display = 'none';

  openModal('modal-pengeluaran');
  setTimeout(() => $('field-pengeluaran-jumlah')?.focus(), 250);
};

$('btn-tambah-pengeluaran')?.addEventListener('click', openModalCatatPengeluaran);
$('btn-dash-catat-pengeluaran')?.addEventListener('click', openModalCatatPengeluaran);
$('btn-dash-catat-pengeluaran-2')?.addEventListener('click', openModalCatatPengeluaran);

$('modal-pengeluaran-close')?.addEventListener('click', () => closeModal('modal-pengeluaran'));
$('btn-batal-pengeluaran')?.addEventListener('click', () => closeModal('modal-pengeluaran'));
$('modal-pengeluaran')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-pengeluaran'); });

// Format & Hint interaktif untuk field nominal pengeluaran
const inputJumlahExp = $('field-pengeluaran-jumlah');
const hintJumlahExp  = $('field-pengeluaran-jumlah-hint');
if (inputJumlahExp) {
  inputJumlahExp.addEventListener('input', function() {
    const rawDigits = this.value.replace(/[^0-9]/g, '');
    const num = Number(rawDigits) || 0;
    if (num > 0) {
      if (hintJumlahExp) {
        hintJumlahExp.textContent = `Terbaca: ${rp(num)}`;
        hintJumlahExp.style.display = 'block';
      }
    } else {
      if (hintJumlahExp) hintJumlahExp.style.display = 'none';
    }
  });

  inputJumlahExp.addEventListener('blur', function() {
    const rawDigits = this.value.replace(/[^0-9]/g, '');
    const num = Number(rawDigits) || 0;
    if (num > 0) {
      this.value = num.toLocaleString('id-ID');
      if (hintJumlahExp) {
        hintJumlahExp.textContent = `Terbaca: ${rp(num)}`;
        hintJumlahExp.style.display = 'block';
      }
    }
  });
}

$('field-pengeluaran-nota')?.addEventListener('change', async function() {
  const f = this.files[0]; if (!f) return;
  try {
    toast('Mengompres nota... ⏳');
    const dataUrl = await compressImage(f, 900, 900, 0.75);
    $('prev-pengeluaran-nota').src = dataUrl;
    $('prev-pengeluaran-nota').style.display = 'block';
    $('btn-hapus-nota').style.display = 'inline-block';
    toast('Nota siap disimpan! ✅');
  } catch (err) { toast(err.message, 'err'); }
});

$('btn-hapus-nota')?.addEventListener('click', () => {
  $('field-pengeluaran-nota').value = '';
  $('prev-pengeluaran-nota').src = '';
  $('prev-pengeluaran-nota').style.display = 'none';
  $('btn-hapus-nota').style.display = 'none';
});

$('form-pengeluaran')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  const id       = $('field-pengeluaran-id')?.value || uid();
  const tanggal  = $('field-pengeluaran-tgl')?.value || todayYMD();
  const kategori = $('field-pengeluaran-kategori')?.value || 'Lainnya';
  const rawJumlah = $('field-pengeluaran-jumlah')?.value || '0';
  const cleanJumlah = typeof rawJumlah === 'string' ? rawJumlah.replace(/[^0-9]/g, '') : rawJumlah;
  const jumlah   = Number(cleanJumlah) || 0;
  const keterangan = ($('field-pengeluaran-ket')?.value || '').trim();
  const prevNotaEl = $('prev-pengeluaran-nota');
  const buktiNota  = (prevNotaEl && prevNotaEl.style.display !== 'none' && prevNotaEl.src) ? prevNotaEl.src : null;

  if (jumlah <= 0) {
    toast('Nominal pengeluaran harus lebih dari Rp 0!', 'err');
    $('field-pengeluaran-jumlah')?.focus();
    return;
  }

  if (!Array.isArray(S.pengeluaran)) S.pengeluaran = [];

  const expData = { id, tanggal, kategori, jumlah, keterangan, buktiNota, createdBy: currentUser?.nama || 'Manager' };
  const idx = S.pengeluaran.findIndex(x => x.id === id);
  if (idx !== -1) {
    S.pengeluaran[idx] = expData;
    toast('Catatan pengeluaran berhasil diperbarui! ✅', 'success');
  } else {
    S.pengeluaran.unshift(expData);
    toast('Pengeluaran berhasil dicatat! 💸', 'success');
  }

  // Jika sedang membuka halaman pengeluaran dengan filter tertentu, sesuaikan pilihan bulan
  const expMonth = (tanggal || '').slice(0, 7);
  const filterSel = $('filter-bulan-pengeluaran');
  if (filterSel && filterSel.value && filterSel.value !== expMonth) {
    filterSel.value = expMonth;
  }

  LS.save();
  closeModal('modal-pengeluaran');

  renderPengeluaran();
  if ($('page-dashboard')?.classList.contains('active')) {
    renderDashboard();
  }

  try {
    await DB.savePengeluaran(expData);
  } catch (errDb) {
    console.warn('DB.savePengeluaran warning:', errDb);
  }
});

window.editPengeluaran = function(id) {
  const exp = S.pengeluaran.find(x => x.id === id); if (!exp) return;
  const titleEl = $('modal-pengeluaran-title');
  if (titleEl) titleEl.textContent = 'Edit Catatan Pengeluaran';
  const idEl = $('field-pengeluaran-id');
  if (idEl) idEl.value = exp.id;
  const tglEl = $('field-pengeluaran-tgl');
  if (tglEl) tglEl.value = exp.tanggal;
  const katEl = $('field-pengeluaran-kategori');
  if (katEl) katEl.value = exp.kategori;
  const jmlEl = $('field-pengeluaran-jumlah');
  if (jmlEl) jmlEl.value = (Number(exp.jumlah) || 0).toLocaleString('id-ID');
  const ketEl = $('field-pengeluaran-ket');
  if (ketEl) ketEl.value = exp.keterangan || '';

  const hintEl = $('field-pengeluaran-jumlah-hint');
  if (hintEl) {
    hintEl.textContent = `Terbaca: ${rp(exp.jumlah)}`;
    hintEl.style.display = 'block';
  }

  const prevNota = $('prev-pengeluaran-nota');
  const btnHapusNota = $('btn-hapus-nota');
  if (exp.buktiNota) {
    if (prevNota) { prevNota.src = exp.buktiNota; prevNota.style.display = 'block'; }
    if (btnHapusNota) btnHapusNota.style.display = 'inline-block';
  } else {
    if (prevNota) { prevNota.src = ''; prevNota.style.display = 'none'; }
    if (btnHapusNota) btnHapusNota.style.display = 'none';
  }
  openModal('modal-pengeluaran');
};

window.hapusPengeluaran = function(id) {
  confirm_dlg('Hapus Catatan Pengeluaran', 'Apakah Anda yakin ingin menghapus catatan pengeluaran ini?', async () => {
    S.pengeluaran = S.pengeluaran.filter(x => x.id !== id);
    LS.save();
    renderPengeluaran();
    if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
    toast('Catatan pengeluaran telah dihapus.');
    try {
      await DB.deletePengeluaran(id);
    } catch (errDb) {
      console.warn('DB.deletePengeluaran warning:', errDb);
    }
  }, 'Hapus');
};

// ── KELUHAN & PERBAIKAN (MAINTENANCE) ─────────────────────────
function renderKeluhan() {
  const filter = $('filter-status-keluhan')?.value || '';
  const list = S.keluhan.filter(k => !filter || k.status === filter);

  const pending = S.keluhan.filter(k => k.status === 'menunggu').length;
  const diproses = S.keluhan.filter(k => k.status === 'diproses').length;
  const selesai = S.keluhan.filter(k => k.status === 'selesai').length;

  $('kpi-keluhan-row').innerHTML = `
    <div class="kpi"><div class="kpi-label">Menunggu Respon</div><div class="kpi-value" style="color:var(--orange)">${pending}</div><div class="kpi-sub">tiket baru</div></div>
    <div class="kpi"><div class="kpi-label">Sedang Diproses</div><div class="kpi-value" style="color:var(--accent-light)">${diproses}</div><div class="kpi-sub">dalam penanganan</div></div>
    <div class="kpi"><div class="kpi-label">Selesai</div><div class="kpi-value" style="color:var(--green)">${selesai}</div><div class="kpi-sub">keluhan tuntas</div></div>
    <div class="kpi"><div class="kpi-label">Total Tiket</div><div class="kpi-value">${S.keluhan.length}</div><div class="kpi-sub">riwayat keluhan</div></div>
  `;

  $('keluhan-grid').innerHTML = list.map(k => {
    const p = S.penghuni.find(x => x.id === k.penghuniId);
    let stBadge = '<span class="badge badge-orange">Menunggu</span>';
    if (k.status === 'diproses') stBadge = '<span class="badge badge-blue">Sedang Diproses</span>';
    if (k.status === 'selesai') stBadge = '<span class="badge badge-green">Selesai</span>';

    return `
      <div class="keluhan-card">
        <div class="keluhan-header">
          <div>
            <div class="keluhan-title">${k.judul}</div>
            <div class="keluhan-meta">Kamar ${k.kamar || p?.kamar || '–'} · Pelapor: <strong>${p?.nama || 'Penghuni'}</strong> · ${fmtD(k.tglLapor)}</div>
          </div>
          ${stBadge}
        </div>
        <div class="keluhan-desc">${k.deskripsi}</div>
        ${k.foto ? `<a href="${k.foto}" target="_blank"><img class="keluhan-img" src="${k.foto}" alt="Foto Kendala"/></a>` : ''}
        ${k.responManager ? `<div class="keluhan-response-box"><strong>Respon Pengelola:</strong><br>${k.responManager}</div>` : ''}
        <div style="margin-top:auto;display:flex;gap:6px;justify-content:flex-end">
          <button class="btn-primary btn-sm" onclick="openResponKeluhan('${k.id}')">Tanggapi / Update</button>
        </div>
      </div>
    `;
  }).join('') || `<div class="empty-state" style="grid-column:1/-1"><div class="empty-emoji">🛠️</div><p class="empty-title">Tidak ada keluhan</p><p class="empty-sub">Fasilitas kost dalam kondisi prima.</p></div>`;
}

$('filter-status-keluhan').addEventListener('change', renderKeluhan);

window.openResponKeluhan = function(id) {
  const k = S.keluhan.find(x => x.id === id); if (!k) return;
  const p = S.penghuni.find(x => x.id === k.penghuniId);

  $('modal-keluhan-manager-body').innerHTML = `
    <form id="form-respon-keluhan">
      <div style="margin-bottom:12px">
        <strong>${k.judul}</strong> (Kamar ${k.kamar || p?.kamar || '–'})
        <div style="font-size:0.8rem;color:var(--text-3);margin-top:2px">${k.deskripsi}</div>
      </div>
      <div class="fg" style="margin-bottom:12px">
        <label>Status Penanganan</label>
        <select id="field-respon-status" class="fc">
          <option value="menunggu"${k.status==='menunggu'?' selected':''}>Menunggu</option>
          <option value="diproses"${k.status==='diproses'?' selected':''}>Sedang Dikerjakan / Diproses</option>
          <option value="selesai"${k.status==='selesai'?' selected':''}>Sudah Selesai Diperbaiki</option>
        </select>
      </div>
      <div class="fg" style="margin-bottom:16px">
        <label>Catatan Solusi / Tanggapan untuk Penghuni</label>
        <textarea id="field-respon-teks" class="fc" rows="3" placeholder="Contoh: Teknisi telah memeriksa dan mengganti bagian yang rusak.">${k.responManager||''}</textarea>
      </div>
      <div class="modal-foot" style="padding:0">
        <button type="button" class="btn-ghost" onclick="closeModal('modal-keluhan-manager')">Batal</button>
        <button type="submit" class="btn-primary">Simpan Tanggapan</button>
      </div>
    </form>
  `;

  $('form-respon-keluhan').addEventListener('submit', async function(ev) {
    ev.preventDefault();
    k.status = $('field-respon-status').value;
    k.responManager = $('field-respon-teks').value.trim();
    if (k.status === 'selesai' && !k.tglSelesai) k.tglSelesai = new Date().toISOString();
    LS.save();
    closeModal('modal-keluhan-manager');
    renderKeluhan();
    toast('Status keluhan diperbarui! ✅');
    await DB.saveKeluhan(k);
    updateSidebarBadges();
  });

  openModal('modal-keluhan-manager');
};

$('modal-keluhan-manager-close').addEventListener('click', () => closeModal('modal-keluhan-manager'));

// ── PROFIL AKUN ───────────────────────────────────────────────
function renderProfil() {
  $('profil-info').innerHTML = `
    <div class="profil-row"><span class="profil-key">Nama</span><span class="profil-val">${currentUser.nama}</span></div>
    <div class="profil-row"><span class="profil-key">Email</span><span class="profil-val">${currentUser.email}</span></div>
    <div class="profil-row"><span class="profil-key">Role</span><span class="profil-val">Manager (Akses Penuh)</span></div>
  `;
}

$('form-profil-pw').addEventListener('submit', async function(e) {
  e.preventDefault();
  await gantiPassword($('profil-pw-lama').value, $('profil-pw-baru').value, $('profil-pw-confirm').value, this);
});

// ── PENGATURAN (MANAGER) ──────────────────────────────────────
function getDefaultWaTemplate() {
  return `Halo Kak {nama}, mengingatkan tagihan sewa kamar {kamar} di {kost} untuk bulan {bulan} sebesar *{nominal}* telah jatuh tempo.\n\nPembayaran dapat ditransfer ke:\n🏦 {bank}: *{rekening}*\n👤 a.n {pemilik}\n\nMohon konfirmasi atau kirimkan bukti transfer jika sudah membayar ya. Terima kasih banyak! 🙏`;
}

function renderWaPreview() {
  const tplEl = $('set-wa-template');
  const prevEl = $('preview-wa-msg');
  if (!tplEl || !prevEl) return;
  const raw = tplEl.value || getDefaultWaTemplate();
  const sampleBank = $('set-bank-nama')?.value.trim() || S.kost.bankNama || 'Bank BCA';
  const sampleRek = $('set-bank-rekening')?.value.trim() || S.kost.bankRekening || '8465-1234-90';
  const samplePemilik = $('set-bank-atas-nama')?.value.trim() || $('set-pemilik')?.value.trim() || S.kost.pemilik || 'Pengelola Kost';
  const sampleKost = $('set-nama-kost')?.value.trim() || S.kost.nama || 'Kost Harmoni';
  const sampleTempo = $('set-tempo-default')?.value.trim() || S.kost.tempoDefault || 5;

  const rendered = raw
    .replace(/{nama}/g, 'Dimas Prasetyo')
    .replace(/{kamar}/g, '101')
    .replace(/{bulan}/g, 'Oktober 2026')
    .replace(/{nominal}/g, 'Rp 1.500.000')
    .replace(/{kost}/g, sampleKost)
    .replace(/{bank}/g, sampleBank)
    .replace(/{rekening}/g, sampleRek)
    .replace(/{pemilik}/g, samplePemilik)
    .replace(/{tempo}/g, sampleTempo);

  prevEl.textContent = rendered;
}

function renderPengaturan() {
  if ($('set-nama-kost'))     $('set-nama-kost').value     = S.kost.nama || '';
  if ($('set-pemilik'))       $('set-pemilik').value       = S.kost.pemilik || '';
  if ($('set-kota-kost'))      $('set-kota-kost').value      = S.kost.kota || (S.kost.alamat ? S.kost.alamat.split(',')[0].trim() : '');
  if ($('set-alamat'))        $('set-alamat').value        = S.kost.alamat || '';
  if ($('set-hp-pemilik'))    $('set-hp-pemilik').value    = S.kost.hp || '';
  if ($('set-total-kamar'))   $('set-total-kamar').value   = S.kost.totalKamar || '';
  if ($('set-tempo-default')) $('set-tempo-default').value = S.kost.tempoDefault || 5;

  // Form Bank & QRIS
  if ($('set-bank-nama'))     $('set-bank-nama').value     = S.kost.bankNama || '';
  if ($('set-bank-rekening')) $('set-bank-rekening').value = S.kost.bankRekening || '';
  if ($('set-bank-atas-nama'))$('set-bank-atas-nama').value= S.kost.bankAtasNama || '';
  if ($('set-qris-url'))      $('set-qris-url').value      = S.kost.qrisUrl || '';

  const previewQris = $('preview-qris');
  if (previewQris) {
    if (S.kost.qrisUrl) {
      previewQris.innerHTML = `<img src="${S.kost.qrisUrl}" alt="Preview QRIS" style="max-height:160px;border-radius:8px;border:1px solid var(--border)" />`;
      previewQris.style.display = 'block';
    } else {
      previewQris.style.display = 'none';
      previewQris.innerHTML = '';
    }
  }

  // Template WhatsApp
  if ($('set-wa-template')) {
    $('set-wa-template').value = S.kost.waTemplate || getDefaultWaTemplate();
    renderWaPreview();
  }

  const cfg = getSupabaseConfig();
  if (cfg) {
    if ($('cloud-url-input')) $('cloud-url-input').value = cfg.url;
    if ($('cloud-key-input')) $('cloud-key-input').value = cfg.key;
  }
  updateCloudStatusUI(isCloudConnected, cfg?.url || '');
  renderSettingsCabangList();
}

async function saveAllPengaturan(sourceForm = '') {
  // 1. Profil Kost
  if ($('set-nama-kost') && $('set-nama-kost').value.trim()) {
    S.kost.nama = $('set-nama-kost').value.trim();
  }
  if ($('set-pemilik') && $('set-pemilik').value.trim()) {
    S.kost.pemilik = $('set-pemilik').value.trim();
  }
  if ($('set-kota-kost')) {
    S.kost.kota = $('set-kota-kost').value.trim() || (S.kost.alamat ? S.kost.alamat.split(',')[0].trim() : 'Indonesia');
  }
  if ($('set-alamat')) {
    S.kost.alamat = $('set-alamat').value.trim();
  }
  if ($('set-hp-pemilik')) {
    S.kost.hp = $('set-hp-pemilik').value.trim();
  }
  if ($('set-total-kamar') && $('set-total-kamar').value) {
    S.kost.totalKamar = Number($('set-total-kamar').value) || S.kost.totalKamar || 8;
  }
  if ($('set-tempo-default') && $('set-tempo-default').value) {
    S.kost.tempoDefault = Math.max(1, Math.min(31, Number($('set-tempo-default').value) || 5));
  }

  // 2. Bank & QRIS
  if ($('set-bank-nama'))     S.kost.bankNama     = $('set-bank-nama').value.trim();
  if ($('set-bank-rekening')) S.kost.bankRekening = $('set-bank-rekening').value.trim();
  if ($('set-bank-atas-nama'))S.kost.bankAtasNama = $('set-bank-atas-nama').value.trim();
  if ($('set-qris-url'))      S.kost.qrisUrl      = $('set-qris-url').value.trim();

  // 3. WA Template
  if ($('set-wa-template'))   S.kost.waTemplate   = $('set-wa-template').value.trim();

  S.kost.updatedAt = Date.now();

  // 4. Sinkronkan ke bucket cabang yang sedang aktif
  if (S.activeKostId && S.propertiesData) {
    if (!S.propertiesData[S.activeKostId]) S.propertiesData[S.activeKostId] = {};
    S.propertiesData[S.activeKostId].kost = { ...S.kost };
  }

  // 5. Sinkronkan ke properties list (5 cabang)
  if (Array.isArray(S.properties) && S.activeKostId) {
    const prop = S.properties.find(p => p.id === S.activeKostId);
    if (prop) {
      prop.nama = S.kost.nama;
      prop.pemilik = S.kost.pemilik;
      prop.alamat = S.kost.alamat;
      prop.hp = S.kost.hp;
      prop.totalKamar = S.kost.totalKamar;
      prop.kota = S.kost.kota;
    }
  }

  // 6. Sinkronkan nama pemilik di akun manager aktif & daftar akun Google
  if (S.kost.pemilik) {
    if (currentUser && currentUser.role === 'manager') {
      currentUser.nama = S.kost.pemilik + ' (Owner)';
      LS.saveSession(currentUser);
      renderUserChip();
    }
    const mgrAcc = S.akun.find(a => a.id === 'akun_mgr_gavin' || (a.role === 'manager' && a.email === 'gavinutomo4@gmail.com'));
    if (mgrAcc) {
      mgrAcc.nama = S.kost.pemilik + ' (Owner)';
    }
  }

  // 7. Simpan permanen ke LocalStorage
  LS.save();

  // 8. Update UI real-time di seluruh komponen aplikasi
  if ($('sb-kost-name'))     $('sb-kost-name').textContent = S.kost.nama || 'SiKost';
  if ($('sb-kost-loc'))      $('sb-kost-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
  if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost.nama || 'SiKost';
  if ($('topbar-prop-loc'))  $('topbar-prop-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
  document.title = (S.kost.nama || 'SiKost') + ' – Manajemen Kost Modern';

  updatePropertySwitcherUI();
  renderSettingsCabangList();
  renderGoogleAccounts();

  // 9. Sync ke Cloud Supabase jika aktif
  await DB.saveKost();

  const msg = sourceForm === 'bank' ? 'Informasi rekening & QRIS tersimpan permanen! 💳' :
              sourceForm === 'wa'   ? 'Template WhatsApp penagihan berhasil disimpan! 📱' :
                                      'Semua pengaturan kost berhasil disimpan permanen! 💾';
  toast(msg, 'success');
}

// Event Listeners Form Pengaturan
$('form-kost')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  await saveAllPengaturan('profil');
});

$('form-bank')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  await saveAllPengaturan('bank');
});

$('form-wa-template')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  await saveAllPengaturan('wa');
});

$('btn-save-all-settings')?.addEventListener('click', async () => {
  await saveAllPengaturan('all');
});

document.querySelectorAll('.btn-save-quick').forEach(btn => {
  btn.addEventListener('click', async () => {
    await saveAllPengaturan('quick');
  });
});

// Upload QRIS Langsung dari File
const qrisFileInput = $('set-qris-file');
if (qrisFileInput) {
  qrisFileInput.addEventListener('change', async function() {
    const file = this.files[0];
    if (!file) return;
    try {
      toast('Memproses foto QRIS...');
      const compressedDataUrl = await compressImage(file, 800, 800, 0.85);
      if ($('set-qris-url')) $('set-qris-url').value = compressedDataUrl;
      const preview = $('preview-qris');
      if (preview) {
        preview.innerHTML = `<img src="${compressedDataUrl}" alt="Preview QRIS" style="max-height:160px;border-radius:8px;border:1px solid var(--border)" />`;
        preview.style.display = 'block';
      }
      toast('Foto QRIS berhasil dimuat! Klik "Simpan Informasi Pembayaran" untuk menyimpan permanen.');
    } catch (err) {
      toast('Gagal memproses gambar QRIS: ' + err.message, 'err');
    }
  });
}

// Variabel Tag WA Klik untuk Menyisipkan
document.querySelectorAll('.tag-var').forEach(tag => {
  tag.addEventListener('click', () => {
    const tplArea = $('set-wa-template');
    if (!tplArea) return;
    const insertText = tag.dataset.tag || tag.textContent;
    const startPos = tplArea.selectionStart || tplArea.value.length;
    const endPos = tplArea.selectionEnd || tplArea.value.length;
    tplArea.value = tplArea.value.substring(0, startPos) + insertText + tplArea.value.substring(endPos);
    tplArea.focus();
    tplArea.selectionStart = tplArea.selectionEnd = startPos + insertText.length;
    renderWaPreview();
  });
});

$('set-wa-template')?.addEventListener('input', renderWaPreview);
$('set-bank-nama')?.addEventListener('input', renderWaPreview);
$('set-bank-rekening')?.addEventListener('input', renderWaPreview);
$('set-bank-atas-nama')?.addEventListener('input', renderWaPreview);
$('set-nama-kost')?.addEventListener('input', renderWaPreview);
$('set-pemilik')?.addEventListener('input', renderWaPreview);
$('set-tempo-default')?.addEventListener('input', renderWaPreview);

$('btn-reset-wa-template')?.addEventListener('click', () => {
  if ($('set-wa-template')) {
    $('set-wa-template').value = getDefaultWaTemplate();
    renderWaPreview();
    toast('Template direset ke standar. Klik Simpan untuk memperbarui.');
  }
});

// Modal Edit Cabang
window.openEditCabang = function(cabangId) {
  const data = S.propertiesData ? S.propertiesData[cabangId] : null;
  if (!data || !data.kost) {
    toast('Data cabang tidak ditemukan!', 'err');
    return;
  }
  const k = data.kost;
  $('edit-cabang-id').value         = cabangId;
  $('edit-cabang-nama').value       = k.nama || '';
  $('edit-cabang-kota').value       = k.kota || (k.alamat ? k.alamat.split(',')[0].trim() : '');
  $('edit-cabang-alamat').value     = k.alamat || '';
  $('edit-cabang-hp').value         = k.hp || '';
  $('edit-cabang-totalkamar').value = k.totalKamar || 8;
  $('edit-cabang-pemilik').value    = k.pemilik || S.kost.pemilik || '';
  openModal('modal-edit-cabang');
};

const formEditCabang = $('form-edit-cabang');
if (formEditCabang) {
  formEditCabang.addEventListener('submit', function(e) {
    e.preventDefault();
    const cid = $('edit-cabang-id').value;
    if (!S.propertiesData || !S.propertiesData[cid]) return;

    const targetKost = S.propertiesData[cid].kost;
    targetKost.nama       = $('edit-cabang-nama').value.trim();
    targetKost.kota       = $('edit-cabang-kota').value.trim();
    targetKost.alamat     = $('edit-cabang-alamat').value.trim();
    targetKost.hp         = $('edit-cabang-hp').value.trim();
    targetKost.totalKamar = Number($('edit-cabang-totalkamar').value) || 8;
    targetKost.pemilik    = $('edit-cabang-pemilik').value.trim();

    if (cid === S.activeKostId) {
      S.kost = { ...targetKost };
      if ($('sb-kost-name'))     $('sb-kost-name').textContent = S.kost.nama || 'SiKost';
      if ($('sb-kost-loc'))      $('sb-kost-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
      if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost.nama || 'SiKost';
      if ($('topbar-prop-loc'))  $('topbar-prop-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
      if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
    }

    if (Array.isArray(S.properties)) {
      const prop = S.properties.find(p => p.id === cid);
      if (prop) {
        prop.nama = targetKost.nama;
        prop.kota = targetKost.kota;
        prop.alamat = targetKost.alamat;
        prop.hp = targetKost.hp;
        prop.totalKamar = targetKost.totalKamar;
        prop.pemilik = targetKost.pemilik;
      }
    }

    LS.save();
    closeModal('modal-edit-cabang');
    renderSettingsCabangList();
    updatePropertySwitcherUI();
    toast(`Cabang "${targetKost.nama}" berhasil diperbarui! 🏢`, 'success');
  });
}

$('modal-edit-cabang-close')?.addEventListener('click', () => closeModal('modal-edit-cabang'));
$('btn-cancel-edit-cabang')?.addEventListener('click', () => closeModal('modal-edit-cabang'));

// Tab Switching Pengaturan
document.querySelectorAll('.settings-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    const targetContent = $('stab-' + btn.dataset.stab);
    if (targetContent) targetContent.classList.add('active');
    if (btn.dataset.stab === 'wa') renderWaPreview();
  });
});


$('form-ganti-pw').addEventListener('submit', async function(e) {
  e.preventDefault();
  await gantiPassword($('pw-lama').value, $('pw-baru').value, $('pw-confirm').value, this);
});

async function gantiPassword(lama, baru, confirm, formEl) {
  if (baru.length < 6) { toast('Password baru minimal 6 karakter!','err'); return; }
  if (baru !== confirm) { toast('Konfirmasi password tidak cocok!','err'); return; }

  if (sbClient) {
    try {
      const { error } = await sbClient.auth.updateUser({ password: baru });
      if (error) throw error;
      formEl.reset(); toast('Password Cloud berhasil diperbarui! 🔒');
      return;
    } catch (err) {
      toast('Gagal ubah password di Supabase: ' + err.message, 'err');
      return;
    }
  }

  const akunIdx = S.akun.findIndex(a => a.id === currentUser.id);
  if (akunIdx === -1) { toast('Akun tidak ditemukan.','err'); return; }
  const lamaHash = await hashPw(lama);
  if (lamaHash !== S.akun[akunIdx].pwHash) { toast('Password lama salah!','err'); return; }
  S.akun[akunIdx].pwHash = await hashPw(baru);
  LS.save(); formEl.reset(); toast('Password berhasil diperbarui! 🔒');
}

// Backup & Restore All
$('btn-backup').addEventListener('click', () => {
  const payload = {
    penghuni: S.penghuni,
    kamar: S.kamar,
    pembayaran: S.pembayaran,
    pengeluaran: S.pengeluaran,
    keluhan: S.keluhan,
    kost: S.kost,
    backupDate: new Date().toISOString()
  };
  const b = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `SiKost_Backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); toast('Backup diunduh!');
});

$('input-restore').addEventListener('change', function() {
  const f = this.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.penghuni) throw new Error();
      confirm_dlg('Restore Data', 'Ini akan memulihkan data penghuni, kamar, pembayaran, pengeluaran, dan keluhan. Lanjutkan?', () => {
        S.penghuni    = d.penghuni || [];
        S.kamar       = d.kamar || [];
        S.pembayaran  = d.pembayaran || [];
        S.pengeluaran = d.pengeluaran || [];
        S.keluhan     = d.keluhan || [];
        S.kost        = d.kost || S.kost;
        LS.save(); renderPengaturan(); toast('Data berhasil di-restore!');
      }, 'Lanjutkan');
    } catch { toast('File JSON tidak valid.','err'); }
  };
  r.readAsText(f); this.value = '';
});

$('btn-hapus-semua').addEventListener('click', () => {
  confirm_dlg('Hapus Semua Data Operasional', 'Hapus SEMUA data penghuni, kamar, pembayaran, pengeluaran, dan tiket keluhan?', () => {
    S.penghuni = []; S.kamar = []; S.pembayaran = []; S.pengeluaran = []; S.keluhan = [];
    LS.save(); toast('Semua data operasional telah dikosongkan.'); renderPengaturan();
  }, 'Ya, Hapus Semua');
});

const btnSeed = $('btn-seed-demo');
if (btnSeed) {
  btnSeed.addEventListener('click', () => {
    confirm_dlg('Muat Data Contoh / Demo', 'Ini akan memuat data 8 kamar, 6 anak kost aktif, riwayat pembayaran, pengeluaran operasional, tiket keluhan, dan info rekening contoh. Lanjutkan?', () => {
      seedDemoData(true);
      renderPengaturan();
      toast('Data demo lengkap berhasil dimuat! 🎉');
    }, 'Ya, Muat Data Demo');
  });
}

// ── SETUP SUPABASE UI CONFIG ──────────────────────────────────
function setupSupabaseUI() {
  const openCloudModal = () => {
    const cfg = getSupabaseConfig();
    if (cfg) {
      $('modal-cloud-url').value = cfg.url;
      $('modal-cloud-key').value = cfg.key;
    }
    const gInp = $('modal-google-client-id');
    if (gInp) {
      gInp.value = window.SIKOST_CONFIG?.GOOGLE_CLIENT_ID || localStorage.getItem('sk3_google_client_id') || '';
    }
    openModal('modal-cloud-config');
  };

  const loginCloudPill = $('login-cloud-pill');
  if (loginCloudPill) loginCloudPill.addEventListener('click', openCloudModal);

  const topbarCloudBtn = $('topbar-cloud-btn');
  if (topbarCloudBtn) topbarCloudBtn.addEventListener('click', openCloudModal);

  const linkCloud = $('link-open-cloud-config');
  if (linkCloud) linkCloud.addEventListener('click', e => { e.preventDefault(); openCloudModal(); });

  const modalClose = $('modal-cloud-close');
  if (modalClose) modalClose.addEventListener('click', () => closeModal('modal-cloud-config'));

  const modalBatal = $('modal-cloud-batal');
  if (modalBatal) modalBatal.addEventListener('click', () => closeModal('modal-cloud-config'));

  const formModal = $('form-modal-cloud');
  if (formModal) {
    formModal.addEventListener('submit', async e => {
      e.preventDefault();
      const url = $('modal-cloud-url').value.trim();
      const key = $('modal-cloud-key').value.trim();
      const gClientId = $('modal-google-client-id')?.value.trim();
      const saveBtn = $('modal-cloud-simpan');

      saveBtn.disabled = true;
      saveBtn.textContent = 'Menghubungkan...';

      if (gClientId) {
        localStorage.setItem('sk3_google_client_id', gClientId);
        initGoogleIdentityServices();
      } else {
        localStorage.removeItem('sk3_google_client_id');
      }

      const res = await testSupabaseConnection(url, key);
      if (res.success) {
        localStorage.setItem('sk3_supabase_config', JSON.stringify({ url, key }));
        initSupabase();
        updateCloudStatusUI(true, url);
        closeModal('modal-cloud-config');
        toast('Berhasil terhubung ke Supabase Cloud! ⚡');
        if (currentUser) DB.fetchData();
      } else {
        toast('Gagal: ' + res.message, 'err');
      }
      saveBtn.disabled = false;
      saveBtn.textContent = 'Hubungkan & Simpan';
    });
  }

  const formSettings = $('form-cloud-settings');
  if (formSettings) {
    formSettings.addEventListener('submit', async e => {
      e.preventDefault();
      const url = $('cloud-url-input').value.trim();
      const key = $('cloud-key-input').value.trim();
      const saveBtn = $('btn-save-cloud');

      saveBtn.disabled = true;
      saveBtn.textContent = 'Menghubungkan...';

      const res = await testSupabaseConnection(url, key);
      if (res.success) {
        localStorage.setItem('sk3_supabase_config', JSON.stringify({ url, key }));
        initSupabase();
        updateCloudStatusUI(true, url);
        toast('Konfigurasi Supabase berhasil disimpan! ⚡');
        if (currentUser) DB.fetchData();
      } else {
        toast('Gagal: ' + res.message, 'err');
      }
      saveBtn.disabled = false;
      saveBtn.textContent = 'Simpan & Hubungkan';
    });
  }

  const btnTest = $('btn-test-cloud');
  if (btnTest) {
    btnTest.addEventListener('click', async () => {
      const url = $('cloud-url-input').value.trim();
      const key = $('cloud-key-input').value.trim();
      btnTest.disabled = true;
      btnTest.textContent = 'Menguji...';
      const res = await testSupabaseConnection(url, key);
      if (res.success) toast('Koneksi ke Supabase berhasil! 🟢');
      else toast('Koneksi gagal: ' + res.message, 'err');
      btnTest.disabled = false;
      btnTest.textContent = 'Tes Koneksi';
    });
  }

  const btnVerifyDb = $('btn-verify-supabase-db');
  if (btnVerifyDb) {
    btnVerifyDb.addEventListener('click', async () => {
      if (!sbClient) {
        toast('Hubungkan Supabase Cloud terlebih dahulu.', 'err');
        return;
      }
      btnVerifyDb.disabled = true;
      btnVerifyDb.textContent = 'Memeriksa 7 Tabel...';
      const tables = ['kost_pengaturan', 'kamar', 'penghuni', 'pembayaran', 'pengeluaran', 'keluhan', 'profiles'];
      let activeCount = 0;
      for (const t of tables) {
        try {
          const { error } = await sbClient.from(t).select('*').limit(1);
          if (!error) activeCount++;
        } catch {}
      }
      btnVerifyDb.disabled = false;
      btnVerifyDb.textContent = '⚡ Cek Skrip Database';
      if (activeCount === tables.length) {
        confirm_dlg(
          'Skrip Database Supabase Sempurna! 🎉',
          `Semua ${activeCount} dari ${tables.length} tabel database (kost_pengaturan, kamar, penghuni, pembayaran, pengeluaran, keluhan, profiles) telah AKTIF dan siap digunakan di Supabase Cloud Anda!`,
          () => {},
          'Selesai'
        );
      } else {
        toast(`${activeCount} dari ${tables.length} tabel aktif di Supabase.`, 'warn');
      }
    });
  }

  const btnDisc = $('btn-disconnect-cloud');
  if (btnDisc) {
    btnDisc.addEventListener('click', () => {
      confirm_dlg('Putuskan Supabase', 'Putuskan sambungan ke Supabase? Aplikasi akan beralih ke Mode Lokal.', () => {
        localStorage.removeItem('sk3_supabase_config');
        if (window.SIKOST_CONFIG) {
          window.SIKOST_CONFIG.SUPABASE_URL = '';
          window.SIKOST_CONFIG.SUPABASE_ANON_KEY = '';
        }
        sbClient = null;
        updateCloudStatusUI(false);
        if ($('cloud-url-input')) $('cloud-url-input').value = '';
        if ($('cloud-key-input')) $('cloud-key-input').value = '';
        toast('Koneksi Supabase diputuskan. Beralih ke Mode Lokal.');
      }, 'Putuskan');
    });
  }

  const btnMigrate = $('btn-migrate-local-cloud');
  if (btnMigrate) {
    btnMigrate.addEventListener('click', () => {
      confirm_dlg('Migrasi Data ke Cloud', 'Upload semua data kamar, penghuni, pembayaran, pengeluaran, keluhan, dan profil ke Supabase Cloud?', () => {
        DB.uploadLocalToCloud();
      }, 'Upload ke Cloud');
    });
  }
}

// ── SIDEBAR & MENU TOGGLE ─────────────────────────────────────
$('sidebar-collapse').addEventListener('click', () => {
  $('sidebar').classList.toggle('collapsed');
  $('main-content').classList.toggle('full');
});
$('menu-toggle').addEventListener('click', () => {
  if (window.innerWidth <= 600) $('sidebar').classList.toggle('mobile-open');
  else {
    $('sidebar').classList.toggle('collapsed');
    $('main-content').classList.toggle('full');
  }
});

// ── CONFIRM DIALOG ────────────────────────────────────────────
$('confirm-ok').addEventListener('click', () => {
  closeModal('modal-confirm');
  if (confirmCb) {
    confirmCb();
    confirmCb = null;
  }
});
$('confirm-cancel').addEventListener('click', () => {
  closeModal('modal-confirm');
  confirmCb = null;
});

// ── EXPORT CSV ────────────────────────────────────────────────
$('btn-export-csv').addEventListener('click', () => {
  const list = getPenghuniFiltered();
  const hdr  = ['Nama','NIK','Gender','TTL','HP','Email','Pekerjaan','Kamar','Lantai','Tgl Masuk','Tgl Keluar','Status','Kendaraan','Plat 1','Plat 2','Sewa','Deposit','Darurat','HP Darurat'];
  const rows = list.map(p => [
    p.nama, p.nik, p.gender, (p.tempatLahir ? p.tempatLahir + ' ' : '') + p.tglLahir, p.hp, p.email, p.pekerjaan, p.kamar, p.lantai, p.tglMasuk, p.tglKeluar, p.status, p.kendaraan, p.plat1, p.plat2, p.sewa, p.deposit, (p.daruratNama || '') + (p.daruratHub ? ' (' + p.daruratHub + ')' : ''), p.daruratHp
  ].map(v => `"${(v || '').toString().replace(/"/g, '""')}"`));
  const csv = [hdr.join(','), ...rows.map(r => r.join(','))].join('\n');
  const b = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `SiKost_Penghuni_${new Date().toISOString().slice(0,10)}.csv`; a.click(); toast('Export CSV berhasil!');
});

// ── SPOTLIGHT SEARCH (CTRL + K) ───────────────────────────────
function openSpotlight() {
  openModal('modal-spotlight');
  const inp = $('spotlight-input');
  if (inp) {
    inp.value = '';
    inp.focus();
    renderSpotlightResults('');
  }
}

function closeSpotlight() {
  closeModal('modal-spotlight');
}

function renderSpotlightResults(q) {
  const resEl = $('spotlight-results');
  if (!resEl) return;
  const query = (q || '').toLowerCase().trim();
  if (!query) {
    resEl.innerHTML = `
      <div style="text-align:center;padding:24px 16px;color:var(--text-3);font-size:0.85rem">
        Ketik nama anak kost, nomor kamar, nomor HP, plat motor/mobil, atau catatan pengeluaran...
      </div>
    `;
    return;
  }

  // 1. Search Penghuni
  const matchedPenghuni = S.penghuni.filter(p => 
    (p.nama || '').toLowerCase().includes(query) ||
    (p.kamar || '').toLowerCase().includes(query) ||
    (p.hp || '').toLowerCase().includes(query) ||
    (p.nik || '').includes(query) ||
    (p.plat1 || '').toLowerCase().includes(query) ||
    (p.plat2 || '').toLowerCase().includes(query)
  );

  // 2. Search Kamar
  const matchedKamar = S.kamar.filter(k => 
    (k.no || '').toLowerCase().includes(query) ||
    (k.tipe || '').toLowerCase().includes(query) ||
    (k.fasilitas || '').toLowerCase().includes(query)
  );

  // 3. Search Pengeluaran
  const matchedExp = S.pengeluaran.filter(x => 
    (x.keterangan || '').toLowerCase().includes(query) ||
    (x.kategori || '').toLowerCase().includes(query)
  );

  if (matchedPenghuni.length === 0 && matchedKamar.length === 0 && matchedExp.length === 0) {
    resEl.innerHTML = `
      <div style="text-align:center;padding:28px 16px;color:var(--text-3);font-size:0.85rem">
        Tidak ditemukan hasil untuk "<strong>${q}</strong>"
      </div>
    `;
    return;
  }

  let html = '';
  if (matchedPenghuni.length > 0) {
    html += `<div class="spotlight-group-title">Penghuni (${matchedPenghuni.length})</div>`;
    html += matchedPenghuni.map(p => `
      <div class="spotlight-item" onclick="closeSpotlight();openDetail('${p.id}')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">👤</div>
          <div>
            <div class="spotlight-item-title">${p.nama} ${p.status === 'aktif' ? '<span class="badge badge-green" style="font-size:0.65rem">Aktif</span>' : '<span class="badge badge-gray" style="font-size:0.65rem">Keluar</span>'}</div>
            <div class="spotlight-item-sub">Kamar ${p.kamar || '–'} · Telp/WA: ${p.hp || '–'} · Sewa: ${rp(p.sewa || 0)}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();openDetail('${p.id}')">Lihat Detail →</button>
      </div>
    `).join('');
  }

  if (matchedKamar.length > 0) {
    html += `<div class="spotlight-group-title">Kamar (${matchedKamar.length})</div>`;
    html += matchedKamar.map(k => `
      <div class="spotlight-item" onclick="closeSpotlight();navigateTo('kamar')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">🛏️</div>
          <div>
            <div class="spotlight-item-title">Kamar ${k.no} (${k.tipe || 'Standar'})</div>
            <div class="spotlight-item-sub">Lantai ${k.lantai || '1'} · ${rp(k.harga || 0)}/bln · ${k.fasilitas || 'Standar'}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();navigateTo('kamar')">Buka Kamar →</button>
      </div>
    `).join('');
  }

  if (matchedExp.length > 0) {
    html += `<div class="spotlight-group-title">Pengeluaran Operasional (${matchedExp.length})</div>`;
    html += matchedExp.map(x => `
      <div class="spotlight-item" onclick="closeSpotlight();navigateTo('pengeluaran')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">💸</div>
          <div>
            <div class="spotlight-item-title">${x.keterangan || x.kategori} <strong style="color:var(--red)">(${rp(x.jumlah)})</strong></div>
            <div class="spotlight-item-sub">${fmtD(x.tanggal)} · ${x.kategori}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();navigateTo('pengeluaran')">Lihat →</button>
      </div>
    `).join('');
  }

  resEl.innerHTML = html;
}

// ── REKAP LAPORAN KEUANGAN BULANAN ────────────────────────────
window.openLaporanBulanan = function(targetBln = thisMonth()) {
  const [y, mo] = targetBln.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const payments = S.pembayaran.filter(pb => pb.bulan === targetBln && pb.status === 'lunas');
  const totalPemasukan = payments.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);

  const expenses = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(targetBln));
  const totalPengeluaran = expenses.reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  const labaBersih = totalPemasukan - totalPengeluaran;

  const totalKamar = S.kamar.length || S.kost.totalKamar || 10;
  const kamarTerisi = new Set(aktif.map(p => p.kamar).filter(Boolean)).size;
  const okupansiPersen = Math.round((kamarTerisi / totalKamar) * 100);

  const expCat = {};
  expenses.forEach(x => {
    expCat[x.kategori] = (expCat[x.kategori] || 0) + (Number(x.jumlah) || 0);
  });

  const bodyEl = $('modal-laporan-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <div class="laporan-sheet">
      <div style="border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="font-size:1.35rem;font-weight:800;margin:0;letter-spacing:-0.5px">${S.kost.nama || 'SiKost'}</h1>
          <p style="margin:4px 0 0;font-size:0.8rem;color:#64748b">${S.kost.alamat || 'Alamat Kost'} · Telp/WA: ${S.kost.hp || '–'}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase">Laporan Keuangan Bulanan</div>
          <div style="font-size:1.1rem;font-weight:800;color:#0f172a">${blnLabel}</div>
        </div>
      </div>

      <!-- Ringkasan Eksekutif -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px">
          <div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;font-weight:700">Pemasukan Sewa</div>
          <div style="font-size:1rem;font-weight:800;color:#059669;margin-top:2px">${rp(totalPemasukan)}</div>
          <div style="font-size:0.7rem;color:#64748b">${payments.length} transaksi lunas</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px">
          <div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;font-weight:700">Pengeluaran Operasional</div>
          <div style="font-size:1rem;font-weight:800;color:#e11d48;margin-top:2px">${rp(totalPengeluaran)}</div>
          <div style="font-size:0.7rem;color:#64748b">${expenses.length} pos biaya</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px">
          <div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;font-weight:700">Laba Bersih</div>
          <div style="font-size:1rem;font-weight:800;color:${labaBersih >= 0 ? '#4f46e5' : '#e11d48'};margin-top:2px">${rp(labaBersih)}</div>
          <div style="font-size:0.7rem;color:#64748b">${labaBersih >= 0 ? 'Surplus' : 'Defisit'}</div>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px">
          <div style="font-size:0.7rem;color:#64748b;text-transform:uppercase;font-weight:700">Okupansi Kamar</div>
          <div style="font-size:1rem;font-weight:800;color:#0f172a;margin-top:2px">${okupansiPersen}%</div>
          <div style="font-size:0.7rem;color:#64748b">${kamarTerisi} dari ${totalKamar} kamar</div>
        </div>
      </div>

      <!-- Rincian Biaya Operasional -->
      <h3 style="font-size:0.9rem;font-weight:700;margin:0 0 8px">Rincian Pengeluaran per Kategori</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:0.8rem">
        <thead>
          <tr style="background:#f1f5f9;border-bottom:2px solid #cbd5e1">
            <th style="padding:8px 10px;text-align:left">Kategori Biaya</th>
            <th style="padding:8px 10px;text-align:right">Total (Rp)</th>
            <th style="padding:8px 10px;text-align:right">Porsi (%)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(expCat).map(([cat, val]) => `
            <tr style="border-bottom:1px solid #e2e8f0">
              <td style="padding:8px 10px">${cat}</td>
              <td style="padding:8px 10px;text-align:right;font-weight:600">${rp(val)}</td>
              <td style="padding:8px 10px;text-align:right">${totalPengeluaran > 0 ? Math.round((val / totalPengeluaran) * 100) : 0}%</td>
            </tr>
          `).join('') || `<tr><td colspan="3" style="text-align:center;padding:10px;color:#94a3b8">Tidak ada pengeluaran pada bulan ini.</td></tr>`}
          <tr style="background:#f8fafc;font-weight:800">
            <td style="padding:8px 10px">TOTAL PENGELUARAN</td>
            <td style="padding:8px 10px;text-align:right;color:#e11d48">${rp(totalPengeluaran)}</td>
            <td style="padding:8px 10px;text-align:right">100%</td>
          </tr>
        </tbody>
      </table>

      <!-- Tanda Tangan -->
      <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:30px">
        <div style="font-size:0.72rem;color:#64748b">
          Dicetak otomatis oleh SiKost pada: ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
        </div>
        <div style="text-align:center">
          <div style="font-size:0.75rem;color:#64748b;margin-bottom:48px">Pemilik / Pengelola Kost,</div>
          <div style="font-size:0.85rem;font-weight:800;border-bottom:1px solid #000;padding-bottom:2px">${S.kost.pemilik || 'Pengelola Kost'}</div>
        </div>
      </div>
    </div>
  `;

  openModal('modal-laporan-bulanan');
};

// ── SETUP EVENT LISTENERS BARU (SPOTLIGHT, FAB, LAPORAN) ──────
function setupNewFeatureEvents() {
  // 1. Spotlight Search
  const btnSpotlight = $('btn-open-spotlight');
  if (btnSpotlight) btnSpotlight.addEventListener('click', openSpotlight);

  const btnCloseSpotlight = $('spotlight-close');
  if (btnCloseSpotlight) btnCloseSpotlight.addEventListener('click', closeSpotlight);

  const modalSpotlight = $('modal-spotlight');
  if (modalSpotlight) modalSpotlight.addEventListener('click', e => { if (e.target === modalSpotlight) closeSpotlight(); });

  const inputSpotlight = $('spotlight-input');
  if (inputSpotlight) {
    inputSpotlight.addEventListener('input', function() {
      renderSpotlightResults(this.value);
    });
  }

  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSpotlight();
    }
    if (e.key === 'Escape') {
      closeSpotlight();
    }
  });

  // 2. Floating Action Button (FAB)
  const fabMain = $('fab-main');
  const fabMenu = $('fab-menu');
  if (fabMain && fabMenu) {
    fabMain.addEventListener('click', () => {
      fabMain.classList.toggle('active');
      fabMenu.classList.toggle('open');
    });

    const fabTambahP = $('fab-tambah-penghuni');
    if (fabTambahP) fabTambahP.addEventListener('click', () => {
      fabMain.classList.remove('active');
      fabMenu.classList.remove('open');
      openModalPenghuni();
    });

    const fabCatatB = $('fab-catat-bayar');
    if (fabCatatB) fabCatatB.addEventListener('click', () => {
      fabMain.classList.remove('active');
      fabMenu.classList.remove('open');
      navigateTo('pembayaran');
    });

    const fabCatatE = $('fab-catat-pengeluaran');
    if (fabCatatE) fabCatatE.addEventListener('click', () => {
      fabMain.classList.remove('active');
      fabMenu.classList.remove('open');
      openModalCatatPengeluaran();
    });

    const fabCari = $('fab-cari-cepat');
    if (fabCari) fabCari.addEventListener('click', () => {
      fabMain.classList.remove('active');
      fabMenu.classList.remove('open');
      openSpotlight();
    });
  }

  // 3. Rekap Laporan Bulanan
  const btnCetakLaporan = $('btn-cetak-laporan-keuangan');
  if (btnCetakLaporan) {
    btnCetakLaporan.addEventListener('click', () => {
      const bln = $('filter-bulan-pengeluaran')?.value || thisMonth();
      openLaporanBulanan(bln);
    });
  }

  const btnCloseLaporan = $('modal-laporan-close');
  if (btnCloseLaporan) btnCloseLaporan.addEventListener('click', () => closeModal('modal-laporan-bulanan'));

  const btnTutupLaporan = $('btn-tutup-laporan');
  if (btnTutupLaporan) btnTutupLaporan.addEventListener('click', () => closeModal('modal-laporan-bulanan'));

  const modalLaporan = $('modal-laporan-bulanan');
  if (modalLaporan) modalLaporan.addEventListener('click', e => { if (e.target === modalLaporan) closeModal('modal-laporan-bulanan'); });
}

// ── PWA SERVICE WORKER REGISTRATION ───────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('SiKost Service Worker terdaftar (PWA Ready):', reg.scope);
    }).catch(err => {
      console.warn('PWA Service Worker registration warning:', err);
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────
(async function init() {
  LS.load();
  setupSupabaseUI();
  initGoogleIdentityServices();
  setupNewFeatureEvents();

  // Dark Mode default
  const t = localStorage.getItem('sk3_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
  $('theme-icon').textContent = t === 'dark' ? '☀️' : '🌙';

  // Demo Buttons
  const btnDemoMgr = $('btn-demo-mgr');
  if (btnDemoMgr) {
    btnDemoMgr.addEventListener('click', () => {
      seedDemoData(false);
      let mgr = S.akun.find(a => a.email && a.email.toLowerCase() === 'gavinutomo4@gmail.com');
      if (!mgr) {
        mgr = { id: 'akun_mgr_gavin', nama: 'Gavin Utomo (Owner)', email: 'gavinutomo4@gmail.com', role: 'manager', penghuniId: null };
        S.akun.push(mgr);
        LS.save();
      }
      loginWithAkun(mgr);
      toast('Selamat datang, Gavin Utomo (Manager)! 👑');
    });
  }



  // Coba inisialisasi Supabase
  const hasSb = initSupabase();
  const cfg   = getSupabaseConfig();
  if (hasSb && cfg) {
    testSupabaseConnection(cfg.url, cfg.key).then(res => {
      updateCloudStatusUI(res.success, cfg.url);
    });

    try {
      // Tangani callback OAuth Google jika ada error di hash URL
      if (window.location.hash && window.location.hash.includes('error_description=')) {
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const errDesc = hashParams.get('error_description');
        if (errDesc) toast('Login Google: ' + decodeURIComponent(errDesc.replace(/\+/g, ' ')), 'err');
        try { window.history.replaceState(null, null, window.location.pathname + window.location.search); } catch {}
      }

      const { data: { session } } = await sbClient.auth.getSession();
      if (session?.user) {
        if (window.location.hash && window.location.hash.includes('access_token')) {
          try { window.history.replaceState(null, null, window.location.pathname + window.location.search); } catch {}
        }
        const profile = await fetchOrCreateProfile(session.user);
        currentUser = profile;
        LS.saveSession(currentUser);
        enterApp();
        return;
      }
    } catch (e) {
      console.warn('Gagal cek sesi Supabase:', e);
    }

    sbClient.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user && !currentUser) {
        const profile = await fetchOrCreateProfile(session.user);
        currentUser = profile;
        LS.saveSession(currentUser);
        enterApp();
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        LS.clearSession();
        showScreen('screen-login');
      }
    });
  } else {
    updateCloudStatusUI(false);
  }

  // Cek sesi lokal
  const session = LS.loadSession();
  if (session) {
    currentUser = session;
    enterApp();
    return;
  }

  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
  renderGoogleAccounts();
  showScreen('screen-login');
})();
