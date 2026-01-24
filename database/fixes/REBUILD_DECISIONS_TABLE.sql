-- ============================================================================
-- REBUILD DECISIONS TABLE - Complete fix
-- ============================================================================

-- Step 1: Drop the existing broken decisions table
DROP TABLE IF EXISTS public.decisions CASCADE;

-- Step 2: Create decisions table with correct schema
CREATE TABLE public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    decision_maker TEXT,
    decision_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Enable RLS
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy
DROP POLICY IF EXISTS "Allow all authenticated" ON public.decisions;
CREATE POLICY "Allow all authenticated" ON public.decisions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Step 5: Insert sample data
INSERT INTO public.decisions (title, category, status, decision_maker, decision_date) VALUES
('Adopt ISO 27001', 'Security', 'approved', 'CISO', NOW() - INTERVAL '30 days'),
('Update Data Policy', 'Data Governance', 'pending', 'DPO', NULL),
('Implement MFA', 'Security', 'approved', 'CISO', NOW() - INTERVAL '90 days'),
('Risk Assessment Framework', 'Risk Management', 'approved', 'CRO', NOW() - INTERVAL '60 days'),
('Third Party Due Diligence', 'Compliance', 'pending', 'Compliance Manager', NULL),
('Incident Response Plan', 'Security', 'approved', 'CISO', NOW() - INTERVAL '45 days');

-- Step 6: Verify the table
SELECT
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count
FROM public.decisions;

-- Step 7: Show sample data
SELECT id, title, category, status, decision_maker, decision_date, created_at
FROM public.decisions
ORDER BY created_at DESC;
