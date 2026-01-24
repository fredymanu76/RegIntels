-- ============================================================================
-- FIX INFINITE RECURSION IN PLATFORM_ADMINS RLS POLICY
-- ============================================================================
-- The "infinite recursion detected in policy" error happens when there are
-- conflicting RLS policies that reference each other
--
-- SOLUTION: Drop ALL policies and recreate with simpler, non-recursive logic
-- ============================================================================

-- Step 1: Drop ALL existing policies on platform_admins
DROP POLICY IF EXISTS "Users can view their own platform admin status" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can view all platform admins" ON public.platform_admins;
DROP POLICY IF EXISTS "Platform admins can insert new platform admins" ON public.platform_admins;

-- Step 2: Create ONLY the essential policy for login
-- This allows any authenticated user to check if THEY are a platform admin
CREATE POLICY "Allow users to check own platform admin status"
  ON public.platform_admins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Step 3: Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'platform_admins'
ORDER BY policyname;

-- Expected result: Should show ONLY 1 policy:
-- "Allow users to check own platform admin status"

-- ============================================================================
-- WHY THIS FIXES THE INFINITE RECURSION:
-- ============================================================================
-- OLD PROBLEM:
-- - Policy 1: "You can view platform_admins if you're IN platform_admins"
-- - Policy 2: "You can view your own row"
-- - PostgreSQL tries Policy 1 → checks platform_admins → triggers Policy 1 again → infinite loop
--
-- NEW SOLUTION:
-- - Only ONE policy: "You can ONLY view YOUR OWN row where auth.uid() = user_id"
-- - No recursion because it doesn't check the table, just compares auth.uid() to a column
-- - Platform admins can't see OTHER platform admins (which is fine for login)
-- ============================================================================

-- Test the policy (run this AFTER creating the policy above)
-- This should return 1 row if logged in as a platform admin
SELECT * FROM platform_admins WHERE user_id = auth.uid();
