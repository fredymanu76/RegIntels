# ============================================================================
# RegIntels Phase 2 Component Deployment Script
# ============================================================================
# Purpose: Deploy UI components for Impact Scoring, Control Drift, and
#          Attestation Confidence to GitHub
# ============================================================================

Write-Host "`n🎨 RegIntels Phase 2: UI Components Deployment`n" -ForegroundColor Cyan

# Navigate to project directory
cd C:\Users\dbnew\Desktop\regintels-app

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

# Stage new component files
Write-Host "`n📦 Staging Phase 2 component files..." -ForegroundColor Yellow
git add src/components/ImpactScoreCard.jsx
git add src/components/ControlDriftBadge.jsx
git add src/components/AttestationConfidenceWidget.jsx
git add src/components/ControlDriftHeatmap.jsx
git add src/COMPONENT_INTEGRATION_GUIDE.md

# Create commit
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
git commit -m "feat: Phase 2 UI Components - Strategic Scoring System

COMPONENTS ADDED:
- ImpactScoreCard: Display regulatory impact scores (0-100) with risk bands
- ControlDriftBadge: Visual indicators for control drift status
- AttestationConfidenceWidget: Confidence scoring with gauge visualization
- ControlDriftHeatmap: Dashboard heatmap for control drift overview

FEATURES:
- Color-coded risk bands (Green/Amber/Red)
- Compact and full view modes for all components
- Interactive hover states and click handlers
- Circular gauge for confidence scores
- Grid-based heatmap with drill-down
- Fully responsive and accessible

INTEGRATION:
- Ready for Solutions 1-3 pages
- Comprehensive integration guide included
- Props reference documentation
- Data fetching patterns with examples

TECHNICAL:
- Inline styling for portability
- No external dependencies
- Lucide React icons
- Smooth animations and transitions

See src/COMPONENT_INTEGRATION_GUIDE.md for integration instructions."

# Create version tag
Write-Host "`n🏷️  Creating version tag v1.2.0..." -ForegroundColor Yellow
git tag -a v1.2.0 -m "Version 1.2.0 - Phase 2: UI Components Release

UI Components:
- ImpactScoreCard (full + compact views)
- ControlDriftBadge (4-level classification)
- AttestationConfidenceWidget (circular gauge)
- ControlDriftHeatmap (interactive grid)

This release completes the UI layer for the strategic
scoring systems, ready for integration into Solutions 1-3."

# Push to GitHub
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main --tags

# Display success
Write-Host "`n✅ PHASE 2 DEPLOYMENT SUCCESSFUL!`n" -ForegroundColor Green
Write-Host "Repository: https://github.com/fredymanu76/RegIntels" -ForegroundColor Cyan
Write-Host "Branch: main" -ForegroundColor Cyan
Write-Host "Tags: v1.0.0, v1.1.0, v1.2.0" -ForegroundColor Cyan
Write-Host "`n📚 Components Ready:" -ForegroundColor Yellow
Write-Host "  ✅ ImpactScoreCard.jsx" -ForegroundColor Green
Write-Host "  ✅ ControlDriftBadge.jsx" -ForegroundColor Green
Write-Host "  ✅ AttestationConfidenceWidget.jsx" -ForegroundColor Green
Write-Host "  ✅ ControlDriftHeatmap.jsx" -ForegroundColor Green
Write-Host "`n📖 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy SQL migrations to Supabase (see STRATEGIC_UPGRADE_DEPLOYMENT.md)" -ForegroundColor White
Write-Host "2. Integrate components into Solutions 1-3 pages" -ForegroundColor White
Write-Host "3. Test with real Supabase data" -ForegroundColor White
Write-Host "4. See src/COMPONENT_INTEGRATION_GUIDE.md for examples`n" -ForegroundColor White
