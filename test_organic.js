/**
 * test_organic.js
 * Comprehensive End-to-End Organic User Journey Test for SiKost
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function runOrganicTests() {
  console.log('🚀 Memulai Organic Test untuk SiKost v4.0 Dark Mode...\n');

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

  // Mock window.open and crypto
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
    await new Promise(r => setTimeout(r, 200));

    const htmlEl = document.documentElement;
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema default adalah Dark Mode ("dark")');
    assert(document.getElementById('screen-login').style.display === 'flex', 'Layar awal yang ditampilkan adalah Layar Login');
    assert(document.getElementById('screen-app').style.display === 'none', 'App Shell disembunyikan sebelum login');
    assert(document.getElementById('btn-demo-mgr') !== null, 'Tombol "Masuk Demo Manager" tersedia');
    assert(document.getElementById('btn-demo-tnt') !== null, 'Tombol "Masuk Demo Anak Kost" tersedia');

    // -------------------------------------------------------------
    // TEST 2: Demo 1-Click Login as Manager
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Alur Login 1-Klik sebagai Manager');
    const btnDemoMgr = document.getElementById('btn-demo-mgr');
    btnDemoMgr.click();
    await new Promise(r => setTimeout(r, 150));

    assert(document.getElementById('screen-app').style.display === 'flex', 'Berhasil beralih ke App Shell');
    assert(document.getElementById('screen-login').style.display === 'none', 'Layar login telah disembunyikan');
    assert(document.getElementById('sb-role-badge').textContent === 'Manager', 'Role badge di sidebar menampilkan "Manager"');
    assert(document.getElementById('page-dashboard').classList.contains('active'), 'Halaman default Manager adalah Dashboard');

    // -------------------------------------------------------------
    // TEST 3: Dashboard Analytics & KPI Data
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Validasi Dashboard & Perhitungan KPI');
    const kpiRow = document.getElementById('kpi-row');
    assert(kpiRow.children.length === 4, 'Terdapat 4 kartu metrik KPI di Dashboard');
    assert(kpiRow.innerHTML.includes('Total Penghuni'), 'KPI Total Penghuni terisi');
    assert(kpiRow.innerHTML.includes('Kamar Terisi'), 'KPI Kamar Terisi terisi');
    assert(kpiRow.innerHTML.includes('Pendapatan / Bulan'), 'KPI Target Pendapatan terisi');
    assert(kpiRow.innerHTML.includes('Terkumpul Bulan Ini'), 'KPI Terkumpul Bulan Ini terisi');

    const tblTerbaru = document.getElementById('tbody-terbaru');
    assert(tblTerbaru.children.length > 0, 'Tabel penghuni terbaru terisi data');
    const quickKamar = document.getElementById('quick-kamar');
    assert(quickKamar.children.length === 8, 'Status cepat kamar menampilkan 8 kamar terdaftar');

    // -------------------------------------------------------------
    // TEST 4: Data Penghuni (Tenant Management)
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Alur Manajemen Data Penghuni');
    // Navigate to penghuni
    document.getElementById('nav-penghuni').click();
    assert(document.getElementById('page-penghuni').classList.contains('active'), 'Berhasil navigasi ke Halaman Penghuni');

    const grid = document.getElementById('penghuni-grid');
    const initialPenghuniCount = grid.children.length;
    assert(initialPenghuniCount === 6, `Grid penghuni awal menampilkan 6 data anak kost (aktual: ${initialPenghuniCount})`);

    // Test Search Filter
    const searchInput = document.getElementById('cari-penghuni');
    searchInput.value = 'Anisa';
    searchInput.dispatchEvent(new window.Event('input'));
    assert(grid.children.length === 1, 'Pencarian kata kunci "Anisa" menampilkan tepat 1 hasil');
    
    // Clear search
    searchInput.value = '';
    searchInput.dispatchEvent(new window.Event('input'));
    assert(grid.children.length === 6, 'Menghapus pencarian mengembalikan seluruh data penghuni');

    // Test Add New Tenant Form
    console.log('   -> Menambah anak kost baru via Modal Form');
    const btnTambahPenghuni = document.getElementById('btn-tambah-penghuni');
    btnTambahPenghuni.click();
    assert(document.getElementById('modal-penghuni').classList.contains('open'), 'Modal Tambah Penghuni terbuka');

    document.getElementById('field-nama').value = 'Bagas Pratama';
    document.getElementById('field-hp').value = '081299334455';
    document.getElementById('field-kamar').value = '204';
    document.getElementById('field-lantai').value = '2';
    document.getElementById('field-tgl-masuk').value = '2026-09-01';
    document.getElementById('field-sewa').value = '950000';
    document.getElementById('field-pekerjaan').value = 'Backend Engineer Gojek';

    // Submit form
    document.getElementById('form-penghuni').dispatchEvent(new window.Event('submit'));
    assert(!document.getElementById('modal-penghuni').classList.contains('open'), 'Modal form tertutup setelah simpan');
    assert(grid.children.length === 7, `Total anak kost bertambah menjadi 7 (aktual: ${grid.children.length})`);

    // Test Open Detail Modal & WhatsApp button
    console.log('   -> Membuka detail penghuni & memeriksa tautan WhatsApp');
    const firstCard = grid.children[0];
    firstCard.click();
    assert(document.getElementById('modal-detail').classList.contains('open'), 'Modal detail penghuni terbuka');
    const btnWaDetail = document.getElementById('btn-wa-detail');
    assert(btnWaDetail.style.display !== 'none', 'Tombol WhatsApp tampil di footer modal detail');
    assert(btnWaDetail.href.includes('https://wa.me/'), `Tautan WhatsApp valid: ${btnWaDetail.href}`);
    document.getElementById('detail-close').click();
    assert(!document.getElementById('modal-detail').classList.contains('open'), 'Modal detail berhasil ditutup');

    // -------------------------------------------------------------
    // TEST 5: Kamar (Rooms) Management & Occupancy Pulse
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Alur Manajemen Kamar & Ringkasan Okupansi');
    document.getElementById('nav-kamar').click();
    assert(document.getElementById('page-kamar').classList.contains('active'), 'Berhasil navigasi ke Halaman Kamar');

    const kpiKamar = document.getElementById('kpi-kamar-row');
    assert(kpiKamar !== null && kpiKamar.children.length === 4, 'Kartu Okupansi Kamar menampilkan 4 metrik status');
    assert(kpiKamar.innerHTML.includes('Tingkat Okupansi'), 'Tingkat okupansi terhitung');

    const kamarGrid = document.getElementById('kamar-grid');
    assert(kamarGrid.children.length >= 8, 'Daftar kamar menampilkan minimal 8 kamar');

    // Filter Kosong
    const filterKamar = document.getElementById('filter-kamar-status');
    filterKamar.value = 'kosong';
    filterKamar.dispatchEvent(new window.Event('change'));
    assert(kamarGrid.innerHTML.includes('Kosong'), 'Filter kamar kosong berfungsi');

    filterKamar.value = '';
    filterKamar.dispatchEvent(new window.Event('change'));

    // -------------------------------------------------------------
    // TEST 6: Pembayaran (Billing) & WhatsApp Invoice Reminder
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Alur Pembayaran & WhatsApp Tagihan');
    document.getElementById('nav-pembayaran').click();
    assert(document.getElementById('page-pembayaran').classList.contains('active'), 'Berhasil navigasi ke Halaman Pembayaran');

    const tbodyBayar = document.getElementById('tbody-pembayaran');
    assert(tbodyBayar.children.length > 0, 'Tabel pembayaran terisi data tagihan anak kost');
    assert(tbodyBayar.innerHTML.includes('📱 WA'), 'Tombol cepat WhatsApp Tagihan tersedia di tabel');

    // Test WhatsApp reminder trigger
    const unpaidTenant = window.S.penghuni.find(p => !window.S.pembayaran.some(pb => pb.penghuniId === p.id && pb.status === 'lunas'));
    if (unpaidTenant) {
      console.log(`   -> Menguji pengingat tagihan WA untuk: ${unpaidTenant.nama}`);
      window.kirimWaTagihan(unpaidTenant.id, window.thisMonth());
      assert(window.__lastOpenedUrl && window.__lastOpenedUrl.startsWith('https://wa.me/'), `Tautan WA berhasil di-generate: ${window.__lastOpenedUrl}`);
      assert(window.__lastOpenedUrl.includes('mengingatkan%20tagihan%20sewa%20kamar'), 'Teks pesan penagihan sopan otomatis terformat dalam bahasa Indonesia');
    }

    // -------------------------------------------------------------
    // TEST 7: Theme Toggle (Dark Mode <-> Light Mode)
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Uji Pergantian Tema (Dark / Light)');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema awal adalah dark');
    assert(themeIcon.textContent === '☀️', 'Ikon tema awal di dark mode adalah ☀️ (klik untuk terang)');

    // Toggle to Light
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'light', 'Tema berhasil beralih ke Light Mode');
    assert(themeIcon.textContent === '🌙', 'Ikon tema beralih ke 🌙');
    assert(window.localStorage.getItem('sk3_theme') === 'light', 'Preferensi tersimpan di localStorage sebagai "light"');

    // Toggle back to Dark
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema berhasil beralih kembali ke Dark Mode');
    assert(themeIcon.textContent === '☀️', 'Ikon tema kembali ke ☀️');
    assert(window.localStorage.getItem('sk3_theme') === 'dark', 'Preferensi tersimpan di localStorage sebagai "dark"');

    // -------------------------------------------------------------
    // TEST 8: Logout & Portal Anak Kost (Tenant Portal)
    // -------------------------------------------------------------
    console.log('\n📌 Test 8: Alur Logout & Masuk Portal Anak Kost');
    const btnLogout = document.getElementById('btn-logout');
    btnLogout.click();
    await new Promise(r => setTimeout(r, 100));

    assert(document.getElementById('screen-login').style.display === 'flex', 'Berhasil logout dan kembali ke Layar Login');
    assert(document.getElementById('screen-app').style.display === 'none', 'App Shell tertutup');

    // Click Demo Anak Kost
    const btnDemoTnt = document.getElementById('btn-demo-tnt');
    btnDemoTnt.click();
    await new Promise(r => setTimeout(r, 150));

    assert(document.getElementById('screen-app').style.display === 'flex', 'Berhasil login ke Portal Anak Kost');
    assert(document.getElementById('sb-role-badge').textContent === 'Penghuni', 'Role badge sidebar adalah "Penghuni"');
    assert(document.getElementById('page-tenant').classList.contains('active'), 'Halaman default anak kost adalah "Data Saya" (page-tenant)');
    
    const tenantContent = document.getElementById('tenant-content');
    assert(tenantContent.innerHTML.includes('Identitas'), 'Portal anak kost menampilkan data identitas');
    assert(tenantContent.innerHTML.includes('Hunian &amp; Sewa') || tenantContent.innerHTML.includes('Hunian & Sewa'), 'Portal anak kost menampilkan info sewa & kamar');

    console.log(`\n🎉 SEMUA PENGUJIAN ORGANIK SELESAI DENGAN SUKSES!`);
    console.log(`📊 Hasil: ${passedTests} dari ${totalTests} pengujian lolos (100% PASS)`);

  } catch (err) {
    console.error('\n❌ Pengujian gagal pada assertion:');
    console.error(err);
    process.exit(1);
  }
}

runOrganicTests();
