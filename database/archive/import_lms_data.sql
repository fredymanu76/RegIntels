-- ===============================================
-- IMPORT LMS DATA TO UNIFIED PROJECT
-- ===============================================
-- This script imports data from your old LMS project
-- into the new unified Supabase project with lms_ prefix
--
-- PREREQUISITES:
-- 1. unified_migration_lms.sql has been run (schema created)
-- 2. Data has been exported from old project
-- 3. Users from old project exist in new unified auth.users
--
-- Run this in your NEW unified Supabase SQL Editor
-- ===============================================

-- ===============================================
-- IMPORTANT: USER MIGRATION NOTES
-- ===============================================
-- Before running this script, ensure all users from your old LMS
-- exist in the new unified project's auth.users table.
--
-- Options for user migration:
-- 1. Manual: Invite users to re-register (simplest)
-- 2. Export/Import: Use Supabase CLI or API to migrate users
-- 3. Admin SDK: Use Supabase admin API to create users
--
-- The user_id UUIDs MUST match between old and new project
-- for data integrity!
-- ===============================================

-- ===============================================
-- STEP 1: VERIFY PREREQUISITES
-- ===============================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  -- Check if lms tables exist
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name LIKE 'lms_%';

  IF table_count < 20 THEN
    RAISE EXCEPTION 'Migration schema not found! Run unified_migration_lms.sql first.';
  END IF;

  RAISE NOTICE 'Prerequisites check passed ✓';
END $$;

-- ===============================================
-- STEP 2: IMPORT DATA (Update table references)
-- ===============================================
-- This section shows how to modify your exported INSERT statements
-- to use the new lms_ prefixed table names

-- Example: If you exported orgs data, modify like this:
-- OLD: INSERT INTO orgs (id, name, ...) VALUES (...);
-- NEW: INSERT INTO lms_orgs (id, name, ...) VALUES (...);

-- ===============================================
-- METHOD 1: Import from pg_dump files
-- ===============================================
-- If you used pg_dump to export, you'll need to:
-- 1. Open each exported .sql file
-- 2. Replace table name with lms_ prefix using find/replace:
--    Find: "INSERT INTO orgs"
--    Replace: "INSERT INTO lms_orgs"
-- 3. Run the modified SQL in the new project

-- ===============================================
-- METHOD 2: Import from CSV files
-- ===============================================
-- If you exported to CSV, use COPY to import:

-- Example for organizations:
/*
COPY lms_orgs (id, name, sector, risk_profile_json, created_by, created_at)
FROM '/path/to/lms_orgs_data.csv'
WITH CSV HEADER;
*/

-- Repeat for each table in order of dependencies:

-- 1. Import Organizations
-- COPY lms_orgs (...) FROM 'lms_orgs_data.csv' WITH CSV HEADER;

-- 2. Import Org Members
-- COPY lms_org_members (...) FROM 'lms_org_members_data.csv' WITH CSV HEADER;

-- 3. Import Courses
-- COPY lms_courses (...) FROM 'lms_courses_data.csv' WITH CSV HEADER;

-- 4. Import Course Versions
-- COPY lms_course_versions (...) FROM 'lms_course_versions_data.csv' WITH CSV HEADER;

-- 5. Import Modules
-- COPY lms_modules (...) FROM 'lms_modules_data.csv' WITH CSV HEADER;

-- 6. Import Lessons
-- COPY lms_lessons (...) FROM 'lms_lessons_data.csv' WITH CSV HEADER;

-- 7. Import Lesson Blocks
-- COPY lms_lesson_blocks (...) FROM 'lms_lesson_blocks_data.csv' WITH CSV HEADER;

-- 8. Import Quizzes
-- COPY lms_quizzes (...) FROM 'lms_quizzes_data.csv' WITH CSV HEADER;

-- 9. Import Questions
-- COPY lms_questions (...) FROM 'lms_questions_data.csv' WITH CSV HEADER;

-- 10. Import Question Options
-- COPY lms_question_options (...) FROM 'lms_question_options_data.csv' WITH CSV HEADER;

-- 11. Import Completions
-- COPY lms_completions (...) FROM 'lms_completions_data.csv' WITH CSV HEADER;

-- 12. Import Attempts
-- COPY lms_attempts (...) FROM 'lms_attempts_data.csv' WITH CSV HEADER;

-- 13. Import Attempt Answers
-- COPY lms_attempt_answers (...) FROM 'lms_attempt_answers_data.csv' WITH CSV HEADER;

-- 14. Import Assignments
-- COPY lms_assignments (...) FROM 'lms_assignments_data.csv' WITH CSV HEADER;

-- 15. Import Org Policies
-- COPY lms_org_policies (...) FROM 'lms_org_policies_data.csv' WITH CSV HEADER;

-- 16. Import Policy Acknowledgements
-- COPY lms_policy_acknowledgements (...) FROM 'lms_policy_acknowledgements_data.csv' WITH CSV HEADER;

-- 17. Import Audit Events
-- COPY lms_audit_events (...) FROM 'lms_audit_events_data.csv' WITH CSV HEADER;

-- 18. Import Course Templates
-- COPY lms_course_templates (...) FROM 'lms_course_templates_data.csv' WITH CSV HEADER;

-- 19. Import Classroom Sessions
-- COPY lms_classroom_sessions (...) FROM 'lms_classroom_sessions_data.csv' WITH CSV HEADER;

-- ===============================================
-- METHOD 3: Direct database copy (Advanced)
-- ===============================================
-- Use postgres_fdw to directly copy between databases
-- This requires setting up foreign data wrapper

/*
-- On NEW unified project:
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create server connection to old LMS project
CREATE SERVER old_lms_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'db.xxxxx.supabase.co', port '5432', dbname 'postgres');

-- Create user mapping
CREATE USER MAPPING FOR postgres
  SERVER old_lms_server
  OPTIONS (user 'postgres', password 'your_old_db_password');

-- Import foreign schema
IMPORT FOREIGN SCHEMA public
  LIMIT TO (orgs, org_members, courses, course_versions, modules, lessons,
            lesson_blocks, quizzes, questions, question_options, completions,
            attempts, attempt_answers, assignments, org_policies,
            policy_acknowledgements, audit_events, course_templates,
            classroom_sessions)
  FROM SERVER old_lms_server
  INTO public;

-- Now copy data with new table names
INSERT INTO lms_orgs SELECT * FROM orgs;
INSERT INTO lms_org_members SELECT * FROM org_members;
INSERT INTO lms_courses SELECT * FROM courses;
INSERT INTO lms_course_versions SELECT * FROM course_versions;
INSERT INTO lms_modules SELECT * FROM modules;
INSERT INTO lms_lessons SELECT * FROM lessons;
INSERT INTO lms_lesson_blocks SELECT * FROM lesson_blocks;
INSERT INTO lms_quizzes SELECT * FROM quizzes;
INSERT INTO lms_questions SELECT * FROM questions;
INSERT INTO lms_question_options SELECT * FROM question_options;
INSERT INTO lms_completions SELECT * FROM completions;
INSERT INTO lms_attempts SELECT * FROM attempts;
INSERT INTO lms_attempt_answers SELECT * FROM attempt_answers;
INSERT INTO lms_assignments SELECT * FROM assignments;
INSERT INTO lms_org_policies SELECT * FROM org_policies;
INSERT INTO lms_policy_acknowledgements SELECT * FROM policy_acknowledgements;
INSERT INTO lms_audit_events SELECT * FROM audit_events;
INSERT INTO lms_course_templates SELECT * FROM course_templates;
INSERT INTO lms_classroom_sessions SELECT * FROM classroom_sessions;

-- Clean up
DROP SERVER old_lms_server CASCADE;
*/

-- ===============================================
-- STEP 3: VERIFY DATA IMPORT
-- ===============================================

SELECT 'lms_orgs' as table_name, COUNT(*) as row_count FROM lms_orgs
UNION ALL
SELECT 'lms_org_members', COUNT(*) FROM lms_org_members
UNION ALL
SELECT 'lms_courses', COUNT(*) FROM lms_courses
UNION ALL
SELECT 'lms_course_versions', COUNT(*) FROM lms_course_versions
UNION ALL
SELECT 'lms_modules', COUNT(*) FROM lms_modules
UNION ALL
SELECT 'lms_lessons', COUNT(*) FROM lms_lessons
UNION ALL
SELECT 'lms_lesson_blocks', COUNT(*) FROM lms_lesson_blocks
UNION ALL
SELECT 'lms_quizzes', COUNT(*) FROM lms_quizzes
UNION ALL
SELECT 'lms_questions', COUNT(*) FROM lms_questions
UNION ALL
SELECT 'lms_question_options', COUNT(*) FROM lms_question_options
UNION ALL
SELECT 'lms_completions', COUNT(*) FROM lms_completions
UNION ALL
SELECT 'lms_attempts', COUNT(*) FROM lms_attempts
UNION ALL
SELECT 'lms_attempt_answers', COUNT(*) FROM lms_attempt_answers
UNION ALL
SELECT 'lms_assignments', COUNT(*) FROM lms_assignments
UNION ALL
SELECT 'lms_org_policies', COUNT(*) FROM lms_org_policies
UNION ALL
SELECT 'lms_policy_acknowledgements', COUNT(*) FROM lms_policy_acknowledgements
UNION ALL
SELECT 'lms_audit_events', COUNT(*) FROM lms_audit_events
UNION ALL
SELECT 'lms_course_templates', COUNT(*) FROM lms_course_templates
UNION ALL
SELECT 'lms_classroom_sessions', COUNT(*) FROM lms_classroom_sessions
ORDER BY table_name;

-- Compare these counts with your export counts to verify completeness!

-- ===============================================
-- STEP 4: VERIFY FOREIGN KEY RELATIONSHIPS
-- ===============================================

-- Check for orphaned records (data integrity check)
SELECT 'Orphaned org members' as check_name,
       COUNT(*) as count
FROM lms_org_members om
WHERE NOT EXISTS (SELECT 1 FROM lms_orgs o WHERE o.id = om.org_id)
   OR NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = om.user_id)

UNION ALL

SELECT 'Orphaned courses',
       COUNT(*)
FROM lms_courses c
WHERE NOT EXISTS (SELECT 1 FROM lms_orgs o WHERE o.id = c.org_id)

UNION ALL

SELECT 'Orphaned course versions',
       COUNT(*)
FROM lms_course_versions cv
WHERE NOT EXISTS (SELECT 1 FROM lms_courses c WHERE c.id = cv.course_id)

UNION ALL

SELECT 'Orphaned modules',
       COUNT(*)
FROM lms_modules m
WHERE NOT EXISTS (SELECT 1 FROM lms_course_versions cv WHERE cv.id = m.course_version_id);

-- If any counts > 0, you have data integrity issues to resolve!

-- ===============================================
-- STEP 5: UPDATE SEQUENCES (if using SERIAL)
-- ===============================================
-- Not needed for UUID primary keys, but included for reference

-- If you had any SERIAL/SEQUENCE columns, update like this:
/*
SELECT setval('lms_orgs_id_seq', (SELECT MAX(id) FROM lms_orgs));
*/

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
DECLARE
  total_rows INTEGER;
BEGIN
  SELECT SUM(cnt) INTO total_rows FROM (
    SELECT COUNT(*) as cnt FROM lms_orgs
    UNION ALL SELECT COUNT(*) FROM lms_org_members
    UNION ALL SELECT COUNT(*) FROM lms_courses
    UNION ALL SELECT COUNT(*) FROM lms_course_versions
    UNION ALL SELECT COUNT(*) FROM lms_modules
    UNION ALL SELECT COUNT(*) FROM lms_lessons
    UNION ALL SELECT COUNT(*) FROM lms_lesson_blocks
    UNION ALL SELECT COUNT(*) FROM lms_quizzes
    UNION ALL SELECT COUNT(*) FROM lms_questions
    UNION ALL SELECT COUNT(*) FROM lms_question_options
    UNION ALL SELECT COUNT(*) FROM lms_completions
    UNION ALL SELECT COUNT(*) FROM lms_attempts
    UNION ALL SELECT COUNT(*) FROM lms_attempt_answers
    UNION ALL SELECT COUNT(*) FROM lms_assignments
    UNION ALL SELECT COUNT(*) FROM lms_org_policies
    UNION ALL SELECT COUNT(*) FROM lms_policy_acknowledgements
    UNION ALL SELECT COUNT(*) FROM lms_audit_events
    UNION ALL SELECT COUNT(*) FROM lms_course_templates
    UNION ALL SELECT COUNT(*) FROM lms_classroom_sessions
  ) counts;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LMS DATA IMPORT COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total rows imported: %', total_rows;
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '1. Verify row counts match export';
  RAISE NOTICE '2. Run data integrity checks';
  RAISE NOTICE '3. Test application with new database';
  RAISE NOTICE '4. Update app connection strings';
  RAISE NOTICE '========================================';
END $$;
