const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

// Rich DOM Mock
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

global.window = {
  localStorage: mockLocalStorage,
  location: { href: 'http://localhost:3000', protocol: 'http:', hostname: 'localhost' },
  navigator: { userAgent: 'Node' },
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

console.log('--- EVALUATING APP.JS ---');
eval(appJs);

const win = global.window;
const S = win.S;

console.log('--- TESTING MANAGER FLOWS ---');

const errors = [];
function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    console.error(`❌ FAIL: ${name} ->`, err.message);
    errors.push({ name, err });
  }
}

// 1. Seed demo data
test('Seed demo data for testing', () => {
  if (typeof win.seedDemoDataForTesting === 'function') {
    win.seedDemoDataForTesting();
  } else if (typeof win.seedDemoData === 'function') {
    win.seedDemoData(false);
  }
  if (!S.penghuni || S.penghuni.length === 0) {
    throw new Error('Penghuni data is empty after seed');
  }
});

// 2. Login Manager Gavin Utomo
test('Login with Gavin Utomo Manager Account', () => {
  const gavin = S.akun.find(a => a.email === 'gavinutomo4@gmail.com');
  if (!gavin) throw new Error('Gavin account not found');
  win.loginWithAkun(gavin);
  if (win.currentUser?.role !== 'manager') throw new Error('Role is not manager');
  if (elementsById['screen-app'].style.display === 'none') throw new Error('screen-app is still hidden');
});

// 3. Render Dashboard
test('Render Dashboard and Financial KPIs', () => {
  win.renderDashboard();
  const kpiRow = elementsById['kpi-row'];
  if (!kpiRow || !kpiRow.innerHTML.includes('Total Penghuni')) {
    throw new Error('Dashboard KPI row missing Total Penghuni');
  }
});

// 4. Action Center Layout and Resilient State
test('Action Center Layout and Resilient State', () => {
  win.renderActionCenter();
  const ac = elementsById['dash-action-center'];
  if (!ac || ac.style.display === 'none') {
    throw new Error('Action Center is hidden instead of resilient empty state!');
  }
  if (ac.innerHTML.includes('action-card')) {
    if (!ac.innerHTML.includes('action-card-header') || !ac.innerHTML.includes('action-card-body') || !ac.innerHTML.includes('action-card-info')) {
      throw new Error('Action card missing structured header, body, or info container!');
    }
  }
});

// 5. Switch Branch to kost_2 and verify isolation
test('Switch Branch to kost_2 (Kost Graha Asri Dago)', () => {
  win.switchKost('kost_2');
  if (S.activeKostId !== 'kost_2') throw new Error('Failed to switch to kost_2');
  if (elementsById['topbar-prop-name'].textContent.includes('Dago') === false) {
    throw new Error('Topbar prop name not updated to Dago');
  }
  // Sidebar brand must remain 'Kost Manager'
  if (elementsById['sb-kost-name'].textContent !== 'Kost Manager') {
    throw new Error(`Sidebar brand changed to "${elementsById['sb-kost-name'].textContent}" instead of "Kost Manager"!`);
  }
});

// 6. Test Tenant (Penghuni) Management
test('Navigate to page-penghuni and render grid', () => {
  win.switchKost('kost_1');
  win.navigateTo('penghuni');
  const grid = elementsById['penghuni-grid'];
  if (!grid || !grid.innerHTML) throw new Error('Penghuni grid empty');
});

// 7. Test Add Tenant Modal Opening and Empty Room Population
test('Open Modal Penghuni and populate vacant rooms', () => {
  win.openModalPenghuni();
  const modal = elementsById['modal-penghuni'];
  if (!modal.classList.contains('open')) throw new Error('Modal penghuni not open');
  const selKamar = elementsById['field-kamar-select'];
  if (!selKamar || selKamar.children.length === 0) {
    throw new Error('Vacant room selector empty');
  }
});

// 8. Test Payments (Pembayaran)
test('Navigate to page-pembayaran and check bills', () => {
  win.navigateTo('pembayaran');
  const tbody = elementsById['tbody-pembayaran'];
  if (!tbody || !tbody.innerHTML) throw new Error('Pembayaran tbody empty');
});

// 9. Test Operational Expenses (Pengeluaran)
test('Navigate to page-pengeluaran and render expenses', () => {
  win.navigateTo('pengeluaran');
  const tbody = elementsById['tbody-pengeluaran'];
  if (!tbody || !tbody.innerHTML) throw new Error('Pengeluaran tbody empty');
  const kpiPengeluaran = elementsById['kpi-pengeluaran'];
  if (!kpiPengeluaran || !kpiPengeluaran.innerHTML) throw new Error('KPI pengeluaran empty');
});

// 10. Test Add Expense Modal and saving new expense
test('Add new operational expense via form', () => {
  win.openModalCatatPengeluaran();
  const modal = elementsById['modal-pengeluaran'];
  if (!modal.classList.contains('open')) throw new Error('Modal pengeluaran not open');

  elementsById['field-pengeluaran-tgl'].value = '2026-10-10';
  elementsById['field-pengeluaran-kategori'].value = 'Listrik/PLN';
  elementsById['field-pengeluaran-jumlah'].value = '500.000';
  elementsById['field-pengeluaran-ket'].value = 'Beli Token Listrik Utama';

  const form = elementsById['form-pengeluaran'];
  form.dispatchEvent('submit');

  const found = S.pengeluaran.find(e => e.keterangan === 'Beli Token Listrik Utama');
  if (!found) throw new Error('New expense not saved in S.pengeluaran');
  if (found.jumlah !== 500000) throw new Error(`Expense jumlah parsed incorrectly: ${found.jumlah}`);
});

// 11. Test Lease Expiry and Contract Extension
test('Contract Expiry calculation and Extension modal', () => {
  const p = S.penghuni[0];
  if (!p) throw new Error('No tenant found');
  const expStatus = win.getContractExpiryStatus(p);
  if (!expStatus) throw new Error('getContractExpiryStatus returned null');

  win.openModalPerpanjangKontrak(p.id);
  const modal = elementsById['modal-perpanjang-kontrak'];
  if (!modal.classList.contains('open')) throw new Error('Modal perpanjang kontrak not open');
});

// 12. Test Settings (Pengaturan)
test('Navigate to page-pengaturan and test branch settings', () => {
  win.navigateTo('pengaturan');
  const cabangList = elementsById['settings-cabang-list'];
  if (!cabangList || !cabangList.innerHTML) throw new Error('Cabang list empty in settings');
});

// 13. Test KTP OCR Gender Extraction (Perempuan vs Laki-laki & BERLAKU bug prevention)
test('KTP OCR Gender Extraction and Dukcapil NIK standard', () => {
  // Test case A: KTP Wanita with word 'BERLAKU' (must NOT be tricked into Laki-laki)
  const ocrFemale = `
    PROVINSI JAWA BARAT
    NIK : 3273015502990002
    Nama : SITI AMINAH
    Tempat/Tgl Lahir : BANDUNG, 15-02-1999
    Jenis Kelamin : PEREMPUAN
    Alamat : JL. DAGO NO. 10
    BERLAKU HINGGA : SEUMUR HIDUP
  `;
  const parsedFemale = win.parseKtpText(ocrFemale);
  if (parsedFemale.gender !== 'Perempuan') {
    throw new Error(`Expected gender 'Perempuan', but got '${parsedFemale.gender}' (BERLAKU false-positive bug)!`);
  }

  // Test case B: KTP Pria
  const ocrMale = `
    PROVINSI DKI JAKARTA
    NIK : 3171011502900001
    Nama : BUDI PRASETYO
    Tempat/Tgl Lahir : JAKARTA, 15-02-1990
    Jenis Kelamin : LAKI-LAKI
    BERLAKU HINGGA : SEUMUR HIDUP
  `;
  const parsedMale = win.parseKtpText(ocrMale);
  if (parsedMale.gender !== 'Laki-laki') {
    throw new Error(`Expected gender 'Laki-laki', but got '${parsedMale.gender}'!`);
  }

  // Test case C: NIK with DD > 40 (female birthdate: 15 + 40 = 55)
  const ocrNikFemaleOnly = `
    NIK : 3201015508950003
    Nama : RATNA SARI
    BERLAKU HINGGA : SEUMUR HIDUP
  `;
  const parsedNikFemale = win.parseKtpText(ocrNikFemaleOnly);
  if (parsedNikFemale.gender !== 'Perempuan') {
    throw new Error(`Expected gender 'Perempuan' from NIK 55, but got '${parsedNikFemale.gender}'!`);
  }
});

// 14. Test Indonesian Mobile Phone Format starting with 08
test('Phone validation strictly requiring real 08... prefix', () => {
  if (!win.isValidIndoPhone('081234567890')) {
    throw new Error('081234567890 should be valid!');
  }
  if (!win.isValidIndoPhone('0896123456789')) {
    throw new Error('0896123456789 should be valid!');
  }
  // Normalization of 628 into 08
  if (win.normalizeIndoPhone('+6281234567890') !== '081234567890') {
    throw new Error('+6281234567890 should normalize to 081234567890');
  }
  if (win.normalizeIndoPhone('6285712345678') !== '085712345678') {
    throw new Error('6285712345678 should normalize to 085712345678');
  }
  // Invalid phone numbers
  if (win.isValidIndoPhone('0211234567')) {
    throw new Error('Landline 021 should NOT be accepted as real mobile 08!');
  }
  if (win.isValidIndoPhone('08123')) {
    throw new Error('Too short phone should NOT be accepted!');
  }
  if (win.isValidIndoPhone('071234567890')) {
    throw new Error('Non-08 prefix should NOT be accepted!');
  }
});

// 15. Zero Dead-Code: Verify Email field removed completely from tenant form DOM
test('Zero Dead-Code: Email field completely removed from tenant form', () => {
  if (elementsById['field-email']) {
    throw new Error('field-email element still exists in DOM! Must be completely removed per Zero Dead-Code Policy.');
  }
});

console.log('\n--- SIMULATION SUMMARY ---');
console.log(`Total errors: ${errors.length}`);
if (errors.length > 0) {
  console.log(errors);
}
