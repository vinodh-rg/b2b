# CrossDrop One-Click Release Script

Write-Host "🚀 Starting CrossDrop Release Process..." -ForegroundColor Cyan

# 1. Get Current Version
$manifestPath = "extension/manifest.json"
if (-not (Test-Path $manifestPath)) {
    Write-Error "manifest.json not found in extension/ folder!"
    exit 1
}

$manifest = Get-Content $manifestPath | ConvertFrom-Json
$currentVersion = $manifest.version
Write-Host "Current Version: $currentVersion" -ForegroundColor Yellow

# 2. Ask for New Version
$newVersion = Read-Host "Enter new version (e.g., 1.0.1)"
if ([string]::IsNullOrWhiteSpace($newVersion)) {
    Write-Error "Version cannot be empty."
    exit 1
}

# 3. Update manifest.json
$manifest.version = $newVersion
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath
Write-Host "✅ Updated manifest.json to $newVersion" -ForegroundColor Green

# 4. Git Operations
Write-Host "📦 Committing changes..." -ForegroundColor Cyan
git add extension/manifest.json
git commit -m "Release v$newVersion"

Write-Host "🏷️ Tagging v$newVersion..." -ForegroundColor Cyan
git tag "v$newVersion"

Write-Host "pushing to GitHub... (This triggers the Release & Website update)" -ForegroundColor Cyan
git push origin main
git push origin "v$newVersion"

Write-Host "🎉 DONE! Release v$newVersion is live." -ForegroundColor Green
Write-Host "Check progress here: https://github.com/vinodh-rg/b2b/actions" -ForegroundColor Yellow
Write-Host "Press Enter to exit..."
Read-Host
