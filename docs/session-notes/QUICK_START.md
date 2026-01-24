# RegIntels Strategic Scoring - Quick Start

## ⚡ Run This NOW (2 Minutes)

### Execute the SQL File
1. Open `CREATE_STRATEGIC_VIEWS_ADAPTED.sql`
2. Copy everything (Ctrl+A, Ctrl+C)
3. Go to Supabase SQL Editor
4. Paste and click **RUN**

### Test It Works
1. Open `TEST_ADAPTED_VIEWS.sql`
2. Copy and run in SQL Editor
3. ✅ All tests should pass

---

## 🎯 What This Creates

**6 Strategic Views** using your existing tables:
- v_regulatory_impact_score (Risk 0-100)
- v_control_drift_index (Drift detection)
- v_control_drift_summary (Dashboard)
- v_attestation_confidence_index (Quality 0-100)
- v_attestation_confidence_summary (Dashboard)
- v_change_action_tracker (Helper)

**NO new tables** - works with your current data!

---

## 📊 Quick Test Queries

```sql
-- Critical changes
SELECT * FROM v_regulatory_impact_score WHERE risk_band = 'CRITICAL';

-- Controls with drift
SELECT * FROM v_control_drift_index WHERE drift_status = 'CRITICAL_DRIFT';

-- Low confidence runs
SELECT * FROM v_attestation_confidence_index WHERE confidence_band = 'LOW_CONFIDENCE';
```

---

## 🔗 Use in React

```typescript
const { data } = await supabase
  .from('v_regulatory_impact_score')
  .select('*')
  .order('total_impact_score', { ascending: false });
```

---

**Read FINAL_IMPLEMENTATION_GUIDE.md for complete details!**
