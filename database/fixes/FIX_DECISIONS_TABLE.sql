-- Check what columns exist in decisions table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'decisions'
ORDER BY ordinal_position;

-- If decision_date is missing, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'decisions'
        AND column_name = 'decision_date'
    ) THEN
        ALTER TABLE public.decisions ADD COLUMN decision_date TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added decision_date column';
    ELSE
        RAISE NOTICE 'decision_date column already exists';
    END IF;
END $$;

-- Update existing records to have decision_date for approved ones
UPDATE public.decisions
SET decision_date = created_at
WHERE status = 'approved' AND decision_date IS NULL;

-- Verify the fix
SELECT id, title, status, decision_date, created_at FROM public.decisions;
