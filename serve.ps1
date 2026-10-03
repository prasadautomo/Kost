<#
.SYNOPSIS
  SiKost Local HTTP Web Server
  Menjalankan SiKost di http://localhost:3000 agar Google OAuth & Supabase berjalan normal
#>

param (
    [int]$Port = 3000
)

$HostName = "localhost"
$Url = "http://${HostName}:${Port}/"
$DocRoot = $PSScriptRoot

$MimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "   🏠 SiKost Local Web Server (v4.1)" -ForegroundColor Yellow
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🌐 Server berjalan di: $Url" -ForegroundColor Green
Write-Host "📁 Folder: $DocRoot" -ForegroundColor Gray
Write-Host "💡 Google OAuth resmi aktif untuk: http://localhost:${Port}" -ForegroundColor White
Write-Host "Tekan CTRL + C untuk menghentikan server." -ForegroundColor Yellow
Write-Host "-------------------------------------------------" -ForegroundColor Cyan

$Listener = New-Object System.Net.HttpListener
$Listener.Prefixes.Add($Url)

try {
    $Listener.Start()
} catch {
    Write-Host "Gagal menjalankan listener di port $Port. Mencoba port 3001..." -ForegroundColor Red
    $Port = 3001
    $Url = "http://${HostName}:${Port}/"
    $Listener = New-Object System.Net.HttpListener
    $Listener.Prefixes.Add($Url)
    $Listener.Start()
    Write-Host "🌐 Server berjalan di: $Url" -ForegroundColor Green
}

# Buka browser otomatis
Start-Process $Url

while ($Listener.IsListening) {
    try {
        $Context = $Listener.GetContext()
        $Request = $Context.Request
        $Response = $Context.Response

        $Path = $Request.Url.LocalPath
        if ($Path -eq "/" -or $Path -eq "") {
            $Path = "/index.html"
        }

        $FilePath = Join-Path $DocRoot ($Path.TrimStart("/").Replace("/", [System.IO.Path]::DirectorySeparatorChar))

        if (Test-Path $FilePath -PathType Leaf) {
            $Ext = [System.IO.Path]::GetExtension($FilePath).ToLower()
            $ContentType = $MimeTypes[$Ext]
            if (-not $ContentType) { $ContentType = "application/octet-stream" }

            $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
            $Response.ContentType = $ContentType
            $Response.ContentLength64 = $Bytes.Length
            $Response.AddHeader("Cache-Control", "no-cache")
            $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
        } else {
            $Response.StatusCode = 404
            $NotFound = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $Path")
            $Response.ContentType = "text/plain"
            $Response.OutputStream.Write($NotFound, 0, $NotFound.Length)
        }
        $Response.OutputStream.Close()
    } catch {
        # Tangani penghentian server
        break
    }
}
$Listener.Stop()
