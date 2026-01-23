-- ============================================================================
-- SOLUTION 5 - EXCEPTIONS OVERVIEW (BOARD VIEW) - SIMPLIFIED
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

-- Grant permissions
GRANT SELECT ON v_exceptions_severity_summary TO authenticated;
GRANT SELECT ON v_exceptions_aging_analysis TO authenticated;
GRANT SELECT ON v_exceptions_by_control TO authenticated;
