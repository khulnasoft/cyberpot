# genuserwin.ps1 - CyberPot web user creation for Windows
# Runs cyberpot-init container with volume mount and registry fallback
# Usage: .\genuserwin.ps1 [-Version 24.04.2] [-Repo docker.io/khulnasoft]

param(
    [string]$Version = $env:CYBERPOT_VERSION,
    [string]$Repo = $env:CYBERPOT_REPO
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Defaults from env or fallback
if (-not $Version -or $Version -eq "") {
    # Try to read from .env if exists
    $envPath = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath | Where-Object { $_ -match "^\s*CYBERPOT_VERSION\s*=" }
        if ($envContent) {
            $Version = ($envContent -split "=",2)[1].Trim().Trim('"').Trim("'").TrimStart("=")
        }
    }
    if (-not $Version -or $Version -eq "") { $Version = "24.04.2" }
    else { $Version = $Version.TrimStart("=").Trim() }
}
if (-not $Repo -or $Repo -eq "") {
    $envPath = Join-Path $PSScriptRoot ".env"
    if (Test-Path $envPath) {
        $envContent = Get-Content $envPath | Where-Object { $_ -match "^\s*CYBERPOT_REPO\s*=" }
        if ($envContent) {
            $Repo = ($envContent -split "=",2)[1].Trim().Trim('"').Trim("'")
        }
    }
    if (-not $Repo -or $Repo -eq "") { $Repo = "docker.io/khulnasoft" }
}

# Resolve home and data paths
$homePath = if ($env:USERPROFILE) { $env:USERPROFILE } else { $env:HOME }
if (-not $homePath) { $homePath = (Resolve-Path ~).Path }
$cyberpotData = Join-Path $homePath "cyberpot"
$nginxConfDir = Join-Path $cyberpotData "data\nginx\conf"
$nginxpasswdPath = Join-Path $nginxConfDir "nginxpasswd"

# Ensure directories and files exist
if (-Not (Test-Path $nginxConfDir)) {
    Write-Host "Creating $nginxConfDir"
    New-Item -ItemType Directory -Force -Path $nginxConfDir | Out-Null
}
if (-Not (Test-Path $nginxpasswdPath)) {
    New-Item -ItemType File -Force -Path $nginxpasswdPath | Out-Null
}
if (-Not (Test-Path (Join-Path $cyberpotData ".env"))) {
    Write-Warning "No .env found at $cyberpotData\.env"
}

# Check docker
try { docker info | Out-Null } catch {
    Write-Error "Docker not available. Please install Docker Desktop and ensure it is running."
    exit 1
}

# Registry fallback candidates
$candidates = @(
    "$Repo/cyberpot-init:$Version",
    "docker.io/khulnasoft/cyberpot-init:$Version",
    "ghcr.io/khulnasoft/cyberpot-init:$Version",
    "ghcr.io/khulnasoft-bot/cyberpot-init:$Version"
) | Select-Object -Unique

$image = $null
foreach ($cand in $candidates) {
    # Check local
    docker image inspect $cand 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Using local image: $cand"
        $image = $cand
        break
    }
    # Remote check (fast)
    try {
        docker manifest inspect $cand 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Found remote image: $cand"
            $image = $cand
            break
        }
    } catch {}
}

if (-not $image) {
    $image = $candidates[0]
    Write-Warning "No candidate found via manifest, trying default: $image"
}

# Pull if not present
docker image inspect $image 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Pulling $image ..."
    docker pull $image
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Failed to pull $image, trying alternatives..."
        foreach ($cand in $candidates) {
            if ($cand -eq $image) { continue }
            Write-Host "Trying $cand ..."
            docker pull $cand
            if ($LASTEXITCODE -eq 0) { $image = $cand; break }
        }
    }
}

# Verify
docker image inspect $image 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Image $image not available. Try: docker pull $image"
    exit 1
}

Write-Host "Running genuser via $image (data: $cyberpotData -> /data) ..."
# Use --rm, handle TTY
$ttyArgs = @()
if ([System.Console]::IsInputRedirected -eq $false -and [System.Console]::IsOutputRedirected -eq $false) {
    $ttyArgs = @("-it")
} else {
    $ttyArgs = @("-i")
}

# Run container
$dockerArgs = @("run", "--rm") + $ttyArgs + @("-v", "${homePath}/cyberpot:/data", "--entrypoint", "bash", $image, "/opt/cyberpot/bin/genuser.sh")
& docker @dockerArgs
exit $LASTEXITCODE
