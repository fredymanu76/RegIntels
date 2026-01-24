-- ============================================================================
-- FIX CONTROL LINKAGE AND ADD SAMPLE DATA
-- ============================================================================
-- This will:
-- 1. Check current exception-control linkage
-- 2. Fix any broken links
-- 3. Add sample regulatory changes
-- 4. Link regulatory changes to controls
-- 5. Verify everything works
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current Data
-- ============================================================================
-- See what we have
SELECT 'Current Exceptions' as info;
SELECT id, title, source_id, source_type FROM exceptions;

SELECT 'Current Controls' as info;
SELECT id, control_code, title FROM controls;

-- ============================================================================
-- STEP 2: Fix Exception Control Linkage
-- ============================================================================
-- Update exceptions to link to actual controls
-- Match "Late CDD completion" to AML-001 control
UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'AML-001'
  AND e.title ILIKE '%CDD%'
  AND (e.source_id IS NULL OR e.source_id NOT IN (SELECT id FROM controls));

-- Match "EVCG" to DATA-001 control (or create if needed)
UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'DATA-001'
  AND e.title = 'EVCG'
  AND (e.source_id IS NULL OR e.source_id NOT IN (SELECT id FROM controls));

-- ============================================================================
-- STEP 3: Add Sample Regulatory Changes
-- ============================================================================
-- Insert high-impact regulatory changes
INSERT INTO regulatory_changes (
  title,
  regulator,
  materiality,
  published_at,
  effective_date,
  status
) VALUES
(
  'Enhanced Customer Due Diligence Requirements',
  'FCA',
  'high',
  NOW() - INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '90 days',
  'active'
),
(
  'GDPR Data Subject Access Request Updates',
  'ICO',
  'medium',
  NOW() - INTERVAL '15 days',
  CURRENT_DATE + INTERVAL '60 days',
  'active'
),
(
  'Consumer Duty Implementation',
  'FCA',
  'high',
  NOW() - INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '30 days',
  'active'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Link Regulatory Changes to Controls
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
-- STEP 5: Add Sample Attestations
-- ============================================================================
-- Add attestations for controls
INSERT INTO attestations (
  control_id,
  change_id,
  attestor_role,
  status,
  due_date,
  notes
)
SELECT
  c.id,
  rc.id,
  'Control Owner',
  'pending',
  CURRENT_DATE + INTERVAL '14 days',
  'Quarterly attestation for ' || c.control_code
FROM controls c
CROSS JOIN regulatory_changes rc
WHERE c.control_code IN ('AML-001', 'DATA-001')
  AND rc.title = 'Enhanced Customer Due Diligence Requirements'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 6: Add Sample Actions
-- ============================================================================
-- Add remediation actions for exceptions
INSERT INTO actions (
  change_id,
  control_id,
  title,
  description,
  status,
  due_date
)
SELECT
  rc.id,
  c.id,
  'Update CDD procedures',
  'Review and update CDD procedures to comply with new FCA requirements',
  'in_progress',
  CURRENT_DATE + INTERVAL '30 days'
FROM regulatory_changes rc
CROSS JOIN controls c
WHERE rc.title = 'Enhanced Customer Due Diligence Requirements'
  AND c.control_code = 'AML-001'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Check exceptions now have proper control links
SELECT
  'FIXED: Exceptions with Control Names' as verification,
  e.title as exception_title,
  e.source_id,
  c.control_code,
  c.title as control_title
FROM exceptions e
LEFT JOIN controls c ON c.id = e.source_id
ORDER BY e.title;

-- Check regulatory changes are linked
SELECT
  'FIXED: Regulatory Changes Linked to Controls' as verification,
  rc.title as regulation,
  rc.materiality,
  c.control_code,
  c.title as control_title,
  rccm.impact_level
FROM regulatory_changes rc
JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
JOIN controls c ON c.id = rccm.control_id
ORDER BY rc.materiality DESC, c.control_code;

-- Check updated materiality scores
SELECT
  'FIXED: Updated Materiality Scores' as verification,
  exception_title,
  control_name,
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
  RAISE NOTICE '✅ Control linkage fixed!';
  RAISE NOTICE '✅ Sample regulatory changes added!';
  RAISE NOTICE '✅ Control-regulation mappings created!';
  RAISE NOTICE '✅ Sample attestations and actions added!';
  RAISE NOTICE '📊 Check the verification queries above to see the results!';
END $$;
