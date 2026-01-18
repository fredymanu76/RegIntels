-- ============================================================================
-- REGINTELS STRATEGIC UPGRADE: ATTESTATION CONFIDENCE INDEX
-- ============================================================================
-- Purpose: Board-level insight into attestation quality
-- Measures confidence based on: Timeliness, Role Weight, Reliability, Exceptions
-- ============================================================================

-- 3️⃣ ATTESTATION CONFIDENCE INDEX VIEW
-- Answers: "How much confidence should we place in this control?"
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
    when a.submitted_at is null and now() > a.due_date then 0  -- Overdue
    when a.submitted_at is null then 30  -- Pending but not overdue
    when a.submitted_at <= a.due_date then 40  -- On time
    when a.submitted_at <= a.due_date + interval '7 days' then 25  -- Slightly late
    when a.submitted_at <= a.due_date + interval '14 days' then 15  -- Late
    else 5  -- Very late
  end as timeliness_score,

  -- Days late/early
  case
    when a.submitted_at is not null
    then extract(days from (a.submitted_at - a.due_date))
    else extract(days from (now() - a.due_date))
  end as days_delta,

  -- 2. ROLE WEIGHT SCORE (30% weight)
  case
    when a.attestor_role = 'SMF' then 30  -- Senior Management Function
    when a.attestor_role = 'Control Owner' or a.attestor_role = 'Owner' then 20
    when a.attestor_role = 'Deputy' or a.attestor_role = 'Delegate' then 10
    else 5  -- Other roles
  end as role_score,

  -- 3. HISTORICAL RELIABILITY SCORE (20% weight)
  -- Count of previous approved attestations by this attestor
  least(
    (select count(*)
     from attestations prev
     where prev.attestor_id = a.attestor_id
       and prev.status = 'approved'
       and prev.id != a.id) * 2,
    20
  ) as reliability_score,

  -- 4. EXCEPTION PENALTY (deduction)
  -- Recent exceptions reduce confidence
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

  -- Primary Confidence Driver (for UI)
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

-- Add helpful comment
comment on view v_attestation_confidence_index is
'RegIntels Attestation Confidence Index: Measures confidence in control attestations (0-100).
Based on timeliness, role weight, historical reliability, and exception penalties.';

-- ============================================================================
-- ATTESTATION CONFIDENCE SUMMARY (for dashboard)
-- ============================================================================
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

comment on view v_attestation_confidence_summary is
'Summary of attestation confidence across the organization';

-- ============================================================================
-- END OF ATTESTATION CONFIDENCE VIEWS
-- ============================================================================
