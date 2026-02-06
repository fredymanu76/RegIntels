// ============================================================================
// REGULATORY FEED SERVICE - Regulatory Horizon (Solution 1)
// ============================================================================
// This service handles fetching regulatory updates from multiple sources:
// - FCA (Financial Conduct Authority) - via RSS feeds
// - PRA (Prudential Regulation Authority) - via RSS feeds
// - CBI (Central Bank of Ireland) - via RSS feeds
// - ESMA (European Securities and Markets Authority) - via RSS feeds
// ============================================================================

/**
 * Live Regulatory Feed Service
 * Fetches real regulatory updates from FCA/PRA/CBI/ESMA RSS feeds
 * Falls back to sample data if live feed is unavailable
 */

// Regulatory source configurations
const REGULATORY_SOURCES_CONFIG = {
  FCA: {
    name: 'Financial Conduct Authority',
    country: 'UK',
    rssFeeds: [
      'https://www.fca.org.uk/publications/policy-statements/rss',
      'https://www.fca.org.uk/publications/consultation-papers/rss',
      'https://www.fca.org.uk/publications/finalised-guidance/rss'
    ],
    baseUrl: 'https://www.fca.org.uk',
    color: '#F97316'
  },
  PRA: {
    name: 'Prudential Regulation Authority',
    country: 'UK',
    rssFeeds: [
      'https://www.bankofengland.co.uk/prudential-regulation/rss'
    ],
    baseUrl: 'https://www.bankofengland.co.uk',
    color: '#F97316'
  },
  CBI: {
    name: 'Central Bank of Ireland',
    country: 'Ireland',
    rssFeeds: [
      'https://www.centralbank.ie/rss/news'
    ],
    baseUrl: 'https://www.centralbank.ie',
    color: '#F97316'
  },
  ESMA: {
    name: 'European Securities and Markets Authority',
    country: 'EU',
    rssFeeds: [
      'https://www.esma.europa.eu/rss.xml'
    ],
    baseUrl: 'https://www.esma.europa.eu',
    color: '#F97316'
  }
};

// Cache for storing fetched regulatory updates
let feedCache = {
  data: [],
  lastUpdated: null,
  ttl: 15 * 60 * 1000 // 15 minute cache TTL
};

// Last scan timestamp for UI
let lastScanTimestamp = localStorage.getItem('lastRegulatoryFeedScan') || null;

/**
 * Fetch and parse RSS feed
 * Uses a CORS proxy to bypass cross-origin restrictions
 */
async function fetchRSSFeed(url, source) {
  try {
    // Use a CORS proxy for RSS feeds
    const corsProxy = 'https://api.allorigins.win/raw?url=';
    const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Parse RSS items
    const items = xmlDoc.querySelectorAll('item');
    const updates = [];

    items.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const category = item.querySelector('category')?.textContent || '';

      // Parse the publication date
      const publishedAt = pubDate ? new Date(pubDate) : new Date();

      // Only include items from the last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      if (publishedAt >= sixtyDaysAgo) {
        updates.push({
          id: `${source.toLowerCase()}-live-${Date.now()}-${index}`,
          source: source,
          regulator: source,
          title: cleanHtmlText(title),
          summary: cleanHtmlText(description).slice(0, 300) + (description.length > 300 ? '...' : ''),
          description: cleanHtmlText(description),
          published_at: publishedAt.toISOString(),
          effective_date: calculateEffectiveDate(publishedAt, title),
          status: determineStatus(title, publishedAt),
          materiality: determineMateriality(title, description),
          impact_rating: determineMateriality(title, description),
          document_url: link,
          affected_regimes: extractRegimes(title, description),
          keywords: extractKeywords(title, description),
          isLive: true,
          fetchedAt: new Date().toISOString()
        });
      }
    });

    return updates;
  } catch (error) {
    console.warn(`Failed to fetch RSS from ${source}: ${error.message}`);
    return [];
  }
}

/**
 * Clean HTML text content
 */
function cleanHtmlText(html) {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

/**
 * Calculate estimated effective date based on title patterns
 */
function calculateEffectiveDate(publishedAt, title) {
  const titleLower = title.toLowerCase();
  const effectiveDate = new Date(publishedAt);

  // Check for common regulatory timing patterns
  if (titleLower.includes('final') || titleLower.includes('ps')) {
    // Policy statements typically give 6 months
    effectiveDate.setMonth(effectiveDate.getMonth() + 6);
  } else if (titleLower.includes('consultation') || titleLower.includes('cp')) {
    // Consultations typically have 3-month comment period + 6 months implementation
    effectiveDate.setMonth(effectiveDate.getMonth() + 9);
  } else if (titleLower.includes('guidance') || titleLower.includes('fg')) {
    // Guidance typically immediate or 3 months
    effectiveDate.setMonth(effectiveDate.getMonth() + 3);
  } else if (titleLower.includes('immediate') || titleLower.includes('urgent')) {
    // Immediate effect
    effectiveDate.setDate(effectiveDate.getDate() + 14);
  } else {
    // Default to 6 months
    effectiveDate.setMonth(effectiveDate.getMonth() + 6);
  }

  return effectiveDate.toISOString().split('T')[0];
}

/**
 * Determine status based on title and publication date
 */
function determineStatus(title, publishedAt) {
  const titleLower = title.toLowerCase();
  const now = new Date();
  const pubDate = new Date(publishedAt);
  const daysSincePublished = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24));

  if (titleLower.includes('final') || titleLower.includes('ps')) {
    return daysSincePublished > 180 ? 'actioned' : 'pending';
  } else if (titleLower.includes('consultation') || titleLower.includes('cp')) {
    return 'in_review';
  } else if (titleLower.includes('guidance') || titleLower.includes('fg')) {
    return daysSincePublished > 90 ? 'actioned' : 'pending';
  }

  return 'pending';
}

/**
 * Determine materiality based on keywords in title/description
 */
function determineMateriality(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  // High materiality keywords
  const highKeywords = [
    'capital', 'liquidity', 'solvency', 'consumer duty', 'conduct',
    'aml', 'money laundering', 'financial crime', 'sanctions', 'fraud',
    'operational resilience', 'cyber', 'critical', 'systemically important',
    'authorisation', 'authorization', 'permission', 'prudential',
    'stress test', 'recovery', 'resolution', 'basel', 'icaap', 'ilaap',
    'board', 'governance', 'accountability', 'senior manager'
  ];

  // Medium materiality keywords
  const mediumKeywords = [
    'reporting', 'disclosure', 'climate', 'esg', 'sustainability',
    'outsourcing', 'third party', 'technology', 'data', 'privacy',
    'conduct', 'complaints', 'redress', 'mis-selling', 'suitability',
    'mifid', 'priips', 'ucits', 'aifmd', 'market abuse', 'benchmark'
  ];

  const highCount = highKeywords.filter(k => text.includes(k)).length;
  const mediumCount = mediumKeywords.filter(k => text.includes(k)).length;

  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
    return 'high';
  } else if (highCount >= 1 || mediumCount >= 2) {
    return 'medium';
  }

  return 'low';
}

/**
 * Extract regulatory regimes from text
 */
function extractRegimes(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const regimes = [];

  const regimeMap = {
    'consumer duty': 'Consumer Duty',
    'prin': 'PRIN',
    'sysc': 'SYSC',
    'cobs': 'COBS',
    'mifid': 'MiFID II',
    'aml': 'AML/CTF',
    'mlr': 'MLR',
    'operational resilience': 'Operational Resilience',
    'dora': 'DORA',
    'basel': 'Basel',
    'crr': 'CRR',
    'crd': 'CRD',
    'solvency': 'Solvency II',
    'icaap': 'ICAAP',
    'ilaap': 'ILAAP',
    'climate': 'Climate Risk',
    'tcfd': 'TCFD',
    'esg': 'ESG',
    'sfdr': 'SFDR',
    'gdpr': 'GDPR',
    'psd': 'PSD2',
    'priips': 'PRIIPs',
    'ucits': 'UCITS',
    'aifmd': 'AIFMD',
    'mar': 'MAR',
    'smcr': 'SMCR',
    'fitness and probity': 'F&P',
    'iar': 'IAR',
    'sear': 'SEAR'
  };

  Object.entries(regimeMap).forEach(([key, value]) => {
    if (text.includes(key) && !regimes.includes(value)) {
      regimes.push(value);
    }
  });

  return regimes.length > 0 ? regimes : ['General'];
}

/**
 * Extract keywords from text
 */
function extractKeywords(title, description) {
  const text = (title + ' ' + description).toLowerCase();
  const keywords = [];

  const keywordPatterns = [
    'consumer duty', 'operational resilience', 'climate risk', 'aml',
    'financial crime', 'sanctions', 'outsourcing', 'third party',
    'cyber security', 'data protection', 'board reporting', 'governance',
    'capital requirements', 'liquidity', 'stress testing', 'disclosure',
    'sustainability', 'esg', 'complaints', 'conduct risk', 'model risk',
    'artificial intelligence', 'machine learning', 'digital', 'crypto',
    'payments', 'authorisation', 'permissions', 'senior manager'
  ];

  keywordPatterns.forEach(pattern => {
    if (text.includes(pattern)) {
      keywords.push(pattern);
    }
  });

  return keywords.slice(0, 5); // Max 5 keywords
}

// Enhanced sample regulatory updates with realistic 60-day window data
const SAMPLE_REGULATORY_UPDATES = generateSampleUpdatesForLast60Days();

function generateSampleUpdatesForLast60Days() {
  const now = new Date();
  const updates = [];

  // Generate realistic regulatory updates for the last 60 days
  const sampleData = [
    // Week 1 (Most recent)
    {
      source: 'FCA',
      title: 'PS26/2: Consumer Duty - Annual Value Assessment Requirements',
      summary: 'Final rules on annual value assessment reporting, requiring firms to demonstrate fair value across all products.',
      regimes: ['Consumer Duty', 'PRIN', 'COBS'],
      materiality: 'high',
      daysAgo: 2
    },
    {
      source: 'PRA',
      title: 'SS2/26: Operational Resilience - Third-Party Concentration Risk',
      summary: 'Supervisory statement on managing concentration risk in critical third-party relationships.',
      regimes: ['Operational Resilience', 'SYSC'],
      materiality: 'high',
      daysAgo: 5
    },
    {
      source: 'FCA',
      title: 'CP26/3: Anti-Money Laundering - Enhanced Customer Due Diligence',
      summary: 'Consultation on strengthening customer due diligence requirements for high-risk customers.',
      regimes: ['AML/CTF', 'MLR', 'SYSC'],
      materiality: 'high',
      daysAgo: 7
    },
    // Week 2
    {
      source: 'CBI',
      title: 'Cross-Industry Guidance on AI and Machine Learning',
      summary: 'Guidance on governance and risk management requirements for firms using AI/ML systems.',
      regimes: ['SYSC', 'General'],
      materiality: 'medium',
      daysAgo: 10
    },
    {
      source: 'ESMA',
      title: 'Final Report - Guidelines on Funds Names Using ESG Terms',
      summary: 'Guidelines establishing quantitative thresholds for fund names using ESG or sustainability terms.',
      regimes: ['ESG', 'SFDR', 'UCITS', 'AIFMD'],
      materiality: 'medium',
      daysAgo: 12
    },
    {
      source: 'FCA',
      title: 'FG26/2: Guidance on Cryptoasset Financial Promotions',
      summary: 'Updated guidance on promoting cryptoassets to retail consumers under the financial promotion regime.',
      regimes: ['COBS', 'Financial Promotions'],
      materiality: 'medium',
      daysAgo: 14
    },
    // Week 3
    {
      source: 'PRA',
      title: 'CP4/26: Basel 3.1 - Market Risk Standardised Approach',
      summary: 'Consultation on implementing the revised market risk standardised approach under Basel 3.1.',
      regimes: ['Basel', 'CRR', 'Market Risk'],
      materiality: 'high',
      daysAgo: 18
    },
    {
      source: 'FCA',
      title: 'PS26/1: Consumer Duty - Board Reporting Requirements',
      summary: 'Final rules requiring firms to submit annual board reports on consumer outcomes with quantitative metrics.',
      regimes: ['Consumer Duty', 'PRIN', 'SYSC'],
      materiality: 'high',
      daysAgo: 21
    },
    // Week 4
    {
      source: 'CBI',
      title: 'Fitness and Probity - Annual Declaration Requirements',
      summary: 'Updated requirements for annual fitness and probity declarations from PCF holders.',
      regimes: ['F&P', 'SEAR', 'IAR'],
      materiality: 'medium',
      daysAgo: 25
    },
    {
      source: 'ESMA',
      title: 'DORA - Final RTS on ICT Risk Management Framework',
      summary: 'Final regulatory technical standards on ICT risk management requirements under DORA.',
      regimes: ['DORA', 'ICT Risk', 'Operational Resilience'],
      materiality: 'high',
      daysAgo: 28
    },
    // Week 5
    {
      source: 'FCA',
      title: 'CP26/2: Operational Resilience - Third Party Risk Management',
      summary: 'Consultation on enhanced requirements for managing critical third-party providers.',
      regimes: ['Operational Resilience', 'SYSC'],
      materiality: 'high',
      daysAgo: 32
    },
    {
      source: 'PRA',
      title: 'SS1/26: Climate Risk - Stress Testing Requirements',
      summary: 'Supervisory statement on climate-related financial risk stress testing for banks and insurers.',
      regimes: ['Climate Risk', 'ICAAP', 'ILAAP'],
      materiality: 'high',
      daysAgo: 35
    },
    // Week 6
    {
      source: 'FCA',
      title: 'FG26/1: Guidance on AI and Machine Learning in Financial Services',
      summary: 'Guidance on responsible use of AI/ML in customer-facing processes and decision-making.',
      regimes: ['SYSC', 'PRIN', 'COBS'],
      materiality: 'medium',
      daysAgo: 38
    },
    {
      source: 'ESMA',
      title: 'Guidelines on MiFID II Suitability Requirements - ESG Integration',
      summary: 'Updated guidelines on integrating sustainability preferences into suitability assessments.',
      regimes: ['MiFID II', 'ESG', 'SFDR'],
      materiality: 'medium',
      daysAgo: 42
    },
    // Week 7-8
    {
      source: 'CBI',
      title: 'Cross-Industry Outsourcing Guidance Update',
      summary: 'Updated guidance on outsourcing arrangements including cloud and intra-group considerations.',
      regimes: ['Outsourcing', 'DORA', 'SYSC'],
      materiality: 'medium',
      daysAgo: 45
    },
    {
      source: 'PRA',
      title: 'PS2/26: Basel 3.1 Implementation - Credit Risk',
      summary: 'Final rules implementing Basel 3.1 credit risk standardised approach with transitional arrangements.',
      regimes: ['Basel', 'CRR', 'Credit Risk'],
      materiality: 'high',
      daysAgo: 48
    },
    {
      source: 'FCA',
      title: 'PS26/3: Anti-Money Laundering - Enhanced Transaction Monitoring',
      summary: 'Final rules on transaction monitoring systems including real-time screening requirements.',
      regimes: ['AML/CTF', 'MLR', 'SYSC'],
      materiality: 'high',
      daysAgo: 52
    },
    {
      source: 'ESMA',
      title: 'Q&A on SFDR - Sustainability Disclosures',
      summary: 'Updated Q&A clarifying various aspects of SFDR disclosure requirements.',
      regimes: ['SFDR', 'ESG'],
      materiality: 'low',
      daysAgo: 55
    },
    {
      source: 'FCA',
      title: 'Dear CEO Letter - Consumer Duty Implementation Review',
      summary: 'Portfolio letter outlining FCA expectations for firms regarding ongoing Consumer Duty compliance.',
      regimes: ['Consumer Duty', 'PRIN'],
      materiality: 'high',
      daysAgo: 58
    }
  ];

  sampleData.forEach((item, index) => {
    const publishedDate = new Date(now);
    publishedDate.setDate(publishedDate.getDate() - item.daysAgo);

    const effectiveDate = new Date(publishedDate);
    effectiveDate.setMonth(effectiveDate.getMonth() + 6);

    updates.push({
      id: `${item.source.toLowerCase()}-sample-${Date.now()}-${index}`,
      source: item.source,
      regulator: item.source,
      title: item.title,
      summary: item.summary,
      description: item.summary + ' This regulatory development requires firms to review their existing frameworks and processes.',
      published_at: publishedDate.toISOString(),
      effective_date: effectiveDate.toISOString().split('T')[0],
      status: item.daysAgo < 14 ? 'pending' : (item.daysAgo < 30 ? 'in_review' : 'pending'),
      materiality: item.materiality,
      impact_rating: item.materiality,
      document_url: getDocumentUrl(item.source, item.title),
      affected_regimes: item.regimes,
      keywords: extractKeywordsFromRegimes(item.regimes, item.summary),
      isLive: false,
      fetchedAt: new Date().toISOString()
    });
  });

  return updates;
}

function getDocumentUrl(source, title) {
  const baseUrls = {
    FCA: 'https://www.fca.org.uk/publications',
    PRA: 'https://www.bankofengland.co.uk/prudential-regulation',
    CBI: 'https://www.centralbank.ie/regulation',
    ESMA: 'https://www.esma.europa.eu/publications-data'
  };
  return baseUrls[source] || '#';
}

function extractKeywordsFromRegimes(regimes, summary) {
  const keywords = regimes.slice(0, 3);
  const summaryLower = summary.toLowerCase();

  const additionalKeywords = ['consumer duty', 'operational resilience', 'aml', 'climate risk', 'esg', 'stress testing', 'third party'];
  additionalKeywords.forEach(kw => {
    if (summaryLower.includes(kw) && !keywords.includes(kw)) {
      keywords.push(kw);
    }
  });

  return keywords.slice(0, 5);
}

/**
 * Fetch regulatory updates - tries live feeds first, falls back to sample data
 */
export async function fetchRegulatoryUpdates(source = 'all', options = {}) {
  const {
    includeHistorical = false,
    fromDate = null,
    status = null,
    materiality = null,
    forceLiveFetch = false
  } = options;

  let updates = [];

  // Check cache first (unless forcing live fetch)
  const cacheValid = feedCache.lastUpdated &&
    (Date.now() - feedCache.lastUpdated) < feedCache.ttl;

  if (cacheValid && !forceLiveFetch) {
    updates = [...feedCache.data];
  } else {
    // Try to fetch live data
    const liveFetchPromises = [];
    const sourcesToFetch = source === 'all'
      ? Object.keys(REGULATORY_SOURCES_CONFIG)
      : [source];

    for (const src of sourcesToFetch) {
      const config = REGULATORY_SOURCES_CONFIG[src];
      if (config?.rssFeeds) {
        for (const feedUrl of config.rssFeeds) {
          liveFetchPromises.push(fetchRSSFeed(feedUrl, src));
        }
      }
    }

    // Fetch all live feeds in parallel with timeout
    try {
      const results = await Promise.allSettled(
        liveFetchPromises.map(p =>
          Promise.race([p, new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 8000)
          )])
        )
      );

      results.forEach(result => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          updates.push(...result.value);
        }
      });
    } catch (error) {
      console.warn('Live feed fetch failed, using sample data:', error.message);
    }

    // If no live data, use sample data
    if (updates.length === 0) {
      updates = [...SAMPLE_REGULATORY_UPDATES];
    } else {
      // Merge live with sample for comprehensive coverage
      const liveIds = new Set(updates.map(u => u.title.toLowerCase()));
      const sampleToAdd = SAMPLE_REGULATORY_UPDATES.filter(
        s => !liveIds.has(s.title.toLowerCase())
      );
      updates.push(...sampleToAdd);
    }

    // Update cache
    feedCache.data = updates;
    feedCache.lastUpdated = Date.now();
  }

  // Filter by source if not 'all'
  if (source !== 'all') {
    updates = updates.filter(u => u.source === source);
  }

  // Filter by date (last 60 days by default)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  if (fromDate) {
    const fromDateTime = new Date(fromDate).getTime();
    updates = updates.filter(u => new Date(u.published_at).getTime() >= fromDateTime);
  } else {
    updates = updates.filter(u => new Date(u.published_at) >= sixtyDaysAgo);
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
 * Scan for new updates - force refresh from live sources
 */
export async function scanForNewUpdates() {
  const previousCount = feedCache.data.length;

  // Force a fresh fetch
  feedCache.lastUpdated = null;
  const updates = await fetchRegulatoryUpdates('all', { forceLiveFetch: true });

  // Update last scan timestamp
  lastScanTimestamp = new Date().toISOString();
  localStorage.setItem('lastRegulatoryFeedScan', lastScanTimestamp);

  // Calculate new items
  const newCount = updates.length - previousCount;
  const hasHighPriority = updates.some(u => u.materiality === 'high' &&
    new Date(u.published_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

  return {
    updates,
    totalCount: updates.length,
    newCount: Math.max(0, newCount),
    hasHighPriority,
    scanTime: lastScanTimestamp,
    sourcesScanned: Object.keys(REGULATORY_SOURCES_CONFIG).length,
    liveDataFound: updates.some(u => u.isLive === true)
  };
}

/**
 * Get new updates since last scan
 */
export async function getNewUpdatesSinceLastScan(lastScanDate) {
  const scanDate = lastScanDate || lastScanTimestamp;
  const updates = await fetchRegulatoryUpdates('all', {
    fromDate: scanDate,
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
 */
export async function getRegulatoryStatistics() {
  const allUpdates = await fetchRegulatoryUpdates('all');

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
    timeRange: {
      last7Days: allUpdates.filter(u => {
        const pubDate = new Date(u.published_at);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return pubDate >= weekAgo;
      }).length,
      last30Days: allUpdates.filter(u => {
        const pubDate = new Date(u.published_at);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return pubDate >= monthAgo;
      }).length,
      last60Days: allUpdates.length
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
      })),
    lastScan: lastScanTimestamp,
    liveDataAvailable: allUpdates.some(u => u.isLive === true)
  };

  return stats;
}

/**
 * Search regulatory changes
 */
export async function searchRegulatoryChanges(query) {
  if (!query || query.length < 2) return [];

  const allUpdates = await fetchRegulatoryUpdates('all');
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
 */
export async function getAffectedRegimes(changeId) {
  const allUpdates = await fetchRegulatoryUpdates('all');
  const change = allUpdates.find(u => u.id === changeId);
  return change ? change.affected_regimes : [];
}

/**
 * Calculate impact score for a regulatory change
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
  if (score >= 70) {
    riskBand = 'CRITICAL';
  } else if (score >= 50) {
    riskBand = 'HIGH';
  } else if (score >= 30) {
    riskBand = 'MODERATE';
  } else {
    riskBand = 'LOW';
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

/**
 * Get last scan timestamp
 */
export function getLastScanTimestamp() {
  return lastScanTimestamp;
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Export constants
export const REGULATORY_SOURCES = Object.keys(REGULATORY_SOURCES_CONFIG);
export const REGULATORY_STATUSES = ['pending', 'in_review', 'actioned', 'active', 'archived'];
export const MATERIALITY_LEVELS = ['high', 'medium', 'low'];
export const SOURCES_CONFIG = REGULATORY_SOURCES_CONFIG;

export default {
  fetchRegulatoryUpdates,
  scanForNewUpdates,
  getNewUpdatesSinceLastScan,
  getRegulatoryStatistics,
  searchRegulatoryChanges,
  getAffectedRegimes,
  calculateImpactScore,
  getLastScanTimestamp,
  formatRelativeTime,
  REGULATORY_SOURCES,
  REGULATORY_STATUSES,
  MATERIALITY_LEVELS,
  SOURCES_CONFIG
};
