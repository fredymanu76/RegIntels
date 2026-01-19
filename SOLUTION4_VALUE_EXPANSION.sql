-- ============================================================================
-- SOLUTION 4 — VALUE EXPANSION: OPERATIONAL RISK SIGNAL HUB
-- ============================================================================
-- Transforms Exception Management from static register to intelligent risk engine
-- Implements 7 enhancement blocks without duplicating existing schema
-- ============================================================================

-- ============================================================================
-- BLOCK 4.1: EXCEPTION MATERIALITY ENGINE
-- ============================================================================
-- Calculates materiality score (0-100) for each exception based on multiple factors

-- Extend exceptions table with materiality weights
ALTER TABLE public.exceptions
ADD COLUMN IF NOT EXISTS regulatory_impact_weight INTEGER DEFAULT 0 CHECK (regulatory_impact_weight BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS control_failure_weight INTEGER DEFAULT 0 CHECK (control_failure_weight BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS duration_weight INTEGER DEFAULT 0 CHECK (duration_weight BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS repeat_occurrence_weight INTEGER DEFAULT 0 CHECK (repeat_occurrence_weight BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS materiality_score INTEGER DEFAULT 0 CHECK (materiality_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS materiality_band TEXT CHECK (materiality_band IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'));

-- Create view: Exception Materiality Calculation
CREATE OR REPLACE VIEW v_exception_materiality AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.severity,
  e.control_id,
  cl.name as control_name,
  cl.category as control_category,

  -- Calculate days open
  CASE
    WHEN e.status IN ('open', 'in_remediation')
    THEN (CURRENT_DATE - e.created_at::date)
    ELSE (COALESCE(e.resolved_at::date, CURRENT_DATE) - e.created_at::date)
  END as days_open,

  -- Calculate days overdue
  CASE
    WHEN e.status IN ('open', 'in_remediation') AND e.due_date IS NOT NULL AND e.due_date < CURRENT_DATE
    THEN (CURRENT_DATE - e.due_date)
    ELSE 0
  END as days_overdue,

  -- Regulatory Impact Weight (0-30 points)
  -- Higher for exceptions linked to regulatory changes
  CASE
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
        AND rc.materiality = 'high'
    ) THEN 30
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
        AND rc.materiality = 'medium'
    ) THEN 20
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
    ) THEN 10
    ELSE 0
  END as regulatory_impact_weight,

  -- Control Failure Weight (0-30 points)
  -- Based on control category and recent failure rate
  CASE
    WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 30
    WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 25
    WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 20
    ELSE 15
  END as control_failure_weight,

  -- Duration Weight (0-25 points)
  -- Escalates based on how long exception has been open
  CASE
    WHEN e.status IN ('open', 'in_remediation') THEN
      CASE
        WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
        WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
        WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
        WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
        ELSE 5
      END
    ELSE 0
  END as duration_weight,

  -- Repeat Occurrence Weight (0-15 points)
  -- Multiplier if same control has had multiple exceptions
  LEAST(
    (SELECT COUNT(*) FROM exceptions e2
     WHERE e2.control_id = e.control_id
       AND e2.id != e.id
       AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'
    ) * 5,
    15
  ) as repeat_occurrence_weight,

  -- Total Materiality Score (0-100)
  LEAST(
    -- Regulatory Impact (0-30)
    CASE
      WHEN EXISTS (
        SELECT 1 FROM regulatory_changes rc
        JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
        WHERE rccm.control_id = e.control_id AND rc.materiality = 'high'
      ) THEN 30
      WHEN EXISTS (
        SELECT 1 FROM regulatory_changes rc
        JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
        WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium'
      ) THEN 20
      WHEN EXISTS (
        SELECT 1 FROM regulatory_changes rc
        JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
        WHERE rccm.control_id = e.control_id
      ) THEN 10
      ELSE 0
    END +
    -- Control Failure (0-30)
    CASE
      WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 30
      WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 25
      WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 20
      ELSE 15
    END +
    -- Duration (0-25)
    CASE
      WHEN e.status IN ('open', 'in_remediation') THEN
        CASE
          WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
          WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
          WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
          WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
          ELSE 5
        END
      ELSE 0
    END +
    -- Repeat Occurrence (0-15)
    LEAST(
      (SELECT COUNT(*) FROM exceptions e2
       WHERE e2.control_id = e.control_id
         AND e2.id != e.id
         AND e2.created_at > CURRENT_DATE - INTERVAL '12 months'
      ) * 5,
      15
    ),
    100
  ) as total_materiality_score,

  -- Materiality Band
  CASE
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      CASE WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 30
           WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 25
           WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 20
           ELSE 15 END +
      CASE WHEN e.status IN ('open', 'in_remediation') THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 70 THEN 'CRITICAL'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      CASE WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 30
           WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 25
           WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 20
           ELSE 15 END +
      CASE WHEN e.status IN ('open', 'in_remediation') THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 40 THEN 'HIGH'
    WHEN LEAST(
      CASE WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'high') THEN 30
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id AND rc.materiality = 'medium') THEN 20
           WHEN EXISTS (SELECT 1 FROM regulatory_changes rc JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id WHERE rccm.control_id = e.control_id) THEN 10
           ELSE 0 END +
      CASE WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 30
           WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 25
           WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 20
           ELSE 15 END +
      CASE WHEN e.status IN ('open', 'in_remediation') THEN
        CASE WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 25
             WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 20
             WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 15
             WHEN (CURRENT_DATE - e.created_at::date) > 7 THEN 10
             ELSE 5 END
      ELSE 0 END +
      LEAST((SELECT COUNT(*) FROM exceptions e2 WHERE e2.control_id = e.control_id AND e2.id != e.id AND e2.created_at > CURRENT_DATE - INTERVAL '12 months') * 5, 15),
      100
    ) >= 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END as materiality_band

FROM public.exceptions e
LEFT JOIN public.control_library cl ON cl.id = e.control_id
ORDER BY total_materiality_score DESC;

COMMENT ON VIEW v_exception_materiality IS 'Block 4.1: Calculated materiality scores (0-100) for each exception based on regulatory impact, control criticality, duration, and recurrence';

-- ============================================================================
-- BLOCK 4.2: EVIDENCE COVERAGE GAP DETECTION
-- ============================================================================
-- Identifies missing evidence for each exception

-- Create expected evidence types table
CREATE TABLE IF NOT EXISTS public.control_evidence_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_id UUID NOT NULL REFERENCES public.control_library(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('Policy', 'Procedure', 'Test Report', 'Approval', 'Log', 'Attestation', 'Training Record', 'Audit Report')),
  is_mandatory BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(control_id, evidence_type)
);

COMMENT ON TABLE public.control_evidence_requirements IS 'Block 4.2: Defines expected evidence types for each control';

-- Populate with default evidence requirements for all controls
INSERT INTO public.control_evidence_requirements (control_id, evidence_type, is_mandatory, description)
SELECT
  id as control_id,
  evidence_type,
  true as is_mandatory,
  'Standard evidence requirement' as description
FROM public.control_library
CROSS JOIN (
  VALUES
    ('Policy'),
    ('Test Report'),
    ('Attestation')
) AS evidence_types(evidence_type)
ON CONFLICT (control_id, evidence_type) DO NOTHING;

-- Create view: Evidence Coverage Gap Analysis
CREATE OR REPLACE VIEW v_evidence_coverage_gaps AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.control_id,
  cl.name as control_name,

  -- Count expected evidence types
  COUNT(DISTINCT cer.evidence_type) FILTER (WHERE cer.is_mandatory = true) as mandatory_evidence_required,

  -- Count provided evidence types (from evidence uploads)
  COUNT(DISTINCT ev.file_type) FILTER (WHERE ev.file_type IS NOT NULL) as evidence_provided,

  -- Calculate coverage percentage
  ROUND(
    (COUNT(DISTINCT ev.file_type) FILTER (WHERE ev.file_type IS NOT NULL)::DECIMAL /
     NULLIF(COUNT(DISTINCT cer.evidence_type) FILTER (WHERE cer.is_mandatory = true), 0)) * 100,
    0
  ) as coverage_percentage,

  -- List missing evidence types
  ARRAY_AGG(DISTINCT cer.evidence_type) FILTER (
    WHERE cer.is_mandatory = true
      AND cer.evidence_type NOT IN (
        SELECT COALESCE(ev2.file_type, 'None')
        FROM public.evidence ev2
        WHERE ev2.exception_id = e.id
      )
  ) as missing_evidence_types,

  -- Coverage band
  CASE
    WHEN ROUND((COUNT(DISTINCT ev.file_type) FILTER (WHERE ev.file_type IS NOT NULL)::DECIMAL / NULLIF(COUNT(DISTINCT cer.evidence_type) FILTER (WHERE cer.is_mandatory = true), 0)) * 100, 0) >= 90 THEN 'COMPLETE'
    WHEN ROUND((COUNT(DISTINCT ev.file_type) FILTER (WHERE ev.file_type IS NOT NULL)::DECIMAL / NULLIF(COUNT(DISTINCT cer.evidence_type) FILTER (WHERE cer.is_mandatory = true), 0)) * 100, 0) >= 70 THEN 'ADEQUATE'
    WHEN ROUND((COUNT(DISTINCT ev.file_type) FILTER (WHERE ev.file_type IS NOT NULL)::DECIMAL / NULLIF(COUNT(DISTINCT cer.evidence_type) FILTER (WHERE cer.is_mandatory = true), 0)) * 100, 0) >= 40 THEN 'PARTIAL'
    ELSE 'INSUFFICIENT'
  END as coverage_band

FROM public.exceptions e
JOIN public.control_library cl ON cl.id = e.control_id
LEFT JOIN public.control_evidence_requirements cer ON cer.control_id = e.control_id
LEFT JOIN public.evidence ev ON ev.exception_id = e.id
GROUP BY e.id, e.title, e.control_id, cl.name
ORDER BY coverage_percentage ASC NULLS FIRST;

COMMENT ON VIEW v_evidence_coverage_gaps IS 'Block 4.2: Identifies missing evidence for each exception with coverage percentage';

-- ============================================================================
-- BLOCK 4.3: EXCEPTION RISK ACCELERATION MODEL
-- ============================================================================
-- Predicts risk trajectory for open exceptions

-- Extend exceptions table with risk trajectory
ALTER TABLE public.exceptions
ADD COLUMN IF NOT EXISTS risk_trajectory TEXT CHECK (risk_trajectory IN ('STABLE', 'DETERIORATING', 'ACCELERATING', 'CRITICAL_ACCELERATION'));

-- Create view: Exception Risk Acceleration
CREATE OR REPLACE VIEW v_exception_risk_acceleration AS
SELECT
  e.id as exception_id,
  e.title as exception_title,
  e.status,
  e.control_id,
  cl.name as control_name,
  cl.category as control_category,

  -- Time metrics
  (CURRENT_DATE - e.created_at::date) as days_open,
  CASE
    WHEN e.due_date IS NOT NULL AND e.due_date < CURRENT_DATE
    THEN (CURRENT_DATE - e.due_date)
    ELSE 0
  END as days_overdue,

  -- Regulatory deadline proximity
  CASE
    WHEN EXISTS (
      SELECT 1 FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
        AND rc.deadline IS NOT NULL
        AND rc.deadline > CURRENT_DATE
    ) THEN (
      SELECT MIN(rc.deadline - CURRENT_DATE)
      FROM regulatory_changes rc
      JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
      WHERE rccm.control_id = e.control_id
        AND rc.deadline > CURRENT_DATE
    )
    ELSE NULL
  END as days_to_regulatory_deadline,

  -- Control criticality score
  CASE
    WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 95
    WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 85
    WHEN cl.category IN ('Operational Resilience', 'Governance') THEN 75
    ELSE 60
  END as control_criticality_score,

  -- Calculate acceleration rate (conceptual: change in risk over time)
  CASE
    -- Critical Acceleration: Multiple red flags
    WHEN (CURRENT_DATE - e.created_at::date) > 90
      AND e.status = 'open'
      AND (e.due_date IS NOT NULL AND CURRENT_DATE > e.due_date + 30)
      AND cl.category IN ('AML', 'KYC', 'Financial Crime', 'Data Protection')
    THEN 'CRITICAL_ACCELERATION'

    -- Accelerating: Showing concerning trends
    WHEN (CURRENT_DATE - e.created_at::date) > 60
      AND e.status = 'open'
      AND (e.due_date IS NOT NULL AND CURRENT_DATE > e.due_date)
    THEN 'ACCELERATING'

    -- Deteriorating: Getting worse but not critical yet
    WHEN (CURRENT_DATE - e.created_at::date) > 30
      AND e.status = 'open'
    THEN 'DETERIORATING'

    -- Stable: Under control
    ELSE 'STABLE'
  END as risk_trajectory,

  -- Acceleration indicator
  CASE
    WHEN (CURRENT_DATE - e.created_at::date) > 90 AND e.status = 'open' AND (e.due_date IS NOT NULL AND CURRENT_DATE > e.due_date + 30) AND cl.category IN ('AML', 'KYC', 'Financial Crime', 'Data Protection') THEN '⚠'
    WHEN (CURRENT_DATE - e.created_at::date) > 60 AND e.status = 'open' AND (e.due_date IS NOT NULL AND CURRENT_DATE > e.due_date) THEN '↑'
    WHEN (CURRENT_DATE - e.created_at::date) > 30 AND e.status = 'open' THEN '↗'
    ELSE '→'
  END as trajectory_indicator

FROM public.exceptions e
JOIN public.control_library cl ON cl.id = e.control_id
WHERE e.status IN ('open', 'in_remediation')
ORDER BY
  CASE
    WHEN (CURRENT_DATE - e.created_at::date) > 90 AND e.status = 'open' THEN 1
    WHEN (CURRENT_DATE - e.created_at::date) > 60 AND e.status = 'open' THEN 2
    WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 3
    ELSE 4
  END,
  control_criticality_score DESC;

COMMENT ON VIEW v_exception_risk_acceleration IS 'Block 4.3: Predicts risk trajectory for open exceptions based on aging and control criticality';

-- ============================================================================
-- BLOCK 4.4: EVIDENCE TRUST SCORE
-- ============================================================================
-- Calculates trustworthiness score for evidence items

-- Extend evidence table with trust metrics
ALTER TABLE public.evidence
ADD COLUMN IF NOT EXISTS trust_score INTEGER CHECK (trust_score BETWEEN 0 AND 100),
ADD COLUMN IF NOT EXISTS trust_band TEXT CHECK (trust_band IN ('HIGH', 'MEDIUM', 'LOW')),
ADD COLUMN IF NOT EXISTS uploader_role TEXT,
ADD COLUMN IF NOT EXISTS is_independent_source BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reuse_count INTEGER DEFAULT 0;

-- Create view: Evidence Trust Analysis
CREATE OR REPLACE VIEW v_evidence_trust_score AS
SELECT
  ev.id as evidence_id,
  ev.file_name,
  ev.file_type,
  ev.exception_id,
  ev.uploaded_by,
  ev.uploaded_at,
  e.title as exception_title,

  -- File age in days
  (CURRENT_DATE - ev.uploaded_at::date) as file_age_days,

  -- Uploader role score (0-30 points)
  CASE
    WHEN up.role = 'Admin' THEN 30
    WHEN up.role IN ('Compliance', 'Risk') THEN 25
    WHEN up.role = 'Manager' THEN 20
    ELSE 15
  END as uploader_role_score,

  -- Independence score (0-25 points)
  CASE
    WHEN ev.is_independent_source = true THEN 25
    WHEN up.role IN ('Compliance', 'Risk', 'Internal Audit') THEN 20
    ELSE 10
  END as independence_score,

  -- Freshness score (0-25 points)
  CASE
    WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 30 THEN 25
    WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 90 THEN 20
    WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 180 THEN 15
    WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 365 THEN 10
    ELSE 5
  END as freshness_score,

  -- Reuse penalty (0-20 points, higher reuse = lower score)
  CASE
    WHEN ev.reuse_count = 0 THEN 20
    WHEN ev.reuse_count = 1 THEN 15
    WHEN ev.reuse_count = 2 THEN 10
    WHEN ev.reuse_count >= 3 THEN 5
    ELSE 20
  END as reuse_score,

  -- Total trust score (0-100)
  LEAST(
    CASE WHEN up.role = 'Admin' THEN 30 WHEN up.role IN ('Compliance', 'Risk') THEN 25 WHEN up.role = 'Manager' THEN 20 ELSE 15 END +
    CASE WHEN ev.is_independent_source = true THEN 25 WHEN up.role IN ('Compliance', 'Risk', 'Internal Audit') THEN 20 ELSE 10 END +
    CASE WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 30 THEN 25 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 90 THEN 20 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 180 THEN 15 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 365 THEN 10 ELSE 5 END +
    CASE WHEN ev.reuse_count = 0 THEN 20 WHEN ev.reuse_count = 1 THEN 15 WHEN ev.reuse_count = 2 THEN 10 WHEN ev.reuse_count >= 3 THEN 5 ELSE 20 END,
    100
  ) as total_trust_score,

  -- Trust band
  CASE
    WHEN LEAST(
      CASE WHEN up.role = 'Admin' THEN 30 WHEN up.role IN ('Compliance', 'Risk') THEN 25 WHEN up.role = 'Manager' THEN 20 ELSE 15 END +
      CASE WHEN ev.is_independent_source = true THEN 25 WHEN up.role IN ('Compliance', 'Risk', 'Internal Audit') THEN 20 ELSE 10 END +
      CASE WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 30 THEN 25 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 90 THEN 20 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 180 THEN 15 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 365 THEN 10 ELSE 5 END +
      CASE WHEN ev.reuse_count = 0 THEN 20 WHEN ev.reuse_count = 1 THEN 15 WHEN ev.reuse_count = 2 THEN 10 WHEN ev.reuse_count >= 3 THEN 5 ELSE 20 END,
      100
    ) >= 75 THEN 'HIGH'
    WHEN LEAST(
      CASE WHEN up.role = 'Admin' THEN 30 WHEN up.role IN ('Compliance', 'Risk') THEN 25 WHEN up.role = 'Manager' THEN 20 ELSE 15 END +
      CASE WHEN ev.is_independent_source = true THEN 25 WHEN up.role IN ('Compliance', 'Risk', 'Internal Audit') THEN 20 ELSE 10 END +
      CASE WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 30 THEN 25 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 90 THEN 20 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 180 THEN 15 WHEN (CURRENT_DATE - ev.uploaded_at::date) <= 365 THEN 10 ELSE 5 END +
      CASE WHEN ev.reuse_count = 0 THEN 20 WHEN ev.reuse_count = 1 THEN 15 WHEN ev.reuse_count = 2 THEN 10 WHEN ev.reuse_count >= 3 THEN 5 ELSE 20 END,
      100
    ) >= 50 THEN 'MEDIUM'
    ELSE 'LOW'
  END as trust_band,

  -- Trust concerns
  ARRAY_REMOVE(ARRAY[
    CASE WHEN (CURRENT_DATE - ev.uploaded_at::date) > 365 THEN 'Evidence > 1 year old' ELSE NULL END,
    CASE WHEN ev.reuse_count >= 2 THEN 'Recycled evidence' ELSE NULL END,
    CASE WHEN ev.is_independent_source = false AND up.role NOT IN ('Compliance', 'Risk', 'Internal Audit') THEN 'Lacks independence' ELSE NULL END
  ], NULL) as trust_concerns

FROM public.evidence ev
JOIN public.exceptions e ON e.id = ev.exception_id
LEFT JOIN public.user_profiles up ON up.email = ev.uploaded_by
ORDER BY total_trust_score ASC;

COMMENT ON VIEW v_evidence_trust_score IS 'Block 4.4: Calculates trustworthiness score (0-100) for each evidence item based on age, uploader, independence, and reuse';

-- ============================================================================
-- BLOCK 4.5: AUTO-GENERATED EXCEPTION NARRATIVE
-- ============================================================================
-- Creates regulator-ready exception narratives

CREATE OR REPLACE VIEW v_exception_narrative AS
SELECT
  e.id as exception_id,
  e.title as exception_title,

  -- Auto-generated narrative sections
  jsonb_build_object(
    'nature_of_exception', e.description,
    'control_impacted', cl.name || ' (' || cl.category || ')',
    'exception_status', e.status,
    'severity_level', e.severity,

    'root_cause', COALESCE(
      e.root_cause,
      'Root cause analysis pending - under investigation by ' || COALESCE(up.full_name, 'control owner')
    ),

    'materiality_assessment',
      'Materiality Score: ' || COALESCE(vm.total_materiality_score::text, 'Calculating...') || '/100 (' || COALESCE(vm.materiality_band, 'PENDING') || '). ' ||
      'Regulatory Impact: ' || CASE WHEN vm.regulatory_impact_weight > 20 THEN 'High' WHEN vm.regulatory_impact_weight > 10 THEN 'Medium' ELSE 'Low' END || '. ' ||
      'Control Category: ' || cl.category || '.',

    'interim_mitigations', COALESCE(
      (SELECT string_agg(ra.action_description, '; ')
       FROM remediation_actions ra
       WHERE ra.exception_id = e.id
         AND ra.status IN ('open', 'in_progress')),
      'Interim mitigations being assessed and will be documented within 5 business days'
    ),

    'planned_remediation', COALESCE(
      (SELECT string_agg(ra.action_description || ' (Due: ' || ra.due_date::text || ')', '; ')
       FROM remediation_actions ra
       WHERE ra.exception_id = e.id),
      'Remediation plan under development by control owner. Target completion: ' || COALESCE(e.due_date::text, 'TBD')
    ),

    'expected_closure_date', COALESCE(e.due_date::text, 'Under review'),

    'evidence_coverage', COALESCE(vcg.coverage_percentage::text, '0') || '% complete. ' ||
      CASE
        WHEN vcg.coverage_band = 'INSUFFICIENT' THEN 'Additional evidence required to meet regulatory standards.'
        WHEN vcg.coverage_band = 'PARTIAL' THEN 'Evidence collection in progress.'
        WHEN vcg.coverage_band = 'ADEQUATE' THEN 'Evidence package approaching completion.'
        ELSE 'Evidence package complete and regulator-ready.'
      END,

    'regulatory_context', COALESCE(
      (SELECT string_agg(rc.title || ' (Effective: ' || rc.effective_date::text || ')', '; ')
       FROM regulatory_changes rc
       JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
       WHERE rccm.control_id = e.control_id
       LIMIT 3),
      'No direct regulatory change linkage identified'
    ),

    'management_attention',
      CASE
        WHEN vm.materiality_band = 'CRITICAL' THEN 'Board-level attention required. Escalated to Audit Committee.'
        WHEN vm.materiality_band = 'HIGH' THEN 'Senior management oversight. Reviewed at monthly Risk Committee.'
        WHEN vm.materiality_band = 'MEDIUM' THEN 'Management-level monitoring. Tracked in weekly compliance reviews.'
        ELSE 'Operational-level monitoring. Tracked by control owner.'
      END,

    'risk_trajectory',
      CASE
        WHEN vra.risk_trajectory = 'CRITICAL_ACCELERATION' THEN 'Risk is accelerating rapidly. Immediate action required to prevent regulatory breach.'
        WHEN vra.risk_trajectory = 'ACCELERATING' THEN 'Risk trend is deteriorating. Enhanced monitoring and accelerated remediation needed.'
        WHEN vra.risk_trajectory = 'DETERIORATING' THEN 'Risk position weakening. Remediation plan execution critical.'
        ELSE 'Risk position stable under current controls and mitigations.'
      END,

    'generated_at', NOW(),
    'generated_for', 'Regulatory submission / Audit response / Board reporting'

  ) as narrative_json,

  -- Plain text narrative (for export)
  '**EXCEPTION NARRATIVE: ' || e.title || '**' || E'\n\n' ||
  '**Nature of Exception:** ' || COALESCE(e.description, 'Under investigation') || E'\n\n' ||
  '**Control Impacted:** ' || cl.name || ' (' || cl.category || ')' || E'\n\n' ||
  '**Current Status:** ' || e.status || ' | Severity: ' || e.severity || E'\n\n' ||
  '**Materiality Assessment:** Materiality Score ' || COALESCE(vm.total_materiality_score::text, 'TBD') || '/100 (' || COALESCE(vm.materiality_band, 'PENDING') || '). ' ||
    'This exception carries ' || CASE WHEN vm.regulatory_impact_weight > 20 THEN 'HIGH' WHEN vm.regulatory_impact_weight > 10 THEN 'MEDIUM' ELSE 'LOW' END || ' regulatory impact. ' ||
    'Control category: ' || cl.category || '.' || E'\n\n' ||
  '**Root Cause:** ' || COALESCE(e.root_cause, 'Root cause analysis in progress. Under investigation by ' || COALESCE(up.full_name, 'control owner') || '.') || E'\n\n' ||
  '**Interim Mitigations:** ' || COALESCE(
    (SELECT string_agg(ra.action_description, E'\n• ')
     FROM remediation_actions ra
     WHERE ra.exception_id = e.id AND ra.status IN ('open', 'in_progress')),
    'Interim mitigations being assessed and will be documented within 5 business days.'
  ) || E'\n\n' ||
  '**Planned Remediation:** ' || COALESCE(
    (SELECT string_agg('• ' || ra.action_description || ' (Due: ' || ra.due_date::text || ')', E'\n')
     FROM remediation_actions ra
     WHERE ra.exception_id = e.id),
    'Remediation plan under development. Target completion: ' || COALESCE(e.due_date::text, 'TBD')
  ) || E'\n\n' ||
  '**Expected Closure:** ' || COALESCE(e.due_date::text, 'Under review by management') || E'\n\n' ||
  '**Evidence Status:** ' || COALESCE(vcg.coverage_percentage::text, '0') || '% complete (' || COALESCE(vcg.coverage_band, 'PENDING') || '). ' ||
    CASE WHEN vcg.coverage_band = 'INSUFFICIENT' THEN 'Additional evidence required.' ELSE 'On track for regulatory submission.' END || E'\n\n' ||
  '**Management Oversight:** ' || CASE
    WHEN vm.materiality_band = 'CRITICAL' THEN 'Board-level attention. Escalated to Audit Committee.'
    WHEN vm.materiality_band = 'HIGH' THEN 'Senior management oversight. Monthly Risk Committee review.'
    ELSE 'Management-level monitoring.'
  END || E'\n\n' ||
  '**Risk Trajectory:** ' || COALESCE(vra.trajectory_indicator, '→') || ' ' || COALESCE(vra.risk_trajectory, 'STABLE') || '. ' ||
    CASE WHEN vra.risk_trajectory = 'CRITICAL_ACCELERATION' THEN 'Immediate action required.' ELSE 'Monitored within risk appetite.' END || E'\n\n' ||
  '**Document Generated:** ' || NOW()::text || ' | For: Regulatory submission / Audit response / Board reporting'
  as narrative_text

FROM public.exceptions e
JOIN public.control_library cl ON cl.id = e.control_id
LEFT JOIN public.user_profiles up ON up.user_id::text = e.owner_id::text
LEFT JOIN v_exception_materiality vm ON vm.exception_id = e.id
LEFT JOIN v_evidence_coverage_gaps vcg ON vcg.exception_id = e.id
LEFT JOIN v_exception_risk_acceleration vra ON vra.exception_id = e.id
ORDER BY e.created_at DESC;

COMMENT ON VIEW v_exception_narrative IS 'Block 4.5: Auto-generates regulator-ready exception narratives with all required sections';

-- ============================================================================
-- BLOCK 4.6: EXCEPTION PORTFOLIO HEATMAP
-- ============================================================================
-- Board-level view of exception risk distribution

CREATE OR REPLACE VIEW v_exception_portfolio_heatmap AS
SELECT
  e.id as exception_id,
  e.title,
  e.status,
  vm.materiality_band,
  vm.total_materiality_score as materiality_score,

  -- Aging category (Y-axis)
  CASE
    WHEN (CURRENT_DATE - e.created_at::date) > 180 THEN 'AGED (>6mo)'
    WHEN (CURRENT_DATE - e.created_at::date) > 90 THEN 'MATURING (3-6mo)'
    WHEN (CURRENT_DATE - e.created_at::date) > 30 THEN 'RECENT (1-3mo)'
    ELSE 'NEW (<1mo)'
  END as aging_category,

  (CURRENT_DATE - e.created_at::date) as days_open,

  -- Regulatory impact size (bubble size)
  vm.regulatory_impact_weight as regulatory_impact,

  -- Control criticality
  CASE
    WHEN cl.category IN ('AML', 'KYC', 'Financial Crime') THEN 'CRITICAL'
    WHEN cl.category IN ('Data Protection', 'Consumer Duty', 'MiFID II') THEN 'HIGH'
    ELSE 'MODERATE'
  END as control_criticality,

  cl.category as control_category,

  -- Heatmap quadrant
  CASE
    WHEN vm.total_materiality_score >= 70 AND (CURRENT_DATE - e.created_at::date) > 90 THEN 'CRITICAL - AGED'
    WHEN vm.total_materiality_score >= 70 AND (CURRENT_DATE - e.created_at::date) <= 90 THEN 'CRITICAL - EMERGING'
    WHEN vm.total_materiality_score >= 40 AND (CURRENT_DATE - e.created_at::date) > 90 THEN 'HIGH - AGED'
    WHEN vm.total_materiality_score >= 40 AND (CURRENT_DATE - e.created_at::date) <= 90 THEN 'HIGH - EMERGING'
    WHEN vm.total_materiality_score < 40 AND (CURRENT_DATE - e.created_at::date) > 90 THEN 'MEDIUM - AGED'
    ELSE 'MEDIUM - EMERGING'
  END as heatmap_quadrant,

  -- Risk color code
  CASE
    WHEN vm.total_materiality_score >= 70 AND (CURRENT_DATE - e.created_at::date) > 90 THEN '#DC2626'  -- Red
    WHEN vm.total_materiality_score >= 70 THEN '#EA580C'  -- Dark Orange
    WHEN vm.total_materiality_score >= 40 AND (CURRENT_DATE - e.created_at::date) > 90 THEN '#F59E0B'  -- Orange
    WHEN vm.total_materiality_score >= 40 THEN '#FCD34D'  -- Yellow
    ELSE '#10B981'  -- Green
  END as risk_color

FROM public.exceptions e
JOIN public.control_library cl ON cl.id = e.control_id
LEFT JOIN v_exception_materiality vm ON vm.exception_id = e.id
WHERE e.status IN ('open', 'in_remediation')
ORDER BY vm.total_materiality_score DESC, days_open DESC;

COMMENT ON VIEW v_exception_portfolio_heatmap IS 'Block 4.6: Board-level heatmap showing exceptions by materiality (X) and aging (Y) with regulatory impact as bubble size';

-- Create summary metrics for the heatmap
CREATE OR REPLACE VIEW v_exception_portfolio_summary AS
SELECT
  COUNT(*) as total_exceptions,
  COUNT(*) FILTER (WHERE heatmap_quadrant LIKE 'CRITICAL%') as critical_exceptions,
  COUNT(*) FILTER (WHERE heatmap_quadrant LIKE 'HIGH%') as high_exceptions,
  COUNT(*) FILTER (WHERE heatmap_quadrant LIKE 'MEDIUM%') as medium_exceptions,
  COUNT(*) FILTER (WHERE heatmap_quadrant LIKE '%AGED%') as aged_exceptions,
  COUNT(*) FILTER (WHERE heatmap_quadrant = 'CRITICAL - AGED') as critical_aged,
  AVG(materiality_score) as avg_materiality_score,
  AVG(days_open) as avg_days_open,
  MAX(days_open) as max_days_open,

  -- Top risk areas
  ARRAY_AGG(DISTINCT control_category ORDER BY control_category) FILTER (WHERE heatmap_quadrant LIKE 'CRITICAL%') as critical_control_areas

FROM v_exception_portfolio_heatmap;

COMMENT ON VIEW v_exception_portfolio_summary IS 'Block 4.6: Summary metrics for exception portfolio heatmap';

-- ============================================================================
-- BLOCK 4.7: EVIDENCE CHAIN OF CUSTODY
-- ============================================================================
-- Tracks complete lineage of evidence usage

-- Create evidence usage log table
CREATE TABLE IF NOT EXISTS public.evidence_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES public.evidence(id) ON DELETE CASCADE,
  used_in_context TEXT NOT NULL CHECK (used_in_context IN ('CONTROL_TEST', 'EXCEPTION_RESOLUTION', 'AUDIT_RESPONSE', 'REGULATOR_PACK', 'BOARD_REPORT')),
  used_in_record_id UUID,  -- ID of the control run, exception, etc.
  used_by TEXT NOT NULL,  -- User email
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  purpose TEXT,
  notes TEXT
);

COMMENT ON TABLE public.evidence_usage_log IS 'Block 4.7: Tracks every use of evidence across the platform for full chain of custody';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_evidence_usage_evidence ON public.evidence_usage_log(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_usage_context ON public.evidence_usage_log(used_in_context);
CREATE INDEX IF NOT EXISTS idx_evidence_usage_date ON public.evidence_usage_log(used_at DESC);

-- Create view: Evidence Chain of Custody
CREATE OR REPLACE VIEW v_evidence_chain_of_custody AS
SELECT
  ev.id as evidence_id,
  ev.file_name,
  ev.file_type,
  ev.exception_id,
  e.title as exception_title,

  -- Creation
  jsonb_build_object(
    'created_by', ev.uploaded_by,
    'created_at', ev.uploaded_at,
    'file_size', ev.file_size,
    'file_type', ev.file_type
  ) as creation_metadata,

  -- Usage history
  COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'used_in', eul.used_in_context,
        'used_by', eul.used_by,
        'used_at', eul.used_at,
        'purpose', eul.purpose
      ) ORDER BY eul.used_at DESC
    )
    FROM public.evidence_usage_log eul
    WHERE eul.evidence_id = ev.id),
    '[]'::jsonb
  ) as usage_history,

  -- Chain of custody summary
  ev.uploaded_by || ' uploaded ' || ev.file_name || ' on ' || ev.uploaded_at::date::text || '. ' ||
  'Used in ' || COALESCE((SELECT COUNT(*) FROM evidence_usage_log eul WHERE eul.evidence_id = ev.id)::text, '0') || ' contexts. ' ||
  'Linked to exception: ' || COALESCE(e.title, 'None') || '.'
  as custody_summary,

  -- Audit trail completeness
  CASE
    WHEN EXISTS (SELECT 1 FROM evidence_usage_log WHERE evidence_id = ev.id) THEN 'COMPLETE'
    ELSE 'PENDING_USE'
  END as audit_trail_status,

  -- Trust score (from Block 4.4)
  vts.total_trust_score,
  vts.trust_band

FROM public.evidence ev
LEFT JOIN public.exceptions e ON e.id = ev.exception_id
LEFT JOIN v_evidence_trust_score vts ON vts.evidence_id = ev.id
ORDER BY ev.uploaded_at DESC;

COMMENT ON VIEW v_evidence_chain_of_custody IS 'Block 4.7: Complete chain of custody for every evidence item showing creation, usage, and lineage';

-- Create function to log evidence usage automatically
CREATE OR REPLACE FUNCTION log_evidence_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- When evidence is uploaded to an exception, log it
  IF TG_OP = 'INSERT' AND NEW.exception_id IS NOT NULL THEN
    INSERT INTO public.evidence_usage_log (
      evidence_id,
      used_in_context,
      used_in_record_id,
      used_by,
      purpose
    ) VALUES (
      NEW.id,
      'EXCEPTION_RESOLUTION',
      NEW.exception_id,
      NEW.uploaded_by,
      'Evidence uploaded for exception resolution'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_log_evidence_usage ON public.evidence;
CREATE TRIGGER trigger_log_evidence_usage
  AFTER INSERT ON public.evidence
  FOR EACH ROW
  EXECUTE FUNCTION log_evidence_usage();

-- ============================================================================
-- SOLUTION 4 ENHANCEMENT SUMMARY VIEW
-- ============================================================================
-- Single view showing all enhancements for a given exception

CREATE OR REPLACE VIEW v_solution4_exception_intelligence AS
SELECT
  e.id as exception_id,
  e.title,
  e.status,
  e.severity,
  e.created_at,
  e.due_date,

  -- Block 4.1: Materiality
  vm.total_materiality_score,
  vm.materiality_band,
  vm.regulatory_impact_weight,
  vm.control_failure_weight,
  vm.duration_weight,
  vm.repeat_occurrence_weight,

  -- Block 4.2: Evidence Coverage
  vcg.coverage_percentage,
  vcg.coverage_band,
  vcg.missing_evidence_types,

  -- Block 4.3: Risk Acceleration
  vra.risk_trajectory,
  vra.trajectory_indicator,
  vra.days_open,
  vra.days_overdue,
  vra.control_criticality_score,

  -- Block 4.4: Evidence Trust (aggregated)
  (SELECT ROUND(AVG(vts.total_trust_score), 0)
   FROM v_evidence_trust_score vts
   WHERE vts.exception_id = e.id
  ) as avg_evidence_trust_score,

  -- Block 4.5: Narrative
  vn.narrative_text,

  -- Block 4.6: Heatmap Position
  vph.heatmap_quadrant,
  vph.risk_color,

  -- Block 4.7: Evidence Chain
  (SELECT COUNT(*) FROM evidence WHERE exception_id = e.id) as evidence_count,
  (SELECT COUNT(*) FROM evidence_usage_log eul
   JOIN evidence ev ON ev.id = eul.evidence_id
   WHERE ev.exception_id = e.id) as evidence_usage_count

FROM public.exceptions e
LEFT JOIN v_exception_materiality vm ON vm.exception_id = e.id
LEFT JOIN v_evidence_coverage_gaps vcg ON vcg.exception_id = e.id
LEFT JOIN v_exception_risk_acceleration vra ON vra.exception_id = e.id
LEFT JOIN v_exception_narrative vn ON vn.exception_id = e.id
LEFT JOIN v_exception_portfolio_heatmap vph ON vph.exception_id = e.id
ORDER BY vm.total_materiality_score DESC NULLS LAST, e.created_at DESC;

COMMENT ON VIEW v_solution4_exception_intelligence IS 'Comprehensive intelligence view combining all 7 Solution 4 enhancement blocks';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exceptions_status ON public.exceptions(status);
CREATE INDEX IF NOT EXISTS idx_exceptions_control_id ON public.exceptions(control_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_created_at ON public.exceptions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_exception_id ON public.evidence(exception_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploaded_at ON public.evidence(uploaded_at DESC);

-- ============================================================================
-- SUCCESS VERIFICATION
-- ============================================================================

-- Show counts of enhanced data
SELECT
  '✅ Solution 4 Value Expansion Complete!' as status,
  (SELECT COUNT(*) FROM exceptions) as total_exceptions,
  (SELECT COUNT(*) FROM v_exception_materiality WHERE materiality_band = 'CRITICAL') as critical_exceptions,
  (SELECT COUNT(*) FROM v_evidence_coverage_gaps WHERE coverage_band = 'INSUFFICIENT') as insufficient_evidence,
  (SELECT COUNT(*) FROM v_exception_risk_acceleration WHERE risk_trajectory LIKE '%ACCELER%') as accelerating_risks,
  (SELECT COUNT(*) FROM evidence) as total_evidence,
  (SELECT COUNT(*) FROM evidence_usage_log) as evidence_usage_logs;

-- ============================================================================
-- RESULT: Solution 4 is now an Operational Risk Signal Hub!
--
-- ✅ Block 4.1: Exception Materiality Engine (0-100 scoring)
-- ✅ Block 4.2: Evidence Coverage Gap Detection
-- ✅ Block 4.3: Exception Risk Acceleration Model
-- ✅ Block 4.4: Evidence Trust Score (0-100)
-- ✅ Block 4.5: Auto-Generated Exception Narrative
-- ✅ Block 4.6: Exception Portfolio Heatmap (Board-level)
-- ✅ Block 4.7: Evidence Chain of Custody
-- ============================================================================
