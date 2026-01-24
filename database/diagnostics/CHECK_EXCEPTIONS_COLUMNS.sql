-- Check what columns exist in exceptions table
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'exceptions'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there's data
SELECT COUNT(*) as row_count FROM public.exceptions;

-- Show first row if exists
SELECT * FROM public.exceptions LIMIT 1;
