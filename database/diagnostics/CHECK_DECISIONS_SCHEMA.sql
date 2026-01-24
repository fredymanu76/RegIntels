-- Check the actual columns in the decisions table
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'decisions'
ORDER BY ordinal_position;

-- Also check if the table exists and has any data
SELECT COUNT(*) as row_count FROM decisions;
