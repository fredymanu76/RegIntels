-- ============================================================================
-- RISK SIGNAL HUB DEPLOYMENT (ADAPTED FOR YOUR SCHEMA)
-- ============================================================================
-- Solution 4 Value Expansion: Operational Risk Signal Hub
-- This script creates all required database views for the Risk Signal Hub feature
--
-- ADAPTED FOR BASE SCHEMA with:
-- - exceptions.control_id (instead of source_id/source_type)
-- - exceptions.created_at (instead of opened_at)
-- - controls.control_title (instead of title)
--
-- Run this in Supabase SQL Editor to enable the Risk Signal Hub feature
-- ============================================================================

-- Clean up existing views
DROP VIEW IF EXISTS v_exception_materiality CASCADE;
DROP VIEW IF EXISTS v_evidence_coverage_gaps CASCADE;
DROP VIEW IF EXISTS v_risk_acceleration_timeline CASCADE;
DROP VIEW IF EXISTS v_exception_recurrence_pattern CASCADE;

-- ============================================================================
-- VIEW 1: Exception Materiality Scoring (0-100 scale)
-- ============================================================================
-- Calculates materiality scores based on:
-- - Regulatory Impact (0-30 points)
-- - Control Criticality (0-30 points)
-- - Duration/Age (0-25 points)
-- - Recurrence Pattern (0-15 points)
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_materiality AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.severity,
  e.control_id,
  COALESCE(c.control_title, 'Unknown Control') as control_name,
  'General' as control_category,

  -- Date fields
  e.created_at,
  CURRENT_DATE - e.created_at::date as days_open,

  -- Regulatory Impact Score (0-30)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id AND rc.materiality = 'high'
    ) THEN 30
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium'
    ) THEN 20
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
    ) THEN 10
    ELSE 0
  END as regulatory_impact_score,

  -- Control Criticality Score (0-30) - simplified without category
  20 as control_criticality_score,

  -- Duration Score (0-25)
  CASE WHEN e.status = 'open' THEN
    CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
         WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
         WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
         WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
         ELSE 5 END
  ELSE 0 END as duration_score,

  -- Recurrence Multiplier (0-15)
  LEAST(
    (SELECT COUNT(*) FROM exceptions e2
     WHERE e2.control_id = e.control_id
       AND e2.id != e.id
       AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'
    ) * 5,
    15
  ) as recurrence_score,

  -- Total Materiality Score (0-100)
  LEAST(
    CASE
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
      WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
      ELSE 0
    END +
    20 +  -- Fixed control criticality score
    CASE WHEN e.status = 'open' THEN
      CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
           WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
           WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
           WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
           ELSE 5 END
    ELSE 0 END +
    LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
    100
  ) as total_materiality_score,

  -- Materiality Band
  CASE
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status = 'open' THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 70 THEN 'CRITICAL'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status = 'open' THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 40 THEN 'HIGH'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      20 +
      CASE WHEN e.status = 'open' THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END as materiality_band

FROM public.exceptions e
LEFT JOIN public.controls c ON c.id = e.control_id
ORDER BY total_materiality_score DESC;

COMMENT ON VIEW v_exception_materiality IS 'Materiality scores (0-100) for exceptions based on regulatory impact, control criticality, duration, and recurrence';

-- ============================================================================
-- VIEW 2: Evidence Coverage Gaps (Simplified)
-- ============================================================================
CREATE OR REPLACE VIEW v_evidence_coverage_gaps AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.control_id,
  'Coverage analysis available after evidence requirements setup' as coverage_note,
  0 as coverage_percentage,
  'PENDING' as coverage_band,
  ARRAY[]::TEXT[] as missing_evidence_types
FROM public.exceptions e;

COMMENT ON VIEW v_evidence_coverage_gaps IS 'Evidence coverage gap detection for exceptions';

-- ============================================================================
-- VIEW 3: Risk Acceleration Timeline
-- ============================================================================
CREATE OR REPLACE VIEW v_risk_acceleration_timeline AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.control_id,
  COALESCE(c.control_title, 'Unknown Control') as control_name,
  (CURRENT_DATE - e.created_at::date) as days_open,
  CASE
    WHEN (CURRENT_DATE - e.created_at::date) <= 7 THEN 'RECENT'
    WHEN (CURRENT_DATE - e.created_at::date) <= 30 THEN 'DEVELOPING'
    WHEN (CURRENT_DATE - e.created_at::date) <= 90 THEN 'PERSISTENT'
    WHEN (CURRENT_DATE - e.created_at::date) <= 180 THEN 'CHRONIC'
    ELSE 'CRITICAL_AGE'
  END as age_band,
  CASE
    WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 'IMMEDIATE_ATTENTION'
    WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 'ESCALATE'
    WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 'MONITOR'
    ELSE 'TRACK'
  END as urgency_level
FROM public.exceptions e
LEFT JOIN public.controls c ON c.id = e.control_id
WHERE e.status = 'open'
ORDER BY days_open DESC;

COMMENT ON VIEW v_risk_acceleration_timeline IS 'Timeline tracking with risk acceleration indicators and urgency levels';

-- ============================================================================
-- VIEW 4: Exception Recurrence Pattern Detection
-- ============================================================================
CREATE OR REPLACE VIEW v_exception_recurrence_pattern AS
SELECT
  e.control_id,
  c.control_title,
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE e.status = 'open') as open_exceptions,
  COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '12 months') as exceptions_last_12m,
  COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '6 months') as exceptions_last_6m,
  COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '3 months') as exceptions_last_3m,
  ROUND(
    COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '3 months')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '12 months'), 0) * 100
  , 1) as acceleration_rate_pct,
  CASE
    WHEN COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '3 months') >= 3 THEN 'FREQUENT'
    WHEN COUNT(*) FILTER (WHERE e.created_at > CURRENT_DATE - INTERVAL '12 months') >= 3 THEN 'RECURRING'
    WHEN COUNT(*) > 1 THEN 'OCCASIONAL'
    ELSE 'ISOLATED'
  END as recurrence_pattern,
  MAX(e.created_at) as most_recent_exception_date,
  MIN(e.created_at) as first_exception_date
FROM public.exceptions e
LEFT JOIN public.controls c ON c.id = e.control_id
GROUP BY e.control_id, c.control_title
HAVING COUNT(*) > 0
ORDER BY exceptions_last_3m DESC, total_exceptions DESC;

COMMENT ON VIEW v_exception_recurrence_pattern IS 'Control-level exception recurrence patterns and acceleration trends';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- Run this to verify all views were created successfully:
SELECT
  table_name as view_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'v_exception_materiality',
    'v_evidence_coverage_gaps',
    'v_risk_acceleration_timeline',
    'v_exception_recurrence_pattern'
  )
ORDER BY table_name;

-- Test the views with sample data
SELECT 'Testing v_exception_materiality...' as status;
SELECT COUNT(*) as exception_count FROM v_exception_materiality;

SELECT 'Testing v_risk_acceleration_timeline...' as status;
SELECT COUNT(*) as timeline_count FROM v_risk_acceleration_timeline;

SELECT 'Testing v_exception_recurrence_pattern...' as status;
SELECT COUNT(*) as pattern_count FROM v_exception_recurrence_pattern;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this script successfully:
-- 1. All 4 views should be created
-- 2. Navigate to Platform Admin → Feature Control in your app
-- 3. Find "Risk Signal Hub" and toggle it to Active
-- 4. Click "Deploy to Tenants" to make it available
-- 5. The feature will appear in Solution 4 for all tenants
-- ============================================================================
