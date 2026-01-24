-- ============================================================================
-- DROP EXISTING VIEWS AND RECREATE - FIX FOR COLUMN NAME CONFLICT
-- ============================================================================
-- This drops any existing views first, then recreates them
-- Run this if you get "cannot change name of view column" errors
-- ============================================================================

-- Drop all strategic views if they exist (in correct order due to dependencies)
DROP VIEW IF EXISTS v_attestation_confidence_summary CASCADE;
DROP VIEW IF EXISTS v_attestation_confidence_index CASCADE;
DROP VIEW IF EXISTS v_control_drift_summary CASCADE;
DROP VIEW IF EXISTS v_control_drift_index CASCADE;
DROP VIEW IF EXISTS v_regulatory_impact_score CASCADE;
DROP VIEW IF EXISTS v_change_action_tracker CASCADE;

-- ============================================================================
-- NOW RECREATE ALL VIEWS
-- ============================================================================

-- ============================================================================
-- PART 1: HELPER VIEW - Action Tracker
-- ============================================================================

CREATE OR REPLACE VIEW v_change_action_tracker AS
SELECT
  ra.id as action_id,
  ra.exception_id,
  e.source_id as change_id,
  ra.action as action_title,
  ra.owner_user_id as assigned_to,
  ra.status,
  ra.due_date,
  ra.completed_at,
  CASE
    WHEN ra.status = 'completed' THEN 'completed'
    WHEN ra.due_date < CURRENT_DATE AND ra.status != 'completed' THEN 'overdue'
    WHEN ra.status = 'in_progress' THEN 'in_progress'
    ELSE 'pending'
  END as computed_status,
  CASE
    WHEN ra.due_date < CURRENT_DATE AND ra.status != 'completed'
    THEN CURRENT_DATE - ra.due_date
    ELSE 0
  END as days_overdue
FROM remediation_actions ra
LEFT JOIN exceptions e ON e.id = ra.exception_id
WHERE e.source_type = 'regulatory_change' OR e.source_type IS NULL;

COMMENT ON VIEW v_change_action_tracker IS
'Action tracker for regulatory changes - maps remediation_actions to changes via exceptions';

-- ============================================================================
-- PART 2: IMPACT SCORING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_regulatory_impact_score AS
SELECT
  rc.id as change_id,
  rc.title as change_title,
  rc.materiality,
  rc.source as regulator,
  rc.created_at as published_at,
  rc.status,

  -- 1. Regulatory Severity Score (30% weight)
  CASE
    WHEN rc.materiality = 'high' THEN 30
    WHEN rc.materiality = 'medium' THEN 20
    ELSE 10
  END as severity_score,

  -- 2. Business Surface Area Score (20% weight)
  LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20) as surface_area_score,

  -- 3. Control Coverage Gap Score (25% weight)
  CASE
    WHEN COUNT(DISTINCT CASE WHEN rccm.review_required = true AND rccm.reviewed = false THEN rccm.id END) > 0 THEN 25
    ELSE 0
  END as control_gap_score,

  -- 4. Execution Risk Score (15% weight)
  LEAST(
    COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) * 5,
    15
  ) as execution_risk_score,

  -- 5. Attestation Confidence Penalty (10% weight)
  CASE
    WHEN COUNT(DISTINCT CASE WHEN cr.status IN ('failed', 'pending') THEN cr.id END) > 0 THEN 10
    ELSE 0
  END as attestation_penalty,

  -- TOTAL IMPACT SCORE (0-100)
  (
    CASE
      WHEN rc.materiality = 'high' THEN 30
      WHEN rc.materiality = 'medium' THEN 20
      ELSE 10
    END
    + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
    + CASE WHEN COUNT(DISTINCT CASE WHEN rccm.review_required = true AND rccm.reviewed = false THEN rccm.id END) > 0 THEN 25 ELSE 0 END
    + LEAST(COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) * 5, 15)
    + CASE WHEN COUNT(DISTINCT CASE WHEN cr.status IN ('failed', 'pending') THEN cr.id END) > 0 THEN 10 ELSE 0 END
  ) as total_impact_score,

  -- Risk Band Classification
  CASE
    WHEN (
      CASE WHEN rc.materiality = 'high' THEN 30 WHEN rc.materiality = 'medium' THEN 20 ELSE 10 END
      + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
      + CASE WHEN COUNT(DISTINCT CASE WHEN rccm.review_required = true AND rccm.reviewed = false THEN rccm.id END) > 0 THEN 25 ELSE 0 END
      + LEAST(COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) * 5, 15)
      + CASE WHEN COUNT(DISTINCT CASE WHEN cr.status IN ('failed', 'pending') THEN cr.id END) > 0 THEN 10 ELSE 0 END
    ) >= 61 THEN 'CRITICAL'
    WHEN (
      CASE WHEN rc.materiality = 'high' THEN 30 WHEN rc.materiality = 'medium' THEN 20 ELSE 10 END
      + LEAST(COUNT(DISTINCT rccm.control_id) * 5, 20)
      + CASE WHEN COUNT(DISTINCT CASE WHEN rccm.review_required = true AND rccm.reviewed = false THEN rccm.id END) > 0 THEN 25 ELSE 0 END
      + LEAST(COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) * 5, 15)
      + CASE WHEN COUNT(DISTINCT CASE WHEN cr.status IN ('failed', 'pending') THEN cr.id END) > 0 THEN 10 ELSE 0 END
    ) >= 31 THEN 'HIGH'
    ELSE 'MODERATE'
  END as risk_band,

  -- Impact Drivers
  CASE
    WHEN COUNT(DISTINCT CASE WHEN rccm.review_required = true AND rccm.reviewed = false THEN rccm.id END) > 0 THEN 'Missing control reviews'
    WHEN COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) > 0 THEN 'Overdue remediation actions'
    WHEN COUNT(DISTINCT CASE WHEN cr.status IN ('failed', 'pending') THEN cr.id END) > 0 THEN 'Pending control runs'
    ELSE 'Regulatory severity'
  END as primary_driver,

  -- Metadata
  COUNT(DISTINCT rccm.control_id) as affected_controls_count,
  COUNT(DISTINCT CASE WHEN rccm.reviewed = true THEN rccm.id END) as reviewed_controls_count,
  COALESCE(SUM(CASE WHEN act.computed_status = 'overdue' THEN 1 ELSE 0 END), 0) as overdue_actions_count

FROM regulatory_changes rc
LEFT JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
LEFT JOIN control_runs cr ON cr.control_id = rccm.control_id
LEFT JOIN v_change_action_tracker act ON act.change_id = rc.id
GROUP BY rc.id, rc.title, rc.materiality, rc.source, rc.created_at, rc.status;

COMMENT ON VIEW v_regulatory_impact_score IS
'RegIntels Impact Score: Quantified Regulatory Exposure Index (0-100).';

-- ============================================================================
-- PART 3: CONTROL DRIFT VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_control_drift_index AS
SELECT
  c.id as control_id,
  c.control_code,
  c.title as control_title,
  c.owner_role as control_owner,
  c.last_run_at as last_reviewed_at,
  c.next_due_at as next_review_date,

  MAX(rc.created_at) as last_reg_change_date,

  NOW() - c.last_run_at as review_delay_interval,
  EXTRACT(days FROM (NOW() - COALESCE(c.last_run_at, c.created_at))) as review_delay_days,

  c.next_due_at - NOW() as time_to_next_review,
  EXTRACT(days FROM (COALESCE(c.next_due_at, CURRENT_DATE + INTERVAL '999 days') - NOW())) as days_to_next_review,

  COUNT(DISTINCT CASE WHEN rc.status = 'open' THEN rc.id END) as pending_changes_count,

  COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) as failed_runs_count,

  COUNT(DISTINCT CASE WHEN ex.status = 'open' AND ex.source_type = 'control' THEN ex.id END) as open_exceptions_count,

  CASE
    WHEN (NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '90 days')
      OR (COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) > 0
          AND COUNT(DISTINCT CASE WHEN rc.status = 'open' AND rc.materiality = 'high' THEN rc.id END) > 0)
    THEN 'CRITICAL_DRIFT'

    WHEN (NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) > 1
    THEN 'MATERIAL_DRIFT'

    WHEN (COALESCE(c.next_due_at, CURRENT_DATE + INTERVAL '999 days') - NOW() < INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN rc.status = 'open' THEN rc.id END) > 0
    THEN 'EMERGING_DRIFT'

    ELSE 'STABLE'
  END as drift_status,

  LEAST(100,
    CASE
      WHEN NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '90 days' THEN 50
      WHEN NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '30 days' THEN 30
      ELSE 10
    END
    + (COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) * 15)
    + (COUNT(DISTINCT CASE WHEN rc.status = 'open' AND rc.materiality = 'high' THEN rc.id END) * 10)
    + (COUNT(DISTINCT CASE WHEN ex.status = 'open' AND ex.source_type = 'control' THEN ex.id END) * 5)
  ) as drift_score,

  CASE
    WHEN COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) > 0
      THEN 'Failed control runs'
    WHEN NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '90 days'
      THEN 'Overdue review (>90 days)'
    WHEN COUNT(DISTINCT CASE WHEN rc.status = 'open' AND rc.materiality = 'high' THEN rc.id END) > 0
      THEN 'High-impact pending changes'
    WHEN COUNT(DISTINCT CASE WHEN ex.status = 'open' AND ex.source_type = 'control' THEN ex.id END) > 0
      THEN 'Open exceptions'
    ELSE 'Approaching review date'
  END as drift_driver,

  CASE
    WHEN (NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '90 days')
      OR (COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) > 0
          AND COUNT(DISTINCT CASE WHEN rc.status = 'open' AND rc.materiality = 'high' THEN rc.id END) > 0)
    THEN 'URGENT'
    WHEN (NOW() - COALESCE(c.last_run_at, c.created_at) > INTERVAL '30 days')
      OR COUNT(DISTINCT CASE WHEN cr.status = 'failed' THEN cr.id END) > 1
    THEN 'ATTENTION_NEEDED'
    ELSE 'MONITOR'
  END as urgency_level

FROM control_library c
LEFT JOIN regulatory_change_control_map rccm ON rccm.control_id = c.id
LEFT JOIN regulatory_changes rc ON rc.id = rccm.regulatory_change_id
LEFT JOIN control_runs cr ON cr.control_id = c.id
LEFT JOIN exceptions ex ON ex.source_id = c.id AND ex.source_type = 'control'
GROUP BY
  c.id,
  c.control_code,
  c.title,
  c.owner_role,
  c.last_run_at,
  c.next_due_at,
  c.created_at;

COMMENT ON VIEW v_control_drift_index IS
'RegIntels Control Drift Model: Early-warning system detecting when controls fall behind regulatory change velocity.';

CREATE OR REPLACE VIEW v_control_drift_summary AS
SELECT
  drift_status,
  COUNT(*) as control_count,
  AVG(drift_score) as avg_drift_score,
  SUM(pending_changes_count) as total_pending_changes,
  SUM(failed_runs_count) as total_failed_runs,
  SUM(open_exceptions_count) as total_open_exceptions
FROM v_control_drift_index
GROUP BY drift_status;

COMMENT ON VIEW v_control_drift_summary IS 'Summary of control drift across the organization';

-- ============================================================================
-- PART 4: ATTESTATION CONFIDENCE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_attestation_confidence_index AS
SELECT
  cr.id as attestation_id,
  cr.control_id,
  c.control_code,
  c.title as control_title,
  cr.performed_by as attestor_id,
  COALESCE(c.owner_role, 'Other') as attestor_role,
  cr.status,
  cr.due_date,
  cr.performed_at as submitted_at,

  CASE
    WHEN cr.performed_at IS NULL AND NOW() > cr.due_date THEN 0
    WHEN cr.performed_at IS NULL THEN 30
    WHEN cr.performed_at::date <= cr.due_date THEN 40
    WHEN cr.performed_at::date <= cr.due_date + INTERVAL '7 days' THEN 25
    WHEN cr.performed_at::date <= cr.due_date + INTERVAL '14 days' THEN 15
    ELSE 5
  END as timeliness_score,

  CASE
    WHEN cr.performed_at IS NOT NULL
    THEN EXTRACT(days FROM (cr.performed_at::date - cr.due_date))
    ELSE EXTRACT(days FROM (NOW()::date - cr.due_date))
  END as days_delta,

  CASE
    WHEN c.owner_role ILIKE '%SMF%' THEN 30
    WHEN c.owner_role ILIKE '%owner%' THEN 20
    WHEN c.owner_role ILIKE '%deputy%' OR c.owner_role ILIKE '%delegate%' THEN 10
    ELSE 5
  END as role_score,

  LEAST(
    (SELECT COUNT(*)
     FROM control_runs prev
     WHERE prev.performed_by = cr.performed_by
       AND prev.status = 'completed'
       AND prev.id != cr.id) * 2,
    20
  ) as reliability_score,

  CASE
    WHEN EXISTS (
      SELECT 1 FROM exceptions ex
      WHERE ex.source_id = cr.control_id
        AND ex.source_type = 'control'
        AND ex.status = 'open'
        AND ex.opened_at > NOW() - INTERVAL '90 days'
    ) THEN -15
    ELSE 0
  END as exception_penalty,

  GREATEST(0,
    CASE
      WHEN cr.performed_at IS NULL AND NOW() > cr.due_date THEN 0
      WHEN cr.performed_at IS NULL THEN 30
      WHEN cr.performed_at::date <= cr.due_date THEN 40
      WHEN cr.performed_at::date <= cr.due_date + INTERVAL '7 days' THEN 25
      WHEN cr.performed_at::date <= cr.due_date + INTERVAL '14 days' THEN 15
      ELSE 5
    END
    +
    CASE
      WHEN c.owner_role ILIKE '%SMF%' THEN 30
      WHEN c.owner_role ILIKE '%owner%' THEN 20
      WHEN c.owner_role ILIKE '%deputy%' OR c.owner_role ILIKE '%delegate%' THEN 10
      ELSE 5
    END
    +
    LEAST(
      (SELECT COUNT(*)
       FROM control_runs prev
       WHERE prev.performed_by = cr.performed_by
         AND prev.status = 'completed'
         AND prev.id != cr.id) * 2,
      20
    )
    +
    CASE
      WHEN EXISTS (
        SELECT 1 FROM exceptions ex
        WHERE ex.source_id = cr.control_id
          AND ex.source_type = 'control'
          AND ex.status = 'open'
          AND ex.opened_at > NOW() - INTERVAL '90 days'
      ) THEN -15
      ELSE 0
    END
  ) as confidence_score,

  CASE
    WHEN GREATEST(0,
      CASE
        WHEN cr.performed_at IS NULL AND NOW() > cr.due_date THEN 0
        WHEN cr.performed_at IS NULL THEN 30
        WHEN cr.performed_at::date <= cr.due_date THEN 40
        WHEN cr.performed_at::date <= cr.due_date + INTERVAL '7 days' THEN 25
        WHEN cr.performed_at::date <= cr.due_date + INTERVAL '14 days' THEN 15
        ELSE 5
      END
      + CASE
          WHEN c.owner_role ILIKE '%SMF%' THEN 30
          WHEN c.owner_role ILIKE '%owner%' THEN 20
          WHEN c.owner_role ILIKE '%deputy%' OR c.owner_role ILIKE '%delegate%' THEN 10
          ELSE 5
        END
      + LEAST((SELECT COUNT(*) FROM control_runs prev
               WHERE prev.performed_by = cr.performed_by
                 AND prev.status = 'completed'
                 AND prev.id != cr.id) * 2, 20)
      + CASE
          WHEN EXISTS (SELECT 1 FROM exceptions ex
                       WHERE ex.source_id = cr.control_id
                         AND ex.source_type = 'control'
                         AND ex.status = 'open'
                         AND ex.opened_at > NOW() - INTERVAL '90 days')
          THEN -15
          ELSE 0
        END
    ) >= 70 THEN 'HIGH_CONFIDENCE'
    WHEN GREATEST(0,
      CASE
        WHEN cr.performed_at IS NULL AND NOW() > cr.due_date THEN 0
        WHEN cr.performed_at IS NULL THEN 30
        WHEN cr.performed_at::date <= cr.due_date THEN 40
        WHEN cr.performed_at::date <= cr.due_date + INTERVAL '7 days' THEN 25
        WHEN cr.performed_at::date <= cr.due_date + INTERVAL '14 days' THEN 15
        ELSE 5
      END
      + CASE
          WHEN c.owner_role ILIKE '%SMF%' THEN 30
          WHEN c.owner_role ILIKE '%owner%' THEN 20
          WHEN c.owner_role ILIKE '%deputy%' OR c.owner_role ILIKE '%delegate%' THEN 10
          ELSE 5
        END
      + LEAST((SELECT COUNT(*) FROM control_runs prev
               WHERE prev.performed_by = cr.performed_by
                 AND prev.status = 'completed'
                 AND prev.id != cr.id) * 2, 20)
      + CASE
          WHEN EXISTS (SELECT 1 FROM exceptions ex
                       WHERE ex.source_id = cr.control_id
                         AND ex.source_type = 'control'
                         AND ex.status = 'open'
                         AND ex.opened_at > NOW() - INTERVAL '90 days')
          THEN -15
          ELSE 0
        END
    ) >= 40 THEN 'MEDIUM_CONFIDENCE'
    ELSE 'LOW_CONFIDENCE'
  END as confidence_band,

  CASE
    WHEN cr.performed_at IS NULL AND NOW() > cr.due_date THEN 'Overdue control run'
    WHEN cr.performed_at IS NULL THEN 'Pending control run'
    WHEN EXISTS (
      SELECT 1 FROM exceptions ex
      WHERE ex.source_id = cr.control_id
        AND ex.source_type = 'control'
        AND ex.status = 'open'
        AND ex.opened_at > NOW() - INTERVAL '90 days'
    ) THEN 'Recent exceptions'
    WHEN c.owner_role NOT ILIKE '%SMF%' AND c.owner_role NOT ILIKE '%owner%' THEN 'Low role authority'
    WHEN cr.performed_at::date > cr.due_date + INTERVAL '7 days' THEN 'Late submission'
    ELSE 'Strong control run profile'
  END as confidence_driver,

  (SELECT COUNT(*)
   FROM control_runs prev
   WHERE prev.performed_by = cr.performed_by
     AND prev.status = 'completed') as total_completed_count,

  (SELECT COUNT(*)
   FROM control_runs prev
   WHERE prev.performed_by = cr.performed_by
     AND prev.performed_at::date > prev.due_date) as total_late_count,

  (SELECT COUNT(*)
   FROM exceptions ex
   WHERE ex.source_id = cr.control_id
     AND ex.source_type = 'control'
     AND ex.status = 'open') as open_exceptions_count

FROM control_runs cr
JOIN control_library c ON c.id = cr.control_id;

COMMENT ON VIEW v_attestation_confidence_index IS
'RegIntels Attestation Confidence Index: Measures confidence in control runs (0-100).';

CREATE OR REPLACE VIEW v_attestation_confidence_summary AS
SELECT
  confidence_band,
  COUNT(*) as run_count,
  AVG(confidence_score) as avg_confidence_score,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
  SUM(CASE WHEN days_delta > 0 THEN 1 ELSE 0 END) as late_count,
  SUM(open_exceptions_count) as total_exceptions
FROM v_attestation_confidence_index
GROUP BY confidence_band;

COMMENT ON VIEW v_attestation_confidence_summary IS 'Summary of control run confidence across the organization';

-- ============================================================================
-- SUCCESS! All views created
-- ============================================================================
-- Test with:
-- SELECT * FROM v_regulatory_impact_score;
-- SELECT * FROM v_control_drift_index;
-- SELECT * FROM v_attestation_confidence_index;
-- ============================================================================
