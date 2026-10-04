const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const projectId = '13806641063080340578';

// Baca API key dari global mcp_config.json atau environment variable (bebas dari hardcoded secret)
const mcpConfigPath = path.join(process.env.USERPROFILE || process.env.HOME || '', '.gemini', 'config', 'mcp_config.json');
let apiKey = process.env.STITCH_API_KEY || '';
if (!apiKey && fs.existsSync(mcpConfigPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
    apiKey = cfg.mcpServers?.stitch?.headers?.['X-Goog-Api-Key'] || '';
  } catch {}
}

const screens = [
  { id: '1ce116ee9b3e41d3828f89158ef24501', num: 1, slug: 'frame_1_login_pengelola', title: 'Frame 1: Layar Login Pengelola (Google Manager)' },
  { id: 'dbcbe758bb7144b8876e589c3e411dbe', num: 2, slug: 'frame_2_dashboard_utama', title: 'Frame 2: Dashboard Utama Kost (Action Center & KPI Finansial)' },
  { id: '6ea843b493f84b109d58c2cb11da0fba', num: 3, slug: 'frame_3_matriks_kamar', title: 'Frame 3: Matriks Kamar Interaktif (Room Matrix & Floor Plan)' },
  { id: '93826ceee76648aea7b18703297fe392', num: 4, slug: 'frame_4_tabel_pembayaran', title: 'Frame 4: Tabel Pembayaran & Kwitansi Digital' },
  { id: '16bd96f26a5a4549a40947aafb4fa8d4', num: 5, slug: 'frame_5_dashboard_pengeluaran', title: 'Frame 5: Dashboard Pengeluaran & Beban Operasional' },
  { id: 'c7828c41ca38492e9e14618119a49b1d', num: 6, slug: 'frame_6_pengaturan_kost', title: 'Frame 6: Halaman Pengaturan Kost & Template WA QRIS' },
  { id: 'c5a9f51a125e416c9f87175ff1cbfa88', num: 7, slug: 'frame_7_portal_anak_kost', title: 'Frame 7: Portal Anak Kost (Mobile Tenant View)' },
  { id: 'c8afbe5fd6c94cc7a0b4538ee5472b4e', num: 8, slug: 'frame_8_spotlight_search', title: 'Frame 8: Spotlight Search Modal Overlay (Ctrl + K)' }
];

const outDir = path.join(process.cwd(), 'stitch_reference');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'X-Goog-Api-Key': apiKey } }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    function get(currentUrl, redirectCount = 0) {
      if (redirectCount > 10) return reject(new Error('Too many redirects'));
      const mod = currentUrl.startsWith('https') ? https : http;
      mod.get(currentUrl, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location, redirectCount + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error('Status code: ' + res.statusCode));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }).on('error', reject);
    }
    get(url);
  });
}

async function main() {
  if (!apiKey) {
    console.error('API Key Stitch tidak ditemukan di environment maupun mcp_config.json!');
    process.exit(1);
  }
  console.log('🚀 Memulai sinkronisasi 8 Screen dari Stitch Project: Kost Management System UI (13806641063080340578)\n');
  const indexList = [];

  for (const item of screens) {
    console.log(`[${item.num}/8] Mengambil metadata: ${item.title} (${item.id})...`);
    const screenMeta = await fetchJson(`https://stitch.googleapis.com/v1/projects/${projectId}/screens/${item.id}`);

    const htmlFileName = `${item.slug}.html`;
    const imgFileName = `${item.slug}.png`;
    const metaFileName = `${item.slug}.json`;

    const htmlPath = path.join(outDir, htmlFileName);
    const imgPath = path.join(outDir, imgFileName);
    const metaPath = path.join(outDir, metaFileName);

    // 1. Simpan metadata screen
    fs.writeFileSync(metaPath, JSON.stringify(screenMeta, null, 2), 'utf8');

    // 2. Unduh Gambar Screenshot
    if (screenMeta.screenshot?.downloadUrl) {
      process.stdout.write(`   📸 Mengunduh screenshot (${imgFileName})... `);
      await downloadFile(screenMeta.screenshot.downloadUrl, imgPath);
      const sz = fs.statSync(imgPath).size;
      console.log(`OK (${(sz / 1024).toFixed(1)} KB)`);
    }

    // 3. Unduh Kode HTML
    if (screenMeta.htmlCode?.downloadUrl) {
      process.stdout.write(`   💻 Mengunduh kode HTML (${htmlFileName})... `);
      await downloadFile(screenMeta.htmlCode.downloadUrl, htmlPath);
      const sz = fs.statSync(htmlPath).size;
      console.log(`OK (${(sz / 1024).toFixed(1)} KB)`);
    }

    indexList.push({
      ...item,
      title: screenMeta.title || item.title,
      width: screenMeta.width,
      height: screenMeta.height,
      deviceType: screenMeta.deviceType,
      htmlFile: htmlFileName,
      imgFile: imgFileName
    });

    console.log('');
  }

  // Buat index README.md untuk referensi
  let readme = `# 🎨 Referensi Desain UI SiKost (Google Stitch)
**Project Title**: Kost Management System UI  
**Project ID**: \`13806641063080340578\`  
**Total Screens**: 8 Layar  

> **Catatan Penting**: Asset dan kode di folder ini adalah **referensi desain visual dan layout UI**. Seluruh fitur fungsional, integrasi Supabase, multi-kost, dan database yang sudah ada di aplikasi SiKost tetap dipertahankan 100%.

---

## 📋 Daftar Screen Stitch:

`;

  indexList.forEach(s => {
    readme += `### ${s.num}. ${s.title}\n`;
    readme += `- **Screen ID**: \`${s.id}\`\n`;
    readme += `- **Dimensi**: ${s.width} x ${s.height} px (${s.deviceType || 'DESKTOP'})\n`;
    readme += `- **Kode HTML**: [\`${s.htmlFile}\`](./${s.htmlFile})\n`;
    readme += `- **Preview Gambar**: ![\`${s.title}\`](./${s.imgFile})\n\n`;
  });

  fs.writeFileSync(path.join(outDir, 'README.md'), readme, 'utf8');
  console.log('✅ Semua 8 Screen Stitch berhasil diunduh dan diindeks di folder stitch_reference/!');
}

main().catch(err => {
  console.error('❌ Terjadi kesalahan saat mengunduh screen Stitch:', err);
  process.exit(1);
});
