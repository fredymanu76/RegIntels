-- Direct table inspection
-- Step 1: Check columns using pg_catalog (more reliable than information_schema)
SELECT
    a.attname as column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
    a.attnotnull as not_null,
    pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_value
FROM pg_catalog.pg_attribute a
LEFT JOIN pg_catalog.pg_attrdef d ON (a.attrelid = d.adrelid AND a.attnum = d.adnum)
WHERE a.attrelid = 'public.decisions'::regclass
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY a.attnum;

-- Step 2: Try a simple SELECT to see what happens
SELECT * FROM public.decisions LIMIT 5;

-- Step 3: Count rows
SELECT COUNT(*) as total_rows FROM public.decisions;
