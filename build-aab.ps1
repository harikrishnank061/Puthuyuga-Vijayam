# build-aab.ps1
# Build script for building Next.js static assets and compiling the Android App Bundle (.aab) via Capacitor CLI.

Write-Host "Starting Android App Bundle (.aab) compilation process..." -ForegroundColor Cyan

# 1. Temporarily backup app/api directory
if (Test-Path "app/api") {
    Write-Host "Backing up app/api to avoid static export errors..." -ForegroundColor Yellow
    if (Test-Path "api_routes_backup") {
        Remove-Item -Path "api_routes_backup" -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path "api_routes_backup" | Out-Null
    Move-Item -Path "app/api/*" -Destination "api_routes_backup/" -Force
}

# 2. Build the Next.js application in static export mode
Write-Host "Running Next.js static build..." -ForegroundColor Yellow
$env:STATIC_EXPORT="true"
$env:NEXT_PUBLIC_API_URL="https://www.puthuyugavijayam.in"
npm run build

$buildStatus = $LASTEXITCODE

# 3. Restore app/api directory immediately
if (Test-Path "api_routes_backup") {
    Write-Host "Restoring app/api..." -ForegroundColor Yellow
    Move-Item -Path "api_routes_backup/*" -Destination "app/api/" -Force
    Remove-Item -Path "api_routes_backup" -Recurse -Force
}

if ($buildStatus -ne 0) {
    Write-Error "Next.js build failed!"
    exit $buildStatus
}

# 4. Sync web assets to Capacitor Android project
Write-Host "Syncing web assets to Capacitor Android project..." -ForegroundColor Yellow
npx cap sync

if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed!"
    exit $LASTEXITCODE
}

# 5. Compile Android AAB using Gradle (bundleRelease)
Write-Host "Compiling Android App Bundle (.aab) using Gradle..." -ForegroundColor Yellow
cd android
.\gradlew.bat bundleRelease
$gradleStatus = $LASTEXITCODE
cd ..

if ($gradleStatus -ne 0) {
    Write-Error "Gradle build failed!"
    exit $gradleStatus
}

# 6. Copy final AAB to the root
$aabPath = "android/app/build/outputs/bundle/release/app-release.aab"
if (Test-Path $aabPath) {
    Write-Host "Copying AAB to project root..." -ForegroundColor Green
    Copy-Item -Path $aabPath -Destination "Puthuyugavijayam.aab" -Force
    Write-Host "SUCCESS: Android App Bundle generated at Puthuyugavijayam.aab" -ForegroundColor Green
} else {
    Write-Error "AAB file was not found in Gradle build outputs!"
    exit 1
}
