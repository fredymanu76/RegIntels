-- ============================================================================
-- GET DETAILED COLUMN INFORMATION FOR KEY TABLES
-- ============================================================================
-- This will show us the exact column names and types for tables we need
-- ============================================================================

-- Query 1: regulatory_changes columns
SELECT
  'regulatory_changes' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'regulatory_changes'
ORDER BY ordinal_position;

-- Query 2: control_library columns
SELECT
  'control_library' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'control_library'
ORDER BY ordinal_position;

-- Query 3: exceptions columns
SELECT
  'exceptions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exceptions'
ORDER BY ordinal_position;

-- Query 4: remediation_actions columns
SELECT
  'remediation_actions' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'remediation_actions'
ORDER BY ordinal_position;

-- Query 5: regulatory_change_control_map columns
SELECT
  'regulatory_change_control_map' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'regulatory_change_control_map'
ORDER BY ordinal_position;

-- Query 6: Check if attestation-related tables exist
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%attest%'
    OR table_name ILIKE '%signoff%'
    OR table_name ILIKE '%sign_off%'
    OR table_name ILIKE '%approval%'
  )
ORDER BY table_name;

-- Query 7: Check control_runs (might be used for attestations)
SELECT
  'control_runs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'control_runs'
ORDER BY ordinal_position;

-- ============================================================================
-- INSTRUCTIONS:
-- Run this query and send me the results
-- This will help me understand your exact schema and create compatible views
-- ============================================================================
