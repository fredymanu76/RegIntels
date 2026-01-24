-- ============================================================================
-- COMPLETE FIX - One final command
-- ============================================================================

-- Fix EVGG to link to DATA-001 control
UPDATE exceptions e
SET source_id = c.id
FROM controls c
WHERE c.control_code = 'DATA-001'
  AND e.title = 'EVGG'
  AND e.source_id IS NULL;

-- Verify both exceptions are now linked
SELECT
  e.title as exception_title,
  c.control_code,
  c.title as control_title,
  e.source_id
FROM exceptions e
LEFT JOIN controls c ON c.id = e.source_id
ORDER BY e.title;

-- Check final scores
SELECT
  exception_title,
  control_name,
  status,
  total_materiality_score,
  materiality_band
FROM v_exception_materiality
ORDER BY exception_title;

DO $$
BEGIN
  RAISE NOTICE '✅ EVGG linked to DATA-001';
  RAISE NOTICE '✅ Both exceptions now have controls';
END $$;
