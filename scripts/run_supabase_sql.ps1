# ============================================================
# SiKost – Supabase Automated SQL Runner & Verifier
# ============================================================
param(
    [string]$ProjectRef = "tzplpnqtwcfchhmodphz",
    [string]$AccessToken = $env:SUPABASE_ACCESS_TOKEN,
    [string]$SqlFile = ""
)

if ([string]::IsNullOrWhiteSpace($SqlFile)) {
    $SqlFile = Join-Path (Split-Path -Parent $PSScriptRoot) "database\supabase_schema.sql"
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     SiKost - Eksekusi Skrip Database Supabase            " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Project Ref : $ProjectRef" -ForegroundColor Gray
Write-Host "File Skrip  : $SqlFile" -ForegroundColor Gray
Write-Host ""

if (-not (Test-Path $SqlFile)) {
    Write-Host "Error: File $SqlFile tidak ditemukan di direktori ini." -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content -Path $SqlFile -Raw -Encoding UTF8

if (-not [string]::IsNullOrWhiteSpace($AccessToken)) {
    Write-Host "Menjalankan seluruh skrip SQL ke Supabase Management API..." -ForegroundColor Cyan
    $headers = @{
        "Authorization" = "Bearer $AccessToken"
        "Content-Type"  = "application/json"
    }
    $body = @{
        "query" = $sqlContent
    } | ConvertTo-Json -Depth 5

    try {
        $res = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" -Headers $headers -Method POST -Body $body
        Write-Host "BERHASIL! Seluruh skrip SQL telah dieksekusi otomatis ke database Supabase!" -ForegroundColor Green
    } catch {
        Write-Host "Gagal mengeksekusi langsung: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "Detail: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "Info: Supabase Access Token belum diatur di environment." -ForegroundColor Gray
    Write-Host "   (Jika ingin eksekusi DDL otomatis via script, set: `$env:SUPABASE_ACCESS_TOKEN = 'token_anda')`n" -ForegroundColor DarkGray
}

Write-Host "Memverifikasi Status Tabel Database di Supabase Cloud..." -ForegroundColor Cyan
$anonKey = "sb_publishable_JCBhIp2M_9aNRYBquntqSg_kwcw8M9h"
$vHeaders = @{
    "apikey"        = $anonKey
    "Authorization" = "Bearer $anonKey"
}

$tables = @(
    @{ name = "kost_pengaturan"; desc = "Pengaturan dan Rekening Kost" },
    @{ name = "kamar";           desc = "Daftar Kamar dan Fasilitas" },
    @{ name = "penghuni";        desc = "Data Anak Kost dan Kontak Darurat" },
    @{ name = "pembayaran";      desc = "Transaksi dan Kwitansi Pembayaran" },
    @{ name = "pengeluaran";     desc = "Catatan Pengeluaran dan Laba Bersih" },
    @{ name = "profiles";        desc = "Profil User dan Role Keamanan RLS" }
)

$successCount = 0

foreach ($t in $tables) {
    $tblName = $t.name
    $tblDesc = $t.desc
    try {
        $qUrl = "https://" + $ProjectRef + ".supabase.co/rest/v1/" + $tblName + "?select=*&limit=1"
        $null = Invoke-RestMethod -Uri $qUrl -Headers $vHeaders -Method GET -TimeoutSec 5
        Write-Host "  [OK] $tblName -> $tblDesc (AKTIF)" -ForegroundColor Green
        $successCount++
    } catch {
        Write-Host "  [FAIL] $tblName -> $tblDesc ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
if ($successCount -eq $tables.Count) {
    Write-Host "SEMPURNA! Seluruh $successCount dari $($tables.Count) tabel database Supabase telah AKTIF!" -ForegroundColor Green
    Write-Host "Aplikasi SiKost sudah siap dipakai sepenuhnya di cloud." -ForegroundColor Yellow
} else {
    Write-Host "Perhatian: $successCount dari $($tables.Count) tabel aktif." -ForegroundColor Yellow
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
