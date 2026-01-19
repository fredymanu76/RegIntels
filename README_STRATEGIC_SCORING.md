# RegIntels Strategic Scoring System

## 🎯 Overview

The RegIntels Strategic Scoring System provides **board-grade, audit-defensible** metrics for regulatory compliance management. This system includes three core analytical frameworks:

1. **Impact Scoring** - Quantified Regulatory Exposure Index (0-100)
2. **Control Drift Detection** - Early-warning compliance intelligence
3. **Attestation Confidence** - Quality measurement for control attestations

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Execute Migration (2 minutes)

1. Open `EXECUTE_ALL_MIGRATIONS.sql`
2. Copy entire file content (Ctrl+A, Ctrl+C)
3. Go to [Supabase SQL Editor](https://supabase.com/dashboard)
4. Create new query and paste
5. Click **RUN**
6. Wait for completion ✓

### Step 2: Verify Installation (2 minutes)

1. Open `VERIFY_MIGRATION.sql`
2. Copy and run in Supabase SQL Editor
3. Check all verifications show ✓
4. Confirm sample data loaded

### Step 3: Test Views (1 minute)

Run this quick test:

```sql
SELECT * FROM v_regulatory_impact_score LIMIT 5;
SELECT * FROM v_control_drift_index LIMIT 5;
SELECT * FROM v_attestation_confidence_index LIMIT 5;
```

If all three return data → **Success! ✓**

---

## 📊 The Three Strategic Views

### 1. Impact Scoring View
**Purpose:** Quantify regulatory exposure risk

**View:** `v_regulatory_impact_score`

**Scoring Components:**
- Regulatory Severity (30 pts) - High/Medium/Low materiality
- Business Surface Area (20 pts) - Number of affected controls
- Control Coverage Gaps (25 pts) - Missing sign-offs
- Execution Risk (15 pts) - Overdue action items
- Attestation Confidence (10 pts) - Attestation quality

**Risk Bands:**
- **CRITICAL** (61-100): Immediate board attention required
- **HIGH** (31-60): Senior management action needed
- **MODERATE** (0-30): Business-as-usual monitoring

**Key Columns:**
```sql
- change_title              -- Regulatory change name
- total_impact_score        -- 0-100 score
- risk_band                 -- CRITICAL/HIGH/MODERATE
- primary_driver            -- Main risk factor
- affected_controls_count   -- How many controls impacted
- overdue_actions_count     -- Execution problems
```

**Sample Query:**
```sql
SELECT
  change_title,
  total_impact_score,
  risk_band,
  primary_driver
FROM v_regulatory_impact_score
WHERE risk_band = 'CRITICAL'
ORDER BY total_impact_score DESC;
```

---

### 2. Control Drift View
**Purpose:** Detect when controls fall behind regulatory velocity

**Main View:** `v_control_drift_index`
**Summary View:** `v_control_drift_summary`

**Drift Detection Logic:**
- Review age (days since last review)
- Failed attestations
- Pending high-impact regulatory changes
- Open exceptions

**Drift Status:**
- **CRITICAL_DRIFT**: >90 days overdue OR failed attestations + high-impact changes
- **MATERIAL_DRIFT**: 31-90 days overdue OR multiple failures
- **EMERGING_DRIFT**: <30 days to review OR pending changes
- **STABLE**: On track, no issues

**Urgency Levels:**
- **URGENT**: Immediate action required
- **ATTENTION_NEEDED**: Schedule intervention
- **MONITOR**: Routine oversight

**Key Columns:**
```sql
- control_code                  -- Control ID
- control_title                 -- Control name
- drift_status                  -- CRITICAL/MATERIAL/EMERGING/STABLE
- drift_score                   -- 0-100 (higher = worse)
- drift_driver                  -- Primary cause
- urgency_level                 -- URGENT/ATTENTION_NEEDED/MONITOR
- review_delay_days             -- Days since last review
- failed_attestations_count     -- Failed attestations
```

**Sample Queries:**
```sql
-- Critical drift controls
SELECT
  control_code,
  control_title,
  drift_score,
  drift_driver,
  urgency_level
FROM v_control_drift_index
WHERE drift_status = 'CRITICAL_DRIFT'
ORDER BY drift_score DESC;

-- Drift summary dashboard
SELECT
  drift_status,
  control_count,
  ROUND(avg_drift_score, 2) as avg_score
FROM v_control_drift_summary
ORDER BY avg_drift_score DESC;
```

---

### 3. Attestation Confidence View
**Purpose:** Measure quality and reliability of control attestations

**Main View:** `v_attestation_confidence_index`
**Summary View:** `v_attestation_confidence_summary`

**Confidence Components:**
- Timeliness (40 pts) - On-time vs late submission
- Role Weight (30 pts) - SMF > Owner > Deputy > Other
- Historical Reliability (20 pts) - Past performance
- Exception Penalty (-15 pts) - Recent control exceptions

**Confidence Bands:**
- **HIGH_CONFIDENCE** (70-100): Strong, reliable attestation
- **MEDIUM_CONFIDENCE** (40-69): Acceptable but monitor
- **LOW_CONFIDENCE** (0-39): Requires validation

**Key Columns:**
```sql
- control_code              -- Control ID
- attestor_role             -- Role of attestor
- confidence_score          -- 0-100 score
- confidence_band           -- HIGH/MEDIUM/LOW
- confidence_driver         -- Primary factor
- timeliness_score          -- 0-40 points
- role_score                -- 0-30 points
- reliability_score         -- 0-20 points
- exception_penalty         -- 0 or -15 points
```

**Sample Queries:**
```sql
-- Low confidence attestations
SELECT
  control_code,
  attestor_role,
  confidence_score,
  confidence_driver
FROM v_attestation_confidence_index
WHERE confidence_band = 'LOW_CONFIDENCE'
ORDER BY confidence_score ASC;

-- Confidence summary
SELECT
  confidence_band,
  attestation_count,
  ROUND(avg_confidence_score, 2) as avg_score
FROM v_attestation_confidence_summary
ORDER BY avg_confidence_score DESC;
```

---

## 💾 Database Schema

### Core Tables Created
```
regulatory_changes          -- Regulatory change tracking
controls                    -- Control library
regulatory_change_control_map -- Links changes → controls
attestations                -- Control attestation records
exceptions                  -- Control exceptions
change_signoffs             -- Regulatory change approvals
actions                     -- Action items for changes
```

### Strategic Views Created
```
v_regulatory_impact_score           -- Impact scoring (0-100)
v_control_drift_index               -- Control drift detection
v_control_drift_summary             -- Drift dashboard summary
v_attestation_confidence_index      -- Attestation confidence
v_attestation_confidence_summary    -- Confidence dashboard
v_change_action_tracker             -- Action tracking helper
```

---

## 🔗 Integration with React App

### Fetch Impact Scores
```typescript
const { data: impactScores, error } = await supabase
  .from('v_regulatory_impact_score')
  .select('*')
  .order('total_impact_score', { ascending: false });

// Display critical changes
const criticalChanges = impactScores?.filter(
  s => s.risk_band === 'CRITICAL'
);
```

### Fetch Control Drift
```typescript
const { data: driftData, error } = await supabase
  .from('v_control_drift_index')
  .select('*')
  .eq('drift_status', 'CRITICAL_DRIFT')
  .order('drift_score', { ascending: false });
```

### Fetch Attestation Confidence
```typescript
const { data: confidence, error } = await supabase
  .from('v_attestation_confidence_index')
  .select('*')
  .order('confidence_score', { ascending: false });
```

### Dashboard Summary Widget
```typescript
// Get all summary metrics
const { data: driftSummary } = await supabase
  .from('v_control_drift_summary')
  .select('*');

const { data: confidenceSummary } = await supabase
  .from('v_attestation_confidence_summary')
  .select('*');

// Count critical items
const { count: criticalChanges } = await supabase
  .from('v_regulatory_impact_score')
  .select('*', { count: 'exact', head: true })
  .eq('risk_band', 'CRITICAL');
```

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `EXECUTE_ALL_MIGRATIONS.sql` | **Main migration file** - Run this first |
| `VERIFY_MIGRATION.sql` | Verification script - Run after migration |
| `MIGRATION_INSTRUCTIONS.md` | Detailed step-by-step guide |
| `README_STRATEGIC_SCORING.md` | This file - System overview |
| `001_base_schema.sql` | Base tables (included in EXECUTE_ALL) |
| `20260118_impact_scoring_views.sql` | Impact views (included in EXECUTE_ALL) |
| `20260118_control_drift_views.sql` | Drift views (included in EXECUTE_ALL) |
| `20260118_attestation_confidence_views.sql` | Confidence views (included in EXECUTE_ALL) |

---

## 🎓 Sample Data Included

The migration includes realistic sample data:

- **5 Controls**: CDD, Transaction Monitoring, Sanctions, KYC, AML Assessment
- **5 Regulatory Changes**: FCA and OFAC regulations
- **3 Attestations**: Various statuses (approved, pending, failed)
- **2 Exceptions**: System downtime, manual review
- **3 Actions**: Some overdue, demonstrating risk scoring

This sample data demonstrates:
- ✓ Critical drift detection (CTRL-001: 120 days overdue)
- ✓ Impact scoring calculation (multiple high-risk changes)
- ✓ Attestation confidence variation (SMF vs Deputy roles)
- ✓ Overdue action tracking

---

## 🔧 Troubleshooting

### Migration Fails
```sql
-- Reset tables (WARNING: Deletes all data)
DROP TABLE IF EXISTS public.actions CASCADE;
DROP TABLE IF EXISTS public.change_signoffs CASCADE;
DROP TABLE IF EXISTS public.exceptions CASCADE;
DROP TABLE IF EXISTS public.attestations CASCADE;
DROP TABLE IF EXISTS public.regulatory_change_control_map CASCADE;
DROP TABLE IF EXISTS public.controls CASCADE;
DROP TABLE IF EXISTS public.regulatory_changes CASCADE;

-- Then re-run EXECUTE_ALL_MIGRATIONS.sql
```

### Views Return No Data
- Check tables have data: `SELECT COUNT(*) FROM controls;`
- Verify sample data inserted: Run `VERIFY_MIGRATION.sql`
- Check for RLS policy issues: Ensure you're authenticated

### Column Does Not Exist Errors
- Ensure base schema ran first
- Check table structure: `\d controls` (in psql)
- Re-run migration from scratch

---

## 📚 Next Steps

1. ✅ **Run migration** (`EXECUTE_ALL_MIGRATIONS.sql`)
2. ✅ **Verify setup** (`VERIFY_MIGRATION.sql`)
3. ✅ **Test queries** (run sample queries above)
4. 🔄 **Build React components** (dashboards, scorecards)
5. 🔄 **Add data entry forms** (controls, changes, attestations)
6. 🔄 **Create visualizations** (charts, trend analysis)
7. 🔄 **Set up alerts** (critical drift, low confidence)

---

## 💡 Key Benefits

- **Board-Ready Metrics**: Quantified scores suitable for executive reporting
- **Audit-Defensible**: Transparent calculation logic with full traceability
- **Early Warning System**: Detect compliance drift before it becomes critical
- **Quality Assurance**: Measure attestation reliability and confidence
- **Actionable Insights**: Clear drivers and recommendations

---

**Need Help?**
- Check `MIGRATION_INSTRUCTIONS.md` for detailed setup
- Review view comments in Supabase for scoring logic
- Examine sample data to understand calculations

**Version:** 1.0 (Phase 3 Strategic Upgrade)
**Last Updated:** 2026-01-18
