-- ============================================================================
-- UNIFIED COMPLIANCE MIGRATION - RegIntels to New Instance
-- ============================================================================
-- Purpose: Create compliance_* prefixed tables in new Supabase instance
-- Source: RegIntels production database schema
-- Date: 2026-01-23
-- ============================================================================
--
-- INSTRUCTIONS:
-- 1. Run this script in your NEW Supabase instance SQL Editor
-- 2. This creates all tables with compliance_ prefix
-- 3. Then run export_compliance_data.sql in OLD instance
-- 4. Then run import_compliance_data.sql in NEW instance
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE COMPLIANCE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. compliance_regulatory_changes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_regulatory_changes (
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

CREATE INDEX IF NOT EXISTS idx_compliance_regulatory_changes_status ON public.compliance_regulatory_changes(status);
CREATE INDEX IF NOT EXISTS idx_compliance_regulatory_changes_materiality ON public.compliance_regulatory_changes(materiality);
CREATE INDEX IF NOT EXISTS idx_compliance_regulatory_changes_published_at ON public.compliance_regulatory_changes(published_at DESC);

COMMENT ON TABLE public.compliance_regulatory_changes IS
'Compliance regulatory changes tracking - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 2. compliance_controls
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_controls (
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

CREATE INDEX IF NOT EXISTS idx_compliance_controls_control_id ON public.compliance_controls(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_status ON public.compliance_controls(status);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_next_review_date ON public.compliance_controls(next_review_date);

COMMENT ON TABLE public.compliance_controls IS
'Compliance controls library - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 3. compliance_regulatory_change_control_map
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_regulatory_change_control_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulatory_change_id UUID NOT NULL REFERENCES public.compliance_regulatory_changes(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(regulatory_change_id, control_id)
);

CREATE INDEX IF NOT EXISTS idx_compliance_rccm_reg_change ON public.compliance_regulatory_change_control_map(regulatory_change_id);
CREATE INDEX IF NOT EXISTS idx_compliance_rccm_control ON public.compliance_regulatory_change_control_map(control_id);

COMMENT ON TABLE public.compliance_regulatory_change_control_map IS
'Mapping between regulatory changes and controls - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 4. compliance_attestations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  change_id UUID REFERENCES public.compliance_regulatory_changes(id) ON DELETE CASCADE,
  attestor_id UUID,
  attestor_role TEXT CHECK (attestor_role IN ('SMF', 'Control Owner', 'Owner', 'Deputy', 'Delegate', 'Other')) DEFAULT 'Other',
  status TEXT CHECK (status IN ('pending', 'approved', 'failed', 'rejected')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_attestations_control ON public.compliance_attestations(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_attestations_change ON public.compliance_attestations(change_id);
CREATE INDEX IF NOT EXISTS idx_compliance_attestations_status ON public.compliance_attestations(status);
CREATE INDEX IF NOT EXISTS idx_compliance_attestations_due_date ON public.compliance_attestations(due_date);

COMMENT ON TABLE public.compliance_attestations IS
'Control attestations tracking - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 5. compliance_exceptions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('open', 'closed', 'expired')) DEFAULT 'open',
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  expiry_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_compliance_exceptions_control ON public.compliance_exceptions(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_exceptions_status ON public.compliance_exceptions(status);
CREATE INDEX IF NOT EXISTS idx_compliance_exceptions_created_at ON public.compliance_exceptions(created_at DESC);

COMMENT ON TABLE public.compliance_exceptions IS
'Control exceptions tracking - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 6. compliance_change_signoffs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_change_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID NOT NULL REFERENCES public.compliance_regulatory_changes(id) ON DELETE CASCADE,
  signoff_by UUID,
  signoff_role TEXT,
  signoff_status TEXT CHECK (signoff_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  signed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_change_signoffs_change ON public.compliance_change_signoffs(change_id);
CREATE INDEX IF NOT EXISTS idx_compliance_change_signoffs_status ON public.compliance_change_signoffs(signoff_status);

COMMENT ON TABLE public.compliance_change_signoffs IS
'Regulatory change sign-offs - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- 7. compliance_actions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.compliance_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_id UUID NOT NULL REFERENCES public.compliance_regulatory_changes(id) ON DELETE CASCADE,
  control_id UUID REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled')) DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_actions_change ON public.compliance_actions(change_id);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_control ON public.compliance_actions(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_status ON public.compliance_actions(status);
CREATE INDEX IF NOT EXISTS idx_compliance_actions_due_date ON public.compliance_actions(due_date);

COMMENT ON TABLE public.compliance_actions IS
'Actions for regulatory changes - migrated from RegIntels';

-- ============================================================================
-- SECTION 2: STRATEGIC VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View 1: compliance_v_change_action_tracker
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_change_action_tracker AS
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
FROM public.compliance_actions a;

COMMENT ON VIEW public.compliance_v_change_action_tracker IS
'Action tracker view for monitoring regulatory change action status - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- View 2: compliance_v_regulatory_impact_score
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_regulatory_impact_score AS
SELECT
  c.id as change_id,
  c.title as change_title,
  c.materiality,
  c.regulator,
  c.published_at,

  -- 1. Regulatory Severity Score (30% weight)
  CASE
    WHEN c.materiality = 'high' THEN 30
    WHEN c.materiality = 'medium' THEN 20
    ELSE 10
  END as severity_score,

  -- 2. Business Surface Area Score (20% weight)
  LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20) as surface_area_score,

  -- 3. Control Coverage Gap Score (25% weight)
  CASE
    WHEN COUNT(cs.id) = 0 THEN 25
    ELSE 0
  END as control_gap_score,

  -- 4. Execution Risk Score (15% weight)
  LEAST(
    SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) * 5,
    15
  ) as execution_risk_score,

  -- 5. Attestation Confidence Penalty (10% weight)
  CASE
    WHEN att.status != 'approved' THEN 10
    WHEN att.status IS NULL THEN 10
    ELSE 0
  END as attestation_penalty,

  -- TOTAL IMPACT SCORE (0-100)
  (
    CASE
      WHEN c.materiality = 'high' THEN 30
      WHEN c.materiality = 'medium' THEN 20
      ELSE 10
    END
    + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
    + CASE WHEN COUNT(cs.id) = 0 THEN 25 ELSE 0 END
    + LEAST(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) * 5, 15)
    + CASE
        WHEN att.status != 'approved' THEN 10
        WHEN att.status IS NULL THEN 10
        ELSE 0
      END
  ) as total_impact_score,

  -- Risk Band Classification
  CASE
    WHEN (
      CASE WHEN c.materiality = 'high' THEN 30 WHEN c.materiality = 'medium' THEN 20 ELSE 10 END
      + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
      + CASE WHEN COUNT(cs.id) = 0 THEN 25 ELSE 0 END
      + LEAST(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) * 5, 15)
      + CASE WHEN att.status != 'approved' OR att.status IS NULL THEN 10 ELSE 0 END
    ) >= 61 THEN 'CRITICAL'
    WHEN (
      CASE WHEN c.materiality = 'high' THEN 30 WHEN c.materiality = 'medium' THEN 20 ELSE 10 END
      + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
      + CASE WHEN COUNT(cs.id) = 0 THEN 25 ELSE 0 END
      + LEAST(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) * 5, 15)
      + CASE WHEN att.status != 'approved' OR att.status IS NULL THEN 10 ELSE 0 END
    ) >= 31 THEN 'HIGH'
    ELSE 'MODERATE'
  END as risk_band,

  -- Impact Drivers
  CASE
    WHEN COUNT(cs.id) = 0 THEN 'Missing control sign-offs'
    WHEN SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) > 0 THEN 'Overdue actions'
    WHEN att.status != 'approved' OR att.status IS NULL THEN 'Pending attestation'
    ELSE 'Regulatory severity'
  END as primary_driver,

  -- Metadata
  COUNT(DISTINCT rccm.control_id) as affected_controls_count,
  COUNT(cs.id) as signoffs_count,
  SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END) as overdue_actions_count

FROM public.compliance_regulatory_changes c
LEFT JOIN public.compliance_regulatory_change_control_map rccm ON rccm.regulatory_change_id = c.id
LEFT JOIN public.compliance_change_signoffs cs ON cs.change_id = c.id
LEFT JOIN public.compliance_v_change_action_tracker act ON act.change_id = c.id
LEFT JOIN public.compliance_attestations att ON att.change_id = c.id
GROUP BY c.id, c.title, c.materiality, c.regulator, c.published_at, att.status;

COMMENT ON VIEW public.compliance_v_regulatory_impact_score IS
'RegIntels Impact Score: Quantified Regulatory Exposure Index (0-100) - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- View 3: compliance_v_control_drift_index
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_control_drift_index AS
SELECT
  c.id as control_id,
  c.control_id as control_code,
  c.control_title,
  c.control_owner,
  c.last_reviewed_at,
  c.next_review_date,

  -- Last regulatory change affecting this control
  MAX(rc.published_at) as last_reg_change_date,

  -- Time since last review
  NOW() - c.last_reviewed_at as review_delay_interval,
  EXTRACT(days FROM (NOW() - c.last_reviewed_at)) as review_delay_days,

  -- Time until next review
  c.next_review_date - NOW() as time_to_next_review,
  EXTRACT(days FROM (c.next_review_date - NOW())) as days_to_next_review,

  -- Count of pending changes affecting this control
  COUNT(DISTINCT CASE WHEN rc.status = 'pending' THEN rc.id END) as pending_changes_count,

  -- Count of failed attestations
  COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) as failed_attestations_count,

  -- Count of open exceptions
  COUNT(DISTINCT CASE WHEN ex.status = 'open' THEN ex.id END) as open_exceptions_count,

  -- DRIFT STATUS CLASSIFICATION
  CASE
    WHEN (NOW() - c.last_reviewed_at > INTERVAL '90 days')
      OR (COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) > 0
          AND COUNT(DISTINCT CASE WHEN rc.status = 'pending' AND rc.materiality = 'high' THEN rc.id END) > 0)
    THEN 'CRITICAL_DRIFT'

    WHEN (NOW() - c.last_reviewed_at > INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) > 1
    THEN 'MATERIAL_DRIFT'

    WHEN (c.next_review_date - NOW() < INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN rc.status = 'pending' THEN rc.id END) > 0
    THEN 'EMERGING_DRIFT'

    ELSE 'STABLE'
  END as drift_status,

  -- Drift Score (0-100, higher = worse)
  LEAST(100,
    CASE
      WHEN NOW() - c.last_reviewed_at > INTERVAL '90 days' THEN 50
      WHEN NOW() - c.last_reviewed_at > INTERVAL '30 days' THEN 30
      ELSE 10
    END
    + (COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) * 15)
    + (COUNT(DISTINCT CASE WHEN rc.status = 'pending' AND rc.materiality = 'high' THEN rc.id END) * 10)
    + (COUNT(DISTINCT CASE WHEN ex.status = 'open' THEN ex.id END) * 5)
  ) as drift_score,

  -- Primary Drift Driver
  CASE
    WHEN COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) > 0
      THEN 'Failed attestations'
    WHEN NOW() - c.last_reviewed_at > INTERVAL '90 days'
      THEN 'Overdue review (>90 days)'
    WHEN COUNT(DISTINCT CASE WHEN rc.status = 'pending' AND rc.materiality = 'high' THEN rc.id END) > 0
      THEN 'High-impact pending changes'
    WHEN COUNT(DISTINCT CASE WHEN ex.status = 'open' THEN ex.id END) > 0
      THEN 'Open exceptions'
    ELSE 'Approaching review date'
  END as drift_driver,

  -- Urgency indicator
  CASE
    WHEN (NOW() - c.last_reviewed_at > INTERVAL '90 days')
      OR (COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) > 0
          AND COUNT(DISTINCT CASE WHEN rc.status = 'pending' AND rc.materiality = 'high' THEN rc.id END) > 0)
    THEN 'URGENT'
    WHEN (NOW() - c.last_reviewed_at > INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN att.status = 'failed' THEN att.id END) > 1
    THEN 'ATTENTION_NEEDED'
    ELSE 'MONITOR'
  END as urgency_level

FROM public.compliance_controls c
LEFT JOIN public.compliance_regulatory_change_control_map rccm ON rccm.control_id = c.id
LEFT JOIN public.compliance_regulatory_changes rc ON rc.id = rccm.regulatory_change_id
LEFT JOIN public.compliance_attestations att ON att.control_id = c.id
LEFT JOIN public.compliance_exceptions ex ON ex.control_id = c.id
GROUP BY
  c.id,
  c.control_id,
  c.control_title,
  c.control_owner,
  c.last_reviewed_at,
  c.next_review_date;

COMMENT ON VIEW public.compliance_v_control_drift_index IS
'RegIntels Control Drift Model: Early-warning system detecting control drift - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- View 4: compliance_v_control_drift_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_control_drift_summary AS
SELECT
  drift_status,
  COUNT(*) as control_count,
  AVG(drift_score) as avg_drift_score,
  SUM(pending_changes_count) as total_pending_changes,
  SUM(failed_attestations_count) as total_failed_attestations,
  SUM(open_exceptions_count) as total_open_exceptions
FROM public.compliance_v_control_drift_index
GROUP BY drift_status;

COMMENT ON VIEW public.compliance_v_control_drift_summary IS
'Summary of control drift across the organization - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- View 5: compliance_v_attestation_confidence_index
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_attestation_confidence_index AS
SELECT
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
  CASE
    WHEN a.submitted_at IS NULL AND NOW() > a.due_date THEN 0
    WHEN a.submitted_at IS NULL THEN 30
    WHEN a.submitted_at <= a.due_date THEN 40
    WHEN a.submitted_at <= a.due_date + INTERVAL '7 days' THEN 25
    WHEN a.submitted_at <= a.due_date + INTERVAL '14 days' THEN 15
    ELSE 5
  END as timeliness_score,

  -- Days late/early
  CASE
    WHEN a.submitted_at IS NOT NULL
    THEN EXTRACT(days FROM (a.submitted_at - a.due_date))
    ELSE EXTRACT(days FROM (NOW() - a.due_date))
  END as days_delta,

  -- 2. ROLE WEIGHT SCORE (30% weight)
  CASE
    WHEN a.attestor_role = 'SMF' THEN 30
    WHEN a.attestor_role = 'Control Owner' OR a.attestor_role = 'Owner' THEN 20
    WHEN a.attestor_role = 'Deputy' OR a.attestor_role = 'Delegate' THEN 10
    ELSE 5
  END as role_score,

  -- 3. HISTORICAL RELIABILITY SCORE (20% weight)
  LEAST(
    (SELECT COUNT(*)
     FROM public.compliance_attestations prev
     WHERE prev.attestor_id = a.attestor_id
       AND prev.status = 'approved'
       AND prev.id != a.id) * 2,
    20
  ) as reliability_score,

  -- 4. EXCEPTION PENALTY (deduction)
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.compliance_exceptions ex
      WHERE ex.control_id = a.control_id
        AND ex.status = 'open'
        AND ex.created_at > NOW() - INTERVAL '90 days'
    ) THEN -15
    ELSE 0
  END as exception_penalty,

  -- TOTAL CONFIDENCE SCORE (0-100)
  GREATEST(0,
    CASE
      WHEN a.submitted_at IS NULL AND NOW() > a.due_date THEN 0
      WHEN a.submitted_at IS NULL THEN 30
      WHEN a.submitted_at <= a.due_date THEN 40
      WHEN a.submitted_at <= a.due_date + INTERVAL '7 days' THEN 25
      WHEN a.submitted_at <= a.due_date + INTERVAL '14 days' THEN 15
      ELSE 5
    END
    +
    CASE
      WHEN a.attestor_role = 'SMF' THEN 30
      WHEN a.attestor_role = 'Control Owner' OR a.attestor_role = 'Owner' THEN 20
      WHEN a.attestor_role = 'Deputy' OR a.attestor_role = 'Delegate' THEN 10
      ELSE 5
    END
    +
    LEAST(
      (SELECT COUNT(*)
       FROM public.compliance_attestations prev
       WHERE prev.attestor_id = a.attestor_id
         AND prev.status = 'approved'
         AND prev.id != a.id) * 2,
      20
    )
    +
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.compliance_exceptions ex
        WHERE ex.control_id = a.control_id
          AND ex.status = 'open'
          AND ex.created_at > NOW() - INTERVAL '90 days'
      ) THEN -15
      ELSE 0
    END
  ) as confidence_score,

  -- CONFIDENCE BAND CLASSIFICATION
  CASE
    WHEN GREATEST(0,
      CASE
        WHEN a.submitted_at IS NULL AND NOW() > a.due_date THEN 0
        WHEN a.submitted_at IS NULL THEN 30
        WHEN a.submitted_at <= a.due_date THEN 40
        WHEN a.submitted_at <= a.due_date + INTERVAL '7 days' THEN 25
        WHEN a.submitted_at <= a.due_date + INTERVAL '14 days' THEN 15
        ELSE 5
      END
      + CASE
          WHEN a.attestor_role = 'SMF' THEN 30
          WHEN a.attestor_role = 'Control Owner' OR a.attestor_role = 'Owner' THEN 20
          WHEN a.attestor_role = 'Deputy' OR a.attestor_role = 'Delegate' THEN 10
          ELSE 5
        END
      + LEAST((SELECT COUNT(*) FROM public.compliance_attestations prev
               WHERE prev.attestor_id = a.attestor_id
                 AND prev.status = 'approved'
                 AND prev.id != a.id) * 2, 20)
      + CASE
          WHEN EXISTS (SELECT 1 FROM public.compliance_exceptions ex
                       WHERE ex.control_id = a.control_id
                         AND ex.status = 'open'
                         AND ex.created_at > NOW() - INTERVAL '90 days')
          THEN -15
          ELSE 0
        END
    ) >= 70 THEN 'HIGH_CONFIDENCE'
    WHEN GREATEST(0,
      CASE
        WHEN a.submitted_at IS NULL AND NOW() > a.due_date THEN 0
        WHEN a.submitted_at IS NULL THEN 30
        WHEN a.submitted_at <= a.due_date THEN 40
        WHEN a.submitted_at <= a.due_date + INTERVAL '7 days' THEN 25
        WHEN a.submitted_at <= a.due_date + INTERVAL '14 days' THEN 15
        ELSE 5
      END
      + CASE
          WHEN a.attestor_role = 'SMF' THEN 30
          WHEN a.attestor_role = 'Control Owner' OR a.attestor_role = 'Owner' THEN 20
          WHEN a.attestor_role = 'Deputy' OR a.attestor_role = 'Delegate' THEN 10
          ELSE 5
        END
      + LEAST((SELECT COUNT(*) FROM public.compliance_attestations prev
               WHERE prev.attestor_id = a.attestor_id
                 AND prev.status = 'approved'
                 AND prev.id != a.id) * 2, 20)
      + CASE
          WHEN EXISTS (SELECT 1 FROM public.compliance_exceptions ex
                       WHERE ex.control_id = a.control_id
                         AND ex.status = 'open'
                         AND ex.created_at > NOW() - INTERVAL '90 days')
          THEN -15
          ELSE 0
        END
    ) >= 40 THEN 'MEDIUM_CONFIDENCE'
    ELSE 'LOW_CONFIDENCE'
  END as confidence_band,

  -- Primary Confidence Driver
  CASE
    WHEN a.submitted_at IS NULL AND NOW() > a.due_date THEN 'Overdue attestation'
    WHEN a.submitted_at IS NULL THEN 'Pending attestation'
    WHEN EXISTS (
      SELECT 1 FROM public.compliance_exceptions ex
      WHERE ex.control_id = a.control_id
        AND ex.status = 'open'
        AND ex.created_at > NOW() - INTERVAL '90 days'
    ) THEN 'Recent exceptions'
    WHEN a.attestor_role NOT IN ('SMF', 'Control Owner', 'Owner') THEN 'Low role authority'
    WHEN a.submitted_at > a.due_date + INTERVAL '7 days' THEN 'Late submission'
    ELSE 'Strong attestation profile'
  END as confidence_driver,

  -- Attestor performance metrics
  (SELECT COUNT(*)
   FROM public.compliance_attestations prev
   WHERE prev.attestor_id = a.attestor_id
     AND prev.status = 'approved') as total_approved_count,

  (SELECT COUNT(*)
   FROM public.compliance_attestations prev
   WHERE prev.attestor_id = a.attestor_id
     AND prev.submitted_at > prev.due_date) as total_late_count,

  -- Control exception count
  (SELECT COUNT(*)
   FROM public.compliance_exceptions ex
   WHERE ex.control_id = a.control_id
     AND ex.status = 'open') as open_exceptions_count

FROM public.compliance_attestations a
JOIN public.compliance_controls c ON c.id = a.control_id;

COMMENT ON VIEW public.compliance_v_attestation_confidence_index IS
'RegIntels Attestation Confidence Index: Measures confidence in attestations (0-100) - migrated from RegIntels';

-- ----------------------------------------------------------------------------
-- View 6: compliance_v_attestation_confidence_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.compliance_v_attestation_confidence_summary AS
SELECT
  confidence_band,
  COUNT(*) as attestation_count,
  AVG(confidence_score) as avg_confidence_score,
  SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN days_delta > 0 THEN 1 ELSE 0 END) as late_count,
  SUM(open_exceptions_count) as total_exceptions
FROM public.compliance_v_attestation_confidence_index
GROUP BY confidence_band;

COMMENT ON VIEW public.compliance_v_attestation_confidence_summary IS
'Summary of attestation confidence across the organization - migrated from RegIntels';

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY (RLS) - BASIC SETUP
-- ============================================================================
-- Note: Customize these policies based on your security requirements
-- For now, we'll enable RLS but allow authenticated users to read

-- Enable RLS on all tables
ALTER TABLE public.compliance_regulatory_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_regulatory_change_control_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_attestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_change_signoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_actions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow authenticated read for all compliance tables)
DROP POLICY IF EXISTS "Allow authenticated read compliance_regulatory_changes" ON public.compliance_regulatory_changes;
CREATE POLICY "Allow authenticated read compliance_regulatory_changes"
  ON public.compliance_regulatory_changes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_controls" ON public.compliance_controls;
CREATE POLICY "Allow authenticated read compliance_controls"
  ON public.compliance_controls FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_rccm" ON public.compliance_regulatory_change_control_map;
CREATE POLICY "Allow authenticated read compliance_rccm"
  ON public.compliance_regulatory_change_control_map FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_attestations" ON public.compliance_attestations;
CREATE POLICY "Allow authenticated read compliance_attestations"
  ON public.compliance_attestations FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_exceptions" ON public.compliance_exceptions;
CREATE POLICY "Allow authenticated read compliance_exceptions"
  ON public.compliance_exceptions FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_change_signoffs" ON public.compliance_change_signoffs;
CREATE POLICY "Allow authenticated read compliance_change_signoffs"
  ON public.compliance_change_signoffs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated read compliance_actions" ON public.compliance_actions;
CREATE POLICY "Allow authenticated read compliance_actions"
  ON public.compliance_actions FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================================================
-- MIGRATION COMPLETE MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLIANCE MIGRATION SCHEMA CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Created Tables (with compliance_ prefix):';
  RAISE NOTICE '  1. compliance_regulatory_changes';
  RAISE NOTICE '  2. compliance_controls';
  RAISE NOTICE '  3. compliance_regulatory_change_control_map';
  RAISE NOTICE '  4. compliance_attestations';
  RAISE NOTICE '  5. compliance_exceptions';
  RAISE NOTICE '  6. compliance_change_signoffs';
  RAISE NOTICE '  7. compliance_actions';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Created Views:';
  RAISE NOTICE '  1. compliance_v_change_action_tracker';
  RAISE NOTICE '  2. compliance_v_regulatory_impact_score';
  RAISE NOTICE '  3. compliance_v_control_drift_index';
  RAISE NOTICE '  4. compliance_v_control_drift_summary';
  RAISE NOTICE '  5. compliance_v_attestation_confidence_index';
  RAISE NOTICE '  6. compliance_v_attestation_confidence_summary';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Run export_compliance_data.sql in OLD instance';
  RAISE NOTICE '  2. Download the JSON export files';
  RAISE NOTICE '  3. Run import_compliance_data.sql in NEW instance';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Schema ready for data migration!';
END $$;
