-- ============================================================================
-- GET COMPLETE SUPABASE SCHEMA
-- ============================================================================
-- Run this to get your actual table structures

-- 1. Get all table names
SELECT
  'TABLE: ' || table_name as info,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Get exceptions table structure
SELECT
  'EXCEPTIONS TABLE COLUMNS:' as section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exceptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Get evidence table structure
SELECT
  'EVIDENCE TABLE COLUMNS:' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'evidence'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Get control-related tables
SELECT
  'CONTROL TABLES:' as section,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%control%'
ORDER BY table_name;

-- 5. Get foreign keys from exceptions
SELECT
  'EXCEPTIONS FOREIGN KEYS:' as section,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'exceptions';

-- 6. Sample data from exceptions (first 5 rows)
SELECT
  'SAMPLE EXCEPTIONS DATA:' as section,
  *
FROM exceptions
LIMIT 5;
