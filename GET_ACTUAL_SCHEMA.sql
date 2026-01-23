-- ============================================================================
-- RUN THIS FIRST - Get actual table schemas
-- ============================================================================

-- 1. Get ACTUAL exceptions table columns
SELECT
  'EXCEPTIONS TABLE COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exceptions'
ORDER BY ordinal_position;

-- 2. Get ACTUAL tenants table columns
SELECT
  'TENANTS TABLE COLUMNS:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tenants'
ORDER BY ordinal_position;

-- 3. Sample from exceptions to see actual data
SELECT
  'SAMPLE EXCEPTIONS DATA:' as info,
  *
FROM exceptions
LIMIT 2;
