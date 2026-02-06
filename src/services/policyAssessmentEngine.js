// ============================================================================
// POLICY ASSESSMENT ENGINE — reg-intel-1.0
// ============================================================================
// Deterministic, keyword-based scoring engine for FCA policy documents.
// Three-layer design:
//   1. Document type detection (keyword fingerprinting)
//   2. Category scoring (keyword presence 60%, structure 25%, depth 15%)
//   3. Readiness classification (READY / WARNING / BLOCKED)
//
// No AI, no randomness — 100% rule-based.
// Accepts text strings (browser-compatible). Tests handle file I/O.
// ============================================================================

const ENGINE_VERSION = 'reg-intel-1.0';

// ─── DOCUMENT TYPE DETECTION ────────────────────────────────────────────────

const DOCUMENT_FINGERPRINTS = {
  aml_policy: {
    keywords: [
      'money laundering', 'aml', 'mlro', 'suspicious activity', 'sar',
      'customer due diligence', 'cdd', 'enhanced due diligence', 'edd',
      'know your customer', 'kyc', 'terrorist financing', 'ctf',
      'proceeds of crime', 'national crime agency', 'nca',
      'politically exposed', 'pep', 'sanctions screening',
      'transaction monitoring', 'tipping off', 'mlr 2017',
    ],
    weight: 1,
  },
  safeguarding_policy: {
    keywords: [
      'safeguarding', 'client fund', 'client money', 'segregat',
      'relevant funds', 'emr 21', 'emr regulation 21', 'psr 23',
      'reconciliation', 'designated client account', 'safeguarding account',
      'wind-down', 'wind down', 'e-money', 'electronic money',
      'cass', 'client asset',
    ],
    weight: 1,
  },
  governance_policy: {
    keywords: [
      'governance', 'board of directors', 'board structure', 'non-executive',
      'ned', 'independent director', 'three lines of defence', 'three lines of defense',
      'internal audit', 'compliance oversight', 'smf', 'sm&cr',
      'senior managers', 'certification regime', 'audit committee',
      'risk committee', 'remuneration committee', 'nomination committee',
      'whistleblow', 'board effectiveness',
    ],
    weight: 1,
  },
  business_plan: {
    keywords: [
      'business plan', 'business model', 'revenue model', 'financial projection',
      'financial viability', 'capital requirement', 'initial capital',
      'three-year', '3-year', 'target market', 'competitive advantage',
      'funding', 'cash flow', 'breakeven', 'break-even', 'ebitda',
      'staffing plan', 'distribution channel', 'regulatory readiness',
      'authorisation application', 'authorization application',
    ],
    weight: 1,
  },
};

/**
 * Detect the document type from text content using keyword fingerprinting.
 * @param {string} text - Policy document text
 * @returns {string|null} - Document type key or null
 */
function detectDocumentType(text) {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  let bestType = null;
  let bestScore = 0;

  for (const [docType, config] of Object.entries(DOCUMENT_FINGERPRINTS)) {
    let matchCount = 0;
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        matchCount++;
      }
    }
    const score = matchCount / config.keywords.length;
    if (score > bestScore) {
      bestScore = score;
      bestType = docType;
    }
  }

  // Minimum threshold: at least 10% of fingerprint keywords must match
  return bestScore >= 0.1 ? bestType : null;
}

// ─── CATEGORY DEFINITIONS & KEYWORDS ────────────────────────────────────────

const CATEGORY_DEFINITIONS = {
  aml_policy: [
    {
      category: 'AML Governance',
      weight: 25,
      impact: 'HIGH',
      keywords: [
        'mlro', 'money laundering reporting officer', 'smf17', 'smf 17',
        'board oversight', 'board report', 'quarterly report',
        'deputy mlro', 'senior management', 'board of directors',
        'board receives', 'board responsibility', 'annual report',
        'governance', 'aml framework', 'compliance monitoring',
      ],
      critical: true,
      criticalTerms: ['mlro', 'money laundering reporting officer'],
    },
    {
      category: 'Risk-Based Approach',
      weight: 25,
      impact: 'HIGH',
      keywords: [
        'risk-based approach', 'risk based approach', 'risk assessment',
        'risk scoring', 'customer risk', 'product risk', 'geographic risk',
        'high-risk', 'medium-risk', 'low-risk', 'risk rating',
        'firm-wide risk', 'ongoing risk monitoring', 'trigger event',
        'fatf', 'high-risk jurisdiction', 'risk appetite',
      ],
      critical: true,
      criticalTerms: ['risk assessment', 'risk-based approach', 'risk based approach'],
    },
    {
      category: 'CDD & EDD',
      weight: 20,
      impact: 'HIGH',
      keywords: [
        'customer due diligence', 'cdd', 'enhanced due diligence', 'edd',
        'simplified due diligence', 'sdd', 'beneficial owner',
        'verify identity', 'identity verification', 'kyc',
        'know your customer', 'pep', 'politically exposed',
        'source of funds', 'source of wealth', 'ongoing monitoring',
        'third party reliance',
      ],
      critical: true,
      criticalTerms: ['customer due diligence', 'cdd'],
    },
    {
      category: 'Transaction Monitoring',
      weight: 15,
      impact: 'HIGH',
      keywords: [
        'transaction monitoring', 'suspicious activity', 'sar',
        'suspicious activity report', 'national crime agency', 'nca',
        'automated monitoring', 'alert', 'investigation',
        'unusual transaction', 'high-value transaction', 'tipping off',
        'consent', 'cross-border', 'structuring',
      ],
      critical: false,
    },
    {
      category: 'Record Keeping',
      weight: 10,
      impact: 'MEDIUM',
      keywords: [
        'record keeping', 'record-keeping', 'retention',
        'five years', '5 years', 'data protection', 'gdpr',
        'privacy', 'audit trail', 'documentation',
        'records maintained', 'transaction record',
      ],
      critical: false,
    },
    {
      category: 'Training',
      weight: 5,
      impact: 'MEDIUM',
      keywords: [
        'training', 'training programme', 'training program',
        'annual refresher', 'induction', 'competence',
        'awareness', 'training assessment', 'quiz',
        'role-specific', 'staff training',
      ],
      critical: false,
    },
  ],

  safeguarding_policy: [
    {
      category: 'Safeguarding Method',
      weight: 40,
      impact: 'HIGH',
      keywords: [
        'segregation method', 'segregation', 'segregated',
        'designated client account', 'safeguarding account',
        'relevant funds', 'client money', 'client funds',
        'emr 21', 'emr regulation 21', 'psr 23',
        'insurance method', 'guarantee method', 'surety bond',
        'credit institution', 'safeguard', 'commingl',
        'acknowledgement letter', 'set-off', 'counterclaim',
        'business day following receipt', 'timing',
      ],
      critical: true,
      criticalTerms: ['segregat', 'safeguarding account', 'designated client account'],
    },
    {
      category: 'Reconciliation',
      weight: 30,
      impact: 'HIGH',
      keywords: [
        'reconciliation', 'daily reconciliation', 'internal reconciliation',
        'external reconciliation', 'bank balance', 'discrepancy',
        'shortfall', 'top-up', 'top up', 'monthly',
        'auditor', 'bank statement', 'sample testing',
        'reconciliation record', 'end-of-day', 'calculation',
      ],
      critical: true,
      criticalTerms: ['reconciliation'],
    },
    {
      category: 'Governance Oversight',
      weight: 20,
      impact: 'HIGH',
      keywords: [
        'board', 'board responsibility', 'board receives',
        'monthly report', 'quarterly', 'senior management',
        'head of finance', 'smf', 'compliance monitoring',
        'internal audit', 'annual review', 'governance',
        'oversight', 'designated individual',
      ],
      critical: false,
    },
    {
      category: 'Wind-Down',
      weight: 10,
      impact: 'MEDIUM',
      keywords: [
        'wind-down', 'wind down', 'insolvency', 'winding down',
        'return of funds', 'redemption', 'customer notification',
        'distribution', 'freeze', 'unclaimed funds',
        'wind-down plan', 'wind-down budget', 'voluntary',
      ],
      critical: false,
    },
  ],

  governance_policy: [
    {
      category: 'Board Structure',
      weight: 30,
      impact: 'HIGH',
      keywords: [
        'board structure', 'board composition', 'board of directors',
        'chair', 'chairman', 'chief executive', 'ceo', 'cfo',
        'non-executive director', 'ned', 'executive director',
        'board meeting', 'quorum', 'board papers', 'minutes',
        'matters reserved', 'board responsibilities',
        'quarterly', 'decision-making',
      ],
      critical: true,
      criticalTerms: ['board'],
    },
    {
      category: 'Independence',
      weight: 25,
      impact: 'HIGH',
      keywords: [
        'independent', 'independence', 'non-executive',
        'conflict of interest', 'conflicts of interest',
        'register of interests', 'recuse', 'external appointment',
        'independent challenge', 'private session',
        'board effectiveness review', 'material business relationship',
        'cross-directorship', 'shareholding',
      ],
      critical: true,
      criticalTerms: ['independent', 'independence'],
    },
    {
      category: 'Three Lines of Defence',
      weight: 25,
      impact: 'HIGH',
      keywords: [
        'three lines of defence', 'three lines of defense',
        'first line', 'second line', 'third line',
        'business operations', 'risk and compliance',
        'internal audit', 'independent assurance',
        'risk function', 'compliance function',
        'combined assurance', 'coordination',
        'audit plan', 'remediation',
      ],
      critical: true,
      criticalTerms: ['three lines of defence', 'three lines of defense', 'internal audit'],
    },
    {
      category: 'Compliance Oversight',
      weight: 20,
      impact: 'HIGH',
      keywords: [
        'compliance oversight', 'compliance function',
        'head of compliance', 'smf16', 'smf 16',
        'compliance monitoring programme', 'compliance monitoring program',
        'regulatory reporting', 'regulatory return',
        'fca principles', 'consumer duty',
        'whistleblow', 'compliance culture', 'tone from the top',
        'breach', 'notification',
      ],
      critical: false,
    },
  ],

  business_plan: [
    {
      category: 'Business Model',
      weight: 30,
      impact: 'HIGH',
      keywords: [
        'business model', 'revenue model', 'revenue stream',
        'target market', 'competitive advantage', 'distribution channel',
        'product', 'service', 'e-money', 'payment service',
        'customer segment', 'geographic scope', 'market',
        'partnership', 'api', 'technology', 'platform',
        'transaction fee', 'subscription', 'interchange',
      ],
      critical: true,
      criticalTerms: ['business model', 'revenue'],
    },
    {
      category: 'Financial Viability',
      weight: 30,
      impact: 'HIGH',
      keywords: [
        'financial projection', 'financial viability', 'three-year',
        '3-year', 'revenue', 'operating cost', 'ebitda',
        'net profit', 'cash flow', 'breakeven', 'break-even',
        'funding', 'investment', 'burn rate', 'cash runway',
        'stress test', 'stress scenario', 'monthly',
        'year 1', 'year 2', 'year 3',
      ],
      critical: true,
      criticalTerms: ['financial projection', 'financial viability', 'revenue'],
    },
    {
      category: 'Regulatory Readiness',
      weight: 20,
      impact: 'HIGH',
      keywords: [
        'regulatory readiness', 'fca authorisation', 'fca authorization',
        'authorisation application', 'regulatory framework',
        'sm&cr', 'smf', 'senior management function',
        'aml policy', 'safeguarding policy', 'governance',
        'consumer duty', 'operational resilience',
        'complaints handling', 'regulatory reporting',
        'regulatory obligation', 'reg data',
      ],
      critical: false,
    },
    {
      category: 'Capital',
      weight: 20,
      impact: 'HIGH',
      keywords: [
        'capital', 'initial capital', 'own funds', 'capital requirement',
        'share capital', 'share premium', 'equity',
        '€350,000', '350,000', '350k', 'method d',
        'capital adequacy', 'capital monitoring', 'icaap',
        'capital conservation', 'buffer', 'minimum requirement',
        'ongoing capital',
      ],
      critical: false,
    },
  ],
};

// ─── SCORING ENGINE ─────────────────────────────────────────────────────────

/**
 * Score a single category against the document text.
 * @param {string} text - Normalised (lowercase) document text
 * @param {Object} categoryDef - Category definition with keywords, weight, etc.
 * @returns {{ category: string, score: number, status: string, impact: string, evidence: string[], explanation: string }}
 */
function scoreCategory(text, categoryDef) {
  const lower = text.toLowerCase();
  const evidence = [];

  // --- 1. Keyword Presence (60% weight) ---
  let keywordHits = 0;
  for (const kw of categoryDef.keywords) {
    if (lower.includes(kw)) {
      keywordHits++;
      evidence.push(kw);
    }
  }
  const keywordScore = Math.min(100, (keywordHits / Math.max(categoryDef.keywords.length * 0.5, 1)) * 100);

  // --- 2. Structural Analysis (25% weight) ---
  // Look for section headings (markdown ##), bullet lists, tables
  const lines = text.split('\n');
  let headingCount = 0;
  let bulletCount = 0;
  let tableRowCount = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) headingCount++;
    if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) bulletCount++;
    if (trimmed.includes('|') && trimmed.startsWith('|')) tableRowCount++;
  }

  // Score structural elements (well-structured documents have more of these)
  const structuralScore = Math.min(100,
    (headingCount >= 3 ? 40 : headingCount * 13) +
    (bulletCount >= 5 ? 30 : bulletCount * 6) +
    (tableRowCount >= 3 ? 30 : tableRowCount * 10)
  );

  // --- 3. Depth / Specificity (15% weight) ---
  // Keyword density: how many times category keywords appear (not just presence but frequency)
  let totalOccurrences = 0;
  for (const kw of categoryDef.keywords) {
    const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    if (matches) totalOccurrences += matches.length;
  }
  // Normalise: expect at least ~10 occurrences for a deep policy
  const depthScore = Math.min(100, (totalOccurrences / 10) * 100);

  // --- Weighted composite ---
  const compositeScore = Math.round(
    keywordScore * 0.60 +
    structuralScore * 0.25 +
    depthScore * 0.15
  );

  const finalScore = Math.min(100, Math.max(0, compositeScore));

  const status = finalScore >= 70 ? 'COVERED' : finalScore >= 40 ? 'PARTIAL' : 'MISSING';

  const explanation =
    status === 'COVERED'
      ? `${categoryDef.category} is well-addressed with ${evidence.length} key terms found.`
      : status === 'PARTIAL'
      ? `${categoryDef.category} is partially addressed. Found ${evidence.length}/${categoryDef.keywords.length} expected terms.`
      : `${categoryDef.category} is not adequately addressed. Only ${evidence.length}/${categoryDef.keywords.length} expected terms found.`;

  return {
    category: categoryDef.category,
    score: finalScore,
    status,
    impact: categoryDef.impact,
    evidence: evidence.slice(0, 10), // Cap at 10 for readability
    explanation,
  };
}

// ─── HASH UTILITY ───────────────────────────────────────────────────────────

/**
 * Simple string hash (DJB2). Used for document fingerprinting in non-browser context.
 * For browser context, crypto.subtle can be used instead.
 * @param {string} str
 * @returns {string} hex hash
 */
function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

// ─── CRITICAL FINDINGS DETECTION ────────────────────────────────────────────

/**
 * Check for critical missing elements in a document.
 * @param {string} text
 * @param {string} documentType
 * @param {Array} categoryScores
 * @returns {string[]} Array of critical finding descriptions
 */
function detectCriticalFindings(text, documentType, categoryScores) {
  const findings = [];
  const lower = text.toLowerCase();
  const categories = CATEGORY_DEFINITIONS[documentType] || [];

  for (const catDef of categories) {
    if (!catDef.critical || !catDef.criticalTerms) continue;

    const hasCriticalTerm = catDef.criticalTerms.some((term) => lower.includes(term));
    if (!hasCriticalTerm) {
      findings.push(
        `CRITICAL: ${catDef.category} — none of the required terms found (${catDef.criticalTerms.join(', ')})`
      );
    }
  }

  return findings;
}

// ─── MAIN ASSESSMENT FUNCTION ───────────────────────────────────────────────

/**
 * Assess a policy document and return a structured result.
 *
 * @param {string} text - The full text content of the policy document
 * @param {Object} [options]
 * @param {string} [options.document_id] - Optional document identifier
 * @param {string} [options.licence_type] - e.g. 'SEMI', 'API', 'AEMI', 'RAISP'
 * @param {string} [options.document_type] - Override auto-detection
 * @returns {Object} Assessment result (see canonical JSON shape in spec)
 */
function assessPolicy(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return {
      document_id: options.document_id || null,
      document_type: null,
      licence_type: options.licence_type || null,
      overall_score: 0,
      readiness_status: 'BLOCKED',
      category_scores: [],
      critical_findings: ['No document content provided'],
      warnings: [],
      metadata: {
        policy_hash: null,
        assessed_at: new Date().toISOString(),
        engine_version: ENGINE_VERSION,
      },
    };
  }

  // Step 1: Detect document type
  const documentType = options.document_type || detectDocumentType(text);

  if (!documentType) {
    return {
      document_id: options.document_id || null,
      document_type: null,
      licence_type: options.licence_type || null,
      overall_score: 0,
      readiness_status: 'BLOCKED',
      category_scores: [],
      critical_findings: ['Unable to detect document type from content'],
      warnings: [],
      metadata: {
        policy_hash: simpleHash(text),
        assessed_at: new Date().toISOString(),
        engine_version: ENGINE_VERSION,
      },
    };
  }

  // Step 2: Score each category
  const categoryDefs = CATEGORY_DEFINITIONS[documentType] || [];
  const categoryScores = categoryDefs.map((catDef) => scoreCategory(text, catDef));

  // Step 3: Calculate overall weighted score
  let totalWeight = 0;
  let weightedSum = 0;
  for (let i = 0; i < categoryDefs.length; i++) {
    const w = categoryDefs[i].weight;
    totalWeight += w;
    weightedSum += categoryScores[i].score * w;
  }
  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  // Step 4: Detect critical findings
  const criticalFindings = detectCriticalFindings(text, documentType, categoryScores);

  // Step 5: Collect warnings
  const warnings = [];
  for (const cs of categoryScores) {
    if (cs.status === 'PARTIAL') {
      warnings.push(`${cs.category} only partially covered (score: ${cs.score})`);
    }
  }

  // Step 6: Readiness classification
  let readinessStatus;
  if (criticalFindings.length > 0) {
    readinessStatus = 'BLOCKED';
  } else if (overallScore >= 80) {
    readinessStatus = 'READY';
  } else if (overallScore >= 50) {
    readinessStatus = 'WARNING';
  } else {
    readinessStatus = 'BLOCKED';
  }

  return {
    document_id: options.document_id || null,
    document_type: documentType,
    licence_type: options.licence_type || null,
    overall_score: overallScore,
    readiness_status: readinessStatus,
    category_scores: categoryScores,
    critical_findings: criticalFindings,
    warnings,
    metadata: {
      policy_hash: simpleHash(text),
      assessed_at: new Date().toISOString(),
      engine_version: ENGINE_VERSION,
    },
  };
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

export {
  assessPolicy,
  detectDocumentType,
  scoreCategory,
  detectCriticalFindings,
  ENGINE_VERSION,
  CATEGORY_DEFINITIONS,
  DOCUMENT_FINGERPRINTS,
};
