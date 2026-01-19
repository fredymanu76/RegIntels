import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Shield, AlertCircle, CheckCircle, Clock, Activity } from 'lucide-react';
import './StrategicDashboard.css';

const StrategicDashboard = ({ supabase }) => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    criticalChanges: 0,
    criticalDrift: 0,
    lowConfidence: 0,
    totalChanges: 0,
    totalControls: 0,
    totalRuns: 0
  });
  const [impactScores, setImpactScores] = useState([]);
  const [driftScores, setDriftScores] = useState([]);
  const [confidenceScores, setConfidenceScores] = useState([]);
  const [driftSummary, setDriftSummary] = useState([]);
  const [confidenceSummary, setConfidenceSummary] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch impact scores
      const { data: impactData } = await supabase
        .from('v_regulatory_impact_score')
        .select('*')
        .order('total_impact_score', { ascending: false });

      // Fetch drift scores
      const { data: driftData } = await supabase
        .from('v_control_drift_index')
        .select('*')
        .order('drift_score', { ascending: false });

      // Fetch confidence scores
      const { data: confidenceData } = await supabase
        .from('v_attestation_confidence_index')
        .select('*')
        .order('confidence_score', { ascending: true });

      // Fetch drift summary
      const { data: driftSummaryData } = await supabase
        .from('v_control_drift_summary')
        .select('*');

      // Fetch confidence summary
      const { data: confidenceSummaryData } = await supabase
        .from('v_attestation_confidence_summary')
        .select('*');

      setImpactScores(impactData || []);
      setDriftScores(driftData || []);
      setConfidenceScores(confidenceData || []);
      setDriftSummary(driftSummaryData || []);
      setConfidenceSummary(confidenceSummaryData || []);

      // Calculate metrics
      setMetrics({
        criticalChanges: impactData?.filter(i => i.risk_band === 'CRITICAL').length || 0,
        criticalDrift: driftData?.filter(d => d.drift_status === 'CRITICAL_DRIFT').length || 0,
        lowConfidence: confidenceData?.filter(c => c.confidence_band === 'LOW_CONFIDENCE').length || 0,
        totalChanges: impactData?.length || 0,
        totalControls: driftData?.length || 0,
        totalRuns: confidenceData?.length || 0
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeClass = (riskBand) => {
    switch (riskBand) {
      case 'CRITICAL': return 'risk-badge critical';
      case 'HIGH': return 'risk-badge high';
      case 'MODERATE': return 'risk-badge moderate';
      default: return 'risk-badge';
    }
  };

  const getDriftBadgeClass = (driftStatus) => {
    switch (driftStatus) {
      case 'CRITICAL_DRIFT': return 'drift-badge critical';
      case 'MATERIAL_DRIFT': return 'drift-badge material';
      case 'EMERGING_DRIFT': return 'drift-badge emerging';
      case 'STABLE': return 'drift-badge stable';
      default: return 'drift-badge';
    }
  };

  const getConfidenceBadgeClass = (confidenceBand) => {
    switch (confidenceBand) {
      case 'HIGH_CONFIDENCE': return 'confidence-badge high';
      case 'MEDIUM_CONFIDENCE': return 'confidence-badge medium';
      case 'LOW_CONFIDENCE': return 'confidence-badge low';
      default: return 'confidence-badge';
    }
  };

  if (loading) {
    return (
      <div className="strategic-dashboard loading">
        <div className="loading-spinner">
          <Activity className="spin" size={48} />
          <p>Loading Strategic Scoring Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="strategic-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Strategic Compliance Dashboard</h1>
        <p className="subtitle">Real-time regulatory risk intelligence and control monitoring</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card critical">
          <div className="metric-icon">
            <AlertTriangle size={32} />
          </div>
          <div className="metric-content">
            <h3>Critical Changes</h3>
            <div className="metric-value">{metrics.criticalChanges}</div>
            <p className="metric-subtitle">of {metrics.totalChanges} total changes</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <TrendingUp size={32} />
          </div>
          <div className="metric-content">
            <h3>Critical Drift</h3>
            <div className="metric-value">{metrics.criticalDrift}</div>
            <p className="metric-subtitle">of {metrics.totalControls} total controls</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <Shield size={32} />
          </div>
          <div className="metric-content">
            <h3>Low Confidence</h3>
            <div className="metric-value">{metrics.lowConfidence}</div>
            <p className="metric-subtitle">of {metrics.totalRuns} control runs</p>
          </div>
        </div>
      </div>

      {/* Impact Scoring Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><AlertCircle size={24} /> Regulatory Impact Scores</h2>
          <p>Quantified regulatory exposure (0-100 scale)</p>
        </div>
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Change</th>
                <th>Materiality</th>
                <th>Score</th>
                <th>Risk Band</th>
                <th>Primary Driver</th>
                <th>Controls</th>
                <th>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {impactScores.slice(0, 10).map((score, index) => (
                <tr key={index}>
                  <td className="change-title">{score.change_title}</td>
                  <td>
                    <span className={`materiality-badge ${score.materiality}`}>
                      {score.materiality}
                    </span>
                  </td>
                  <td>
                    <div className="score-cell">
                      <div className="score-bar">
                        <div
                          className="score-fill"
                          style={{ width: `${score.total_impact_score}%` }}
                        ></div>
                      </div>
                      <span className="score-value">{score.total_impact_score}</span>
                    </div>
                  </td>
                  <td>
                    <span className={getRiskBadgeClass(score.risk_band)}>
                      {score.risk_band}
                    </span>
                  </td>
                  <td className="driver">{score.primary_driver}</td>
                  <td className="text-center">{score.affected_controls_count}</td>
                  <td className="text-center">
                    {score.overdue_actions_count > 0 && (
                      <span className="overdue-badge">{score.overdue_actions_count}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {impactScores.length === 0 && (
            <div className="no-data">
              <CheckCircle size={48} />
              <p>No regulatory changes tracked yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Control Drift Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><TrendingUp size={24} /> Control Drift Analysis</h2>
          <p>Early-warning system for compliance drift</p>
        </div>

        {/* Drift Summary Cards */}
        <div className="drift-summary-grid">
          {driftSummary.map((summary, index) => (
            <div key={index} className={`drift-summary-card ${summary.drift_status.toLowerCase()}`}>
              <h4>{summary.drift_status.replace(/_/g, ' ')}</h4>
              <div className="summary-value">{summary.control_count}</div>
              <p className="summary-detail">Avg Score: {Math.round(summary.avg_drift_score)}</p>
              {summary.total_failed_runs > 0 && (
                <p className="summary-warning">
                  <AlertTriangle size={16} /> {summary.total_failed_runs} failed runs
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Drift Table */}
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Status</th>
                <th>Score</th>
                <th>Driver</th>
                <th>Urgency</th>
                <th>Days Overdue</th>
                <th>Failed Runs</th>
                <th>Exceptions</th>
              </tr>
            </thead>
            <tbody>
              {driftScores.slice(0, 10).map((drift, index) => (
                <tr key={index}>
                  <td>
                    <div className="control-cell">
                      <strong>{drift.control_code}</strong>
                      <small>{drift.control_title}</small>
                    </div>
                  </td>
                  <td>
                    <span className={getDriftBadgeClass(drift.drift_status)}>
                      {drift.drift_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="score-cell">
                      <div className="score-bar">
                        <div
                          className="score-fill drift"
                          style={{ width: `${drift.drift_score}%` }}
                        ></div>
                      </div>
                      <span className="score-value">{drift.drift_score}</span>
                    </div>
                  </td>
                  <td className="driver">{drift.drift_driver}</td>
                  <td>
                    <span className={`urgency-badge ${drift.urgency_level.toLowerCase()}`}>
                      {drift.urgency_level}
                    </span>
                  </td>
                  <td className="text-center">{drift.review_delay_days}</td>
                  <td className="text-center">
                    {drift.failed_runs_count > 0 && (
                      <span className="failed-badge">{drift.failed_runs_count}</span>
                    )}
                  </td>
                  <td className="text-center">
                    {drift.open_exceptions_count > 0 && (
                      <span className="exception-badge">{drift.open_exceptions_count}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {driftScores.length === 0 && (
            <div className="no-data">
              <CheckCircle size={48} />
              <p>No controls to track yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Attestation Confidence Section */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2><Shield size={24} /> Attestation Confidence</h2>
          <p>Quality measurement for control runs (0-100 scale)</p>
        </div>

        {/* Confidence Summary Cards */}
        <div className="confidence-summary-grid">
          {confidenceSummary.map((summary, index) => (
            <div key={index} className={`confidence-summary-card ${summary.confidence_band.toLowerCase()}`}>
              <h4>{summary.confidence_band.replace(/_/g, ' ')}</h4>
              <div className="summary-value">{summary.run_count}</div>
              <p className="summary-detail">Avg: {Math.round(summary.avg_confidence_score)}</p>
              {summary.late_count > 0 && (
                <p className="summary-warning">
                  <Clock size={16} /> {summary.late_count} late submissions
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Confidence Table */}
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Band</th>
                <th>Driver</th>
                <th>Timeliness</th>
                <th>Role</th>
                <th>Days Late</th>
              </tr>
            </thead>
            <tbody>
              {confidenceScores.slice(0, 10).map((conf, index) => (
                <tr key={index}>
                  <td>
                    <div className="control-cell">
                      <strong>{conf.control_code}</strong>
                      <small>{conf.control_title}</small>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${conf.status}`}>
                      {conf.status}
                    </span>
                  </td>
                  <td>
                    <div className="score-cell">
                      <div className="score-bar">
                        <div
                          className="score-fill confidence"
                          style={{ width: `${conf.confidence_score}%` }}
                        ></div>
                      </div>
                      <span className="score-value">{conf.confidence_score}</span>
                    </div>
                  </td>
                  <td>
                    <span className={getConfidenceBadgeClass(conf.confidence_band)}>
                      {conf.confidence_band.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="driver">{conf.confidence_driver}</td>
                  <td className="text-center">{conf.timeliness_score}/40</td>
                  <td className="text-center">{conf.role_score}/30</td>
                  <td className="text-center">
                    {conf.days_delta > 0 && (
                      <span className="late-badge">+{conf.days_delta}</span>
                    )}
                    {conf.days_delta <= 0 && (
                      <span className="ontime-badge">{conf.days_delta}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {confidenceScores.length === 0 && (
            <div className="no-data">
              <CheckCircle size={48} />
              <p>No control runs recorded yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <div className="dashboard-actions">
        <button className="btn-refresh" onClick={fetchDashboardData}>
          <Activity size={20} /> Refresh Data
        </button>
      </div>
    </div>
  );
};

export default StrategicDashboard;
