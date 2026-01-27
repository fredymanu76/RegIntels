import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnrichedAuditTrail,
  calculateAuditSummary
} from '../services/boardMetricsService';
import './AuditTrailBoard.css';

const AuditTrailBoard = ({ tenantId, supabase }) => {
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

  const fetchAndCalculateMetrics = useCallback(async () => {
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

      let auditData = [];

      // Try to fetch from Supabase if available
      if (supabase) {
        try {
          const { data, error: auditError } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

          if (!auditError && data && data.length > 0) {
            auditData = data;
          } else {
            // Try audit_trail table
            const { data: trailData } = await supabase
              .from('audit_trail')
              .select('*')
              .order('timestamp', { ascending: false })
              .limit(100);

            if (trailData) {
              auditData = trailData.map(a => ({
                ...a,
                created_at: a.timestamp,
                action_type: a.action,
                user_email: a.user
              }));
            }
          }
        } catch (err) {
          console.log('Supabase fetch failed, using mock data:', err.message);
        }
      }

      // If no data yet, try to get from window.mockDatabase
      if (auditData.length === 0 && typeof window !== 'undefined' && window.mockDatabase) {
        auditData = (window.mockDatabase.audit_trail || []).map(a => ({
          ...a,
          created_at: a.timestamp,
          action_type: a.action,
          user_email: a.user
        }));
      }

      // Filter by tenant if tenantId provided
      if (tenantId) {
        auditData = auditData.filter(a => a.tenant_id === tenantId);
      }

      // Calculate stats
      const totalEvents = auditData.length;
      const last24Hours = auditData.filter(a => new Date(a.created_at || a.timestamp) >= last24h).length;
      const last7Days = auditData.filter(a => new Date(a.created_at || a.timestamp) >= last7d).length;
      const criticalEvents = auditData.filter(a =>
        a.action_type === 'DELETE' || a.action_type === 'CLOSE' || a.action === 'DELETE'
      ).length;

      setAuditStats({
        totalEvents,
        last24Hours,
        last7Days,
        criticalEvents
      });

      // Filter and enrich audits based on period
      const filteredAudits = auditData
        .filter(a => new Date(a.created_at || a.timestamp) >= dateFilter);

      const enrichedAudits = getEnrichedAuditTrail(filteredAudits.map(a => ({
        ...a,
        timestamp: a.created_at || a.timestamp
      }))).slice(0, 20);

      setRecentAudits(enrichedAudits);

      // Group by action type using boardMetricsService
      const actionSummary = calculateAuditSummary(filteredAudits.map(a => ({
        ...a,
        action: a.action_type || a.action
      })));

      setAuditsByAction(actionSummary.sort((a, b) => b.count - a.count));

    } catch (err) {
      console.error('Error fetching audit data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase, filterPeriod]);

  useEffect(() => {
    fetchAndCalculateMetrics();
  }, [fetchAndCalculateMetrics]);

  const getActionBadgeClass = (actionType) => {
    switch (actionType?.toUpperCase()) {
      case 'CREATE':
        return 'action-badge action-create';
      case 'UPDATE':
        return 'action-badge action-update';
      case 'DELETE':
        return 'action-badge action-delete';
      case 'APPROVE':
      case 'SIGNOFF':
        return 'action-badge action-approve';
      case 'CLOSE':
        return 'action-badge action-close';
      case 'LOGIN':
        return 'action-badge action-login';
      case 'LOGOUT':
        return 'action-badge action-logout';
      default:
        return 'action-badge action-default';
    }
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
          <button onClick={fetchAndCalculateMetrics} className="retry-button">
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
                <span className={getActionBadgeClass(item.action)}>
                  {item.action}
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
                      {audit.time_ago || audit.formatted_timestamp}
                    </td>
                    <td className="user-cell">
                      {audit.user_email || audit.user || 'System'}
                    </td>
                    <td>
                      <span className={getActionBadgeClass(audit.action_type || audit.action)}>
                        {audit.action_type || audit.action}
                      </span>
                    </td>
                    <td>{audit.entity_type || 'N/A'}</td>
                    <td className="entity-id-cell">
                      {audit.entity_id ? String(audit.entity_id).substring(0, 8) + '...' : 'N/A'}
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

      {/* Refresh Button */}
      <div className="board-actions">
        <button onClick={fetchAndCalculateMetrics} className="refresh-button">
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AuditTrailBoard;
