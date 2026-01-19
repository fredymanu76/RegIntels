import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, FileText, CheckCircle, XCircle, AlertCircle, Activity, Clock, Target, Award, Download, Eye } from 'lucide-react';
import './ExceptionIntelligenceDashboard.css';

const ExceptionIntelligenceDashboard = ({ supabase }) => {
  const [exceptions, setExceptions] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedView, setSelectedView] = useState('intelligence'); // intelligence, heatmap, narratives
  const [selectedException, setSelectedException] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch comprehensive exception intelligence
      const { data: intelligenceData, error: intelligenceError } = await supabase
        .from('v_solution4_exception_intelligence')
        .select('*')
        .order('total_materiality_score', { ascending: false });

      if (intelligenceError) throw intelligenceError;

      // Fetch portfolio summary
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('v_exception_portfolio_summary')
        .select('*')
        .single();

      if (portfolioError) console.warn('Portfolio summary not available:', portfolioError);

      // Fetch heatmap data
      const { data: heatmapData, error: heatmapError } = await supabase
        .from('v_exception_portfolio_heatmap')
        .select('*');

      if (heatmapError) console.warn('Heatmap data not available:', heatmapError);

      setExceptions(intelligenceData || []);
      setPortfolioMetrics(portfolioData);
      setHeatmapData(heatmapData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialityColor = (band) => {
    switch (band) {
      case 'CRITICAL': return '#DC2626';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#FCD34D';
      default: return '#10B981';
    }
  };

  const getCoverageColor = (band) => {
    switch (band) {
      case 'COMPLETE': return '#10B981';
      case 'ADEQUATE': return '#3B82F6';
      case 'PARTIAL': return '#F59E0B';
      default: return '#DC2626';
    }
  };

  const getTrustColor = (score) => {
    if (score >= 75) return '#10B981';
    if (score >= 50) return '#F59E0B';
    return '#DC2626';
  };

  const downloadNarrative = (exception) => {
    const element = document.createElement('a');
    const file = new Blob([exception.narrative_text || 'Narrative not available'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Exception_${exception.exception_id}_Narrative.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="exception-intelligence-loading">
        <Activity size={48} className="spin" />
        <p>Loading Exception Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="exception-intelligence-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Exception Intelligence Hub</h1>
          <p className="subtitle">Operational Risk Signal Hub + Regulator-Ready Evidence Engine</p>
        </div>
        <div className="view-switcher">
          <button
            className={selectedView === 'intelligence' ? 'active' : ''}
            onClick={() => setSelectedView('intelligence')}
          >
            <Shield size={16} />
            Intelligence View
          </button>
          <button
            className={selectedView === 'heatmap' ? 'active' : ''}
            onClick={() => setSelectedView('heatmap')}
          >
            <Target size={16} />
            Portfolio Heatmap
          </button>
          <button
            className={selectedView === 'narratives' ? 'active' : ''}
            onClick={() => setSelectedView('narratives')}
          >
            <FileText size={16} />
            Exception Narratives
          </button>
        </div>
      </div>

      {/* Portfolio Metrics Cards */}
      {portfolioMetrics && (
        <div className="portfolio-metrics">
          <div className="metric-card critical">
            <div className="metric-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{portfolioMetrics.critical_exceptions || 0}</div>
              <div className="metric-label">Critical Exceptions</div>
              <div className="metric-sublabel">{portfolioMetrics.critical_aged || 0} aged > 90 days</div>
            </div>
          </div>

          <div className="metric-card high">
            <div className="metric-icon">
              <Activity size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{portfolioMetrics.high_exceptions || 0}</div>
              <div className="metric-label">High Priority</div>
              <div className="metric-sublabel">Accelerating risk trajectory</div>
            </div>
          </div>

          <div className="metric-card medium">
            <div className="metric-icon">
              <Clock size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{Math.round(portfolioMetrics.avg_days_open) || 0}</div>
              <div className="metric-label">Avg Days Open</div>
              <div className="metric-sublabel">Max: {portfolioMetrics.max_days_open || 0} days</div>
            </div>
          </div>

          <div className="metric-card score">
            <div className="metric-icon">
              <Award size={24} />
            </div>
            <div className="metric-content">
              <div className="metric-value">{Math.round(portfolioMetrics.avg_materiality_score) || 0}</div>
              <div className="metric-label">Avg Materiality</div>
              <div className="metric-sublabel">Out of 100</div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligence View */}
      {selectedView === 'intelligence' && (
        <div className="intelligence-view">
          <div className="exceptions-grid">
            {exceptions.map(exception => (
              <div
                key={exception.exception_id}
                className="exception-intelligence-card"
                onClick={() => setSelectedException(exception)}
              >
                <div className="card-header">
                  <h3>{exception.title}</h3>
                  <div className="status-badges">
                    <span className={`status-badge ${exception.status}`}>{exception.status}</span>
                    <span className="severity-badge">{exception.severity}</span>
                  </div>
                </div>

                {/* Block 4.1: Materiality Score */}
                <div className="intelligence-section">
                  <div className="section-header">
                    <AlertTriangle size={16} />
                    <span>Materiality Assessment</span>
                  </div>
                  <div className="materiality-display">
                    <div className="score-circle" style={{ borderColor: getMaterialityColor(exception.materiality_band) }}>
                      <span className="score-value">{exception.total_materiality_score || 0}</span>
                      <span className="score-label">/ 100</span>
                    </div>
                    <div className="score-breakdown">
                      <span className={`band-badge ${exception.materiality_band?.toLowerCase()}`}>
                        {exception.materiality_band || 'PENDING'}
                      </span>
                      <div className="breakdown-items">
                        <div className="breakdown-item">
                          <span>Regulatory Impact:</span>
                          <span>{exception.regulatory_impact_weight || 0}/30</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Control Failure:</span>
                          <span>{exception.control_failure_weight || 0}/30</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Duration:</span>
                          <span>{exception.duration_weight || 0}/25</span>
                        </div>
                        <div className="breakdown-item">
                          <span>Repeat:</span>
                          <span>{exception.repeat_occurrence_weight || 0}/15</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Block 4.2: Evidence Coverage */}
                <div className="intelligence-section">
                  <div className="section-header">
                    <FileText size={16} />
                    <span>Evidence Coverage</span>
                  </div>
                  <div className="coverage-display">
                    <div className="coverage-progress">
                      <div
                        className="coverage-fill"
                        style={{
                          width: `${exception.coverage_percentage || 0}%`,
                          background: getCoverageColor(exception.coverage_band)
                        }}
                      />
                    </div>
                    <div className="coverage-meta">
                      <span className="coverage-percent">{exception.coverage_percentage || 0}%</span>
                      <span className={`coverage-badge ${exception.coverage_band?.toLowerCase()}`}>
                        {exception.coverage_band || 'PENDING'}
                      </span>
                    </div>
                    {exception.missing_evidence_types && exception.missing_evidence_types.length > 0 && (
                      <div className="missing-evidence">
                        <small>Missing: {exception.missing_evidence_types.join(', ')}</small>
                      </div>
                    )}
                  </div>
                </div>

                {/* Block 4.3: Risk Trajectory */}
                <div className="intelligence-section">
                  <div className="section-header">
                    <TrendingUp size={16} />
                    <span>Risk Trajectory</span>
                  </div>
                  <div className="trajectory-display">
                    <span className="trajectory-indicator">{exception.trajectory_indicator || '→'}</span>
                    <span className={`trajectory-status ${exception.risk_trajectory?.toLowerCase()}`}>
                      {exception.risk_trajectory || 'STABLE'}
                    </span>
                    <div className="trajectory-meta">
                      <span>{exception.days_open || 0} days open</span>
                      {exception.days_overdue > 0 && (
                        <span className="overdue">{exception.days_overdue} days overdue</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Block 4.4: Evidence Trust */}
                <div className="intelligence-section">
                  <div className="section-header">
                    <Award size={16} />
                    <span>Evidence Trust</span>
                  </div>
                  <div className="trust-display">
                    <div className="trust-score" style={{ color: getTrustColor(exception.avg_evidence_trust_score) }}>
                      {exception.avg_evidence_trust_score || 'N/A'}
                      {exception.avg_evidence_trust_score && '/100'}
                    </div>
                    <div className="trust-meta">
                      <span>{exception.evidence_count || 0} evidence items</span>
                      <span>{exception.evidence_usage_count || 0} usage logs</span>
                    </div>
                  </div>
                </div>

                {/* Block 4.6: Heatmap Position */}
                {exception.heatmap_quadrant && (
                  <div className="intelligence-section">
                    <div className="section-header">
                      <Target size={16} />
                      <span>Portfolio Position</span>
                    </div>
                    <div className="heatmap-position">
                      <span
                        className="quadrant-badge"
                        style={{ background: exception.risk_color, color: '#fff' }}
                      >
                        {exception.heatmap_quadrant}
                      </span>
                    </div>
                  </div>
                )}

                <div className="card-actions">
                  <button className="btn-secondary" onClick={(e) => { e.stopPropagation(); /* View details */ }}>
                    <Eye size={14} />
                    View Details
                  </button>
                  <button className="btn-primary" onClick={(e) => { e.stopPropagation(); downloadNarrative(exception); }}>
                    <Download size={14} />
                    Export Narrative
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap View */}
      {selectedView === 'heatmap' && (
        <div className="heatmap-view">
          <div className="heatmap-header">
            <h2>Exception Portfolio Heatmap</h2>
            <p>Board-Level Risk Distribution: Materiality (X-axis) × Aging (Y-axis)</p>
          </div>

          <div className="heatmap-container">
            <div className="heatmap-grid">
              {/* Y-axis labels */}
              <div className="y-axis">
                <div className="y-label">AGED (&gt;6mo)</div>
                <div className="y-label">MATURING (3-6mo)</div>
                <div className="y-label">RECENT (1-3mo)</div>
                <div className="y-label">NEW (&lt;1mo)</div>
              </div>

              {/* Heatmap cells */}
              <div className="heatmap-cells">
                {['AGED (>6mo)', 'MATURING (3-6mo)', 'RECENT (1-3mo)', 'NEW (<1mo)'].map(ageCategory => (
                  <div key={ageCategory} className="heatmap-row">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(materialityBand => {
                      const cellExceptions = heatmapData.filter(
                        ex => ex.aging_category === ageCategory && ex.materiality_band === materialityBand
                      );
                      return (
                        <div
                          key={`${ageCategory}-${materialityBand}`}
                          className={`heatmap-cell ${materialityBand.toLowerCase()}`}
                          style={{
                            opacity: cellExceptions.length > 0 ? 0.7 + (cellExceptions.length * 0.1) : 0.1
                          }}
                        >
                          <span className="cell-count">{cellExceptions.length}</span>
                          {cellExceptions.length > 0 && (
                            <div className="cell-exceptions">
                              {cellExceptions.slice(0, 3).map(ex => (
                                <div key={ex.exception_id} className="cell-exception-item">
                                  {ex.title.substring(0, 30)}...
                                </div>
                              ))}
                              {cellExceptions.length > 3 && (
                                <small>+{cellExceptions.length - 3} more</small>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="x-axis">
                <div className="x-label">CRITICAL</div>
                <div className="x-label">HIGH</div>
                <div className="x-label">MEDIUM</div>
                <div className="x-label">LOW</div>
              </div>
            </div>

            <div className="heatmap-legend">
              <h4>Portfolio Insights</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#DC2626' }}></span>
                  <span>Critical - Immediate board attention</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#F59E0B' }}></span>
                  <span>High - Senior management action</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#FCD34D' }}></span>
                  <span>Medium - Management monitoring</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color" style={{ background: '#10B981' }}></span>
                  <span>Low - Operational tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Narratives View */}
      {selectedView === 'narratives' && (
        <div className="narratives-view">
          <div className="narratives-header">
            <h2>Auto-Generated Exception Narratives</h2>
            <p>Regulator-ready exception reports with complete context</p>
          </div>

          <div className="narratives-grid">
            {exceptions.filter(ex => ex.narrative_text).map(exception => (
              <div key={exception.exception_id} className="narrative-card">
                <div className="narrative-header">
                  <h3>{exception.title}</h3>
                  <button
                    className="btn-download"
                    onClick={() => downloadNarrative(exception)}
                  >
                    <Download size={16} />
                    Export
                  </button>
                </div>

                <div className="narrative-content">
                  <pre>{exception.narrative_text}</pre>
                </div>

                <div className="narrative-meta">
                  <span className={`materiality-badge ${exception.materiality_band?.toLowerCase()}`}>
                    {exception.materiality_band} ({exception.total_materiality_score}/100)
                  </span>
                  <span className="coverage-indicator">
                    Evidence: {exception.coverage_percentage}% ({exception.coverage_band})
                  </span>
                  <span className="trajectory-indicator">
                    Trajectory: {exception.risk_trajectory}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Exception Modal (Optional - for detailed view) */}
      {selectedException && (
        <div className="exception-modal-overlay" onClick={() => setSelectedException(null)}>
          <div className="exception-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedException.title}</h2>
              <button className="close-btn" onClick={() => setSelectedException(null)}>×</button>
            </div>
            <div className="modal-content">
              {/* Full exception details would go here */}
              <p>Full exception intelligence view - detailed breakdown of all 7 blocks</p>
              {/* This would be expanded with all the detailed views */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionIntelligenceDashboard;
