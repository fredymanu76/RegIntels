import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Clock, CheckCircle, FileSpreadsheet, FilePlus, Settings, RefreshCw, Eye, Trash2, Copy, Send } from 'lucide-react';
import './ReportGenerator.css';

const ReportGenerator = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduleSettings, setScheduleSettings] = useState({
    boardReport: { enabled: true, frequency: 'monthly', day: 1 },
    auditReport: { enabled: true, frequency: 'quarterly', day: 1 },
    exceptionsReport: { enabled: true, frequency: 'weekly', day: 'Monday' },
    driftReport: { enabled: false, frequency: 'weekly', day: 'Friday' }
  });

  const reportTemplates = [
    {
      id: 'board-pack',
      name: 'Board Report Pack',
      description: 'Comprehensive board-level compliance report with executive summary, key metrics, and risk overview',
      icon: <FileText size={24} />,
      sections: ['Executive Summary', 'Compliance Scorecard', 'Key Risks', 'Regulatory Updates', 'Action Items'],
      format: ['PDF', 'PPTX'],
      estimatedPages: '15-20'
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail Report',
      description: 'Detailed audit log of all control changes, attestations, and compliance activities',
      icon: <FileSpreadsheet size={24} />,
      sections: ['Activity Log', 'Control Changes', 'Attestation History', 'Exception Timeline'],
      format: ['PDF', 'XLSX'],
      estimatedPages: '25-40'
    },
    {
      id: 'exception-summary',
      name: 'Exception Summary',
      description: 'Current open exceptions with aging analysis, ownership, and remediation status',
      icon: <FileText size={24} />,
      sections: ['Open Exceptions', 'Aging Analysis', 'By Severity', 'Remediation Progress'],
      format: ['PDF', 'XLSX'],
      estimatedPages: '8-12'
    },
    {
      id: 'control-health',
      name: 'Control Health Report',
      description: 'Complete control library health assessment with drift analysis and effectiveness ratings',
      icon: <FileText size={24} />,
      sections: ['Control Inventory', 'Health Scores', 'Drift Analysis', 'Attestation Status'],
      format: ['PDF', 'XLSX'],
      estimatedPages: '20-30'
    },
    {
      id: 'regulatory-impact',
      name: 'Regulatory Impact Assessment',
      description: 'Analysis of recent regulatory changes and their impact on your control framework',
      icon: <FileText size={24} />,
      sections: ['New Regulations', 'Impact Matrix', 'Gap Analysis', 'Implementation Plan'],
      format: ['PDF', 'DOCX'],
      estimatedPages: '10-15'
    },
    {
      id: 'attestation-report',
      name: 'Attestation Report',
      description: 'Summary of control attestations with confidence scores and evidence documentation',
      icon: <FileText size={24} />,
      sections: ['Attestation Summary', 'By Control Owner', 'Confidence Analysis', 'Evidence Index'],
      format: ['PDF', 'XLSX'],
      estimatedPages: '12-18'
    }
  ];

  useEffect(() => {
    loadGeneratedReports();
  }, []);

  const loadGeneratedReports = () => {
    // Mock generated reports
    const mockReports = [
      {
        id: 1,
        name: 'Board Report Pack - January 2026',
        template: 'board-pack',
        generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        format: 'PDF',
        size: '2.4 MB',
        pages: 18,
        status: 'ready'
      },
      {
        id: 2,
        name: 'Exception Summary - Week 4',
        template: 'exception-summary',
        generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        format: 'PDF',
        size: '856 KB',
        pages: 10,
        status: 'ready'
      },
      {
        id: 3,
        name: 'Audit Trail Report - Q4 2025',
        template: 'audit-trail',
        generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        format: 'XLSX',
        size: '1.8 MB',
        pages: 32,
        status: 'ready'
      }
    ];
    setGeneratedReports(mockReports);
  };

  const handleGenerateReport = (template) => {
    setSelectedTemplate(template);
    setIsGenerating(true);

    // Simulate report generation
    setTimeout(() => {
      const newReport = {
        id: Date.now(),
        name: `${template.name} - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        template: template.id,
        generatedAt: new Date(),
        format: template.format[0],
        size: `${(Math.random() * 3 + 0.5).toFixed(1)} MB`,
        pages: parseInt(template.estimatedPages.split('-')[0]) + Math.floor(Math.random() * 5),
        status: 'ready'
      };

      setGeneratedReports(prev => [newReport, ...prev]);
      setIsGenerating(false);
      setSelectedTemplate(null);
    }, 3000);
  };

  const handleScheduleToggle = (reportType) => {
    setScheduleSettings(prev => ({
      ...prev,
      [reportType]: { ...prev[reportType], enabled: !prev[reportType].enabled }
    }));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTemplateIcon = (templateId) => {
    const template = reportTemplates.find(t => t.id === templateId);
    return template ? template.icon : <FileText size={18} />;
  };

  return (
    <div className="report-generator">
      <header className="rg-header">
        <div className="rg-title">
          <FileText size={28} />
          <h1>Report Generator</h1>
          <span className="docs-badge"><FilePlus size={14} /> Auto-Generate</span>
        </div>
        <p className="rg-subtitle">Generate compliance reports, board packs, and audit documentation</p>
      </header>

      <div className="rg-stats">
        <div className="rg-stat-card">
          <div className="rg-stat-icon"><FileText size={24} /></div>
          <div className="rg-stat-content">
            <div className="rg-stat-value">{reportTemplates.length}</div>
            <div className="rg-stat-label">Report Templates</div>
          </div>
        </div>
        <div className="rg-stat-card">
          <div className="rg-stat-icon"><Download size={24} /></div>
          <div className="rg-stat-content">
            <div className="rg-stat-value">{generatedReports.length}</div>
            <div className="rg-stat-label">Reports Generated</div>
          </div>
        </div>
        <div className="rg-stat-card">
          <div className="rg-stat-icon"><Calendar size={24} /></div>
          <div className="rg-stat-content">
            <div className="rg-stat-value">{Object.values(scheduleSettings).filter(s => s.enabled).length}</div>
            <div className="rg-stat-label">Scheduled Reports</div>
          </div>
        </div>
        <div className="rg-stat-card">
          <div className="rg-stat-icon"><Clock size={24} /></div>
          <div className="rg-stat-content">
            <div className="rg-stat-value">90%</div>
            <div className="rg-stat-label">Time Saved</div>
          </div>
        </div>
      </div>

      <div className="rg-tabs">
        <button
          className={`rg-tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          <FilePlus size={18} /> Generate Report
        </button>
        <button
          className={`rg-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <FileText size={18} /> Report History
        </button>
        <button
          className={`rg-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={18} /> Scheduled Reports
        </button>
      </div>

      <div className="rg-content">
        {activeTab === 'generate' && (
          <div className="generate-panel">
            <div className="templates-section">
              <h2>Select Report Template</h2>
              <p>Choose a template to generate your compliance report</p>

              <div className="report-templates-grid">
                {reportTemplates.map(template => (
                  <div key={template.id} className="report-template-card">
                    <div className="template-header">
                      <div className="template-icon-lg">{template.icon}</div>
                      <div className="template-formats">
                        {template.format.map(f => (
                          <span key={f} className="format-tag">{f}</span>
                        ))}
                      </div>
                    </div>
                    <h3 className="template-title">{template.name}</h3>
                    <p className="template-description">{template.description}</p>

                    <div className="template-sections">
                      <span className="sections-label">Includes:</span>
                      <div className="sections-list">
                        {template.sections.slice(0, 3).map((section, idx) => (
                          <span key={idx} className="section-tag">{section}</span>
                        ))}
                        {template.sections.length > 3 && (
                          <span className="section-tag more">+{template.sections.length - 3} more</span>
                        )}
                      </div>
                    </div>

                    <div className="template-footer">
                      <span className="page-estimate">{template.estimatedPages} pages</span>
                      <button
                        className="generate-btn"
                        onClick={() => handleGenerateReport(template)}
                        disabled={isGenerating}
                      >
                        {isGenerating && selectedTemplate?.id === template.id ? (
                          <>
                            <RefreshCw size={16} className="spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FilePlus size={16} />
                            Generate
                          </>
                        )}
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
              <h2>Generated Reports</h2>
              <div className="history-actions">
                <button className="refresh-btn">
                  <RefreshCw size={16} /> Refresh
                </button>
              </div>
            </div>

            <div className="reports-table">
              <div className="table-header">
                <div className="th-name">Report Name</div>
                <div className="th-date">Generated</div>
                <div className="th-format">Format</div>
                <div className="th-size">Size</div>
                <div className="th-actions">Actions</div>
              </div>

              {generatedReports.map(report => (
                <div key={report.id} className="table-row">
                  <div className="td-name">
                    <div className="report-icon">{getTemplateIcon(report.template)}</div>
                    <div className="report-info">
                      <span className="report-name">{report.name}</span>
                      <span className="report-pages">{report.pages} pages</span>
                    </div>
                  </div>
                  <div className="td-date">{formatDate(report.generatedAt)}</div>
                  <div className="td-format">
                    <span className="format-badge">{report.format}</span>
                  </div>
                  <div className="td-size">{report.size}</div>
                  <div className="td-actions">
                    <button className="action-btn" title="Preview">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="Download">
                      <Download size={16} />
                    </button>
                    <button className="action-btn" title="Duplicate">
                      <Copy size={16} />
                    </button>
                    <button className="action-btn" title="Send">
                      <Send size={16} />
                    </button>
                    <button className="action-btn delete" title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="schedule-panel">
            <div className="schedule-header">
              <h2>Automated Report Scheduling</h2>
              <p>Configure automatic report generation and distribution</p>
            </div>

            <div className="schedule-list">
              <div className="schedule-item">
                <div className="schedule-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={scheduleSettings.boardReport.enabled}
                      onChange={() => handleScheduleToggle('boardReport')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="schedule-info">
                  <div className="schedule-icon"><FileText size={20} /></div>
                  <div className="schedule-details">
                    <h3>Board Report Pack</h3>
                    <p>Comprehensive compliance report for board meetings</p>
                  </div>
                </div>
                <div className="schedule-config">
                  <select
                    value={scheduleSettings.boardReport.frequency}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      boardReport: { ...prev.boardReport, frequency: e.target.value }
                    }))}
                    disabled={!scheduleSettings.boardReport.enabled}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                  <span className="schedule-next">Next: Feb 1, 2026</span>
                </div>
                <button className="schedule-settings-btn" disabled={!scheduleSettings.boardReport.enabled}>
                  <Settings size={16} />
                </button>
              </div>

              <div className="schedule-item">
                <div className="schedule-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={scheduleSettings.auditReport.enabled}
                      onChange={() => handleScheduleToggle('auditReport')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="schedule-info">
                  <div className="schedule-icon"><FileSpreadsheet size={20} /></div>
                  <div className="schedule-details">
                    <h3>Audit Trail Report</h3>
                    <p>Detailed compliance activity log for audit purposes</p>
                  </div>
                </div>
                <div className="schedule-config">
                  <select
                    value={scheduleSettings.auditReport.frequency}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      auditReport: { ...prev.auditReport, frequency: e.target.value }
                    }))}
                    disabled={!scheduleSettings.auditReport.enabled}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                  <span className="schedule-next">Next: Apr 1, 2026</span>
                </div>
                <button className="schedule-settings-btn" disabled={!scheduleSettings.auditReport.enabled}>
                  <Settings size={16} />
                </button>
              </div>

              <div className="schedule-item">
                <div className="schedule-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={scheduleSettings.exceptionsReport.enabled}
                      onChange={() => handleScheduleToggle('exceptionsReport')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="schedule-info">
                  <div className="schedule-icon"><FileText size={20} /></div>
                  <div className="schedule-details">
                    <h3>Exception Summary</h3>
                    <p>Weekly summary of open exceptions and remediation progress</p>
                  </div>
                </div>
                <div className="schedule-config">
                  <select
                    value={scheduleSettings.exceptionsReport.frequency}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      exceptionsReport: { ...prev.exceptionsReport, frequency: e.target.value }
                    }))}
                    disabled={!scheduleSettings.exceptionsReport.enabled}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="schedule-next">Next: Monday, Jan 27</span>
                </div>
                <button className="schedule-settings-btn" disabled={!scheduleSettings.exceptionsReport.enabled}>
                  <Settings size={16} />
                </button>
              </div>

              <div className="schedule-item">
                <div className="schedule-toggle">
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={scheduleSettings.driftReport.enabled}
                      onChange={() => handleScheduleToggle('driftReport')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="schedule-info">
                  <div className="schedule-icon"><FileText size={20} /></div>
                  <div className="schedule-details">
                    <h3>Control Drift Report</h3>
                    <p>Analysis of control health and drift trends</p>
                  </div>
                </div>
                <div className="schedule-config">
                  <select
                    value={scheduleSettings.driftReport.frequency}
                    onChange={(e) => setScheduleSettings(prev => ({
                      ...prev,
                      driftReport: { ...prev.driftReport, frequency: e.target.value }
                    }))}
                    disabled={!scheduleSettings.driftReport.enabled}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <span className="schedule-next">Next: Friday, Jan 31</span>
                </div>
                <button className="schedule-settings-btn" disabled={!scheduleSettings.driftReport.enabled}>
                  <Settings size={16} />
                </button>
              </div>
            </div>

            <div className="distribution-settings">
              <h3>Distribution Settings</h3>
              <div className="distribution-options">
                <label className="distribution-option">
                  <input type="checkbox" defaultChecked />
                  <span>Email reports to configured recipients</span>
                </label>
                <label className="distribution-option">
                  <input type="checkbox" defaultChecked />
                  <span>Store reports in document library</span>
                </label>
                <label className="distribution-option">
                  <input type="checkbox" />
                  <span>Upload to SharePoint/Confluence</span>
                </label>
              </div>
            </div>

            <div className="schedule-actions">
              <button className="save-schedule-btn">
                <CheckCircle size={18} /> Save Schedule Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGenerator;
