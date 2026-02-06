const {
  LICENCE_EXPECTATIONS,
  validatePolicyForLicence,
} = require('./licenceExpectationMatrix');

// ═══════════════════════════════════════════════════════════════════════════
// 1. LICENCE_EXPECTATIONS STRUCTURE
// ═══════════════════════════════════════════════════════════════════════════

describe('LICENCE_EXPECTATIONS', () => {
  test('all 4 licence types have valid entries', () => {
    expect(LICENCE_EXPECTATIONS).toHaveProperty('SEMI');
    expect(LICENCE_EXPECTATIONS).toHaveProperty('API');
    expect(LICENCE_EXPECTATIONS).toHaveProperty('AEMI');
    expect(LICENCE_EXPECTATIONS).toHaveProperty('RAISP');
  });

  test('each licence type has required fields', () => {
    for (const [type, config] of Object.entries(LICENCE_EXPECTATIONS)) {
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('safeguarding');
      expect(config).toHaveProperty('aml');
      expect(config).toHaveProperty('governance');
      expect(config).toHaveProperty('business_plan');
      expect(config).toHaveProperty('capital');
    }
  });

  test('RAISP safeguarding is PROHIBITED', () => {
    expect(LICENCE_EXPECTATIONS.RAISP.safeguarding.status).toBe('PROHIBITED');
    expect(LICENCE_EXPECTATIONS.RAISP.safeguarding.required).toBe(false);
  });

  test('SEMI, API, AEMI require safeguarding', () => {
    expect(LICENCE_EXPECTATIONS.SEMI.safeguarding.required).toBe(true);
    expect(LICENCE_EXPECTATIONS.API.safeguarding.required).toBe(true);
    expect(LICENCE_EXPECTATIONS.AEMI.safeguarding.required).toBe(true);
  });

  test('AEMI has €350k capital requirement', () => {
    expect(LICENCE_EXPECTATIONS.AEMI.capital.minimum).toBe(350000);
  });

  test('RAISP has no capital requirement', () => {
    expect(LICENCE_EXPECTATIONS.RAISP.capital.required).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. validatePolicyForLicence
// ═══════════════════════════════════════════════════════════════════════════

describe('validatePolicyForLicence', () => {
  const goodResults = {
    aml_policy: { overall_score: 90, category_scores: [{ category: 'Capital', score: 85 }] },
    safeguarding_policy: { overall_score: 85, category_scores: [] },
    governance_policy: { overall_score: 88, category_scores: [] },
    business_plan: { overall_score: 82, category_scores: [{ category: 'Capital', score: 80 }] },
  };

  test('RAISP + safeguarding → FAIL (prohibited)', () => {
    const result = validatePolicyForLicence('RAISP', {
      aml_policy: goodResults.aml_policy,
      safeguarding_policy: goodResults.safeguarding_policy,
      governance_policy: goodResults.governance_policy,
      business_plan: goodResults.business_plan,
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'safeguarding')).toBe(true);
  });

  test('RAISP without safeguarding → PASS', () => {
    const result = validatePolicyForLicence('RAISP', {
      aml_policy: goodResults.aml_policy,
      governance_policy: goodResults.governance_policy,
      business_plan: goodResults.business_plan,
    });
    expect(result.valid).toBe(true);
  });

  test('AEMI + no capital coverage → FAIL', () => {
    const result = validatePolicyForLicence('AEMI', {
      aml_policy: goodResults.aml_policy,
      safeguarding_policy: goodResults.safeguarding_policy,
      governance_policy: goodResults.governance_policy,
      business_plan: {
        overall_score: 75,
        category_scores: [{ category: 'Capital', score: 30 }],
      },
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'capital')).toBe(true);
  });

  test('API + no safeguarding → FAIL', () => {
    const result = validatePolicyForLicence('API', {
      aml_policy: goodResults.aml_policy,
      governance_policy: goodResults.governance_policy,
      business_plan: goodResults.business_plan,
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'safeguarding')).toBe(true);
  });

  test('SEMI with all good policies → PASS', () => {
    const result = validatePolicyForLicence('SEMI', goodResults);
    expect(result.valid).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  test('unknown licence type → FAIL', () => {
    const result = validatePolicyForLicence('UNKNOWN', goodResults);
    expect(result.valid).toBe(false);
    expect(result.failures[0].area).toBe('licence_type');
  });

  test('missing AML policy → FAIL for any licence type', () => {
    const result = validatePolicyForLicence('SEMI', {
      safeguarding_policy: goodResults.safeguarding_policy,
      governance_policy: goodResults.governance_policy,
      business_plan: goodResults.business_plan,
    });
    expect(result.valid).toBe(false);
    expect(result.failures.some(f => f.area === 'aml')).toBe(true);
  });
});
