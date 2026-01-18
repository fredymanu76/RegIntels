-- ============================================================================
-- REGINTELS STRATEGIC UPGRADE: CONTROL DRIFT MODEL
-- ============================================================================
-- Purpose: Early-warning compliance intelligence system
-- Detects when controls fall behind regulatory change velocity
-- ============================================================================

-- 2️⃣ CONTROL DRIFT INDEX VIEW
-- Answers: "Are controls falling behind regulation?"
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
    -- Critical Drift: Review overdue by >90 days OR failed attestations + pending high-impact changes
    when (now() - c.last_reviewed_at > interval '90 days')
      or (count(distinct case when att.status = 'failed' then att.id end) > 0
          and count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) > 0)
    then 'CRITICAL_DRIFT'

    -- Material Drift: Review overdue by 31-90 days OR multiple failed controls
    when (now() - c.last_reviewed_at > interval '30 days')
      or count(distinct case when att.status = 'failed' then att.id end) > 1
    then 'MATERIAL_DRIFT'

    -- Emerging Drift: Approaching review date OR has pending changes
    when (c.next_review_date - now() < interval '30 days')
      or count(distinct case when rc.status = 'pending' then rc.id end) > 0
    then 'EMERGING_DRIFT'

    -- Stable: On track
    else 'STABLE'
  end as drift_status,

  -- Drift Score (0-100, higher = worse)
  least(100,
    -- Base score from delay
    case
      when now() - c.last_reviewed_at > interval '90 days' then 50
      when now() - c.last_reviewed_at > interval '30 days' then 30
      else 10
    end
    -- Add penalties
    + (count(distinct case when att.status = 'failed' then att.id end) * 15)
    + (count(distinct case when rc.status = 'pending' and rc.materiality = 'high' then rc.id end) * 10)
    + (count(distinct case when ex.status = 'open' then ex.id end) * 5)
  ) as drift_score,

  -- Primary Drift Driver (for UI)
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

-- Add helpful comment
comment on view v_control_drift_index is
'RegIntels Control Drift Model: Early-warning system detecting when controls fall behind regulatory change velocity.
Classifies drift as: Stable, Emerging, Material, or Critical.';

-- ============================================================================
-- CONTROL DRIFT SUMMARY (for dashboard)
-- ============================================================================
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

comment on view v_control_drift_summary is
'Summary of control drift across the organization';

-- ============================================================================
-- END OF CONTROL DRIFT VIEWS
-- ============================================================================
