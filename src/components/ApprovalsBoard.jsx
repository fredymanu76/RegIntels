import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './ApprovalsBoard.css';

const ApprovalsBoard = () => {
  const [loading, setLoading] = useState(true);
  const [approvalStats, setApprovalStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    approvalRate: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentApprovals, setRecentApprovals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchApprovalData();
  }, []);

  const fetchApprovalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all approvals
      const { data: approvalsData, error: approvalsError } = await supabase
        .from('approvals')
        .select('*')
        .order('created_at', { ascending: false });

      if (approvalsError) throw approvalsError;

      const approvals = approvalsData || [];

      // Calculate stats
      const total = approvals.length;
      const pending = approvals.filter(a => a.status === 'pending').length;
      const approved = approvals.filter(a => a.status === 'approved').length;
      const rejected = approvals.filter(a => a.status === 'rejected').length;
      const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

      setApprovalStats({
        total,
        pending,
        approved,
        rejected,
        approvalRate
      });

      // Pending approvals
      setPendingApprovals(
        approvals.filter(a => a.status === 'pending').slice(0, 10)
      );

      // Recent approvals (approved or rejected)
      setRecentApprovals(
        approvals.filter(a => a.status !== 'pending').slice(0, 10)
      );

    } catch (err) {
      console.error('Error fetching approval data:', err);
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

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'priority-badge priority-high';
      case 'medium':
        return 'priority-badge priority-medium';
      case 'low':
        return 'priority-badge priority-low';
      default:
        return 'priority-badge';
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
          <button onClick={fetchApprovalData} className="retry-button">
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
          <div className="kpi-label">Rejected</div>
          <div className="kpi-value kpi-danger">{approvalStats.rejected}</div>
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
                <th>Requested</th>
                <th>Request Type</th>
                <th>Requester</th>
                <th>Approver</th>
                <th>Priority</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="date-cell">
                      {approval.created_at
                        ? new Date(approval.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="type-cell">{approval.request_type || 'Unknown'}</td>
                    <td>{approval.requester_name || approval.requester_id || 'N/A'}</td>
                    <td>{approval.approver_name || approval.approver_id || 'Not assigned'}</td>
                    <td>
                      <span className={getPriorityBadgeClass(approval.priority)}>
                        {approval.priority || 'medium'}
                      </span>
                    </td>
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
                <th>Decision Date</th>
                <th>Request Type</th>
                <th>Requester</th>
                <th>Approver</th>
                <th>Status</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              {recentApprovals.length > 0 ? (
                recentApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="date-cell">
                      {approval.approved_at || approval.rejected_at
                        ? new Date(approval.approved_at || approval.rejected_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="type-cell">{approval.request_type || 'Unknown'}</td>
                    <td>{approval.requester_name || approval.requester_id || 'N/A'}</td>
                    <td>{approval.approver_name || approval.approver_id || 'N/A'}</td>
                    <td>
                      <span className={getStatusBadgeClass(approval.status)}>
                        {approval.status}
                      </span>
                    </td>
                    <td className="comments-cell">
                      {approval.comments || '-'}
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
    </div>
  );
};

export default ApprovalsBoard;
