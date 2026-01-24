# App.js Feature Flag System - Implementation Guide

## What This Does

Checks `platform_features` table before showing features to tenants:
- **Platform Owner:** Sees ALL features (including pending)
- **Tenants:** Only see features with `status = 'active'`

---

## Code Changes for App.js

### Step 1: Add state for feature flags (around line 810)

```javascript
// After the line: const [activePage, setActivePage] = useState('Change Feed');

// Add this:
const [enabledFeatures, setEnabledFeatures] = useState([]);
const [featuresLoaded, setFeaturesLoaded] = useState(false);
```

### Step 2: Add useEffect to load feature flags (around line 900)

```javascript
// Add this new useEffect after authentication useEffect:

useEffect(() => {
  async function loadFeatureFlags() {
    if (!supabase.client || !isAuthenticated) return;

    try {
      // Platform owners see all features
      if (currentUser?.is_platform_owner || currentUser?.is_platform_admin) {
        setEnabledFeatures(['ALL']);
        setFeaturesLoaded(true);
        return;
      }

      // Tenants only see active features
      const { data, error } = await supabase.client
        .from('platform_features')
        .select('id, status')
        .eq('status', 'active');

      if (error) {
        console.error('Error loading feature flags:', error);
        // Fallback: enable all features if table doesn't exist
        setEnabledFeatures(['ALL']);
      } else {
        const activeFeatureIds = data?.map(f => f.id) || [];
        setEnabledFeatures(activeFeatureIds);
      }
    } catch (err) {
      console.error('Feature flags error:', err);
      setEnabledFeatures(['ALL']); // Fallback
    } finally {
      setFeaturesLoaded(true);
    }
  }

  loadFeatureFlags();
}, [isAuthenticated, currentUser?.id]);
```

### Step 3: Add helper function to check feature status (around line 1000)

```javascript
// Add this function before the solutions definition:

const isFeatureEnabled = (featureId) => {
  // Platform owners always see everything
  if (currentUser?.is_platform_owner || currentUser?.is_platform_admin) {
    return true;
  }

  // Check if features are loaded
  if (!featuresLoaded) return false;

  // If 'ALL' is in the list, show everything (fallback mode)
  if (enabledFeatures.includes('ALL')) return true;

  // Check if this specific feature is enabled
  return enabledFeatures.includes(featureId);
};
```

### Step 4: Update Solution 4 pages array (around line 1027)

**Find this:**
```javascript
'Solution 4': {
  name: 'Exceptions & Remediation',
  icon: AlertTriangle,
  pages: ['Exception Intelligence', 'Risk Signal Hub', 'Unified Exceptions', 'Evidence & Audit'],
  accessRoles: ['Admin', 'Compliance'],
},
```

**Replace with:**
```javascript
'Solution 4': {
  name: 'Exceptions & Remediation',
  icon: AlertTriangle,
  pages: [
    'Exception Intelligence',
    ...(isFeatureEnabled('risk-signal-hub') ? ['Risk Signal Hub'] : []),
    'Unified Exceptions',
    'Evidence & Audit'
  ],
  accessRoles: ['Admin', 'Compliance'],
},
```

---

## Complete Sequence

1. ✅ **Table created:** `003_platform_features_table.sql` creates table
2. ✅ **Features inserted:** Existing features = 'active', Solution 4 = 'pending'
3. ✅ **PlatformFeatureControl updated:** Saves deployment to database
4. ⏳ **App.js needs update:** Add feature flag checker (code above)

---

## How It Works

### For Platform Owner:
1. Logs in to Platform Admin
2. Goes to "Feature Control"
3. Sees "Risk Signal Hub" with status "PENDING" 🟡
4. Clicks "Preview" to test
5. Clicks "Deploy to 12 Tenants" 🚀
6. Feature status changes to "ACTIVE" ✅
7. All tenants now see "Risk Signal Hub" in Solution 4

### For Tenants:
1. Before deployment: "Risk Signal Hub" is HIDDEN
2. After deployment: "Risk Signal Hub" appears in menu
3. Can access the dashboard

---

## Testing Workflow

### Test 1: Before Deployment
1. Run SQL: `003_platform_features_table.sql`
2. Update App.js with code above
3. Restart app: `npm start`
4. Log in as tenant (not platform owner)
5. Go to Solution 4
6. ✅ Should see: Exception Intelligence, Unified Exceptions, Evidence & Audit
7. ❌ Should NOT see: Risk Signal Hub

### Test 2: Platform Owner Deploys
1. Log in as Platform Owner (fredymanu76@gmail.com)
2. Click "Platform Admin" in sidebar
3. Click "Feature Control"
4. See "Risk Signal Hub" with 🟡 PENDING badge
5. Click "Deploy to 12 Tenants"
6. Watch progress bar
7. ✅ Status changes to ACTIVE

### Test 3: After Deployment
1. Log in as tenant
2. Go to Solution 4
3. ✅ Should NOW see: Risk Signal Hub in menu
4. Click it
5. ✅ Dashboard loads

---

## Quick Reference

### Check feature status in Supabase:
```sql
SELECT id, name, status, deployed_at
FROM platform_features
ORDER BY status;
```

### Manually activate a feature:
```sql
UPDATE platform_features
SET status = 'active', deployed_at = NOW()
WHERE id = 'risk-signal-hub';
```

### Manually deactivate (rollback):
```sql
UPDATE platform_features
SET status = 'inactive'
WHERE id = 'risk-signal-hub';
```

---

## Files to Update

1. ✅ **Supabase:** Run `003_platform_features_table.sql`
2. ✅ **PlatformFeatureControl.jsx:** Already updated
3. ⏳ **App.js:** Add 4 code blocks above
4. ⏳ **Test:** Follow testing workflow

---

Would you like me to create a complete updated App.js file with all changes, or would you prefer to make these edits manually using the code blocks above?
