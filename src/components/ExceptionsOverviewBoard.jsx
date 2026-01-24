import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './ExceptionsOverviewBoard.css';

const ExceptionsOverviewBoard = () => {
  const [loading, setLoading] = useState(true);
  const [exceptionStats, setExceptionStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [severitySummary, setSeveritySummary] = useState([]);
  const [agingAnalysis, setAgingAnalysis] = useState([]);
  const [exceptionsByControl, setExceptionsByControl] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExceptionData();
  }, []);

  const fetchExceptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch severity summary from view
      const { data: severityData, error: severityError } = await supabase
        .from('v_exceptions_severity_summary')
        .select('*');

      if (severityError) throw severityError;

      setSeveritySummary(severityData || []);

      // Calculate total stats
      const total = (severityData || []).reduce((sum, item) => sum + (item.exception_count || 0), 0);
      const critical = (severityData || []).find(item => item.severity === 'critical')?.exception_count || 0;
      const high = (severityData || []).find(item => item.severity === 'high')?.exception_count || 0;
      const medium = (severityData || []).find(item => item.severity === 'medium')?.exception_count || 0;
      const low = (severityData || []).find(item => item.severity === 'low')?.exception_count || 0;

      setExceptionStats({ total, critical, high, medium, low });

      // Fetch aging analysis
      const { data: agingData, error: agingError } = await supabase
        .from('v_exceptions_aging_analysis')
        .select('*')
        .limit(20);

      if (agingError) throw agingError;
      setAgingAnalysis(agingData || []);

      // Fetch exceptions by control
      const { data: controlData, error: controlError } = await supabase
        .from('v_exceptions_by_control')
        .select('*')
        .limit(15);

      if (controlError) throw controlError;
      setExceptionsByControl(controlData || []);

    } catch (err) {
      console.error('Error fetching exception data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'severity-badge severity-critical';
      case 'high':
        return 'severity-badge severity-high';
      case 'medium':
        return 'severity-badge severity-medium';
      case 'low':
        return 'severity-badge severity-low';
      default:
        return 'severity-badge';
    }
  };

  const getAgeBucketColor = (bucket) => {
    if (bucket === '90+ days') return '#ef4444';
    if (bucket === '61-90 days') return '#f59e0b';
    if (bucket === '31-60 days') return '#eab308';
    return '#10b981';
  };

  if (loading) {
    return (
      <div className="exceptions-overview-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading exceptions data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exceptions-overview-board">
        <div className="error-state">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchExceptionData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exceptions-overview-board">
      <header className="board-header">
        <h1>Exceptions Overview Board</h1>
        <p className="board-subtitle">Board-level exception intelligence and monitoring</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Exceptions</div>
          <div className="kpi-value">{exceptionStats.total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Critical</div>
          <div className="kpi-value kpi-critical">{exceptionStats.critical}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">High</div>
          <div className="kpi-value kpi-high">{exceptionStats.high}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Medium</div>
          <div className="kpi-value kpi-medium">{exceptionStats.medium}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Low</div>
          <div className="kpi-value kpi-low">{exceptionStats.low}</div>
        </div>
      </div>

      {/* Severity Summary */}
      <div className="data-section">
        <h2>Exception Severity Summary</h2>
        <div className="severity-grid">
          {severitySummary.length > 0 ? (
            severitySummary.map((item, index) => (
              <div key={index} className="severity-card">
                <span className={getSeverityBadgeClass(item.severity)}>
                  {item.severity}
                </span>
                <div className="severity-stats">
                  <div className="stat">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{item.exception_count}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Open:</span>
                    <span className="stat-value">{item.open_count}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Closed:</span>
                    <span className="stat-value">{item.closed_count}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No exception data available</p>
          )}
        </div>
      </div>

      {/* Aging Analysis */}
      <div className="data-section">
        <h2>Exception Aging Analysis</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Exception Title</th>
                <th>Severity</th>
                <th>Opened Date</th>
                <th>Days Open</th>
                <th>Age Bucket</th>
              </tr>
            </thead>
            <tbody>
              {agingAnalysis.length > 0 ? (
                agingAnalysis.map((exception) => (
                  <tr key={exception.exception_id}>
                    <td className="title-cell">{exception.title || 'Untitled Exception'}</td>
                    <td>
                      <span className={getSeverityBadgeClass(exception.severity)}>
                        {exception.severity}
                      </span>
                    </td>
                    <td className="date-cell">
                      {exception.opened_at
                        ? new Date(exception.opened_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="days-cell">{Math.floor(exception.days_open || 0)}</td>
                    <td>
                      <span
                        className="age-badge"
                        style={{ backgroundColor: getAgeBucketColor(exception.age_bucket), color: 'white' }}
                      >
                        {exception.age_bucket}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No aging data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Exceptions by Control */}
      <div className="data-section">
        <h2>Exceptions by Control</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Exception Title</th>
                <th>Severity</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exceptionsByControl.length > 0 ? (
                exceptionsByControl.map((item) => (
                  <tr key={item.exception_id}>
                    <td className="control-code">{item.control_code || 'N/A'}</td>
                    <td>{item.control_title || 'Unknown Control'}</td>
                    <td>{item.exception_title || 'Untitled Exception'}</td>
                    <td>
                      <span className={getSeverityBadgeClass(item.severity)}>
                        {item.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No control linkage data available
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

export default ExceptionsOverviewBoard;
