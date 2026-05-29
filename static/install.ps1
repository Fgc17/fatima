param(
    [switch]$Help,
    [string]$Version = $env:VERSION,
    [string]$Binary = "",
    [switch]$NoModifyPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
} catch {
    # PowerShell Core on newer platforms may not need this.
}

$App = "fatima"
$Repo = "fgcoelho/fatima"
$InstallDir = Join-Path $HOME ".fatima\bin"

function Write-Info($Message) {
    Write-Host $Message
}

function Write-ErrorMessage($Message) {
    Write-Host $Message -ForegroundColor Red
}

function Show-Usage {
    @"
Fatima Installer

Usage:
    irm https://cdn.fatima.dev/install.ps1 | iex
    & { `$(irm https://cdn.fatima.dev/install.ps1) } -Version 0.0.1

Options:
    -Help              Display this help message
    -Version <version> Install a specific version (e.g. 0.0.1)
    -Binary <path>     Install from a local binary instead of downloading
    -NoModifyPath      Don't update the user PATH
"@
}

function Normalize-Version($Value) {
    return (($Value -replace '^fatima@', '') -replace '^v', '')
}

function Get-Target {
    $isWindowsHost = $true
    if (Get-Variable -Name IsWindows -Scope Global -ErrorAction SilentlyContinue) {
        $isWindowsHost = $IsWindows
    } elseif ($env:OS -ne "Windows_NT") {
        $isWindowsHost = $false
    }

    if (-not $isWindowsHost) {
        throw "install.ps1 is only supported on Windows. Use install.sh on Linux or macOS."
    }

    $arch = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) {
        $arch = $env:PROCESSOR_ARCHITEW6432
    }

    switch ($arch) {
        "AMD64" { return "windows-x64" }
        "ARM64" { return "windows-arm64" }
        default { throw "Unsupported Windows architecture: $arch" }
    }
}

function Add-ToPath {
    if ($NoModifyPath) {
        return
    }

    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $paths = @()
    if ($userPath) {
        $paths = $userPath -split ';' | Where-Object { $_ }
    }

    if ($paths -notcontains $InstallDir) {
        $newPath = if ($userPath) { "$userPath;$InstallDir" } else { $InstallDir }
        [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
        Write-Info "Added fatima to user PATH. Restart your terminal to use it from a new session."
    }

    if (($env:Path -split ';') -notcontains $InstallDir) {
        $env:Path = "$InstallDir;$env:Path"
    }
}

function Install-FromBinary {
    if (-not (Test-Path -LiteralPath $Binary -PathType Leaf)) {
        throw "Binary not found at $Binary"
    }

    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    Write-Info "Installing/updating $App from: $Binary"
    Copy-Item -LiteralPath $Binary -Destination (Join-Path $InstallDir "fatima.exe") -Force
}

function Download-AndInstall {
    $target = Get-Target
    $filename = "$App-$target.zip"
    $headers = @{ "User-Agent" = "fatima-installer" }

    if ([string]::IsNullOrWhiteSpace($Version)) {
        $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -Headers $headers
        $installVersion = Normalize-Version $release.tag_name
        $url = "https://github.com/$Repo/releases/latest/download/$filename"
    } else {
        $installVersion = Normalize-Version $Version
        $url = "https://github.com/$Repo/releases/download/v$installVersion/$filename"
    }

    if ([string]::IsNullOrWhiteSpace($installVersion)) {
        throw "Failed to fetch version information"
    }

    Write-Info "Installing/updating $App version: $installVersion"

    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
    $tmpDir = Join-Path ([System.IO.Path]::GetTempPath()) ([System.IO.Path]::GetRandomFileName())
    New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null

    try {
        $archivePath = Join-Path $tmpDir $filename
        Invoke-WebRequest -Uri $url -OutFile $archivePath -Headers $headers
        Expand-Archive -LiteralPath $archivePath -DestinationPath $tmpDir -Force

        $binaryPath = Join-Path $tmpDir "fatima.exe"
        if (-not (Test-Path -LiteralPath $binaryPath -PathType Leaf)) {
            throw "Release archive did not contain fatima.exe"
        }

        Move-Item -LiteralPath $binaryPath -Destination (Join-Path $InstallDir "fatima.exe") -Force
    } finally {
        Remove-Item -LiteralPath $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

try {
    if ($Help) {
        Show-Usage
        exit 0
    }

    if ($Binary) {
        Install-FromBinary
    } else {
        Download-AndInstall
    }

    Add-ToPath

    Write-Info ""
    Write-Info "fatima installed to $(Join-Path $InstallDir 'fatima.exe')"
    Write-Info "Run fatima --help to get started."
} catch {
    Write-ErrorMessage "Error: $($_.Exception.Message)"
    exit 1
}
