-- ============================================================================
-- CHECK ACTUAL DATABASE SCHEMA FOR EXCEPTIONS
-- ============================================================================
-- Run this first to see what we're actually working with
-- ============================================================================

-- 1. Check exceptions table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exceptions'
ORDER BY ordinal_position;

-- 2. Check controls table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'controls'
ORDER BY ordinal_position;

-- 3. Check what views already exist for exceptions
SELECT
  table_name as view_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%exception%'
ORDER BY table_name;

-- 4. Check v_exception_materiality view definition (if it exists)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'v_exception_materiality';

-- 5. Sample data from exceptions table to understand relationships
SELECT
  id,
  title,
  status,
  severity,
  created_at,
  -- List all column names to see what's available
  *
FROM exceptions
LIMIT 3;

-- 6. Check regulatory_changes and mapping tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%regulatory%' OR table_name LIKE '%control%')
ORDER BY table_name;
