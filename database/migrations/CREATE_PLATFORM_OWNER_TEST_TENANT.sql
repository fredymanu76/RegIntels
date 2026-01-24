-- ============================================================================
-- CREATE PLATFORM OWNER TEST TENANT
-- ============================================================================
-- This allows platform owner to test features before deploying to all tenants
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Create a special "Platform Test" tenant
INSERT INTO public.tenants (
  name,
  regime,
  frn,
  status,
  contact_email,
  created_by,
  approved_by,
  approved_at,
  activated_at
)
SELECT
  'RegIntels Platform Testing',
  'Multi-Jurisdiction',
  'PLATFORM-TEST-001',
  'active',
  'fredymanu76@gmail.com',
  id,
  id,
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'fredymanu76@gmail.com'
ON CONFLICT DO NOTHING
RETURNING id;

-- Step 2: Add platform owner as user in the test tenant
INSERT INTO public.user_profiles (
  user_id,
  tenant_id,
  email,
  full_name,
  role,
  department,
  is_active
)
SELECT
  u.id,
  t.id,
  'fredymanu76@gmail.com',
  'Platform Owner (Test Access)',
  'Admin',
  'Platform Development',
  true
FROM auth.users u
CROSS JOIN public.tenants t
WHERE u.email = 'fredymanu76@gmail.com'
  AND t.name = 'RegIntels Platform Testing'
ON CONFLICT (user_id, tenant_id) DO UPDATE
SET is_active = true;

-- Step 3: Verify the setup
SELECT
  t.name as tenant_name,
  t.status,
  up.email,
  up.role,
  up.is_active
FROM public.tenants t
JOIN public.user_profiles up ON up.tenant_id = t.id
WHERE t.name = 'RegIntels Platform Testing';

-- ============================================================================
-- RESULT: You can now log in and select "RegIntels Platform Testing" tenant
-- This tenant is for testing new features before rolling out to all tenants
-- ============================================================================
