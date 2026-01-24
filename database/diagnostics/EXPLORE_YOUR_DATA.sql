-- ============================================================================
-- EXPLORE YOUR STRATEGIC SCORING DATA
-- ============================================================================
-- Run these queries to see what's in your database
-- ============================================================================

-- Query 1: All Impact Scores
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

-- Query 2: All Control Drift Scores
SELECT
  control_code,
  control_title,
  drift_status,
  drift_score,
  drift_driver,
  urgency_level,
  review_delay_days,
  failed_runs_count,
  open_exceptions_count
FROM v_control_drift_index
ORDER BY drift_score DESC;

-- Query 3: Drift Summary
SELECT
  drift_status,
  control_count,
  ROUND(avg_drift_score::numeric, 2) as avg_drift_score,
  total_pending_changes,
  total_failed_runs,
  total_open_exceptions
FROM v_control_drift_summary
ORDER BY avg_drift_score DESC;

-- Query 4: Low Confidence Control Run (the one flagged)
SELECT
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
  exception_penalty,
  days_delta as days_late,
  submitted_at,
  due_date
FROM v_attestation_confidence_index
WHERE confidence_band = 'LOW_CONFIDENCE'
ORDER BY confidence_score ASC;

-- Query 5: All Attestation Confidence
SELECT
  control_code,
  control_title,
  status,
  confidence_score,
  confidence_band,
  confidence_driver
FROM v_attestation_confidence_index
ORDER BY confidence_score ASC
LIMIT 20;

-- Query 6: Confidence Summary
SELECT
  confidence_band,
  run_count,
  ROUND(avg_confidence_score::numeric, 2) as avg_confidence_score,
  completed_count,
  late_count,
  total_exceptions
FROM v_attestation_confidence_summary
ORDER BY avg_confidence_score DESC;

-- Query 7: Data Counts (to see what you have)
SELECT
  'Regulatory Changes' as data_type,
  COUNT(*) as count
FROM regulatory_changes
UNION ALL
SELECT 'Controls', COUNT(*) FROM control_library
UNION ALL
SELECT 'Control Runs', COUNT(*) FROM control_runs
UNION ALL
SELECT 'Exceptions', COUNT(*) FROM exceptions
UNION ALL
SELECT 'Remediation Actions', COUNT(*) FROM remediation_actions;

-- ============================================================================
-- Run these to explore your strategic scoring system!
-- ============================================================================
