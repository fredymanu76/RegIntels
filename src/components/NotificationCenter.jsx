import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, AlertTriangle, Shield, TrendingUp, Settings, Check, X, Send } from 'lucide-react';
import './NotificationCenter.css';

const NotificationCenter = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('alerts');
  const [alertSettings, setAlertSettings] = useState({
    // Regulatory Alerts
    newRegChange: true,
    highImpactChange: true,
    upcomingDeadline: true,
    // Control Alerts
    controlDrift: true,
    criticalDrift: true,
    overdueReview: true,
    // Exception Alerts
    newException: true,
    criticalException: true,
    exceptionAging: true,
    // Attestation Alerts
    attestationDue: true,
    lowConfidence: true,
    overdueAttestation: true
  });

  const [digestSettings, setDigestSettings] = useState({
    enabled: true,
    frequency: 'daily',
    time: '08:00',
    recipients: ['compliance@company.com'],
    includeMetrics: true,
    includeExceptions: true,
    includeDeadlines: true,
    includeDrift: true
  });

  const [notifications, setNotifications] = useState([]);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    generateSampleNotifications();
  }, []);

  const generateSampleNotifications = () => {
    const sampleNotifications = [
      {
        id: 1,
        type: 'regulatory',
        severity: 'high',
        title: 'New FCA Policy Statement',
        message: 'PS24/1: Consumer Duty Implementation - Requires immediate review',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false
      },
      {
        id: 2,
        type: 'drift',
        severity: 'critical',
        title: 'Critical Control Drift Detected',
        message: 'CTRL-003: Transaction Monitoring has entered critical drift status',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        read: false
      },
      {
        id: 3,
        type: 'exception',
        severity: 'high',
        title: 'New High-Severity Exception',
        message: 'AML Screening Gap identified in onboarding process',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true
      },
      {
        id: 4,
        type: 'deadline',
        severity: 'warning',
        title: 'Upcoming Regulatory Deadline',
        message: 'Consumer Duty Board Report due in 7 days',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        read: true
      },
      {
        id: 5,
        type: 'attestation',
        severity: 'medium',
        title: 'Attestation Reminder',
        message: '3 control attestations due this week',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
        read: true
      }
    ];
    setNotifications(sampleNotifications);
  };

  const handleAlertToggle = (key) => {
    setAlertSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDigestChange = (key, value) => {
    setDigestSettings(prev => ({ ...prev, [key]: value }));
  };

  const addRecipient = () => {
    if (newRecipient && newRecipient.includes('@')) {
      setDigestSettings(prev => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient]
      }));
      setNewRecipient('');
    }
  };

  const removeRecipient = (email) => {
    setDigestSettings(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical': return 'severity-critical';
      case 'high': return 'severity-high';
      case 'warning': return 'severity-warning';
      default: return 'severity-medium';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'regulatory': return <Bell size={18} />;
      case 'drift': return <TrendingUp size={18} />;
      case 'exception': return <AlertTriangle size={18} />;
      case 'deadline': return <Clock size={18} />;
      case 'attestation': return <Shield size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-center">
      <header className="nc-header">
        <div className="nc-title">
          <Bell size={28} />
          <h1>Notification Center</h1>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <p className="nc-subtitle">Configure alerts, digests, and stay informed on compliance changes</p>
      </header>

      <div className="nc-tabs">
        <button
          className={`nc-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={18} /> Recent Alerts
        </button>
        <button
          className={`nc-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} /> Alert Settings
        </button>
        <button
          className={`nc-tab ${activeTab === 'digest' ? 'active' : ''}`}
          onClick={() => setActiveTab('digest')}
        >
          <Mail size={18} /> Email Digest
        </button>
      </div>

      <div className="nc-content">
        {activeTab === 'alerts' && (
          <div className="alerts-panel">
            <div className="alerts-header">
              <h2>Recent Notifications</h2>
              {unreadCount > 0 && (
                <button className="mark-all-btn" onClick={markAllAsRead}>
                  <Check size={16} /> Mark all as read
                </button>
              )}
            </div>

            <div className="alerts-list">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`alert-item ${notification.read ? 'read' : 'unread'} ${getSeverityClass(notification.severity)}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="alert-icon">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="alert-content">
                    <div className="alert-title">{notification.title}</div>
                    <div className="alert-message">{notification.message}</div>
                    <div className="alert-time">{getTimeAgo(notification.timestamp)}</div>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-panel">
            <div className="settings-section">
              <h3><Bell size={20} /> Regulatory Change Alerts</h3>
              <div className="settings-grid">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.newRegChange}
                    onChange={() => handleAlertToggle('newRegChange')}
                  />
                  <span>New regulatory changes detected</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.highImpactChange}
                    onChange={() => handleAlertToggle('highImpactChange')}
                  />
                  <span>High-impact changes (score &gt; 60)</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.upcomingDeadline}
                    onChange={() => handleAlertToggle('upcomingDeadline')}
                  />
                  <span>Upcoming regulatory deadlines (30 days)</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3><TrendingUp size={20} /> Control Drift Alerts</h3>
              <div className="settings-grid">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.controlDrift}
                    onChange={() => handleAlertToggle('controlDrift')}
                  />
                  <span>Control enters drift status</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.criticalDrift}
                    onChange={() => handleAlertToggle('criticalDrift')}
                  />
                  <span>Critical drift detected (immediate)</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.overdueReview}
                    onChange={() => handleAlertToggle('overdueReview')}
                  />
                  <span>Overdue control reviews</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3><AlertTriangle size={20} /> Exception Alerts</h3>
              <div className="settings-grid">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.newException}
                    onChange={() => handleAlertToggle('newException')}
                  />
                  <span>New exceptions raised</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.criticalException}
                    onChange={() => handleAlertToggle('criticalException')}
                  />
                  <span>Critical/High severity exceptions</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.exceptionAging}
                    onChange={() => handleAlertToggle('exceptionAging')}
                  />
                  <span>Exception aging milestones (30/60/90 days)</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3><Shield size={20} /> Attestation Alerts</h3>
              <div className="settings-grid">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.attestationDue}
                    onChange={() => handleAlertToggle('attestationDue')}
                  />
                  <span>Attestations due soon (7 days)</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.lowConfidence}
                    onChange={() => handleAlertToggle('lowConfidence')}
                  />
                  <span>Low confidence attestations detected</span>
                </label>
                <label className="setting-item">
                  <input
                    type="checkbox"
                    checked={alertSettings.overdueAttestation}
                    onChange={() => handleAlertToggle('overdueAttestation')}
                  />
                  <span>Overdue attestations</span>
                </label>
              </div>
            </div>

            <button className="save-settings-btn">
              <Check size={18} /> Save Alert Settings
            </button>
          </div>
        )}

        {activeTab === 'digest' && (
          <div className="digest-panel">
            <div className="digest-toggle">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={digestSettings.enabled}
                  onChange={(e) => handleDigestChange('enabled', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Enable Email Digest</span>
            </div>

            {digestSettings.enabled && (
              <>
                <div className="digest-section">
                  <h3>Delivery Schedule</h3>
                  <div className="digest-schedule">
                    <select
                      value={digestSettings.frequency}
                      onChange={(e) => handleDigestChange('frequency', e.target.value)}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly (Monday)</option>
                      <option value="twice-weekly">Twice Weekly (Mon & Thu)</option>
                    </select>
                    <span>at</span>
                    <input
                      type="time"
                      value={digestSettings.time}
                      onChange={(e) => handleDigestChange('time', e.target.value)}
                    />
                  </div>
                </div>

                <div className="digest-section">
                  <h3>Recipients</h3>
                  <div className="recipients-list">
                    {digestSettings.recipients.map((email, idx) => (
                      <div key={idx} className="recipient-tag">
                        {email}
                        <button onClick={() => removeRecipient(email)}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="add-recipient">
                    <input
                      type="email"
                      placeholder="Add email address..."
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                    />
                    <button onClick={addRecipient}>Add</button>
                  </div>
                </div>

                <div className="digest-section">
                  <h3>Digest Content</h3>
                  <div className="digest-content-options">
                    <label className="setting-item">
                      <input
                        type="checkbox"
                        checked={digestSettings.includeMetrics}
                        onChange={(e) => handleDigestChange('includeMetrics', e.target.checked)}
                      />
                      <span>Compliance metrics summary</span>
                    </label>
                    <label className="setting-item">
                      <input
                        type="checkbox"
                        checked={digestSettings.includeExceptions}
                        onChange={(e) => handleDigestChange('includeExceptions', e.target.checked)}
                      />
                      <span>Open exceptions overview</span>
                    </label>
                    <label className="setting-item">
                      <input
                        type="checkbox"
                        checked={digestSettings.includeDeadlines}
                        onChange={(e) => handleDigestChange('includeDeadlines', e.target.checked)}
                      />
                      <span>Upcoming deadlines</span>
                    </label>
                    <label className="setting-item">
                      <input
                        type="checkbox"
                        checked={digestSettings.includeDrift}
                        onChange={(e) => handleDigestChange('includeDrift', e.target.checked)}
                      />
                      <span>Control drift summary</span>
                    </label>
                  </div>
                </div>

                <div className="digest-actions">
                  <button className="preview-btn">
                    <Mail size={18} /> Preview Digest
                  </button>
                  <button className="send-test-btn">
                    <Send size={18} /> Send Test Email
                  </button>
                  <button className="save-digest-btn">
                    <Check size={18} /> Save Digest Settings
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
