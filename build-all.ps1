param(
    [string]$Notes = "Build release update"
)

Write-Host "=== 1. Bumping Version ===" -ForegroundColor Cyan
node scripts/bump-version.js "$Notes"

$versionInfo = Get-Content "version.json" | ConvertFrom-Json
$ver = $versionInfo.version
$verCode = $versionInfo.versionCode
Write-Host "Target Release: v$ver (Code $verCode)" -ForegroundColor Green

Write-Host "=== 2. Building Client Web Application ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/client"
npm run build
npx cap sync android

Write-Host "=== 3. Building Android APK ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/client/android"
.\gradlew.bat clean assembleDebug

$apkSource = "app/build/outputs/apk/debug/app-debug.apk"
$destDir = "$PSScriptRoot/server/data/apks"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$versionedApk = "$destDir/apexdrive_v$ver.apk"
$latestApk = "$destDir/apexdrive_latest.apk"

Copy-Item $apkSource $versionedApk -Force
Copy-Item $apkSource $latestApk -Force
Write-Host "=== Saved APK to $versionedApk and $latestApk ===" -ForegroundColor Green

Set-Location "$PSScriptRoot"

Write-Host "=== 4. Building Server ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/server"
npm run build

Set-Location "$PSScriptRoot"
Write-Host "=== Release v$ver Built Successfully ===" -ForegroundColor Green
