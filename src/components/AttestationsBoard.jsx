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
  const [recentAttestations, setRecentAttestations] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAttestationData();
  }, []);

  const fetchAttestationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch attestation statistics
      const { data: statsData, error: statsError } = await supabase
        .from('attestations')
        .select('status, due_date');

      if (statsError) throw statsError;

      // Calculate stats
      const total = statsData?.length || 0;
      const pending = statsData?.filter(a => a.status === 'pending').length || 0;
      const completed = statsData?.filter(a => a.status === 'approved').length || 0;
      const overdue = statsData?.filter(a =>
        a.status === 'pending' && new Date(a.due_date) < new Date()
      ).length || 0;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      setAttestationStats({
        total,
        pending,
        completed,
        overdue,
        completionRate
      });

      // Fetch attestations by control
      const { data: controlData, error: controlError } = await supabase
        .from('attestations')
        .select(`
          id,
          status,
          due_date,
          control_id,
          controls:control_id (
            id,
            control_id,
            control_title
          )
        `)
        .order('due_date', { ascending: true })
        .limit(10);

      if (controlError) throw controlError;
      setAttestationsByControl(controlData || []);

      // Fetch recent attestations
      const { data: recentData, error: recentError } = await supabase
        .from('attestations')
        .select(`
          id,
          status,
          submitted_at,
          attestor_id,
          attestor_role,
          control_id,
          controls:control_id (
            id,
            control_id,
            control_title
          )
        `)
        .eq('status', 'approved')
        .order('submitted_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentAttestations(recentData || []);

    } catch (err) {
      console.error('Error fetching attestation data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'status-badge status-completed';
      case 'pending':
        return 'status-badge status-pending';
      case 'overdue':
        return 'status-badge status-overdue';
      default:
        return 'status-badge';
    }
  };

  const isOverdue = (dueDate, status) => {
    return status === 'pending' && new Date(dueDate) < new Date();
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
          <div className="kpi-label">Overdue</div>
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

      {/* Attestations by Control */}
      <div className="data-section">
        <h2>Upcoming Attestations by Control</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {attestationsByControl.length > 0 ? (
                attestationsByControl.map((attestation) => (
                  <tr key={attestation.id}>
                    <td className="control-code">
                      {attestation.controls?.control_code || 'N/A'}
                    </td>
                    <td>{attestation.controls?.title || 'Unknown Control'}</td>
                    <td>
                      <span className={getStatusBadgeClass(
                        isOverdue(attestation.due_date, attestation.status)
                          ? 'overdue'
                          : attestation.status
                      )}>
                        {isOverdue(attestation.due_date, attestation.status)
                          ? 'Overdue'
                          : attestation.status}
                      </span>
                    </td>
                    <td>
                      {attestation.due_date
                        ? new Date(attestation.due_date).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No upcoming attestations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Attestations */}
      <div className="data-section">
        <h2>Recently Completed Attestations</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Attested By</th>
                <th>Attested At</th>
              </tr>
            </thead>
            <tbody>
              {recentAttestations.length > 0 ? (
                recentAttestations.map((attestation) => (
                  <tr key={attestation.id}>
                    <td className="control-code">
                      {attestation.controls?.control_id || 'N/A'}
                    </td>
                    <td>{attestation.controls?.control_title || 'Unknown Control'}</td>
                    <td>{attestation.attestor_role || attestation.attestor_id || 'N/A'}</td>
                    <td>
                      {attestation.submitted_at
                        ? new Date(attestation.submitted_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty-state">
                    No completed attestations found
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
