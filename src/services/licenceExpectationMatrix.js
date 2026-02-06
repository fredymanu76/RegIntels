// ============================================================================
// LICENCE EXPECTATION MATRIX
// ============================================================================
// Hard-coded regulatory expectations per licence type (SEMI, API, AEMI, RAISP).
// Used by the policy assessment engine to validate policy sets against
// FCA licence requirements.
// ============================================================================

const LICENCE_EXPECTATIONS = {
  SEMI: {
    name: 'Small Electronic Money Institution',
    safeguarding: { required: true, regulation: 'EMR 21', status: 'REQUIRED' },
    aml: { required: true, regulation: 'MLR 2017', status: 'REQUIRED' },
    governance: { required: true, regulation: 'FCA SYSC', status: 'REQUIRED' },
    business_plan: { required: true, depth: 'Low', status: 'REQUIRED' },
    capital: { required: true, level: 'Low', minimum: null, description: 'No fixed minimum for SEMI' },
  },
  API: {
    name: 'Authorised Payment Institution',
    safeguarding: { required: true, regulation: 'PSR 23', status: 'REQUIRED' },
    aml: { required: true, regulation: 'MLR 2017', status: 'REQUIRED' },
    governance: { required: true, regulation: 'FCA SYSC', status: 'REQUIRED' },
    business_plan: { required: true, depth: 'Medium', status: 'REQUIRED' },
    capital: { required: true, level: 'Proportional', minimum: null, description: 'Proportional to payment volumes' },
  },
  AEMI: {
    name: 'Authorised Electronic Money Institution',
    safeguarding: { required: true, regulation: 'EMR 21', status: 'REQUIRED' },
    aml: { required: true, regulation: 'MLR 2017', status: 'REQUIRED' },
    governance: { required: true, regulation: 'FCA SYSC', status: 'REQUIRED' },
    business_plan: { required: true, depth: 'High', status: 'REQUIRED' },
    capital: { required: true, level: 'High', minimum: 350000, description: '€350k initial capital requirement' },
  },
  RAISP: {
    name: 'Registered Account Information Service Provider',
    safeguarding: { required: false, regulation: null, status: 'PROHIBITED' },
    aml: { required: true, regulation: 'MLR 2017', status: 'REQUIRED' },
    governance: { required: true, regulation: 'FCA SYSC', status: 'REQUIRED' },
    business_plan: { required: true, depth: 'Low', status: 'REQUIRED' },
    capital: { required: false, level: 'N/A', minimum: null, description: 'No capital requirement for RAISP' },
  },
};

/**
 * Validate a set of policy assessment results against licence expectations.
 *
 * @param {string} licenceType - One of SEMI, API, AEMI, RAISP
 * @param {Object} assessmentResults - Map of document_type → assessment result
 *   e.g. { aml_policy: { overall_score: 85, ... }, safeguarding_policy: { ... } }
 * @returns {{ valid: boolean, failures: Array<{ area: string, reason: string }>, warnings: Array<string> }}
 */
function validatePolicyForLicence(licenceType, assessmentResults) {
  const expectations = LICENCE_EXPECTATIONS[licenceType];
  if (!expectations) {
    return {
      valid: false,
      failures: [{ area: 'licence_type', reason: `Unknown licence type: ${licenceType}` }],
      warnings: [],
    };
  }

  const failures = [];
  const warnings = [];

  // --- Safeguarding ---
  if (expectations.safeguarding.status === 'PROHIBITED') {
    // RAISP must NOT have safeguarding
    if (assessmentResults.safeguarding_policy) {
      failures.push({
        area: 'safeguarding',
        reason: `Safeguarding is PROHIBITED for ${licenceType}. RAISPs do not hold client funds.`,
      });
    }
  } else if (expectations.safeguarding.required) {
    if (!assessmentResults.safeguarding_policy) {
      failures.push({
        area: 'safeguarding',
        reason: `Safeguarding policy is required for ${licenceType} under ${expectations.safeguarding.regulation}.`,
      });
    } else if (assessmentResults.safeguarding_policy.overall_score < 50) {
      failures.push({
        area: 'safeguarding',
        reason: `Safeguarding policy score (${assessmentResults.safeguarding_policy.overall_score}) is below minimum threshold.`,
      });
    }
  }

  // --- AML ---
  if (expectations.aml.required) {
    if (!assessmentResults.aml_policy) {
      failures.push({
        area: 'aml',
        reason: `AML policy is required for ${licenceType} under ${expectations.aml.regulation}.`,
      });
    } else if (assessmentResults.aml_policy.overall_score < 50) {
      failures.push({
        area: 'aml',
        reason: `AML policy score (${assessmentResults.aml_policy.overall_score}) is below minimum threshold.`,
      });
    }
  }

  // --- Governance ---
  if (expectations.governance.required) {
    if (!assessmentResults.governance_policy) {
      failures.push({
        area: 'governance',
        reason: `Governance policy is required for ${licenceType} under ${expectations.governance.regulation}.`,
      });
    } else if (assessmentResults.governance_policy.overall_score < 50) {
      failures.push({
        area: 'governance',
        reason: `Governance policy score (${assessmentResults.governance_policy.overall_score}) is below minimum threshold.`,
      });
    }
  }

  // --- Business Plan ---
  if (expectations.business_plan.required) {
    if (!assessmentResults.business_plan) {
      failures.push({
        area: 'business_plan',
        reason: `Business plan is required for ${licenceType}.`,
      });
    } else if (assessmentResults.business_plan.overall_score < 50) {
      failures.push({
        area: 'business_plan',
        reason: `Business plan score (${assessmentResults.business_plan.overall_score}) is below minimum threshold.`,
      });
    }
  }

  // --- Capital ---
  if (expectations.capital.required && expectations.capital.minimum) {
    const bpResult = assessmentResults.business_plan;
    if (bpResult) {
      // Check if capital category is adequately covered
      const capitalCategory = (bpResult.category_scores || []).find(
        (c) => c.category === 'Capital'
      );
      if (!capitalCategory || capitalCategory.score < 50) {
        failures.push({
          area: 'capital',
          reason: `Capital requirements not adequately addressed for ${licenceType}. ${expectations.capital.description}.`,
        });
      }
    }
  }

  // --- Depth warnings ---
  if (expectations.business_plan.depth === 'High') {
    const bpResult = assessmentResults.business_plan;
    if (bpResult && bpResult.overall_score < 80) {
      warnings.push(
        `${licenceType} requires a HIGH-depth business plan. Current score (${bpResult.overall_score}) may be insufficient.`
      );
    }
  }

  return {
    valid: failures.length === 0,
    failures,
    warnings,
  };
}

export { LICENCE_EXPECTATIONS, validatePolicyForLicence };
