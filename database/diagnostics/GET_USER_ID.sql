-- ============================================================================
-- GET USER ID FOR PLATFORM ADMIN SETUP
-- ============================================================================
-- Run this query first to get the correct user_id for your super admin account

-- Find user ID for fredymanu76@gmail.com
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'fredymanu76@gmail.com';

-- Find user ID for info@fymcompliancelimited.com
SELECT id, email, created_at, confirmed_at
FROM auth.users
WHERE email = 'info@fymcompliancelimited.com';

-- Show all users (if you need to check)
SELECT id, email, created_at, confirmed_at
FROM auth.users
ORDER BY created_at DESC;
