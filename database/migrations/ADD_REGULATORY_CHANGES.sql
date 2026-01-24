-- ============================================================================
-- ADD REGULATORY CHANGES - Safe Version
-- ============================================================================
-- Step 1: Check if regulatory_change_control_map table exists first
-- Step 2: Add regulations only if table structure is compatible
-- ============================================================================

-- First, get tenant_id from controls
DO $$
DECLARE
  v_tenant_id UUID;
  v_table_exists BOOLEAN;
  v_has_impact_level BOOLEAN;
BEGIN
  -- Get tenant_id
  SELECT tenant_id INTO v_tenant_id FROM controls LIMIT 1;

  -- Check if regulatory_change_control_map exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'regulatory_change_control_map'
    AND table_schema = 'public'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    RAISE NOTICE '⚠️  regulatory_change_control_map table does not exist';
    RAISE NOTICE 'Skipping regulatory change linkage';
    RETURN;
  END IF;

  -- Check if impact_level column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'regulatory_change_control_map'
    AND column_name = 'impact_level'
    AND table_schema = 'public'
  ) INTO v_has_impact_level;

  -- Insert regulatory changes
  INSERT INTO regulatory_changes (
    tenant_id,
    title,
    source,
    source_url,
    effective_date,
    status,
    materiality,
    impact_summary
  ) VALUES
  (
    v_tenant_id,
    'Enhanced Customer Due Diligence Requirements',
    'FCA',
    'https://www.fca.org.uk/publications/policy-statements/ps-enhanced-cdd',
    CURRENT_DATE + INTERVAL '90 days',
    'open',
    'high',
    'FCA requires enhanced CDD procedures for high-risk customers including additional identity verification and ongoing monitoring'
  ),
  (
    v_tenant_id,
    'GDPR Data Subject Access Request Updates',
    'ICO',
    'https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/individual-rights/right-of-access/',
    CURRENT_DATE + INTERVAL '60 days',
    'open',
    'medium',
    'ICO updated guidance on DSAR response timelines and acceptable evidence'
  ),
  (
    v_tenant_id,
    'Consumer Duty Implementation',
    'FCA',
    'https://www.fca.org.uk/firms/consumer-duty',
    CURRENT_DATE + INTERVAL '30 days',
    'open',
    'high',
    'FCA Consumer Duty requirements for fair treatment and good customer outcomes'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Added 3 regulatory changes';

  -- Link regulatory changes to controls
  IF v_has_impact_level THEN
    -- Link with impact_level
    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
    SELECT rc.id, c.id, 'high'
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'Enhanced Customer Due Diligence Requirements'
      AND c.control_code = 'AML-001'
    ON CONFLICT DO NOTHING;

    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
    SELECT rc.id, c.id, 'medium'
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'GDPR Data Subject Access Request Updates'
      AND c.control_code = 'DATA-001'
    ON CONFLICT DO NOTHING;

    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id, impact_level)
    SELECT rc.id, c.id, 'high'
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'Consumer Duty Implementation'
      AND c.control_code = 'COI-001'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Linked regulations to controls (with impact_level)';
  ELSE
    -- Link without impact_level
    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id)
    SELECT rc.id, c.id
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'Enhanced Customer Due Diligence Requirements'
      AND c.control_code = 'AML-001'
    ON CONFLICT DO NOTHING;

    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id)
    SELECT rc.id, c.id
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'GDPR Data Subject Access Request Updates'
      AND c.control_code = 'DATA-001'
    ON CONFLICT DO NOTHING;

    INSERT INTO regulatory_change_control_map (regulatory_change_id, control_id)
    SELECT rc.id, c.id
    FROM regulatory_changes rc
    CROSS JOIN controls c
    WHERE rc.title = 'Consumer Duty Implementation'
      AND c.control_code = 'COI-001'
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Linked regulations to controls (without impact_level)';
  END IF;

END $$;

-- Verify the additions
SELECT
  'Added Regulatory Changes' as verification,
  rc.title,
  rc.source,
  rc.materiality,
  COUNT(rccm.id) as linked_controls
FROM regulatory_changes rc
LEFT JOIN regulatory_change_control_map rccm ON rccm.regulatory_change_id = rc.id
WHERE rc.title IN (
  'Enhanced Customer Due Diligence Requirements',
  'GDPR Data Subject Access Request Updates',
  'Consumer Duty Implementation'
)
GROUP BY rc.id, rc.title, rc.source, rc.materiality
ORDER BY rc.materiality DESC;

-- Check updated materiality scores
SELECT
  'Updated Materiality Scores' as verification,
  exception_title,
  control_name,
  regulatory_impact_score,
  total_materiality_score,
  materiality_band
FROM v_exception_materiality
ORDER BY total_materiality_score DESC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ REGULATORY CHANGES ADDED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expected Results:';
  RAISE NOTICE '- 3 new regulatory changes added';
  RAISE NOTICE '- Linked to AML-001, DATA-001, COI-001';
  RAISE NOTICE '- Materiality scores should increase to 50+';
  RAISE NOTICE '- Check verification queries above';
END $$;
