-- ============================================================================
-- FIX MISSING TABLES - USING CORRECT SCHEMA FROM DATABASE_SCHEMA_REFERENCE.md
-- ============================================================================

-- ============================================================================
-- 1. ATTESTATIONS TABLE - Already exists, just add missing columns if needed
-- ============================================================================
-- Add attested_by column if it doesn't exist (for display name)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attestations' AND column_name = 'attested_by'
    ) THEN
        ALTER TABLE attestations ADD COLUMN attested_by TEXT;
    END IF;
END $$;

-- Add attested_at column if it doesn't exist (rename from submitted_at or add new)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'attestations' AND column_name = 'attested_at'
    ) THEN
        -- If submitted_at exists, we can reference it in views
        -- Otherwise add attested_at
        ALTER TABLE attestations ADD COLUMN attested_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- ============================================================================
-- 2. CREATE DECISIONS TABLE (doesn't exist yet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- No FK constraint since tenants table may not exist yet
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
-- 3. CREATE APPROVALS TABLE (doesn't exist yet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- No FK constraint
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
-- 4. CREATE AUDIT_LOGS TABLE (doesn't exist yet)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- No FK constraint
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
-- DONE! Tables created/updated successfully
-- ============================================================================
