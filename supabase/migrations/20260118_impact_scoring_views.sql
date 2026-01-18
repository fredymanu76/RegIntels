-- ============================================================================
-- REGINTELS STRATEGIC UPGRADE: IMPACT SCORING SYSTEM
-- ============================================================================
-- Purpose: Quantified Regulatory Exposure Index (0-100 scale)
-- Components: Regulatory Severity + Business Surface + Control Gaps +
--             Execution Risk + Attestation Confidence
-- ============================================================================

-- 1️⃣ REGULATORY IMPACT SCORE VIEW
-- Provides board-grade, audit-defensible impact scoring
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
  -- More affected controls = higher surface area
  least(count(distinct rccm.control_id) * 5, 20) as surface_area_score,

  -- 3. Control Coverage Gap Score (25% weight)
  -- Missing sign-offs indicate gaps
  case
    when count(cs.id) = 0 then 25
    else 0
  end as control_gap_score,

  -- 4. Execution Risk Score (15% weight)
  -- Overdue actions indicate execution problems
  least(
    sum(case when act.status = 'overdue' then 1 else 0 end) * 5,
    15
  ) as execution_risk_score,

  -- 5. Attestation Confidence Penalty (10% weight)
  -- Unapproved attestations reduce confidence
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

  -- Impact Drivers (for UI explanation)
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

-- Add helpful comment
comment on view v_regulatory_impact_score is
'RegIntels Impact Score: Quantified Regulatory Exposure Index (0-100).
Combines regulatory severity, business surface area, control gaps, execution risk, and attestation confidence.';

-- ============================================================================
-- END OF IMPACT SCORING VIEW
-- ============================================================================
