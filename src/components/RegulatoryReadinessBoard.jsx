import React, { useState, useEffect, useCallback } from 'react';
import {
  calculateReadinessScore,
  getRegChangesWithDeadlines,
  calculateControlDriftScores
} from '../services/boardMetricsService';
import './RegulatoryReadinessBoard.css';

const RegulatoryReadinessBoard = ({ tenantId, supabase }) => {
  const [loading, setLoading] = useState(true);
  const [readinessScore, setReadinessScore] = useState({
    totalControls: 0,
    activeControls: 0,
    testedControls: 0,
    controlsWithEvidence: 0,
    totalOpenExceptions: 0,
    testingCoveragePercent: 0,
    activeControlPercent: 0,
    overallScore: 0
  });
  const [controlsStatus, setControlsStatus] = useState([]);
  const [controlsWithExceptions, setControlsWithExceptions] = useState([]);
  const [regChangesData, setRegChangesData] = useState([]);
  const [error, setError] = useState(null);

  const fetchAndCalculateMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let controlsData = [];
      let exceptionsData = [];
      let attestationsData = [];
      let regChanges = [];

      // Try to fetch from Supabase if available
      if (supabase) {
        try {
          // Try to fetch from views first (production mode)
          const { data: scoreData, error: scoreError } = await supabase
            .from('regulatory_readiness_score')
            .select('*')
            .limit(1)
            .single();

          if (!scoreError && scoreData) {
            // Views exist, use them directly
            setReadinessScore({
              totalControls: scoreData.total_controls || 0,
              activeControls: scoreData.active_controls || 0,
              testedControls: scoreData.tested_controls || 0,
              controlsWithEvidence: scoreData.controls_with_evidence || 0,
              totalOpenExceptions: scoreData.total_open_exceptions || 0,
              testingCoveragePercent: scoreData.testing_coverage_percent || 0,
              activeControlPercent: scoreData.active_control_percent || 0,
              overallScore: scoreData.overall_score || 0
            });

            const { data: statusData } = await supabase
              .from('controls_status_summary')
              .select('*');
            setControlsStatus(statusData || []);

            const { data: exceptionsDataView } = await supabase
              .from('controls_with_exceptions_count')
              .select('*')
              .gt('open_exception_count', 0)
              .order('open_exception_count', { ascending: false })
              .limit(10);
            setControlsWithExceptions(exceptionsDataView || []);

            setLoading(false);
            return;
          }

          // Views don't exist, fetch raw data
          const { data: ctrlData } = await supabase.from('controls').select('*');
          controlsData = ctrlData || [];

          const { data: excData } = await supabase.from('exceptions').select('*');
          exceptionsData = excData || [];

          const { data: attData } = await supabase.from('attestations').select('*');
          attestationsData = attData || [];

          const { data: regData } = await supabase.from('reg_changes').select('*');
          regChanges = regData || [];
        } catch (err) {
          console.log('Supabase fetch failed, using mock data:', err.message);
        }
      }

      // If no data yet, try to get from window.mockDatabase
      if (controlsData.length === 0 && typeof window !== 'undefined' && window.mockDatabase) {
        controlsData = window.mockDatabase.controls || [];
        exceptionsData = window.mockDatabase.exceptions || [];
        attestationsData = window.mockDatabase.attestations || [];
        regChanges = window.mockDatabase.reg_changes || [];
      }

      // Filter by tenant if tenantId provided
      if (tenantId) {
        controlsData = controlsData.filter(c => c.tenant_id === tenantId);
        exceptionsData = exceptionsData.filter(e => e.tenant_id === tenantId);
        attestationsData = attestationsData.filter(a => a.tenant_id === tenantId);
        regChanges = regChanges.filter(r => r.tenant_id === tenantId);
      }

      // Calculate readiness metrics
      const activeControls = controlsData.filter(c => c.status === 'active');
      const openExceptions = exceptionsData.filter(e => e.status !== 'closed');
      const approvedAttestations = attestationsData.filter(a => a.status === 'approved');

      // Calculate overall readiness score using boardMetricsService
      const overallScore = calculateReadinessScore(regChanges, controlsData, attestationsData);

      setReadinessScore({
        totalControls: controlsData.length,
        activeControls: activeControls.length,
        testedControls: approvedAttestations.length,
        controlsWithEvidence: approvedAttestations.length,
        totalOpenExceptions: openExceptions.length,
        testingCoveragePercent: controlsData.length > 0
          ? Math.round((approvedAttestations.length / controlsData.length) * 100)
          : 0,
        activeControlPercent: controlsData.length > 0
          ? Math.round((activeControls.length / controlsData.length) * 100)
          : 0,
        overallScore
      });

      // Calculate controls by status
      const statusCounts = {};
      controlsData.forEach(c => {
        const status = c.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      setControlsStatus(Object.entries(statusCounts).map(([status, count]) => ({
        status,
        control_count: count
      })));

      // Calculate controls with exceptions using drift scores
      const driftScores = calculateControlDriftScores(controlsData, attestationsData, exceptionsData);
      const controlsWithExc = driftScores
        .filter(d => d.open_exceptions_count > 0)
        .map(d => {
          const controlExceptions = exceptionsData.filter(
            e => (e.control_id === d.control_code || e.control_id === d.control_id) && e.status !== 'closed'
          );
          return {
            control_id: d.control_id,
            control_code: d.control_code,
            title: d.control_title,
            status: 'active',
            open_exception_count: d.open_exceptions_count,
            critical_exceptions: controlExceptions.filter(e => e.severity === 'critical').length,
            high_exceptions: controlExceptions.filter(e => e.severity === 'high').length,
            medium_exceptions: controlExceptions.filter(e => e.severity === 'medium').length,
            low_exceptions: controlExceptions.filter(e => e.severity === 'low').length
          };
        })
        .slice(0, 10);
      setControlsWithExceptions(controlsWithExc);

      // Get regulatory changes with deadlines
      const regChangesWithDeadlines = getRegChangesWithDeadlines(regChanges);
      setRegChangesData(regChangesWithDeadlines);

    } catch (err) {
      console.error('Error calculating readiness metrics:', err);
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
      case 'active':
        return 'status-badge status-active';
      case 'inactive':
        return 'status-badge status-inactive';
      case 'draft':
        return 'status-badge status-draft';
      default:
        return 'status-badge';
    }
  };

  const getUrgencyBadgeClass = (urgency) => {
    switch (urgency) {
      case 'OVERDUE':
        return 'urgency-badge urgency-overdue';
      case 'CRITICAL':
        return 'urgency-badge urgency-critical';
      case 'HIGH':
        return 'urgency-badge urgency-high';
      case 'MEDIUM':
        return 'urgency-badge urgency-medium';
      default:
        return 'urgency-badge urgency-low';
    }
  };

  if (loading) {
    return (
      <div className="regulatory-readiness-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading regulatory readiness data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="regulatory-readiness-board">
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
    <div className="regulatory-readiness-board">
      <header className="board-header">
        <h1>Regulatory Readiness Board</h1>
        <p className="board-subtitle">Board-level control effectiveness and compliance tracking</p>
      </header>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card kpi-highlight">
          <div className="kpi-label">Readiness Score</div>
          <div className="kpi-value">{readinessScore.overallScore}%</div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-bar"
              style={{ width: `${readinessScore.overallScore}%` }}
            ></div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Total Controls</div>
          <div className="kpi-value">{readinessScore.totalControls}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Active Controls</div>
          <div className="kpi-value kpi-success">{readinessScore.activeControls}</div>
          <div className="kpi-percentage">{readinessScore.activeControlPercent}%</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Tested Controls</div>
          <div className="kpi-value kpi-info">{readinessScore.testedControls}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Open Exceptions</div>
          <div className="kpi-value kpi-warning">{readinessScore.totalOpenExceptions}</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Testing Coverage</div>
          <div className="kpi-value">{readinessScore.testingCoveragePercent}%</div>
          <div className="kpi-progress">
            <div
              className="kpi-progress-bar"
              style={{ width: `${readinessScore.testingCoveragePercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Controls Status Summary */}
      <div className="data-section">
        <h2>Controls by Status</h2>
        <div className="status-grid">
          {controlsStatus.length > 0 ? (
            controlsStatus.map((item, index) => (
              <div key={index} className="status-card">
                <span className={getStatusBadgeClass(item.status)}>
                  {item.status || 'Unknown'}
                </span>
                <div className="status-count">{item.control_count}</div>
              </div>
            ))
          ) : (
            <p className="empty-state">No status data available</p>
          )}
        </div>
      </div>

      {/* Controls with Exceptions */}
      <div className="data-section">
        <h2>Controls with Open Exceptions</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Status</th>
                <th>Total Exceptions</th>
                <th>Critical</th>
                <th>High</th>
                <th>Medium</th>
                <th>Low</th>
              </tr>
            </thead>
            <tbody>
              {controlsWithExceptions.length > 0 ? (
                controlsWithExceptions.map((control) => (
                  <tr key={control.control_id}>
                    <td className="control-code">{control.control_code || 'N/A'}</td>
                    <td className="title-cell">{control.title || 'Untitled Control'}</td>
                    <td>
                      <span className={getStatusBadgeClass(control.status)}>
                        {control.status}
                      </span>
                    </td>
                    <td className="exception-count">{control.open_exception_count}</td>
                    <td className="severity-count critical-count">{control.critical_exceptions || 0}</td>
                    <td className="severity-count high-count">{control.high_exceptions || 0}</td>
                    <td className="severity-count medium-count">{control.medium_exceptions || 0}</td>
                    <td className="severity-count low-count">{control.low_exceptions || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    No controls with open exceptions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Regulatory Deadlines */}
      <div className="data-section">
        <h2>Upcoming Regulatory Deadlines</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Title</th>
                <th>Effective Date</th>
                <th>Days Until</th>
                <th>Urgency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {regChangesData.length > 0 ? (
                regChangesData.slice(0, 10).map((change) => (
                  <tr key={change.id}>
                    <td className="source-cell">{change.source}</td>
                    <td className="title-cell">{change.title}</td>
                    <td className="date-cell">
                      {new Date(change.effective_date).toLocaleDateString()}
                    </td>
                    <td className="days-cell">
                      {change.days_until_deadline < 0
                        ? `${Math.abs(change.days_until_deadline)} days overdue`
                        : `${change.days_until_deadline} days`}
                    </td>
                    <td>
                      <span className={getUrgencyBadgeClass(change.urgency)}>
                        {change.urgency}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${change.status}`}>
                        {change.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    No regulatory changes tracked
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

export default RegulatoryReadinessBoard;
