import React, { useState, useEffect, useCallback } from 'react';
import {
  getEnrichedApprovals,
  calculateApprovalSummary
} from '../services/boardMetricsService';
import './ApprovalsBoard.css';

const ApprovalsBoard = ({ tenantId, supabase }) => {
  const [loading, setLoading] = useState(true);
  const [approvalStats, setApprovalStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0,
    overdue: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [error, setError] = useState(null);

  const fetchAndCalculateMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let approvalsData = [];

      // Try to fetch from Supabase if available
      if (supabase) {
        try {
          const { data, error: approvalsError } = await supabase
            .from('approvals')
            .select('*')
            .order('due_date', { ascending: true });

          if (!approvalsError && data) {
            approvalsData = data;
          }
        } catch (err) {
          console.log('Supabase fetch failed, using mock data:', err.message);
        }
      }

      // If no data yet, try to get from window.mockDatabase
      if (approvalsData.length === 0 && typeof window !== 'undefined' && window.mockDatabase) {
        approvalsData = window.mockDatabase.approvals || [];
      }

      // Filter by tenant if tenantId provided
      if (tenantId) {
        approvalsData = approvalsData.filter(a => a.tenant_id === tenantId);
      }

      // Calculate summary using boardMetricsService
      const summary = calculateApprovalSummary(approvalsData);
      const approvalRate = summary.total > 0
        ? Math.round((summary.approved / summary.total) * 100)
        : 0;

      setApprovalStats({
        total: summary.total,
        pending: summary.pending,
        approved: summary.approved,
        rejected: summary.rejected,
        overdue: summary.overdue,
        approvalRate
      });

      // Get enriched approvals
      const enrichedApprovals = getEnrichedApprovals(approvalsData);

      // Pending approvals (sorted by urgency)
      setPendingApprovals(
        enrichedApprovals.filter(a => a.status === 'pending').slice(0, 10)
      );

      // Recent approvals (approved or rejected)
      setRecentApprovals(
        enrichedApprovals.filter(a => a.status !== 'pending').slice(0, 10)
      );

    } catch (err) {
      console.error('Error fetching approval data:', err);
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

  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'OVERDUE':
        return 'urgency-badge urgency-overdue';
      case 'URGENT':
        return 'urgency-badge urgency-urgent';
      case 'HIGH':
        return 'urgency-badge urgency-high';
      default:
        return 'urgency-badge urgency-normal';
    }
  };

  if (loading) {
    return (
      <div className="approvals-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading approvals data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approvals-board">
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
    <div className="approvals-board">
      <header className="board-header">
        <h1>Approvals Board</h1>
        <p className="board-subtitle">Board-level approval workflow tracking</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Approvals</div>
          <div className="kpi-value">{approvalStats.total}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Pending</div>
          <div className="kpi-value kpi-warning">{approvalStats.pending}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Approved</div>
          <div className="kpi-value kpi-success">{approvalStats.approved}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Overdue</div>
          <div className="kpi-value kpi-danger">{approvalStats.overdue}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Approval Rate</div>
          <div className="kpi-value">{approvalStats.approvalRate}%</div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-bar"
              style={{ width: `${approvalStats.approvalRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="data-section">
        <h2>Pending Approvals</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Requested By</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="id-cell">{approval.id}</td>
                    <td className="title-cell">{approval.title || 'Untitled'}</td>
                    <td className="type-cell">{approval.item_type || 'Unknown'}</td>
                    <td>{approval.requested_by || 'N/A'}</td>
                    <td>{approval.assigned_to || 'Not assigned'}</td>
                    <td className="date-cell">
                      {approval.due_date
                        ? new Date(approval.due_date).toLocaleDateString()
                        : 'No due date'}
                    </td>
                    <td>
                      <span className={getUrgencyBadgeClass(approval.urgency)}>
                        {approval.urgency || 'NORMAL'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No pending approvals
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Approvals */}
      <div className="data-section">
        <h2>Recent Approval Decisions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Requested By</th>
                <th>Assigned To</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentApprovals.length > 0 ? (
                recentApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="id-cell">{approval.id}</td>
                    <td className="title-cell">{approval.title || 'Untitled'}</td>
                    <td className="type-cell">{approval.item_type || 'Unknown'}</td>
                    <td>{approval.requested_by || 'N/A'}</td>
                    <td>{approval.assigned_to || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(approval.status)}>
                        {approval.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No recent approval decisions
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

export default ApprovalsBoard;
