import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './AuditTrailBoard.css';

const AuditTrailBoard = () => {
  const [loading, setLoading] = useState(true);
  const [auditStats, setAuditStats] = useState({
    totalEvents: 0,
    last24Hours: 0,
    last7Days: 0,
    criticalEvents: 0
  });
  const [recentAudits, setRecentAudits] = useState([]);
  const [auditsByAction, setAuditsByAction] = useState([]);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('7days');

  useEffect(() => {
    fetchAuditData();
  }, [filterPeriod]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date filters
      const now = new Date();
      const last24h = new Date(now - 24 * 60 * 60 * 1000);
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      let dateFilter = last7d;
      if (filterPeriod === '24hours') dateFilter = last24h;
      if (filterPeriod === '30days') dateFilter = last30d;

      // Fetch audit logs
      const { data: auditData, error: auditError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditError) throw auditError;

      const audits = auditData || [];

      // Calculate stats
      const totalEvents = audits.length;
      const last24Hours = audits.filter(a => new Date(a.created_at) >= last24h).length;
      const last7Days = audits.filter(a => new Date(a.created_at) >= last7d).length;
      const criticalEvents = audits.filter(a =>
        a.action_type === 'delete' || a.action_type === 'critical_change'
      ).length;

      setAuditStats({
        totalEvents,
        last24Hours,
        last7Days,
        criticalEvents
      });

      // Filter recent audits based on period
      const filteredAudits = audits
        .filter(a => new Date(a.created_at) >= dateFilter)
        .slice(0, 20);

      setRecentAudits(filteredAudits);

      // Group by action type
      const actionGroups = audits
        .filter(a => new Date(a.created_at) >= dateFilter)
        .reduce((acc, audit) => {
          const action = audit.action_type || 'unknown';
          if (!acc[action]) {
            acc[action] = { action_type: action, count: 0 };
          }
          acc[action].count++;
          return acc;
        }, {});

      setAuditsByAction(Object.values(actionGroups).sort((a, b) => b.count - a.count));

    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (actionType) => {
    switch (actionType?.toLowerCase()) {
      case 'create':
        return 'action-badge action-create';
      case 'update':
        return 'action-badge action-update';
      case 'delete':
        return 'action-badge action-delete';
      case 'login':
        return 'action-badge action-login';
      case 'logout':
        return 'action-badge action-logout';
      default:
        return 'action-badge action-default';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="audit-trail-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading audit trail data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audit-trail-board">
        <div className="error-state">
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          <button onClick={fetchAuditData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="audit-trail-board">
      <header className="board-header">
        <div>
          <h1>Audit Trail Board</h1>
          <p className="board-subtitle">Board-level system activity monitoring</p>
        </div>
        <div className="header-controls">
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
            className="period-filter"
          >
            <option value="24hours">Last 24 Hours</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
          </select>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Events</div>
          <div className="kpi-value">{auditStats.totalEvents}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Last 24 Hours</div>
          <div className="kpi-value kpi-info">{auditStats.last24Hours}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Last 7 Days</div>
          <div className="kpi-value kpi-success">{auditStats.last7Days}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Critical Events</div>
          <div className="kpi-value kpi-danger">{auditStats.criticalEvents}</div>
        </div>
      </div>

      {/* Activity by Action Type */}
      <div className="data-section">
        <h2>Activity by Action Type</h2>
        <div className="action-summary-grid">
          {auditsByAction.length > 0 ? (
            auditsByAction.map((item, index) => (
              <div key={index} className="action-summary-card">
                <span className={getActionBadgeClass(item.action_type)}>
                  {item.action_type}
                </span>
                <div className="action-count">{item.count}</div>
              </div>
            ))
          ) : (
            <p className="empty-state">No activity data available</p>
          )}
        </div>
      </div>

      {/* Recent Audit Events */}
      <div className="data-section">
        <h2>Recent Audit Events</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {recentAudits.length > 0 ? (
                recentAudits.map((audit) => (
                  <tr key={audit.id}>
                    <td className="timestamp-cell">
                      {formatTimestamp(audit.created_at)}
                    </td>
                    <td className="user-cell">
                      {audit.user_email || audit.user_id || 'System'}
                    </td>
                    <td>
                      <span className={getActionBadgeClass(audit.action_type)}>
                        {audit.action_type}
                      </span>
                    </td>
                    <td>{audit.entity_type || 'N/A'}</td>
                    <td className="entity-id-cell">
                      {audit.entity_id ? audit.entity_id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    <td className="details-cell">
                      {audit.details || audit.description || 'No details'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No audit events found for this period
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

export default AuditTrailBoard;
