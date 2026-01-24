# RegIntels Migration - Quick Start Guide

**Fast track guide** for migrating RegIntels data to a new Supabase instance with `compliance_*` prefix.

## 📋 Quick Overview

**What this does:**
- Migrates all RegIntels tables with `compliance_` prefix
- Preserves all relationships, UUIDs, and data integrity
- Includes strategic scoring views (impact, drift, confidence)
- Takes approximately 30-60 minutes for typical databases

## 🚀 Three Simple Steps

### Step 1: Create Schema (NEW Instance)

```sql
-- In NEW Supabase SQL Editor
-- Run: unified_migration_compliance.sql
-- Creates 7 tables + 6 views with compliance_ prefix
```

⏱️ **Time:** 1-2 minutes

### Step 2: Export Data (OLD Instance)

```sql
-- In OLD Supabase SQL Editor
-- Run: export_compliance_data.sql (7 queries)
-- Copy each JSON result to text files
```

⏱️ **Time:** 10-15 minutes

**Files to create:**
1. `regulatory_changes_export.json`
2. `controls_export.json`
3. `rccm_export.json`
4. `attestations_export.json`
5. `exceptions_export.json`
6. `change_signoffs_export.json`
7. `actions_export.json`

### Step 3: Import Data (NEW Instance)

```sql
-- Edit import_compliance_data.sql
-- Replace [PASTE_XXX_JSON_HERE] with your actual JSON
-- Run in NEW Supabase SQL Editor
```

⏱️ **Time:** 15-20 minutes

## ✅ Verification Checklist

After migration, verify:

```sql
-- Check record counts
SELECT 'compliance_regulatory_changes' as table_name, COUNT(*) as count
FROM public.compliance_regulatory_changes
UNION ALL
SELECT 'compliance_controls', COUNT(*)
FROM public.compliance_controls
UNION ALL
SELECT 'compliance_attestations', COUNT(*)
FROM public.compliance_attestations;

-- Test impact scoring view
SELECT change_title, total_impact_score, risk_band
FROM public.compliance_v_regulatory_impact_score
LIMIT 5;

-- Test control drift view
SELECT control_code, drift_status, drift_score
FROM public.compliance_v_control_drift_index
LIMIT 5;
```

## 🔄 Application Updates

Update your application code to use new table names:

**Before → After:**
- `regulatory_changes` → `compliance_regulatory_changes`
- `controls` → `compliance_controls`
- `attestations` → `compliance_attestations`
- `v_regulatory_impact_score` → `compliance_v_regulatory_impact_score`

**Example Code Update:**

```javascript
// OLD
const { data } = await supabase
  .from('regulatory_changes')
  .select('*');

// NEW
const { data } = await supabase
  .from('compliance_regulatory_changes')
  .select('*');
```

## 🎯 Table Mapping Quick Reference

| OLD Name | NEW Name |
|----------|----------|
| `regulatory_changes` | `compliance_regulatory_changes` |
| `controls` | `compliance_controls` |
| `regulatory_change_control_map` | `compliance_regulatory_change_control_map` |
| `attestations` | `compliance_attestations` |
| `exceptions` | `compliance_exceptions` |
| `change_signoffs` | `compliance_change_signoffs` |
| `actions` | `compliance_actions` |

## 🎯 View Mapping Quick Reference

| OLD View | NEW View |
|----------|----------|
| `v_change_action_tracker` | `compliance_v_change_action_tracker` |
| `v_regulatory_impact_score` | `compliance_v_regulatory_impact_score` |
| `v_control_drift_index` | `compliance_v_control_drift_index` |
| `v_control_drift_summary` | `compliance_v_control_drift_summary` |
| `v_attestation_confidence_index` | `compliance_v_attestation_confidence_index` |
| `v_attestation_confidence_summary` | `compliance_v_attestation_confidence_summary` |

## 🔥 Common Issues & Quick Fixes

### Issue: JSON too large for SQL Editor

**Fix:** Use Supabase Studio's "Import data" feature or split JSON into smaller batches

### Issue: Foreign key errors during import

**Fix:** Import in correct order (changes → controls → maps → attestations → etc.)

### Issue: View returns no data

**Fix:** Check RLS policies and authentication

## 📁 Migration Files Summary

1. **unified_migration_compliance.sql** - Schema creation (run in NEW instance)
2. **export_compliance_data.sql** - Data export queries (run in OLD instance)
3. **import_compliance_data.sql** - Data import (edit & run in NEW instance)
4. **MIGRATION_GUIDE_COMPLIANCE.md** - Detailed guide with troubleshooting
5. **MIGRATION_QUICK_START.md** - This file (quick reference)

## 🎉 Success Indicators

You'll know migration succeeded when:

✅ Record counts match OLD instance
✅ Views return data
✅ Foreign key relationships intact
✅ Application connects successfully

## 📞 Need Help?

See **MIGRATION_GUIDE_COMPLIANCE.md** for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Security considerations
- Rollback procedures
- Complete testing procedures

## ⚡ Pro Tips

1. **Backup first** - Always backup OLD instance before starting
2. **Test in staging** - Run migration in test environment first
3. **Use a JSON validator** - Validate JSON exports before importing
4. **Document counts** - Note record counts before and after migration
5. **Test views immediately** - Verify strategic views work right after import

---

**Ready to migrate?** Start with Step 1 above! 🚀

**Need details?** Check MIGRATION_GUIDE_COMPLIANCE.md for the full guide.
