# Export sanitized source and push to a public GitHub repository.
# Prerequisites: GitHub CLI authenticated (`gh auth login`) or GH_TOKEN set.

param(
    [string]$GitHubOwner = "",
    [string]$RepoName = "apexdrive",
    [switch]$CreateRepo
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ExportDir = Join-Path $Root ".public-export"

& (Join-Path $PSScriptRoot "export-public-tree.ps1") -OutputDir $ExportDir

$ghCandidates = @(
    "gh",
    "$env:LOCALAPPDATA\gh-cli\bin\gh.exe",
    "C:\Program Files\GitHub CLI\gh.exe"
)
$gh = $ghCandidates | Where-Object { if ($_ -eq "gh") { Get-Command gh -ErrorAction SilentlyContinue } else { Test-Path $_ } } | Select-Object -First 1
if ($gh -eq "gh") { $gh = (Get-Command gh).Source }
if (-not $gh) { throw "GitHub CLI (gh) not found. Install from https://cli.github.com/ or run: winget install GitHub.cli" }

if (-not $GitHubOwner) {
    $GitHubOwner = (& $gh api user -q .login 2>$null)
    if (-not $GitHubOwner) { throw "Could not detect GitHub user. Run 'gh auth login' or pass -GitHubOwner." }
}

$git = "C:\Program Files\Git\bin\git.exe"
if (-not (Test-Path $git)) { $git = "git" }

Push-Location $ExportDir
try {
    if (-not (Test-Path ".git")) {
        & $git init -b main | Out-Null
    }

    & $git add -A
    $status = & $git status --porcelain
    if ($status) {
        $env:GIT_AUTHOR_NAME = "Ethan"
        $env:GIT_AUTHOR_EMAIL = "ethan@users.noreply.local"
        $env:GIT_COMMITTER_NAME = "Ethan"
        $env:GIT_COMMITTER_EMAIL = "ethan@users.noreply.local"
        & $git commit -m "Public ApexDrive release (sanitized export)"
    }

    $remoteUrl = "https://github.com/$GitHubOwner/$RepoName.git"
    $remotes = @(& $git remote)
    if ($remotes -contains "github") {
        & $git remote set-url github $remoteUrl
    } else {
        & $git remote add github $remoteUrl
    }

    if ($CreateRepo) {
        & $gh repo create "$GitHubOwner/$RepoName" --public --source . --remote github --push --description "Self-hosted vehicle expense and maintenance tracker (ApexDrive)"
    } else {
        & $git push -u github main --force
    }

    Write-Host "Public repo pushed: https://github.com/$GitHubOwner/$RepoName" -ForegroundColor Green
} finally {
    Pop-Location
}
