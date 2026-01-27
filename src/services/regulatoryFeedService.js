// ============================================================================
// REGULATORY FEED SERVICE - Regulatory Horizon (Solution 1)
// ============================================================================
// This service handles fetching regulatory updates from multiple sources:
// - FCA (Financial Conduct Authority)
// - PRA (Prudential Regulation Authority)
// - CBI (Central Bank of Ireland)
// - ESMA (European Securities and Markets Authority)
// ============================================================================

/**
 * Regulatory Feed Service
 * Provides mock regulatory updates that simulate real FCA/PRA/CBI feeds
 * In production, these would connect to actual regulatory APIs or RSS feeds
 */

// Sample regulatory changes that simulate real regulatory updates
const SAMPLE_REGULATORY_UPDATES = [
  // FCA Updates
  {
    id: 'fca-2026-001',
    source: 'FCA',
    regulator: 'FCA',
    title: 'PS26/1: Consumer Duty - Board Reporting Requirements',
    summary: 'Final rules requiring firms to submit annual board reports on consumer outcomes, including quantitative metrics on customer satisfaction, complaints resolution, and fair value assessments.',
    description: 'The FCA has published final rules under PS26/1 that mandate all authorized firms to submit comprehensive annual board reports demonstrating compliance with the Consumer Duty. Key requirements include: (1) Quantitative metrics on customer outcomes, (2) Analysis of products and services against fair value criteria, (3) Evidence of customer understanding and support effectiveness, (4) Remediation plans for identified shortfalls.',
    published_at: '2026-01-15T09:00:00Z',
    effective_date: '2026-07-31',
    status: 'pending',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.fca.org.uk/publications/policy-statements/ps26-1',
    affected_regimes: ['Consumer Duty', 'PRIN', 'SYSC'],
    keywords: ['consumer duty', 'board reporting', 'outcomes testing', 'fair value']
  },
  {
    id: 'fca-2026-002',
    source: 'FCA',
    regulator: 'FCA',
    title: 'CP26/2: Operational Resilience - Third Party Risk Management',
    summary: 'Consultation on enhanced requirements for managing critical third-party providers, including cloud service providers and fintech partners.',
    description: 'The FCA is consulting on strengthened expectations for firms\' oversight of material third-party arrangements. Proposals include: (1) Enhanced due diligence requirements, (2) Mandatory exit strategies for critical services, (3) Real-time monitoring of third-party performance, (4) Board-level accountability for third-party risk.',
    published_at: '2026-01-20T10:30:00Z',
    effective_date: '2026-12-31',
    status: 'in_review',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.fca.org.uk/publications/consultation-papers/cp26-2',
    affected_regimes: ['SYSC', 'Operational Resilience'],
    keywords: ['operational resilience', 'third party', 'outsourcing', 'cloud']
  },
  {
    id: 'fca-2026-003',
    source: 'FCA',
    regulator: 'FCA',
    title: 'FG26/1: Guidance on AI and Machine Learning in Financial Services',
    summary: 'New guidance on the responsible use of AI/ML in customer-facing processes, including creditworthiness assessments and fraud detection.',
    description: 'Finalised guidance setting out FCA expectations for firms using artificial intelligence and machine learning. Key areas covered: (1) Model governance and validation requirements, (2) Explainability standards for customer-facing decisions, (3) Bias detection and mitigation frameworks, (4) Human oversight requirements.',
    published_at: '2026-01-22T14:00:00Z',
    effective_date: '2026-04-01',
    status: 'pending',
    materiality: 'medium',
    impact_rating: 'medium',
    document_url: 'https://www.fca.org.uk/publications/finalised-guidance/fg26-1',
    affected_regimes: ['SYSC', 'PRIN', 'COBS'],
    keywords: ['AI', 'machine learning', 'model risk', 'explainability']
  },
  {
    id: 'fca-2026-004',
    source: 'FCA',
    regulator: 'FCA',
    title: 'PS26/3: Anti-Money Laundering - Enhanced Transaction Monitoring',
    summary: 'Updated requirements for transaction monitoring systems, including real-time screening capabilities and enhanced SAR reporting.',
    description: 'Final rules strengthening AML transaction monitoring requirements. Firms must implement: (1) Real-time transaction screening, (2) Enhanced customer risk scoring, (3) Automated SAR generation capabilities, (4) Annual effectiveness reviews of monitoring systems.',
    published_at: '2026-01-25T11:00:00Z',
    effective_date: '2026-09-30',
    status: 'pending',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.fca.org.uk/publications/policy-statements/ps26-3',
    affected_regimes: ['MLR', 'SYSC', 'Financial Crime'],
    keywords: ['AML', 'transaction monitoring', 'SAR', 'financial crime']
  },
  // PRA Updates
  {
    id: 'pra-2026-001',
    source: 'PRA',
    regulator: 'PRA',
    title: 'SS1/26: Climate Risk - Stress Testing Requirements',
    summary: 'New supervisory statement on climate-related financial risk stress testing, including physical and transition risk scenarios.',
    description: 'The PRA has issued SS1/26 setting out expectations for climate risk stress testing. Requirements include: (1) Biennial climate stress tests for Category 1 and 2 firms, (2) Both physical and transition risk scenarios, (3) Integration with ICAAP/ILAAP processes, (4) Board-level sign-off on climate risk appetite.',
    published_at: '2026-01-18T09:30:00Z',
    effective_date: '2026-06-30',
    status: 'in_review',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2026/ss1-26',
    affected_regimes: ['ICAAP', 'ILAAP', 'Climate Risk'],
    keywords: ['climate risk', 'stress testing', 'TCFD', 'scenario analysis']
  },
  {
    id: 'pra-2026-002',
    source: 'PRA',
    regulator: 'PRA',
    title: 'PS2/26: Basel 3.1 Implementation - Credit Risk Standardised Approach',
    summary: 'Final rules implementing Basel 3.1 credit risk standardised approach changes, with transitional arrangements.',
    description: 'Implementation of Basel 3.1 credit risk rules with a 5-year phase-in period. Key changes: (1) Revised risk weight tables, (2) New real estate lending categories, (3) Enhanced due diligence for unrated exposures, (4) Revised credit conversion factors for off-balance sheet items.',
    published_at: '2026-01-12T08:00:00Z',
    effective_date: '2027-01-01',
    status: 'pending',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2026/ps2-26',
    affected_regimes: ['CRR', 'Basel 3.1', 'Credit Risk'],
    keywords: ['Basel 3.1', 'credit risk', 'risk weights', 'capital requirements']
  },
  {
    id: 'pra-2026-003',
    source: 'PRA',
    regulator: 'PRA',
    title: 'CP3/26: Solvent Exit Planning for Insurance Firms',
    summary: 'Consultation on requirements for insurers to maintain credible solvent exit plans.',
    description: 'Proposals for all authorized insurers to develop and maintain solvent exit plans. Key elements: (1) Annual plan updates, (2) Trigger events and early warning indicators, (3) Communication strategies, (4) Resource and cost assessments.',
    published_at: '2026-01-24T10:00:00Z',
    effective_date: '2027-03-31',
    status: 'pending',
    materiality: 'medium',
    impact_rating: 'medium',
    document_url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2026/cp3-26',
    affected_regimes: ['Solvency II', 'Recovery and Resolution'],
    keywords: ['solvent exit', 'insurance', 'wind-down', 'resolution planning']
  },
  // CBI Updates (Central Bank of Ireland)
  {
    id: 'cbi-2026-001',
    source: 'CBI',
    regulator: 'CBI',
    title: 'Cross-Industry Guidance on Outsourcing',
    summary: 'Updated guidance on outsourcing arrangements applicable to all regulated financial service providers in Ireland.',
    description: 'The Central Bank has issued updated cross-industry guidance on outsourcing. Key requirements: (1) Enhanced pre-outsourcing assessment, (2) Concentration risk management, (3) Exit strategy documentation, (4) Sub-outsourcing oversight.',
    published_at: '2026-01-16T12:00:00Z',
    effective_date: '2026-07-01',
    status: 'pending',
    materiality: 'medium',
    impact_rating: 'medium',
    document_url: 'https://www.centralbank.ie/regulation/industry-market-sectors/cross-industry-guidance',
    affected_regimes: ['Outsourcing', 'DORA'],
    keywords: ['outsourcing', 'concentration risk', 'exit strategy', 'sub-outsourcing']
  },
  {
    id: 'cbi-2026-002',
    source: 'CBI',
    regulator: 'CBI',
    title: 'Fitness and Probity - Enhanced Assessment Framework',
    summary: 'New requirements for ongoing fitness and probity assessments, including annual declarations.',
    description: 'Enhanced F&P framework requiring: (1) Annual fitness declarations from all PCF holders, (2) Continuous monitoring processes, (3) Enhanced due diligence for high-risk roles, (4) Updated pre-approval questionnaire.',
    published_at: '2026-01-21T09:00:00Z',
    effective_date: '2026-04-30',
    status: 'in_review',
    materiality: 'medium',
    impact_rating: 'medium',
    document_url: 'https://www.centralbank.ie/regulation/how-we-regulate/fitness-probity',
    affected_regimes: ['F&P', 'SEAR', 'IAF'],
    keywords: ['fitness and probity', 'PCF', 'SEAR', 'accountability']
  },
  // ESMA Updates
  {
    id: 'esma-2026-001',
    source: 'ESMA',
    regulator: 'ESMA',
    title: 'Guidelines on MiFID II Suitability Requirements',
    summary: 'Updated guidelines on suitability assessments including sustainability preferences integration.',
    description: 'ESMA guidelines updating MiFID II suitability requirements to: (1) Integrate ESG preferences into suitability assessments, (2) Enhanced know-your-client requirements, (3) Updated record-keeping obligations, (4) New disclosure requirements on sustainability risks.',
    published_at: '2026-01-19T14:00:00Z',
    effective_date: '2026-08-01',
    status: 'pending',
    materiality: 'medium',
    impact_rating: 'medium',
    document_url: 'https://www.esma.europa.eu/publications-data/guidelines',
    affected_regimes: ['MiFID II', 'ESG', 'SFDR'],
    keywords: ['suitability', 'MiFID II', 'ESG', 'sustainability preferences']
  },
  {
    id: 'esma-2026-002',
    source: 'ESMA',
    regulator: 'ESMA',
    title: 'DORA Implementation - ICT Risk Management Standards',
    summary: 'Final regulatory technical standards on ICT risk management framework under DORA.',
    description: 'Technical standards implementing DORA ICT risk requirements: (1) ICT risk management framework elements, (2) Classification of ICT incidents, (3) Digital operational resilience testing requirements, (4) Third-party risk management standards.',
    published_at: '2026-01-23T11:30:00Z',
    effective_date: '2025-01-17',
    status: 'active',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.esma.europa.eu/publications-data/regulatory-technical-standards',
    affected_regimes: ['DORA', 'ICT Risk', 'Operational Resilience'],
    keywords: ['DORA', 'ICT risk', 'digital resilience', 'cyber security']
  }
];

// Historical changes (already actioned/archived)
const HISTORICAL_CHANGES = [
  {
    id: 'fca-2025-010',
    source: 'FCA',
    regulator: 'FCA',
    title: 'PS25/12: Consumer Duty - Final Implementation',
    summary: 'Final rules for Consumer Duty implementation including transitional provisions.',
    description: 'Final implementation rules for Consumer Duty. All firms must be fully compliant by 31 July 2025.',
    published_at: '2025-06-15T09:00:00Z',
    effective_date: '2025-07-31',
    status: 'actioned',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.fca.org.uk/publications/policy-statements/ps25-12',
    affected_regimes: ['Consumer Duty', 'PRIN'],
    keywords: ['consumer duty', 'implementation']
  },
  {
    id: 'pra-2025-008',
    source: 'PRA',
    regulator: 'PRA',
    title: 'SS3/25: Operational Resilience - Self-Assessment Requirements',
    summary: 'Self-assessment requirements for important business services.',
    description: 'Firms must complete self-assessments of operational resilience capabilities for all identified important business services.',
    published_at: '2025-03-01T08:00:00Z',
    effective_date: '2025-03-31',
    status: 'actioned',
    materiality: 'high',
    impact_rating: 'high',
    document_url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2025/ss3-25',
    affected_regimes: ['Operational Resilience'],
    keywords: ['operational resilience', 'self-assessment', 'IBS']
  }
];

/**
 * Fetch regulatory updates from a specific source
 * @param {string} source - Regulator source (FCA, PRA, CBI, ESMA, or 'all')
 * @param {Object} options - Fetch options
 * @returns {Promise<Array>} Array of regulatory changes
 */
export async function fetchRegulatoryUpdates(source = 'all', options = {}) {
  const {
    includeHistorical = false,
    fromDate = null,
    status = null,
    materiality = null
  } = options;

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  let updates = [...SAMPLE_REGULATORY_UPDATES];

  if (includeHistorical) {
    updates = [...updates, ...HISTORICAL_CHANGES];
  }

  // Filter by source
  if (source !== 'all') {
    updates = updates.filter(u => u.source === source);
  }

  // Filter by date
  if (fromDate) {
    const fromDateTime = new Date(fromDate).getTime();
    updates = updates.filter(u => new Date(u.published_at).getTime() >= fromDateTime);
  }

  // Filter by status
  if (status) {
    updates = updates.filter(u => u.status === status);
  }

  // Filter by materiality
  if (materiality) {
    updates = updates.filter(u => u.materiality === materiality);
  }

  // Sort by published date (newest first)
  updates.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

  return updates;
}

/**
 * Get new updates since last scan
 * @param {string} lastScanDate - ISO date string of last scan
 * @returns {Promise<Object>} New updates and count
 */
export async function getNewUpdatesSinceLastScan(lastScanDate) {
  const updates = await fetchRegulatoryUpdates('all', {
    fromDate: lastScanDate,
    includeHistorical: false
  });

  return {
    updates,
    newCount: updates.length,
    hasHighPriority: updates.some(u => u.materiality === 'high'),
    scanTime: new Date().toISOString()
  };
}

/**
 * Get regulatory change statistics
 * @returns {Promise<Object>} Statistics object
 */
export async function getRegulatoryStatistics() {
  const allUpdates = await fetchRegulatoryUpdates('all', { includeHistorical: true });

  const stats = {
    total: allUpdates.length,
    byStatus: {
      pending: allUpdates.filter(u => u.status === 'pending').length,
      in_review: allUpdates.filter(u => u.status === 'in_review').length,
      actioned: allUpdates.filter(u => u.status === 'actioned').length,
      active: allUpdates.filter(u => u.status === 'active').length
    },
    bySource: {
      FCA: allUpdates.filter(u => u.source === 'FCA').length,
      PRA: allUpdates.filter(u => u.source === 'PRA').length,
      CBI: allUpdates.filter(u => u.source === 'CBI').length,
      ESMA: allUpdates.filter(u => u.source === 'ESMA').length
    },
    byMateriality: {
      high: allUpdates.filter(u => u.materiality === 'high').length,
      medium: allUpdates.filter(u => u.materiality === 'medium').length,
      low: allUpdates.filter(u => u.materiality === 'low').length
    },
    upcomingDeadlines: allUpdates
      .filter(u => new Date(u.effective_date) > new Date())
      .sort((a, b) => new Date(a.effective_date) - new Date(b.effective_date))
      .slice(0, 5)
      .map(u => ({
        id: u.id,
        title: u.title,
        source: u.source,
        effective_date: u.effective_date,
        daysRemaining: Math.ceil((new Date(u.effective_date) - new Date()) / (1000 * 60 * 60 * 24))
      }))
  };

  return stats;
}

/**
 * Search regulatory changes
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching regulatory changes
 */
export async function searchRegulatoryChanges(query) {
  if (!query || query.length < 2) return [];

  const allUpdates = await fetchRegulatoryUpdates('all', { includeHistorical: true });
  const lowerQuery = query.toLowerCase();

  return allUpdates.filter(u =>
    u.title.toLowerCase().includes(lowerQuery) ||
    u.summary.toLowerCase().includes(lowerQuery) ||
    u.description.toLowerCase().includes(lowerQuery) ||
    u.keywords.some(k => k.toLowerCase().includes(lowerQuery)) ||
    u.affected_regimes.some(r => r.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get affected regimes for a regulatory change
 * @param {string} changeId - Regulatory change ID
 * @returns {Promise<Array>} Affected regimes
 */
export async function getAffectedRegimes(changeId) {
  const allUpdates = await fetchRegulatoryUpdates('all', { includeHistorical: true });
  const change = allUpdates.find(u => u.id === changeId);
  return change ? change.affected_regimes : [];
}

/**
 * Calculate impact score for a regulatory change
 * @param {Object} change - Regulatory change object
 * @returns {Object} Impact score breakdown
 */
export function calculateImpactScore(change) {
  let score = 0;
  const breakdown = {};

  // Materiality component (30 points max)
  const materialityScores = { high: 30, medium: 20, low: 10 };
  breakdown.materiality = materialityScores[change.materiality] || 15;
  score += breakdown.materiality;

  // Urgency component based on effective date (25 points max)
  const daysUntilEffective = Math.ceil((new Date(change.effective_date) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysUntilEffective <= 30) {
    breakdown.urgency = 25;
  } else if (daysUntilEffective <= 90) {
    breakdown.urgency = 20;
  } else if (daysUntilEffective <= 180) {
    breakdown.urgency = 15;
  } else {
    breakdown.urgency = 10;
  }
  score += breakdown.urgency;

  // Regulator weight (20 points max)
  const regulatorWeights = { FCA: 20, PRA: 20, CBI: 15, ESMA: 18 };
  breakdown.regulator = regulatorWeights[change.source] || 15;
  score += breakdown.regulator;

  // Scope component based on affected regimes (15 points max)
  const regimeCount = change.affected_regimes?.length || 1;
  breakdown.scope = Math.min(regimeCount * 5, 15);
  score += breakdown.scope;

  // Status component (10 points max)
  const statusScores = { active: 10, pending: 8, in_review: 6, actioned: 2 };
  breakdown.status = statusScores[change.status] || 5;
  score += breakdown.status;

  // Determine risk band
  let riskBand;
  if (score >= 61) {
    riskBand = 'CRITICAL';
  } else if (score >= 31) {
    riskBand = 'HIGH';
  } else {
    riskBand = 'MODERATE';
  }

  return {
    totalScore: Math.min(score, 100),
    breakdown,
    riskBand,
    primaryDriver: Object.entries(breakdown).reduce((a, b) =>
      breakdown[a[0]] > breakdown[b[0]] ? a : b
    )[0]
  };
}

// Export sample data for testing
export const REGULATORY_SOURCES = ['FCA', 'PRA', 'CBI', 'ESMA'];
export const REGULATORY_STATUSES = ['pending', 'in_review', 'actioned', 'active', 'archived'];
export const MATERIALITY_LEVELS = ['high', 'medium', 'low'];

export default {
  fetchRegulatoryUpdates,
  getNewUpdatesSinceLastScan,
  getRegulatoryStatistics,
  searchRegulatoryChanges,
  getAffectedRegimes,
  calculateImpactScore,
  REGULATORY_SOURCES,
  REGULATORY_STATUSES,
  MATERIALITY_LEVELS
};
