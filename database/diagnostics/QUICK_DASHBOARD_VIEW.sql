-- ============================================================================
-- QUICK DASHBOARD - All Solution 4 Metrics
-- ============================================================================

-- Summary of all exceptions with scores
SELECT
  exception_title,
  control_name,
  status,
  severity,
  days_open,
  regulatory_impact_score,
  control_criticality_score,
  duration_score,
  recurrence_score,
  total_materiality_score,
  materiality_band
FROM v_exception_materiality
ORDER BY total_materiality_score DESC;
