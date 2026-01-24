-- ============================================================================
-- TEST SOLUTION 4 VIEWS
-- ============================================================================

-- Test Block 4.1: Exception Materiality
SELECT
  'Block 4.1: Exception Materiality' as test_block,
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'CRITICAL') as critical_count,
  COUNT(*) FILTER (WHERE materiality_band = 'HIGH') as high_count,
  COUNT(*) FILTER (WHERE materiality_band = 'MEDIUM') as medium_count,
  COUNT(*) FILTER (WHERE materiality_band = 'LOW') as low_count
FROM v_exception_materiality;

-- Show top 5 exceptions by materiality score
SELECT
  exception_title,
  control_name,
  status,
  severity,
  days_open,
  total_materiality_score,
  materiality_band
FROM v_exception_materiality
ORDER BY total_materiality_score DESC
LIMIT 5;

-- Test Block 4.2: Evidence Coverage Gaps
SELECT
  'Block 4.2: Evidence Coverage' as test_block,
  COUNT(*) as total_exceptions
FROM v_evidence_coverage_gaps;

-- Test Block 4.3: Risk Acceleration Timeline
SELECT
  'Block 4.3: Risk Acceleration' as test_block,
  COUNT(*) as total_open_exceptions,
  COUNT(*) FILTER (WHERE age_band = 'CRITICAL_AGE') as critical_age,
  COUNT(*) FILTER (WHERE age_band = 'CHRONIC') as chronic,
  COUNT(*) FILTER (WHERE age_band = 'PERSISTENT') as persistent,
  COUNT(*) FILTER (WHERE urgency_level = 'IMMEDIATE_ATTENTION') as immediate_attention
FROM v_risk_acceleration_timeline;

-- Show timeline breakdown
SELECT
  age_band,
  urgency_level,
  COUNT(*) as exception_count,
  ROUND(AVG(days_open), 1) as avg_days_open
FROM v_risk_acceleration_timeline
GROUP BY age_band, urgency_level
ORDER BY avg_days_open DESC;

-- Test Block 4.4: Exception Recurrence Pattern
SELECT
  'Block 4.4: Recurrence Patterns' as test_block,
  COUNT(*) as controls_with_exceptions,
  SUM(total_exceptions) as total_exceptions_all_time,
  COUNT(*) FILTER (WHERE recurrence_pattern = 'FREQUENT') as frequent_pattern,
  COUNT(*) FILTER (WHERE recurrence_pattern = 'RECURRING') as recurring_pattern
FROM v_exception_recurrence_pattern;

-- Show top controls by recurrence
SELECT
  control_title,
  total_exceptions,
  open_exceptions,
  exceptions_last_3m,
  recurrence_pattern,
  most_recent_exception_date
FROM v_exception_recurrence_pattern
ORDER BY exceptions_last_3m DESC, total_exceptions DESC
LIMIT 5;
