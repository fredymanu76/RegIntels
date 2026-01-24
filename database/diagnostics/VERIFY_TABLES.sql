-- Verify all tables were created successfully
SELECT 'decisions' as table_name, COUNT(*) as row_count FROM public.decisions
UNION ALL
SELECT 'approvals' as table_name, COUNT(*) as row_count FROM public.approvals
UNION ALL
SELECT 'audit_logs' as table_name, COUNT(*) as row_count FROM public.audit_logs;

-- Show sample data from decisions
SELECT * FROM public.decisions LIMIT 3;

-- Show sample data from approvals
SELECT * FROM public.approvals LIMIT 3;

-- Show sample data from audit_logs
SELECT * FROM public.audit_logs LIMIT 3;
