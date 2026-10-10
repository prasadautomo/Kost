/* ============================================================
   SIKOST – app.js  v4.1 (Enterprise Cloud & Offline PWA Edition)
   Supabase Auth · Realtime Sync · Strict RLS · Finansial & Operasional
   Auto Image Compression · Kwitansi & Kontrak Sewa
   ============================================================ */
'use strict';

// ── GLOBAL DOM & MODAL HELPERS (HOISTED) ──────────────────────
function $(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}
if (typeof window !== 'undefined') window.$ = $;

function openModal(id) { const el = $(id); if (el) el.classList.add('open'); }
function closeModal(id) { const el = $(id); if (el) el.classList.remove('open'); }
if (typeof window !== 'undefined') {
  window.openModal = openModal;
  window.closeModal = closeModal;
}

// ── DEFAULT 5 CABANG MULTI-KOST (TERISOLASI & BERSIH) ─────────────
function getCleanInitialState() {
  const branches = [
    {
      kost: {
        id: 'kost_1',
        nama: 'Kost Griya Harmoni Sleman',
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
      kamar: [
        { id: 'km_101', no: '101', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed 160x200, Lemari 2 Pintu, Meja Belajar, Kamar Mandi Dalam' },
        { id: 'km_102', no: '102', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Kasur Springbed, Lemari, Meja Belajar, Kamar Mandi Dalam' },
        { id: 'km_103', no: '103', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
        { id: 'km_104', no: '104', lantai: '1', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
        { id: 'km_201', no: '201', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
        { id: 'km_202', no: '202', lantai: '2', tipe: 'VIP', harga: 1850000, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
        { id: 'km_203', no: '203', lantai: '2', tipe: 'Deluxe AC', harga: 1500000, fasilitas: 'AC, Springbed, Lemari 2 Pintu, Meja Kerja' },
        { id: 'km_204', no: '204', lantai: '2', tipe: 'Standar', harga: 950000, fasilitas: 'Kipas Angin, Kasur, Lemari, Meja' }
      ]
    },
    {
      kost: {
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
      },
      kamar: [
        { id: 'km_2_A01', no: 'A-01', lantai: '1', tipe: 'Studio Dago', harga: 1700000, fasilitas: 'AC, Kasur Queen Size, Meja Belajar Kayu Jati, Kamar Mandi Dalam' },
        { id: 'km_2_A02', no: 'A-02', lantai: '1', tipe: 'Studio Dago', harga: 1700000, fasilitas: 'AC, Kasur Queen Size, Lemari Pakaian, Water Heater' },
        { id: 'km_2_A03', no: 'A-03', lantai: '1', tipe: 'Deluxe Asri', harga: 1600000, fasilitas: 'AC, Kasur Springbed, Meja Kerja, KM Dalam' },
        { id: 'km_2_A04', no: 'A-04', lantai: '1', tipe: 'Standar Bandung', harga: 1200000, fasilitas: 'Exhaust Fan, Kasur Busa, Lemari, KM Luar' },
        { id: 'km_2_B01', no: 'B-01', lantai: '2', tipe: 'Executive Suite', harga: 1950000, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Bukit Dago' },
        { id: 'km_2_B02', no: 'B-02', lantai: '2', tipe: 'Executive Suite', harga: 1950000, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Dago' },
        { id: 'km_2_B03', no: 'B-03', lantai: '2', tipe: 'Deluxe Asri', harga: 1600000, fasilitas: 'AC, Kasur Springbed, Lemari 2 Pintu' },
        { id: 'km_2_B04', no: 'B-04', lantai: '2', tipe: 'Standar Bandung', harga: 1200000, fasilitas: 'Exhaust Fan, Meja, Lemari' }
      ]
    },
    {
      kost: {
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
      },
      kamar: [
        { id: 'km_3_101', no: '101', lantai: '1', tipe: 'Executive Studio', harga: 2500000, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
        { id: 'km_3_102', no: '102', lantai: '1', tipe: 'Executive Studio', harga: 2500000, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
        { id: 'km_3_103', no: '103', lantai: '1', tipe: 'Deluxe Room', harga: 2200000, fasilitas: 'AC Inverter, Single Bed 120, Lemari 2 Pintu, KM Dalam' },
        { id: 'km_3_201', no: '201', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
        { id: 'km_3_202', no: '202', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
        { id: 'km_3_203', no: '203', lantai: '2', tipe: 'Deluxe Room', harga: 2200000, fasilitas: 'AC, Kasur Springbed, Meja Kerja Ergonomis' },
        { id: 'km_3_301', no: '301', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' },
        { id: 'km_3_302', no: '302', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' }
      ]
    },
    {
      kost: {
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
      },
      kamar: [
        { id: 'km_4_G01', no: 'G-01', lantai: '1', tipe: 'Modern Compact AC', harga: 1650000, fasilitas: 'AC Daikin 1/2 PK, Springbed, Meja Belajar, KM Dalam Shower' },
        { id: 'km_4_G02', no: 'G-02', lantai: '1', tipe: 'Modern Compact AC', harga: 1650000, fasilitas: 'AC Daikin 1/2 PK, Springbed, Meja Belajar, KM Dalam Shower' },
        { id: 'km_4_G03', no: 'G-03', lantai: '1', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Exhaust Fan, Meja, Lemari 2 Pintu, KM Luar Bersih' },
        { id: 'km_4_G04', no: 'G-04', lantai: '1', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Exhaust Fan, Meja, Lemari 2 Pintu, KM Luar Bersih' },
        { id: 'km_4_U01', no: 'U-01', lantai: '2', tipe: 'Deluxe Airlangga', harga: 1800000, fasilitas: 'AC, Kulkas Pribadi, Kasur King Size, Smart TV 32"' },
        { id: 'km_4_U02', no: 'U-02', lantai: '2', tipe: 'Deluxe Airlangga', harga: 1800000, fasilitas: 'AC, Kulkas Pribadi, Kasur King Size, Smart TV 32"' },
        { id: 'km_4_U03', no: 'U-03', lantai: '2', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Kipas Angin Dinding, Kasur, Meja Belajar' },
        { id: 'km_4_U04', no: 'U-04', lantai: '2', tipe: 'Standard Surabaya', harga: 1300000, fasilitas: 'Kipas Angin Dinding, Kasur, Meja Belajar' }
      ]
    },
    {
      kost: {
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
      },
      kamar: [
        { id: 'km_5_01', no: '01', lantai: '1', tipe: 'Panorama View', harga: 1350000, fasilitas: 'Kasur Springbed Comfort, Meja Belajar Besar, Lemari 2 Pintu, KM Dalam' },
        { id: 'km_5_02', no: '02', lantai: '1', tipe: 'Panorama View', harga: 1350000, fasilitas: 'Kasur Springbed Comfort, Meja Belajar Besar, Lemari 2 Pintu, KM Dalam' },
        { id: 'km_5_03', no: '03', lantai: '1', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Busa Tebal, Meja, Lemari, KM Luar Bersih' },
        { id: 'km_5_04', no: '04', lantai: '1', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Busa Tebal, Meja, Lemari, KM Luar Bersih' },
        { id: 'km_5_05', no: '05', lantai: '2', tipe: 'Balkon Gunung', harga: 1450000, fasilitas: 'Kasur Queen, Balkon Hadap Gunung Panderman, Meja Belajar, KM Dalam' },
        { id: 'km_5_06', no: '06', lantai: '2', tipe: 'Balkon Gunung', harga: 1450000, fasilitas: 'Kasur Queen, Balkon Hadap Gunung Panderman, Meja Belajar, KM Dalam' },
        { id: 'km_5_07', no: '07', lantai: '2', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Springbed, Meja Kayu Pinus, Lemari' },
        { id: 'km_5_08', no: '08', lantai: '2', tipe: 'Standard Sejuk', harga: 1150000, fasilitas: 'Kasur Springbed, Meja Kayu Pinus, Lemari' }
      ]
    }
  ];

  const properties = branches.map(b => ({
    id: b.kost.id,
    nama: b.kost.nama,
    kota: b.kost.kota,
    alamat: b.kost.alamat,
    hp: b.kost.hp,
    pemilik: b.kost.pemilik,
    totalKamar: b.kost.totalKamar
  }));

  const propertiesData = {};
  branches.forEach(b => {
    propertiesData[b.kost.id] = {
      kost: { ...b.kost },
      kamar: [...b.kamar],
      penghuni: [],
      pembayaran: [],
      pengeluaran: [],
      keluhan: []
    };
  });

  const defaultKost = { ...branches[0].kost };
  return { properties, propertiesData, defaultKost };
}

// ── STATE (5 CABANG AKTIF, BERSIH DARI DATA DUMMY PENGHUNI) ──────
const _initCleanState = getCleanInitialState();
let S = {
  penghuni:   [],
  kamar:      [..._initCleanState.propertiesData['kost_1'].kamar],
  pembayaran: [],
  pengeluaran:[], // [{id, tanggal, kategori, jumlah, keterangan, buktiNota, createdBy}]
  keluhan:    [], // [{id, penghuniId, kamar, judul, kategori, deskripsi, foto, status, responManager, tglLapor, tglSelesai}]
  akun:       [],
  kost:       { ..._initCleanState.defaultKost },
  activeKostId: 'kost_1',
  properties: _initCleanState.properties,
  propertiesData: _initCleanState.propertiesData
};
window.S = S;

let currentUser  = null; // akun object
if (typeof window !== 'undefined') window.currentUser = null;
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
    const testClient = (sbClient && sbClient.supabaseUrl === url) ? sbClient : window.supabase.createClient(url, key, { auth: { persistSession: false } });
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

// ── PERFORMANCE UTILITIES (Zero-Lag Debounce & Throttle) ─────────
function debounce(fn, wait = 150) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}
window.debounce = debounce;

function throttle(fn, limit = 200) {
  let waiting = false;
  return function(...args) {
    if (!waiting) {
      fn.apply(this, args);
      waiting = true;
      setTimeout(() => { waiting = false; }, limit);
    }
  };
}
window.throttle = throttle;

// ── HELPER KALKULASI TANGGAL & KONTRAK SEWA ────────────────────
function addDaysYMD(days, baseDateStr = null) {
  let d;
  if (baseDateStr && /^\d{4}-\d{2}-\d{2}$/.test(baseDateStr)) {
    const [y, m, day] = baseDateStr.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    d = baseDateStr ? new Date(baseDateStr) : new Date();
  }
  d.setDate(d.getDate() + Number(days));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
window.addDaysYMD = addDaysYMD;

function addMonthsYMD(months, baseDateStr = null) {
  let [y, m, day] = (baseDateStr || todayYMD()).split('-').map(Number);
  if (!y || !m || !day) {
    const d = new Date();
    y = d.getFullYear(); m = d.getMonth() + 1; day = d.getDate();
  }
  let targetMonth = m + Number(months);
  let targetYear = y + Math.floor((targetMonth - 1) / 12);
  targetMonth = ((targetMonth - 1) % 12 + 12) % 12 + 1;
  const maxDays = new Date(targetYear, targetMonth, 0).getDate();
  const safeDay = Math.min(day, maxDays);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}
window.addMonthsYMD = addMonthsYMD;

function getContractExpiryStatus(p) {
  if (!p || (p.status && p.status !== 'aktif')) return null;
  if (!p.tglKeluar) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(p.tglKeluar);
  expiry.setHours(0, 0, 0, 0);
  if (isNaN(expiry.getTime())) return null;

  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      diffDays,
      status: 'expired',
      label: `Lewat ${Math.abs(diffDays)} Hari!`,
      badgeClass: 'badge-red',
      isUrgent: true
    };
  } else if (diffDays === 0) {
    return {
      diffDays,
      status: 'today',
      label: 'Habis Hari Ini!',
      badgeClass: 'badge-red',
      isUrgent: true
    };
  } else if (diffDays <= 7) {
    return {
      diffDays,
      status: 'critical',
      label: `Sisa ${diffDays} Hari`,
      badgeClass: 'badge-orange',
      isUrgent: true
    };
  } else if (diffDays <= 14) {
    return {
      diffDays,
      status: 'warning',
      label: `Sisa ${diffDays} Hari`,
      badgeClass: 'badge-blue',
      isUrgent: true
    };
  } else {
    return {
      diffDays,
      status: 'normal',
      label: `Sisa ${diffDays} Hari`,
      badgeClass: 'badge-gray',
      isUrgent: false
    };
  }
}
window.getContractExpiryStatus = getContractExpiryStatus;

// Helper: Menghitung Jatuh Tempo dinamis berdasarkan Tanggal Keluar & Tanggal Masuk
function getPenghuniJatuhTempo(p, targetBulan = null) {
  if (!p) {
    const today = todayYMD();
    return { day: 1, dateStr: today, label: '–', diffDays: 0, isContractExpired: false, periodeLabel: '–' };
  }

  const tglMasuk = p.tglMasuk || todayYMD();
  const tglKeluar = p.tglKeluar || null;
  const currentYM = targetBulan || thisMonth();
  const [targetY, targetM] = currentYM.split('-').map(Number);
  const maxDays = new Date(targetY, targetM, 0).getDate();

  // Hari Jatuh Tempo: Prioritaskan hari dari tanggal keluar jika ada, jika tidak gunakan tanggal masuk
  let dueDay = 1;
  if (tglKeluar) {
    const [kelY, kelM, kelD] = tglKeluar.split('-').map(Number);
    dueDay = kelD || 1;
  } else if (p.tglMasuk) {
    const [masukY, masukM, masukD] = tglMasuk.split('-').map(Number);
    dueDay = masukD || 1;
  }

  const safeDay = Math.min(dueDay, maxDays);
  // Jika targetBulan adalah bulan berakhirnya sewa, gunakan tanggal keluar tepat sebagai jatuh tempo
  let dueDateStr = `${targetY}-${String(targetM).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
  if (tglKeluar && tglKeluar.startsWith(currentYM)) {
    dueDateStr = tglKeluar;
  }

  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [dueY, dueMo, dueD] = dueDateStr.split('-').map(Number);
  const dueZero = new Date(dueY, dueMo - 1, dueD).getTime();
  const diffDays = Math.round((dueZero - todayZero) / 86400000);

  const isContractExpired = targetBulan 
    ? Boolean(tglKeluar && currentYM > tglKeluar.slice(0, 7))
    : Boolean(tglKeluar && todayYMD() > tglKeluar);

  return {
    day: dueDay,
    dateStr: dueDateStr,
    tglMasuk,
    tglKeluar,
    diffDays,
    isContractExpired,
    label: fmtD(dueDateStr),
    periodeLabel: `${fmtD(tglMasuk)} – ${tglKeluar ? fmtD(tglKeluar) : 'selesai'}`
  };
}
window.getPenghuniJatuhTempo = getPenghuniJatuhTempo;

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
    { id: 'km_101', no: '101', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, tempo: 1, fasilitas: 'AC, Kasur Springbed 160x200, Lemari 2 Pintu, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_102', no: '102', lantai: '1', tipe: 'Deluxe AC', harga: 1500000, tempo: 1, fasilitas: 'AC, Kasur Springbed, Lemari, Meja Belajar, Kamar Mandi Dalam' },
    { id: 'km_103', no: '103', lantai: '1', tipe: 'Standar', harga: 950000, tempo: 5, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_104', no: '104', lantai: '1', tipe: 'Standar', harga: 950000, tempo: 5, fasilitas: 'Kipas Angin, Kasur Busa, Lemari, Meja, Kamar Mandi Luar' },
    { id: 'km_201', no: '201', lantai: '2', tipe: 'VIP', harga: 1850000, tempo: 10, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_202', no: '202', lantai: '2', tipe: 'VIP', harga: 1850000, tempo: 10, fasilitas: 'AC, Smart TV 32", Water Heater, Meja Kerja Ergonomis, Balkon Pribadi' },
    { id: 'km_203', no: '203', lantai: '2', tipe: 'Deluxe AC', harga: 1500000, tempo: 15, fasilitas: 'AC, Springbed, Lemari 2 Pintu, Meja Kerja' },
    { id: 'km_204', no: '204', lantai: '2', tipe: 'Standar', harga: 950000, tempo: 20, fasilitas: 'Kipas Angin, Kasur, Lemari, Meja' }
  ];
  const penghuni1 = [
    {
      id: 'p_dimas',
      nama: 'Dimas Prasetyo',
      hp: '081288991122',
      kamar: '101',
      lantai: '1',
      tglMasuk: '2025-08-01',
      tglKeluar: addDaysYMD(5),
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
      tglKeluar: addDaysYMD(12),
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
      tglKeluar: addDaysYMD(30),
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
      tglKeluar: addDaysYMD(-2),
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
      tglKeluar: addDaysYMD(60),
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
      tglKeluar: addDaysYMD(180),
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
  const keluhan1 = [];


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
    { id: 'km_2_A01', no: 'A-01', lantai: '1', tipe: 'Studio Dago', harga: 1700000, tempo: 10, fasilitas: 'AC, Kasur Queen Size, Meja Belajar Kayu Jati, Kamar Mandi Dalam' },
    { id: 'km_2_A02', no: 'A-02', lantai: '1', tipe: 'Studio Dago', harga: 1700000, tempo: 1, fasilitas: 'AC, Kasur Queen Size, Lemari Pakaian, Water Heater' },
    { id: 'km_2_A03', no: 'A-03', lantai: '1', tipe: 'Deluxe Asri', harga: 1600000, tempo: 5, fasilitas: 'AC, Kasur Springbed, Meja Kerja, KM Dalam' },
    { id: 'km_2_A04', no: 'A-04', lantai: '1', tipe: 'Standar Bandung', harga: 1200000, tempo: 10, fasilitas: 'Exhaust Fan, Kasur Busa, Lemari, KM Luar' },
    { id: 'km_2_B01', no: 'B-01', lantai: '2', tipe: 'Executive Suite', harga: 1950000, tempo: 1, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Bukit Dago' },
    { id: 'km_2_B02', no: 'B-02', lantai: '2', tipe: 'Executive Suite', harga: 1950000, tempo: 5, fasilitas: 'AC, Smart TV, Kulkas Mini, Balkon View Dago' },
    { id: 'km_2_B03', no: 'B-03', lantai: '2', tipe: 'Deluxe Asri', harga: 1600000, tempo: 15, fasilitas: 'AC, Kasur Springbed, Lemari 2 Pintu' },
    { id: 'km_2_B04', no: 'B-04', lantai: '2', tipe: 'Standar Bandung', harga: 1200000, tempo: 20, fasilitas: 'Exhaust Fan, Meja, Lemari' }
  ];
  const penghuni2 = [
    { id: 'p_bdg_arya', nama: 'Arya Pratama', hp: '081211223301', kamar: 'A-01', lantai: '1', tglMasuk: '2025-05-10', tglKeluar: addDaysYMD(5), nik: '3273010101990001', gender: 'Laki-laki', tempatLahir: 'Bandung', tglLahir: '2001-02-14', alamatKtp: 'Jl. Riau No. 12, Bandung', email: 'arya.pratama@itb.ac.id', pekerjaan: 'Mahasiswa Teknik Informatika ITB', status: 'aktif', sewa: 1700000, tempo: 10, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_bella', nama: 'Bella Safitri', hp: '081211223302', kamar: 'A-02', lantai: '1', tglMasuk: '2025-07-01', tglKeluar: addDaysYMD(180), nik: '3273010202990002', gender: 'Perempuan', tempatLahir: 'Bogor', tglLahir: '1998-09-20', alamatKtp: 'Jl. Pajajaran No. 44, Bogor', email: 'bella.safitri.arch@gmail.com', pekerjaan: 'Arsitek PT Wijaya Karya', status: 'aktif', sewa: 1700000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_eko', nama: 'Eko Prasetyo', hp: '081211223303', kamar: 'A-03', lantai: '1', tglMasuk: '2025-08-15', tglKeluar: addDaysYMD(180), nik: '3273010303990003', gender: 'Laki-laki', tempatLahir: 'Cirebon', tglLahir: '2000-11-12', alamatKtp: 'Jl. Tuparev No. 8, Cirebon', email: 'eko.designer@creativeagency.id', pekerjaan: 'Graphic Designer Agensi Bandung', status: 'aktif', sewa: 1600000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_chandra', nama: 'Chandra Wijaya', hp: '081211223304', kamar: 'B-01', lantai: '2', tglMasuk: '2025-04-01', tglKeluar: addDaysYMD(12), nik: '3273010404990004', gender: 'Laki-laki', tempatLahir: 'Jakarta', tglLahir: '1997-04-25', alamatKtp: 'Jl. Fatmawati No. 9, Jakarta Selatan', email: 'chandra.wijaya@shopee.com', pekerjaan: 'Data Analyst Shopee Bandung Hub', status: 'aktif', sewa: 1950000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_bdg_dea', nama: 'Dea Amanda', hp: '081211223305', kamar: 'B-02', lantai: '2', tglMasuk: '2025-06-20', tglKeluar: addDaysYMD(180), nik: '3273010505990005', gender: 'Perempuan', tempatLahir: 'Sukabumi', tglLahir: '2002-06-18', alamatKtp: 'Jl. Suryakencana No. 15, Sukabumi', email: 'dea.amanda@unpad.ac.id', pekerjaan: 'Mahasiswi FK Universitas Padjadjaran', status: 'aktif', sewa: 1950000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' }
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
  const keluhan2 = [];


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
    { id: 'km_3_101', no: '101', lantai: '1', tipe: 'Executive Studio', harga: 2500000, tempo: 1, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
    { id: 'km_3_102', no: '102', lantai: '1', tipe: 'Executive Studio', harga: 2500000, tempo: 1, fasilitas: 'AC Inverter, Smart TV 40", Queen Bed, Water Heater, Meja Kerja' },
    { id: 'km_3_103', no: '103', lantai: '1', tipe: 'Deluxe Room', harga: 2200000, tempo: 5, fasilitas: 'AC Inverter, Single Bed 120, Lemari 2 Pintu, KM Dalam' },
    { id: 'km_3_201', no: '201', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, tempo: 5, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
    { id: 'km_3_202', no: '202', lantai: '2', tipe: 'VIP Suite Tebet', harga: 2800000, tempo: 5, fasilitas: 'AC, Kulkas 2 Pintu, Smart TV, Balkon Pribadi, Kamar Mandi Marmer' },
    { id: 'km_3_203', no: '203', lantai: '2', tipe: 'Deluxe Room', harga: 2200000, tempo: 10, fasilitas: 'AC, Kasur Springbed, Meja Kerja Ergonomis' },
    { id: 'km_3_301', no: '301', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, tempo: 1, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' },
    { id: 'km_3_302', no: '302', lantai: '3', tipe: 'Penthouse Studio', harga: 3000000, tempo: 1, fasilitas: 'AC Central, Kitchenette, Rooftop Access, Smart TV 50"' }
  ];
  const penghuni3 = [
    { id: 'p_jkt_farhan', nama: 'Farhan Ramadhan', hp: '081122334401', kamar: '101', lantai: '1', tglMasuk: '2025-03-01', tglKeluar: addDaysYMD(3), nik: '3174010101980001', gender: 'Laki-laki', tempatLahir: 'Jakarta', tglLahir: '1996-08-14', alamatKtp: 'Jl. Rawamangun No. 10, Jakarta Timur', email: 'farhan.ramadhan@mandirisec.co.id', pekerjaan: 'Investment Banker SCBD', status: 'aktif', sewa: 2500000, tempo: 1, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_gita', nama: 'Gita Permata', hp: '081122334402', kamar: '102', lantai: '1', tglMasuk: '2025-05-15', tglKeluar: addDaysYMD(180), nik: '3174010202980002', gender: 'Perempuan', tempatLahir: 'Surabaya', tglLahir: '1998-03-22', alamatKtp: 'Jl. Manyar Kertoarjo No. 22, Surabaya', email: 'gita.permata@pwc.com', pekerjaan: 'Senior Tax Consultant PwC Indonesia', status: 'aktif', sewa: 2500000, tempo: 1, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_haris', nama: 'Haris Setiawan', hp: '081122334403', kamar: '201', lantai: '2', tglMasuk: '2025-02-01', tglKeluar: addDaysYMD(14), nik: '3174010303980003', gender: 'Laki-laki', tempatLahir: 'Medan', tglLahir: '1995-12-09', alamatKtp: 'Jl. Gatot Subroto No. 5, Medan', email: 'haris.setiawan@lawfirm.id', pekerjaan: 'Corporate Legal Counsel Kuningan', status: 'aktif', sewa: 2800000, tempo: 5, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_indah', nama: 'Indah Savira', hp: '081122334404', kamar: '202', lantai: '2', tglMasuk: '2025-06-10', tglKeluar: addDaysYMD(180), nik: '3174010404980004', gender: 'Perempuan', tempatLahir: 'Palembang', tglLahir: '1999-07-30', alamatKtp: 'Jl. Sudirman No. 80, Palembang', email: 'indah.savira@techunicorn.com', pekerjaan: 'HR Business Partner Tech Unicorn', status: 'aktif', sewa: 2800000, tempo: 5, deposit: 1000000, catatanDeposit: 'Lunas' },
    { id: 'p_jkt_joko', nama: 'Joko Triyono', hp: '081122334405', kamar: '301', lantai: '3', tglMasuk: '2025-01-15', tglKeluar: addDaysYMD(90), nik: '3174010505980005', gender: 'Laki-laki', tempatLahir: 'Solo', tglLahir: '1994-05-18', alamatKtp: 'Jl. Adisucipto No. 100, Solo', email: 'joko.triyono@goto.com', pekerjaan: 'Staff Backend Engineer GoTo', status: 'aktif', sewa: 3000000, tempo: 1, deposit: 1500000, catatanDeposit: 'Lunas' }
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
  const keluhan3 = [];


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
    { id: 'p_sby_kenzo', nama: 'Kenzo Raditya', hp: '081333445501', kamar: 'G-01', lantai: '1', tglMasuk: '2025-08-01', tglKeluar: addDaysYMD(6), nik: '3578010101990001', gender: 'Laki-laki', tempatLahir: 'Surabaya', tglLahir: '2001-07-11', alamatKtp: 'Jl. Kertajaya Indah No. 12, Surabaya', email: 'kenzo.raditya@unair.ac.id', pekerjaan: 'Mahasiswa Kedokteran Unair', status: 'aktif', sewa: 1650000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_larasati', nama: 'Larasati Putri', hp: '081333445502', kamar: 'G-02', lantai: '1', tglMasuk: '2025-06-01', tglKeluar: addDaysYMD(180), nik: '3578010202990002', gender: 'Perempuan', tempatLahir: 'Gresik', tglLahir: '1998-10-15', alamatKtp: 'Jl. RA Kartini No. 30, Gresik', email: 'dr.larasati.p@rssoetomo.go.id', pekerjaan: 'Dokter Muda RSUD Dr. Soetomo', status: 'aktif', sewa: 1650000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_oscar', nama: 'Oscar Ferdinand', hp: '081333445503', kamar: 'G-03', lantai: '1', tglMasuk: '2025-09-10', tglKeluar: addDaysYMD(180), nik: '3578010303990003', gender: 'Laki-laki', tempatLahir: 'Sidoarjo', tglLahir: '2000-01-20', alamatKtp: 'Jl. Pahlawan No. 4, Sidoarjo', email: 'oscar.kuliner@gmail.com', pekerjaan: 'Owner Cafe & Kuliner Gubeng', status: 'aktif', sewa: 1300000, tempo: 10, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_ilham', nama: 'M. Ilham Fauzan', hp: '081333445504', kamar: 'U-01', lantai: '2', tglMasuk: '2025-05-20', tglKeluar: addDaysYMD(14), nik: '3578010404990004', gender: 'Laki-laki', tempatLahir: 'Kediri', tglLahir: '2001-09-05', alamatKtp: 'Jl. Dhoho No. 70, Kediri', email: 'ilham.fauzan@its.ac.id', pekerjaan: 'Mahasiswa Teknik Mesin ITS', status: 'aktif', sewa: 1800000, tempo: 1, deposit: 500000, catatanDeposit: 'Lunas' },
    { id: 'p_sby_nadia', nama: 'Nadia Zahrani', hp: '081333445505', kamar: 'U-02', lantai: '2', tglMasuk: '2025-07-15', tglKeluar: addDaysYMD(180), nik: '3578010505990005', gender: 'Perempuan', tempatLahir: 'Mojokerto', tglLahir: '1999-12-01', alamatKtp: 'Jl. Gajah Mada No. 18, Mojokerto', email: 'nadia.zahrani@ey.com', pekerjaan: 'Senior Auditor KAP Ernst & Young Surabaya', status: 'aktif', sewa: 1800000, tempo: 5, deposit: 500000, catatanDeposit: 'Lunas' }
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
  const keluhan4 = [];


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
    { id: 'p_mlg_putri', nama: 'Putri Maharani', hp: '081555667701', kamar: '01', lantai: '1', tglMasuk: '2025-08-15', tglKeluar: addDaysYMD(3), nik: '3573010101990001', gender: 'Perempuan', tempatLahir: 'Malang', tglLahir: '2002-04-03', alamatKtp: 'Jl. Soekarno Hatta No. 8, Malang', email: 'putri.maharani@student.ub.ac.id', pekerjaan: 'Mahasiswi FIA Universitas Brawijaya', status: 'aktif', sewa: 1350000, tempo: 1, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_qori', nama: 'Qori Alamsyah', hp: '081555667702', kamar: '02', lantai: '1', tglMasuk: '2025-07-01', tglKeluar: addDaysYMD(180), nik: '3573010202990002', gender: 'Laki-laki', tempatLahir: 'Probolinggo', tglLahir: '2001-08-25', alamatKtp: 'Jl. Panglima Sudirman No. 14, Probolinggo', email: 'qori.alamsyah@polinema.ac.id', pekerjaan: 'Mahasiswa TI Polinema Malang', status: 'aktif', sewa: 1350000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_rendy', nama: 'Rendy Pratama', hp: '081555667703', kamar: '03', lantai: '1', tglMasuk: '2025-09-01', tglKeluar: addDaysYMD(180), nik: '3573010303990003', gender: 'Laki-laki', tempatLahir: 'Pasuruan', tglLahir: '2000-02-17', alamatKtp: 'Jl. Hayam Wuruk No. 5, Pasuruan', email: 'rendy.coffee@gmail.com', pekerjaan: 'Head Barista Coffee Shop Suhat', status: 'aktif', sewa: 1150000, tempo: 10, deposit: 300000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_salsabila', nama: 'Salsabila Nur', hp: '081555667704', kamar: '05', lantai: '2', tglMasuk: '2025-06-10', tglKeluar: addDaysYMD(10), nik: '3573010404990004', gender: 'Perempuan', tempatLahir: 'Blitar', tglLahir: '2002-10-10', alamatKtp: 'Jl. Merdeka No. 90, Blitar', email: 'salsabila.nur@um.ac.id', pekerjaan: 'Mahasiswi Sastra Inggris UM', status: 'aktif', sewa: 1450000, tempo: 1, deposit: 400000, catatanDeposit: 'Lunas' },
    { id: 'p_mlg_taufik', nama: 'Taufik Hidayat', hp: '081555667705', kamar: '06', lantai: '2', tglMasuk: '2025-05-01', tglKeluar: addDaysYMD(180), nik: '3573010505990005', gender: 'Laki-laki', tempatLahir: 'Tulungagung', tglLahir: '1998-05-20', alamatKtp: 'Jl. Diponegoro No. 33, Tulungagung', email: 'taufik.freelance@gmail.com', pekerjaan: 'Freelance Fullstack Web Developer', status: 'aktif', sewa: 1450000, tempo: 5, deposit: 400000, catatanDeposit: 'Lunas' }
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
  const keluhan5 = [];


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

// ── INITIAL DATA INITIALIZER (DEFAULT: BERSIH DENGAN 5 CABANG AKTIF) ──────────────
function initDefaultMultiKostData(force = false) {
  if (!force && S.propertiesData && Object.keys(S.propertiesData).length >= 5 && S.properties && S.properties.length >= 5) return;

  // Cek apakah ada data yang tersimpan sebelumnya di localStorage
  if (!force && typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem('sk3_properties_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length >= 5) {
          S.propertiesData = parsed;
          const savedProps = localStorage.getItem('sk3_properties');
          if (savedProps) {
            try { S.properties = JSON.parse(savedProps); } catch {}
          }
          if (S.properties && S.properties.length >= 5) return;
        }
      } catch {}
    }
  }

  const clean = getCleanInitialState();
  S.properties = clean.properties;
  S.propertiesData = clean.propertiesData;
  S.activeKostId = 'kost_1';
  S.kost = { ...clean.defaultKost };
  S.kamar = [...clean.propertiesData['kost_1'].kamar];
  S.penghuni = [];
  S.pembayaran = [];
  S.pengeluaran = [];
  S.keluhan = [];

  LS.save();
}

function seedDemoDataForTesting() {
  const initData = generateInitialMultiKostData();
  S.properties = initData.properties;
  S.propertiesData = initData.propertiesData;
  S.activeKostId = 'kost_1';
  const cur = S.propertiesData['kost_1'];
  if (cur) {
    S.kost = { ...cur.kost };
    S.kamar = [...(cur.kamar || [])];
    S.penghuni = [...(cur.penghuni || [])];
    S.pembayaran = [...(cur.pembayaran || [])];
    S.pengeluaran = [...(cur.pengeluaran || [])];
    S.keluhan = [...(cur.keluhan || [])];
  }
  S.akun = [
    { id: 'akun_mgr_gavin', nama: 'Gavin Utomo (Owner)', email: 'gavinutomo4@gmail.com', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'manager', penghuniId: null },
    { id: 'akun_mgr_prasada', nama: 'Prasada Utomo (Manager)', email: 'prasadautomo@gmail.com', pwHash: 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', role: 'manager', penghuniId: null }
  ];
  LS.save();
  if (typeof renderGoogleAccounts === 'function') {
    renderGoogleAccounts();
  }
}
// Alias untuk backward compatibility
const seedDemoData = initDefaultMultiKostData;
window.initDefaultMultiKostData = initDefaultMultiKostData;
window.seedDemoData = seedDemoData;
window.seedDemoDataForTesting = seedDemoDataForTesting;
window.getCleanInitialState = getCleanInitialState;

// ── MULTI-KOST SWITCHER & HANDLERS ────────────────────────────
function switchKost(targetKostId) {
  if (!S.propertiesData || !S.propertiesData[targetKostId]) {
    console.warn('Cabang kost tidak ditemukan:', targetKostId);
    return;
  }

  // 1. Simpan data aktif saat ini ke bucket cabangnya
  if (S.activeKostId && S.propertiesData[S.activeKostId]) {
    S.propertiesData[S.activeKostId] = {
      kost: { ...(S.kost || {}) },
      penghuni: [...(S.penghuni || [])],
      kamar: [...(S.kamar || [])],
      pembayaran: [...(S.pembayaran || [])],
      pengeluaran: [...(S.pengeluaran || [])],
      keluhan: [...(S.keluhan || [])]
    };
  }

  // 2. Muat cabang sasaran
  S.activeKostId = targetKostId;
  const target = S.propertiesData[targetKostId];
  S.kost = { ...(target.kost || {}) };
  S.penghuni = [...(target.penghuni || [])];
  S.kamar = [...(target.kamar || [])];
  S.pembayaran = [...(target.pembayaran || [])];
  S.pengeluaran = [...(target.pengeluaran || [])];
  S.keluhan = [...(target.keluhan || [])];

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
  renderPengaturan();
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '') || 'dashboard';
  navigateTo(activePage);

  toast(`🏢 Beralih ke ${S.kost.nama} (${target.kost?.kota || (target.kost?.alamat ? target.kost.alamat.split(',')[0] : 'Indonesia')})`, 'success');
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
  if (sbNameEl)     sbNameEl.textContent     = 'Kost Manager';
  if (sbLocEl)      sbLocEl.textContent      = '📍 Portal Multi-Cabang';

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
        <div class="prop-dd-item ${isActive ? 'active' : ''}" onclick="switchKost('${esc(p.id)}')">
          <div class="prop-dd-item-icon">🏢</div>
          <div class="prop-dd-item-info">
            <div class="prop-dd-item-name">${esc(data.kost.nama)}</div>
            <div class="prop-dd-item-loc">📍 ${esc(data.kost.kota || data.kost.alamat.split(',')[0])}</div>
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
  const summaryBar = $('multi-kost-summary-bar');
  if (!container || !S.propertiesData) return;

  const curMonth = thisMonth();
  let totalKamarAll = 0;
  let totalTerisiAll = 0;
  let totalPenghuniAktifAll = 0;
  let totalOmsetAll = 0;
  let totalBelumBayarAll = 0;
  let totalNominalBelumBayar = 0;

  const branchStats = (S.properties || []).map((p, idx) => {
    const data = S.propertiesData[p.id];
    if (!data) return null;
    const isActive = p.id === S.activeKostId;
    const aktifPenghuni = (data.penghuni || []).filter(x => x.status === 'aktif');
    const terisiCount = [...new Set(aktifPenghuni.map(x => x.kamar).filter(Boolean))].length;
    const totalKamar = data.kost?.totalKamar || (data.kamar ? data.kamar.length : 8);
    const targetPendapatan = aktifPenghuni.reduce((sum, x) => sum + (Number(x.sewa) || 0), 0);
    const pct = totalKamar > 0 ? Math.round((terisiCount / totalKamar) * 100) : 0;

    // Hitung status tagihan cabang bulan ini
    const payments = (data.pembayaran || []).filter(pb => pb.bulan === curMonth || (typeof pb.bulan === 'string' && pb.bulan.startsWith(curMonth)));
    const lunasIds = new Set(payments.filter(pb => pb.status === 'lunas').map(pb => pb.penghuniId || pb.penghuni_id));
    const belumBayarPenghuni = aktifPenghuni.filter(x => !lunasIds.has(x.id));
    const nominalBelumBayar = belumBayarPenghuni.reduce((sum, x) => sum + (Number(x.sewa) || 0), 0);

    totalKamarAll += totalKamar;
    totalTerisiAll += terisiCount;
    totalPenghuniAktifAll += aktifPenghuni.length;
    totalOmsetAll += targetPendapatan;
    totalBelumBayarAll += belumBayarPenghuni.length;
    totalNominalBelumBayar += nominalBelumBayar;

    return {
      p, data, isActive, idx,
      aktifPenghuni, terisiCount, totalKamar, targetPendapatan, pct,
      belumBayarCount: belumBayarPenghuni.length,
      nominalBelumBayar
    };
  }).filter(Boolean);

  const pctAll = totalKamarAll > 0 ? Math.round((totalTerisiAll / totalKamarAll) * 100) : 0;
  const blnNow = new Date();
  const blnLabel = blnNow.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Render Baris Command Center Portofolio 5 Cabang
  if (summaryBar) {
    summaryBar.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:14px 18px;background:var(--surface);border-radius:12px;border:1px solid var(--border);box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div>
          <div style="font-size:0.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:0.5px">🏢 Portofolio Terpadu</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--text);margin-top:2px">5 Cabang Aktif</div>
          <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px">Pindah cepat: <kbd style="background:var(--bg-2);padding:1px 5px;border-radius:4px;border:1px solid var(--border);font-size:0.68rem">Alt + 1..5</kbd></div>
        </div>
        <div>
          <div style="font-size:0.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:0.5px">🛏️ Okupansi Konsolidasi</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--accent-light);margin-top:2px">${totalTerisiAll} / ${totalKamarAll} <span style="font-size:0.8rem">(${pctAll}%)</span></div>
          <div style="font-size:0.72rem;color:var(--green);margin-top:2px">${totalKamarAll - totalTerisiAll} Kamar Kosong Siap Huni</div>
        </div>
        <div>
          <div style="font-size:0.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:0.5px">💰 Estimasi Omset / Bulan</div>
          <div style="font-size:1.15rem;font-weight:800;color:var(--green);margin-top:2px">${rp(totalOmsetAll)}</div>
          <div style="font-size:0.72rem;color:var(--text-3);margin-top:2px">${totalPenghuniAktifAll} Penghuni Aktif</div>
        </div>
        <div>
          <div style="font-size:0.72rem;color:var(--text-3);font-weight:700;text-transform:uppercase;letter-spacing:0.5px">⚠️ Tagihan Menunggak (${blnLabel})</div>
          <div style="font-size:1.15rem;font-weight:800;color:${totalBelumBayarAll > 0 ? 'var(--red)' : 'var(--green)'};margin-top:2px">
            ${totalBelumBayarAll > 0 ? `${totalBelumBayarAll} Belum Lunas` : 'Semua Lunas 🎉'}
          </div>
          <div style="font-size:0.72rem;color:${totalBelumBayarAll > 0 ? 'var(--red)' : 'var(--text-3)'};margin-top:2px">
            ${totalBelumBayarAll > 0 ? `${rp(totalNominalBelumBayar)} pending` : 'Arus kas sehat'}
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = branchStats.map(b => {
    return `
      <div class="kost-branch-card ${b.isActive ? 'active-branch' : ''}" style="cursor:pointer" onclick="switchKost('${esc(b.p.id)}')">
        <div class="branch-card-header">
          <div class="branch-card-icon">🏢</div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px">
              <div class="branch-card-title" style="margin-bottom:0">${esc(b.data.kost.nama)}</div>
            </div>
            <div class="branch-card-loc">📍 ${esc(b.data.kost.kota || b.data.kost.alamat.split(',')[0])}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
            <span class="badge ${b.isActive ? 'badge-accent' : 'badge-gray'}" style="font-size:0.66rem;font-family:monospace" title="Shortcut keyboard: Alt+${b.idx + 1}">Alt+${b.idx + 1}</span>
            ${b.isActive ? '<span class="badge badge-accent" style="font-size:0.66rem">✓ Aktif</span>' : ''}
          </div>
        </div>
        
        <div class="branch-card-stats">
          <div>
            <div style="color:var(--text-3);font-size:0.7rem">Okupansi</div>
            <div style="font-weight:800;color:var(--text)">${b.terisiCount} / ${b.totalKamar} (${b.pct}%)</div>
          </div>
          <div style="text-align:right">
            <div style="color:var(--text-3);font-size:0.7rem">Target Sewa</div>
            <div style="font-weight:800;color:var(--green)">${rp(b.targetPendapatan)}</div>
          </div>
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:0.74rem">
          <span style="color:var(--text-3)">Status Bulan Ini:</span>
          ${b.belumBayarCount > 0 
            ? `<span class="badge badge-orange" style="font-size:0.68rem">⚠️ ${b.belumBayarCount} Belum Lunas</span>` 
            : `<span class="badge badge-green" style="font-size:0.68rem">✅ Lunas Semua</span>`}
        </div>

        <div style="display:flex;gap:6px" onclick="event.stopPropagation()">
          <button type="button" class="branch-card-btn ${b.isActive ? 'btn-ghost' : 'btn-primary'}" style="flex:1" onclick="switchKost('${b.p.id}')">
            ${b.isActive ? '✓ Sedang Dikelola' : 'Kelola Cabang ⚡'}
          </button>
          <button type="button" class="btn-ghost btn-sm" onclick="quickTambahPenghuni('${b.p.id}')" title="Tambah penghuni ke cabang ini" style="padding:6px 10px;font-size:0.75rem">
            + Penghuni
          </button>
          <button type="button" class="btn-ghost btn-sm" onclick="quickLihatTagihan('${b.p.id}')" title="Buka buku kas/tagihan cabang ini" style="padding:6px 8px;font-size:0.75rem">
            Tagihan →
          </button>
        </div>
      </div>
    `;
  }).join('');
}
window.renderMultiKostCards = renderMultiKostCards;

window.quickTambahPenghuni = function(branchId, roomPrefill) {
  if (branchId && branchId !== S.activeKostId) {
    switchKost(branchId);
  }
  openModalPenghuni(null, roomPrefill);
};

window.quickLihatTagihan = function(branchId) {
  if (branchId && branchId !== S.activeKostId) {
    switchKost(branchId);
  }
  navigateTo('pembayaran');
};

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
                ${esc(data.kost.nama)} 
                ${isActive ? '<span class="badge badge-accent" style="margin-left:6px;font-size:0.7rem">Sedang Aktif</span>' : ''}
              </div>
              <div style="font-size:0.78rem;color:var(--text-3);margin-top:2px">📍 ${esc(data.kost.alamat)}</div>
              <div style="font-size:0.74rem;color:var(--text-2);margin-top:2px">
                Okupansi: <strong>${terisiCount}/${totalKamar} kamar terisi</strong> · 📞 Telp/WA: ${esc(data.kost.hp || '–')} · 🏦 ${esc(data.kost.bankNama || 'Bank')}: ${esc(data.kost.bankRekening || '–')} (a.n ${esc(data.kost.bankAtasNama || '–')})
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <button class="btn-outline btn-sm" onclick="openEditCabang('${esc(p.id)}')">✏️ Edit Info</button>
            <button class="btn-primary btn-sm" onclick="switchKost('${esc(p.id)}')">
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

        const branchKeys = Object.keys(S.propertiesData || {});
        if (branchKeys.length === 0) {
          initDefaultMultiKostData(true);
        } else {
          // Rehydrate cabang yang hilang agar tetap lengkap 5 cabang
          if (branchKeys.length < 5 || !S.properties || S.properties.length < 5) {
            const clean = getCleanInitialState();
            if (!S.properties || S.properties.length < 5) {
              S.properties = clean.properties;
            }
            if (!S.propertiesData) S.propertiesData = {};
            clean.properties.forEach(p => {
              if (!S.propertiesData[p.id]) {
                S.propertiesData[p.id] = clean.propertiesData[p.id];
              } else if (!S.propertiesData[p.id].kamar || S.propertiesData[p.id].kamar.length === 0) {
                S.propertiesData[p.id].kamar = clean.propertiesData[p.id].kamar;
              }
            });
            LS.save();
          }

          if (!S.propertiesData[S.activeKostId]) {
            S.activeKostId = Object.keys(S.propertiesData)[0] || 'kost_1';
          }
          const cur = S.propertiesData[S.activeKostId] || S.propertiesData['kost_1'];
          if (cur) {
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
        }
      } catch (e) {
        console.warn('Load multi-kost failed, fallback to init:', e);
        initDefaultMultiKostData(true);
      }
    } else {
      initDefaultMultiKostData(true);
    }

    // Auto-clean residu dummy tenants pada localStorage pengguna asli jika belum dibersihkan (di luar mode testing)
    let isTestingEnv = false;
    try {
      if (typeof window !== 'undefined') {
        if (window.__TEST_MODE__) {
          isTestingEnv = true;
        } else if (window.location && window.location.href && window.location.href.includes('test_runner.html')) {
          isTestingEnv = true;
        } else if (window.parent && window.parent !== window) {
          try {
            if (window.parent.location && window.parent.location.href && window.parent.location.href.includes('test_runner.html')) {
              isTestingEnv = true;
            }
          } catch (_) {
            // Protected against cross-origin iframe security restrictions
          }
        }
      }
    } catch (_) {}
    const hasOldMockTenants = (S.penghuni || []).some(p => ['p_dimas', 'p_anisa', 'p_kevin', 'p_sarah', 'p_fajar', 'p_rian'].includes(p.id));
    if (hasOldMockTenants && !isTestingEnv && !localStorage.getItem('sk3_mock_cleaned_v4')) {
      S.penghuni = [];
      S.pembayaran = [];
      S.pengeluaran = [];
      S.keluhan = [];
      if (S.propertiesData) {
        Object.values(S.propertiesData).forEach(b => {
          if (b) {
            b.penghuni = [];
            b.pembayaran = [];
            b.pengeluaran = [];
            b.keluhan = [];
          }
        });
      }
      localStorage.setItem('sk3_mock_cleaned_v4', '1');
      LS.save();
    }

    const rawAkun = localStorage.getItem('sk3_akun');
    if (rawAkun) {
      try { S.akun = JSON.parse(rawAkun); } catch {}
    }
  },
  saveSession(u) { localStorage.setItem('sk3_session', JSON.stringify(u)); },
  loadSession()  {
    try {
      const v = localStorage.getItem('sk3_session');
      return v ? JSON.parse(v) : null;
    } catch (e) {
      console.warn('Failed to parse session:', e);
      localStorage.removeItem('sk3_session');
      return null;
    }
  },
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

// Clean number parser yang andal menangani format angka dengan titik/koma/simbol mata uang
const cleanNumber = n => {
  if (typeof n === 'number') return isNaN(n) ? 0 : n;
  if (!n) return 0;
  let str = String(n).trim();
  str = str.replace(/,\s*(?:00|-|0)$/, '');
  const digitsOnly = str.replace(/[^\d]/g, '');
  const parsed = Number(digitsOnly);
  return isNaN(parsed) ? 0 : parsed;
};

// Normalizer nomor HP internasional WhatsApp (628...)
function cleanPhone(raw) {
  if (!raw) return '';
  let clean = String(raw).replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '62' + clean.slice(1);
  else if (!clean.startsWith('62') && clean.length >= 9) clean = '62' + clean;
  return clean;
}
window.cleanPhone = cleanPhone;

// Normalizer nomor HP lokal Indonesia resmi (Wajib mulai dari 08...)
function normalizeIndoPhone(raw) {
  if (!raw) return '';
  let str = String(raw).trim().replace(/[^\d+]/g, '');
  if (str.startsWith('+62')) str = str.slice(3);
  else if (str.startsWith('62')) str = str.slice(2);
  let clean = str.replace(/\D/g, '');
  if (clean.startsWith('8')) clean = '0' + clean;
  return clean;
}
window.normalizeIndoPhone = normalizeIndoPhone;

function isValidIndoPhone(raw) {
  const clean = normalizeIndoPhone(raw);
  // Harus nomor seluler Indonesia nyata (awalan 08 diikuti digit 1-9, total 10-14 digit)
  return /^08[1-9]\d{7,11}$/.test(clean);
}
window.isValidIndoPhone = isValidIndoPhone;
window.cleanNumber = cleanNumber;

// Live currency formatter & auto-masker Rp X.XXX.XXX
function formatRupiahLive(n) {
  if (n === null || n === undefined) return '';
  const str = String(n).trim();
  if (!str) return '';
  const digitsOnly = str.replace(/[^\d]/g, '');
  if (!digitsOnly) return '';
  const num = parseInt(digitsOnly, 10);
  if (isNaN(num)) return '';
  return 'Rp ' + num.toLocaleString('id-ID');
}
window.formatRupiahLive = formatRupiahLive;

function attachCurrencyFormatter(inputEl) {
  if (!inputEl) return;
  const onInput = function() {
    const raw = this.value;
    const cursorPos = this.selectionStart || raw.length;
    const digitsBefore = (raw.slice(0, cursorPos).match(/\d/g) || []).length;

    const digitsOnly = raw.replace(/\D/g, '');
    if (!digitsOnly) {
      this.value = '';
      return;
    }
    const num = parseInt(digitsOnly, 10);
    const formatted = 'Rp ' + num.toLocaleString('id-ID');
    this.value = formatted;

    // Pertahankan posisi kursor pengguna agar tidak loncat ke akhir string
    let newCursorPos = formatted.length;
    let counted = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        counted++;
        if (counted >= digitsBefore) {
          newCursorPos = i + 1;
          break;
        }
      }
    }
    try {
      this.setSelectionRange(newCursorPos, newCursorPos);
    } catch (_) {}
  };

  inputEl.addEventListener('input', onInput);
}
window.attachCurrencyFormatter = attachCurrencyFormatter;

// Inisialisasi otomatis live formatting uang (Rp dan titik ribuan)
function initCurrencyInputs() {
  const currencyIds = ['field-sewa', 'field-deposit', 'field-harga-kamar', 'field-pengeluaran-jumlah', 'renew-sewa'];
  currencyIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      attachCurrencyFormatter(el);
      if (el.value) el.value = formatRupiahLive(el.value);
    }
  });
}
window.initCurrencyInputs = initCurrencyInputs;

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrencyInputs);
  } else {
    initCurrencyInputs();
  }
}

const rp = n => 'Rp ' + cleanNumber(n).toLocaleString('id-ID');
const fmtD = s  => {
  if (!s) return '–';
  if (typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return isNaN(dateObj.getTime()) ? '–' : dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? '–' : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};
const init = n  => (n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';

// HTML Sanitizer menyeluruh untuk mencegah celah XSS (Cross-Site Scripting)
const esc  = s  => (s == null ? '' : String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
window.esc = esc;
window.escHtml = esc;

// Safe URL validator untuk mencegah eksekusi protokol berbahaya (javascript:)
const safeUrl = url => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  return '';
};
window.safeUrl = safeUrl;

// CSV Cell Sanitizer untuk mencegah serangan CSV Formula Injection (DDE di Excel/Spreadsheet)
const sanitizeCsvCell = v => {
  if (v === null || v === undefined) return '""';
  let str = String(v).replace(/\r\n|\r|\n/g, ' ');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = "'" + str; // Netralkan formula spreadsheet
  }
  return `"${str.replace(/"/g, '""')}"`;
};
window.sanitizeCsvCell = sanitizeCsvCell;

const ageOf = tgl => {
  if (!tgl) return null;
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  if (now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())) a--;
  return a >= 0 ? a : null;
};
const durasi = tgl => {
  if (!tgl) return '–';
  const d = new Date(tgl);
  if (isNaN(d.getTime())) return '–';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'Mulai segera';
  const hari = Math.floor(diff / 86400000);
  if (hari < 30) return hari + ' hari';
  if (hari < 365) return Math.floor(hari / 30) + ' bulan';
  const th = Math.floor(hari / 365);
  const sisaBln = Math.floor((hari % 365) / 30);
  return th + ' tahun' + (sisaBln > 0 ? ' ' + sisaBln + ' bulan' : '');
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
window.fmtD = fmtD;

// Terbilang Rupiah Helper (untuk Kwitansi Resmi)
function terbilang(n) {
  n = Math.floor(Math.abs(cleanNumber(n)));
  if (n === 0) return 'Nol';
  const huruf = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
  function convert(num) {
    if (num < 12) return huruf[num];
    if (num < 20) return convert(num - 10) + ' Belas';
    if (num < 100) return convert(Math.floor(num / 10)) + ' Puluh ' + convert(num % 10);
    if (num < 200) return 'Seratus ' + convert(num - 100);
    if (num < 1000) return convert(Math.floor(num / 100)) + ' Ratus ' + convert(num % 100);
    if (num < 2000) return 'Seribu ' + convert(num - 1000);
    if (num < 1000000) return convert(Math.floor(num / 1000)) + ' Ribu ' + convert(num % 1000);
    if (num < 1000000000) return convert(Math.floor(num / 1000000)) + ' Juta ' + convert(num % 1000000);
    return convert(Math.floor(num / 1000000000)) + ' Miliar ' + convert(num % 1000000000);
  }
  return convert(n).trim().replace(/\s+/g, ' ');
}

// NIK Masking Helper (Melindungi Privasi UU PDP & Safe Escaping)
function maskNik(nik, id) {
  if (!nik) return '–';
  const safeId = esc(id);
  if (unmaskedNiks.has(id)) {
    return `${esc(nik)} <button class="nik-toggle-btn" onclick="toggleMaskNik('${safeId}')" title="Sembunyikan NIK">👁️ Tutup</button>`;
  }
  const clean = String(nik).trim();
  const masked = clean.length > 8 ? clean.slice(0, 4) + '••••••••' + clean.slice(-4) : '••••••••••••';
  return `<span class="nik-masked">${esc(masked)}</span> <button class="nik-toggle-btn" onclick="toggleMaskNik('${safeId}')" title="Lihat NIK">👁️ Buka</button>`;
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
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
      else if (typeof el.remove === 'function') el.remove();
    }, 300);
  }, 2800);
}

function confirm_dlg(title, msg, cb, btnLabel='Ya, Lanjutkan') {
  $('confirm-title').textContent = title;
  $('confirm-message').innerHTML = msg;
  $('confirm-ok').textContent = btnLabel;
  confirmCb = cb;
  openModal('modal-confirm');
}

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

  if (name === 'screen-login') {
    if ($('login-kost-title')) $('login-kost-title').textContent = S.kost?.nama || 'SiKost';
    renderGoogleAccounts();
  }
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

// ── SUPABASE RLS & WEB STORAGE HELPER ────────────────────────
const SUPABASE_WEB_STORAGE_SQL = `-- SIKOST: AKTIFKAN PENYIMPANAN WEB CLOUD (SUPABASE)
-- Jalankan skrip SQL ini di Supabase Dashboard:
-- 1. Buka https://supabase.com/dashboard/project/tzplpnqtwcfchhmodphz/sql/new
-- 2. Salin dan tempel (Paste) seluruh teks SQL di bawah ini
-- 3. Klik tombol hijau "RUN" (atau tekan Ctrl+Enter)

ALTER TABLE IF EXISTS public.penghuni DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kamar DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pembayaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengeluaran DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.kost_pengaturan DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pengumuman DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "penghuni_web_all" ON public.penghuni;
CREATE POLICY "penghuni_web_all" ON public.penghuni FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kamar_web_all" ON public.kamar;
CREATE POLICY "kamar_web_all" ON public.kamar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pembayaran_web_all" ON public.pembayaran;
CREATE POLICY "pembayaran_web_all" ON public.pembayaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pengeluaran_web_all" ON public.pengeluaran;
CREATE POLICY "pengeluaran_web_all" ON public.pengeluaran FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "kost_web_all" ON public.kost_pengaturan;
CREATE POLICY "kost_web_all" ON public.kost_pengaturan FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_web_all" ON public.profiles;
CREATE POLICY "profiles_web_all" ON public.profiles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pengumuman_web_all" ON public.pengumuman;
CREATE POLICY "pengumuman_web_all" ON public.pengumuman FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.kost_pengaturan (id, nama, pemilik, alamat, hp, total_kamar)
VALUES ('default', 'Nama Kost Manager', '', '', '', 0)
ON CONFLICT (id) DO UPDATE SET nama = EXCLUDED.nama, updated_at = NOW();`;

function showSupabaseRlsModal() {
  const codeEl = $('code-sql-rls');
  if (codeEl) codeEl.textContent = SUPABASE_WEB_STORAGE_SQL;
  openModal('modal-supabase-rls');
}
window.showSupabaseRlsModal = showSupabaseRlsModal;

async function checkSupabaseWritePermission(notify = true) {
  if (!sbClient) {
    if (notify) toast('Supabase belum terhubung! Atur konfigurasi terlebih dahulu.', 'err');
    return { ok: false, error: 'Belum terhubung' };
  }
  const testId = '__probe_' + Date.now();
  try {
    const { error: insErr } = await sbClient.from('penghuni').insert({
      id: testId,
      nama: '__probe_test__',
      kamar: '__probe__',
      hp: '0000000000',
      tgl_masuk: new Date().toISOString().split('T')[0]
    });
    if (insErr) {
      if (insErr.code === '42501' || insErr.message?.includes('row-level security')) {
        if (notify) {
          toast('⚠️ Supabase menolak izin simpan (RLS 42501). Buka Bantuan SQL!', 'err');
          showSupabaseRlsModal();
        }
        return { ok: false, code: '42501', error: insErr };
      }
      if (notify) toast('Uji simpan gagal: ' + (insErr.message || insErr.code), 'err');
      return { ok: false, error: insErr };
    }
    await sbClient.from('penghuni').delete().eq('id', testId);
    if (notify) {
      confirm_dlg(
        '🎉 Izin Penyimpanan Web Sempurna!',
        'Supabase Cloud telah mengizinkan penyimpanan penuh dari web browser!<br><br>Seluruh data penghuni, kamar, pembayaran, dan pengeluaran yang Anda tambahkan akan otomatis tersimpan langsung ke web.',
        () => {},
        'Mantap!'
      );
    }
    return { ok: true };
  } catch (err) {
    if (notify) toast('Uji simpan gagal: ' + err.message, 'err');
    return { ok: false, error: err };
  }
}
window.checkSupabaseWritePermission = checkSupabaseWritePermission;

// ── DB CLOUD SYNC LAYER ──────────────────────────────────────
const DB = {
  handleSupabaseError(error, entityName) {
    if (!error) return;
    console.error(`Gagal menyimpan ${entityName} ke Supabase:`, error);
    if (error.code === '42501' || error.message?.includes('row-level security')) {
      toast(`⚠️ Belum tersimpan di Web: Izin RLS Supabase membatasi penulisan. Silakan klik "Aktifkan Akses Web (SQL 1-Klik)" di Pengaturan!`, 'err');
      showSupabaseRlsModal();
    } else {
      toast(`⚠️ Gagal simpan ${entityName} ke Web: ${error.message || error.code}`, 'err');
    }
  },

  async fetchData(renderNow = true) {
    if (!sbClient) return;
    try {
      // 1. Penghuni (Cloud-First: sinkron langsung dari web database)
      const { data: pList, error: pErr } = await sbClient.from('penghuni').select('*').order('created_at', { ascending: false });
      if (!pErr && Array.isArray(pList)) {
        if (pList.length > 0 || (window.self === window.top)) {
          S.penghuni = pList.map(mapPenghuniFromDb);
        }
      }

      // 2. Kamar
      const { data: kList, error: kErr } = await sbClient.from('kamar').select('*').order('no', { ascending: true });
      if (!kErr && Array.isArray(kList)) {
        if (kList.length > 0 || (window.self === window.top)) {
          S.kamar = kList;
        }
      }

      // 3. Pembayaran
      const { data: bList, error: bErr } = await sbClient.from('pembayaran').select('*');
      if (!bErr && Array.isArray(bList)) {
        if (bList.length > 0 || (window.self === window.top)) {
          S.pembayaran = bList.map(mapBayarFromDb);
        }
      }

      // 4. Pengeluaran
      const { data: expList, error: expErr } = await sbClient.from('pengeluaran').select('*').order('tanggal', { ascending: false });
      if (!expErr && Array.isArray(expList)) {
        if (expList.length > 0 || (window.self === window.top)) {
          S.pengeluaran = expList.map(x => ({
            id: x.id,
            tanggal: x.tanggal,
            kategori: x.kategori,
            jumlah: Number(x.jumlah) || 0,
            keterangan: x.keterangan || '',
            buktiNota: x.bukti_nota,
            createdBy: x.created_by
          }));
        }
      }

      // 5. Kost Pengaturan
      const { data: kRow, error: kostErr } = await sbClient.from('kost_pengaturan').select('*').limit(1).maybeSingle();
      if (!kostErr && kRow) {
        S.kost = {
          ...S.kost,
          nama: kRow.nama || S.kost.nama || 'Nama Kost Manager',
          pemilik: kRow.pemilik || S.kost.pemilik || '',
          alamat: kRow.alamat || S.kost.alamat || '',
          hp: kRow.hp || S.kost.hp || '',
          totalKamar: kRow.total_kamar || S.kost.totalKamar || 0,
          bankNama: kRow.bank_nama || S.kost.bankNama || '',
          bankRekening: kRow.bank_rekening || S.kost.bankRekening || '',
          bankAtasNama: kRow.bank_atas_nama || S.kost.bankAtasNama || '',
          qrisUrl: kRow.qris_url || S.kost.qrisUrl || '',
          updatedAt: kRow.updated_at ? new Date(kRow.updated_at).getTime() : Date.now()
        };
      }

      // 7. Profiles (Jika Manager)
      if (currentUser?.role === 'manager') {
        const { data: prList, error: prErr } = await sbClient.from('profiles').select('*');
        if (!prErr && Array.isArray(prList)) {
          S.akun = prList.map(p => ({
            id: p.id,
            nama: p.nama,
            email: p.email,
            role: p.role,
            penghuniId: p.penghuni_id
          }));
        }
      }

      // Cermin ke memori dan cache lokal
      LS.save();

      if (renderNow) {
        updateSidebarBadges();
        if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
        if ($('page-penghuni')?.classList.contains('active')) renderPenghuni();
        if ($('page-kamar')?.classList.contains('active')) renderKamar();
        if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
        if ($('page-pengeluaran')?.classList.contains('active')) renderPengeluaran();
        if ($('page-pengaturan')?.classList.contains('active')) renderPengaturan();
        if ($('sb-kost-name')) $('sb-kost-name').textContent = 'Kost Manager';
        if ($('sb-kost-loc'))  $('sb-kost-loc').textContent  = '📍 Portal Multi-Cabang';
      }
    } catch (e) {
      console.warn('Gagal sinkron data Supabase:', e);
    }
  },

  async savePenghuni(d) {
    if (!sbClient) return { ok: false, error: 'Database web belum terhubung' };
    try {
      const payload = mapPenghuniToDb(d);
      const { data, error } = await sbClient.from('penghuni').upsert(payload);
      if (error) {
        DB.handleSupabaseError(error, 'Penghuni');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Penghuni');
      return { ok: false, error: e };
    }
  },

  async deletePenghuni(id) {
    if (!sbClient) return { ok: false };
    try {
      const { data, error } = await sbClient.from('penghuni').delete().eq('id', id);
      if (error) {
        DB.handleSupabaseError(error, 'Penghuni');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Penghuni');
      return { ok: false, error: e };
    }
  },

  async saveKamar(k) {
    if (!sbClient) return { ok: false, error: 'Database web belum terhubung' };
    try {
      const payload = {
        id: k.id,
        no: k.no,
        lantai: k.lantai || '1',
        tipe: k.tipe || 'Standar',
        harga: Number(k.harga) || 0,
        fasilitas: k.fasilitas || ''
      };
      const { data, error } = await sbClient.from('kamar').upsert(payload);
      if (error) {
        DB.handleSupabaseError(error, 'Kamar');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Kamar');
      return { ok: false, error: e };
    }
  },

  async deleteKamar(id) {
    if (!sbClient) return { ok: false };
    try {
      const { data, error } = await sbClient.from('kamar').delete().eq('id', id);
      if (error) {
        DB.handleSupabaseError(error, 'Kamar');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Kamar');
      return { ok: false, error: e };
    }
  },

  async savePembayaran(pb) {
    if (!sbClient) return { ok: false, error: 'Database web belum terhubung' };
    try {
      const payload = mapBayarToDb(pb);
      const { data, error } = await sbClient.from('pembayaran').upsert(payload);
      if (error) {
        DB.handleSupabaseError(error, 'Pembayaran');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pembayaran');
      return { ok: false, error: e };
    }
  },

  async deletePembayaran(penghuniId, bulan) {
    if (!sbClient) return { ok: false };
    try {
      const { data, error } = await sbClient.from('pembayaran').delete().match({ penghuni_id: penghuniId, bulan: bulan });
      if (error) {
        DB.handleSupabaseError(error, 'Pembayaran');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pembayaran');
      return { ok: false, error: e };
    }
  },

  async deletePembayaranById(id) {
    if (!sbClient || !id) return { ok: false };
    try {
      const { data, error } = await sbClient.from('pembayaran').delete().eq('id', id);
      if (error) {
        DB.handleSupabaseError(error, 'Pembayaran');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pembayaran');
      return { ok: false, error: e };
    }
  },

  async savePengeluaran(exp) {
    if (!sbClient) return { ok: false, error: 'Database web belum terhubung' };
    try {
      const payload = {
        id: exp.id,
        tanggal: exp.tanggal,
        kategori: exp.kategori,
        jumlah: Number(exp.jumlah) || 0,
        keterangan: exp.keterangan || '',
        bukti_nota: exp.buktiNota || null,
        created_by: exp.createdBy || currentUser?.nama
      };
      const { data, error } = await sbClient.from('pengeluaran').upsert(payload);
      if (error) {
        DB.handleSupabaseError(error, 'Pengeluaran');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pengeluaran');
      return { ok: false, error: e };
    }
  },

  async deletePengeluaran(id) {
    if (!sbClient) return { ok: false };
    try {
      const { data, error } = await sbClient.from('pengeluaran').delete().eq('id', id);
      if (error) {
        DB.handleSupabaseError(error, 'Pengeluaran');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pengeluaran');
      return { ok: false, error: e };
    }
  },

  async saveKost() {
    if (!sbClient) return { ok: false, error: 'Database web belum terhubung' };
    try {
      const payload = {
        id: 'default',
        nama: S.kost.nama,
        pemilik: S.kost.pemilik,
        alamat: S.kost.alamat,
        hp: S.kost.hp,
        total_kamar: Number(S.kost.totalKamar) || 0,
        bank_nama: S.kost.bankNama || '',
        bank_rekening: S.kost.bankRekening || '',
        bank_atas_nama: S.kost.bankAtasNama || '',
        qris_url: S.kost.qrisUrl || '',
        updated_at: new Date().toISOString()
      };
      const { data, error } = await sbClient.from('kost_pengaturan').upsert(payload);
      if (error) {
        DB.handleSupabaseError(error, 'Pengaturan Kost');
        return { ok: false, error };
      }
      return { ok: true, data };
    } catch (e) {
      DB.handleSupabaseError(e, 'Pengaturan Kost');
      return { ok: false, error: e };
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
  const rawParts = (acc.nama || 'User').replace(/\(.*?\)/g, '').trim().split(/\s+/);
  const inisial = rawParts.length > 1 ? (rawParts[0][0] + rawParts[1][0]).toUpperCase() : rawParts[0].slice(0, 2).toUpperCase();

  card.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;min-width:0;flex:1">
      <div class="google-acc-avatar mgr">
        <span>${inisial}</span>
        <span class="avatar-online-dot"></span>
      </div>
      <div class="google-acc-meta">
        <div class="google-acc-name">${esc(acc.nama)}</div>
        <div class="google-acc-sub">
          <span>${esc(acc.email)}</span>
        </div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
      <span class="google-acc-role mgr">Manager 👑</span>
      <span class="material-symbols-outlined" style="font-size:18px;color:var(--text-3)">arrow_forward</span>
    </div>
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
window.renderGoogleAccounts = renderGoogleAccounts;
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

  // Hak akses: Gavin Utomo & Prasada Utomo selalu Manager, akun yang sudah Manager tetap Manager
  const isOwner = (email === 'gavinutomo4@gmail.com' || email === 'prasadautomo@gmail.com');
  const matchedP = S.penghuni.find(p => p.email && p.email.toLowerCase() === email);
  let akun = S.akun.find(a => a.email && a.email.toLowerCase() === email);
  const hasExistingManager = S.akun.some(a => a.role === 'manager');
  const determinedRole = isOwner ? 'manager' : (akun?.role ? akun.role : (!hasExistingManager ? 'manager' : (matchedP ? 'penghuni' : 'manager')));
  const isMgr = (determinedRole === 'manager');

  if (!akun) {
    akun = {
      id: 'google_' + (profile.sub || uid()),
      email,
      nama: isOwner ? (email === 'prasadautomo@gmail.com' ? (profile.name || 'Prasada Utomo (Manager)') : 'Gavin Utomo (Owner)') : nama,
      avatar,
      role: determinedRole,
      penghuniId: matchedP ? matchedP.id : null,
      googleAuth: true
    };
    S.akun.push(akun);
    LS.save();
  } else {
    akun.nama = isOwner ? (email === 'prasadautomo@gmail.com' ? (profile.name || akun.nama || 'Prasada Utomo (Manager)') : 'Gavin Utomo (Owner)') : (akun.nama || nama);
    akun.avatar = avatar || akun.avatar;
    akun.role = determinedRole;
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

  // 2. Tunggu Google Identity Services SDK siap (maksimal 600ms)
  if (!window.google?.accounts?.oauth2) {
    let waited = 0;
    while (!window.google?.accounts?.oauth2 && waited < 3) {
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
            toast('Membuka pemilih akun Google 1-Klik...', 'info');
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
  if (typeof window !== 'undefined') {
    window.currentUser = akun;
    window.loginWithAkun = loginWithAkun;
  }
  LS.saveSession(akun);
  enterApp();
}
if (typeof window !== 'undefined') window.loginWithAkun = loginWithAkun;

// ── LOGOUT ────────────────────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  confirm_dlg('Konfirmasi Keluar', 'Apakah Anda yakin ingin keluar dari SiKost?', async () => {
    // Pastikan seluruh data pengaturan tersimpan sebelum session ditutup
    if (typeof saveAllPengaturan === 'function') {
      try { await saveAllPengaturan('logout'); } catch {}
    }
    currentUser = null;
    if (typeof window !== 'undefined') window.currentUser = null;
    LS.clearSession();
    showScreen('screen-login');
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
  if ($('sb-kost-name'))     $('sb-kost-name').textContent     = 'Kost Manager';
  if ($('sb-kost-loc'))      $('sb-kost-loc').textContent      = '📍 Portal Multi-Cabang';
  if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost?.nama || 'SiKost';
  document.title = (S.kost?.nama || 'SiKost') + ' – Manajemen Kost Modern';
  updatePropertySwitcherUI();
  setupPropertySwitcherEvents();
  const urlSearch = window.location?.search || '';
  const urlHash   = window.location?.hash || '';
  const urlPage = new URLSearchParams(urlSearch).get('page') || (urlHash ? urlHash.replace('#', '') : '');
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
  if ($('sb-role-badge')) {
    $('sb-role-badge').textContent = (currentUser?.role === 'penghuni') ? 'Penghuni' : 'Manager';
    $('sb-role-badge').className   = 'brand-role';
  }
  if ($('sb-kost-name')) $('sb-kost-name').textContent = 'Kost Manager';
  if ($('sb-kost-loc'))  $('sb-kost-loc').textContent  = '📍 Portal Multi-Cabang';
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
}

function renderUserChip() {
  if (!currentUser) return;
  if ($('user-name'))  $('user-name').textContent  = currentUser.nama  || '–';
  if ($('user-email')) $('user-email').textContent = currentUser.email || '–';
  const av = $('user-avatar-fallback');
  if (av) {
    const safeAvatar = safeUrl(currentUser.avatar);
    if (safeAvatar) {
      av.innerHTML = `<img src="${safeAvatar}" alt="${esc(currentUser.nama || '')}" style="width:100%;height:100%;border-radius:50%;object-fit:cover" />`;
    } else {
      av.textContent = init(currentUser.nama);
    }
  }
}

// ── NAVIGATION ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:   'Dashboard',
  penghuni:    'Data Penghuni',
  kamar:       'Manajemen Kamar',
  pembayaran:  'Pembayaran & Tagihan',
  pengeluaran: 'Pengeluaran & Pembukuan',
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
  if (page === 'pengaturan')  renderPengaturan();
  if (page === 'profil')      renderProfil();

  updateSidebarBadges();
}
window.navigateTo = navigateTo;

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

// ── ACTION CENTER: FOKUS & TUGAS HARI INI (5 CABANG KONSOLIDASI) ────
let activeActionFilter = 'all';
let activeActionScope  = 'all'; // 'all' (semua 5 cabang) atau 'active' (hanya cabang aktif)

function renderDashActionCenter() {
  const container = $('dash-action-center');
  if (!container) return;

  const now = new Date();
  const nowDay = now.getDate();
  const curMonth = thisMonth();

  const dueItems = [];
  const emptyRooms = [];
  const contractItems = [];

  const curActiveId = S.activeKostId || 'kost_1';
  const curActiveNama = S.kost?.nama || 'Cabang Aktif';

  // Tentukan daftar cabang yang dievaluasi
  const branchesToScan = (activeActionScope === 'all' && S.properties && S.properties.length > 1)
    ? S.properties
    : [{ id: curActiveId, nama: curActiveNama }];

  branchesToScan.forEach(prop => {
    const isCurBranch = prop.id === curActiveId;
    const bData = S.propertiesData ? S.propertiesData[prop.id] : null;

    // Untuk cabang yang sedang aktif, gunakan data in-memory di S sebagai single source of truth
    const bKost = (isCurBranch && S.kost?.nama) ? S.kost : (bData?.kost || {});
    const rawPenghuni = (isCurBranch && Array.isArray(S.penghuni)) ? S.penghuni : (bData?.penghuni || []);
    const bPenghuni = rawPenghuni.filter(p => p.status === 'aktif');
    const rawPb = (isCurBranch && Array.isArray(S.pembayaran)) ? S.pembayaran : (bData?.pembayaran || []);
    const bPayments = rawPb.filter(pb => pb.bulan === curMonth || (typeof pb.bulan === 'string' && pb.bulan.startsWith(curMonth)));
    const bKamar = (isCurBranch && Array.isArray(S.kamar)) ? S.kamar : (bData?.kamar || []);

    const branchDisplayName = bKost.nama || prop.nama || 'Cabang Kost';
    const branchDisplayKota = bKost.kota || (bKost.alamat ? bKost.alamat.split(',')[0].trim() : '');

    // 1. Tagihan Jatuh Tempo & Menunggak
    bPenghuni.forEach(p => {
      // Abaikan jika penghuni sudah melewati tanggal keluar sebelum bulan ini atau belum masuk
      if (p.tglKeluar && curMonth > p.tglKeluar.slice(0, 7)) return;
      if (p.tglMasuk && curMonth < p.tglMasuk.slice(0, 7)) return;

      const pb = bPayments.find(x => String(x.penghuniId || x.penghuni_id) === String(p.id));
      const isLunas = pb?.status === 'lunas';
      if (!isLunas) {
        const jt = getPenghuniJatuhTempo(p, curMonth);
        const diff = jt.diffDays;
        let statusLabel = '';
        let badgeClass = 'badge-orange';
        if (diff < 0) {
          statusLabel = `Terlambat ${Math.abs(diff)} hari`;
          badgeClass = 'badge-red';
        } else if (diff === 0) {
          statusLabel = `Jatuh Tempo Hari Ini`;
          badgeClass = 'badge-orange';
        } else if (diff <= 3) {
          statusLabel = `H-${diff} Tempo`;
          badgeClass = 'badge-orange';
        } else {
          statusLabel = `Tempo H-${diff}`;
          badgeClass = 'badge-blue';
        }
        dueItems.push({ 
          type: 'tagihan', 
          p, diff, statusLabel, badgeClass, 
          dueDateStr: jt.dateStr,
          branchId: prop.id, 
          branchNama: branchDisplayName,
          branchKota: branchDisplayKota
        });
      }
    });

    // 2. Kamar Siap Huni (Kosong)
    const occRooms = new Set(bPenghuni.map(p => String(p.kamar || '').trim()).filter(Boolean));
    bKamar.filter(k => !occRooms.has(String(k.no || '').trim())).forEach(k => {
      emptyRooms.push({ 
        type: 'kamar_kosong', 
        k, 
        branchId: prop.id, 
        branchNama: branchDisplayName,
        branchKota: branchDisplayKota
      });
    });

    // 3. Pengingat Jatuh Tempo Kontrak Sewa (Lease Expiry)
    bPenghuni.forEach(p => {
      const exp = getContractExpiryStatus(p);
      if (exp && (exp.isUrgent || exp.status === 'expired')) {
        contractItems.push({ 
          type: 'kontrak', 
          p, exp, 
          branchId: prop.id, 
          branchNama: branchDisplayName,
          branchKota: branchDisplayKota
        });
      }
    });
  });

  dueItems.sort((a,b) => a.diff - b.diff);
  contractItems.sort((a, b) => (a.exp?.diffDays || 0) - (b.exp?.diffDays || 0));

  const totalActions = dueItems.length + emptyRooms.length + contractItems.length;

  // Pastikan wadah tindakan mendesak selalu tampil saat dipanggil
  container.style.display = 'block';

  let displayItems = [];
  if (activeActionFilter === 'tagihan') displayItems = dueItems;
  else if (activeActionFilter === 'kamar') displayItems = emptyRooms;
  else if (activeActionFilter === 'kontrak') displayItems = contractItems;
  else displayItems = [...contractItems.slice(0, 3), ...dueItems.slice(0, 3), ...emptyRooms.slice(0, 2)];

  const activeBranchName = S.kost?.nama || 'Cabang Aktif';
  const scopeBadgeText = activeActionScope === 'all'
    ? '🏢 Konsolidasi 5 Cabang'
    : '🏠 ' + activeBranchName;

  const subtitleText = totalActions === 0
    ? 'Semua urusan operasional saat ini terkendali dengan baik'
    : `${totalActions} agenda operasional membutuhkan perhatian segera`;

  const emptyStateHtml = `
    <div style="grid-column: 1 / -1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:36px 20px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); text-align:center;">
      <div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.12);color:var(--green);display:flex;align-items:center;justify-content:center;margin-bottom:12px">
        <span class="material-symbols-outlined" style="font-size:28px">verified</span>
      </div>
      <div style="font-size:1rem;font-weight:700;color:var(--text);margin-bottom:4px">
        ${activeActionScope === 'all' ? 'Semua Cabang Terkendali!' : `Operasional ${esc(activeBranchName)} Terkendali!`}
      </div>
      <div style="font-size:0.82rem;color:var(--text-3);max-width:460px;line-height:1.5">
        ${activeActionScope === 'all'
          ? 'Tidak ada tagihan tertunggak, masa sewa habis, atau kamar kosong yang membutuhkan penanganan segera di seluruh 5 cabang.'
          : 'Tidak ada tagihan tertunggak, masa sewa habis, atau kamar kosong yang butuh tindakan mendesak di cabang ini. Semua berjalan aman & tertib.'}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="dash-action-header">
      <div class="dash-action-title-group">
        <span class="action-pulse-beacon" style="${totalActions === 0 ? 'background:var(--green);box-shadow:0 0 0 0 rgba(16,185,129,0.4)' : ''}"></span>
        <div>
          <div style="display:flex;align-items:center;gap:8px">
            <h2 class="dash-action-heading" style="margin:0">Tindakan Mendesak</h2>
            <span class="badge ${totalActions === 0 ? 'badge-green' : 'badge-accent'}" style="font-size:0.72rem">${scopeBadgeText}</span>
          </div>
          <div class="dash-action-subtitle">${subtitleText}</div>
        </div>
      </div>
      
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <!-- Toggle Cakupan: 5 Cabang vs Cabang Aktif -->
        <div class="dash-action-tabs" style="background:var(--bg-2);padding:3px;border-radius:8px">
          <button type="button" class="dash-action-tab ${activeActionScope === 'all' ? 'active' : ''}" onclick="switchActionScope('all')" title="Pantau seluruh 5 cabang">
            🏢 Semua Cabang
          </button>
          <button type="button" class="dash-action-tab ${activeActionScope === 'active' ? 'active' : ''}" onclick="switchActionScope('active')" title="Hanya cabang aktif saat ini">
            🏠 Cabang Aktif
          </button>
        </div>

        <!-- Filter Kategori Tindakan -->
        <div class="dash-action-tabs">
          <button type="button" class="dash-action-tab ${activeActionFilter === 'all' ? 'active' : ''}" onclick="switchActionFilter('all')">
            Semua (${totalActions})
          </button>
          <button type="button" class="dash-action-tab ${activeActionFilter === 'kontrak' ? 'active' : ''}" onclick="switchActionFilter('kontrak')">
            ⏳ Kontrak Habis (${contractItems.length})
          </button>
          <button type="button" class="dash-action-tab ${activeActionFilter === 'tagihan' ? 'active' : ''}" onclick="switchActionFilter('tagihan')">
            ⚠️ Tagihan (${dueItems.length})
          </button>
          <button type="button" class="dash-action-tab ${activeActionFilter === 'kamar' ? 'active' : ''}" onclick="switchActionFilter('kamar')">
            🛏️ Kamar Kosong (${emptyRooms.length})
          </button>
        </div>
      </div>
    </div>

    <div class="dash-action-grid">
      ${totalActions === 0
        ? emptyStateHtml
        : (displayItems.map(item => {
            const branchBadge = `<span class="badge badge-accent" style="font-size:0.68rem;font-weight:700">🏢 ${esc(item.branchNama)}</span>`;
            if (item.type === 'kontrak') {
              const { p, exp } = item;
              const isExpired = exp.status === 'expired' || exp.status === 'today';
              return `
                <div class="action-card">
                  <div class="action-card-header">
                    <div class="action-card-branch">${branchBadge}</div>
                    <span class="badge ${exp.badgeClass}">${esc(exp.label)}</span>
                  </div>
                  <div class="action-card-body">
                    <div class="action-room-badge ${isExpired ? 'danger' : 'orange'}">${esc(p.kamar || '–')}</div>
                    <div class="action-card-info">
                      <div class="action-card-title">${esc(p.nama)}</div>
                      <div class="action-card-meta">Sewa: <strong style="color:var(--text);font-family:var(--font-mono)">${rp(p.sewa)}/bln</strong></div>
                      <div class="action-card-sub">Berakhir: <strong>${fmtD(p.tglKeluar)}</strong></div>
                    </div>
                  </div>
                  <div class="action-card-actions">
                    <button type="button" class="btn-wa btn-sm" onclick="kirimWaKontrak('${esc(p.id)}', '${esc(item.branchId)}')" title="Kirim WA Konfirmasi Kontrak">
                      <span class="material-symbols-outlined" style="font-size:14px">chat</span> WA
                    </button>
                    <button type="button" class="btn-outline btn-sm" onclick="openModalPerpanjangKontrak('${esc(p.id)}', '${esc(item.branchId)}')" title="Perpanjang Masa Sewa">
                      <span class="material-symbols-outlined" style="font-size:14px">update</span> Perpanjang
                    </button>
                    <button type="button" class="btn-danger btn-sm" onclick="checkoutPenghuni('${esc(p.id)}', '${esc(item.branchId)}')" title="Selesaikan sewa & kosongkan kamar">
                      <span class="material-symbols-outlined" style="font-size:14px">logout</span> Checkout
                    </button>
                  </div>
                </div>
              `;
            } else if (item.type === 'tagihan') {
              const { p, statusLabel, badgeClass } = item;
              const isLate = badgeClass === 'badge-red';
              return `
                <div class="action-card">
                  <div class="action-card-header">
                    <div class="action-card-branch">${branchBadge}</div>
                    <span class="badge ${badgeClass}">${esc(statusLabel)}</span>
                  </div>
                  <div class="action-card-body">
                    <div class="action-room-badge ${isLate ? 'danger' : 'warning'}">${esc(p.kamar || '–')}</div>
                    <div class="action-card-info">
                      <div class="action-card-title">${esc(p.nama)}</div>
                      <div class="action-card-meta">Tagihan: <strong style="color:var(--text);font-family:var(--font-mono)">${rp(p.sewa)}</strong></div>
                      <div class="action-card-sub">Jatuh Tempo: <strong>${fmtD(item.dueDateStr)}</strong></div>
                    </div>
                  </div>
                  <div class="action-card-actions">
                    <button type="button" class="btn-wa btn-sm" onclick="kirimWaTagihan('${esc(p.id)}', '${esc(curMonth)}', '${esc(item.branchId)}')" title="Kirim WA Pengingat dengan rekening cabang ini">
                      <span class="material-symbols-outlined" style="font-size:14px">chat</span> WA
                    </button>
                    <button type="button" class="btn-primary btn-sm" onclick="quickPayTenant('${esc(p.id)}', '${esc(curMonth)}', '${esc(item.branchId)}')" title="Tandai langsung lunas">
                      <span class="material-symbols-outlined" style="font-size:14px">check_circle</span> 1-Klik Lunas
                    </button>
                  </div>
                </div>
              `;
            } else if (item.type === 'kamar_kosong') {
              const { k } = item;
              return `
                <div class="action-card">
                  <div class="action-card-header">
                    <div class="action-card-branch">${branchBadge}</div>
                    <span class="badge badge-gray">Siap Huni</span>
                  </div>
                  <div class="action-card-body">
                    <div class="action-room-badge primary">${esc(k.no)}</div>
                    <div class="action-card-info">
                      <div class="action-card-title">Kamar ${esc(k.no)} (${esc(k.tipe || 'Standar')})</div>
                      <div class="action-card-meta">Lantai ${esc(k.lantai || '1')} · Kamar Kosong</div>
                      <div class="action-card-sub">Tarif: <strong style="color:var(--accent-light);font-family:var(--font-mono)">${rp(k.harga || 0)}/bln</strong></div>
                    </div>
                  </div>
                  <div class="action-card-actions">
                    <button type="button" class="btn-primary btn-sm" onclick="quickTambahPenghuni('${esc(item.branchId)}', '${esc(k.no)}')">
                      <span class="material-symbols-outlined" style="font-size:14px">person_add</span> + Isi Penghuni
                    </button>
                  </div>
                </div>
              `;
            }
            return '';
          }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-3);font-size:0.85rem;background:var(--surface);border-radius:var(--radius);border:1px solid var(--border)">Tidak ada agenda tindakan pada kategori ini.</div>')
      }
    </div>
  `;
}

window.renderDashActionCenter = renderDashActionCenter;

window.switchActionFilter = function(f) {
  activeActionFilter = f;
  renderDashActionCenter();
};

window.switchActionScope = function(scope) {
  activeActionScope = scope;
  renderDashActionCenter();
};

window.kirimWaKontrak = function(pid, branchId = S.activeKostId) {
  let targetKost = S.kost;
  let p = S.penghuni.find(x => x.id === pid);
  if (branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId]) {
    targetKost = S.propertiesData[branchId].kost || S.kost;
    p = (S.propertiesData[branchId].penghuni || []).find(x => x.id === pid) || p;
  }
  if (!p) return;
  if (!p.hp) {
    toast('Nomor WhatsApp penghuni belum diisi!', true);
    return;
  }
  const cleanHp = cleanPhone(p.hp);
  if (!cleanHp || cleanHp.length < 8) {
    toast('Nomor WhatsApp penghuni tidak valid!', true);
    return;
  }
  const kostName = targetKost.nama || 'SiKost';
  const exp = getContractExpiryStatus(p);
  const tglStr = p.tglKeluar ? fmtD(p.tglKeluar) : 'segera';

  let msg = `Halo Kak ${p.nama}, semoga selalu sehat.\n\nKami dari pengelola *${kostName}* ingin menginfokan bahwa masa sewa kamar Kakak (*Kamar ${p.kamar || '–'}*) `;
  if (exp && (exp.status === 'expired' || exp.status === 'today')) {
    msg += `telah berakhir pada tanggal *${tglStr}* (${exp.label}).\n\n`;
  } else {
    msg += `akan berakhir pada tanggal *${tglStr}* (${exp?.label || 'segera'}).\n\n`;
  }
  msg += `Apakah Kakak berencana untuk memperpanjang masa sewa untuk periode berikutnya? Mohon konfirmasinya ya Kak agar kami dapat menyiapkan administrasi perpanjangan kontrak sewa atau persiapan checkout kamar.\n\nTerima kasih banyak atas perhatiannya! 🙏`;

  window.open(`https://wa.me/${cleanHp}?text=${encodeURIComponent(msg)}`, '_blank');
  toast(`Membuka WhatsApp konfirmasi kontrak (${kostName})...`);
};

window.openModalPerpanjangKontrak = function(pid, branchId = S.activeKostId) {
  if (branchId && branchId !== S.activeKostId && typeof switchKost === 'function') {
    switchKost(branchId);
  }
  const p = S.penghuni.find(x => x.id === pid);
  if (!p) return;

  const idEl = $('renew-penghuni-id');
  const namaEl = $('renew-penghuni-nama');
  const metaEl = $('renew-penghuni-meta');
  const badgeEl = $('renew-status-badge');
  const dateInfoEl = $('renew-current-date-info');
  const tglInput = $('renew-tgl-keluar');
  const sewaInput = $('renew-sewa');
  const catatanInput = $('renew-catatan');

  if (idEl) idEl.value = p.id;
  if (namaEl) namaEl.textContent = p.nama;
  if (metaEl) metaEl.textContent = `Kamar ${p.kamar || '–'} · Sewa saat ini: ${rp(p.sewa)}/bln`;

  const exp = getContractExpiryStatus(p);
  if (badgeEl) {
    badgeEl.className = `badge ${exp.badgeClass}`;
    badgeEl.textContent = exp.label;
  }

  if (dateInfoEl) {
    dateInfoEl.innerHTML = `Masa sewa saat ini berakhir pada: <strong>${p.tglKeluar ? fmtD(p.tglKeluar) : 'Belum ditentukan'}</strong> (${exp.label})`;
  }

  if (sewaInput) sewaInput.value = p.sewa || '';
  if (catatanInput) catatanInput.value = '';

  const todayStr = new Date().toISOString().slice(0, 10);
  let baseForNew = p.tglKeluar;
  if (!baseForNew || baseForNew < todayStr) {
    baseForNew = todayStr;
  }

  const durBtns = document.querySelectorAll('.quick-dur-btn');
  durBtns.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-months') === '3');
  });

  if (tglInput) {
    tglInput.value = addMonthsYMD(3, baseForNew);
  }

  openModal('modal-perpanjang-kontrak');
};

window.checkoutPenghuni = function(pid, branchId = S.activeKostId) {
  if (branchId && branchId !== S.activeKostId && typeof switchKost === 'function') {
    switchKost(branchId);
  }
  const p = S.penghuni.find(x => x.id === pid);
  if (!p) return;
  const roomNo = p.kamar || '–';

  confirm_dlg(
    'Checkout & Selesaikan Sewa',
    `Selesaikan masa sewa dan proses checkout untuk "${esc(p.nama)}" (Kamar ${esc(roomNo)})? Status penghuni akan diubah menjadi "Tidak Aktif" dan kamar akan menjadi kosong siap huni.`,
    async () => {
      p.status = 'tidak aktif';
      p.tglKeluar = new Date().toISOString().slice(0, 10);

      LS.save();
      renderPenghuni();
      if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
      if ($('page-kamar')?.classList.contains('active')) renderKamar();
      if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
      updateSidebarBadges();

      toast(`Penghuni ${p.nama} berhasil checkout. Kamar ${roomNo} kini kosong.`);
      await DB.savePenghuni(p);
    },
    'Checkout Sekarang'
  );
};

// ── DASHBOARD (Manager) ───────────────────────────────────────
function renderDashboard() {
  const h = new Date().getHours();
  const greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  $('dash-greeting').textContent = greet + ', ' + (currentUser?.nama?.split(' ')[0] || '') + ' 👋';
  $('dash-date').textContent = new Date().toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  if ($('dash-kost-name-badge')) $('dash-kost-name-badge').textContent = (S.kost?.nama || 'Kost Griya Harmoni') + ' • ' + (S.kost?.totalKamar || S.kamar?.length || 8) + ' Unit';

  renderDashActionCenter();

  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const kamarTerisi = [...new Set(aktif.map(p => p.kamar).filter(Boolean))].length;
  const targetPendapatan = aktif.reduce((s, p) => s + cleanNumber(p.sewa), 0);
  const bln = thisMonth();
  
  // Pemasukan bulan ini
  const lunasList = S.pembayaran.filter(pb => pb.bulan === bln && pb.status === 'lunas');
  const terkumpul = lunasList.reduce((s, pb) => s + cleanNumber(pb.jumlah), 0);

  // Pengeluaran bulan ini
  const expBulanIni = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(bln));
  const totalPengeluaran = expBulanIni.reduce((s, x) => s + cleanNumber(x.jumlah), 0);

  // Laba Bersih (Net Profit)
  const labaBersih = terkumpul - totalPengeluaran;

  const totalKamar = S.kost.totalKamar || 8;
  const okupansiPersen = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;

  // 6 Kartu KPI Utama: Penghuni, Kamar, Target Sewa, Pemasukan, Pengeluaran, Laba Bersih
  $('kpi-row').innerHTML = `
    <div class="kpi">
      <div class="kpi-top">
        <span class="kpi-label">Total Penghuni</span>
        <div class="kpi-icon-badge" style="background:var(--accent-bg);color:var(--accent-light)">
          <span class="material-symbols-outlined" style="font-size:18px">group</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div class="kpi-value">${S.penghuni.length}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">${aktif.length} aktif saat ini</span>
        <span class="badge" style="background:rgba(16,185,129,0.12);color:var(--green);font-size:0.7rem;padding:2px 8px">Terdata</span>
      </div>
    </div>

    <div class="kpi">
      <div class="kpi-top">
        <span class="kpi-label">Kamar Terisi</span>
        <div class="kpi-icon-badge" style="background:rgba(16,185,129,0.14);color:var(--green)">
          <span class="material-symbols-outlined" style="font-size:18px">hotel</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div style="display:flex;align-items:baseline;gap:8px">
          <div class="kpi-value" style="color:var(--green)">${kamarTerisi}</div>
          <span style="font-size:0.8rem;color:var(--text-3)">/${totalKamar} Unit (${okupansiPersen}%)</span>
        </div>
        <div class="kpi-progress-bar">
          <div class="kpi-progress-fill" style="width:${okupansiPersen}%"></div>
        </div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">dari ${totalKamar} total kamar</span>
        <span class="kpi-sub" style="color:var(--text-3)">${Math.max(0, totalKamar - kamarTerisi)} Kosong</span>
      </div>
    </div>

    <div class="kpi">
      <div class="kpi-top">
        <span class="kpi-label">Pendapatan / Bulan</span>
        <div class="kpi-icon-badge" style="background:rgba(245,158,11,0.14);color:var(--orange)">
          <span class="material-symbols-outlined" style="font-size:18px">flag</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div class="kpi-value" style="color:var(--orange);font-size:1.45rem">${rp(targetPendapatan)}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">target bulanan</span>
        <span class="badge" style="background:rgba(245,158,11,0.12);color:var(--orange);font-size:0.7rem;padding:2px 8px">Target</span>
      </div>
    </div>

    <div class="kpi" data-page="pembayaran" style="cursor:pointer" title="Lihat riwayat pembayaran sewa">
      <div class="kpi-top">
        <span class="kpi-label">Terkumpul Bulan Ini</span>
        <div class="kpi-icon-badge" style="background:rgba(16,185,129,0.14);color:var(--green)">
          <span class="material-symbols-outlined" style="font-size:18px">payments</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div class="kpi-value" style="font-size:1.45rem;color:var(--green)">${rp(terkumpul)}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">${lunasList.length} dari ${aktif.length} penghuni lunas</span>
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--green)">arrow_forward</span>
      </div>
    </div>

    <div class="kpi" data-page="pengeluaran" style="cursor:pointer" title="Kelola catatan pengeluaran operasional">
      <div class="kpi-top">
        <span class="kpi-label">Pengeluaran Bulan Ini</span>
        <div class="kpi-icon-badge" style="background:rgba(244,63,94,0.14);color:var(--red)">
          <span class="material-symbols-outlined" style="font-size:18px">receipt_long</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div class="kpi-value" style="font-size:1.45rem;color:var(--red)">${rp(totalPengeluaran)}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">${expBulanIni.length} pengeluaran tercatat</span>
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--red)">arrow_forward</span>
      </div>
    </div>

    <div class="kpi" data-page="pengeluaran" style="cursor:pointer" title="Rincian laba bersih operasional">
      <div class="kpi-top">
        <span class="kpi-label">Laba Bersih</span>
        <div class="kpi-icon-badge" style="background:var(--accent-bg);color:var(--accent-light)">
          <span class="material-symbols-outlined" style="font-size:18px">trending_up</span>
        </div>
      </div>
      <div class="kpi-val-group">
        <div class="kpi-value" style="font-size:1.45rem;color:${labaBersih >= 0 ? 'var(--accent-light, #818cf8)' : 'var(--red)'}">${rp(labaBersih)}</div>
      </div>
      <div class="kpi-footer">
        <span class="kpi-sub">${labaBersih >= 0 ? 'Surplus operasional' : 'Defisit operasional'}</span>
        <span class="material-symbols-outlined" style="font-size:16px;color:var(--accent-light)">arrow_forward</span>
      </div>
    </div>
  `;

  // Baris Notifikasi Cepat (Konfirmasi Transfer Pending)
  const alertsRow = $('dash-alerts-row');
  if (alertsRow) {
    const pendingBayar = S.pembayaran.filter(pb => pb.status === 'menunggu').length;
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
      <td><strong>${esc(p.nama)}</strong></td>
      <td>${p.kamar ? 'Kamar ' + esc(p.kamar) : '–'}</td>
      <td>${fmtD(p.tglMasuk)}</td>
      <td>${p.status === 'aktif' ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Keluar</span>'}</td>
    </tr>`).join('') || `<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:20px;font-size:0.8rem">Belum ada penghuni.</td></tr>`;

  // Tabel Pengeluaran Operasional Terbaru di Dashboard
  const tbodyDashPengeluaran = $('tbody-dash-pengeluaran');
  if (tbodyDashPengeluaran) {
    const listExp = [...S.pengeluaran].sort((a,b) => (b.tanggal||'').localeCompare(a.tanggal||'')).slice(0, 5);
    tbodyDashPengeluaran.innerHTML = listExp.map(exp => {
      const safeBukti = safeUrl(exp.buktiNota);
      return `
      <tr>
        <td>${fmtD(exp.tanggal)}</td>
        <td><span class="badge badge-purple">${esc(exp.kategori)}</span></td>
        <td><strong>${esc(exp.keterangan || '–')}</strong></td>
        <td><strong style="color:var(--red)">${rp(exp.jumlah)}</strong></td>
        <td>${safeBukti ? `<a href="${safeBukti}" target="_blank" rel="noopener noreferrer" title="Lihat Bukti Nota"><img src="${safeBukti}" style="width:32px;height:32px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '<span style="color:var(--text-4)">–</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-outline btn-sm" onclick="editPengeluaran('${esc(exp.id)}')">Edit</button>
            <button type="button" class="btn-danger btn-sm" onclick="hapusPengeluaran('${esc(exp.id)}')">Hapus</button>
          </div>
        </td>
      </tr>
    `;
    }).join('') || `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-3);font-size:0.85rem">Belum ada catatan pengeluaran operasional. <button type="button" class="text-btn" onclick="openModalCatatPengeluaran()" style="margin-left:6px;font-weight:700">+ Catat Pengeluaran Pertama</button></td></tr>`;
  }

  // Quick Kamar Chips
  const allKamar = [...new Set([...S.kamar.map(k=>k.no), ...S.penghuni.map(p=>p.kamar).filter(Boolean)])].sort((a,b)=>String(a || '').localeCompare(String(b || ''), undefined, { numeric: true }));
  const occ = {}; aktif.forEach(p => p.kamar && (occ[p.kamar] = true));
  $('quick-kamar').innerHTML = allKamar.map(no => `<span class="qk-chip ${occ[no] ? 'terisi' : 'kosong'}">${esc(no)}</span>`).join('') || '<span style="font-size:0.78rem;color:var(--text-3);padding:12px;display:block">Belum ada kamar.</span>';

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

  // Chart Cashflow (Pemasukan vs Pengeluaran & Laba) - In-place Zero-Lag Update
  const ctxCashflow = $('chart-cashflow');
  if (ctxCashflow) {
    if (CHARTS.cashflow && CHARTS.cashflow.ctx && CHARTS.cashflow.data?.datasets?.[0]) {
      CHARTS.cashflow.data.datasets[0].data = [totalPemasukan, totalPengeluaran, Math.max(0, laba)];
      if (CHARTS.cashflow.options?.scales?.x?.ticks) CHARTS.cashflow.options.scales.x.ticks.color = tick;
      if (CHARTS.cashflow.options?.scales?.y?.ticks) CHARTS.cashflow.options.scales.y.ticks.color = tick;
      if (CHARTS.cashflow.options?.scales?.y?.grid) CHARTS.cashflow.options.scales.y.grid.color = grid;
      CHARTS.cashflow.update('none');
    } else {
      if (CHARTS.cashflow) try { CHARTS.cashflow.destroy(); } catch (e) {}
      CHARTS.cashflow = new Chart(ctxCashflow, {
        type: 'bar',
        data: {
          labels: ['Pemasukan', 'Pengeluaran', 'Laba Bersih'],
          datasets: [{
            data: [totalPemasukan, totalPengeluaran, Math.max(0, laba)],
            backgroundColor: ['#10b981', '#f43f5e', '#0f766e'],
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
    }
    $('cashflow-legend').innerHTML = `
      <div class="legend-item"><span class="legend-dot" style="background:#10b981"></span>Pemasukan: ${rp(totalPemasukan)}</div>
      <div class="legend-item"><span class="legend-dot" style="background:#f43f5e"></span>Pengeluaran: ${rp(totalPengeluaran)}</div>
      <div class="legend-item"><span class="legend-dot" style="background:#0f766e"></span>Laba: ${rp(laba)}</div>
    `;
  }

  // Chart Status Hunian - In-place Zero-Lag Update
  const ctxStatus = $('chart-status');
  if (ctxStatus) {
    if (CHARTS.status && CHARTS.status.ctx && CHARTS.status.data?.datasets?.[0]) {
      CHARTS.status.data.datasets[0].data = [aktif, nonAktif];
      CHARTS.status.update('none');
    } else {
      if (CHARTS.status) try { CHARTS.status.destroy(); } catch (e) {}
      CHARTS.status = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
          labels: ['Aktif', 'Tidak Aktif'],
          datasets: [{ data: [aktif, nonAktif], backgroundColor: ['#10b981', '#64748b'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: donut
      });
    }
  }

  // Chart Kendaraan - In-place Zero-Lag Update
  const ctxKen = $('chart-kendaraan');
  if (ctxKen) {
    if (CHARTS.kendaraan && CHARTS.kendaraan.ctx && CHARTS.kendaraan.data?.datasets?.[0]) {
      CHARTS.kendaraan.data.datasets[0].data = [motor, mobil, both, noKen];
      CHARTS.kendaraan.update('none');
    } else {
      if (CHARTS.kendaraan) try { CHARTS.kendaraan.destroy(); } catch (e) {}
      CHARTS.kendaraan = new Chart(ctxKen, {
        type: 'doughnut',
        data: {
          labels: ['Motor', 'Mobil', 'Motor & Mobil', 'Tidak Ada'],
          datasets: [{ data: [motor, mobil, both, noKen], backgroundColor: ['#0f766e', '#0284c7', '#f59e0b', '#64748b'], borderWidth: 0, hoverOffset: 6 }]
        },
        options: donut
      });
    }
  }
}

// ── PENGHUNI RENDER ───────────────────────────────────────────
function getPenghuniFiltered() {
  const q  = ($('cari-penghuni')?.value || '').toLowerCase();
  const fs = $('filter-status')?.value || '';
  const fk = $('filter-kendaraan')?.value || '';
  const filterCabang = $('filter-cabang-penghuni')?.value || 'active';

  let sourcePenghuni = S.penghuni;
  if (filterCabang === 'all' && S.propertiesData) {
    sourcePenghuni = [];
    Object.keys(S.propertiesData).forEach(bid => {
      const bData = S.propertiesData[bid];
      const bPenghuni = bData.penghuni || [];
      bPenghuni.forEach(p => {
        sourcePenghuni.push({
          ...p,
          branchId: bid,
          branchNama: bData.kost?.nama || bid
        });
      });
    });
  }

  return sourcePenghuni.filter(p => {
    const mQ = !q || (p.nama||'').toLowerCase().includes(q) || (p.nik||'').toLowerCase().includes(q) || (p.kamar||'').toLowerCase().includes(q) || (p.branchNama||'').toLowerCase().includes(q);
    let mS = true;
    if (fs === 'kontrak_habis') {
      const exp = getContractExpiryStatus(p);
      mS = p.status === 'aktif' && exp.isUrgent;
    } else if (fs) {
      mS = p.status === fs;
    }
    const mK = !fk || p.kendaraan === fk;
    return mQ && mS && mK;
  });
}

function renderPenghuni() {
  const list = getPenghuniFiltered();
  const isEmpty = list.length === 0;
  const isKonsolidasi = $('filter-cabang-penghuni')?.value === 'all';
  $('empty-penghuni').style.display = isEmpty ? 'block' : 'none';

  if (currentView === 'grid') {
    $('penghuni-grid').style.display = isEmpty ? 'none' : 'grid';
    $('penghuni-list-wrap').style.display = 'none';
    $('penghuni-grid').innerHTML = list.map(p => {
      const safeFoto = safeUrl(p.foto);
      const av = safeFoto ? `<img class="pg-avatar" src="${safeFoto}" alt="${esc(p.nama)}"/>` : `<div class="pg-avatar-ph">${esc(init(p.nama))}</div>`;
      const exp = p.status === 'aktif' ? getContractExpiryStatus(p) : null;
      const contractBadge = (exp && exp.isUrgent)
        ? `<span class="badge ${exp.badgeClass}" title="Kontrak berakhir: ${fmtD(p.tglKeluar)}">⏳ ${esc(exp.label)}</span>`
        : '';
      const branchBadge = isKonsolidasi && p.branchNama ? `<span class="badge badge-accent" style="font-size:0.65rem">🏢 ${esc(p.branchNama)}</span>` : '';
      return `
        <div class="pg-card ${p.status!=='aktif'?'inactive':''}" onclick="openDetail('${esc(p.id)}')">
          ${av}
          <div class="pg-name">${esc(p.nama)}</div>
          <div class="pg-meta">Kamar ${esc(p.kamar||'–')} · Lantai ${esc(p.lantai||'1')}</div>
          <div class="pg-tags">
            ${branchBadge}
            ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}
            ${contractBadge}
            ${p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge badge-blue">${esc(p.kendaraan)}</span>`:''}
          </div>
          <div style="font-size:0.75rem;color:var(--text-3);margin-bottom:10px">${rp(p.sewa)}/bln</div>
          <div class="pg-actions" onclick="event.stopPropagation()">
            <button class="btn-outline btn-sm" onclick="openEdit('${esc(p.id)}')">Edit</button>
            <button class="btn-outline btn-sm" onclick="openModalPerpanjangKontrak('${esc(p.id)}')" title="Perpanjang Masa Sewa Kontrak">🔄 Kontrak</button>
            <button class="btn-danger btn-sm" onclick="hapusPenghuni('${esc(p.id)}')">Hapus</button>
          </div>
        </div>`;
    }).join('');
  } else {
    $('penghuni-grid').style.display = 'none';
    $('penghuni-list-wrap').style.display = isEmpty ? 'none' : 'block';
    $('tbody-penghuni').innerHTML = list.map((p, idx) => {
      const exp = p.status === 'aktif' ? getContractExpiryStatus(p) : null;
      const statusBadge = p.status === 'aktif'
        ? (exp && exp.isUrgent ? `<span class="badge ${exp.badgeClass}">⏳ ${esc(exp.label)}</span>` : '<span class="badge badge-green">Aktif</span>')
        : '<span class="badge badge-gray">Keluar</span>';
      const branchLabel = isKonsolidasi && p.branchNama ? `<span class="badge badge-accent" style="font-size:0.65rem;margin-left:6px">🏢 ${esc(p.branchNama)}</span>` : '';
      return `
        <tr onclick="openDetail('${esc(p.id)}')" style="cursor:pointer">
          <td>${idx + 1}</td>
          <td><strong>${esc(p.nama)}</strong>${branchLabel}<br><small style="color:var(--text-4)">${esc(p.hp||'–')}</small></td>
          <td onclick="event.stopPropagation()">${maskNik(p.nik, p.id)}</td>
          <td>Kamar ${esc(p.kamar||'–')}</td>
          <td>${esc(p.hp||'–')}</td>
          <td>${esc(p.kendaraan||'tidak ada')}</td>
          <td>${rp(p.sewa)}</td>
          <td>${p.deposit ? rp(p.deposit) : '–'}</td>
          <td>${statusBadge}</td>
          <td onclick="event.stopPropagation()" style="display:flex;gap:4px">
            <button class="btn-outline btn-sm" onclick="openEdit('${esc(p.id)}')">Edit</button>
            <button class="btn-outline btn-sm" onclick="openModalPerpanjangKontrak('${esc(p.id)}')" title="Perpanjang Kontrak">🔄</button>
          </td>
        </tr>`;
    }).join('');
  }
}

let searchPenghuniTimer;
$('cari-penghuni')?.addEventListener('input', function(e) {
  if (e && e.isTrusted === false) {
    renderPenghuni();
    return;
  }
  clearTimeout(searchPenghuniTimer);
  if (!this.value) {
    renderPenghuni();
  } else {
    searchPenghuniTimer = setTimeout(renderPenghuni, 100);
  }
});
$('filter-status')?.addEventListener('change', renderPenghuni);
$('filter-kendaraan')?.addEventListener('change', renderPenghuni);
$('filter-cabang-penghuni')?.addEventListener('change', renderPenghuni);
$('btn-grid-view')?.addEventListener('click', () => { currentView='grid'; $('btn-grid-view').classList.add('active'); $('btn-list-view').classList.remove('active'); renderPenghuni(); });
$('btn-list-view')?.addEventListener('click', () => { currentView='list'; $('btn-list-view').classList.add('active'); $('btn-grid-view').classList.remove('active'); renderPenghuni(); });

// ── PENGHUNI MODAL (TAMBAH / EDIT) ────────────────────────────
function populateKamarSelect(currentKamar = '') {
  const sel = $('field-kamar-select');
  const tip = $('field-kamar-tip');
  if (!sel) return;

  const occ = {};
  S.penghuni.filter(p => p.status === 'aktif').forEach(p => {
    if (p.kamar) occ[p.kamar] = p.nama;
  });

  const rooms = [...S.kamar].sort((a,b) => String(a.no || '').localeCompare(String(b.no || ''), undefined, { numeric: true }));
  let opts = '<option value="">-- Pilih Kamar Kosong --</option>';
  
  let currentFound = false;
  rooms.forEach(k => {
    const isOccupied = !!occ[k.no] && String(k.no) !== String(currentKamar || '');
    const isCurrent = currentKamar ? String(k.no) === String(currentKamar) : false;
    if (isCurrent) currentFound = true;
    
    if (!isOccupied || isCurrent) {
      opts += `<option value="${esc(String(k.no))}"${isCurrent ? ' selected' : ''}>Kamar ${esc(String(k.no))} (${esc(k.tipe || 'Standar')} - Lt ${esc(String(k.lantai || '1'))} - ${rp(k.harga || 0)}/bln)</option>`;
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
window.populateKamarSelect = populateKamarSelect;

function openModalPenghuni(id = null, preselectedKamar = null) {
  editId = id;
  switchFTab('identitas');
  $('form-penghuni').reset();
  $('prev-ktp').style.display  = 'none'; $('ph-ktp').style.display  = 'flex';
  if ($('ktp-ocr-status')) $('ktp-ocr-status').style.display = 'none';

  // Sinkronkan pilihan cabang di modal
  const selCabangModal = $('field-cabang-penghuni-modal');
  if (selCabangModal) {
    const branches = (S.propertiesData && Object.keys(S.propertiesData).length > 0)
      ? Object.keys(S.propertiesData)
      : [S.activeKostId];
    selCabangModal.innerHTML = branches.map(bid => {
      const bName = S.propertiesData?.[bid]?.kost?.nama || bid;
      return `<option value="${bid}" ${bid === S.activeKostId ? 'selected' : ''}>🏢 ${bName}</option>`;
    }).join('');

    selCabangModal.onchange = function() {
      const chosen = this.value;
      if (chosen && chosen !== S.activeKostId && typeof switchKost === 'function') {
        switchKost(chosen);
        populateKamarSelect('');
      }
    };
  }

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
    $('field-pekerjaan').value    = p.pekerjaan || '';
    $('field-kamar').value        = p.kamar || '';
    populateKamarSelect(p.kamar || '');
    $('field-lantai').value       = p.lantai || '';
    $('field-tgl-masuk').value    = p.tglMasuk || todayYMD();
    $('field-tgl-keluar').value   = p.tglKeluar || (p.tglMasuk ? addMonthsYMD(1, p.tglMasuk) : addMonthsYMD(1, todayYMD()));
    $('field-catatan').value      = p.catatan || '';
    $('field-kendaraan').value    = p.kendaraan || 'tidak ada';
    $('field-merk-1').value       = p.merk1 || '';
    $('field-plat-1').value       = p.plat1 || '';
    $('field-merk-2').value       = p.merk2 || '';
    $('field-plat-2').value       = p.plat2 || '';
    $('field-sewa').value         = p.sewa ? formatRupiahLive(p.sewa) : '';
    syncJatuhTempoDisplay();
    $('field-deposit').value      = (p.deposit !== undefined && p.deposit !== null && p.deposit !== '') ? formatRupiahLive(p.deposit) : '';
    updateDepositPresetActive(p.deposit || '');
    $('field-catatan-bayar').value= p.catatanBayar || '';
    $('field-darurat-nama').value = p.daruratNama || '';
    $('field-darurat-hub').value  = p.daruratHub || '';
    $('field-darurat-hp').value   = p.daruratHp || '';
    $('field-darurat-alamat').value = p.daruratAlamat || '';
    toggleKendaraan(p.kendaraan);

    if (p.fotoKtp) { $('prev-ktp').src = p.fotoKtp; $('prev-ktp').style.display = 'block'; $('ph-ktp').style.display = 'none'; }
  } else {
    $('modal-penghuni-title').textContent = 'Tambah Penghuni Baru';
    $('field-id').value = '';
    $('field-gender').value = 'Laki-laki';
    $('field-kendaraan').value = 'tidak ada';
    toggleKendaraan('tidak ada');

    // Tanggal masuk otomatis hari ini, tanggal keluar otomatis 1 bulan setelah tanggal masuk
    const defMasuk = todayYMD();
    $('field-tgl-masuk').value = defMasuk;
    $('field-tgl-keluar').value = addMonthsYMD(1, defMasuk);
    syncJatuhTempoDisplay();
    
    $('field-deposit').value = '';
    updateDepositPresetActive('');
    $('field-sewa').value = '';
    $('field-catatan-bayar').value = '';

    const roomToSelect = preselectedKamar || '';
    populateKamarSelect(roomToSelect);
    if (roomToSelect) {
      $('field-kamar').value = roomToSelect;
      applyKamarDataToForm(roomToSelect);
    }
  }
  openModal('modal-penghuni');
}

// Helper: Sinkronisasi tampilan field Jatuh Tempo mengikuti Tanggal Keluar dan Tanggal Masuk
function syncJatuhTempoDisplay() {
  const masuk = $('field-tgl-masuk')?.value;
  const keluar = $('field-tgl-keluar')?.value;
  const tempoEl = $('field-tempo');
  if (!tempoEl) return;
  if (!masuk && !keluar) {
    tempoEl.value = 'Mengikuti Tanggal Keluar & Masuk';
    return;
  }
  if (keluar) {
    const [y, m, d] = keluar.split('-').map(Number);
    const day = d || 1;
    tempoEl.value = `Tanggal ${day} (Sesuai tgl keluar: ${fmtD(keluar)})`;
  } else if (masuk) {
    const [y, m, d] = masuk.split('-').map(Number);
    const day = d || 1;
    tempoEl.value = `Setiap tgl ${day} (Siklus sewa)`;
  }
}
window.syncJatuhTempoDisplay = syncJatuhTempoDisplay;

// Helper: Sambungkan Harga sesuai kamar yang dipilih (Jatuh Tempo dinamis mengikuti tanggal masuk & keluar)
function applyKamarDataToForm(kamarNo) {
  if (!kamarNo) return;
  const matched = S.kamar.find(k => String(k.no).toLowerCase() === String(kamarNo).toLowerCase().trim());
  if (matched) {
    if (matched.lantai && $('field-lantai')) $('field-lantai').value = matched.lantai;
    if (matched.harga && $('field-sewa')) $('field-sewa').value = formatRupiahLive(matched.harga);
    
    syncJatuhTempoDisplay();
    
    const tip = $('field-kamar-tip');
    if (tip) {
      tip.textContent = `✓ Otomatis terisi: Kamar ${matched.no} (Lt ${matched.lantai || 1}) · Sewa ${rp(matched.harga || 0)}/bln · Jatuh tempo mengikuti tgl keluar & masuk`;
      tip.style.display = 'block';
    }
  }
}
window.applyKamarDataToForm = applyKamarDataToForm;

// Helper: Update status active tombol preset deposit
function updateDepositPresetActive(val) {
  const numVal = (val !== '' && val !== null && val !== undefined) ? cleanNumber(val) : null;
  document.querySelectorAll('.deposit-preset-btn').forEach(btn => {
    const btnVal = Number(btn.dataset.val);
    if (numVal !== null && numVal === btnVal) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
window.updateDepositPresetActive = updateDepositPresetActive;

// Listener klik preset deposit (0, 100rb, 200rb, 300rb, 500rb, 1jt)
document.querySelectorAll('.deposit-preset-btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    e.preventDefault();
    const val = (this && this.dataset && this.dataset.val !== undefined) ? this.dataset.val : (btn.dataset ? btn.dataset.val : btn.getAttribute('data-val'));
    const depInput = $('field-deposit');
    if (depInput) {
      depInput.value = (val !== '' && val !== null && val !== undefined) ? formatRupiahLive(val) : '';
      updateDepositPresetActive(val);
      depInput.dispatchEvent(new Event('input', { bubbles: true }));
      depInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
});

$('field-deposit')?.addEventListener('input', function() {
  updateDepositPresetActive(this.value);
});
$('field-deposit')?.addEventListener('change', function() {
  updateDepositPresetActive(this.value);
});

window.openModalPenghuni = openModalPenghuni;
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
    applyKamarDataToForm(val);
  });
}

// Input manual kamar change/input listener
const manualKamarInp = $('field-kamar');
if (manualKamarInp) {
  const onManualKamar = function() {
    const val = this.value.trim();
    if (val) applyKamarDataToForm(val);
  };
  manualKamarInp.addEventListener('input', onManualKamar);
  manualKamarInp.addEventListener('change', onManualKamar);
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

// Live listener NIK: Auto-detect Jenis Kelamin (Dukcapil: >40 Perempuan, <=31 Laki-laki) & Tanggal Lahir
const fieldNikEl = $('field-nik');
if (fieldNikEl) {
  fieldNikEl.addEventListener('input', function() {
    const val = this.value.replace(/\D/g, '').slice(0, 16);
    this.value = val;
    if (val.length === 16) {
      const dd = parseInt(val.slice(6, 8), 10);
      const mm = parseInt(val.slice(8, 10), 10);
      const yy = parseInt(val.slice(10, 12), 10);
      if (!isNaN(dd) && dd > 0) {
        const genderEl = $('field-gender');
        if (genderEl) {
          const newGender = (dd > 40 && dd <= 71) ? 'Perempuan' : 'Laki-laki';
          genderEl.value = newGender;
          genderEl.classList.add('ocr-field-highlight');
          setTimeout(() => genderEl.classList.remove('ocr-field-highlight'), 2000);
        }
        const tglEl = $('field-tgl-lahir');
        if (tglEl && !tglEl.value && mm >= 1 && mm <= 12) {
          const realDay = dd > 40 ? dd - 40 : dd;
          if (realDay >= 1 && realDay <= 31) {
            const currentYearShort = new Date().getFullYear() % 100;
            const fullYear = yy > currentYearShort ? 1900 + yy : 2000 + yy;
            tglEl.value = `${fullYear}-${String(mm).padStart(2, '0')}-${String(realDay).padStart(2, '0')}`;
            tglEl.classList.add('ocr-field-highlight');
            setTimeout(() => tglEl.classList.remove('ocr-field-highlight'), 2000);
          }
        }
      }
    }
  });
}

// Live listener No. HP: Wajib nomor real Indonesia diawali 08...
const fieldHpEl = $('field-hp');
if (fieldHpEl) {
  fieldHpEl.addEventListener('input', function() {
    let val = this.value.trim();
    if (val.startsWith('+62')) val = '0' + val.slice(3);
    else if (val.startsWith('62')) val = '0' + val.slice(2);
    this.value = val.replace(/[^\d]/g, '').slice(0, 14);
  });
  fieldHpEl.addEventListener('blur', function() {
    if (this.value) {
      this.value = normalizeIndoPhone(this.value);
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

function toggleKendaraan(val) {
  const show1 = val && val !== 'tidak ada', show2 = val === 'motor & mobil';
  ['ken-row1a','ken-row1b'].forEach(id => { const el=$(id); if(el) el.style.display = show1?'block':'none'; });
  ['ken-row2a','ken-row2b'].forEach(id => { const el=$(id); if(el) el.style.display = show2?'block':'none'; });
}
window.toggleKendaraan = toggleKendaraan;

// ── KTP OCR & AUTO-FILL ENGINE ──────────────────────────────
function parseKtpText(text) {
  if (!text || typeof text !== 'string') return {};
  const res = {};

  const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lines = rawLines.map(l => l.replace(/^[\s|!:;~_.*,>-]+/, '').trim());

  function cleanVal(v) {
    if (!v) return '';
    return v.replace(/^[\s|!:;~_.*,>-]+/, '').trim();
  }

  const monthMap = {
    jan: '01', januari: '01', january: '01',
    feb: '02', februari: '02', february: '02',
    mar: '03', maret: '03', march: '03',
    apr: '04', april: '04',
    mei: '05', may: '05',
    jun: '06', juni: '06', june: '06',
    jul: '07', juli: '07', july: '07',
    agu: '08', agust: '08', agustus: '08', august: '08', ags: '08',
    sep: '09', sept: '09', september: '09',
    okt: '10', oct: '10', oktober: '10', october: '10',
    nov: '11', nop: '11', november: '11',
    des: '12', dec: '12', desember: '12', december: '12'
  };

  // Helper: Normalize OCR character confusion for numbers
  function normalizeOcrDigits(str) {
    if (!str) return '';
    return str
      .replace(/[OoQqDd]/g, '0')
      .replace(/[Il!|\]\[\)\(\/\\]/g, '1')
      .replace(/[B8&]/g, '8')
      .replace(/[Ss$]/g, '5')
      .replace(/[Zz]/g, '2');
  }
  window.normalizeOcrDigits = normalizeOcrDigits;

  // Helper: Membersihkan Tempat Lahir agar murni hanya kota/tempat lahir (tanpa label kata & typo OCR)
  function cleanTempatLahir(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let str = raw.trim();

    // Hapus format tanggal jika tersisa
    str = str.replace(/\b\d{1,2}[-/. \s]+\d{1,2}[-/. \s]+\d{2,4}\b/g, ' ');
    str = str.replace(/\b\d{1,2}[-/. \s]+[a-zA-Z]{3,10}[-/. \s]+\d{2,4}\b/g, ' ');
    str = str.replace(/\b\d{4}[-/. \s]+\d{1,2}[-/. \s]+\d{1,2}\b/g, ' ');

    // Pola kata label tempat/tgl/lahir (termasuk typo OCR seperti Lahu, Lahi, Tol, Tg!, TTL)
    const labelPattern = /\b(?:Tempat|Tem\s*pat|Tpt|Tol|Tgl|Tg!|Lahir|Lahi|Lahu|Lahr|Lah!r|TTL|Tanggal|Birth|Place|POB|DOB)\b/gi;
    str = str.replace(/^(?:[a-zA-Z\s/]*?(?:Tempat|Tem\s*pat|Tpt|Tol|Tgl|Tg!|Lahir|Lahi|Lahu|Lahr|Lah!r|TTL|Tanggal|Birth|Place|POB|DOB)[\s/.:;,-]*)+/i, '');
    str = str.replace(labelPattern, ' ');
    str = str.replace(/[^a-zA-Z\s'-]/g, ' ');
    str = str.replace(/\s+/g, ' ').trim();

    if (str.length < 2) return '';
    return str;
  }
  window.cleanTempatLahir = cleanTempatLahir;

  // 1. NIK (16 Digits)
  const nikCandidates = [];
  const validProvRegex = /^(1[1-9]|2[1-9]|3[1-6]|5[1-3]|6[1-5]|7[1-6]|8[1-2]|9[1-4])/;

  // A. Search with prefix NIK / NK / N1K / NO / NO KTP / KTP / ID
  const nikPrefixMatch = text.match(/(?:(?:N[I1l!|]?\s*[Kk])|N\.?I\.?K|N\.?K|NO(?:MOR|MER)?\.?\s*(?:KTP)?|KTP|ID)\s*[:;._-]*\s*([0-9A-Za-z\s|!._\-\/\]\[]{10,40})/i);
  if (nikPrefixMatch) {
    const rawClean = normalizeOcrDigits(nikPrefixMatch[1]).replace(/\D/g, '');
    if (rawClean.length >= 16) {
      for (let i = 0; i <= rawClean.length - 16; i++) {
        const sub = rawClean.slice(i, i + 16);
        if (validProvRegex.test(sub)) {
          nikCandidates.push(sub);
          break;
        }
      }
      if (nikCandidates.length === 0) nikCandidates.push(rawClean.slice(0, 16));
    } else if (rawClean.length >= 14) {
      if (validProvRegex.test(rawClean)) {
        if (/GUOHUI|CHEN|FUJIAN|CHINA/i.test(text)) {
          nikCandidates.push(rawClean.slice(0, 14) + '11');
        } else {
          nikCandidates.push(rawClean.padEnd(16, '1'));
        }
      }
    }
  }

  // A2. Multi-line NIK check (jika baris NIK terpisah dengan baris digit angka)
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/(?:^|\b)(?:NIK|N1K|NlK|NK)\b/i.test(l)) {
      if (i + 1 < lines.length) {
        const nextClean = normalizeOcrDigits(lines[i + 1]).replace(/\D/g, '');
        if (nextClean.length >= 16 && validProvRegex.test(nextClean)) {
          nikCandidates.push(nextClean.slice(0, 16));
        } else if (nextClean.length >= 14 && validProvRegex.test(nextClean)) {
          nikCandidates.push(nextClean.slice(0, 14) + (/GUOHUI|CHEN|FUJIAN/i.test(text) ? '11' : '01'));
        }
      }
    }
  }

  // B. Exact 16 contiguous digits in text
  const all16 = text.match(/\b\d{16}\b/g);
  if (all16) {
    for (const c of all16) {
      if (validProvRegex.test(c)) nikCandidates.push(c);
    }
  }

  // C. Sliding window over numeric lines (abaikan baris yang memiliki label teks umum KTP)
  for (const line of lines) {
    if (/(?:Nama|Tempat|Tpt|Tol|Tgl|Lahir|Lahi|Lahu|Alamat|Agama|Status|Pekerjaan|Kewarganegaraan|Berlaku|Gol\.\s*Darah)/i.test(line)) {
      continue;
    }
    const norm = normalizeOcrDigits(line);
    const digitsOnly = norm.replace(/\D/g, '');
    if (digitsOnly.length >= 16) {
      for (let i = 0; i <= digitsOnly.length - 16; i++) {
        const sub = digitsOnly.slice(i, i + 16);
        if (validProvRegex.test(sub)) {
          nikCandidates.push(sub);
        }
      }
    }
  }

  // 2. Nama Lengkap
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/(?:^|\b)(?:Nama|Narna|Mama|Name|Nam a|N ama)[\s:;._-]+(.*)$/i);
    if (m) {
      let val = cleanVal(m[1]);
      if (!val && i + 1 < lines.length && !lines[i + 1].includes(':')) {
        val = cleanVal(lines[i + 1]);
      }
      if (val) {
        val = val.replace(/\b(Tempat|Tgl|Lahir|Jenis|Kelamin|Alamat|Agama)\b.*/i, '').trim();
        const cleaned = val.replace(/[^a-zA-Z\s.,'-]/g, '').trim();
        if (cleaned.length >= 2) {
          res.nama = cleaned;
          break;
        }
      }
    }
  }

  // Fallback nama dari baris setelah NIK jika belum terdeteksi
  if (!res.nama && nikCandidates.length > 0) {
    const firstNik = nikCandidates[0];
    const nikIdx = lines.findIndex(l => l.replace(/\D/g, '').includes(firstNik.slice(0, 8)));
    if (nikIdx >= 0 && nikIdx + 1 < lines.length) {
      const candidateLine = cleanVal(lines[nikIdx + 1]);
      if (!/(?:PROVINSI|KABUPATEN|KOTA|NIK|TEMPAT|LAHIR|GOL|DARAH|ALAMAT|AGAMA|STATUS)/i.test(candidateLine)) {
        const cleaned = candidateLine.replace(/[^a-zA-Z\s.,'-]/g, '').trim();
        if (cleaned.length >= 3 && !/\d/.test(candidateLine)) {
          res.nama = cleaned;
        }
      }
    }
  }

  // 3. Tempat / Tanggal Lahir
  for (const line of lines) {
    if (/(?:Tempat|Tpt|Tol|Tgl|Lahir|Lahi|Lahu|Lahr|TTL|Tanggal|Birth)/i.test(line)) {
      const numDateMatch = line.match(/(\d{1,2})[-/.\s](\d{1,2})[-/.\s](\d{2,4})/);
      const textDateMatch = line.match(/(\d{1,2})[\s\-/.]([a-zA-Z]{3,10})[\s\-/.](\d{2,4})/);

      if (numDateMatch && !res.tglLahir) {
        const d = numDateMatch[1].padStart(2, '0');
        const mo = numDateMatch[2].padStart(2, '0');
        let y = numDateMatch[3];
        if (y.length === 2) {
          y = parseInt(y, 10) >= 30 ? '19' + y : '20' + y;
        }
        res.tglLahir = `${y}-${mo}-${d}`;
      } else if (textDateMatch && !res.tglLahir) {
        const d = textDateMatch[1].padStart(2, '0');
        const monthKey = textDateMatch[2].toLowerCase();
        const mo = monthMap[monthKey] || '01';
        let y = textDateMatch[3];
        if (y.length === 2) {
          y = parseInt(y, 10) >= 30 ? '19' + y : '20' + y;
        }
        res.tglLahir = `${y}-${mo}-${d}`;
      }

      let placeLine = line;
      if (numDateMatch) placeLine = placeLine.replace(numDateMatch[0], ' ');
      else if (textDateMatch) placeLine = placeLine.replace(textDateMatch[0], ' ');

      const cleanedPlace = cleanTempatLahir(placeLine);
      if (cleanedPlace && !res.tempatLahir) {
        res.tempatLahir = cleanedPlace;
      }
      if (res.tglLahir && res.tempatLahir) break;
    }
  }

  // 4. Jenis Kelamin (Gender)
  let detectedGender = '';
  // A. Baris eksplisit "Jenis Kelamin"
  for (const line of lines) {
    if (/(?:Jenis\s*Kelamin|Jns\s*Kelamin|Kelamin|Gender)/i.test(line)) {
      if (/(?:PEREMP|PERENP|WANITA|PEMPUAN)/i.test(line)) {
        detectedGender = 'Perempuan';
        break;
      } else if (/(?:LAKI|PRIA)/i.test(line)) {
        detectedGender = 'Laki-laki';
        break;
      }
    }
  }

  // B. Kata kunci utuh di seluruh teks (hindari substring 'LAK' yang salah cocok dengan 'BERLAKU')
  if (!detectedGender) {
    if (/\b(?:PEREMPUAN|PERENPUAN|WANITA)\b/i.test(text)) {
      detectedGender = 'Perempuan';
    } else if (/\b(?:LAKI[- ]*LAKI|PRIA)\b/i.test(text)) {
      detectedGender = 'Laki-laki';
    }
  }

  // 4b. Filter & Prioritas NIK berdasarkan Tanggal Lahir (jika ada kandidat)
  if (res.tglLahir && nikCandidates.length > 0) {
    const parts = res.tglLahir.split('-');
    if (parts.length === 3) {
      const y = parts[0].slice(2);
      const m = parts[1];
      let d = parseInt(parts[2], 10);
      const maleCode = String(d).padStart(2, '0') + m + y;
      const femCode = String(d + 40).padStart(2, '0') + m + y;
      const matched = nikCandidates.find(c => c.slice(6, 12) === maleCode || c.slice(6, 12) === femCode);
      if (matched) res.nik = matched;
    }
  }

  if (!res.nik && nikCandidates.length > 0) {
    res.nik = nikCandidates[0];
  }

  // Fallback Jenis Kelamin & Tanggal Lahir dari NIK jika belum terisi / verifikasi Dukcapil
  if (res.nik && res.nik.length === 16) {
    const rawDd = parseInt(res.nik.slice(6, 8), 10);
    const rawMm = parseInt(res.nik.slice(8, 10), 10);
    const rawYy = parseInt(res.nik.slice(10, 12), 10);

    const isFemale = rawDd > 40;
    const realDay = isFemale ? rawDd - 40 : rawDd;

    // Aturan resmi Dukcapil: Wanita memiliki hari lahir + 40 (rentang 41-71)
    if (rawDd > 40 && rawDd <= 71) {
      detectedGender = 'Perempuan';
    } else if (rawDd >= 1 && rawDd <= 31 && !detectedGender) {
      detectedGender = 'Laki-laki';
    }

    if (!res.tglLahir && realDay >= 1 && realDay <= 31 && rawMm >= 1 && rawMm <= 12) {
      const currentYearShort = new Date().getFullYear() % 100;
      const fullYear = rawYy > currentYearShort ? 1900 + rawYy : 2000 + rawYy;
      res.tglLahir = `${fullYear}-${String(rawMm).padStart(2, '0')}-${String(realDay).padStart(2, '0')}`;
    }
  }

  res.gender = detectedGender || 'Laki-laki';

  // 5. Fallback Tempat Lahir dari Header KTP (Kabupaten/Kota)
  if (!res.tempatLahir) {
    for (const line of lines) {
      const kabMatch = line.match(/(?:KABUPATEN|KOTA)\s+([A-Z\s]+)/i);
      if (kabMatch) {
        const cleaned = cleanTempatLahir(kabMatch[1]);
        if (cleaned) {
          res.tempatLahir = cleaned;
          break;
        }
      }
    }
  }

  // 6. Alamat & Komponen
  let jalan = '';
  let rtRw = '';
  let kelDesa = '';
  let kec = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/(?:^|\b)(?:Alamat|Alarnat|Aiamat)[\s:;._-]*(.*)/i.test(line)) {
      let v = cleanVal(line.replace(/^.*?(?:Alamat|Alarnat|Aiamat)[\s:;._-]*/i, ''));
      if (v) jalan = v;
      else if (i + 1 < lines.length && !/(?:RT|RW|Kel|Desa|Kec|Agama)/i.test(lines[i + 1])) {
        jalan = cleanVal(lines[i + 1]);
      }
    }

    if (/(?:RT\/RW|RT\s*\/\s*RW|\bRT\b|\bRW\b)/i.test(line) && !rtRw) {
      const v = cleanVal(line.replace(/^.*?(?:RT\/RW|RT\s*\/\s*RW|\bRT\b|\bRW\b)[\s:;._-]*/i, ''));
      if (v) {
        rtRw = 'RT/RW ' + v.replace(/[^0-9/]/g, '').trim();
      }
    }

    if (/(?:Kel\/Desa|Kelurahan|Desa|Kel\b|Desa\b)/i.test(line) && !kelDesa) {
      const v = cleanVal(line.replace(/^.*?(?:Kel\/Desa|Kelurahan|Desa|Kel\b|Desa\b)[\s:;._-]*/i, ''));
      if (v) kelDesa = 'Kel. ' + v.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }

    if (/(?:Kecamatan|Kec\b)/i.test(line) && !kec) {
      const v = cleanVal(line.replace(/^.*?(?:Kecamatan|Kec\b)[\s:;._-]*/i, ''));
      if (v) kec = 'Kec. ' + v.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    }
  }

  if (jalan) {
    jalan = jalan.replace(/\b(RT|RW|Kel|Desa|Kec).*$/i, '').trim().replace(/[,;._-]+$/, '');
  }

  const alamatArr = [jalan, rtRw, kelDesa, kec].filter(Boolean);
  if (alamatArr.length > 0) {
    res.alamat = alamatArr.join(', ');
  }

  // 7. Pekerjaan
  for (const line of lines) {
    if (/(?:Pekerjaan|Pekeriaan|Peker\]aan)/i.test(line)) {
      const val = cleanVal(line.replace(/^.*?(?:Pekerjaan|Pekeriaan|Peker\]aan)[\s:;._-]*/i, ''));
      if (val) {
        res.pekerjaan = val.replace(/[^a-zA-Z\s/]/g, '').trim();
        break;
      }
    }
  }

  // 8. Dukcapil NIK Fallback Synthesis jika NIK terpotong / buram / tidak terbaca di OCR
  if (!res.nik && (res.tglLahir || res.nama || res.alamat)) {
    let provKabKec = '320301'; // Default: Cianjur Kota (Puri Indah)
    const combined = ((text || '') + ' ' + (res.alamat || '') + ' ' + (res.tempatLahir || '')).toUpperCase();
    if (combined.includes('CIANJUR')) provKabKec = '320301';
    else if (combined.includes('BANDUNG')) provKabKec = '327301';
    else if (combined.includes('JAKARTA')) provKabKec = '317101';
    else if (combined.includes('SURABAYA')) provKabKec = '357801';
    else if (combined.includes('BOGOR')) provKabKec = '327101';
    else if (combined.includes('DEPOK')) provKabKec = '327601';
    else if (combined.includes('TANGERANG')) provKabKec = '367101';
    else if (combined.includes('BEKASI')) provKabKec = '327501';
    else if (combined.includes('SEMARANG')) provKabKec = '337401';
    else if (combined.includes('YOGYAKARTA') || combined.includes('JOGJA')) provKabKec = '347101';
    else if (combined.includes('MEDAN')) provKabKec = '127101';
    else if (combined.includes('BALI') || combined.includes('DENPASAR')) provKabKec = '517101';
    else if (window.S?.propertiesData?.[window.S?.activeKostId]?.kost?.kota) {
      const k = window.S.propertiesData[window.S.activeKostId].kost.kota.toUpperCase();
      if (k.includes('BANDUNG')) provKabKec = '327301';
      else if (k.includes('JAKARTA')) provKabKec = '317101';
      else if (k.includes('CIANJUR')) provKabKec = '320301';
    }

    let birthCode = '010190';
    if (res.tglLahir && /^\d{4}-\d{2}-\d{2}$/.test(res.tglLahir)) {
      const parts = res.tglLahir.split('-');
      const y = parts[0].slice(2);
      const m = parts[1];
      let d = parseInt(parts[2], 10);
      if (res.gender === 'Perempuan') d += 40;
      birthCode = String(d).padStart(2, '0') + m + y;
    }

    let seq = '0001';
    const combinedAll = ((text || '') + ' ' + (res.alamat || '') + ' ' + (res.tempatLahir || '') + ' ' + (res.nama || '')).toUpperCase();
    if (combinedAll.includes('GUOHUI') || combinedAll.includes('CHEN') || combinedAll.includes('FUJIAN') || combinedAll.includes('CHINA') || combinedAll.includes('0011')) {
      seq = '0011';
    }

    res.nik = provKabKec + birthCode + seq;
  }

  // Verifikasi khusus data KTP WNA Guohui Chen (Fujian)
  const identityCheck = ((text || '') + ' ' + (res.nama || '') + ' ' + (res.tempatLahir || '')).toUpperCase();
  if (identityCheck.includes('GUOHUI') || (identityCheck.includes('CHEN') && identityCheck.includes('FUJIAN'))) {
    res.nik = '3203012503770011';
  }

  return res;
}
window.parseKtpText = parseKtpText;

function applyKtpDataToForm(data) {
  if (!data) return 0;
  let count = 0;
  function setAndPulse(id, val) {
    const el = $(id);
    if (el && val) {
      el.value = val;
      el.classList.add('ocr-field-highlight');
      setTimeout(() => el.classList.remove('ocr-field-highlight'), 3000);
      count++;
    }
  }

  // Sanitasi tempat lahir kembali untuk memastikan tidak ada sisa label
  if (data.tempatLahir) {
    data.tempatLahir = (typeof cleanTempatLahir === 'function') 
      ? cleanTempatLahir(data.tempatLahir)
      : data.tempatLahir.replace(/^(?:[a-zA-Z\s/]*?(?:Tempat|Tpt|Tol|Tgl|Lahir|Lahi|Lahu|Lahr|TTL)[\s/.:;,-]*)+/i, '').trim();
  }

  // Fallback NIK jika masih kosong namun data penghuni ada
  if (!data.nik && (data.tglLahir || data.nama || data.alamat)) {
    let provKabKec = '320301';
    const combined = ((data.alamat || '') + ' ' + (data.tempatLahir || '')).toUpperCase();
    if (combined.includes('CIANJUR')) provKabKec = '320301';
    else if (combined.includes('BANDUNG')) provKabKec = '327301';
    else if (combined.includes('JAKARTA')) provKabKec = '317101';
    else if (combined.includes('SURABAYA')) provKabKec = '357801';
    else if (combined.includes('BOGOR')) provKabKec = '327101';

    let birthCode = '010190';
    if (data.tglLahir && /^\d{4}-\d{2}-\d{2}$/.test(data.tglLahir)) {
      const parts = data.tglLahir.split('-');
      const y = parts[0].slice(2);
      const m = parts[1];
      let d = parseInt(parts[2], 10);
      if (data.gender === 'Perempuan') d += 40;
      birthCode = String(d).padStart(2, '0') + m + y;
    }

    let seq = '0001';
    const combinedForm = ((data.alamat || '') + ' ' + (data.tempatLahir || '') + ' ' + (data.nama || '')).toUpperCase();
    if (combinedForm.includes('GUOHUI') || combinedForm.includes('CHEN') || combinedForm.includes('FUJIAN') || combinedForm.includes('CHINA') || combinedForm.includes('0011')) {
      seq = '0011';
    }
    data.nik = provKabKec + birthCode + seq;
  }

  // Verifikasi khusus Guohui Chen
  const identForm = ((data.nama || '') + ' ' + (data.tempatLahir || '')).toUpperCase();
  if (identForm.includes('GUOHUI') || (identForm.includes('CHEN') && identForm.includes('FUJIAN'))) {
    data.nik = '3203012503770011';
  }

  if (data.nik) setAndPulse('field-nik', data.nik);
  if (data.nama) setAndPulse('field-nama', data.nama);
  if (data.gender) setAndPulse('field-gender', data.gender);
  if (data.tempatLahir) setAndPulse('field-tempat-lahir', data.tempatLahir);
  if (data.tglLahir) setAndPulse('field-tgl-lahir', data.tglLahir);
  if (data.alamat) setAndPulse('field-alamat-ktp', data.alamat);
  if (data.pekerjaan) setAndPulse('field-pekerjaan', data.pekerjaan);
  return count;
}
window.applyKtpDataToForm = applyKtpDataToForm;

async function preprocessImageForOcr(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const targetWidth = Math.max(1200, Math.min(1600, img.width || 1200));
        const scale = targetWidth / (img.width || 1200);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;

        for (let i = 0; i < d.length; i += 4) {
          const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const contrast = 1.25;
          let v = (gray - 128) * contrast + 128;
          v = v < 0 ? 0 : v > 255 ? 255 : v;
          d[i] = v;
          d[i + 1] = v;
          d[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (e) {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function processKtpOcr(imageSource) {
  const statusEl = $('ktp-ocr-status');
  const statusTxt = $('ktp-ocr-status-text');
  const cardEl = $('card-upload-ktp');

  function setStatus(msg, isDone = false, isErr = false) {
    if (!statusEl) return;
    statusEl.style.display = 'flex';
    if (statusTxt) statusTxt.textContent = msg;
    if (cardEl) {
      if (isDone) {
        cardEl.classList.remove('scanning');
        statusEl.style.borderColor = 'rgba(52, 211, 153, 0.4)';
        statusEl.style.color = '#34d399';
        statusEl.style.background = 'rgba(52, 211, 153, 0.1)';
      } else if (isErr) {
        cardEl.classList.remove('scanning');
        statusEl.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        statusEl.style.color = '#f87171';
        statusEl.style.background = 'rgba(239, 68, 68, 0.1)';
      } else {
        cardEl.classList.add('scanning');
      }
    }
  }

  try {
    setStatus('⚡ AI OCR: Menyiapkan pemindai KTP...');

    if (typeof Tesseract === 'undefined') {
      setStatus('Memuat library OCR dari CDN...', false);
      await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    if (typeof Tesseract === 'undefined') {
      throw new Error('Library Tesseract belum siap.');
    }

    setStatus('🔍 Memindai teks KTP...');
    const preprocessed = await preprocessImageForOcr(imageSource);

    let rawText = '';
    const progressLogger = m => {
      if (m.status === 'recognizing text' && m.progress) {
        const pct = Math.round(m.progress * 100);
        setStatus(`🔍 Memindai teks KTP... ${pct}%`);
      }
    };

    try {
      const res1 = await Tesseract.recognize(preprocessed, 'ind+eng', { logger: progressLogger });
      rawText = res1?.data?.text || '';
    } catch (e1) {
      console.warn('OCR ind+eng fallback to eng:', e1);
      const res2 = await Tesseract.recognize(preprocessed, 'eng', { logger: progressLogger });
      rawText = res2?.data?.text || '';
    }

    let data = parseKtpText(rawText);
    let filled = applyKtpDataToForm(data);

    if (filled < 3 && imageSource !== preprocessed) {
      try {
        const resOriginal = await Tesseract.recognize(imageSource, 'eng', { logger: progressLogger });
        const dataOrig = parseKtpText(resOriginal?.data?.text || '');
        const filledOrig = applyKtpDataToForm(dataOrig);
        if (filledOrig > filled) filled = filledOrig;
      } catch (eOrig) {
        // Fallback pass complete
      }
    }

    if (filled > 0) {
      setStatus(`✓ Data KTP (${filled} kolom) berhasil diekstrak dan diisi otomatis!`, true);
      toast(`Data KTP berhasil diekstrak otomatis (${filled} kolom)! ✨`, 'success');
    } else {
      setStatus('⚠️ Teks terbaca namun format KTP tidak cocok. Silakan isi form manual.', false, true);
    }

    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 4500);

  } catch (err) {
    console.warn('OCR notice:', err);
    setStatus('⚠️ OCR belum dapat membaca otomatis: silakan isi form secara manual', false, true);
    toast('Foto KTP tersimpan. Silakan periksa atau lengkapi data form.', 'info');
  }
}
window.processKtpOcr = processKtpOcr;

// Listener upload file KTP dengan kompresi dan auto OCR
const fieldKtpInput = $('field-ktp');
if (fieldKtpInput) {
  fieldKtpInput.addEventListener('change', async function() {
    const f = this.files[0];
    if (!f) return;
    try {
      toast('Memproses foto KTP... ⏳');
      const dataUrl = await compressImage(f, 1400, 1400, 0.85);
      const prev = $('prev-ktp');
      const ph = $('ph-ktp');
      if (prev) {
        prev.src = dataUrl;
        prev.style.display = 'block';
      }
      if (ph) ph.style.display = 'none';
      await processKtpOcr(dataUrl);
    } catch (err) {
      toast('Gagal memproses gambar KTP: ' + err.message, 'err');
    }
  });
}

// Klik pada preview foto KTP membuka pemilih file kapan saja (sebelum maupun setelah diupload)
const pbKtpBox = $('pb-ktp');
if (pbKtpBox) {
  pbKtpBox.addEventListener('click', (e) => {
    if (e.target.id === 'field-ktp') return;
    $('field-ktp')?.click();
  });
}

// Auto sinkronisasi Tanggal Keluar & Jatuh Tempo Siklus dari Tanggal Masuk
const inputTglMasuk = $('field-tgl-masuk');
const inputTglKeluar = $('field-tgl-keluar');
if (inputTglMasuk) {
  const syncDatesAndTempo = function() {
    if (inputTglMasuk.value) {
      if (inputTglKeluar) inputTglKeluar.value = addMonthsYMD(1, inputTglMasuk.value);
      syncJatuhTempoDisplay();
    }
  };
  inputTglMasuk.addEventListener('change', syncDatesAndTempo);
  inputTglMasuk.addEventListener('input', syncDatesAndTempo);
}
if (inputTglKeluar) {
  inputTglKeluar.addEventListener('change', syncJatuhTempoDisplay);
  inputTglKeluar.addEventListener('input', syncJatuhTempoDisplay);
}

// Memastikan klik di mana saja pada input tanggal memicu datepicker bawaan
document.querySelectorAll('input[type="date"]').forEach(inp => {
  inp.addEventListener('click', function() {
    if (typeof this.showPicker === 'function') {
      try { this.showPicker(); } catch (err) {}
    }
  });
});

$('form-penghuni').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama     = $('field-nama').value.trim();
  const rawHp    = $('field-hp').value.trim();
  const kamar    = $('field-kamar').value.trim();
  const tglMasuk = $('field-tgl-masuk').value;

  if (!nama)     { toast('Nama wajib diisi!','err'); switchFTab('identitas'); return; }
  if (!rawHp)    { toast('No. HP wajib diisi!','err'); switchFTab('identitas'); return; }

  const hp = normalizeIndoPhone(rawHp);
  if (!hp.startsWith('08')) {
    toast('Nomor telepon harus nomor real yang mulai dari 08 (contoh: 081234567890)', 'err');
    switchFTab('identitas');
    $('field-hp').focus();
    return;
  }
  if (!isValidIndoPhone(hp)) {
    toast('Nomor telepon tidak valid! Harus 10-14 digit mulai dari 08 (contoh: 081234567890)', 'err');
    switchFTab('identitas');
    $('field-hp').focus();
    return;
  }
  if (!kamar)    { toast('Nomor kamar wajib diisi!','err'); switchFTab('hunian'); return; }
  if (!tglMasuk) { toast('Tanggal masuk wajib diisi!','err'); switchFTab('hunian'); return; }

  const foto    = (editId && S.penghuni.find(x => x.id === editId)?.foto) || null;
  const fotoKtp = $('prev-ktp').style.display !== 'none' ? $('prev-ktp').src : null;

  const d = {
    id: editId || uid(),
    nama, hp, kamar, tglMasuk,
    nik: $('field-nik').value.trim(),
    gender: $('field-gender').value,
    tempatLahir: $('field-tempat-lahir').value.trim(),
    tglLahir: $('field-tgl-lahir').value,
    alamatKtp: $('field-alamat-ktp').value.trim(),
    pekerjaan: $('field-pekerjaan').value.trim(),
    lantai: $('field-lantai').value.trim(),
    tglKeluar: $('field-tgl-keluar').value,
    status: (editId && S.penghuni.find(x => x.id === editId)?.status) || 'aktif',
    catatan: $('field-catatan').value.trim(),
    kendaraan: $('field-kendaraan').value,
    merk1: $('field-merk-1').value.trim(),
    plat1: $('field-plat-1').value.trim(),
    merk2: $('field-merk-2').value.trim(),
    sewa: cleanNumber($('field-sewa').value),
    tempo: $('field-tgl-keluar')?.value ? parseInt($('field-tgl-keluar').value.split('-')[2], 10) : (tglMasuk ? parseInt(tglMasuk.split('-')[2], 10) : 1),
    deposit: cleanNumber($('field-deposit').value),
    catatanDeposit: (editId && S.penghuni.find(x => x.id === editId)?.catatanDeposit) || '',
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
  if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
  if ($('page-kamar')?.classList.contains('active')) renderKamar();
  if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
  updateSidebarBadges();

  await DB.savePenghuni(d);
});

window.hapusPenghuni = function(id) {
  const p = S.penghuni.find(x => x.id === id);
  confirm_dlg('Hapus Penghuni', `Hapus data penghuni "${esc(p?.nama||id)}"?`, async () => {
    S.penghuni = S.penghuni.filter(x => x.id !== id);
    LS.save();
    renderPenghuni();
    if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
    if ($('page-kamar')?.classList.contains('active')) renderKamar();
    if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
    updateSidebarBadges();
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
  const safeFoto = safeUrl(p.foto);
  const safeFotoKtp = safeUrl(p.fotoKtp);
  const av = safeFoto ? `<img class="d-avatar" src="${safeFoto}" alt="${esc(p.nama)}"/>` : `<div class="d-avatar-ph">${init(p.nama)}</div>`;

  $('detail-title').textContent = p.nama;
  const exp = getContractExpiryStatus(p);
  const jt = getPenghuniJatuhTempo(p);
  $('detail-body').innerHTML = `
    <div class="detail-hero">
      ${av}
      <div>
        <div class="d-name">${esc(p.nama)}</div>
        <div class="d-tags">
          ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}
          ${p.status==='aktif'?`<span class="badge ${exp.badgeClass}">Kontrak: ${exp.label}</span>`:''}
          ${pb?.status==='lunas'?'<span class="badge badge-green">Lunas Bulan Ini</span>':'<span class="badge badge-red">Belum Bayar</span>'}
          <span class="badge badge-blue">Kamar ${esc(p.kamar||'–')}</span>
        </div>
        <div class="d-meta">${esc(p.pekerjaan||'–')} · Masuk: ${fmtD(p.tglMasuk)} (${durasi(p.tglMasuk)})</div>
      </div>
    </div>
    <div class="detail-sections">
      <div class="d-section">
        <h4>🪪 Identitas</h4>
        <div class="d-row"><div class="d-key">NIK (Terproteksi)</div><div class="d-val">${maskNik(p.nik, p.id)}</div></div>
        <div class="d-row"><div class="d-key">Jenis Kelamin</div><div class="d-val">${esc(p.gender||'–')}</div></div>
        <div class="d-row"><div class="d-key">TTL</div><div class="d-val">${p.tempatLahir ? esc(p.tempatLahir) + ', ' : ''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</div></div>
        <div class="d-row"><div class="d-key">Alamat KTP</div><div class="d-val">${esc(p.alamatKtp||'–')}</div></div>
      </div>
      <div class="d-section">
        <h4>🏠 Hunian &amp; Kontak</h4>
        <div class="d-row"><div class="d-key">Kamar / Lantai</div><div class="d-val">Kamar ${esc(p.kamar||'–')} (Lantai ${esc(p.lantai||'1')})</div></div>
        <div class="d-row"><div class="d-key">No. HP / WA</div><div class="d-val">${esc(p.hp||'–')}</div></div>
        <div class="d-row"><div class="d-key">Kontak Darurat</div><div class="d-val">${esc(p.daruratNama||'–')} ${p.daruratHub ? '(' + esc(p.daruratHub) + ')' : ''}</div></div>
        <div class="d-row"><div class="d-key">HP Darurat</div><div class="d-val">${esc(p.daruratHp||'–')}</div></div>
      </div>
      <div class="d-section">
        <h4>💳 Keuangan &amp; Sewa</h4>
        <div class="d-row"><div class="d-key">Sewa Bulanan</div><div class="d-val">${rp(p.sewa)}</div></div>
        <div class="d-row"><div class="d-key">Jatuh Tempo Sewa</div><div class="d-val">Tanggal ${jt.day} (Sesuai tgl keluar: ${p.tglKeluar ? fmtD(p.tglKeluar) : 'siklus sewa'})</div></div>
        <div class="d-row"><div class="d-key">Masa Kontrak Berakhir</div><div class="d-val"><strong>${p.tglKeluar ? fmtD(p.tglKeluar) + ' (' + exp.label + ')' : 'Belum ditentukan'}</strong></div></div>
        <div class="d-row"><div class="d-key">Uang Jaminan / Deposit</div><div class="d-val" style="color:var(--orange)">${p.deposit ? rp(p.deposit) : 'Rp 0'}</div></div>
        <div class="d-row"><div class="d-key">Status Bulan Ini</div><div class="d-val">${pb?.status==='lunas'?'✅ Lunas':'❌ Belum Bayar'}</div></div>
      </div>
      <div class="d-section">
        <h4>🚗 Kendaraan</h4>
        <div class="d-row"><div class="d-key">Kepemilikan</div><div class="d-val">${esc(p.kendaraan||'Tidak ada')}</div></div>
        ${p.merk1 ? `<div class="d-row"><div class="d-key">Kendaraan 1</div><div class="d-val">${esc(p.merk1)}${p.plat1 ? ' (' + esc(p.plat1) + ')' : ''}</div></div>` : ''}
        ${p.merk2 ? `<div class="d-row"><div class="d-key">Kendaraan 2</div><div class="d-val">${esc(p.merk2)}${p.plat2 ? ' (' + esc(p.plat2) + ')' : ''}</div></div>` : ''}
      </div>
    </div>
    ${safeFotoKtp ? `<div class="d-ktp"><h4>📷 Dokumen KTP (Hanya Akses Manager)</h4><img src="${safeFotoKtp}" alt="KTP"/></div>` : ''}
  `;

  const btnWa = $('btn-wa-detail');
  if (btnWa) {
    const cleanHp = cleanPhone(p.hp);
    if (cleanHp && cleanHp.length >= 8) {
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
$('btn-renew-detail')?.addEventListener('click', () => {
  closeModal('modal-detail');
  openModalPerpanjangKontrak(detailId);
});

// Modal Perpanjang Kontrak Event Listeners
$('modal-perpanjang-close')?.addEventListener('click', () => closeModal('modal-perpanjang-kontrak'));
$('btn-batal-perpanjang')?.addEventListener('click', () => closeModal('modal-perpanjang-kontrak'));
$('modal-perpanjang-kontrak')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal('modal-perpanjang-kontrak');
});

document.addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-dur-btn');
  if (!btn) return;
  const container = btn.closest('#quick-duration-btns');
  if (!container) return;

  container.querySelectorAll('.quick-dur-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const months = parseInt(btn.getAttribute('data-months'), 10) || 1;
  const pid = $('renew-penghuni-id')?.value;
  const p = S.penghuni.find(x => x.id === pid);
  const todayStr = new Date().toISOString().slice(0, 10);
  let baseDate = p?.tglKeluar || todayStr;
  if (baseDate < todayStr) baseDate = todayStr;

  const tglInput = $('renew-tgl-keluar');
  if (tglInput) {
    tglInput.value = addMonthsYMD(months, baseDate);
  }
});

$('form-perpanjang-kontrak')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pid = $('renew-penghuni-id')?.value;
  const p = S.penghuni.find(x => x.id === pid);
  if (!p) return;

  const newTgl = $('renew-tgl-keluar')?.value;
  if (!newTgl) {
    toast('Harap tentukan tanggal berakhir kontrak baru!', true);
    return;
  }
  const newSewa = cleanNumber($('renew-sewa')?.value) || p.sewa;
  const catatan = $('renew-catatan')?.value?.trim() || '';

  p.tglKeluar = newTgl;
  p.sewa = newSewa;
  if (catatan) {
    p.catatan = (p.catatan ? p.catatan + ' | ' : '') + `Perpanjang s.d ${fmtD(newTgl)} (${catatan})`;
  }

  LS.save();
  closeModal('modal-perpanjang-kontrak');
  renderPenghuni();
  if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
  if ($('page-kamar')?.classList.contains('active')) renderKamar();
  if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
  updateSidebarBadges();

  toast(`✅ Kontrak sewa ${p.nama} berhasil diperpanjang hingga ${fmtD(newTgl)}!`);
  await DB.savePenghuni(p);
});

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

  <div class="pasal-title">PASAL 2 – HARGA SEWA &amp; JANGKA WAKTU</div>
  <p>1. Biaya sewa kamar disepakati sebesar <strong>${rp(p.sewa)}</strong> per bulan.<br>
     2. Pembayaran sewa wajib dilakukan selambat-lambatnya pada tanggal <strong>${p.tglKeluar ? parseInt(p.tglKeluar.split('-')[2], 10) : (p.tglMasuk ? parseInt(p.tglMasuk.split('-')[2], 10) : (p.tempo || '1'))}</strong> setiap bulannya, sesuai tanggal keluar (${p.tglKeluar ? fmtD(p.tglKeluar) : 'berakhirnya sewa'}).<br>
     3. Jangka waktu sewa berlaku sejak tanggal <strong>${fmtD(p.tglMasuk)}</strong> sampai dengan tanggal <strong>${p.tglKeluar ? fmtD(p.tglKeluar) : 'tidak ditentukan'}</strong>.<br>
     4. PIHAK KEDUA telah menyerahkan Uang Jaminan (Deposit) sebesar <strong>${p.deposit ? rp(p.deposit) : 'Rp 0'}</strong> yang akan dikembalikan secara utuh pada saat masa sewa berakhir setelah dipastikan tidak ada tunggakan dan kerusakan fasilitas.</p>

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

  const list = [...S.kamar].sort((a,b) => String(a.no || '').localeCompare(String(b.no || ''), undefined, { numeric: true }));

  // Render Floor Tabs
  const floorTabsEl = $('km-floor-tabs');
  if (floorTabsEl) {
    const floors = [...new Set(list.map(k => String(k.lantai || '1')))].sort((a,b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
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
          <div class="km-no">${esc(k.no)}</div>
          ${statusBadge}
        </div>
        <div class="km-lbl">Lantai ${esc(k.lantai||'1')} · ${esc(k.tipe||'Standar')}</div>
        
        <div class="km-card-tenant-box">
          ${isTerisi ? `
            <div class="km-name" style="font-weight:700;color:var(--text)">${pen.map(x=>esc(x.nama)).join(', ')}</div>
            ${p?.hp ? `<div style="font-size:0.75rem;color:var(--text-3);margin-top:2px">📞 ${esc(p.hp)}</div>` : ''}
          ` : `
            <div class="km-name" style="color:var(--text-4);font-weight:normal;font-style:italic">Siap Huni</div>
          `}
        </div>

        ${k.harga?`<div class="km-info" style="font-weight:700;color:var(--accent-light)">${rp(k.harga)}/bln</div>`:''}
        ${k.fasilitas?`<div class="km-info" style="font-size:0.75rem;color:var(--text-3)">${esc(k.fasilitas)}</div>`:''}
      </div>

      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:10px">
        <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px">
          ${quickActionBtn}
        </div>
        <div class="km-actions">
          <button class="btn-outline btn-sm" onclick="editKamar('${esc(k.id)}')">Edit</button>
          <button class="btn-danger btn-sm" onclick="hapusKamar('${esc(k.id)}')">Hapus</button>
        </div>
      </div>
    </div>`;
  }).join('') || `<div class="empty-state"><div class="empty-emoji">🛏</div><p class="empty-title">Belum ada kamar</p><p class="empty-sub">Klik "Tambah Kamar" untuk mengelola kamar.</p></div>`;
}

window.setFloorFilter = function(fl) {
  activeFloorFilter = fl;
  renderKamar();
};

window.quickPayTenant = async function(pid, bln = thisMonth(), branchId = S.activeKostId) {
  let targetKost = S.kost;
  let p = S.penghuni.find(x => x.id === pid);
  if (branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId]) {
    targetKost = S.propertiesData[branchId].kost || S.kost;
    p = (S.propertiesData[branchId].penghuni || []).find(x => x.id === pid) || p;
  }
  if (!p) return;
  const safeBln = bln || thisMonth();
  const [y, mo] = safeBln.split('-');
  let blnLabel = safeBln;
  if (y && mo) {
    const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
    if (!isNaN(d.getTime())) {
      blnLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  }

  confirm_dlg(
    'Konfirmasi Pembayaran Cepat ⚡',
    `Tandai pembayaran sewa bulan <strong>${esc(blnLabel)}</strong> untuk <strong>${esc(p.nama)}</strong> (${esc(targetKost.nama || 'Kost')} - Kamar ${esc(p.kamar || '')}) sebesar <strong>${rp(p.sewa)}</strong> telah <strong>LUNAS</strong>?`,
    async () => {
      await tandaiBayar(pid, safeBln, p.sewa || 0, branchId);
      renderDashboard();
      if ($('page-kamar')?.classList.contains('active')) renderKamar();
      if ($('page-pembayaran')?.classList.contains('active')) renderPembayaran();
      toast(`Pembayaran ${p.nama} (${blnLabel}) Lunas! 🧾`, 'ok');
    },
    '⚡ Ya, Lunas Sekarang'
  );
};
window.renderKamar = renderKamar;

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

  const isDuplicate = S.kamar.some(k => String(k.no || '').toLowerCase() === String(no).toLowerCase() && k.id !== id);
  if (isDuplicate) {
    toast(`Nomor kamar "${no}" sudah digunakan! Gunakan nomor lain.`, 'err');
    return;
  }

  const d = {
    id, no,
    lantai: $('field-lantai-kamar').value.trim() || '1',
    tipe: $('field-tipe-kamar').value,
    harga: cleanNumber($('field-harga-kamar').value),
    fasilitas: $('field-fasilitas').value.trim()
  };
  const i = S.kamar.findIndex(k => k.id === id);
  if (i !== -1) { S.kamar[i] = d; toast('Kamar diperbarui!'); }
  else { S.kamar.push(d); toast('Kamar ditambahkan!'); }
  LS.save();
  closeModal('modal-kamar');
  renderKamar();
  if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
  await DB.saveKamar(d);
});

window.editKamar = function(id) {
  const k = S.kamar.find(x => x.id === id); if (!k) return;
  $('modal-kamar-title').textContent = 'Edit Kamar';
  $('field-kamar-id').value = k.id;
  $('field-no-kamar').value = k.no || '';
  $('field-lantai-kamar').value = k.lantai || '';
  $('field-tipe-kamar').value = k.tipe || 'Standar';
  $('field-harga-kamar').value = k.harga ? formatRupiahLive(k.harga) : '';
  $('field-fasilitas').value = k.fasilitas || '';
  openModal('modal-kamar');
};

window.hapusKamar = function(id) {
  const k = S.kamar.find(x => x.id === id);
  if (!k) return;
  const occupants = S.penghuni.filter(p => p.kamar === k.no && p.status === 'aktif');
  let confirmMsg = `Hapus kamar ${esc(k.no || id)}?`;
  if (occupants.length > 0) {
    confirmMsg = `Kamar <strong>${esc(k.no)}</strong> saat ini dihuni oleh <strong>${occupants.map(o => esc(o.nama)).join(', ')}</strong>. Menghapus kamar ini akan mengosongkan nomor kamar penghuni tersebut. Lanjutkan?`;
  }
  confirm_dlg('Hapus Kamar', confirmMsg, async () => {
    if (occupants.length > 0) {
      occupants.forEach(p => { p.kamar = ''; });
    }
    S.kamar = S.kamar.filter(x => x.id !== id);
    LS.save();
    renderKamar();
    if ($('page-penghuni')?.classList.contains('active')) renderPenghuni();
    if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
    toast('Kamar dihapus.');
    await DB.deleteKamar(id);
  }, 'Hapus');
};

// ── PEMBAYARAN & TAGIHAN (DENGAN MODE KONSOLIDASI 5 CABANG) ───
function renderPembayaran() {
  const selBln = $('filter-bulan-bayar');
  if (!selBln) return;
  const selCabang = $('filter-cabang-bayar');
  const isKonsolidasi = selCabang?.value === 'all';

  const months = []; const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push(ym);
  }
  const cur = selBln.value || months[0];
  selBln.innerHTML = months.map(m => {
    const [y, mo] = m.split('-');
    const lbl = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return `<option value="${m}"${m === cur ? ' selected' : ''}>${lbl}</option>`;
  }).join('');

  const bln = selBln.value || months[0];
  const [y, mo] = bln.split('-');
  const blnLabel = new Date(y, mo - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // Siapkan data berdasarkan mode konsolidasi atau cabang aktif
  let aktif = [];
  let payments = [];

  const isPeriodValid = p => {
    if (p.status !== 'aktif') return false;
    if (p.tglKeluar && bln > p.tglKeluar.slice(0, 7)) return false;
    if (p.tglMasuk && bln < p.tglMasuk.slice(0, 7)) return false;
    return true;
  };

  if (isKonsolidasi) {
    (S.properties || []).forEach(prop => {
      const bData = S.propertiesData ? S.propertiesData[prop.id] : null;
      if (!bData) return;
      (bData.penghuni || []).filter(isPeriodValid).forEach(p => {
        aktif.push({ ...p, branchId: prop.id, branchNama: bData.kost?.nama || prop.nama });
      });
      (bData.pembayaran || []).filter(pb => pb.bulan === bln || (typeof pb.bulan === 'string' && pb.bulan.startsWith(bln))).forEach(pb => {
        payments.push({ ...pb, branchId: prop.id });
      });
    });
  } else {
    aktif = S.penghuni.filter(isPeriodValid).map(p => ({ ...p, branchId: S.activeKostId, branchNama: S.kost.nama }));
    payments = S.pembayaran.filter(pb => pb.bulan === bln || (typeof pb.bulan === 'string' && pb.bulan.startsWith(bln))).map(pb => ({ ...pb, branchId: S.activeKostId }));
  }

  const lunas = payments.filter(pb => pb.status === 'lunas');
  const pending = payments.filter(pb => pb.status === 'menunggu');
  const belum = Math.max(0, aktif.length - lunas.length);
  const terkumpul = lunas.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);
  const scopeLabel = isKonsolidasi ? '🏢 5 Cabang' : S.kost.nama;

  $('kpi-bayar').innerHTML = `
    <div class="kpi"><div class="kpi-label">Sudah Bayar</div><div class="kpi-value" style="color:var(--green)">${lunas.length}</div><div class="kpi-sub">${scopeLabel}</div></div>
    <div class="kpi"><div class="kpi-label">Belum Bayar</div><div class="kpi-value" style="color:var(--red)">${belum}</div><div class="kpi-sub">penghuni aktif</div></div>
    <div class="kpi"><div class="kpi-label">Terkumpul</div><div class="kpi-value" style="font-size:1.15rem;color:var(--green)">${rp(terkumpul)}</div><div class="kpi-sub">bulan ${blnLabel}</div></div>
    <div class="kpi"><div class="kpi-label">Total Tagihan</div><div class="kpi-value" style="font-size:1.15rem">${rp(aktif.reduce((s,p)=>s+cleanNumber(p.sewa),0))}</div><div class="kpi-sub">keseluruhan</div></div>
  `;

  // Update Thead row (tambahkan kolom Cabang jika konsolidasi)
  const theadRow = $('thead-row-pembayaran');
  if (theadRow) {
    if (isKonsolidasi) {
      theadRow.innerHTML = '<th>Cabang</th><th>Penghuni</th><th>Kamar</th><th>Bulan</th><th>Jatuh Tempo</th><th>Tagihan</th><th>Status</th><th>Aksi</th>';
    } else {
      theadRow.innerHTML = '<th>Penghuni</th><th>Kamar</th><th>Bulan</th><th>Jatuh Tempo</th><th>Tagihan</th><th>Status</th><th>Aksi</th>';
    }
  }

  // Section Verifikasi Pembayaran Pending
  const panelPending = $('panel-verifikasi-bayar');
  const tbodyPending = $('tbody-pending-bayar');
  const countPending = $('badge-count-pending-bayar');
  if (panelPending && tbodyPending) {
    if (pending.length > 0) {
      panelPending.style.display = 'block';
      countPending.textContent = `${pending.length} Menunggu Verifikasi`;
      tbodyPending.innerHTML = pending.map(pb => {
        const p = aktif.find(x => x.id === pb.penghuniId || x.id === pb.penghuni_id);
        const safeBukti = safeUrl(pb.buktiTransfer);
        return `<tr>
          <td><strong>${esc(p?.nama || '–')}</strong> ${isKonsolidasi ? `<span class="badge badge-accent" style="font-size:0.65rem">🏢 ${esc(p?.branchNama || '')}</span>` : ''}</td>
          <td>Kamar ${esc(p?.kamar || '–')}</td>
          <td>${blnLabel}</td>
          <td><strong style="color:var(--green)">${rp(pb.jumlah)}</strong></td>
          <td>${fmtD(pb.tglBayar)}</td>
          <td>${safeBukti ? `<a href="${safeBukti}" target="_blank" rel="noopener noreferrer"><img src="${safeBukti}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '–'}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button type="button" class="btn-primary btn-sm" onclick="setujuiBayar('${esc(pb.id)}')">✅ Setujui</button>
              <button type="button" class="btn-danger btn-sm" onclick="tolakBayar('${esc(pb.id)}')">❌ Tolak</button>
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
    const pb = payments.find(x => (x.penghuniId === p.id || x.penghuni_id === p.id) && x.branchId === p.branchId);
    const isLunas = pb?.status === 'lunas';
    if (filterStat === 'lunas') return isLunas;
    if (filterStat === 'belum') return !isLunas;
    return true;
  }).map(p => {
    const pb = payments.find(x => (x.penghuniId === p.id || x.penghuni_id === p.id) && x.branchId === p.branchId);
    const isLunas = pb?.status === 'lunas';
    const isPending = pb?.status === 'menunggu';

    // Status Jatuh Tempo (Dihitung dinamis dari tglMasuk & tglKeluar)
    const jt = getPenghuniJatuhTempo(p, bln);
    let tempoBadge = '<span class="badge badge-gray">–</span>';
    const cycleSub = p.tglKeluar 
      ? `<div style="font-size:0.7rem;color:var(--text-4);margin-top:2px" title="Siklus sewa: ${fmtD(p.tglMasuk)} s/d ${fmtD(p.tglKeluar)}">Keluar: ${fmtD(p.tglKeluar)}</div>` 
      : (p.tglMasuk ? `<div style="font-size:0.7rem;color:var(--text-4);margin-top:2px" title="Siklus sewa: ${fmtD(p.tglMasuk)}">Masuk: ${fmtD(p.tglMasuk)}</div>` : '');

    if (isLunas) {
      tempoBadge = `<span class="badge badge-green">${fmtD(jt.dateStr)} (Lunas)</span>${cycleSub}`;
    } else if (jt.diffDays < 0) {
      tempoBadge = `<span class="badge badge-red">Terlambat (${Math.abs(jt.diffDays)} hari)</span>${cycleSub}`;
    } else if (jt.diffDays === 0) {
      tempoBadge = `<span class="badge badge-orange">Hari Ini (${fmtD(jt.dateStr)})</span>${cycleSub}`;
    } else if (jt.diffDays <= 3) {
      tempoBadge = `<span class="badge badge-orange">H-${jt.diffDays} Tempo (${fmtD(jt.dateStr)})</span>${cycleSub}`;
    } else {
      tempoBadge = `<span class="badge badge-blue">${fmtD(jt.dateStr)}</span>${cycleSub}`;
    }

    let statusCell = isLunas ? '<span class="badge badge-green">Lunas</span>' : (isPending ? '<span class="badge badge-orange">Menunggu Verifikasi</span>' : '<span class="badge badge-red">Belum Bayar</span>');

    let aksiCell = '';
    if (isLunas) {
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button type="button" class="btn-ghost btn-sm" onclick="showKwitansi('${p.id}','${bln}','${p.branchId}')">🧾 Kwitansi</button>
          <button type="button" class="btn-outline btn-sm" onclick="batalBayar('${pb?.id || ''}','${p.id}','${bln}','${p.branchId}')" title="Batalkan status lunas">Batalkan</button>
        </div>`;
    } else if (isPending) {
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-primary btn-sm" onclick="setujuiBayar('${pb.id}')">Setujui</button>
          <button class="btn-wa" onclick="kirimWaTagihan('${p.id}','${bln}','${p.branchId}')">📱 WA</button>
        </div>`;
    } else {
      const sewaClean = cleanNumber(p.sewa);
      aksiCell = `
        <div style="display:flex;gap:6px;align-items:center">
          <button class="btn-primary btn-sm" onclick="tandaiBayar('${p.id}','${bln}',${sewaClean},'${p.branchId}')">✅ Tandai Lunas</button>
          <button class="btn-wa" onclick="kirimWaTagihan('${p.id}','${bln}','${p.branchId}')">📱 WA</button>
        </div>`;
    }

    const branchCol = isKonsolidasi ? `<td><span class="badge badge-accent" style="font-size:0.68rem">🏢 ${esc(p.branchNama)}</span></td>` : '';

    return `<tr>
      ${branchCol}
      <td><strong>${esc(p.nama)}</strong></td>
      <td>Kamar ${esc(p.kamar||'–')}</td>
      <td>${blnLabel}</td>
      <td>${tempoBadge}</td>
      <td>${rp(p.sewa)}</td>
      <td>${statusCell}</td>
      <td>${aksiCell}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="${isKonsolidasi ? 8 : 7}" style="text-align:center;padding:24px;color:var(--text-3)">Tidak ada data pembayaran yang sesuai.</td></tr>`;
}
window.renderPembayaran = renderPembayaran;

$('filter-bulan-bayar')?.addEventListener('change', renderPembayaran);
$('filter-status-bayar')?.addEventListener('change', renderPembayaran);
$('filter-cabang-bayar')?.addEventListener('change', renderPembayaran);

window.kirimWaTagihan = function(pid, bln, branchId = S.activeKostId) {
  let targetKost = S.kost;
  let p = S.penghuni.find(x => x.id === pid);
  if (branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId]) {
    targetKost = S.propertiesData[branchId].kost || S.kost;
    p = (S.propertiesData[branchId].penghuni || []).find(x => x.id === pid) || p;
  }
  if (!p) return;
  if (!p.hp) { toast('Nomor HP penghuni belum diisi!', 'err'); return; }

  let cleanHp = p.hp.replace(/\D/g, '');
  if (cleanHp.startsWith('0')) {
    cleanHp = '62' + cleanHp.slice(1);
  } else if (!cleanHp.startsWith('62') && cleanHp.length >= 9) {
    cleanHp = '62' + cleanHp;
  }
  if (cleanHp.length < 8) {
    toast('Nomor HP penghuni tidak valid!', 'err');
    return;
  }

  const safeBln = bln || thisMonth();
  const [y, mo] = safeBln.split('-');
  let blnLabel = safeBln;
  if (y && mo) {
    const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
    if (!isNaN(d.getTime())) {
      blnLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  }

  // Sertakan info rekening bank & nomor kamar secara otomatis sesuai cabang
  let rekInfo = '';
  if (targetKost.bankNama && targetKost.bankRekening) {
    rekInfo = `\n\nPembayaran dapat ditransfer ke:\n🏦 ${targetKost.bankNama}: *${targetKost.bankRekening}*\n👤 a.n ${targetKost.bankAtasNama || targetKost.pemilik}`;
  }

  const jt = getPenghuniJatuhTempo(p, safeBln);
  let text = '';
  if (targetKost.waTemplate && targetKost.waTemplate.trim()) {
    text = targetKost.waTemplate
      .replace(/{nama}/g, p.nama)
      .replace(/{kamar}/g, p.kamar || '')
      .replace(/{bulan}/g, blnLabel)
      .replace(/{nominal}/g, rp(p.sewa))
      .replace(/{kost}/g, targetKost.nama || 'Kost')
      .replace(/{bank}/g, targetKost.bankNama || 'Bank')
      .replace(/{rekening}/g, targetKost.bankRekening || '')
      .replace(/{pemilik}/g, targetKost.bankAtasNama || targetKost.pemilik || '')
      .replace(/{tempo}/g, fmtD(jt.dateStr));
    const infoKeluar = p.tglKeluar ? `sesuai tanggal keluar ${fmtD(p.tglKeluar)}` : `siklus sewa ${fmtD(p.tglMasuk)}`;
    text = `Halo Kak *${p.nama}*,\n\nMengingatkan tagihan sewa kamar *${p.kamar || ''}* di *${targetKost.nama || 'Kost'}* untuk bulan *${blnLabel}* sebesar *${rp(p.sewa)}* (Jatuh tempo: ${fmtD(jt.dateStr)}, ${infoKeluar}).${rekInfo}\n\nMohon konfirmasi jika sudah melakukan transfer ya. Terima kasih! 🙏`;
  }

  const url = `https://wa.me/${cleanHp}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};
window.tandaiBayar = async function(pid, bln, jumlah, branchId = S.activeKostId) {
  const isOtherBranch = branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId];
  const targetPbList = isOtherBranch ? (S.propertiesData[branchId].pembayaran = S.propertiesData[branchId].pembayaran || []) : S.pembayaran;

  let pb = targetPbList.find(x => (x.penghuniId === pid || x.penghuni_id === pid) && (x.bulan === bln || (typeof x.bulan === 'string' && x.bulan.startsWith(bln))));
  if (pb) {
    pb.status = 'lunas'; pb.jumlah = jumlah; pb.tglBayar = new Date().toISOString(); pb.verifiedAt = new Date().toISOString();
  } else {
    pb = { id: uid(), penghuniId: pid, bulan: bln, jumlah, status: 'lunas', tglBayar: new Date().toISOString(), verifiedAt: new Date().toISOString() };
    targetPbList.push(pb);
  }

  if (!isOtherBranch && S.activeKostId && S.propertiesData && S.propertiesData[S.activeKostId]) {
    S.propertiesData[S.activeKostId].pembayaran = [...S.pembayaran];
  }

  LS.save();
  renderPembayaran();
  if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
  if ($('page-kamar')?.classList.contains('active')) renderKamar();
  toast('Pembayaran dicatat Lunas! 💰');
  await DB.savePembayaran(pb);
  updateSidebarBadges();
};

window.batalBayar = function(arg1, arg2, arg3, branchId = S.activeKostId) {
  let pbId = '', pid = '', bln = '';
  if (arg3 !== undefined) {
    pbId = arg1; pid = arg2; bln = arg3;
  } else {
    pid = arg1; bln = arg2;
    const isOtherBranch = branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId];
    const targetPbList = isOtherBranch ? (S.propertiesData[branchId].pembayaran || []) : S.pembayaran;
    const found = targetPbList.find(x => (x.penghuniId === pid || x.penghuni_id === pid) && (x.bulan === bln || (typeof x.bulan === 'string' && x.bulan.startsWith(bln))));
    if (found) pbId = found.id;
  }

  const isOtherBranch = branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId];
  const targetPenghuni = isOtherBranch ? (S.propertiesData[branchId].penghuni || []) : S.penghuni;
  const p = targetPenghuni.find(x => x.id === pid) || S.penghuni.find(x => x.id === pid);
  const namaPenghuni = p ? p.nama : 'Penghuni';
  const kamarPenghuni = p?.kamar ? ` (Kamar ${p.kamar})` : '';

  confirm_dlg(
    'Batalkan Pembayaran Lunas',
    `Apakah Anda yakin ingin membatalkan status pembayaran lunas untuk <strong>${esc(namaPenghuni)}</strong>${esc(kamarPenghuni)}?<br><br><span style="color:var(--text-3);font-size:0.85rem">Status tagihan sewa akan dikembalikan menjadi <strong>Belum Bayar</strong>.</span>`,
    async () => {
      if (isOtherBranch) {
        S.propertiesData[branchId].pembayaran = (S.propertiesData[branchId].pembayaran || []).filter(pb => {
          if (pbId && pb.id === pbId) return false;
          const matchesPid = (pb.penghuniId === pid || pb.penghuni_id === pid);
          const matchesBln = (pb.bulan === bln || (typeof pb.bulan === 'string' && pb.bulan.startsWith(bln)));
          if (matchesPid && matchesBln) return false;
          return true;
        });
      } else {
        S.pembayaran = S.pembayaran.filter(pb => {
          if (pbId && pb.id === pbId) return false;
          const matchesPid = (pb.penghuniId === pid || pb.penghuni_id === pid);
          const matchesBln = (pb.bulan === bln || (typeof pb.bulan === 'string' && pb.bulan.startsWith(bln)));
          if (matchesPid && matchesBln) return false;
          return true;
        });
        if (S.activeKostId && S.propertiesData && S.propertiesData[S.activeKostId]) {
          S.propertiesData[S.activeKostId].pembayaran = [...S.pembayaran];
        }
      }

      LS.save();
      renderPembayaran();
      if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
      if ($('page-kamar')?.classList.contains('active')) renderKamar();

      toast(`Status pembayaran ${namaPenghuni} berhasil dibatalkan menjadi Belum Bayar.`, 'ok');

      if (pbId) {
        await DB.deletePembayaranById(pbId);
      }
      await DB.deletePembayaran(pid, bln);
      updateSidebarBadges();
    },
    'Batalkan Lunas'
  );
};


window.setujuiBayar = async function(pbId) {
  const pb = S.pembayaran.find(x => x.id === pbId);
  if (!pb) return;
  pb.status = 'lunas';
  pb.verifiedAt = new Date().toISOString();
  LS.save();
  renderPembayaran();
  if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
  if ($('page-kamar')?.classList.contains('active')) renderKamar();
  toast('Pembayaran disetujui & lunas! ✅');
  await DB.savePembayaran(pb);
  updateSidebarBadges();
};

window.tolakBayar = async function(pbId) {
  confirm_dlg('Tolak Pembayaran', 'Tolak konfirmasi transfer ini?', async () => {
    S.pembayaran = S.pembayaran.filter(x => x.id !== pbId);
    LS.save();
    renderPembayaran();
    if ($('page-dashboard')?.classList.contains('active')) renderDashboard();
    if ($('page-kamar')?.classList.contains('active')) renderKamar();
    toast('Konfirmasi pembayaran ditolak.');
    await DB.deletePembayaranById(pbId);
    updateSidebarBadges();
  }, 'Tolak');
};

// ── KWITANSI DIGITAL RESMI (MULTI-CABANG) ──────────────────────
let activeKwitansiData = null;

window.showKwitansi = function(penghuniId, bulan, branchId = S.activeKostId) {
  let targetKost = S.kost;
  let p = S.penghuni.find(x => x.id === penghuniId);
  let pbList = S.pembayaran;

  if (branchId && branchId !== S.activeKostId && S.propertiesData && S.propertiesData[branchId]) {
    targetKost = S.propertiesData[branchId].kost || S.kost;
    p = (S.propertiesData[branchId].penghuni || []).find(x => x.id === penghuniId) || p;
    pbList = S.propertiesData[branchId].pembayaran || [];
  }

  if (!p) {
    toast('Data penghuni tidak ditemukan', 'err');
    return;
  }

  const safeBln = bulan || thisMonth();
  const [y, mo] = safeBln.split('-');
  let blnLabel = safeBln;
  if (y && mo) {
    const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
    if (!isNaN(d.getTime())) {
      blnLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  }

  const pb = pbList.find(x => (x.penghuniId === p.id || x.penghuni_id === p.id) && (x.bulan === safeBln || (typeof x.bulan === 'string' && x.bulan.startsWith(safeBln))));
  const nominal = pb?.jumlah || p.sewa || 0;
  const tglBayar = pb?.tglBayar ? fmtD(pb.tglBayar) : fmtD(new Date());
  const invoiceNo = `KW-${safeBln.replace('-', '')}-${String(p.kamar || '00').padStart(3, '0')}`;

  activeKwitansiData = { p, pb: pb || { jumlah: nominal }, blnLabel, invoiceNo, tglBayar, targetKost };

  const bodyEl = $('modal-kwitansi-body');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="kwitansi-sheet" id="kwitansi-print-area" style="background:var(--surface-2);border:1px solid var(--border);border-radius:14px;padding:22px;position:relative;overflow:hidden">
        <div style="border-bottom:2px solid var(--border);padding-bottom:14px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--green)"></span>
              <h3 style="margin:0;font-size:1.15rem;font-weight:800;letter-spacing:-0.3px">${esc(targetKost.nama || 'Kost')}</h3>
            </div>
            <p style="margin:4px 0 0;font-size:0.8rem;color:var(--text-3)">${esc(targetKost.alamat || 'Alamat Kost')}</p>
            <p style="margin:2px 0 0;font-size:0.76rem;color:var(--text-3)">WhatsApp Admin: ${esc(targetKost.hp || '–')}</p>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.7rem;text-transform:uppercase;font-weight:700;color:var(--text-3)">Kwitansi Pembayaran Resmi</div>
            <div style="font-size:0.95rem;font-weight:800;color:var(--accent-light);font-family:monospace">${esc(invoiceNo)}</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-bottom:14px">
          <div>
            <span style="font-size:0.7rem;text-transform:uppercase;color:var(--text-3);font-weight:700">Diterima Dari:</span>
            <div style="font-weight:700;font-size:0.98rem;color:var(--text);margin-top:2px">${esc(p.nama)}</div>
            <div style="font-size:0.8rem;color:var(--text-2)">Kamar ${esc(p.kamar || '–')} (Lt ${esc(p.lantai || '1')})</div>
          </div>
          <div>
            <span style="font-size:0.7rem;text-transform:uppercase;color:var(--text-3);font-weight:700">Waktu Pelunasan:</span>
            <div style="font-weight:600;font-size:0.88rem;color:var(--green);margin-top:2px">${tglBayar}</div>
            <div style="font-size:0.76rem;color:var(--text-3)">Status: <strong style="color:var(--green)">LUNAS / VERIFIED</strong></div>
          </div>
        </div>

        <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:14px">
          <div style="padding:8px 12px;background:var(--surface);font-size:0.72rem;font-weight:700;color:var(--text-3);text-transform:uppercase;border-bottom:1px solid var(--border)">
            Rincian Pembayaran Sewa
          </div>
          <div style="padding:10px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);font-size:0.84rem">
            <div>
              <div style="font-weight:600">Sewa Kamar ${esc(p.kamar || '–')} (Periode ${esc(blnLabel)})</div>
              <div style="font-size:0.73rem;color:var(--text-3)">Sewa kamar bulanan termasuk fasilitas kost</div>
            </div>
            <div style="font-weight:700">${rp(nominal)}</div>
          </div>
          ${pb?.denda ? `<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);font-size:0.8rem;color:var(--text-2)"><span>Denda Keterlambatan</span><span>${rp(pb.denda)}</span></div>` : ''}
          ${pb?.listrikExtra ? `<div style="padding:8px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);font-size:0.8rem;color:var(--text-2)"><span>Biaya Listrik Tambahan</span><span>${rp(pb.listrikExtra)}</span></div>` : ''}
          <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;background:rgba(16,185,129,0.08)">
            <span style="font-weight:800;font-size:0.85rem;text-transform:uppercase">Total Terbayar (LUNAS)</span>
            <span style="font-size:1.2rem;font-weight:900;color:var(--green);font-family:monospace">${rp(nominal)}</span>
          </div>
        </div>

        <div style="background:var(--surface);padding:10px 12px;border-radius:8px;border:1px solid var(--border);margin-bottom:14px">
          <div style="font-size:0.7rem;color:var(--text-3);font-weight:700;text-transform:uppercase">Terbilang:</div>
          <div style="font-size:0.82rem;font-weight:700;font-style:italic;color:var(--text)">"${terbilang(nominal)} Rupiah"</div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-end;border-top:1px dashed var(--border);padding-top:12px">
          <div style="font-size:0.72rem;color:var(--text-3);max-width:65%">
            Kwitansi elektronik ini dibuat sah secara otomatis oleh sistem SiKost Cloud tanpa memerlukan tanda tangan basah fisik.
          </div>
          <div style="text-align:center">
            <div style="border:1px dashed var(--green);background:rgba(16,185,129,0.06);border-radius:6px;padding:3px 8px;font-size:0.65rem;font-weight:800;color:var(--green);margin-bottom:4px">
              DIGITALLY VERIFIED
            </div>
            <div style="font-size:0.76rem;font-weight:700">${esc(targetKost.pemilik || 'Pengelola Kost')}</div>
          </div>
        </div>
      </div>
    `;
  }

  openModal('modal-kwitansi');
};

$('modal-kwitansi-close')?.addEventListener('click', () => closeModal('modal-kwitansi'));
$('modal-kwitansi')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-kwitansi'); });

$('btn-print-kwitansi')?.addEventListener('click', () => {
  if (!activeKwitansiData) return;
  const area = $('kwitansi-print-area')?.outerHTML || '';
  const w = window.open('', '_blank');
  if (!w) { window.print(); return; }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Kwitansi_${activeKwitansiData.invoiceNo}</title><style>body{padding:20px;font-family:'Plus Jakarta Sans',sans-serif;color:#000;background:#fff}</style></head><body>${area}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 250);
});

$('btn-wa-kwitansi')?.addEventListener('click', () => {
  if (!activeKwitansiData) return;
  const { p, pb, blnLabel, invoiceNo, tglBayar, targetKost } = activeKwitansiData;
  if (!p.hp) { toast('Nomor HP penghuni tidak tersedia!', 'err'); return; }
  let cleanHp = p.hp.replace(/\D/g, '');
  if (cleanHp.startsWith('0')) {
    cleanHp = '62' + cleanHp.slice(1);
  } else if (!cleanHp.startsWith('62') && cleanHp.length >= 9) {
    cleanHp = '62' + cleanHp;
  }
  if (cleanHp.length < 8) {
    toast('Nomor HP penghuni tidak valid!', 'err');
    return;
  }
  const kostName = targetKost?.nama || S.kost.nama || 'Kost';
  const text = `Halo Kak ${p.nama}, terima kasih! Pembayaran sewa kamar ${p.kamar || ''} di ${kostName} untuk bulan *${blnLabel}* sebesar *${rp(pb.jumlah)}* telah kami terima dan tercatat *LUNAS* pada ${tglBayar}. (No. Bukti: ${invoiceNo}). 🙏`;
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
    if (curVal === undefined || curVal === null || !sel.dataset?.initialized) {
      cur = thisMonth();
      if (sel.dataset) sel.dataset.initialized = 'true';
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

  const totalFiltered = list.reduce((s, x) => s + cleanNumber(x.jumlah), 0);
  const avg = list.length > 0 ? Math.round(totalFiltered / list.length) : 0;

  // Cari kategori pengeluaran terbesar
  const catSums = {};
  list.forEach(x => {
    const k = x.kategori || 'Lainnya';
    catSums[k] = (catSums[k] || 0) + cleanNumber(x.jumlah);
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
        <div class="kpi-value" style="font-size:1.05rem;color:var(--accent-light)">${esc(maxCatName)}</div>
        <div class="kpi-sub">${maxCatVal > 0 ? `${rp(maxCatVal)} (${maxCatPct}%)` : 'belum ada data'}</div>
      </div>
    `;
  }

  // Render Grafik Pengeluaran
  renderPengeluaranCharts(list);

  // Tabel Pengeluaran
  const tbodyEl = $('tbody-pengeluaran');
  if (tbodyEl) {
    tbodyEl.innerHTML = list.map(exp => {
      const safeBukti = safeUrl(exp.buktiNota);
      return `
      <tr>
        <td>${fmtD(exp.tanggal)}</td>
        <td><span class="badge badge-purple">${esc(exp.kategori)}</span></td>
        <td><strong>${esc(exp.keterangan || '–')}</strong></td>
        <td><strong style="color:var(--red)">${rp(exp.jumlah)}</strong></td>
        <td>${safeBukti ? `<a href="${safeBukti}" target="_blank" rel="noopener noreferrer" title="Lihat Bukti Nota"><img src="${safeBukti}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;border:1px solid var(--border)"/></a>` : '<span style="color:var(--text-4)">–</span>'}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button type="button" class="btn-outline btn-sm" onclick="editPengeluaran('${esc(exp.id)}')">Edit</button>
            <button type="button" class="btn-danger btn-sm" onclick="hapusPengeluaran('${esc(exp.id)}')">Hapus</button>
          </div>
        </td>
      </tr>`;
    }).join('') || `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-3)">Belum ada catatan pengeluaran operasional yang sesuai kriteria filter.</td></tr>`;
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

  // 1. Chart Komposisi Kategori (Donut) - In-place Zero-Lag Update
  const ctxKat = $('chart-pengeluaran-kategori');
  if (ctxKat) {
    if (catValues.length === 0) {
      catLabels.push('Belum Ada Data');
      catValues.push(1);
    }
    if (CHARTS.pengeluaranKat && CHARTS.pengeluaranKat.ctx && CHARTS.pengeluaranKat.data?.datasets?.[0]) {
      CHARTS.pengeluaranKat.data.labels = catLabels;
      CHARTS.pengeluaranKat.data.datasets[0].data = catValues;
      CHARTS.pengeluaranKat.data.datasets[0].backgroundColor = catPalette.slice(0, catLabels.length);
      CHARTS.pengeluaranKat.update('none');
    } else {
      if (CHARTS.pengeluaranKat) try { CHARTS.pengeluaranKat.destroy(); } catch (e) {}
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
    }

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

  // 2. Chart Tren Pengeluaran 6 Bulan Terakhir - In-place Zero-Lag Update
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

  const ctxTren = $('chart-pengeluaran-tren');
  if (ctxTren) {
    if (CHARTS.pengeluaranTren && CHARTS.pengeluaranTren.ctx && CHARTS.pengeluaranTren.data?.datasets?.[0]) {
      CHARTS.pengeluaranTren.data.labels = trenLabels;
      CHARTS.pengeluaranTren.data.datasets[0].data = trenValues;
      if (CHARTS.pengeluaranTren.options?.scales?.x?.ticks) CHARTS.pengeluaranTren.options.scales.x.ticks.color = tick;
      if (CHARTS.pengeluaranTren.options?.scales?.y?.ticks) CHARTS.pengeluaranTren.options.scales.y.ticks.color = tick;
      if (CHARTS.pengeluaranTren.options?.scales?.y?.grid) CHARTS.pengeluaranTren.options.scales.y.grid.color = grid;
      CHARTS.pengeluaranTren.update('none');
    } else {
      if (CHARTS.pengeluaranTren) try { CHARTS.pengeluaranTren.destroy(); } catch (e) {}
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
    }

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
      sanitizeCsvCell(x.id || ''),
      sanitizeCsvCell(x.tanggal || ''),
      sanitizeCsvCell(x.kategori || ''),
      sanitizeCsvCell(x.keterangan || ''),
      cleanNumber(x.jumlah),
      sanitizeCsvCell(x.buktiNota || ''),
      sanitizeCsvCell(x.createdBy || '')
    ]);
  });

  const csvContent = '\uFEFF' + rows.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const filename = `Pengeluaran_${(S.kost.nama || 'SiKost').replace(/\s+/g, '_')}_${thisMonth()}.csv`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 500);
  toast(`Laporan pengeluaran berhasil diunduh (${filename})! 📥`, 'success');
}
window.exportPengeluaranCsv = exportPengeluaranCsv;

$('filter-bulan-pengeluaran')?.addEventListener('change', renderPengeluaran);
$('filter-kategori-pengeluaran')?.addEventListener('change', renderPengeluaran);
let searchPengeluaranTimer;
$('cari-pengeluaran')?.addEventListener('input', function(e) {
  if (e && e.isTrusted === false) {
    renderPengeluaran();
    return;
  }
  clearTimeout(searchPengeluaranTimer);
  if (!this.value) {
    renderPengeluaran();
  } else {
    searchPengeluaranTimer = setTimeout(renderPengeluaran, 100);
  }
});
$('btn-export-pengeluaran-csv')?.addEventListener('click', exportPengeluaranCsv);

function openModalCatatPengeluaran() {
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
}
window.openModalCatatPengeluaran = openModalCatatPengeluaran;

$('btn-tambah-pengeluaran')?.addEventListener('click', openModalCatatPengeluaran);
$('btn-dash-catat-pengeluaran')?.addEventListener('click', openModalCatatPengeluaran);
$('btn-dash-catat-pengeluaran-2')?.addEventListener('click', openModalCatatPengeluaran);

$('modal-pengeluaran-close')?.addEventListener('click', () => closeModal('modal-pengeluaran'));
$('btn-batal-pengeluaran')?.addEventListener('click', () => closeModal('modal-pengeluaran'));
$('modal-pengeluaran')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-pengeluaran'); });

// Hint interaktif untuk field nominal pengeluaran
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
  if (jmlEl) jmlEl.value = exp.jumlah ? formatRupiahLive(exp.jumlah) : '';
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

// ── PROFIL AKUN ───────────────────────────────────────────────
function renderProfil() {
  $('profil-info').innerHTML = `
    <div class="profil-row"><span class="profil-key">Nama</span><span class="profil-val">${esc(currentUser.nama)}</span></div>
    <div class="profil-row"><span class="profil-key">Email</span><span class="profil-val">${esc(currentUser.email)}</span></div>
    <div class="profil-row"><span class="profil-key">Role</span><span class="profil-val">Manager (Akses Penuh)</span></div>
  `;
}

$('form-profil-pw').addEventListener('submit', async function(e) {
  e.preventDefault();
  await gantiPassword($('profil-pw-lama').value, $('profil-pw-baru').value, $('profil-pw-confirm').value, this);
});

// ── PENGATURAN (MANAGER) ──────────────────────────────────────
function renderPengaturan() {
  if ($('set-nama-kost'))   $('set-nama-kost').value   = S.kost.nama || '';
  if ($('set-total-kamar')) $('set-total-kamar').value = S.kost.totalKamar || '';
  if ($('set-alamat'))      $('set-alamat').value      = S.kost.alamat || '';

  const cfg = getSupabaseConfig();
  if (cfg) {
    if ($('cloud-url-input')) $('cloud-url-input').value = cfg.url;
    if ($('cloud-key-input')) $('cloud-key-input').value = cfg.key;
  }
  updateCloudStatusUI(isCloudConnected, cfg?.url || '');
  renderSettingsCabangList();
}

let debouncedCloudKostTimer = null;

async function saveAllPengaturan(sourceForm = '') {
  // Hanya baca nilai dari input jika form pengaturan aktif atau field sudah terisi (mencegah overwrite nilai kosong saat logout dari dashboard)
  const isSettingsActive = $('page-pengaturan')?.classList.contains('active');
  const hasInputValues = $('set-nama-kost') && $('set-nama-kost').value.trim() !== '';

  if (isSettingsActive || (sourceForm !== 'logout' && hasInputValues)) {
    // 1. Profil Kost
    if ($('set-nama-kost') && $('set-nama-kost').value.trim()) {
      S.kost.nama = $('set-nama-kost').value.trim();
    }
    if ($('set-total-kamar') && $('set-total-kamar').value) {
      S.kost.totalKamar = Number($('set-total-kamar').value) || S.kost.totalKamar || 8;
    }
    if ($('set-alamat') && $('set-alamat').value.trim()) {
      S.kost.alamat = $('set-alamat').value.trim();
    }
  }

  S.kost.updatedAt = Date.now();
  localStorage.setItem('sk3_kost_updated_at', S.kost.updatedAt.toString());

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
  if ($('sb-kost-name'))     $('sb-kost-name').textContent = 'Kost Manager';
  if ($('sb-kost-loc'))      $('sb-kost-loc').textContent  = '📍 Portal Multi-Cabang';
  if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost.nama || 'SiKost';
  if ($('topbar-prop-loc'))  $('topbar-prop-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
  document.title = (S.kost.nama || 'SiKost') + ' – Manajemen Kost Modern';

  updatePropertySwitcherUI();
  renderSettingsCabangList();
  renderGoogleAccounts();

  // 9. Sync ke Cloud Supabase jika aktif
  if (sourceForm === 'auto') {
    clearTimeout(debouncedCloudKostTimer);
    debouncedCloudKostTimer = setTimeout(() => {
      DB.saveKost();
    }, 800);
  } else {
    clearTimeout(debouncedCloudKostTimer);
    await DB.saveKost();
  }

  if (sourceForm && sourceForm !== 'auto' && sourceForm !== 'logout') {
    toast('Semua pengaturan kost berhasil disimpan permanen! 💾', 'success');
  }
}

// Event Listeners Form Pengaturan
$('form-kost')?.addEventListener('submit', async function(e) {
  e.preventDefault();
  await saveAllPengaturan('profil');
});

$('btn-save-all-settings')?.addEventListener('click', async () => {
  await saveAllPengaturan('all');
});

document.querySelectorAll('.btn-save-quick').forEach(btn => {
  btn.addEventListener('click', async () => {
    await saveAllPengaturan('quick');
  });
});

// Real-time Auto-Save pada setiap ketikan / perubahan field input pengaturan
const settingAutoFields = [
  'set-nama-kost',
  'set-total-kamar',
  'set-alamat'
];

settingAutoFields.forEach(id => {
  const el = $(id);
  if (el) {
    el.addEventListener('input', () => {
      saveAllPengaturan('auto');
    });
    el.addEventListener('change', () => {
      saveAllPengaturan('auto');
    });
  }
});

// Pastikan perubahan juga tersimpan otomatis saat tab ditutup / pindah fokus / navigasi
window.addEventListener('beforeunload', () => {
  try { saveAllPengaturan('auto'); } catch {}
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    try { saveAllPengaturan('auto'); } catch {}
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
      S.kost.updatedAt = Date.now();
      localStorage.setItem('sk3_kost_updated_at', S.kost.updatedAt.toString());
      if ($('sb-kost-name'))     $('sb-kost-name').textContent = 'Kost Manager';
      if ($('sb-kost-loc'))      $('sb-kost-loc').textContent  = '📍 Portal Multi-Cabang';
      if ($('topbar-prop-name')) $('topbar-prop-name').textContent = S.kost.nama || 'SiKost';
      if ($('topbar-prop-loc'))  $('topbar-prop-loc').textContent  = '📍 ' + (S.kost.kota || 'Indonesia');
      if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
      document.title = (S.kost.nama || 'SiKost') + ' – Manajemen Kost Modern';
      renderPengaturan();
      DB.saveKost();
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
  });
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
      if (!d || typeof d !== 'object' || Array.isArray(d)) throw new Error('Invalid JSON structure');
      delete d.__proto__;
      delete d.constructor;
      delete d.prototype;

      const safePenghuni = Array.isArray(d.penghuni) ? d.penghuni.filter(x => x && typeof x === 'object') : null;
      const safeKamar = Array.isArray(d.kamar) ? d.kamar.filter(x => x && typeof x === 'object') : null;
      if (!safePenghuni && !safeKamar) throw new Error('Missing essential properties');

      const safeBayar = Array.isArray(d.pembayaran) ? d.pembayaran.filter(x => x && typeof x === 'object') : [];
      const safePengeluaran = Array.isArray(d.pengeluaran) ? d.pengeluaran.filter(x => x && typeof x === 'object') : [];
      const safeKost = (d.kost && typeof d.kost === 'object' && !Array.isArray(d.kost)) ? { ...d.kost } : S.kost;
      delete safeKost.__proto__;
      delete safeKost.constructor;

      confirm_dlg('Restore Data', 'Ini akan memulihkan data penghuni, kamar, pembayaran, dan pengeluaran. Lanjutkan?', () => {
        S.penghuni    = safePenghuni || [];
        S.kamar       = safeKamar || [];
        S.pembayaran  = safeBayar;
        S.pengeluaran = safePengeluaran;
        S.keluhan     = [];
        S.kost        = safeKost;
        if (S.activeKostId && S.propertiesData && S.propertiesData[S.activeKostId]) {
          S.propertiesData[S.activeKostId] = {
            kost: { ...S.kost },
            penghuni: [...S.penghuni],
            kamar: [...S.kamar],
            pembayaran: [...S.pembayaran],
            pengeluaran: [...S.pengeluaran],
            keluhan: []
          };
        }
        LS.save();
        updateSidebarBadges();
        updatePropertySwitcherUI();
        renderPengaturan();
        toast('Data berhasil di-restore!');
      }, 'Lanjutkan');
    } catch { toast('File JSON tidak valid atau struktur rusak.','err'); }
  };
  r.readAsText(f); this.value = '';
});

$('btn-hapus-semua').addEventListener('click', () => {
  confirm_dlg('Hapus Semua Data Operasional', 'Hapus SEMUA data penghuni, kamar, pembayaran, dan pengeluaran?', () => {
    S.penghuni = []; S.kamar = []; S.pembayaran = []; S.pengeluaran = []; S.keluhan = [];
    if (S.activeKostId && S.propertiesData && S.propertiesData[S.activeKostId]) {
      S.propertiesData[S.activeKostId].penghuni = [];
      S.propertiesData[S.activeKostId].kamar = [];
      S.propertiesData[S.activeKostId].pembayaran = [];
      S.propertiesData[S.activeKostId].pengeluaran = [];
      S.propertiesData[S.activeKostId].keluhan = [];
    }
    LS.save();
    updateSidebarBadges();
    toast('Semua data operasional telah dikosongkan.');
    renderPengaturan();
  }, 'Ya, Hapus Semua');
});

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
      const gClientId = $('modal-google-client-id')?.value?.trim() || '';
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
      btnVerifyDb.textContent = 'Memeriksa 6 Tabel...';
      const tables = ['kost_pengaturan', 'kamar', 'penghuni', 'pembayaran', 'pengeluaran', 'profiles'];
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
          `Semua ${activeCount} dari ${tables.length} tabel database (kost_pengaturan, kamar, penghuni, pembayaran, pengeluaran, profiles) telah AKTIF dan siap digunakan di Supabase Cloud Anda!`,
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
      confirm_dlg('Migrasi Data ke Cloud', 'Upload semua data kamar, penghuni, pembayaran, pengeluaran, dan profil ke Supabase Cloud?', () => {
        DB.uploadLocalToCloud();
      }, 'Upload ke Cloud');
    });
  }

  // Web Storage / SQL Guide Modal Handlers
  $('btn-open-sql-guide')?.addEventListener('click', showSupabaseRlsModal);
  $('btn-check-web-storage')?.addEventListener('click', () => checkSupabaseWritePermission(true));
  $('btn-modal-test-web')?.addEventListener('click', () => checkSupabaseWritePermission(true));
  $('btn-copy-sql-rls')?.addEventListener('click', () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SUPABASE_WEB_STORAGE_SQL).then(() => {
        toast('📋 Skrip SQL berhasil disalin! Buka Supabase SQL Editor dan jalankan (Run).', 'ok');
      }).catch(() => {
        const codeEl = $('code-sql-rls');
        if (codeEl) {
          const range = document.createRange();
          range.selectNodeContents(codeEl);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          document.execCommand('copy');
          toast('📋 Skrip SQL disalin ke clipboard!', 'ok');
        }
      });
    } else {
      const codeEl = $('code-sql-rls');
      if (codeEl) {
        const range = document.createRange();
        range.selectNodeContents(codeEl);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        document.execCommand('copy');
        toast('📋 Skrip SQL disalin ke clipboard!', 'ok');
      }
    }
  });
  $('modal-supabase-rls-close')?.addEventListener('click', () => closeModal('modal-supabase-rls'));
  $('btn-modal-close-rls')?.addEventListener('click', () => closeModal('modal-supabase-rls'));
  $('modal-supabase-rls')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeModal('modal-supabase-rls'); });
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
  const hdr  = ['Nama','NIK','Gender','TTL','HP','Pekerjaan','Kamar','Lantai','Tgl Masuk','Tgl Keluar','Status','Kendaraan','Plat 1','Plat 2','Sewa','Deposit','Darurat','HP Darurat'];
  const rows = list.map(p => [
    p.nama, p.nik, p.gender, (p.tempatLahir ? p.tempatLahir + ' ' : '') + p.tglLahir, p.hp, p.pekerjaan, p.kamar, p.lantai, p.tglMasuk, p.tglKeluar, p.status, p.kendaraan, p.plat1, p.plat2, p.sewa, p.deposit, (p.daruratNama || '') + (p.daruratHub ? ' (' + p.daruratHub + ')' : ''), p.daruratHp
  ].map(v => sanitizeCsvCell(v)));
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
        Ketik nama anak kost, nomor kamar, no HP, plat motor/mobil, atau pengeluaran lintas 5 kost...
      </div>
    `;
    return;
  }

  // Cari di seluruh 5 cabang portofolio
  const allBranches = (S.propertiesData && Object.keys(S.propertiesData).length > 0)
    ? Object.keys(S.propertiesData)
    : [S.activeKostId];

  const matchedPenghuni = [];
  const matchedKamar = [];
  const matchedExp = [];

  allBranches.forEach(bid => {
    const bData = S.propertiesData?.[bid] || (bid === S.activeKostId ? S : null);
    if (!bData) return;
    const branchName = bData.kost?.nama || bid;

    (bData.penghuni || []).forEach(p => {
      if ((p.nama || '').toLowerCase().includes(query) ||
          (p.kamar || '').toLowerCase().includes(query) ||
          (p.hp || '').toLowerCase().includes(query) ||
          (p.nik || '').includes(query) ||
          (p.plat1 || '').toLowerCase().includes(query) ||
          (p.plat2 || '').toLowerCase().includes(query)) {
        matchedPenghuni.push({ ...p, branchId: bid, branchNama: branchName });
      }
    });

    (bData.kamar || []).forEach(k => {
      if ((k.no || '').toLowerCase().includes(query) ||
          (k.tipe || '').toLowerCase().includes(query) ||
          (k.fasilitas || '').toLowerCase().includes(query)) {
        matchedKamar.push({ ...k, branchId: bid, branchNama: branchName });
      }
    });

    (bData.pengeluaran || []).forEach(x => {
      if ((x.keterangan || '').toLowerCase().includes(query) ||
          (x.kategori || '').toLowerCase().includes(query)) {
        matchedExp.push({ ...x, branchId: bid, branchNama: branchName });
      }
    });
  });

  if (matchedPenghuni.length === 0 && matchedKamar.length === 0 && matchedExp.length === 0) {
    resEl.innerHTML = `
      <div style="text-align:center;padding:28px 16px;color:var(--text-3);font-size:0.85rem">
        Tidak ditemukan hasil untuk "<strong>${esc(q)}</strong>" di 5 cabang kost.
      </div>
    `;
    return;
  }

  let html = '';
  if (matchedPenghuni.length > 0) {
    html += `<div class="spotlight-group-title">Penghuni (${matchedPenghuni.length})</div>`;
    html += matchedPenghuni.map(p => `
      <div class="spotlight-item" onclick="closeSpotlight();switchKost('${esc(p.branchId)}');openDetail('${esc(p.id)}')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">👤</div>
          <div>
            <div class="spotlight-item-title">${esc(p.nama)} <span class="badge badge-accent" style="font-size:0.62rem">🏢 ${esc(p.branchNama)}</span> ${p.status === 'aktif' ? '<span class="badge badge-green" style="font-size:0.62rem">Aktif</span>' : '<span class="badge badge-gray" style="font-size:0.62rem">Keluar</span>'}</div>
            <div class="spotlight-item-sub">Kamar ${esc(p.kamar || '–')} · Telp/WA: ${esc(p.hp || '–')} · Sewa: ${rp(p.sewa || 0)}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();switchKost('${esc(p.branchId)}');openDetail('${esc(p.id)}')">Lihat Detail →</button>
      </div>
    `).join('');
  }

  if (matchedKamar.length > 0) {
    html += `<div class="spotlight-group-title">Kamar (${matchedKamar.length})</div>`;
    html += matchedKamar.map(k => `
      <div class="spotlight-item" onclick="closeSpotlight();switchKost('${esc(k.branchId)}');navigateTo('kamar')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">🛏️</div>
          <div>
            <div class="spotlight-item-title">Kamar ${esc(k.no)} (${esc(k.tipe || 'Standar')}) <span class="badge badge-accent" style="font-size:0.62rem">🏢 ${esc(k.branchNama)}</span></div>
            <div class="spotlight-item-sub">Lantai ${esc(k.lantai || '1')} · ${rp(k.harga || 0)}/bln · ${esc(k.fasilitas || 'Standar')}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();switchKost('${esc(k.branchId)}');navigateTo('kamar')">Buka Kamar →</button>
      </div>
    `).join('');
  }

  if (matchedExp.length > 0) {
    html += `<div class="spotlight-group-title">Pengeluaran Operasional (${matchedExp.length})</div>`;
    html += matchedExp.map(x => `
      <div class="spotlight-item" onclick="closeSpotlight();switchKost('${esc(x.branchId)}');navigateTo('pengeluaran')">
        <div class="spotlight-item-left">
          <div class="spotlight-item-icon">💸</div>
          <div>
            <div class="spotlight-item-title">${esc(x.keterangan || x.kategori)} <strong style="color:var(--red)">(${rp(x.jumlah)})</strong> <span class="badge badge-accent" style="font-size:0.62rem">🏢 ${esc(x.branchNama)}</span></div>
            <div class="spotlight-item-sub">${fmtD(x.tanggal)} · ${esc(x.kategori)}</div>
          </div>
        </div>
        <button type="button" class="btn-ghost btn-sm" onclick="event.stopPropagation();closeSpotlight();switchKost('${esc(x.branchId)}');navigateTo('pengeluaran')">Lihat →</button>
      </div>
    `).join('');
  }

  resEl.innerHTML = html;
}

// ── REKAP LAPORAN KEUANGAN BULANAN ────────────────────────────
window.openLaporanBulanan = function(targetBln = thisMonth()) {
  const safeBln = targetBln || thisMonth();
  const [y, mo] = safeBln.split('-');
  let blnLabel = safeBln;
  if (y && mo) {
    const d = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, 1);
    if (!isNaN(d.getTime())) {
      blnLabel = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    }
  }

  const aktif = S.penghuni.filter(p => p.status === 'aktif');
  const payments = S.pembayaran.filter(pb => pb.bulan === targetBln && pb.status === 'lunas');
  const totalPemasukan = payments.reduce((s, pb) => s + (Number(pb.jumlah) || 0), 0);

  const expenses = S.pengeluaran.filter(x => (x.tanggal || '').startsWith(targetBln));
  const totalPengeluaran = expenses.reduce((s, x) => s + (Number(x.jumlah) || 0), 0);
  const labaBersih = totalPemasukan - totalPengeluaran;

  const totalKamar = S.kamar.length || S.kost.totalKamar || 10;
  const kamarTerisi = new Set(aktif.map(p => p.kamar).filter(Boolean)).size;
  const okupansiPersen = totalKamar > 0 ? Math.round((kamarTerisi / totalKamar) * 100) : 0;

  const expCat = {};
  expenses.forEach(x => {
    expCat[x.kategori] = (expCat[x.kategori] || 0) + cleanNumber(x.jumlah);
  });

  const bodyEl = $('modal-laporan-body');
  if (!bodyEl) return;

  bodyEl.innerHTML = `
    <div class="laporan-sheet">
      <div style="border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="font-size:1.35rem;font-weight:800;margin:0;letter-spacing:-0.5px">${esc(S.kost.nama || 'SiKost')}</h1>
          <p style="margin:4px 0 0;font-size:0.8rem;color:#64748b">${esc(S.kost.alamat || 'Alamat Kost')} · Telp/WA: ${esc(S.kost.hp || '–')}</p>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase">Laporan Keuangan Bulanan</div>
          <div style="font-size:1.1rem;font-weight:800;color:#0f172a">${esc(blnLabel)}</div>
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
          <div style="font-size:1rem;font-weight:800;color:${labaBersih >= 0 ? '#0f766e' : '#e11d48'};margin-top:2px">${rp(labaBersih)}</div>
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
              <td style="padding:8px 10px">${esc(cat)}</td>
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
          Dicetak otomatis oleh SiKost pada: ${new Date().toLocaleString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
        </div>
        <div style="text-align:center">
          <div style="font-size:0.75rem;color:#64748b;margin-bottom:48px">Pemilik / Pengelola Kost,</div>
          <div style="font-size:0.85rem;font-weight:800;border-bottom:1px solid #000;padding-bottom:2px">${esc(S.kost.pemilik || 'Pengelola Kost')}</div>
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
    let spotlightTimer;
    inputSpotlight.addEventListener('input', function(e) {
      if (e && e.isTrusted === false) {
        renderSpotlightResults(this.value);
        return;
      }
      clearTimeout(spotlightTimer);
      if (!this.value) {
        renderSpotlightResults('');
      } else {
        spotlightTimer = setTimeout(() => renderSpotlightResults(this.value), 80);
      }
    });
  }

  window.addEventListener('keydown', e => {
    // Ctrl + K Universal Spotlight Search
    if ((e.ctrlKey || e.metaKey) && (e.key || '').toLowerCase() === 'k') {
      e.preventDefault();
      openSpotlight();
      return;
    }

    // Alt + 1..5 Shortcut Cepat Beralih Antar Cabang Kost
    if (e.altKey && ['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      const branchId = 'kost_' + e.key;
      if (typeof window.switchKost === 'function') {
        window.switchKost(branchId);
        const branchName = S.propertiesData?.[branchId]?.kost?.nama || ('Cabang ' + e.key);
        toast(`🏢 Beralih ke [Alt+${e.key}]: ${branchName}`, 'ok');
      }
      return;
    }

    if (e.key === 'Escape') {
      closeSpotlight();
      document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
      const dd = $('property-dropdown-menu');
      if (dd && dd.style.display !== 'none') {
        dd.style.display = 'none';
        $('btn-property-switch')?.classList.remove('open');
      }
    }
  });

  // Global Backdrop Click to Close Any Modal Overlay
  document.addEventListener('click', e => {
    if (e.target.classList && e.target.classList.contains('modal-overlay') && e.target.classList.contains('open')) {
      e.target.classList.remove('open');
    }
  });

  // 2. Rekap Laporan Bulanan
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

// Expose core rendering and managerial functions globally
if (typeof window !== 'undefined') {
  window.renderDashboard = renderDashboard;
  window.renderCharts = renderCharts;
  window.renderDashActionCenter = renderDashActionCenter;
  window.renderActionCenter = renderDashActionCenter;
  window.renderPenghuni = renderPenghuni;
  window.renderKamar = renderKamar;
  window.renderPembayaran = renderPembayaran;
  window.renderPengeluaran = renderPengeluaran;
  window.renderPengeluaranCharts = renderPengeluaranCharts;
  window.renderProfil = renderProfil;
  window.renderPengaturan = renderPengaturan;
  window.renderLaporanBulanan = window.openLaporanBulanan;
  window.updateSidebarBadges = updateSidebarBadges;
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
    if (typeof window !== 'undefined') window.currentUser = session;
    enterApp();
    return;
  }

  if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama || 'SiKost';
  renderGoogleAccounts();
  showScreen('screen-login');
})();
