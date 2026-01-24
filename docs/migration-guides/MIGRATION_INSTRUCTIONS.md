# RegIntels Strategic Scoring System - Migration Instructions

## Quick Start

### Step 1: Run the Complete Migration

1. **Open the consolidated migration file:**
   - File: `EXECUTE_ALL_MIGRATIONS.sql`

2. **Copy the entire content** (Ctrl+A, Ctrl+C)

3. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard
   - Navigate to your project: `cnyvjuxmkpzxnztbbydu`
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

4. **Paste and Execute:**
   - Paste the entire content (Ctrl+V)
   - Click the **RUN** button (or press Ctrl+Enter)
   - Wait for execution to complete (~30 seconds)

### Step 2: Verify the Migration

After running the migration, verify it worked by running these queries:

#### Check Tables Created
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'regulatory_changes',
    'controls',
    'attestations',
    'exceptions',
    'actions',
    'regulatory_change_control_map',
    'change_signoffs'
  )
ORDER BY table_name;
```

Expected result: 7 tables

#### Check Views Created
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%'
ORDER BY table_name;
```

Expected result: 6 views
- v_attestation_confidence_index
- v_attestation_confidence_summary
- v_change_action_tracker
- v_control_drift_index
- v_control_drift_summary
- v_regulatory_impact_score

#### Check Sample Data Loaded
```sql
SELECT
  (SELECT COUNT(*) FROM controls) as controls_count,
  (SELECT COUNT(*) FROM regulatory_changes) as changes_count,
  (SELECT COUNT(*) FROM attestations) as attestations_count,
  (SELECT COUNT(*) FROM exceptions) as exceptions_count,
  (SELECT COUNT(*) FROM actions) as actions_count;
```

Expected result:
- 5 controls
- 5 regulatory changes
- 3 attestations
- 2 exceptions
- 3 actions

### Step 3: Test the Strategic Views

#### Test Impact Scoring View
```sql
SELECT
  change_title,
  materiality,
  total_impact_score,
  risk_band,
  primary_driver,
  affected_controls_count,
  overdue_actions_count
FROM v_regulatory_impact_score
ORDER BY total_impact_score DESC;
```

#### Test Control Drift View
```sql
SELECT
  control_code,
  control_title,
  drift_status,
  drift_score,
  drift_driver,
  urgency_level,
  review_delay_days,
  failed_attestations_count
FROM v_control_drift_index
ORDER BY drift_score DESC;
```

#### Test Control Drift Summary
```sql
SELECT
  drift_status,
  control_count,
  ROUND(avg_drift_score::numeric, 2) as avg_drift_score,
  total_pending_changes,
  total_failed_attestations
FROM v_control_drift_summary
ORDER BY avg_drift_score DESC;
```

#### Test Attestation Confidence View
```sql
SELECT
  control_code,
  attestor_role,
  status,
  confidence_score,
  confidence_band,
  confidence_driver,
  timeliness_score,
  role_score
FROM v_attestation_confidence_index
ORDER BY confidence_score DESC;
```

#### Test Attestation Confidence Summary
```sql
SELECT
  confidence_band,
  attestation_count,
  ROUND(avg_confidence_score::numeric, 2) as avg_confidence_score,
  approved_count,
  late_count
FROM v_attestation_confidence_summary
ORDER BY avg_confidence_score DESC;
```

## What Was Created

### Core Tables
1. **regulatory_changes** - Regulatory change tracking
2. **controls** - Control library
3. **regulatory_change_control_map** - Links changes to controls
4. **attestations** - Control attestation tracking
5. **exceptions** - Control exception management
6. **change_signoffs** - Regulatory change approvals
7. **actions** - Action items for regulatory changes

### Strategic Views
1. **v_regulatory_impact_score** - Quantified regulatory exposure (0-100 scale)
2. **v_control_drift_index** - Control drift detection
3. **v_control_drift_summary** - Drift summary dashboard
4. **v_attestation_confidence_index** - Attestation confidence scoring
5. **v_attestation_confidence_summary** - Confidence summary dashboard
6. **v_change_action_tracker** - Action tracking helper view

### Sample Data Loaded
- 5 sample controls (CTRL-001 to CTRL-005)
- 5 regulatory changes (FCA, OFAC regulations)
- 3 attestations (various statuses)
- 2 control exceptions
- 3 action items (some overdue)

## Understanding the Scoring Models

### Impact Scoring (0-100 scale)
- **30 points**: Regulatory severity (high/medium/low)
- **20 points**: Business surface area (affected controls)
- **25 points**: Control coverage gaps (missing sign-offs)
- **15 points**: Execution risk (overdue actions)
- **10 points**: Attestation confidence penalty

**Risk Bands:**
- 61-100: CRITICAL
- 31-60: HIGH
- 0-30: MODERATE

### Control Drift Scoring (0-100 scale)
- Base score from review delay (10-50 points)
- +15 points per failed attestation
- +10 points per high-impact pending change
- +5 points per open exception

**Drift Status:**
- CRITICAL_DRIFT: >90 days overdue or critical issues
- MATERIAL_DRIFT: 31-90 days overdue
- EMERGING_DRIFT: Approaching review or pending changes
- STABLE: On track

### Attestation Confidence (0-100 scale)
- **40 points**: Timeliness (on-time submission)
- **30 points**: Role weight (SMF > Owner > Deputy)
- **20 points**: Historical reliability
- **-15 points**: Recent exceptions penalty

**Confidence Bands:**
- 70-100: HIGH_CONFIDENCE
- 40-69: MEDIUM_CONFIDENCE
- 0-39: LOW_CONFIDENCE

## Troubleshooting

### If Migration Fails

1. **Check for existing tables:**
   ```sql
   DROP TABLE IF EXISTS public.actions CASCADE;
   DROP TABLE IF EXISTS public.change_signoffs CASCADE;
   DROP TABLE IF EXISTS public.exceptions CASCADE;
   DROP TABLE IF EXISTS public.attestations CASCADE;
   DROP TABLE IF EXISTS public.regulatory_change_control_map CASCADE;
   DROP TABLE IF EXISTS public.controls CASCADE;
   DROP TABLE IF EXISTS public.regulatory_changes CASCADE;
   ```

2. **Then re-run the migration**

### If Views Show Errors

1. **Drop and recreate views:**
   ```sql
   DROP VIEW IF EXISTS v_attestation_confidence_summary CASCADE;
   DROP VIEW IF EXISTS v_attestation_confidence_index CASCADE;
   DROP VIEW IF EXISTS v_control_drift_summary CASCADE;
   DROP VIEW IF EXISTS v_control_drift_index CASCADE;
   DROP VIEW IF EXISTS v_regulatory_impact_score CASCADE;
   DROP VIEW IF EXISTS v_change_action_tracker CASCADE;
   ```

2. **Then re-run the view creation sections from the migration**

## Next Steps

1. ✅ Run the migration
2. ✅ Verify tables and views are created
3. ✅ Test all views with sample data
4. 🔄 Integrate views into your React application
5. 🔄 Build dashboard components to display scores
6. 🔄 Add data entry forms for controls and regulatory changes

## Integration with React App

The views are now available in your Supabase database. You can query them from your React app:

```typescript
// Example: Fetch impact scores
const { data: impactScores } = await supabase
  .from('v_regulatory_impact_score')
  .select('*')
  .order('total_impact_score', { ascending: false });

// Example: Fetch control drift
const { data: controlDrift } = await supabase
  .from('v_control_drift_index')
  .select('*')
  .order('drift_score', { ascending: false });

// Example: Fetch attestation confidence
const { data: attestationConfidence } = await supabase
  .from('v_attestation_confidence_index')
  .select('*')
  .order('confidence_score', { ascending: false });
```

---

**Need Help?** Check the SQL comments in each view for detailed documentation about the scoring logic.
