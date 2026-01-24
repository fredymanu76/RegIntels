-- ============================================================================
-- GET ACTUAL SCHEMA FROM PRODUCTION DATABASE
-- Run this first to see what columns ACTUALLY exist
-- ============================================================================

-- Check attestations table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'attestations'
ORDER BY ordinal_position;

-- Check if decisions table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'decisions';

-- Check if approvals table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'approvals';

-- Check if audit_logs table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'audit_logs';

-- List all public tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
