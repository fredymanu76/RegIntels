# RegIntels Database Schema Reference

This document provides a detailed reference of the RegIntels database schema, including entity relationships, field descriptions, and constraints.

## Table of Contents
- [Schema Overview](#schema-overview)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Table Definitions](#table-definitions)
- [Indexes](#indexes)
- [Constraints and Validations](#constraints-and-validations)
- [Enums and Constants](#enums-and-constants)

---

## Schema Overview

RegIntels uses a **multi-tenant SaaS architecture** with the following characteristics:

- **7 core tables** for business logic
- **Shared database, shared schema** model
- **Row-level security (RLS)** for tenant isolation
- **UUID-based tenant IDs** for security
- **Audit timestamps** on all tables (created_at, updated_at)
- **Soft references** between tables (some use ON DELETE SET NULL)

---

## Entity Relationship Diagram

```
┌─────────────────┐
│   auth.users    │ (Supabase Auth - managed by Supabase)
│                 │
│ - id (UUID)     │
│ - email         │
│ - encrypted_pw  │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────────────┐              ┌──────────────────┐
│    user_profiles        │   N:1        │     tenants      │
│                         ├─────────────►│                  │
│ - id (bigserial)        │              │ - id (UUID) PK   │
│ - user_id (UUID) FK     │              │ - name           │
│ - tenant_id (UUID) FK   │◄─┐           │ - regime         │
│ - email                 │  │           │ - frn            │
│ - display_name          │  │           │ - status         │
│ - role                  │  │           └──────────────────┘
│ - department            │  │
│ - smf_designation       │  │
└─────────────────────────┘  │
                             │
         ┌───────────────────┴───────────────────────────────┐
         │                                                   │
         │ N:1                                               │ N:1
         │                                                   │
┌────────┴────────────┐         ┌─────────────────┐   ┌─────┴───────────┐
│     policies        │         │    controls     │   │   reg_changes   │
│                     │         │                 │   │                 │
│ - id (bigserial) PK │         │ - id (big...) PK│   │ - id (big...) PK│
│ - tenant_id (UUID)  │         │ - tenant_id     │   │ - tenant_id     │
│ - title             │         │ - control_code  │   │ - source        │
│ - version           │         │ - title         │   │ - title         │
│ - status            │         │ - description   │   │ - summary       │
│ - owner_user_id     │         │ - owner_user_id │   │ - published_at  │
│ - regulator_regime  │         │ - frequency     │   │ - status        │
│ - content           │         │ - status        │   │ - impact_rating │
│ - file_url          │         │ - test_method   │   │ - assigned_to   │
└─────────────────────┘         │ - evidence_req  │   └─────────────────┘
                                └────────┬────────┘
                                         │
                                         │ 1:N (soft reference)
                                         │
                                ┌────────▼──────────┐      ┌──────────────┐
                                │    exceptions     │      │    risks     │
                                │                   │      │              │
                                │ - id (big...) PK  │      │ - id (...)PK │
                                │ - tenant_id       │      │ - tenant_id  │
                                │ - source_type     │      │ - name       │
                                │ - source_id       │      │ - category   │
                                │ - title           │      │ - inherent   │
                                │ - description     │      │ - residual   │
                                │ - severity        │      │ - owner_id   │
                                │ - status          │      │ - status     │
                                │ - assigned_to     │      └──────────────┘
                                │ - opened_at       │
                                │ - closed_at       │
                                └───────────────────┘
```

---

## Table Definitions

### tenants

Multi-tenant root table. Each organization/company is a tenant.

| Column     | Type         | Constraints           | Description |
|------------|--------------|-----------------------|-------------|
| id         | UUID         | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique tenant identifier |
| name       | TEXT         | NOT NULL              | Organization name |
| regime     | TEXT         | NOT NULL              | Primary regulatory regime (API, CASS, SYSC, etc.) |
| frn        | TEXT         | NULL                  | Financial Reference Number (FCA) |
| status     | TEXT         | NOT NULL, DEFAULT 'pending' | Account status: 'pending', 'active', 'suspended' |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_tenants_status` on `status`

**RLS Policies:**
- Users can view their own tenant only
- Admins can update their tenant

---

### user_profiles

Extends Supabase Auth users with application-specific data.

| Column          | Type         | Constraints           | Description |
|-----------------|--------------|-----------------------|-------------|
| id              | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| user_id         | UUID         | NOT NULL, FK→auth.users(id) ON DELETE CASCADE | Supabase Auth user ID |
| tenant_id       | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| email           | TEXT         | NOT NULL              | User email (duplicate of auth.users.email) |
| display_name    | TEXT         | NULL                  | User's full name |
| role            | TEXT         | NOT NULL, DEFAULT 'Compliance' | User role: 'Admin', 'Compliance', 'Board', 'Viewer' |
| department      | TEXT         | NULL                  | User's department |
| smf_designation | TEXT         | NULL                  | Senior Manager Function (e.g., 'SMF16', 'SMF1') |
| created_at      | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at      | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Constraints:**
- UNIQUE(user_id, tenant_id) - User can only belong to a tenant once

**Indexes:**
- `idx_user_profiles_user_id` on `user_id`
- `idx_user_profiles_tenant_id` on `tenant_id`
- `idx_user_profiles_email` on `email`

**RLS Policies:**
- Users can view all profiles in their tenant
- Users can update their own profile
- Admins can insert new profiles

---

### policies

Stores compliance policies and policy documents.

| Column           | Type         | Constraints           | Description |
|------------------|--------------|-----------------------|-------------|
| id               | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| tenant_id        | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| title            | TEXT         | NOT NULL              | Policy title |
| version          | TEXT         | NOT NULL, DEFAULT '1.0' | Version number (e.g., '2.1') |
| status           | TEXT         | NOT NULL, DEFAULT 'draft' | Status: 'draft', 'active', 'archived' |
| owner_user_id    | BIGINT       | FK→user_profiles(id) ON DELETE SET NULL | Policy owner |
| regulator_regime | TEXT         | NULL                  | Applicable regulatory regime |
| content          | TEXT         | NULL                  | Policy content (plain text or markdown) |
| file_url         | TEXT         | NULL                  | Storage URL for policy document |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at       | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_policies_tenant_id` on `tenant_id`
- `idx_policies_status` on `status`
- `idx_policies_owner` on `owner_user_id`

**RLS Policies:**
- Users can view/insert/update policies in their tenant
- Admins can delete policies

---

### controls

Defines compliance controls and testing procedures.

| Column            | Type         | Constraints           | Description |
|-------------------|--------------|-----------------------|-------------|
| id                | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| tenant_id         | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| control_code      | TEXT         | NOT NULL              | Unique control identifier (e.g., 'AML-001') |
| title             | TEXT         | NOT NULL              | Control name |
| description       | TEXT         | NULL                  | Control description |
| owner_user_id     | BIGINT       | FK→user_profiles(id) ON DELETE SET NULL | Control owner |
| frequency         | TEXT         | NULL                  | Testing frequency: 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual' |
| status            | TEXT         | NOT NULL, DEFAULT 'active' | Status: 'active', 'inactive' |
| test_method       | TEXT         | NULL                  | How the control is tested |
| evidence_required | TEXT         | NULL                  | Required evidence for testing |
| created_at        | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at        | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Constraints:**
- UNIQUE(tenant_id, control_code) - Control codes unique per tenant

**Indexes:**
- `idx_controls_tenant_id` on `tenant_id`
- `idx_controls_status` on `status`
- `idx_controls_owner` on `owner_user_id`

**RLS Policies:**
- Users can view/insert/update controls in their tenant
- Admins can delete controls

---

### reg_changes

Tracks regulatory changes from various sources (FCA, PRA, ICO, etc.).

| Column         | Type         | Constraints           | Description |
|----------------|--------------|-----------------------|-------------|
| id             | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| tenant_id      | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| source         | TEXT         | NOT NULL              | Regulatory source: 'FCA', 'PRA', 'ICO', etc. |
| title          | TEXT         | NOT NULL              | Change title |
| summary        | TEXT         | NULL                  | Brief summary |
| full_text      | TEXT         | NULL                  | Complete text of the change |
| published_at   | TIMESTAMPTZ  | NULL                  | When the change was published |
| status         | TEXT         | NOT NULL, DEFAULT 'new' | Status: 'new', 'in_review', 'actioned', 'not_applicable' |
| impact_rating  | TEXT         | NULL                  | Impact: 'low', 'medium', 'high', 'critical' |
| assigned_to    | BIGINT       | FK→user_profiles(id) ON DELETE SET NULL | Assigned reviewer |
| created_at     | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at     | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_reg_changes_tenant_id` on `tenant_id`
- `idx_reg_changes_status` on `status`
- `idx_reg_changes_source` on `source`
- `idx_reg_changes_impact` on `impact_rating`
- `idx_reg_changes_published` on `published_at DESC`

**RLS Policies:**
- Users can view/insert/update reg changes in their tenant
- Admins can delete reg changes

---

### exceptions

Tracks compliance exceptions, incidents, audit findings, and complaints.

| Column           | Type         | Constraints           | Description |
|------------------|--------------|-----------------------|-------------|
| id               | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| tenant_id        | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| source_type      | TEXT         | NOT NULL              | Source: 'control', 'incident', 'audit', 'complaint' |
| source_id        | BIGINT       | NULL                  | ID of source record (if applicable) |
| title            | TEXT         | NOT NULL              | Exception title |
| description      | TEXT         | NULL                  | Detailed description |
| severity         | TEXT         | NOT NULL, DEFAULT 'medium' | Severity: 'low', 'medium', 'high', 'critical' |
| status           | TEXT         | NOT NULL, DEFAULT 'open' | Status: 'open', 'remediation', 'closed' |
| assigned_to      | BIGINT       | FK→user_profiles(id) ON DELETE SET NULL | Assigned owner |
| opened_at        | TIMESTAMPTZ  | DEFAULT NOW()         | When exception was opened |
| closed_at        | TIMESTAMPTZ  | NULL                  | When exception was closed |
| resolution_notes | TEXT         | NULL                  | How the exception was resolved |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at       | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_exceptions_tenant_id` on `tenant_id`
- `idx_exceptions_status` on `status`
- `idx_exceptions_severity` on `severity`
- `idx_exceptions_source` on `(source_type, source_id)`

**RLS Policies:**
- Users can view/insert/update exceptions in their tenant
- Admins can delete exceptions

---

### risks

Risk register for tracking and managing organizational risks.

| Column            | Type         | Constraints           | Description |
|-------------------|--------------|-----------------------|-------------|
| id                | BIGSERIAL    | PRIMARY KEY           | Auto-incrementing ID |
| tenant_id         | UUID         | NOT NULL, FK→tenants(id) ON DELETE CASCADE | Associated tenant |
| name              | TEXT         | NOT NULL              | Risk name |
| category          | TEXT         | NOT NULL              | Category: 'Financial Crime', 'Information Security', 'Operational', etc. |
| description       | TEXT         | NULL                  | Risk description |
| inherent_score    | INTEGER      | CHECK (1-25)          | Risk score before controls |
| residual_score    | INTEGER      | CHECK (1-25)          | Risk score after controls |
| owner_user_id     | BIGINT       | FK→user_profiles(id) ON DELETE SET NULL | Risk owner |
| status            | TEXT         | NOT NULL, DEFAULT 'active' | Status: 'active', 'mitigated', 'accepted', 'transferred' |
| review_frequency  | TEXT         | DEFAULT 'Quarterly'   | How often risk is reviewed |
| last_reviewed_at  | TIMESTAMPTZ  | NULL                  | Last review date |
| next_review_at    | TIMESTAMPTZ  | NULL                  | Next scheduled review |
| created_at        | TIMESTAMPTZ  | DEFAULT NOW()         | Record creation timestamp |
| updated_at        | TIMESTAMPTZ  | DEFAULT NOW()         | Last update timestamp (auto-updated) |

**Indexes:**
- `idx_risks_tenant_id` on `tenant_id`
- `idx_risks_status` on `status`
- `idx_risks_category` on `category`
- `idx_risks_owner` on `owner_user_id`

**RLS Policies:**
- Users can view/insert/update risks in their tenant
- Admins can delete risks

---

## Indexes

All indexes are automatically created by the schema creation script:

### Tenant Filtering (Performance Critical)
- Every table has an index on `tenant_id` for fast filtering
- These are the most frequently used indexes due to RLS

### Status Filtering
- Most tables have status indexes for dashboard filtering
- Used in queries like "show all active policies"

### User Assignment
- Tables with `owner_user_id` or `assigned_to` have indexes
- Supports "my items" and "assigned to me" queries

### Time-based Queries
- `reg_changes.published_at` has descending index for "latest changes"

---

## Constraints and Validations

### Foreign Key Relationships

**CASCADE Deletes:**
- `user_profiles.user_id` → `auth.users(id)` (user deleted → profile deleted)
- `user_profiles.tenant_id` → `tenants(id)` (tenant deleted → all data deleted)
- All data tables → `tenants(id)` (tenant deleted → all associated data deleted)

**SET NULL Deletes:**
- `policies.owner_user_id` → `user_profiles(id)` (user deleted → owner set to NULL)
- `controls.owner_user_id` → `user_profiles(id)`
- `risks.owner_user_id` → `user_profiles(id)`
- `exceptions.assigned_to` → `user_profiles(id)`
- `reg_changes.assigned_to` → `user_profiles(id)`

### Unique Constraints
- `user_profiles(user_id, tenant_id)` - User can't be in same tenant twice
- `controls(tenant_id, control_code)` - Control codes unique per tenant

### Check Constraints
- `risks.inherent_score` BETWEEN 1 AND 25
- `risks.residual_score` BETWEEN 1 AND 25

---

## Enums and Constants

While PostgreSQL enums are not used (to allow flexibility), the following TEXT fields have expected values:

### tenants.status
- `pending` - Awaiting verification
- `active` - Active account
- `suspended` - Temporarily disabled

### user_profiles.role
- `Admin` - Full system access
- `Compliance` - Standard compliance user
- `Board` - Read-only board member access
- `Viewer` - Limited read-only access

### policies.status
- `draft` - Work in progress
- `active` - Currently in effect
- `archived` - Historical/superseded

### controls.status
- `active` - Currently operational
- `inactive` - Disabled/deprecated

### controls.frequency
- `Daily`
- `Weekly`
- `Monthly`
- `Quarterly`
- `Annual`

### reg_changes.status
- `new` - Just imported/created
- `in_review` - Being assessed
- `actioned` - Actions taken
- `not_applicable` - Doesn't apply to tenant

### reg_changes.impact_rating
- `low`
- `medium`
- `high`
- `critical`

### exceptions.source_type
- `control` - From control testing
- `incident` - Incident/breach
- `audit` - Audit finding
- `complaint` - Customer complaint

### exceptions.severity
- `low`
- `medium`
- `high`
- `critical`

### exceptions.status
- `open` - Newly identified
- `remediation` - Being fixed
- `closed` - Resolved

### risks.status
- `active` - Current risk
- `mitigated` - Fully mitigated
- `accepted` - Risk accepted
- `transferred` - Transferred (e.g., insurance)

---

## Migration Strategy

For future schema changes:

1. **Use Supabase CLI** for version-controlled migrations
2. **Never delete columns** - mark as deprecated instead
3. **Add new columns as NULL** - then backfill data
4. **Update RLS policies** when adding tables
5. **Test migrations** on staging environment first

Example migration file structure:
```
supabase/migrations/
  └── 20250117000001_add_policy_categories.sql
  └── 20250117000002_add_control_testing_table.sql
```

---

## Data Relationships Summary

**One-to-Many:**
- tenant → user_profiles (1:N)
- tenant → policies (1:N)
- tenant → controls (1:N)
- tenant → reg_changes (1:N)
- tenant → exceptions (1:N)
- tenant → risks (1:N)

**Many-to-One (Assignment/Ownership):**
- policies → user_profiles (owner)
- controls → user_profiles (owner)
- risks → user_profiles (owner)
- exceptions → user_profiles (assigned_to)
- reg_changes → user_profiles (assigned_to)

**Soft References:**
- exceptions.source_id → controls.id (or other tables based on source_type)

---

## Storage Organization

File storage follows this pattern:

```
bucket-name/
  └── {tenant_id}/
      └── {category}/
          └── {filename}

Example:
policy-documents/
  └── 5925873a-2119-444c-93b5-e0cd6ed1bdad/
      └── aml/
          └── aml-policy-v2.1.pdf
```

This ensures tenant isolation at the storage level.

---

## Future Enhancements

Potential schema additions:

1. **Audit Log Table** - Track all data changes
2. **Policy Packs Table** - Group related policies
3. **Control Testing Results** - Historical test results
4. **Notifications Table** - User notifications
5. **Comments Table** - Comments on policies/risks/controls
6. **Attachments Table** - Generic file attachments
7. **Workflows Table** - Approval workflows
8. **Reports Table** - Saved report configurations

---

For implementation details, see [SUPABASE_SETUP_GUIDE.md](./SUPABASE_SETUP_GUIDE.md).
