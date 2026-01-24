# ============================================================================
# RegIntels - Execute Strategic Migrations Script
# ============================================================================
# This script executes all migrations in the correct order to set up the
# strategic scoring system (Impact Scoring, Control Drift, Attestation Confidence)
# ============================================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RegIntels Strategic Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)\s*=\s*(.*)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "✓ Loaded environment variables from .env" -ForegroundColor Green
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    exit 1
}

$SUPABASE_URL = $env:REACT_APP_SUPABASE_URL
$SUPABASE_ANON_KEY = $env:REACT_APP_SUPABASE_ANON_KEY

if (-not $SUPABASE_URL -or -not $SUPABASE_ANON_KEY) {
    Write-Host "✗ Missing Supabase credentials in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Supabase URL: $SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Function to execute SQL file
function Execute-SQLFile {
    param(
        [string]$FilePath,
        [string]$Description
    )

    Write-Host "→ Executing: $Description" -ForegroundColor Yellow
    Write-Host "  File: $FilePath" -ForegroundColor Gray

    if (-not (Test-Path $FilePath)) {
        Write-Host "  ✗ File not found: $FilePath" -ForegroundColor Red
        return $false
    }

    # Read SQL file content
    $sqlContent = Get-Content $FilePath -Raw -Encoding UTF8

    # Prepare request body
    $body = @{
        query = $sqlContent
    } | ConvertTo-Json -Depth 10

    # Execute SQL via Supabase REST API
    try {
        $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/rpc/exec" `
            -Method POST `
            -Headers @{
                "apikey" = $SUPABASE_ANON_KEY
                "Authorization" = "Bearer $SUPABASE_ANON_KEY"
                "Content-Type" = "application/json"
            } `
            -Body $body `
            -ErrorAction Stop

        Write-Host "  ✓ Success" -ForegroundColor Green
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "  ✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Migration files in order
$migrations = @(
    @{
        Path = "supabase\migrations\001_base_schema.sql"
        Description = "Base Schema (Tables: regulatory_changes, controls, attestations, exceptions, actions)"
    },
    @{
        Path = "supabase\migrations\20260118_impact_scoring_views.sql"
        Description = "Impact Scoring Views (v_regulatory_impact_score)"
    },
    @{
        Path = "supabase\migrations\20260118_control_drift_views.sql"
        Description = "Control Drift Views (v_control_drift_index, v_control_drift_summary)"
    },
    @{
        Path = "supabase\migrations\20260118_attestation_confidence_views.sql"
        Description = "Attestation Confidence Views (v_attestation_confidence_index, v_attestation_confidence_summary)"
    }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Executing Migrations (Total: $($migrations.Count))" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($migration in $migrations) {
    $result = Execute-SQLFile -FilePath $migration.Path -Description $migration.Description

    if ($result) {
        $successCount++
    } else {
        $failCount++
        Write-Host "⚠ Migration failed. Stopping execution." -ForegroundColor Red
        break
    }

    Start-Sleep -Seconds 2
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Successful: $successCount" -ForegroundColor Green
Write-Host "✗ Failed: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 All migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Supabase SQL Editor to verify tables and views" -ForegroundColor White
    Write-Host "2. Run test queries on the new views" -ForegroundColor White
    Write-Host "3. Add sample data to test the strategic scoring system" -ForegroundColor White
} else {
    Write-Host "❌ Some migrations failed. Please check the errors above." -ForegroundColor Red
    Write-Host "You may need to run the migrations manually in Supabase SQL Editor." -ForegroundColor Yellow
}

Write-Host ""
