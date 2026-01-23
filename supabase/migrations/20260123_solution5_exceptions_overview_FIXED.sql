-- ============================================================================
-- SOLUTION 5 - EXCEPTIONS OVERVIEW (BOARD VIEW) - FIXED VERSION
-- ============================================================================
-- Board-level exception intelligence views
-- Part of Solution 5 Batch 3 Implementation
-- Date: 2026-01-23
-- ============================================================================

-- First, check if we need to add control_id column (backward compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exceptions' AND column_name = 'control_id'
  ) THEN
    -- Add control_id as an alias/reference for source_id when source_type = 'control'
    ALTER TABLE exceptions
    ADD COLUMN control_id BIGINT
    GENERATED ALWAYS AS (CASE WHEN source_type = 'control' THEN source_id ELSE NULL END) STORED;
  END IF;
END $$;

-- ============================================================================
-- VIEW 1: Exception Root Cause Taxonomy
-- ============================================================================
-- Categorizes exceptions by root cause for board-level analysis
CREATE OR REPLACE VIEW v_exception_root_cause_taxonomy AS
SELECT
  e.tenant_id,
  e.id as exception_id,
  e.title,
  e.status,
  e.severity,

  -- Use source_id when source_type is 'control'
  CASE WHEN e.source_type = 'control' THEN e.source_id ELSE NULL END as control_id,

  cl.name as control_name,
  cl.category as control_category,

  -- Root cause classification based on description/notes analysis
  CASE
    WHEN LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%process%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%procedure%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%workflow%'
      THEN 'Process'
    WHEN LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%training%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%staff%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%employee%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%human error%'
      THEN 'People'
    WHEN LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%system%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%technology%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%software%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%technical%'
      THEN 'Systems'
    WHEN LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%vendor%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%third party%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%supplier%'
      OR LOWER(COALESCE(e.description, '') || ' ' || COALESCE(e.resolution_notes, '')) LIKE '%outsourc%'
      THEN 'Third Party'
    ELSE 'Other'
  END as root_cause,

  e.created_at,
  e.closed_at as resolved_at,

  -- Days open calculation
  CASE
    WHEN e.status IN ('open', 'remediation')
    THEN (CURRENT_DATE - e.opened_at::date)
    ELSE (COALESCE(e.closed_at::date, CURRENT_DATE) - e.opened_at::date)
  END as days_open,

  -- Get materiality from v_exception_materiality if it exists
  vm.materiality_score,
  vm.materiality_band

FROM exceptions e
LEFT JOIN controls cl ON cl.id = e.source_id AND e.source_type = 'control'
LEFT JOIN v_exception_materiality vm ON vm.exception_id = e.id
WHERE e.deleted_at IS NULL;

COMMENT ON VIEW v_exception_root_cause_taxonomy IS 'Solution 5: Root cause classification for exceptions (Process, People, Systems, Third Party)';

-- ============================================================================
-- VIEW 2: Exception Trend Heatmap
-- ============================================================================
-- Shows exception trends over rolling periods for deterioration/stabilisation analysis
CREATE OR REPLACE VIEW v_exception_trend_heatmap AS
WITH monthly_exceptions AS (
  SELECT
    e.tenant_id,
    DATE_TRUNC('month', e.created_at) as month,
    e.severity,
    vm.materiality_band,
    COUNT(*) as exception_count,
    COUNT(*) FILTER (WHERE e.status IN ('open', 'remediation')) as open_count,
    COUNT(*) FILTER (WHERE e.status = 'closed') as resolved_count,
    AVG(vm.materiality_score) as avg_materiality
  FROM exceptions e
  LEFT JOIN v_exception_materiality vm ON vm.exception_id = e.id
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '12 months'
    AND e.deleted_at IS NULL
  GROUP BY e.tenant_id, DATE_TRUNC('month', e.created_at), e.severity, vm.materiality_band
),
trend_calculation AS (
  SELECT
    tenant_id,
    month,
    severity,
    materiality_band,
    exception_count,
    open_count,
    resolved_count,
    avg_materiality,

    -- Calculate trend vs previous month
    LAG(exception_count, 1) OVER (PARTITION BY tenant_id, severity ORDER BY month) as prev_month_count,
    LAG(avg_materiality, 1) OVER (PARTITION BY tenant_id, severity ORDER BY month) as prev_month_materiality
  FROM monthly_exceptions
)
SELECT
  tenant_id,
  month,
  severity,
  materiality_band,
  exception_count,
  open_count,
  resolved_count,
  ROUND(COALESCE(avg_materiality, 0)::numeric, 1) as avg_materiality,

  -- Trend indicators
  CASE
    WHEN prev_month_count IS NULL THEN 'New'
    WHEN exception_count > prev_month_count THEN 'Deteriorating'
    WHEN exception_count < prev_month_count THEN 'Improving'
    ELSE 'Stable'
  END as volume_trend,

  CASE
    WHEN prev_month_materiality IS NULL THEN 'New'
    WHEN avg_materiality > prev_month_materiality + 5 THEN 'Worsening'
    WHEN avg_materiality < prev_month_materiality - 5 THEN 'Improving'
    ELSE 'Stable'
  END as severity_trend,

  -- Percentage change
  CASE
    WHEN prev_month_count IS NULL OR prev_month_count = 0 THEN NULL
    ELSE ROUND(((exception_count::numeric - prev_month_count::numeric) / prev_month_count::numeric * 100), 1)
  END as pct_change

FROM trend_calculation
ORDER BY tenant_id, month DESC, severity;

COMMENT ON VIEW v_exception_trend_heatmap IS 'Solution 5: Monthly exception trends showing deterioration or stabilisation patterns';

-- ============================================================================
-- VIEW 3: Exceptions Overview MI (Main Board View)
-- ============================================================================
-- Comprehensive board-level view combining materiality, trends, and root causes
CREATE OR REPLACE VIEW v_exceptions_overview_mi AS
WITH current_exceptions AS (
  SELECT
    tenant_id,
    COUNT(*) FILTER (WHERE status IN ('open', 'remediation')) as open_exceptions,
    COUNT(*) FILTER (WHERE status = 'closed' AND closed_at >= CURRENT_DATE - INTERVAL '30 days') as resolved_last_30d,
    COUNT(*) FILTER (WHERE materiality_band = 'CRITICAL' AND status IN ('open', 'remediation')) as critical_open,
    COUNT(*) FILTER (WHERE materiality_band = 'HIGH' AND status IN ('open', 'remediation')) as high_open,
    COUNT(*) FILTER (WHERE materiality_band = 'MEDIUM' AND status IN ('open', 'remediation')) as medium_open,
    AVG(materiality_score) FILTER (WHERE status IN ('open', 'remediation')) as avg_open_materiality,
    AVG(days_open) FILTER (WHERE status IN ('open', 'remediation')) as avg_days_open
  FROM v_exception_materiality
  GROUP BY tenant_id
),
root_cause_summary AS (
  SELECT
    tenant_id,
    COUNT(*) FILTER (WHERE root_cause = 'Process' AND status IN ('open', 'remediation')) as process_exceptions,
    COUNT(*) FILTER (WHERE root_cause = 'People' AND status IN ('open', 'remediation')) as people_exceptions,
    COUNT(*) FILTER (WHERE root_cause = 'Systems' AND status IN ('open', 'remediation')) as systems_exceptions,
    COUNT(*) FILTER (WHERE root_cause = 'Third Party' AND status IN ('open', 'remediation')) as third_party_exceptions
  FROM v_exception_root_cause_taxonomy
  GROUP BY tenant_id
),
recent_trend AS (
  SELECT
    tenant_id,
    SUM(exception_count) FILTER (WHERE month = DATE_TRUNC('month', CURRENT_DATE)) as this_month,
    SUM(exception_count) FILTER (WHERE month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')) as last_month
  FROM v_exception_trend_heatmap
  GROUP BY tenant_id
)
SELECT
  t.id as tenant_id,
  t.name as tenant_name,

  -- Current state metrics
  COALESCE(ce.open_exceptions, 0) as open_exceptions,
  COALESCE(ce.resolved_last_30d, 0) as resolved_last_30d,
  COALESCE(ce.critical_open, 0) as critical_open,
  COALESCE(ce.high_open, 0) as high_open,
  COALESCE(ce.medium_open, 0) as medium_open,
  ROUND(COALESCE(ce.avg_open_materiality, 0)::numeric, 1) as avg_open_materiality,
  ROUND(COALESCE(ce.avg_days_open, 0)::numeric, 1) as avg_days_open,

  -- Root cause breakdown
  COALESCE(rcs.process_exceptions, 0) as process_exceptions,
  COALESCE(rcs.people_exceptions, 0) as people_exceptions,
  COALESCE(rcs.systems_exceptions, 0) as systems_exceptions,
  COALESCE(rcs.third_party_exceptions, 0) as third_party_exceptions,

  -- Trend analysis
  COALESCE(rt.this_month, 0) as new_this_month,
  COALESCE(rt.last_month, 0) as new_last_month,
  CASE
    WHEN rt.last_month IS NULL OR rt.last_month = 0 THEN NULL
    ELSE ROUND(((rt.this_month::numeric - rt.last_month::numeric) / rt.last_month::numeric * 100), 1)
  END as month_over_month_pct,

  -- Risk signal
  CASE
    WHEN ce.critical_open > 0 THEN 'Critical Attention Required'
    WHEN ce.high_open >= 5 THEN 'High Risk Exposure'
    WHEN ce.avg_open_materiality > 60 THEN 'Elevated Materiality'
    WHEN ce.avg_days_open > 90 THEN 'Aging Concern'
    ELSE 'Within Tolerance'
  END as risk_signal,

  CURRENT_TIMESTAMP as snapshot_at

FROM tenants t
LEFT JOIN current_exceptions ce ON ce.tenant_id = t.id
LEFT JOIN root_cause_summary rcs ON rcs.tenant_id = t.id
LEFT JOIN recent_trend rt ON rt.tenant_id = t.id
WHERE t.deleted_at IS NULL
  AND t.status = 'active';

COMMENT ON VIEW v_exceptions_overview_mi IS 'Solution 5: Board-level exceptions overview with materiality scoring, trends, and root cause intelligence';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT ON v_exception_root_cause_taxonomy TO authenticated;
GRANT SELECT ON v_exception_trend_heatmap TO authenticated;
GRANT SELECT ON v_exceptions_overview_mi TO authenticated;
