-- ============================================================================
-- URGENT FIX - PLATFORM OWNER LOGIN
-- ============================================================================
-- This will IMMEDIATELY fix login for:
-- - info@fymcompliancelimited.com
-- - fredymanu76@gmail.com
--
-- BOTH users already exist in auth.users (verified in screenshot)
-- BOTH users are in platform_admins table (verified by query)
-- BUT login fails because RLS policy blocks the query
--
-- THIS FIX: Add RLS policy to allow users to check their OWN platform_admin status
-- ============================================================================

-- STEP 1: Add the missing RLS policy
DROP POLICY IF EXISTS "Users can view their own platform admin status" ON public.platform_admins;
CREATE POLICY "Users can view their own platform admin status"
  ON public.platform_admins FOR SELECT
  USING (auth.uid() = user_id);

-- STEP 2: Verify all policies exist
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'platform_admins'
ORDER BY policyname;

-- Expected result: You should see 3 policies:
-- 1. Platform admins can insert new platform admins
-- 2. Platform admins can view all platform admins
-- 3. Users can view their own platform admin status  ← NEW!

-- STEP 3: Verify both platform admins are in the table
SELECT
  user_id,
  email,
  display_name,
  is_active,
  created_at
FROM public.platform_admins
WHERE email IN ('info@fymcompliancelimited.com', 'fredymanu76@gmail.com')
ORDER BY email;

-- Expected result: 2 rows
-- info@fymcompliancelimited.com
-- fredymanu76@gmail.com

-- ============================================================================
-- AFTER RUNNING THIS:
-- ============================================================================
-- 1. Go to http://localhost:3000
-- 2. Open browser console (F12)
-- 3. Login with info@fymcompliancelimited.com or fredymanu76@gmail.com
-- 4. Watch the console logs - should see:
--    [LOGIN] Checking if user is platform admin: <user_id>
--    [LOGIN] Platform admin query result: {email: "...", display_name: "..."}
--    [LOGIN] ✅ User IS a platform admin, deferring to auth state listener
--    [LOAD_USER_DATA] ✅ User IS platform admin, logging in as platform owner
--    [LOAD_USER_DATA] ✅ Platform owner login complete
-- 5. Should see Platform Admin dashboard with Platform Metrics and Tenant Approvals
--
-- IF YOU STILL SEE ERRORS IN CONSOLE:
-- - Look for "[LOGIN] ❌ Platform admin query failed"
-- - This means RLS policy wasn't created - re-run this SQL
-- ============================================================================
