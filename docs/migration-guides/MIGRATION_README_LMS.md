# LMS to Unified Platform Migration Package

Complete guide for migrating your LMS from a separate Supabase account to a unified multi-app platform.

## 📦 Package Contents

This migration package includes:

1. **unified_migration_lms.sql** - Creates all LMS tables with `lms_` prefix in unified database
2. **export_lms_data.sql** - Exports data from your old LMS Supabase project
3. **import_lms_data.sql** - Imports data into the new unified project
4. **UPDATE_APPLICATION_GUIDE.md** - Step-by-step code update instructions

## 🎯 Migration Overview

### Current State
- **LMS**: Separate Supabase account with tables: `orgs`, `courses`, `lessons`, etc.
- **RegIntels**: Separate Supabase account
- **FCA Licensing**: To be built with separate Supabase account

### Target State
- **Unified Platform**: Single Supabase account with:
  - Shared `auth.users` for SSO
  - LMS tables: `lms_orgs`, `lms_courses`, `lms_lessons`, etc.
  - Compliance tables: `compliance_*` (future)
  - Licensing tables: `licensing_*` (future)
  - Shared tables: `organizations`, `subscriptions`, etc.

## 📋 Complete Migration Steps

### Phase 1: Preparation (2-4 hours)

1. **Create New Unified Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create new project: "unified-platform" or similar
   - Choose same region as current projects
   - Save credentials securely

2. **Audit Current LMS Data**
   ```bash
   # Connect to old LMS Supabase
   # Run in SQL Editor:
   ```
   Run the data count verification from `export_lms_data.sql`

3. **Document Current Users**
   - Export user list from old LMS auth.users
   - Save email addresses for re-invitation

### Phase 2: Schema Migration (1-2 hours)

4. **Create LMS Schema in Unified Project**
   - Open new unified Supabase SQL Editor
   - Run `unified_migration_lms.sql`
   - Verify all 20 tables created with `lms_` prefix
   - Check RLS policies enabled

5. **Verify Schema**
   ```sql
   -- Run in unified project SQL Editor
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name LIKE 'lms_%'
   ORDER BY table_name;
   ```
   Should see 20 tables.

### Phase 3: User Migration (2-4 hours)

6. **Migrate Authentication Users**

   **Option A: Manual Re-invitation (Simplest)**
   - Export user emails from old project
   - Send invitation emails from new project
   - Users re-register with same email
   - ⚠️ UUIDs will be different - see Option B

   **Option B: Supabase CLI Migration (Recommended)**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Login to Supabase
   supabase login

   # Export users from old project
   supabase db dump --db-url "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT].supabase.co:5432/postgres" --schema auth > auth_backup.sql

   # Import to new project (manual process, requires adjustments)
   # See: https://supabase.com/docs/guides/auth/managing-user-data
   ```

   **Option C: Admin API (Advanced)**
   Use Supabase Admin API to programmatically create users
   - Preserves UUIDs if needed
   - Requires service_role key
   - See Supabase docs on admin user creation

### Phase 4: Data Migration (2-6 hours)

7. **Export Data from Old LMS**

   **Method 1: SQL Editor (Simple)**
   - Open old LMS Supabase SQL Editor
   - Run each COPY command from `export_lms_data.sql`
   - Save CSV files locally

   **Method 2: pg_dump (Recommended)**
   ```bash
   # Set credentials
   export OLD_DB_HOST="db.xxxxx.supabase.co"
   export OLD_DB_PASSWORD="your_password"

   # Export all data at once
   pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
     --data-only --column-inserts \
     --exclude-table=auth.* \
     --exclude-table=storage.* \
     -f lms_all_data.sql
   ```

8. **Transform Exported Data**
   - Open `lms_all_data.sql`
   - Find & replace table names:
     - `INSERT INTO orgs` → `INSERT INTO lms_orgs`
     - `INSERT INTO courses` → `INSERT INTO lms_courses`
     - etc. (see UPDATE_APPLICATION_GUIDE.md for full list)

9. **Import Data to Unified Project**
   - Open unified Supabase SQL Editor
   - Run transformed SQL file
   - Or use import script from `import_lms_data.sql`

10. **Verify Data Import**
    ```sql
    -- Run in unified project
    SELECT 'lms_orgs' as table_name, COUNT(*) as row_count FROM lms_orgs
    UNION ALL
    SELECT 'lms_courses', COUNT(*) FROM lms_courses
    -- ... etc
    ```
    Compare counts with old project.

### Phase 5: Application Update (4-8 hours)

11. **Update Environment Variables**
    ```env
    # .env.local
    NEXT_PUBLIC_SUPABASE_URL=https://your-unified-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
    ```

12. **Update Table References in Code**
    - Follow `UPDATE_APPLICATION_GUIDE.md`
    - Use find & replace:
      - `from('orgs')` → `from('lms_orgs')`
      - `from('courses')` → `from('lms_courses')`
      - etc.

13. **Regenerate TypeScript Types**
    ```bash
    npx supabase gen types typescript --project-id your-unified-project > types/supabase.ts
    ```

14. **Update Type References**
    ```typescript
    // Old
    type Course = Database['public']['Tables']['courses']['Row'];

    // New
    type Course = Database['public']['Tables']['lms_courses']['Row'];
    ```

### Phase 6: Testing (4-8 hours)

15. **Test Core Functionality**
    - [ ] User login/logout
    - [ ] Organization access
    - [ ] Course listing
    - [ ] Course creation
    - [ ] Lesson viewing
    - [ ] Quiz taking
    - [ ] Progress tracking
    - [ ] Assignments
    - [ ] Virtual classroom
    - [ ] User permissions

16. **Test Edge Cases**
    - [ ] Multi-org users
    - [ ] Different user roles
    - [ ] Data export
    - [ ] Reporting

### Phase 7: Deployment (2-4 hours)

17. **Deploy to Staging**
    - Deploy updated app to staging environment
    - Test with real users
    - Gather feedback

18. **Production Cutover**
    - Schedule maintenance window
    - Deploy to production
    - Monitor error logs
    - Have rollback plan ready

## ⏱️ Timeline Estimate

| Phase | Duration | Can be done in parallel |
|-------|----------|------------------------|
| Preparation | 2-4 hours | No |
| Schema Migration | 1-2 hours | No |
| User Migration | 2-4 hours | No |
| Data Migration | 2-6 hours | No |
| Application Update | 4-8 hours | No |
| Testing | 4-8 hours | No |
| Deployment | 2-4 hours | No |
| **Total** | **17-36 hours** | |

**Realistic timeline: 1 week** (with testing and validation)

## 🚨 Critical Considerations

### Data Integrity
- **User IDs must match** between old and new projects
- If re-inviting users, you'll need to:
  - Create mapping table: old_user_id → new_user_id
  - Update all foreign keys in data before import
  - Or accept data loss (completions, attempts tied to old users)

### Downtime
- **Recommended approach**: Blue-Green deployment
  - Keep old system running
  - Set up new system in parallel
  - Test thoroughly
  - Switch DNS/routing when ready
  - Keep old system as backup for 2 weeks

### Rollback Plan
- Keep old Supabase project active for 2-4 weeks
- Don't delete old data until confident
- Document rollback steps

## 📊 Table Mapping Reference

| Old Table | New Table | Rows |
|-----------|-----------|------|
| profiles | lms_profiles | ? |
| orgs | lms_orgs | ? |
| org_members | lms_org_members | ? |
| courses | lms_courses | ? |
| course_versions | lms_course_versions | ? |
| modules | lms_modules | ? |
| lessons | lms_lessons | ? |
| lesson_blocks | lms_lesson_blocks | ? |
| quizzes | lms_quizzes | ? |
| questions | lms_questions | ? |
| question_options | lms_question_options | ? |
| completions | lms_completions | ? |
| attempts | lms_attempts | ? |
| attempt_answers | lms_attempt_answers | ? |
| assignments | lms_assignments | ? |
| org_policies | lms_org_policies | ? |
| policy_acknowledgements | lms_policy_acknowledgements | ? |
| audit_events | lms_audit_events | ? |
| course_templates | lms_course_templates | ? |
| classroom_sessions | lms_classroom_sessions | ? |

## 🔄 Future Migrations

After LMS migration is complete, repeat similar process for:

1. **RegIntels** → `compliance_*` tables
2. **FCA Licensing** → `licensing_*` tables

## 🏗️ Unified Platform Architecture

```
┌─────────────────────────────────────────────┐
│         Unified Supabase Project            │
├─────────────────────────────────────────────┤
│                                             │
│  auth.users (Shared Authentication)         │
│                                             │
├──────────────┬──────────────┬───────────────┤
│              │              │               │
│  LMS Tables  │  Compliance  │   Licensing   │
│  lms_*       │  compliance_*│  licensing_*  │
│              │              │               │
│  • lms_orgs  │  • comp_...  │  • lic_apps   │
│  • lms_...   │  • comp_...  │  • lic_firms  │
│              │              │  • lic_...    │
└──────────────┴──────────────┴───────────────┘
         │              │              │
         ▼              ▼              ▼
    ┌────────┐    ┌─────────┐    ┌──────────┐
    │  LMS   │    │RegIntels│    │   FCA    │
    │  App   │    │   App   │    │Licensing │
    └────────┘    └─────────┘    └──────────┘
         │              │              │
         └──────────────┴──────────────┘
                       │
                       ▼
              ┌──────────────────┐
              │  Unified Portal  │
              │    Dashboard     │
              └──────────────────┘
```

## 📞 Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Migration Guide**: https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

## ✅ Pre-Flight Checklist

Before starting migration:

- [ ] New unified Supabase project created
- [ ] Old LMS data backed up
- [ ] User list exported
- [ ] Migration scripts reviewed
- [ ] Team notified of upcoming changes
- [ ] Maintenance window scheduled
- [ ] Rollback plan documented
- [ ] Staging environment ready for testing

## 🎉 Success Criteria

Migration is successful when:

- [ ] All data migrated (row counts match)
- [ ] Users can log in to unified platform
- [ ] All LMS features work correctly
- [ ] No data integrity errors
- [ ] Performance is acceptable
- [ ] Old system can be safely retired

---

**Good luck with your migration!** 🚀

If you encounter issues, start with the troubleshooting section in UPDATE_APPLICATION_GUIDE.md.
