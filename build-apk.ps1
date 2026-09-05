Write-Host "=== Building ApexDrive Web Assets ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/client"
npm run build
npx cap sync android

Write-Host "=== Building Android APK ===" -ForegroundColor Cyan
Set-Location "$PSScriptRoot/client/android"

if (Test-Path ".\gradlew.bat") {
    .\gradlew.bat assembleDebug
    $apkSource = "app/build/outputs/apk/debug/app-debug.apk"
    $destDir = "$PSScriptRoot/server/data/apks"
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item $apkSource "$destDir/apexdrive_latest.apk" -Force
    Write-Host "=== APK Successfully Built and Saved to server/data/apks/apexdrive_latest.apk ===" -ForegroundColor Green
} else {
    Write-Host "Android project synced. Open Android Studio with 'npx cap open android' to build APK." -ForegroundColor Yellow
}

Set-Location "$PSScriptRoot"
