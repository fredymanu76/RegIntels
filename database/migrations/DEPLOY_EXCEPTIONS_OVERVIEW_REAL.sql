-- ============================================================================
-- EXCEPTIONS OVERVIEW - ADAPTED FOR ACTUAL SCHEMA
-- ============================================================================
-- Based on ACTUAL database schema:
-- - exceptions.source_id + source_type (NOT control_id)
-- - exceptions.opened_at (NOT created_at)
-- - Assumes source_type = 'control' for control exceptions
-- ============================================================================

-- Clean up existing views
DROP VIEW IF EXISTS v_exception_materiality_overview CASCADE;
DROP VIEW IF EXISTS v_exception_trend_heatmap CASCADE;
DROP VIEW IF EXISTS v_exception_root_cause_taxonomy CASCADE;
DROP VIEW IF EXISTS v_exception_overview_summary CASCADE;

-- ============================================================================
-- VIEW 1: Exception Materiality Overview
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_materiality_overview AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.severity,
  e.source_id,
  e.source_type,
  e.opened_at,
  COALESCE(CURRENT_DATE - e.opened_at::date, 0) as days_open,

  -- Get control name if source_type is 'control'
  CASE
    WHEN e.source_type = 'control' THEN COALESCE(c.control_title, 'Unknown Control')
    ELSE CONCAT(UPPER(SUBSTRING(e.source_type, 1, 1)), SUBSTRING(e.source_type, 2))
  END as source_name,

  -- Simple materiality score based on severity and age
  CASE e.severity
    WHEN 'critical' THEN 90
    WHEN 'high' THEN 70
    WHEN 'medium' THEN 40
    WHEN 'low' THEN 20
    ELSE 30
  END +
  CASE
    WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 10
    WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 7
    WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 4
    ELSE 0
  END as total_materiality_score,

  -- Materiality band
  CASE
    WHEN (CASE e.severity
      WHEN 'critical' THEN 90
      WHEN 'high' THEN 70
      WHEN 'medium' THEN 40
      WHEN 'low' THEN 20
      ELSE 30
    END +
    CASE
      WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 10
      WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 7
      WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 4
      ELSE 0
    END) >= 70 THEN 'CRITICAL'
    WHEN (CASE e.severity
      WHEN 'critical' THEN 90
      WHEN 'high' THEN 70
      WHEN 'medium' THEN 40
      WHEN 'low' THEN 20
      ELSE 30
    END +
    CASE
      WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 10
      WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 7
      WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 4
      ELSE 0
    END) >= 40 THEN 'HIGH'
    WHEN (CASE e.severity
      WHEN 'critical' THEN 90
      WHEN 'high' THEN 70
      WHEN 'medium' THEN 40
      WHEN 'low' THEN 20
      ELSE 30
    END +
    CASE
      WHEN (CURRENT_DATE - e.opened_at::date) > 180 THEN 10
      WHEN (CURRENT_DATE - e.opened_at::date) > 90 THEN 7
      WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 4
      ELSE 0
    END) >= 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END as materiality_band,

  -- Recurrence count
  (SELECT COUNT(*)
   FROM exceptions ex
   WHERE ex.source_id = e.source_id
     AND ex.source_type = e.source_type
     AND ex.id != e.id
     AND ex.opened_at > CURRENT_DATE - INTERVAL '12 months'
  ) as recurrence_count_12m,

  -- Recurrence pattern
  CASE
    WHEN (SELECT COUNT(*) FROM exceptions ex WHERE ex.source_id = e.source_id AND ex.source_type = e.source_type AND ex.id != e.id AND ex.opened_at > CURRENT_DATE - INTERVAL '3 months') >= 3 THEN 'FREQUENT'
    WHEN (SELECT COUNT(*) FROM exceptions ex WHERE ex.source_id = e.source_id AND ex.source_type = e.source_type AND ex.id != e.id AND ex.opened_at > CURRENT_DATE - INTERVAL '12 months') >= 3 THEN 'RECURRING'
    WHEN (SELECT COUNT(*) FROM exceptions ex WHERE ex.source_id = e.source_id AND ex.source_type = e.source_type AND ex.id != e.id) > 1 THEN 'OCCASIONAL'
    ELSE 'ISOLATED'
  END as recurrence_pattern,

  -- Regulatory sensitivity (simplified - could be enhanced with actual regulatory_changes table)
  CASE e.severity
    WHEN 'critical' THEN 'HIGH_REGULATORY_SENSITIVITY'
    WHEN 'high' THEN 'MODERATE_REGULATORY_SENSITIVITY'
    ELSE 'LOW_REGULATORY_SENSITIVITY'
  END as regulatory_sensitivity,

  -- Risk signal
  CASE
    WHEN e.severity IN ('critical', 'high') AND (CURRENT_DATE - e.opened_at::date) > 90 THEN 'IMMEDIATE_BOARD_ATTENTION'
    WHEN e.severity IN ('critical', 'high') AND (CURRENT_DATE - e.opened_at::date) > 30 THEN 'ESCALATE_TO_MANAGEMENT'
    WHEN e.severity IN ('critical', 'high') THEN 'STRUCTURED_MONITORING'
    ELSE 'STANDARD_TRACKING'
  END as risk_signal,

  -- Trend indicator
  CASE
    WHEN (CURRENT_DATE - e.opened_at::date) > 30 THEN 'DETERIORATING'
    WHEN (CURRENT_DATE - e.opened_at::date) <= 7 THEN 'NEW'
    ELSE 'STABLE'
  END as trend_indicator

FROM exceptions e
LEFT JOIN controls c ON (e.source_type = 'control' AND c.id = e.source_id)
WHERE e.status = 'open'
ORDER BY total_materiality_score DESC, days_open DESC;

COMMENT ON VIEW v_exception_materiality_overview IS 'Board-level exception intelligence with materiality scoring';

-- ============================================================================
-- VIEW 2: Exception Trend Heatmap
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_trend_heatmap AS
WITH period_metrics AS (
  SELECT
    CASE e.severity
      WHEN 'critical' THEN 'CRITICAL'
      WHEN 'high' THEN 'HIGH'
      WHEN 'medium' THEN 'MEDIUM'
      WHEN 'low' THEN 'LOW'
      ELSE 'MEDIUM'
    END as materiality_band,
    e.source_type as control_category,

    COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '30 days') as exceptions_current_30d,
    COUNT(*) FILTER (WHERE e.opened_at BETWEEN CURRENT_DATE - INTERVAL '60 days' AND CURRENT_DATE - INTERVAL '30 days') as exceptions_previous_30d,
    COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '60 days') as exceptions_60d,
    COUNT(*) FILTER (WHERE e.opened_at > CURRENT_DATE - INTERVAL '90 days') as exceptions_90d,
    COUNT(*) FILTER (WHERE e.status = 'open') as total_open_exceptions

  FROM exceptions e
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

  ROUND(((exceptions_current_30d + exceptions_previous_30d)::numeric / NULLIF(2, 0)), 1) as avg_score_current_30d,
  ROUND(((exceptions_previous_30d)::numeric), 1) as avg_score_previous_30d,
  ROUND(((exceptions_60d)::numeric / NULLIF(2, 0)), 1) as avg_score_60d,
  ROUND(((exceptions_90d)::numeric / NULLIF(3, 0)), 1) as avg_score_90d,

  -- Trend %
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
    ELSE 'STABLE'
  END as trend_status,

  -- Heat level
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

COMMENT ON VIEW v_exception_trend_heatmap IS 'Exception trend heatmap showing deterioration/stabilization';

-- ============================================================================
-- VIEW 3: Root Cause Taxonomy
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_root_cause_taxonomy AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.description,
  e.status,
  e.severity,
  e.source_id,
  e.source_type,
  CASE
    WHEN e.source_type = 'control' THEN COALESCE(c.control_title, 'Unknown')
    ELSE e.source_type
  END as source_name,
  e.opened_at,
  COALESCE((CURRENT_DATE - e.opened_at::date), 0) as days_open,

  -- Root cause based on description
  CASE
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%process%' OR LOWER(COALESCE(e.description, '')) LIKE '%procedure%' THEN 'PROCESS'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%training%' OR LOWER(COALESCE(e.description, '')) LIKE '%staff%' THEN 'PEOPLE'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%system%' OR LOWER(COALESCE(e.description, '')) LIKE '%software%' THEN 'SYSTEMS'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%vendor%' OR LOWER(COALESCE(e.description, '')) LIKE '%third party%' THEN 'THIRD_PARTY'
    ELSE 'UNCLASSIFIED'
  END as root_cause_category,

  -- Subcategory
  CASE
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%policy%' THEN 'Policy/Governance Gap'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%design%' THEN 'Control Design Issue'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%execution%' THEN 'Execution Failure'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%capacity%' THEN 'Resource/Capacity Constraint'
    ELSE 'Other'
  END as root_cause_subcategory,

  -- Systemic indicator
  CASE
    WHEN (SELECT COUNT(*) FROM exceptions ex WHERE ex.source_id = e.source_id AND ex.source_type = e.source_type AND ex.opened_at > CURRENT_DATE - INTERVAL '12 months') > 2 THEN 'SYSTEMIC_RISK'
    WHEN (SELECT COUNT(*) FROM exceptions ex WHERE ex.source_id = e.source_id AND ex.source_type = e.source_type) > 1 THEN 'RECURRING_PATTERN'
    ELSE 'ISOLATED_INCIDENT'
  END as systemic_indicator,

  -- Remediation complexity
  CASE
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%system%' THEN 'HIGH'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%training%' THEN 'LOW'
    ELSE 'MODERATE'
  END as remediation_complexity

FROM exceptions e
LEFT JOIN controls c ON (e.source_type = 'control' AND c.id = e.source_id)
WHERE e.status = 'open'
ORDER BY e.opened_at DESC;

COMMENT ON VIEW v_exception_root_cause_taxonomy IS 'Root cause classification with systemic risk indicators';

-- ============================================================================
-- VIEW 4: Summary
-- ============================================================================

CREATE OR REPLACE VIEW v_exception_overview_summary AS
SELECT
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE status = 'open') as open_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'CRITICAL') as critical_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'HIGH') as high_exceptions,
  ROUND(AVG(total_materiality_score)::numeric, 1) as avg_materiality_score,
  ROUND(AVG(days_open) FILTER (WHERE status = 'open')::numeric, 0) as avg_days_open,
  COUNT(*) FILTER (WHERE recurrence_pattern IN ('FREQUENT', 'RECURRING')) as recurring_exceptions,
  COUNT(*) FILTER (WHERE regulatory_sensitivity = 'HIGH_REGULATORY_SENSITIVITY') as high_regulatory_sensitivity_count,
  COUNT(*) FILTER (WHERE risk_signal = 'IMMEDIATE_BOARD_ATTENTION') as immediate_attention_required,
  COUNT(*) FILTER (WHERE risk_signal = 'ESCALATE_TO_MANAGEMENT') as escalation_required,
  COUNT(*) FILTER (WHERE trend_indicator = 'DETERIORATING') as deteriorating_exceptions,
  COUNT(*) FILTER (WHERE trend_indicator = 'NEW') as new_exceptions_last_7d
FROM v_exception_materiality_overview;

COMMENT ON VIEW v_exception_overview_summary IS 'Summary metrics for dashboard';

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 'Success! Created 4 views:' as status;

SELECT table_name, table_type
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
SELECT 'Testing views...' as status;
SELECT COUNT(*) as materiality_count FROM v_exception_materiality_overview;
SELECT COUNT(*) as heatmap_count FROM v_exception_trend_heatmap;
SELECT COUNT(*) as root_cause_count FROM v_exception_root_cause_taxonomy;
SELECT * FROM v_exception_overview_summary;
