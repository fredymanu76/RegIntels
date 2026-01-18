-- ============================================================================
-- FIX PLATFORM SUPER ADMIN ACCESS
-- ============================================================================
-- This script fixes TWO critical issues:
-- 1. RLS policy that blocks platform admin login (circular dependency)
-- 2. Ensures both platform super admins are inserted
--
-- Run this in Supabase SQL Editor to allow info@ and fredymanu76@ to login
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: FIX RLS POLICY (Critical for login)
-- ----------------------------------------------------------------------------
-- Problem: Users can't read platform_admins table during login unless they're
-- already authenticated as platform admins (circular dependency)
--
-- Solution: Allow users to check if THEY are a platform admin

-- Add policy that allows users to view their own platform admin status
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
  cmd
FROM pg_policies
WHERE tablename = 'platform_admins'
ORDER BY policyname;

-- ----------------------------------------------------------------------------
-- STEP 2: INSERT PLATFORM SUPER ADMINS
-- ----------------------------------------------------------------------------
-- Insert both platform super admins using email lookup
-- These users MUST exist in auth.users first (sign up via app or create manually)

-- Super Admin 1: info@fymcompliancelimited.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'info@fymcompliancelimited.com',
  'Platform Administrator',
  true
FROM auth.users
WHERE email = 'info@fymcompliancelimited.com'
ON CONFLICT (user_id) DO UPDATE
  SET is_active = true,
      display_name = 'Platform Administrator';

-- Super Admin 2: fredymanu76@gmail.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'fredymanu76@gmail.com',
  'Platform Owner (Super Admin)',
  true
FROM auth.users
WHERE email = 'fredymanu76@gmail.com'
ON CONFLICT (user_id) DO UPDATE
  SET is_active = true,
      display_name = 'Platform Owner (Super Admin)';

-- ----------------------------------------------------------------------------
-- STEP 3: VERIFY PLATFORM ADMINS
-- ----------------------------------------------------------------------------
-- Check which platform admins were successfully inserted
SELECT
  pa.user_id,
  pa.email,
  pa.display_name,
  pa.is_active,
  pa.created_at,
  u.email as auth_email,
  u.confirmed_at,
  CASE
    WHEN u.id IS NULL THEN '❌ User does not exist in auth.users - SIGN UP REQUIRED'
    WHEN pa.user_id IS NULL THEN '❌ Not in platform_admins table'
    ELSE '✅ Ready to login'
  END as status
FROM auth.users u
RIGHT JOIN public.platform_admins pa ON u.id = pa.user_id
WHERE pa.email IN ('info@fymcompliancelimited.com', 'fredymanu76@gmail.com')
UNION ALL
SELECT
  u.id,
  u.email,
  NULL,
  NULL,
  u.created_at,
  u.email,
  u.confirmed_at,
  '⚠️ User exists in auth.users but not in platform_admins - INSERT will add them'
FROM auth.users u
WHERE u.email IN ('info@fymcompliancelimited.com', 'fredymanu76@gmail.com')
  AND u.id NOT IN (SELECT user_id FROM public.platform_admins WHERE email IN ('info@fymcompliancelimited.com', 'fredymanu76@gmail.com'))
ORDER BY email;

-- ----------------------------------------------------------------------------
-- STEP 4: CHECK IF USERS EXIST IN AUTH.USERS
-- ----------------------------------------------------------------------------
-- This shows which users need to be created before they can be platform admins
SELECT
  email,
  CASE
    WHEN id IS NOT NULL THEN '✅ User exists - can be added to platform_admins'
    ELSE '❌ User DOES NOT exist - must sign up or be manually created'
  END as status,
  id as user_id,
  confirmed_at
FROM auth.users
WHERE email IN ('info@fymcompliancelimited.com', 'fredymanu76@gmail.com')
UNION ALL
SELECT
  'info@fymcompliancelimited.com' as email,
  '❌ User DOES NOT exist - must sign up or be manually created' as status,
  NULL as user_id,
  NULL as confirmed_at
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'info@fymcompliancelimited.com')
UNION ALL
SELECT
  'fredymanu76@gmail.com' as email,
  '❌ User DOES NOT exist - must sign up or be manually created' as status,
  NULL as user_id,
  NULL as confirmed_at
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'fredymanu76@gmail.com');

-- ============================================================================
-- WHAT TO DO NEXT:
-- ============================================================================
--
-- 1. If fredymanu76@gmail.com shows "User DOES NOT exist":
--    Option A: Sign up via the app at http://localhost:3000
--    Option B: Create manually in Supabase Dashboard → Authentication → Users
--             Click "Add User", enter email and password
--
-- 2. After both users exist in auth.users, re-run the INSERT statements above
--
-- 3. Restart your React app:
--    npm start
--
-- 4. Try logging in with:
--    - info@fymcompliancelimited.com (should work immediately after RLS fix)
--    - fredymanu76@gmail.com (after creating the user in auth.users)
--
-- 5. Expected result:
--    - Login succeeds
--    - See ONLY "Platform Admin" in sidebar
--    - Two pages: Platform Metrics, Tenant Approvals
--    - NO tenant solutions (Solution 1-5)
--
-- ============================================================================
