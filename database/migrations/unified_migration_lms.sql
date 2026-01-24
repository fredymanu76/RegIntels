-- ===============================================
-- LMS TO UNIFIED PLATFORM MIGRATION SCRIPT
-- ===============================================
-- This script migrates the existing LMS database to a unified platform
-- with 'lms_' prefix for all tables to support multi-app architecture
--
-- IMPORTANT: Run this script on your NEW unified Supabase project
-- after exporting data from your current LMS Supabase project
--
-- Migration Steps:
-- 1. Export data from old LMS project (see companion export script)
-- 2. Create new unified Supabase project
-- 3. Run this script to create lms_ prefixed tables
-- 4. Import data (see companion import script)
-- 5. Update application code to reference new table names
-- ===============================================

-- ===============================================
-- STEP 1: CREATE LMS TABLES WITH PREFIX
-- ===============================================

-- 1. LMS Profiles table (references unified auth.users)
CREATE TABLE lms_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create lms_profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_lms_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lms_profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_lms
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_lms_user();

-- Backfill existing users
INSERT INTO lms_profiles (user_id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. LMS Organizations
CREATE TABLE lms_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  risk_profile_json JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LMS Organization members
CREATE TABLE lms_org_members (
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'learner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- 4. LMS Courses
CREATE TABLE lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LMS Course versions
CREATE TABLE lms_course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES lms_courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  change_log TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LMS Modules
CREATE TABLE lms_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES lms_course_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LMS Lessons
CREATE TABLE lms_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES lms_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LMS Lesson blocks
CREATE TABLE lms_lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lms_lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LMS Quizzes
CREATE TABLE lms_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES lms_course_versions(id) ON DELETE CASCADE,
  pass_mark INTEGER DEFAULT 70,
  attempts_allowed INTEGER DEFAULT 3,
  randomize BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LMS Questions
CREATE TABLE lms_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  rationale TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. LMS Question options
CREATE TABLE lms_question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES lms_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. LMS Completions
CREATE TABLE lms_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_version_id UUID REFERENCES lms_course_versions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LMS Attempts
CREATE TABLE lms_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES lms_quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. LMS Attempt answers
CREATE TABLE lms_attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES lms_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES lms_questions(id) ON DELETE CASCADE,
  answer_json JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. LMS Assignments
CREATE TABLE lms_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  course_version_id UUID REFERENCES lms_course_versions(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ,
  recurrence_days INTEGER,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. LMS Org policies
CREATE TABLE lms_org_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  customised_blocks_json JSONB,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. LMS Policy acknowledgements
CREATE TABLE lms_policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  org_policy_id UUID REFERENCES lms_org_policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. LMS Audit events
CREATE TABLE lms_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. LMS Course Templates
CREATE TABLE lms_course_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES lms_orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  is_global BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  structure JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT global_templates_no_org CHECK (
    (is_global = true AND org_id IS NULL) OR
    (is_global = false AND org_id IS NOT NULL)
  )
);

-- 20. LMS Classroom Sessions
CREATE TABLE lms_classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES lms_orgs(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  room_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===============================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_lms_org_members_user_id ON lms_org_members(user_id);
CREATE INDEX idx_lms_org_members_org_id ON lms_org_members(org_id);
CREATE INDEX idx_lms_completions_user_id ON lms_completions(user_id);
CREATE INDEX idx_lms_completions_org_id ON lms_completions(org_id);
CREATE INDEX idx_lms_assignments_scope_id ON lms_assignments(scope_id);
CREATE INDEX idx_lms_assignments_org_id ON lms_assignments(org_id);
CREATE INDEX idx_lms_courses_org_id ON lms_courses(org_id);
CREATE INDEX idx_lms_course_versions_course_id ON lms_course_versions(course_id);
CREATE INDEX idx_lms_modules_course_version_id ON lms_modules(course_version_id);
CREATE INDEX idx_lms_lessons_module_id ON lms_lessons(module_id);
CREATE INDEX idx_lms_lesson_blocks_lesson_id ON lms_lesson_blocks(lesson_id);
CREATE INDEX idx_lms_questions_quiz_id ON lms_questions(quiz_id);
CREATE INDEX idx_lms_question_options_question_id ON lms_question_options(question_id);
CREATE INDEX idx_lms_attempts_user_id ON lms_attempts(user_id);
CREATE INDEX idx_lms_attempts_org_id ON lms_attempts(org_id);
CREATE INDEX idx_lms_course_templates_org_id ON lms_course_templates(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_lms_course_templates_global ON lms_course_templates(is_global) WHERE is_global = true;
CREATE INDEX idx_lms_course_templates_category ON lms_course_templates(category);
CREATE INDEX idx_lms_course_templates_created_at ON lms_course_templates(created_at DESC);
CREATE INDEX idx_lms_classroom_sessions_org_id ON lms_classroom_sessions(org_id);
CREATE INDEX idx_lms_classroom_sessions_instructor_id ON lms_classroom_sessions(instructor_id);
CREATE INDEX idx_lms_classroom_sessions_student_id ON lms_classroom_sessions(student_id);
CREATE INDEX idx_lms_classroom_sessions_start_time ON lms_classroom_sessions(start_time);
CREATE INDEX idx_lms_classroom_sessions_status ON lms_classroom_sessions(status);

-- ===============================================
-- STEP 3: CREATE TRIGGERS
-- ===============================================

-- Course templates updated_at trigger
CREATE OR REPLACE FUNCTION update_lms_course_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lms_course_templates_updated_at
  BEFORE UPDATE ON lms_course_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_lms_course_templates_updated_at();

-- Classroom sessions updated_at trigger
CREATE OR REPLACE FUNCTION update_lms_classroom_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lms_classroom_sessions_updated_at
  BEFORE UPDATE ON lms_classroom_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_lms_classroom_sessions_updated_at();

-- ===============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE lms_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_course_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_org_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_policy_acknowledgements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_course_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lms_classroom_sessions ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- STEP 5: CREATE RLS POLICIES
-- ===============================================

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON lms_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON lms_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Orgs: Members can view their orgs
CREATE POLICY "Members can view their orgs" ON lms_orgs
  FOR SELECT USING (
    id IN (SELECT org_id FROM lms_org_members WHERE user_id = auth.uid())
  );

-- Org Members: Users can view members of their orgs
CREATE POLICY "Users can view org members" ON lms_org_members
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM lms_org_members WHERE user_id = auth.uid())
  );

-- Courses: Members can view org courses
CREATE POLICY "Members can view org courses" ON lms_courses
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM lms_org_members WHERE user_id = auth.uid())
  );

-- Course Templates: Users can view global and org templates
CREATE POLICY "Users can view global templates" ON lms_course_templates
  FOR SELECT USING (is_global = true);

CREATE POLICY "Users can view org templates" ON lms_course_templates
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM lms_org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can create org templates" ON lms_course_templates
  FOR INSERT WITH CHECK (
    org_id IN (
      SELECT org_id FROM lms_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can update org templates" ON lms_course_templates
  FOR UPDATE USING (
    org_id IN (
      SELECT org_id FROM lms_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete org templates" ON lms_course_templates
  FOR DELETE USING (
    org_id IN (
      SELECT org_id FROM lms_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Classroom Sessions: Users can view sessions they're part of
CREATE POLICY "Users can view their own sessions" ON lms_classroom_sessions
  FOR SELECT USING (
    auth.uid() = instructor_id OR auth.uid() = student_id
  );

CREATE POLICY "Users can create sessions" ON lms_classroom_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = student_id OR auth.uid() = instructor_id
  );

CREATE POLICY "Users can delete their own sessions" ON lms_classroom_sessions
  FOR DELETE USING (
    auth.uid() = instructor_id OR auth.uid() = student_id
  );

CREATE POLICY "Users can update their own sessions" ON lms_classroom_sessions
  FOR UPDATE USING (
    auth.uid() = instructor_id OR auth.uid() = student_id
  );

-- Additional policies for other tables (completions, attempts, etc.)
CREATE POLICY "Users can view own completions" ON lms_completions
  FOR SELECT USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM lms_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

CREATE POLICY "Users can view own attempts" ON lms_attempts
  FOR SELECT USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT org_id FROM lms_org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
    )
  );

-- ===============================================
-- STEP 6: ADD TABLE COMMENTS
-- ===============================================

COMMENT ON TABLE lms_profiles IS 'LMS user profiles - links to unified auth.users';
COMMENT ON TABLE lms_orgs IS 'LMS organizations/workspaces';
COMMENT ON TABLE lms_courses IS 'LMS training courses';
COMMENT ON TABLE lms_course_templates IS 'Reusable course templates for quick course creation';
COMMENT ON TABLE lms_classroom_sessions IS 'Virtual classroom session bookings';

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LMS MIGRATION SCHEMA CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Created 20 tables with lms_ prefix:';
  RAISE NOTICE '  - lms_profiles';
  RAISE NOTICE '  - lms_orgs';
  RAISE NOTICE '  - lms_org_members';
  RAISE NOTICE '  - lms_courses';
  RAISE NOTICE '  - lms_course_versions';
  RAISE NOTICE '  - lms_modules';
  RAISE NOTICE '  - lms_lessons';
  RAISE NOTICE '  - lms_lesson_blocks';
  RAISE NOTICE '  - lms_quizzes';
  RAISE NOTICE '  - lms_questions';
  RAISE NOTICE '  - lms_question_options';
  RAISE NOTICE '  - lms_completions';
  RAISE NOTICE '  - lms_attempts';
  RAISE NOTICE '  - lms_attempt_answers';
  RAISE NOTICE '  - lms_assignments';
  RAISE NOTICE '  - lms_org_policies';
  RAISE NOTICE '  - lms_policy_acknowledgements';
  RAISE NOTICE '  - lms_audit_events';
  RAISE NOTICE '  - lms_course_templates';
  RAISE NOTICE '  - lms_classroom_sessions';
  RAISE NOTICE '';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ All triggers configured';
  RAISE NOTICE '✅ RLS policies enabled';
  RAISE NOTICE '';
  RAISE NOTICE '📝 NEXT STEPS:';
  RAISE NOTICE '1. Run data export from old LMS project';
  RAISE NOTICE '2. Run data import script';
  RAISE NOTICE '3. Update application code table references';
  RAISE NOTICE '========================================';
END $$;
