-- Simple schema check - just show all columns
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exceptions'
ORDER BY ordinal_position;
