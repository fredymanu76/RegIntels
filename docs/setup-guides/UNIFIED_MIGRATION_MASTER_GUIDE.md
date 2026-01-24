# 🎯 UNIFIED MIGRATION - COMPLETE STEP-BY-STEP GUIDE

**FOR BEGINNERS - NO TECHNICAL KNOWLEDGE REQUIRED**

You will migrate **TWO systems** into **ONE new Supabase instance**:
- RegIntels (compliance system) → `compliance_*` tables
- LMS (learning system) → `lms_*` tables

---

## ⏱️ TIME REQUIRED

- **Total Time:** 2-3 hours
- **Active Work:** 1-2 hours
- **Waiting Time:** 1 hour (coffee breaks included ☕)

---

## 📦 WHAT YOU NEED

### Accounts & Access
- [ ] OLD RegIntels Supabase account login
- [ ] OLD LMS Supabase account login
- [ ] Email address for NEW Supabase account

### Software
- [ ] Web browser (Chrome, Firefox, Edge)
- [ ] Text editor (Notepad++, VS Code, or even regular Notepad)

### Files (Already in your RegIntels folder)
- [ ] `unified_migration_compliance.sql`
- [ ] `unified_migration_lms.sql`
- [ ] `export_compliance_data.sql`
- [ ] `import_compliance_data.sql`

---

## 🚀 PHASE 1: CREATE YOUR NEW UNIFIED SUPABASE (30 minutes)

### Step 1.1: Sign Up for New Supabase Account

1. Open browser and go to: **https://supabase.com**
2. Click the big green **"Start your project"** button
3. Choose: **Sign up with email** (or GitHub/Google)
4. Use a NEW email (or existing Supabase account is fine)
5. Complete email verification

✅ **Checkpoint:** You're logged into Supabase dashboard

### Step 1.2: Create New Organization

1. Click **"New organization"** button
2. Name it: **"Unified Platform"**
3. Choose plan: **Free** (you can upgrade later)
4. Click **"Create organization"**

✅ **Checkpoint:** Organization created

### Step 1.3: Create New Project

1. Click **"New project"** button
2. Fill in details:
   - **Name:** `unified-platform`
   - **Database Password:** Create a STRONG password
     - ⚠️ **WRITE THIS DOWN IN NOTEPAD!** You'll need it later
     - Example: `MyStr0ng!P@ssw0rd2026`
   - **Region:** Choose closest to your location
     - UK/Europe → `Europe West (London)`
     - US East → `US East (North Virginia)`
     - US West → `US West (Oregon)`
3. Click **"Create new project"**
4. **WAIT 2-3 MINUTES** - Project is being created
5. You'll see "Setting up project..." message
6. When ready, you'll see the project dashboard

✅ **Checkpoint:** New empty Supabase project is ready

### Step 1.4: Save Your New Instance Credentials

1. In project dashboard, click **"Settings"** (bottom left)
2. Click **"API"**
3. **COPY AND SAVE** these to Notepad:
   ```
   Project URL: https://xxxxx.supabase.co
   anon/public key: eyJhbGc...
   service_role key: eyJhbGc...
   ```
4. Keep this Notepad file open - you'll need these later

✅ **Checkpoint:** Credentials saved

---

## 🏗️ PHASE 2: BUILD THE UNIFIED SCHEMA (20 minutes)

Now you'll create ALL the tables and views in your NEW instance.

### Step 2.1: Open SQL Editor

1. In your NEW Supabase project dashboard
2. Click **"SQL Editor"** in left sidebar
3. Click **"+ New query"** button (top right)

✅ **Checkpoint:** Blank SQL editor is open

### Step 2.2: Create RegIntels Schema (Compliance Tables)

1. **Open File:** `unified_migration_compliance.sql`
   - Location: `C:\Users\dbnew\Desktop\regintels-app\`
   - Double-click to open in text editor
2. **Select All:** Press `Ctrl + A`
3. **Copy:** Press `Ctrl + C`
4. **Go back to Supabase SQL Editor**
5. **Paste:** Press `Ctrl + V` in the SQL editor
6. **Run:** Click the **"Run"** button (bottom right corner)
7. **WAIT:** 10-20 seconds for execution
8. **Look for success message:**
   ```
   ✅ COMPLIANCE MIGRATION SCHEMA CREATED!
   Created 7 tables + 6 views
   ```

✅ **Checkpoint:** Compliance schema created (7 tables, 6 views)

### Step 2.3: Create LMS Schema (LMS Tables)

1. **Click "New query"** again (top right)
2. **Open File:** `unified_migration_lms.sql`
3. **Select All:** `Ctrl + A`
4. **Copy:** `Ctrl + C`
5. **Paste:** `Ctrl + V` in SQL editor
6. **Run:** Click **"Run"**
7. **WAIT:** 10-20 seconds
8. **Look for success message:**
   ```
   ✅ LMS MIGRATION SCHEMA CREATED!
   Created 8 tables + 2 views
   ```

✅ **Checkpoint:** LMS schema created (8 tables, 2 views)

### Step 2.4: Verify Schema Creation

1. In Supabase, click **"Table Editor"** in left sidebar
2. You should see **15 tables total:**
   - 7 tables starting with `compliance_`
   - 8 tables starting with `lms_`

✅ **Checkpoint:** All 15 tables visible in Table Editor

---

## 📤 PHASE 3: EXPORT DATA FROM OLD REGINTELS (30 minutes)

Now you'll export your RegIntels data from the OLD instance.

### Step 3.1: Open OLD RegIntels Supabase

1. **Open NEW browser tab or window**
2. Go to: **https://supabase.com**
3. **Log in to your OLD RegIntels account**
4. Select your **RegIntels project**
5. Click **"SQL Editor"**

✅ **Checkpoint:** You have TWO Supabase tabs open
   - Tab 1: NEW unified instance
   - Tab 2: OLD RegIntels instance

### Step 3.2: Run Export Queries

1. **In OLD RegIntels tab**, click **"+ New query"**
2. **Open file:** `export_compliance_data.sql`
3. **Copy entire file:** `Ctrl + A`, then `Ctrl + C`
4. **Paste:** `Ctrl + V` in SQL editor

Now you'll run **7 export queries ONE AT A TIME**:

#### Export 1: Regulatory Changes

1. **Find the first SELECT query** (line ~20):
   ```sql
   SELECT json_agg(
     json_build_object(
       'id', id,
       'title', title,
       ...
   ) as regulatory_changes_export
   FROM public.regulatory_changes;
   ```
2. **Highlight just that query** (from SELECT to the semicolon)
3. **Click Run**
4. **In Results panel below:**
   - You'll see a cell with JSON data `[{...},{...}]`
   - **Click on the cell** to expand it
   - **Select all the JSON:** `Ctrl + A`
   - **Copy:** `Ctrl + C`
5. **Open Notepad**
6. **Paste the JSON**
7. **Save file as:** `regulatory_changes_export.json`
   - Location: `C:\Users\dbnew\Desktop\regintels-app\`

✅ **Checkpoint:** File 1/7 exported

#### Export 2-7: Repeat for Remaining Tables

**REPEAT THE SAME PROCESS** for these 6 queries:

| Query # | Table | Save As |
|---------|-------|---------|
| 2 | Controls | `controls_export.json` |
| 3 | Regulatory Change Control Map | `rccm_export.json` |
| 4 | Attestations | `attestations_export.json` |
| 5 | Exceptions | `exceptions_export.json` |
| 6 | Change Signoffs | `change_signoffs_export.json` |
| 7 | Actions | `actions_export.json` |

**For each query:**
1. Highlight the SELECT query
2. Click Run
3. Copy JSON result
4. Paste in Notepad
5. Save with correct filename

✅ **Checkpoint:** You now have 7 JSON files saved

### Step 3.3: Note Record Counts

1. **At the end of export_compliance_data.sql**, find the summary query
2. **Highlight and Run it**
3. **Copy the results to Notepad:**
   ```
   Regulatory Changes: 42
   Controls: 156
   Regulatory Change Control Map: 234
   Attestations: 89
   Exceptions: 23
   Change Signoffs: 67
   Actions: 145
   ```
4. **Save this** - you'll verify these counts after import

✅ **Checkpoint:** Export complete with verification counts

---

## 📥 PHASE 4: IMPORT REGINTELS DATA TO NEW INSTANCE (30 minutes)

Now you'll import the exported data into your NEW instance.

### Step 4.1: Prepare Import Script

1. **Open file:** `import_compliance_data.sql`
2. You'll see placeholders like: `[PASTE_REGULATORY_CHANGES_JSON_HERE]`
3. **For each placeholder**, you need to replace it with the actual JSON

#### Import 1: Regulatory Changes

1. Find this line in `import_compliance_data.sql`:
   ```sql
   FROM json_array_elements('[PASTE_REGULATORY_CHANGES_JSON_HERE]'::json);
   ```
2. **Replace `[PASTE_REGULATORY_CHANGES_JSON_HERE]`** with your actual JSON:
   - **Open:** `regulatory_changes_export.json`
   - **Select all:** `Ctrl + A`
   - **Copy:** `Ctrl + C`
   - **In import_compliance_data.sql**, DELETE the text `[PASTE_REGULATORY_CHANGES_JSON_HERE]`
   - **Paste your JSON:** `Ctrl + V`
3. **Result should look like:**
   ```sql
   FROM json_array_elements('[
     {
       "id": "123e4567-e89b-12d3-a456-426614174000",
       "title": "Enhanced Customer Due Diligence",
       ...
     },
     ...
   ]'::json);
   ```

#### Import 2-7: Repeat for All Tables

**REPEAT for each of the 7 tables:**

| # | Placeholder | JSON File |
|---|-------------|-----------|
| 1 | `[PASTE_REGULATORY_CHANGES_JSON_HERE]` | `regulatory_changes_export.json` |
| 2 | `[PASTE_CONTROLS_JSON_HERE]` | `controls_export.json` |
| 3 | `[PASTE_RCCM_JSON_HERE]` | `rccm_export.json` |
| 4 | `[PASTE_ATTESTATIONS_JSON_HERE]` | `attestations_export.json` |
| 5 | `[PASTE_EXCEPTIONS_JSON_HERE]` | `exceptions_export.json` |
| 6 | `[PASTE_CHANGE_SIGNOFFS_JSON_HERE]` | `change_signoffs_export.json` |
| 7 | `[PASTE_ACTIONS_JSON_HERE]` | `actions_export.json` |

**For each one:**
1. Open the JSON file
2. Copy all contents
3. Find the placeholder in import script
4. Delete placeholder
5. Paste JSON

⚠️ **IMPORTANT:** Make sure to keep the single quotes `'` before and after the JSON!

✅ **Checkpoint:** All 7 placeholders replaced with actual JSON

### Step 4.2: Run Import in NEW Instance

1. **Switch to your NEW Supabase tab**
2. **Click SQL Editor**
3. **Click "+ New query"**
4. **Copy your modified import_compliance_data.sql:**
   - `Ctrl + A` to select all
   - `Ctrl + C` to copy
5. **Paste in SQL Editor:** `Ctrl + V`
6. **Click "Run"**
7. **WAIT:** This may take 1-2 minutes
8. **Look for success message:**
   ```
   ✅ COMPLIANCE DATA IMPORT COMPLETE!
   Imported 7 tables
   ```

✅ **Checkpoint:** RegIntels data imported!

### Step 4.3: Verify Import

1. **Check the verification counts** at the end of the results
2. **Compare with your export counts** (from Step 3.3)
3. **All numbers should MATCH EXACTLY**

Example:
```
compliance_regulatory_changes: 42 ✅
compliance_controls: 156 ✅
compliance_attestations: 89 ✅
...
```

✅ **Checkpoint:** All data verified and imported correctly

---

## 📤📥 PHASE 5: EXPORT & IMPORT LMS DATA (30 minutes)

**IMPORTANT:** I created a template LMS schema. If your actual LMS has different tables, you'll need to:
1. Tell me what tables your LMS has
2. I'll create the proper export/import scripts for you

**For now, assuming you want to proceed with the template:**

### Step 5.1: Create LMS Export Script

⚠️ **ACTION NEEDED:** Please tell me:
- What is your OLD LMS Supabase project name?
- Do you want to export LMS data, or is this a fresh LMS setup?

**If you want to export existing LMS data:**
- I'll create an `export_lms_data.sql` file similar to the compliance export
- You'll follow the same process as Phase 3

**If you're starting fresh with LMS:**
- Skip to Phase 6 (no export/import needed)
- The schema is already created from Step 2.3

---

## 🧪 PHASE 6: TEST YOUR UNIFIED INSTANCE (15 minutes)

Time to verify everything works!

### Step 6.1: Test Compliance Views

1. **In NEW instance SQL Editor**, run these test queries:

```sql
-- Test Impact Score View
SELECT
  change_title,
  total_impact_score,
  risk_band,
  primary_driver
FROM public.compliance_v_regulatory_impact_score
ORDER BY total_impact_score DESC
LIMIT 5;
```

**Expected:** Should return 5 rows with regulatory changes and their scores

```sql
-- Test Control Drift View
SELECT
  control_code,
  control_title,
  drift_status,
  drift_score
FROM public.compliance_v_control_drift_index
ORDER BY drift_score DESC
LIMIT 5;
```

**Expected:** Should return 5 controls with drift information

✅ **Checkpoint:** Compliance views working

### Step 6.2: Test LMS Views (if applicable)

```sql
-- Test LMS Course Progress
SELECT * FROM public.lms_v_course_progress_summary LIMIT 5;

-- Test LMS User Dashboard
SELECT * FROM public.lms_v_user_learning_dashboard LIMIT 5;
```

✅ **Checkpoint:** LMS views working (or empty if no data yet)

### Step 6.3: Verify Table Structure

1. **Click "Table Editor"** in left sidebar
2. **Click on `compliance_regulatory_changes`**
3. **Verify you see your data**
4. **Click on `compliance_controls`**
5. **Verify you see your controls**

✅ **Checkpoint:** Data visible in Table Editor

---

## 🔄 PHASE 7: UPDATE YOUR APPLICATIONS (LATER - NOT TODAY)

**Don't do this now!** This is for when you're ready to connect your apps.

### When you're ready to update your RegIntels app:

1. **Update Supabase connection:**
   ```javascript
   // OLD
   const supabaseUrl = 'https://old-regintels.supabase.co'

   // NEW
   const supabaseUrl = 'https://xxxxx.supabase.co'  // Your new URL
   ```

2. **Update table names in your code:**
   - Find: `'regulatory_changes'`
   - Replace: `'compliance_regulatory_changes'`
   - (Do this for all 7 tables)

3. **Update view names:**
   - Find: `'v_regulatory_impact_score'`
   - Replace: `'compliance_v_regulatory_impact_score'`

---

## ✅ SUCCESS CHECKLIST

By the end of this process, you should have:

- [  ] NEW Supabase account created
- [  ] Unified project `unified-platform` created
- [  ] 7 compliance tables created (compliance_*)
- [  ] 8 LMS tables created (lms_*)
- [  ] RegIntels data exported from OLD instance (7 JSON files)
- [  ] RegIntels data imported to NEW instance
- [  ] LMS data handled (exported/imported OR fresh setup)
- [  ] All views working and returning data
- [  ] Record counts verified and matching
- [  ] New Supabase credentials saved

---

## 🆘 TROUBLESHOOTING

### Problem: "Error: relation does not exist"

**Cause:** Tables not created yet

**Fix:** Go back to Phase 2 and run the schema creation scripts

### Problem: "JSON parse error"

**Cause:** Invalid JSON in import script

**Fix:**
1. Validate your JSON at https://jsonlint.com
2. Make sure you copied the ENTIRE JSON array `[...]`
3. Keep the single quotes around the JSON

### Problem: "Foreign key constraint violation"

**Cause:** Importing tables in wrong order

**Fix:** Make sure you run the import script as-is (don't change the order)

### Problem: Can't see data in Table Editor

**Cause:** RLS policies or no data imported

**Fix:**
1. Run the verification queries from Phase 6
2. Check import success messages
3. Verify record counts

---

## 📞 NEXT STEPS AFTER MIGRATION

Once you complete this migration:

1. **Keep your OLD instances running** (don't delete yet)
2. **Test thoroughly** in the NEW instance
3. **When ready to switch:**
   - Update your application connection strings
   - Update table names in your code
   - Test your applications
   - Once verified, you can decommission OLD instances

---

## 📝 SUMMARY OF FILE LOCATIONS

All files are in: `C:\Users\dbnew\Desktop\regintels-app\`

**Schema Creation (run in NEW instance):**
- `unified_migration_compliance.sql` - Creates compliance tables
- `unified_migration_lms.sql` - Creates LMS tables

**Data Export (run in OLD RegIntels instance):**
- `export_compliance_data.sql` - Exports RegIntels data

**Data Import (run in NEW instance after editing):**
- `import_compliance_data.sql` - Imports RegIntels data

**Export Results (save these):**
- `regulatory_changes_export.json`
- `controls_export.json`
- `rccm_export.json`
- `attestations_export.json`
- `exceptions_export.json`
- `change_signoffs_export.json`
- `actions_export.json`

---

**YOU'RE READY TO START! Begin with Phase 1, Step 1.1** 🚀

Take your time, follow each step carefully, and you'll have a unified Supabase instance in 2-3 hours!
