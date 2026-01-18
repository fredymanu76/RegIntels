# RegIntels Supabase Documentation

Complete documentation for setting up and managing the RegIntels Supabase backend.

## Documentation Overview

This folder contains comprehensive guides for the RegIntels Supabase setup:

### Quick Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[QUICK_START.md](./QUICK_START.md)** | 5-minute setup guide | First-time setup, quick reference |
| **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)** | Complete step-by-step guide | Detailed setup, production deployment |
| **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** | Schema reference and ERD | Understanding data structure, planning features |
| **[SAMPLE_DATA_AND_TESTING.md](./SAMPLE_DATA_AND_TESTING.md)** | Test data and queries | Development, testing, QA |
| **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** | Common issues and solutions | When things go wrong, debugging |

---

## Getting Started

### New to RegIntels?

1. Start with **[QUICK_START.md](./QUICK_START.md)** to get up and running in 5 minutes
2. Review **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** to understand the data model
3. Use **[SAMPLE_DATA_AND_TESTING.md](./SAMPLE_DATA_AND_TESTING.md)** to populate test data
4. Keep **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** handy for common issues

### Setting up for Production?

1. Follow **[SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md)** completely
2. Pay special attention to:
   - Row Level Security (RLS) configuration
   - Email SMTP setup
   - Storage bucket policies
   - Auth settings
3. Review security checklist before deploying

### Already Set Up?

- Use **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** as reference
- Run queries from **[SAMPLE_DATA_AND_TESTING.md](./SAMPLE_DATA_AND_TESTING.md)** for verification
- Consult **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** when issues arise

---

## What is RegIntels?

RegIntels is a regulatory compliance management platform for financial services firms. It helps organizations:

- **Manage compliance policies** and documentation
- **Track regulatory changes** from FCA, PRA, ICO, and other sources
- **Implement and test controls** for regulatory requirements
- **Monitor and remediate exceptions** and compliance breaches
- **Assess and manage risks** across the organization

### Multi-Tenant Architecture

RegIntels uses a **shared database, shared schema** multi-tenant model:

- Each organization (tenant) gets a unique UUID
- All tenants share the same database and tables
- Row Level Security (RLS) ensures complete data isolation
- Users can only access data from their own tenant

---

## Database Overview

### Core Tables

1. **tenants** - Organizations using RegIntels
2. **user_profiles** - User information (extends Supabase Auth)
3. **policies** - Compliance policies and documents
4. **controls** - Compliance controls and testing procedures
5. **reg_changes** - Regulatory changes and updates
6. **exceptions** - Compliance exceptions and incidents
7. **risks** - Risk register and assessments

### Key Features

- **UUID-based tenant IDs** for security
- **Audit timestamps** on all tables (created_at, updated_at)
- **Row Level Security (RLS)** for multi-tenant isolation
- **Soft deletes** for user assignments (ON DELETE SET NULL)
- **Cascade deletes** for tenant data (ON DELETE CASCADE)
- **Indexes** on all foreign keys and frequently queried columns

### Storage Buckets

- **policy-documents** - Policy files and documentation
- **evidence-files** - Evidence for control testing
- **risk-assessments** - Risk assessment documents

---

## Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password)
- **Storage**: Supabase Storage (S3-compatible)
- **Frontend**: React 19
- **Client Library**: @supabase/supabase-js v2.90+

---

## Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Copy Project URL and anon key
- [ ] Run database schema creation script
- [ ] Enable RLS on all tables
- [ ] Create RLS policies
- [ ] Create storage buckets
- [ ] Configure storage RLS policies
- [ ] Set up email templates
- [ ] Configure SMTP (production only)
- [ ] Set auth settings
- [ ] Test with sample data
- [ ] Connect app with credentials
- [ ] Verify end-to-end flow

---

## Security Model

### Row Level Security (RLS)

Every table uses RLS to ensure users can only access their tenant's data:

```sql
-- Example RLS policy
CREATE POLICY "Users can view policies in their tenant"
    ON policies FOR SELECT
    USING (tenant_id = get_user_tenant_id());
```

### User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, can manage users and settings |
| **Compliance** | Can create/edit policies, controls, risks |
| **Board** | Read-only access to reports and dashboards |
| **Viewer** | Limited read-only access |

### Authentication

- Email/password authentication
- Email verification required
- Password requirements: 8+ chars, uppercase, lowercase, numbers
- JWT tokens (1 hour expiry)
- Refresh tokens (30 days)

---

## API Access Patterns

### Reading Data

```javascript
// Get all policies for current user's tenant (RLS enforced)
const { data, error } = await supabase
  .from('policies')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });
```

### Inserting Data

```javascript
// Insert new policy (tenant_id added automatically by RLS)
const { data, error } = await supabase
  .from('policies')
  .insert({
    title: 'New Policy',
    version: '1.0',
    status: 'draft',
    regulator_regime: 'API'
  });
```

### Updating Data

```javascript
// Update policy (RLS ensures user can only update their tenant's data)
const { data, error } = await supabase
  .from('policies')
  .update({ status: 'active', version: '1.1' })
  .eq('id', policyId);
```

### File Upload

```javascript
// Upload file to storage (folder = tenant_id)
const { data, error } = await supabase.storage
  .from('policy-documents')
  .upload(`${tenantId}/policy-v1.1.pdf`, file);
```

---

## Common Queries

### Dashboard Statistics

```sql
-- Get compliance metrics for dashboard
SELECT
    (SELECT COUNT(*) FROM policies WHERE status = 'active') as active_policies,
    (SELECT COUNT(*) FROM controls WHERE status = 'active') as active_controls,
    (SELECT COUNT(*) FROM exceptions WHERE status = 'open') as open_exceptions,
    (SELECT COUNT(*) FROM risks WHERE residual_score > 12) as high_risks;
```

### Recent Activity

```sql
-- Get recent compliance activities
SELECT 'Policy' as type, title, created_at as date FROM policies
UNION ALL
SELECT 'Control', title, created_at FROM controls
UNION ALL
SELECT 'Exception', title, opened_at FROM exceptions
ORDER BY date DESC
LIMIT 10;
```

### User Workload

```sql
-- Items assigned to each user
SELECT
    up.display_name,
    COUNT(DISTINCT p.id) as policies_owned,
    COUNT(DISTINCT c.id) as controls_owned,
    COUNT(DISTINCT e.id) as exceptions_assigned
FROM user_profiles up
LEFT JOIN policies p ON up.id = p.owner_user_id
LEFT JOIN controls c ON up.id = c.owner_user_id
LEFT JOIN exceptions e ON up.id = e.assigned_to
GROUP BY up.display_name;
```

---

## Environment Configuration

### Development (.env.local)

```env
REACT_APP_SUPABASE_URL=https://your-dev-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-dev-anon-key
```

### Production (.env.production)

```env
REACT_APP_SUPABASE_URL=https://your-prod-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-prod-anon-key
```

**Important**: Never commit `.env` files! Add to `.gitignore`:

```gitignore
.env
.env.local
.env.production
.env.*.local
```

---

## Maintenance Tasks

### Regular Tasks

1. **Monitor database size**
   ```sql
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

2. **Check slow queries**
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

3. **Vacuum tables (if needed)**
   ```sql
   VACUUM ANALYZE policies;
   VACUUM ANALYZE controls;
   ```

4. **Review API usage**
   - Go to Supabase Dashboard > Reports
   - Check request counts and bandwidth

### Periodic Tasks

1. **Review RLS policies** (monthly)
2. **Update email templates** (as needed)
3. **Review user access** (quarterly)
4. **Audit security settings** (quarterly)
5. **Test backup restoration** (quarterly)

---

## Performance Optimization

### Database

1. **Use indexes** on frequently queried columns
2. **Limit result sets** with pagination
3. **Select only needed columns** (not SELECT *)
4. **Use database functions** for complex operations
5. **Monitor query performance** with EXPLAIN ANALYZE

### Frontend

1. **Cache query results** (use React Query or SWR)
2. **Implement pagination** for large lists
3. **Use optimistic updates** for better UX
4. **Debounce search inputs**
5. **Lazy load components**

### Storage

1. **Compress files** before upload
2. **Use appropriate file formats** (PDF for documents)
3. **Implement file size limits**
4. **Clean up orphaned files** periodically

---

## Migration Strategy

When schema changes are needed:

1. **Create migration file**
   ```bash
   # Using Supabase CLI
   supabase migration new add_policy_categories
   ```

2. **Write migration SQL**
   ```sql
   -- 20250117_add_policy_categories.sql
   ALTER TABLE policies ADD COLUMN category TEXT;
   CREATE INDEX idx_policies_category ON policies(category);
   ```

3. **Test on staging** environment first

4. **Deploy to production**
   ```bash
   supabase db push
   ```

5. **Update RLS policies** if needed

6. **Backfill data** if required

---

## Backup and Recovery

### Automatic Backups (Supabase)

- Free tier: Daily backups, 7-day retention
- Pro tier: Daily backups, 30-day retention
- Point-in-time recovery available on Pro tier

### Manual Backup

```bash
# Export database
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        -f backup_$(date +%Y%m%d).sql

# Export specific table
pg_dump -h db.your-project.supabase.co \
        -U postgres \
        -d postgres \
        -t policies \
        -f policies_backup.sql
```

### Restore

```bash
# Restore database
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f backup_20250117.sql
```

---

## Monitoring and Alerts

### Key Metrics to Monitor

1. **Database metrics**
   - Query performance
   - Connection count
   - Database size
   - Index usage

2. **API metrics**
   - Request count
   - Error rate
   - Response time
   - Rate limit hits

3. **Auth metrics**
   - Failed login attempts
   - User signups
   - Email confirmation rate

4. **Storage metrics**
   - Storage used
   - Bandwidth
   - Failed uploads

### Setting Up Alerts

Configure alerts in Supabase Dashboard > Monitoring for:
- High error rates
- Slow queries
- Storage limits
- Rate limit warnings

---

## Production Checklist

Before deploying to production:

### Security
- [ ] All tables have RLS enabled and tested
- [ ] Service role key is secured (server-side only)
- [ ] Environment variables are not committed
- [ ] HTTPS is enforced
- [ ] Password requirements are strong
- [ ] Email verification is enabled
- [ ] Storage buckets are private

### Configuration
- [ ] Custom SMTP configured
- [ ] Email templates customized
- [ ] Site URL is correct
- [ ] Redirect URLs are whitelisted
- [ ] CORS settings are correct
- [ ] Rate limits are appropriate

### Performance
- [ ] All necessary indexes created
- [ ] Queries are optimized
- [ ] Pagination implemented
- [ ] Caching configured
- [ ] File sizes limited

### Reliability
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Error tracking set up
- [ ] Health checks implemented
- [ ] Disaster recovery plan documented

### Compliance
- [ ] Data retention policies defined
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Audit logging configured

---

## Support and Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [React Docs](https://react.dev/)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

### Learning Resources
- [Supabase YouTube](https://www.youtube.com/c/supabase)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## License

RegIntels is proprietary software. See LICENSE file for details.

---

## Contact

For questions about this setup:
- Create an issue in the GitHub repository
- Contact the development team
- Check the troubleshooting guide first

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Supabase Version**: 2.x
**PostgreSQL Version**: 15.x
