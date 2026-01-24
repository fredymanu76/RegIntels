# Deploy Board Tables to Supabase
# This script deploys the decisions and approvals tables

Write-Host "===========================================
" -ForegroundColor Cyan
Write-Host "Deploying Board-Level Tables to Supabase" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Check if temp_migration.sql exists
if (!(Test-Path "temp_migration.sql")) {
    Write-Host "Error: temp_migration.sql not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Found temp_migration.sql" -ForegroundColor Green

# Execute using supabase db reset which will apply all migrations
Write-Host ""
Write-Host "Attempting to push migrations to remote database..." -ForegroundColor Yellow
Write-Host ""

# Try using supabase db push with automatic yes
$env:SUPABASE_DB_PASS = ""
echo "Y" | supabase db push

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Migrations pushed successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Push failed. Trying alternative method..." -ForegroundColor Yellow
    Write-Host ""

    # Alternative: Use SQL Editor URL
    $projectRef = Get-Content "supabase/.temp/project-ref" -Raw
    $projectRef = $projectRef.Trim()
    $sqlEditorUrl = "https://supabase.com/dashboard/project/$projectRef/sql/new"

    Write-Host "Please open the SQL Editor and paste the SQL:" -ForegroundColor Yellow
    Write-Host $sqlEditorUrl -ForegroundColor Cyan
    Write-Host ""
    Write-Host "SQL file location: $PWD\temp_migration.sql" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can also copy the SQL to clipboard:" -ForegroundColor Yellow
    Write-Host "  Get-Content temp_migration.sql | Set-Clipboard" -ForegroundColor Cyan

    # Try to open browser
    Start-Process $sqlEditorUrl

    # Copy to clipboard
    try {
        Get-Content "temp_migration.sql" | Set-Clipboard
        Write-Host ""
        Write-Host "SQL copied to clipboard! Just paste it in the SQL Editor." -ForegroundColor Green
    } catch {
        Write-Host "Could not copy to clipboard automatically." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
