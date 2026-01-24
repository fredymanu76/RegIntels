-- ============================================================================
-- SAFE TABLE CREATION - No assumptions, graceful handling
-- ============================================================================

-- ============================================================================
-- 1. CREATE DECISIONS TABLE (if doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
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

GRANT SELECT, INSERT, UPDATE, DELETE ON decisions TO authenticated;

CREATE INDEX IF NOT EXISTS idx_decisions_tenant_id ON decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
CREATE INDEX IF NOT EXISTS idx_decisions_category ON decisions(category);
CREATE INDEX IF NOT EXISTS idx_decisions_decision_date ON decisions(decision_date);

-- ============================================================================
-- 2. CREATE APPROVALS TABLE (if doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
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

GRANT SELECT, INSERT, UPDATE, DELETE ON approvals TO authenticated;

CREATE INDEX IF NOT EXISTS idx_approvals_tenant_id ON approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at);

-- ============================================================================
-- 3. CREATE AUDIT_LOGS TABLE (if doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
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

GRANT SELECT, INSERT ON audit_logs TO authenticated;

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);

-- ============================================================================
-- DONE! New tables created (existing tables untouched)
-- ============================================================================
