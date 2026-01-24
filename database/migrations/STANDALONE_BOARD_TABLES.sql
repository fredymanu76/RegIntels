-- ============================================================================
-- STANDALONE MIGRATION: Decision Register and Approvals Tables
-- ============================================================================
-- This is a STANDALONE migration that only creates the missing tables
-- Execute this directly in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. DECISIONS TABLE
-- ============================================================================

-- Drop existing table if you want to recreate (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS public.decisions CASCADE;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_date ON public.decisions(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON public.decisions(category);

-- Enable Row Level Security
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read (you can customize this later)
DROP POLICY IF EXISTS "Allow authenticated users to view decisions" ON public.decisions;
CREATE POLICY "Allow authenticated users to view decisions"
    ON public.decisions
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated users to create decisions" ON public.decisions;
CREATE POLICY "Allow authenticated users to create decisions"
    ON public.decisions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated users to update decisions" ON public.decisions;
CREATE POLICY "Allow authenticated users to update decisions"
    ON public.decisions
    FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================================================
-- 2. APPROVALS TABLE
-- ============================================================================

-- Drop existing table if you want to recreate (CAREFUL - this deletes data!)
-- DROP TABLE IF EXISTS public.approvals CASCADE;

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requester_id ON public.approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON public.approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON public.approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_request_type ON public.approvals(request_type);

-- Enable Row Level Security
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read (you can customize this later)
DROP POLICY IF EXISTS "Allow authenticated users to view approvals" ON public.approvals;
CREATE POLICY "Allow authenticated users to view approvals"
    ON public.approvals
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated users to create approvals" ON public.approvals;
CREATE POLICY "Allow authenticated users to create approvals"
    ON public.approvals
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated users to update approvals" ON public.approvals;
CREATE POLICY "Allow authenticated users to update approvals"
    ON public.approvals
    FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================================================
-- 3. INSERT SAMPLE DATA
-- ============================================================================

-- Sample data for DECISIONS table
INSERT INTO public.decisions (title, category, status, decision_maker, decision_date, description, impact_level, rationale)
VALUES
    ('Adopt ISO 27001 Framework', 'Security', 'approved', 'CISO', NOW() - INTERVAL '30 days', 'Implement ISO 27001 security controls across the organization', 'high', 'Regulatory requirement and best practice alignment'),
    ('Quarterly Risk Assessment Process', 'Risk Management', 'approved', 'Risk Manager', NOW() - INTERVAL '60 days', 'Establish quarterly risk assessment cycle', 'medium', 'Proactive risk identification and mitigation'),
    ('Update Data Retention Policy', 'Data Governance', 'pending', 'Data Protection Officer', NULL, 'Review and update data retention periods for compliance', 'high', 'GDPR and regulatory compliance'),
    ('Third-Party Vendor Review', 'Vendor Management', 'pending', 'Procurement Manager', NULL, 'Annual review of third-party vendor security posture', 'medium', 'Supply chain risk management'),
    ('Implement MFA for All Users', 'Security', 'approved', 'CISO', NOW() - INTERVAL '90 days', 'Roll out multi-factor authentication organization-wide', 'critical', 'Enhanced security posture'),
    ('Establish Incident Response Team', 'Security', 'approved', 'CISO', NOW() - INTERVAL '45 days', 'Form dedicated incident response team with 24/7 coverage', 'high', 'Rapid incident detection and response'),
    ('Cloud Migration Strategy', 'Technology', 'pending', 'CTO', NULL, 'Migrate legacy systems to cloud infrastructure', 'high', 'Scalability and cost optimization'),
    ('Privacy Impact Assessment', 'Privacy', 'approved', 'Data Protection Officer', NOW() - INTERVAL '20 days', 'Conduct comprehensive privacy impact assessment', 'high', 'GDPR Article 35 requirement'),
    ('Update Business Continuity Plan', 'Business Continuity', 'pending', 'COO', NULL, 'Refresh business continuity and disaster recovery plans', 'critical', 'Operational resilience'),
    ('Security Awareness Training', 'Training', 'approved', 'HR Manager', NOW() - INTERVAL '15 days', 'Mandatory security awareness training for all employees', 'medium', 'Human risk mitigation')
ON CONFLICT DO NOTHING;

-- Sample data for APPROVALS table
INSERT INTO public.approvals (
    request_type,
    requester_name,
    approver_name,
    status,
    priority,
    description,
    comments,
    approved_at,
    created_at
)
VALUES
    ('Policy Change', 'John Smith', 'Board Chair', 'approved', 'high', 'Update information security policy to align with ISO 27001', 'Approved with minor amendments', NOW() - INTERVAL '5 days', NOW() - INTERVAL '10 days'),
    ('Budget Approval', 'Jane Doe', 'CFO', 'approved', 'critical', 'Q2 cybersecurity budget allocation - $150,000', 'Approved as submitted', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days'),
    ('Risk Exception', 'Security Team', 'Risk Committee', 'pending', 'medium', 'Temporary exception for legacy system migration', NULL, NULL, NOW() - INTERVAL '2 days'),
    ('Control Implementation', 'Compliance Manager', 'CISO', 'pending', 'high', 'Deploy new access control framework across all systems', NULL, NULL, NOW() - INTERVAL '1 day'),
    ('Vendor Approval', 'Procurement', 'Board Chair', 'approved', 'medium', 'Approve new cloud security vendor - SecureCloud Inc', 'Approved pending contract review', NOW() - INTERVAL '7 days', NOW() - INTERVAL '12 days'),
    ('Audit Scope Change', 'Internal Audit', 'Audit Committee', 'pending', 'high', 'Expand audit scope to include third-party vendors', NULL, NULL, NOW() - INTERVAL '3 days'),
    ('Incident Response Plan', 'CISO', 'Board Chair', 'approved', 'critical', 'Update incident response plan with new escalation procedures', 'Approved for immediate implementation', NOW() - INTERVAL '8 days', NOW() - INTERVAL '14 days'),
    ('Data Classification', 'Data Protection Officer', 'Risk Committee', 'rejected', 'medium', 'Proposed changes to data classification scheme', 'Needs further review and stakeholder input', NOW() - INTERVAL '6 days', NOW() - INTERVAL '18 days'),
    ('Training Program', 'HR Manager', 'Board Chair', 'approved', 'medium', 'Mandatory cybersecurity awareness training program', 'Approved - roll out in Q3', NOW() - INTERVAL '10 days', NOW() - INTERVAL '16 days'),
    ('Third-Party Assessment', 'Compliance Team', 'CISO', 'pending', 'high', 'Commission third-party security assessment', NULL, NULL, NOW() - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check decisions table
SELECT COUNT(*) as decisions_count FROM public.decisions;
SELECT * FROM public.decisions LIMIT 5;

-- Check approvals table
SELECT COUNT(*) as approvals_count FROM public.approvals;
SELECT * FROM public.approvals LIMIT 5;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- Both tables should now be created with sample data
-- You can now use the Decision Register and Approvals pages
-- ============================================================================
