/**
 * test_organic.js
 * Comprehensive End-to-End Organic User Journey Test for SiKost (v4.1 Pure Google Login)
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runOrganicTests() {
  console.log('🚀 Memulai Organic Test untuk SiKost v4.1 Google-First & Strict Security...\n');

  const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');

  // Set up mock window and JSDOM
  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    url: 'http://localhost:3000'
  });

  const { window } = dom;
  const { document } = window;

  // Mock localStorage
  const storage = {};
  window.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  // Mock window.open and alerts
  window.open = (url) => { window.__lastOpenedUrl = url; return { document: { write: () => {}, close: () => {} } }; };
  window.alert = (msg) => console.log('   [Alert]:', msg);
  
  // Mock Chart.js constructor
  window.Chart = function(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.destroy = () => {};
    this.update = () => {};
  };

  // Attach globals for script
  global.window = window;
  global.document = document;
  global.localStorage = window.localStorage;
  global.Chart = window.Chart;
  global.navigator = window.navigator;
  global.URL = {
    createObjectURL: () => 'blob:mock-url',
    revokeObjectURL: () => {}
  };
  global.Blob = function(content, opts) { this.content = content; this.opts = opts; };

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Load and Initialization
    // -------------------------------------------------------------
    console.log('📌 Test 1: Inisialisasi Aplikasi & Tampilan Default');
    
    // Execute app.js in window context
    window.eval(appJsContent);

    // Give async init time to settle
    await new Promise(r => setTimeout(r, 250));

    const htmlEl = document.documentElement;
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema default adalah Dark Mode ("dark")');
    assert(document.getElementById('screen-login').style.display !== 'none', 'Layar awal yang ditampilkan adalah Layar Login');
    assert(document.getElementById('screen-app').style.display === 'none', 'App Shell disembunyikan sebelum login');
    assert(document.getElementById('btn-login-google') !== null, 'Tombol "Masuk dengan Google (1-Klik)" tersedia');
    assert(document.getElementById('form-login') === null, 'Form email & password manual telah dihapus');
    assert(document.getElementById('btn-demo-mgr') === null, 'Tombol demo lawas telah dihilangkan');

    // -------------------------------------------------------------
    // TEST 2: Login Google sebagai Manager (Gavin Utomo)
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Alur Login Akun Google sebagai Manager (gavinutomo4@gmail.com)');
    const inlineList = document.getElementById('inline-google-accounts-list');
    assert(inlineList !== null, 'Daftar akun Google langsung tersedia di layar login');
    
    const gavinCard = Array.from(inlineList.children).find(c => c.innerHTML.includes('gavinutomo4@gmail.com'));
    assert(gavinCard !== null, 'Akun Gavin Utomo (gavinutomo4@gmail.com) tersedia');
    assert(gavinCard.innerHTML.includes('Manager 👑'), 'Gavin Utomo berstatus Manager');

    gavinCard.click();
    await new Promise(r => setTimeout(r, 200));

    assert(document.getElementById('screen-app').style.display !== 'none', 'Berhasil beralih ke App Shell');
    assert(document.getElementById('screen-login').style.display === 'none', 'Layar login telah disembunyikan');
    assert(document.getElementById('sb-role-badge').textContent.includes('Manager'), 'Role badge di sidebar menampilkan "Manager"');
    assert(document.getElementById('page-dashboard').classList.contains('active'), 'Halaman default Manager adalah Dashboard');

    // -------------------------------------------------------------
    // TEST 3: Dashboard Analytics & KPI Data
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Validasi Dashboard & Perhitungan KPI');
    const kpiRow = document.getElementById('kpi-row');
    assert(kpiRow.children.length >= 4, 'Terdapat minimal 4 kartu metrik KPI di Dashboard');
    assert(kpiRow.innerHTML.includes('Total Penghuni'), 'KPI Total Penghuni terisi');
    assert(kpiRow.innerHTML.includes('Kamar Terisi'), 'KPI Kamar Terisi terisi');
    assert(kpiRow.innerHTML.includes('Pendapatan / Bulan'), 'KPI Target Pendapatan terisi');

    const tblTerbaru = document.getElementById('tbody-terbaru');
    assert(tblTerbaru.children.length > 0, 'Tabel penghuni terbaru terisi data');

    // -------------------------------------------------------------
    // TEST 4: Data Penghuni (Tenant Management)
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Alur Manajemen Data Penghuni');
    document.getElementById('nav-penghuni').click();
    assert(document.getElementById('page-penghuni').classList.contains('active'), 'Berhasil navigasi ke Halaman Penghuni');

    const grid = document.getElementById('penghuni-grid');
    const initialPenghuniCount = grid.children.length;
    assert(initialPenghuniCount >= 6, `Grid penghuni awal menampilkan minimal 6 data anak kost (aktual: ${initialPenghuniCount})`);

    // Test Search Filter
    const searchInput = document.getElementById('cari-penghuni');
    searchInput.value = 'Anisa';
    searchInput.dispatchEvent(new window.Event('input'));
    assert(grid.children.length === 1, 'Pencarian kata kunci "Anisa" menampilkan tepat 1 hasil');
    
    // Clear search
    searchInput.value = '';
    searchInput.dispatchEvent(new window.Event('input'));
    assert(grid.children.length === initialPenghuniCount, 'Menghapus pencarian mengembalikan seluruh data penghuni');

    // -------------------------------------------------------------
    // TEST 5: Kamar (Rooms) Management & Occupancy Pulse
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Alur Manajemen Kamar & Ringkasan Okupansi');
    document.getElementById('nav-kamar').click();
    assert(document.getElementById('page-kamar').classList.contains('active'), 'Berhasil navigasi ke Halaman Kamar');

    const kamarGrid = document.getElementById('kamar-grid');
    assert(kamarGrid.children.length >= 8, 'Daftar kamar menampilkan minimal 8 kamar');

    // -------------------------------------------------------------
    // TEST 6: Pembayaran (Billing) & WhatsApp Invoice Reminder
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Alur Pembayaran & WhatsApp Tagihan');
    document.getElementById('nav-pembayaran').click();
    assert(document.getElementById('page-pembayaran').classList.contains('active'), 'Berhasil navigasi ke Halaman Pembayaran');

    const tbodyBayar = document.getElementById('tbody-pembayaran');
    assert(tbodyBayar.children.length > 0, 'Tabel pembayaran terisi data tagihan anak kost');
    assert(tbodyBayar.innerHTML.includes('📱 WA'), 'Tombol cepat WhatsApp Tagihan tersedia di tabel');

    // -------------------------------------------------------------
    // TEST 7: Theme Toggle (Dark Mode <-> Light Mode)
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Uji Pergantian Tema (Dark / Light)');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema awal adalah dark');
    assert(themeIcon.textContent === '☀️', 'Ikon tema awal di dark mode adalah ☀️');

    // Toggle to Light
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'light', 'Tema berhasil beralih ke Light Mode');
    assert(themeIcon.textContent === '🌙', 'Ikon tema beralih ke 🌙');

    // Toggle back to Dark
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema berhasil beralih kembali ke Dark Mode');
    assert(themeIcon.textContent === '☀️', 'Ikon tema kembali ke ☀️');

    // -------------------------------------------------------------
    // TEST 8: Logout & Portal Anak Kost (Tenant Portal)
    // -------------------------------------------------------------
    console.log('\n📌 Test 8: Alur Logout & Masuk Portal Anak Kost via Google');
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();
    await new Promise(r => setTimeout(r, 100));

    // Confirm dialog
    const confirmOk = document.getElementById('confirm-ok');
    if (confirmOk) {
      confirmOk.click();
      await new Promise(r => setTimeout(r, 150));
    }

    assert(document.getElementById('screen-login').style.display !== 'none', 'Berhasil logout dan kembali ke Layar Login');
    assert(document.getElementById('screen-app').style.display === 'none', 'App Shell tertutup');

    // Click Dimas Prasetyo Google Account
    const inlineListAfter = document.getElementById('inline-google-accounts-list');
    const dimasCard = Array.from(inlineListAfter.children).find(c => c.innerHTML.includes('Dimas Prasetyo') || c.innerHTML.includes('101'));
    assert(dimasCard !== null, 'Akun Google Penghuni Dimas Prasetyo (Kamar 101) tersedia');
    dimasCard.click();
    await new Promise(r => setTimeout(r, 200));

    assert(document.getElementById('screen-app').style.display !== 'none', 'Berhasil login ke Portal Anak Kost');
    assert(document.getElementById('sb-role-badge').textContent.includes('Penghuni'), 'Role badge sidebar adalah "Penghuni"');
    assert(document.getElementById('page-tenant').classList.contains('active'), 'Halaman default anak kost adalah "Data Saya" (page-tenant)');
    
    console.log(`\n🎉 SEMUA PENGUJIAN ORGANIK SELESAI DENGAN SUKSES!`);
    console.log(`📊 Hasil: ${passedTests} dari ${totalTests} pengujian lolos (100% PASS)`);

  } catch (err) {
    console.error('\n❌ Pengujian gagal pada assertion:');
    console.error(err);
    if (typeof process !== 'undefined' && process.exit) {
      process.exit(1);
    }
  }
}

if (typeof module !== 'undefined' && require.main === module) {
  runOrganicTests();
}

if (typeof window !== 'undefined') {
  window.runOrganicTests = runOrganicTests;
}
