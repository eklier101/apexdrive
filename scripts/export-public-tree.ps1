# Exports a sanitized copy of the repo for public GitHub publishing.
# Excludes paths listed in .publicignore (one pattern per line).

param(
    [string]$OutputDir = ""
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
if (-not $OutputDir) {
    $OutputDir = Join-Path $Root ".public-export"
}

$publicIgnoreFile = Join-Path $Root ".publicignore"
$patterns = @()
if (Test-Path $publicIgnoreFile) {
    Get-Content $publicIgnoreFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $patterns += $line
        }
    }
}

function ShouldExclude([string]$relativePath) {
    $normalized = $relativePath -replace '\\', '/'
    foreach ($pattern in $patterns) {
        $p = $pattern -replace '\\', '/'
        if ($p.EndsWith('/')) {
            if ($normalized.StartsWith($p) -or $normalized -like "$p*") { return $true }
        } elseif ($normalized -eq $p -or $normalized -like "*/$p" -or $normalized -like "$p/*" -or $normalized -like "*/$p/*") {
            return $true
        }
    }
    return $false
}

if (Test-Path $OutputDir) {
    try {
        Remove-Item $OutputDir -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Warning "Could not clear $OutputDir (in use). Updating files in place."
    }
}
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

$excludeDirs = @('node_modules', '.git', 'client\android\app\build', 'client\android\.gradle', '.public-export', 'data', 'server\data', 'server\dist', 'client\dist')

Get-ChildItem -Path $Root -Recurse -Force | ForEach-Object {
    $full = $_.FullName
    $rel = $full.Substring($Root.Path.Length).TrimStart('\', '/')
    if (-not $rel) { return }

    foreach ($skip in $excludeDirs) {
        if ($rel -eq $skip -or $rel.StartsWith("$skip\") -or $rel.StartsWith("$skip/")) { return }
    }
    if (ShouldExclude $rel) { return }

    $dest = Join-Path $OutputDir $rel
    if ($_.PSIsContainer) {
        if (-not (Test-Path $dest)) {
            New-Item -ItemType Directory -Path $dest -Force | Out-Null
        }
    } else {
        $destParent = Split-Path $dest -Parent
        if (-not (Test-Path $destParent)) {
            New-Item -ItemType Directory -Path $destParent -Force | Out-Null
        }
        Copy-Item $full $dest -Force
    }
}

Write-Host "Public export written to: $OutputDir" -ForegroundColor Green
Write-Host "Excluded patterns from .publicignore: $($patterns.Count)" -ForegroundColor Cyan

# Quick audit for private IPs in exported source (exclude this script's own pattern literals)
$auditFiles = Get-ChildItem -Path $OutputDir -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Extension -notin @('.ps1', '.md') }
$leaks = $auditFiles | Select-String -Pattern '10\.100\.\d+|enckliers' -ErrorAction SilentlyContinue
if ($leaks) {
    Write-Warning 'Possible personalization found in export — review before pushing to GitHub:'
    $leaks | Select-Object -First 10 | ForEach-Object { Write-Warning $_.Line }
} else {
    Write-Host 'Audit: no private IP or domain leaks in export.' -ForegroundColor Green
}
