-- ============================================================================
-- SIMPLE FIX - Create Only the 3 Missing Tables
-- ============================================================================
-- This creates ONLY the missing tables without touching existing schema
-- Run this FIRST, then we'll handle column additions separately
-- ============================================================================

-- 1. DECISIONS TABLE
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    decision_maker TEXT,
    decision_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON public.decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. APPROVALS TABLE
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

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON public.approvals FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type TEXT NOT NULL,
    user_email TEXT,
    entity_type TEXT,
    description TEXT,
    details TEXT
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON public.audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO public.decisions (title, category, status, decision_maker, decision_date) VALUES
('Adopt ISO 27001', 'Security', 'approved', 'CISO', NOW() - INTERVAL '30 days'),
('Update Data Policy', 'Data Governance', 'pending', 'DPO', NULL),
('Implement MFA', 'Security', 'approved', 'CISO', NOW() - INTERVAL '90 days');

INSERT INTO public.approvals (request_type, requester_name, approver_name, status, priority, approved_at, created_at) VALUES
('Policy Change', 'John Smith', 'Board Chair', 'approved', 'high', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
('Budget Approval', 'Jane Doe', 'CFO', 'approved', 'critical', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
('Risk Exception', 'Security Team', 'Risk Committee', 'pending', 'medium', NULL, NOW() - INTERVAL '2 days');

INSERT INTO public.audit_logs (created_at, action_type, user_email, entity_type, description) VALUES
(NOW() - INTERVAL '1 hour', 'login', 'admin@regintels.com', 'user', 'User login successful'),
(NOW() - INTERVAL '2 hours', 'update', 'compliance@regintels.com', 'control', 'Control status updated'),
(NOW() - INTERVAL '3 hours', 'create', 'auditor@regintels.com', 'attestation', 'New attestation created');

-- Success!
SELECT 'Tables created successfully!' as message;
