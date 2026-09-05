# Deploy current tree to personal LXC and rebuild Docker there (Go image).
# Skips local Android/APK build so you can push server+web features quickly.
# Preserves /opt/.../data (SQLite, uploads, APKs).

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }

$localEnvPath = Join-Path $Root "deploy.local.env"
if (-not (Test-Path $localEnvPath)) {
    throw "Missing deploy.local.env"
}
Get-Content $localEnvPath | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        Set-Item -Path "Env:$($matches[1].Trim())" -Value $matches[2].Trim()
    }
}
if (-not $env:DEPLOY_HOST -or -not $env:REMOTE_DIR) {
    throw "deploy.local.env must set DEPLOY_HOST and REMOTE_DIR"
}

$LXC = $env:DEPLOY_HOST
$REMOTE = $env:REMOTE_DIR.TrimEnd('/')
$PUBLIC = if ($env:PUBLIC_URL) { $env:PUBLIC_URL.TrimEnd('/') } else { "http://10.100.30.30:8090" }

Write-Host "=== Deploying ApexDrive (Docker rebuild on $LXC) ===" -ForegroundColor Cyan

# Prefer existing production JWT if present in local .env; otherwise generate.
$jwt = ""
$syncTok = ""
if (Test-Path (Join-Path $Root ".env")) {
    Get-Content (Join-Path $Root ".env") | ForEach-Object {
        if ($_ -match '^\s*JWT_SECRET=(.*)$') { $jwt = $matches[1].Trim() }
        if ($_ -match '^\s*SYNC_TOKEN=(.*)$') { $syncTok = $matches[1].Trim() }
    }
}
if (Test-Path (Join-Path $Root "scripts\sync-account.local.env")) {
    Get-Content (Join-Path $Root "scripts\sync-account.local.env") | ForEach-Object {
        if ($_ -match '^\s*SYNC_TOKEN=(.*)$') { $syncTok = $matches[1].Trim() }
    }
}
if (-not $jwt -or $jwt -match 'change-me|local-dev') {
    $bytes = New-Object byte[] 48
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $jwt = [Convert]::ToBase64String($bytes)
}

$tar = Join-Path $env:TEMP "apexdrive-deploy.tgz"
if (Test-Path $tar) { Remove-Item $tar -Force }

Write-Host "Packaging source..." -ForegroundColor Cyan
Push-Location $Root
try {
    & $git archive --format=tar.gz -o $tar HEAD
    if ($LASTEXITCODE -ne 0) { throw "git archive failed" }
} finally {
    Pop-Location
}

Write-Host "Uploading to $REMOTE ..." -ForegroundColor Cyan
ssh $LXC "mkdir -p $REMOTE"
scp $tar "${LXC}:/tmp/apexdrive-deploy.tgz"
Remove-Item $tar -Force

# Write remote .env without echoing secrets
$envRemote = @"
JWT_SECRET=$jwt
PORT=8090
HOST=0.0.0.0
DATA_DIR=/app/data
PUBLIC_DIR=/app/public
APP_ENV=production
NODE_ENV=production
SYNC_TOKEN=$syncTok
"@
$envRemote | ssh $LXC "cat > $REMOTE/.env && chmod 600 $REMOTE/.env"

Write-Host "Extracting + rebuilding container (keeps ./data)..." -ForegroundColor Cyan
$remoteSh = @'
#!/bin/bash
set -euo pipefail
REMOTE=/opt/vehicle-tracker
cd "$REMOTE"
mkdir -p data/uploads data/apks
docker stop vehicle-tracker apexdrive 2>/dev/null || true
docker rm vehicle-tracker apexdrive 2>/dev/null || true
tar -xzf /tmp/apexdrive-deploy.tgz -C "$REMOTE"
rm -f /tmp/apexdrive-deploy.tgz
docker compose build
docker compose up -d --force-recreate
sleep 8
curl -s http://127.0.0.1:8090/api/health; echo
docker ps --filter name=apexdrive --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
'@
$remoteSh = $remoteSh -replace "`r`n", "`n"
[System.IO.File]::WriteAllText("$env:TEMP\remote-rebuild-personal.sh", $remoteSh)
scp "$env:TEMP\remote-rebuild-personal.sh" "${LXC}:/tmp/remote-rebuild-personal.sh"
ssh $LXC "chmod +x /tmp/remote-rebuild-personal.sh && bash /tmp/remote-rebuild-personal.sh"

Write-Host ""
Write-Host "Deployed to $PUBLIC" -ForegroundColor Green
Write-Host "Open: $PUBLIC" -ForegroundColor Green
Write-Host "Health: $PUBLIC/api/health" -ForegroundColor Green
