import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Upload, Play, Settings, Users, BarChart3, Shield, FileText, Download } from 'lucide-react';
import StrategicDashboard from './StrategicDashboard';
import './PlatformFeatureControl.css';

const PlatformFeatureControl = ({ supabase }) => {
  const [features, setFeatures] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Define available platform features
  const platformFeatures = [
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

      // Fetch feature configurations
      const { data: featuresData, error: featuresError } = await supabase
        .from('platform_features')
        .select('*')
        .order('name');

      // If table doesn't exist yet, use default features
      const currentFeatures = featuresError ? platformFeatures : featuresData;

      setTenants(tenantsData || []);
      setFeatures(currentFeatures || platformFeatures);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Fallback to default features
      setFeatures(platformFeatures);
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalDeploy = async (featureId) => {
    if (!window.confirm(`Deploy this feature update to all ${tenants.length} active tenants?`)) {
      return;
    }

    setDeploying(true);
    setDeploymentStatus({ status: 'deploying', message: 'Initiating global deployment...', progress: 0 });

    try {
      const feature = features.find(f => f.id === featureId);

      // Simulate deployment process (in production, this would update tenant configurations)
      for (let i = 0; i < tenants.length; i++) {
        const tenant = tenants[i];

        setDeploymentStatus({
          status: 'deploying',
          message: `Deploying to ${tenant.name}...`,
          progress: Math.round(((i + 1) / tenants.length) * 100)
        });

        // Log deployment to database
        await supabase
          .from('platform_feature_deployments')
          .insert({
            feature_id: featureId,
            feature_name: feature.name,
            feature_version: feature.version,
            tenant_id: tenant.id,
            tenant_name: tenant.name,
            deployed_by: 'fredymanu76@gmail.com',
            deployment_status: 'success',
            deployed_at: new Date().toISOString()
          });

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setDeploymentStatus({
        status: 'success',
        message: `Successfully deployed "${feature.name}" to ${tenants.length} tenants!`,
        progress: 100
      });

      // Clear status after 5 seconds
      setTimeout(() => {
        setDeploymentStatus(null);
      }, 5000);

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
        .update({ status: enabled ? 'active' : 'inactive', updated_at: new Date().toISOString() })
        .eq('id', featureId);

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
          {selectedFeature.id === 'strategic-scoring' && (
            <StrategicDashboard supabase={supabase} />
          )}
          {selectedFeature.id !== 'strategic-scoring' && (
            <div className="preview-placeholder">
              <AlertCircle size={48} />
              <p>Preview not available for this feature</p>
              <small>This feature is deployed to tenant environments</small>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="platform-feature-control">
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

      {deploymentStatus && (
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
            const Icon = feature.icon;
            const isActive = feature.status === 'active';

            return (
              <div key={feature.id} className={`feature-card ${isActive ? 'active' : 'inactive'}`}>
                <div className="feature-header">
                  <div className="feature-icon">
                    <Icon size={24} />
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
                  <div className="meta-item">
                    <strong>Last Deployed:</strong> {new Date(feature.deployedAt).toLocaleDateString()}
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
                    onClick={() => handleGlobalDeploy(feature.id)}
                    disabled={deploying || !isActive}
                  >
                    <Upload size={16} />
                    {deploying ? 'Deploying...' : `Deploy to ${tenants.length} Tenants`}
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
          {tenants.slice(0, 6).map(tenant => (
            <div key={tenant.id} className="tenant-card">
              <div className="tenant-header">
                <h4>{tenant.name}</h4>
                <span className="regime-badge">{tenant.regime}</span>
              </div>
              <div className="tenant-features">
                <CheckCircle size={16} className="success" />
                <span>{features.filter(f => f.status === 'active').length} features active</span>
              </div>
            </div>
          ))}
        </div>
        {tenants.length > 6 && (
          <p className="tenant-more">+ {tenants.length - 6} more tenants</p>
        )}
      </div>

      <div className="control-footer">
        <div className="footer-info">
          <AlertCircle size={16} />
          <p>
            <strong>Platform Owner Mode:</strong> You can manage all features from this control panel.
            Changes will not affect tenant data. Use "Deploy" to push updates globally.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlatformFeatureControl;
