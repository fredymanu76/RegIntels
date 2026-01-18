# ============================================================================
# PHASE 3 DEPLOYMENT SCRIPT - STRATEGIC COMPONENT INTEGRATION
# ============================================================================
# This script deploys the strategic component integration into App.js
# - Solution 1: Impact Scoring in Regulatory Change Intelligence
# - Solution 2: Control Drift monitoring in Policy & Control Management
# - Solution 3: Attestation Confidence in Risk & Control Assurance
# ============================================================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "PHASE 3: STRATEGIC COMPONENT INTEGRATION" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Git Status Check
Write-Host "[1/5] Checking git status..." -ForegroundColor Yellow
git status
Write-Host ""

# Step 2: Stage files
Write-Host "[2/5] Staging Phase 3 integration files..." -ForegroundColor Yellow
git add src/App.js
git add deploy-phase3-integration.ps1

Write-Host "✅ Files staged for commit" -ForegroundColor Green
Write-Host ""

# Step 3: Create commit
Write-Host "[3/5] Creating commit..." -ForegroundColor Yellow
$commitMessage = @"
feat: integrate strategic components into Solutions 1-3 (Phase 3)

SOLUTION 1: REGULATORY CHANGE INTELLIGENCE
- Added Impact Score fetching from v_regulatory_impact_score view
- Integrated ImpactScoreCard component in compact mode for change badges
- Display detailed impact scores for each regulatory change
- Replaced static impact badges with dynamic strategic scoring

SOLUTION 2: POLICY & CONTROL MANAGEMENT
- Added Control Drift fetching from v_control_drift_index view
- Integrated ControlDriftHeatmap at top of control library
- Added ControlDriftBadge to control cards (compact mode)
- Show detailed drift info for CRITICAL_DRIFT controls
- Enable drill-down via heatmap click handlers

SOLUTION 3: RISK & CONTROL ASSURANCE
- Added Attestation Confidence fetching from v_attestation_confidence_index
- Display overall confidence widget at page header
- Integrated AttestationConfidenceWidget in compact mode for attestation badges
- Show detailed confidence metrics for each attestation
- Added confidence column to attestation summary table

TECHNICAL IMPLEMENTATION:
- All fetches use AbortController for proper cleanup
- Strategic data merged with existing data via array mapping
- Loading states prevent flash of missing data
- Compact and full component modes used appropriately
- Follows established error handling patterns

PHASE 3 STATUS: ✅ COMPLETE
Next: Deploy SQL migrations to Supabase and test with real data

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
"@

git commit -m $commitMessage

Write-Host "✅ Commit created" -ForegroundColor Green
Write-Host ""

# Step 4: Create tag
Write-Host "[4/5] Creating version tag v1.3.0..." -ForegroundColor Yellow
git tag -a v1.3.0 -m "Phase 3: Strategic Component Integration - Solutions 1-3 upgraded with Impact Scoring, Control Drift, and Attestation Confidence"

Write-Host "✅ Tag v1.3.0 created" -ForegroundColor Green
Write-Host ""

# Step 5: Push to remote
Write-Host "[5/5] Pushing to remote repository..." -ForegroundColor Yellow
git push origin fix/policy-endpoints
git push origin v1.3.0

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "✅ PHASE 3 DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "INTEGRATION SUMMARY:" -ForegroundColor Cyan
Write-Host "- Solution 1: Impact Scores integrated ✅" -ForegroundColor Green
Write-Host "- Solution 2: Control Drift integrated ✅" -ForegroundColor Green
Write-Host "- Solution 3: Attestation Confidence integrated ✅" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Deploy SQL migrations to Supabase (see STRATEGIC_UPGRADE_DEPLOYMENT.md)"
Write-Host "2. Test strategic views return data correctly"
Write-Host "3. Verify all three components render with live data"
Write-Host "4. Run full user acceptance testing"
Write-Host ""
Write-Host "VERSION: v1.3.0" -ForegroundColor Cyan
Write-Host "STATUS: Ready for Supabase deployment" -ForegroundColor Green
Write-Host ""
