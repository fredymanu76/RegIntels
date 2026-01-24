-- ============================================================================
-- COMPLETE SCHEMA FIX - All Missing Tables and Columns
-- ============================================================================
-- This SQL fixes ALL schema issues identified by the diagnostic agent
-- Execute this ONCE in Supabase SQL Editor to resolve all errors
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE MISSING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1 DECISIONS TABLE (for Decision Register Board)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    decision_maker TEXT,
    decision_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    stakeholders TEXT[],
    rationale TEXT,
    next_review_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_date ON public.decisions(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON public.decisions(category);
CREATE INDEX IF NOT EXISTS idx_decisions_created_at ON public.decisions(created_at DESC);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read decisions" ON public.decisions;
CREATE POLICY "Allow authenticated read decisions"
    ON public.decisions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert decisions" ON public.decisions;
CREATE POLICY "Allow authenticated insert decisions"
    ON public.decisions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update decisions" ON public.decisions;
CREATE POLICY "Allow authenticated update decisions"
    ON public.decisions FOR UPDATE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 1.2 APPROVALS TABLE (for Approvals Board)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_type TEXT NOT NULL,
    requester_id UUID,
    requester_name TEXT,
    approver_id UUID,
    approver_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    description TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requester_id ON public.approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON public.approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON public.approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_request_type ON public.approvals(request_type);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read approvals" ON public.approvals;
CREATE POLICY "Allow authenticated read approvals"
    ON public.approvals FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert approvals" ON public.approvals;
CREATE POLICY "Allow authenticated insert approvals"
    ON public.approvals FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update approvals" ON public.approvals;
CREATE POLICY "Allow authenticated update approvals"
    ON public.approvals FOR UPDATE TO authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 1.3 AUDIT_LOGS TABLE (for Audit Trail Board)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'login', 'logout', 'critical_change', 'access', 'export')),
    user_id UUID,
    user_email TEXT,
    entity_type TEXT,
    entity_id UUID,
    details TEXT,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow authenticated read audit_logs"
    ON public.audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow service role insert audit_logs" ON public.audit_logs;
CREATE POLICY "Allow service role insert audit_logs"
    ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================================
-- PART 2: ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1 EXTEND CONTROLS TABLE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Add frequency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'controls'
                   AND column_name = 'frequency') THEN
        ALTER TABLE public.controls ADD COLUMN frequency TEXT;
    END IF;

    -- Add test_method column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'controls'
                   AND column_name = 'test_method') THEN
        ALTER TABLE public.controls ADD COLUMN test_method TEXT;
    END IF;

    -- Add evidence_required column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'controls'
                   AND column_name = 'evidence_required') THEN
        ALTER TABLE public.controls ADD COLUMN evidence_required TEXT;
    END IF;

    -- Add tenant_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'controls'
                   AND column_name = 'tenant_id') THEN
        ALTER TABLE public.controls ADD COLUMN tenant_id UUID;
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_controls_tenant_id ON public.controls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_controls_frequency ON public.controls(frequency);

-- ----------------------------------------------------------------------------
-- 2.2 EXTEND EXCEPTIONS TABLE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    -- Add tenant_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'exceptions'
                   AND column_name = 'tenant_id') THEN
        ALTER TABLE public.exceptions ADD COLUMN tenant_id UUID;
    END IF;

    -- Add source_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'exceptions'
                   AND column_name = 'source_type') THEN
        ALTER TABLE public.exceptions ADD COLUMN source_type TEXT;
    END IF;

    -- Add source_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'exceptions'
                   AND column_name = 'source_id') THEN
        ALTER TABLE public.exceptions ADD COLUMN source_id UUID;
    END IF;

    -- Add opened_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_schema = 'public'
                   AND table_name = 'exceptions'
                   AND column_name = 'opened_at') THEN
        ALTER TABLE public.exceptions ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_exceptions_tenant_id ON public.exceptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_source_type ON public.exceptions(source_type);
CREATE INDEX IF NOT EXISTS idx_exceptions_opened_at ON public.exceptions(opened_at DESC);

-- ============================================================================
-- PART 3: INSERT SAMPLE DATA
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 DECISIONS SAMPLE DATA
-- ----------------------------------------------------------------------------
INSERT INTO public.decisions (title, category, status, decision_maker, decision_date, description, impact_level, rationale)
VALUES
    ('Adopt ISO 27001 Framework', 'Security', 'approved', 'CISO', NOW() - INTERVAL '30 days', 'Implement ISO 27001 security controls', 'high', 'Regulatory requirement'),
    ('Quarterly Risk Assessment', 'Risk Management', 'approved', 'Risk Manager', NOW() - INTERVAL '60 days', 'Establish quarterly risk cycle', 'medium', 'Proactive risk management'),
    ('Update Data Retention Policy', 'Data Governance', 'pending', 'DPO', NULL, 'Review data retention periods', 'high', 'GDPR compliance'),
    ('Third-Party Vendor Review', 'Vendor Management', 'pending', 'Procurement', NULL, 'Annual vendor security review', 'medium', 'Supply chain risk'),
    ('Implement MFA', 'Security', 'approved', 'CISO', NOW() - INTERVAL '90 days', 'Roll out MFA organization-wide', 'critical', 'Enhanced security'),
    ('Incident Response Team', 'Security', 'approved', 'CISO', NOW() - INTERVAL '45 days', 'Form dedicated IR team', 'high', 'Rapid incident response'),
    ('Cloud Migration', 'Technology', 'pending', 'CTO', NULL, 'Migrate legacy systems to cloud', 'high', 'Scalability and cost'),
    ('Privacy Impact Assessment', 'Privacy', 'approved', 'DPO', NOW() - INTERVAL '20 days', 'Comprehensive privacy assessment', 'high', 'GDPR Article 35'),
    ('Business Continuity Plan', 'Business Continuity', 'pending', 'COO', NULL, 'Refresh BC and DR plans', 'critical', 'Operational resilience'),
    ('Security Training', 'Training', 'approved', 'HR Manager', NOW() - INTERVAL '15 days', 'Mandatory security awareness', 'medium', 'Human risk mitigation')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3.2 APPROVALS SAMPLE DATA
-- ----------------------------------------------------------------------------
INSERT INTO public.approvals (request_type, requester_name, approver_name, status, priority, description, comments, approved_at, created_at)
VALUES
    ('Policy Change', 'John Smith', 'Board Chair', 'approved', 'high', 'Update security policy ISO 27001', 'Approved with amendments', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
    ('Budget Approval', 'Jane Doe', 'CFO', 'approved', 'critical', 'Q2 cybersecurity budget $150K', 'Approved as submitted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
    ('Risk Exception', 'Security Team', 'Risk Committee', 'pending', 'medium', 'Exception for legacy system', NULL, NULL, NOW() - INTERVAL '2 days'),
    ('Control Implementation', 'Compliance Manager', 'CISO', 'pending', 'high', 'Deploy access control framework', NULL, NULL, NOW() - INTERVAL '1 day'),
    ('Vendor Approval', 'Procurement', 'Board Chair', 'approved', 'medium', 'New cloud security vendor', 'Approved pending contract', NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 days'),
    ('Audit Scope', 'Internal Audit', 'Audit Committee', 'pending', 'high', 'Expand audit to third-parties', NULL, NULL, NOW() - INTERVAL '3 days'),
    ('Incident Response', 'CISO', 'Board Chair', 'approved', 'critical', 'Update IR procedures', 'Approved immediately', NOW() - INTERVAL '8 days', NOW() - INTERVAL '14 days'),
    ('Data Classification', 'DPO', 'Risk Committee', 'rejected', 'medium', 'Data classification changes', 'Needs stakeholder input', NOW() - INTERVAL '6 days', NOW() - INTERVAL '18 days'),
    ('Training Program', 'HR', 'Board Chair', 'approved', 'medium', 'Security awareness training', 'Roll out Q3', NOW() - INTERVAL '10 days', NOW() - INTERVAL '16 days'),
    ('Security Assessment', 'Compliance', 'CISO', 'pending', 'high', 'Third-party security assessment', NULL, NULL, NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3.3 AUDIT_LOGS SAMPLE DATA
-- ----------------------------------------------------------------------------
INSERT INTO public.audit_logs (created_at, action_type, user_email, entity_type, entity_id, description, details)
VALUES
    (NOW() - INTERVAL '1 hour', 'login', 'admin@regintels.com', 'user', gen_random_uuid(), 'User login successful', 'Login from IP 192.168.1.100'),
    (NOW() - INTERVAL '2 hours', 'update', 'compliance@regintels.com', 'control', gen_random_uuid(), 'Control status updated', 'Changed status from pending to active'),
    (NOW() - INTERVAL '3 hours', 'create', 'auditor@regintels.com', 'attestation', gen_random_uuid(), 'New attestation created', 'Attestation for control AC-001'),
    (NOW() - INTERVAL '4 hours', 'critical_change', 'admin@regintels.com', 'policy', gen_random_uuid(), 'Security policy updated', 'ISO 27001 policy revision'),
    (NOW() - INTERVAL '5 hours', 'delete', 'admin@regintels.com', 'exception', gen_random_uuid(), 'Exception deleted', 'Expired exception removed'),
    (NOW() - INTERVAL '6 hours', 'access', 'viewer@regintels.com', 'dashboard', gen_random_uuid(), 'Dashboard accessed', 'Regulatory Readiness Board'),
    (NOW() - INTERVAL '7 hours', 'update', 'risk@regintels.com', 'regulatory_change', gen_random_uuid(), 'Regulatory change updated', 'Updated materiality assessment'),
    (NOW() - INTERVAL '8 hours', 'create', 'compliance@regintels.com', 'decision', gen_random_uuid(), 'Decision logged', 'New security framework decision'),
    (NOW() - INTERVAL '9 hours', 'export', 'auditor@regintels.com', 'report', gen_random_uuid(), 'Report exported', 'Compliance report exported to PDF'),
    (NOW() - INTERVAL '10 hours', 'logout', 'admin@regintels.com', 'user', gen_random_uuid(), 'User logout', 'Session ended normally')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Check all new tables exist and have data
SELECT 'decisions' as table_name, COUNT(*) as row_count FROM public.decisions
UNION ALL
SELECT 'approvals' as table_name, COUNT(*) as row_count FROM public.approvals
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM public.audit_logs;

-- Verify new columns in controls
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'controls'
AND column_name IN ('frequency', 'test_method', 'evidence_required', 'tenant_id')
ORDER BY column_name;

-- Verify new columns in exceptions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'exceptions'
AND column_name IN ('tenant_id', 'source_type', 'source_id', 'opened_at')
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'SCHEMA FIX COMPLETE!';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Created tables: decisions, approvals, audit_logs';
    RAISE NOTICE 'Extended tables: controls, exceptions';
    RAISE NOTICE 'All board components should now work correctly';
    RAISE NOTICE '============================================';
END $$;
