# Database Scripts

Organized SQL scripts for RegIntels platform database management.

## Folder Structure

### `/migrations`
Production database migrations and schema deployments:
- Solution 4 migrations (Strategic Scoring, Risk Signal Hub)
- Solution 5 migrations (Board-level dashboards)
- Platform feature tables
- Regulatory change tracking

### `/fixes`
Database repair and correction scripts:
- Decision Register table rebuild
- Attestations schema fixes
- Complete schema repairs
- RLS policy fixes

### `/diagnostics`
Database inspection and verification queries:
- Table schema checks
- Column verification
- Data validation queries
- Schema exploration tools

### `/archive`
Historical scripts and deprecated migrations:
- Legacy data import/export tools
- Temporary migration scripts
- Deprecated platform admin scripts

## Usage

1. **For New Deployments**: Run scripts in `/migrations` folder in chronological order
2. **For Troubleshooting**: Use scripts in `/diagnostics` to inspect database state
3. **For Repairs**: Apply scripts in `/fixes` only when specific issues are identified

## Migration Best Practices

- Always backup production data before running migrations
- Test migrations in development/staging environment first
- Review migration scripts before execution in Supabase SQL Editor
- Check for RLS policies and permissions after table creation
