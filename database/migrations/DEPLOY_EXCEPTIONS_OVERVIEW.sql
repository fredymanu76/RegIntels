-- ============================================================================
-- EXCEPTIONS OVERVIEW DEPLOYMENT (Solution 5 Enhancement - Module 1)
-- ============================================================================
-- Strategic Purpose: Exception intelligence with materiality scoring,
-- trend analysis, and root cause taxonomy
--
-- Creates 3 views:
-- 1. v_exception_materiality_overview - Enhanced materiality with recurrence
-- 2. v_exception_trend_heatmap - Rolling period deterioration/stabilization
-- 3. v_exception_root_cause_taxonomy - Process/People/Systems/Third-party analysis
-- ============================================================================

-- Clean up existing views
DROP VIEW IF EXISTS v_exception_materiality_overview CASCADE;
DROP VIEW IF EXISTS v_exception_trend_heatmap CASCADE;
DROP VIEW IF EXISTS v_exception_root_cause_taxonomy CASCADE;

-- ============================================================================
-- VIEW 1: Exception Materiality Overview
-- ============================================================================
-- Board-level exception intelligence combining:
-- - Materiality score (from v_exception_materiality)
-- - Recurrence patterns
-- - Regulatory sensitivity
-- - Forward-looking risk signals
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_materiality_overview AS
SELECT
  em.exception_id,
  em.exception_title,
  em.status,
  em.severity,
  em.control_id,
  em.control_name,
  em.total_materiality_score,
  em.materiality_band,
  em.days_open,

  -- Recurrence analysis
  COALESCE(
    (SELECT COUNT(*)
     FROM exceptions e2
     WHERE e2.control_id = em.control_id
       AND e2.id != em.exception_id
       AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'),
    0
  ) as recurrence_count_12m,

  CASE
    WHEN (SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = em.control_id AND e2.id != em.exception_id AND e2.created_at > CURRENT_DATE - INTERVAL '3 months') >= 3 THEN 'FREQUENT'
    WHEN (SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = em.control_id AND e2.id != em.exception_id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') >= 3 THEN 'RECURRING'
    WHEN (SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = em.control_id AND e2.id != em.exception_id) > 1 THEN 'OCCASIONAL'
    ELSE 'ISOLATED'
  END as recurrence_pattern,

  -- Regulatory sensitivity (linked to regulatory changes)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = em.control_id AND rc.materiality = 'high'
    ) THEN 'HIGH_REGULATORY_SENSITIVITY'
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = em.control_id
    ) THEN 'MODERATE_REGULATORY_SENSITIVITY'
    ELSE 'LOW_REGULATORY_SENSITIVITY'
  END as regulatory_sensitivity,

  -- Forward-looking risk signal
  CASE
    WHEN em.total_materiality_score >= 70 AND em.days_open > 90 THEN 'IMMEDIATE_BOARD_ATTENTION'
    WHEN em.total_materiality_score >= 40 AND em.days_open > 180 THEN 'ESCALATE_TO_MANAGEMENT'
    WHEN em.total_materiality_score >= 40 THEN 'STRUCTURED_MONITORING'
    ELSE 'STANDARD_TRACKING'
  END as risk_signal,

  -- Trend indicator (compared to 30 days ago)
  CASE
    WHEN em.days_open > 30 THEN 'DETERIORATING'
    WHEN em.days_open <= 7 THEN 'NEW'
    ELSE 'STABLE'
  END as trend_indicator,

  em.created_at,
  em.regulatory_impact_score,
  em.control_criticality_score,
  em.duration_score,
  em.recurrence_score

FROM v_exception_materiality em
WHERE em.status = 'open'
ORDER BY em.total_materiality_score DESC, em.days_open DESC;

COMMENT ON VIEW v_exception_materiality_overview IS 'Board-level exception intelligence with materiality scoring, recurrence patterns, and forward-looking risk signals';

-- ============================================================================
-- VIEW 2: Exception Trend Heatmap
-- ============================================================================
-- Shows deterioration or stabilisation over rolling 30/60/90 day periods
-- Grouped by materiality band and control category
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_trend_heatmap AS
WITH period_metrics AS (
  SELECT
    materiality_band,
    control_category,

    -- Current period (last 30 days)
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days') as exceptions_current_30d,
    AVG(total_materiality_score) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '30 days') as avg_score_current_30d,

    -- Previous period (31-60 days ago)
    COUNT(*) FILTER (WHERE created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days') as exceptions_previous_30d,
    AVG(total_materiality_score) FILTER (WHERE created_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days') as avg_score_previous_30d,

    -- 60-day rolling
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '60 days') as exceptions_60d,
    AVG(total_materiality_score) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '60 days') as avg_score_60d,

    -- 90-day rolling
    COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '90 days') as exceptions_90d,
    AVG(total_materiality_score) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '90 days') as avg_score_90d,

    -- Total open
    COUNT(*) FILTER (WHERE status = 'open') as total_open_exceptions

  FROM v_exception_materiality
  GROUP BY materiality_band, control_category
)
SELECT
  materiality_band,
  control_category,
  exceptions_current_30d,
  exceptions_previous_30d,
  exceptions_60d,
  exceptions_90d,
  total_open_exceptions,

  ROUND(avg_score_current_30d::numeric, 1) as avg_score_current_30d,
  ROUND(avg_score_previous_30d::numeric, 1) as avg_score_previous_30d,
  ROUND(avg_score_60d::numeric, 1) as avg_score_60d,
  ROUND(avg_score_90d::numeric, 1) as avg_score_90d,

  -- Trend calculation (% change from previous period)
  CASE
    WHEN exceptions_previous_30d > 0 THEN
      ROUND(((exceptions_current_30d::numeric - exceptions_previous_30d::numeric) / exceptions_previous_30d::numeric * 100), 1)
    WHEN exceptions_current_30d > 0 THEN 100.0
    ELSE 0.0
  END as trend_pct_change,

  -- Trend status
  CASE
    WHEN exceptions_previous_30d = 0 AND exceptions_current_30d > 0 THEN 'NEW_EMERGENCE'
    WHEN exceptions_previous_30d > 0 AND exceptions_current_30d = 0 THEN 'RESOLVED'
    WHEN exceptions_current_30d > exceptions_previous_30d * 1.5 THEN 'RAPID_DETERIORATION'
    WHEN exceptions_current_30d > exceptions_previous_30d * 1.2 THEN 'DETERIORATING'
    WHEN exceptions_current_30d < exceptions_previous_30d * 0.8 THEN 'IMPROVING'
    WHEN exceptions_current_30d < exceptions_previous_30d * 0.5 THEN 'SIGNIFICANT_IMPROVEMENT'
    ELSE 'STABLE'
  END as trend_status,

  -- Heat level for visual heatmap
  CASE
    WHEN materiality_band = 'CRITICAL' AND exceptions_current_30d > exceptions_previous_30d THEN 'HOT'
    WHEN materiality_band = 'HIGH' AND exceptions_current_30d > exceptions_previous_30d * 1.5 THEN 'HOT'
    WHEN materiality_band IN ('CRITICAL', 'HIGH') AND exceptions_current_30d > 0 THEN 'WARM'
    WHEN exceptions_current_30d < exceptions_previous_30d * 0.5 THEN 'COOLING'
    ELSE 'NEUTRAL'
  END as heat_level

FROM period_metrics
ORDER BY
  CASE materiality_band
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  exceptions_current_30d DESC;

COMMENT ON VIEW v_exception_trend_heatmap IS 'Exception trend analysis showing deterioration or stabilisation over rolling periods';

-- ============================================================================
-- VIEW 3: Exception Root Cause Taxonomy
-- ============================================================================
-- Categorizes exceptions by root cause: Process, People, Systems, Third-party
-- Based on exception descriptions and patterns
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_root_cause_taxonomy AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.description,
  e.status,
  e.severity,
  e.control_id,
  COALESCE(c.control_title, 'Unknown Control') as control_name,
  e.created_at,
  (CURRENT_DATE - e.created_at::date) as days_open,

  -- Root cause classification (basic text analysis)
  -- In production, this could be enhanced with ML or manual tagging
  CASE
    WHEN LOWER(e.description) LIKE '%process%' OR LOWER(e.description) LIKE '%procedure%' OR LOWER(e.description) LIKE '%workflow%' THEN 'PROCESS'
    WHEN LOWER(e.description) LIKE '%training%' OR LOWER(e.description) LIKE '%staff%' OR LOWER(e.description) LIKE '%employee%' OR LOWER(e.description) LIKE '%personnel%' THEN 'PEOPLE'
    WHEN LOWER(e.description) LIKE '%system%' OR LOWER(e.description) LIKE '%application%' OR LOWER(e.description) LIKE '%software%' OR LOWER(e.description) LIKE '%technical%' THEN 'SYSTEMS'
    WHEN LOWER(e.description) LIKE '%vendor%' OR LOWER(e.description) LIKE '%third party%' OR LOWER(e.description) LIKE '%supplier%' OR LOWER(e.description) LIKE '%outsource%' THEN 'THIRD_PARTY'
    ELSE 'UNCLASSIFIED'
  END as root_cause_category,

  -- Root cause subcategory (more granular)
  CASE
    WHEN LOWER(e.description) LIKE '%policy%' OR LOWER(e.description) LIKE '%governance%' THEN 'Policy/Governance Gap'
    WHEN LOWER(e.description) LIKE '%control design%' OR LOWER(e.description) LIKE '%design flaw%' THEN 'Control Design Issue'
    WHEN LOWER(e.description) LIKE '%execution%' OR LOWER(e.description) LIKE '%implementation%' THEN 'Execution Failure'
    WHEN LOWER(e.description) LIKE '%capacity%' OR LOWER(e.description) LIKE '%resource%' THEN 'Resource/Capacity Constraint'
    WHEN LOWER(e.description) LIKE '%data quality%' OR LOWER(e.description) LIKE '%data integrity%' THEN 'Data Quality Issue'
    WHEN LOWER(e.description) LIKE '%technology%' OR LOWER(e.description) LIKE '%infrastructure%' THEN 'Technology/Infrastructure'
    ELSE 'Other'
  END as root_cause_subcategory,

  -- Systemic risk indicator (if same root cause appears multiple times)
  CASE
    WHEN (
      SELECT COUNT(*)
      FROM exceptions e2
      WHERE e2.control_id = e.control_id
        AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'
        AND CASE
          WHEN LOWER(e2.description) LIKE '%process%' OR LOWER(e2.description) LIKE '%procedure%' THEN 'PROCESS'
          WHEN LOWER(e2.description) LIKE '%training%' OR LOWER(e2.description) LIKE '%staff%' THEN 'PEOPLE'
          WHEN LOWER(e2.description) LIKE '%system%' OR LOWER(e2.description) LIKE '%software%' THEN 'SYSTEMS'
          WHEN LOWER(e2.description) LIKE '%vendor%' OR LOWER(e2.description) LIKE '%third party%' THEN 'THIRD_PARTY'
          ELSE 'UNCLASSIFIED'
        END =
        CASE
          WHEN LOWER(e.description) LIKE '%process%' OR LOWER(e.description) LIKE '%procedure%' THEN 'PROCESS'
          WHEN LOWER(e.description) LIKE '%training%' OR LOWER(e.description) LIKE '%staff%' THEN 'PEOPLE'
          WHEN LOWER(e.description) LIKE '%system%' OR LOWER(e.description) LIKE '%software%' THEN 'SYSTEMS'
          WHEN LOWER(e.description) LIKE '%vendor%' OR LOWER(e.description) LIKE '%third party%' THEN 'THIRD_PARTY'
          ELSE 'UNCLASSIFIED'
        END
    ) > 2 THEN 'SYSTEMIC_RISK'
    WHEN (
      SELECT COUNT(*)
      FROM exceptions e2
      WHERE e2.control_id = e.control_id
        AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'
    ) > 1 THEN 'RECURRING_PATTERN'
    ELSE 'ISOLATED_INCIDENT'
  END as systemic_indicator,

  -- Remediation complexity estimate
  CASE
    WHEN LOWER(e.description) LIKE '%process%' OR LOWER(e.description) LIKE '%procedure%' THEN 'MODERATE'
    WHEN LOWER(e.description) LIKE '%training%' OR LOWER(e.description) LIKE '%staff%' THEN 'LOW'
    WHEN LOWER(e.description) LIKE '%system%' OR LOWER(e.description) LIKE '%software%' THEN 'HIGH'
    WHEN LOWER(e.description) LIKE '%vendor%' OR LOWER(e.description) LIKE '%third party%' THEN 'HIGH'
    ELSE 'MODERATE'
  END as remediation_complexity

FROM exceptions e
LEFT JOIN controls c ON c.id = e.control_id
WHERE e.status = 'open'
ORDER BY e.created_at DESC;

COMMENT ON VIEW v_exception_root_cause_taxonomy IS 'Exception root cause classification: Process, People, Systems, Third-party with systemic risk indicators';

-- ============================================================================
-- Summary aggregation for board dashboard
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_overview_summary AS
SELECT
  -- Total exception counts
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE status = 'open') as open_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'CRITICAL') as critical_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'HIGH') as high_exceptions,

  -- Average scores
  ROUND(AVG(total_materiality_score)::numeric, 1) as avg_materiality_score,
  ROUND(AVG(days_open) FILTER (WHERE status = 'open')::numeric, 0) as avg_days_open,

  -- Recurrence analysis
  COUNT(*) FILTER (WHERE recurrence_pattern IN ('FREQUENT', 'RECURRING')) as recurring_exceptions,

  -- Regulatory sensitivity
  COUNT(*) FILTER (WHERE regulatory_sensitivity = 'HIGH_REGULATORY_SENSITIVITY') as high_regulatory_sensitivity_count,

  -- Risk signals
  COUNT(*) FILTER (WHERE risk_signal = 'IMMEDIATE_BOARD_ATTENTION') as immediate_attention_required,
  COUNT(*) FILTER (WHERE risk_signal = 'ESCALATE_TO_MANAGEMENT') as escalation_required,

  -- Trend
  COUNT(*) FILTER (WHERE trend_indicator = 'DETERIORATING') as deteriorating_exceptions,
  COUNT(*) FILTER (WHERE trend_indicator = 'NEW') as new_exceptions_last_7d

FROM v_exception_materiality_overview;

COMMENT ON VIEW v_exception_overview_summary IS 'High-level summary metrics for Exceptions Overview dashboard';

-- ============================================================================
-- Verification Query
-- ============================================================================

SELECT 'Verifying Exceptions Overview views...' as status;

SELECT
  table_name as view_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'v_exception_materiality_overview',
    'v_exception_trend_heatmap',
    'v_exception_root_cause_taxonomy',
    'v_exception_overview_summary'
  )
ORDER BY table_name;

-- Test queries
SELECT 'Testing v_exception_materiality_overview...' as status;
SELECT COUNT(*) as count FROM v_exception_materiality_overview;

SELECT 'Testing v_exception_trend_heatmap...' as status;
SELECT COUNT(*) as count FROM v_exception_trend_heatmap;

SELECT 'Testing v_exception_root_cause_taxonomy...' as status;
SELECT COUNT(*) as count FROM v_exception_root_cause_taxonomy;

SELECT 'Testing v_exception_overview_summary...' as status;
SELECT * FROM v_exception_overview_summary;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================
-- Next step: Deploy views to Supabase, then create ExceptionsOverview.jsx component
-- ============================================================================
