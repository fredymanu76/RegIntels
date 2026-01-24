-- ============================================================================
-- REGINTELS COMPLETE MIGRATION - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- This file consolidates all migrations in the correct order:
-- 1. Base Schema (tables)
-- 2. Impact Scoring Views
-- 3. Control Drift Views
-- 4. Attestation Confidence Views
-- 5. Sample Test Data
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Click "New Query"
-- 4. Paste this entire content
-- 5. Click "RUN" button
-- ============================================================================

-- ============================================================================
-- PART 1: BASE SCHEMA - Core Tables
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

ALTER TABLE public.change_signoffs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. ACTIONS TABLE
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

ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. v_change_action_tracker VIEW
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

COMMENT ON VIEW public.v_change_action_tracker IS 'Action tracker for monitoring regulatory change action status';

-- ----------------------------------------------------------------------------
-- 9. RLS POLICIES
-- ----------------------------------------------------------------------------

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

-- ============================================================================
-- PART 2: IMPACT SCORING VIEWS
-- ============================================================================

create or replace view v_regulatory_impact_score as
select
  c.id as change_id,
  c.title as change_title,
  c.materiality,
  c.regulator,
  c.published_at,

  -- 1. Regulatory Severity Score (30% weight)
  case
    when c.materiality = 'high' then 30
    when c.materiality = 'medium' then 20
    else 10
  end as severity_score,

  -- 2. Business Surface Area Score (20% weight)
  least(count(distinct rccm.control_id) * 5, 20) as surface_area_score,

  -- 3. Control Coverage Gap Score (25% weight)
  case
    when count(cs.id) = 0 then 25
    else 0
  end as control_gap_score,

  -- 4. Execution Risk Score (15% weight)
  least(
    sum(case when act.status = 'overdue' then 1 else 0 end) * 5,
    15
  ) as execution_risk_score,

  -- 5. Attestation Confidence Penalty (10% weight)
  case
    when att.status != 'approved' then 10
    when att.status is null then 10
    else 0
  end as attestation_penalty,

  -- TOTAL IMPACT SCORE (0-100)
  (
    case
      when c.materiality = 'high' then 30
      when c.materiality = 'medium' then 20
      else 10
    end
    + least(count(distinct rccm.control_id) * 5, 20)
    + case when count(cs.id) = 0 then 25 else 0 end
    + least(sum(case when act.status = 'overdue' then 1 else 0 end) * 5, 15)
    + case
        when att.status != 'approved' then 10
        when att.status is null then 10
        else 0
      end
  ) as total_impact_score,

  -- Risk Band Classification
  case
    when (
      case when c.materiality = 'high' then 30 when c.materiality = 'medium' then 20 else 10 end
      + least(count(distinct rccm.control_id) * 5, 20)
      + case when count(cs.id) = 0 then 25 else 0 end
      + least(sum(case when act.status = 'overdue' then 1 else 0 end) * 5, 15)
      + case when att.status != 'approved' or att.status is null then 10 else 0 end
    ) >= 61 then 'CRITICAL'
    when (
      case when c.materiality = 'high' then 30 when c.materiality = 'medium' then 20 else 10 end
      + least(count(distinct rccm.control_id) * 5, 20)
      + case when count(cs.id) = 0 then 25 else 0 end
      + least(sum(case when act.status = 'overdue' then 1 else 0 end) * 5, 15)
      + case when att.status != 'approved' or att.status is null then 10 else 0 end
    ) >= 31 then 'HIGH'
    else 'MODERATE'
  end as risk_band,

  -- Impact Drivers
  case
    when count(cs.id) = 0 then 'Missing control sign-offs'
    when sum(case when act.status = 'overdue' then 1 else 0 end) > 0 then 'Overdue actions'
    when att.status != 'approved' or att.status is null then 'Pending attestation'
    else 'Regulatory severity'
  end as primary_driver,

  -- Metadata
  count(distinct rccm.control_id) as affected_controls_count,
  count(cs.id) as signoffs_count,
  sum(case when act.status = 'overdue' then 1 else 0 end) as overdue_actions_count

from regulatory_changes c
left join regulatory_change_control_map rccm on rccm.regulatory_change_id = c.id
left join change_signoffs cs on cs.change_id = c.id
left join v_change_action_tracker act on act.change_id = c.id
left join attestations att on att.change_id = c.id
group by c.id, c.title, c.materiality, c.regulator, c.published_at, att.status;

comment on view v_regulatory_impact_score is
'RegIntels Impact Score: Quantified Regulatory Exposure Index (0-100).
Combines regulatory severity, business surface area, control gaps, execution risk, and attestation confidence.';

-- ============================================================================
-- PART 3: CONTROL DRIFT VIEWS
-- ============================================================================

create or replace view v_control_drift_index as
select
  c.id as control_id,
  c.control_id as control_code,
  c.control_title,
  c.control_owner,
  c.last_reviewed_at,
  c.next_review_date,

  -- Last regulatory change affecting this control
  max(rc.published_at) as last_reg_change_date,

  -- Time since last review
  now() - c.last_reviewed_at as review_delay_interval,
  extract(days from (now() - c.last_reviewed_at)) as review_delay_days,

  -- Time until next review
  c.next_review_date - now() as time_to_next_review,
  extract(days from (c.next_review_date - now())) as days_to_next_review,

  -- Count of pending changes affecting this control
  count(distinct case when rc.status = 'pending' then rc.id end) as pending_changes_count,

  -- Count of failed attestations
  count(distinct case when att.status = 'failed' then att.id end) as failed_attestations_count,

  -- Count of open exceptions
  count(distinct case when ex.status = 'open' then ex.id end) as open_exceptions_count,

  -- DRIFT STATUS CLASSIFICATION
  case
    when (now() - c.last_reviewed_at > interval '90 days')
      or (count(distinct case when att.status = 'failed' then att.id end) > 0
          and count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) > 0)
    then 'CRITICAL_DRIFT'

    when (now() - c.last_reviewed_at > interval '30 days')
      or count(distinct case when att.status = 'failed' then att.id end) > 1
    then 'MATERIAL_DRIFT'

    when (c.next_review_date - now() < interval '30 days')
      or count(distinct case when rc.status = 'pending' then rc.id end) > 0
    then 'EMERGING_DRIFT'

    else 'STABLE'
  end as drift_status,

  -- Drift Score (0-100)
  least(100,
    case
      when now() - c.last_reviewed_at > interval '90 days' then 50
      when now() - c.last_reviewed_at > interval '30 days' then 30
      else 10
    end
    + (count(distinct case when att.status = 'failed' then att.id end) * 15)
    + (count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) * 10)
    + (count(distinct case when ex.status = 'open' then ex.id end) * 5)
  ) as drift_score,

  -- Primary Drift Driver
  case
    when count(distinct case when att.status = 'failed' then att.id end) > 0
      then 'Failed attestations'
    when now() - c.last_reviewed_at > interval '90 days'
      then 'Overdue review (>90 days)'
    when count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) > 0
      then 'High-impact pending changes'
    when count(distinct case when ex.status = 'open' then ex.id end) > 0
      then 'Open exceptions'
    else 'Approaching review date'
  end as drift_driver,

  -- Urgency indicator
  case
    when (now() - c.last_reviewed_at > interval '90 days')
      or (count(distinct case when att.status = 'failed' then att.id end) > 0
          and count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) > 0)
    then 'URGENT'
    when (now() - c.last_reviewed_at > interval '30 days')
      or count(distinct case when att.status = 'failed' then att.id end) > 1
    then 'ATTENTION_NEEDED'
    else 'MONITOR'
  end as urgency_level

from controls c
left join regulatory_change_control_map rccm on rccm.control_id = c.id
left join regulatory_changes rc on rc.id = rccm.regulatory_change_id
left join attestations att on att.control_id = c.id
left join exceptions ex on ex.control_id = c.id
group by
  c.id,
  c.control_id,
  c.control_title,
  c.control_owner,
  c.last_reviewed_at,
  c.next_review_date;

comment on view v_control_drift_index is
'RegIntels Control Drift Model: Early-warning system detecting when controls fall behind regulatory change velocity.
Classifies drift as: Stable, Emerging, Material, or Critical.';

create or replace view v_control_drift_summary as
select
  drift_status,
  count(*) as control_count,
  avg(drift_score) as avg_drift_score,
  sum(pending_changes_count) as total_pending_changes,
  sum(failed_attestations_count) as total_failed_attestations,
  sum(open_exceptions_count) as total_open_exceptions
from v_control_drift_index
group by drift_status;

comment on view v_control_drift_summary is 'Summary of control drift across the organization';

-- ============================================================================
-- PART 4: ATTESTATION CONFIDENCE VIEWS
-- ============================================================================

create or replace view v_attestation_confidence_index as
select
  a.id as attestation_id,
  a.control_id,
  c.control_id as control_code,
  c.control_title,
  a.attestor_id,
  a.attestor_role,
  a.status,
  a.due_date,
  a.submitted_at,

  -- 1. TIMELINESS SCORE (40% weight)
  case
    when a.submitted_at is null and now() > a.due_date then 0
    when a.submitted_at is null then 30
    when a.submitted_at <= a.due_date then 40
    when a.submitted_at <= a.due_date + interval '7 days' then 25
    when a.submitted_at <= a.due_date + interval '14 days' then 15
    else 5
  end as timeliness_score,

  -- Days late/early
  case
    when a.submitted_at is not null
    then extract(days from (a.submitted_at - a.due_date))
    else extract(days from (now() - a.due_date))
  end as days_delta,

  -- 2. ROLE WEIGHT SCORE (30% weight)
  case
    when a.attestor_role = 'SMF' then 30
    when a.attestor_role = 'Control Owner' or a.attestor_role = 'Owner' then 20
    when a.attestor_role = 'Deputy' or a.attestor_role = 'Delegate' then 10
    else 5
  end as role_score,

  -- 3. HISTORICAL RELIABILITY SCORE (20% weight)
  least(
    (select count(*)
     from attestations prev
     where prev.attestor_id = a.attestor_id
       and prev.status = 'approved'
       and prev.id != a.id) * 2,
    20
  ) as reliability_score,

  -- 4. EXCEPTION PENALTY
  case
    when exists (
      select 1 from exceptions ex
      where ex.control_id = a.control_id
        and ex.status = 'open'
        and ex.created_at > now() - interval '90 days'
    ) then -15
    else 0
  end as exception_penalty,

  -- TOTAL CONFIDENCE SCORE (0-100)
  greatest(0,
    case
      when a.submitted_at is null and now() > a.due_date then 0
      when a.submitted_at is null then 30
      when a.submitted_at <= a.due_date then 40
      when a.submitted_at <= a.due_date + interval '7 days' then 25
      when a.submitted_at <= a.due_date + interval '14 days' then 15
      else 5
    end
    +
    case
      when a.attestor_role = 'SMF' then 30
      when a.attestor_role = 'Control Owner' or a.attestor_role = 'Owner' then 20
      when a.attestor_role = 'Deputy' or a.attestor_role = 'Delegate' then 10
      else 5
    end
    +
    least(
      (select count(*)
       from attestations prev
       where prev.attestor_id = a.attestor_id
         and prev.status = 'approved'
         and prev.id != a.id) * 2,
      20
    )
    +
    case
      when exists (
        select 1 from exceptions ex
        where ex.control_id = a.control_id
          and ex.status = 'open'
          and ex.created_at > now() - interval '90 days'
      ) then -15
      else 0
    end
  ) as confidence_score,

  -- CONFIDENCE BAND CLASSIFICATION
  case
    when greatest(0,
      case
        when a.submitted_at is null and now() > a.due_date then 0
        when a.submitted_at is null then 30
        when a.submitted_at <= a.due_date then 40
        when a.submitted_at <= a.due_date + interval '7 days' then 25
        when a.submitted_at <= a.due_date + interval '14 days' then 15
        else 5
      end
      + case
          when a.attestor_role = 'SMF' then 30
          when a.attestor_role = 'Control Owner' or a.attestor_role = 'Owner' then 20
          when a.attestor_role = 'Deputy' or a.attestor_role = 'Delegate' then 10
          else 5
        end
      + least((select count(*) from attestations prev
               where prev.attestor_id = a.attestor_id
                 and prev.status = 'approved'
                 and prev.id != a.id) * 2, 20)
      + case
          when exists (select 1 from exceptions ex
                       where ex.control_id = a.control_id
                         and ex.status = 'open'
                         and ex.created_at > now() - interval '90 days')
          then -15
          else 0
        end
    ) >= 70 then 'HIGH_CONFIDENCE'
    when greatest(0,
      case
        when a.submitted_at is null and now() > a.due_date then 0
        when a.submitted_at is null then 30
        when a.submitted_at <= a.due_date then 40
        when a.submitted_at <= a.due_date + interval '7 days' then 25
        when a.submitted_at <= a.due_date + interval '14 days' then 15
        else 5
      end
      + case
          when a.attestor_role = 'SMF' then 30
          when a.attestor_role = 'Control Owner' or a.attestor_role = 'Owner' then 20
          when a.attestor_role = 'Deputy' or a.attestor_role = 'Delegate' then 10
          else 5
        end
      + least((select count(*) from attestations prev
               where prev.attestor_id = a.attestor_id
                 and prev.status = 'approved'
                 and prev.id != a.id) * 2, 20)
      + case
          when exists (select 1 from exceptions ex
                       where ex.control_id = a.control_id
                         and ex.status = 'open'
                         and ex.created_at > now() - interval '90 days')
          then -15
          else 0
        end
    ) >= 40 then 'MEDIUM_CONFIDENCE'
    else 'LOW_CONFIDENCE'
  end as confidence_band,

  -- Primary Confidence Driver
  case
    when a.submitted_at is null and now() > a.due_date then 'Overdue attestation'
    when a.submitted_at is null then 'Pending attestation'
    when exists (
      select 1 from exceptions ex
      where ex.control_id = a.control_id
        and ex.status = 'open'
        and ex.created_at > now() - interval '90 days'
    ) then 'Recent exceptions'
    when a.attestor_role not in ('SMF', 'Control Owner', 'Owner') then 'Low role authority'
    when a.submitted_at > a.due_date + interval '7 days' then 'Late submission'
    else 'Strong attestation profile'
  end as confidence_driver,

  -- Attestor performance metrics
  (select count(*)
   from attestations prev
   where prev.attestor_id = a.attestor_id
     and prev.status = 'approved') as total_approved_count,

  (select count(*)
   from attestations prev
   where prev.attestor_id = a.attestor_id
     and prev.submitted_at > prev.due_date) as total_late_count,

  -- Control exception count
  (select count(*)
   from exceptions ex
   where ex.control_id = a.control_id
     and ex.status = 'open') as open_exceptions_count

from attestations a
join controls c on c.id = a.control_id;

comment on view v_attestation_confidence_index is
'RegIntels Attestation Confidence Index: Measures confidence in control attestations (0-100).
Based on timeliness, role weight, historical reliability, and exception penalties.';

create or replace view v_attestation_confidence_summary as
select
  confidence_band,
  count(*) as attestation_count,
  avg(confidence_score) as avg_confidence_score,
  sum(case when status = 'approved' then 1 else 0 end) as approved_count,
  sum(case when days_delta > 0 then 1 else 0 end) as late_count,
  sum(open_exceptions_count) as total_exceptions
from v_attestation_confidence_index
group by confidence_band;

comment on view v_attestation_confidence_summary is 'Summary of attestation confidence across the organization';

-- ============================================================================
-- PART 5: SAMPLE TEST DATA
-- ============================================================================

-- Sample Controls
INSERT INTO public.controls (control_id, control_title, control_owner, last_reviewed_at, next_review_date)
VALUES
  ('CTRL-001', 'Customer Due Diligence', 'AML Officer', NOW() - INTERVAL '120 days', CURRENT_DATE + INTERVAL '30 days'),
  ('CTRL-002', 'Transaction Monitoring', 'Compliance Manager', NOW() - INTERVAL '45 days', CURRENT_DATE + INTERVAL '60 days'),
  ('CTRL-003', 'Sanctions Screening', 'Risk Officer', NOW() - INTERVAL '15 days', CURRENT_DATE + INTERVAL '90 days'),
  ('CTRL-004', 'KYC Verification', 'Compliance Officer', NOW() - INTERVAL '95 days', CURRENT_DATE - INTERVAL '5 days'),
  ('CTRL-005', 'AML Risk Assessment', 'Head of Compliance', NOW() - INTERVAL '10 days', CURRENT_DATE + INTERVAL '120 days')
ON CONFLICT (control_id) DO NOTHING;

-- Sample Regulatory Changes
INSERT INTO public.regulatory_changes (title, regulator, materiality, published_at, status)
VALUES
  ('Enhanced Customer Due Diligence Requirements', 'FCA', 'high', NOW() - INTERVAL '30 days', 'pending'),
  ('Updated Transaction Monitoring Thresholds', 'FCA', 'medium', NOW() - INTERVAL '15 days', 'pending'),
  ('Sanctions Screening Update - Russia', 'OFAC', 'high', NOW() - INTERVAL '7 days', 'pending'),
  ('KYC Data Retention Policy Changes', 'FCA', 'medium', NOW() - INTERVAL '45 days', 'active'),
  ('AML Training Requirements 2026', 'FCA', 'low', NOW() - INTERVAL '60 days', 'active')
ON CONFLICT DO NOTHING;

-- Link changes to controls
INSERT INTO public.regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
SELECT rc.id, c.id, 'high'
FROM public.regulatory_changes rc, public.controls c
WHERE rc.title = 'Enhanced Customer Due Diligence Requirements' AND c.control_id = 'CTRL-001'
ON CONFLICT DO NOTHING;

INSERT INTO public.regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
SELECT rc.id, c.id, 'high'
FROM public.regulatory_changes rc, public.controls c
WHERE rc.title = 'Enhanced Customer Due Diligence Requirements' AND c.control_id = 'CTRL-004'
ON CONFLICT DO NOTHING;

INSERT INTO public.regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
SELECT rc.id, c.id, 'medium'
FROM public.regulatory_changes rc, public.controls c
WHERE rc.title = 'Updated Transaction Monitoring Thresholds' AND c.control_id = 'CTRL-002'
ON CONFLICT DO NOTHING;

INSERT INTO public.regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
SELECT rc.id, c.id, 'high'
FROM public.regulatory_changes rc, public.controls c
WHERE rc.title = 'Sanctions Screening Update - Russia' AND c.control_id = 'CTRL-003'
ON CONFLICT DO NOTHING;

-- Sample Attestations
INSERT INTO public.attestations (control_id, attestor_role, status, due_date, submitted_at)
SELECT id, 'Control Owner', 'approved', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE - INTERVAL '9 days'
FROM public.controls WHERE control_id = 'CTRL-003'
ON CONFLICT DO NOTHING;

INSERT INTO public.attestations (control_id, attestor_role, status, due_date, submitted_at)
SELECT id, 'SMF', 'pending', CURRENT_DATE + INTERVAL '7 days', NULL
FROM public.controls WHERE control_id = 'CTRL-001'
ON CONFLICT DO NOTHING;

INSERT INTO public.attestations (control_id, attestor_role, status, due_date, submitted_at)
SELECT id, 'Deputy', 'failed', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '10 days'
FROM public.controls WHERE control_id = 'CTRL-004'
ON CONFLICT DO NOTHING;

-- Sample Exceptions
INSERT INTO public.exceptions (control_id, title, description, status, severity)
SELECT id, 'Manual review required', 'Temporary exception for high-value manual review process', 'open', 'medium'
FROM public.controls WHERE control_id = 'CTRL-002'
ON CONFLICT DO NOTHING;

INSERT INTO public.exceptions (control_id, title, description, status, severity)
SELECT id, 'System downtime', 'KYC verification system scheduled maintenance', 'open', 'high'
FROM public.controls WHERE control_id = 'CTRL-004'
ON CONFLICT DO NOTHING;

-- Sample Actions
INSERT INTO public.actions (change_id, title, status, due_date, assigned_to)
SELECT id, 'Update CDD procedures documentation', 'overdue', CURRENT_DATE - INTERVAL '5 days', NULL
FROM public.regulatory_changes WHERE title = 'Enhanced Customer Due Diligence Requirements'
ON CONFLICT DO NOTHING;

INSERT INTO public.actions (change_id, title, status, due_date, assigned_to)
SELECT id, 'Implement new monitoring thresholds in system', 'in_progress', CURRENT_DATE + INTERVAL '10 days', NULL
FROM public.regulatory_changes WHERE title = 'Updated Transaction Monitoring Thresholds'
ON CONFLICT DO NOTHING;

INSERT INTO public.actions (change_id, title, status, due_date, assigned_to)
SELECT id, 'Update sanctions screening lists', 'overdue', CURRENT_DATE - INTERVAL '2 days', NULL
FROM public.regulatory_changes WHERE title = 'Sanctions Screening Update - Russia'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE!
-- ============================================================================
-- You can now query the strategic views:
--
-- SELECT * FROM v_regulatory_impact_score;
-- SELECT * FROM v_control_drift_index;
-- SELECT * FROM v_control_drift_summary;
-- SELECT * FROM v_attestation_confidence_index;
-- SELECT * FROM v_attestation_confidence_summary;
-- ============================================================================
