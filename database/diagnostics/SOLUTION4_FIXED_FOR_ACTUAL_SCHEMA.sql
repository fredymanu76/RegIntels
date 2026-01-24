-- ============================================================================
-- SOLUTION 4: VALUE EXPANSION - OPERATIONAL RISK SIGNAL HUB
-- ============================================================================
-- FIXED VERSION FOR ACTUAL SCHEMA
-- Uses: exceptions.source_id and exceptions.source_type instead of control_id
-- ============================================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS v_exception_materiality CASCADE;
DROP VIEW IF EXISTS v_evidence_coverage_gaps CASCADE;
DROP VIEW IF EXISTS v_risk_acceleration_timeline CASCADE;
DROP VIEW IF EXISTS v_exception_recurrence_pattern CASCADE;

-- ============================================================================
-- BLOCK 4.1: Exception Materiality Scoring
-- ============================================================================
CREATE OR REPLACE VIEW v_exception_materiality AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.severity,
  e.source_id as control_id,
  e.source_type,
  COALESCE(c.title, 'Unknown Control') as control_name,
  'General' as control_category,

  -- Date fields
  e.opened_at as created_at,
  CURRENT_DATE - e.opened_at::date as days_open,

  -- Regulatory Impact Score (0-30)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.source_id AND rc.materiality = 'high'
    ) THEN 30
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.source_id AND rc.materiality = 'medium'
    ) THEN 20
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.source_id
    ) THEN 10
    ELSE 0
  END as regulatory_impact_score,

  -- Control Criticality Score (0-30) - simplified without category
  20 as control_criticality_score,

  -- Duration Score (0-25)
  CASE WHEN e.status IN ('open') THEN
    CASE WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 25
         WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 20
         WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 15
         WHEN (CURRENT_DATE - e.opened_at::date) > 7 THEN 10
         ELSE 5 END
  ELSE 0 END as duration_score,

  -- Recurrence Multiplier (0-15)
  LEAST(
    (SELECT COUNT(*) FROM exceptions e2
     WHERE e2.source_id = e.source_id
       AND e2.source_type = 'control'
       AND e2.id != e.id
       AND e2.opened_at > CURRENT_DATE - INTERVAL '12 months'
    ) * 5,
    15
  ) as recurrence_score,

  -- Total Materiality Score (0-100)
  LEAST(
    CASE
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'high') THEN 30
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'medium') THEN 20
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id) THEN 10
      ELSE 0
    END +
    20 +  -- Fixed control criticality score
    CASE WHEN e.status IN ('open') THEN
      CASE WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 25
           WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 20
           WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 15
           WHEN (CURRENT_DATE - e.opened_at::date) > 7 THEN 10
           ELSE 5 END
    ELSE 0 END +
    LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.source_id = e.source_id AND e2.source_type = 'control' AND e2.id != e.id AND e2.opened_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
    100
  ) as total_materiality_score,

  -- Materiality Band
  CASE
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status IN ('open') THEN
        CASE WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.opened_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.source_id = e.source_id AND e2.source_type = 'control' AND e2.id != e.id AND e2.opened_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 70 THEN 'CRITICAL'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status IN ('open') THEN
        CASE WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.opened_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.source_id = e.source_id AND e2.source_type = 'control' AND e2.id != e.id AND e2.opened_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 40 THEN 'HIGH'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.source_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status IN ('open') THEN
        CASE WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.opened_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.source_id = e.source_id AND e2.source_type = 'control' AND e2.id != e.id AND e2.opened_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END as materiality_band

FROM public.exceptions e
LEFT JOIN public.controls c ON c.id = e.source_id AND e.source_type = 'control'
WHERE e.source_type = 'control'
ORDER BY total_materiality_score DESC;

COMMENT ON VIEW v_exception_materiality IS 'Block 4.1: Calculated materiality scores (0-100) for each exception based on regulatory impact, control criticality, duration, and recurrence';

-- ============================================================================
-- BLOCK 4.2: Evidence Coverage Gaps (Simplified)
-- ============================================================================
CREATE OR REPLACE VIEW v_evidence_coverage_gaps AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.source_id as control_id,
  e.source_type,
  'Coverage analysis available after evidence requirements setup' as coverage_note,
  0 as coverage_percentage,
  'PENDING' as coverage_band,
  ARRAY[]::TEXT[] as missing_evidence_types
FROM public.exceptions e
WHERE e.source_type = 'control';

COMMENT ON VIEW v_evidence_coverage_gaps IS 'Block 4.2: Evidence coverage gap detection (simplified version)';

-- ============================================================================
-- BLOCK 4.3: Risk Acceleration Timeline
-- ============================================================================
CREATE OR REPLACE VIEW v_risk_acceleration_timeline AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.source_id as control_id,
  e.source_type,
  (CURRENT_DATE - e.opened_at::date) as days_open,
  CASE
    WHEN (CURRENT_DATE - e.opened_at::date) <= 7 THEN 'RECENT'
    WHEN (CURRENT_DATE - e.opened_at::date) <= 30 THEN 'DEVELOPING'
    WHEN (CURRENT_DATE - e.opened_at::date) <= 90 THEN 'PERSISTENT'
    WHEN (CURRENT_DATE - e.opened_at::date) <= 180 THEN 'CHRONIC'
    ELSE 'CRITICAL_AGE'
  END as age_band,
  CASE
    WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 'IMMEDIATE_ATTENTION'
    WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 'ESCALATE'
    WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 'MONITOR'
    ELSE 'TRACK'
  END as urgency_level
FROM public.exceptions e
WHERE e.status = 'open'
  AND e.source_type = 'control'
ORDER BY days_open DESC;

COMMENT ON VIEW v_risk_acceleration_timeline IS 'Block 4.3: Timeline tracking of exceptions with risk acceleration indicators';

-- ============================================================================
-- BLOCK 4.4: Exception Recurrence Pattern Detection
-- ============================================================================
CREATE OR REPLACE VIEW v_exception_recurrence_pattern AS
SELECT
  e.source_id as control_id,
  e.source_type,
  c.title as control_title,
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE e.status = 'open') as open_exceptions,
  COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '12 months') as exceptions_last_12m,
  COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '6 months') as exceptions_last_6m,
  COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '3 months') as exceptions_last_3m,
  ROUND(
    COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '3 months')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '12 months'), 0) * 100
  , 1) as acceleration_rate_pct,
  CASE
    WHEN COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '3 months') >= 3 THEN 'FREQUENT'
    WHEN COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '12 months') >= 3 THEN 'RECURRING'
    WHEN COUNT(*) > 1 THEN 'OCCASIONAL'
    ELSE 'ISOLATED'
  END as recurrence_pattern,
  MAX(e.opened_at) as most_recent_exception_date,
  MIN(e.opened_at) as first_exception_date
FROM public.exceptions e
LEFT JOIN public.controls c ON c.id = e.source_id AND e.source_type = 'control'
WHERE e.source_type = 'control'
GROUP BY e.source_id, e.source_type, c.title
HAVING COUNT(*) > 0
ORDER BY exceptions_last_3m DESC, total_exceptions DESC;

COMMENT ON VIEW v_exception_recurrence_pattern IS 'Block 4.4: Control-level exception recurrence patterns and acceleration trends';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Solution 4 views created successfully!';
  RAISE NOTICE '📊 Available views:';
  RAISE NOTICE '  - v_exception_materiality (Block 4.1)';
  RAISE NOTICE '  - v_evidence_coverage_gaps (Block 4.2)';
  RAISE NOTICE '  - v_risk_acceleration_timeline (Block 4.3)';
  RAISE NOTICE '  - v_exception_recurrence_pattern (Block 4.4)';
END $$;
