# Platform Admin (Super Admin) Setup Guide

## Overview

This guide sets up the Platform Owner/Super Admin system for RegIntels. The platform owner (fredymanu76@gmail.com) can:

✅ Approve/suspend/delete tenant subscriptions
✅ View platform-wide metrics (total tenants, active tenants, pending approvals)
✅ Manage tenant approvals through admin dashboard
❌ **CANNOT** access individual tenant data (maintains white-label privacy)

## Architecture

### Two Types of Users:

1. **Platform Owner (Super Admin)** - `fredymanu76@gmail.com`
   - Listed in `platform_admins` table
   - NO `user_profile` or tenant association
   - Can only access "Platform Admin" solution
   - Views: Platform Metrics, Tenant Approvals

2. **Tenant Users** - All other users
   - Have `user_profile` linked to a tenant
   - Access tenant-specific solutions (Solution 1-5)
   - Each tenant has their own admin
   - White-labeled experience

---

## Changes Made

### 1. Migration File (`002_tenant_approval_system.sql`)

**Updated lines 273-290:**
```sql
-- Super Admin (Platform Owner)
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  '7ef6b5dd-d297-475f-a2d5-8a5eee9f9d4b'::UUID,
  'fredymanu76@gmail.com',
  'Platform Owner (Super Admin)',
  true
)
ON CONFLICT (user_id) DO NOTHING;

-- Additional Platform Admin (optional)
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  'ceda3fb9-cd7f-4634-902b-194f36f7936d'::UUID,
  'info@fymcompliancelimited.com',
  'Platform Administrator',
  true
)
ON CONFLICT (user_id) DO NOTHING;
```

### 2. App.js - Login Logic

**Modified `loadUserData()` function:**
- FIRST checks if user is in `platform_admins` table
- If yes: Login WITHOUT requiring `user_profile` or tenant
- If no: Regular tenant user login flow

**Modified `handleLogin()` in LoginPage:**
- Detects platform admins and skips tenant validation
- Auth state listener handles platform admin login

### 3. App.js - Dashboard Access

**Modified `hasAccess()` function:**
- Platform owners can ONLY access `isPlatformAdminOnly` solutions
- Regular users CANNOT access platform admin solutions
- Maintains strict separation between platform and tenant views

### 4. New Platform Metrics Page

**Features:**
- Total Tenants count
- Active Tenants count
- Pending Approval count
- Suspended Tenants count
- Total Users count
- Clear "Platform Owner View" notice

---

## Deployment Steps

### Step 1: Run the Migration in Supabase

1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/cnyvjuxmkpzxnztbbydu/sql/new

2. Copy the ENTIRE contents of:
   ```
   C:\Users\dbnew\Desktop\regintels-app\supabase\migrations\002_tenant_approval_system.sql
   ```

3. Paste into SQL Editor

4. Click **"Run"**

5. Verify platform admins were created:
   ```sql
   SELECT * FROM platform_admins;
   ```

Expected result:
```
| user_id                              | email                          | display_name                   | is_active |
|--------------------------------------|--------------------------------|-------------------------------|-----------|
| 7ef6b5dd-d297-475f-a2d5-8a5eee9f9d4b | fredymanu76@gmail.com          | Platform Owner (Super Admin)  | true      |
| ceda3fb9-cd7f-4634-902b-194f36f7936d | info@fymcompliancelimited.com | Platform Administrator         | true      |
```

### Step 2: Restart the React App

```bash
# If running, stop the app (Ctrl+C)
# Then restart:
npm start
```

### Step 3: Test Platform Owner Login

1. Go to `http://localhost:3000`

2. Login with:
   - Email: `fredymanu76@gmail.com`
   - Password: [Your Supabase password]

3. You should see:
   - **ONLY** "Platform Admin" in the sidebar
   - NO tenant solutions (Solution 1-5)
   - Platform Metrics page with stats
   - Tenant Approvals page

### Step 4: Test Tenant User Login

1. Logout (if logged in as platform owner)

2. Login with a tenant user:
   - Email: `info@fymcompliancelimited.com`
   - Password: [Their password]

3. You should see:
   - Solutions 1-5 in the sidebar
   - NO "Platform Admin" section
   - Tenant-specific data

---

## Testing Platform Owner Features

### Test 1: Platform Metrics
1. Login as `fredymanu76@gmail.com`
2. Click "Platform Admin" → "Platform Metrics"
3. Verify you see:
   - Total Tenants
   - Active Tenants
   - Pending Approval
   - Suspended
   - Total Users

### Test 2: Tenant Approval
1. Create a new tenant via onboarding (Start Onboarding button)
2. Complete the onboarding form
3. Logout and login as `fredymanu76@gmail.com`
4. Go to "Platform Admin" → "Tenant Approvals"
5. Find the pending tenant
6. Click "Approve"
7. Tenant should be auto-activated
8. User should receive approval email (via Resend)

### Test 3: Privacy Check
1. Login as platform owner
2. Verify you CANNOT see any tenant-specific data
3. Verify you can only see aggregated metrics
4. Try to access Solution 1-5 → Should not be accessible

---

## Troubleshooting

### Issue: Platform owner can't login - "User profile not found"

**Solution:** The migration hasn't been run. Run the migration in Supabase SQL Editor.

### Issue: Platform owner sees tenant solutions

**Solution:** Check `is_platform_owner` flag is set. Run:
```sql
SELECT * FROM platform_admins WHERE email = 'fredymanu76@gmail.com';
```

### Issue: Regular tenant user sees Platform Admin menu

**Solution:** User shouldn't be in `platform_admins` table. Remove them:
```sql
DELETE FROM platform_admins WHERE email = 'regular-user@example.com';
```

### Issue: Error during migration

**Solution:** If you've already run parts of the migration:
```sql
-- Check what exists
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'platform_admins';

-- If table exists, just run the INSERT statements:
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  '7ef6b5dd-d297-475f-a2d5-8a5eee9f9d4b'::UUID,
  'fredymanu76@gmail.com',
  'Platform Owner (Super Admin)',
  true
)
ON CONFLICT (user_id) DO NOTHING;
```

---

## Key Security Features

✅ **Tenant Data Isolation** - Platform owners cannot access tenant data
✅ **Role-Based Access** - Strict separation between platform and tenant views
✅ **RLS Policies** - Database-level security prevents unauthorized access
✅ **White-Label Support** - Each tenant has independent experience
✅ **Approval Workflow** - Platform owner must approve before tenant activation

---

## Files Modified

1. `supabase/migrations/002_tenant_approval_system.sql` - Added platform admin INSERTs
2. `src/App.js` - Updated login logic, dashboard access, added Platform Metrics page

---

## Next Steps

After successful deployment:

1. ✅ Test platform owner login
2. ✅ Test tenant approval workflow
3. ✅ Verify tenant data isolation
4. ✅ Deploy Edge Function for email notifications (see QUICK_DEPLOY_COMMANDS.md)
5. ✅ Configure Resend API for approval emails

---

**Status:** ✅ Implementation Complete
**Next Step:** Run migration in Supabase SQL Editor and test login
