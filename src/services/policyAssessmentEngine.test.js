const {
  assessPolicy,
  detectDocumentType,
  scoreCategory,
  detectCriticalFindings,
  ENGINE_VERSION,
  CATEGORY_DEFINITIONS,
} = require('./policyAssessmentEngine');
const { loadGoodFixtures, loadBadFixtures } = require('../testUtils/fixtures');

// ─── Load fixtures once ─────────────────────────────────────────────────────
const GOOD = loadGoodFixtures();
const BAD = loadBadFixtures();

// ═══════════════════════════════════════════════════════════════════════════
// 1. DOCUMENT TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe('detectDocumentType', () => {
  test('detects AML policy', () => {
    expect(detectDocumentType(GOOD.aml)).toBe('aml_policy');
  });

  test('detects safeguarding policy', () => {
    expect(detectDocumentType(GOOD.safeguarding)).toBe('safeguarding_policy');
  });

  test('detects governance policy', () => {
    expect(detectDocumentType(GOOD.governance)).toBe('governance_policy');
  });

  test('detects business plan', () => {
    expect(detectDocumentType(GOOD.businessPlan)).toBe('business_plan');
  });

  test('detects BAD AML policy (still detectable as AML)', () => {
    expect(detectDocumentType(BAD.aml)).toBe('aml_policy');
  });

  test('detects BAD safeguarding policy', () => {
    expect(detectDocumentType(BAD.safeguarding)).toBe('safeguarding_policy');
  });

  test('detects BAD governance policy', () => {
    expect(detectDocumentType(BAD.governance)).toBe('governance_policy');
  });

  test('detects BAD business plan', () => {
    expect(detectDocumentType(BAD.businessPlan)).toBe('business_plan');
  });

  test('returns null for empty text', () => {
    expect(detectDocumentType('')).toBe(null);
    expect(detectDocumentType(null)).toBe(null);
    expect(detectDocumentType(undefined)).toBe(null);
  });

  test('returns null for unrecognisable text', () => {
    expect(detectDocumentType('The quick brown fox jumps over the lazy dog.')).toBe(null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. CATEGORY SCORING
// ═══════════════════════════════════════════════════════════════════════════

describe('scoreCategory', () => {
  test('scores AML Governance category for GOOD AML policy', () => {
    const catDef = CATEGORY_DEFINITIONS.aml_policy[0]; // AML Governance
    const result = scoreCategory(GOOD.aml, catDef);
    expect(result.category).toBe('AML Governance');
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.status).toBe('COVERED');
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  test('scores AML Governance category low for BAD AML policy', () => {
    const catDef = CATEGORY_DEFINITIONS.aml_policy[0];
    const result = scoreCategory(BAD.aml, catDef);
    expect(result.score).toBeLessThan(70);
  });

  test('returns correct shape for any category', () => {
    const catDef = CATEGORY_DEFINITIONS.safeguarding_policy[0];
    const result = scoreCategory(GOOD.safeguarding, catDef);
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('impact');
    expect(result).toHaveProperty('evidence');
    expect(result).toHaveProperty('explanation');
    expect(typeof result.score).toBe('number');
    expect(['COVERED', 'PARTIAL', 'MISSING']).toContain(result.status);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DETERMINISM
// ═══════════════════════════════════════════════════════════════════════════

describe('determinism', () => {
  test('same input produces same overall score', () => {
    const r1 = assessPolicy(GOOD.aml, { licence_type: 'SEMI' });
    const r2 = assessPolicy(GOOD.aml, { licence_type: 'SEMI' });
    expect(r1.overall_score).toBe(r2.overall_score);
    expect(r1.readiness_status).toBe(r2.readiness_status);
    expect(r1.category_scores.map(c => c.score)).toEqual(r2.category_scores.map(c => c.score));
  });

  test('same BAD input produces same score', () => {
    const r1 = assessPolicy(BAD.governance);
    const r2 = assessPolicy(BAD.governance);
    expect(r1.overall_score).toBe(r2.overall_score);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. OUTPUT SHAPE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

describe('output shape', () => {
  test('assessPolicy returns canonical JSON shape', () => {
    const result = assessPolicy(GOOD.aml, {
      document_id: 'test-001',
      licence_type: 'SEMI',
    });

    expect(result).toHaveProperty('document_id', 'test-001');
    expect(result).toHaveProperty('document_type', 'aml_policy');
    expect(result).toHaveProperty('licence_type', 'SEMI');
    expect(result).toHaveProperty('overall_score');
    expect(result).toHaveProperty('readiness_status');
    expect(result).toHaveProperty('category_scores');
    expect(result).toHaveProperty('critical_findings');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('metadata');

    // Metadata shape
    expect(result.metadata).toHaveProperty('policy_hash');
    expect(result.metadata).toHaveProperty('assessed_at');
    expect(result.metadata).toHaveProperty('engine_version', ENGINE_VERSION);

    // Category scores shape
    expect(Array.isArray(result.category_scores)).toBe(true);
    expect(result.category_scores.length).toBeGreaterThan(0);
    const cs = result.category_scores[0];
    expect(cs).toHaveProperty('category');
    expect(cs).toHaveProperty('score');
    expect(cs).toHaveProperty('status');
    expect(cs).toHaveProperty('impact');
    expect(cs).toHaveProperty('evidence');
    expect(cs).toHaveProperty('explanation');
  });

  test('readiness_status is one of READY, WARNING, BLOCKED', () => {
    const r1 = assessPolicy(GOOD.aml);
    const r2 = assessPolicy(BAD.aml);
    expect(['READY', 'WARNING', 'BLOCKED']).toContain(r1.readiness_status);
    expect(['READY', 'WARNING', 'BLOCKED']).toContain(r2.readiness_status);
  });

  test('handles null/empty input gracefully', () => {
    const result = assessPolicy('');
    expect(result.overall_score).toBe(0);
    expect(result.readiness_status).toBe('BLOCKED');
    expect(result.critical_findings.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. SCORE RANGES: GOOD >= 80, BAD < 50
// ═══════════════════════════════════════════════════════════════════════════

describe('score ranges', () => {
  test('GOOD AML policy scores >= 80', () => {
    const result = assessPolicy(GOOD.aml);
    expect(result.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('GOOD safeguarding policy scores >= 80', () => {
    const result = assessPolicy(GOOD.safeguarding);
    expect(result.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('GOOD governance policy scores >= 80', () => {
    const result = assessPolicy(GOOD.governance);
    expect(result.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('GOOD business plan scores >= 80', () => {
    const result = assessPolicy(GOOD.businessPlan);
    expect(result.overall_score).toBeGreaterThanOrEqual(80);
  });

  test('BAD AML policy scores < 50', () => {
    const result = assessPolicy(BAD.aml);
    expect(result.overall_score).toBeLessThan(50);
  });

  test('BAD safeguarding policy scores < 50', () => {
    const result = assessPolicy(BAD.safeguarding);
    expect(result.overall_score).toBeLessThan(50);
  });

  test('BAD governance policy scores < 50', () => {
    const result = assessPolicy(BAD.governance);
    expect(result.overall_score).toBeLessThan(50);
  });

  test('BAD business plan scores < 50', () => {
    const result = assessPolicy(BAD.businessPlan);
    expect(result.overall_score).toBeLessThan(50);
  });
});
