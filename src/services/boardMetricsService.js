/**
 * Board Metrics Service
 *
 * Computes all board-level metrics from the mockDatabase or Supabase data.
 * This service provides data for:
 * - ExceptionsOverviewBoard
 * - RegulatoryReadinessBoard
 * - AttestationsBoard
 * - AuditTrailBoard
 * - DecisionRegisterBoard
 * - ApprovalsBoard
 */

// ============================================================================
// EXCEPTION METRICS
// ============================================================================

/**
 * Calculate exception severity summary
 * Returns counts by severity level
 */
export function calculateExceptionSeveritySummary(exceptions) {
  const severityMap = {
    critical: { severity: 'critical', exception_count: 0, open_count: 0, closed_count: 0 },
    high: { severity: 'high', exception_count: 0, open_count: 0, closed_count: 0 },
    medium: { severity: 'medium', exception_count: 0, open_count: 0, closed_count: 0 },
    low: { severity: 'low', exception_count: 0, open_count: 0, closed_count: 0 }
  };

  exceptions.forEach(exc => {
    const severity = (exc.severity || 'medium').toLowerCase();
    if (severityMap[severity]) {
      severityMap[severity].exception_count++;
      if (exc.status === 'closed') {
        severityMap[severity].closed_count++;
      } else {
        severityMap[severity].open_count++;
      }
    }
  });

  // Return only severities that have exceptions
  return Object.values(severityMap).filter(s => s.exception_count > 0);
}

/**
 * Calculate exception aging analysis
 * Returns exceptions with age bucket classification
 */
export function calculateExceptionAgingAnalysis(exceptions) {
  const now = new Date();

  return exceptions
    .filter(exc => exc.status !== 'closed')
    .map(exc => {
      const openedAt = exc.identified_date || exc.opened_at || exc.created_at;
      const openDate = new Date(openedAt);
      const daysOpen = Math.floor((now - openDate) / (1000 * 60 * 60 * 24));

      let ageBucket;
      if (daysOpen > 90) ageBucket = '90+ days';
      else if (daysOpen > 60) ageBucket = '61-90 days';
      else if (daysOpen > 30) ageBucket = '31-60 days';
      else ageBucket = '0-30 days';

      return {
        exception_id: exc.id,
        title: exc.title,
        severity: exc.severity,
        opened_at: openedAt,
        days_open: daysOpen,
        age_bucket: ageBucket,
        status: exc.status,
        control_id: exc.control_id
      };
    })
    .sort((a, b) => b.days_open - a.days_open);
}

/**
 * Calculate exceptions by control
 * Returns exceptions grouped by their linked control
 */
export function calculateExceptionsByControl(exceptions, controls) {
  const controlMap = {};
  controls.forEach(ctrl => {
    controlMap[ctrl.control_code || ctrl.id] = {
      control_code: ctrl.control_code,
      control_title: ctrl.title
    };
  });

  return exceptions.map(exc => {
    const control = controlMap[exc.control_id] || {};
    return {
      exception_id: exc.id,
      control_code: control.control_code || exc.control_id,
      control_title: control.control_title || 'Unknown Control',
      exception_title: exc.title,
      severity: exc.severity,
      status: exc.status
    };
  });
}

// ============================================================================
// ATTESTATION METRICS
// ============================================================================

/**
 * Calculate attestation summary by status
 */
export function calculateAttestationSummary(attestations) {
  const summary = {
    total: attestations.length,
    approved: 0,
    pending: 0,
    overdue: 0,
    rejected: 0
  };

  const now = new Date();

  attestations.forEach(att => {
    if (att.status === 'approved') {
      summary.approved++;
    } else if (att.status === 'rejected') {
      summary.rejected++;
    } else if (att.status === 'pending') {
      // Check if overdue (pending for more than 7 days)
      const submittedDate = new Date(att.submitted_at);
      const daysPending = Math.floor((now - submittedDate) / (1000 * 60 * 60 * 24));
      if (daysPending > 7) {
        summary.overdue++;
      } else {
        summary.pending++;
      }
    }
  });

  return summary;
}

/**
 * Calculate attestation confidence bands
 */
export function calculateAttestationConfidenceBands(attestations) {
  const bands = {
    high: { band: 'HIGH_CONFIDENCE', count: 0, avg_score: 0, total_score: 0 },
    medium: { band: 'MEDIUM_CONFIDENCE', count: 0, avg_score: 0, total_score: 0 },
    low: { band: 'LOW_CONFIDENCE', count: 0, avg_score: 0, total_score: 0 }
  };

  attestations.forEach(att => {
    const score = att.confidence_score || 0;
    let band;
    if (score >= 85) band = 'high';
    else if (score >= 70) band = 'medium';
    else band = 'low';

    bands[band].count++;
    bands[band].total_score += score;
  });

  // Calculate averages
  Object.keys(bands).forEach(key => {
    if (bands[key].count > 0) {
      bands[key].avg_score = Math.round(bands[key].total_score / bands[key].count);
    }
  });

  return Object.values(bands).filter(b => b.count > 0);
}

/**
 * Get attestations with enriched control data
 */
export function getEnrichedAttestations(attestations, controls) {
  const controlMap = {};
  controls.forEach(ctrl => {
    controlMap[ctrl.control_code || ctrl.id] = ctrl;
  });

  return attestations.map(att => {
    const control = controlMap[att.control_id] || {};
    return {
      ...att,
      control_code: control.control_code || att.control_id,
      control_title: att.control_title || control.title,
      control_owner: control.owner,
      control_frequency: control.frequency
    };
  });
}

// ============================================================================
// REGULATORY READINESS METRICS
// ============================================================================

/**
 * Calculate regulatory change impact summary
 */
export function calculateRegChangesSummary(regChanges) {
  const summary = {
    total: regChanges.length,
    pending: 0,
    in_review: 0,
    actioned: 0,
    high_impact: 0,
    upcoming_deadlines: 0
  };

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  regChanges.forEach(change => {
    if (change.status === 'pending') summary.pending++;
    else if (change.status === 'in_review') summary.in_review++;
    else if (change.status === 'actioned') summary.actioned++;

    if (change.impact_rating === 'high') summary.high_impact++;

    const effectiveDate = new Date(change.effective_date);
    if (effectiveDate <= thirtyDaysFromNow && effectiveDate >= now) {
      summary.upcoming_deadlines++;
    }
  });

  return summary;
}

/**
 * Calculate regulatory readiness score
 */
export function calculateReadinessScore(regChanges, controls, attestations) {
  let totalScore = 0;
  let maxScore = 0;

  // Factor 1: Percentage of reg changes actioned (40 points max)
  const actionedChanges = regChanges.filter(c => c.status === 'actioned').length;
  const changeScore = regChanges.length > 0
    ? (actionedChanges / regChanges.length) * 40
    : 40;
  totalScore += changeScore;
  maxScore += 40;

  // Factor 2: Control effectiveness average (30 points max)
  const avgEffectiveness = controls.length > 0
    ? controls.reduce((sum, c) => sum + (c.effectiveness_rating || 0), 0) / controls.length
    : 0;
  const effectivenessScore = (avgEffectiveness / 100) * 30;
  totalScore += effectivenessScore;
  maxScore += 30;

  // Factor 3: Attestation approval rate (30 points max)
  const approvedAttestations = attestations.filter(a => a.status === 'approved').length;
  const attestationScore = attestations.length > 0
    ? (approvedAttestations / attestations.length) * 30
    : 30;
  totalScore += attestationScore;
  maxScore += 30;

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * Get regulatory changes with deadline proximity
 */
export function getRegChangesWithDeadlines(regChanges) {
  const now = new Date();

  return regChanges.map(change => {
    const effectiveDate = new Date(change.effective_date);
    const daysUntilDeadline = Math.ceil((effectiveDate - now) / (1000 * 60 * 60 * 24));

    let urgency;
    if (daysUntilDeadline < 0) urgency = 'OVERDUE';
    else if (daysUntilDeadline <= 30) urgency = 'CRITICAL';
    else if (daysUntilDeadline <= 90) urgency = 'HIGH';
    else if (daysUntilDeadline <= 180) urgency = 'MEDIUM';
    else urgency = 'LOW';

    return {
      ...change,
      days_until_deadline: daysUntilDeadline,
      urgency
    };
  }).sort((a, b) => a.days_until_deadline - b.days_until_deadline);
}

// ============================================================================
// CONTROL DRIFT METRICS
// ============================================================================

/**
 * Calculate control drift scores
 */
export function calculateControlDriftScores(controls, attestations, exceptions) {
  return controls.map(control => {
    // Get related attestations
    const controlAttestations = attestations.filter(a => a.control_id === control.control_code || a.control_id === control.id);
    const latestAttestation = controlAttestations.sort((a, b) =>
      new Date(b.submitted_at) - new Date(a.submitted_at)
    )[0];

    // Get related exceptions
    const controlExceptions = exceptions.filter(e => e.control_id === control.control_code || e.control_id === control.id);
    const openExceptions = controlExceptions.filter(e => e.status !== 'closed').length;

    // Calculate days since last review
    const now = new Date();
    const lastReviewDate = latestAttestation ? new Date(latestAttestation.submitted_at) : null;
    const daysSinceReview = lastReviewDate
      ? Math.floor((now - lastReviewDate) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate drift score (0-100, higher = more drift)
    let driftScore = 0;

    // Factor 1: Days since review (up to 40 points)
    if (daysSinceReview > 90) driftScore += 40;
    else if (daysSinceReview > 60) driftScore += 30;
    else if (daysSinceReview > 30) driftScore += 20;
    else driftScore += 10;

    // Factor 2: Open exceptions (up to 30 points)
    driftScore += Math.min(openExceptions * 10, 30);

    // Factor 3: Effectiveness decline (up to 30 points)
    const effectivenessGap = 100 - (control.effectiveness_rating || 0);
    driftScore += Math.round((effectivenessGap / 100) * 30);

    // Determine drift status
    let driftStatus;
    if (driftScore >= 70) driftStatus = 'CRITICAL_DRIFT';
    else if (driftScore >= 50) driftStatus = 'MATERIAL_DRIFT';
    else if (driftScore >= 30) driftStatus = 'EMERGING_DRIFT';
    else driftStatus = 'STABLE';

    // Determine primary driver
    let driftDriver;
    if (daysSinceReview > 90) driftDriver = 'Overdue Review';
    else if (openExceptions >= 2) driftDriver = 'Multiple Exceptions';
    else if (openExceptions === 1) driftDriver = 'Open Exception';
    else if (control.effectiveness_rating < 70) driftDriver = 'Low Effectiveness';
    else driftDriver = 'On Track';

    return {
      control_id: control.id,
      control_code: control.control_code,
      control_title: control.title,
      drift_score: driftScore,
      drift_status: driftStatus,
      drift_driver: driftDriver,
      days_since_review: daysSinceReview,
      open_exceptions_count: openExceptions,
      effectiveness_rating: control.effectiveness_rating,
      owner: control.owner,
      urgency_level: driftScore >= 70 ? 'IMMEDIATE' : driftScore >= 50 ? 'HIGH' : driftScore >= 30 ? 'MEDIUM' : 'LOW',
      review_delay_days: Math.max(0, daysSinceReview - 30),
      failed_runs_count: controlAttestations.filter(a => a.status === 'rejected').length
    };
  }).sort((a, b) => b.drift_score - a.drift_score);
}

/**
 * Calculate drift summary by status
 */
export function calculateDriftSummary(driftScores) {
  const summary = {};

  driftScores.forEach(score => {
    if (!summary[score.drift_status]) {
      summary[score.drift_status] = {
        drift_status: score.drift_status,
        control_count: 0,
        total_drift_score: 0,
        avg_drift_score: 0,
        total_failed_runs: 0
      };
    }
    summary[score.drift_status].control_count++;
    summary[score.drift_status].total_drift_score += score.drift_score;
    summary[score.drift_status].total_failed_runs += score.failed_runs_count;
  });

  // Calculate averages
  Object.values(summary).forEach(s => {
    s.avg_drift_score = Math.round(s.total_drift_score / s.control_count);
  });

  return Object.values(summary);
}

// ============================================================================
// DECISION REGISTER METRICS
// ============================================================================

/**
 * Get decisions with status enrichment
 */
export function getEnrichedDecisions(decisions) {
  const now = new Date();

  return decisions.map(decision => {
    const expiryDate = decision.expiry_date ? new Date(decision.expiry_date) : null;
    const daysUntilExpiry = expiryDate
      ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
      : null;

    let expiryStatus;
    if (!expiryDate) expiryStatus = 'NO_EXPIRY';
    else if (daysUntilExpiry < 0) expiryStatus = 'EXPIRED';
    else if (daysUntilExpiry <= 30) expiryStatus = 'EXPIRING_SOON';
    else expiryStatus = 'ACTIVE';

    return {
      ...decision,
      days_until_expiry: daysUntilExpiry,
      expiry_status: expiryStatus
    };
  });
}

/**
 * Calculate decision summary
 */
export function calculateDecisionSummary(decisions) {
  return {
    total: decisions.length,
    approved: decisions.filter(d => d.status === 'approved').length,
    pending: decisions.filter(d => d.status === 'pending').length,
    rejected: decisions.filter(d => d.status === 'rejected').length,
    risk_acceptances: decisions.filter(d => d.decision_type === 'Risk Acceptance').length,
    timeline_extensions: decisions.filter(d => d.decision_type === 'Timeline Extension').length
  };
}

// ============================================================================
// APPROVALS METRICS
// ============================================================================

/**
 * Get approvals with urgency classification
 */
export function getEnrichedApprovals(approvals) {
  const now = new Date();

  return approvals.map(approval => {
    const dueDate = approval.due_date ? new Date(approval.due_date) : null;
    const daysUntilDue = dueDate
      ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
      : null;

    let urgency;
    if (!dueDate) urgency = 'NORMAL';
    else if (daysUntilDue < 0) urgency = 'OVERDUE';
    else if (daysUntilDue <= 3) urgency = 'URGENT';
    else if (daysUntilDue <= 7) urgency = 'HIGH';
    else urgency = 'NORMAL';

    return {
      ...approval,
      days_until_due: daysUntilDue,
      urgency
    };
  }).sort((a, b) => (a.days_until_due || 999) - (b.days_until_due || 999));
}

/**
 * Calculate approval summary
 */
export function calculateApprovalSummary(approvals) {
  const now = new Date();

  return {
    total: approvals.length,
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    overdue: approvals.filter(a => {
      if (a.status !== 'pending' || !a.due_date) return false;
      return new Date(a.due_date) < now;
    }).length
  };
}

// ============================================================================
// AUDIT TRAIL METRICS
// ============================================================================

/**
 * Get audit trail with enriched data
 */
export function getEnrichedAuditTrail(auditTrail) {
  return auditTrail.map(entry => {
    const timestamp = new Date(entry.timestamp);
    const now = new Date();
    const hoursAgo = Math.floor((now - timestamp) / (1000 * 60 * 60));

    let timeAgo;
    if (hoursAgo < 1) timeAgo = 'Just now';
    else if (hoursAgo < 24) timeAgo = `${hoursAgo}h ago`;
    else {
      const daysAgo = Math.floor(hoursAgo / 24);
      timeAgo = `${daysAgo}d ago`;
    }

    return {
      ...entry,
      time_ago: timeAgo,
      formatted_timestamp: timestamp.toLocaleString()
    };
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Calculate audit trail summary by action type
 */
export function calculateAuditSummary(auditTrail) {
  const summary = {};

  auditTrail.forEach(entry => {
    const action = entry.action;
    if (!summary[action]) {
      summary[action] = { action, count: 0 };
    }
    summary[action].count++;
  });

  return Object.values(summary);
}

// ============================================================================
// POLICY METRICS
// ============================================================================

/**
 * Calculate policy status summary
 */
export function calculatePolicySummary(policies) {
  return {
    total: policies.length,
    approved: policies.filter(p => p.status === 'approved').length,
    draft: policies.filter(p => p.status === 'draft').length,
    under_review: policies.filter(p => p.status === 'under_review').length,
    pending_approval: policies.filter(p => p.status === 'pending_approval').length,
    archived: policies.filter(p => p.status === 'archived').length
  };
}

/**
 * Get policies with review status
 */
export function getPoliciesWithReviewStatus(policies) {
  const now = new Date();

  return policies.map(policy => {
    const nextReviewDate = policy.next_review_date ? new Date(policy.next_review_date) : null;
    const daysUntilReview = nextReviewDate
      ? Math.ceil((nextReviewDate - now) / (1000 * 60 * 60 * 24))
      : null;

    let reviewStatus;
    if (!nextReviewDate) reviewStatus = 'NO_REVIEW_DATE';
    else if (daysUntilReview < 0) reviewStatus = 'OVERDUE';
    else if (daysUntilReview <= 30) reviewStatus = 'DUE_SOON';
    else if (daysUntilReview <= 90) reviewStatus = 'UPCOMING';
    else reviewStatus = 'ON_TRACK';

    return {
      ...policy,
      days_until_review: daysUntilReview,
      review_status: reviewStatus
    };
  });
}

// ============================================================================
// MASTER BOARD METRICS CALCULATOR
// ============================================================================

/**
 * Calculate all board metrics from raw data
 * This is the main function to call when you have all the raw data
 */
export function calculateAllBoardMetrics(data) {
  const { policies, regChanges, controls, attestations, exceptions, decisions, approvals, auditTrail } = data;

  return {
    // Exception metrics
    exceptionSeveritySummary: calculateExceptionSeveritySummary(exceptions || []),
    exceptionAgingAnalysis: calculateExceptionAgingAnalysis(exceptions || []),
    exceptionsByControl: calculateExceptionsByControl(exceptions || [], controls || []),

    // Attestation metrics
    attestationSummary: calculateAttestationSummary(attestations || []),
    attestationConfidenceBands: calculateAttestationConfidenceBands(attestations || []),
    enrichedAttestations: getEnrichedAttestations(attestations || [], controls || []),

    // Regulatory readiness metrics
    regChangesSummary: calculateRegChangesSummary(regChanges || []),
    readinessScore: calculateReadinessScore(regChanges || [], controls || [], attestations || []),
    regChangesWithDeadlines: getRegChangesWithDeadlines(regChanges || []),

    // Control drift metrics
    controlDriftScores: calculateControlDriftScores(controls || [], attestations || [], exceptions || []),
    driftSummary: calculateDriftSummary(
      calculateControlDriftScores(controls || [], attestations || [], exceptions || [])
    ),

    // Decision metrics
    enrichedDecisions: getEnrichedDecisions(decisions || []),
    decisionSummary: calculateDecisionSummary(decisions || []),

    // Approval metrics
    enrichedApprovals: getEnrichedApprovals(approvals || []),
    approvalSummary: calculateApprovalSummary(approvals || []),

    // Audit trail metrics
    enrichedAuditTrail: getEnrichedAuditTrail(auditTrail || []),
    auditSummary: calculateAuditSummary(auditTrail || []),

    // Policy metrics
    policySummary: calculatePolicySummary(policies || []),
    policiesWithReviewStatus: getPoliciesWithReviewStatus(policies || [])
  };
}

export default {
  // Exception functions
  calculateExceptionSeveritySummary,
  calculateExceptionAgingAnalysis,
  calculateExceptionsByControl,

  // Attestation functions
  calculateAttestationSummary,
  calculateAttestationConfidenceBands,
  getEnrichedAttestations,

  // Regulatory readiness functions
  calculateRegChangesSummary,
  calculateReadinessScore,
  getRegChangesWithDeadlines,

  // Control drift functions
  calculateControlDriftScores,
  calculateDriftSummary,

  // Decision functions
  getEnrichedDecisions,
  calculateDecisionSummary,

  // Approval functions
  getEnrichedApprovals,
  calculateApprovalSummary,

  // Audit trail functions
  getEnrichedAuditTrail,
  calculateAuditSummary,

  // Policy functions
  calculatePolicySummary,
  getPoliciesWithReviewStatus,

  // Master function
  calculateAllBoardMetrics
};
