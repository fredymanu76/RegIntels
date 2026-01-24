-- ============================================================================
-- REGINTELS MIGRATION VERIFICATION SCRIPT
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER running EXECUTE_ALL_MIGRATIONS.sql
-- This will verify all tables, views, and sample data are correctly created
-- ============================================================================

-- VERIFICATION 1: Check all tables exist
SELECT '✓ TABLES CREATED' as verification_step;

SELECT
  table_name,
  '✓' as status
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

-- Expected: 7 rows

-- VERIFICATION 2: Check all views exist
SELECT '✓ VIEWS CREATED' as verification_step;

SELECT
  table_name as view_name,
  '✓' as status
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%'
ORDER BY table_name;

-- Expected: 6 rows

-- VERIFICATION 3: Check sample data counts
SELECT '✓ SAMPLE DATA LOADED' as verification_step;

SELECT
  'controls' as table_name,
  COUNT(*) as record_count,
  CASE WHEN COUNT(*) = 5 THEN '✓' ELSE '✗' END as status
FROM controls
UNION ALL
SELECT
  'regulatory_changes',
  COUNT(*),
  CASE WHEN COUNT(*) = 5 THEN '✓' ELSE '✗' END
FROM regulatory_changes
UNION ALL
SELECT
  'attestations',
  COUNT(*),
  CASE WHEN COUNT(*) = 3 THEN '✓' ELSE '✗' END
FROM attestations
UNION ALL
SELECT
  'exceptions',
  COUNT(*),
  CASE WHEN COUNT(*) = 2 THEN '✓' ELSE '✗' END
FROM exceptions
UNION ALL
SELECT
  'actions',
  COUNT(*),
  CASE WHEN COUNT(*) = 3 THEN '✓' ELSE '✗' END
FROM actions
UNION ALL
SELECT
  'regulatory_change_control_map',
  COUNT(*),
  CASE WHEN COUNT(*) >= 4 THEN '✓' ELSE '✗' END
FROM regulatory_change_control_map;

-- VERIFICATION 4: Test Impact Scoring View
SELECT '✓ IMPACT SCORING VIEW' as verification_step;

SELECT
  change_title,
  materiality,
  total_impact_score,
  risk_band,
  primary_driver,
  affected_controls_count,
  signoffs_count,
  overdue_actions_count
FROM v_regulatory_impact_score
ORDER BY total_impact_score DESC
LIMIT 5;

-- Expected: Should return regulatory changes with calculated scores

-- VERIFICATION 5: Test Control Drift View
SELECT '✓ CONTROL DRIFT VIEW' as verification_step;

SELECT
  control_code,
  control_title,
  control_owner,
  drift_status,
  drift_score,
  drift_driver,
  urgency_level,
  ROUND(review_delay_days::numeric, 0) as review_delay_days,
  pending_changes_count,
  failed_attestations_count,
  open_exceptions_count
FROM v_control_drift_index
ORDER BY drift_score DESC;

-- Expected: Should show 5 controls with drift analysis

-- VERIFICATION 6: Test Control Drift Summary
SELECT '✓ CONTROL DRIFT SUMMARY' as verification_step;

SELECT
  drift_status,
  control_count,
  ROUND(avg_drift_score::numeric, 2) as avg_drift_score,
  total_pending_changes,
  total_failed_attestations,
  total_open_exceptions
FROM v_control_drift_summary
ORDER BY avg_drift_score DESC;

-- Expected: Should show drift grouped by status

-- VERIFICATION 7: Test Attestation Confidence View
SELECT '✓ ATTESTATION CONFIDENCE VIEW' as verification_step;

SELECT
  attestation_id,
  control_code,
  control_title,
  attestor_role,
  status,
  confidence_score,
  confidence_band,
  confidence_driver,
  timeliness_score,
  role_score,
  reliability_score,
  exception_penalty
FROM v_attestation_confidence_index
ORDER BY confidence_score DESC;

-- Expected: Should show 3 attestations with confidence scores

-- VERIFICATION 8: Test Attestation Confidence Summary
SELECT '✓ ATTESTATION CONFIDENCE SUMMARY' as verification_step;

SELECT
  confidence_band,
  attestation_count,
  ROUND(avg_confidence_score::numeric, 2) as avg_confidence_score,
  approved_count,
  late_count,
  total_exceptions
FROM v_attestation_confidence_summary
ORDER BY avg_confidence_score DESC;

-- Expected: Should show confidence grouped by band

-- VERIFICATION 9: Check RLS Policies
SELECT '✓ RLS POLICIES' as verification_step;

SELECT
  schemaname,
  tablename,
  policyname,
  '✓' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'regulatory_changes',
    'controls',
    'attestations',
    'exceptions',
    'actions',
    'regulatory_change_control_map',
    'change_signoffs'
  )
ORDER BY tablename, policyname;

-- Expected: Should show RLS policies for all tables

-- VERIFICATION 10: Sample Queries for Dashboard
SELECT '✓ DASHBOARD QUERIES' as verification_step;

-- High-risk regulatory changes
SELECT
  '🔴 High Risk Changes' as category,
  COUNT(*) as count
FROM v_regulatory_impact_score
WHERE risk_band = 'CRITICAL'
UNION ALL
-- Controls with critical drift
SELECT
  '🔴 Critical Drift Controls',
  COUNT(*)
FROM v_control_drift_index
WHERE drift_status = 'CRITICAL_DRIFT'
UNION ALL
-- Low confidence attestations
SELECT
  '⚠️  Low Confidence Attestations',
  COUNT(*)
FROM v_attestation_confidence_index
WHERE confidence_band = 'LOW_CONFIDENCE'
UNION ALL
-- Overdue actions
SELECT
  '⏰ Overdue Actions',
  COUNT(*)
FROM actions
WHERE status = 'overdue';

-- ============================================================================
-- VERIFICATION COMPLETE!
-- ============================================================================
-- If all queries returned results without errors, your migration is successful!
--
-- Key Indicators of Success:
-- ✓ 7 tables created
-- ✓ 6 views created
-- ✓ Sample data loaded (5 controls, 5 changes, 3 attestations, 2 exceptions, 3 actions)
-- ✓ All views return data
-- ✓ Scores are calculated correctly
-- ✓ RLS policies are in place
--
-- Next: Integrate these views into your React application!
-- ============================================================================
