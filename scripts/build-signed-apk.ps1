# Build a signed ApexDrive APK with optional baked-in server URL.
param(
    [string]$ServerUrl = "",
    [string]$Notes = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

if (-not $ServerUrl -and (Test-Path (Join-Path $Root "deploy.local.env"))) {
    Get-Content (Join-Path $Root "deploy.local.env") | ForEach-Object {
        if ($_ -match '^\s*PUBLIC_URL=(.*)$') { $ServerUrl = $matches[1].Trim().TrimEnd('/') }
    }
}
if (-not $ServerUrl) { $ServerUrl = "http://10.100.30.30:8090" }

$bootstrap = Join-Path $Root "client\public\server-bootstrap.json"
$bootstrapBak = Join-Path $env:TEMP "apexdrive-server-bootstrap.bak.json"
Copy-Item $bootstrap $bootstrapBak -Force
[System.IO.File]::WriteAllText($bootstrap, (@{ url = $ServerUrl } | ConvertTo-Json -Compress))
Write-Host "Baked server URL into APK bootstrap: $ServerUrl" -ForegroundColor Cyan

try {
    if ($Notes) {
        node (Join-Path $Root "scripts\bump-version.js") $Notes
    }
    $ver = (Get-Content (Join-Path $Root "version.json") | ConvertFrom-Json).version

    Push-Location (Join-Path $Root "client")
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "client build failed" }
        npx cap sync android
        if ($LASTEXITCODE -ne 0) { throw "cap sync failed" }
    } finally {
        Pop-Location
    }

    $env:APK_KEYSTORE = Join-Path $Root "certs\apk-signing\apexdrive-apk.keystore"
    $env:APK_STORE_PASS = "apexdrive"
    $env:APK_KEY_PASS = "apexdrive"
    $env:APK_KEY_ALIAS = "apexdrive"

    Push-Location (Join-Path $Root "client\android")
    try {
        .\gradlew.bat assembleDebug
        if ($LASTEXITCODE -ne 0) { throw "gradle assembleDebug failed" }
    } finally {
        Pop-Location
    }

    $src = Join-Path $Root "client\android\app\build\outputs\apk\debug\app-debug.apk"
    $destDir = Join-Path $Root "data\apks"
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    Copy-Item $src (Join-Path $destDir "apexdrive_v$ver.apk") -Force
    Copy-Item $src (Join-Path $destDir "apexdrive_latest.apk") -Force
    Write-Host "APK ready: data\apks\apexdrive_v$ver.apk (server $ServerUrl)" -ForegroundColor Green
} finally {
    Copy-Item $bootstrapBak $bootstrap -Force
    Remove-Item $bootstrapBak -Force -ErrorAction SilentlyContinue
    # Leave empty bootstrap in source tree for public builds
    [System.IO.File]::WriteAllText($bootstrap, '{"url":""}')
}
