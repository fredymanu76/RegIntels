# RegIntels Database Schema Reference

**Last Updated:** 2026-01-24
**Database:** Supabase PostgreSQL
**Schema:** public

---

## Table of Contents

1. [Core Tables](#core-tables)
2. [Multi-Tenant Tables](#multi-tenant-tables)
3. [Strategic Views](#strategic-views)
4. [Solution 4 Views (Risk Signal Hub)](#solution-4-views-risk-signal-hub)
5. [Solution 5 Views (Board View)](#solution-5-views-board-view)
6. [Column Name Reference](#column-name-reference)

---

## Core Tables

### 1. `regulatory_changes`

Tracks regulatory changes that affect the organization.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `title` | TEXT | No | - | Title of the regulatory change |
| `description` | TEXT | Yes | - | Detailed description |
| `regulator` | TEXT | No | - | Regulatory body (e.g., 'FCA', 'OFAC') |
| `materiality` | TEXT | No | 'medium' | Impact level: 'low', 'medium', 'high' |
| `published_at` | TIMESTAMPTZ | No | `NOW()` | Publication date |
| `effective_date` | DATE | Yes | - | When the change takes effect |
| `status` | TEXT | No | 'pending' | Status: 'pending', 'active', 'archived' |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_regulatory_changes_status` on `status`
- `idx_regulatory_changes_materiality` on `materiality`
- `idx_regulatory_changes_published_at` on `published_at DESC`

---

### 2. `controls`

**⚠️ IMPORTANT: Column Name Discrepancy**

The base schema (001_base_schema.sql) defines this column as `control_id`:
```sql
control_id TEXT NOT NULL UNIQUE
```

However, the production schema and newer views reference it as `control_code`. The actual column name in your production database is likely:
- **Base migration:** `control_id` (TEXT)
- **Production/Views:** Referenced as `control_code` in views

**Base Schema Columns:**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `control_id` | TEXT | No | - | Unique control identifier (e.g., 'CTRL-001') |
| `control_title` | TEXT | No | - | Control name/title |
| `control_owner` | TEXT | Yes | - | Person responsible for the control |
| `control_description` | TEXT | Yes | - | Detailed description |
| `last_reviewed_at` | TIMESTAMPTZ | Yes | - | Last review date |
| `next_review_date` | DATE | Yes | - | Next scheduled review |
| `status` | TEXT | No | 'active' | Status: 'active', 'inactive', 'archived' |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Production Schema (Inferred from Views):**

The production schema appears to have been extended with these additional columns:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `tenant_id` | UUID | Yes | Foreign key to tenants table |
| `control_code` | TEXT | No | Same as `control_id` or aliased in views |
| `title` | TEXT | No | Same as `control_title` or aliased |
| `frequency` | TEXT | Yes | Testing frequency |
| `test_method` | TEXT | Yes | Method used to test the control |
| `evidence_required` | TEXT | Yes | Evidence requirements |

**Indexes:**
- `idx_controls_control_id` on `control_id`
- `idx_controls_status` on `status`
- `idx_controls_next_review_date` on `next_review_date`

---

### 3. `regulatory_change_control_map`

Junction table linking regulatory changes to affected controls.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `regulatory_change_id` | UUID | No | - | FK to `regulatory_changes.id` |
| `control_id` | UUID | No | - | FK to `controls.id` |
| `impact_level` | TEXT | No | 'medium' | Impact: 'low', 'medium', 'high' |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |

**Constraints:**
- UNIQUE constraint on `(regulatory_change_id, control_id)`
- Foreign key to `regulatory_changes(id)` ON DELETE CASCADE
- Foreign key to `controls(id)` ON DELETE CASCADE

**Indexes:**
- `idx_rccm_reg_change` on `regulatory_change_id`
- `idx_rccm_control` on `control_id`

---

### 4. `attestations`

Tracks control attestations and their approval status.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `control_id` | UUID | No | - | FK to `controls.id` |
| `change_id` | UUID | Yes | - | FK to `regulatory_changes.id` |
| `attestor_id` | UUID | Yes | - | User who attests |
| `attestor_role` | TEXT | No | 'Other' | Role: 'SMF', 'Control Owner', 'Owner', 'Deputy', 'Delegate', 'Other' |
| `status` | TEXT | No | 'pending' | Status: 'pending', 'approved', 'failed', 'rejected' |
| `due_date` | DATE | No | - | Attestation due date |
| `submitted_at` | TIMESTAMPTZ | Yes | - | Submission timestamp |
| `notes` | TEXT | Yes | - | Additional notes |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_attestations_control` on `control_id`
- `idx_attestations_change` on `change_id`
- `idx_attestations_status` on `status`
- `idx_attestations_due_date` on `due_date`

---

### 5. `exceptions`

**⚠️ CRITICAL SCHEMA EVOLUTION**

The exceptions table has evolved significantly between the base schema and production.

**Base Schema (001_base_schema.sql):**

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `control_id` | UUID | No | - | FK to `controls.id` |
| `title` | TEXT | No | - | Exception title |
| `description` | TEXT | Yes | - | Detailed description |
| `status` | TEXT | No | 'open' | Status: 'open', 'closed', 'expired' |
| `severity` | TEXT | No | 'medium' | Severity: 'low', 'medium', 'high', 'critical' |
| `expiry_date` | DATE | Yes | - | When exception expires |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |
| `closed_at` | TIMESTAMPTZ | Yes | - | When exception was closed |

**Production Schema (Inferred from Solution 4 & 5 Views):**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `tenant_id` | UUID | Yes | FK to tenants table |
| `source_id` | UUID | Yes | Generic FK (replaces `control_id`) |
| `source_type` | TEXT | Yes | Type of source ('control', etc.) |
| `title` | TEXT | No | Exception title |
| `description` | TEXT | Yes | Detailed description |
| `status` | TEXT | No | Status: 'open', 'closed', 'in_remediation' |
| `severity` | TEXT | No | Severity: 'low', 'medium', 'high', 'critical' |
| `opened_at` | TIMESTAMPTZ | Yes | When exception was opened |
| `closed_at` | TIMESTAMPTZ | Yes | When exception was closed |
| `remediation_plan` | TEXT | Yes | Remediation plan details |
| `created_at` | TIMESTAMPTZ | No | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Key Changes:**
- `control_id` → `source_id` + `source_type` (polymorphic relationship)
- Added `tenant_id` for multi-tenancy
- Added `opened_at` field
- Added `remediation_plan` field
- Status expanded to include 'in_remediation'

**Indexes:**
- `idx_exceptions_control` on `control_id` (base) or `source_id` (production)
- `idx_exceptions_status` on `status`
- `idx_exceptions_created_at` on `created_at DESC`

---

### 6. `change_signoffs`

Tracks approvals/signoffs for regulatory changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `change_id` | UUID | No | - | FK to `regulatory_changes.id` |
| `signoff_by` | UUID | Yes | - | User who signed off |
| `signoff_role` | TEXT | Yes | - | Role of signoff person |
| `signoff_status` | TEXT | No | 'pending' | Status: 'pending', 'approved', 'rejected' |
| `signed_at` | TIMESTAMPTZ | Yes | - | Signoff timestamp |
| `notes` | TEXT | Yes | - | Additional notes |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |

**Indexes:**
- `idx_change_signoffs_change` on `change_id`
- `idx_change_signoffs_status` on `signoff_status`

---

### 7. `actions`

Tracks actions required for regulatory changes.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `change_id` | UUID | No | - | FK to `regulatory_changes.id` |
| `control_id` | UUID | Yes | - | FK to `controls.id` |
| `title` | TEXT | No | - | Action title |
| `description` | TEXT | Yes | - | Detailed description |
| `assigned_to` | UUID | Yes | - | User assigned to action |
| `status` | TEXT | No | 'pending' | Status: 'pending', 'in_progress', 'completed', 'overdue', 'cancelled' |
| `due_date` | DATE | Yes | - | Action due date |
| `completed_at` | TIMESTAMPTZ | Yes | - | Completion timestamp |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_actions_change` on `change_id`
- `idx_actions_control` on `control_id`
- `idx_actions_status` on `status`
- `idx_actions_due_date` on `due_date`

---

## Multi-Tenant Tables

### 8. `platform_admins`

Stores platform administrators who can manage the system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | No | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | No | - | FK to `auth.users(id)` |
| `email` | TEXT | No | - | Admin email |
| `display_name` | TEXT | Yes | - | Display name |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `created_by` | UUID | Yes | - | FK to `auth.users(id)` |
| `is_active` | BOOLEAN | No | TRUE | Whether admin is active |

**Constraints:**
- UNIQUE constraint on `user_id`
- Foreign key to `auth.users(id)` ON DELETE CASCADE

**Indexes:**
- `idx_platform_admins_user_id` on `user_id`
- `idx_platform_admins_email` on `email`

---

### 9. `tenants`

**⚠️ NOTE:** This table is referenced in views but not created in the base migrations.

**Inferred Schema from Views:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `name` | TEXT | No | Tenant organization name |
| `status` | TEXT | No | Status: 'pending_verification', 'approved', 'active', 'suspended', 'inactive' |
| `regime` | TEXT | Yes | Regulatory regime |
| `frn` | TEXT | Yes | Firm Reference Number |
| `contact_email` | TEXT | Yes | Contact email |
| `created_by` | UUID | Yes | FK to `auth.users(id)` |
| `approved_by` | UUID | Yes | FK to `platform_admins.user_id` |
| `approved_at` | TIMESTAMPTZ | Yes | Approval timestamp |
| `activated_at` | TIMESTAMPTZ | Yes | Activation timestamp |
| `deleted_at` | TIMESTAMPTZ | Yes | Soft delete timestamp |
| `created_at` | TIMESTAMPTZ | No | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

**Indexes:**
- `idx_tenants_status` on `status`

---

### 10. `user_profiles`

**⚠️ NOTE:** Referenced in RLS policies but not defined in base migrations.

**Inferred Schema:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID | No | Primary key |
| `user_id` | UUID | No | FK to `auth.users(id)` |
| `tenant_id` | UUID | No | FK to `tenants.id` |
| `created_at` | TIMESTAMPTZ | No | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | Last update timestamp |

---

### 11. `platform_features`

Feature flag system for controlling tenant access to features.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | TEXT | No | - | Primary key (feature identifier) |
| `name` | TEXT | No | - | Feature display name |
| `description` | TEXT | Yes | - | Feature description |
| `component` | TEXT | No | - | Component name |
| `version` | TEXT | No | - | Feature version |
| `solution` | TEXT | No | - | Solution category |
| `page` | TEXT | No | - | Page/location in app |
| `status` | TEXT | No | 'pending' | Status: 'pending', 'active', 'inactive' |
| `deployed_at` | TIMESTAMPTZ | Yes | - | Deployment timestamp |
| `category` | TEXT | Yes | - | Feature category |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | Last update timestamp |

**Indexes:**
- `idx_platform_features_status` on `status`
- `idx_platform_features_solution` on `solution`

---

## Strategic Views

### 12. `v_change_action_tracker`

Tracks regulatory change actions with computed status.

**Source:** 001_base_schema.sql

**Columns:**
- `action_id` (UUID) - Action identifier
- `change_id` (UUID) - Regulatory change ID
- `control_id` (UUID) - Associated control ID
- `action_title` (TEXT) - Action title
- `assigned_to` (UUID) - Assigned user
- `status` (TEXT) - Original status
- `due_date` (DATE) - Due date
- `completed_at` (TIMESTAMPTZ) - Completion timestamp
- `computed_status` (TEXT) - Calculated status based on due date
- `days_overdue` (INTEGER) - Days overdue (0 if not overdue)

---

### 13. `v_regulatory_impact_score`

Quantified Regulatory Exposure Index (0-100 scale).

**Source:** 20260118_impact_scoring_views.sql

**Columns:**
- `change_id` (UUID) - Regulatory change ID
- `change_title` (TEXT) - Change title
- `materiality` (TEXT) - Change materiality
- `regulator` (TEXT) - Regulating body
- `published_at` (TIMESTAMPTZ) - Publication date
- `severity_score` (INTEGER) - Regulatory severity (0-30)
- `surface_area_score` (INTEGER) - Business surface area (0-20)
- `control_gap_score` (INTEGER) - Control coverage gap (0-25)
- `execution_risk_score` (INTEGER) - Execution risk (0-15)
- `attestation_penalty` (INTEGER) - Attestation confidence penalty (0-10)
- `total_impact_score` (INTEGER) - Total score (0-100)
- `risk_band` (TEXT) - 'CRITICAL', 'HIGH', 'MODERATE'
- `primary_driver` (TEXT) - Main risk driver
- `affected_controls_count` (INTEGER) - Number of affected controls
- `signoffs_count` (INTEGER) - Number of signoffs
- `overdue_actions_count` (INTEGER) - Number of overdue actions

---

### 14. `v_control_drift_index`

Early-warning system detecting when controls fall behind regulatory changes.

**Source:** 20260118_control_drift_views.sql

**Columns:**
- `control_id` (UUID) - Control identifier
- `control_code` (TEXT) - Control code (e.g., 'CTRL-001')
- `control_title` (TEXT) - Control title
- `control_owner` (TEXT) - Control owner
- `last_reviewed_at` (TIMESTAMPTZ) - Last review date
- `next_review_date` (DATE) - Next scheduled review
- `last_reg_change_date` (TIMESTAMPTZ) - Last affecting regulatory change
- `review_delay_interval` (INTERVAL) - Time since last review
- `review_delay_days` (NUMERIC) - Days since last review
- `time_to_next_review` (INTERVAL) - Time until next review
- `days_to_next_review` (NUMERIC) - Days until next review
- `pending_changes_count` (INTEGER) - Pending regulatory changes
- `failed_attestations_count` (INTEGER) - Failed attestations
- `open_exceptions_count` (INTEGER) - Open exceptions
- `drift_status` (TEXT) - 'CRITICAL_DRIFT', 'MATERIAL_DRIFT', 'EMERGING_DRIFT', 'STABLE'
- `drift_score` (INTEGER) - Drift score (0-100, higher is worse)
- `drift_driver` (TEXT) - Primary drift cause
- `urgency_level` (TEXT) - 'URGENT', 'ATTENTION_NEEDED', 'MONITOR'

---

### 15. `v_control_drift_summary`

Summary of control drift across the organization.

**Source:** 20260118_control_drift_views.sql

**Columns:**
- `drift_status` (TEXT) - Drift status category
- `control_count` (INTEGER) - Number of controls in this status
- `avg_drift_score` (NUMERIC) - Average drift score
- `total_pending_changes` (INTEGER) - Total pending changes
- `total_failed_attestations` (INTEGER) - Total failed attestations
- `total_open_exceptions` (INTEGER) - Total open exceptions

---

### 16. `v_attestation_confidence_index`

Measures confidence in control attestations (0-100).

**Source:** 20260118_attestation_confidence_views.sql

**Columns:**
- `attestation_id` (UUID) - Attestation identifier
- `control_id` (UUID) - Control ID
- `control_code` (TEXT) - Control code
- `control_title` (TEXT) - Control title
- `attestor_id` (UUID) - Attestor user ID
- `attestor_role` (TEXT) - Attestor role
- `status` (TEXT) - Attestation status
- `due_date` (DATE) - Due date
- `submitted_at` (TIMESTAMPTZ) - Submission timestamp
- `timeliness_score` (INTEGER) - Timeliness score (0-40)
- `days_delta` (NUMERIC) - Days late/early
- `role_score` (INTEGER) - Role weight score (0-30)
- `reliability_score` (INTEGER) - Historical reliability (0-20)
- `exception_penalty` (INTEGER) - Exception penalty (-15 to 0)
- `confidence_score` (INTEGER) - Total confidence (0-100)
- `confidence_band` (TEXT) - 'HIGH_CONFIDENCE', 'MEDIUM_CONFIDENCE', 'LOW_CONFIDENCE'
- `confidence_driver` (TEXT) - Primary confidence factor
- `total_approved_count` (INTEGER) - Attestor's total approved attestations
- `total_late_count` (INTEGER) - Attestor's total late submissions
- `open_exceptions_count` (INTEGER) - Open exceptions for control

---

### 17. `v_attestation_confidence_summary`

Summary of attestation confidence across the organization.

**Source:** 20260118_attestation_confidence_views.sql

**Columns:**
- `confidence_band` (TEXT) - Confidence category
- `attestation_count` (INTEGER) - Number of attestations
- `avg_confidence_score` (NUMERIC) - Average confidence score
- `approved_count` (INTEGER) - Approved attestations
- `late_count` (INTEGER) - Late submissions
- `total_exceptions` (INTEGER) - Total exceptions

---

## Solution 4 Views (Risk Signal Hub)

### 18. `v_exception_materiality`

Materiality scores (0-100) for exceptions.

**Source:** DEPLOY_RISK_SIGNAL_HUB.sql

**Columns:**
- `exception_id` (UUID) - Exception identifier
- `exception_title` (TEXT) - Exception title
- `status` (TEXT) - Exception status
- `severity` (TEXT) - Exception severity
- `control_id` (UUID) - Associated control (from source_id)
- `source_type` (TEXT) - Source type
- `control_name` (TEXT) - Control name
- `control_category` (TEXT) - Control category (fixed as 'General')
- `created_at` (TIMESTAMPTZ) - Exception opened date
- `days_open` (INTEGER) - Days exception has been open
- `regulatory_impact_score` (INTEGER) - Regulatory impact (0-30)
- `control_criticality_score` (INTEGER) - Control criticality (0-30)
- `duration_score` (INTEGER) - Duration score (0-25)
- `recurrence_score` (INTEGER) - Recurrence pattern score (0-15)
- `total_materiality_score` (INTEGER) - Total score (0-100)
- `materiality_band` (TEXT) - 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'

---

### 19. `v_evidence_coverage_gaps`

Evidence coverage gap detection (simplified).

**Source:** DEPLOY_RISK_SIGNAL_HUB.sql

**Columns:**
- `exception_id` (UUID) - Exception identifier
- `exception_title` (TEXT) - Exception title
- `control_id` (UUID) - Associated control
- `source_type` (TEXT) - Source type
- `coverage_note` (TEXT) - Coverage analysis note
- `coverage_percentage` (INTEGER) - Coverage percentage
- `coverage_band` (TEXT) - Coverage band
- `missing_evidence_types` (TEXT[]) - Missing evidence types

---

### 20. `v_risk_acceleration_timeline`

Timeline tracking with risk acceleration indicators.

**Source:** DEPLOY_RISK_SIGNAL_HUB.sql

**Columns:**
- `exception_id` (UUID) - Exception identifier
- `exception_title` (TEXT) - Exception title
- `status` (TEXT) - Exception status
- `control_id` (UUID) - Associated control
- `source_type` (TEXT) - Source type
- `control_name` (TEXT) - Control name
- `days_open` (INTEGER) - Days exception has been open
- `age_band` (TEXT) - 'RECENT', 'DEVELOPING', 'PERSISTENT', 'CHRONIC', 'CRITICAL_AGE'
- `urgency_level` (TEXT) - 'IMMEDIATE_ATTENTION', 'ESCALATE', 'MONITOR', 'TRACK'

---

### 21. `v_exception_recurrence_pattern`

Control-level exception recurrence patterns.

**Source:** DEPLOY_RISK_SIGNAL_HUB.sql

**Columns:**
- `control_id` (UUID) - Control identifier
- `source_type` (TEXT) - Source type
- `control_title` (TEXT) - Control title
- `total_exceptions` (INTEGER) - Total exceptions for control
- `open_exceptions` (INTEGER) - Currently open exceptions
- `exceptions_last_12m` (INTEGER) - Exceptions in last 12 months
- `exceptions_last_6m` (INTEGER) - Exceptions in last 6 months
- `exceptions_last_3m` (INTEGER) - Exceptions in last 3 months
- `acceleration_rate_pct` (NUMERIC) - Acceleration rate percentage
- `recurrence_pattern` (TEXT) - 'FREQUENT', 'RECURRING', 'OCCASIONAL', 'ISOLATED'
- `most_recent_exception_date` (TIMESTAMPTZ) - Most recent exception
- `first_exception_date` (TIMESTAMPTZ) - First exception

---

## Solution 5 Views (Board View)

### 22. `v_exception_root_cause_taxonomy`

Root cause classification for exceptions.

**Source:** 20260123_solution5_exceptions_overview.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `exception_id` (UUID) - Exception identifier
- `title` (TEXT) - Exception title
- `status` (TEXT) - Exception status
- `severity` (TEXT) - Exception severity
- `control_id` (UUID) - Associated control
- `control_name` (TEXT) - Control name
- `root_cause` (TEXT) - 'Process', 'People', 'Systems', 'Third Party', 'Other'
- `opened_at` (TIMESTAMPTZ) - Exception opened date
- `closed_at` (TIMESTAMPTZ) - Exception closed date
- `days_open` (INTEGER) - Days exception has been open
- `materiality_score` (INTEGER) - Materiality score from v_exception_materiality
- `materiality_band` (TEXT) - Materiality band

---

### 23. `v_exception_trend_heatmap`

Monthly exception trends showing deterioration or stabilization.

**Source:** 20260123_solution5_exceptions_overview.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `month` (TIMESTAMPTZ) - Month (truncated)
- `severity` (TEXT) - Exception severity
- `materiality_band` (TEXT) - Materiality band
- `exception_count` (INTEGER) - Exceptions in month
- `open_count` (INTEGER) - Currently open
- `resolved_count` (INTEGER) - Resolved in month
- `avg_materiality` (NUMERIC) - Average materiality score
- `volume_trend` (TEXT) - 'New', 'Deteriorating', 'Improving', 'Stable'
- `severity_trend` (TEXT) - 'New', 'Worsening', 'Improving', 'Stable'
- `pct_change` (NUMERIC) - Percentage change vs previous month

---

### 24. `v_exceptions_overview_mi`

Board-level exceptions overview with materiality scoring.

**Source:** 20260123_solution5_exceptions_overview.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `tenant_name` (TEXT) - Tenant name
- `open_exceptions` (INTEGER) - Currently open exceptions
- `resolved_last_30d` (INTEGER) - Resolved in last 30 days
- `critical_open` (INTEGER) - Critical open exceptions
- `high_open` (INTEGER) - High severity open exceptions
- `medium_open` (INTEGER) - Medium severity open exceptions
- `avg_open_materiality` (NUMERIC) - Average materiality of open exceptions
- `avg_days_open` (NUMERIC) - Average days open
- `process_exceptions` (INTEGER) - Process-related exceptions
- `people_exceptions` (INTEGER) - People-related exceptions
- `systems_exceptions` (INTEGER) - Systems-related exceptions
- `third_party_exceptions` (INTEGER) - Third-party exceptions
- `new_this_month` (INTEGER) - New exceptions this month
- `new_last_month` (INTEGER) - New exceptions last month
- `month_over_month_pct` (NUMERIC) - Month-over-month percentage change
- `risk_signal` (TEXT) - Risk signal category
- `snapshot_at` (TIMESTAMPTZ) - Snapshot timestamp

---

### 25. `v_exceptions_severity_summary`

Exception count by severity level.

**Source:** 20260124000000_solution5_batch3_final.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `severity` (TEXT) - Exception severity
- `exception_count` (INTEGER) - Total exceptions
- `open_count` (INTEGER) - Open exceptions
- `closed_count` (INTEGER) - Closed exceptions

---

### 26. `v_exceptions_aging_analysis`

Exception aging analysis by severity.

**Source:** 20260124000000_solution5_batch3_final.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `severity` (TEXT) - Exception severity
- `exception_id` (UUID) - Exception identifier
- `title` (TEXT) - Exception title
- `opened_at` (TIMESTAMPTZ) - Opened timestamp
- `days_open` (NUMERIC) - Days open
- `age_bucket` (TEXT) - '0-30 days', '31-60 days', '61-90 days', '90+ days'

---

### 27. `v_exceptions_by_control`

Exceptions grouped by control.

**Source:** 20260124000000_solution5_batch3_final.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `control_id` (UUID) - Control identifier
- `control_title` (TEXT) - Control title
- `control_code` (TEXT) - Control code
- `exception_id` (UUID) - Exception identifier
- `exception_title` (TEXT) - Exception title
- `severity` (TEXT) - Exception severity
- `status` (TEXT) - Exception status
- `opened_at` (TIMESTAMPTZ) - Opened timestamp
- `closed_at` (TIMESTAMPTZ) - Closed timestamp

---

### 28. `controls_status_summary`

Control count by status.

**Source:** 20260123_solution5_regulatory_readiness.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `status` (TEXT) - Control status
- `control_count` (INTEGER) - Number of controls

---

### 29. `controls_testing_compliance`

Control testing status and evidence completeness.

**Source:** 20260123_solution5_regulatory_readiness.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `control_id` (UUID) - Control identifier
- `control_code` (TEXT) - Control code
- `title` (TEXT) - Control title
- `status` (TEXT) - Control status
- `frequency` (TEXT) - Testing frequency
- `test_method` (TEXT) - Testing method
- `evidence_required` (TEXT) - Evidence requirements
- `testing_status` (TEXT) - 'tested', 'not_tested', 'inactive'
- `has_evidence_requirements` (BOOLEAN) - Has evidence requirements

---

### 30. `controls_with_exceptions_count`

Count of exceptions per control.

**Source:** 20260123_solution5_regulatory_readiness.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `control_id` (UUID) - Control identifier
- `control_code` (TEXT) - Control code
- `title` (TEXT) - Control title
- `status` (TEXT) - Control status
- `open_exception_count` (INTEGER) - Total open exceptions
- `critical_exceptions` (INTEGER) - Critical exceptions
- `high_exceptions` (INTEGER) - High severity exceptions
- `medium_exceptions` (INTEGER) - Medium severity exceptions
- `low_exceptions` (INTEGER) - Low severity exceptions

---

### 31. `regulatory_readiness_score`

Overall readiness metrics per tenant.

**Source:** 20260123_solution5_regulatory_readiness.sql

**Columns:**
- `tenant_id` (UUID) - Tenant identifier
- `total_controls` (INTEGER) - Total controls
- `active_controls` (INTEGER) - Active controls
- `tested_controls` (INTEGER) - Tested controls
- `controls_with_evidence` (INTEGER) - Controls with evidence requirements
- `total_open_exceptions` (INTEGER) - Total open exceptions
- `testing_coverage_percent` (NUMERIC) - Testing coverage percentage
- `active_control_percent` (NUMERIC) - Active control percentage

---

## Column Name Reference

### Critical Column Name Mapping

**Controls Table:**
- Base Schema: `control_id` (TEXT) - Unique identifier
- Production/Views: Referenced as `control_code` in some views
- **ACTION REQUIRED:** Verify actual column name in production database

**Exceptions Table:**
- Base Schema: `control_id` (UUID) - Foreign key to controls
- Production Schema: `source_id` (UUID) + `source_type` (TEXT) - Polymorphic relationship
- **ACTION REQUIRED:** Update code to use `source_id` and `source_type`

### Missing Tables

The following tables are referenced in views but not defined in base migrations:
1. **`tenants`** - Multi-tenant organization table
2. **`user_profiles`** - User-to-tenant mapping

**ACTION REQUIRED:** These tables must exist in production. Locate their creation migrations or create them.

---

## Common Query Patterns

### Get exceptions for a control

```sql
-- Base schema
SELECT * FROM exceptions WHERE control_id = '<control-uuid>';

-- Production schema
SELECT * FROM exceptions
WHERE source_id = '<control-uuid>'
  AND source_type = 'control';
```

### Get control by code

```sql
-- Base schema
SELECT * FROM controls WHERE control_id = 'CTRL-001';

-- If aliased in production
SELECT * FROM controls WHERE control_code = 'CTRL-001';
```

### Check for column existence

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'controls'
ORDER BY ordinal_position;
```

---

## Migration History

1. **001_base_schema.sql** - Core tables and basic views
2. **002_tenant_approval_system.sql** - Platform admin and tenant approval
3. **003_platform_features_table.sql** - Feature flag system
4. **20260118_impact_scoring_views.sql** - Impact scoring views
5. **20260118_control_drift_views.sql** - Control drift detection
6. **20260118_attestation_confidence_views.sql** - Attestation confidence
7. **20260123_solution5_exceptions_overview.sql** - Exception overview views
8. **20260123_solution5_regulatory_readiness.sql** - Regulatory readiness views
9. **20260124000000_solution5_batch3_final.sql** - Final batch 3 views

---

## Notes

- All tables have Row Level Security (RLS) enabled
- Default RLS policy allows authenticated users to read
- Multi-tenancy is partially implemented (tenant_id columns exist but base migrations don't create tenants table)
- Schema has evolved significantly - production differs from base migrations
- Some column names differ between base schema and production (control_id vs control_code)
- Exceptions table has undergone major schema change (control_id → source_id/source_type)

---

**End of Schema Reference**
