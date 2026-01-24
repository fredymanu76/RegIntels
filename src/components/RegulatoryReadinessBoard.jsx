import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import './RegulatoryReadinessBoard.css';

const RegulatoryReadinessBoard = () => {
  const [loading, setLoading] = useState(true);
  const [readinessScore, setReadinessScore] = useState({
    totalControls: 0,
    activeControls: 0,
    testedControls: 0,
    controlsWithEvidence: 0,
    totalOpenExceptions: 0,
    testingCoveragePercent: 0,
    activeControlPercent: 0
  });
  const [controlsStatus, setControlsStatus] = useState([]);
  const [controlsWithExceptions, setControlsWithExceptions] = useState([]);
  const [testingCompliance, setTestingCompliance] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReadinessData();
  }, []);

  const fetchReadinessData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch readiness score
      const { data: scoreData, error: scoreError } = await supabase
        .from('regulatory_readiness_score')
        .select('*')
        .limit(1)
        .single();

      if (scoreError && scoreError.code !== 'PGRST116') throw scoreError;

      if (scoreData) {
        setReadinessScore({
          totalControls: scoreData.total_controls || 0,
          activeControls: scoreData.active_controls || 0,
          testedControls: scoreData.tested_controls || 0,
          controlsWithEvidence: scoreData.controls_with_evidence || 0,
          totalOpenExceptions: scoreData.total_open_exceptions || 0,
          testingCoveragePercent: scoreData.testing_coverage_percent || 0,
          activeControlPercent: scoreData.active_control_percent || 0
        });
      }

      // Fetch controls status summary
      const { data: statusData, error: statusError } = await supabase
        .from('controls_status_summary')
        .select('*');

      if (statusError) throw statusError;
      setControlsStatus(statusData || []);

      // Fetch controls with exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from('controls_with_exceptions_count')
        .select('*')
        .gt('open_exception_count', 0)
        .order('open_exception_count', { ascending: false })
        .limit(10);

      if (exceptionsError) throw exceptionsError;
      setControlsWithExceptions(exceptionsData || []);

      // Fetch testing compliance
      const { data: complianceData, error: complianceError } = await supabase
        .from('controls_testing_compliance')
        .select('*')
        .limit(15);

      if (complianceError) throw complianceError;
      setTestingCompliance(complianceData || []);

    } catch (err) {
      console.error('Error fetching readiness data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const getTestingBadgeClass = (testingStatus) => {
    switch (testingStatus) {
      case 'tested':
        return 'testing-badge testing-tested';
      case 'not_tested':
        return 'testing-badge testing-not-tested';
      default:
        return 'testing-badge testing-inactive';
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
          <button onClick={fetchReadinessData} className="retry-button">
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
          <div className="kpi-label">With Evidence</div>
          <div className="kpi-value">{readinessScore.controlsWithEvidence}</div>
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
                    <td className="severity-count critical-count">{control.critical_exceptions}</td>
                    <td className="severity-count high-count">{control.high_exceptions}</td>
                    <td className="severity-count medium-count">{control.medium_exceptions}</td>
                    <td className="severity-count low-count">{control.low_exceptions}</td>
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

      {/* Testing Compliance */}
      <div className="data-section">
        <h2>Control Testing Compliance</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control Code</th>
                <th>Control Title</th>
                <th>Status</th>
                <th>Frequency</th>
                <th>Test Method</th>
                <th>Testing Status</th>
                <th>Evidence Required</th>
              </tr>
            </thead>
            <tbody>
              {testingCompliance.length > 0 ? (
                testingCompliance.map((control) => (
                  <tr key={control.control_id}>
                    <td className="control-code">{control.control_code || 'N/A'}</td>
                    <td>{control.title || 'Untitled Control'}</td>
                    <td>
                      <span className={getStatusBadgeClass(control.status)}>
                        {control.status}
                      </span>
                    </td>
                    <td>{control.frequency || 'N/A'}</td>
                    <td>{control.test_method || 'Not defined'}</td>
                    <td>
                      <span className={getTestingBadgeClass(control.testing_status)}>
                        {control.testing_status === 'tested' ? 'Tested' :
                         control.testing_status === 'not_tested' ? 'Not Tested' : 'Inactive'}
                      </span>
                    </td>
                    <td>{control.has_evidence_requirements ? 'Yes' : 'No'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    No testing compliance data available
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

export default RegulatoryReadinessBoard;
