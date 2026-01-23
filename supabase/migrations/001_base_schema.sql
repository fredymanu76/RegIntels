-- ============================================================================
-- REGINTELS BASE SCHEMA - Core Tables
-- ============================================================================
-- This migration creates all the core tables needed for the RegIntels application
-- Run this BEFORE the strategic views migrations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. REGULATORY CHANGES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regulatory_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  regulator TEXT NOT NULL,
  materiality TEXT CHECK (materiality IN ('low', 'medium', 'high')) DEFAULT 'medium',
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  effective_date DATE,
  status TEXT CHECK (status IN ('pending', 'active', 'archived')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_changes_status ON public.regulatory_changes(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_changes_materiality ON public.regulatory_changes(materiality);
CREATE INDEX IF NOT EXISTS idx_regulatory_changes_published_at ON public.regulatory_changes(published_at DESC);

-- Enable RLS
ALTER TABLE public.regulatory_changes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. CONTROLS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id TEXT NOT NULL UNIQUE,
  control_title TEXT NOT NULL,
  control_owner TEXT,
  control_description TEXT,
  last_reviewed_at TIMESTAMP WITH TIME ZONE,
  next_review_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_controls_control_id ON public.controls(control_id);
CREATE INDEX IF NOT EXISTS idx_controls_status ON public.controls(status);
CREATE INDEX IF NOT EXISTS idx_controls_next_review_date ON public.controls(next_review_date);

-- Enable RLS
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. REGULATORY_CHANGE_CONTROL_MAP TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.regulatory_change_control_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulatory_change_id UUID NOT NULL REFERENCES public.regulatory_changes(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regulatory_change_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_rccm_reg_change ON public.regulatory_change_control_map(regulatory_change_id);
CREATE INDEX IF NOT EXISTS idx_rccm_control ON public.regulatory_change_control_map(control_id);

-- Enable RLS
ALTER TABLE public.regulatory_change_control_map ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 4. ATTESTATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  change_id UUID REFERENCES public.regulatory_changes(id) ON DELETE CASCADE,
  attestor_id UUID,
  attestor_role TEXT CHECK (attestor_role IN ('SMF', 'Control Owner', 'Owner', 'Deputy', 'Delegate', 'Other')) DEFAULT 'Other',
  status TEXT CHECK (status IN ('pending', 'approved', 'failed', 'rejected')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attestations_control ON public.attestations(control_id);
CREATE INDEX IF NOT EXISTS idx_attestations_change ON public.attestations(change_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON public.attestations(status);
CREATE INDEX IF NOT EXISTS idx_attestations_due_date ON public.attestations(due_date);

-- Enable RLS
ALTER TABLE public.attestations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. EXCEPTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'closed', 'expired')) DEFAULT 'open',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_exceptions_control ON public.exceptions(control_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_status ON public.exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_created_at ON public.exceptions(created_at DESC);

-- Enable RLS
ALTER TABLE public.exceptions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 6. CHANGE_SIGNOFFS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.change_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID NOT NULL REFERENCES public.regulatory_changes(id) ON DELETE CASCADE,
  signoff_by UUID,
  signoff_role TEXT,
  signoff_status TEXT CHECK (signoff_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_signoffs_change ON public.change_signoffs(change_id);
CREATE INDEX IF NOT EXISTS idx_change_signoffs_status ON public.change_signoffs(signoff_status);

-- Enable RLS
ALTER TABLE public.change_signoffs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. ACTIONS TABLE (for tracking regulatory change actions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID NOT NULL REFERENCES public.regulatory_changes(id) ON DELETE CASCADE,
  control_id UUID REFERENCES public.controls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_change ON public.actions(change_id);
CREATE INDEX IF NOT EXISTS idx_actions_control ON public.actions(control_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON public.actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_due_date ON public.actions(due_date);

-- Enable RLS
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. CREATE v_change_action_tracker VIEW (needed by impact scoring view)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_change_action_tracker AS
SELECT
  a.id as action_id,
  a.change_id,
  a.control_id,
  a.title as action_title,
  a.assigned_to,
  a.status,
  a.due_date,
  a.completed_at,
  CASE
    WHEN a.status = 'completed' THEN 'completed'
    WHEN a.due_date < CURRENT_DATE AND a.status NOT IN ('completed', 'cancelled') THEN 'overdue'
    WHEN a.status = 'in_progress' THEN 'in_progress'
    ELSE 'pending'
  END as computed_status,
  CASE
    WHEN a.due_date < CURRENT_DATE AND a.status NOT IN ('completed', 'cancelled')
    THEN CURRENT_DATE - a.due_date
    ELSE 0
  END as days_overdue
FROM public.actions a;

COMMENT ON VIEW public.v_change_action_tracker IS
'Action tracker view for monitoring regulatory change action status';

-- ----------------------------------------------------------------------------
-- 9. BASIC RLS POLICIES (Allow authenticated users to read)
-- ----------------------------------------------------------------------------
-- These are basic policies - you should customize based on your security requirements

-- Regulatory Changes
DROP POLICY IF EXISTS "Allow authenticated read regulatory_changes" ON public.regulatory_changes;
CREATE POLICY "Allow authenticated read regulatory_changes"
  ON public.regulatory_changes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Controls
DROP POLICY IF EXISTS "Allow authenticated read controls" ON public.controls;
CREATE POLICY "Allow authenticated read controls"
  ON public.controls FOR SELECT
  USING (auth.role() = 'authenticated');

-- Regulatory Change Control Map
DROP POLICY IF EXISTS "Allow authenticated read rccm" ON public.regulatory_change_control_map;
CREATE POLICY "Allow authenticated read rccm"
  ON public.regulatory_change_control_map FOR SELECT
  USING (auth.role() = 'authenticated');

-- Attestations
DROP POLICY IF EXISTS "Allow authenticated read attestations" ON public.attestations;
CREATE POLICY "Allow authenticated read attestations"
  ON public.attestations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Exceptions
DROP POLICY IF EXISTS "Allow authenticated read exceptions" ON public.exceptions;
CREATE POLICY "Allow authenticated read exceptions"
  ON public.exceptions FOR SELECT
  USING (auth.role() = 'authenticated');

-- Change Signoffs
DROP POLICY IF EXISTS "Allow authenticated read change_signoffs" ON public.change_signoffs;
CREATE POLICY "Allow authenticated read change_signoffs"
  ON public.change_signoffs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Actions
DROP POLICY IF EXISTS "Allow authenticated read actions" ON public.actions;
CREATE POLICY "Allow authenticated read actions"
  ON public.actions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 10. INSERT SAMPLE DATA (OPTIONAL - for testing)
-- ----------------------------------------------------------------------------
-- Uncomment this section to insert sample data for testing the views

/*
-- Sample Controls
INSERT INTO public.controls (control_id, control_title, control_owner, last_reviewed_at, next_review_date)
VALUES
  ('CTRL-001', 'Customer Due Diligence', 'AML Officer', NOW() - INTERVAL '120 days', CURRENT_DATE + INTERVAL '30 days'),
  ('CTRL-002', 'Transaction Monitoring', 'Compliance Manager', NOW() - INTERVAL '45 days', CURRENT_DATE + INTERVAL '60 days'),
  ('CTRL-003', 'Sanctions Screening', 'Risk Officer', NOW() - INTERVAL '15 days', CURRENT_DATE + INTERVAL '90 days')
ON CONFLICT (control_id) DO NOTHING;

-- Sample Regulatory Changes
INSERT INTO public.regulatory_changes (title, regulator, materiality, published_at, status)
VALUES
  ('Enhanced Customer Due Diligence Requirements', 'FCA', 'high', NOW() - INTERVAL '30 days', 'pending'),
  ('Updated Transaction Monitoring Thresholds', 'FCA', 'medium', NOW() - INTERVAL '15 days', 'pending'),
  ('Sanctions Screening Update', 'OFAC', 'high', NOW() - INTERVAL '7 days', 'pending')
ON CONFLICT DO NOTHING;

-- Link changes to controls
INSERT INTO public.regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
SELECT rc.id, c.id, 'high'
FROM public.regulatory_changes rc, public.controls c
WHERE rc.title = 'Enhanced Customer Due Diligence Requirements'
  AND c.control_id = 'CTRL-001'
ON CONFLICT DO NOTHING;

-- Sample Attestations
INSERT INTO public.attestations (control_id, attestor_role, status, due_date)
SELECT id, 'Control Owner', 'pending', CURRENT_DATE + INTERVAL '7 days'
FROM public.controls
WHERE control_id = 'CTRL-001'
ON CONFLICT DO NOTHING;

-- Sample Exceptions
INSERT INTO public.exceptions (control_id, title, description, status, severity)
SELECT id, 'Manual review required', 'Temporary exception for manual review process', 'open', 'medium'
FROM public.controls
WHERE control_id = 'CTRL-002'
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- END OF BASE SCHEMA MIGRATION
-- ============================================================================
-- Next steps:
-- 1. Run this migration first
-- 2. Then run the strategic views migrations:
--    - 20260118_impact_scoring_views.sql
--    - 20260118_control_drift_views.sql
--    - 20260118_attestation_confidence_views.sql
-- ============================================================================
