-- Check actual columns in controls table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'controls'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample data
SELECT * FROM public.controls LIMIT 3;
