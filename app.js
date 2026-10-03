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
  pengumuman: [], // [{id, judul, isi, tanggal, prioritas, createdBy}]
  akun:       [],
  kost: {
    nama: 'SiKost',
    pemilik: '',
    alamat: '',
    hp: '',
    totalKamar: 10,
    bankNama: '',
    bankRekening: '',
    bankAtasNama: '',
    qrisUrl: ''
  }
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

// ── DEMO SEED DATA GENERATOR ─────────────────────────────────
function seedDemoData(force = false) {
  if (!force && S.penghuni && S.penghuni.length > 0 && S.kamar && S.kamar.length > 0) return;

  S.kost = {
    nama: 'Kost Griya Harmoni',
    pemilik: 'Gavin Utomo',
    alamat: 'Jl. Kaliurang KM 5, Gg. Megatruh No. 12, Sleman, DI Yogyakarta',
    hp: '081234567890',
    totalKamar: 8,
    bankNama: 'Bank BCA',
    bankRekening: '8465-1234-90',
    bankAtasNama: 'Gavin Utomo',
    qrisUrl: ''
  };

  S.kamar = [
    { id: 'km_101', no: '101', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed 160x200, Lemari 2 Pintu, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_102', no: '102', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed, Lemari, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_103', no: '103', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_104', no: '104', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_201', no: '201', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_202', no: '202', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_203', no: '203', lantai: '2', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Springbed, Lemari 2 Pintu, Meja Kerja' },
    { id: 'km_204', no: '204', lantai: '2', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur, Lemari, Meja' }
  ];

  S.penghuni = [
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
      catatanDeposit: 'Uang jaminan kunci & remote AC (disimpan saat masuk)',
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

  const bln = thisMonth();
  S.pembayaran = [
    { id: 'pb_1', penghuniId: 'p_dimas', bulan: bln, jumlah: 1500000, status: 'lunas', tglBayar: `${bln}-03T09:30:00Z` },
    { id: 'pb_2', penghuniId: 'p_anisa', bulan: bln, jumlah: 1500000, status: 'lunas', tglBayar: `${bln}-01T14:15:00Z` },
    { id: 'pb_3', penghuniId: 'p_kevin', bulan: bln, jumlah: 1850000, status: 'lunas', tglBayar: `${bln}-01T10:00:00Z` }
  ];

  S.pengeluaran = [
    { id: 'exp_1', tanggal: `${bln}-02`, kategori: 'Listrik/PLN', jumlah: 650000, keterangan: 'Beli token listrik utama & pompa air', createdBy: 'Budi Santoso' },
    { id: 'exp_2', tanggal: `${bln}-03`, kategori: 'WiFi/Internet', jumlah: 450000, keterangan: 'Langganan Indihome 100 Mbps', createdBy: 'Budi Santoso' },
    { id: 'exp_3', tanggal: `${bln}-05`, kategori: 'Kebersihan/Sampah', jumlah: 150000, keterangan: 'Iuran sampah RT & kebersihan lorong', createdBy: 'Budi Santoso' },
    { id: 'exp_4', tanggal: `${bln}-07`, kategori: 'Perbaikan/Maintenance', jumlah: 250000, keterangan: 'Servis kran air wastafel lantai 1 & ganti sil', createdBy: 'Budi Santoso' }
  ];

  S.keluhan = [
    {
      id: 'klh_1',
      penghuniId: 'p_rizky',
      kamar: '103',
      judul: 'Kran kamar mandi menetes terus',
      kategori: 'Air/Plumbing',
      deskripsi: 'Kran air di kamar mandi tidak bisa ditutup rapat, menetes semalaman.',
      status: 'selesai',
      responManager: 'Kran sudah diganti dengan yang baru oleh tukang ledeng tgl 7.',
      tglLapor: `${bln}-06T10:00:00Z`,
      tglSelesai: `${bln}-07T14:00:00Z`
    },
    {
      id: 'klh_2',
      penghuniId: 'p_dimas',
      kamar: '101',
      judul: 'Remote AC baterai habis & AC kurang dingin',
      kategori: 'AC',
      deskripsi: 'Remote AC tidak merespon saat ditekan dan hembusan angin terasa kurang dingin.',
      status: 'diproses',
      responManager: 'Teknisi AC dijadwalkan datang besok Sabtu jam 10 pagi untuk cuci AC.',
      tglLapor: `${bln}-10T12:30:00Z`,
      tglSelesai: null
    }
  ];

  S.pengumuman = [
    {
      id: 'ann_1',
      judul: 'Pembersihan Tandon Air Rutin Hari Minggu',
      isi: 'Diberitahukan kepada seluruh penghuni kost bahwa hari Minggu pagi pukul 08.00–11.00 akan diadakan pengurasan tandon air utama. Mohon menampung air secukupnya sebelumnya. Terima kasih atas pengertiannya.',
      tanggal: `${bln}-05`,
      prioritas: 'penting',
      createdBy: 'Budi Santoso (Owner)'
    }
  ];

  S.akun = [
    { id: 'akun_mgr_gavin', nama: 'Gavin Utomo (Owner)', email: 'gavinutomo4@gmail.com', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'manager', penghuniId: null },
    { id: 'akun_tnt', nama: 'Dimas Prasetyo', email: 'dimas@sikost.id', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'penghuni', penghuniId: 'p_dimas' }
  ];

  LS.save();
}

// ── STORAGE ──────────────────────────────────────────────────
const LS = {
  save() {
    try {
      localStorage.setItem('sk3_penghuni',    JSON.stringify(S.penghuni));
      localStorage.setItem('sk3_kamar',       JSON.stringify(S.kamar));
      localStorage.setItem('sk3_pembayaran',  JSON.stringify(S.pembayaran));
      localStorage.setItem('sk3_pengeluaran', JSON.stringify(S.pengeluaran));
      localStorage.setItem('sk3_keluhan',     JSON.stringify(S.keluhan));
      localStorage.setItem('sk3_pengumuman',  JSON.stringify(S.pengumuman));
      localStorage.setItem('sk3_akun',        JSON.stringify(S.akun));
      localStorage.setItem('sk3_kost',        JSON.stringify(S.kost));
    } catch (err) {
      console.warn('LocalStorage save warning:', err);
    }
  },
  load() {
    const keys = ['penghuni','kamar','pembayaran','pengeluaran','keluhan','pengumuman','akun','kost'];
    keys.forEach(k => {
      const v = localStorage.getItem('sk3_' + k);
      if (v) try { S[k] = JSON.parse(v); } catch {}
    });
    if (!S.pengeluaran) S.pengeluaran = [];
    if (!S.keluhan)     S.keluhan = [];
    if (!S.pengumuman)  S.pengumuman = [];
    if ((!S.penghuni || S.penghuni.length === 0) && (!S.kamar || S.kamar.length === 0)) {
      seedDemoData(false);
    }
  },
  saveSession(u) { localStorage.setItem('sk3_session', JSON.stringify(u)); },
  loadSession()  { const v = localStorage.getItem('sk3_session'); return v ? JSON.parse(v) : null; },
  clearSession() { localStorage.removeItem('sk3_session'); }
};

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
const thisMonth = () => new Date().toISOString().slice(0,7);
window.thisMonth = thisMonth;
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
  ['screen-setup','screen-login','screen-app'].forEach(id => {
    const el=$(id); if(el) el.style.display='none';
  });
  const target=$(name); if(target) target.style.display='flex';
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
      if (pList) S.penghuni = pList.map(mapPenghuniFromDb);

      // 2. Kamar
      const { data: kList } = await sbClient.from('kamar').select('*').order('no', { ascending: true });
      if (kList && kList.length > 0) {
        S.kamar = kList;
      } else if (currentUser?.role === 'manager') {
        seedDemoData(false);
        setTimeout(() => this.uploadLocalToCloud(true), 500);
      }

      // 3. Pembayaran
      const { data: bList } = await sbClient.from('pembayaran').select('*');
      if (bList) S.pembayaran = bList.map(mapBayarFromDb);

      // 4. Pengeluaran
      const { data: expList } = await sbClient.from('pengeluaran').select('*').order('tanggal', { ascending: false });
      if (expList) S.pengeluaran = expList.map(x => ({
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
      if (klhList) S.keluhan = klhList.map(x => ({
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

      // 6. Pengumuman
      const { data: annList } = await sbClient.from('pengumuman').select('*').order('created_at', { ascending: false });
      if (annList) S.pengumuman = annList.map(x => ({
        id: x.id,
        judul: x.judul,
        isi: x.isi,
        tanggal: x.tanggal,
        prioritas: x.prioritas || 'info',
        createdBy: x.created_by
      }));

      // 7. Kost Pengaturan
      const { data: kRow } = await sbClient.from('kost_pengaturan').select('*').limit(1).maybeSingle();
      if (kRow) {
        S.kost = {
          nama: kRow.nama || 'SiKost',
          pemilik: kRow.pemilik || '',
          alamat: kRow.alamat || '',
          hp: kRow.hp || '',
          totalKamar: kRow.total_kamar || 10,
          bankNama: kRow.bank_nama || '',
          bankRekening: kRow.bank_rekening || '',
          bankAtasNama: kRow.bank_atas_nama || '',
          qrisUrl: kRow.qris_url || ''
        };
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
        if ($('page-pengumuman')?.classList.contains('active')) renderPengumuman();
        if ($('page-pengaturan')?.classList.contains('active')) renderPengaturan();
        if ($('page-tenant')?.classList.contains('active')) renderTenant();
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
  async savePengumuman(ann) {
    if (sbClient) {
      try {
        await sbClient.from('pengumuman').upsert({
          id: ann.id,
          judul: ann.judul,
          isi: ann.isi,
          tanggal: ann.tanggal,
          prioritas: ann.prioritas || 'info',
          created_by: ann.createdBy || currentUser?.nama
        });
      } catch (e) { console.warn(e); }
    }
  },
  async deletePengumuman(id) {
    if (sbClient) {
      try { await sbClient.from('pengumuman').delete().eq('id', id); } catch (e) { console.warn(e); }
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
      for (const ann of S.pengumuman) await this.savePengumuman(ann);

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
      // Role check: HANYA gavinutomo4@gmail.com yang berhak menjadi manager!
      const isManagerEmail = (userEmail === 'gavinutomo4@gmail.com');
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

    // 3. Jika belum ada profil: HANYA gavinutomo4@gmail.com yang menjadi manager!
    const isManager = (userEmail === 'gavinutomo4@gmail.com');
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
  const isMgr = (acc.role === 'manager');
  const inisial = isMgr ? '👑' : (acc.nama ? acc.nama.charAt(0).toUpperCase() : '👤');

  card.innerHTML = `
    <div class="google-acc-avatar ${isMgr ? 'mgr' : ''}">
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
    <span class="google-acc-role ${isMgr ? 'mgr' : 'tnt'}">${isMgr ? 'Manager 👑' : (acc.kamar ? 'Kamar ' + esc(acc.kamar) + ' 🔑' : 'Penghuni 👤')}</span>
  `;

  card.addEventListener('click', () => {
    closeModalGoogle();
    loginWithAkun(acc);
    toast(`Masuk sebagai ${acc.nama} (${acc.role}) via Google! 🚀`);
  });

  return card;
}

function renderGoogleAccounts() {
  seedDemoData(false);

  // 1. Akun Manager: HANYA gavinutomo4@gmail.com!
  const mgrNama = S.kost?.pemilik || 'Gavin Utomo';
  const mgrEmail = 'gavinutomo4@gmail.com';
  let mgr = S.akun.find(a => a.email && a.email.toLowerCase() === mgrEmail);
  if (!mgr) {
    mgr = { id: 'akun_mgr_gavin', nama: mgrNama, email: mgrEmail, role: 'manager', penghuniId: null };
    S.akun.push(mgr);
    LS.save();
  }

  const allAccounts = [mgr];

  // 2. Akun Penghuni
  if (S.penghuni && S.penghuni.length > 0) {
    S.penghuni.forEach(p => {
      const emailP = p.email || (p.nama.toLowerCase().replace(/\s+/g, '.') + '@gmail.com');
      let akunTnt = S.akun.find(a => a.penghuniId === p.id || (a.email && a.email.toLowerCase() === emailP.toLowerCase()));
      if (!akunTnt) {
        akunTnt = { id: 'akun_' + p.id, nama: p.nama, email: emailP, role: 'penghuni', penghuniId: p.id, kamar: p.kamar };
        S.akun.push(akunTnt);
      } else {
        akunTnt.kamar = p.kamar;
      }
      allAccounts.push(akunTnt);
    });
    LS.save();
  }

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

  // Cek apakah email cocok dengan penghuni yang terdaftar
  const matchedP = S.penghuni.find(p => p.email && p.email.toLowerCase() === email);
  if (matchedP) {
    let akun = S.akun.find(a => a.penghuniId === matchedP.id || (a.email && a.email.toLowerCase() === email));
    if (!akun) {
      akun = { id: 'akun_' + matchedP.id, nama: matchedP.nama, email: email, role: 'penghuni', penghuniId: matchedP.id };
      S.akun.push(akun);
      LS.save();
    }
    loginWithAkun(akun);
    toast(`Selamat datang di Kamar ${matchedP.kamar}, ${matchedP.nama}! 🔑`);
    return;
  }

  // HANYA gavinutomo4@gmail.com yang berhak menjadi Manager!
  const isOwner = (email === 'gavinutomo4@gmail.com');
  const role = isOwner ? 'manager' : 'penghuni';
  let akun = S.akun.find(a => a.email && a.email.toLowerCase() === email);
  if (!akun) {
    const pFirst = role === 'penghuni' ? (S.penghuni[0] || null) : null;
    akun = {
      id: 'akun_' + uid(),
      nama: isOwner ? 'Gavin Utomo (Owner)' : namaInput,
      email: email,
      role: role,
      penghuniId: pFirst ? pFirst.id : null
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

  // STRICT SECURITY RULE: HANYA gavinutomo4@gmail.com YANG MENJADI MANAGER!
  const isMgr = (email === 'gavinutomo4@gmail.com');
  const role = isMgr ? 'manager' : 'penghuni';

  // Cek apakah email cocok dengan penghuni yang terdaftar
  const matchedP = S.penghuni.find(p => p.email && p.email.toLowerCase() === email);

  let akun = S.akun.find(a => a.email && a.email.toLowerCase() === email);
  if (!akun) {
    akun = {
      id: 'google_' + (profile.sub || uid()),
      email,
      nama: isMgr ? 'Gavin Utomo (Owner)' : nama,
      avatar,
      role,
      penghuniId: matchedP ? matchedP.id : null,
      googleAuth: true
    };
    S.akun.push(akun);
    LS.save();
  } else {
    akun.nama = isMgr ? 'Gavin Utomo (Owner)' : (akun.nama || nama);
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
      window.google.accounts.id.renderButton(container, {
        theme: 'filled_blue',
        size: 'large',
        width: 320,
        text: 'signin_with',
        shape: 'pill',
        logo_alignment: 'left'
      });
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

function loginWithAkun(akun) {
  currentUser = akun;
  LS.saveSession(akun);
  enterApp();
}

// ── LOGOUT ────────────────────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  confirm_dlg('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari SiKost?', async () => {
    if (sbClient) {
      try { await sbClient.auth.signOut(); } catch {}
    }
    currentUser = null;
    LS.clearSession();
    showScreen('screen-login');
    toast('Anda telah keluar.');
  }, 'Keluar');
});

function enterApp() {
  showScreen('screen-app');
  buildSidebar();
  renderUserChip();
  const firstPage = currentUser.role === 'manager' ? 'dashboard' : 'tenant';
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
  { id:'pengumuman',  icon:'📢', label:'Pengumuman' },
  { id:'pengaturan',  icon:'⚙',  label:'Pengaturan' },
];

const NAV_TENANT = [
  { id:'tenant', icon:'🪪', label:'Data Saya' },
  { id:'profil', icon:'👤', label:'Profil Akun' },
];

function buildSidebar() {
  const isMgr = currentUser.role === 'manager';
  const items = isMgr ? NAV_MANAGER : NAV_TENANT;
  $('sidebar-nav').innerHTML = items.map(item => `
    <a href="#" class="nav-item" data-page="${item.id}" id="nav-${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label-text">${item.label}</span>
      <span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>
    </a>`).join('');

  $('sidebar-nav').querySelectorAll('.nav-item').forEach(el =>
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); })
  );
  $('sb-role-badge').textContent = isMgr ? 'Manager' : 'Penghuni';
  $('sb-role-badge').className   = 'brand-role' + (isMgr ? '' : ' tenant');
  $('sb-kost-name').textContent  = S.kost.nama || 'SiKost';
  updateSidebarBadges();
}

function updateSidebarBadges() {
  if (currentUser?.role !== 'manager') return;
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
  pengumuman:  'Papan Pengumuman Kost',
  pengaturan:  'Pengaturan Sistem',
  tenant:      'Data Hunian Saya',
  profil:      'Profil Akun'
};

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pageEl = $('page-' + page); if (pageEl) pageEl.classList.add('active');
  const navEl  = $('nav-' + page);  if (navEl)  navEl.classList.add('active');
  $('topbar-title').textContent = PAGE_TITLES[page] || page;

  const isMgr = currentUser?.role === 'manager';
  $('btn-tambah-penghuni').style.display = (isMgr && page === 'penghuni') ? 'inline-flex' : 'none';
  $('btn-export-csv').style.display      = (isMgr && page === 'penghuni') ? 'inline-flex' : 'none';

  if (page === 'dashboard')   renderDashboard();
  if (page === 'penghuni')    renderPenghuni();
  if (page === 'kamar')       renderKamar();
  if (page === 'pembayaran')  renderPembayaran();
  if (page === 'pengeluaran') renderPengeluaran();
  if (page === 'keluhan')     renderKeluhan();
  if (page === 'pengumuman')  renderPengumuman();
  if (page === 'pengaturan')  renderPengaturan();
  if (page === 'tenant')      renderTenant();
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

// ── DASHBOARD (Manager) ───────────────────────────────────────
function renderDashboard() {
  const h = new Date().getHours();
  const greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  $('dash-greeting').textContent = greet + ', ' + (currentUser?.nama?.split(' ')[0] || '') + ' 👋';
  $('dash-date').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  // Banner Pengumuman Terkini
  const bannerEl = $('dash-pengumuman-banner');
  if (bannerEl) {
    const latestAnn = S.pengumuman && S.pengumuman.length > 0 ? S.pengumuman[0] : null;
    if (latestAnn) {
      bannerEl.style.display = 'block';
      bannerEl.innerHTML = `
        <div class="pengumuman-banner">
          <span class="pengumuman-banner-icon">📢</span>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <strong>${latestAnn.judul}</strong>
              <span class="badge ${latestAnn.prioritas === 'urgent' ? 'badge-red' : latestAnn.prioritas === 'penting' ? 'badge-orange' : 'badge-blue'}">${latestAnn.prioritas.toUpperCase()}</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-2);line-height:1.5">${latestAnn.isi}</div>
          </div>
        </div>
      `;
    } else {
      bannerEl.style.display = 'none';
    }
  }

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

  // 4 Kartu KPI Utama sesuai requirement test & user
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
    <div class="kpi">
      <div class="kpi-label">Terkumpul Bulan Ini <span style="font-size:1.1rem">💰</span></div>
      <div class="kpi-value" style="font-size:1.05rem;color:var(--green)">${rp(terkumpul)}</div>
      <div class="kpi-sub">${lunasList.length} dari ${aktif.length} penghuni lunas</div>
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

  // Quick Kamar Chips
  const allKamar = [...new Set([...S.kamar.map(k=>k.no), ...S.penghuni.map(p=>p.kamar).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const occ = {}; aktif.forEach(p => p.kamar && (occ[p.kamar] = true));
  $('quick-kamar').innerHTML = allKamar.map(no => `<span class="qk-chip ${occ[no] ? 'terisi' : 'kosong'}">${no}</span>`).join('') || '<span style="font-size:0.78rem;color:var(--text-3);padding:12px;display:block">Belum ada kamar.</span>';

  renderCharts();
}

function renderCharts() {
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
function openModalPenghuni(id = null) {
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
  }
  openModal('modal-penghuni');
}

window.openEdit = id => openModalPenghuni(id);
$('btn-tambah-penghuni').addEventListener('click', () => openModalPenghuni());
$('modal-penghuni-close').addEventListener('click', () => closeModal('modal-penghuni'));
$('btn-batal-penghuni').addEventListener('click', () => closeModal('modal-penghuni'));
$('modal-penghuni').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-penghuni'); });

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
function renderKamar() {
  const filter = $('filter-kamar-status')?.value || '';
  const occ = {};
  S.penghuni.filter(p => p.status === 'aktif').forEach(p => {
    if (p.kamar) { if (!occ[p.kamar]) occ[p.kamar] = []; occ[p.kamar].push(p); }
  });

  const list = [...S.kamar].sort((a,b) => (a.no||'').localeCompare(b.no||'', undefined, { numeric: true }));

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

  const filtered = list.filter(k => {
    const t = !!occ[k.no];
    if (filter === 'terisi') return t;
    if (filter === 'kosong') return !t;
    return true;
  });

  $('kamar-grid').innerHTML = filtered.map(k => {
    const isTerisi = !!occ[k.no], pen = occ[k.no] || [];
    return `<div class="km-card ${isTerisi?'terisi':'kosong'}">
      <div class="km-no">${k.no}</div>
      <div class="km-lbl">Lantai ${k.lantai||'1'} · ${k.tipe||'Standar'}</div>
      <div style="margin:8px 0">${isTerisi?'<span class="badge badge-green">Terisi</span>':'<span class="badge badge-gray">Kosong</span>'}</div>
      <div class="km-name">${pen.map(p=>p.nama).join(', ')||'<span style="color:var(--text-4);font-weight:normal">Siap Huni</span>'}</div>
      ${k.harga?`<div class="km-info">${rp(k.harga)}/bln</div>`:''}
      ${k.fasilitas?`<div class="km-info">${k.fasilitas}</div>`:''}
      <div class="km-actions">
        <button class="btn-outline btn-sm" onclick="editKamar('${k.id}')">Edit</button>
        <button class="btn-danger btn-sm" onclick="hapusKamar('${k.id}')">Hapus</button>
      </div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="empty-emoji">🛏</div><p class="empty-title">Belum ada kamar</p><p class="empty-sub">Klik "Tambah Kamar" untuk mengelola kamar.</p></div>`;
}

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
    months.push(d.toISOString().slice(0, 7));
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

  const text = `Halo Kak ${p.nama}, mengingatkan tagihan sewa kamar ${p.kamar || ''} di ${S.kost.nama || 'Kost'} untuk bulan ${blnLabel} sebesar *${rp(p.sewa)}* telah jatuh tempo.${rekInfo}\n\nMohon konfirmasi atau kirimkan bukti transfer jika sudah membayar ya. Terima kasih banyak! 🙏`;
  
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
  const sel = $('filter-bulan-pengeluaran');
  const months = []; const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  const cur = sel.value || months[0];
  sel.innerHTML = months.map(m => {
    const [y, mo] = m.split('-');
    const lbl = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return `<option value="${m}"${m === cur ? ' selected' : ''}>${lbl}</option>`;
  }).join('');

  const bln = sel.value || months[0];
  const katFilter = $('filter-kategori-pengeluaran')?.value || '';

  const list = S.pengeluaran.filter(x => {
    const mBln = !bln || (x.tanggal || '').startsWith(bln);
    const mKat = !katFilter || x.kategori === katFilter;
    return mBln && mKat;
  });

  const totalBulanIni = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(bln)).reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  const avg = list.length > 0 ? Math.round(totalBulanIni / list.length) : 0;

  $('kpi-pengeluaran').innerHTML = `
    <div class="kpi"><div class="kpi-label">Total Pengeluaran</div><div class="kpi-value" style="color:var(--red)">${rp(totalBulanIni)}</div><div class="kpi-sub">bulan ini</div></div>
    <div class="kpi"><div class="kpi-label">Jumlah Transaksi</div><div class="kpi-value">${list.length}</div><div class="kpi-sub">catatan operasional</div></div>
    <div class="kpi"><div class="kpi-label">Rata-rata Transaksi</div><div class="kpi-value">${rp(avg)}</div><div class="kpi-sub">pengeluaran per item</div></div>
    <div class="kpi"><div class="kpi-label">Kategori Aktif</div><div class="kpi-value">${[...new Set(list.map(x=>x.kategori))].length}</div><div class="kpi-sub">jenis pengeluaran</div></div>
  `;

  $('tbody-pengeluaran').innerHTML = list.map(exp => `
    <tr>
      <td>${fmtD(exp.tanggal)}</td>
      <td><span class="badge badge-purple">${exp.kategori}</span></td>
      <td><strong>${exp.keterangan || '–'}</strong></td>
      <td><strong style="color:var(--red)">${rp(exp.jumlah)}</strong></td>
      <td>${exp.buktiNota ? `<a href="${exp.buktiNota}" target="_blank"><img src="${exp.buktiNota}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '<span style="color:var(--text-4)">–</span>'}</td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn-outline btn-sm" onclick="editPengeluaran('${exp.id}')">Edit</button>
          <button class="btn-danger btn-sm" onclick="hapusPengeluaran('${exp.id}')">Hapus</button>
        </div>
      </td>
    </tr>`).join('') || `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">Belum ada catatan pengeluaran pada bulan ini.</td></tr>`;
}

$('filter-bulan-pengeluaran').addEventListener('change', renderPengeluaran);
$('filter-kategori-pengeluaran').addEventListener('change', renderPengeluaran);

$('btn-tambah-pengeluaran').addEventListener('click', () => {
  $('modal-pengeluaran-title').textContent = 'Catat Pengeluaran Baru';
  $('form-pengeluaran').reset();
  $('field-pengeluaran-id').value = '';
  $('field-pengeluaran-tgl').value = new Date().toISOString().slice(0, 10);
  $('prev-pengeluaran-nota').style.display = 'none';
  $('btn-hapus-nota').style.display = 'none';
  openModal('modal-pengeluaran');
});

$('modal-pengeluaran-close').addEventListener('click', () => closeModal('modal-pengeluaran'));
$('btn-batal-pengeluaran').addEventListener('click', () => closeModal('modal-pengeluaran'));
$('modal-pengeluaran').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-pengeluaran'); });

$('field-pengeluaran-nota').addEventListener('change', async function() {
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

$('btn-hapus-nota').addEventListener('click', () => {
  $('field-pengeluaran-nota').value = '';
  $('prev-pengeluaran-nota').src = '';
  $('prev-pengeluaran-nota').style.display = 'none';
  $('btn-hapus-nota').style.display = 'none';
});

$('form-pengeluaran').addEventListener('submit', async function(e) {
  e.preventDefault();
  const id       = $('field-pengeluaran-id').value || uid();
  const tanggal  = $('field-pengeluaran-tgl').value;
  const kategori = $('field-pengeluaran-kategori').value;
  const jumlah   = Number($('field-pengeluaran-jumlah').value) || 0;
  const keterangan = $('field-pengeluaran-ket').value.trim();
  const buktiNota  = $('prev-pengeluaran-nota').style.display !== 'none' ? $('prev-pengeluaran-nota').src : null;

  if (jumlah <= 0) { toast('Nominal pengeluaran harus lebih dari 0!', 'err'); return; }

  const expData = { id, tanggal, kategori, jumlah, keterangan, buktiNota, createdBy: currentUser?.nama };
  const idx = S.pengeluaran.findIndex(x => x.id === id);
  if (idx !== -1) {
    S.pengeluaran[idx] = expData;
    toast('Pengeluaran diperbarui!');
  } else {
    S.pengeluaran.unshift(expData);
    toast('Pengeluaran dicatat! 💸');
  }

  LS.save();
  closeModal('modal-pengeluaran');
  renderPengeluaran();
  if ($('page-dashboard').classList.contains('active')) renderDashboard();

  await DB.savePengeluaran(expData);
});

window.editPengeluaran = function(id) {
  const exp = S.pengeluaran.find(x => x.id === id); if (!exp) return;
  $('modal-pengeluaran-title').textContent = 'Edit Pengeluaran';
  $('field-pengeluaran-id').value       = exp.id;
  $('field-pengeluaran-tgl').value      = exp.tanggal;
  $('field-pengeluaran-kategori').value = exp.kategori;
  $('field-pengeluaran-jumlah').value   = exp.jumlah;
  $('field-pengeluaran-ket').value      = exp.keterangan || '';
  if (exp.buktiNota) {
    $('prev-pengeluaran-nota').src = exp.buktiNota;
    $('prev-pengeluaran-nota').style.display = 'block';
    $('btn-hapus-nota').style.display = 'inline-block';
  } else {
    $('prev-pengeluaran-nota').style.display = 'none';
    $('btn-hapus-nota').style.display = 'none';
  }
  openModal('modal-pengeluaran');
};

window.hapusPengeluaran = function(id) {
  confirm_dlg('Hapus Pengeluaran', 'Hapus catatan pengeluaran ini?', async () => {
    S.pengeluaran = S.pengeluaran.filter(x => x.id !== id);
    LS.save(); renderPengeluaran(); toast('Pengeluaran dihapus.');
    await DB.deletePengeluaran(id);
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

// ── PENGUMUMAN (BROADCAST) ────────────────────────────────────
function renderPengumuman() {
  $('pengumuman-list').innerHTML = S.pengumuman.map(ann => `
    <div class="pengumuman-card priority-${ann.prioritas}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div>
          <h3 style="font-size:1.05rem;font-weight:800;color:var(--text);margin-bottom:4px">${ann.judul}</h3>
          <div style="font-size:0.75rem;color:var(--text-3)">Diposting: ${fmtD(ann.tanggal)} · Oleh: ${ann.createdBy || 'Pengelola'}</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <span class="badge ${ann.prioritas==='urgent'?'badge-red':ann.prioritas==='penting'?'badge-orange':'badge-blue'}">${ann.prioritas.toUpperCase()}</span>
          <button class="btn-danger btn-sm" onclick="hapusPengumuman('${ann.id}')">Hapus</button>
        </div>
      </div>
      <div style="font-size:0.85rem;color:var(--text-2);line-height:1.6">${ann.isi}</div>
    </div>`).join('') || `<div class="empty-state"><div class="empty-emoji">📢</div><p class="empty-title">Belum ada pengumuman</p><p class="empty-sub">Klik "Buat Pengumuman Baru" untuk menyiarkan informasi ke seluruh anak kost.</p></div>`;
}

$('btn-tambah-pengumuman').addEventListener('click', () => {
  $('form-pengumuman').reset();
  openModal('modal-pengumuman');
});
$('modal-pengumuman-close').addEventListener('click', () => closeModal('modal-pengumuman'));
$('btn-batal-pengumuman').addEventListener('click', () => closeModal('modal-pengumuman'));

$('form-pengumuman').addEventListener('submit', async function(e) {
  e.preventDefault();
  const judul = $('field-pengumuman-judul').value.trim();
  const isi   = $('field-pengumuman-isi').value.trim();
  const prioritas = $('field-pengumuman-prioritas').value;
  if (!judul || !isi) return;

  const ann = {
    id: uid(),
    judul, isi, prioritas,
    tanggal: new Date().toISOString().slice(0, 10),
    createdBy: currentUser?.nama || 'Manager'
  };

  S.pengumuman.unshift(ann);
  LS.save();
  closeModal('modal-pengumuman');
  renderPengumuman();
  toast('Pengumuman berhasil disiarkan! 📢');
  await DB.savePengumuman(ann);
});

window.hapusPengumuman = function(id) {
  confirm_dlg('Hapus Pengumuman', 'Hapus pengumuman ini?', async () => {
    S.pengumuman = S.pengumuman.filter(x => x.id !== id);
    LS.save(); renderPengumuman(); toast('Pengumuman dihapus.');
    await DB.deletePengumuman(id);
  }, 'Hapus');
};

// ── TENANT PORTAL (ANAK KOST) ─────────────────────────────────
function renderTenant() {
  const p = currentUser?.penghuniId ? S.penghuni.find(x => x.id === currentUser.penghuniId) : null;
  if (!p) {
    $('tenant-content').style.display = 'none';
    $('tenant-not-found').style.display = 'block';
    return;
  }
  $('tenant-not-found').style.display = 'none';
  $('tenant-content').style.display   = 'block';

  const bln = thisMonth(), pb = S.pembayaran.find(x => x.penghuniId === p.id && x.bulan === bln), age = ageOf(p.tglLahir);
  const av = p.foto ? `<img class="t-avatar" src="${p.foto}" alt="${p.nama}"/>` : `<div class="t-avatar-ph">${init(p.nama)}</div>`;

  // Banner Pengumuman Kost
  let annHtml = '';
  if (S.pengumuman && S.pengumuman.length > 0) {
    const ann = S.pengumuman[0];
    annHtml = `
      <div class="pengumuman-banner" style="margin-bottom:18px">
        <span class="pengumuman-banner-icon">📢</span>
        <div>
          <div style="font-weight:800;margin-bottom:2px">${ann.judul} <span class="badge ${ann.prioritas==='urgent'?'badge-red':'badge-blue'}">${ann.prioritas.toUpperCase()}</span></div>
          <div style="font-size:0.8rem;color:var(--text-2);line-height:1.5">${ann.isi}</div>
        </div>
      </div>
    `;
  }

  // Riwayat Pembayaran Pribadi
  const myPayments = S.pembayaran.filter(x => x.penghuniId === p.id).sort((a,b) => b.bulan.localeCompare(a.bulan));
  const myComplaints = S.keluhan.filter(x => x.penghuniId === p.id).sort((a,b) => (b.tglLapor||'').localeCompare(a.tglLapor||''));

  // Info Rekening Bank Kost
  let bankBox = '';
  if (S.kost.bankNama && S.kost.bankRekening) {
    bankBox = `
      <div style="background:var(--accent-bg);border:1px solid var(--accent-border);border-radius:var(--radius);padding:14px 18px;margin-top:14px">
        <div style="font-size:0.75rem;font-weight:700;color:var(--accent-light);text-transform:uppercase">Info Pembayaran Kost:</div>
        <div style="font-size:0.95rem;font-weight:800;color:#fff;margin:4px 0">${S.kost.bankNama}: ${S.kost.bankRekening}</div>
        <div style="font-size:0.8rem;color:var(--text-2)">a.n ${S.kost.bankAtasNama || S.kost.pemilik}</div>
      </div>
    `;
  }

  $('tenant-content').innerHTML = `
    ${annHtml}

    <div class="tenant-hero">
      ${av}
      <div style="flex:1">
        <div class="t-name">${p.nama}</div>
        <div class="text-muted">${p.pekerjaan || '–'}</div>
        <div class="t-tags">
          ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Tidak Aktif</span>'}
          ${pb?.status==='lunas'?'<span class="badge badge-green">✅ Lunas Bulan Ini</span>':(pb?.status==='menunggu'?'<span class="badge badge-orange">⏳ Verifikasi Pembayaran</span>':'<span class="badge badge-red">❌ Belum Bayar Bulan Ini</span>')}
        </div>
      </div>
      <div>
        ${pb?.status==='lunas' ? `<button class="btn-ghost" onclick="showKwitansi('${p.id}','${bln}')">🧾 Unduh Kwitansi</button>` : `<button class="btn-primary" onclick="openKonfirmasiBayarTenant('${p.id}','${bln}')">💳 Upload Bukti Bayar</button>`}
      </div>
    </div>

    ${bankBox}

    <div class="tenant-grid" style="margin-top:18px">
      <div class="t-section"><h4>🪪 Identitas</h4>
        <div class="t-row"><div class="t-key">NIK (Terproteksi)</div><div class="t-val">${maskNik(p.nik, p.id)}</div></div>
        <div class="t-row"><div class="t-key">Jenis Kelamin</div><div class="t-val">${p.gender||'–'}</div></div>
        <div class="t-row"><div class="t-key">Tempat, Tgl Lahir</div><div class="t-val">${p.tempatLahir?p.tempatLahir+', ':''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</div></div>
        <div class="t-row"><div class="t-key">Alamat KTP</div><div class="t-val">${p.alamatKtp||'–'}</div></div>
        <div class="t-row"><div class="t-key">Pekerjaan</div><div class="t-val">${p.pekerjaan||'–'}</div></div>
      </div>
      <div class="t-section"><h4>🏠 Hunian &amp; Sewa</h4>
        <div class="t-row"><div class="t-key">Kamar</div><div class="t-val">${p.kamar||'–'} ${p.lantai?'(Lantai '+p.lantai+')':''}</div></div>
        <div class="t-row"><div class="t-key">Tanggal Masuk</div><div class="t-val">${fmtD(p.tglMasuk)}</div></div>
        <div class="t-row"><div class="t-key">Lama Tinggal</div><div class="t-val">${durasi(p.tglMasuk)}</div></div>
        <div class="t-row"><div class="t-key">Sewa / Bulan</div><div class="t-val">${rp(p.sewa)}</div></div>
        <div class="t-row"><div class="t-key">Jatuh Tempo</div><div class="t-val">${p.tempo?'Tgl '+p.tempo+' setiap bulan':'–'}</div></div>
        <div class="t-row"><div class="t-key">Uang Jaminan (Deposit)</div><div class="t-val" style="color:var(--orange)">${p.deposit ? rp(p.deposit) : 'Rp 0'}</div></div>
      </div>
      <div class="t-section"><h4>🚗 Kendaraan</h4>
        <div class="t-row"><div class="t-key">Kepemilikan</div><div class="t-val">${p.kendaraan||'Tidak ada'}</div></div>
        ${p.merk1?`<div class="t-row"><div class="t-key">Kendaraan 1</div><div class="t-val">${p.merk1}${p.plat1?' · '+p.plat1:''}</div></div>`:''}
        ${p.merk2?`<div class="t-row"><div class="t-key">Kendaraan 2</div><div class="t-val">${p.merk2}${p.plat2?' · '+p.plat2:''}</div></div>`:''}
      </div>
      <div class="t-section"><h4>📞 Kontak Darurat</h4>
        <div class="t-row"><div class="t-key">Nama Kontak Darurat</div><div class="t-val">${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</div></div>
        <div class="t-row"><div class="t-key">HP Darurat</div><div class="t-val">${p.daruratHp||'–'}</div></div>
        <div class="t-row"><div class="t-key">Alamat Darurat</div><div class="t-val">${p.daruratAlamat||'–'}</div></div>
      </div>
    </div>

    <!-- Riwayat Pembayaran Saya -->
    <div class="panel" style="margin-top:20px">
      <div class="panel-header"><span class="panel-title">💳 Riwayat Pembayaran Sewa Saya</span></div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Bulan</th><th>Nominal</th><th>Tgl Bayar</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            ${myPayments.map(pbRow => `
              <tr>
                <td><strong>${pbRow.bulan}</strong></td>
                <td>${rp(pbRow.jumlah)}</td>
                <td>${fmtD(pbRow.tglBayar)}</td>
                <td>${pbRow.status==='lunas'?'<span class="badge badge-green">Lunas</span>':'<span class="badge badge-orange">Menunggu Verifikasi</span>'}</td>
                <td>${pbRow.status==='lunas'?`<button class="btn-ghost btn-sm" onclick="showKwitansi('${p.id}','${pbRow.bulan}')">🧾 Kwitansi</button>`:'–'}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-3)">Belum ada catatan pembayaran.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tiket Keluhan & Perbaikan Saya -->
    <div class="panel" style="margin-top:20px">
      <div class="panel-header">
        <span class="panel-title">🛠️ Keluhan &amp; Perbaikan Fasilitas Kamar</span>
        <button class="btn-primary btn-sm" onclick="openLaporKeluhan('${p.id}')">+ Lapor Masalah</button>
      </div>
      <div class="tbl-wrap">
        <table class="tbl">
          <thead><tr><th>Tanggal</th><th>Kategori</th><th>Masalah</th><th>Status</th><th>Tanggapan Pengelola</th></tr></thead>
          <tbody>
            ${myComplaints.map(k => `
              <tr>
                <td>${fmtD(k.tglLapor)}</td>
                <td><span class="badge badge-purple">${k.kategori||'Lainnya'}</span></td>
                <td><strong>${k.judul}</strong><br><small style="color:var(--text-3)">${k.deskripsi}</small></td>
                <td>${k.status==='selesai'?'<span class="badge badge-green">Selesai</span>':(k.status==='diproses'?'<span class="badge badge-blue">Diproses</span>':'<span class="badge badge-orange">Menunggu</span>')}</td>
                <td>${k.responManager ? `<span style="color:var(--accent-light)">${k.responManager}</span>` : '<span style="color:var(--text-4)">Menunggu tanggapan</span>'}</td>
              </tr>
            `).join('') || `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-3)">Belum ada keluhan yang dilaporkan.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── MODAL KONFIRMASI BAYAR (TENANT) ───────────────────────────
window.openKonfirmasiBayarTenant = function(pid, blnDefault) {
  const p = S.penghuni.find(x => x.id === pid); if (!p) return;
  const sel = $('field-konfirmasi-bulan');
  const months = []; const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }
  sel.innerHTML = months.map(m => {
    const [y, mo] = m.split('-');
    const lbl = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return `<option value="${m}"${m === blnDefault ? ' selected' : ''}>${lbl} (${m})</option>`;
  }).join('');

  $('field-konfirmasi-jumlah').value = p.sewa || '';
  $('field-konfirmasi-catatan').value = '';
  $('field-konfirmasi-bukti').value = '';
  $('prev-konfirmasi-bukti').src = '';
  $('prev-konfirmasi-bukti').style.display = 'none';

  openModal('modal-konfirmasi-bayar');
};

$('modal-konfirmasi-bayar-close').addEventListener('click', () => closeModal('modal-konfirmasi-bayar'));
$('btn-batal-konfirmasi-bayar').addEventListener('click', () => closeModal('modal-konfirmasi-bayar'));

$('field-konfirmasi-bukti').addEventListener('change', async function() {
  const f = this.files[0]; if (!f) return;
  try {
    toast('Mengompres bukti transfer... ⏳');
    const dataUrl = await compressImage(f, 900, 900, 0.75);
    $('prev-konfirmasi-bukti').src = dataUrl;
    $('prev-konfirmasi-bukti').style.display = 'block';
    toast('Bukti transfer siap diunggah! ✅');
  } catch (err) { toast(err.message, 'err'); }
});

$('form-konfirmasi-bayar').addEventListener('submit', async function(e) {
  e.preventDefault();
  const pid   = currentUser?.penghuniId;
  const bulan = $('field-konfirmasi-bulan').value;
  const jumlah = Number($('field-konfirmasi-jumlah').value) || 0;
  const catatan = $('field-konfirmasi-catatan').value.trim();
  const buktiTransfer = $('prev-konfirmasi-bukti').src;

  if (!buktiTransfer || $('prev-konfirmasi-bukti').style.display === 'none') {
    toast('Harap unggah foto bukti transfer!', 'err'); return;
  }

  let pb = S.pembayaran.find(x => x.penghuniId === pid && x.bulan === bulan);
  if (pb) {
    pb.jumlah = jumlah;
    pb.status = 'menunggu';
    pb.buktiTransfer = buktiTransfer;
    pb.catatanBayar = catatan;
    pb.tglBayar = new Date().toISOString();
  } else {
    pb = {
      id: uid(),
      penghuniId: pid,
      bulan,
      jumlah,
      status: 'menunggu',
      buktiTransfer,
      catatanBayar: catatan,
      tglBayar: new Date().toISOString()
    };
    S.pembayaran.push(pb);
  }

  LS.save();
  closeModal('modal-konfirmasi-bayar');
  renderTenant();
  toast('Konfirmasi pembayaran terkirim! Menunggu verifikasi Manager. ⏳');
  await DB.savePembayaran(pb);
  updateSidebarBadges();
});

// ── MODAL LAPOR KELUHAN (TENANT) ──────────────────────────────
window.openLaporKeluhan = function(pid) {
  $('form-buat-keluhan').reset();
  $('prev-keluhan-foto').src = '';
  $('prev-keluhan-foto').style.display = 'none';
  openModal('modal-buat-keluhan');
};

$('modal-buat-keluhan-close').addEventListener('click', () => closeModal('modal-buat-keluhan'));
$('btn-batal-buat-keluhan').addEventListener('click', () => closeModal('modal-buat-keluhan'));

$('field-keluhan-foto').addEventListener('change', async function() {
  const f = this.files[0]; if (!f) return;
  try {
    toast('Mengompres foto kendala... ⏳');
    const dataUrl = await compressImage(f, 900, 900, 0.75);
    $('prev-keluhan-foto').src = dataUrl;
    $('prev-keluhan-foto').style.display = 'block';
  } catch (err) { toast(err.message, 'err'); }
});

$('form-buat-keluhan').addEventListener('submit', async function(e) {
  e.preventDefault();
  const p = S.penghuni.find(x => x.id === currentUser?.penghuniId);
  const judul = $('field-keluhan-judul').value.trim();
  const kategori = $('field-keluhan-kategori').value;
  const deskripsi = $('field-keluhan-deskripsi').value.trim();
  const foto = $('prev-keluhan-foto').style.display !== 'none' ? $('prev-keluhan-foto').src : null;

  if (!judul || !deskripsi) return;

  const klh = {
    id: uid(),
    penghuniId: currentUser.penghuniId,
    kamar: p?.kamar || '–',
    judul,
    kategori,
    deskripsi,
    foto,
    status: 'menunggu',
    responManager: null,
    tglLapor: new Date().toISOString()
  };

  S.keluhan.unshift(klh);
  LS.save();
  closeModal('modal-buat-keluhan');
  renderTenant();
  toast('Laporan keluhan terkirim ke pengelola! 🛠️');
  await DB.saveKeluhan(klh);
  updateSidebarBadges();
});

// ── PROFIL AKUN ───────────────────────────────────────────────
function renderProfil() {
  $('profil-info').innerHTML = `
    <div class="profil-row"><span class="profil-key">Nama</span><span class="profil-val">${currentUser.nama}</span></div>
    <div class="profil-row"><span class="profil-key">Email</span><span class="profil-val">${currentUser.email}</span></div>
    <div class="profil-row"><span class="profil-key">Role</span><span class="profil-val">${currentUser.role==='manager'?'Manager (Akses Penuh)':'Penghuni'}</span></div>
  `;
}

$('form-profil-pw').addEventListener('submit', async function(e) {
  e.preventDefault();
  await gantiPassword($('profil-pw-lama').value, $('profil-pw-baru').value, $('profil-pw-confirm').value, this);
});

// ── PENGATURAN (MANAGER) ──────────────────────────────────────
function renderPengaturan() {
  $('set-nama-kost').value   = S.kost.nama || '';
  $('set-pemilik').value     = S.kost.pemilik || '';
  $('set-alamat').value      = S.kost.alamat || '';
  $('set-hp-pemilik').value  = S.kost.hp || '';
  $('set-total-kamar').value = S.kost.totalKamar || '';

  // Form Bank & QRIS
  if ($('set-bank-nama'))     $('set-bank-nama').value     = S.kost.bankNama || '';
  if ($('set-bank-rekening')) $('set-bank-rekening').value = S.kost.bankRekening || '';
  if ($('set-bank-atas-nama'))$('set-bank-atas-nama').value= S.kost.bankAtasNama || '';
  if ($('set-qris-url'))      $('set-qris-url').value      = S.kost.qrisUrl || '';

  renderAkunList();
  fillAkunLinkSelect();

  const cfg = getSupabaseConfig();
  if (cfg) {
    if ($('cloud-url-input')) $('cloud-url-input').value = cfg.url;
    if ($('cloud-key-input')) $('cloud-key-input').value = cfg.key;
  }
  updateCloudStatusUI(isCloudConnected, cfg?.url || '');
}

$('form-kost').addEventListener('submit', async function(e) {
  e.preventDefault();
  S.kost.nama       = $('set-nama-kost').value.trim();
  S.kost.pemilik    = $('set-pemilik').value.trim();
  S.kost.alamat     = $('set-alamat').value.trim();
  S.kost.hp         = $('set-hp-pemilik').value.trim();
  S.kost.totalKamar = $('set-total-kamar').value;
  LS.save();
  $('sb-kost-name').textContent = S.kost.nama || 'SiKost';
  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama;
  toast('Profil kost disimpan! 🏠');
  await DB.saveKost();
});

const formBank = $('form-bank');
if (formBank) {
  formBank.addEventListener('submit', async function(e) {
    e.preventDefault();
    S.kost.bankNama      = $('set-bank-nama').value.trim();
    S.kost.bankRekening  = $('set-bank-rekening').value.trim();
    S.kost.bankAtasNama  = $('set-bank-atas-nama').value.trim();
    S.kost.qrisUrl       = $('set-qris-url').value.trim();
    LS.save();
    toast('Informasi pembayaran disimpan! 💳');
    await DB.saveKost();
  });
}

document.querySelectorAll('.settings-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.stab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    $('stab-' + btn.dataset.stab).classList.add('active');
  });
});

function renderAkunList() {
  const tbody = $('tbody-akun'); if (!tbody) return;
  tbody.innerHTML = S.akun.map(a => {
    const p = a.penghuniId ? S.penghuni.find(x => x.id === a.penghuniId) : null;
    const isMe = a.id === currentUser?.id;
    return `<tr>
      <td><strong>${a.nama}</strong> ${isMe?'<span class="badge badge-blue">Anda</span>':''}</td>
      <td>${a.email}</td>
      <td><span class="badge ${a.role==='manager'?'badge-blue':'badge-gray'}">${a.role==='manager'?'Manager':'Penghuni'}</span></td>
      <td>${p ? p.nama + ' (Kamar ' + (p.kamar||'–') + ')' : '<span style="color:var(--text-3)">–</span>'}</td>
      <td>${!isMe ? `<button class="btn-danger btn-sm" onclick="hapusAkun('${a.id}')">Hapus</button>` : '–'}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-3)">Belum ada akun lain.</td></tr>`;
}

function fillAkunLinkSelect() {
  const sel = $('akun-link-penghuni'); if (!sel) return;
  sel.innerHTML = '<option value="">-- Pilih penghuni (opsional) --</option>' +
    S.penghuni.map(p => `<option value="${p.id}">${p.nama} (Kamar ${p.kamar||'–'})</option>`).join('');
}

window.tambahAkunPenghuni = async function() {
  const nama  = $('akun-nama').value.trim();
  const email = $('akun-email').value.trim().toLowerCase();
  const pw    = $('akun-pw').value;
  const pid   = $('akun-link-penghuni').value;
  if (!nama)  { toast('Nama wajib diisi!','err'); return; }
  if (!email) { toast('Email wajib diisi!','err'); return; }
  if (pw.length < 6) { toast('Password minimal 6 karakter!','err'); return; }
  if (S.akun.find(a => a.email === email)) { toast('Email sudah terdaftar!','err'); return; }

  if (sbClient) {
    try {
      const cfg = getSupabaseConfig();
      const tempClient = window.supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
      const { data, error } = await tempClient.auth.signUp({
        email, password: pw, options: { data: { nama, role: 'penghuni', penghuni_id: pid || null } }
      });
      if (error) throw error;
      const newId = data.user?.id || uid();
      await sbClient.from('profiles').upsert({ id: newId, nama, email, role: 'penghuni', penghuni_id: pid || null });
      S.akun.push({ id: newId, nama, email, role: 'penghuni', penghuniId: pid || null });
      LS.save(); renderAkunList(); fillAkunLinkSelect();
      $('akun-nama').value = ''; $('akun-email').value = ''; $('akun-pw').value = ''; $('akun-link-penghuni').value = '';
      toast(`Akun Cloud untuk ${nama} berhasil dibuat! 🎉`);
      return;
    } catch (err) {
      toast('Gagal buat akun Cloud: ' + err.message, 'err');
      return;
    }
  }

  const pwHash = await hashPw(pw);
  S.akun.push({ id: uid(), nama, email, pwHash, role: 'penghuni', penghuniId: pid || null });
  LS.save(); renderAkunList(); fillAkunLinkSelect();
  $('akun-nama').value = ''; $('akun-email').value = ''; $('akun-pw').value = ''; $('akun-link-penghuni').value = '';
  toast(`Akun untuk ${nama} berhasil dibuat! 🎉`);
};

window.hapusAkun = function(id) {
  const a = S.akun.find(x => x.id === id); if (!a || a.id === currentUser?.id) return;
  confirm_dlg('Hapus Akun', `Hapus akun "${a.email}"?`, async () => {
    S.akun = S.akun.filter(x => x.id !== id);
    LS.save(); renderAkunList(); toast('Akun dihapus.');
    if (sbClient) {
      try { await sbClient.from('profiles').delete().eq('id', id); } catch {}
    }
  }, 'Hapus');
};

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
    pengumuman: S.pengumuman,
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
        S.pengumuman  = d.pengumuman || [];
        S.kost        = d.kost || S.kost;
        LS.save(); renderPengaturan(); toast('Data berhasil di-restore!');
      }, 'Lanjutkan');
    } catch { toast('File JSON tidak valid.','err'); }
  };
  r.readAsText(f); this.value = '';
});

$('btn-hapus-semua').addEventListener('click', () => {
  confirm_dlg('Hapus Semua Data Operasional', 'Hapus SEMUA data penghuni, kamar, pembayaran, pengeluaran, dan tiket keluhan?', () => {
    S.penghuni = []; S.kamar = []; S.pembayaran = []; S.pengeluaran = []; S.keluhan = []; S.pengumuman = [];
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
  if (confirmCb) { confirmCb(); confirmCb = null; }
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

  const btnDemoTnt = $('btn-demo-tnt');
  if (btnDemoTnt) {
    btnDemoTnt.addEventListener('click', () => {
      seedDemoData(false);
      let tnt = S.akun.find(a => a.role === 'penghuni');
      if (!tnt) {
        const p = S.penghuni[0];
        tnt = { id: 'akun_tnt', nama: p?.nama || 'Dimas Prasetyo', email: 'dimas@sikost.id', role: 'penghuni', penghuniId: p?.id || null };
        S.akun.push(tnt);
        LS.save();
      }
      loginWithAkun(tnt);
      toast(`Selamat datang di Portal Anak Kost, ${tnt.nama}! 🪪`);
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
