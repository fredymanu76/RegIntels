-- ============================================================================
-- SOLUTION 5 BATCH 3: EXCEPTIONS OVERVIEW + REGULATORY READINESS - FINAL
-- This migration creates all necessary views for components 1 & 2
-- Date: 2026-01-24
-- ============================================================================

-- ============================================================================
-- PART 1: EXCEPTIONS OVERVIEW VIEWS
-- ============================================================================

-- Exception severity summary
CREATE OR REPLACE VIEW v_exceptions_severity_summary AS
SELECT
    e.tenant_id,
    e.severity,
    COUNT(*) as exception_count,
    COUNT(CASE WHEN e.status = 'open' THEN 1 END) as open_count,
    COUNT(CASE WHEN e.status = 'closed' THEN 1 END) as closed_count
FROM exceptions e
WHERE e.source_type = 'control'
GROUP BY e.tenant_id, e.severity;

-- Exception aging analysis
CREATE OR REPLACE VIEW v_exceptions_aging_analysis AS
SELECT
    e.tenant_id,
    e.severity,
    e.id as exception_id,
    e.title,
    e.opened_at,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.opened_at)) as days_open,
    CASE
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.opened_at)) <= 30 THEN '0-30 days'
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.opened_at)) <= 60 THEN '31-60 days'
        WHEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - e.opened_at)) <= 90 THEN '61-90 days'
        ELSE '90+ days'
    END as age_bucket
FROM exceptions e
WHERE e.status = 'open' AND e.source_type = 'control';

-- Exceptions by control
CREATE OR REPLACE VIEW v_exceptions_by_control AS
SELECT
    e.tenant_id,
    c.id as control_id,
    c.title as control_title,
    c.control_code,
    e.id as exception_id,
    e.title as exception_title,
    e.severity,
    e.status,
    e.opened_at,
    e.closed_at
FROM exceptions e
INNER JOIN controls c ON c.id = e.source_id AND e.source_type = 'control';

-- Grant permissions for exceptions views
GRANT SELECT ON v_exceptions_severity_summary TO authenticated;
GRANT SELECT ON v_exceptions_aging_analysis TO authenticated;
GRANT SELECT ON v_exceptions_by_control TO authenticated;

-- ============================================================================
-- PART 2: REGULATORY READINESS VIEWS
-- ============================================================================

-- Controls status summary
CREATE OR REPLACE VIEW controls_status_summary AS
SELECT
    c.tenant_id,
    c.status,
    COUNT(*) as control_count
FROM controls c
GROUP BY c.tenant_id, c.status;

-- Controls testing compliance
CREATE OR REPLACE VIEW controls_testing_compliance AS
SELECT
    c.tenant_id,
    c.id as control_id,
    c.control_code,
    c.title,
    c.status,
    c.frequency,
    c.test_method,
    c.evidence_required,
    CASE
        WHEN c.status = 'active' AND c.test_method IS NOT NULL THEN 'tested'
        WHEN c.status = 'active' AND c.test_method IS NULL THEN 'not_tested'
        ELSE 'inactive'
    END as testing_status,
    CASE
        WHEN c.evidence_required IS NOT NULL AND LENGTH(TRIM(c.evidence_required)) > 0 THEN true
        ELSE false
    END as has_evidence_requirements
FROM controls c;

-- Controls with exceptions count
CREATE OR REPLACE VIEW controls_with_exceptions_count AS
SELECT
    c.tenant_id,
    c.id as control_id,
    c.control_code,
    c.title,
    c.status,
    COUNT(e.id) as open_exception_count,
    COUNT(CASE WHEN e.severity = 'critical' THEN 1 END) as critical_exceptions,
    COUNT(CASE WHEN e.severity = 'high' THEN 1 END) as high_exceptions,
    COUNT(CASE WHEN e.severity = 'medium' THEN 1 END) as medium_exceptions,
    COUNT(CASE WHEN e.severity = 'low' THEN 1 END) as low_exceptions
FROM controls c
LEFT JOIN exceptions e ON e.source_id = c.id
    AND e.source_type = 'control'
    AND e.status = 'open'
GROUP BY c.tenant_id, c.id, c.control_code, c.title, c.status;

-- Regulatory readiness score
CREATE OR REPLACE VIEW regulatory_readiness_score AS
SELECT
    c.tenant_id,
    COUNT(*) as total_controls,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_controls,
    COUNT(CASE WHEN c.status = 'active' AND c.test_method IS NOT NULL THEN 1 END) as tested_controls,
    COUNT(CASE WHEN c.status = 'active' AND c.evidence_required IS NOT NULL THEN 1 END) as controls_with_evidence,
    COALESCE(SUM(exc.open_exception_count), 0)::INTEGER as total_open_exceptions,
    ROUND(
        (COUNT(CASE WHEN c.status = 'active' AND c.test_method IS NOT NULL THEN 1 END)::NUMERIC /
         NULLIF(COUNT(CASE WHEN c.status = 'active' THEN 1 END), 0)) * 100,
        1
    ) as testing_coverage_percent,
    ROUND(
        (COUNT(CASE WHEN c.status = 'active' THEN 1 END)::NUMERIC /
         NULLIF(COUNT(*), 0)) * 100,
        1
    ) as active_control_percent
FROM controls c
LEFT JOIN (
    SELECT
        source_id,
        COUNT(*) as open_exception_count
    FROM exceptions
    WHERE status = 'open' AND source_type = 'control'
    GROUP BY source_id
) exc ON exc.source_id = c.id
GROUP BY c.tenant_id;

-- Grant permissions for regulatory readiness views
GRANT SELECT ON controls_status_summary TO authenticated;
GRANT SELECT ON controls_testing_compliance TO authenticated;
GRANT SELECT ON controls_with_exceptions_count TO authenticated;
GRANT SELECT ON regulatory_readiness_score TO authenticated;
