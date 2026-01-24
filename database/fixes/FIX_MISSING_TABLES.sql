-- ============================================================================
-- FIX MISSING TABLES FOR SOLUTION 5 BATCH 3
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. CREATE ATTESTATIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    control_id UUID REFERENCES controls(id),
    status TEXT NOT NULL DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    attested_at TIMESTAMP WITH TIME ZONE,
    attested_by TEXT,
    attester_email TEXT,
    attestation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON attestations TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_attestations_tenant_id ON attestations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attestations_control_id ON attestations(control_id);
CREATE INDEX IF NOT EXISTS idx_attestations_status ON attestations(status);
CREATE INDEX IF NOT EXISTS idx_attestations_due_date ON attestations(due_date);

-- ============================================================================
-- 2. CREATE DECISIONS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    decision_maker TEXT,
    decision_maker_email TEXT,
    decision_date TIMESTAMP WITH TIME ZONE,
    rationale TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON decisions TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_decisions_tenant_id ON decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_date ON decisions(decision_date);

-- ============================================================================
-- 3. CREATE APPROVALS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    request_type TEXT NOT NULL,
    requester_id UUID,
    requester_name TEXT,
    requester_email TEXT,
    approver_id UUID,
    approver_name TEXT,
    approver_email TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    comments TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON approvals TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);

-- ============================================================================
-- 4. CREATE AUDIT_LOGS TABLE (if not exists)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID,
    user_email TEXT,
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details TEXT,
    description TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- ============================================================================
-- DONE! All tables created successfully
-- ============================================================================
