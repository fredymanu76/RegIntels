# Sample Data and Testing Queries

This document provides sample data for testing your RegIntels Supabase setup, along with useful queries for verification and troubleshooting.

## Table of Contents
- [Sample Data Scripts](#sample-data-scripts)
- [Verification Queries](#verification-queries)
- [Testing RLS Policies](#testing-rls-policies)
- [Common Queries](#common-queries)
- [Performance Testing](#performance-testing)

---

## Sample Data Scripts

### 1. Create Sample Tenant

```sql
-- Insert a test tenant
INSERT INTO tenants (id, name, regime, frn, status, created_at)
VALUES (
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Fintech Solutions Ltd',
    'API',
    'FRN123456',
    'active',
    NOW()
);

-- Verify
SELECT * FROM tenants;
```

### 2. Create Sample Users

**Note:** First create users through Supabase Auth UI or signup flow, then add their profiles.

```sql
-- After creating auth users, add their profiles
-- Replace 'user-uuid-from-auth' with actual UUIDs from auth.users table

-- Admin user
INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role, department, smf_designation)
VALUES (
    'user-uuid-admin',  -- Replace with actual auth.users.id
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'admin@fintech.com',
    'Sarah Johnson',
    'Admin',
    'Compliance',
    'SMF16'
);

-- Compliance user
INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role, department, smf_designation)
VALUES (
    'user-uuid-compliance',  -- Replace with actual auth.users.id
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'compliance@fintech.com',
    'Mike Chen',
    'Compliance',
    'Compliance',
    NULL
);

-- Board member
INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role, department, smf_designation)
VALUES (
    'user-uuid-board',  -- Replace with actual auth.users.id
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'board@fintech.com',
    'Emma Williams',
    'Board',
    'Board',
    'SMF1'
);

-- Verify
SELECT id, email, display_name, role, department FROM user_profiles;
```

### 3. Create Sample Policies

```sql
-- Get a user ID for owner_user_id
-- SELECT id FROM user_profiles WHERE email = 'admin@fintech.com';

INSERT INTO policies (tenant_id, title, version, status, owner_user_id, regulator_regime, created_at)
VALUES
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Anti-Money Laundering Policy',
    '2.1',
    'active',
    1,  -- Replace with actual user_profiles.id
    'API',
    NOW() - INTERVAL '30 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Conflicts of Interest Policy',
    '1.5',
    'active',
    2,  -- Replace with actual user_profiles.id
    'API',
    NOW() - INTERVAL '20 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Data Protection & Privacy Policy',
    '3.0',
    'active',
    1,  -- Replace with actual user_profiles.id
    'GDPR',
    NOW() - INTERVAL '10 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Operational Resilience Policy',
    '1.0',
    'draft',
    1,  -- Replace with actual user_profiles.id
    'SYSC',
    NOW()
);

-- Verify
SELECT id, title, version, status, regulator_regime FROM policies;
```

### 4. Create Sample Controls

```sql
INSERT INTO controls (tenant_id, control_code, title, description, owner_user_id, frequency, status, test_method, evidence_required)
VALUES
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'AML-001',
    'Customer Due Diligence Review',
    'Monthly review of CDD completeness and quality',
    2,  -- Replace with actual user_profiles.id
    'Monthly',
    'active',
    'Sample testing of 10% of new accounts',
    'CDD completion report with evidence of verification'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'COI-001',
    'Conflicts Register Review',
    'Quarterly review of conflicts of interest register',
    1,  -- Replace with actual user_profiles.id
    'Quarterly',
    'active',
    'Full review of all declared conflicts',
    'Updated conflicts register with review notes'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'DATA-001',
    'DSAR Response Time Monitoring',
    'Monitor Data Subject Access Request response times',
    2,  -- Replace with actual user_profiles.id
    'Monthly',
    'active',
    'Review of DSAR log',
    'DSAR log showing all requests and response dates'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'SYSC-001',
    'System Backup Verification',
    'Daily verification of system backups',
    1,  -- Replace with actual user_profiles.id
    'Daily',
    'active',
    'Automated backup verification report',
    'Backup success logs'
);

-- Verify
SELECT id, control_code, title, frequency, status FROM controls;
```

### 5. Create Sample Regulatory Changes

```sql
INSERT INTO reg_changes (tenant_id, source, title, summary, published_at, status, impact_rating, assigned_to)
VALUES
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'FCA',
    'Consumer Duty - Outcomes Testing Requirements',
    'New requirements for evidencing consumer outcomes under Consumer Duty',
    NOW() - INTERVAL '7 days',
    'in_review',
    'high',
    1  -- Replace with actual user_profiles.id
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'FCA',
    'PS24/3 - Operational Resilience Updates',
    'Updated operational resilience requirements and testing guidance',
    NOW() - INTERVAL '9 days',
    'actioned',
    'medium',
    1  -- Replace with actual user_profiles.id
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'ICO',
    'International Data Transfer Guidance Update',
    'Updated guidance on international data transfers post-Brexit',
    NOW() - INTERVAL '15 days',
    'new',
    'medium',
    NULL
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'FCA',
    'Annual Financial Crime Report Requirements',
    'New requirements for annual financial crime reporting',
    NOW() - INTERVAL '2 days',
    'new',
    'high',
    NULL
);

-- Verify
SELECT id, source, title, status, impact_rating, published_at FROM reg_changes ORDER BY published_at DESC;
```

### 6. Create Sample Exceptions

```sql
INSERT INTO exceptions (tenant_id, source_type, source_id, title, description, severity, status, assigned_to, opened_at)
VALUES
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'control',
    1,  -- References controls.id for AML-001
    'Late CDD completion for 3 customers',
    'Customer due diligence not completed within required 30-day timeframe for 3 new customers',
    'medium',
    'open',
    2,  -- Replace with actual user_profiles.id
    NOW() - INTERVAL '5 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'incident',
    NULL,
    'DSAR breach - 35 day response time',
    'Data Subject Access Request responded to in 35 days instead of required 30 days',
    'high',
    'remediation',
    2,  -- Replace with actual user_profiles.id
    NOW() - INTERVAL '8 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'audit',
    NULL,
    'Missing segregation documentation',
    'Internal audit found inadequate documentation of segregation of duties in payment processing',
    'medium',
    'remediation',
    1,  -- Replace with actual user_profiles.id
    NOW() - INTERVAL '12 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'complaint',
    NULL,
    'Customer complaint - unclear fee disclosure',
    'Customer complained that fee structure was not clearly disclosed at onboarding',
    'low',
    'closed',
    2,  -- Replace with actual user_profiles.id
    NOW() - INTERVAL '20 days'
);

-- Close the complaint exception
UPDATE exceptions
SET closed_at = NOW() - INTERVAL '15 days',
    resolution_notes = 'Updated fee disclosure documentation and contacted customer. Customer satisfied with resolution.'
WHERE title = 'Customer complaint - unclear fee disclosure';

-- Verify
SELECT id, source_type, title, severity, status, opened_at FROM exceptions;
```

### 7. Create Sample Risks

```sql
INSERT INTO risks (tenant_id, name, category, description, inherent_score, residual_score, owner_user_id, status, review_frequency, last_reviewed_at, next_review_at)
VALUES
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'AML/CTF Risk',
    'Financial Crime',
    'Risk of being used for money laundering or terrorist financing activities',
    20,  -- High inherent risk (4x5 = 20)
    6,   -- Low residual risk after controls (2x3 = 6)
    1,   -- Replace with actual user_profiles.id
    'active',
    'Quarterly',
    NOW() - INTERVAL '30 days',
    NOW() + INTERVAL '60 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Data Protection Risk',
    'Information Security',
    'Risk of data breach or unauthorized access to customer data',
    15,  -- Medium-high inherent risk (3x5 = 15)
    6,   -- Low residual risk (2x3 = 6)
    2,   -- Replace with actual user_profiles.id
    'active',
    'Quarterly',
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '45 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'System Outage Risk',
    'Operational',
    'Risk of critical system failure affecting customer service',
    12,  -- Medium inherent risk (3x4 = 12)
    4,   -- Very low residual risk (2x2 = 4)
    1,   -- Replace with actual user_profiles.id
    'active',
    'Monthly',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days'
),
(
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',
    'Regulatory Change Risk',
    'Compliance',
    'Risk of failing to identify and implement required regulatory changes',
    16,  -- High inherent risk (4x4 = 16)
    8,   -- Medium residual risk (2x4 = 8)
    1,   -- Replace with actual user_profiles.id
    'active',
    'Quarterly',
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '30 days'
);

-- Verify
SELECT id, name, category, inherent_score, residual_score, status FROM risks;
```

---

## Verification Queries

### Check All Tables Have Data

```sql
-- Quick count of all tables
SELECT 'tenants' as table_name, COUNT(*) as row_count FROM tenants
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL
SELECT 'policies', COUNT(*) FROM policies
UNION ALL
SELECT 'controls', COUNT(*) FROM controls
UNION ALL
SELECT 'reg_changes', COUNT(*) FROM reg_changes
UNION ALL
SELECT 'exceptions', COUNT(*) FROM exceptions
UNION ALL
SELECT 'risks', COUNT(*) FROM risks;
```

### Check Foreign Key Relationships

```sql
-- Verify all user profiles have valid tenants
SELECT up.id, up.email, t.name as tenant_name
FROM user_profiles up
LEFT JOIN tenants t ON up.tenant_id = t.id
WHERE t.id IS NULL;  -- Should return no rows

-- Verify all policies have valid tenants
SELECT p.id, p.title, t.name as tenant_name
FROM policies p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE t.id IS NULL;  -- Should return no rows

-- Verify all policies with owners have valid owners
SELECT p.id, p.title, up.display_name as owner_name
FROM policies p
LEFT JOIN user_profiles up ON p.owner_user_id = up.id
WHERE p.owner_user_id IS NOT NULL AND up.id IS NULL;  -- Should return no rows
```

### Check Data Integrity

```sql
-- Find risks with invalid scores
SELECT id, name, inherent_score, residual_score
FROM risks
WHERE inherent_score < 1 OR inherent_score > 25
   OR residual_score < 1 OR residual_score > 25;  -- Should return no rows

-- Find exceptions that are closed but have no closed_at date
SELECT id, title, status, closed_at
FROM exceptions
WHERE status = 'closed' AND closed_at IS NULL;  -- Should return no rows

-- Find duplicate control codes per tenant
SELECT tenant_id, control_code, COUNT(*)
FROM controls
GROUP BY tenant_id, control_code
HAVING COUNT(*) > 1;  -- Should return no rows
```

---

## Testing RLS Policies

### Test as Authenticated User

```sql
-- Simulate logged in user (replace with actual user_id)
SET request.jwt.claims.sub = 'user-uuid-admin';

-- Test tenant access
SELECT * FROM tenants;  -- Should only see own tenant

-- Test policies access
SELECT * FROM policies;  -- Should only see policies for own tenant

-- Test user profiles
SELECT * FROM user_profiles;  -- Should see all users in own tenant
```

### Test Insert Permissions

```sql
-- Try to insert a policy (should work if tenant_id matches user's tenant)
INSERT INTO policies (tenant_id, title, version, status, regulator_regime)
VALUES (
    '5925873a-2119-444c-93b5-e0cd6ed1bdad',  -- User's tenant
    'Test Policy',
    '1.0',
    'draft',
    'API'
);

-- Try to insert a policy for different tenant (should fail due to RLS)
INSERT INTO policies (tenant_id, title, version, status, regulator_regime)
VALUES (
    '00000000-0000-0000-0000-000000000000',  -- Different tenant
    'Test Policy',
    '1.0',
    'draft',
    'API'
);  -- This should fail
```

### Test Admin-Only Operations

```sql
-- Set user to non-admin
SET request.jwt.claims.sub = 'user-uuid-compliance';

-- Try to delete a policy (should fail for non-admins)
DELETE FROM policies WHERE id = 1;  -- Should fail

-- Set user to admin
SET request.jwt.claims.sub = 'user-uuid-admin';

-- Try again (should succeed for admins)
-- DELETE FROM policies WHERE id = 1;  -- Should succeed (don't actually run)
```

---

## Common Queries

### Dashboard Statistics

```sql
-- Overall compliance dashboard for a tenant
WITH tenant_stats AS (
    SELECT
        (SELECT COUNT(*) FROM policies WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'active') as active_policies,
        (SELECT COUNT(*) FROM controls WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'active') as active_controls,
        (SELECT COUNT(*) FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'open') as open_exceptions,
        (SELECT COUNT(*) FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'open' AND severity = 'high') as high_exceptions,
        (SELECT COUNT(*) FROM reg_changes WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'new') as new_reg_changes,
        (SELECT COUNT(*) FROM risks WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'active' AND residual_score > 12) as high_risks
)
SELECT * FROM tenant_stats;
```

### Recent Activity Feed

```sql
-- Recent activities across all tables
SELECT 'Policy Created' as activity_type, title as description, created_at as activity_date
FROM policies WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'Control Created', title, created_at
FROM controls WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'Exception Opened', title, opened_at
FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'Reg Change Added', title, created_at
FROM reg_changes WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
ORDER BY activity_date DESC
LIMIT 10;
```

### User Workload Report

```sql
-- Count items assigned to each user
SELECT
    up.display_name,
    up.role,
    COALESCE(p.policy_count, 0) as policies_owned,
    COALESCE(c.control_count, 0) as controls_owned,
    COALESCE(e.exceptions_count, 0) as exceptions_assigned,
    COALESCE(r.reg_changes_count, 0) as reg_changes_assigned,
    COALESCE(ri.risks_count, 0) as risks_owned
FROM user_profiles up
LEFT JOIN (SELECT owner_user_id, COUNT(*) as policy_count FROM policies WHERE status = 'active' GROUP BY owner_user_id) p ON up.id = p.owner_user_id
LEFT JOIN (SELECT owner_user_id, COUNT(*) as control_count FROM controls WHERE status = 'active' GROUP BY owner_user_id) c ON up.id = c.owner_user_id
LEFT JOIN (SELECT assigned_to, COUNT(*) as exceptions_count FROM exceptions WHERE status IN ('open', 'remediation') GROUP BY assigned_to) e ON up.id = e.assigned_to
LEFT JOIN (SELECT assigned_to, COUNT(*) as reg_changes_count FROM reg_changes WHERE status = 'in_review' GROUP BY assigned_to) r ON up.id = r.assigned_to
LEFT JOIN (SELECT owner_user_id, COUNT(*) as risks_count FROM risks WHERE status = 'active' GROUP BY owner_user_id) ri ON up.id = ri.owner_user_id
WHERE up.tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
ORDER BY up.display_name;
```

### Compliance Coverage Report

```sql
-- Policies and controls by regulatory regime
SELECT
    COALESCE(regulator_regime, 'Unspecified') as regime,
    COUNT(DISTINCT p.id) as policy_count,
    AVG(CASE WHEN p.status = 'active' THEN 1.0 ELSE 0.0 END) * 100 as active_percentage
FROM policies p
WHERE p.tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
GROUP BY regulator_regime
ORDER BY policy_count DESC;
```

### Exception Aging Report

```sql
-- Exceptions by age and severity
SELECT
    severity,
    status,
    COUNT(*) as exception_count,
    AVG(EXTRACT(DAY FROM NOW() - opened_at)) as avg_days_open,
    MAX(EXTRACT(DAY FROM NOW() - opened_at)) as max_days_open
FROM exceptions
WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
  AND status != 'closed'
GROUP BY severity, status
ORDER BY severity DESC, status;
```

### Risk Heatmap Data

```sql
-- Risk scores for heatmap visualization
SELECT
    name,
    category,
    inherent_score,
    residual_score,
    (inherent_score - residual_score) as risk_reduction,
    CASE
        WHEN residual_score >= 16 THEN 'High'
        WHEN residual_score >= 9 THEN 'Medium'
        ELSE 'Low'
    END as residual_rating
FROM risks
WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
  AND status = 'active'
ORDER BY residual_score DESC;
```

---

## Performance Testing

### Test Query Performance

```sql
-- Enable query timing
\timing

-- Test tenant filtering performance (should use index)
EXPLAIN ANALYZE
SELECT * FROM policies WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';

-- Test status filtering (should use index)
EXPLAIN ANALYZE
SELECT * FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad' AND status = 'open';

-- Test join performance
EXPLAIN ANALYZE
SELECT p.title, up.display_name as owner
FROM policies p
LEFT JOIN user_profiles up ON p.owner_user_id = up.id
WHERE p.tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
```

### Index Usage Check

```sql
-- Check if indexes are being used
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Table Statistics

```sql
-- Check table sizes and row counts
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Data Cleanup

### Clear All Sample Data

```sql
-- WARNING: This will delete all data!
-- Run these in order due to foreign key constraints

DELETE FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM risks WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM reg_changes WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM controls WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM policies WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM user_profiles WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
DELETE FROM tenants WHERE id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';

-- Verify all data is gone
SELECT 'tenants' as table_name, COUNT(*) as remaining FROM tenants WHERE id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'policies', COUNT(*) FROM policies WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'controls', COUNT(*) FROM controls WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'reg_changes', COUNT(*) FROM reg_changes WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'exceptions', COUNT(*) FROM exceptions WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad'
UNION ALL
SELECT 'risks', COUNT(*) FROM risks WHERE tenant_id = '5925873a-2119-444c-93b5-e0cd6ed1bdad';
```

---

## Troubleshooting Queries

### Find Orphaned Records

```sql
-- Find user_profiles without valid auth users
SELECT up.*
FROM user_profiles up
LEFT JOIN auth.users au ON up.user_id = au.id
WHERE au.id IS NULL;

-- Find policies without valid tenants
SELECT p.*
FROM policies p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE t.id IS NULL;
```

### Check RLS Policy Coverage

```sql
-- List tables with RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check User's Tenant Access

```sql
-- Find which tenant a user belongs to
SELECT
    au.id as user_id,
    au.email,
    up.tenant_id,
    t.name as tenant_name,
    up.role
FROM auth.users au
JOIN user_profiles up ON au.id = up.user_id
JOIN tenants t ON up.tenant_id = t.id
WHERE au.email = 'admin@fintech.com';  -- Replace with your email
```

---

This completes the sample data and testing queries guide. Use these queries to verify your setup and troubleshoot any issues.
