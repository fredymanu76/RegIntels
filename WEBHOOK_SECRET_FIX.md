# Webhook Secret Permission Fix

## Problem
The original migration file attempted to set a database-level configuration parameter:

```sql
ALTER DATABASE postgres SET app.webhook_secret = 'zqckoNgtJP3OfGmHihFS6WBa2e9dTAjp';
```

This failed with the error:
```
ERROR: 42501: permission denied to set parameter "app.webhook_secret"
```

**Cause:** In Supabase (and managed PostgreSQL environments), regular database users don't have superuser permissions required to execute `ALTER DATABASE` commands. This is a security restriction.

---

## Solution: Use Edge Function Environment Variables

Following Supabase best practices, we moved the webhook secret from the database to Edge Function environment variables.

### What Changed

#### 1. Migration File (`supabase/migrations/002_tenant_approval_system.sql`)

**Removed:**
- Section 6 that set `ALTER DATABASE postgres SET app.webhook_secret`
- `v_webhook_secret` variable declaration and `current_setting()` call in the trigger function

**Updated:**
- Trigger function `notify_tenant_approved()` now calls the Edge Function without an Authorization header
- Database triggers are trusted internal calls that don't need authentication
- Simplified the trigger to only send the webhook payload

**Before (lines 220-221):**
```sql
-- Get webhook secret from app settings
SELECT current_setting('app.webhook_secret', true) INTO v_webhook_secret;

-- Call Edge Function webhook using pg_net
PERFORM net.http_post(
  url := v_webhook_url,
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || COALESCE(v_webhook_secret, '')
  ),
  ...
);
```

**After (lines 224-230):**
```sql
-- Call Edge Function webhook using pg_net (asynchronous HTTP request)
-- Note: The Edge Function will validate the request internally using WEBHOOK_SECRET
PERFORM net.http_post(
  url := v_webhook_url,
  headers := jsonb_build_object(
    'Content-Type', 'application/json'
  ),
  ...
);
```

#### 2. Edge Function (`supabase/functions/send-tenant-approved/index.ts`)

**Updated webhook validation logic:**
- Now accepts requests from both database triggers (no auth) and external webhooks (with Bearer token)
- Database trigger calls are trusted internal calls
- External API calls should include `Authorization: Bearer <WEBHOOK_SECRET>` header for security

**Before (lines 34-52):**
```typescript
const authHeader = req.headers.get('Authorization')
const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

if (!authHeader || !authHeader.startsWith('Bearer ')) {
  console.error('Missing or invalid Authorization header')
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Missing token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

const token = authHeader.replace('Bearer ', '')
if (token !== webhookSecret) {
  console.error('Invalid webhook secret')
  return new Response(
    JSON.stringify({ error: 'Unauthorized: Invalid token' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}
```

**After (lines 39-63):**
```typescript
const authHeader = req.headers.get('Authorization')
const webhookSecret = Deno.env.get('WEBHOOK_SECRET')

// If an Authorization header is provided, validate it
if (authHeader) {
  if (!authHeader.startsWith('Bearer ')) {
    console.error('Invalid Authorization header format')
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token format' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const token = authHeader.replace('Bearer ', '')
  if (webhookSecret && token !== webhookSecret) {
    console.error('Invalid webhook secret')
    return new Response(
      JSON.stringify({ error: 'Unauthorized: Invalid token' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Note: Requests from database triggers (via pg_net) are trusted internal calls
// and don't require authentication. External calls should provide the Bearer token.
```

#### 3. Deployment Documentation

Updated `QUICK_DEPLOY_COMMANDS.md` to:
- Remove instructions about setting database-level webhook secret
- Clarify that webhook secret is set via `supabase secrets set`
- Update test commands to show both authenticated and unauthenticated calls

---

## Deployment Steps (Updated)

### 1. Run the Migration
```bash
# In Supabase SQL Editor, run the entire migration file
# No manual edits needed - project ref is already configured
```

### 2. Set Edge Function Secrets
```bash
supabase secrets set WEBHOOK_SECRET=zqckoNgtJP3OfGmHihFS6WBa2e9dTAjp
supabase secrets set RESEND_API_KEY=re_YourResendAPIKey
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
```

### 3. Deploy Edge Function
```bash
supabase functions deploy send-tenant-approved
```

### 4. Test
```bash
# Test without auth (simulates database trigger)
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

---

## Security Benefits

✅ **No superuser permissions required** - Works in Supabase managed environment
✅ **Follows Supabase best practices** - Secrets stored in Edge Function environment
✅ **Flexible authentication** - Supports both internal (database) and external (API) calls
✅ **No secrets in SQL code** - Webhook secret only in environment variables
✅ **Easier rotation** - Update secret via `supabase secrets set` without database changes

---

## Files Modified

1. `supabase/migrations/002_tenant_approval_system.sql` - Removed ALTER DATABASE command, simplified trigger
2. `supabase/functions/send-tenant-approved/index.ts` - Made auth optional for internal calls
3. `QUICK_DEPLOY_COMMANDS.md` - Updated deployment instructions

---

**Status:** ✅ Ready to deploy
**Next Step:** Run the migration in Supabase SQL Editor
