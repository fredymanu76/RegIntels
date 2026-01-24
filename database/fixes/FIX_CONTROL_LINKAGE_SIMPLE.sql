-- ============================================================================
-- SIMPLE FIX - Control Linkage Only
-- ============================================================================
-- This version just fixes the control linkage without touching regulatory_changes
-- Run this if you're having issues with regulatory_changes table
-- ============================================================================

-- ============================================================================
-- STEP 1: Check Current Data
-- ============================================================================
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

-- Match "EVCG" to DATA-001 control
UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'DATA-001'
  AND e.title = 'EVCG'
  AND (e.source_id IS NULL OR e.source_id NOT IN (SELECT id FROM controls));

-- ============================================================================
-- STEP 3: Verify Fixed Links
-- ============================================================================
SELECT
  'FIXED: Exceptions with Control Names' as verification,
  e.id,
  e.title as exception_title,
  e.source_id,
  c.control_code,
  c.title as control_title
FROM exceptions e
LEFT JOIN controls c ON c.id = e.source_id
ORDER BY e.title;

-- ============================================================================
-- STEP 4: Check Updated Materiality Scores
-- ============================================================================
SELECT
  'Updated Exception Scores' as info,
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
  RAISE NOTICE '✅ Control linkage fixed!';
  RAISE NOTICE '📊 Check the verification queries above';
  RAISE NOTICE 'ℹ️  Note: Regulatory changes not added (table schema issue)';
  RAISE NOTICE '   To add regulations, first run: CHECK_REGULATORY_CHANGES_SCHEMA.sql';
END $$;
