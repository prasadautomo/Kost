/**
 * test_organic.js
 * Comprehensive End-to-End Organic User Journey Test for SiKost (v4.1 Pure Google Login)
 * Runs natively in Node.js without requiring external npm dependencies (e.g., jsdom).
 */

const fs = require('fs');
const path = require('path');

// Rich DOM Mock for Standalone Execution
class MockElement {
  constructor(tagName = 'div', id = '', attrs = {}) {
    this.tagName = tagName.toUpperCase();
    this.id = id;
    this.attributes = { ...attrs };
    this.style = {};
    this.classList = {
      _classes: new Set(attrs.class ? attrs.class.split(/\s+/) : []),
      add: (...c) => c.forEach(x => x && this.classList._classes.add(x)),
      remove: (...c) => c.forEach(x => this.classList._classes.delete(x)),
      contains: (c) => this.classList._classes.has(c),
      toggle: (c) => {
        if (this.classList._classes.has(c)) {
          this.classList._classes.delete(c);
          return false;
        } else {
          this.classList._classes.add(c);
          return true;
        }
      }
    };
    this.children = [];
    this.parentElement = null;
    this._listeners = {};
    this._innerHTML = '';
    this._value = '';
    this._textContent = '';
    this.disabled = false;
  }

  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) {
    this._innerHTML = String(val);
    if (this.tagName === 'SELECT') {
      const matches = this._innerHTML.match(/<option[^>]*>.*?<\/option>/gi) || [];
      this.children = matches.map(m => {
        const valMatch = m.match(/value="([^"]*)"/i);
        const opt = new MockElement('option');
        opt.value = valMatch ? valMatch[1] : '';
        opt.innerHTML = m.replace(/<[^>]+>/g, '');
        return opt;
      });
    }
  }

  get textContent() { return this._textContent || this._innerHTML.replace(/<[^>]+>/g, ''); }
  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val);
  }

  get value() { return this._value; }
  set value(val) { this._value = String(val); }

  getAttribute(k) { return this.attributes[k] || null; }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  removeAttribute(k) { delete this.attributes[k]; }
  hasAttribute(k) { return k in this.attributes; }

  appendChild(child) {
    if (child) {
      child.parentElement = this;
      this.children.push(child);
    }
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  addEventListener(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  }

  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const evObj = typeof event === 'string' ? { type: event, target: this, currentTarget: this, preventDefault: () => {} } : event;
    if (!evObj.target) evObj.target = this;
    if (!evObj.currentTarget) evObj.currentTarget = this;
    if (!evObj.preventDefault) evObj.preventDefault = () => {};
    const listeners = this._listeners[type] || [];
    for (const fn of listeners) {
      try {
        fn(evObj);
      } catch (err) {
        console.error(`[Error in ${this.id || this.tagName} on '${type}']:`, err);
        throw err;
      }
    }
  }

  click() {
    this.dispatchEvent('click');
  }

  reset() {
    this.value = '';
  }

  focus() {}
  blur() {}
  showPicker() {}

  querySelector(sel) {
    return this.querySelectorAll(sel)[0] || null;
  }

  querySelectorAll(sel) {
    const res = [];
    function walk(el) {
      for (const ch of el.children) {
        if (sel.startsWith('.') && ch.classList.contains(sel.slice(1))) res.push(ch);
        else if (sel.startsWith('#') && ch.id === sel.slice(1)) res.push(ch);
        else if (ch.tagName.toLowerCase() === sel.toLowerCase()) res.push(ch);
        walk(ch);
      }
    }
    walk(this);
    return res;
  }
}

async function runOrganicTests() {
  console.log('🚀 Memulai Organic Test untuk SiKost v4.1 Google-First & Strict Security...\n');

  const htmlContent = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const appJsContent = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

  // Build index of elements from index.html
  const elementsById = {};
  const tagIdRegex = /<([a-zA-Z0-9\-]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = tagIdRegex.exec(htmlContent)) !== null) {
    const tag = m[1];
    const id = m[2];
    elementsById[id] = new MockElement(tag, id);
  }

  const mockDocument = {
    documentElement: new MockElement('html', '', { 'data-theme': 'dark' }),
    body: new MockElement('body'),
    getElementById: (id) => elementsById[id] || null,
    createElement: (tag) => new MockElement(tag),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elementsById[sel.slice(1)] || null;
      if (sel === '.page.active') {
        return Object.values(elementsById).find(e => e.classList.contains('page') && e.classList.contains('active')) || null;
      }
      return null;
    },
    querySelectorAll: (sel) => [],
    addEventListener: () => {}
  };

  const storage = {};
  const mockLocalStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  };

  const mockWindow = {
    localStorage: mockLocalStorage,
    location: { href: 'http://localhost:3000', protocol: 'http:', hostname: 'localhost' },
    navigator: { userAgent: 'Node' },
    addEventListener: () => {},
    alert: (msg) => console.log('   [Alert]:', msg),
    open: (url) => { mockWindow.__lastOpenedUrl = url; return { document: { write: () => {}, close: () => {} } }; },
    Chart: function(ctx, config) {
      this.ctx = ctx;
      this.config = config;
      this.destroy = () => {};
      this.update = () => {};
    },
    Event: function(type) { this.type = type; },
    CustomEvent: function(type, detail) { this.type = type; this.detail = detail; },
    crypto: {
      subtle: {
        digest: async (algo, data) => {
          const cryptoNode = require('crypto');
          return cryptoNode.createHash('sha256').update(Buffer.from(data)).digest();
        }
      }
    }
  };

  global.window = mockWindow;
  global.document = mockDocument;
  global.localStorage = mockLocalStorage;
  global.Chart = mockWindow.Chart;
  global.navigator = mockWindow.navigator;
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

    // Execute app.js
    const scriptFn = new Function('window', 'document', 'localStorage', 'navigator', appJsContent);
    scriptFn(mockWindow, mockDocument, mockLocalStorage, mockWindow.navigator);

    await new Promise(r => setTimeout(r, 100));

    const htmlEl = mockDocument.documentElement;
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema default adalah Dark Mode ("dark")');
    assert(elementsById['screen-login'].style.display !== 'none', 'Layar awal yang ditampilkan adalah Layar Login');
    assert(elementsById['screen-app'].style.display === 'none', 'App Shell disembunyikan sebelum login');
    assert(elementsById['btn-login-google'] !== null, 'Tombol "Masuk dengan Google (1-Klik)" tersedia');
    assert(!elementsById['form-login'], 'Form email & password manual telah dihapus');
    assert(!elementsById['btn-demo-mgr'], 'Tombol demo lawas telah dihilangkan');

    // -------------------------------------------------------------
    // TEST 2: Login Google sebagai Manager (Gavin Utomo)
    // -------------------------------------------------------------
    console.log('\n📌 Test 2: Alur Login Akun Google sebagai Manager (gavinutomo4@gmail.com)');
    const inlineList = elementsById['inline-google-accounts-list'];
    assert(inlineList !== null, 'Daftar akun Google langsung tersedia di layar login');

    const gavin = mockWindow.S.akun.find(a => a.email === 'gavinutomo4@gmail.com');
    assert(gavin !== undefined, 'Akun Gavin Utomo (gavinutomo4@gmail.com) tersedia di database akun');
    mockWindow.loginWithAkun(gavin);
    await new Promise(r => setTimeout(r, 100));

    assert(elementsById['screen-app'].style.display !== 'none', 'Berhasil beralih ke App Shell');
    assert(elementsById['screen-login'].style.display === 'none', 'Layar login telah disembunyikan');
    assert(elementsById['sb-role-badge'].textContent.includes('Manager'), 'Role badge di sidebar menampilkan "Manager"');
    assert(elementsById['page-dashboard'].classList.contains('active'), 'Halaman default Manager adalah Dashboard');

    // -------------------------------------------------------------
    // TEST 3: Dashboard Analytics & KPI Data
    // -------------------------------------------------------------
    console.log('\n📌 Test 3: Validasi Dashboard & Perhitungan KPI');
    const kpiRow = elementsById['kpi-row'];
    assert(kpiRow.innerHTML.includes('Total Penghuni'), 'KPI Total Penghuni terisi');
    assert(kpiRow.innerHTML.includes('Kamar Terisi'), 'KPI Kamar Terisi terisi');
    assert(kpiRow.innerHTML.includes('Pemasukan Bulan Ini') || kpiRow.innerHTML.includes('Laba Bersih') || kpiRow.innerHTML.includes('Pendapatan'), 'KPI Keuangan Laba Bersih/Pemasukan terisi');

    const tblTerbaru = elementsById['tbody-terbaru'];
    assert(tblTerbaru.innerHTML.length > 0, 'Tabel penghuni terbaru terisi data');

    // -------------------------------------------------------------
    // TEST 4: Data Penghuni (Tenant Management)
    // -------------------------------------------------------------
    console.log('\n📌 Test 4: Alur Manajemen Data Penghuni');
    mockWindow.navigateTo('penghuni');
    assert(elementsById['page-penghuni'].classList.contains('active'), 'Berhasil navigasi ke Halaman Penghuni');

    const grid = elementsById['penghuni-grid'];
    assert(grid.innerHTML.includes('pg-card'), 'Grid penghuni menampilkan kartu data anak kost');

    // Test Search Filter
    const searchInput = elementsById['cari-penghuni'];
    searchInput.value = 'Anisa';
    mockWindow.renderPenghuni();
    assert(grid.innerHTML.includes('Anisa'), 'Pencarian kata kunci "Anisa" menampilkan data Anisa');

    // Clear search
    searchInput.value = '';
    mockWindow.renderPenghuni();
    assert(grid.innerHTML.includes('Dimas'), 'Menghapus pencarian mengembalikan data penghuni lengkap');

    // -------------------------------------------------------------
    // TEST 5: Kamar (Rooms) Management & Occupancy Pulse
    // -------------------------------------------------------------
    console.log('\n📌 Test 5: Alur Manajemen Kamar & Ringkasan Okupansi');
    mockWindow.navigateTo('kamar');
    assert(elementsById['page-kamar'].classList.contains('active'), 'Berhasil navigasi ke Halaman Kamar');
    assert(elementsById['kamar-grid'].innerHTML.includes('km-card'), 'Daftar kamar menampilkan unit kamar terdaftar');

    // -------------------------------------------------------------
    // TEST 6: Pembayaran (Billing) & WhatsApp Invoice Reminder
    // -------------------------------------------------------------
    console.log('\n📌 Test 6: Alur Pembayaran & WhatsApp Tagihan');
    mockWindow.navigateTo('pembayaran');
    assert(elementsById['page-pembayaran'].classList.contains('active'), 'Berhasil navigasi ke Halaman Pembayaran');

    const tbodyBayar = elementsById['tbody-pembayaran'];
    assert(tbodyBayar.innerHTML.length > 0, 'Tabel pembayaran terisi data tagihan anak kost');
    assert(tbodyBayar.innerHTML.includes('btn-wa') || tbodyBayar.innerHTML.includes('kirimWaTagihan') || tbodyBayar.innerHTML.includes('WA'), 'Tombol cepat WhatsApp Tagihan tersedia di tabel');

    // -------------------------------------------------------------
    // TEST 7: Theme Toggle (Dark Mode <-> Light Mode)
    // -------------------------------------------------------------
    console.log('\n📌 Test 7: Uji Pergantian Tema (Dark / Light)');
    const themeToggle = elementsById['theme-toggle'];
    const themeIcon = elementsById['theme-icon'];

    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema awal adalah dark');

    // Toggle to Light
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'light', 'Tema berhasil beralih ke Light Mode');
    assert(themeIcon.textContent === 'dark_mode' || themeIcon.textContent === '🌙', 'Ikon tema diperbarui di light mode');

    // Toggle back to Dark
    themeToggle.click();
    assert(htmlEl.getAttribute('data-theme') === 'dark', 'Tema berhasil beralih kembali ke Dark Mode');
    assert(themeIcon.textContent === 'light_mode' || themeIcon.textContent === '☀️', 'Ikon tema kembali di dark mode');

    // -------------------------------------------------------------
    // TEST 8: Logout & Portal Anak Kost (Tenant Portal)
    // -------------------------------------------------------------
    console.log('\n📌 Test 8: Alur Logout & Masuk Portal Anak Kost via Google');
    elementsById['btn-logout'].click();
    elementsById['confirm-ok'].click();
    await new Promise(r => setTimeout(r, 100));

    assert(elementsById['screen-login'].style.display !== 'none', 'Berhasil logout dan kembali ke Layar Login');
    assert(elementsById['screen-app'].style.display === 'none', 'App Shell tertutup');

    // Login as Tenant Dimas Pratama
    const dimas = mockWindow.S.akun.find(a => a.role === 'penghuni') || { id: 'u_dimas', nama: 'Dimas Pratama', email: 'dimas.pratama@gmail.com', role: 'penghuni' };
    mockWindow.loginWithAkun(dimas);
    await new Promise(r => setTimeout(r, 100));

    assert(elementsById['screen-app'].style.display !== 'none', 'Berhasil login ke Portal SiKost');
    assert(elementsById['sb-role-badge'].textContent.includes('Penghuni'), 'Role badge sidebar adalah "Penghuni"');
    assert(elementsById['page-dashboard'].classList.contains('active'), 'Halaman default setelah login adalah Dashboard');

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
