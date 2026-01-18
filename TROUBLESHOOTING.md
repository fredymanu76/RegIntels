# RegIntels Supabase - Troubleshooting Guide

Common issues, solutions, and best practices for RegIntels Supabase setup.

## Table of Contents
- [Connection Issues](#connection-issues)
- [Authentication Problems](#authentication-problems)
- [Data Access Issues](#data-access-issues)
- [RLS Policy Problems](#rls-policy-problems)
- [Storage Issues](#storage-issues)
- [Email Delivery Problems](#email-delivery-problems)
- [Performance Issues](#performance-issues)
- [Common Error Messages](#common-error-messages)
- [Best Practices](#best-practices)

---

## Connection Issues

### Issue: "Failed to fetch" or "Network error"

**Symptoms:**
- App shows "Failed to fetch" errors
- Unable to connect to Supabase
- Network request timeouts

**Solutions:**

1. **Verify Supabase URL and API Key**
   ```javascript
   // Check your configuration
   console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
   console.log('Key:', process.env.REACT_APP_SUPABASE_ANON_KEY);
   ```

2. **Check CORS settings**
   - Go to Supabase Dashboard > Settings > API
   - Verify your domain is allowed in CORS settings
   - For local development, ensure `http://localhost:3000` is allowed

3. **Verify project is not paused**
   - Free tier projects pause after 7 days of inactivity
   - Go to dashboard and check project status
   - Click "Restore" if paused

4. **Check browser console**
   ```javascript
   // Open browser DevTools (F12)
   // Look for detailed error messages in Console tab
   // Check Network tab for failed requests
   ```

5. **Test connection manually**
   ```bash
   # Test if Supabase API is reachable
   curl https://your-project.supabase.co/rest/v1/
   ```

---

## Authentication Problems

### Issue: "Invalid login credentials"

**Symptoms:**
- Cannot sign in with correct email/password
- "Invalid login credentials" error

**Solutions:**

1. **Check if email is verified**
   - Go to Supabase Dashboard > Authentication > Users
   - Look for user and check "Email Confirmed" column
   - If not confirmed, click "..." menu > "Send confirmation email"

2. **Verify user exists**
   ```sql
   SELECT email, email_confirmed_at, created_at
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```

3. **Check password requirements**
   - Default: minimum 8 characters
   - Go to Authentication > Settings > Password requirements
   - Reset password if needed

4. **Try password reset**
   - Use "Forgot password" flow
   - Check spam folder for reset email

---

### Issue: "User not found" after successful login

**Symptoms:**
- Login succeeds but shows "User profile not found"
- Can authenticate but can't access app

**Solutions:**

1. **Create user profile**
   ```sql
   -- Get the user_id from auth.users
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

   -- Create user profile
   INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role, department)
   VALUES (
       'user-id-from-above',
       'your-tenant-id',
       'your-email@example.com',
       'Your Name',
       'Admin',
       'Compliance'
   );
   ```

2. **Verify tenant exists and is active**
   ```sql
   SELECT id, name, status FROM tenants WHERE id = 'your-tenant-id';
   ```

3. **Check user_profiles table has RLS enabled**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'user_profiles';
   ```

---

### Issue: Email confirmation not working

**Symptoms:**
- User doesn't receive confirmation email
- Confirmation link doesn't work

**Solutions:**

1. **Check SMTP configuration**
   - Go to Authentication > Settings > SMTP Settings
   - Verify all fields are correct
   - Test with "Send test email"

2. **Check spam folder**
   - Confirmation emails often go to spam
   - Add noreply@mail.app.supabase.io to contacts

3. **Verify redirect URLs**
   - Go to Authentication > URL Configuration
   - Ensure redirect URLs include your domain
   - Format: `https://yourdomain.com/auth/callback`

4. **Manually confirm user (development only)**
   ```sql
   -- In Supabase SQL Editor
   UPDATE auth.users
   SET email_confirmed_at = NOW()
   WHERE email = 'user-email@example.com';
   ```

5. **Check Site URL**
   - Go to Authentication > Settings
   - Verify Site URL matches your application URL

---

## Data Access Issues

### Issue: "No data returned" or empty results

**Symptoms:**
- Queries return empty arrays
- Can't see any data even though it exists

**Solutions:**

1. **Check RLS is not blocking access**
   ```sql
   -- Temporarily disable RLS to test (development only!)
   ALTER TABLE policies DISABLE ROW LEVEL SECURITY;

   -- Run your query
   SELECT * FROM policies;

   -- Re-enable RLS
   ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
   ```

2. **Verify tenant_id matches**
   ```sql
   -- Check user's tenant_id
   SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid();

   -- Check if data exists for that tenant
   SELECT COUNT(*) FROM policies WHERE tenant_id = 'your-tenant-id';
   ```

3. **Test query without RLS**
   ```sql
   -- Using service_role key (server-side only!)
   -- This bypasses RLS for testing
   SELECT * FROM policies WHERE tenant_id = 'your-tenant-id';
   ```

4. **Check if user has user_profile**
   ```sql
   SELECT * FROM user_profiles WHERE user_id = auth.uid();
   -- Should return a row
   ```

---

### Issue: "Permission denied" when inserting/updating

**Symptoms:**
- Can read data but can't insert/update
- "Permission denied for table" error

**Solutions:**

1. **Verify RLS policies exist for INSERT/UPDATE**
   ```sql
   -- Check policies for table
   SELECT policyname, cmd, qual
   FROM pg_policies
   WHERE tablename = 'policies';
   ```

2. **Ensure tenant_id is being passed**
   ```javascript
   // Correct
   await supabase.insert('policies', { ...data, tenant_id: userTenantId });

   // Incorrect - missing tenant_id
   await supabase.insert('policies', { ...data });
   ```

3. **Check user role for admin-only operations**
   ```sql
   -- Verify user role
   SELECT role FROM user_profiles WHERE user_id = auth.uid();
   ```

4. **Test with correct tenant_id**
   ```sql
   -- Get user's tenant_id
   SELECT get_user_tenant_id();
   ```

---

## RLS Policy Problems

### Issue: RLS policies not working as expected

**Symptoms:**
- Users can see data from other tenants
- Can't access own data
- Policies seem to be ignored

**Solutions:**

1. **Verify RLS is enabled**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   -- rowsecurity should be 't' (true)
   ```

2. **Check helper function exists**
   ```sql
   -- Test the helper function
   SELECT get_user_tenant_id();
   -- Should return a UUID
   ```

3. **Verify function has SECURITY DEFINER**
   ```sql
   -- Check function definition
   \df+ get_user_tenant_id

   -- Should show SECURITY DEFINER
   -- If not, recreate it:
   CREATE OR REPLACE FUNCTION get_user_tenant_id()
   RETURNS UUID AS $$
   BEGIN
       RETURN (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid() LIMIT 1);
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

4. **Test policy manually**
   ```sql
   -- Set JWT claim to test as specific user
   SET request.jwt.claims.sub = 'user-uuid';

   -- Run query
   SELECT * FROM policies;

   -- Reset
   RESET request.jwt.claims.sub;
   ```

5. **Check policy order and conflicts**
   ```sql
   -- List all policies for a table
   SELECT policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE tablename = 'policies'
   ORDER BY policyname;
   ```

---

### Issue: get_user_tenant_id() returns NULL

**Symptoms:**
- Helper function returns NULL
- RLS policies block all access

**Solutions:**

1. **User doesn't have a profile**
   ```sql
   -- Check if profile exists
   SELECT * FROM user_profiles WHERE user_id = auth.uid();
   ```

2. **Create missing profile**
   ```sql
   INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role)
   VALUES (
       auth.uid(),
       'your-tenant-id',
       'user-email@example.com',
       'User Name',
       'Compliance'
   );
   ```

3. **auth.uid() not working**
   ```sql
   -- Test if auth context is available
   SELECT auth.uid();
   -- Should return a UUID, not NULL
   ```

---

## Storage Issues

### Issue: File upload fails

**Symptoms:**
- "Permission denied" on upload
- Upload times out
- File not appearing in bucket

**Solutions:**

1. **Check bucket exists**
   - Go to Storage in Supabase dashboard
   - Verify bucket name matches code
   - Bucket names are case-sensitive

2. **Verify storage RLS policies**
   ```sql
   -- Check storage policies
   SELECT *
   FROM storage.policies
   WHERE bucket_id = 'policy-documents';
   ```

3. **Check file path format**
   ```javascript
   // Correct format: tenant_id/filename.ext
   const path = `${tenantId}/my-policy.pdf`;

   // Upload
   await supabase.storage
     .from('policy-documents')
     .upload(path, file);
   ```

4. **Verify file size**
   - Check bucket size limit
   - Default: 50MB
   - Go to Storage > bucket > Settings

5. **Check MIME type**
   - Ensure file type is allowed
   - Configure in bucket settings

---

### Issue: Can't download/view uploaded files

**Symptoms:**
- Upload succeeds but can't access file
- 404 error when accessing file URL

**Solutions:**

1. **Check storage SELECT policy**
   ```sql
   -- User needs SELECT permission
   CREATE POLICY "Users can read files from their tenant folder"
   ON storage.objects FOR SELECT
   USING (
       bucket_id = 'policy-documents' AND
       (storage.foldername(name))[1] = get_user_tenant_id()::text
   );
   ```

2. **Generate correct URL**
   ```javascript
   // Public URL (for public buckets)
   const { data } = supabase.storage
     .from('policy-documents')
     .getPublicUrl(path);

   // Signed URL (for private buckets - expires)
   const { data, error } = await supabase.storage
     .from('policy-documents')
     .createSignedUrl(path, 3600); // 1 hour
   ```

3. **Check file actually exists**
   ```sql
   SELECT name, bucket_id, created_at
   FROM storage.objects
   WHERE bucket_id = 'policy-documents'
   ORDER BY created_at DESC;
   ```

---

## Email Delivery Problems

### Issue: Emails not being received

**Symptoms:**
- Users don't receive auth emails
- Password reset emails not arriving

**Solutions:**

1. **Check SMTP configuration**
   - Go to Authentication > Settings > SMTP Settings
   - Verify all fields are correct
   - Common providers:
     - SendGrid: smtp.sendgrid.net:587
     - Mailgun: smtp.mailgun.org:587
     - AWS SES: email-smtp.region.amazonaws.com:587

2. **Test SMTP connection**
   ```bash
   # Use telnet to test SMTP connection
   telnet smtp.sendgrid.net 587
   ```

3. **Check spam folder**
   - Most email issues are spam filtering
   - Check user's spam/junk folder
   - Add sender to safe senders list

4. **Verify sender email**
   - Some SMTP providers require verified sender
   - Sender must match SMTP account domain
   - Format: noreply@yourdomain.com

5. **Check email templates**
   - Go to Authentication > Email Templates
   - Ensure templates are valid HTML
   - Test variable substitution: `{{ .ConfirmationURL }}`

6. **Review email logs (if available)**
   - Some SMTP providers have logs
   - Check for bounces or delivery failures

---

## Performance Issues

### Issue: Slow queries

**Symptoms:**
- Dashboard takes long to load
- Queries timeout
- Poor app performance

**Solutions:**

1. **Add missing indexes**
   ```sql
   -- Find queries without index usage
   EXPLAIN ANALYZE
   SELECT * FROM policies WHERE tenant_id = 'your-tenant-id';

   -- Should show "Index Scan" not "Seq Scan"
   ```

2. **Optimize queries**
   ```sql
   -- Instead of multiple queries
   SELECT * FROM policies;
   SELECT * FROM controls;

   -- Use joins or CTEs
   WITH policy_data AS (SELECT * FROM policies),
        control_data AS (SELECT * FROM controls)
   SELECT * FROM policy_data, control_data;
   ```

3. **Check for missing tenant_id filters**
   ```javascript
   // Always filter by tenant_id
   // Bad
   const { data } = await supabase.from('policies').select('*');

   // Good
   const { data } = await supabase
     .from('policies')
     .select('*')
     .eq('tenant_id', tenantId);
   ```

4. **Limit result sets**
   ```javascript
   // Use pagination
   const { data } = await supabase
     .from('policies')
     .select('*')
     .eq('tenant_id', tenantId)
     .range(0, 9)  // First 10 results
     .order('created_at', { ascending: false });
   ```

5. **Check database statistics**
   ```sql
   -- Check table statistics
   SELECT
       relname as table_name,
       n_live_tup as row_count,
       n_dead_tup as dead_rows
   FROM pg_stat_user_tables
   WHERE schemaname = 'public';

   -- If dead_rows is high, run VACUUM
   VACUUM ANALYZE policies;
   ```

---

## Common Error Messages

### "JWT expired"

**Cause:** Authentication token has expired (default: 1 hour)

**Solution:**
```javascript
// The Supabase client automatically refreshes tokens
// But you can manually refresh if needed:
const { data, error } = await supabase.auth.refreshSession();
```

---

### "duplicate key value violates unique constraint"

**Cause:** Trying to insert a record that conflicts with UNIQUE constraint

**Solution:**
```sql
-- Find the duplicate
SELECT control_code, COUNT(*)
FROM controls
WHERE tenant_id = 'your-tenant-id'
GROUP BY control_code
HAVING COUNT(*) > 1;

-- Use ON CONFLICT for upserts
INSERT INTO controls (tenant_id, control_code, title, ...)
VALUES (...)
ON CONFLICT (tenant_id, control_code)
DO UPDATE SET title = EXCLUDED.title, ...;
```

---

### "relation does not exist"

**Cause:** Table doesn't exist or wrong schema

**Solution:**
```sql
-- Check if table exists
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- If missing, run schema creation script
-- See SUPABASE_SETUP_GUIDE.md
```

---

### "permission denied for schema public"

**Cause:** User doesn't have permissions on public schema

**Solution:**
```sql
-- Grant permissions (run as postgres user)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
```

---

### "column does not exist"

**Cause:** Trying to access a column that doesn't exist

**Solution:**
```sql
-- Check table structure
\d policies

-- Or
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'policies';
```

---

## Best Practices

### Security

1. **Never expose service_role key**
   - Only use anon key in client-side code
   - service_role bypasses RLS - server-side only!

2. **Always enable RLS**
   - Every table should have RLS enabled
   - Test RLS policies thoroughly

3. **Use environment variables**
   ```bash
   # .env file
   REACT_APP_SUPABASE_URL=https://xxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJ...

   # Add to .gitignore
   .env
   .env.local
   ```

4. **Implement proper user roles**
   - Use role-based access control
   - Admin, Compliance, Board, Viewer

### Performance

1. **Use indexes wisely**
   - Index foreign keys
   - Index frequently filtered columns
   - Don't over-index (slows writes)

2. **Fetch only needed columns**
   ```javascript
   // Instead of
   .select('*')

   // Use
   .select('id, title, status, created_at')
   ```

3. **Implement pagination**
   ```javascript
   .range(start, end)
   .limit(pageSize)
   ```

4. **Cache frequent queries**
   ```javascript
   // Use React Query or SWR
   const { data } = useQuery('policies', fetchPolicies, {
     staleTime: 5 * 60 * 1000 // 5 minutes
   });
   ```

### Data Integrity

1. **Use transactions for related inserts**
   ```javascript
   // Not available in client library
   // Use database function or Edge Function
   ```

2. **Validate data before insert**
   ```javascript
   if (!data.title || !data.tenant_id) {
     throw new Error('Required fields missing');
   }
   ```

3. **Handle errors gracefully**
   ```javascript
   try {
     const { data, error } = await supabase.from('policies').insert(newPolicy);
     if (error) throw error;
   } catch (error) {
     console.error('Insert failed:', error);
     // Show user-friendly message
   }
   ```

### Monitoring

1. **Enable query logging (development)**
   ```javascript
   const supabase = createClient(url, key, {
     global: {
       headers: { 'x-my-custom-header': 'debug' }
     }
   });
   ```

2. **Monitor API usage**
   - Check Supabase Dashboard > Reports
   - Watch for rate limits
   - Upgrade plan if needed

3. **Set up error tracking**
   ```javascript
   // Use Sentry, LogRocket, etc.
   window.addEventListener('unhandledrejection', (event) => {
     console.error('Unhandled promise rejection:', event.reason);
   });
   ```

---

## Getting Help

If you're still stuck after trying these solutions:

1. **Check Supabase Status**
   - [https://status.supabase.com](https://status.supabase.com)

2. **Search Supabase Docs**
   - [https://supabase.com/docs](https://supabase.com/docs)

3. **Community Support**
   - [Discord](https://discord.supabase.com)
   - [GitHub Discussions](https://github.com/supabase/supabase/discussions)

4. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error details in Console and Network tabs

5. **Enable Debug Mode**
   ```javascript
   localStorage.setItem('supabase.debug', 'true');
   ```

6. **Create Minimal Reproduction**
   - Isolate the issue
   - Create simple test case
   - Share in Discord/GitHub for help

---

For setup instructions, see [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md).
