# Supabase Setup Guide for RegIntels App

This comprehensive guide walks you through setting up Supabase for the RegIntels regulatory compliance application from scratch.

## Table of Contents
1. [Initial Supabase Dashboard Setup](#1-initial-supabase-dashboard-setup)
2. [Database Schema Creation](#2-database-schema-creation)
3. [Row Level Security (RLS) Policies](#3-row-level-security-rls-policies)
4. [Storage Buckets Configuration](#4-storage-buckets-configuration)
5. [Email Templates Configuration](#5-email-templates-configuration)
6. [Auth Settings Configuration](#6-auth-settings-configuration)
7. [Testing Your Setup](#7-testing-your-setup)
8. [Connecting Your App](#8-connecting-your-app)

---

## 1. Initial Supabase Dashboard Setup

### Step 1.1: Create a New Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create a new account
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `regintels-production` (or your preferred name)
   - **Database Password**: Generate a strong password (save this securely!)
   - **Region**: Choose closest to your users (e.g., `us-east-1` for US East)
   - **Pricing Plan**: Start with Free tier, upgrade as needed
5. Click **"Create new project"**
6. Wait 2-3 minutes for project provisioning

### Step 1.2: Get Your Project Credentials

1. Once the project is ready, go to **Settings** (gear icon in sidebar)
2. Click on **API** in the Settings menu
3. Copy and save these values (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (only use this server-side!)

---

## 2. Database Schema Creation

### Step 2.1: Access SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"**
3. You'll run multiple SQL scripts below - execute them one at a time

### Step 2.2: Create Tables

Copy and paste the following SQL scripts into the SQL Editor and click **"Run"** after each section.

#### A. Enable UUID Extension

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### B. Create Tenants Table

```sql
-- Tenants table (multi-tenant architecture)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    regime TEXT NOT NULL, -- Regulatory regime (e.g., 'API', 'CASS', 'SYSC')
    frn TEXT, -- Financial Reference Number
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'suspended'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_tenants_status ON tenants(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### C. Create User Profiles Table

```sql
-- User profiles table (extends Supabase Auth users)
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    role TEXT NOT NULL DEFAULT 'Compliance', -- 'Admin', 'Compliance', 'Board', 'Viewer'
    department TEXT,
    smf_designation TEXT, -- Senior Manager Function (e.g., 'SMF16', 'SMF1')
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_tenant_id ON user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Updated_at trigger
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### D. Create Policies Table

```sql
-- Policies table
CREATE TABLE policies (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'active', 'archived'
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    regulator_regime TEXT, -- e.g., 'API', 'CASS', 'SYSC'
    content TEXT, -- Policy document content
    file_url TEXT, -- Storage URL for policy document
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_policies_tenant_id ON policies(tenant_id);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_owner ON policies(owner_user_id);

-- Updated_at trigger
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### E. Create Controls Table

```sql
-- Controls table
CREATE TABLE controls (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    control_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    frequency TEXT, -- 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    test_method TEXT, -- How the control is tested
    evidence_required TEXT, -- What evidence must be collected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, control_code)
);

-- Indexes
CREATE INDEX idx_controls_tenant_id ON controls(tenant_id);
CREATE INDEX idx_controls_status ON controls(status);
CREATE INDEX idx_controls_owner ON controls(owner_user_id);

-- Updated_at trigger
CREATE TRIGGER update_controls_updated_at BEFORE UPDATE ON controls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### F. Create Regulatory Changes Table

```sql
-- Regulatory changes table
CREATE TABLE reg_changes (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'FCA', 'PRA', 'ICO', etc.
    title TEXT NOT NULL,
    summary TEXT,
    full_text TEXT,
    published_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_review', 'actioned', 'not_applicable'
    impact_rating TEXT, -- 'low', 'medium', 'high', 'critical'
    assigned_to BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reg_changes_tenant_id ON reg_changes(tenant_id);
CREATE INDEX idx_reg_changes_status ON reg_changes(status);
CREATE INDEX idx_reg_changes_source ON reg_changes(source);
CREATE INDEX idx_reg_changes_impact ON reg_changes(impact_rating);
CREATE INDEX idx_reg_changes_published ON reg_changes(published_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_reg_changes_updated_at BEFORE UPDATE ON reg_changes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### G. Create Exceptions Table

```sql
-- Exceptions table (for tracking compliance exceptions)
CREATE TABLE exceptions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'control', 'incident', 'audit', 'complaint'
    source_id BIGINT, -- Reference to the source record (if applicable)
    title TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'remediation', 'closed'
    assigned_to BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_exceptions_tenant_id ON exceptions(tenant_id);
CREATE INDEX idx_exceptions_status ON exceptions(status);
CREATE INDEX idx_exceptions_severity ON exceptions(severity);
CREATE INDEX idx_exceptions_source ON exceptions(source_type, source_id);

-- Updated_at trigger
CREATE TRIGGER update_exceptions_updated_at BEFORE UPDATE ON exceptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### H. Create Risks Table

```sql
-- Risks table
CREATE TABLE risks (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Financial Crime', 'Information Security', 'Operational', etc.
    description TEXT,
    inherent_score INTEGER CHECK (inherent_score >= 1 AND inherent_score <= 25), -- 1-25 risk score
    residual_score INTEGER CHECK (residual_score >= 1 AND residual_score <= 25), -- After controls
    owner_user_id BIGINT REFERENCES user_profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'mitigated', 'accepted', 'transferred'
    review_frequency TEXT DEFAULT 'Quarterly', -- How often risk is reviewed
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risks_tenant_id ON risks(tenant_id);
CREATE INDEX idx_risks_status ON risks(status);
CREATE INDEX idx_risks_category ON risks(category);
CREATE INDEX idx_risks_owner ON risks(owner_user_id);

-- Updated_at trigger
CREATE TRIGGER update_risks_updated_at BEFORE UPDATE ON risks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. Row Level Security (RLS) Policies

Row Level Security ensures users can only access data from their own tenant. This is critical for multi-tenant security.

### Step 3.1: Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE reg_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE risks ENABLE ROW LEVEL SECURITY;
```

### Step 3.2: Create Helper Function

```sql
-- Helper function to get current user's tenant_id
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
```

### Step 3.3: Create RLS Policies for Tenants Table

```sql
-- Tenants: Users can only see their own tenant
CREATE POLICY "Users can view their own tenant"
    ON tenants FOR SELECT
    USING (id = get_user_tenant_id());

-- Tenants: Only allow updates by admins (you can customize this)
CREATE POLICY "Admins can update their tenant"
    ON tenants FOR UPDATE
    USING (
        id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND tenant_id = id
            AND role = 'Admin'
        )
    );
```

### Step 3.4: Create RLS Policies for User Profiles

```sql
-- User Profiles: Users can view profiles in their tenant
CREATE POLICY "Users can view profiles in their tenant"
    ON user_profiles FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- User Profiles: Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (user_id = auth.uid());

-- User Profiles: Admins can insert new profiles in their tenant
CREATE POLICY "Admins can insert profiles"
    ON user_profiles FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

### Step 3.5: Create RLS Policies for Policies Table

```sql
-- Policies: Users can view policies in their tenant
CREATE POLICY "Users can view policies in their tenant"
    ON policies FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Policies: Users can insert policies in their tenant
CREATE POLICY "Users can insert policies in their tenant"
    ON policies FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Policies: Users can update policies in their tenant
CREATE POLICY "Users can update policies in their tenant"
    ON policies FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Policies: Admins can delete policies
CREATE POLICY "Admins can delete policies"
    ON policies FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

### Step 3.6: Create RLS Policies for Controls Table

```sql
-- Controls: Users can view controls in their tenant
CREATE POLICY "Users can view controls in their tenant"
    ON controls FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Controls: Users can insert controls
CREATE POLICY "Users can insert controls"
    ON controls FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Controls: Users can update controls
CREATE POLICY "Users can update controls"
    ON controls FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Controls: Admins can delete controls
CREATE POLICY "Admins can delete controls"
    ON controls FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

### Step 3.7: Create RLS Policies for Reg Changes Table

```sql
-- Reg Changes: Users can view reg changes in their tenant
CREATE POLICY "Users can view reg changes in their tenant"
    ON reg_changes FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Reg Changes: Users can insert reg changes
CREATE POLICY "Users can insert reg changes"
    ON reg_changes FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Reg Changes: Users can update reg changes
CREATE POLICY "Users can update reg changes"
    ON reg_changes FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Reg Changes: Admins can delete reg changes
CREATE POLICY "Admins can delete reg changes"
    ON reg_changes FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

### Step 3.8: Create RLS Policies for Exceptions Table

```sql
-- Exceptions: Users can view exceptions in their tenant
CREATE POLICY "Users can view exceptions in their tenant"
    ON exceptions FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Exceptions: Users can insert exceptions
CREATE POLICY "Users can insert exceptions"
    ON exceptions FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Exceptions: Users can update exceptions
CREATE POLICY "Users can update exceptions"
    ON exceptions FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Exceptions: Admins can delete exceptions
CREATE POLICY "Admins can delete exceptions"
    ON exceptions FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

### Step 3.9: Create RLS Policies for Risks Table

```sql
-- Risks: Users can view risks in their tenant
CREATE POLICY "Users can view risks in their tenant"
    ON risks FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Risks: Users can insert risks
CREATE POLICY "Users can insert risks"
    ON risks FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Risks: Users can update risks
CREATE POLICY "Users can update risks"
    ON risks FOR UPDATE
    USING (tenant_id = get_user_tenant_id());

-- Risks: Admins can delete risks
CREATE POLICY "Admins can delete risks"
    ON risks FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() AND
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND role = 'Admin'
        )
    );
```

---

## 4. Storage Buckets Configuration

Storage buckets are used for file uploads (policy documents, evidence files, etc.).

### Step 4.1: Create Storage Buckets

1. In Supabase dashboard, click **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create the following buckets:

#### Bucket 1: Policy Documents
- **Name**: `policy-documents`
- **Public**: Unchecked (private)
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document`

#### Bucket 2: Evidence Files
- **Name**: `evidence-files`
- **Public**: Unchecked (private)
- **File size limit**: 50 MB
- **Allowed MIME types**: `application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

#### Bucket 3: Risk Assessments
- **Name**: `risk-assessments`
- **Public**: Unchecked (private)
- **File size limit**: 20 MB
- **Allowed MIME types**: `application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Step 4.2: Configure Storage Policies

For each bucket, you need to set up RLS policies. Go to **Storage** > **Policies** and add these policies:

```sql
-- Policy Documents Bucket Policies
-- Allow authenticated users to upload to their tenant folder
CREATE POLICY "Users can upload policy docs to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Allow users to read files from their tenant folder
CREATE POLICY "Users can read policy docs from their tenant folder"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Allow users to delete files from their tenant folder
CREATE POLICY "Users can delete policy docs from their tenant folder"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'policy-documents' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Evidence Files Bucket Policies
CREATE POLICY "Users can upload evidence to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

CREATE POLICY "Users can read evidence from their tenant folder"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'evidence-files' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

-- Risk Assessments Bucket Policies
CREATE POLICY "Users can upload risk assessments to their tenant folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'risk-assessments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);

CREATE POLICY "Users can read risk assessments from their tenant folder"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'risk-assessments' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = get_user_tenant_id()::text
);
```

---

## 5. Email Templates Configuration

Configure email templates for authentication and user notifications.

### Step 5.1: Access Email Templates

1. Go to **Authentication** > **Email Templates** in the Supabase dashboard

### Step 5.2: Customize Confirmation Email

Click on **"Confirm signup"** template and customize:

```html
<h2>Welcome to RegIntels!</h2>

<p>Hi there,</p>

<p>Thank you for signing up for RegIntels. To complete your registration and verify your email address, please click the button below:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirm Your Email</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 24 hours.</p>

<p>If you didn't create a RegIntels account, you can safely ignore this email.</p>

<p>Best regards,<br>
The RegIntels Team</p>
```

### Step 5.3: Customize Password Reset Email

Click on **"Reset password"** template:

```html
<h2>Reset Your RegIntels Password</h2>

<p>Hi there,</p>

<p>We received a request to reset your RegIntels password. Click the button below to set a new password:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

<p>Best regards,<br>
The RegIntels Team</p>
```

### Step 5.4: Customize Magic Link Email

Click on **"Magic Link"** template:

```html
<h2>Sign in to RegIntels</h2>

<p>Hi there,</p>

<p>Click the button below to sign in to your RegIntels account:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Sign In</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link will expire in 1 hour.</p>

<p>If you didn't request this sign-in link, you can safely ignore this email.</p>

<p>Best regards,<br>
The RegIntels Team</p>
```

### Step 5.5: Configure Email Settings

1. Go to **Authentication** > **Settings**
2. Under **SMTP Settings**, you can either:
   - Use Supabase's default email service (limited for production)
   - Configure your own SMTP server (recommended for production)

**For custom SMTP (recommended):**
- **Host**: Your SMTP server (e.g., `smtp.sendgrid.net`, `smtp.mailgun.org`)
- **Port**: Usually `587` for TLS
- **Username**: Your SMTP username
- **Password**: Your SMTP password
- **Sender email**: `noreply@yourdomain.com`
- **Sender name**: `RegIntels`

---

## 6. Auth Settings Configuration

Configure authentication settings for security and user experience.

### Step 6.1: General Auth Settings

1. Go to **Authentication** > **Settings**
2. Configure the following:

**Site URL**
- Set to your production URL: `https://yourdomain.com`
- For development: `http://localhost:3000`

**Redirect URLs**
- Add allowed callback URLs:
  ```
  http://localhost:3000/auth/callback
  https://yourdomain.com/auth/callback
  ```

### Step 6.2: Email Auth Configuration

Under **Auth Providers**, configure **Email**:

- **Enable Email provider**: ON
- **Confirm email**: ON (recommended - users must verify email)
- **Secure email change**: ON (recommended)
- **Secure password change**: ON (recommended)

### Step 6.3: Password Requirements

Under **Password Requirements**:

```
Minimum password length: 8 characters
Require uppercase letters: Yes
Require lowercase letters: Yes
Require numbers: Yes
Require special characters: No (optional)
```

### Step 6.4: Session Settings

Under **Sessions**:

- **JWT expiry**: 3600 seconds (1 hour)
- **Refresh token expiry**: 2592000 seconds (30 days)

### Step 6.5: Security Settings

Under **Security**:

- **Enable Refresh Token Rotation**: ON
- **Enable Reuse Interval**: 10 seconds

### Step 6.6: Advanced Settings

Under **Advanced**:

- **Disable signup**: OFF (allow new users to register)
- **Enable custom access token hook**: OFF (unless you need custom claims)
- **Enable Manual Linking**: OFF

---

## 7. Testing Your Setup

### Step 7.1: Insert Test Data

Run this SQL in the SQL Editor to create test data:

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

-- Note: You'll need to create a user through the Auth UI first, then add their profile
-- After creating a user, insert their profile:
-- INSERT INTO user_profiles (user_id, tenant_id, email, display_name, role, department, smf_designation)
-- VALUES (
--     'user-uuid-from-auth',
--     '5925873a-2119-444c-93b5-e0cd6ed1bdad',
--     'admin@fintech.com',
--     'Sarah Johnson',
--     'Admin',
--     'Compliance',
--     'SMF16'
-- );
```

### Step 7.2: Test Authentication

1. Go to **Authentication** > **Users**
2. Click **"Add user"** > **"Create new user"**
3. Fill in:
   - **Email**: `test@example.com`
   - **Password**: `TestPass123`
   - **Auto Confirm User**: ON (for testing)
4. Click **"Create user"**

### Step 7.3: Test RLS Policies

In SQL Editor, run:

```sql
-- Test that users can only see their tenant's data
SET request.jwt.claims.sub = 'your-user-uuid';
SELECT * FROM policies; -- Should only return policies for their tenant
```

### Step 7.4: Test Storage Upload

1. Go to **Storage** > **policy-documents**
2. Try uploading a file manually to test bucket configuration
3. Create a folder named with your tenant UUID
4. Upload a test PDF file

---

## 8. Connecting Your App

### Step 8.1: Update Environment Variables

Create a `.env` file in your project root (if it doesn't exist):

```env
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**IMPORTANT**: Add `.env` to your `.gitignore` file to avoid committing secrets!

### Step 8.2: Update Your App Code

The RegIntels app already has Supabase integration. You can configure it in two ways:

**Option 1: Environment Variables (Recommended)**

Update the Supabase configuration in `src/App.js`:

```javascript
let SUPABASE_CONFIG = {
  url: process.env.REACT_APP_SUPABASE_URL || '',
  anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY || ''
};
```

**Option 2: Runtime Configuration**

The app has a built-in configuration UI that appears when Supabase is not configured. Simply:
1. Launch the app
2. Enter your Supabase URL and anon key in the setup screen
3. Click "Save Configuration"

### Step 8.3: Test the Connection

1. Start your app: `npm start`
2. You should see the login screen
3. Try signing in with the test user you created
4. If successful, you should see the RegIntels dashboard

### Step 8.4: Create Your First Real User

1. Click "Start Onboarding" on the login page
2. Fill in the organization details
3. Create your admin account
4. Verify your email
5. Sign in and start using RegIntels!

---

## Troubleshooting

### Common Issues

**Issue: "Failed to fetch" errors**
- Check that your Supabase URL and anon key are correct
- Verify that RLS policies are correctly configured
- Check browser console for CORS errors

**Issue: "Unauthorized" errors**
- Ensure RLS is enabled on all tables
- Verify that RLS policies match your user's tenant_id
- Check that the user has a valid user_profile record

**Issue: "Cannot insert/update/delete" errors**
- Review RLS policies for the specific table
- Ensure the user has the correct role (Admin for certain operations)
- Check that tenant_id is being passed correctly

**Issue: Email verification not working**
- Check SMTP settings in Authentication > Settings
- Verify Site URL and Redirect URLs are correct
- Check email spam folder

**Issue: File upload failures**
- Verify storage bucket exists and RLS policies are set
- Check file size limits
- Ensure file path follows pattern: `tenant_id/filename.ext`

### Getting Help

- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [https://discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Create an issue in your RegIntels repository

---

## Security Checklist

Before going to production, ensure:

- [ ] All tables have RLS enabled
- [ ] RLS policies are tested and working correctly
- [ ] `.env` file is in `.gitignore`
- [ ] Custom SMTP is configured (not using Supabase default)
- [ ] Email verification is enabled
- [ ] Strong password requirements are set
- [ ] Site URL and Redirect URLs are production values
- [ ] Service role key is NEVER exposed to the client
- [ ] Storage buckets are private (not public)
- [ ] Database backups are configured (Supabase does this automatically)
- [ ] API rate limits are configured if needed

---

## Next Steps

After completing this setup:

1. **Customize the Schema**: Add any additional fields your organization needs
2. **Set Up Monitoring**: Configure Supabase logging and monitoring
3. **Create Backups**: Set up automatic backups (available in Supabase Pro plan)
4. **Add Audit Logging**: Create audit tables to track all data changes
5. **Configure Edge Functions**: If you need server-side logic (optional)
6. **Set Up CI/CD**: Automate database migrations using Supabase CLI

Congratulations! Your RegIntels Supabase backend is now fully configured and ready for use.
