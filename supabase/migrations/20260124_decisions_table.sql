-- Create decisions table for Decision Register Board
-- This table tracks key business decisions made across the organization

CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
    decision_maker TEXT,
    decision_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
    stakeholders TEXT[],
    rationale TEXT,
    next_review_date TIMESTAMP WITH TIME ZONE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_decisions_tenant_id ON public.decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON public.decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_date ON public.decisions(decision_date DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON public.decisions(category);

-- Enable Row Level Security
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for decisions table
-- Policy: Users can view decisions for their tenant
CREATE POLICY "Users can view their tenant's decisions"
    ON public.decisions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
        )
    );

-- Policy: Users with appropriate roles can insert decisions
CREATE POLICY "Authorized users can create decisions"
    ON public.decisions
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'compliance_manager', 'decision_maker')
        )
    );

-- Policy: Users with appropriate roles can update decisions
CREATE POLICY "Authorized users can update decisions"
    ON public.decisions
    FOR UPDATE
    USING (
        tenant_id IN (
            SELECT tenant_id
            FROM public.user_tenant_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'compliance_manager', 'decision_maker')
        )
    );

-- Policy: Only admins can delete decisions
CREATE POLICY "Admins can delete decisions"
    ON public.decisions
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
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_decisions_updated_at
    BEFORE UPDATE ON public.decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
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

COMMENT ON TABLE public.decisions IS 'Tracks key business decisions across the organization with approval status and impact assessment';
COMMENT ON COLUMN public.decisions.decision_date IS 'Date when the decision was approved/rejected (NULL for pending decisions)';
COMMENT ON COLUMN public.decisions.impact_level IS 'Business impact level of the decision';
COMMENT ON COLUMN public.decisions.stakeholders IS 'Array of stakeholder names or departments affected by the decision';
