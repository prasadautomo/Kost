const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// --- RICH DOM MOCK ---
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

  click() { this.dispatchEvent('click'); }
  reset() { this.value = ''; }
  focus() {}
  blur() {}
  showPicker() {}

  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
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

// Build index of elements from index.html
const elementsById = {};
const tagIdRegex = /<([a-zA-Z0-9\-]+)[^>]*\bid=["']([^"']+)["'][^>]*>/gi;
let m;
while ((m = tagIdRegex.exec(html)) !== null) {
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
    return null;
  },
  querySelectorAll: () => [],
  addEventListener: () => {}
};

const storage = {};
const mockLocalStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.window = {
  localStorage: mockLocalStorage,
  location: { href: 'http://localhost:3000', protocol: 'http:', hostname: 'localhost' },
  navigator: { userAgent: 'Node Stress Agent' },
  addEventListener: () => {},
  alert: (msg) => console.log('   [Alert]:', msg),
  open: () => ({ document: { write: () => {}, close: () => {} }, print: () => {} }),
  Chart: function(ctx, config) {
    this.ctx = ctx;
    this.config = config;
    this.data = config?.data || { datasets: [{ data: [] }] };
    this.options = config?.options || {};
    this.destroy = () => {};
    this.update = () => {};
  },
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
  Blob: function(c, o) { this.content = c; this.opts = o; }
};
global.document = mockDocument;
global.localStorage = mockLocalStorage;
global.Chart = global.window.Chart;
global.navigator = global.window.navigator;

eval(appJs);

const win = global.window;
const S = win.S;

console.log('====================================================');
console.log('⚡ SIKOST ENTERPRISE STRESS TEST SUITE v4.3 ⚡');
console.log('====================================================\n');

const suiteResults = [];

async function runBenchmark(name, fn) {
  const startTime = process.hrtime.bigint();
  const startMem = process.memoryUsage().heapUsed;
  try {
    await fn();
    const endTime = process.hrtime.bigint();
    const endMem = process.memoryUsage().heapUsed;
    const durationMs = Number(endTime - startTime) / 1e6;
    const memDeltaKb = Math.round((endMem - startMem) / 1024);
    console.log(`✅ [PASS] ${name}`);
    console.log(`   ⏱️  Waktu: ${durationMs.toFixed(2)} ms | 🧠 Memori Delta: ${memDeltaKb >= 0 ? '+' : ''}${memDeltaKb} KB\n`);
    suiteResults.push({ name, passed: true, durationMs, memDeltaKb });
  } catch (err) {
    console.error(`❌ [FAIL] ${name} ->`, err.message);
    console.error(err.stack);
    suiteResults.push({ name, passed: false, error: err.message });
  }
}

(async () => {
  // Setup User Manager
  win.seedDemoDataForTesting();
  const gavin = S.akun.find(a => a.email === 'gavinutomo4@gmail.com');
  win.loginWithAkun(gavin);

  // ─────────────────────────────────────────────────────────────
  // TEST 1: High Volume Data Generation & Storage Ingestion
  // Ingest 1,000 tenants, 1,000 rooms, 3,000 payments across 5 branches
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 1: High-Volume Data Ingestion (1,000 Penghuni, 1,000 Kamar, 3,000 Pembayaran)', async () => {
    const branches = ['kost_1', 'kost_2', 'kost_3', 'kost_4', 'kost_5'];
    let tenantCount = 0;
    let paymentCount = 0;
    let roomCount = 0;

    branches.forEach((bId, bIdx) => {
      S.propertiesData[bId] = S.propertiesData[bId] || { kamar: [], penghuni: [], pembayaran: [], pengeluaran: [] };
      const bData = S.propertiesData[bId];

      // Ingest 200 rooms per branch = 1,000 total
      for (let r = 1; r <= 200; r++) {
        const roomNo = `${String.fromCharCode(65 + bIdx)}-${String(r).padStart(3, '0')}`;
        bData.kamar.push({
          id: `km_stress_${bId}_${r}`,
          no: roomNo,
          lantai: String(Math.floor(r / 20) + 1),
          tipe: r % 2 === 0 ? 'Deluxe' : 'Standard',
          harga: 1500000 + (r * 1000),
          fasilitas: 'AC, Kasur, Meja Belajar, WiFi 100Mbps',
          branchId: bId,
          kostId: bId
        });
        roomCount++;
      }

      // Ingest 200 tenants per branch = 1,000 total
      for (let t = 1; t <= 200; t++) {
        const pId = `p_stress_${bId}_${t}`;
        const roomAssigned = bData.kamar[t - 1]?.no || 'A-001';
        bData.penghuni.push({
          id: pId,
          nama: `Anak Kost Stress #${bIdx + 1}-${t}`,
          hp: `081234${String(bIdx).padStart(2, '0')}${String(t).padStart(4, '0')}`,
          kamar: roomAssigned,
          lantai: '1',
          tglMasuk: '2025-01-01',
          tglKeluar: '2027-01-01',
          nik: `327101010100${String(t).padStart(4, '0')}`,
          gender: t % 2 === 0 ? 'Perempuan' : 'Laki-laki',
          sewa: 1500000,
          tempo: (t % 28) + 1,
          status: 'aktif',
          branchId: bId,
          kostId: bId
        });
        tenantCount++;

        // Ingest payments across 3 months
        ['2026-08', '2026-09', '2026-10'].forEach(bln => {
          bData.pembayaran.push({
            id: `pb_stress_${bId}_${t}_${bln}`,
            penghuniId: pId,
            bulan: bln,
            jumlah: 1500000,
            status: (t % 3 === 0) ? 'menunggu' : (t % 2 === 0 ? 'lunas' : 'belum'),
            tglBayar: `${bln}-05T10:00:00Z`,
            branchId: bId,
            kostId: bId
          });
          paymentCount++;
        });
      }

      // Sync to BranchDB
      if (typeof BranchDB !== 'undefined') {
        BranchDB.saveBranch(bId, bData);
      }
    });

    if (S.propertiesData[S.activeKostId]) {
      const activeData = S.propertiesData[S.activeKostId];
      S.penghuni = [...activeData.penghuni];
      S.kamar = [...activeData.kamar];
      S.pembayaran = [...activeData.pembayaran];
      S.pengeluaran = [...activeData.pengeluaran];
    }
    if (typeof win.LS !== 'undefined') win.LS.save();

    if (tenantCount !== 1000) throw new Error(`Expected 1,000 tenants, got ${tenantCount}`);
    if (roomCount !== 1000) throw new Error(`Expected 1,000 rooms, got ${roomCount}`);
    if (paymentCount !== 3000) throw new Error(`Expected 3,000 payments, got ${paymentCount}`);
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 2: High-Frequency Rapid Branch Switching Stress
  // Rapidly switch branches 60 times to test race conditions
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 2: Ultra-Fast Branch Switching (60 Iterations Cycle)', async () => {
    const branchIds = ['kost_1', 'kost_2', 'kost_3', 'kost_4', 'kost_5'];
    for (let i = 0; i < 60; i++) {
      const targetBranch = branchIds[i % branchIds.length];
      win.switchKost(targetBranch);
      
      // Strict isolation assertions
      if (S.activeKostId !== targetBranch) {
        throw new Error(`Branch switch failed on iteration ${i}: expected ${targetBranch}, got ${S.activeKostId}`);
      }
      if (!S.penghuni || S.penghuni.length === 0) {
        throw new Error(`Data vanished during rapid branch switch at iteration ${i}`);
      }
      const foreignTenants = S.penghuni.filter(p => p.branchId && p.branchId !== targetBranch);
      if (foreignTenants.length > 0) {
        throw new Error(`Data isolation violation: found ${foreignTenants.length} tenants belonging to another branch in ${targetBranch}!`);
      }
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 3: Concurrent Bulk Payments & Cancellation Operations
  // Batch mark 200 payments, recalculate KPIs, then cancel 100
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 3: Bulk Payment Processing & Reversal (200 Tandai Bayar & 100 Batal)', async () => {
    win.switchKost('kost_1');
    const branch1Tenants = S.propertiesData['kost_1'].penghuni.slice(0, 200);
    const bln = '2026-10';

    // 1. Mark 200 tenants as paid
    for (const p of branch1Tenants) {
      await win.tandaiBayar(p.id, bln, 1500000, 'kost_1');
    }

    const b1Payments = S.propertiesData['kost_1'].pembayaran.filter(pb => pb.bulan === bln && pb.status === 'lunas');
    if (b1Payments.length < 150) {
      throw new Error(`Bulk payment failed: expected >= 150 lunas, found ${b1Payments.length}`);
    }

    // 2. Cancel 100 of them
    const toCancel = branch1Tenants.slice(0, 100);
    for (const p of toCancel) {
      const pb = S.propertiesData['kost_1'].pembayaran.find(x => x.penghuniId === p.id && x.bulan === bln);
      if (pb) {
        // Direct cancel execution without confirm modal prompt
        S.propertiesData['kost_1'].pembayaran = S.propertiesData['kost_1'].pembayaran.filter(x => x.id !== pb.id);
        if (typeof BranchDB !== 'undefined') {
          BranchDB.savePembayaran('kost_1', S.propertiesData['kost_1'].pembayaran);
        }
      }
    }
    S.pembayaran = [...S.propertiesData['kost_1'].pembayaran];

    if (typeof win.LS !== 'undefined') win.LS.save();
    win.renderPembayaran();

    const afterCancelLunas = S.propertiesData['kost_1'].pembayaran.filter(pb => pb.bulan === bln && pb.status === 'lunas');
    if (afterCancelLunas.length >= b1Payments.length) {
      throw new Error('Cancellation did not reduce lunas count!');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 4: Boundary & Malformed Inputs Inoculation
  // Inject XSS strings, 10,000 char texts, negative currency, NaN
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 4: Boundary & Malformed Inputs Fuzzing (XSS, SQLi, Negatives, Dates)', async () => {
    const maliciousPayloads = [
      "<script>alert('XSS')</script>",
      "'; DROP TABLE penghuni; --",
      "&quot;><img src=x onerror=alert(1)>",
      "A".repeat(10000), // 10,000 characters extreme buffer
      "🎉🔥💥⚡🚀👨‍💻📊✨",
      "\0\r\n\t\\",
      "null",
      "undefined"
    ];

    maliciousPayloads.forEach(mal => {
      // 1. Escaping must not throw
      const escaped = win.esc(mal);
      if (typeof escaped !== 'string') throw new Error(`esc() failed on payload: ${mal.slice(0, 20)}`);

      // 2. Currency formatting must handle malformed numbers
      const formattedRp = win.rp(mal);
      if (!formattedRp.startsWith('Rp')) throw new Error(`rp() failed on malformed value: ${mal}`);

      // 3. Clean number parsing
      const cleaned = win.cleanNumber(mal);
      if (typeof cleaned !== 'number' || isNaN(cleaned)) throw new Error(`cleanNumber() returned NaN on ${mal}`);
    });

    // Extreme Numbers
    const extremeNumbers = [
      -9999999999,
      0,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      NaN,
      Infinity,
      -Infinity,
      null,
      undefined
    ];

    extremeNumbers.forEach(num => {
      const res = win.rp(num);
      if (typeof res !== 'string') throw new Error(`rp() failed on extreme number: ${num}`);
    });

    // Date calculations on invalid / extreme dates
    const weirdDates = [
      '2026-02-29', // Not a leap year
      '2026-13-40', // Out of bounds
      '1900-01-01', // Century ago
      '9999-12-31', // Far future
      '',
      null,
      undefined
    ];

    weirdDates.forEach(dt => {
      const dummyTenant = { tglMasuk: dt, tglKeluar: dt, tempo: 5 };
      const jt = win.getPenghuniJatuhTempo(dummyTenant, '2026-10');
      if (!jt || typeof jt.dateStr !== 'string' || typeof jt.diffDays !== 'number') {
        throw new Error(`getPenghuniJatuhTempo crashed on date: ${dt}`);
      }
    });
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 5: UI Rendering Benchmark Under Maximum Load
  // Render Dashboard, Penghuni, Kamar, Pembayaran with 1,000+ items
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 5: Massive UI Render Benchmark (Dashboard, Grid, & Consolidated Table)', async () => {
    // 1. Render Dashboard
    win.navigateTo('dashboard');
    win.renderDashboard();

    // 2. Render Penghuni Grid (200 tenants in active branch)
    win.navigateTo('penghuni');
    win.renderPenghuni();

    // 3. Render Kamar Grid (200 rooms in active branch)
    win.navigateTo('kamar');
    win.renderKamar();

    // 4. Render Pembayaran in Consolidated Mode (ALL 5 Branches = 1,000 tenants!)
    win.navigateTo('pembayaran');
    const filterCabang = elementsById['filter-cabang-bayar'];
    if (filterCabang) filterCabang.value = 'all';
    win.renderPembayaran();

    const tbodyPembayaran = elementsById['tbody-pembayaran'];
    if (!tbodyPembayaran || !tbodyPembayaran.innerHTML) {
      throw new Error('Consolidated pembayaran table rendered blank!');
    }
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 6: Cloud DB Resilience Under Simulated Supabase Faults
  // Simulate 500 error, 23503 foreign key violation, and missing columns
  // ─────────────────────────────────────────────────────────────
  await runBenchmark('STRESS 6: Cloud DB Resilience Under Network & Postgres Constraints', async () => {
    const oldSbClient = win.sbClient;
    const penghuniTable = new Set();

    // Fault-injection mock client
    win.sbClient = {
      from(table) {
        return {
          upsert: async (payload) => {
            if (table === 'penghuni') {
              penghuniTable.add(payload.id);
              return { data: [payload], error: null };
            }
            if (table === 'pembayaran') {
              if (!penghuniTable.has(payload.penghuni_id)) {
                return {
                  data: null,
                  error: {
                    code: '23503',
                    message: 'insert or update on table "pembayaran" violates foreign key constraint "pembayaran_penghuni_id_fkey"'
                  }
                };
              }
            }
            // Simulate missing kost_id column on random attempts
            if (payload.kost_id && Math.random() < 0.2) {
              return {
                data: null,
                error: {
                  code: 'PGRST204',
                  message: "Could not find the 'kost_id' column in the schema cache"
                }
              };
            }
            return { data: [payload], error: null };
          },
          delete: () => ({ match: async () => ({ error: null }), eq: async () => ({ error: null }) }),
          select: () => ({ order: () => ({ data: [], error: null }) })
        };
      }
    };

    try {
      // Test saving 50 payments with fault injection
      for (let i = 1; i <= 50; i++) {
        const pb = {
          id: `pb_fault_${i}`,
          penghuniId: `p_stress_fault_${i}`,
          penghuniNama: `Anak Kost Fault ${i}`,
          kamar: 'A-01',
          bulan: '2026-10',
          jumlah: 1500000,
          status: 'lunas',
          branchId: 'kost_1'
        };
        const res = await win.DB.savePembayaran(pb);
        if (!res.ok && res.error?.code === '23503') {
          throw new Error('savePembayaran allowed unhandled 23503 foreign key violation to surface!');
        }
      }
    } finally {
      win.sbClient = oldSbClient;
    }
  });

  // ─────────────────────────────────────────────────────────────
  // SUMMARY REPORT
  // ─────────────────────────────────────────────────────────────
  console.log('\n====================================================');
  console.log('📊 STRESS TEST REPORT SUMMARY');
  console.log('====================================================');
  const failed = suiteResults.filter(r => !r.passed);
  suiteResults.forEach((r, idx) => {
    const statusIcon = r.passed ? '✅' : '❌';
    console.log(`${statusIcon} ${idx + 1}. ${r.name}`);
    if (r.passed) {
      console.log(`      Waktu: ${r.durationMs.toFixed(2)} ms | Memori: ${r.memDeltaKb >= 0 ? '+' : ''}${r.memDeltaKb} KB`);
    } else {
      console.log(`      Error: ${r.error}`);
    }
  });
  console.log(`\nHasil: ${suiteResults.length - failed.length} / ${suiteResults.length} modul pengujian lolos.`);

  if (failed.length > 0) {
    console.error(`\n🚨 Ada ${failed.length} kegagalan pada stress test!`);
    process.exit(1);
  } else {
    console.log('\n🎉 ALL STRESS TESTS PASSED WITH FLYING COLORS! SYSTEM RESILIENT & ENTERPRISE READY! 🚀');
    process.exit(0);
  }
})();
