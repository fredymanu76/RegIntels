-- ============================================================================
-- GET ALL KEY TABLE COLUMNS IN ONE QUERY
-- ============================================================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'regulatory_changes',
    'control_library',
    'exceptions',
    'remediation_actions',
    'regulatory_change_control_map',
    'control_runs'
  )
ORDER BY
  CASE table_name
    WHEN 'regulatory_changes' THEN 1
    WHEN 'control_library' THEN 2
    WHEN 'regulatory_change_control_map' THEN 3
    WHEN 'control_runs' THEN 4
    WHEN 'exceptions' THEN 5
    WHEN 'remediation_actions' THEN 6
  END,
  ordinal_position;

-- ============================================================================
-- This will show all columns for the 6 most important tables
-- ============================================================================
