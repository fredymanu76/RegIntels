-- ============================================================================
-- SOLUTION 5 - EXCEPTIONS OVERVIEW (BOARD VIEW) - SIMPLIFIED
-- ============================================================================
-- Simplified version without joins until we verify actual schema
-- Date: 2026-01-23
-- ============================================================================

-- ============================================================================
-- VIEW 1: Exception Root Cause Taxonomy (Simplified)
-- ============================================================================
CREATE OR REPLACE VIEW v_exception_root_cause_taxonomy AS
SELECT
  e.tenant_id,
  e.id as exception_id,
  e.title,
  e.status,
  e.severity,

  -- Reference to source
  e.source_id as control_id,
  e.source_type,

  -- Placeholder for control info (will be NULL if controls schema doesn't match)
  CAST(NULL AS TEXT) as control_name,
  CAST(NULL AS TEXT) as control_category,

  -- Root cause classification based on description analysis
  CASE
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%process%'
      OR LOWER(COALESCE(e.description, '')) LIKE '%procedure%'
      THEN 'Process'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%training%'
      OR LOWER(COALESCE(e.description, '')) LIKE '%staff%'
      THEN 'People'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%system%'
      OR LOWER(COALESCE(e.description, '')) LIKE '%software%'
      THEN 'Systems'
    WHEN LOWER(COALESCE(e.description, '')) LIKE '%vendor%'
      OR LOWER(COALESCE(e.description, '')) LIKE '%third party%'
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

  -- Placeholder materiality (will use actual if v_exception_materiality exists)
  CAST(NULL AS INTEGER) as materiality_score,
  CAST(NULL AS TEXT) as materiality_band

FROM exceptions e
WHERE e.deleted_at IS NULL;

COMMENT ON VIEW v_exception_root_cause_taxonomy IS 'Solution 5: Root cause classification for exceptions';

-- ============================================================================
-- VIEW 2: Exception Trend Heatmap (Simplified)
-- ============================================================================
CREATE OR REPLACE VIEW v_exception_trend_heatmap AS
WITH monthly_exceptions AS (
  SELECT
    e.tenant_id,
    DATE_TRUNC('month', e.created_at) as month,
    e.severity,
    COUNT(*) as exception_count,
    COUNT(*) FILTER (WHERE e.status IN ('open', 'remediation')) as open_count,
    COUNT(*) FILTER (WHERE e.status = 'closed') as resolved_count
  FROM exceptions e
  WHERE e.created_at >= CURRENT_DATE - INTERVAL '12 months'
    AND e.deleted_at IS NULL
  GROUP BY e.tenant_id, DATE_TRUNC('month', e.created_at), e.severity
),
trend_calculation AS (
  SELECT
    tenant_id,
    month,
    severity,
    exception_count,
    open_count,
    resolved_count,
    LAG(exception_count, 1) OVER (PARTITION BY tenant_id, severity ORDER BY month) as prev_month_count
  FROM monthly_exceptions
)
SELECT
  tenant_id,
  month,
  severity,
  CAST(NULL AS TEXT) as materiality_band,
  exception_count,
  open_count,
  resolved_count,
  0.0 as avg_materiality,

  -- Trend indicators
  CASE
    WHEN prev_month_count IS NULL THEN 'New'
    WHEN exception_count > prev_month_count THEN 'Deteriorating'
    WHEN exception_count < prev_month_count THEN 'Improving'
    ELSE 'Stable'
  END as volume_trend,

  'Stable' as severity_trend,

  -- Percentage change
  CASE
    WHEN prev_month_count IS NULL OR prev_month_count = 0 THEN NULL
    ELSE ROUND(((exception_count::numeric - prev_month_count::numeric) / prev_month_count::numeric * 100), 1)
  END as pct_change

FROM trend_calculation
ORDER BY tenant_id, month DESC, severity;

COMMENT ON VIEW v_exception_trend_heatmap IS 'Solution 5: Monthly exception trends';

-- ============================================================================
-- VIEW 3: Exceptions Overview MI (Simplified)
-- ============================================================================
CREATE OR REPLACE VIEW v_exceptions_overview_mi AS
WITH current_exceptions AS (
  SELECT
    tenant_id,
    COUNT(*) FILTER (WHERE status IN ('open', 'remediation')) as open_exceptions,
    COUNT(*) FILTER (WHERE status = 'closed' AND closed_at >= CURRENT_DATE - INTERVAL '30 days') as resolved_last_30d,
    COUNT(*) FILTER (WHERE severity = 'critical' AND status IN ('open', 'remediation')) as critical_open,
    COUNT(*) FILTER (WHERE severity = 'high' AND status IN ('open', 'remediation')) as high_open,
    COUNT(*) FILTER (WHERE severity = 'medium' AND status IN ('open', 'remediation')) as medium_open,
    AVG(CASE WHEN status IN ('open', 'remediation')
      THEN (CURRENT_DATE - opened_at::date) ELSE NULL END) as avg_days_open
  FROM exceptions
  WHERE deleted_at IS NULL
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
  50.0 as avg_open_materiality,
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

COMMENT ON VIEW v_exceptions_overview_mi IS 'Solution 5: Board-level exceptions overview';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT SELECT ON v_exception_root_cause_taxonomy TO authenticated;
GRANT SELECT ON v_exception_trend_heatmap TO authenticated;
GRANT SELECT ON v_exceptions_overview_mi TO authenticated;
