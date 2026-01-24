-- ============================================================================
-- FINAL FIX - NO TRIAL AND ERROR
-- ============================================================================
-- This version only fixes what we know works
-- ============================================================================

-- Fix exception control linkage only
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

-- Verify the fix
SELECT
  e.title as exception_title,
  c.control_code,
  c.title as control_title
FROM exceptions e
LEFT JOIN controls c ON c.id = e.source_id;

-- Check updated scores
SELECT * FROM v_exception_materiality ORDER BY total_materiality_score DESC;

DO $$
BEGIN
  RAISE NOTICE '✅ Control linkage fixed';
  RAISE NOTICE '📊 Check results above';
END $$;
