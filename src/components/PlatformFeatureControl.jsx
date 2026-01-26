import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Upload, Play, Settings, Users, BarChart3, Shield, FileText, ClipboardCheck, History, BookOpen, ThumbsUp, TrendingUp, PieChart, Activity, Gauge, AlertTriangle, X, Check } from 'lucide-react';
import StrategicDashboard from './StrategicDashboard';
import ExceptionsOverviewBoard from './ExceptionsOverviewBoard';
import RegulatoryReadinessBoard from './RegulatoryReadinessBoard';
import AttestationsBoard from './AttestationsBoard';
import AuditTrailBoard from './AuditTrailBoard';
import DecisionRegisterBoard from './DecisionRegisterBoard';
import ApprovalsBoard from './ApprovalsBoard';
import Solution4Dashboard from './Solution4Dashboard';
import './PlatformFeatureControl.css';

const PlatformFeatureControl = ({ supabase }) => {
  const [features, setFeatures] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Deployment cockpit state
  const [showDeployCockpit, setShowDeployCockpit] = useState(false);
  const [deployFeature, setDeployFeature] = useState(null);
  const [selectedTenants, setSelectedTenants] = useState({});
  const [tenantFeatureAccess, setTenantFeatureAccess] = useState({});

  // Define available platform features
  const platformFeatures = [
    // Solution 1
    {
      id: 'change-register',
      name: 'Change Register',
      description: 'Track and manage regulatory changes',
      component: 'ChangeRegister',
      version: '1.0.0',
      solution: 'Solution 1',
      page: 'Change Register',
      icon: FileText,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Compliance'
    },
    // Solution 2
    {
      id: 'control-library',
      name: 'Control Library',
      description: 'Manage compliance controls and attestations',
      component: 'ControlLibrary',
      version: '1.0.0',
      solution: 'Solution 2',
      page: 'Control Library',
      icon: Shield,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Controls'
    },
    // Solution 4
    {
      id: 'risk-signal-hub',
      name: 'Risk Signal Hub',
      description: 'Operational Risk Signal Hub - Exception Management Intelligence with materiality scoring (0-100), risk acceleration timeline, and recurrence pattern detection',
      component: 'Solution4Dashboard',
      version: '1.0.0',
      solution: 'Solution 4',
      page: 'Risk Signal Hub',
      icon: AlertTriangle,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Risk Intelligence'
    },
    // Solution 5 - Board-Level Features
    {
      id: 'strategic-scoring',
      name: 'Strategic Scoring Dashboard',
      description: 'Impact scoring, control drift detection, and attestation confidence tracking',
      component: 'StrategicDashboard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Strategic Scoring',
      icon: BarChart3,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Analytics'
    },
    {
      id: 'management-summary',
      name: 'Management Summary',
      description: 'Executive overview of compliance posture and key metrics for board reporting',
      component: 'ManagementSummaryPage',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Management Summary',
      icon: PieChart,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Board Reporting'
    },
    {
      id: 'risk-posture',
      name: 'Risk Posture',
      description: 'Comprehensive risk posture analysis with trend visualization',
      component: 'RiskPosturePage',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Risk Posture',
      icon: TrendingUp,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Risk Management'
    },
    {
      id: 'control-effectiveness',
      name: 'Control Effectiveness',
      description: 'Measure and track control effectiveness scores across the organization',
      component: 'ControlEffectivenessPage',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Control Effectiveness',
      icon: Gauge,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Controls'
    },
    {
      id: 'exceptions-overview',
      name: 'Exceptions Overview',
      description: 'Board-level exception intelligence dashboard with aging analysis and risk distribution',
      component: 'ExceptionsOverviewBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Exceptions Overview',
      icon: AlertCircle,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Board Reporting'
    },
    {
      id: 'regulatory-readiness',
      name: 'Regulatory Readiness',
      description: 'Track regulatory readiness scores and compliance timeline for upcoming changes',
      component: 'RegulatoryReadinessBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Regulatory Readiness',
      icon: Activity,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Regulatory'
    },
    {
      id: 'attestations-board',
      name: 'Attestations',
      description: 'Board-level attestation tracking with completion rates and confidence scoring',
      component: 'AttestationsBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Attestations',
      icon: ClipboardCheck,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Attestations'
    },
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      description: 'Comprehensive audit trail for compliance activities and system changes',
      component: 'AuditTrailBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Audit Trail',
      icon: History,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Audit'
    },
    {
      id: 'decision-register',
      name: 'Decision Register',
      description: 'Track and manage compliance decisions with full audit history',
      component: 'DecisionRegisterBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Decision Register',
      icon: BookOpen,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Governance'
    },
    {
      id: 'approvals-board',
      name: 'Approvals',
      description: 'Approval workflow management for compliance actions and exceptions',
      component: 'ApprovalsBoard',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'Approvals',
      icon: ThumbsUp,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Workflow'
    },
    {
      id: 'api-health',
      name: 'API Health',
      description: 'Monitor API integrations and system health metrics',
      component: 'APIHealthPage',
      version: '1.0.0',
      solution: 'Solution 5',
      page: 'API Health',
      icon: Activity,
      status: 'active',
      deployedAt: new Date().toISOString(),
      category: 'Technical'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, status, regime')
        .eq('status', 'active')
        .order('name');

      if (tenantsError) throw tenantsError;

      // Fetch feature configurations from database to get deployment status
      const { data: featuresData } = await supabase
        .from('platform_features')
        .select('*')
        .order('name');

      // Fetch tenant feature access records
      const { data: accessData } = await supabase
        .from('tenant_feature_access')
        .select('*');

      // Build tenant feature access map
      const accessMap = {};
      if (accessData) {
        accessData.forEach(record => {
          if (!accessMap[record.feature_id]) {
            accessMap[record.feature_id] = {};
          }
          accessMap[record.feature_id][record.tenant_id] = record.has_access;
        });
      }
      setTenantFeatureAccess(accessMap);

      // ALWAYS use hardcoded platformFeatures as the master list
      const mergedFeatures = platformFeatures.map(feature => {
        const dbFeature = featuresData?.find(f => f.id === feature.id);
        if (dbFeature) {
          return {
            ...feature,
            status: dbFeature.status || feature.status,
            deployedAt: dbFeature.deployed_at || feature.deployedAt
          };
        }
        return feature;
      });

      setTenants(tenantsData || []);
      setFeatures(mergedFeatures);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFeatures(platformFeatures);
    } finally {
      setLoading(false);
    }
  };

  // Open deployment cockpit for a feature
  const openDeployCockpit = (feature) => {
    setDeployFeature(feature);

    // Initialize selected tenants based on existing access
    const initialSelected = {};
    tenants.forEach(tenant => {
      // Check if tenant has access to this feature
      const hasAccess = tenantFeatureAccess[feature.id]?.[tenant.id] ?? false;
      initialSelected[tenant.id] = hasAccess;
    });
    setSelectedTenants(initialSelected);
    setShowDeployCockpit(true);
  };

  // Toggle individual tenant selection
  const toggleTenantSelection = (tenantId) => {
    setSelectedTenants(prev => ({
      ...prev,
      [tenantId]: !prev[tenantId]
    }));
  };

  // Select all tenants
  const selectAllTenants = () => {
    const allSelected = {};
    tenants.forEach(tenant => {
      allSelected[tenant.id] = true;
    });
    setSelectedTenants(allSelected);
  };

  // Deselect all tenants
  const deselectAllTenants = () => {
    const noneSelected = {};
    tenants.forEach(tenant => {
      noneSelected[tenant.id] = false;
    });
    setSelectedTenants(noneSelected);
  };

  // Get count of selected tenants
  const getSelectedCount = () => {
    return Object.values(selectedTenants).filter(Boolean).length;
  };

  // Deploy feature to selected tenants
  const handleDeployToSelected = async () => {
    const selectedTenantIds = Object.entries(selectedTenants)
      .filter(([_, isSelected]) => isSelected)
      .map(([tenantId]) => tenantId);

    if (selectedTenantIds.length === 0) {
      alert('Please select at least one tenant to deploy to.');
      return;
    }

    setDeploying(true);
    setDeploymentStatus({ status: 'deploying', message: 'Updating tenant access...', progress: 0 });

    try {
      const feature = deployFeature;
      const totalOperations = tenants.length;
      let completedOperations = 0;

      // Update access for ALL tenants (grant or revoke)
      for (const tenant of tenants) {
        const hasAccess = selectedTenants[tenant.id] || false;

        setDeploymentStatus({
          status: 'deploying',
          message: hasAccess ? `Granting access to ${tenant.name}...` : `Updating ${tenant.name}...`,
          progress: Math.round((completedOperations / totalOperations) * 100)
        });

        // Upsert tenant feature access record
        await supabase
          .from('tenant_feature_access')
          .upsert({
            tenant_id: tenant.id,
            feature_id: feature.id,
            feature_name: feature.name,
            has_access: hasAccess,
            granted_by: 'Platform Owner',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'tenant_id,feature_id'
          });

        // Log deployment action if granting access
        if (hasAccess) {
          await supabase
            .from('platform_feature_deployments')
            .insert({
              feature_id: feature.id,
              feature_name: feature.name,
              feature_version: feature.version,
              tenant_id: tenant.id,
              tenant_name: tenant.name,
              deployed_by: 'Platform Owner',
              deployment_status: 'success',
              deployed_at: new Date().toISOString()
            });
        }

        completedOperations++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update local state
      setTenantFeatureAccess(prev => ({
        ...prev,
        [feature.id]: { ...selectedTenants }
      }));

      const grantedCount = selectedTenantIds.length;
      const revokedCount = tenants.length - grantedCount;

      setDeploymentStatus({
        status: 'success',
        message: `Access updated: ${grantedCount} granted, ${revokedCount} revoked for "${feature.name}"`,
        progress: 100
      });

      setTimeout(() => {
        setDeploymentStatus(null);
        setShowDeployCockpit(false);
      }, 3000);

    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus({
        status: 'error',
        message: `Deployment failed: ${error.message}`,
        progress: 0
      });
    } finally {
      setDeploying(false);
    }
  };

  const handleFeatureToggle = async (featureId, enabled) => {
    try {
      await supabase
        .from('platform_features')
        .upsert({
          id: featureId,
          status: enabled ? 'active' : 'inactive',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      setFeatures(features.map(f =>
        f.id === featureId ? { ...f, status: enabled ? 'active' : 'inactive' } : f
      ));
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  const handlePreviewFeature = (feature) => {
    setSelectedFeature(feature);
    setShowPreview(true);
  };

  // Get tenant access count for a feature
  const getTenantAccessCount = (featureId) => {
    const accessMap = tenantFeatureAccess[featureId];
    if (!accessMap) return 0;
    return Object.values(accessMap).filter(Boolean).length;
  };

  // Render preview component based on feature ID
  const renderPreviewComponent = () => {
    switch (selectedFeature?.id) {
      case 'strategic-scoring':
        return <StrategicDashboard supabase={supabase} />;
      case 'risk-signal-hub':
        return <Solution4Dashboard supabase={supabase} />;
      case 'exceptions-overview':
        return <ExceptionsOverviewBoard supabase={supabase} />;
      case 'regulatory-readiness':
        return <RegulatoryReadinessBoard supabase={supabase} />;
      case 'attestations-board':
        return <AttestationsBoard />;
      case 'audit-trail':
        return <AuditTrailBoard supabase={supabase} />;
      case 'decision-register':
        return <DecisionRegisterBoard supabase={supabase} />;
      case 'approvals-board':
        return <ApprovalsBoard supabase={supabase} />;
      default:
        return (
          <div className="preview-placeholder">
            <AlertCircle size={48} />
            <p>Preview not available for this feature</p>
            <small>This feature is deployed to tenant environments</small>
          </div>
        );
    }
  };

  // Render Deployment Cockpit Modal
  const renderDeployCockpit = () => {
    if (!showDeployCockpit || !deployFeature) return null;

    return (
      <div className="deploy-cockpit-overlay">
        <div className="deploy-cockpit-modal">
          <div className="cockpit-header">
            <div className="cockpit-title">
              <h2>Deployment Cockpit</h2>
              <p className="cockpit-feature-name">{deployFeature.name}</p>
            </div>
            <button className="close-btn" onClick={() => setShowDeployCockpit(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="cockpit-info">
            <div className="info-card">
              <span className="info-label">Feature</span>
              <span className="info-value">{deployFeature.name}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Version</span>
              <span className="info-value">v{deployFeature.version}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Solution</span>
              <span className="info-value">{deployFeature.solution}</span>
            </div>
            <div className="info-card highlight">
              <span className="info-label">Selected Tenants</span>
              <span className="info-value">{getSelectedCount()} / {tenants.length}</span>
            </div>
          </div>

          <div className="cockpit-actions">
            <button className="action-btn select-all" onClick={selectAllTenants}>
              <Check size={16} /> Select All
            </button>
            <button className="action-btn deselect-all" onClick={deselectAllTenants}>
              <X size={16} /> Deselect All
            </button>
          </div>

          <div className="tenant-list">
            <div className="tenant-list-header">
              <span>Tenant</span>
              <span>Regime</span>
              <span>Access</span>
            </div>
            {tenants.map(tenant => (
              <div
                key={tenant.id}
                className={`tenant-item ${selectedTenants[tenant.id] ? 'selected' : ''}`}
                onClick={() => toggleTenantSelection(tenant.id)}
              >
                <div className="tenant-info">
                  <span className="tenant-name">{tenant.name}</span>
                </div>
                <span className="tenant-regime">{tenant.regime || 'Standard'}</span>
                <div className="tenant-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedTenants[tenant.id] || false}
                    onChange={() => toggleTenantSelection(tenant.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={`checkbox-label ${selectedTenants[tenant.id] ? 'granted' : 'revoked'}`}>
                    {selectedTenants[tenant.id] ? 'Granted' : 'No Access'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {deploymentStatus && (
            <div className={`deployment-progress ${deploymentStatus.status}`}>
              <div className="progress-info">
                {deploymentStatus.status === 'deploying' && <Play size={20} className="spin" />}
                {deploymentStatus.status === 'success' && <CheckCircle size={20} />}
                {deploymentStatus.status === 'error' && <XCircle size={20} />}
                <span>{deploymentStatus.message}</span>
              </div>
              {deploymentStatus.status === 'deploying' && (
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${deploymentStatus.progress}%` }} />
                </div>
              )}
            </div>
          )}

          <div className="cockpit-footer">
            <button
              className="cancel-btn"
              onClick={() => setShowDeployCockpit(false)}
              disabled={deploying}
            >
              Cancel
            </button>
            <button
              className="deploy-btn"
              onClick={handleDeployToSelected}
              disabled={deploying}
            >
              {deploying ? (
                <>
                  <Play size={16} className="spin" /> Deploying...
                </>
              ) : (
                <>
                  <Upload size={16} /> Apply Access Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showPreview && selectedFeature) {
    return (
      <div className="feature-preview">
        <div className="preview-header">
          <button className="back-button" onClick={() => setShowPreview(false)}>
            ← Back to Feature Control
          </button>
          <h2>Preview: {selectedFeature.name}</h2>
          <span className="version-badge">v{selectedFeature.version}</span>
        </div>
        <div className="preview-content">
          {renderPreviewComponent()}
        </div>
      </div>
    );
  }

  return (
    <div className="platform-feature-control">
      {renderDeployCockpit()}

      <div className="control-header">
        <div>
          <h1>Platform Feature Control</h1>
          <p className="subtitle">Manage and deploy features across all tenants from a central control panel</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <Users size={20} />
            <div>
              <div className="stat-value">{tenants.length}</div>
              <div className="stat-label">Active Tenants</div>
            </div>
          </div>
          <div className="stat-card">
            <Settings size={20} />
            <div>
              <div className="stat-value">{features.filter(f => f.status === 'active').length}</div>
              <div className="stat-label">Active Features</div>
            </div>
          </div>
        </div>
      </div>

      {deploymentStatus && !showDeployCockpit && (
        <div className={`deployment-status ${deploymentStatus.status}`}>
          <div className="status-content">
            {deploymentStatus.status === 'deploying' && <Play size={20} className="spin" />}
            {deploymentStatus.status === 'success' && <CheckCircle size={20} />}
            {deploymentStatus.status === 'error' && <XCircle size={20} />}
            <div>
              <strong>{deploymentStatus.message}</strong>
              {deploymentStatus.status === 'deploying' && (
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${deploymentStatus.progress}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="features-grid">
        {loading ? (
          <div className="loading-state">
            <Play size={32} className="spin" />
            <p>Loading features...</p>
          </div>
        ) : (
          features.map(feature => {
            const Icon = feature.icon || Settings;
            const isActive = feature.status === 'active';
            const accessCount = getTenantAccessCount(feature.id);

            return (
              <div key={feature.id} className={`feature-card ${isActive ? 'active' : 'inactive'}`}>
                <div className="feature-header">
                  <div className="feature-icon">
                    {Icon && <Icon size={24} />}
                  </div>
                  <div className="feature-info">
                    <h3>{feature.name}</h3>
                    <span className="feature-category">{feature.category}</span>
                  </div>
                  <div className="feature-status">
                    <span className={`status-badge ${feature.status}`}>
                      {feature.status === 'active' ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                </div>

                <p className="feature-description">{feature.description}</p>

                <div className="feature-meta">
                  <div className="meta-item">
                    <strong>Version:</strong> {feature.version}
                  </div>
                  <div className="meta-item">
                    <strong>Location:</strong> {feature.solution} → {feature.page}
                  </div>
                  <div className="meta-item access-count">
                    <strong>Tenant Access:</strong>
                    <span className={accessCount > 0 ? 'has-access' : 'no-access'}>
                      {accessCount} / {tenants.length} tenants
                    </span>
                  </div>
                </div>

                <div className="feature-actions">
                  <button
                    className="btn-preview"
                    onClick={() => handlePreviewFeature(feature)}
                    disabled={!isActive}
                  >
                    <Play size={16} />
                    Preview
                  </button>

                  <button
                    className="btn-deploy"
                    onClick={() => openDeployCockpit(feature)}
                    disabled={deploying || !isActive}
                  >
                    <Upload size={16} />
                    Manage Access
                  </button>

                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => handleFeatureToggle(feature.id, e.target.checked)}
                      disabled={deploying}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="tenant-overview">
        <h2>Tenant Deployment Status</h2>
        <div className="tenant-grid">
          {tenants.slice(0, 6).map(tenant => {
            // Count features this tenant has access to
            const accessibleFeatures = features.filter(f =>
              tenantFeatureAccess[f.id]?.[tenant.id]
            ).length;

            return (
              <div key={tenant.id} className="tenant-card">
                <div className="tenant-header">
                  <h4>{tenant.name}</h4>
                  <span className="regime-badge">{tenant.regime}</span>
                </div>
                <div className="tenant-features">
                  <CheckCircle size={16} className={accessibleFeatures > 0 ? 'success' : 'muted'} />
                  <span>{accessibleFeatures} / {features.length} features enabled</span>
                </div>
              </div>
            );
          })}
        </div>
        {tenants.length > 6 && (
          <p className="tenant-more">+ {tenants.length - 6} more tenants</p>
        )}
      </div>

      <div className="control-footer">
        <div className="footer-info">
          <AlertCircle size={16} />
          <p>
            <strong>Platform Owner Mode:</strong> Use "Manage Access" to control which tenants can access each feature.
            Changes are applied immediately and control tenant-level feature visibility.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeatureControl;
