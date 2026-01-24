# Risk Signal Hub - Deployment Guide

## Overview
The **Risk Signal Hub** is an Operational Risk Signal Hub that transforms exception management from a static register into an intelligent risk engine. It provides:

- **Materiality Scoring (0-100)** - Multi-factor risk scoring based on regulatory impact, control criticality, duration, and recurrence
- **Risk Acceleration Timeline** - Age-based urgency classification (RECENT → DEVELOPING → PERSISTENT → CHRONIC → CRITICAL_AGE)
- **Exception Intelligence** - Visual dashboard with KPIs, alerts, and analytics
- **Recurrence Pattern Detection** - Identifies problem controls with FREQUENT, RECURRING, OCCASIONAL, or ISOLATED patterns

## Current Status
✅ **Frontend Component**: Complete (Solution4Dashboard.jsx)
✅ **Service Layer**: Complete (solution4Service.js)
✅ **Routing**: Integrated into App.js
⏳ **Database Views**: Need to be deployed
⏳ **Feature Flag**: Needs to be activated

## Deployment Steps

### Step 1: Deploy Database Views

1. Open your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the entire contents of `DEPLOY_RISK_SIGNAL_HUB.sql`
5. Paste into the SQL Editor
6. Click **Run**
7. Verify success - you should see 4 views created:
   - `v_exception_materiality`
   - `v_evidence_coverage_gaps`
   - `v_risk_acceleration_timeline`
   - `v_exception_recurrence_pattern`

### Step 2: Activate the Feature

1. Log into your RegIntels app as **Platform Owner/Admin**
2. Navigate to **Platform Admin** → **Feature Control**
3. Find the **Risk Signal Hub** feature card
4. Toggle the feature to **Active** (green)
5. Click the **Preview** button to test the feature
6. If everything looks good, click **Deploy to 0 Tenants**

### Step 3: Verify the Feature

1. Navigate to **Solution 4** (Exceptions & Remediation)
2. You should now see **Risk Signal Hub** in the sidebar
3. Click on **Risk Signal Hub** to view the dashboard
4. Verify the following sections load:
   - KPI Overview (Total, Open, Critical, High exceptions)
   - Urgent Attention Required alerts
   - Exception List with materiality scores
   - Materiality Distribution chart
   - Risk Acceleration Timeline
   - Problem Controls section

## What the Risk Signal Hub Provides

### 1. Materiality Scoring Engine
Each exception gets a score from 0-100 based on:
- **Regulatory Impact (0-30 points)**: Linked to high-materiality regulatory changes
- **Control Criticality (0-30 points)**: Importance of the failed control
- **Duration (0-25 points)**: How long the exception has been open
- **Recurrence (0-15 points)**: How often this control fails

### 2. Materiality Bands
- **CRITICAL (70-100)**: Immediate escalation required
- **HIGH (40-69)**: Senior management attention
- **MEDIUM (20-39)**: Structured monitoring
- **LOW (0-19)**: Standard tracking

### 3. Risk Acceleration Timeline
Tracks how exceptions age and assigns urgency:
- **IMMEDIATE_ATTENTION**: > 180 days open
- **ESCALATE**: > 90 days open
- **MONITOR**: > 30 days open
- **TRACK**: ≤ 30 days open

### 4. Recurrence Pattern Detection
Identifies controls with repeated failures:
- **FREQUENT**: 3+ exceptions in last 3 months
- **RECURRING**: 3+ exceptions in last 12 months
- **OCCASIONAL**: Multiple exceptions over time
- **ISOLATED**: Single exception

## Database Schema Requirements

The Risk Signal Hub requires these tables to exist:
- ✅ `exceptions` (with fields: id, title, status, severity, source_id, source_type, opened_at)
- ✅ `controls` (with fields: id, title)
- ✅ `regulatory_changes` (with fields: id, materiality)
- ✅ `regulatory_change_control_map` (links regulatory changes to controls)

## Feature Value Proposition

### For Compliance Teams
- **Prioritize work** based on objective materiality scores
- **Identify systemic issues** through recurrence pattern analysis
- **Track risk escalation** with timeline-based urgency alerts

### For Risk Managers
- **Quantify exception risk** with standardized 0-100 scoring
- **Spot trends** in control failures before they become critical
- **Evidence-based escalation** to senior management

### For Executives
- **Clear risk signals** with CRITICAL/HIGH/MEDIUM/LOW bands
- **Problem control identification** shows where to invest resources
- **Real-time risk intelligence** instead of static registers

## Troubleshooting

### Views Not Found Error
If you see "relation does not exist" errors:
1. Re-run the `DEPLOY_RISK_SIGNAL_HUB.sql` script
2. Check that you're connected to the correct database
3. Verify your user has permissions to create views

### Empty Dashboard
If the dashboard loads but shows no data:
1. Verify you have exceptions in your database
2. Check that exceptions have `source_type = 'control'`
3. Ensure exceptions have an `opened_at` date

### Feature Not Appearing in Solution 4
1. Make sure you activated the feature in Platform Feature Control
2. Verify you're logged in with the correct permissions
3. Check that `isFeatureEnabled('risk-signal-hub')` returns true

## Next Steps After Deployment

1. **Add Sample Data** (if needed):
   - Create some test exceptions
   - Link controls to regulatory changes
   - Set varying `opened_at` dates to see timeline effects

2. **Configure Tenant Access**:
   - Use Platform Feature Control to deploy to specific tenants
   - Monitor adoption and gather feedback

3. **Train Users**:
   - Show teams how to interpret materiality scores
   - Explain the urgency levels and when to escalate
   - Demonstrate the recurrence pattern insights

## Support

If you encounter issues during deployment:
1. Check the browser console for JavaScript errors
2. Review the Supabase SQL Editor for query errors
3. Verify all prerequisites are met
4. Check that the development server is running without errors

---

**Ready to Deploy?** Follow the steps above to activate the Risk Signal Hub! 🚀
