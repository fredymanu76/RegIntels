-- ============================================================================
-- TENANT FEATURE ACCESS TABLE - Per-Tenant Feature Control
-- ============================================================================
-- This table tracks which features each tenant has access to.
-- Platform Owner grants/revokes access via the Deployment Cockpit.
-- ============================================================================

-- Create tenant_feature_access table
CREATE TABLE IF NOT EXISTS public.tenant_feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  feature_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  has_access BOOLEAN DEFAULT false,
  granted_by TEXT,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, feature_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tenant_feature_access_tenant ON public.tenant_feature_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_access_feature ON public.tenant_feature_access(feature_id);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_access_has_access ON public.tenant_feature_access(has_access);
CREATE INDEX IF NOT EXISTS idx_tenant_feature_access_composite ON public.tenant_feature_access(tenant_id, feature_id, has_access);

-- Enable RLS
ALTER TABLE public.tenant_feature_access ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for tenant_feature_access" ON public.tenant_feature_access;
DROP POLICY IF EXISTS "Public insert access for tenant_feature_access" ON public.tenant_feature_access;
DROP POLICY IF EXISTS "Public update access for tenant_feature_access" ON public.tenant_feature_access;

-- Allow public access for now (in production, restrict to authenticated users)
CREATE POLICY "Public read access for tenant_feature_access"
  ON public.tenant_feature_access
  FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for tenant_feature_access"
  ON public.tenant_feature_access
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access for tenant_feature_access"
  ON public.tenant_feature_access
  FOR UPDATE
  USING (true);

-- ============================================================================
-- PLATFORM FEATURE DEPLOYMENTS TABLE - Deployment Audit Trail
-- ============================================================================
-- This table logs all deployment actions for audit purposes.
-- ============================================================================

-- Create platform_feature_deployments table
CREATE TABLE IF NOT EXISTS public.platform_feature_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_version TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  tenant_name TEXT,
  deployed_by TEXT NOT NULL,
  deployment_status TEXT CHECK (deployment_status IN ('pending', 'success', 'failed', 'revoked')) DEFAULT 'pending',
  deployment_notes TEXT,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_platform_feature_deployments_feature ON public.platform_feature_deployments(feature_id);
CREATE INDEX IF NOT EXISTS idx_platform_feature_deployments_tenant ON public.platform_feature_deployments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_platform_feature_deployments_status ON public.platform_feature_deployments(deployment_status);
CREATE INDEX IF NOT EXISTS idx_platform_feature_deployments_date ON public.platform_feature_deployments(deployed_at DESC);

-- Enable RLS
ALTER TABLE public.platform_feature_deployments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for platform_feature_deployments" ON public.platform_feature_deployments;
DROP POLICY IF EXISTS "Public insert access for platform_feature_deployments" ON public.platform_feature_deployments;

-- Allow public access for now
CREATE POLICY "Public read access for platform_feature_deployments"
  ON public.platform_feature_deployments
  FOR SELECT
  USING (true);

CREATE POLICY "Public insert access for platform_feature_deployments"
  ON public.platform_feature_deployments
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- VIEW: Tenant Feature Access Summary
-- ============================================================================
-- Provides a quick summary of feature access per tenant
-- ============================================================================

DROP VIEW IF EXISTS v_tenant_feature_summary;
CREATE VIEW v_tenant_feature_summary AS
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.regime,
  COUNT(CASE WHEN tfa.has_access = true THEN 1 END) as features_enabled,
  COUNT(tfa.id) as total_features_configured,
  ARRAY_AGG(DISTINCT tfa.feature_name) FILTER (WHERE tfa.has_access = true) as enabled_features
FROM public.tenants t
LEFT JOIN public.tenant_feature_access tfa ON t.id = tfa.tenant_id
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.regime;

-- ============================================================================
-- VIEW: Feature Deployment Status
-- ============================================================================
-- Shows deployment status across all tenants for each feature
-- ============================================================================

DROP VIEW IF EXISTS v_feature_deployment_status;
CREATE VIEW v_feature_deployment_status AS
SELECT
  pf.id as feature_id,
  pf.name as feature_name,
  pf.solution,
  pf.status as feature_status,
  COUNT(DISTINCT CASE WHEN tfa.has_access = true THEN tfa.tenant_id END) as tenants_with_access,
  COUNT(DISTINCT t.id) as total_active_tenants,
  ROUND(
    (COUNT(DISTINCT CASE WHEN tfa.has_access = true THEN tfa.tenant_id END)::numeric /
     NULLIF(COUNT(DISTINCT t.id), 0) * 100),
    0
  ) as deployment_percentage
FROM public.platform_features pf
CROSS JOIN public.tenants t
LEFT JOIN public.tenant_feature_access tfa
  ON tfa.feature_id = pf.id AND tfa.tenant_id = t.id
WHERE t.status = 'active'
GROUP BY pf.id, pf.name, pf.solution, pf.status;

-- ============================================================================
-- Verification Queries
-- ============================================================================

SELECT 'tenant_feature_access table created' as status, COUNT(*) as row_count FROM public.tenant_feature_access;
SELECT 'platform_feature_deployments table created' as status, COUNT(*) as row_count FROM public.platform_feature_deployments;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ TENANT FEATURE ACCESS TABLES CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '  - tenant_feature_access: Per-tenant feature grants';
  RAISE NOTICE '  - platform_feature_deployments: Deployment audit trail';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Views Created:';
  RAISE NOTICE '  - v_tenant_feature_summary: Features per tenant';
  RAISE NOTICE '  - v_feature_deployment_status: Deployment coverage';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Usage:';
  RAISE NOTICE '  1. Platform Owner opens Deployment Cockpit';
  RAISE NOTICE '  2. Selects specific tenants for feature access';
  RAISE NOTICE '  3. Access is recorded in tenant_feature_access';
  RAISE NOTICE '  4. Audit trail saved in platform_feature_deployments';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Platform Owner can now manage per-tenant feature access!';
END $$;
