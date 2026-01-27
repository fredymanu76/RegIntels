import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnrichedDecisions,
  calculateDecisionSummary
} from '../services/boardMetricsService';
import './DecisionRegisterBoard.css';

const DecisionRegisterBoard = ({ tenantId, supabase }) => {
  const [loading, setLoading] = useState(true);
  const [decisionStats, setDecisionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    avgDecisionTime: 0
  });
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [decisionsByType, setDecisionsByType] = useState([]);
  const [error, setError] = useState(null);

  const fetchAndCalculateMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let decisionsData = [];

      // Try to fetch from Supabase if available
      if (supabase) {
        try {
          const { data, error: decisionsError } = await supabase
            .from('decisions')
            .select('*')
            .order('approval_date', { ascending: false });

          if (!decisionsError && data) {
            decisionsData = data;
          }
        } catch (err) {
          console.log('Supabase fetch failed, using mock data:', err.message);
        }
      }

      // If no data yet, try to get from window.mockDatabase
      if (decisionsData.length === 0 && typeof window !== 'undefined' && window.mockDatabase) {
        decisionsData = window.mockDatabase.decisions || [];
      }

      // Filter by tenant if tenantId provided
      if (tenantId) {
        decisionsData = decisionsData.filter(d => d.tenant_id === tenantId);
      }

      // Calculate summary using boardMetricsService
      const summary = calculateDecisionSummary(decisionsData);

      setDecisionStats({
        total: summary.total,
        pending: summary.pending,
        approved: summary.approved,
        avgDecisionTime: 3 // Placeholder - would need more data for real calculation
      });

      // Get enriched decisions
      const enrichedDecisions = getEnrichedDecisions(decisionsData);
      setRecentDecisions(enrichedDecisions.slice(0, 10));

      // Group by decision type
      const typeGroups = decisionsData.reduce((acc, decision) => {
        const type = decision.decision_type || 'Uncategorized';
        if (!acc[type]) {
          acc[type] = { type, count: 0, statuses: { pending: 0, approved: 0, rejected: 0 } };
        }
        acc[type].count++;
        if (decision.status) {
          acc[type].statuses[decision.status] = (acc[type].statuses[decision.status] || 0) + 1;
        }
        return acc;
      }, {});

      setDecisionsByType(Object.values(typeGroups).sort((a, b) => b.count - a.count));

    } catch (err) {
      console.error('Error fetching decision data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId, supabase]);

  useEffect(() => {
    fetchAndCalculateMetrics();
  }, [fetchAndCalculateMetrics]);

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-badge status-approved';
      case 'pending':
        return 'status-badge status-pending';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  const getExpiryStatusClass = (expiryStatus) => {
    switch (expiryStatus) {
      case 'EXPIRED':
        return 'expiry-badge expiry-expired';
      case 'EXPIRING_SOON':
        return 'expiry-badge expiry-soon';
      default:
        return 'expiry-badge expiry-active';
    }
  };

  if (loading) {
    return (
      <div className="decision-register-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading decision register data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="decision-register-board">
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
    <div className="decision-register-board">
      <header className="board-header">
        <h1>Decision Register Board</h1>
        <p className="board-subtitle">Board-level decision tracking and governance</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Decisions</div>
          <div className="kpi-value">{decisionStats.total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value kpi-warning">{decisionStats.pending}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Approved</div>
          <div className="kpi-value kpi-success">{decisionStats.approved}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Avg Decision Time</div>
          <div className="kpi-value">{decisionStats.avgDecisionTime}</div>
          <div className="kpi-unit">days</div>
        </div>
      </div>

      {/* Decisions by Type */}
      <div className="data-section">
        <h2>Decisions by Type</h2>
        <div className="category-grid">
          {decisionsByType.length > 0 ? (
            decisionsByType.map((type, index) => (
              <div key={index} className="category-card">
                <div className="category-header">
                  <h3>{type.type}</h3>
                  <div className="category-count">{type.count}</div>
                </div>
                <div className="category-stats">
                  <div className="stat-item">
                    <span className="stat-label">Approved:</span>
                    <span className="stat-value stat-success">{type.statuses.approved || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pending:</span>
                    <span className="stat-value stat-warning">{type.statuses.pending || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rejected:</span>
                    <span className="stat-value stat-danger">{type.statuses.rejected || 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No decision types found</p>
          )}
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="data-section">
        <h2>Recent Decisions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Requested By</th>
                <th>Approved By</th>
                <th>Expiry</th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.length > 0 ? (
                recentDecisions.map((decision) => (
                  <tr key={decision.id}>
                    <td className="id-cell">{decision.id}</td>
                    <td className="title-cell">{decision.title || 'Untitled Decision'}</td>
                    <td>{decision.decision_type || 'Uncategorized'}</td>
                    <td>
                      <span className={getStatusBadgeClass(decision.status)}>
                        {decision.status || 'unknown'}
                      </span>
                    </td>
                    <td>{decision.requested_by || 'N/A'}</td>
                    <td>{decision.approved_by || 'Pending'}</td>
                    <td>
                      {decision.expiry_date ? (
                        <span className={getExpiryStatusClass(decision.expiry_status)}>
                          {decision.days_until_expiry !== null
                            ? `${decision.days_until_expiry} days`
                            : new Date(decision.expiry_date).toLocaleDateString()}
                        </span>
                      ) : (
                        'No expiry'
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No decisions found
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

export default DecisionRegisterBoard;
