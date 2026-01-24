# 🆘 STUCK? READ THIS!

**Quick help for common problems during migration**

---

## 🔴 EMERGENCY: I'M COMPLETELY LOST

**STOP. Take a breath. Follow these steps:**

1. **Where are you?** Find your current phase:
   - Creating new Supabase? → You're in **Phase 1**
   - Running SQL scripts? → You're in **Phase 2** (schema) or **Phase 4** (import)
   - Exporting data? → You're in **Phase 3**
   - Testing? → You're in **Phase 6**

2. **Open the master guide:**
   - File: `UNIFIED_MIGRATION_MASTER_GUIDE.md`
   - Find your phase
   - Start from the beginning of that phase

3. **Use the checklist:**
   - File: `MIGRATION_CHECKLIST_PRINT_THIS.md`
   - See what you've completed
   - Find where you left off

---

## ❌ "Error: relation does not exist"

**This means:** Tables haven't been created yet

**Fix:**
1. Go to NEW Supabase instance
2. Open SQL Editor
3. Run `unified_migration_compliance.sql` FIRST
4. Then run `unified_migration_lms.sql`
5. Check Table Editor - should see 15 tables

---

## ❌ "Error: invalid input syntax for type json"

**This means:** JSON format is wrong in import script

**Fix:**
1. Check that you copied the ENTIRE JSON array including `[` and `]`
2. Make sure you didn't accidentally delete the single quotes `'` around the JSON
3. Should look like: `'[{...},{...}]'::json)`
4. NOT like: `[{...},{...}]::json)` ❌ (missing quotes)

**Example - CORRECT format:**
```sql
FROM json_array_elements('[
  {"id":"123-456","title":"Example"}
]'::json);
```

**Example - WRONG format:**
```sql
FROM json_array_elements([
  {"id":"123-456","title":"Example"}
]::json);  ❌ Missing quotes!
```

---

## ❌ "Error: duplicate key value violates unique constraint"

**This means:** You're trying to import the same data twice

**Fix:**
1. Delete the data first:
   ```sql
   TRUNCATE TABLE compliance_regulatory_changes CASCADE;
   TRUNCATE TABLE compliance_controls CASCADE;
   -- (or use Table Editor to delete all rows)
   ```
2. Run import script again

**Or better:** Start fresh
1. Drop all tables
2. Re-run Phase 2 (schema creation)
3. Re-run Phase 4 (import)

---

## ❌ "Error: foreign key constraint violation"

**This means:** Tables were imported in wrong order

**Fix:**
The import script has the correct order built-in. Make sure you're running the ENTIRE `import_compliance_data.sql` file, not just parts of it.

**Correct order:**
1. compliance_regulatory_changes (no dependencies)
2. compliance_controls (no dependencies)
3. compliance_regulatory_change_control_map (needs 1 & 2)
4. compliance_attestations (needs 1 & 2)
5. compliance_exceptions (needs 2)
6. compliance_change_signoffs (needs 1)
7. compliance_actions (needs 1 & 2)

---

## ❌ Import shows 0 records imported

**This means:** Either no data in OLD instance, or JSON wasn't pasted correctly

**Fix:**
1. Check your export JSON files - do they have data?
2. Open one JSON file - should look like: `[{"id":"xxx",...},{"id":"yyy",...}]`
3. If JSON files are empty - re-export from OLD instance
4. If JSON files have data - check you pasted them correctly in import script

---

## ❌ Views return no data / empty results

**This means:** Either no data in tables, or you're not authenticated

**Fix:**
1. Check tables have data:
   ```sql
   SELECT COUNT(*) FROM compliance_regulatory_changes;
   SELECT COUNT(*) FROM compliance_controls;
   ```
2. If counts are 0 → data wasn't imported (go back to Phase 4)
3. If counts are > 0 → views should work
4. Make sure you're logged into Supabase (check top right corner)

---

## ❌ Can't find my JSON export files

**They should be here:** `C:\Users\dbnew\Desktop\regintels-app\`

**If not found:**
1. You probably saved them somewhere else
2. Check your Downloads folder
3. Check Desktop
4. **If lost:** Re-export from OLD RegIntels instance (Phase 3)

---

## ❌ Forgot my NEW Supabase password

**Fix:**
1. Go to supabase.com
2. Click "Forgot password"
3. Reset via email
4. Or: Use GitHub/Google login if you signed up that way

---

## ❌ Can't see NEW Supabase project

**Fix:**
1. Make sure you're logged into the CORRECT Supabase account
2. Check you're in the right organization (top left dropdown)
3. If project disappeared → it might still be provisioning (wait 5 minutes)

---

## ❌ SQL Editor showing errors but script is correct

**Fix:**
1. Try clicking "Run" again
2. Refresh the page (F5)
3. Clear your browser cache
4. Try a different browser
5. Check Supabase status: https://status.supabase.com

---

## ❌ Export query too slow / timing out

**This means:** You have a LOT of data (which is fine!)

**Fix:**
1. Export tables one at a time (you should be doing this anyway)
2. If single table is too large, split the export:
   ```sql
   -- First 1000 rows
   SELECT json_agg(...) FROM (
     SELECT * FROM regulatory_changes LIMIT 1000
   ) sub;

   -- Next 1000 rows
   SELECT json_agg(...) FROM (
     SELECT * FROM regulatory_changes OFFSET 1000 LIMIT 1000
   ) sub;
   ```
3. Then combine the JSON arrays manually

---

## ❌ Import taking forever / hanging

**This means:** Large dataset being imported

**What's normal:**
- 100 records: 5-10 seconds
- 1,000 records: 30 seconds - 1 minute
- 10,000 records: 2-5 minutes
- 100,000+ records: 10+ minutes

**If stuck for 10+ minutes:**
1. Check browser console for errors (F12 → Console tab)
2. Try importing smaller batches
3. Check Supabase logs (Logs section in dashboard)

---

## ❌ Wrong data in tables / data looks weird

**This means:** Possible JSON escaping or encoding issue

**Fix:**
1. Check one JSON file in a JSON validator: https://jsonlint.com
2. Look for weird characters or broken encoding
3. Make sure you exported from the correct OLD instance
4. Re-export if needed

---

## ❌ I accidentally deleted something important!

**Don't panic! Your OLD instances are still running!**

**Fix:**
1. If you deleted tables in NEW instance → Just re-run Phase 2 and Phase 4
2. If you deleted data in OLD instance → Restore from Supabase backup:
   - Go to OLD instance
   - Settings → Backups
   - Restore latest backup
3. If you deleted JSON files → Re-export from Phase 3

---

## ❌ Application still connecting to OLD instance

**This is NORMAL during migration!**

**Fix (when you're ready to switch):**
1. Don't change application yet - finish migration first
2. Only update application after Phase 6 is complete
3. Phase 7 has instructions for updating your app
4. Test NEW instance thoroughly before switching

---

## 🟢 MIGRATION HEALTH CHECK

**Run these queries to verify everything is OK:**

```sql
-- Check compliance tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'compliance_%'
ORDER BY table_name;
-- Should return 7 rows

-- Check LMS tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'lms_%'
ORDER BY table_name;
-- Should return 8 rows

-- Check compliance data imported
SELECT
  'compliance_regulatory_changes' as table_name,
  COUNT(*) as count
FROM compliance_regulatory_changes
UNION ALL
SELECT 'compliance_controls', COUNT(*)
FROM compliance_controls
UNION ALL
SELECT 'compliance_attestations', COUNT(*)
FROM compliance_attestations;
-- Counts should match your export

-- Check views work
SELECT COUNT(*) FROM compliance_v_regulatory_impact_score;
-- Should return a number > 0
```

**If ALL above queries work: You're in great shape! ✅**

---

## 🔄 NUCLEAR OPTION: START COMPLETELY FRESH

**If everything is broken and you want to start over:**

1. **In NEW instance SQL Editor, run:**
   ```sql
   -- Drop everything
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT ALL ON SCHEMA public TO postgres;
   GRANT ALL ON SCHEMA public TO public;
   ```

2. **Start migration from Phase 2**
   - Run schema creation scripts
   - Re-import data

**Your OLD instances are safe!** You can always start fresh in the NEW instance.

---

## 📞 WHEN TO ASK FOR HELP

**Ask for help if:**
- You've tried the fix above and it still doesn't work
- You get an error message not listed here
- You've been stuck for more than 30 minutes
- Something got deleted from OLD instance (get help ASAP!)

**What to include when asking for help:**
1. Which phase you're in (1-6)
2. Exact error message (copy/paste)
3. Screenshot of SQL Editor
4. What you were trying to do
5. What you've tried already

---

## ✅ QUICK SANITY CHECKS

**Before asking for help, verify:**

- [ ] I'm logged into the CORRECT Supabase account
- [ ] I'm looking at the NEW instance (not OLD)
- [ ] I completed Phase 2 (schema creation)
- [ ] I have the JSON export files saved
- [ ] I'm running the ENTIRE SQL script (not just a portion)
- [ ] I waited for the script to finish (didn't cancel early)
- [ ] I'm using the most recent version of migration files

---

## 💪 YOU'VE GOT THIS!

**Remember:**
- Your OLD instances are SAFE - you can't break them by accident
- You can always start fresh in the NEW instance
- The migration is reversible - no permanent damage
- Taking breaks is OK - save your progress and come back
- Mistakes are learning opportunities

**Most common success path:**
1. Hit an error
2. Read this help file
3. Apply the fix
4. Continue successfully
5. Complete migration! 🎉

---

**Keep this file open while you work!**

When in doubt, check:
1. This file (HELP_STUCK_READ_THIS.md)
2. The master guide (UNIFIED_MIGRATION_MASTER_GUIDE.md)
3. The checklist (MIGRATION_CHECKLIST_PRINT_THIS.md)
