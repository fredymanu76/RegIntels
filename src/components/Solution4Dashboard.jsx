/**
 * Issue & Breach Management Dashboard Component
 * Operational Risk Signal Hub - Exception Management Intelligence
 */

import React, { useState, useEffect } from 'react';
import {
  getExceptionOverview,
  getExceptionList,
  getMaterialityDistribution,
  getRiskTimeline,
  getTopControlsByExceptions,
  getRecurrencePatternSummary,
  getUrgencyAlerts,
  subscribeToExceptions
} from '../services/solution4Service';
import './Solution4Dashboard.css';

const Solution4Dashboard = ({ supabase }) => {
  const [overview, setOverview] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [topControls, setTopControls] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        overviewResult,
        exceptionsResult,
        distributionResult,
        timelineResult,
        topControlsResult,
        alertsResult
      ] = await Promise.all([
        getExceptionOverview(),
        getExceptionList(),
        getMaterialityDistribution(),
        getRiskTimeline(),
        getTopControlsByExceptions(10),
        getUrgencyAlerts(5)
      ]);

      if (overviewResult.error) throw overviewResult.error;
      if (exceptionsResult.error) throw exceptionsResult.error;
      if (distributionResult.error) throw distributionResult.error;
      if (timelineResult.error) throw timelineResult.error;
      if (topControlsResult.error) throw topControlsResult.error;
      if (alertsResult.error) throw alertsResult.error;

      setOverview(overviewResult.data);
      setExceptions(exceptionsResult.data);
      setDistribution(distributionResult.data);
      setTimeline(timelineResult.data);
      setTopControls(topControlsResult.data);
      setAlerts(alertsResult.data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardData();

    // Subscribe to real-time updates
    const subscription = subscribeToExceptions(() => {
      loadDashboardData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Get badge color for materiality band
  const getBandColor = (band) => {
    const colors = {
      'CRITICAL': '#F97316',
      'HIGH': '#F97316',
      'MEDIUM': '#F97316',
      'LOW': '#F97316'
    };
    return colors[band] || '#9CA3AF';
  };

  // Get badge color for urgency level
  const getUrgencyColor = (level) => {
    const colors = {
      'IMMEDIATE_ATTENTION': '#F97316',
      'ESCALATE': '#F97316',
      'MONITOR': '#FB923C',
      'TRACK': '#FB923C'
    };
    return colors[level] || '#9CA3AF';
  };

  if (loading) {
    return (
      <div className="solution4-dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading Exception Intelligence Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="solution4-dashboard error">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={loadDashboardData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="solution4-dashboard">
      <div className="dashboard-header">
        <h1>🎯 Operational Risk Signal Hub</h1>
        <p className="subtitle">Exception Management Intelligence</p>
      </div>

      {/* Overview KPI Cards */}
      {overview && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-icon">📊</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.total_exceptions}</div>
              <div className="kpi-label">Total Exceptions</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">🔴</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.open_exceptions}</div>
              <div className="kpi-label">Open</div>
            </div>
          </div>

          <div className="kpi-card critical">
            <div className="kpi-icon">⚠️</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.critical_exceptions}</div>
              <div className="kpi-label">Critical</div>
            </div>
          </div>

          <div className="kpi-card warning">
            <div className="kpi-icon">🔶</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.high_exceptions}</div>
              <div className="kpi-label">High</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">📈</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.avg_materiality_score}</div>
              <div className="kpi-label">Avg Score</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon">⏰</div>
            <div className="kpi-content">
              <div className="kpi-value">{overview.aged_exceptions}</div>
              <div className="kpi-label">Aged (&gt;30d)</div>
            </div>
          </div>
        </div>
      )}

      {/* Urgency Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="alerts-section">
          <h2>🚨 Urgent Attention Required</h2>
          <div className="alerts-list">
            {alerts.map((alert) => (
              <div
                key={alert.exception_id}
                className="alert-item"
                style={{ borderLeftColor: getUrgencyColor(alert.urgency_level) }}
              >
                <div className="alert-header">
                  <span className="alert-title">{alert.exception_title}</span>
                  <span
                    className="alert-badge"
                    style={{ backgroundColor: getUrgencyColor(alert.urgency_level) }}
                  >
                    {alert.urgency_level.replace('_', ' ')}
                  </span>
                </div>
                <div className="alert-details">
                  <span>{alert.control_name}</span>
                  <span>{alert.days_open} days open</span>
                  <span className="alert-age-band">{alert.age_band}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Exception List Table */}
        <div className="dashboard-card full-width">
          <h2>📋 Exception List</h2>
          <div className="table-wrapper">
            <table className="exceptions-table">
              <thead>
                <tr>
                  <th>Exception</th>
                  <th>Control</th>
                  <th>Status</th>
                  <th>Severity</th>
                  <th>Days Open</th>
                  <th>Score</th>
                  <th>Materiality</th>
                </tr>
              </thead>
              <tbody>
                {exceptions.map((exception) => (
                  <tr key={exception.exception_id}>
                    <td>{exception.exception_title}</td>
                    <td>{exception.control_name}</td>
                    <td>
                      <span className={`status-badge status-${exception.status}`}>
                        {exception.status}
                      </span>
                    </td>
                    <td>
                      <span className={`severity-badge severity-${exception.severity}`}>
                        {exception.severity}
                      </span>
                    </td>
                    <td>{exception.days_open}d</td>
                    <td className="score-cell">{Math.round(exception.total_materiality_score)}</td>
                    <td>
                      <span
                        className="materiality-badge"
                        style={{ backgroundColor: getBandColor(exception.materiality_band) }}
                      >
                        {exception.materiality_band}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Materiality Distribution Chart */}
        <div className="dashboard-card">
          <h2>📊 Materiality Distribution</h2>
          <div className="chart-container">
            {distribution.map((item) => (
              <div key={item.materiality_band} className="bar-item">
                <div className="bar-label">{item.materiality_band}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: getBandColor(item.materiality_band)
                    }}
                  ></div>
                </div>
                <div className="bar-value">{item.count} ({item.percentage}%)</div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Timeline */}
        <div className="dashboard-card">
          <h2>⏱️ Risk Acceleration Timeline</h2>
          <div className="timeline-list">
            {timeline.map((item, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-header">
                  <span className="timeline-age-band">{item.age_band}</span>
                  <span
                    className="timeline-urgency"
                    style={{ backgroundColor: getUrgencyColor(item.urgency_level) }}
                  >
                    {item.urgency_level}
                  </span>
                </div>
                <div className="timeline-stats">
                  <span>{item.exception_count} exceptions</span>
                  <span>Avg: {item.avg_days_open} days</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Controls by Exception Count */}
        <div className="dashboard-card full-width">
          <h2>🎯 Problem Controls</h2>
          <div className="controls-grid">
            {topControls.map((control) => (
              <div key={control.control_id} className="control-card">
                <div className="control-header">
                  <h3>{control.control_title || 'Unknown Control'}</h3>
                  <span className={`recurrence-badge recurrence-${control.recurrence_pattern.toLowerCase()}`}>
                    {control.recurrence_pattern}
                  </span>
                </div>
                <div className="control-stats">
                  <div className="stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">{control.total_exceptions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Open</span>
                    <span className="stat-value">{control.open_exceptions}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Last 3m</span>
                    <span className="stat-value">{control.exceptions_last_3m}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Solution4Dashboard;
