import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './AttestationsBoard.css';

const AttestationsBoard = () => {
  const [loading, setLoading] = useState(true);
  const [attestationStats, setAttestationStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    completionRate: 0
  });
  const [attestationsByControl, setAttestationsByControl] = useState([]);
  const [confidenceSummary, setConfidenceSummary] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttestationData();
  }, []);

  const fetchAttestationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the view that we know works (same as StrategicDashboard)
      const { data: confidenceData, error: confidenceError } = await supabase
        .from('v_attestation_confidence_index')
        .select('*')
        .order('confidence_score', { ascending: true });

      if (confidenceError) throw confidenceError;

      // Fetch confidence summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('v_attestation_confidence_summary')
        .select('*');

      if (summaryError) throw summaryError;

      // Calculate stats from the confidence data
      const total = confidenceData?.length || 0;
      const completed = confidenceData?.filter(a => a.status === 'approved').length || 0;
      const pending = confidenceData?.filter(a => a.status === 'pending').length || 0;
      const overdue = confidenceData?.filter(a => a.days_delta > 0 && a.status !== 'approved').length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setAttestationStats({
        total,
        pending,
        completed,
        overdue,
        completionRate
      });

      setAttestationsByControl(confidenceData || []);
      setConfidenceSummary(summaryData || []);

    } catch (err) {
      console.error('Error fetching attestation data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status, confidenceBand) => {
    if (status === 'approved') return 'status-badge status-completed';
    if (confidenceBand === 'LOW_CONFIDENCE') return 'status-badge status-overdue';
    return 'status-badge status-pending';
  };

  const getConfidenceBadgeClass = (band) => {
    switch (band) {
      case 'HIGH_CONFIDENCE': return 'confidence-badge high';
      case 'MEDIUM_CONFIDENCE': return 'confidence-badge medium';
      case 'LOW_CONFIDENCE': return 'confidence-badge low';
      default: return 'confidence-badge';
    }
  };

  if (loading) {
    return (
      <div className="attestations-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading attestation data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attestations-board">
        <div className="error-state">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchAttestationData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="attestations-board">
      <header className="board-header">
        <h1>Attestations Board</h1>
        <p className="board-subtitle">Board-level attestation compliance tracking</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Attestations</div>
          <div className="kpi-value">{attestationStats.total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value kpi-warning">{attestationStats.pending}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Completed</div>
          <div className="kpi-value kpi-success">{attestationStats.completed}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Overdue / At Risk</div>
          <div className="kpi-value kpi-danger">{attestationStats.overdue}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Completion Rate</div>
          <div className="kpi-value">{attestationStats.completionRate}%</div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-bar"
              style={{ width: `${attestationStats.completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Confidence Summary Cards */}
      {confidenceSummary.length > 0 && (
        <div className="data-section">
          <h2>Confidence Distribution</h2>
          <div className="confidence-grid">
            {confidenceSummary.map((summary, index) => (
              <div key={index} className={`confidence-card ${summary.confidence_band?.toLowerCase().replace('_', '-')}`}>
                <h4>{summary.confidence_band?.replace(/_/g, ' ')}</h4>
                <div className="confidence-value">{summary.attestation_count || 0}</div>
                <p className="confidence-detail">Avg Score: {Math.round(summary.avg_confidence_score || 0)}</p>
                {summary.late_count > 0 && (
                  <p className="confidence-warning">{summary.late_count} late submissions</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attestations by Control */}
      <div className="data-section">
        <h2>Attestations by Control</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Status</th>
                <th>Confidence</th>
                <th>Score</th>
                <th>Driver</th>
              </tr>
            </thead>
            <tbody>
              {attestationsByControl.length > 0 ? (
                attestationsByControl.slice(0, 15).map((attestation, index) => (
                  <tr key={index}>
                    <td className="control-code">
                      {attestation.control_code || 'N/A'}
                    </td>
                    <td>{attestation.control_title || 'Unknown Control'}</td>
                    <td>
                      <span className={getStatusBadgeClass(attestation.status, attestation.confidence_band)}>
                        {attestation.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={getConfidenceBadgeClass(attestation.confidence_band)}>
                        {attestation.confidence_band?.replace(/_/g, ' ') || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div className="score-cell">
                        <div className="score-bar">
                          <div
                            className="score-fill"
                            style={{ width: `${attestation.confidence_score || 0}%` }}
                          ></div>
                        </div>
                        <span>{attestation.confidence_score || 0}</span>
                      </div>
                    </td>
                    <td className="driver-cell">{attestation.confidence_driver || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No attestations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttestationsBoard;
