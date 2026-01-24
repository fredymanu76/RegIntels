-- ============================================================================
-- TEST ADAPTED STRATEGIC VIEWS
-- ============================================================================
-- Run this AFTER creating the views to verify they work with your data
-- ============================================================================

-- TEST 1: Check views were created
SELECT
  '✓ VIEWS CREATED' as test_result,
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'v_regulatory_impact_score',
    'v_control_drift_index',
    'v_control_drift_summary',
    'v_attestation_confidence_index',
    'v_attestation_confidence_summary',
    'v_change_action_tracker'
  )
ORDER BY table_name;

-- Expected: 6 views

-- TEST 2: Impact Scoring View - Count rows
SELECT
  '✓ IMPACT SCORING - Row Count' as test_result,
  COUNT(*) as row_count
FROM v_regulatory_impact_score;

-- TEST 3: Impact Scoring View - Show top 5 high-risk changes
SELECT
  '✓ IMPACT SCORING - Top Risk Changes' as test_result,
  change_title,
  total_impact_score,
  risk_band,
  primary_driver,
  affected_controls_count
FROM v_regulatory_impact_score
ORDER BY total_impact_score DESC
LIMIT 5;

-- TEST 4: Control Drift View - Count rows
SELECT
  '✓ CONTROL DRIFT - Row Count' as test_result,
  COUNT(*) as row_count
FROM v_control_drift_index;

-- TEST 5: Control Drift View - Show critical drift controls
SELECT
  '✓ CONTROL DRIFT - Critical Drift Controls' as test_result,
  control_code,
  control_title,
  drift_status,
  drift_score,
  drift_driver,
  urgency_level,
  ROUND(review_delay_days::numeric, 0) as review_delay_days
FROM v_control_drift_index
WHERE drift_status IN ('CRITICAL_DRIFT', 'MATERIAL_DRIFT')
ORDER BY drift_score DESC
LIMIT 10;

-- TEST 6: Control Drift Summary
SELECT
  '✓ CONTROL DRIFT SUMMARY' as test_result,
  drift_status,
  control_count,
  ROUND(avg_drift_score::numeric, 2) as avg_drift_score,
  total_pending_changes,
  total_failed_runs
FROM v_control_drift_summary
ORDER BY avg_drift_score DESC;

-- TEST 7: Attestation Confidence View - Count rows
SELECT
  '✓ ATTESTATION CONFIDENCE - Row Count' as test_result,
  COUNT(*) as row_count
FROM v_attestation_confidence_index;

-- TEST 8: Attestation Confidence - Show low confidence runs
SELECT
  '✓ ATTESTATION CONFIDENCE - Low Confidence' as test_result,
  control_code,
  control_title,
  status,
  confidence_score,
  confidence_band,
  confidence_driver,
  timeliness_score,
  role_score
FROM v_attestation_confidence_index
WHERE confidence_band = 'LOW_CONFIDENCE'
ORDER BY confidence_score ASC
LIMIT 10;

-- TEST 9: Attestation Confidence Summary
SELECT
  '✓ ATTESTATION CONFIDENCE SUMMARY' as test_result,
  confidence_band,
  run_count,
  ROUND(avg_confidence_score::numeric, 2) as avg_confidence_score,
  completed_count,
  late_count
FROM v_attestation_confidence_summary
ORDER BY avg_confidence_score DESC;

-- TEST 10: Dashboard Summary - Key Metrics
SELECT
  '✓ DASHBOARD SUMMARY' as test_result,
  (SELECT COUNT(*) FROM v_regulatory_impact_score WHERE risk_band = 'CRITICAL') as critical_changes,
  (SELECT COUNT(*) FROM v_control_drift_index WHERE drift_status = 'CRITICAL_DRIFT') as critical_drift_controls,
  (SELECT COUNT(*) FROM v_attestation_confidence_index WHERE confidence_band = 'LOW_CONFIDENCE') as low_confidence_runs,
  (SELECT COUNT(*) FROM remediation_actions WHERE status != 'completed' AND due_date < CURRENT_DATE) as overdue_actions;

-- ============================================================================
-- If all queries return data without errors, your views are working! ✓
-- ============================================================================
