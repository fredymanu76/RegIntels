# 🚀 START HERE - Risk Signal Hub Deployment

## ⚠️ IMPORTANT: Use the FIXED SQL File

**Use this file:** `DEPLOY_RISK_SIGNAL_HUB_FIXED.sql`

This version is adapted to your actual database schema with:
- `exceptions.control_id` (not source_id/source_type)
- `exceptions.created_at` (not opened_at)
- `controls.control_title` (not title)

## ⚡ Quick Deployment (10 minutes)

### Step 1: Run SQL Script (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "New query"

3. **Copy & Run Script**
   - Open file: `DEPLOY_RISK_SIGNAL_HUB_FIXED.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **"Run"** button

4. **Verify Success**
   You should see output showing:
   ```
   ✅ 4 rows returned (the 4 views created)
   ✅ Test queries showing counts
   ```

### Step 2: Activate Feature (2 minutes)

1. **Login to your app** as Platform Owner/Admin

2. **Navigate to Platform Admin**
   - Click "Platform Admin" in sidebar
   - Click "Feature Control"

3. **Activate Risk Signal Hub**
   - Find the "Risk Signal Hub" card
   - It will show status: "○ INACTIVE"
   - Toggle the switch to Active
   - Status changes to: "● ACTIVE"

4. **Test with Preview**
   - Click the "Preview" button
   - You should see the dashboard load

### Step 3: Deploy to Tenants (1 minute)

1. **Deploy Globally**
   - Back in Platform Feature Control
   - Click "Deploy to 0 Tenants" button
   - Confirm the deployment

2. **Verify in Solution 4**
   - Navigate to "Solution 4" in sidebar
   - You should now see "Risk Signal Hub" as a page option
   - Click it to view the full dashboard

## ✅ What You Should See

### After SQL Deployment
In Supabase SQL Editor results:
```
view_name                        | table_type
---------------------------------|------------
v_evidence_coverage_gaps         | VIEW
v_exception_materiality          | VIEW
v_exception_recurrence_pattern   | VIEW
v_risk_acceleration_timeline     | VIEW
```

### After Feature Activation
In your app at Solution 4 → Risk Signal Hub:

**Dashboard Sections:**
1. ✅ KPI Cards - Total, Open, Critical, High, Avg Score, Aged
2. ✅ Urgent Alerts - Top exceptions needing attention
3. ✅ Exception List - Table with materiality scores
4. ✅ Distribution Chart - CRITICAL/HIGH/MEDIUM/LOW breakdown
5. ✅ Timeline View - Age bands and urgency levels
6. ✅ Problem Controls - Controls with recurring exceptions

## 🔍 Troubleshooting

### Issue: "Relation does not exist" error
**Solution:** Make sure you're using `DEPLOY_RISK_SIGNAL_HUB_FIXED.sql` (not the old version)

### Issue: Empty dashboard / No data
**Possible causes:**
1. No exceptions in your database yet
2. All exceptions are status='closed' or 'expired'

**Quick fix - Add test exception:**
```sql
-- Run in Supabase SQL Editor
INSERT INTO exceptions (control_id, title, description, status, severity)
SELECT
  id,
  'Test Exception for Risk Signal Hub',
  'This is a test exception to verify the dashboard works',
  'open',
  'high'
FROM controls
LIMIT 1;
```

### Issue: Feature not appearing in Solution 4 sidebar
**Solutions:**
1. Make sure you toggled feature to Active
2. Hard refresh browser (Ctrl+Shift+R)
3. Check you're logged in as Platform Owner or have correct permissions

### Issue: Views show 0 rows
**Check if you have data:**
```sql
-- Run in Supabase SQL Editor
SELECT COUNT(*) as total_exceptions FROM exceptions;
SELECT COUNT(*) as open_exceptions FROM exceptions WHERE status = 'open';
```

If counts are 0, you need to add some exception data first.

## 📊 Understanding the Dashboard

### Materiality Score (0-100)
- **70-100** = CRITICAL (Red) - Immediate action required
- **40-69** = HIGH (Orange) - Management attention needed
- **20-39** = MEDIUM (Yellow) - Structured monitoring
- **0-19** = LOW (Green) - Standard tracking

### Urgency Levels
Based on how long exception has been open:
- **IMMEDIATE_ATTENTION** - Over 180 days (6 months)
- **ESCALATE** - Over 90 days (3 months)
- **MONITOR** - Over 30 days (1 month)
- **TRACK** - Under 30 days

### Recurrence Patterns
Shows which controls have repeated failures:
- **FREQUENT** - 3+ exceptions in last 3 months
- **RECURRING** - 3+ exceptions in last 12 months
- **OCCASIONAL** - Multiple exceptions over time
- **ISOLATED** - Single exception

## 🎯 Next Steps After Deployment

1. **Add Real Data** (if needed)
   - Create exceptions for your controls
   - Link controls to regulatory changes
   - Vary the creation dates to see timeline effects

2. **Configure Access**
   - Use Platform Feature Control to manage tenant access
   - Monitor which tenants are using the feature

3. **Train Your Team**
   - Show how to interpret materiality scores
   - Explain when to escalate based on urgency levels
   - Demonstrate the recurrence pattern insights

## 📞 Still Need Help?

If you encounter issues:
1. Check the browser console (F12) for JavaScript errors
2. Review Supabase SQL Editor for query errors
3. Verify your database has exceptions with status='open'
4. Make sure you're using the FIXED SQL file

---

**Ready?** Copy `DEPLOY_RISK_SIGNAL_HUB_FIXED.sql` and run it in Supabase! 🚀
