-- ============================================================================
-- CHECK PRODUCTION DATABASE SCHEMA
-- ============================================================================
-- Run this to see what tables actually exist in your production database
-- ============================================================================

-- 1. List all tables in the public schema
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Check if exceptions table exists in any schema
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE tablename = 'exceptions';

-- 3. List all schemas in the database
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

-- 4. If you have tenants table, let's check that
SELECT 'Checking for tenant-related tables...' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%tenant%' OR table_name LIKE '%exception%' OR table_name LIKE '%control%')
ORDER BY table_name;
