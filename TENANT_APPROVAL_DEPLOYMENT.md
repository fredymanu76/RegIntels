# Tenant Approval System - Deployment Guide

## Overview

This guide walks you through deploying the complete Tenant Approval System for RegIntels, which includes:

1. **Database Schema** - Platform admins table, extended tenants table, RLS policies
2. **RPC Functions** - `approve_tenant()` function for secure approval workflow
3. **Database Trigger** - Auto-activation and webhook notification on approval
4. **Edge Function** - Email notification service using Resend
5. **Admin Dashboard** - React UI for platform administrators

---

## Prerequisites

Before starting, ensure you have:

- ✅ Supabase project created (Project Ref: `cnyvjuxmkpzxnztbbydu`)
- ✅ Supabase CLI installed (`npm install -g supabase`)
- ✅ Resend account created (https://resend.com)
- ✅ Verified sender domain in Resend
- ✅ Node.js and npm installed
- ✅ Git access to the RegIntels repository

---

## Step 1: Deploy Database Migration

### 1.1 Get Your Supabase Project Reference

Your project reference is: **cnyvjuxmkpzxnztbbydu**

You can verify this in Supabase Dashboard → Settings → General → Reference ID

### 1.2 Update the SQL Migration File

Open `supabase/migrations/002_tenant_approval_system.sql` and replace the placeholder:

**Line 180:** Replace `<PROJECT_REF>` with your actual project reference:

```sql
-- BEFORE:
DECLARE
  v_project_ref TEXT := '<PROJECT_REF>';

-- AFTER:
DECLARE
  v_project_ref TEXT := 'cnyvjuxmkpzxnztbbydu';
```

### 1.3 Generate a Webhook Secret

Generate a secure webhook secret (this will be used by the database trigger to authenticate with the Edge Function):

```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Save this secret** - you'll need it in multiple places. Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

**Line 209:** Replace `your-secure-webhook-secret-here` with your generated secret:

```sql
-- BEFORE:
ALTER DATABASE postgres SET app.webhook_secret = 'your-secure-webhook-secret-here';

-- AFTER:
ALTER DATABASE postgres SET app.webhook_secret = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
```

### 1.4 Add Yourself as First Platform Admin

Uncomment and update lines 220-227 to add yourself as the first platform admin.

**First, get your auth.users ID:**

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user account
3. Copy the UUID from the "ID" column

**Then update the SQL:**

```sql
-- BEFORE (commented out):
-- INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
-- VALUES (
--   'YOUR-AUTH-USER-ID-HERE'::UUID,
--   'admin@example.com',
--   'Platform Administrator',
--   true
-- )
-- ON CONFLICT (user_id) DO NOTHING;

-- AFTER (uncommented and filled in):
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  '12345678-1234-1234-1234-123456789abc'::UUID,
  'your-email@example.com',
  'Your Name',
  true
)
ON CONFLICT (user_id) DO NOTHING;
```

### 1.5 Run the Migration

1. Open Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/002_tenant_approval_system.sql`
4. Paste into the SQL Editor
5. Click "Run"
6. Verify you see "Success. No rows returned" (or similar success message)

**Expected Output:**
- ✅ `platform_admins` table created
- ✅ `tenants` table columns added (created_by, contact_email, approved_by, approved_at, activated_at)
- ✅ RLS policies created
- ✅ `approve_tenant()` RPC function created
- ✅ `notify_tenant_approved()` trigger function created
- ✅ `trigger_tenant_approved` trigger created
- ✅ `pg_net` extension enabled
- ✅ You added as platform admin

---

## Step 2: Deploy Supabase Edge Function

### 2.1 Login to Supabase CLI

```bash
supabase login
```

Follow the prompts to authenticate.

### 2.2 Link Your Project

```bash
supabase link --project-ref cnyvjuxmkpzxnztbbydu
```

### 2.3 Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "RegIntels Production"
4. Permission: "Sending access"
5. Copy the API key (starts with `re_`)

**Save this key** - you won't be able to see it again!

### 2.4 Set Edge Function Secrets

```bash
# Set webhook secret (MUST match the one in Step 1.3)
supabase secrets set WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# Set Resend API key
supabase secrets set RESEND_API_KEY=re_YourActualResendAPIKey

# Set sender email (must be verified in Resend)
supabase secrets set FROM_EMAIL=noreply@yourdomain.com

# Optional: Set custom app URL (defaults to https://app.regintels.com)
supabase secrets set APP_URL=https://yourdomain.com
```

**Verify secrets were set:**

```bash
supabase secrets list
```

You should see:
- WEBHOOK_SECRET
- RESEND_API_KEY
- FROM_EMAIL
- APP_URL (optional)

### 2.5 Deploy the Edge Function

```bash
cd C:\Users\dbnew\Desktop\regintels-app
supabase functions deploy send-tenant-approved
```

**Expected Output:**
```
Deploying send-tenant-approved (project ref: cnyvjuxmkpzxnztbbydu)
Function URL: https://cnyvjuxmkpzxnztbbydu.supabase.co/functions/v1/send-tenant-approved
```

### 2.6 Test the Edge Function

```bash
curl -i --location --request POST 'https://cnyvjuxmkpzxnztbbydu.supabase.co/functions/v1/send-tenant-approved' \
  --header 'Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6' \
  --header 'Content-Type: application/json' \
  --data '{
    "tenant_id": "test-123",
    "tenant_name": "Test Firm Ltd",
    "contact_email": "test@example.com",
    "regime": "FCA",
    "frn": "123456",
    "approved_at": "2025-01-17T10:00:00Z",
    "activated_at": "2025-01-17T10:00:01Z"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "message": "Tenant approval email sent successfully",
  "tenant_id": "test-123",
  "tenant_name": "Test Firm Ltd",
  "email_id": "abc123...",
  "sent_to": "test@example.com",
  "sent_at": "2025-01-17T10:00:02.123Z"
}
```

Check your test email inbox - you should receive the welcome email!

---

## Step 3: Deploy React Application Updates

The React application code has already been updated with:
- ✅ Platform admin detection in `loadUserData()`
- ✅ "Platform Admin" solution added to navigation
- ✅ `TenantApprovalsPage` component created
- ✅ Page routing updated

### 3.1 Verify Environment Variables

Ensure `.env` file exists with your Supabase credentials:

```env
REACT_APP_SUPABASE_URL=https://cnyvjuxmkpzxnztbbydu.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Restart Development Server

```bash
npm start
```

**IMPORTANT:** You MUST restart the server for changes to take effect!

### 3.3 Verify the UI

1. Log in with your platform admin account
2. You should see a new "Platform Admin" solution in the sidebar
3. Click "Platform Admin" → "Tenant Approvals"
4. You should see the Tenant Approvals page

---

## Step 4: Test the Complete Workflow

### 4.1 Create a Test Tenant (Simulate Onboarding)

1. Open a new incognito/private browser window
2. Go to your RegIntels app
3. Click "Start Onboarding"
4. Fill in the onboarding form:
   - Organization Name: "Test Approval Flow Ltd"
   - Regulatory Regime: FCA
   - FRN: 999999
   - Contact Email: your-test-email@example.com
5. Complete onboarding

**Expected Result:** Tenant created with `status = 'pending_verification'`

### 4.2 Verify Tenant Appears in Admin Dashboard

1. In your main browser (logged in as platform admin)
2. Go to Platform Admin → Tenant Approvals
3. You should see "Test Approval Flow Ltd" in the pending list

### 4.3 Approve the Tenant

1. Click the "Approve" button
2. Confirm the approval dialog
3. **Expected Results:**
   - ✅ Success banner: "Tenant approved successfully! Welcome email sent."
   - ✅ Tenant disappears from pending list (status changed to 'active')
   - ✅ Email sent to your-test-email@example.com

### 4.4 Verify the Email

Check the inbox for `your-test-email@example.com`:

- ✅ Subject: "✅ Your RegIntels Account Has Been Activated - Test Approval Flow Ltd"
- ✅ Body contains organization details
- ✅ "Access RegIntels Dashboard" button present

### 4.5 Verify Database Changes

Go to Supabase Dashboard → Table Editor → `tenants` table:

Find "Test Approval Flow Ltd" and verify:
- ✅ `status` = 'active' (NOT 'approved' or 'pending_verification')
- ✅ `approved_by` = your user_id
- ✅ `approved_at` = timestamp
- ✅ `activated_at` = timestamp (same or slightly after approved_at)

---

## Step 5: Production Deployment

### 5.1 Commit and Push Changes

```bash
git add .
git commit -m "feat: implement tenant approval system with admin dashboard, email notifications, and auto-activation"
git push origin fix/policy-endpoints
```

### 5.2 Deploy to Hosting Platform

**For Vercel/Netlify:**

1. Set environment variables in hosting platform:
   - `REACT_APP_SUPABASE_URL` = https://cnyvjuxmkpzxnztbbydu.supabase.co
   - `REACT_APP_SUPABASE_ANON_KEY` = your-anon-key

2. Deploy the application

3. Verify Edge Function webhook URL in production

**For Custom Hosting:**

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `build/` directory

3. Ensure environment variables are set on the server

### 5.3 Update Resend Sender Domain (if needed)

If using a custom domain:

1. Go to Resend Dashboard → Domains
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Verify domain
5. Update Edge Function secret:
   ```bash
   supabase secrets set FROM_EMAIL=noreply@yourcustomdomain.com
   ```

---

## Troubleshooting

### Issue: Platform Admin solution not showing in sidebar

**Solution:**
1. Verify you're in the `platform_admins` table:
   ```sql
   SELECT * FROM platform_admins WHERE user_id = 'your-user-id';
   ```
2. Check `is_active = true`
3. Reload the page (hard refresh: Ctrl+Shift+R)

### Issue: "Failed to approve tenant" error

**Solution:**
1. Check browser console for detailed error
2. Verify `approve_tenant` RPC exists:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'approve_tenant';
   ```
3. Check RLS policies allow platform admins to update tenants

### Issue: Email not sent after approval

**Solution:**
1. Check Supabase Edge Function logs:
   - Dashboard → Edge Functions → send-tenant-approved → Logs
2. Verify webhook secret matches in both migration and Edge Function secrets
3. Check pg_net extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```
4. Verify trigger fired:
   ```sql
   SELECT * FROM pg_stat_user_functions WHERE funcname = 'notify_tenant_approved';
   ```

### Issue: "Invalid token" when Edge Function is called

**Solution:**
1. Verify WEBHOOK_SECRET in Edge Function matches app.webhook_secret:
   ```sql
   SHOW app.webhook_secret;
   ```
2. Re-deploy Edge Function with correct secret:
   ```bash
   supabase secrets set WEBHOOK_SECRET=correct-secret-here
   supabase functions deploy send-tenant-approved
   ```

### Issue: Email bounces or not delivered

**Solution:**
1. Verify sender domain in Resend Dashboard
2. Check DNS records (SPF, DKIM, DMARC)
3. Verify FROM_EMAIL matches verified domain
4. Check Resend Dashboard → Emails for delivery status

---

## Security Checklist

Before going to production:

- [ ] Webhook secret is strong (32+ characters, random)
- [ ] Resend API key is kept secure (not in code)
- [ ] RLS policies tested and working
- [ ] Platform admin access restricted to authorized users only
- [ ] HTTPS enabled on all endpoints
- [ ] Environment variables not committed to Git
- [ ] Email templates reviewed (no hardcoded secrets)
- [ ] Audit trail logging verified
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting configured on Edge Function (if needed)

---

## Maintenance

### Adding New Platform Admins

```sql
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  'user-uuid-here'::UUID,
  'admin@example.com',
  'Admin Name',
  true
)
ON CONFLICT (user_id) DO NOTHING;
```

### Removing Platform Admin Access

```sql
UPDATE public.platform_admins
SET is_active = false
WHERE user_id = 'user-uuid-here';
```

### Viewing Approval History

```sql
SELECT
  t.name AS tenant_name,
  t.regime,
  t.frn,
  t.contact_email,
  t.approved_at,
  t.activated_at,
  pa.email AS approved_by_email,
  pa.display_name AS approved_by_name
FROM tenants t
LEFT JOIN platform_admins pa ON t.approved_by = pa.user_id
WHERE t.status = 'active'
ORDER BY t.approved_at DESC;
```

---

## File Reference

**SQL Migration:**
- `supabase/migrations/002_tenant_approval_system.sql`

**Edge Function:**
- `supabase/functions/send-tenant-approved/index.ts`

**React Components:**
- `src/App.js` (lines 567-601: loadUserData with admin check)
- `src/App.js` (lines 683-689: Platform Admin solution config)
- `src/App.js` (lines 692-703: hasAccess function with admin check)
- `src/App.js` (lines 899: TenantApprovalsPage route)
- `src/App.js` (lines 1379-1583: TenantApprovalsPage component)

**Environment:**
- `.env` (Supabase credentials)

---

## Support

If you encounter issues not covered in this guide:

1. Check Supabase Dashboard → Logs for detailed error messages
2. Review browser console (F12) for client-side errors
3. Test each component individually (database, Edge Function, UI)
4. Verify all secrets and environment variables are correct
5. Check RLS policies are not blocking operations

---

**Deployment Completed:** 2025-01-17

**Next Steps:** Test the complete workflow in production and monitor the first real approvals!
