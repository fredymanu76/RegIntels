-- ============================================================================
-- SOLUTION 4 DASHBOARD QUERIES
-- ============================================================================
-- Ready-to-use queries for your React frontend
-- Copy these into your Supabase client calls
-- ============================================================================

-- ============================================================================
-- QUERY 1: Exception Overview Card (Top KPIs)
-- ============================================================================
-- Use this for the main dashboard card
SELECT
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE status = 'open') as open_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'CRITICAL') as critical_exceptions,
  COUNT(*) FILTER (WHERE materiality_band = 'HIGH') as high_exceptions,
  ROUND(AVG(total_materiality_score), 1) as avg_materiality_score,
  COUNT(*) FILTER (WHERE days_open > 30) as aged_exceptions
FROM v_exception_materiality;

-- ============================================================================
-- QUERY 2: Exception List (Table View)
-- ============================================================================
-- Use this for the main exceptions table
SELECT
  exception_id,
  exception_title,
  control_name,
  status,
  severity,
  days_open,
  total_materiality_score,
  materiality_band,
  regulatory_impact_score,
  duration_score,
  recurrence_score
FROM v_exception_materiality
ORDER BY total_materiality_score DESC;

-- ============================================================================
-- QUERY 3: Materiality Band Distribution (Pie Chart)
-- ============================================================================
-- Use this for pie/donut chart of materiality bands
SELECT
  materiality_band,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM v_exception_materiality
GROUP BY materiality_band
ORDER BY
  CASE materiality_band
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;

-- ============================================================================
-- QUERY 4: Risk Timeline (Line Chart)
-- ============================================================================
-- Use this for timeline visualization
SELECT
  age_band,
  urgency_level,
  COUNT(*) as exception_count,
  ROUND(AVG(days_open), 0) as avg_days_open
FROM v_risk_acceleration_timeline
GROUP BY age_band, urgency_level
ORDER BY avg_days_open DESC;

-- ============================================================================
-- QUERY 5: Top Controls by Exception Count (Bar Chart)
-- ============================================================================
-- Use this for "Problem Controls" chart
SELECT
  control_title,
  total_exceptions,
  open_exceptions,
  exceptions_last_3m,
  recurrence_pattern
FROM v_exception_recurrence_pattern
ORDER BY exceptions_last_3m DESC, total_exceptions DESC
LIMIT 10;

-- ============================================================================
-- QUERY 6: Recurrence Pattern Summary (Stacked Bar)
-- ============================================================================
-- Use this for recurrence pattern breakdown
SELECT
  recurrence_pattern,
  COUNT(*) as control_count,
  SUM(total_exceptions) as total_exceptions,
  SUM(open_exceptions) as open_exceptions
FROM v_exception_recurrence_pattern
GROUP BY recurrence_pattern
ORDER BY
  CASE recurrence_pattern
    WHEN 'FREQUENT' THEN 1
    WHEN 'RECURRING' THEN 2
    WHEN 'OCCASIONAL' THEN 3
    WHEN 'ISOLATED' THEN 4
  END;

-- ============================================================================
-- QUERY 7: Exception Detail View (Single Exception)
-- ============================================================================
-- Use this when user clicks on an exception
-- Replace :exception_id with actual ID
SELECT
  e.exception_id,
  e.exception_title,
  e.status,
  e.severity,
  e.control_id,
  e.control_name,
  e.created_at,
  e.days_open,
  e.regulatory_impact_score,
  e.control_criticality_score,
  e.duration_score,
  e.recurrence_score,
  e.total_materiality_score,
  e.materiality_band,

  -- Get related regulatory changes
  COALESCE(
    json_agg(
      DISTINCT jsonb_build_object(
        'title', rc.title,
        'regulator', rc.regulator,
        'materiality', rc.materiality,
        'effective_date', rc.effective_date
      )
    ) FILTER (WHERE rc.id IS NOT NULL),
    '[]'
  ) as related_regulations

FROM v_exception_materiality e
LEFT JOIN regulatory_change_control_map rccm ON rccm.control_id = e.control_id
LEFT JOIN regulatory_changes rc ON rc.id = rccm.regulatory_change_id
WHERE e.exception_id = :exception_id
GROUP BY
  e.exception_id, e.exception_title, e.status, e.severity,
  e.control_id, e.control_name, e.created_at, e.days_open,
  e.regulatory_impact_score, e.control_criticality_score,
  e.duration_score, e.recurrence_score, e.total_materiality_score,
  e.materiality_band;

-- ============================================================================
-- QUERY 8: Urgency Alerts (Notifications)
-- ============================================================================
-- Use this for alerts/notification panel
SELECT
  exception_id,
  exception_title,
  control_name,
  urgency_level,
  days_open,
  age_band
FROM v_risk_acceleration_timeline
WHERE urgency_level IN ('IMMEDIATE_ATTENTION', 'ESCALATE')
ORDER BY days_open DESC
LIMIT 5;

-- ============================================================================
-- QUERY 9: Score Component Breakdown (Horizontal Bar Chart)
-- ============================================================================
-- Use this to show what's driving materiality scores
SELECT
  exception_title,
  regulatory_impact_score,
  control_criticality_score,
  duration_score,
  recurrence_score,
  total_materiality_score
FROM v_exception_materiality
WHERE status = 'open'
ORDER BY total_materiality_score DESC
LIMIT 10;

-- ============================================================================
-- QUERY 10: Monthly Exception Trend
-- ============================================================================
-- Use this for trend line chart showing exception creation over time
SELECT
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as exceptions_opened,
  COUNT(*) FILTER (WHERE status = 'open') as still_open,
  ROUND(AVG(total_materiality_score), 1) as avg_score
FROM v_exception_materiality
WHERE created_at > CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================================================
-- TYPESCRIPT TYPES FOR FRONTEND
-- ============================================================================
-- Copy these into your frontend types file

/*
// Exception Overview
interface ExceptionOverview {
  total_exceptions: number;
  open_exceptions: number;
  critical_exceptions: number;
  high_exceptions: number;
  avg_materiality_score: number;
  aged_exceptions: number;
}

// Exception Item
interface Exception {
  exception_id: string;
  exception_title: string;
  control_name: string;
  status: 'open' | 'closed' | 'expired';
  severity: 'low' | 'medium' | 'high' | 'critical';
  days_open: number;
  total_materiality_score: number;
  materiality_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  regulatory_impact_score: number;
  duration_score: number;
  recurrence_score: number;
}

// Materiality Band Distribution
interface MaterialityDistribution {
  materiality_band: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  count: number;
  percentage: number;
}

// Risk Timeline
interface RiskTimeline {
  age_band: 'RECENT' | 'DEVELOPING' | 'PERSISTENT' | 'CHRONIC' | 'CRITICAL_AGE';
  urgency_level: 'TRACK' | 'MONITOR' | 'ESCALATE' | 'IMMEDIATE_ATTENTION';
  exception_count: number;
  avg_days_open: number;
}

// Control Recurrence
interface ControlRecurrence {
  control_title: string;
  total_exceptions: number;
  open_exceptions: number;
  exceptions_last_3m: number;
  recurrence_pattern: 'ISOLATED' | 'OCCASIONAL' | 'RECURRING' | 'FREQUENT';
}

// Exception Detail
interface ExceptionDetail extends Exception {
  control_id: string;
  created_at: string;
  control_criticality_score: number;
  related_regulations: Array<{
    title: string;
    regulator: string;
    materiality: string;
    effective_date: string;
  }>;
}

// Urgency Alert
interface UrgencyAlert {
  exception_id: string;
  exception_title: string;
  control_name: string;
  urgency_level: 'ESCALATE' | 'IMMEDIATE_ATTENTION';
  days_open: number;
  age_band: string;
}
*/
