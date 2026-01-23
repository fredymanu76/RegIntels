-- Solution 5 Batch 3: Regulatory Readiness Board
-- Database views for control readiness metrics with VERIFIED schema

-- =====================================================
-- VIEW: controls_status_summary
-- Purpose: Count controls by current status
-- =====================================================
CREATE OR REPLACE VIEW controls_status_summary AS
SELECT
    c.tenant_id,
    c.status,
    COUNT(*) as control_count
FROM controls c
GROUP BY c.tenant_id, c.status;

-- =====================================================
-- VIEW: controls_testing_compliance
-- Purpose: Control testing status and evidence completeness
-- =====================================================
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

-- =====================================================
-- VIEW: controls_with_exceptions_count
-- Purpose: Count open exceptions per control
-- =====================================================
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

-- =====================================================
-- VIEW: regulatory_readiness_score
-- Purpose: Overall readiness metrics per tenant
-- =====================================================
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

-- Grant permissions
GRANT SELECT ON controls_status_summary TO authenticated;
GRANT SELECT ON controls_testing_compliance TO authenticated;
GRANT SELECT ON controls_with_exceptions_count TO authenticated;
GRANT SELECT ON regulatory_readiness_score TO authenticated;
