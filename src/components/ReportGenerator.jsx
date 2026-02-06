import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, CheckCircle, FileSpreadsheet, ClipboardList, Shield, Search, Activity, Trash2, Info } from 'lucide-react';
import './ReportGenerator.css';

const EXPORT_HISTORY_KEY = 'cpb_export_history';

const escapeCSVField = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCSV = (headers, rows) => {
  const headerLine = headers.map(escapeCSVField).join(',');
  const dataLines = rows.map(row => row.map(escapeCSVField).join(','));
  return [headerLine, ...dataLines].join('\n');
};

const triggerDownload = (csvString, filename) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return blob.size;
};

const getDateStamp = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CompliancePackBuilder = ({
  policies = [],
  regChanges = [],
  decisions = [],
  evidenceItems = [],
  auditTrail = [],
  assessmentResults = [],
}) => {
  const [activeTab, setActiveTab] = useState('export');
  const [exportHistory, setExportHistory] = useState([]);

  // Fallback to window.mockDatabase if props are empty
  const getData = useCallback((propData, dbKey) => {
    if (propData && propData.length > 0) return propData;
    if (window.mockDatabase && window.mockDatabase[dbKey]) return window.mockDatabase[dbKey];
    return [];
  }, []);

  const policyData = getData(policies, 'policies');
  const regChangeData = getData(regChanges, 'regChanges');
  const decisionData = getData(decisions, 'decisions');
  const evidenceData = getData(evidenceItems, 'evidenceItems');
  const auditData = getData(auditTrail, 'auditTrail');
  const assessmentData = assessmentResults.length > 0 ? assessmentResults :
    (policyData || []).filter(p => p.assessment_result).map(p => {
      try { return JSON.parse(p.assessment_result); } catch { return null; }
    }).filter(Boolean);

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = () => {
    try {
      const stored = localStorage.getItem(EXPORT_HISTORY_KEY);
      if (stored) {
        setExportHistory(JSON.parse(stored));
      }
    } catch {
      setExportHistory([]);
    }
  };

  const saveExportToHistory = (entry) => {
    const updated = [entry, ...exportHistory].slice(0, 50);
    setExportHistory(updated);
    try {
      localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // localStorage full or unavailable
    }
  };

  const removeFromHistory = (id) => {
    const updated = exportHistory.filter(e => e.id !== id);
    setExportHistory(updated);
    try {
      localStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearHistory = () => {
    setExportHistory([]);
    try {
      localStorage.removeItem(EXPORT_HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  // ── Export functions ──

  const exportPolicyRegister = () => {
    const data = policyData;
    const headers = ['Title', 'Version', 'Status', 'Owner', 'Category', 'Regime', 'Next Review Date', 'Created Date'];
    const rows = data.map(p => [
      p.title || '',
      p.version || '',
      p.status || '',
      p.owner || '',
      p.category || '',
      p.regime || '',
      p.nextReviewDate || '',
      p.createdDate || p.created || '',
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `policy-register_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now(),
      name: 'Policy Register',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  const exportRegulatoryChangeLog = () => {
    const data = regChangeData;
    const headers = ['Source', 'Title', 'Impact Rating', 'Published Date', 'Effective Date', 'Status', 'Affected Controls'];
    const rows = data.map(r => [
      r.source || '',
      r.title || '',
      r.impactRating || r.impact || '',
      r.publishedDate || r.published || '',
      r.effectiveDate || r.effective || '',
      r.status || '',
      Array.isArray(r.affectedControls) ? r.affectedControls.join('; ') : (r.affectedControls || ''),
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `regulatory-change-log_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now(),
      name: 'Regulatory Change Log',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  const exportDecisionsRegister = () => {
    const data = decisionData;
    const headers = ['Title', 'Decision Type', 'Status', 'Requested By', 'Approved By', 'Approval Date', 'Expiry Date'];
    const rows = data.map(d => [
      d.title || '',
      d.decisionType || d.type || '',
      d.status || '',
      d.requestedBy || '',
      d.approvedBy || '',
      d.approvalDate || '',
      d.expiryDate || '',
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `decisions-register_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now() + 1,
      name: 'Decisions Register',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  const exportEvidenceInventory = () => {
    const data = evidenceData;
    const headers = ['Type', 'Control', 'Description', 'File', 'Collected Date'];
    const rows = data.map(e => [
      e.type || '',
      e.control || '',
      e.description || '',
      e.file || e.fileName || '',
      e.collectedDate || e.collected || '',
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `evidence-inventory_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now() + 2,
      name: 'Evidence Inventory',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  const exportAuditTrail = () => {
    const data = auditData;
    const headers = ['Action', 'Entity Type', 'Entity ID', 'Description', 'User', 'Timestamp'];
    const rows = data.map(a => [
      a.action || '',
      a.entityType || '',
      a.entityId || a.entityID || '',
      a.description || '',
      a.user || '',
      a.timestamp || '',
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `audit-trail_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now() + 3,
      name: 'Audit Trail',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  const exportPolicyAssessment = () => {
    const data = assessmentData;
    const headers = ['Document ID', 'Document Type', 'Licence Type', 'Overall Score', 'Readiness Status', 'Critical Findings', 'Warnings', 'Engine Version', 'Assessed At'];
    const rows = data.map(a => [
      a.document_id || '',
      a.document_type || '',
      a.licence_type || '',
      a.overall_score != null ? a.overall_score : '',
      a.readiness_status || '',
      (a.critical_findings || []).join('; '),
      (a.warnings || []).join('; '),
      a.metadata?.engine_version || '',
      a.metadata?.assessed_at || '',
    ]);
    const csv = buildCSV(headers, rows);
    const filename = `policy-assessment-report_${getDateStamp()}.csv`;
    const size = triggerDownload(csv, filename);
    saveExportToHistory({
      id: Date.now() + 4,
      name: 'Policy Assessment Report',
      filename,
      exportedAt: new Date().toISOString(),
      rows: rows.length,
      size: formatBytes(size),
    });
  };

  // ── Export type definitions ──

  const exportTypes = [
    {
      id: 'policy-register',
      name: 'Policy Register',
      description: 'Export all policies with version, status, ownership, category, regime, and review dates.',
      icon: <FileText size={24} />,
      columns: ['Title', 'Version', 'Status', 'Owner', 'Category', 'Regime', 'Next Review Date', 'Created Date'],
      recordCount: policyData.length,
      onExport: exportPolicyRegister,
    },
    {
      id: 'regulatory-change-log',
      name: 'Regulatory Change Log',
      description: 'Export regulatory changes with source, impact rating, dates, status, and affected controls.',
      icon: <Search size={24} />,
      columns: ['Source', 'Title', 'Impact Rating', 'Published Date', 'Effective Date', 'Status', 'Affected Controls'],
      recordCount: regChangeData.length,
      onExport: exportRegulatoryChangeLog,
    },
    {
      id: 'decisions-register',
      name: 'Decisions Register',
      description: 'Export compliance decisions with type, approval chain, status, and expiry tracking.',
      icon: <ClipboardList size={24} />,
      columns: ['Title', 'Decision Type', 'Status', 'Requested By', 'Approved By', 'Approval Date', 'Expiry Date'],
      recordCount: decisionData.length,
      onExport: exportDecisionsRegister,
    },
    {
      id: 'evidence-inventory',
      name: 'Evidence Inventory',
      description: 'Export evidence items with type, linked control, file references, and collection dates.',
      icon: <Shield size={24} />,
      columns: ['Type', 'Control', 'Description', 'File', 'Collected Date'],
      recordCount: evidenceData.length,
      onExport: exportEvidenceInventory,
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      description: 'Export the full audit log with actions, entities, descriptions, users, and timestamps.',
      icon: <Activity size={24} />,
      columns: ['Action', 'Entity Type', 'Entity ID', 'Description', 'User', 'Timestamp'],
      recordCount: auditData.length,
      onExport: exportAuditTrail,
    },
    {
      id: 'policy-assessment',
      name: 'Policy Assessment Report',
      description: 'Export policy assessment scores, readiness status, findings, and licence compliance results.',
      icon: <Shield size={24} />,
      columns: ['Document ID', 'Document Type', 'Licence Type', 'Overall Score', 'Readiness Status', 'Critical Findings', 'Warnings', 'Engine Version', 'Assessed At'],
      recordCount: assessmentData.length,
      onExport: exportPolicyAssessment,
    },
  ];

  const totalExports = exportHistory.length;

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="compliance-pack-builder">
      <header className="cpb-header">
        <div className="cpb-title">
          <FileSpreadsheet size={28} />
          <h1>Compliance Pack Builder</h1>
        </div>
        <p className="cpb-subtitle">Export your compliance data as downloadable CSV files</p>
      </header>

      <div className="cpb-stats">
        <div className="cpb-stat-card">
          <div className="cpb-stat-icon"><FileSpreadsheet size={24} /></div>
          <div className="cpb-stat-content">
            <div className="cpb-stat-value">{exportTypes.length}</div>
            <div className="cpb-stat-label">Export Types</div>
          </div>
        </div>
        <div className="cpb-stat-card">
          <div className="cpb-stat-icon"><Download size={24} /></div>
          <div className="cpb-stat-content">
            <div className="cpb-stat-value">{totalExports}</div>
            <div className="cpb-stat-label">Exports Generated</div>
          </div>
        </div>
        <div className="cpb-stat-card">
          <div className="cpb-stat-icon"><CheckCircle size={24} /></div>
          <div className="cpb-stat-content">
            <div className="cpb-stat-value">CSV</div>
            <div className="cpb-stat-label">Output Format</div>
          </div>
        </div>
      </div>

      <div className="cpb-tabs">
        <button
          className={`cpb-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => setActiveTab('export')}
        >
          <Download size={18} /> Export Data
        </button>
        <button
          className={`cpb-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FileText size={18} /> Export History
        </button>
      </div>

      <div className="cpb-content">
        {activeTab === 'export' && (
          <div className="generate-panel">
            <div className="templates-section">
              <h2>Select Data to Export</h2>
              <p>Choose an export type to download a CSV file from your stored compliance data.</p>

              <div className="cpb-info-note">
                <Info size={16} />
                <span>Exports are generated from your stored compliance data. No simulated content.</span>
              </div>

              <div className="report-templates-grid">
                {exportTypes.map(exportType => (
                  <div key={exportType.id} className="report-template-card">
                    <div className="template-header">
                      <div className="template-icon-lg">{exportType.icon}</div>
                      <div className="template-formats">
                        <span className="format-tag">CSV</span>
                      </div>
                    </div>
                    <h3 className="template-title">{exportType.name}</h3>
                    <p className="template-description">{exportType.description}</p>

                    <div className="template-sections">
                      <span className="sections-label">Columns:</span>
                      <div className="sections-list">
                        {exportType.columns.slice(0, 4).map((col, idx) => (
                          <span key={idx} className="section-tag">{col}</span>
                        ))}
                        {exportType.columns.length > 4 && (
                          <span className="section-tag more">+{exportType.columns.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    <div className="template-footer">
                      <span className="page-estimate">{exportType.recordCount} records available</span>
                      <button
                        className="generate-btn"
                        onClick={exportType.onExport}
                        disabled={exportType.recordCount === 0}
                        title={exportType.recordCount === 0 ? 'No data available to export' : `Export ${exportType.name} as CSV`}
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-panel">
            <div className="history-header">
              <h2>Export History</h2>
              {exportHistory.length > 0 && (
                <div className="history-actions">
                  <button className="refresh-btn" onClick={clearHistory}>
                    <Trash2 size={16} /> Clear History
                  </button>
                </div>
              )}
            </div>

            {exportHistory.length === 0 ? (
              <div className="history-empty">
                <FileSpreadsheet size={48} />
                <p>No exports yet. Use the Export Data tab to generate CSV files.</p>
              </div>
            ) : (
              <div className="reports-table">
                <div className="table-header">
                  <div className="th-name">Export Name</div>
                  <div className="th-date">Exported</div>
                  <div className="th-format">Format</div>
                  <div className="th-size">Size</div>
                  <div className="th-actions">Actions</div>
                </div>

                {exportHistory.map(entry => (
                  <div key={entry.id} className="table-row">
                    <div className="td-name">
                      <div className="report-icon"><FileSpreadsheet size={18} /></div>
                      <div className="report-info">
                        <span className="report-name">{entry.filename}</span>
                        <span className="report-pages">{entry.rows} rows</span>
                      </div>
                    </div>
                    <div className="td-date">{formatDate(entry.exportedAt)}</div>
                    <div className="td-format">
                      <span className="format-badge">CSV</span>
                    </div>
                    <div className="td-size">{entry.size}</div>
                    <div className="td-actions">
                      <button
                        className="action-btn delete"
                        title="Remove from history"
                        onClick={() => removeFromHistory(entry.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompliancePackBuilder;
