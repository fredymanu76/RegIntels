# Quick Deploy Commands - Tenant Approval System

This is a condensed command reference for deploying the Tenant Approval System. For full documentation, see `TENANT_APPROVAL_DEPLOYMENT.md`.

---

## Step 1: Update SQL Migration

**File:** `supabase/migrations/002_tenant_approval_system.sql`

**Line 205** - Project ref is already set:
```sql
v_project_ref TEXT := 'cnyvjuxmkpzxnztbbydu';
```
✅ No changes needed (already configured)

**Lines 268-275** - Add yourself as platform admin:
```sql
-- Get your user_id from Supabase Dashboard → Authentication → Users

INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  'YOUR-USER-ID-HERE'::UUID,
  'your-email@example.com',
  'Your Name',
  true
)
ON CONFLICT (user_id) DO NOTHING;
```

**Run in Supabase SQL Editor:**
1. Copy entire file contents
2. Paste in SQL Editor
3. Click "Run"

---

## Step 2: Deploy Edge Function

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref cnyvjuxmkpzxnztbbydu

# Set secrets (webhook secret is stored here for security)
supabase secrets set WEBHOOK_SECRET=zqckoNgtJP3OfGmHihFS6WBa2e9dTAjp
supabase secrets set RESEND_API_KEY=re_YourResendAPIKey
supabase secrets set FROM_EMAIL=noreply@yourdomain.com

# Verify secrets
supabase secrets list

# Deploy function
cd C:\Users\dbnew\Desktop\regintels-app
supabase functions deploy send-tenant-approved
```

---

## Step 3: Test Edge Function

```bash
# Test with webhook secret (optional - for external calls)
curl -i --location --request POST 'https://cnyvjuxmkpzxnztbbydu.supabase.co/functions/v1/send-tenant-approved' \
  --header 'Authorization: Bearer zqckoNgtJP3OfGmHihFS6WBa2e9dTAjp' \
  --header 'Content-Type: application/json' \
  --data '{
    "tenant_id": "test",
    "tenant_name": "Test Firm",
    "contact_email": "test@example.com",
    "regime": "FCA",
    "frn": "123456",
    "approved_at": "2025-01-17T10:00:00Z",
    "activated_at": "2025-01-17T10:00:01Z"
  }'

# Or test without auth (simulates database trigger call)
curl -i --location --request POST 'https://cnyvjuxmkpzxnztbbydu.supabase.co/functions/v1/send-tenant-approved' \
  --header 'Content-Type: application/json' \
  --data '{
    "tenant_id": "test",
    "tenant_name": "Test Firm",
    "contact_email": "test@example.com",
    "regime": "FCA",
    "frn": "123456",
    "approved_at": "2025-01-17T10:00:00Z",
    "activated_at": "2025-01-17T10:00:01Z"
  }'
```

Expected: 200 OK + email received

---

## Step 4: Restart React App

```bash
npm start
```

**MUST restart for changes to take effect!**

---

## Step 5: Verify

1. Login as platform admin
2. Should see "Platform Admin" in sidebar
3. Click → "Tenant Approvals"
4. Create test tenant via onboarding
5. Approve tenant
6. Check email received

---

## Production Environment Variables

**Vercel/Netlify:**
- `REACT_APP_SUPABASE_URL` = https://cnyvjuxmkpzxnztbbydu.supabase.co
- `REACT_APP_SUPABASE_ANON_KEY` = your-anon-key

---

## Useful SQL Queries

**Check if you're a platform admin:**
```sql
SELECT * FROM platform_admins
WHERE user_id = auth.uid() AND is_active = true;
```

**View pending tenants:**
```sql
SELECT * FROM tenants WHERE status = 'pending_verification';
```

**View approved tenants:**
```sql
SELECT
  t.name,
  t.regime,
  t.approved_at,
  t.activated_at,
  pa.email AS approved_by
FROM tenants t
LEFT JOIN platform_admins pa ON t.approved_by = pa.user_id
WHERE t.status = 'active'
ORDER BY t.approved_at DESC;
```

**Add another platform admin:**
```sql
INSERT INTO public.platform_admins (user_id, email, display_name, is_active)
VALUES (
  'user-id-here'::UUID,
  'email@example.com',
  'Name',
  true
);
```

**Note:** Webhook secret is now stored in Edge Function environment variables (via `supabase secrets set`), not in the database. This follows Supabase security best practices.

**Test approve_tenant RPC:**
```sql
SELECT approve_tenant('tenant-id-here'::UUID);
```

---

## Troubleshooting Commands

**Check pg_net extension:**
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Check if approve_tenant function exists:**
```sql
SELECT proname, prosrc FROM pg_proc WHERE proname = 'approve_tenant';
```

**Check trigger exists:**
```sql
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'trigger_tenant_approved';
```

**View Edge Function logs:**
Supabase Dashboard → Edge Functions → send-tenant-approved → Logs

**View recent HTTP requests from database:**
```sql
-- If pg_net stores logs (check your Supabase version)
SELECT * FROM net._http_response ORDER BY created DESC LIMIT 10;
```

---

## Emergency Rollback

**Disable trigger (stop auto-activation):**
```sql
ALTER TABLE public.tenants DISABLE TRIGGER trigger_tenant_approved;
```

**Re-enable trigger:**
```sql
ALTER TABLE public.tenants ENABLE TRIGGER trigger_tenant_approved;
```

**Remove platform admin access:**
```sql
UPDATE platform_admins SET is_active = false WHERE user_id = 'user-id';
```

---

**Quick Deploy Completed!** ✅

For detailed troubleshooting, see `TENANT_APPROVAL_DEPLOYMENT.md`
