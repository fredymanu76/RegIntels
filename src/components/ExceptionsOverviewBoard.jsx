import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, BarChart3, Download } from 'lucide-react';
import './ExceptionsOverviewBoard.css';

/**
 * Solution 5: Exceptions Overview (Board View)
 *
 * Strategic Purpose: Board-level, forward-looking risk signal
 * rather than a static list of breaches
 *
 * Features:
 * - Exception materiality scoring
 * - Trend heat map (deterioration/stabilisation)
 * - Root cause taxonomy
 */

function ExceptionsOverviewBoard({ supabase }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Main overview data
  const [overview, setOverview] = useState(null);

  // Trend heatmap data (last 6 months)
  const [trendData, setTrendData] = useState([]);

  // Root cause breakdown
  const [rootCauseData, setRootCauseData] = useState([]);

  // Detailed exceptions with materiality
  const [exceptionsDetail, setExceptionsDetail] = useState([]);

  useEffect(() => {
    loadExceptionsOverview();
  }, []);

  const loadExceptionsOverview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user and tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profiles?.tenant_id) throw new Error('No tenant found');
      const tenantId = profiles.tenant_id;

      // Fetch main overview data
      const { data: overviewData, error: overviewError } = await supabase
        .from('v_exceptions_overview_mi')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (overviewError) throw overviewError;
      setOverview(overviewData);

      // Fetch trend heatmap data (last 6 months)
      const { data: trends, error: trendsError } = await supabase
        .from('v_exception_trend_heatmap')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('month', { ascending: false })
        .limit(6);

      if (trendsError) throw trendsError;
      setTrendData(trends || []);

      // Fetch root cause taxonomy
      const { data: rootCauses, error: rootError } = await supabase
        .from('v_exception_root_cause_taxonomy')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['open', 'in_remediation'])
        .order('materiality_score', { ascending: false });

      if (rootError) throw rootError;
      setRootCauseData(rootCauses || []);

      // Fetch detailed exception materiality data (top 10)
      const { data: details, error: detailsError } = await supabase
        .from('v_exception_materiality')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['open', 'in_remediation'])
        .order('materiality_score', { ascending: false })
        .limit(10);

      if (detailsError) throw detailsError;
      setExceptionsDetail(details || []);

    } catch (err) {
      console.error('Error loading exceptions overview:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    alert('PDF export functionality - To be implemented');
  };

  const exportCSV = () => {
    if (!exceptionsDetail || exceptionsDetail.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Exception Title', 'Control', 'Severity', 'Materiality Score', 'Materiality Band', 'Days Open', 'Status'];
    const rows = exceptionsDetail.map(ex => [
      ex.exception_title,
      ex.control_name || 'N/A',
      ex.severity || 'N/A',
      ex.materiality_score || 0,
      ex.materiality_band || 'N/A',
      ex.days_open || 0,
      ex.status
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exceptions-overview-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="exceptions-overview-board">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading exceptions overview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exceptions-overview-board">
        <div className="error-state">
          <AlertTriangle size={48} />
          <h3>Error Loading Data</h3>
          <p>{error}</p>
          <button onClick={loadExceptionsOverview} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="exceptions-overview-board">
        <div className="empty-state">
          <BarChart3 size={48} />
          <h3>No Exception Data</h3>
          <p>No exception data available for your tenant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exceptions-overview-board">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Exceptions Overview</h1>
          <p className="page-subtitle">Board-level exception intelligence and risk signals</p>
        </div>
        <div className="header-actions">
          <button onClick={exportCSV} className="btn-secondary">
            <Download size={16} />
            Export CSV
          </button>
          <button onClick={exportPDF} className="btn-secondary">
            <Download size={16} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Risk Signal Banner */}
      <div className={`risk-signal-banner risk-signal-${overview.risk_signal?.toLowerCase().replace(/ /g, '-')}`}>
        <AlertTriangle size={24} />
        <div className="risk-signal-content">
          <h3>Risk Signal</h3>
          <p className="risk-signal-text">{overview.risk_signal}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Open Exceptions</span>
            {overview.month_over_month_pct && (
              <span className={`trend-indicator ${overview.month_over_month_pct > 0 ? 'negative' : 'positive'}`}>
                {overview.month_over_month_pct > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {Math.abs(overview.month_over_month_pct)}%
              </span>
            )}
          </div>
          <div className="metric-value">{overview.open_exceptions}</div>
          <div className="metric-breakdown">
            <span className="critical-badge">Critical: {overview.critical_open}</span>
            <span className="high-badge">High: {overview.high_open}</span>
            <span className="medium-badge">Medium: {overview.medium_open}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Avg Materiality Score</span>
          </div>
          <div className="metric-value">{overview.avg_open_materiality}</div>
          <div className="metric-subtext">Out of 100 (higher = more material)</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Avg Days Open</span>
          </div>
          <div className="metric-value">{overview.avg_days_open}</div>
          <div className="metric-subtext">Average aging of open exceptions</div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Resolved (30d)</span>
          </div>
          <div className="metric-value">{overview.resolved_last_30d}</div>
          <div className="metric-subtext">Exceptions closed in last 30 days</div>
        </div>
      </div>

      {/* Root Cause Taxonomy */}
      <div className="section-card">
        <div className="section-header">
          <h2>Root Cause Analysis</h2>
          <p className="section-subtitle">Open exceptions by root cause taxonomy</p>
        </div>
        <div className="root-cause-grid">
          <RootCauseCard
            label="Process"
            count={overview.process_exceptions}
            total={overview.open_exceptions}
            color="#3b82f6"
          />
          <RootCauseCard
            label="People"
            count={overview.people_exceptions}
            total={overview.open_exceptions}
            color="#8b5cf6"
          />
          <RootCauseCard
            label="Systems"
            count={overview.systems_exceptions}
            total={overview.open_exceptions}
            color="#06b6d4"
          />
          <RootCauseCard
            label="Third Party"
            count={overview.third_party_exceptions}
            total={overview.open_exceptions}
            color="#f59e0b"
          />
        </div>
      </div>

      {/* Trend Heatmap */}
      <div className="section-card">
        <div className="section-header">
          <h2>Exception Trends (Last 6 Months)</h2>
          <p className="section-subtitle">Volume and severity trends showing deterioration or stabilisation</p>
        </div>
        <TrendHeatmap data={trendData} />
      </div>

      {/* Top Material Exceptions */}
      <div className="section-card">
        <div className="section-header">
          <h2>Top 10 Material Exceptions</h2>
          <p className="section-subtitle">Highest materiality scored exceptions requiring board attention</p>
        </div>
        <div className="exceptions-table">
          <table>
            <thead>
              <tr>
                <th>Exception</th>
                <th>Control</th>
                <th>Materiality</th>
                <th>Days Open</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {exceptionsDetail.map(ex => (
                <tr key={ex.exception_id}>
                  <td>
                    <div className="exception-title">{ex.exception_title}</div>
                    <div className="exception-meta">{ex.control_category}</div>
                  </td>
                  <td>{ex.control_name || 'N/A'}</td>
                  <td>
                    <MaterialityBadge score={ex.materiality_score} band={ex.materiality_band} />
                  </td>
                  <td>{ex.days_open} days</td>
                  <td>
                    <span className={`status-badge ${ex.status}`}>{ex.status?.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Root Cause Card Component
function RootCauseCard({ label, count, total, color }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="root-cause-card">
      <div className="root-cause-header">
        <span className="root-cause-label">{label}</span>
        <span className="root-cause-count">{count}</span>
      </div>
      <div className="root-cause-bar">
        <div
          className="root-cause-fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        ></div>
      </div>
      <div className="root-cause-percentage">{percentage}% of total</div>
    </div>
  );
}

// Materiality Badge Component
function MaterialityBadge({ score, band }) {
  const getBandColor = (band) => {
    switch (band?.toUpperCase()) {
      case 'CRITICAL': return 'critical';
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'default';
    }
  };

  return (
    <div className="materiality-badge">
      <span className={`materiality-score score-${getBandColor(band)}`}>{score || 0}</span>
      <span className={`materiality-band band-${getBandColor(band)}`}>{band || 'N/A'}</span>
    </div>
  );
}

// Trend Heatmap Component
function TrendHeatmap({ data }) {
  if (!data || data.length === 0) {
    return <div className="empty-trend">No trend data available</div>;
  }

  // Group by month
  const monthGroups = {};
  data.forEach(item => {
    const monthKey = new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!monthGroups[monthKey]) {
      monthGroups[monthKey] = [];
    }
    monthGroups[monthKey].push(item);
  });

  return (
    <div className="trend-heatmap">
      {Object.entries(monthGroups).map(([month, items]) => (
        <div key={month} className="trend-month">
          <div className="trend-month-label">{month}</div>
          <div className="trend-items">
            {items.map((item, idx) => (
              <div key={idx} className="trend-item">
                <div className="trend-item-header">
                  <span className="trend-severity">{item.severity || 'N/A'}</span>
                  <span className="trend-count">{item.exception_count}</span>
                </div>
                <div className="trend-indicators">
                  <TrendIndicator trend={item.volume_trend} label="Volume" />
                  <TrendIndicator trend={item.severity_trend} label="Severity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Trend Indicator Component
function TrendIndicator({ trend, label }) {
  const getIcon = () => {
    if (trend === 'Deteriorating' || trend === 'Worsening') return <TrendingUp size={14} className="negative" />;
    if (trend === 'Improving') return <TrendingDown size={14} className="positive" />;
    return <Minus size={14} className="neutral" />;
  };

  return (
    <div className={`trend-indicator trend-${trend?.toLowerCase()}`}>
      {getIcon()}
      <span className="trend-label">{label}: {trend}</span>
    </div>
  );
}

export default ExceptionsOverviewBoard;
