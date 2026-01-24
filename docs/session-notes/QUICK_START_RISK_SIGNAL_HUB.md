# Risk Signal Hub - Quick Start Guide

## ⚡ 3-Step Deployment

### 1️⃣ Run SQL Script (5 minutes)
```
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of: DEPLOY_RISK_SIGNAL_HUB.sql
3. Paste and Run
4. Verify 4 views created ✅
```

### 2️⃣ Activate Feature (2 minutes)
```
1. Login to RegIntels app
2. Platform Admin → Feature Control
3. Find "Risk Signal Hub"
4. Toggle to Active
5. Click "Preview" to test
```

### 3️⃣ Deploy to Tenants (1 minute)
```
1. Click "Deploy to 0 Tenants"
2. Confirm deployment
3. Done! Feature is live ✅
```

## 🎯 What You Get

### Materiality Scoring (0-100)
- **CRITICAL (70-100)** - Red alert, immediate action
- **HIGH (40-69)** - Senior management attention
- **MEDIUM (20-39)** - Structured monitoring
- **LOW (0-19)** - Standard tracking

### Risk Acceleration Timeline
- **IMMEDIATE_ATTENTION** - >180 days open
- **ESCALATE** - >90 days open
- **MONITOR** - >30 days open
- **TRACK** - ≤30 days open

### Recurrence Patterns
- **FREQUENT** - 3+ in 3 months (problem control!)
- **RECURRING** - 3+ in 12 months (needs attention)
- **OCCASIONAL** - Multiple over time
- **ISOLATED** - Single exception

## 📊 Dashboard Sections

1. **KPI Cards** - Total, Open, Critical, High, Avg Score, Aged
2. **Urgent Alerts** - Top 5 exceptions needing immediate attention
3. **Exception List** - Full table with materiality scores
4. **Distribution Chart** - Visual breakdown by CRITICAL/HIGH/MEDIUM/LOW
5. **Timeline View** - Age bands and urgency levels
6. **Problem Controls** - Top 10 controls with most exceptions

## ✅ Prerequisites

Must exist in database:
- ✅ `exceptions` table
- ✅ `controls` table
- ✅ `regulatory_changes` table
- ✅ `regulatory_change_control_map` table

## 🔍 Quick Verification

After deployment, check:
```sql
-- Run in Supabase SQL Editor
SELECT * FROM v_exception_materiality LIMIT 5;
SELECT * FROM v_risk_acceleration_timeline LIMIT 5;
SELECT * FROM v_exception_recurrence_pattern LIMIT 5;
```

Should return data ✅

## 📍 Where to Find It

After activation:
```
Solution 4 → Risk Signal Hub
```

## 🚨 Troubleshooting

**Error: "relation does not exist"**
→ Re-run DEPLOY_RISK_SIGNAL_HUB.sql

**Feature not in sidebar**
→ Toggle to Active in Platform Feature Control

**Empty dashboard**
→ Add exceptions with source_type='control'

---

**Total Time**: ~10 minutes to full deployment 🚀
