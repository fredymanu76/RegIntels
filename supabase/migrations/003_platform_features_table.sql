-- ============================================================================
-- PLATFORM FEATURES TABLE - Feature Flag System
-- ============================================================================
-- This allows Platform Owner to control which features are visible to tenants
-- New features start as "pending" and must be deployed by Platform Owner
-- ============================================================================

-- Create platform_features table
CREATE TABLE IF NOT EXISTS public.platform_features (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  component TEXT NOT NULL,
  version TEXT NOT NULL,
  solution TEXT NOT NULL,
  page TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'active', 'inactive')) DEFAULT 'pending',
  deployed_at TIMESTAMP WITH TIME ZONE,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_platform_features_status ON public.platform_features(status);
CREATE INDEX IF NOT EXISTS idx_platform_features_solution ON public.platform_features(solution);

-- Enable RLS
ALTER TABLE public.platform_features ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything
DROP POLICY IF EXISTS "Platform admins full access" ON public.platform_features;
CREATE POLICY "Platform admins full access"
  ON public.platform_features
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- Tenants can only see active features
DROP POLICY IF EXISTS "Tenants see active features" ON public.platform_features;
CREATE POLICY "Tenants see active features"
  ON public.platform_features
  FOR SELECT
  USING (status = 'active');

-- ============================================================================
-- Insert existing features as ACTIVE (already deployed)
-- ============================================================================

INSERT INTO public.platform_features (id, name, description, component, version, solution, page, status, deployed_at, category) VALUES
('strategic-scoring', 'Strategic Scoring Dashboard', 'Impact scoring, control drift detection, and attestation confidence tracking', 'StrategicDashboard', '1.0.0', 'Solution 5', 'Strategic Scoring', 'active', NOW(), 'Analytics'),
('change-register', 'Change Register', 'Track and manage regulatory changes', 'ChangeRegister', '1.0.0', 'Solution 1', 'Change Register', 'active', NOW(), 'Compliance'),
('control-library', 'Control Library', 'Manage compliance controls and attestations', 'ControlLibrary', '1.0.0', 'Solution 2', 'Control Library', 'active', NOW(), 'Controls')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Insert Solution 4 - Risk Signal Hub as PENDING (awaiting Platform Owner approval)
-- ============================================================================

INSERT INTO public.platform_features (
  id,
  name,
  description,
  component,
  version,
  solution,
  page,
  status,
  deployed_at,
  category
) VALUES (
  'risk-signal-hub',
  'Risk Signal Hub',
  'Operational Risk Signal Hub - Exception Management Intelligence with materiality scoring (0-100), risk acceleration timeline, and recurrence pattern detection',
  'Solution4Dashboard',
  '1.0.0',
  'Solution 4',
  'Risk Signal Hub',
  'pending',
  NULL,
  'Risk Intelligence'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Verification Query
-- ============================================================================

SELECT
  id,
  name,
  solution,
  page,
  status,
  deployed_at,
  category
FROM public.platform_features
ORDER BY
  CASE status
    WHEN 'pending' THEN 1
    WHEN 'active' THEN 2
    WHEN 'inactive' THEN 3
  END,
  solution;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ PLATFORM FEATURES TABLE CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - 3 existing features marked as ACTIVE';
  RAISE NOTICE '  - 1 new feature (Risk Signal Hub) as PENDING';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Go to Platform Admin > Feature Control';
  RAISE NOTICE '  2. See "Risk Signal Hub" with status PENDING';
  RAISE NOTICE '  3. Click "Deploy to 12 Tenants" to activate';
  RAISE NOTICE '  4. Feature will then appear in tenant dashboards';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Platform Owner now controls feature rollouts!';
END $$;
