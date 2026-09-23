/* ============================================================
   SIKOST – app.js  v3.0
   Local Auth · Role-Based · No External Dependencies
   ============================================================ */
'use strict';

// ── STATE ────────────────────────────────────────────────────
let S = {
  penghuni:   [],
  kamar:      [],
  pembayaran: [],
  // akun = [{id, nama, email, pwHash, role:'manager'|'penghuni', penghuniId:null}]
  akun: [],
  kost: { nama:'SiKost', pemilik:'', alamat:'', hp:'', totalKamar:10 }
};

let currentUser = null; // akun object (tanpa pwHash)
let editId   = null;
let detailId = null;
let currentView = 'grid';
let confirmCb   = null;
const CHARTS    = {};

// ── STORAGE ──────────────────────────────────────────────────
const LS = {
  save() {
    localStorage.setItem('sk3_penghuni',   JSON.stringify(S.penghuni));
    localStorage.setItem('sk3_kamar',      JSON.stringify(S.kamar));
    localStorage.setItem('sk3_pembayaran', JSON.stringify(S.pembayaran));
    localStorage.setItem('sk3_akun',       JSON.stringify(S.akun));
    localStorage.setItem('sk3_kost',       JSON.stringify(S.kost));
  },
  load() {
    const keys = ['penghuni','kamar','pembayaran','akun','kost'];
    keys.forEach(k => {
      const v = localStorage.getItem('sk3_' + k);
      if (v) try { S[k] = JSON.parse(v); } catch {}
    });
  },
  saveSession(u) { localStorage.setItem('sk3_session', JSON.stringify(u)); },
  loadSession()  { const v = localStorage.getItem('sk3_session'); return v ? JSON.parse(v) : null; },
  clearSession() { localStorage.removeItem('sk3_session'); }
};

// ── CRYPTO (simple hash untuk password) ──────────────────────
// Menggunakan SHA-256 via SubtleCrypto (tersedia di semua browser modern)
async function hashPw(pw) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── UTILS ────────────────────────────────────────────────────
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const rp   = n  => 'Rp ' + (Number(n)||0).toLocaleString('id-ID');
const fmtD = s  => s ? new Date(s).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'}) : '–';
const init = n  => (n||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
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

function toast(msg, type='ok') {
  const w=document.getElementById('toast-wrap');
  const el=document.createElement('div');
  el.className='toast '+(type==='err'?'err':type==='ok'?'ok':'');
  el.textContent=msg;
  w.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; el.style.transition='0.3s'; setTimeout(()=>el.remove(),300); },2800);
}

function confirm_dlg(title, msg, cb, btnLabel='Ya, Lanjutkan') {
  $('confirm-title').textContent=title;
  $('confirm-message').textContent=msg;
  $('confirm-ok').textContent=btnLabel;
  confirmCb=cb;
  openModal('modal-confirm');
}

const $ = id => document.getElementById(id);
const openModal  = id => $(id).classList.add('open');
const closeModal = id => $(id).classList.remove('open');

// ── PASSWORD TOGGLE (show/hide) ───────────────────────────────
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
  const target=$(name); if(target) target.style.display=(name==='screen-app'?'flex':'flex');
}

// ── SETUP SCREEN (pertama kali) ───────────────────────────────
$('form-setup').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama  = $('setup-nama').value.trim();
  const email = $('setup-email').value.trim().toLowerCase();
  const pw    = $('setup-pw').value;
  const kost  = $('setup-kost').value.trim();

  if (!nama)         { toast('Nama wajib diisi!','err'); return; }
  if (!email)        { toast('Email wajib diisi!','err'); return; }
  if (pw.length < 6) { toast('Password minimal 6 karakter!','err'); return; }

  const pwHash = await hashPw(pw);
  const akun = { id: uid(), nama, email, pwHash, role: 'manager', penghuniId: null };
  S.akun.push(akun);
  if (kost) S.kost.nama = kost;
  LS.save();
  toast('Akun Manager berhasil dibuat! 🎉');
  loginWithAkun(akun);
});

// ── LOGIN SCREEN ──────────────────────────────────────────────
$('form-login').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = $('login-email').value.trim().toLowerCase();
  const pw    = $('login-pw').value;

  const akun = S.akun.find(a => a.email === email);
  if (!akun) { showLoginErr('Email tidak ditemukan.'); return; }

  const hash = await hashPw(pw);
  if (hash !== akun.pwHash) { showLoginErr('Password salah.'); return; }

  $('login-err').style.display = 'none';
  loginWithAkun(akun);
});

function showLoginErr(msg) {
  $('login-err').style.display = 'flex';
  $('login-err-msg').textContent = msg;
}

function loginWithAkun(akun) {
  // Save session (tanpa pwHash)
  const session = { id:akun.id, nama:akun.nama, email:akun.email, role:akun.role, penghuniId:akun.penghuniId };
  currentUser = session;
  LS.saveSession(session);
  enterApp();
}

// ── LOGOUT ────────────────────────────────────────────────────
function logout() {
  currentUser = null;
  LS.clearSession();
  // Reset login form
  $('form-login').reset();
  $('login-err').style.display='none';
  showScreen('screen-login');
  toast('Berhasil keluar.');
}
$('btn-logout').addEventListener('click', logout);

// ── APP ENTER ─────────────────────────────────────────────────
function enterApp() {
  showScreen('screen-app');
  buildSidebar();
  renderUserChip();
  const firstPage = currentUser.role === 'manager' ? 'dashboard' : 'tenant';
  navigateTo(firstPage);
}

// ── SIDEBAR ───────────────────────────────────────────────────
const NAV_MANAGER = [
  { id:'dashboard',  icon:'▦',  label:'Dashboard' },
  { id:'penghuni',   icon:'👥', label:'Data Penghuni', badge:true },
  { id:'kamar',      icon:'🛏',  label:'Kamar' },
  { id:'pembayaran', icon:'💳', label:'Pembayaran' },
  { id:'pengaturan', icon:'⚙',  label:'Pengaturan' },
];
const NAV_TENANT = [
  { id:'tenant', icon:'🪪', label:'Data Saya' },
  { id:'profil', icon:'👤', label:'Profil Akun' },
];

function buildSidebar() {
  const isMgr = currentUser.role === 'manager';
  const items  = isMgr ? NAV_MANAGER : NAV_TENANT;
  $('sidebar-nav').innerHTML = items.map(item=>`
    <a href="#" class="nav-item" data-page="${item.id}" id="nav-${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label-text">${item.label}</span>
      ${item.badge?`<span class="nav-badge" id="badge-${item.id}">0</span>`:''}
    </a>`).join('');
  $('sidebar-nav').querySelectorAll('.nav-item').forEach(el =>
    el.addEventListener('click', e=>{ e.preventDefault(); navigateTo(el.dataset.page); })
  );
  $('sb-role-badge').textContent = isMgr ? 'Manager' : 'Penghuni';
  $('sb-role-badge').className   = 'brand-role' + (isMgr ? '' : ' tenant');
  $('sb-kost-name').textContent  = S.kost.nama || 'SiKost';
}

function renderUserChip() {
  $('user-name').textContent  = currentUser.nama  || '–';
  $('user-email').textContent = currentUser.email || '–';
  $('user-avatar-fallback').textContent = init(currentUser.nama);
}

// ── NAVIGATION ────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'Dashboard', penghuni:'Data Penghuni', kamar:'Kamar',
  pembayaran:'Pembayaran', pengaturan:'Pengaturan',
  tenant:'Data Saya', profil:'Profil Akun'
};

function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const pageEl=$('page-'+page); if(pageEl) pageEl.classList.add('active');
  const navEl =$('nav-'+page);  if(navEl)  navEl.classList.add('active');
  $('topbar-title').textContent = PAGE_TITLES[page]||page;

  const isMgr = currentUser?.role==='manager';
  $('btn-tambah-penghuni').style.display = (isMgr && page==='penghuni') ? 'inline-flex' : 'none';
  $('btn-export-csv').style.display      = (isMgr && page==='penghuni') ? 'inline-flex' : 'none';

  if (page==='dashboard')  renderDashboard();
  if (page==='penghuni')   renderPenghuni();
  if (page==='kamar')      renderKamar();
  if (page==='pembayaran') renderPembayaran();
  if (page==='pengaturan') renderPengaturan();
  if (page==='tenant')     renderTenant();
  if (page==='profil')     renderProfil();
}

// data-page inside content
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-page]');
  if (btn && !btn.classList.contains('nav-item')) { e.preventDefault(); navigateTo(btn.dataset.page); }
});

// ── THEME ─────────────────────────────────────────────────────
$('theme-toggle').addEventListener('click', () => {
  const html=document.documentElement;
  const dark=html.getAttribute('data-theme')==='dark';
  html.setAttribute('data-theme', dark?'light':'dark');
  $('theme-icon').textContent = dark?'🌙':'☀️';
  localStorage.setItem('sk3_theme', dark?'light':'dark');
  if ($('page-dashboard').classList.contains('active')) renderCharts();
});

// ── DASHBOARD ─────────────────────────────────────────────────
function renderDashboard() {
  const h=new Date().getHours();
  const greet=h<11?'Selamat pagi':h<15?'Selamat siang':h<18?'Selamat sore':'Selamat malam';
  $('dash-greeting').textContent=greet+', '+(currentUser?.nama?.split(' ')[0]||'')+' 👋';
  $('dash-date').textContent=new Date().toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});

  const aktif=S.penghuni.filter(p=>p.status==='aktif');
  const kamarTerisi=[...new Set(aktif.map(p=>p.kamar).filter(Boolean))].length;
  const pendapatan=aktif.reduce((s,p)=>s+(Number(p.sewa)||0),0);
  const bln=thisMonth();
  const lunas=S.pembayaran.filter(pb=>pb.bulan===bln&&pb.status==='lunas');
  const terkumpul=lunas.reduce((s,pb)=>s+(Number(pb.jumlah)||0),0);

  $('kpi-row').innerHTML=`
    <div class="kpi"><div class="kpi-label">Total Penghuni</div><div class="kpi-value">${S.penghuni.length}</div><div class="kpi-sub">${aktif.length} aktif saat ini</div></div>
    <div class="kpi"><div class="kpi-label">Kamar Terisi</div><div class="kpi-value">${kamarTerisi}</div><div class="kpi-sub">dari ${S.kost.totalKamar||'?'} total kamar</div></div>
    <div class="kpi"><div class="kpi-label">Pendapatan / Bulan</div><div class="kpi-value" style="font-size:1.05rem">${rp(pendapatan)}</div><div class="kpi-sub">target bulanan</div></div>
    <div class="kpi"><div class="kpi-label">Terkumpul Bulan Ini</div><div class="kpi-value" style="font-size:1.05rem;color:var(--green)">${rp(terkumpul)}</div><div class="kpi-sub">${lunas.length} dari ${aktif.length} penghuni lunas</div></div>
  `;

  const latest=[...S.penghuni].sort((a,b)=>(b.tglMasuk||'').localeCompare(a.tglMasuk||'')).slice(0,6);
  $('tbody-terbaru').innerHTML=latest.map(p=>`
    <tr>
      <td><strong>${p.nama}</strong></td>
      <td>${p.kamar?'Kamar '+p.kamar:'–'}</td>
      <td>${fmtD(p.tglMasuk)}</td>
      <td>${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Keluar</span>'}</td>
    </tr>`).join('')||`<tr><td colspan="4" style="text-align:center;color:var(--text-3);padding:20px;font-size:0.8rem">Belum ada penghuni. Klik "Tambah Penghuni" untuk mulai.</td></tr>`;

  const allKamar=[...new Set([...S.kamar.map(k=>k.no),...S.penghuni.map(p=>p.kamar).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const occ={}; aktif.forEach(p=>p.kamar&&(occ[p.kamar]=true));
  $('quick-kamar').innerHTML=allKamar.map(no=>`<span class="qk-chip ${occ[no]?'terisi':'kosong'}">${no}</span>`).join('')||'<span style="font-size:0.78rem;color:var(--text-3);padding:12px;display:block">Belum ada kamar.</span>';

  if ($('badge-penghuni')) $('badge-penghuni').textContent=S.penghuni.length;
  renderCharts();
}

function renderCharts() {
  const aktif=S.penghuni.filter(p=>p.status==='aktif').length;
  const nonAktif=S.penghuni.length-aktif;
  const motor=S.penghuni.filter(p=>p.kendaraan==='motor').length;
  const mobil=S.penghuni.filter(p=>p.kendaraan==='mobil').length;
  const both=S.penghuni.filter(p=>p.kendaraan==='motor & mobil').length;
  const noKen=S.penghuni.length-motor-mobil-both;
  const bln=thisMonth();
  const lunas=S.pembayaran.filter(pb=>pb.bulan===bln&&pb.status==='lunas').length;
  const belum=Math.max(0,S.penghuni.filter(p=>p.status==='aktif').length-lunas);

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const tick=isDark?'#a3a3a3':'#6b7280';
  const grid=isDark?'#262626':'#f3f4f6';

  const donut={responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:tick,font:{size:11},padding:10,boxWidth:10,usePointStyle:true}}}};

  if(CHARTS.bayar) CHARTS.bayar.destroy();
  CHARTS.bayar=new Chart($('chart-bayar'),{type:'bar',data:{labels:['Lunas','Belum Bayar'],datasets:[{data:[lunas,belum],backgroundColor:['#16a34a','#dc2626'],borderRadius:6,borderSkipped:false}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:tick,font:{size:11}},grid:{display:false}},y:{ticks:{color:tick,stepSize:1,font:{size:11}},grid:{color:grid}}}}});
  $('chart-legend').innerHTML=`<div class="legend-item"><span class="legend-dot" style="background:#16a34a"></span>Lunas: ${lunas}</div><div class="legend-item"><span class="legend-dot" style="background:#dc2626"></span>Belum: ${belum}</div>`;

  if(CHARTS.status) CHARTS.status.destroy();
  CHARTS.status=new Chart($('chart-status'),{type:'doughnut',data:{labels:['Aktif','Tidak Aktif'],datasets:[{data:[aktif,nonAktif],backgroundColor:['#16a34a','#dc2626'],borderColor:'transparent',hoverOffset:4}]},options:donut});

  if(CHARTS.kendaraan) CHARTS.kendaraan.destroy();
  CHARTS.kendaraan=new Chart($('chart-kendaraan'),{type:'doughnut',data:{labels:['Motor','Mobil','Motor & Mobil','Tidak Ada'],datasets:[{data:[motor,mobil,both,noKen],backgroundColor:['#2563eb','#7c3aed','#ea580c','#9ca3af'],borderColor:'transparent',hoverOffset:4}]},options:donut});
}

// ── PENGHUNI RENDER ───────────────────────────────────────────
function getPenghuniFiltered() {
  const q=$('cari-penghuni')?.value.toLowerCase()||'';
  const fs=$('filter-status')?.value||'';
  const fk=$('filter-kendaraan')?.value||'';
  return S.penghuni.filter(p=>{
    const mQ=!q||[p.nama,p.nik,p.kamar,p.hp].some(v=>(v||'').toLowerCase().includes(q));
    return mQ && (!fs||p.status===fs) && (!fk||p.kendaraan===fk);
  });
}

function renderPenghuni() {
  const list=getPenghuniFiltered();
  if ($('badge-penghuni')) $('badge-penghuni').textContent=S.penghuni.length;
  const empty=$('empty-penghuni'), grid=$('penghuni-grid'), listW=$('penghuni-list-wrap');
  if (list.length===0) { empty.style.display='block'; grid.style.display='none'; listW.style.display='none'; return; }
  empty.style.display='none';
  if (currentView==='grid') { grid.style.display='grid'; listW.style.display='none'; renderPenghuniGrid(list); }
  else { grid.style.display='none'; listW.style.display='block'; renderPenghuniList(list); }
}

function renderPenghuniGrid(list) {
  $('penghuni-grid').innerHTML=list.map(p=>{
    const av=p.foto?`<img class="pg-avatar" src="${p.foto}" alt="${p.nama}"/>`:`<div class="pg-avatar-ph">${init(p.nama)}</div>`;
    const st=p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Tidak Aktif</span>';
    const ke=p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge badge-blue">${p.kendaraan}</span>`:'';
    return `<div class="pg-card ${p.status!=='aktif'?'inactive':''}" onclick="openDetail('${p.id}')">
      ${av}
      <div class="pg-name" title="${p.nama}">${p.nama}</div>
      <div class="pg-meta">${p.kamar?'Kamar '+p.kamar:'–'} · ${p.pekerjaan||'–'}</div>
      <div class="pg-tags">${st}${ke?' '+ke:''}</div>
      <div class="pg-actions" onclick="event.stopPropagation()">
        <button class="btn-outline btn-sm" onclick="openDetail('${p.id}')">Detail</button>
        <button class="btn-outline btn-sm" onclick="openEdit('${p.id}')">Edit</button>
        <button class="btn-danger btn-sm" onclick="hapusPenghuni('${p.id}')">Hapus</button>
      </div>
    </div>`;
  }).join('');
}

function renderPenghuniList(list) {
  $('tbody-penghuni').innerHTML=list.map((p,i)=>{
    const av=p.foto?`<img class="t-av" src="${p.foto}" alt=""/>`:`<div class="t-av-ph">${init(p.nama)}</div>`;
    return `<tr>
      <td>${i+1}</td>
      <td><div style="display:flex;align-items:center;gap:8px">${av}<div><div style="font-weight:600">${p.nama}</div><div style="font-size:0.7rem;color:var(--text-3)">${p.pekerjaan||''}</div></div></div></td>
      <td><code>${p.nik||'–'}</code></td>
      <td>${p.kamar?'Kamar '+p.kamar:'–'}</td>
      <td>${p.hp||'–'}</td>
      <td>${p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge badge-blue">${p.kendaraan}</span>`:'<span class="badge badge-gray">Tidak ada</span>'}</td>
      <td>${rp(p.sewa)}</td>
      <td>${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Tidak Aktif</span>'}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn-outline btn-sm" onclick="openDetail('${p.id}')">Detail</button>
        <button class="btn-outline btn-sm" onclick="openEdit('${p.id}')">Edit</button>
        <button class="btn-danger btn-sm" onclick="hapusPenghuni('${p.id}')">Hapus</button>
      </div></td>
    </tr>`;
  }).join('')||`<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text-3)">Tidak ada data yang cocok.</td></tr>`;
}

['cari-penghuni','filter-status','filter-kendaraan'].forEach(id=>{
  const el=$(id); if(el){el.addEventListener('input',renderPenghuni);el.addEventListener('change',renderPenghuni);}
});
$('btn-grid-view').addEventListener('click',()=>{currentView='grid';$('btn-grid-view').classList.add('active');$('btn-list-view').classList.remove('active');renderPenghuni();});
$('btn-list-view').addEventListener('click',()=>{currentView='list';$('btn-list-view').classList.add('active');$('btn-grid-view').classList.remove('active');renderPenghuni();});

// ── MODAL PENGHUNI ────────────────────────────────────────────
function openModalPenghuni(isEdit=false, data=null) {
  editId=isEdit?data.id:null;
  $('modal-penghuni-title').textContent=isEdit?'Edit Penghuni':'Tambah Penghuni';
  $('form-penghuni').reset();
  $('prev-foto').style.display='none'; $('ph-foto').style.display='flex';
  $('prev-ktp').style.display='none';  $('ph-ktp').style.display='flex';
  switchFTab('identitas');

  if (isEdit&&data) {
    const m={'field-nama':data.nama,'field-nik':data.nik,'field-gender':data.gender,'field-tempat-lahir':data.tempatLahir,'field-tgl-lahir':data.tglLahir,'field-alamat-ktp':data.alamatKtp,'field-hp':data.hp,'field-email':data.email,'field-pekerjaan':data.pekerjaan,'field-kamar':data.kamar,'field-lantai':data.lantai,'field-tgl-masuk':data.tglMasuk,'field-tgl-keluar':data.tglKeluar,'field-status':data.status,'field-catatan':data.catatan,'field-kendaraan':data.kendaraan||'tidak ada','field-merk-1':data.merk1,'field-plat-1':data.plat1,'field-merk-2':data.merk2,'field-plat-2':data.plat2,'field-sewa':data.sewa,'field-tempo':data.tempo,'field-catatan-bayar':data.catatanBayar,'field-darurat-nama':data.daruratNama,'field-darurat-hub':data.daruratHub,'field-darurat-hp':data.daruratHp,'field-darurat-alamat':data.daruratAlamat};
    Object.entries(m).forEach(([id,val])=>{const el=$(id);if(el&&val!=null)el.value=val;});
    if(data.foto){$('prev-foto').src=data.foto;$('prev-foto').style.display='block';$('ph-foto').style.display='none';}
    if(data.fotoKtp){$('prev-ktp').src=data.fotoKtp;$('prev-ktp').style.display='block';$('ph-ktp').style.display='none';}
    toggleKendaraan(data.kendaraan||'tidak ada');
  } else {
    $('field-tgl-masuk').value=new Date().toISOString().slice(0,10);
    $('field-status').value='aktif';
    $('field-kendaraan').value='tidak ada';
    toggleKendaraan('tidak ada');
  }
  openModal('modal-penghuni');
}

$('btn-tambah-penghuni').addEventListener('click',()=>openModalPenghuni());
$('modal-penghuni-close').addEventListener('click',()=>closeModal('modal-penghuni'));
$('btn-batal-penghuni').addEventListener('click',()=>closeModal('modal-penghuni'));
$('modal-penghuni').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal('modal-penghuni');});

function switchFTab(name) {
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.ftab-content').forEach(c=>c.classList.remove('active'));
  const btn=document.querySelector(`.ftab[data-tab="${name}"]`);
  const con=$('ftab-'+name);
  if(btn)btn.classList.add('active'); if(con)con.classList.add('active');
}
document.querySelectorAll('.ftab').forEach(b=>b.addEventListener('click',()=>switchFTab(b.dataset.tab)));

window.toggleKendaraan=function(val) {
  const show1=val&&val!=='tidak ada', show2=val==='motor & mobil';
  ['ken-row1a','ken-row1b'].forEach(id=>{const el=$(id);if(el)el.style.display=show1?'block':'none';});
  ['ken-row2a','ken-row2b'].forEach(id=>{const el=$(id);if(el)el.style.display=show2?'block':'none';});
};

function setupPhoto(inputId,prevId,phId) {
  $(inputId).addEventListener('change',function(){
    const f=this.files[0]; if(!f) return;
    if(f.size>5*1024*1024){toast('Ukuran foto maks 5 MB.','err');return;}
    const r=new FileReader();
    r.onload=e=>{$(prevId).src=e.target.result;$(prevId).style.display='block';$(phId).style.display='none';};
    r.readAsDataURL(f);
  });
}
setupPhoto('field-foto','prev-foto','ph-foto');
setupPhoto('field-ktp','prev-ktp','ph-ktp');

$('form-penghuni').addEventListener('submit',function(e){
  e.preventDefault();
  const nama=$('field-nama').value.trim(), hp=$('field-hp').value.trim(), kamar=$('field-kamar').value.trim(), tglMasuk=$('field-tgl-masuk').value;
  if(!nama){toast('Nama wajib diisi!','err');switchFTab('identitas');return;}
  if(!hp){toast('No. HP wajib diisi!','err');switchFTab('identitas');return;}
  if(!kamar){toast('Nomor kamar wajib diisi!','err');switchFTab('hunian');return;}
  if(!tglMasuk){toast('Tanggal masuk wajib diisi!','err');switchFTab('hunian');return;}

  const foto=$('prev-foto').style.display!=='none'?$('prev-foto').src:null;
  const fotoKtp=$('prev-ktp').style.display!=='none'?$('prev-ktp').src:null;
  const d={
    id:editId||uid(), nama,hp,kamar,tglMasuk,
    nik:$('field-nik').value.trim(), gender:$('field-gender').value, tempatLahir:$('field-tempat-lahir').value.trim(),
    tglLahir:$('field-tgl-lahir').value, alamatKtp:$('field-alamat-ktp').value.trim(), email:$('field-email').value.trim(),
    pekerjaan:$('field-pekerjaan').value.trim(), lantai:$('field-lantai').value.trim(),
    tglKeluar:$('field-tgl-keluar').value, status:$('field-status').value, catatan:$('field-catatan').value.trim(),
    kendaraan:$('field-kendaraan').value, merk1:$('field-merk-1').value.trim(), plat1:$('field-plat-1').value.trim(),
    merk2:$('field-merk-2').value.trim(), plat2:$('field-plat-2').value.trim(),
    sewa:$('field-sewa').value, tempo:$('field-tempo').value, catatanBayar:$('field-catatan-bayar').value.trim(),
    daruratNama:$('field-darurat-nama').value.trim(), daruratHub:$('field-darurat-hub').value,
    daruratHp:$('field-darurat-hp').value.trim(), daruratAlamat:$('field-darurat-alamat').value.trim(),
    foto, fotoKtp,
    createdAt:editId?(S.penghuni.find(p=>p.id===editId)?.createdAt||new Date().toISOString()):new Date().toISOString(),
    updatedAt:new Date().toISOString()
  };
  if(editId){const i=S.penghuni.findIndex(p=>p.id===editId);if(i!==-1)S.penghuni[i]=d;toast('Data berhasil diperbarui! ✅');}
  else{S.penghuni.unshift(d);toast('Penghuni berhasil ditambahkan! 🎉');}
  LS.save(); closeModal('modal-penghuni'); renderPenghuni();
  if($('page-dashboard').classList.contains('active'))renderDashboard();
});

function openEdit(id){const p=S.penghuni.find(x=>x.id===id);if(!p)return;openModalPenghuni(true,p);}
function hapusPenghuni(id){
  const p=S.penghuni.find(x=>x.id===id);if(!p)return;
  confirm_dlg('Hapus Penghuni',`Hapus data "${p.nama}"? Tindakan ini tidak dapat dibatalkan.`,()=>{
    S.penghuni=S.penghuni.filter(x=>x.id!==id);
    S.pembayaran=S.pembayaran.filter(pb=>pb.penghuniId!==id);
    LS.save(); renderPenghuni();
    if($('page-dashboard').classList.contains('active'))renderDashboard();
    toast(`"${p.nama}" dihapus.`);
    if($('modal-detail').classList.contains('open'))closeModal('modal-detail');
  },'Hapus');
}

// ── DETAIL ────────────────────────────────────────────────────
function openDetail(id) {
  const p=S.penghuni.find(x=>x.id===id); if(!p)return;
  detailId=id;
  $('detail-title').textContent=p.nama;
  const av=p.foto?`<img class="d-avatar" src="${p.foto}" alt="${p.nama}"/>`:`<div class="d-avatar-ph">${init(p.nama)}</div>`;
  const bln=thisMonth(), pb=S.pembayaran.find(x=>x.penghuniId===p.id&&x.bulan===bln), age=ageOf(p.tglLahir);
  let kenInfo='Tidak ada';
  if(p.kendaraan&&p.kendaraan!=='tidak ada'){
    kenInfo=p.kendaraan;
    if(p.merk1)kenInfo+=`<br><small style="color:var(--text-3)">${p.merk1}${p.plat1?' · '+p.plat1:''}</small>`;
    if(p.merk2)kenInfo+=`<br><small style="color:var(--text-3)">${p.merk2}${p.plat2?' · '+p.plat2:''}</small>`;
  }
  $('detail-body').innerHTML=`
    <div class="detail-hero">
      ${av}
      <div>
        <div class="d-name">${p.nama}</div>
        <div class="d-tags">
          ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Tidak Aktif</span>'}
          ${p.gender?`<span class="badge badge-blue">${p.gender}</span>`:''}
          ${p.kendaraan&&p.kendaraan!=='tidak ada'?`<span class="badge badge-orange">🚗 ${p.kendaraan}</span>`:''}
          ${pb?.status==='lunas'?'<span class="badge badge-green">✅ Lunas</span>':'<span class="badge badge-gray">Belum bayar bulan ini</span>'}
        </div>
        <div class="d-meta">🏠 Kamar ${p.kamar||'–'} ${p.lantai?'(Lantai '+p.lantai+')':''} &nbsp;·&nbsp; 📅 Masuk ${fmtD(p.tglMasuk)} &nbsp;·&nbsp; ⏱ ${durasi(p.tglMasuk)}<br>💰 ${rp(p.sewa)} / bulan ${p.tempo?'· Jatuh tempo tgl '+p.tempo:''}</div>
      </div>
    </div>
    <div class="detail-sections">
      <div class="d-section"><h4>🪪 Identitas</h4>
        <div class="d-row"><div class="d-key">NIK</div><div class="d-val">${p.nik||'–'}</div></div>
        <div class="d-row"><div class="d-key">Tgl Lahir</div><div class="d-val">${p.tempatLahir?p.tempatLahir+', ':''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</div></div>
        <div class="d-row"><div class="d-key">Alamat KTP</div><div class="d-val">${p.alamatKtp||'–'}</div></div>
        <div class="d-row"><div class="d-key">Pekerjaan</div><div class="d-val">${p.pekerjaan||'–'}</div></div>
      </div>
      <div class="d-section"><h4>📞 Kontak</h4>
        <div class="d-row"><div class="d-key">HP / WA</div><div class="d-val"><a href="https://wa.me/${(p.hp||'').replace(/\D/g,'')}" target="_blank">${p.hp||'–'}</a></div></div>
        <div class="d-row"><div class="d-key">Email</div><div class="d-val">${p.email||'–'}</div></div>
        <div class="d-row"><div class="d-key">Kontak Darurat</div><div class="d-val">${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</div></div>
        <div class="d-row"><div class="d-key">HP Darurat</div><div class="d-val">${p.daruratHp||'–'}</div></div>
      </div>
      <div class="d-section"><h4>🚗 Kendaraan</h4>
        <div class="d-row"><div class="d-key">Kendaraan</div><div class="d-val">${kenInfo}</div></div>
        ${p.catatan?`<div class="d-row"><div class="d-key">Catatan</div><div class="d-val">${p.catatan}</div></div>`:''}
      </div>
      <div class="d-section"><h4>💳 Pembayaran</h4>
        <div class="d-row"><div class="d-key">Sewa / Bulan</div><div class="d-val">${rp(p.sewa)}</div></div>
        <div class="d-row"><div class="d-key">Bulan Ini</div><div class="d-val">${pb?.status==='lunas'?'✅ Lunas':'❌ Belum lunas'}</div></div>
        ${p.catatanBayar?`<div class="d-row"><div class="d-key">Catatan Bayar</div><div class="d-val">${p.catatanBayar}</div></div>`:''}
        <div class="d-row"><div class="d-key">Est. Keluar</div><div class="d-val">${fmtD(p.tglKeluar)}</div></div>
      </div>
    </div>
    ${p.fotoKtp?`<div class="d-ktp"><h4>📷 Foto KTP</h4><img src="${p.fotoKtp}" alt="KTP"/></div>`:''}
  `;
  openModal('modal-detail');
}

$('detail-close').addEventListener('click',()=>closeModal('modal-detail'));
$('modal-detail').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal('modal-detail');});
$('btn-edit-detail').addEventListener('click',()=>{closeModal('modal-detail');openEdit(detailId);});
$('btn-hapus-detail').addEventListener('click',()=>{closeModal('modal-detail');hapusPenghuni(detailId);});
$('btn-print-detail').addEventListener('click',()=>{const p=S.penghuni.find(x=>x.id===detailId);if(p)printKartu(p);});

// ── PRINT ─────────────────────────────────────────────────────
function printKartu(p) {
  const age=ageOf(p.tglLahir);
  const html=`<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"><title>Kartu – ${p.nama}</title>
<style>body{font-family:Arial,sans-serif;color:#111;padding:30px;max-width:640px;margin:0 auto}h1{font-size:17px;font-weight:800;margin-bottom:2px}.sub{color:#666;font-size:11px;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #000}.hero{display:flex;gap:16px;align-items:flex-start;margin-bottom:18px}img.av{width:80px;height:80px;object-fit:cover;border:1px solid #ccc;border-radius:4px}.av-ph{width:80px;height:80px;background:#ddd;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;color:#555;border-radius:4px}h2{font-size:15px;margin:0 0 4px}.badges{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:4px}.badge{border:1px solid #333;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700}table{width:100%;border-collapse:collapse;font-size:11px}td{padding:5px 7px;border:1px solid #ddd;vertical-align:top}td:first-child{font-weight:700;width:150px;background:#f5f5f5}.sh{background:#111;color:#fff;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:4px 7px}.footer{margin-top:14px;font-size:9px;color:#aaa;text-align:right;border-top:1px solid #eee;padding-top:6px}@media print{body{padding:10px}}</style></head><body>
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
<tr><td colspan="2" class="sh">Hunian</td></tr>
<tr><td>Kamar</td><td>${p.kamar||'–'} ${p.lantai?'(Lantai '+p.lantai+')':''}</td></tr>
<tr><td>Tanggal Masuk</td><td>${fmtD(p.tglMasuk)}</td></tr>
<tr><td>Est. Keluar</td><td>${fmtD(p.tglKeluar)}</td></tr>
<tr><td>Sewa / Bulan</td><td>${rp(p.sewa)}</td></tr>
<tr><td colspan="2" class="sh">Kendaraan</td></tr>
<tr><td>Kepemilikan</td><td>${p.kendaraan||'Tidak ada'}</td></tr>
${p.merk1?`<tr><td>Kendaraan 1</td><td>${p.merk1}${p.plat1?' · Plat: '+p.plat1:''}</td></tr>`:''}
${p.merk2?`<tr><td>Kendaraan 2</td><td>${p.merk2}${p.plat2?' · Plat: '+p.plat2:''}</td></tr>`:''}
<tr><td colspan="2" class="sh">Kontak Darurat</td></tr>
<tr><td>Nama</td><td>${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</td></tr>
<tr><td>HP Darurat</td><td>${p.daruratHp||'–'}</td></tr>
<tr><td>Alamat Darurat</td><td>${p.daruratAlamat||'–'}</td></tr>
</table>
${p.fotoKtp?`<div style="margin-top:10px"><p style="font-size:10px;font-weight:700;margin:0 0 4px">Foto KTP:</p><img src="${p.fotoKtp}" style="max-width:100%;border:1px solid #ccc" alt="KTP"/></div>`:''}
<div class="footer">Dicetak via SiKost · ${new Date().toLocaleString('id-ID')}</div>
<script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const w=window.open('','_blank','width=700,height=600'); w.document.write(html); w.document.close();
}

// ── KAMAR ─────────────────────────────────────────────────────
function renderKamar() {
  const filter=$('filter-kamar-status').value;
  const occ={}; S.penghuni.filter(p=>p.status==='aktif'&&p.kamar).forEach(p=>{if(!occ[p.kamar])occ[p.kamar]=[];occ[p.kamar].push(p);});
  let list=[...S.kamar];
  S.penghuni.forEach(p=>{if(p.kamar&&!list.find(k=>k.no===p.kamar))list.push({id:'auto_'+p.kamar,no:p.kamar,lantai:p.lantai||'1',tipe:'Standar',harga:p.sewa||0,fasilitas:''});});
  const seen=new Set(); list=list.filter(k=>{if(seen.has(k.no))return false;seen.add(k.no);return true;});
  list.sort((a,b)=>a.no.localeCompare(b.no,undefined,{numeric:true}));
  const filtered=list.filter(k=>{const t=!!occ[k.no];if(filter==='terisi')return t;if(filter==='kosong')return!t;return true;});
  $('kamar-grid').innerHTML=filtered.map(k=>{
    const isTerisi=!!occ[k.no], pen=occ[k.no]||[];
    return `<div class="km-card ${isTerisi?'terisi':'kosong'}">
      <div class="km-no">${k.no}</div>
      <div class="km-lbl">Lantai ${k.lantai||'1'} · ${k.tipe||'Standar'}</div>
      <div style="margin:6px 0">${isTerisi?'<span class="badge badge-green">Terisi</span>':'<span class="badge badge-gray">Kosong</span>'}</div>
      <div class="km-name">${pen.map(p=>p.nama).join(', ')||'–'}</div>
      ${k.harga?`<div class="km-info">${rp(k.harga)}/bln</div>`:''}
      ${k.fasilitas?`<div class="km-info">${k.fasilitas}</div>`:''}
      <div class="km-actions">
        <button class="btn-outline btn-sm" onclick="editKamar('${k.id}')">Edit</button>
        <button class="btn-danger btn-sm" onclick="hapusKamar('${k.id}')">Hapus</button>
      </div>
    </div>`;
  }).join('')||`<div class="empty-state"><div class="empty-emoji">🛏</div><p class="empty-title">Belum ada kamar</p><p class="empty-sub">Klik "Tambah Kamar" untuk mengelola kamar.</p></div>`;
}

$('filter-kamar-status').addEventListener('change',renderKamar);
$('btn-tambah-kamar').addEventListener('click',()=>{$('modal-kamar-title').textContent='Tambah Kamar';$('form-kamar').reset();$('field-kamar-id').value='';openModal('modal-kamar');});
$('modal-kamar-close').addEventListener('click',()=>closeModal('modal-kamar'));
$('btn-batal-kamar').addEventListener('click',()=>closeModal('modal-kamar'));
$('modal-kamar').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal('modal-kamar');});

$('form-kamar').addEventListener('submit',function(e){
  e.preventDefault();
  const no=$('field-no-kamar').value.trim(); if(!no){toast('Nomor kamar wajib!','err');return;}
  const id=$('field-kamar-id').value||uid();
  const d={id,no,lantai:$('field-lantai-kamar').value.trim()||'1',tipe:$('field-tipe-kamar').value,harga:$('field-harga-kamar').value,fasilitas:$('field-fasilitas').value.trim()};
  const i=S.kamar.findIndex(k=>k.id===id);
  if(i!==-1){S.kamar[i]=d;toast('Kamar diperbarui!');} else {S.kamar.push(d);toast('Kamar ditambahkan!');}
  LS.save(); closeModal('modal-kamar'); renderKamar();
});

function editKamar(id){const k=S.kamar.find(x=>x.id===id);if(!k)return;$('modal-kamar-title').textContent='Edit Kamar';$('field-kamar-id').value=k.id;$('field-no-kamar').value=k.no||'';$('field-lantai-kamar').value=k.lantai||'';$('field-tipe-kamar').value=k.tipe||'Standar';$('field-harga-kamar').value=k.harga||'';$('field-fasilitas').value=k.fasilitas||'';openModal('modal-kamar');}
function hapusKamar(id){const k=S.kamar.find(x=>x.id===id);confirm_dlg('Hapus Kamar',`Hapus kamar ${k?.no||id}?`,()=>{S.kamar=S.kamar.filter(x=>x.id!==id);LS.save();renderKamar();toast('Kamar dihapus.');},'Hapus');}

// ── PEMBAYARAN ────────────────────────────────────────────────
function renderPembayaran() {
  const sel=$('filter-bulan-bayar');
  const months=[]; const now=new Date();
  for(let i=0;i<12;i++){const d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(d.toISOString().slice(0,7));}
  const cur=sel.value||months[0];
  sel.innerHTML=months.map(m=>{const[y,mo]=m.split('-');const lbl=new Date(y,mo-1,1).toLocaleDateString('id-ID',{month:'long',year:'numeric'});return`<option value="${m}"${m===cur?' selected':''}>${lbl}</option>`;}).join('');
  const bln=sel.value||months[0];
  const aktif=S.penghuni.filter(p=>p.status==='aktif');
  const payments=S.pembayaran.filter(pb=>pb.bulan===bln);
  const lunas=payments.filter(pb=>pb.status==='lunas');
  const belum=Math.max(0,aktif.length-lunas.length);
  const terkumpul=lunas.reduce((s,pb)=>s+(Number(pb.jumlah)||0),0);
  $('kpi-bayar').innerHTML=`
    <div class="kpi"><div class="kpi-label">Sudah Bayar</div><div class="kpi-value" style="color:var(--green)">${lunas.length}</div><div class="kpi-sub">penghuni</div></div>
    <div class="kpi"><div class="kpi-label">Belum Bayar</div><div class="kpi-value" style="color:var(--red)">${belum}</div><div class="kpi-sub">penghuni aktif</div></div>
    <div class="kpi"><div class="kpi-label">Terkumpul</div><div class="kpi-value" style="font-size:1.05rem;color:var(--green)">${rp(terkumpul)}</div><div class="kpi-sub">bulan ini</div></div>
    <div class="kpi"><div class="kpi-label">Total Tagihan</div><div class="kpi-value" style="font-size:1.05rem">${rp(aktif.reduce((s,p)=>s+(Number(p.sewa)||0),0))}</div><div class="kpi-sub">keseluruhan</div></div>
  `;
  const[y,mo]=bln.split('-'); const blnLabel=new Date(y,mo-1,1).toLocaleDateString('id-ID',{month:'long',year:'numeric'});
  $('tbody-pembayaran').innerHTML=aktif.map(p=>{
    const pb=payments.find(x=>x.penghuniId===p.id), ok=pb?.status==='lunas';
    return `<tr>
      <td><strong>${p.nama}</strong></td>
      <td>Kamar ${p.kamar||'–'}</td>
      <td>${blnLabel}</td>
      <td>${rp(p.sewa)}</td>
      <td>${ok?'<span class="badge badge-green">Lunas</span>':'<span class="badge badge-red">Belum</span>'}</td>
      <td>${ok?`<button class="btn-ghost btn-sm" onclick="batalBayar('${p.id}','${bln}')">Batalkan</button>`:`<button class="btn-primary btn-sm" onclick="tandaiBayar('${p.id}','${bln}',${p.sewa||0})">✅ Tandai Lunas</button>`}</td>
    </tr>`;
  }).join('')||`<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-3)">Tidak ada penghuni aktif.</td></tr>`;
}

$('filter-bulan-bayar').addEventListener('change',renderPembayaran);
function tandaiBayar(pid,bln,jumlah){const ex=S.pembayaran.find(pb=>pb.penghuniId===pid&&pb.bulan===bln);if(ex){ex.status='lunas';ex.jumlah=jumlah;ex.tglBayar=new Date().toISOString();}else S.pembayaran.push({id:uid(),penghuniId:pid,bulan:bln,jumlah,status:'lunas',tglBayar:new Date().toISOString()});LS.save();renderPembayaran();toast('Pembayaran dicatat! 💰');}
function batalBayar(pid,bln){S.pembayaran=S.pembayaran.filter(pb=>!(pb.penghuniId===pid&&pb.bulan===bln));LS.save();renderPembayaran();toast('Status direset.');}

// ── PENGATURAN ────────────────────────────────────────────────
function renderPengaturan() {
  $('set-nama-kost').value   = S.kost.nama||'';
  $('set-pemilik').value     = S.kost.pemilik||'';
  $('set-alamat').value      = S.kost.alamat||'';
  $('set-hp-pemilik').value  = S.kost.hp||'';
  $('set-total-kamar').value = S.kost.totalKamar||'';
  renderAkunList();
  fillAkunLinkSelect();
}

$('form-kost').addEventListener('submit',function(e){
  e.preventDefault();
  S.kost.nama      = $('set-nama-kost').value.trim();
  S.kost.pemilik   = $('set-pemilik').value.trim();
  S.kost.alamat    = $('set-alamat').value.trim();
  S.kost.hp        = $('set-hp-pemilik').value.trim();
  S.kost.totalKamar= $('set-total-kamar').value;
  LS.save(); $('sb-kost-name').textContent=S.kost.nama||'SiKost';
  $('login-kost-title') && ($('login-kost-title').textContent=S.kost.nama);
  toast('Pengaturan disimpan! 🏠');
});

document.querySelectorAll('.settings-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.settings-tab').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.stab-content').forEach(c=>c.classList.remove('active'));
    btn.classList.add('active'); $('stab-'+btn.dataset.stab).classList.add('active');
  });
});

// Akun list
function renderAkunList() {
  const tbody=$('tbody-akun'); if(!tbody) return;
  tbody.innerHTML=S.akun.map(a=>{
    const p=a.penghuniId?S.penghuni.find(x=>x.id===a.penghuniId):null;
    const isMe=a.id===currentUser.id;
    return `<tr>
      <td><strong>${a.nama}</strong> ${isMe?'<span class="badge badge-blue">Anda</span>':''}</td>
      <td>${a.email}</td>
      <td><span class="badge ${a.role==='manager'?'badge-blue':'badge-gray'}">${a.role==='manager'?'Manager':'Penghuni'}</span></td>
      <td>${p?p.nama:'<span style="color:var(--text-3)">–</span>'}</td>
      <td>${!isMe?`<button class="btn-danger btn-sm" onclick="hapusAkun('${a.id}')">Hapus</button>`:'–'}</td>
    </tr>`;
  }).join('')||`<tr><td colspan="5" style="text-align:center;padding:16px;color:var(--text-3)">Belum ada akun lain.</td></tr>`;
}

function fillAkunLinkSelect() {
  const sel=$('akun-link-penghuni'); if(!sel) return;
  sel.innerHTML='<option value="">-- Pilih penghuni (opsional) --</option>'+
    S.penghuni.map(p=>`<option value="${p.id}">${p.nama} (Kamar ${p.kamar||'–'})</option>`).join('');
}

window.tambahAkunPenghuni = async function() {
  const nama=$('akun-nama').value.trim(), email=$('akun-email').value.trim().toLowerCase(), pw=$('akun-pw').value, pid=$('akun-link-penghuni').value;
  if(!nama){toast('Nama wajib diisi!','err');return;}
  if(!email){toast('Email wajib diisi!','err');return;}
  if(pw.length<6){toast('Password minimal 6 karakter!','err');return;}
  if(S.akun.find(a=>a.email===email)){toast('Email sudah terdaftar!','err');return;}
  const pwHash=await hashPw(pw);
  S.akun.push({id:uid(),nama,email,pwHash,role:'penghuni',penghuniId:pid||null});
  LS.save(); renderAkunList(); fillAkunLinkSelect();
  $('akun-nama').value=''; $('akun-email').value=''; $('akun-pw').value=''; $('akun-link-penghuni').value='';
  toast(`Akun untuk ${nama} berhasil dibuat! 🎉`);
};

window.hapusAkun=function(id){
  const a=S.akun.find(x=>x.id===id); if(!a||a.id===currentUser.id) return;
  confirm_dlg('Hapus Akun',`Hapus akun "${a.email}"?`,()=>{S.akun=S.akun.filter(x=>x.id!==id);LS.save();renderAkunList();toast('Akun dihapus.');},'Hapus');
};

// Ganti password (dari pengaturan, untuk Manager)
$('form-ganti-pw').addEventListener('submit',async function(e){
  e.preventDefault();
  await gantiPassword($('pw-lama').value,$('pw-baru').value,$('pw-confirm').value,this);
});

async function gantiPassword(lama,baru,confirm,formEl) {
  if(baru.length<6){toast('Password baru minimal 6 karakter!','err');return;}
  if(baru!==confirm){toast('Konfirmasi password tidak cocok!','err');return;}
  const akunIdx=S.akun.findIndex(a=>a.id===currentUser.id);
  if(akunIdx===-1){toast('Akun tidak ditemukan.','err');return;}
  const lamaHash=await hashPw(lama);
  if(lamaHash!==S.akun[akunIdx].pwHash){toast('Password lama salah!','err');return;}
  S.akun[akunIdx].pwHash=await hashPw(baru);
  LS.save(); formEl.reset(); toast('Password berhasil diperbarui! 🔒');
}

// Backup & Restore
$('btn-backup').addEventListener('click',()=>{
  const b=new Blob([JSON.stringify({penghuni:S.penghuni,kamar:S.kamar,pembayaran:S.pembayaran,akun:S.akun.map(a=>({...a,pwHash:'[PROTECTED]'})),kost:S.kost,backupDate:new Date().toISOString()},null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`SiKost_backup_${new Date().toISOString().slice(0,10)}.json`; a.click(); toast('Backup diunduh!');
});
$('input-restore').addEventListener('change',function(){
  const f=this.files[0]; if(!f)return;
  const r=new FileReader();
  r.onload=e=>{try{
    const d=JSON.parse(e.target.result); if(!d.penghuni)throw new Error();
    confirm_dlg('Restore Data','Ini akan menggantikan semua data penghuni, kamar, dan pembayaran (akun login tidak terpengaruh). Lanjutkan?',()=>{
      S.penghuni=d.penghuni||[];S.kamar=d.kamar||[];S.pembayaran=d.pembayaran||[];S.kost=d.kost||S.kost;
      LS.save();renderPengaturan();toast('Data di-restore!');
    },'Lanjutkan');
  }catch{toast('File tidak valid.','err');}};
  r.readAsText(f); this.value='';
});
$('btn-hapus-semua').addEventListener('click',()=>{
  confirm_dlg('Hapus Semua Data Penghuni','Hapus SEMUA data penghuni, kamar, dan pembayaran? Akun login tidak terhapus.',()=>{
    S.penghuni=[];S.kamar=[];S.pembayaran=[];LS.save();toast('Semua data dihapus.');renderPengaturan();
  },'Ya, Hapus Semua');
});

// ── TENANT VIEW ───────────────────────────────────────────────
function renderTenant() {
  const akun=S.akun.find(a=>a.id===currentUser.id);
  const p=akun?.penghuniId?S.penghuni.find(x=>x.id===akun.penghuniId):null;
  if(!p){$('tenant-content').style.display='none';$('tenant-not-found').style.display='block';return;}
  $('tenant-not-found').style.display='none';$('tenant-content').style.display='block';
  const bln=thisMonth(), pb=S.pembayaran.find(x=>x.penghuniId===p.id&&x.bulan===bln), age=ageOf(p.tglLahir);
  const av=p.foto?`<img class="t-avatar" src="${p.foto}" alt="${p.nama}"/>`:`<div class="t-avatar-ph">${init(p.nama)}</div>`;
  $('tenant-content').innerHTML=`
    <div class="tenant-hero">
      ${av}
      <div><div class="t-name">${p.nama}</div>
      <div class="text-muted">${p.pekerjaan||'–'}</div>
      <div class="t-tags">
        ${p.status==='aktif'?'<span class="badge badge-green">Aktif</span>':'<span class="badge badge-gray">Tidak Aktif</span>'}
        ${pb?.status==='lunas'?'<span class="badge badge-green">✅ Lunas bulan ini</span>':'<span class="badge badge-red">❌ Belum bayar bulan ini</span>'}
      </div></div>
    </div>
    <div class="tenant-grid">
      <div class="t-section"><h4>🪪 Identitas</h4>
        <div class="t-row"><div class="t-key">NIK</div><div class="t-val">${p.nik||'–'}</div></div>
        <div class="t-row"><div class="t-key">Jenis Kelamin</div><div class="t-val">${p.gender||'–'}</div></div>
        <div class="t-row"><div class="t-key">Tempat, Tgl Lahir</div><div class="t-val">${p.tempatLahir?p.tempatLahir+', ':''}${fmtD(p.tglLahir)}${age?' ('+age+' th)':''}</div></div>
        <div class="t-row"><div class="t-key">Alamat KTP</div><div class="t-val">${p.alamatKtp||'–'}</div></div>
        <div class="t-row"><div class="t-key">Pekerjaan</div><div class="t-val">${p.pekerjaan||'–'}</div></div>
      </div>
      <div class="t-section"><h4>🏠 Hunian & Sewa</h4>
        <div class="t-row"><div class="t-key">Kamar</div><div class="t-val">${p.kamar||'–'} ${p.lantai?'(Lantai '+p.lantai+')':''}</div></div>
        <div class="t-row"><div class="t-key">Tanggal Masuk</div><div class="t-val">${fmtD(p.tglMasuk)}</div></div>
        <div class="t-row"><div class="t-key">Lama Tinggal</div><div class="t-val">${durasi(p.tglMasuk)}</div></div>
        <div class="t-row"><div class="t-key">Sewa / Bulan</div><div class="t-val">${rp(p.sewa)}</div></div>
        <div class="t-row"><div class="t-key">Jatuh Tempo</div><div class="t-val">${p.tempo?'Tgl '+p.tempo+' setiap bulan':'–'}</div></div>
        <div class="t-row"><div class="t-key">Status Bayar</div><div class="t-val">${pb?.status==='lunas'?'✅ Lunas':'❌ Belum lunas'}</div></div>
      </div>
      <div class="t-section"><h4>🚗 Kendaraan</h4>
        <div class="t-row"><div class="t-key">Kepemilikan</div><div class="t-val">${p.kendaraan||'Tidak ada'}</div></div>
        ${p.merk1?`<div class="t-row"><div class="t-key">Kendaraan 1</div><div class="t-val">${p.merk1}${p.plat1?' · '+p.plat1:''}</div></div>`:''}
        ${p.merk2?`<div class="t-row"><div class="t-key">Kendaraan 2</div><div class="t-val">${p.merk2}${p.plat2?' · '+p.plat2:''}</div></div>`:''}
      </div>
      <div class="t-section"><h4>📞 Kontak</h4>
        <div class="t-row"><div class="t-key">HP / WA</div><div class="t-val"><a href="https://wa.me/${(p.hp||'').replace(/\D/g,'')}">${p.hp||'–'}</a></div></div>
        <div class="t-row"><div class="t-key">Email</div><div class="t-val">${p.email||'–'}</div></div>
        <div class="t-row"><div class="t-key">Kontak Darurat</div><div class="t-val">${p.daruratNama||'–'} ${p.daruratHub?'('+p.daruratHub+')':''}</div></div>
        <div class="t-row"><div class="t-key">HP Darurat</div><div class="t-val">${p.daruratHp||'–'}</div></div>
      </div>
    </div>
    ${p.fotoKtp?`<div class="t-ktp" style="margin-top:12px"><h4 style="font-size:0.75rem;font-weight:600;color:var(--text-3);margin-bottom:6px">📷 Foto KTP</h4><img src="${p.fotoKtp}" alt="KTP"/></div>`:''}
  `;
}

// ── PROFIL AKUN ───────────────────────────────────────────────
function renderProfil() {
  $('profil-info').innerHTML=`
    <div class="profil-row"><span class="profil-key">Nama</span><span class="profil-val">${currentUser.nama}</span></div>
    <div class="profil-row"><span class="profil-key">Email</span><span class="profil-val">${currentUser.email}</span></div>
    <div class="profil-row"><span class="profil-key">Role</span><span class="profil-val">${currentUser.role==='manager'?'Manager':'Penghuni'}</span></div>
  `;
}

$('form-profil-pw').addEventListener('submit',async function(e){
  e.preventDefault();
  await gantiPassword($('profil-pw-lama').value,$('profil-pw-baru').value,$('profil-pw-confirm').value,this);
});

// ── SIDEBAR TOGGLE ────────────────────────────────────────────
$('sidebar-collapse').addEventListener('click',()=>{$('sidebar').classList.toggle('collapsed');$('main-content').classList.toggle('full');});
$('menu-toggle').addEventListener('click',()=>{if(window.innerWidth<=600)$('sidebar').classList.toggle('mobile-open');else{$('sidebar').classList.toggle('collapsed');$('main-content').classList.toggle('full');}});

// ── CONFIRM ───────────────────────────────────────────────────
$('confirm-ok').addEventListener('click',()=>{closeModal('modal-confirm');if(confirmCb){confirmCb();confirmCb=null;}});
$('confirm-cancel').addEventListener('click',()=>{closeModal('modal-confirm');confirmCb=null;});

// ── EXPORT CSV ────────────────────────────────────────────────
$('btn-export-csv').addEventListener('click',()=>{
  const list=getPenghuniFiltered();
  const hdr=['Nama','NIK','Gender','TTL','HP','Email','Pekerjaan','Kamar','Lantai','Tgl Masuk','Tgl Keluar','Status','Kendaraan','Plat 1','Plat 2','Sewa','Darurat','HP Darurat'];
  const rows=list.map(p=>[p.nama,p.nik,p.gender,(p.tempatLahir?p.tempatLahir+' ':'')+p.tglLahir,p.hp,p.email,p.pekerjaan,p.kamar,p.lantai,p.tglMasuk,p.tglKeluar,p.status,p.kendaraan,p.plat1,p.plat2,p.sewa,(p.daruratNama||'')+(p.daruratHub?' ('+p.daruratHub+')':''),p.daruratHp].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`));
  const csv=[hdr.join(','),...rows.map(r=>r.join(','))].join('\n');
  const b=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`SiKost_${new Date().toISOString().slice(0,10)}.csv`; a.click(); toast('Export CSV berhasil!');
});

// ── INIT ──────────────────────────────────────────────────────
(function init() {
  LS.load();

  // Theme
  const t=localStorage.getItem('sk3_theme')||'light';
  document.documentElement.setAttribute('data-theme',t);
  $('theme-icon').textContent=t==='dark'?'☀️':'🌙';

  // Cek sesi tersimpan
  const session=LS.loadSession();
  if (session) {
    // Pastikan akun masih ada di S.akun
    const akun=S.akun.find(a=>a.id===session.id);
    if (akun) {
      currentUser={id:akun.id,nama:akun.nama,email:akun.email,role:akun.role,penghuniId:akun.penghuniId};
      LS.saveSession(currentUser);
      enterApp(); return;
    }
    LS.clearSession();
  }

  // Cek apakah belum ada akun sama sekali → setup screen
  if (S.akun.length === 0) {
    showScreen('screen-setup');
  } else {
    // Isi nama kost di login
    if ($('login-kost-title')) $('login-kost-title').textContent = S.kost.nama||'SiKost';
    showScreen('screen-login');
  }
})();
