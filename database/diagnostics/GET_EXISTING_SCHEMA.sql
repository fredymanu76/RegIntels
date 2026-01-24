-- ============================================================================
-- GET EXISTING SUPABASE SCHEMA INFORMATION
-- ============================================================================
-- Run this in Supabase SQL Editor and send me the results
-- This will help me understand your actual database structure
-- ============================================================================

-- QUERY 1: Get all existing tables
SELECT
  '=== EXISTING TABLES ===' as info,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- QUERY 2: Get all existing views
SELECT
  '=== EXISTING VIEWS ===' as info,
  table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- QUERY 3: Get detailed column information for ALL public tables
SELECT
  '=== TABLE COLUMNS ===' as info,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  )
ORDER BY table_name, ordinal_position;

-- QUERY 4: Check for any tables related to regulatory/controls/attestations
SELECT
  '=== REGULATORY/COMPLIANCE RELATED TABLES ===' as info,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND (
    table_name ILIKE '%regulat%'
    OR table_name ILIKE '%control%'
    OR table_name ILIKE '%attest%'
    OR table_name ILIKE '%complian%'
    OR table_name ILIKE '%change%'
    OR table_name ILIKE '%exception%'
  )
ORDER BY table_name;

-- QUERY 5: Get foreign key relationships
SELECT
  '=== FOREIGN KEY RELATIONSHIPS ===' as info,
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Paste into Supabase SQL Editor
-- 3. Click RUN
-- 4. Copy ALL the results
-- 5. Send the results to me
--
-- This will help me create migrations that match your actual database schema
-- ============================================================================
