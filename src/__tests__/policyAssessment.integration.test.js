/**
 * POLICY ASSESSMENT — INTEGRATION TESTS
 *
 * End-to-end tests that read actual markdown fixture files,
 * assess them through the full engine pipeline, and validate
 * scores, readiness statuses, and licence compliance.
 *
 * CI enforcement guards are marked with [CI-GUARD].
 */

const { assessPolicy } = require('../services/policyAssessmentEngine');
const { validatePolicyForLicence } = require('../services/licenceExpectationMatrix');
const { loadGoodFixtures, loadBadFixtures } = require('../testUtils/fixtures');

// ─── Load fixtures ──────────────────────────────────────────────────────────
const GOOD = loadGoodFixtures();
const BAD = loadBadFixtures();

// Helper: assess all documents in a fixture set
function assessAll(fixtures, licenceType) {
  return {
    aml_policy: assessPolicy(fixtures.aml, { licence_type: licenceType }),
    safeguarding_policy: assessPolicy(fixtures.safeguarding, { licence_type: licenceType }),
    governance_policy: assessPolicy(fixtures.governance, { licence_type: licenceType }),
    business_plan: assessPolicy(fixtures.businessPlan, { licence_type: licenceType }),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. GOOD SEMI SET — all scores >= 80, status READY
// ═══════════════════════════════════════════════════════════════════════════

describe('GOOD SEMI fixture set', () => {
  const results = assessAll(GOOD, 'SEMI');

  test('[CI-GUARD] GOOD AML score >= 80', () => {
    expect(results.aml_policy.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('[CI-GUARD] GOOD safeguarding score >= 80', () => {
    expect(results.safeguarding_policy.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('[CI-GUARD] GOOD governance score >= 80', () => {
    expect(results.governance_policy.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('[CI-GUARD] GOOD business plan score >= 80', () => {
    expect(results.business_plan.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('all GOOD documents have READY status', () => {
    expect(results.aml_policy.readiness_status).toBe('READY');
    expect(results.safeguarding_policy.readiness_status).toBe('READY');
    expect(results.governance_policy.readiness_status).toBe('READY');
    expect(results.business_plan.readiness_status).toBe('READY');
  });

  test('no critical findings in GOOD set', () => {
    expect(results.aml_policy.critical_findings).toHaveLength(0);
    expect(results.safeguarding_policy.critical_findings).toHaveLength(0);
    expect(results.governance_policy.critical_findings).toHaveLength(0);
    expect(results.business_plan.critical_findings).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BAD SEMI SET — all scores < 50, status BLOCKED/WARNING
// ═══════════════════════════════════════════════════════════════════════════

describe('BAD SEMI fixture set', () => {
  const results = assessAll(BAD, 'SEMI');

  test('[CI-GUARD] BAD AML score < 60', () => {
    expect(results.aml_policy.overall_score).toBeLessThan(60);
  });

  test('[CI-GUARD] BAD safeguarding score < 60', () => {
    expect(results.safeguarding_policy.overall_score).toBeLessThan(60);
  });

  test('[CI-GUARD] BAD governance score < 60', () => {
    expect(results.governance_policy.overall_score).toBeLessThan(60);
  });

  test('[CI-GUARD] BAD business plan score < 60', () => {
    expect(results.business_plan.overall_score).toBeLessThan(60);
  });

  test('BAD documents have BLOCKED or WARNING status', () => {
    const validStatuses = ['BLOCKED', 'WARNING'];
    expect(validStatuses).toContain(results.aml_policy.readiness_status);
    expect(validStatuses).toContain(results.safeguarding_policy.readiness_status);
    expect(validStatuses).toContain(results.governance_policy.readiness_status);
    expect(validStatuses).toContain(results.business_plan.readiness_status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. GOOD > BAD for every document type
// ═══════════════════════════════════════════════════════════════════════════

describe('GOOD always scores higher than BAD', () => {
  test('GOOD AML > BAD AML', () => {
    const good = assessPolicy(GOOD.aml);
    const bad = assessPolicy(BAD.aml);
    expect(good.overall_score).toBeGreaterThan(bad.overall_score);
  });

  test('GOOD safeguarding > BAD safeguarding', () => {
    const good = assessPolicy(GOOD.safeguarding);
    const bad = assessPolicy(BAD.safeguarding);
    expect(good.overall_score).toBeGreaterThan(bad.overall_score);
  });

  test('GOOD governance > BAD governance', () => {
    const good = assessPolicy(GOOD.governance);
    const bad = assessPolicy(BAD.governance);
    expect(good.overall_score).toBeGreaterThan(bad.overall_score);
  });

  test('GOOD business plan > BAD business plan', () => {
    const good = assessPolicy(GOOD.businessPlan);
    const bad = assessPolicy(BAD.businessPlan);
    expect(good.overall_score).toBeGreaterThan(bad.overall_score);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. MULTI-LICENCE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('multi-licence validation', () => {
  const goodResults = assessAll(GOOD, 'SEMI');

  test('SEMI with all GOOD policies → valid', () => {
    const result = validatePolicyForLicence('SEMI', goodResults);
    expect(result.valid).toBe(true);
  });

  test('API with all GOOD policies → valid', () => {
    const result = validatePolicyForLicence('API', goodResults);
    expect(result.valid).toBe(true);
  });

  test('AEMI with all GOOD policies → valid', () => {
    const result = validatePolicyForLicence('AEMI', goodResults);
    expect(result.valid).toBe(true);
  });

  test('RAISP without safeguarding → valid', () => {
    const { safeguarding_policy, ...rest } = goodResults;
    const result = validatePolicyForLicence('RAISP', rest);
    expect(result.valid).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. CI ENFORCEMENT GUARDS
// ═══════════════════════════════════════════════════════════════════════════

describe('CI enforcement guards', () => {
  test('[CI-GUARD] GOOD < 80 → FAIL BUILD', () => {
    const results = assessAll(GOOD, 'SEMI');
    for (const [docType, result] of Object.entries(results)) {
      expect(result.overall_score).toBeGreaterThanOrEqual(80);
    }
  });

  test('[CI-GUARD] BAD >= 60 → FAIL BUILD', () => {
    const results = assessAll(BAD, 'SEMI');
    for (const [docType, result] of Object.entries(results)) {
      expect(result.overall_score).toBeLessThan(60);
    }
  });

  test('[CI-GUARD] RAISP + safeguarding → FAIL BUILD', () => {
    const goodResults = assessAll(GOOD, 'RAISP');
    const result = validatePolicyForLicence('RAISP', goodResults);
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'safeguarding')).toBe(true);
  });

  test('[CI-GUARD] AEMI + no capital → FAIL BUILD', () => {
    const result = validatePolicyForLicence('AEMI', {
      aml_policy: { overall_score: 85, category_scores: [] },
      safeguarding_policy: { overall_score: 85, category_scores: [] },
      governance_policy: { overall_score: 85, category_scores: [] },
      business_plan: {
        overall_score: 70,
        category_scores: [{ category: 'Capital', score: 20 }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'capital')).toBe(true);
  });

  test('[CI-GUARD] API + no safeguarding → FAIL BUILD', () => {
    const result = validatePolicyForLicence('API', {
      aml_policy: { overall_score: 85, category_scores: [] },
      governance_policy: { overall_score: 85, category_scores: [] },
      business_plan: { overall_score: 85, category_scores: [] },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'safeguarding')).toBe(true);
  });
});
