# LMS Application Update Guide for Unified Platform

This guide walks you through updating your LMS application code to work with the unified Supabase database with `lms_` prefixed tables.

## Overview

After migrating your database schema and data to the unified platform, you need to update your application code to reference the new table names.

## Step 1: Update Environment Variables

Update your `.env` or `.env.local` file:

```env
# OLD (separate LMS Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-old-lms-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-old-anon-key

# NEW (unified Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-unified-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-unified-anon-key
```

## Step 2: Find All Table References

Search your codebase for table name references. Common patterns:

```bash
# Search for direct table references
grep -r "from('orgs'" .
grep -r "from('courses'" .
grep -r "from('org_members'" .

# Search for all Supabase queries
grep -r "\.from\(" . --include="*.ts" --include="*.tsx" --include="*.js"
```

## Step 3: Update Table Names in Code

### Pattern 1: Direct Supabase Queries

**Before:**
```typescript
const { data: courses } = await supabase
  .from('courses')
  .select('*')
  .eq('org_id', orgId);
```

**After:**
```typescript
const { data: courses } = await supabase
  .from('lms_courses')
  .select('*')
  .eq('org_id', orgId);
```

### Pattern 2: With Joins

**Before:**
```typescript
const { data } = await supabase
  .from('courses')
  .select(`
    *,
    course_versions (
      *,
      modules (
        *,
        lessons (*)
      )
    )
  `)
  .eq('org_id', orgId);
```

**After:**
```typescript
const { data } = await supabase
  .from('lms_courses')
  .select(`
    *,
    lms_course_versions (
      *,
      lms_modules (
        *,
        lms_lessons (*)
      )
    )
  `)
  .eq('org_id', orgId);
```

### Pattern 3: Table Name Constants (Recommended)

Create a constants file for table names:

```typescript
// lib/constants/table-names.ts
export const TABLE_NAMES = {
  PROFILES: 'lms_profiles',
  ORGS: 'lms_orgs',
  ORG_MEMBERS: 'lms_org_members',
  COURSES: 'lms_courses',
  COURSE_VERSIONS: 'lms_course_versions',
  MODULES: 'lms_modules',
  LESSONS: 'lms_lessons',
  LESSON_BLOCKS: 'lms_lesson_blocks',
  QUIZZES: 'lms_quizzes',
  QUESTIONS: 'lms_questions',
  QUESTION_OPTIONS: 'lms_question_options',
  COMPLETIONS: 'lms_completions',
  ATTEMPTS: 'lms_attempts',
  ATTEMPT_ANSWERS: 'lms_attempt_answers',
  ASSIGNMENTS: 'lms_assignments',
  ORG_POLICIES: 'lms_org_policies',
  POLICY_ACKNOWLEDGEMENTS: 'lms_policy_acknowledgements',
  AUDIT_EVENTS: 'lms_audit_events',
  COURSE_TEMPLATES: 'lms_course_templates',
  CLASSROOM_SESSIONS: 'lms_classroom_sessions',
} as const;
```

Then use in your code:

```typescript
import { TABLE_NAMES } from '@/lib/constants/table-names';

const { data: courses } = await supabase
  .from(TABLE_NAMES.COURSES)
  .select('*');
```

## Step 4: Update Type Definitions

If you're using TypeScript with generated types from Supabase:

```bash
# Generate new types from unified database
npx supabase gen types typescript --project-id your-unified-project > types/supabase.ts
```

Update your type imports:

**Before:**
```typescript
import { Database } from '@/types/supabase';

type Course = Database['public']['Tables']['courses']['Row'];
```

**After:**
```typescript
import { Database } from '@/types/supabase';

type Course = Database['public']['Tables']['lms_courses']['Row'];
```

## Step 5: Common Files to Update

Based on typical LMS structure, check these files:

### API Routes
- `app/api/courses/**/*.ts`
- `app/api/orgs/**/*.ts`
- `app/api/lessons/**/*.ts`
- `app/api/quizzes/**/*.ts`

### Server Actions
- `app/actions/courses.ts`
- `app/actions/organizations.ts`
- `app/actions/assignments.ts`

### Utility Functions
- `lib/supabase/queries.ts`
- `lib/db/*.ts`

### Components (Server Components)
- Any component that fetches data directly

## Step 6: Search & Replace Strategy

Use your IDE's find & replace with regex:

### VSCode / Cursor

1. Open Find & Replace (Cmd/Ctrl + Shift + H)
2. Enable regex mode
3. Use these patterns:

**Find:** `from\(['"]orgs['"]\)`
**Replace:** `from('lms_orgs')`

**Find:** `from\(['"]courses['"]\)`
**Replace:** `from('lms_courses')`

Repeat for each table name.

### Table Name Mapping

Here's the complete mapping for find & replace:

```
profiles          → lms_profiles
orgs              → lms_orgs
org_members       → lms_org_members
courses           → lms_courses
course_versions   → lms_course_versions
modules           → lms_modules
lessons           → lms_lessons
lesson_blocks     → lms_lesson_blocks
quizzes           → lms_quizzes
questions         → lms_questions
question_options  → lms_question_options
completions       → lms_completions
attempts          → lms_attempts
attempt_answers   → lms_attempt_answers
assignments       → lms_assignments
org_policies      → lms_org_policies
policy_acknowledgements → lms_policy_acknowledgements
audit_events      → lms_audit_events
course_templates  → lms_course_templates
classroom_sessions → lms_classroom_sessions
```

## Step 7: Update Database Migrations

If you have any pending migrations in your app:

```bash
# In your app's migration folder
# Update any .sql files to reference lms_ tables
```

## Step 8: Testing Checklist

After updating your code:

- [ ] App starts without errors
- [ ] Login/authentication works
- [ ] Organizations load correctly
- [ ] Courses display properly
- [ ] Course creation works
- [ ] Lessons and modules render
- [ ] Quizzes function correctly
- [ ] Completions tracked properly
- [ ] Assignments work
- [ ] Classroom sessions load
- [ ] User permissions work (RLS policies)

## Step 9: Rollback Plan

Keep your old Supabase project active for at least 2 weeks:

1. Don't delete old project immediately
2. Keep a database backup
3. Document any issues found
4. Have connection details ready for quick rollback

### Quick Rollback

If you need to rollback:

```env
# Revert .env to old values
NEXT_PUBLIC_SUPABASE_URL=https://your-old-lms-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-old-anon-key
```

## Step 10: Performance Optimization

After migration, monitor and optimize:

1. **Check Query Performance**
   ```sql
   -- In Supabase SQL Editor
   EXPLAIN ANALYZE
   SELECT * FROM lms_courses WHERE org_id = 'some-uuid';
   ```

2. **Verify Indexes**
   All indexes should have been created by migration script

3. **Monitor RLS Policies**
   Check Supabase logs for any RLS policy violations

## Common Issues & Solutions

### Issue: "relation does not exist" error

**Cause:** Forgot to update a table name
**Solution:** Search for the old table name in your code

```bash
grep -r "from('courses'" .
```

### Issue: Type errors after migration

**Cause:** TypeScript types not regenerated
**Solution:** Regenerate types from new database

```bash
npx supabase gen types typescript --project-id your-unified-project > types/supabase.ts
```

### Issue: Joins not working

**Cause:** Foreign table names in join not updated
**Solution:** Update nested table references in select

```typescript
// Make sure ALL table names in select are updated
.select(`
  *,
  lms_course_versions (*)  // Not just 'course_versions'
`)
```

### Issue: RLS policies blocking queries

**Cause:** User permissions not set up in unified project
**Solution:** Ensure user is member of org in lms_org_members table

## Next Steps

After successfully updating your LMS application:

1. **Repeat for RegIntels** - Create similar migration with `compliance_` prefix
2. **Repeat for FCA Licensing** - Create migration with `licensing_` prefix
3. **Build Unified Portal** - Create main dashboard that links to all apps

## Need Help?

Common commands for debugging:

```bash
# Check what tables exist in your database
psql -h db.xxx.supabase.co -U postgres -d postgres -c "\dt"

# Count rows in a table
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT COUNT(*) FROM lms_courses;"

# Check if user has access to org
psql -h db.xxx.supabase.co -U postgres -d postgres -c "SELECT * FROM lms_org_members WHERE user_id = 'user-uuid';"
```
