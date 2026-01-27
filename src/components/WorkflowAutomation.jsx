import React, { useState } from 'react';
import { Workflow, Clock, Bell, Mail, CheckCircle, Plus, Play, Pause, Trash2, Edit2, AlertTriangle, Calendar, Users, Settings } from 'lucide-react';
import './WorkflowAutomation.css';

const WorkflowAutomation = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: 'Attestation Due Reminder',
      description: 'Sends reminder emails when attestations are due',
      trigger: 'attestation_due',
      triggerDays: 7,
      actions: ['email_owner', 'create_task'],
      enabled: true,
      lastRun: '2026-01-27T08:00:00Z',
      runCount: 45
    },
    {
      id: 2,
      name: 'Control Review Scheduler',
      description: 'Automatically schedules control reviews based on frequency',
      trigger: 'control_review_due',
      triggerDays: 14,
      actions: ['email_owner', 'notify_manager', 'calendar_event'],
      enabled: true,
      lastRun: '2026-01-26T09:00:00Z',
      runCount: 23
    },
    {
      id: 3,
      name: 'Exception Escalation',
      description: 'Escalates exceptions based on aging thresholds',
      trigger: 'exception_aging',
      triggerDays: 30,
      actions: ['email_manager', 'notify_board', 'create_task'],
      enabled: true,
      lastRun: '2026-01-25T14:00:00Z',
      runCount: 12
    },
    {
      id: 4,
      name: 'Regulatory Deadline Alert',
      description: 'Alerts team about upcoming regulatory deadlines',
      trigger: 'regulatory_deadline',
      triggerDays: 30,
      actions: ['email_compliance', 'slack_notification'],
      enabled: false,
      lastRun: null,
      runCount: 0
    },
    {
      id: 5,
      name: 'Low Confidence Attestation Review',
      description: 'Triggers review when attestation confidence falls below threshold',
      trigger: 'low_confidence',
      triggerThreshold: 40,
      actions: ['email_owner', 'assign_reviewer', 'create_task'],
      enabled: true,
      lastRun: '2026-01-27T10:30:00Z',
      runCount: 8
    }
  ]);

  const [upcomingReminders, setUpcomingReminders] = useState([
    { id: 1, type: 'attestation', title: 'CTRL-001 Attestation Due', dueDate: '2026-02-01', assignee: 'Sarah Chen', priority: 'high' },
    { id: 2, type: 'review', title: 'CTRL-003 Control Review', dueDate: '2026-02-03', assignee: 'Mark Lington', priority: 'medium' },
    { id: 3, type: 'exception', title: 'EXC-002 Follow-up Required', dueDate: '2026-02-05', assignee: 'Emily Thompson', priority: 'high' },
    { id: 4, type: 'deadline', title: 'Consumer Duty Report Due', dueDate: '2026-02-15', assignee: 'Compliance Team', priority: 'critical' },
    { id: 5, type: 'attestation', title: 'CTRL-005 Attestation Due', dueDate: '2026-02-10', assignee: 'David Chen', priority: 'medium' }
  ]);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'attestation_due',
    triggerDays: 7,
    actions: []
  });

  const toggleWorkflow = (id) => {
    setWorkflows(prev => prev.map(wf =>
      wf.id === id ? { ...wf, enabled: !wf.enabled } : wf
    ));
  };

  const deleteWorkflow = (id) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      setWorkflows(prev => prev.filter(wf => wf.id !== id));
    }
  };

  const getTriggerLabel = (trigger) => {
    const labels = {
      'attestation_due': 'Attestation Due',
      'control_review_due': 'Control Review Due',
      'exception_aging': 'Exception Aging',
      'regulatory_deadline': 'Regulatory Deadline',
      'low_confidence': 'Low Confidence Score',
      'drift_detected': 'Control Drift Detected'
    };
    return labels[trigger] || trigger;
  };

  const getActionLabel = (action) => {
    const labels = {
      'email_owner': 'Email Owner',
      'email_manager': 'Email Manager',
      'email_compliance': 'Email Compliance Team',
      'notify_board': 'Notify Board',
      'notify_manager': 'Notify Manager',
      'create_task': 'Create Task',
      'calendar_event': 'Create Calendar Event',
      'slack_notification': 'Slack Notification',
      'assign_reviewer': 'Assign Reviewer'
    };
    return labels[action] || action;
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'critical': return 'priority-critical';
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'attestation': return <CheckCircle size={16} />;
      case 'review': return <Clock size={16} />;
      case 'exception': return <AlertTriangle size={16} />;
      case 'deadline': return <Calendar size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getDaysUntil = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Overdue';
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days`;
  };

  return (
    <div className="workflow-automation">
      <header className="wa-header">
        <div className="wa-title">
          <Workflow size={28} />
          <h1>Workflow Automation</h1>
        </div>
        <p className="wa-subtitle">Automate reminders, escalations, and compliance workflows</p>
      </header>

      <div className="wa-stats">
        <div className="stat-card">
          <div className="stat-icon"><Workflow size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{workflows.filter(w => w.enabled).length}</div>
            <div className="stat-label">Active Workflows</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Bell size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{upcomingReminders.length}</div>
            <div className="stat-label">Upcoming Reminders</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Mail size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">{workflows.reduce((sum, w) => sum + w.runCount, 0)}</div>
            <div className="stat-label">Automations Run</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={24} /></div>
          <div className="stat-content">
            <div className="stat-value">156</div>
            <div className="stat-label">Hours Saved</div>
          </div>
        </div>
      </div>

      <div className="wa-tabs">
        <button
          className={`wa-tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          <Workflow size={18} /> Workflows
        </button>
        <button
          className={`wa-tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={18} /> Upcoming Reminders
        </button>
        <button
          className={`wa-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Settings size={18} /> Templates
        </button>
      </div>

      <div className="wa-content">
        {activeTab === 'workflows' && (
          <div className="workflows-panel">
            <div className="panel-header">
              <h2>Automated Workflows</h2>
              <button className="create-btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> Create Workflow
              </button>
            </div>

            <div className="workflows-list">
              {workflows.map(workflow => (
                <div key={workflow.id} className={`workflow-card ${workflow.enabled ? 'enabled' : 'disabled'}`}>
                  <div className="workflow-status">
                    <button
                      className={`toggle-btn ${workflow.enabled ? 'on' : 'off'}`}
                      onClick={() => toggleWorkflow(workflow.id)}
                    >
                      {workflow.enabled ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                  </div>

                  <div className="workflow-content">
                    <div className="workflow-header">
                      <h3>{workflow.name}</h3>
                      <span className={`status-badge ${workflow.enabled ? 'active' : 'inactive'}`}>
                        {workflow.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="workflow-desc">{workflow.description}</p>

                    <div className="workflow-config">
                      <div className="config-item">
                        <span className="config-label">Trigger:</span>
                        <span className="config-value trigger-badge">
                          {getTriggerLabel(workflow.trigger)}
                          {workflow.triggerDays && ` (${workflow.triggerDays} days before)`}
                          {workflow.triggerThreshold && ` (below ${workflow.triggerThreshold})`}
                        </span>
                      </div>
                      <div className="config-item">
                        <span className="config-label">Actions:</span>
                        <div className="action-tags">
                          {workflow.actions.map((action, idx) => (
                            <span key={idx} className="action-tag">{getActionLabel(action)}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="workflow-stats">
                      <span><Clock size={14} /> Last run: {formatDate(workflow.lastRun)}</span>
                      <span><CheckCircle size={14} /> {workflow.runCount} executions</span>
                    </div>
                  </div>

                  <div className="workflow-actions">
                    <button className="action-btn edit"><Edit2 size={16} /></button>
                    <button className="action-btn delete" onClick={() => deleteWorkflow(workflow.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="reminders-panel">
            <div className="panel-header">
              <h2>Upcoming Reminders</h2>
              <div className="filter-controls">
                <select defaultValue="all">
                  <option value="all">All Types</option>
                  <option value="attestation">Attestations</option>
                  <option value="review">Reviews</option>
                  <option value="exception">Exceptions</option>
                  <option value="deadline">Deadlines</option>
                </select>
              </div>
            </div>

            <div className="reminders-list">
              <table className="reminders-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item</th>
                    <th>Due Date</th>
                    <th>Time Left</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingReminders.map(reminder => (
                    <tr key={reminder.id}>
                      <td>
                        <span className={`type-icon ${reminder.type}`}>
                          {getTypeIcon(reminder.type)}
                        </span>
                      </td>
                      <td className="item-cell">{reminder.title}</td>
                      <td>{formatDate(reminder.dueDate)}</td>
                      <td>
                        <span className={`days-badge ${getDaysUntil(reminder.dueDate) === 'Overdue' ? 'overdue' : ''}`}>
                          {getDaysUntil(reminder.dueDate)}
                        </span>
                      </td>
                      <td>
                        <span className="assignee">
                          <Users size={14} /> {reminder.assignee}
                        </span>
                      </td>
                      <td>
                        <span className={`priority-badge ${getPriorityClass(reminder.priority)}`}>
                          {reminder.priority}
                        </span>
                      </td>
                      <td>
                        <button className="send-reminder-btn">
                          <Mail size={14} /> Send Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-panel">
            <div className="panel-header">
              <h2>Workflow Templates</h2>
            </div>

            <div className="templates-grid">
              <div className="template-card">
                <div className="template-icon"><CheckCircle size={32} /></div>
                <h3>Attestation Reminders</h3>
                <p>Automated reminders for upcoming and overdue attestations</p>
                <ul>
                  <li>7-day advance notice</li>
                  <li>Daily reminders when overdue</li>
                  <li>Manager escalation after 3 days</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>

              <div className="template-card">
                <div className="template-icon"><AlertTriangle size={32} /></div>
                <h3>Exception Management</h3>
                <p>Escalation workflow for aging exceptions</p>
                <ul>
                  <li>30-day aging alert</li>
                  <li>60-day manager escalation</li>
                  <li>90-day board notification</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>

              <div className="template-card">
                <div className="template-icon"><Calendar size={32} /></div>
                <h3>Regulatory Deadlines</h3>
                <p>Track and alert on regulatory submission dates</p>
                <ul>
                  <li>90-day advance planning</li>
                  <li>30-day final reminder</li>
                  <li>Weekly countdown in final month</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>

              <div className="template-card">
                <div className="template-icon"><Workflow size={32} /></div>
                <h3>Control Review Cycle</h3>
                <p>Automated scheduling of control reviews</p>
                <ul>
                  <li>Frequency-based scheduling</li>
                  <li>Owner assignment</li>
                  <li>Evidence collection reminders</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>

              <div className="template-card">
                <div className="template-icon"><Users size={32} /></div>
                <h3>Board Reporting</h3>
                <p>Automated board pack preparation workflow</p>
                <ul>
                  <li>Monthly data collection</li>
                  <li>Reviewer assignment</li>
                  <li>Approval workflow</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>

              <div className="template-card">
                <div className="template-icon"><Bell size={32} /></div>
                <h3>Drift Alerts</h3>
                <p>Early warning for control drift detection</p>
                <ul>
                  <li>Emerging drift notification</li>
                  <li>Material drift escalation</li>
                  <li>Critical drift immediate alert</li>
                </ul>
                <button className="use-template-btn">Use Template</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Workflow</h2>

            <div className="form-group">
              <label>Workflow Name</label>
              <input
                type="text"
                placeholder="e.g., Monthly Attestation Reminder"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({...newWorkflow, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Describe what this workflow does..."
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({...newWorkflow, description: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Trigger</label>
              <select
                value={newWorkflow.trigger}
                onChange={(e) => setNewWorkflow({...newWorkflow, trigger: e.target.value})}
              >
                <option value="attestation_due">Attestation Due</option>
                <option value="control_review_due">Control Review Due</option>
                <option value="exception_aging">Exception Aging</option>
                <option value="regulatory_deadline">Regulatory Deadline</option>
                <option value="low_confidence">Low Confidence Score</option>
                <option value="drift_detected">Control Drift Detected</option>
              </select>
            </div>

            <div className="form-group">
              <label>Trigger Days Before</label>
              <input
                type="number"
                value={newWorkflow.triggerDays}
                onChange={(e) => setNewWorkflow({...newWorkflow, triggerDays: parseInt(e.target.value)})}
              />
            </div>

            <div className="form-group">
              <label>Actions</label>
              <div className="checkbox-group">
                {['email_owner', 'email_manager', 'create_task', 'calendar_event', 'slack_notification'].map(action => (
                  <label key={action} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newWorkflow.actions.includes(action)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewWorkflow({...newWorkflow, actions: [...newWorkflow.actions, action]});
                        } else {
                          setNewWorkflow({...newWorkflow, actions: newWorkflow.actions.filter(a => a !== action)});
                        }
                      }}
                    />
                    {getActionLabel(action)}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="save-btn">
                <CheckCircle size={16} /> Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomation;
