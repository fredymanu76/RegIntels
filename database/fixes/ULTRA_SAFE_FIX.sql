-- ============================================================================
-- ULTRA SAFE FIX - One table at a time with error handling
-- ============================================================================

-- STEP 1: Try to create decisions table
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.decisions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        status TEXT NOT NULL,
        decision_maker TEXT,
        decision_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    RAISE NOTICE 'decisions table created';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'decisions table already exists or error: %', SQLERRM;
END $$;

-- STEP 2: Enable RLS on decisions
DO $$
BEGIN
    ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on decisions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- STEP 3: Create policy on decisions
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all authenticated" ON public.decisions;
    CREATE POLICY "Allow all authenticated" ON public.decisions
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Policy created on decisions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy error: %', SQLERRM;
END $$;

-- STEP 4: Try to create approvals table
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_type TEXT NOT NULL,
        requester_name TEXT,
        approver_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        comments TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        approved_at TIMESTAMP WITH TIME ZONE,
        rejected_at TIMESTAMP WITH TIME ZONE
    );
    RAISE NOTICE 'approvals table created';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'approvals table already exists or error: %', SQLERRM;
END $$;

-- STEP 5: Enable RLS on approvals
DO $$
BEGIN
    ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on approvals';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- STEP 6: Create policy on approvals
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all authenticated" ON public.approvals;
    CREATE POLICY "Allow all authenticated" ON public.approvals
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Policy created on approvals';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy error: %', SQLERRM;
END $$;

-- STEP 7: Try to create audit_logs table
DO $$
BEGIN
    CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        action_type TEXT NOT NULL,
        user_email TEXT,
        entity_type TEXT,
        description TEXT,
        details TEXT
    );
    RAISE NOTICE 'audit_logs table created';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'audit_logs table already exists or error: %', SQLERRM;
END $$;

-- STEP 8: Enable RLS on audit_logs
DO $$
BEGIN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'RLS enabled on audit_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'RLS already enabled or error: %', SQLERRM;
END $$;

-- STEP 9: Create policy on audit_logs
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow all authenticated" ON public.audit_logs;
    CREATE POLICY "Allow all authenticated" ON public.audit_logs
        FOR ALL TO authenticated USING (true) WITH CHECK (true);
    RAISE NOTICE 'Policy created on audit_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Policy error: %', SQLERRM;
END $$;

-- STEP 10: Insert sample data (with error handling)
DO $$
BEGIN
    INSERT INTO public.decisions (title, category, status, decision_maker, decision_date) VALUES
    ('Adopt ISO 27001', 'Security', 'approved', 'CISO', NOW() - INTERVAL '30 days'),
    ('Update Data Policy', 'Data Governance', 'pending', 'DPO', NULL),
    ('Implement MFA', 'Security', 'approved', 'CISO', NOW() - INTERVAL '90 days')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Sample data inserted into decisions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Data insert error: %', SQLERRM;
END $$;

DO $$
BEGIN
    INSERT INTO public.approvals (request_type, requester_name, approver_name, status, priority, approved_at, created_at) VALUES
    ('Policy Change', 'John Smith', 'Board Chair', 'approved', 'high', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
    ('Budget Approval', 'Jane Doe', 'CFO', 'approved', 'critical', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
    ('Risk Exception', 'Security Team', 'Risk Committee', 'pending', 'medium', NULL, NOW() - INTERVAL '2 days')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Sample data inserted into approvals';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Data insert error: %', SQLERRM;
END $$;

DO $$
BEGIN
    INSERT INTO public.audit_logs (created_at, action_type, user_email, entity_type, description) VALUES
    (NOW() - INTERVAL '1 hour', 'login', 'admin@regintels.com', 'user', 'User login successful'),
    (NOW() - INTERVAL '2 hours', 'update', 'compliance@regintels.com', 'control', 'Control status updated'),
    (NOW() - INTERVAL '3 hours', 'create', 'auditor@regintels.com', 'attestation', 'New attestation created')
    ON CONFLICT DO NOTHING;
    RAISE NOTICE 'Sample data inserted into audit_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Data insert error: %', SQLERRM;
END $$;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SCRIPT COMPLETE - Check messages above';
    RAISE NOTICE '============================================';
END $$;
