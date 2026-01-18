# Component Integration Guide
## Strategic Upgrade Components - Phase 2

This guide shows how to integrate the new strategic scoring components into RegIntels Solutions 1-3.

---

## 📦 Available Components

### 1. ImpactScoreCard
**File:** `src/components/ImpactScoreCard.jsx`

**Purpose:** Display regulatory impact scores (0-100) with risk bands

**Usage:**
```jsx
import ImpactScoreCard from './components/ImpactScoreCard';

// Full card view
<ImpactScoreCard
  score={78}
  riskBand="CRITICAL"
  primaryDriver="Missing control sign-offs"
  changeTitle="MiFID II Q1 2026 Update"
/>

// Compact badge view
<ImpactScoreCard
  score={45}
  riskBand="HIGH"
  compact={true}
  onClick={() => handleClick()}
/>
```

---

### 2. ControlDriftBadge
**File:** `src/components/ControlDriftBadge.jsx`

**Purpose:** Display control drift status with visual indicators

**Usage:**
```jsx
import ControlDriftBadge from './components/ControlDriftBadge';

// Full badge
<ControlDriftBadge
  driftStatus="CRITICAL_DRIFT"
  driftScore={85}
  driftDriver="Overdue review (>90 days)"
  showScore={true}
/>

// Compact inline badge
<ControlDriftBadge
  driftStatus="EMERGING_DRIFT"
  driftScore={42}
  compact={true}
/>
```

---

### 3. AttestationConfidenceWidget
**File:** `src/components/AttestationConfidenceWidget.jsx`

**Purpose:** Display attestation confidence scores

**Usage:**
```jsx
import AttestationConfidenceWidget from './components/AttestationConfidenceWidget';

// Full widget
<AttestationConfidenceWidget
  confidenceScore={85}
  confidenceBand="HIGH_CONFIDENCE"
  confidenceDriver="Strong attestation profile"
  attestorRole="SMF"
/>

// Compact view
<AttestationConfidenceWidget
  confidenceScore={42}
  confidenceBand="MEDIUM_CONFIDENCE"
  compact={true}
/>
```

---

### 4. ControlDriftHeatmap
**File:** `src/components/ControlDriftHeatmap.jsx`

**Purpose:** Dashboard heatmap visualization of control drift

**Usage:**
```jsx
import ControlDriftHeatmap from './components/ControlDriftHeatmap';

<ControlDriftHeatmap
  driftData={driftIndexData}
  onControlClick={(control) => handleControlClick(control)}
/>
```

---

## 🔗 Integration Examples

### Solution 1: Regulatory Change Intelligence

**Add Impact Scores to Change Feed**

```jsx
// In your regulatory changes component
import { useEffect, useState } from 'react';
import ImpactScoreCard from './components/ImpactScoreCard';

function RegChangesFeedPage({ currentTenant }) {
  const [impactScores, setImpactScores] = useState([]);

  // Fetch impact scores
  useEffect(() => {
    const fetchImpactScores = async () => {
      const { data } = await supabase
        .from('v_regulatory_impact_score')
        .select('*')
        .order('total_impact_score', { ascending: false })
        .limit(20);

      setImpactScores(data || []);
    };

    fetchImpactScores();
  }, [currentTenant]);

  return (
    <div className="changes-feed">
      {impactScores.map(change => (
        <div key={change.change_id} className="change-card">
          <h3>{change.change_title}</h3>

          {/* Add Impact Score */}
          <ImpactScoreCard
            score={change.total_impact_score}
            riskBand={change.risk_band}
            primaryDriver={change.primary_driver}
            compact={false}
          />

          <div className="change-metadata">
            <span>Affected Controls: {change.affected_controls_count}</span>
            <span>Overdue Actions: {change.overdue_actions_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Solution 2: Policy & Control Management

**Add Control Drift to Control Cards**

```jsx
import { useEffect, useState } from 'react';
import ControlDriftBadge from './components/ControlDriftBadge';
import ControlDriftHeatmap from './components/ControlDriftHeatmap';

function ControlManagementPage({ currentTenant }) {
  const [controlDrift, setControlDrift] = useState([]);

  // Fetch control drift data
  useEffect(() => {
    const fetchControlDrift = async () => {
      const { data } = await supabase
        .from('v_control_drift_index')
        .select('*')
        .order('drift_score', { ascending: false });

      setControlDrift(data || []);
    };

    fetchControlDrift();
  }, [currentTenant]);

  return (
    <div>
      {/* Dashboard Heatmap */}
      <section className="drift-heatmap-section">
        <ControlDriftHeatmap
          driftData={controlDrift}
          onControlClick={(control) => console.log('Clicked:', control)}
        />
      </section>

      {/* Control List with Drift Badges */}
      <section className="controls-list">
        {controlDrift.map(control => (
          <div key={control.control_id} className="control-card">
            <h4>{control.control_title}</h4>

            {/* Add Drift Badge */}
            <ControlDriftBadge
              driftStatus={control.drift_status}
              driftScore={control.drift_score}
              driftDriver={control.drift_driver}
              compact={true}
            />

            <div className="control-details">
              <span>Review Delay: {control.review_delay_days} days</span>
              <span>Open Exceptions: {control.open_exceptions_count}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

### Solution 3: Risk & Control Assurance

**Add Attestation Confidence to Attestations**

```jsx
import { useEffect, useState } from 'react';
import AttestationConfidenceWidget from './components/AttestationConfidenceWidget';

function AttestationsPage({ currentTenant }) {
  const [attestations, setAttestations] = useState([]);

  // Fetch attestation confidence data
  useEffect(() => {
    const fetchAttestations = async () => {
      const { data } = await supabase
        .from('v_attestation_confidence_index')
        .select('*')
        .order('confidence_score', { ascending: true })
        .limit(50);

      setAttestations(data || []);
    };

    fetchAttestations();
  }, [currentTenant]);

  return (
    <div className="attestations-dashboard">
      {/* Summary Cards */}
      <div className="confidence-summary">
        <AttestationConfidenceWidget
          confidenceScore={
            attestations.reduce((sum, a) => sum + a.confidence_score, 0) / attestations.length
          }
          confidenceBand="MEDIUM_CONFIDENCE"
          confidenceDriver="Overall attestation health"
          compact={false}
        />
      </div>

      {/* Attestation List */}
      <section className="attestations-list">
        {attestations.map(attestation => (
          <div key={attestation.attestation_id} className="attestation-card">
            <h4>{attestation.control_title}</h4>

            {/* Add Confidence Widget */}
            <AttestationConfidenceWidget
              confidenceScore={attestation.confidence_score}
              confidenceBand={attestation.confidence_band}
              confidenceDriver={attestation.confidence_driver}
              attestorRole={attestation.attestor_role}
              compact={true}
            />

            <div className="attestation-metadata">
              <span>Attestor: {attestation.attestor_role}</span>
              <span>Status: {attestation.status}</span>
              <span>Days Delta: {Math.round(attestation.days_delta)}</span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
```

---

## 🎨 Styling Tips

All components use inline styles for portability, but you can override with CSS:

```css
/* Custom styling for impact scores */
.impact-score-container {
  max-width: 400px;
  margin: 1rem auto;
}

/* Drift heatmap customization */
.drift-heatmap-section {
  background: #f9fafb;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

/* Confidence widget in cards */
.attestation-card .confidence-widget {
  margin-top: 1rem;
}
```

---

## 📊 Data Fetching Patterns

### Pattern 1: Simple Query
```javascript
const { data: impactScores } = await supabase
  .from('v_regulatory_impact_score')
  .select('*');
```

### Pattern 2: Filtered Query
```javascript
const { data: criticalDrift } = await supabase
  .from('v_control_drift_index')
  .select('*')
  .eq('drift_status', 'CRITICAL_DRIFT');
```

### Pattern 3: With AbortController (for cleanup)
```javascript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async (signal) => {
    const { data } = await supabase
      .from('v_attestation_confidence_index')
      .select('*');

    if (!signal?.aborted) {
      setAttestations(data || []);
    }
  };

  fetchData(controller.signal);

  return () => controller.abort('Component unmounted');
}, [currentTenant]);
```

---

## 🚀 Next Steps

1. **Deploy SQL migrations to Supabase** (see STRATEGIC_UPGRADE_DEPLOYMENT.md)
2. **Import components** into your Solutions pages
3. **Fetch data** from new views using Supabase client
4. **Customize styling** to match your design system
5. **Test with real data** from your database

---

## 📝 Component Props Reference

### ImpactScoreCard Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| score | number | Yes | Impact score (0-100) |
| riskBand | string | Yes | 'CRITICAL' \| 'HIGH' \| 'MODERATE' |
| primaryDriver | string | No | Main reason for score |
| changeTitle | string | No | Regulatory change title |
| compact | boolean | No | Compact view mode |
| onClick | function | No | Click handler |

### ControlDriftBadge Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| driftStatus | string | Yes | 'CRITICAL_DRIFT' \| 'MATERIAL_DRIFT' \| 'EMERGING_DRIFT' \| 'STABLE' |
| driftScore | number | Yes | Drift score (0-100) |
| driftDriver | string | No | Primary drift cause |
| compact | boolean | No | Compact view mode |
| showScore | boolean | No | Display drift score |
| onClick | function | No | Click handler |

### AttestationConfidenceWidget Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| confidenceScore | number | Yes | Confidence score (0-100) |
| confidenceBand | string | Yes | 'HIGH_CONFIDENCE' \| 'MEDIUM_CONFIDENCE' \| 'LOW_CONFIDENCE' |
| confidenceDriver | string | No | Main confidence factor |
| attestorRole | string | No | Role of attestor |
| compact | boolean | No | Compact view mode |
| onClick | function | No | Click handler |

### ControlDriftHeatmap Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| driftData | array | Yes | Array from v_control_drift_index |
| onControlClick | function | No | Click handler for controls |

---

**Last Updated:** 2026-01-18
**Status:** Phase 2 Complete ✅
**Next:** Integration into Solutions 1-3
