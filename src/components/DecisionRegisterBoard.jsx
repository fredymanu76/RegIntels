import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './DecisionRegisterBoard.css';

const DecisionRegisterBoard = () => {
  const [loading, setLoading] = useState(true);
  const [decisionStats, setDecisionStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    avgDecisionTime: 0
  });
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [decisionsByCategory, setDecisionsByCategory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDecisionData();
  }, []);

  const fetchDecisionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all decisions
      const { data: decisionsData, error: decisionsError } = await supabase
        .from('decisions')
        .select('*')
        .order('decision_date', { ascending: false });

      if (decisionsError) throw decisionsError;

      const decisions = decisionsData || [];

      // Calculate stats
      const total = decisions.length;
      const pending = decisions.filter(d => d.status === 'pending').length;
      const approved = decisions.filter(d => d.status === 'approved').length;

      // Calculate average decision time (if we have decision_date and created_at)
      const decisionsWithTime = decisions.filter(d =>
        d.decision_date && d.created_at && d.status !== 'pending'
      );
      const avgDecisionTime = decisionsWithTime.length > 0
        ? Math.round(
            decisionsWithTime.reduce((acc, d) => {
              const diff = new Date(d.decision_date) - new Date(d.created_at);
              return acc + (diff / (1000 * 60 * 60 * 24)); // Convert to days
            }, 0) / decisionsWithTime.length
          )
        : 0;

      setDecisionStats({
        total,
        pending,
        approved,
        avgDecisionTime
      });

      // Recent decisions (top 10)
      setRecentDecisions(decisions.slice(0, 10));

      // Group by category
      const categoryGroups = decisions.reduce((acc, decision) => {
        const category = decision.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = { category, count: 0, statuses: { pending: 0, approved: 0, rejected: 0 } };
        }
        acc[category].count++;
        if (decision.status) {
          acc[category].statuses[decision.status] = (acc[category].statuses[decision.status] || 0) + 1;
        }
        return acc;
      }, {});

      setDecisionsByCategory(Object.values(categoryGroups).sort((a, b) => b.count - a.count));

    } catch (err) {
      console.error('Error fetching decision data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <button onClick={fetchDecisionData} className="retry-button">
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

      {/* Decisions by Category */}
      <div className="data-section">
        <h2>Decisions by Category</h2>
        <div className="category-grid">
          {decisionsByCategory.length > 0 ? (
            decisionsByCategory.map((cat, index) => (
              <div key={index} className="category-card">
                <div className="category-header">
                  <h3>{cat.category}</h3>
                  <div className="category-count">{cat.count}</div>
                </div>
                <div className="category-stats">
                  <div className="stat-item">
                    <span className="stat-label">Approved:</span>
                    <span className="stat-value stat-success">{cat.statuses.approved || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Pending:</span>
                    <span className="stat-value stat-warning">{cat.statuses.pending || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rejected:</span>
                    <span className="stat-value stat-danger">{cat.statuses.rejected || 0}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state">No decision categories found</p>
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
                <th>Decision Date</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Decision Maker</th>
              </tr>
            </thead>
            <tbody>
              {recentDecisions.length > 0 ? (
                recentDecisions.map((decision) => (
                  <tr key={decision.id}>
                    <td className="date-cell">
                      {decision.decision_date
                        ? new Date(decision.decision_date).toLocaleDateString()
                        : 'Pending'}
                    </td>
                    <td className="title-cell">{decision.title || 'Untitled Decision'}</td>
                    <td>{decision.category || 'Uncategorized'}</td>
                    <td>
                      <span className={getStatusBadgeClass(decision.status)}>
                        {decision.status || 'unknown'}
                      </span>
                    </td>
                    <td>{decision.decision_maker || 'Not assigned'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No decisions found
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

export default DecisionRegisterBoard;
