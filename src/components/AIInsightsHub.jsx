import React, { useState, useEffect } from 'react';
import { Brain, Sparkles, FileText, Target, AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronRight, Zap, TrendingUp } from 'lucide-react';
import './AIInsightsHub.css';

const AIInsightsHub = ({ tenantId, supabase }) => {
  const [activeTab, setActiveTab] = useState('summaries');
  const [loading, setLoading] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);
  const [regulatoryChanges, setRegulatoryChanges] = useState([]);
  const [aiSummaries, setAiSummaries] = useState({});
  const [controlSuggestions, setControlSuggestions] = useState([]);
  const [actionModal, setActionModal] = useState({ show: false, type: '', title: '' });

  // Handle recommendation actions
  const handleRecommendationAction = (actionType, title) => {
    setActionModal({ show: true, type: actionType, title: title });
  };

  const closeActionModal = () => {
    setActionModal({ show: false, type: '', title: '' });
  };

  // Built-in sample regulatory changes for demonstration
  const sampleRegChanges = [
    {
      id: 'ai-reg-1',
      source: 'FCA',
      title: 'PS26/2: Consumer Duty - Annual Value Assessment Requirements',
      impact_rating: 'high',
      published_date: '2026-01-25',
      effective_date: '2026-07-31',
      affected_controls: ['Consumer Duty', 'Product Governance', 'Fair Value']
    },
    {
      id: 'ai-reg-2',
      source: 'PRA',
      title: 'SS2/26: Operational Resilience - Third-Party Concentration Risk',
      impact_rating: 'high',
      published_date: '2026-01-20',
      effective_date: '2026-09-30',
      affected_controls: ['Operational Resilience', 'Third Party Risk', 'Business Continuity']
    },
    {
      id: 'ai-reg-3',
      source: 'FCA',
      title: 'CP26/3: Anti-Money Laundering - Enhanced Customer Due Diligence',
      impact_rating: 'high',
      published_date: '2026-01-18',
      effective_date: '2026-06-30',
      affected_controls: ['Financial Crime', 'AML', 'KYC']
    },
    {
      id: 'ai-reg-4',
      source: 'PRA',
      title: 'SS1/26: Climate Risk - Stress Testing Requirements',
      impact_rating: 'medium',
      published_date: '2026-01-15',
      effective_date: '2026-12-31',
      affected_controls: ['Climate Risk', 'Risk Management', 'Stress Testing']
    },
    {
      id: 'ai-reg-5',
      source: 'ESMA',
      title: 'DORA - Final RTS on ICT Risk Management Framework',
      impact_rating: 'high',
      published_date: '2026-01-10',
      effective_date: '2026-01-17',
      affected_controls: ['Operational Resilience', 'ICT Risk', 'Cyber Security']
    }
  ];

  useEffect(() => {
    loadRegulatoryChanges();
  }, []);

  const loadRegulatoryChanges = async () => {
    let changes = [];

    // Try to load from Supabase first
    if (supabase && supabase.isConfigured) {
      try {
        const { data, error } = await supabase.from('reg_changes').select('*').limit(10);
        if (!error && data && data.length > 0) {
          changes = data;
        }
      } catch (err) {
        console.log('Using sample data for AI Insights');
      }
    }

    // Try mock database
    if (changes.length === 0 && typeof window !== 'undefined' && window.mockDatabase?.reg_changes?.length > 0) {
      changes = window.mockDatabase.reg_changes;
    }

    // Fall back to built-in sample data
    if (changes.length === 0) {
      changes = sampleRegChanges;
    }

    setRegulatoryChanges(changes);

    // Generate AI summaries for each change
    const summaries = {};
    changes.forEach(change => {
      summaries[change.id] = generateAISummary(change);
    });
    setAiSummaries(summaries);
  };

  const generateAISummary = (change) => {
    // Simulated AI-generated summaries based on the regulatory change
    const summaryTemplates = {
      'Consumer Duty': {
        summary: `This regulatory update focuses on Consumer Duty requirements, emphasizing the need for firms to deliver good outcomes for retail customers. Key areas include product governance, price and value assessments, and consumer understanding.`,
        keyRequirements: [
          'Ensure products and services meet the needs of target customers',
          'Review pricing structures to ensure fair value',
          'Improve clarity of customer communications',
          'Implement ongoing monitoring of customer outcomes'
        ],
        affectedAreas: ['Product Development', 'Pricing', 'Marketing', 'Customer Service'],
        implementationPriority: 'HIGH',
        estimatedEffort: '3-6 months'
      },
      'Operational Resilience': {
        summary: `This update addresses operational resilience requirements, requiring firms to identify important business services and set impact tolerances. Firms must be able to remain within these tolerances during severe but plausible scenarios.`,
        keyRequirements: [
          'Map important business services end-to-end',
          'Set impact tolerances for each service',
          'Conduct scenario testing',
          'Develop robust recovery plans'
        ],
        affectedAreas: ['IT', 'Operations', 'Business Continuity', 'Third Party Management'],
        implementationPriority: 'HIGH',
        estimatedEffort: '6-12 months'
      },
      'Financial Crime': {
        summary: `This regulatory change strengthens financial crime prevention requirements, with enhanced focus on transaction monitoring, customer due diligence, and suspicious activity reporting.`,
        keyRequirements: [
          'Enhance transaction monitoring systems',
          'Update customer risk assessment procedures',
          'Improve SAR filing processes',
          'Strengthen PEP and sanctions screening'
        ],
        affectedAreas: ['Compliance', 'AML Operations', 'Customer Onboarding', 'Risk Management'],
        implementationPriority: 'CRITICAL',
        estimatedEffort: '2-4 months'
      },
      'Climate Risk': {
        summary: `This update introduces climate-related financial risk requirements aligned with TCFD recommendations. Firms must integrate climate risk into their risk management frameworks and enhance disclosures.`,
        keyRequirements: [
          'Develop climate risk governance framework',
          'Integrate climate into risk appetite',
          'Implement scenario analysis capabilities',
          'Enhance climate-related disclosures'
        ],
        affectedAreas: ['Risk Management', 'Finance', 'Strategy', 'Investor Relations'],
        implementationPriority: 'MEDIUM',
        estimatedEffort: '6-12 months'
      }
    };

    // Match based on title or category
    for (const [key, template] of Object.entries(summaryTemplates)) {
      if (change.title?.toLowerCase().includes(key.toLowerCase()) ||
          change.affected_controls?.some(c => c.toLowerCase().includes(key.toLowerCase()))) {
        return {
          ...template,
          generatedAt: new Date().toISOString(),
          confidence: 0.92
        };
      }
    }

    // Default template
    return {
      summary: `This regulatory update from ${change.source} introduces new requirements that may impact your control framework. A detailed review is recommended to assess the full scope of changes and determine necessary actions.`,
      keyRequirements: [
        'Review the full regulatory text for specific requirements',
        'Assess impact on existing policies and procedures',
        'Identify affected controls and processes',
        'Develop implementation timeline'
      ],
      affectedAreas: ['Compliance', 'Operations', 'Risk Management'],
      implementationPriority: change.impact_rating === 'high' ? 'HIGH' : 'MEDIUM',
      estimatedEffort: '1-3 months',
      generatedAt: new Date().toISOString(),
      confidence: 0.85
    };
  };

  const generateControlSuggestions = (change) => {
    setLoading(true);
    setTimeout(() => {
      const suggestions = [
        {
          id: 1,
          controlCode: 'CTRL-NEW-001',
          title: `${change.title} - Monitoring Control`,
          description: 'Automated monitoring control to track compliance with new requirements',
          frequency: 'Continuous',
          owner: 'Compliance Team',
          matchScore: 95
        },
        {
          id: 2,
          controlCode: 'CTRL-NEW-002',
          title: `${change.title} - Review Control`,
          description: 'Periodic review to ensure ongoing adherence to regulatory expectations',
          frequency: 'Monthly',
          owner: 'Risk Management',
          matchScore: 88
        },
        {
          id: 3,
          controlCode: 'CTRL-NEW-003',
          title: `${change.title} - Reporting Control`,
          description: 'Structured reporting mechanism for management and board oversight',
          frequency: 'Quarterly',
          owner: 'Compliance Team',
          matchScore: 82
        }
      ];
      setControlSuggestions(suggestions);
      setLoading(false);
    }, 1500);
  };

  const handleAnalyze = (change) => {
    setSelectedChange(change);
    generateControlSuggestions(change);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'priority-critical';
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  return (
    <div className="ai-insights-hub">
      <header className="aih-header">
        <div className="aih-title">
          <Brain size={28} />
          <h1>AI Insights Hub</h1>
          <span className="ai-badge"><Sparkles size={14} /> AI-Powered</span>
        </div>
        <p className="aih-subtitle">Intelligent regulatory analysis and control recommendations</p>
      </header>

      <div className="aih-stats">
        <div className="stat-card">
          <div className="stat-icon"><FileText size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{regulatoryChanges.length}</div>
            <div className="stat-label">Changes Analyzed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Target size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{Object.keys(aiSummaries).length}</div>
            <div className="stat-label">AI Summaries</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Zap size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">92%</div>
            <div className="stat-label">Avg Confidence</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">85%</div>
            <div className="stat-label">Time Saved</div>
          </div>
        </div>
      </div>

      <div className="aih-tabs">
        <button
          className={`aih-tab ${activeTab === 'summaries' ? 'active' : ''}`}
          onClick={() => setActiveTab('summaries')}
        >
          <FileText size={18} /> AI Summaries
        </button>
        <button
          className={`aih-tab ${activeTab === 'suggestions' ? 'active' : ''}`}
          onClick={() => setActiveTab('suggestions')}
        >
          <Target size={18} /> Control Suggestions
        </button>
        <button
          className={`aih-tab ${activeTab === 'impact' ? 'active' : ''}`}
          onClick={() => setActiveTab('impact')}
        >
          <TrendingUp size={18} /> Impact Analysis
        </button>
      </div>

      <div className="aih-content">
        {activeTab === 'summaries' && (
          <div className="summaries-panel">
            <div className="changes-list">
              {regulatoryChanges.map(change => (
                <div key={change.id} className="change-card">
                  <div className="change-header">
                    <div className="change-source">{change.source}</div>
                    <span className={`impact-badge ${change.impact_rating}`}>
                      {change.impact_rating}
                    </span>
                  </div>
                  <h3 className="change-title">{change.title}</h3>

                  {aiSummaries[change.id] && (
                    <div className="ai-summary">
                      <div className="summary-header">
                        <Sparkles size={16} />
                        <span>AI Summary</span>
                        <span className="confidence">
                          {Math.round(aiSummaries[change.id].confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="summary-text">{aiSummaries[change.id].summary}</p>

                      <div className="summary-details">
                        <div className="detail-section">
                          <h4>Key Requirements</h4>
                          <ul>
                            {aiSummaries[change.id].keyRequirements.map((req, idx) => (
                              <li key={idx}><CheckCircle size={14} /> {req}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="detail-meta">
                          <div className="meta-item">
                            <span className="meta-label">Affected Areas:</span>
                            <div className="meta-tags">
                              {aiSummaries[change.id].affectedAreas.map((area, idx) => (
                                <span key={idx} className="area-tag">{area}</span>
                              ))}
                            </div>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Priority:</span>
                            <span className={`priority-badge ${getPriorityClass(aiSummaries[change.id].implementationPriority)}`}>
                              {aiSummaries[change.id].implementationPriority}
                            </span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Est. Effort:</span>
                            <span>{aiSummaries[change.id].estimatedEffort}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="analyze-btn"
                        onClick={() => handleAnalyze(change)}
                      >
                        <Target size={16} /> Generate Control Suggestions
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-panel">
            {!selectedChange ? (
              <div className="empty-state">
                <Target size={48} />
                <h3>Select a Regulatory Change</h3>
                <p>Go to AI Summaries and click "Generate Control Suggestions" on any change to see AI-recommended controls.</p>
              </div>
            ) : (
              <div className="suggestions-content">
                <div className="selected-change">
                  <h3>Control Suggestions for:</h3>
                  <div className="change-reference">
                    <span className="source-badge">{selectedChange.source}</span>
                    <span>{selectedChange.title}</span>
                  </div>
                </div>

                {loading ? (
                  <div className="loading-state">
                    <RefreshCw size={32} className="spin" />
                    <p>AI is analyzing and generating control suggestions...</p>
                  </div>
                ) : (
                  <div className="suggestions-list">
                    {controlSuggestions.map(suggestion => (
                      <div key={suggestion.id} className="suggestion-card">
                        <div className="suggestion-header">
                          <span className="control-code">{suggestion.controlCode}</span>
                          <div className="match-score">
                            <Sparkles size={14} />
                            {suggestion.matchScore}% match
                          </div>
                        </div>
                        <h4 className="suggestion-title">{suggestion.title}</h4>
                        <p className="suggestion-desc">{suggestion.description}</p>
                        <div className="suggestion-meta">
                          <span><Clock size={14} /> {suggestion.frequency}</span>
                          <span>Owner: {suggestion.owner}</span>
                        </div>
                        <div className="suggestion-actions">
                          <button className="add-control-btn">
                            <CheckCircle size={16} /> Add to Control Library
                          </button>
                          <button className="customize-btn">Customize</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'impact' && (
          <div className="impact-panel">
            <div className="impact-overview">
              <h3>AI-Powered Impact Analysis</h3>
              <p>Comprehensive view of how regulatory changes affect your control framework</p>
            </div>

            <div className="impact-matrix">
              <div className="matrix-header">
                <div className="matrix-title">Impact by Business Area</div>
              </div>
              <div className="matrix-grid">
                {['Product', 'Operations', 'Technology', 'Risk', 'Finance', 'Compliance'].map(area => {
                  const impactLevel = Math.random() > 0.5 ? 'high' : Math.random() > 0.5 ? 'medium' : 'low';
                  const changeCount = Math.floor(Math.random() * 5) + 1;
                  return (
                    <div key={area} className={`matrix-cell ${impactLevel}`}>
                      <div className="cell-area">{area}</div>
                      <div className="cell-count">{changeCount} changes</div>
                      <div className={`cell-impact impact-${impactLevel}`}>{impactLevel} impact</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="impact-recommendations">
              <h4><AlertTriangle size={18} /> Priority Recommendations</h4>
              <div className="recommendation-list">
                <div className="recommendation-item high">
                  <div className="rec-icon"><AlertTriangle size={20} /></div>
                  <div className="rec-content">
                    <div className="rec-title">Consumer Duty Implementation Gap</div>
                    <div className="rec-desc">3 controls require updates to meet new Consumer Duty requirements by Q2 2026</div>
                  </div>
                  <button className="rec-action" onClick={() => handleRecommendationAction('review', 'Consumer Duty Implementation Gap')}>Review</button>
                </div>
                <div className="recommendation-item medium">
                  <div className="rec-icon"><Clock size={20} /></div>
                  <div className="rec-content">
                    <div className="rec-title">Operational Resilience Testing</div>
                    <div className="rec-desc">Scenario testing due within 60 days for 2 important business services</div>
                  </div>
                  <button className="rec-action" onClick={() => handleRecommendationAction('schedule', 'Operational Resilience Testing')}>Schedule</button>
                </div>
                <div className="recommendation-item low">
                  <div className="rec-icon"><CheckCircle size={20} /></div>
                  <div className="rec-content">
                    <div className="rec-title">Climate Risk Disclosures</div>
                    <div className="rec-desc">Framework in place, minor enhancements recommended for TCFD alignment</div>
                  </div>
                  <button className="rec-action" onClick={() => handleRecommendationAction('view', 'Climate Risk Disclosures')}>View</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionModal.show && (
        <div className="action-modal-overlay" onClick={closeActionModal}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="action-modal-header">
              <h3>{actionModal.type === 'review' ? 'Review Recommendation' : actionModal.type === 'schedule' ? 'Schedule Action' : 'View Details'}</h3>
              <button className="close-modal-btn" onClick={closeActionModal}>×</button>
            </div>
            <div className="action-modal-body">
              <h4>{actionModal.title}</h4>
              {actionModal.type === 'review' && (
                <div className="modal-content">
                  <p>This recommendation requires immediate attention. The following controls need updates:</p>
                  <ul>
                    <li>CTRL-CD-001: Customer Outcome Monitoring</li>
                    <li>CTRL-CD-002: Fair Value Assessment</li>
                    <li>CTRL-CD-003: Consumer Understanding Review</li>
                  </ul>
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={closeActionModal}>Create Action Plan</button>
                    <button className="btn-secondary" onClick={closeActionModal}>Assign to Team</button>
                  </div>
                </div>
              )}
              {actionModal.type === 'schedule' && (
                <div className="modal-content">
                  <p>Schedule scenario testing for the following important business services:</p>
                  <ul>
                    <li>Payment Processing Service - Due: March 2026</li>
                    <li>Customer Onboarding Platform - Due: April 2026</li>
                  </ul>
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={closeActionModal}>Schedule Now</button>
                    <button className="btn-secondary" onClick={closeActionModal}>Add to Calendar</button>
                  </div>
                </div>
              )}
              {actionModal.type === 'view' && (
                <div className="modal-content">
                  <p>Current status of Climate Risk Disclosures:</p>
                  <div className="status-indicator good">
                    <CheckCircle size={16} /> Framework Implemented
                  </div>
                  <p><strong>Recommended Enhancements:</strong></p>
                  <ul>
                    <li>Add Scope 3 emissions data</li>
                    <li>Expand scenario analysis to 2050</li>
                    <li>Include transition risk metrics</li>
                  </ul>
                  <div className="modal-actions">
                    <button className="btn-primary" onClick={closeActionModal}>View Full Report</button>
                    <button className="btn-secondary" onClick={closeActionModal}>Close</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsightsHub;
