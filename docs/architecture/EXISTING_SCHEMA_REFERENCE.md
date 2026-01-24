# RegIntels Existing Database Schema Reference

## Existing Tables (from Supabase)

Based on the foreign key relationships provided, here are the existing tables:

### Core Tables

1. **regulatory_changes** - Already exists!
2. **control_library** - Your controls table (different name than expected)
3. **control_runs** - Control execution/run tracking
4. **tenants** - Multi-tenancy support
5. **organisations** - Organization management
6. **platform_admins** - Platform admin users
7. **exceptions** - Already exists!
8. **evidence_tasks** - Evidence collection tasks
9. **evidence_requirements** - Evidence requirements tracking
10. **obligations** - Compliance obligations

### Relationship Tables (Junction/Mapping)

1. **regulatory_change_control_map** - Already exists! Links regulatory changes to controls
2. **control_evidence** - Links controls to evidence
3. **control_evidence_requirements** - Links controls to evidence requirements
4. **control_exceptions** - Links controls to exceptions
5. **control_obligation_link** - Links controls to obligations
6. **control_obligations** - Control obligations tracking
7. **control_policy_link** - Links controls to policies

### Supporting Tables

1. **change_impact_assessments** - Impact assessments for changes
2. **control_risks** - Control risk tracking
3. **control_tests** - Control testing records
4. **evidence_items** - Evidence items/artifacts
5. **memberships** - User memberships
6. **policies** - Policy documents
7. **reg_changes** - (Possibly another regulatory changes table?)
8. **remediation_actions** - Remediation/action tracking
9. **risks** - Risk register
10. **user_profiles** - User profile information

## Key Findings

### ✅ Tables That Already Exist (Good News!)
- `regulatory_changes` - Your regulatory changes are already tracked
- `control_library` - Your controls (NOTE: called "control_library" not "controls")
- `exceptions` - Exception tracking exists
- `regulatory_change_control_map` - The mapping between changes and controls exists
- `remediation_actions` - Action/remediation tracking exists

### ❌ Tables That DON'T Exist (Need to Create or Use Existing)
- `attestations` - Need to create OR use existing table if it exists
- `change_signoffs` - Need to create OR use existing table
- `actions` - Might use `remediation_actions` instead

### 🔍 Need Column Details For:
- `regulatory_changes` - Need to see actual columns (published_at, materiality, etc.)
- `control_library` - Need to see actual columns (control_id, control_title, etc.)
- `exceptions` - Need to see actual columns
- `remediation_actions` - Could this be our "actions" table?

## Next Steps

1. Get detailed column information for key tables
2. Determine if attestation functionality exists in another table
3. Map existing tables to our strategic scoring requirements
4. Create ONLY the missing tables/columns
5. Adjust views to use actual table and column names

