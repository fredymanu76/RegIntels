# Integrate Strategic Dashboard into Your React App

## Step 1: Add Strategic Dashboard to App.js

Add this import at the top of your `src/App.js` file (around line 10):

```javascript
import StrategicDashboard from './components/StrategicDashboard';
import ImpactScoreDetail from './components/ImpactScoreDetail';
```

## Step 2: Add Dashboard Route/Section

Find where you define your pages or sections in App.js, and add:

```javascript
// Add to your page/section definitions
const [currentPage, setCurrentPage] = useState('dashboard'); // or whatever you use for navigation

// In your render/return section, add:
{currentPage === 'strategic' && (
  <StrategicDashboard supabase={supabase} />
)}
```

## Step 3: Add Navigation Link

Add a navigation link to access the Strategic Dashboard:

```javascript
<button onClick={() => setCurrentPage('strategic')}>
  <BarChart3 size={20} />
  Strategic Scoring
</button>
```

## Quick Integration Example

Here's a minimal example to add to your existing App.js:

```javascript
function App() {
  const [view, setView] = useState('main');
  const supabase = new SupabaseClient();

  return (
    <div className="App">
      <nav>
        <button onClick={() => setView('main')}>Main</button>
        <button onClick={() => setView('strategic')}>Strategic Dashboard</button>
      </nav>

      {view === 'main' && (
        <div>
          {/* Your existing content */}
        </div>
      )}

      {view === 'strategic' && (
        <StrategicDashboard supabase={supabase.client} />
      )}
    </div>
  );
}
```

## Step 4: Test It!

1. Start your React app: `npm start`
2. Navigate to Strategic Dashboard
3. You should see:
   - 3 metric cards at the top
   - Impact scoring table
   - Control drift analysis
   - Attestation confidence tracking

## What You Get

✅ **Real-time Strategic Metrics**
- Critical changes count
- Critical drift controls count
- Low confidence runs count

✅ **Impact Scoring Dashboard**
- 0-100 risk scores for regulatory changes
- Risk bands (CRITICAL/HIGH/MODERATE)
- Primary risk drivers
- Affected controls tracking

✅ **Control Drift Analysis**
- Drift status (CRITICAL_DRIFT, MATERIAL_DRIFT, EMERGING_DRIFT, STABLE)
- Drift scores with visual progress bars
- Days overdue tracking
- Failed runs and exceptions

✅ **Attestation Confidence**
- Control run quality scores (0-100)
- Confidence bands (HIGH/MEDIUM/LOW)
- Timeliness tracking
- Late submission monitoring

## Files Created

1. `src/components/StrategicDashboard.jsx` - Main dashboard component
2. `src/components/StrategicDashboard.css` - Dashboard styles
3. `src/components/ImpactScoreDetail.jsx` - Detailed impact view
4. `src/components/ImpactScoreDetail.css` - Detail view styles

## Customization

### Change Colors

Edit `StrategicDashboard.css` to match your brand:

```css
.metric-card.critical {
  border-left: 4px solid #YOUR_COLOR;
}
```

### Add Click Handlers

Make tables interactive by adding onClick handlers:

```javascript
<tr onClick={() => handleRowClick(score)}>
```

### Add Filters

Add dropdown filters to the dashboard:

```javascript
const [filter, setFilter] = useState('all');
const filteredScores = impactScores.filter(s =>
  filter === 'all' || s.risk_band === filter
);
```

## Next Steps

1. ✅ Dashboard is ready to use
2. Add export to PDF functionality
3. Add email alerts for critical scores
4. Create scheduled reports
5. Add trend analysis charts

## Support

The dashboard automatically:
- Fetches data from your Supabase views
- Updates scores in real-time
- Handles loading and error states
- Works on mobile devices (responsive)

**Your strategic scoring system is now live!** 🎉
