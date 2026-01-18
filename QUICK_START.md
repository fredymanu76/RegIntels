# RegIntels - Quick Start Guide

This is a condensed version of the full Supabase setup. For detailed instructions, see [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md).

## 5-Minute Setup

### 1. Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create new project
2. Save your **Project URL** and **anon key** from Settings > API

### 2. Run Database Setup Script
Copy the complete SQL script below into Supabase SQL Editor and run it:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===== TABLES =====

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    regime TEXT NOT NULL,
    frn TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tenants_status ON tenants(status);
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Profiles
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'Compliance',
    department TEXT,
    smf_designation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Policies
CREATE TABLE policies (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    status TEXT NOT NULL DEFAULT 'draft',
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    regulator_regime TEXT,
    content TEXT,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_owner ON policies(owner_user_id);
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Controls
CREATE TABLE controls (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    control_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    frequency TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    test_method TEXT,
    evidence_required TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, control_code)
);
CREATE INDEX idx_controls_tenant_id ON controls(tenant_id);
CREATE INDEX idx_controls_status ON controls(status);
CREATE INDEX idx_controls_owner ON controls(owner_user_id);
CREATE TRIGGER update_controls_updated_at BEFORE UPDATE ON controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Regulatory Changes
CREATE TABLE reg_changes (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT,
    full_text TEXT,
    published_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'new',
    impact_rating TEXT,
    assigned_to BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reg_changes_tenant_id ON reg_changes(tenant_id);
CREATE INDEX idx_reg_changes_status ON reg_changes(status);
CREATE INDEX idx_reg_changes_source ON reg_changes(source);
CREATE INDEX idx_reg_changes_impact ON reg_changes(impact_rating);
CREATE INDEX idx_reg_changes_published ON reg_changes(published_at DESC);
CREATE TRIGGER update_reg_changes_updated_at BEFORE UPDATE ON reg_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Exceptions
CREATE TABLE exceptions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_id BIGINT,
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'open',
    assigned_to BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_exceptions_tenant_id ON exceptions(tenant_id);
CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_severity ON exceptions(severity);
CREATE INDEX idx_exceptions_source ON exceptions(source_type, source_id);
CREATE TRIGGER update_exceptions_updated_at BEFORE UPDATE ON exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Risks
CREATE TABLE risks (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    inherent_score INTEGER CHECK (inherent_score >= 1 AND inherent_score <= 25),
    residual_score INTEGER CHECK (residual_score >= 1 AND residual_score <= 25),
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    review_frequency TEXT DEFAULT 'Quarterly',
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_risks_tenant_id ON risks(tenant_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_category ON risks(category);
CREATE INDEX idx_risks_owner ON risks(owner_user_id);
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY =====

-- Enable RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id
        FROM user_profiles
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants policies
CREATE POLICY "Users can view their own tenant" ON tenants FOR SELECT
    USING (id = get_user_tenant_id());
CREATE POLICY "Admins can update their tenant" ON tenants FOR UPDATE
    USING (id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND tenant_id = id AND role = 'Admin'
    ));

-- User profiles policies
CREATE POLICY "Users can view profiles in their tenant" ON user_profiles FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE
    USING (user_id = auth.uid());
CREATE POLICY "Admins can insert profiles" ON user_profiles FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- Policies table policies
CREATE POLICY "Users can view policies in their tenant" ON policies FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert policies in their tenant" ON policies FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update policies in their tenant" ON policies FOR UPDATE
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins can delete policies" ON policies FOR DELETE
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- Controls policies
CREATE POLICY "Users can view controls in their tenant" ON controls FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert controls" ON controls FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update controls" ON controls FOR UPDATE
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins can delete controls" ON controls FOR DELETE
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- Reg changes policies
CREATE POLICY "Users can view reg changes in their tenant" ON reg_changes FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert reg changes" ON reg_changes FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update reg changes" ON reg_changes FOR UPDATE
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins can delete reg changes" ON reg_changes FOR DELETE
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- Exceptions policies
CREATE POLICY "Users can view exceptions in their tenant" ON exceptions FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert exceptions" ON exceptions FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update exceptions" ON exceptions FOR UPDATE
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins can delete exceptions" ON exceptions FOR DELETE
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- Risks policies
CREATE POLICY "Users can view risks in their tenant" ON risks FOR SELECT
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can insert risks" ON risks FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "Users can update risks" ON risks FOR UPDATE
    USING (tenant_id = get_user_tenant_id());
CREATE POLICY "Admins can delete risks" ON risks FOR DELETE
    USING (tenant_id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'Admin'
    ));

-- ===== TEST DATA (Optional) =====
-- Uncomment to add sample data for testing

-- INSERT INTO tenants (id, name, regime, frn, status, created_at)
-- VALUES (
--     '5925873a-2119-444c-93b5-e0cd6ed1bdad',
--     'Fintech Solutions Ltd',
--     'API',
--     'FRN123456',
--     'active',
--     NOW()
-- );
```

### 3. Create Storage Buckets
1. Go to **Storage** in Supabase dashboard
2. Create these buckets (all private):
   - `policy-documents` (10 MB limit)
   - `evidence-files` (50 MB limit)
   - `risk-assessments` (20 MB limit)

### 4. Configure Email (Optional)
1. Go to **Authentication** > **Email Templates**
2. Customize confirmation and password reset emails
3. Set up SMTP under **Authentication** > **Settings** (or use default for testing)

### 5. Connect Your App
Create `.env` file in project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

Or use the built-in configuration UI when you first run the app.

### 6. Start the App
```bash
npm install
npm start
```

## Database Schema Overview

### Tables
- **tenants** - Organization/company information
- **user_profiles** - User details linked to auth.users
- **policies** - Compliance policies and documents
- **controls** - Compliance controls and testing procedures
- **reg_changes** - Regulatory change tracking
- **exceptions** - Compliance exceptions and incidents
- **risks** - Risk register and assessments

### Key Fields

**Tenants**
- `id` (UUID) - Unique tenant identifier
- `regime` - Regulatory regime (e.g., 'API', 'CASS', 'SYSC')
- `status` - 'pending', 'active', 'suspended'

**User Profiles**
- `role` - 'Admin', 'Compliance', 'Board', 'Viewer'
- `smf_designation` - Senior Manager Function (e.g., 'SMF16')

**Policies**
- `status` - 'draft', 'active', 'archived'
- `version` - Policy version number
- `regulator_regime` - Applicable regulatory regime

**Controls**
- `frequency` - 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'
- `control_code` - Unique identifier (e.g., 'AML-001')

**Reg Changes**
- `status` - 'new', 'in_review', 'actioned', 'not_applicable'
- `impact_rating` - 'low', 'medium', 'high', 'critical'

**Exceptions**
- `severity` - 'low', 'medium', 'high', 'critical'
- `status` - 'open', 'remediation', 'closed'
- `source_type` - 'control', 'incident', 'audit', 'complaint'

**Risks**
- `inherent_score` - Risk before controls (1-25)
- `residual_score` - Risk after controls (1-25)
- `status` - 'active', 'mitigated', 'accepted', 'transferred'

## Multi-Tenant Architecture

RegIntels uses a **shared database, shared schema** multi-tenant model:

1. All tenants share the same tables
2. Every data table has a `tenant_id` column
3. Row Level Security (RLS) ensures data isolation
4. Users can only access data from their own tenant
5. Storage uses folder-based isolation (`bucket/tenant_id/file.pdf`)

## Security Model

### Row Level Security (RLS)
- All tables have RLS enabled
- Users automatically filtered by their `tenant_id`
- Helper function `get_user_tenant_id()` retrieves current user's tenant
- Admin-only operations protected by role checks

### Roles
- **Admin** - Full access, can manage users and settings
- **Compliance** - Can create/edit most content
- **Board** - Read-only access to reports and dashboards
- **Viewer** - Limited read-only access

### Authentication
- Email/password authentication
- Email verification required
- Password requirements: 8+ chars, uppercase, lowercase, numbers
- JWT tokens expire after 1 hour
- Refresh tokens valid for 30 days

## Common Operations

### Adding a New User
1. User signs up through the app
2. Tenant record created (status: 'pending')
3. User profile created and linked to tenant
4. Email verification sent
5. After verification, tenant status → 'active'

### Creating a Policy
```javascript
await createPolicy(tenantId, {
  title: 'My Policy',
  version: '1.0',
  status: 'draft',
  regulator_regime: 'API'
});
```

### Uploading a Document
```javascript
// Upload to: policy-documents/tenant_id/filename.pdf
const { data, error } = await supabase.storage
  .from('policy-documents')
  .upload(`${tenantId}/my-policy.pdf`, file);
```

## Troubleshooting

**"Failed to fetch" errors**
- Verify Supabase URL and anon key
- Check browser console for details
- Ensure RLS policies are configured

**"Unauthorized" errors**
- User might not have a user_profile record
- Check tenant_id matches between user_profile and data
- Verify RLS policies allow the operation

**Email not sending**
- Check SMTP configuration
- Verify Site URL is correct
- Check spam folder

## Production Checklist

Before deploying to production:

- [ ] Custom domain configured
- [ ] SMTP email configured (not using Supabase default)
- [ ] Environment variables set in production
- [ ] SSL/TLS enabled
- [ ] Database backups enabled
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up
- [ ] `.env` file in `.gitignore`
- [ ] Service role key secured (never in client code)

## Next Steps

1. Review the full [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md) for detailed explanations
2. Customize the schema for your specific needs
3. Set up database migrations using Supabase CLI
4. Configure monitoring and alerts
5. Add audit logging tables
6. Set up automated backups

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [RegIntels GitHub Repository](https://github.com/yourusername/regintels-app)
- [Supabase Discord Community](https://discord.supabase.com)

---

**Need help?** Open an issue on GitHub or contact support.
