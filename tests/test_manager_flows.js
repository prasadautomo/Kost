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
const testPromises = [];
function test(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      const p = res.then(() => {
        console.log(`✅ PASS: ${name}`);
      }).catch(err => {
        console.error(`❌ FAIL: ${name} ->`, err.message);
        errors.push({ name, err });
      });
      testPromises.push(p);
      return;
    }
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
test('Contract Expiry calculation and Extension modal', async () => {
  const p = S.penghuni[0];
  if (!p) throw new Error('No tenant found');
  const expStatus = win.getContractExpiryStatus(p);
  if (!expStatus) throw new Error('getContractExpiryStatus returned null');

  win.openModalPerpanjangKontrak(p.id);
  const modal = elementsById['modal-perpanjang-kontrak'];
  if (!modal.classList.contains('open')) throw new Error('Modal perpanjang kontrak not open');

  const sewaInput = elementsById['renew-sewa'];
  if (!sewaInput.value.startsWith('Rp')) {
    throw new Error(`Harga sewa baru should be formatted with 'Rp', got: ${sewaInput.value}`);
  }

  const tglInput = elementsById['renew-tgl-keluar'];
  if (!tglInput || !tglInput.value) {
    throw new Error('Tanggal berakhir baru input is empty');
  }

  // Test form submission
  const oldTglKeluar = p.tglKeluar;
  const formRenew = elementsById['form-perpanjang-kontrak'];
  if (formRenew && formRenew.onsubmit) {
    const mockEvent = { preventDefault: () => {} };
    await formRenew.onsubmit(mockEvent);
    if (modal.classList.contains('open')) throw new Error('Modal did not close on renewal submit');
  }
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

// 16. Zero Dead-Code: Verify edit-cabang-hp completely removed from branch modal DOM
test('Zero Dead-Code: edit-cabang-hp removed completely from branch edit modal', () => {
  if (elementsById['edit-cabang-hp']) {
    throw new Error('edit-cabang-hp element still exists in DOM! Must be completely removed per Zero Dead-Code Policy.');
  }
});

// 17. Verify Branch Settings Cards rendered without phone number and bank details
test('Branch Settings Cards rendered without phone number and bank info', () => {
  win.renderSettingsCabangList();
  const container = elementsById['settings-cabang-list'];
  if (!container || !container.innerHTML) throw new Error('settings-cabang-list container empty');
  if (container.innerHTML.includes('Telp/WA:')) {
    throw new Error('Branch cards still contain Telp/WA:!');
  }
  if (container.innerHTML.includes('Bank BCA') || container.innerHTML.includes('Bank Mandiri') || container.innerHTML.includes('Bank BNI') || container.innerHTML.includes('Bank BRI')) {
    throw new Error('Branch cards still contain Bank details!');
  }
});

// 18. Verify Light Theme Toggle and CSS Token Structure
test('Theme switcher toggles between Dark and Light mode seamlessly', () => {
  const toggleBtn = elementsById['theme-toggle'];
  const themeIcon = elementsById['theme-icon'];
  if (!toggleBtn) throw new Error('theme-toggle element not found!');

  // Trigger toggle to switch to light
  mockDocument.documentElement.setAttribute('data-theme', 'dark');
  toggleBtn.click();
  if (mockDocument.documentElement.getAttribute('data-theme') !== 'light') {
    throw new Error('data-theme should be light after clicking toggle!');
  }
  if (themeIcon.textContent !== 'dark_mode') {
    throw new Error(`theme-icon should show "dark_mode" in light mode, got: ${themeIcon.textContent}`);
  }

  // Verify style.css includes complete light surface tokens
  const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
  if (!css.includes('--surface-container-low:     #f8fafc;')) {
    throw new Error('Missing --surface-container-low in light theme!');
  }
  if (!css.includes('[data-theme="light"] .nav-item.active')) {
    throw new Error('Missing light theme active nav override in style.css!');
  }

  // Toggle back to dark
  toggleBtn.click();
  if (mockDocument.documentElement.getAttribute('data-theme') !== 'dark') {
    throw new Error('data-theme should be dark after second click!');
  }
  if (themeIcon.textContent !== 'light_mode') {
    throw new Error(`theme-icon should show "light_mode" in dark mode, got: ${themeIcon.textContent}`);
  }
});

// 19. Verify Strict Multi-Branch Database Isolation (BranchDB)
test('BranchDB strictly isolates tenants, rooms, payments, and expenses per branch', () => {
  const branchIds = ['kost_1', 'kost_2', 'kost_3', 'kost_4', 'kost_5'];
  
  // Verify each branch has its own isolated database entry in localStorage
  branchIds.forEach(bid => {
    const pKey = `sk3_branch_${bid}_penghuni`;
    const kKey = `sk3_branch_${bid}_kamar`;
    const pbKey = `sk3_branch_${bid}_pembayaran`;
    const expKey = `sk3_branch_${bid}_pengeluaran`;
    
    if (!mockLocalStorage.getItem(pKey)) throw new Error(`Missing BranchDB key: ${pKey}`);
    if (!mockLocalStorage.getItem(kKey)) throw new Error(`Missing BranchDB key: ${kKey}`);
    if (!mockLocalStorage.getItem(pbKey)) throw new Error(`Missing BranchDB key: ${pbKey}`);
    if (!mockLocalStorage.getItem(expKey)) throw new Error(`Missing BranchDB key: ${expKey}`);
  });

  // Verify tenants in kost_1 and kost_2 are distinct sets
  const p1 = global.window.BranchDB.getPenghuni('kost_1');
  const p2 = global.window.BranchDB.getPenghuni('kost_2');
  if (!p1 || p1.length === 0) throw new Error('Branch 1 tenants should not be empty');
  if (!p2 || p2.length === 0) throw new Error('Branch 2 tenants should not be empty');

  const names1 = p1.map(x => x.nama);
  const names2 = p2.map(x => x.nama);
  const overlap = names1.filter(n => names2.includes(n));
  if (overlap.length > 0) {
    throw new Error(`Data pollution detected between kost_1 and kost_2: [${overlap.join(', ')}]`);
  }

  // Adding a tenant to kost_2 must not alter kost_1
  global.window.switchKost('kost_2');
  const initialCount1 = global.window.BranchDB.getPenghuni('kost_1').length;
  const initialCount2 = global.window.BranchDB.getPenghuni('kost_2').length;

  elementsById['field-nama'].value = 'Penghuni Khusus Dago';
  elementsById['field-hp'].value = '081299998888';
  elementsById['field-kamar'].value = 'D-09';
  elementsById['field-tgl-masuk'].value = '2026-04-01';
  elementsById['field-nik'].value = '3273010101900001';
  elementsById['field-gender'].value = 'Laki-laki';
  elementsById['field-sewa'].value = '1.850.000';
  elementsById['form-penghuni'].dispatchEvent('submit');

  const afterCount1 = global.window.BranchDB.getPenghuni('kost_1').length;
  const afterCount2 = global.window.BranchDB.getPenghuni('kost_2').length;

  if (afterCount1 !== initialCount1) {
    throw new Error(`kost_1 tenant count leaked! Expected ${initialCount1}, got ${afterCount1}`);
  }
  if (afterCount2 !== initialCount2 + 1) {
    throw new Error(`kost_2 tenant count should increment by 1! Got ${afterCount2}`);
  }

  // Adding expense to kost_2 must not leak to kost_1
  const initExp1 = global.window.BranchDB.getPengeluaran('kost_1').length;
  elementsById['field-pengeluaran-id'].value = 'exp-dago-isolated';
  elementsById['field-pengeluaran-tgl'].value = '2026-04-05';
  elementsById['field-pengeluaran-kategori'].value = 'Listrik/PLN';
  elementsById['field-pengeluaran-jumlah'].value = '350000';
  elementsById['field-pengeluaran-ket'].value = 'Token Listrik Dago Isolated';
  elementsById['form-pengeluaran'].dispatchEvent('submit');

  const afterExp1 = global.window.BranchDB.getPengeluaran('kost_1').length;
  const afterExp2 = global.window.BranchDB.getPengeluaran('kost_2');
  if (afterExp1 !== initExp1) {
    throw new Error(`kost_1 expenses polluted! Expected ${initExp1}, got ${afterExp1}`);
  }
  const foundInDago = afterExp2.find(x => x.id === 'exp-dago-isolated');
  if (!foundInDago) {
    throw new Error('New expense not saved in kost_2 BranchDB database!');
  }
});

// 20. Verify Multi-Branch Filtering across Penghuni, Pembayaran, and Pengeluaran
test('Multi-branch filters seamlessly toggle between active branch and consolidated views', () => {
  // Penghuni Filter
  global.window.switchKost('kost_1');
  const selPenghuni = elementsById['filter-cabang-penghuni'];
  selPenghuni.value = 'active';
  global.window.renderPenghuni();

  selPenghuni.value = 'all';
  global.window.renderPenghuni();
  const gridHtml = elementsById['penghuni-grid'].innerHTML;
  const listHtml = elementsById['tbody-penghuni'].innerHTML;
  if (!gridHtml.includes('badge-accent') && !listHtml.includes('badge-accent')) {
    throw new Error('Consolidated penghuni view must show branch badges!');
  }

  // Pengeluaran Filter
  const selExp = elementsById['filter-cabang-pengeluaran'];
  selExp.value = 'active';
  global.window.renderPengeluaran();
  const expActive = elementsById['tbody-pengeluaran'].innerHTML;

  selExp.value = 'all';
  global.window.renderPengeluaran();
  const expAll = elementsById['tbody-pengeluaran'].innerHTML;
  if (!expAll.includes('badge-accent')) {
    throw new Error('Consolidated pengeluaran view must show branch badges!');
  }
});

// 21. Verify DB.safeUpsert gracefully falls back when Supabase schema lacks kost_id
test('DB.safeUpsert gracefully drops kost_id and succeeds without error toast when column is missing in Supabase', async () => {
  let callCount = 0;
  let lastReceivedPayload = null;
  const mockSbClient = {
    from(table) {
      return {
        async upsert(payload) {
          callCount++;
          lastReceivedPayload = { ...payload };
          if (payload.kost_id) {
            return {
              error: {
                code: 'PGRST204',
                message: "Could not find the 'kost_id' column of 'penghuni' in the schema cache"
              }
            };
          }
          return { data: [{ id: payload.id }], error: null };
        }
      };
    }
  };

  const oldSbClient = global.window.sbClient;
  global.window.sbClient = mockSbClient;
  // Clear any existing cache for this test
  if (global.window.DB) {
    global.window.DB._unsupportedColumns = {};
  }

  try {
    const res = await global.window.DB.safeUpsert('penghuni', {
      id: 'p-test-compat',
      nama: 'Testing Supabase Schema Tolerance',
      kost_id: 'kost_1'
    }, 'Penghuni');

    if (!res.ok) throw new Error('safeUpsert failed instead of retrying gracefully!');
    if (callCount !== 2) throw new Error(`Expected 2 upsert attempts, got ${callCount}`);
    if (lastReceivedPayload.kost_id) throw new Error('Retried payload still contained kost_id!');
    if (!global.window.DB._unsupportedColumns['penghuni.kost_id']) {
      throw new Error('Missing column not cached in DB._unsupportedColumns!');
    }

    // Second call should omit kost_id proactively in 1 call
    callCount = 0;
    const res2 = await global.window.DB.safeUpsert('penghuni', {
      id: 'p-test-compat-2',
      nama: 'Second Test Proactive Omission',
      kost_id: 'kost_1'
    }, 'Penghuni');

    if (!res2.ok) throw new Error('Second safeUpsert failed!');
    if (callCount !== 1) throw new Error(`Expected 1 upsert call on second attempt due to cache, got ${callCount}`);
    if (lastReceivedPayload.kost_id) throw new Error('Second payload still contained kost_id despite cache!');
  } finally {
    global.window.sbClient = oldSbClient;
  }
});

Promise.all(testPromises).then(() => {
  console.log('\n--- SIMULATION SUMMARY ---');
  console.log(`Total errors: ${errors.length}`);
  if (errors.length > 0) {
    console.log(errors);
    process.exit(1);
  }
});

