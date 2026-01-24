-- ===============================================
-- EXPORT LMS DATA FROM OLD PROJECT
-- ===============================================
-- This script exports data from your current LMS Supabase project
-- Run this in your OLD LMS Supabase SQL Editor
--
-- STEPS:
-- 1. Open your OLD LMS Supabase project SQL Editor
-- 2. Run each section below one at a time
-- 3. Copy the results and save to .sql files
-- 4. Run the import script on your NEW unified project
-- ===============================================

-- IMPORTANT: Set this to true to export data, false to just see counts
\set EXPORT_MODE true

-- ===============================================
-- OPTION 1: EXPORT VIA SUPABASE SQL EDITOR
-- ===============================================
-- Copy each query result and save to separate files

-- 1. Export Organizations
\echo 'Exporting organizations...'
COPY (
  SELECT id, name, sector, risk_profile_json, created_by, created_at
  FROM orgs
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_orgs_data.csv

-- 2. Export Org Members
\echo 'Exporting org members...'
COPY (
  SELECT org_id, user_id, role, status, created_at
  FROM org_members
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_org_members_data.csv

-- 3. Export Courses
\echo 'Exporting courses...'
COPY (
  SELECT id, org_id, title, description, category,
         array_to_string(tags, '|') as tags,
         status, created_by, created_at
  FROM courses
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_courses_data.csv

-- 4. Export Course Versions
\echo 'Exporting course versions...'
COPY (
  SELECT id, course_id, version, status, change_log, created_by, created_at
  FROM course_versions
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_course_versions_data.csv

-- 5. Export Modules
\echo 'Exporting modules...'
COPY (
  SELECT id, course_version_id, title, sort_order, created_at
  FROM modules
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_modules_data.csv

-- 6. Export Lessons
\echo 'Exporting lessons...'
COPY (
  SELECT id, module_id, title, lesson_type, sort_order, estimated_minutes, created_at
  FROM lessons
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_lessons_data.csv

-- 7. Export Lesson Blocks
\echo 'Exporting lesson blocks...'
COPY (
  SELECT id, lesson_id, block_type, content::text, sort_order, created_at
  FROM lesson_blocks
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_lesson_blocks_data.csv

-- 8. Export Quizzes
\echo 'Exporting quizzes...'
COPY (
  SELECT id, course_version_id, pass_mark, attempts_allowed, randomize, created_at
  FROM quizzes
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_quizzes_data.csv

-- 9. Export Questions
\echo 'Exporting questions...'
COPY (
  SELECT id, quiz_id, prompt, type, rationale, sort_order, created_at
  FROM questions
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_questions_data.csv

-- 10. Export Question Options
\echo 'Exporting question options...'
COPY (
  SELECT id, question_id, text, is_correct, sort_order, created_at
  FROM question_options
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_question_options_data.csv

-- 11. Export Completions
\echo 'Exporting completions...'
COPY (
  SELECT id, org_id, user_id, course_version_id, completed_at, score, passed, created_at
  FROM completions
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_completions_data.csv

-- 12. Export Attempts
\echo 'Exporting attempts...'
COPY (
  SELECT id, org_id, quiz_id, user_id, started_at, submitted_at, score, passed, created_at
  FROM attempts
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_attempts_data.csv

-- 13. Export Attempt Answers
\echo 'Exporting attempt answers...'
COPY (
  SELECT id, attempt_id, question_id, answer_json::text, is_correct, created_at
  FROM attempt_answers
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_attempt_answers_data.csv

-- 14. Export Assignments
\echo 'Exporting assignments...'
COPY (
  SELECT id, org_id, scope, scope_id, course_version_id, due_at, recurrence_days, required, created_at
  FROM assignments
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_assignments_data.csv

-- 15. Export Org Policies
\echo 'Exporting org policies...'
COPY (
  SELECT id, org_id, template_id, customised_blocks_json::text, status, published_at, created_at
  FROM org_policies
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_org_policies_data.csv

-- 16. Export Policy Acknowledgements
\echo 'Exporting policy acknowledgements...'
COPY (
  SELECT id, org_id, org_policy_id, user_id, acknowledged_at, created_at
  FROM policy_acknowledgements
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_policy_acknowledgements_data.csv

-- 17. Export Audit Events
\echo 'Exporting audit events...'
COPY (
  SELECT id, org_id, actor_user_id, event_type, entity_type, entity_id, metadata_json::text, created_at
  FROM audit_events
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_audit_events_data.csv

-- 18. Export Course Templates (if exists)
\echo 'Exporting course templates...'
COPY (
  SELECT id, org_id, name, description, category,
         array_to_string(tags, '|') as tags,
         is_global, thumbnail_url, structure::text,
         created_by, created_at, updated_at
  FROM course_templates
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_course_templates_data.csv

-- 19. Export Classroom Sessions (if exists)
\echo 'Exporting classroom sessions...'
COPY (
  SELECT id, org_id, instructor_id, student_id, start_time, end_time,
         status, room_url, notes, created_at, updated_at
  FROM classroom_sessions
) TO STDOUT WITH CSV HEADER;
-- Save output as: lms_classroom_sessions_data.csv

-- ===============================================
-- OPTION 2: USE pg_dump (RECOMMENDED)
-- ===============================================
-- Run these commands from your terminal/command line
-- Replace [HOST], [PASSWORD] with your old LMS Supabase credentials

/*
# Export all data using pg_dump

# Set your old LMS Supabase credentials
export OLD_DB_HOST="db.xxxxxxxxxxxxx.supabase.co"
export OLD_DB_PASSWORD="your_password"

# Export organizations
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.orgs" \
  --data-only --column-inserts \
  -f lms_orgs_data.sql

# Export org members
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.org_members" \
  --data-only --column-inserts \
  -f lms_org_members_data.sql

# Export courses
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.courses" \
  --data-only --column-inserts \
  -f lms_courses_data.sql

# Export course versions
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.course_versions" \
  --data-only --column-inserts \
  -f lms_course_versions_data.sql

# Export modules
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.modules" \
  --data-only --column-inserts \
  -f lms_modules_data.sql

# Export lessons
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.lessons" \
  --data-only --column-inserts \
  -f lms_lessons_data.sql

# Export lesson blocks
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  -t "public.lesson_blocks" \
  --data-only --column-inserts \
  -f lms_lesson_blocks_data.sql

# Export all remaining tables...
# (Repeat for each table)

# Or export ALL tables at once:
pg_dump -h $OLD_DB_HOST -U postgres -d postgres \
  --data-only --column-inserts \
  --exclude-table=auth.* \
  --exclude-table=storage.* \
  -f lms_all_data.sql
*/

-- ===============================================
-- DATA COUNT VERIFICATION
-- ===============================================
-- Run this to verify how much data will be migrated

SELECT 'orgs' as table_name, COUNT(*) as row_count FROM orgs
UNION ALL
SELECT 'org_members', COUNT(*) FROM org_members
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'course_versions', COUNT(*) FROM course_versions
UNION ALL
SELECT 'modules', COUNT(*) FROM modules
UNION ALL
SELECT 'lessons', COUNT(*) FROM lessons
UNION ALL
SELECT 'lesson_blocks', COUNT(*) FROM lesson_blocks
UNION ALL
SELECT 'quizzes', COUNT(*) FROM quizzes
UNION ALL
SELECT 'questions', COUNT(*) FROM questions
UNION ALL
SELECT 'question_options', COUNT(*) FROM question_options
UNION ALL
SELECT 'completions', COUNT(*) FROM completions
UNION ALL
SELECT 'attempts', COUNT(*) FROM attempts
UNION ALL
SELECT 'attempt_answers', COUNT(*) FROM attempt_answers
UNION ALL
SELECT 'assignments', COUNT(*) FROM assignments
UNION ALL
SELECT 'org_policies', COUNT(*) FROM org_policies
UNION ALL
SELECT 'policy_acknowledgements', COUNT(*) FROM policy_acknowledgements
UNION ALL
SELECT 'audit_events', COUNT(*) FROM audit_events
UNION ALL
SELECT 'course_templates', COUNT(*) FROM course_templates
UNION ALL
SELECT 'classroom_sessions', COUNT(*) FROM classroom_sessions
ORDER BY table_name;

-- ===============================================
-- USER EXPORT (For auth migration)
-- ===============================================
-- Export user list to merge into unified auth

SELECT
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
ORDER BY created_at;
-- Save this list - you'll need to ensure these users exist in unified project
