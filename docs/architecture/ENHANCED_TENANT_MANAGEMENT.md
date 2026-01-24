# Enhanced Tenant Management System - Implementation Plan

## Features to Implement:

### 1. Tenant Approvals Page Improvements
- ✅ Add "Reject" button next to "Approve"
- ✅ Fix contact_email display (currently showing empty)
- ✅ Make success banner clickable to view tenant details

### 2. Tenant Management Cockpit (New Page)
Features for each tenant:
- **Solution Access Management**
  - Enable/disable each solution (Solution 1-5)
  - Visual toggle switches
  - Real-time status updates

- **Subscription Management**
  - View current plan
  - Upgrade/Downgrade options
  - Reset subscription
  - Revoke/Suspend access
  - Billing history

- **Communication Hub**
  - Send marketing emails
  - View message history
  - Receive tenant messages
  - Two-way chat system

- **Tenant Details**
  - Organization info
  - User list
  - Activity logs
  - Usage statistics

### 3. Tenant-to-Platform Messaging
- Inbox system for platform admin
- Notification badges
- Quick reply functionality
- Message threading

### 4. Modern UI Design
- Beautiful gradient colors
- Smooth animations
- Card-based layouts
- Responsive design
- Professional spacing and typography

## Database Changes Needed:

```sql
-- 1. Add solution access control table
CREATE TABLE tenant_solution_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  solution_number INT NOT NULL CHECK (solution_number BETWEEN 1 AND 5),
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  modified_by UUID REFERENCES platform_admins(user_id),
  UNIQUE(tenant_id, solution_number)
);

-- 2. Add messaging system
CREATE TABLE platform_tenant_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('platform', 'tenant')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 3. Add subscription management
CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  solutions_included INT[] DEFAULT ARRAY[1,2,3,4,5],
  max_users INT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled')),
  modified_by UUID REFERENCES platform_admins(user_id),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Implementation Priority:

1. **Phase 1 (Immediate):**
   - Add Reject button
   - Fix contact_email
   - Create basic tenant details modal

2. **Phase 2 (Next):**
   - Solution access toggles
   - Subscription management UI

3. **Phase 3 (Then):**
   - Messaging system
   - Marketing emails

4. **Phase 4 (Finally):**
   - Polish UI/UX
   - Add animations
   - Responsive design
