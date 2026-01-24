-- ============================================================================
-- EXPORT COMPLIANCE DATA - Run this in OLD RegIntels Instance
-- ============================================================================
-- Purpose: Export all data from RegIntels tables for migration
-- Instructions:
--   1. Run this in your OLD Supabase instance SQL Editor
--   2. Copy each JSON result and save to separate files
--   3. Use these files in the import script on NEW instance
-- ============================================================================

-- ============================================================================
-- EXPORT 1: Regulatory Changes
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'title', title,
    'description', description,
    'regulator', regulator,
    'materiality', materiality,
    'published_at', published_at,
    'effective_date', effective_date,
    'status', status,
    'created_at', created_at,
    'updated_at', updated_at
  )
) as regulatory_changes_export
FROM public.regulatory_changes;

-- Copy the result above and save as: regulatory_changes_export.json

-- ============================================================================
-- EXPORT 2: Controls
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'control_id', control_id,
    'control_title', control_title,
    'control_owner', control_owner,
    'control_description', control_description,
    'last_reviewed_at', last_reviewed_at,
    'next_review_date', next_review_date,
    'status', status,
    'created_at', created_at,
    'updated_at', updated_at
  )
) as controls_export
FROM public.controls;

-- Copy the result above and save as: controls_export.json

-- ============================================================================
-- EXPORT 3: Regulatory Change Control Map
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'regulatory_change_id', regulatory_change_id,
    'control_id', control_id,
    'impact_level', impact_level,
    'created_at', created_at
  )
) as rccm_export
FROM public.regulatory_change_control_map;

-- Copy the result above and save as: rccm_export.json

-- ============================================================================
-- EXPORT 4: Attestations
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'control_id', control_id,
    'change_id', change_id,
    'attestor_id', attestor_id,
    'attestor_role', attestor_role,
    'status', status,
    'due_date', due_date,
    'submitted_at', submitted_at,
    'notes', notes,
    'created_at', created_at,
    'updated_at', updated_at
  )
) as attestations_export
FROM public.attestations;

-- Copy the result above and save as: attestations_export.json

-- ============================================================================
-- EXPORT 5: Exceptions
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'control_id', control_id,
    'title', title,
    'description', description,
    'status', status,
    'severity', severity,
    'expiry_date', expiry_date,
    'created_at', created_at,
    'updated_at', updated_at,
    'closed_at', closed_at
  )
) as exceptions_export
FROM public.exceptions;

-- Copy the result above and save as: exceptions_export.json

-- ============================================================================
-- EXPORT 6: Change Signoffs
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'change_id', change_id,
    'signoff_by', signoff_by,
    'signoff_role', signoff_role,
    'signoff_status', signoff_status,
    'signed_at', signed_at,
    'notes', notes,
    'created_at', created_at
  )
) as change_signoffs_export
FROM public.change_signoffs;

-- Copy the result above and save as: change_signoffs_export.json

-- ============================================================================
-- EXPORT 7: Actions
-- ============================================================================
SELECT json_agg(
  json_build_object(
    'id', id,
    'change_id', change_id,
    'control_id', control_id,
    'title', title,
    'description', description,
    'assigned_to', assigned_to,
    'status', status,
    'due_date', due_date,
    'completed_at', completed_at,
    'created_at', created_at,
    'updated_at', updated_at
  )
) as actions_export
FROM public.actions;

-- Copy the result above and save as: actions_export.json

-- ============================================================================
-- EXPORT SUMMARY
-- ============================================================================
SELECT
  'Regulatory Changes' as table_name,
  COUNT(*) as record_count
FROM public.regulatory_changes
UNION ALL
SELECT
  'Controls' as table_name,
  COUNT(*) as record_count
FROM public.controls
UNION ALL
SELECT
  'Regulatory Change Control Map' as table_name,
  COUNT(*) as record_count
FROM public.regulatory_change_control_map
UNION ALL
SELECT
  'Attestations' as table_name,
  COUNT(*) as record_count
FROM public.attestations
UNION ALL
SELECT
  'Exceptions' as table_name,
  COUNT(*) as record_count
FROM public.exceptions
UNION ALL
SELECT
  'Change Signoffs' as table_name,
  COUNT(*) as record_count
FROM public.change_signoffs
UNION ALL
SELECT
  'Actions' as table_name,
  COUNT(*) as record_count
FROM public.actions;

-- ============================================================================
-- INSTRUCTIONS FOR NEXT STEPS
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ EXPORT QUERIES COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 What to do with the results:';
  RAISE NOTICE '  1. Copy each JSON result (from each SELECT above)';
  RAISE NOTICE '  2. Save them to separate .json files:';
  RAISE NOTICE '     - regulatory_changes_export.json';
  RAISE NOTICE '     - controls_export.json';
  RAISE NOTICE '     - rccm_export.json';
  RAISE NOTICE '     - attestations_export.json';
  RAISE NOTICE '     - exceptions_export.json';
  RAISE NOTICE '     - change_signoffs_export.json';
  RAISE NOTICE '     - actions_export.json';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next Steps:';
  RAISE NOTICE '  1. Take the JSON files to your NEW instance';
  RAISE NOTICE '  2. Run import_compliance_data.sql with the JSON data';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Export ready for migration!';
END $$;
