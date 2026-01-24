# 📋 UNIFIED MIGRATION CHECKLIST
**Print this page and check off each step as you complete it**

---

## BEFORE YOU START

- [ ] I have access to OLD RegIntels Supabase account
- [ ] I have access to OLD LMS Supabase account (if applicable)
- [ ] I have 2-3 hours available
- [ ] I have coffee/tea ☕
- [ ] All migration files are in: `C:\Users\dbnew\Desktop\regintels-app\`

---

## PHASE 1: CREATE NEW SUPABASE (30 min)

- [ ] **1.1** Signed up at supabase.com
- [ ] **1.2** Created organization: "Unified Platform"
- [ ] **1.3** Created project: "unified-platform"
- [ ] **1.4** Saved database password: ________________
- [ ] **1.4** Project finished provisioning (2-3 min wait)
- [ ] **1.4** Saved Project URL: ________________________________
- [ ] **1.4** Saved anon key (first 20 chars): ________________________________
- [ ] **1.4** Saved service_role key (first 20 chars): ________________________________

---

## PHASE 2: BUILD SCHEMA (20 min)

- [ ] **2.1** Opened SQL Editor in NEW instance
- [ ] **2.2** Ran `unified_migration_compliance.sql`
- [ ] **2.2** ✅ Saw success: "COMPLIANCE MIGRATION SCHEMA CREATED! 7 tables + 6 views"
- [ ] **2.3** Ran `unified_migration_lms.sql`
- [ ] **2.3** ✅ Saw success: "LMS MIGRATION SCHEMA CREATED! 8 tables + 2 views"
- [ ] **2.4** Verified in Table Editor: See 15 tables total
  - [ ] 7 tables starting with `compliance_`
  - [ ] 8 tables starting with `lms_`

---

## PHASE 3: EXPORT REGINTELS DATA (30 min)

- [ ] **3.1** Opened OLD RegIntels Supabase in new browser tab
- [ ] **3.1** Opened SQL Editor
- [ ] **3.2** Pasted `export_compliance_data.sql`

**Export Each Table (run query, copy JSON, save file):**

- [ ] **Export 1/7:** Regulatory Changes → saved `regulatory_changes_export.json`
  - Record count: _________
- [ ] **Export 2/7:** Controls → saved `controls_export.json`
  - Record count: _________
- [ ] **Export 3/7:** RCCM → saved `rccm_export.json`
  - Record count: _________
- [ ] **Export 4/7:** Attestations → saved `attestations_export.json`
  - Record count: _________
- [ ] **Export 5/7:** Exceptions → saved `exceptions_export.json`
  - Record count: _________
- [ ] **Export 6/7:** Change Signoffs → saved `change_signoffs_export.json`
  - Record count: _________
- [ ] **Export 7/7:** Actions → saved `actions_export.json`
  - Record count: _________

- [ ] **3.3** Ran summary query and noted all record counts above

---

## PHASE 4: IMPORT REGINTELS DATA (30 min)

- [ ] **4.1** Opened `import_compliance_data.sql` in text editor
- [ ] **4.1** Replaced `[PASTE_REGULATORY_CHANGES_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_CONTROLS_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_RCCM_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_ATTESTATIONS_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_EXCEPTIONS_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_CHANGE_SIGNOFFS_JSON_HERE]` with JSON from file
- [ ] **4.1** Replaced `[PASTE_ACTIONS_JSON_HERE]` with JSON from file
- [ ] **4.2** Switched to NEW Supabase tab
- [ ] **4.2** Pasted modified import script in SQL Editor
- [ ] **4.2** Clicked "Run"
- [ ] **4.2** Waited 1-2 minutes
- [ ] **4.2** ✅ Saw success: "COMPLIANCE DATA IMPORT COMPLETE!"

**Verify Import Counts Match Export:**

- [ ] **4.3** Regulatory Changes: Export _____ = Import _____ ✅
- [ ] **4.3** Controls: Export _____ = Import _____ ✅
- [ ] **4.3** RCCM: Export _____ = Import _____ ✅
- [ ] **4.3** Attestations: Export _____ = Import _____ ✅
- [ ] **4.3** Exceptions: Export _____ = Import _____ ✅
- [ ] **4.3** Change Signoffs: Export _____ = Import _____ ✅
- [ ] **4.3** Actions: Export _____ = Import _____ ✅

---

## PHASE 5: LMS DATA (if applicable)

**Option A: Fresh LMS Setup (no existing data)**
- [ ] Skip this phase - LMS tables already created in Phase 2

**Option B: Migrate Existing LMS Data**
- [ ] Create export script for LMS
- [ ] Export LMS data from OLD instance
- [ ] Import LMS data to NEW instance
- [ ] Verify counts

---

## PHASE 6: TEST EVERYTHING (15 min)

**Test Compliance Views:**
- [ ] **6.1** Ran impact score test query - returned 5 rows ✅
- [ ] **6.1** Ran control drift test query - returned 5 rows ✅
- [ ] **6.1** Ran attestation confidence test query - returned 5 rows ✅

**Test LMS Views:**
- [ ] **6.2** Ran course progress test query ✅
- [ ] **6.2** Ran user dashboard test query ✅

**Verify Data in Table Editor:**
- [ ] **6.3** Clicked `compliance_regulatory_changes` - see data ✅
- [ ] **6.3** Clicked `compliance_controls` - see data ✅
- [ ] **6.3** Clicked `compliance_attestations` - see data ✅

---

## FINAL SUCCESS CHECKLIST

- [ ] NEW Supabase unified instance created ✅
- [ ] All compliance tables (7) created and populated ✅
- [ ] All LMS tables (8) created ✅
- [ ] All compliance views (6) working ✅
- [ ] All LMS views (2) working ✅
- [ ] Record counts verified and match ✅
- [ ] Test queries return expected data ✅
- [ ] Credentials saved in safe location ✅

---

## IMPORTANT NOTES

**Database Password:** ________________________________

**Project URL:** ________________________________

**Migration Date:** ________________________________

**Total Records Migrated:** ________

**Any Issues Encountered:**
________________________________________________________________
________________________________________________________________
________________________________________________________________

---

## NEXT STEPS (DO LATER - NOT TODAY)

- [ ] Test thoroughly in NEW instance
- [ ] Keep OLD instances running (don't delete yet!)
- [ ] When ready: Update application connection strings
- [ ] When ready: Update table names in code
- [ ] When ready: Switch applications to NEW instance
- [ ] After 2 weeks of successful operation: Decommission OLD instances

---

**CONGRATULATIONS! 🎉**

If all boxes are checked, your unified migration is complete!

**Migration Completed By:** ____________________________

**Date:** ____________________________

**Time Spent:** __________ hours
