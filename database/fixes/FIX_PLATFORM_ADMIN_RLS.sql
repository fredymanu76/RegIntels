-- ============================================================================
-- FIX PLATFORM ADMIN RLS POLICY
-- ============================================================================
-- This fixes the "User profile not found" error for platform admins
--
-- PROBLEM: The RLS policy only allowed platform admins to view platform_admins table
-- But during LOGIN, users aren't authenticated as platform admins yet!
-- This created a circular dependency.
--
-- SOLUTION: Add a policy that allows users to check if THEY are a platform admin
-- ============================================================================

-- Allow authenticated users to check if THEY are a platform admin (needed for login)
DROP POLICY IF EXISTS "Users can view their own platform admin status" ON public.platform_admins;
CREATE POLICY "Users can view their own platform admin status"
  ON public.platform_admins FOR SELECT
  USING (auth.uid() = user_id);

-- Verify the policy was created
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

-- Test: Check if info@fymcompliancelimited.com can see their own record
-- (Run this while logged in as info@fymcompliancelimited.com)
-- SELECT * FROM platform_admins WHERE user_id = auth.uid();
