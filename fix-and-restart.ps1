# Fix and Restart Script
# Clears cache and restarts development server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIXING COMPONENT ERROR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Stop any running instances
Write-Host "Step 1: Stopping any running instances..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Step 2: Clear node_modules cache
Write-Host "Step 2: Clearing cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.cache") {
    Remove-Item -Path "node_modules/.cache" -Recurse -Force
    Write-Host "✅ Cache cleared" -ForegroundColor Green
}

# Step 3: Restart development server
Write-Host ""
Write-Host "Step 3: Starting development server..." -ForegroundColor Yellow
Write-Host ""
npm start
