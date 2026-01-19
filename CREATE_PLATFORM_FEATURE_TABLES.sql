-- ============================================================================
-- PLATFORM FEATURE CONTROL SYSTEM
-- ============================================================================
-- Creates tables to manage platform features and track global deployments
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- Table 1: Platform Features Registry
-- ============================================================================
-- Stores all available platform features and their configurations
CREATE TABLE IF NOT EXISTS public.platform_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  solution TEXT NOT NULL,  -- Which solution/section it belongs to
  page TEXT NOT NULL,      -- Page name within the solution
  category TEXT,           -- e.g., 'Analytics', 'Compliance', 'Controls'
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
  icon TEXT,               -- Icon name (optional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,         -- Email of platform owner who created it
  deployed_at TIMESTAMPTZ  -- Last global deployment timestamp
);

-- Add comment
COMMENT ON TABLE public.platform_features IS 'Registry of all platform features available for deployment';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_platform_features_status ON public.platform_features(status);
CREATE INDEX IF NOT EXISTS idx_platform_features_category ON public.platform_features(category);

-- ============================================================================
-- Table 2: Platform Feature Deployments Log
-- ============================================================================
-- Tracks every deployment of features to tenants
CREATE TABLE IF NOT EXISTS public.platform_feature_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL REFERENCES public.platform_features(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  feature_version TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  deployment_status TEXT NOT NULL CHECK (deployment_status IN ('pending', 'success', 'failed', 'rolled_back')),
  deployed_by TEXT NOT NULL,  -- Email of platform owner who initiated deployment
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  error_message TEXT,         -- If deployment failed, store error details
  rollback_reason TEXT        -- If rolled back, store reason
);

-- Add comment
COMMENT ON TABLE public.platform_feature_deployments IS 'Audit log of all feature deployments to tenants';

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_deployments_feature ON public.platform_feature_deployments(feature_id);
CREATE INDEX IF NOT EXISTS idx_deployments_tenant ON public.platform_feature_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.platform_feature_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_deployments_date ON public.platform_feature_deployments(deployed_at DESC);

-- ============================================================================
-- Table 3: Tenant Feature Configuration
-- ============================================================================
-- Stores which features are enabled for each tenant
CREATE TABLE IF NOT EXISTS public.tenant_feature_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL REFERENCES public.platform_features(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL,      -- Version of feature deployed to this tenant
  enabled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,    -- If feature was disabled, when
  configured_by TEXT,         -- Who enabled/disabled it
  notes TEXT,                 -- Optional notes about this tenant's feature config
  UNIQUE(tenant_id, feature_id)
);

-- Add comment
COMMENT ON TABLE public.tenant_feature_config IS 'Tracks which features are enabled for each tenant';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_features_tenant ON public.tenant_feature_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_feature ON public.tenant_feature_config(feature_id);
CREATE INDEX IF NOT EXISTS idx_tenant_features_enabled ON public.tenant_feature_config(enabled);

-- ============================================================================
-- Insert Default Features
-- ============================================================================
-- Populate with existing features in the system

INSERT INTO public.platform_features (id, name, description, component, version, solution, page, category, status, created_by, deployed_at)
VALUES
  (
    'strategic-scoring',
    'Strategic Scoring Dashboard',
    'Impact scoring, control drift detection, and attestation confidence tracking for board-level oversight',
    'StrategicDashboard',
    '1.0.0',
    'Solution 5',
    'Strategic Scoring',
    'Analytics',
    'active',
    'fredymanu76@gmail.com',
    NOW()
  ),
  (
    'change-register',
    'Change Register',
    'Track and manage regulatory changes with comprehensive filtering and status management',
    'ChangeRegister',
    '1.0.0',
    'Solution 1',
    'Change Register',
    'Compliance',
    'active',
    'fredymanu76@gmail.com',
    NOW()
  ),
  (
    'control-library',
    'Control Library',
    'Manage compliance controls, attestations, and control effectiveness',
    'ControlLibrary',
    '1.0.0',
    'Solution 2',
    'Control Library',
    'Controls',
    'active',
    'fredymanu76@gmail.com',
    NOW()
  ),
  (
    'remediation-tracker',
    'Remediation Tracker',
    'Track remediation actions and exception management',
    'RemediationTracker',
    '1.0.0',
    'Solution 3',
    'Remediation Actions',
    'Compliance',
    'active',
    'fredymanu76@gmail.com',
    NOW()
  ),
  (
    'board-reporting',
    'Board Reporting',
    'Executive-level compliance dashboards and risk posture views',
    'BoardReporting',
    '1.0.0',
    'Solution 5',
    'Management Summary',
    'Analytics',
    'active',
    'fredymanu76@gmail.com',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Enable Features for All Active Tenants
-- ============================================================================
-- Automatically enable all active features for all active tenants

INSERT INTO public.tenant_feature_config (tenant_id, feature_id, enabled, version, configured_by)
SELECT
  t.id as tenant_id,
  pf.id as feature_id,
  true as enabled,
  pf.version,
  'system' as configured_by
FROM public.tenants t
CROSS JOIN public.platform_features pf
WHERE t.status = 'active'
  AND pf.status = 'active'
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

-- ============================================================================
-- Create View: Feature Deployment Summary
-- ============================================================================
-- Shows deployment statistics for each feature

CREATE OR REPLACE VIEW v_feature_deployment_summary AS
SELECT
  pf.id as feature_id,
  pf.name as feature_name,
  pf.version,
  pf.category,
  pf.status,
  COUNT(DISTINCT tfc.tenant_id) FILTER (WHERE tfc.enabled = true) as tenants_enabled,
  COUNT(DISTINCT t.id) as total_active_tenants,
  ROUND(
    (COUNT(DISTINCT tfc.tenant_id) FILTER (WHERE tfc.enabled = true)::DECIMAL /
     NULLIF(COUNT(DISTINCT t.id), 0)) * 100,
    2
  ) as deployment_percentage,
  MAX(pfd.deployed_at) as last_deployment_date,
  COUNT(pfd.id) FILTER (WHERE pfd.deployment_status = 'success') as successful_deployments,
  COUNT(pfd.id) FILTER (WHERE pfd.deployment_status = 'failed') as failed_deployments
FROM public.platform_features pf
CROSS JOIN (SELECT id FROM public.tenants WHERE status = 'active') t
LEFT JOIN public.tenant_feature_config tfc
  ON tfc.feature_id = pf.id AND tfc.tenant_id = t.id
LEFT JOIN public.platform_feature_deployments pfd
  ON pfd.feature_id = pf.id
GROUP BY pf.id, pf.name, pf.version, pf.category, pf.status
ORDER BY pf.name;

COMMENT ON VIEW v_feature_deployment_summary IS 'Summary statistics for feature deployments across all tenants';

-- ============================================================================
-- Create View: Recent Deployments
-- ============================================================================
-- Shows recent deployment activity for audit trail

CREATE OR REPLACE VIEW v_recent_deployments AS
SELECT
  pfd.id,
  pfd.feature_name,
  pfd.feature_version,
  pfd.tenant_name,
  pfd.deployment_status,
  pfd.deployed_by,
  pfd.deployed_at,
  pfd.error_message,
  t.regime as tenant_regime,
  CASE
    WHEN pfd.deployed_at > NOW() - INTERVAL '1 hour' THEN 'Just now'
    WHEN pfd.deployed_at > NOW() - INTERVAL '1 day' THEN 'Today'
    WHEN pfd.deployed_at > NOW() - INTERVAL '7 days' THEN 'This week'
    ELSE 'Earlier'
  END as time_category
FROM public.platform_feature_deployments pfd
JOIN public.tenants t ON t.id = pfd.tenant_id
ORDER BY pfd.deployed_at DESC
LIMIT 100;

COMMENT ON VIEW v_recent_deployments IS 'Recent feature deployment activity across all tenants';

-- ============================================================================
-- Create Function: Deploy Feature to All Tenants
-- ============================================================================
-- Helper function to deploy a feature globally

CREATE OR REPLACE FUNCTION deploy_feature_globally(
  p_feature_id TEXT,
  p_deployed_by TEXT
)
RETURNS TABLE(
  tenant_id UUID,
  tenant_name TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.platform_feature_deployments (
    feature_id,
    feature_name,
    feature_version,
    tenant_id,
    tenant_name,
    deployment_status,
    deployed_by
  )
  SELECT
    p_feature_id,
    pf.name,
    pf.version,
    t.id,
    t.name,
    'success'::TEXT,
    p_deployed_by
  FROM public.tenants t
  CROSS JOIN public.platform_features pf
  WHERE t.status = 'active'
    AND pf.id = p_feature_id
    AND pf.status = 'active'
  RETURNING
    platform_feature_deployments.tenant_id,
    platform_feature_deployments.tenant_name,
    platform_feature_deployments.deployment_status;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION deploy_feature_globally IS 'Deploys a feature to all active tenants and logs the deployment';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Enable RLS on all platform feature tables

ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_feature_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_config ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything
CREATE POLICY "Platform admins full access to features"
  ON public.platform_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.is_platform_owner = true
    )
  );

CREATE POLICY "Platform admins full access to deployments"
  ON public.platform_feature_deployments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.is_platform_owner = true
    )
  );

CREATE POLICY "Platform admins full access to config"
  ON public.tenant_feature_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
        AND user_profiles.is_platform_owner = true
    )
  );

-- Tenant users can view their tenant's feature config (read-only)
CREATE POLICY "Tenant users can view their features"
  ON public.tenant_feature_config
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- View all features
SELECT * FROM public.platform_features ORDER BY name;

-- View deployment summary
SELECT * FROM v_feature_deployment_summary;

-- View tenant feature config
SELECT
  t.name as tenant_name,
  pf.name as feature_name,
  tfc.enabled,
  tfc.version,
  tfc.enabled_at
FROM public.tenant_feature_config tfc
JOIN public.tenants t ON t.id = tfc.tenant_id
JOIN public.platform_features pf ON pf.id = tfc.feature_id
WHERE t.status = 'active'
ORDER BY t.name, pf.name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT
  '✅ Platform Feature Control System Created Successfully!' as message,
  COUNT(DISTINCT pf.id) as total_features,
  COUNT(DISTINCT t.id) as active_tenants,
  COUNT(tfc.id) as feature_configs_created
FROM public.platform_features pf
CROSS JOIN (SELECT id FROM public.tenants WHERE status = 'active') t
LEFT JOIN public.tenant_feature_config tfc ON tfc.tenant_id = t.id;

-- ============================================================================
-- RESULT: Platform Owner can now manage and deploy features globally!
-- ============================================================================
