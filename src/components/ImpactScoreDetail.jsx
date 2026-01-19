import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Shield, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import './ImpactScoreDetail.css';

const ImpactScoreDetail = ({ supabase, changeId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [impactScore, setImpactScore] = useState(null);

  useEffect(() => {
    if (changeId) {
      fetchImpactScoreDetail();
    }
  }, [changeId]);

  const fetchImpactScoreDetail = async () => {
    try {
      setLoading(false);

      const { data } = await supabase
        .from('v_regulatory_impact_score')
        .select('*')
        .eq('change_id', changeId)
        .single();

      setImpactScore(data);
    } catch (error) {
      console.error('Error fetching impact score detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!impactScore) {
    return <div className="error">Impact score not found</div>;
  }

  const getRiskColor = (band) => {
    switch (band) {
      case 'CRITICAL': return '#dc2626';
      case 'HIGH': return '#f59e0b';
      case 'MODERATE': return '#10b981';
      default: return '#64748b';
    }
  };

  return (
    <div className="impact-score-detail">
      <button className="back-button" onClick={onBack}>
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="detail-header">
        <h1>{impactScore.change_title}</h1>
        <div className="header-meta">
          <span className={`materiality-badge ${impactScore.materiality}`}>
            {impactScore.materiality.toUpperCase()}
          </span>
          <span className="regulator-badge">{impactScore.regulator}</span>
          <span className="date">
            Published: {new Date(impactScore.published_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="score-overview">
        <div className="total-score-card">
          <div className="score-circle" style={{ borderColor: getRiskColor(impactScore.risk_band) }}>
            <div className="score-value">{impactScore.total_impact_score}</div>
            <div className="score-label">Total Score</div>
          </div>
          <div className="risk-band" style={{ color: getRiskColor(impactScore.risk_band) }}>
            {impactScore.risk_band}
          </div>
          <div className="primary-driver">
            <AlertCircle size={16} />
            Primary Driver: {impactScore.primary_driver}
          </div>
        </div>

        <div className="score-breakdown">
          <h3>Score Breakdown</h3>
          <div className="breakdown-grid">
            <div className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">Regulatory Severity</span>
                <span className="breakdown-value">{impactScore.severity_score} / 30</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${(impactScore.severity_score / 30) * 100}%` }}
                ></div>
              </div>
              <p className="breakdown-desc">Based on materiality: {impactScore.materiality}</p>
            </div>

            <div className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">Business Surface Area</span>
                <span className="breakdown-value">{impactScore.surface_area_score} / 20</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${(impactScore.surface_area_score / 20) * 100}%` }}
                ></div>
              </div>
              <p className="breakdown-desc">
                {impactScore.affected_controls_count} controls affected
              </p>
            </div>

            <div className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">Control Coverage Gaps</span>
                <span className="breakdown-value">{impactScore.control_gap_score} / 25</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${(impactScore.control_gap_score / 25) * 100}%` }}
                ></div>
              </div>
              <p className="breakdown-desc">
                {impactScore.reviewed_controls_count} of {impactScore.affected_controls_count} reviewed
              </p>
            </div>

            <div className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">Execution Risk</span>
                <span className="breakdown-value">{impactScore.execution_risk_score} / 15</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${(impactScore.execution_risk_score / 15) * 100}%` }}
                ></div>
              </div>
              <p className="breakdown-desc">
                {impactScore.overdue_actions_count} overdue actions
              </p>
            </div>

            <div className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-label">Attestation Penalty</span>
                <span className="breakdown-value">{impactScore.attestation_penalty} / 10</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{ width: `${(impactScore.attestation_penalty / 10) * 100}%` }}
                ></div>
              </div>
              <p className="breakdown-desc">Control run quality issues</p>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <Shield size={24} />
          <div className="stat-content">
            <div className="stat-value">{impactScore.affected_controls_count}</div>
            <div className="stat-label">Affected Controls</div>
          </div>
        </div>

        <div className="stat-card">
          <CheckCircle size={24} />
          <div className="stat-content">
            <div className="stat-value">{impactScore.reviewed_controls_count}</div>
            <div className="stat-label">Reviewed Controls</div>
          </div>
        </div>

        <div className="stat-card">
          <Clock size={24} />
          <div className="stat-content">
            <div className="stat-value">{impactScore.overdue_actions_count}</div>
            <div className="stat-label">Overdue Actions</div>
          </div>
        </div>
      </div>

      <div className="recommendations">
        <h3>Recommended Actions</h3>
        <div className="recommendation-list">
          {impactScore.risk_band === 'CRITICAL' && (
            <div className="recommendation urgent">
              <AlertCircle size={20} />
              <div>
                <strong>Urgent:</strong> This change requires immediate board attention.
                Schedule an emergency compliance review within 48 hours.
              </div>
            </div>
          )}

          {impactScore.control_gap_score > 0 && (
            <div className="recommendation warning">
              <XCircle size={20} />
              <div>
                <strong>Control Gaps:</strong> Complete control reviews for all affected controls.
                {impactScore.affected_controls_count - impactScore.reviewed_controls_count} controls pending review.
              </div>
            </div>
          )}

          {impactScore.overdue_actions_count > 0 && (
            <div className="recommendation warning">
              <Clock size={20} />
              <div>
                <strong>Overdue Actions:</strong> Prioritize completion of {impactScore.overdue_actions_count} overdue
                remediation actions to reduce execution risk.
              </div>
            </div>
          )}

          {impactScore.risk_band === 'MODERATE' && (
            <div className="recommendation info">
              <CheckCircle size={20} />
              <div>
                <strong>Good Standing:</strong> This change is being managed effectively.
                Continue routine monitoring and maintain current compliance procedures.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImpactScoreDetail;
