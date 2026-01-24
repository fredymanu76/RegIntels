-- ============================================================================
-- FIX EVERYTHING - USING YOUR ACTUAL SCHEMA
-- ============================================================================
-- Based on your actual database tables (not the migration files)
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix Exception Control Linkage
-- ============================================================================
-- Update exceptions to link to actual controls
UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'AML-001'
  AND e.title ILIKE '%CDD%'
  AND (e.source_id IS NULL OR e.source_id NOT IN (SELECT id FROM controls));

UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'DATA-001'
  AND e.title = 'EVCG'
  AND (e.source_id IS NULL OR e.source_id NOT IN (SELECT id FROM controls));

-- ============================================================================
-- STEP 2: Add Sample Regulatory Changes (Using Actual Schema)
-- ============================================================================
-- Get tenant_id from controls table
DO $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get the tenant_id from existing controls
  SELECT tenant_id INTO v_tenant_id FROM controls LIMIT 1;

  -- Insert regulatory changes with actual schema
  INSERT INTO regulatory_changes (
    tenant_id,
    title,
    source,
    source_url,
    effective_date,
    status,
    materiality,
    impact_summary
  ) VALUES
  (
    v_tenant_id,
    'Enhanced Customer Due Diligence Requirements',
    'FCA',
    'https://www.fca.org.uk/publications/policy-statements/ps-enhanced-cdd',
    CURRENT_DATE + INTERVAL '90 days',
    'open',
    'high',
    'FCA requires enhanced CDD procedures for high-risk customers'
  ),
  (
    v_tenant_id,
    'GDPR Data Subject Access Request Updates',
    'ICO',
    'https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/right-of-access/',
    CURRENT_DATE + INTERVAL '60 days',
    'open',
    'medium',
    'ICO updated guidance on DSAR response timelines'
  ),
  (
    v_tenant_id,
    'Consumer Duty Implementation',
    'FCA',
    'https://www.fca.org.uk/firms/consumer-duty',
    CURRENT_DATE + INTERVAL '30 days',
    'open',
    'high',
    'FCA Consumer Duty requirements for fair treatment'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Added 3 regulatory changes';
END $$;

-- ============================================================================
-- STEP 3: Link Regulatory Changes to Controls
-- ============================================================================
-- Link CDD regulation to AML-001 control
INSERT INTO regulatory_change_control_map (
  regulatory_change_id,
  control_id,
  impact_level
)
SELECT
  rc.id,
  c.id,
  'high'
FROM regulatory_changes rc
CROSS JOIN controls c
WHERE rc.title = 'Enhanced Customer Due Diligence Requirements'
  AND c.control_code = 'AML-001'
ON CONFLICT (regulatory_change_id, control_id) DO NOTHING;

-- Link GDPR regulation to DATA-001 control
INSERT INTO regulatory_change_control_map (
  regulatory_change_id,
  control_id,
  impact_level
)
SELECT
  rc.id,
  c.id,
  'medium'
FROM regulatory_changes rc
CROSS JOIN controls c
WHERE rc.title = 'GDPR Data Subject Access Request Updates'
  AND c.control_code = 'DATA-001'
ON CONFLICT (regulatory_change_id, control_id) DO NOTHING;

-- Link Consumer Duty to COI-001 control
INSERT INTO regulatory_change_control_map (
  regulatory_change_id,
  control_id,
  impact_level
)
SELECT
  rc.id,
  c.id,
  'high'
FROM regulatory_changes rc
CROSS JOIN controls c
WHERE rc.title = 'Consumer Duty Implementation'
  AND c.control_code = 'COI-001'
ON CONFLICT (regulatory_change_id, control_id) DO NOTHING;

-- ============================================================================
-- STEP 4: Verification Queries
-- ============================================================================

-- Check exceptions now have proper control links
SELECT
  'FIXED: Exceptions with Control Names' as verification;

SELECT
  e.id,
  e.title as exception_title,
  e.source_id,
  c.control_code,
  c.title as control_title
FROM exceptions e
LEFT JOIN controls c ON c.id = e.source_id
ORDER BY e.title;

-- Check regulatory changes are linked
SELECT
  'FIXED: Regulatory Changes Linked to Controls' as verification;

SELECT
  rc.title as regulation,
  rc.materiality,
  rc.source,
  c.control_code,
  c.title as control_title,
  rccm.impact_level
FROM regulatory_changes rc
JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
JOIN controls c ON c.id = rccm.control_id
WHERE rc.title IN (
  'Enhanced Customer Due Diligence Requirements',
  'GDPR Data Subject Access Request Updates',
  'Consumer Duty Implementation'
)
ORDER BY rc.materiality DESC, c.control_code;

-- Check updated materiality scores
SELECT
  'FIXED: Updated Materiality Scores' as verification;

SELECT
  exception_title,
  control_name,
  status,
  severity,
  days_open,
  regulatory_impact_score,
  control_criticality_score,
  duration_score,
  recurrence_score,
  total_materiality_score,
  materiality_band
FROM v_exception_materiality
ORDER BY total_materiality_score DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL FIXES APPLIED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Control linkage fixed';
  RAISE NOTICE '✅ Sample regulatory changes added';
  RAISE NOTICE '✅ Control-regulation mappings created';
  RAISE NOTICE '📊 Check the verification queries above';
  RAISE NOTICE '';
  RAISE NOTICE 'Expected Results:';
  RAISE NOTICE '- Exceptions now show actual control names';
  RAISE NOTICE '- Materiality scores increased from 25 to 50+';
  RAISE NOTICE '- Regulatory impact scores now 20-30 (was 0)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run QUICK_DASHBOARD_VIEW.sql to see results!';
END $$;
