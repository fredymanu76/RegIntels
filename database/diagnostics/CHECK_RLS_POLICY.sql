-- ============================================================================
-- CHECK IF RLS POLICY EXISTS
-- ============================================================================
-- Run this to verify if the "Users can view their own platform admin status"
-- policy was created
-- ============================================================================

-- Check all policies on platform_admins table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'platform_admins'
ORDER BY policyname;

-- Expected result:
-- You should see AT LEAST these 3 policies:
-- 1. "Platform admins can insert new platform admins"
-- 2. "Platform admins can view all platform admins"
-- 3. "Users can view their own platform admin status" ← THIS IS CRITICAL!

-- If you DON'T see #3, then the RLS fix hasn't been applied yet
-- and platform admin login will fail.
