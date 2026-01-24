# ============================================================================
# SOLUTION 4 DEPLOYMENT SCRIPT
# ============================================================================
# This script will:
# 1. Install @supabase/supabase-js
# 2. Verify files exist
# 3. Instructions to restart app
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SOLUTION 4 DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Supabase SDK
Write-Host "Step 1: Installing @supabase/supabase-js..." -ForegroundColor Yellow
npm install @supabase/supabase-js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Supabase SDK installed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install Supabase SDK" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Verify files exist
Write-Host "Step 2: Verifying Solution 4 files..." -ForegroundColor Yellow

$files = @(
    "src\services\supabaseClient.js",
    "src\services\solution4Service.js",
    "src\components\Solution4Dashboard.jsx",
    "src\components\Solution4Dashboard.css"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - MISSING!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

Write-Host ""

if (-not $allFilesExist) {
    Write-Host "❌ Some files are missing!" -ForegroundColor Red
    exit 1
}

# Step 3: Check App.js was updated
Write-Host "Step 3: Checking App.js integration..." -ForegroundColor Yellow

$appJsContent = Get-Content "src\App.js" -Raw
if ($appJsContent -match "Solution4Dashboard") {
    Write-Host "✅ App.js updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ App.js not updated - Solution4Dashboard import missing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Supabase SDK installed" -ForegroundColor Green
Write-Host "  ✅ All Solution 4 files verified" -ForegroundColor Green
Write-Host "  ✅ App.js integration complete" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 NEXT STEPS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Start your development server:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Navigate to Solution 4 in your app" -ForegroundColor White
Write-Host ""
Write-Host "3. Click 'Risk Signal Hub' to see the new dashboard!" -ForegroundColor White
Write-Host ""
Write-Host "📊 Where to find it:" -ForegroundColor Yellow
Write-Host "   Solution 4 > Risk Signal Hub (2nd menu item)" -ForegroundColor White
Write-Host ""
Write-Host "🔥 OPTIONAL - Boost Scores to 50+:" -ForegroundColor Yellow
Write-Host "   Run ADD_REGULATORY_CHANGES.sql in Supabase" -ForegroundColor White
Write-Host ""
