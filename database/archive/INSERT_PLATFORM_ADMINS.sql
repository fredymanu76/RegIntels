-- ============================================================================
-- INSERT PLATFORM ADMINS - EASY VERSION
-- ============================================================================
-- This script automatically looks up user IDs from auth.users table by email
-- Just run this after the main migration completes

-- Insert Platform Owner (Super Admin) - fredymanu76@gmail.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'fredymanu76@gmail.com',
  'Platform Owner (Super Admin)',
  true
FROM auth.users
WHERE email = 'fredymanu76@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- Insert Additional Platform Admin - info@fymcompliancelimited.com
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
SELECT
  id,
  'info@fymcompliancelimited.com',
  'Platform Administrator',
  true
FROM auth.users
WHERE email = 'info@fymcompliancelimited.com'
ON CONFLICT (user_id) DO NOTHING;

-- Verify the inserts worked
SELECT
  pa.user_id,
  pa.email,
  pa.display_name,
  pa.is_active,
  pa.created_at,
  u.email as auth_email,
  u.confirmed_at
FROM public.platform_admins pa
JOIN auth.users u ON pa.user_id = u.id
ORDER BY pa.created_at DESC;
