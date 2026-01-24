-- Check regulatory_changes table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'regulatory_changes'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Sample data
SELECT * FROM regulatory_changes LIMIT 3;
