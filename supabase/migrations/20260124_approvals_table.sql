-- Create approvals table for Approvals Board
-- This table tracks board-level approval workflows and requests

CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL,
    requester_id UUID REFERENCES auth.users(id),
    requester_name TEXT,
    approver_id UUID REFERENCES auth.users(id),
    approver_name TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    description TEXT,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb,
    related_entity_type TEXT,
    related_entity_id UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON public.approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON public.approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requester_id ON public.approvals(requester_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver_id ON public.approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON public.approvals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON public.approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_request_type ON public.approvals(request_type);

-- Enable Row Level Security
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for approvals table
-- Policy: Users can view approvals for their tenant
CREATE POLICY "Users can view their tenant's approvals"
    ON public.approvals
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can create approval requests
CREATE POLICY "Users can create approval requests"
    ON public.approvals
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
        )
        AND requester_id = auth.uid()
    );

-- Policy: Approvers and admins can update approvals
CREATE POLICY "Approvers and admins can update approvals"
    ON public.approvals
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
            AND (
                role IN ('admin', 'compliance_manager', 'board_member')
                OR user_id = approver_id
            )
        )
    );

-- Policy: Only admins can delete approvals
CREATE POLICY "Admins can delete approvals"
    ON public.approvals
    FOR DELETE
    USING (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create updated_at trigger
CREATE TRIGGER update_approvals_updated_at
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set approved_at/rejected_at timestamps
CREATE OR REPLACE FUNCTION set_approval_decision_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_at = NOW();
    ELSIF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.rejected_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER approval_decision_timestamp
    BEFORE UPDATE ON public.approvals
    FOR EACH ROW
    WHEN (NEW.status != OLD.status)
    EXECUTE FUNCTION set_approval_decision_timestamp();

-- Insert sample data for testing
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
    ('Third-Party Assessment', 'Compliance Team', 'CISO', 'pending', 'high', 'Commission third-party security assessment', NULL, NULL, NOW() - INTERVAL '4 days'),
    ('Policy Retirement', 'Compliance Manager', 'Risk Committee', 'pending', 'low', 'Retire outdated acceptable use policy', NULL, NULL, NOW() - INTERVAL '1 day'),
    ('Framework Adoption', 'Security Architect', 'Board Chair', 'approved', 'critical', 'Adopt NIST Cybersecurity Framework as primary standard', 'Strategic alignment approved', NOW() - INTERVAL '12 days', NOW() - INTERVAL '25 days'),
    ('Emergency Change', 'IT Operations', 'CISO', 'approved', 'critical', 'Emergency patch deployment for critical vulnerability', 'Fast-tracked approval granted', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('Compliance Program', 'Compliance Manager', 'Audit Committee', 'pending', 'high', 'Establish SOC 2 Type II compliance program', NULL, NULL, NOW() - INTERVAL '5 days'),
    ('Resource Allocation', 'Security Team', 'CFO', 'rejected', 'medium', 'Request for 3 additional security analysts', 'Deferred to next fiscal year', NOW() - INTERVAL '9 days', NOW() - INTERVAL '22 days')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.approvals IS 'Tracks board-level approval workflows and requests across the organization';
COMMENT ON COLUMN public.approvals.request_type IS 'Type of approval request (e.g., Policy Change, Budget Approval, Risk Exception)';
COMMENT ON COLUMN public.approvals.priority IS 'Priority level of the approval request';
COMMENT ON COLUMN public.approvals.approved_at IS 'Timestamp when the request was approved';
COMMENT ON COLUMN public.approvals.rejected_at IS 'Timestamp when the request was rejected';
COMMENT ON COLUMN public.approvals.metadata IS 'Additional structured data related to the approval request';
COMMENT ON COLUMN public.approvals.related_entity_type IS 'Type of related entity (e.g., control, exception, regulatory_change)';
COMMENT ON COLUMN public.approvals.related_entity_id IS 'ID of the related entity';
