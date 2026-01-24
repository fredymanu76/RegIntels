-- ============================================================================
-- IMPORT COMPLIANCE DATA - Run this in NEW Instance
-- ============================================================================
-- Purpose: Import data from OLD RegIntels instance into compliance_* tables
-- Prerequisites:
--   1. unified_migration_compliance.sql must be run first (creates tables)
--   2. You must have JSON exports from export_compliance_data.sql
-- Instructions:
--   1. Replace the '[PASTE_JSON_HERE]' placeholders with actual JSON data
--   2. Run this in your NEW Supabase instance SQL Editor
-- ============================================================================

-- ============================================================================
-- IMPORT 1: Regulatory Changes
-- ============================================================================
-- Replace '[PASTE_REGULATORY_CHANGES_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_regulatory_changes (
  id,
  title,
  description,
  regulator,
  materiality,
  published_at,
  effective_date,
  status,
  created_at,
  updated_at
)
SELECT
  (value->>'id')::UUID,
  value->>'title',
  value->>'description',
  value->>'regulator',
  value->>'materiality',
  (value->>'published_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'effective_date')::DATE,
  value->>'status',
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'updated_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_REGULATORY_CHANGES_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_regulatory_changes FROM public.compliance_regulatory_changes;

-- ============================================================================
-- IMPORT 2: Controls
-- ============================================================================
-- Replace '[PASTE_CONTROLS_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_controls (
  id,
  control_id,
  control_title,
  control_owner,
  control_description,
  last_reviewed_at,
  next_review_date,
  status,
  created_at,
  updated_at
)
SELECT
  (value->>'id')::UUID,
  value->>'control_id',
  value->>'control_title',
  value->>'control_owner',
  value->>'control_description',
  (value->>'last_reviewed_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'next_review_date')::DATE,
  value->>'status',
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'updated_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_CONTROLS_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_controls FROM public.compliance_controls;

-- ============================================================================
-- IMPORT 3: Regulatory Change Control Map
-- ============================================================================
-- Replace '[PASTE_RCCM_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_regulatory_change_control_map (
  id,
  regulatory_change_id,
  control_id,
  impact_level,
  created_at
)
SELECT
  (value->>'id')::UUID,
  (value->>'regulatory_change_id')::UUID,
  (value->>'control_id')::UUID,
  value->>'impact_level',
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_RCCM_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_rccm FROM public.compliance_regulatory_change_control_map;

-- ============================================================================
-- IMPORT 4: Attestations
-- ============================================================================
-- Replace '[PASTE_ATTESTATIONS_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_attestations (
  id,
  control_id,
  change_id,
  attestor_id,
  attestor_role,
  status,
  due_date,
  submitted_at,
  notes,
  created_at,
  updated_at
)
SELECT
  (value->>'id')::UUID,
  (value->>'control_id')::UUID,
  CASE
    WHEN value->>'change_id' IS NOT NULL AND value->>'change_id' != 'null'
    THEN (value->>'change_id')::UUID
    ELSE NULL
  END,
  CASE
    WHEN value->>'attestor_id' IS NOT NULL AND value->>'attestor_id' != 'null'
    THEN (value->>'attestor_id')::UUID
    ELSE NULL
  END,
  value->>'attestor_role',
  value->>'status',
  (value->>'due_date')::DATE,
  CASE
    WHEN value->>'submitted_at' IS NOT NULL AND value->>'submitted_at' != 'null'
    THEN (value->>'submitted_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END,
  value->>'notes',
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'updated_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_ATTESTATIONS_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_attestations FROM public.compliance_attestations;

-- ============================================================================
-- IMPORT 5: Exceptions
-- ============================================================================
-- Replace '[PASTE_EXCEPTIONS_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_exceptions (
  id,
  control_id,
  title,
  description,
  status,
  severity,
  expiry_date,
  created_at,
  updated_at,
  closed_at
)
SELECT
  (value->>'id')::UUID,
  (value->>'control_id')::UUID,
  value->>'title',
  value->>'description',
  value->>'status',
  value->>'severity',
  CASE
    WHEN value->>'expiry_date' IS NOT NULL AND value->>'expiry_date' != 'null'
    THEN (value->>'expiry_date')::DATE
    ELSE NULL
  END,
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'updated_at')::TIMESTAMP WITH TIME ZONE,
  CASE
    WHEN value->>'closed_at' IS NOT NULL AND value->>'closed_at' != 'null'
    THEN (value->>'closed_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END
FROM json_array_elements('[PASTE_EXCEPTIONS_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_exceptions FROM public.compliance_exceptions;

-- ============================================================================
-- IMPORT 6: Change Signoffs
-- ============================================================================
-- Replace '[PASTE_CHANGE_SIGNOFFS_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_change_signoffs (
  id,
  change_id,
  signoff_by,
  signoff_role,
  signoff_status,
  signed_at,
  notes,
  created_at
)
SELECT
  (value->>'id')::UUID,
  (value->>'change_id')::UUID,
  CASE
    WHEN value->>'signoff_by' IS NOT NULL AND value->>'signoff_by' != 'null'
    THEN (value->>'signoff_by')::UUID
    ELSE NULL
  END,
  value->>'signoff_role',
  value->>'signoff_status',
  CASE
    WHEN value->>'signed_at' IS NOT NULL AND value->>'signed_at' != 'null'
    THEN (value->>'signed_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END,
  value->>'notes',
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_CHANGE_SIGNOFFS_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_change_signoffs FROM public.compliance_change_signoffs;

-- ============================================================================
-- IMPORT 7: Actions
-- ============================================================================
-- Replace '[PASTE_ACTIONS_JSON_HERE]' with your actual JSON export

INSERT INTO public.compliance_actions (
  id,
  change_id,
  control_id,
  title,
  description,
  assigned_to,
  status,
  due_date,
  completed_at,
  created_at,
  updated_at
)
SELECT
  (value->>'id')::UUID,
  (value->>'change_id')::UUID,
  CASE
    WHEN value->>'control_id' IS NOT NULL AND value->>'control_id' != 'null'
    THEN (value->>'control_id')::UUID
    ELSE NULL
  END,
  value->>'title',
  value->>'description',
  CASE
    WHEN value->>'assigned_to' IS NOT NULL AND value->>'assigned_to' != 'null'
    THEN (value->>'assigned_to')::UUID
    ELSE NULL
  END,
  value->>'status',
  CASE
    WHEN value->>'due_date' IS NOT NULL AND value->>'due_date' != 'null'
    THEN (value->>'due_date')::DATE
    ELSE NULL
  END,
  CASE
    WHEN value->>'completed_at' IS NOT NULL AND value->>'completed_at' != 'null'
    THEN (value->>'completed_at')::TIMESTAMP WITH TIME ZONE
    ELSE NULL
  END,
  (value->>'created_at')::TIMESTAMP WITH TIME ZONE,
  (value->>'updated_at')::TIMESTAMP WITH TIME ZONE
FROM json_array_elements('[PASTE_ACTIONS_JSON_HERE]'::json);

-- Verify import
SELECT COUNT(*) as imported_actions FROM public.compliance_actions;

-- ============================================================================
-- IMPORT VERIFICATION & SUMMARY
-- ============================================================================

SELECT
  'compliance_regulatory_changes' as table_name,
  COUNT(*) as record_count
FROM public.compliance_regulatory_changes
UNION ALL
SELECT
  'compliance_controls' as table_name,
  COUNT(*) as record_count
FROM public.compliance_controls
UNION ALL
SELECT
  'compliance_regulatory_change_control_map' as table_name,
  COUNT(*) as record_count
FROM public.compliance_regulatory_change_control_map
UNION ALL
SELECT
  'compliance_attestations' as table_name,
  COUNT(*) as record_count
FROM public.compliance_attestations
UNION ALL
SELECT
  'compliance_exceptions' as table_name,
  COUNT(*) as record_count
FROM public.compliance_exceptions
UNION ALL
SELECT
  'compliance_change_signoffs' as table_name,
  COUNT(*) as record_count
FROM public.compliance_change_signoffs
UNION ALL
SELECT
  'compliance_actions' as table_name,
  COUNT(*) as record_count
FROM public.compliance_actions;

-- ============================================================================
-- TEST VIEWS
-- ============================================================================

-- Test Impact Score View
SELECT
  change_title,
  total_impact_score,
  risk_band,
  primary_driver
FROM public.compliance_v_regulatory_impact_score
LIMIT 5;

-- Test Control Drift View
SELECT
  control_code,
  control_title,
  drift_status,
  drift_score,
  drift_driver
FROM public.compliance_v_control_drift_index
LIMIT 5;

-- Test Attestation Confidence View
SELECT
  control_code,
  attestor_role,
  confidence_score,
  confidence_band,
  confidence_driver
FROM public.compliance_v_attestation_confidence_index
LIMIT 5;

-- ============================================================================
-- IMPORT COMPLETE MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ COMPLIANCE DATA IMPORT COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Imported Tables:';
  RAISE NOTICE '  1. compliance_regulatory_changes';
  RAISE NOTICE '  2. compliance_controls';
  RAISE NOTICE '  3. compliance_regulatory_change_control_map';
  RAISE NOTICE '  4. compliance_attestations';
  RAISE NOTICE '  5. compliance_exceptions';
  RAISE NOTICE '  6. compliance_change_signoffs';
  RAISE NOTICE '  7. compliance_actions';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Views Available:';
  RAISE NOTICE '  1. compliance_v_change_action_tracker';
  RAISE NOTICE '  2. compliance_v_regulatory_impact_score';
  RAISE NOTICE '  3. compliance_v_control_drift_index';
  RAISE NOTICE '  4. compliance_v_control_drift_summary';
  RAISE NOTICE '  5. compliance_v_attestation_confidence_index';
  RAISE NOTICE '  6. compliance_v_attestation_confidence_summary';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Verify record counts match OLD instance';
  RAISE NOTICE '  2. Test views with sample queries';
  RAISE NOTICE '  3. Update your application connection strings';
  RAISE NOTICE '  4. Configure RLS policies for your security needs';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration complete - Your data is now in the NEW instance!';
END $$;
