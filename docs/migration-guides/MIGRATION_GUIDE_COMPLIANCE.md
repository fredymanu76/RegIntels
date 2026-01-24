# RegIntels to Compliance Migration Guide

Complete guide for migrating RegIntels data to a new Supabase instance with `compliance_*` table prefix.

## Overview

This migration moves all RegIntels data from your OLD Supabase instance to a NEW Supabase instance with the following changes:

- All tables get `compliance_` prefix (e.g., `regulatory_changes` → `compliance_regulatory_changes`)
- All views get `compliance_v_` prefix (e.g., `v_regulatory_impact_score` → `compliance_v_regulatory_impact_score`)
- All indexes, constraints, and relationships are preserved
- All data is migrated with original UUIDs intact (maintains referential integrity)
- Strategic scoring views are included and fully functional

## Migration Files

1. **unified_migration_compliance.sql** - Creates schema in NEW instance
2. **export_compliance_data.sql** - Exports data from OLD instance
3. **import_compliance_data.sql** - Imports data into NEW instance

## Prerequisites

✅ Access to both OLD and NEW Supabase instances
✅ SQL Editor access in both instances
✅ Text editor for handling JSON exports

## Migration Steps

### Phase 1: Create Schema in NEW Instance

**Step 1.1: Open NEW Supabase Instance**
- Go to your NEW Supabase dashboard
- Navigate to SQL Editor

**Step 1.2: Run Schema Creation**
- Open `unified_migration_compliance.sql`
- Copy the entire contents
- Paste into SQL Editor in NEW instance
- Click "Run"

**Expected Result:**
```
✅ COMPLIANCE MIGRATION SCHEMA CREATED!

Created Tables (with compliance_ prefix):
  1. compliance_regulatory_changes
  2. compliance_controls
  3. compliance_regulatory_change_control_map
  4. compliance_attestations
  5. compliance_exceptions
  6. compliance_change_signoffs
  7. compliance_actions

Created Views:
  1. compliance_v_change_action_tracker
  2. compliance_v_regulatory_impact_score
  3. compliance_v_control_drift_index
  4. compliance_v_control_drift_summary
  5. compliance_v_attestation_confidence_index
  6. compliance_v_attestation_confidence_summary
```

### Phase 2: Export Data from OLD Instance

**Step 2.1: Open OLD Supabase Instance**
- Go to your OLD RegIntels Supabase dashboard
- Navigate to SQL Editor

**Step 2.2: Run Each Export Query**
- Open `export_compliance_data.sql`
- Run **each SELECT query ONE AT A TIME** (7 total)
- For each query result:
  - Click on the JSON result cell
  - Copy the JSON array
  - Paste into a text file with the corresponding name:

**Export File Names:**
```
1. regulatory_changes_export.json
2. controls_export.json
3. rccm_export.json
4. attestations_export.json
5. exceptions_export.json
6. change_signoffs_export.json
7. actions_export.json
```

**Step 2.3: Verify Export Counts**
- Run the final summary query in `export_compliance_data.sql`
- Note the record counts for each table
- You'll verify these match after import

**Example Export Summary:**
```
Table Name                          | Record Count
------------------------------------|-------------
Regulatory Changes                  | 42
Controls                            | 156
Regulatory Change Control Map       | 234
Attestations                        | 89
Exceptions                          | 23
Change Signoffs                     | 67
Actions                             | 145
```

### Phase 3: Import Data into NEW Instance

**Step 3.1: Prepare Import Script**
- Open `import_compliance_data.sql` in a text editor
- For each section, replace `[PASTE_XXX_JSON_HERE]` with the actual JSON from your export files

**Example Replacement:**

**Before:**
```sql
FROM json_array_elements('[PASTE_REGULATORY_CHANGES_JSON_HERE]'::json);
```

**After:**
```sql
FROM json_array_elements('[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Enhanced Customer Due Diligence Requirements",
    "description": "New CDD requirements...",
    ...
  },
  {
    "id": "223e4567-e89b-12d3-a456-426614174001",
    ...
  }
]'::json);
```

**Step 3.2: Run Import in NEW Instance**
- Go back to NEW Supabase instance SQL Editor
- Copy the modified `import_compliance_data.sql`
- Paste into SQL Editor
- Click "Run"

**Step 3.3: Verify Import**
- Check the import summary at the end
- Compare record counts with your export summary
- All counts should match exactly

**Expected Result:**
```
✅ COMPLIANCE DATA IMPORT COMPLETE!

Imported Tables:
  1. compliance_regulatory_changes - 42 records
  2. compliance_controls - 156 records
  3. compliance_regulatory_change_control_map - 234 records
  4. compliance_attestations - 89 records
  5. compliance_exceptions - 23 records
  6. compliance_change_signoffs - 67 records
  7. compliance_actions - 145 records
```

### Phase 4: Test Views & Queries

**Step 4.1: Test Strategic Views**

Run these test queries in NEW instance:

```sql
-- Test Impact Score View
SELECT
  change_title,
  total_impact_score,
  risk_band,
  primary_driver
FROM public.compliance_v_regulatory_impact_score
ORDER BY total_impact_score DESC
LIMIT 10;

-- Test Control Drift View
SELECT
  control_code,
  control_title,
  drift_status,
  drift_score,
  urgency_level
FROM public.compliance_v_control_drift_index
WHERE drift_status != 'STABLE'
ORDER BY drift_score DESC
LIMIT 10;

-- Test Attestation Confidence View
SELECT
  control_code,
  attestor_role,
  confidence_score,
  confidence_band,
  confidence_driver
FROM public.compliance_v_attestation_confidence_index
ORDER BY confidence_score ASC
LIMIT 10;
```

**Step 4.2: Verify Data Integrity**

```sql
-- Check foreign key relationships are intact
SELECT
  c.change_title,
  COUNT(rccm.id) as linked_controls
FROM public.compliance_regulatory_changes c
LEFT JOIN public.compliance_regulatory_change_control_map rccm
  ON rccm.regulatory_change_id = c.id
GROUP BY c.id, c.change_title
ORDER BY linked_controls DESC
LIMIT 10;

-- Check control attestations
SELECT
  ctrl.control_id,
  ctrl.control_title,
  COUNT(att.id) as attestation_count
FROM public.compliance_controls ctrl
LEFT JOIN public.compliance_attestations att
  ON att.control_id = ctrl.id
GROUP BY ctrl.id, ctrl.control_id, ctrl.control_title
ORDER BY attestation_count DESC
LIMIT 10;
```

## Table Mapping Reference

| OLD Table Name                      | NEW Table Name                                |
|-------------------------------------|-----------------------------------------------|
| regulatory_changes                  | compliance_regulatory_changes                 |
| controls                            | compliance_controls                           |
| regulatory_change_control_map       | compliance_regulatory_change_control_map      |
| attestations                        | compliance_attestations                       |
| exceptions                          | compliance_exceptions                         |
| change_signoffs                     | compliance_change_signoffs                    |
| actions                             | compliance_actions                            |

## View Mapping Reference

| OLD View Name                         | NEW View Name                                   |
|---------------------------------------|-------------------------------------------------|
| v_change_action_tracker               | compliance_v_change_action_tracker              |
| v_regulatory_impact_score             | compliance_v_regulatory_impact_score            |
| v_control_drift_index                 | compliance_v_control_drift_index                |
| v_control_drift_summary               | compliance_v_control_drift_summary              |
| v_attestation_confidence_index        | compliance_v_attestation_confidence_index       |
| v_attestation_confidence_summary      | compliance_v_attestation_confidence_summary     |

## Application Updates Required

After migration, you'll need to update your application code:

### Frontend Component Queries

**Before:**
```javascript
const { data, error } = await supabase
  .from('regulatory_changes')
  .select('*')
  .order('published_at', { ascending: false });
```

**After:**
```javascript
const { data, error } = await supabase
  .from('compliance_regulatory_changes')
  .select('*')
  .order('published_at', { ascending: false });
```

### View Queries

**Before:**
```javascript
const { data: impactScores } = await supabase
  .from('v_regulatory_impact_score')
  .select('*')
  .order('total_impact_score', { ascending: false });
```

**After:**
```javascript
const { data: impactScores } = await supabase
  .from('compliance_v_regulatory_impact_score')
  .select('*')
  .order('total_impact_score', { ascending: false });
```

## Quick Update Script for Your Application

Create a find-and-replace script for your codebase:

```bash
# Bash script to update table/view names in your codebase
# Save as: update_compliance_names.sh

#!/bin/bash

# Update table names
find ./src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" | while read file; do
  sed -i "s/'regulatory_changes'/'compliance_regulatory_changes'/g" "$file"
  sed -i "s/'controls'/'compliance_controls'/g" "$file"
  sed -i "s/'regulatory_change_control_map'/'compliance_regulatory_change_control_map'/g" "$file"
  sed -i "s/'attestations'/'compliance_attestations'/g" "$file"
  sed -i "s/'exceptions'/'compliance_exceptions'/g" "$file"
  sed -i "s/'change_signoffs'/'compliance_change_signoffs'/g" "$file"
  sed -i "s/'actions'/'compliance_actions'/g" "$file"

  # Update view names
  sed -i "s/'v_change_action_tracker'/'compliance_v_change_action_tracker'/g" "$file"
  sed -i "s/'v_regulatory_impact_score'/'compliance_v_regulatory_impact_score'/g" "$file"
  sed -i "s/'v_control_drift_index'/'compliance_v_control_drift_index'/g" "$file"
  sed -i "s/'v_control_drift_summary'/'compliance_v_control_drift_summary'/g" "$file"
  sed -i "s/'v_attestation_confidence_index'/'compliance_v_attestation_confidence_index'/g" "$file"
  sed -i "s/'v_attestation_confidence_summary'/'compliance_v_attestation_confidence_summary'/g" "$file"
done

echo "✅ Updated all compliance table and view references!"
```

## Troubleshooting

### Issue: Foreign Key Constraint Violations

**Problem:** Import fails with foreign key errors

**Solution:** Ensure you import tables in this exact order:
1. compliance_regulatory_changes (no dependencies)
2. compliance_controls (no dependencies)
3. compliance_regulatory_change_control_map (depends on 1 & 2)
4. compliance_attestations (depends on 1 & 2)
5. compliance_exceptions (depends on 2)
6. compliance_change_signoffs (depends on 1)
7. compliance_actions (depends on 1 & 2)

### Issue: JSON Parse Errors

**Problem:** Import fails with "invalid JSON" error

**Solution:**
- Ensure JSON is properly formatted
- Check for escaped quotes or special characters
- Use a JSON validator (jsonlint.com)
- Make sure to copy the ENTIRE JSON array including `[` and `]`

### Issue: View Returns No Data

**Problem:** Views exist but return empty results

**Solution:**
- Verify base tables have data: `SELECT COUNT(*) FROM compliance_regulatory_changes;`
- Check RLS policies aren't blocking access
- Ensure you're authenticated as the right user

### Issue: Record Count Mismatch

**Problem:** Import shows fewer records than export

**Solution:**
- Check for duplicate UUIDs (though unlikely)
- Look for NULL constraint violations in import logs
- Verify the JSON export wasn't truncated

## Security Considerations

### Row Level Security (RLS)

The migration script creates basic RLS policies that allow all authenticated users to read data. You should customize these based on your security requirements:

```sql
-- Example: Restrict access to specific tenant
DROP POLICY IF EXISTS "Tenant isolation" ON public.compliance_regulatory_changes;
CREATE POLICY "Tenant isolation"
  ON public.compliance_regulatory_changes FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid())
  );
```

### API Keys

After migration, update your application's Supabase connection:
- NEW instance URL
- NEW anon/service role keys
- Test connections before going live

## Rollback Plan

If you need to rollback the migration:

```sql
-- Drop all compliance tables and views in NEW instance
DROP VIEW IF EXISTS public.compliance_v_attestation_confidence_summary CASCADE;
DROP VIEW IF EXISTS public.compliance_v_attestation_confidence_index CASCADE;
DROP VIEW IF EXISTS public.compliance_v_control_drift_summary CASCADE;
DROP VIEW IF EXISTS public.compliance_v_control_drift_index CASCADE;
DROP VIEW IF EXISTS public.compliance_v_regulatory_impact_score CASCADE;
DROP VIEW IF EXISTS public.compliance_v_change_action_tracker CASCADE;

DROP TABLE IF EXISTS public.compliance_actions CASCADE;
DROP TABLE IF EXISTS public.compliance_change_signoffs CASCADE;
DROP TABLE IF EXISTS public.compliance_exceptions CASCADE;
DROP TABLE IF EXISTS public.compliance_attestations CASCADE;
DROP TABLE IF EXISTS public.compliance_regulatory_change_control_map CASCADE;
DROP TABLE IF EXISTS public.compliance_controls CASCADE;
DROP TABLE IF EXISTS public.compliance_regulatory_changes CASCADE;
```

Then revert your application connection strings to the OLD instance.

## Post-Migration Checklist

- [ ] Verify all record counts match between OLD and NEW instances
- [ ] Test all strategic views return data
- [ ] Run sample queries to verify data integrity
- [ ] Update application connection strings
- [ ] Update all table/view names in application code
- [ ] Test application functionality end-to-end
- [ ] Configure RLS policies for your security needs
- [ ] Set up backups on NEW instance
- [ ] Monitor performance and query execution times
- [ ] Document any custom modifications made during migration

## Support & Questions

If you encounter issues:

1. Check the troubleshooting section above
2. Review Supabase logs in both instances
3. Verify JSON exports are complete and valid
4. Ensure UUIDs are preserved during migration

## Success Metrics

Your migration is successful when:

✅ All record counts match between OLD and NEW instances
✅ All foreign key relationships are intact
✅ All strategic views return expected data
✅ Application connects to NEW instance successfully
✅ End-to-end testing passes

---

**Migration Created:** 2026-01-23
**Schema Version:** RegIntels v1.0
**Target:** Compliance Module with compliance_* prefix
