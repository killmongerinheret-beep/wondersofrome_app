param(
    [string]$MapboxToken,
    [string]$MapboxPublicToken
)

$ErrorActionPreference = "Stop"

# Set Android SDK path (Adjust if your user path is different)
$userName = $env:USERNAME
$sdkPath = "C:\Users\$userName\AppData\Local\Android\Sdk"

# Check if SDK path exists
if (!(Test-Path $sdkPath)) {
    Write-Host "Error: Android SDK not found at $sdkPath" -ForegroundColor Red
    Write-Host "Please open Android Studio -> Settings -> Languages & Frameworks -> Android SDK"
    Write-Host "Copy the 'Android SDK Location' and edit this script."
    exit 1
}

# Set Environment Variables for the current session
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Add platform-tools to PATH (for adb)
$platformTools = "$sdkPath\platform-tools"
if ($env:Path -notlike "*$platformTools*") {
    $env:Path += ";$platformTools"
    Write-Host "Added platform-tools to PATH" -ForegroundColor Green
}

# Persist Environment Variables (User level)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, [System.EnvironmentVariableTarget]::User)
[System.Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, [System.EnvironmentVariableTarget]::User)

function Resolve-JavaHome {
    $candidates = @(
        "$env:ProgramFiles\Android\Android Studio\jbr",
        "$env:ProgramFiles\Android\Android Studio\jre",
        "$env:LOCALAPPDATA\Programs\Android Studio\jbr",
        "$env:LOCALAPPDATA\Programs\Android Studio\jre",
        "D:\androidstudio\jbr",
        "D:\AndroidStudio\jbr"
    )

    foreach ($candidate in $candidates) {
        if (Test-Path "$candidate\bin\java.exe") {
            return $candidate
        }
    }

    $toolboxRoot = "$env:LOCALAPPDATA\JetBrains\Toolbox\apps\AndroidStudio"
    if (Test-Path $toolboxRoot) {
        $toolboxJbr = Get-ChildItem -Path $toolboxRoot -Recurse -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -in @('jbr', 'jre') } |
            ForEach-Object { $_.FullName } |
            Where-Object { Test-Path (Join-Path $_ 'bin\java.exe') } |
            Select-Object -First 1

        if ($toolboxJbr) {
            return $toolboxJbr
        }
    }

    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd -and $javaCmd.Source) {
        $javaBinDir = Split-Path -Parent $javaCmd.Source
        $javaHomeFromPath = Split-Path -Parent $javaBinDir
        if (Test-Path (Join-Path $javaHomeFromPath 'bin\java.exe')) {
            return $javaHomeFromPath
        }
    }

    $knownStudioBins = @(
        "$env:ProgramFiles\Android\Android Studio\bin\studio64.exe",
        "$env:LOCALAPPDATA\Programs\Android Studio\bin\studio64.exe",
        "D:\androidstudio\bin\studio64.exe",
        "D:\AndroidStudio\bin\studio64.exe"
    )

    foreach ($studioBin in $knownStudioBins) {
        if (Test-Path $studioBin) {
            $studioRoot = Split-Path -Parent (Split-Path -Parent $studioBin)
            $jbrFromStudio = Join-Path $studioRoot 'jbr'
            if (Test-Path (Join-Path $jbrFromStudio 'bin\java.exe')) {
                return $jbrFromStudio
            }
        }
    }

    return $null
}

$javaHome = Resolve-JavaHome
if (!$javaHome) {
    Write-Host "Error: Could not find Java (JDK) on this machine." -ForegroundColor Red
    Write-Host "Fix options:" -ForegroundColor Red
    Write-Host "1) Android Studio -> File -> Settings -> (search) 'Gradle JDK' and pick 'Embedded JDK' / 'Android Studio default JDK'" -ForegroundColor Red
    Write-Host "2) Install JDK 17 (Temurin/Adoptium) and reopen PowerShell; make sure 'java -version' works" -ForegroundColor Red
    exit 1
}

$env:JAVA_HOME = $javaHome
[System.Environment]::SetEnvironmentVariable('JAVA_HOME', $javaHome, [System.EnvironmentVariableTarget]::User)

$javaBin = "$javaHome\bin"
if ($env:Path -notlike "*$javaBin*") {
    $env:Path += ";$javaBin"
}

if (-not $MapboxToken) {
    $MapboxToken = Read-Host "Enter Mapbox secret token (starts with sk.)"
}

if ($MapboxToken) {
    $env:RNMAPBOX_MAPS_DOWNLOAD_TOKEN = $MapboxToken
    $env:RNMAPBOX_MAPS_DOWNLOAD__TOKEN = $MapboxToken
    [System.Environment]::SetEnvironmentVariable('RNMAPBOX_MAPS_DOWNLOAD_TOKEN', $MapboxToken, [System.EnvironmentVariableTarget]::User)
    [System.Environment]::SetEnvironmentVariable('RNMAPBOX_MAPS_DOWNLOAD__TOKEN', $MapboxToken, [System.EnvironmentVariableTarget]::User)
} else {
    Write-Host "Warning: Mapbox token not provided. Map downloads may fail until RNMAPBOX_MAPS_DOWNLOAD_TOKEN is set." -ForegroundColor Yellow
}

if (-not $MapboxPublicToken) {
    $MapboxPublicToken = Read-Host "Enter Mapbox public token (starts with pk.)"
}

if ($MapboxPublicToken) {
    $env:EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN = $MapboxPublicToken
    [System.Environment]::SetEnvironmentVariable('EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN', $MapboxPublicToken, [System.EnvironmentVariableTarget]::User)
} else {
    Write-Host "Warning: Mapbox public token not provided. The Explore map will not render until EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN is set." -ForegroundColor Yellow
}

# Create local.properties if it doesn't exist (Android build needs this)
$localPropsPath = "android\local.properties"
if (!(Test-Path "android")) {
    # If android folder doesn't exist, we might need to prebuild first
    Write-Host "Android folder not found. Running prebuild..." -ForegroundColor Cyan
    npx expo prebuild --platform android --clean
}

$sdkPathEscaped = $sdkPath -replace "\\", "\\"
Set-Content -Path $localPropsPath -Value "sdk.dir=$sdkPathEscaped"
Write-Host "Created local.properties pointing to SDK." -ForegroundColor Green

Write-Host "Setup Complete! Restart your terminal or VS Code to apply changes." -ForegroundColor Cyan
Write-Host "Then run: npx expo run:android" -ForegroundColor Cyan
