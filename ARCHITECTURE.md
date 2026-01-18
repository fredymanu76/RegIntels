# RegIntels Architecture Overview

Visual reference for the RegIntels application architecture and data flow.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    React Application                     │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Dashboard  │  │  Policies    │  │  Controls      │  │  │
│  │  │ Components │  │  Management  │  │  Management    │  │  │
│  │  └────────────┘  └──────────────┘  └────────────────┘  │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │ Exceptions │  │  Risks       │  │  Reg Changes   │  │  │
│  │  │ Tracking   │  │  Register    │  │  Monitoring    │  │  │
│  │  └────────────┘  └──────────────┘  └────────────────┘  │  │
│  │                                                          │  │
│  │                  @supabase/supabase-js                   │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ HTTPS (anon key)
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      SUPABASE LAYER                             │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────┐  │
│  │   Auth Service   │  │  Database API    │  │   Storage   │  │
│  │                  │  │   (PostgREST)    │  │   Service   │  │
│  │  - JWT Tokens    │  │  - Row Level     │  │  - S3 compat│  │
│  │  - Email Auth    │  │    Security      │  │  - File CRUD│  │
│  │  - Session Mgmt  │  │  - REST API      │  │             │  │
│  └────────┬─────────┘  └─────────┬────────┘  └──────┬──────┘  │
│           │                      │                    │         │
│           └──────────────┬───────┴────────────────────┘         │
│                          │                                      │
│  ┌───────────────────────▼─────────────────────────────────┐   │
│  │              PostgreSQL Database                        │   │
│  │                                                          │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   tenants    │  │user_profiles │  │   policies   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │   │
│  │  │   controls   │  │  reg_changes │  │  exceptions  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │   │
│  │  ┌──────────────┐                                       │   │
│  │  │    risks     │         + RLS Policies                │   │
│  │  └──────────────┘         + Indexes                     │   │
│  │                           + Triggers                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       │ 1. Enter email/password
       │
       ▼
┌──────────────────────┐
│  Login Component     │
│  (React)             │
└──────┬───────────────┘
       │
       │ 2. supabase.auth.signInWithPassword()
       │
       ▼
┌──────────────────────┐
│  Supabase Auth       │
│                      │
│  - Verify password   │
│  - Generate JWT      │
│  - Create session    │
└──────┬───────────────┘
       │
       │ 3. Return { user, session }
       │
       ▼
┌──────────────────────┐
│  App.js              │
│                      │
│  - Fetch user_profile│
│  - Fetch tenant      │
│  - Set current user  │
└──────┬───────────────┘
       │
       │ 4. Render dashboard
       │
       ▼
┌──────────────────────┐
│  RegIntels Dashboard │
└──────────────────────┘
```

---

## Data Access Flow (with RLS)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Request: "Get all policies"                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. React Component                                          │
│    const { data } = await supabase                          │
│      .from('policies')                                      │
│      .select('*')                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP GET with JWT token
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Supabase PostgREST API                                   │
│    - Verify JWT token                                       │
│    - Extract user_id from token                             │
│    - Forward to PostgreSQL                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ SQL Query
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. PostgreSQL with RLS                                      │
│    a) Get tenant_id for user:                               │
│       SELECT tenant_id FROM user_profiles                   │
│       WHERE user_id = auth.uid()                            │
│                                                              │
│    b) Apply RLS policy:                                     │
│       SELECT * FROM policies                                │
│       WHERE tenant_id = <user's tenant_id>                  │
│                                                              │
│    c) Return filtered results                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ JSON Response
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. React Component                                          │
│    - Receives only tenant's policies                        │
│    - Updates state                                          │
│    - Renders UI                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Data Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      policies table                       │  │
│  ├────────┬──────────────┬──────────────┬───────────────────┤  │
│  │   id   │  tenant_id   │    title     │      status       │  │
│  ├────────┼──────────────┼──────────────┼───────────────────┤  │
│  │   1    │  tenant-A    │  AML Policy  │     active        │  │◄──┐
│  │   2    │  tenant-A    │  COI Policy  │     active        │  │   │
│  │   3    │  tenant-B    │  AML Policy  │     active        │  │   │ RLS filters
│  │   4    │  tenant-B    │  Data Policy │     draft         │  │   │ to tenant-A
│  │   5    │  tenant-C    │  Risk Policy │     active        │  │   │ rows only
│  └────────┴──────────────┴──────────────┴───────────────────┘  │   │
│                                                                 │   │
│  RLS Policy:                                                    │   │
│  ┌──────────────────────────────────────────────────────────┐  │   │
│  │ CREATE POLICY "Users can view policies in their tenant"  │  │   │
│  │   ON policies FOR SELECT                                 │  │   │
│  │   USING (tenant_id = get_user_tenant_id());              │  │   │
│  └──────────────────────────────────────────────────────────┘  │   │
│                                                                 │   │
│  ┌──────────────────────────────────────────────────────────┐  │   │
│  │ User from Tenant A queries: SELECT * FROM policies;      │  │   │
│  │                                                           │  │   │
│  │ PostgreSQL returns:                                       │  │───┘
│  │   1 | tenant-A | AML Policy  | active                    │  │
│  │   2 | tenant-A | COI Policy  | active                    │  │
│  │                                                           │  │
│  │ (Tenant B and C rows are invisible to Tenant A)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Upload Flow

```
┌─────────────┐
│   User      │
│ Selects PDF │
└──────┬──────┘
       │
       │ 1. File selected
       │
       ▼
┌──────────────────────┐
│  React Component     │
│  handleFileUpload()  │
└──────┬───────────────┘
       │
       │ 2. Upload file
       │    Path: {tenant_id}/policy-v1.0.pdf
       │
       ▼
┌──────────────────────┐
│  Supabase Storage    │
│  RLS Check:          │
│  - User authenticated?│
│  - Path starts with  │
│    user's tenant_id? │
└──────┬───────────────┘
       │
       │ 3a. RLS ✓ → Upload file
       │ 3b. RLS ✗ → Reject
       │
       ▼
┌──────────────────────┐
│  Storage Bucket      │
│  policy-documents/   │
│    ├─ tenant-A/      │
│    │   └─ policy.pdf │◄─── Stored here
│    ├─ tenant-B/      │
│    │   └─ doc.pdf    │
│    └─ tenant-C/      │
│        └─ file.pdf   │
└──────┬───────────────┘
       │
       │ 4. Return file URL
       │
       ▼
┌──────────────────────┐
│  React Component     │
│  - Save URL to DB    │
│  - Display success   │
└──────────────────────┘
```

---

## Database Entity Relationships

```
                    ┌─────────────────┐
                    │   auth.users    │ (Supabase managed)
                    │                 │
                    │ - id (UUID) PK  │
                    │ - email         │
                    └────────┬────────┘
                             │
                             │ 1:1
                             │
                    ┌────────▼────────┐
                    │ user_profiles   │
                    │                 │
                    │ - id PK         │
                    │ - user_id FK    │
                    │ - tenant_id FK  │───┐
                    │ - role          │   │
                    └─────────────────┘   │
                                          │ N:1
                                          │
                    ┌─────────────────────▼──────┐
                    │       tenants              │
                    │                            │
                    │ - id (UUID) PK             │
                    │ - name                     │
                    │ - regime                   │
                    │ - status                   │
                    └─────────┬──────────────────┘
                              │
                              │ 1:N (for all tables below)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │                     │                     │
┌───────▼────────┐   ┌────────▼─────────┐   ┌──────▼──────┐
│   policies     │   │    controls      │   │ reg_changes │
│                │   │                  │   │             │
│ - id PK        │   │ - id PK          │   │ - id PK     │
│ - tenant_id FK │   │ - tenant_id FK   │   │ - tenant_id │
│ - title        │   │ - control_code   │   │ - title     │
│ - version      │   │ - title          │   │ - impact    │
│ - status       │   │ - frequency      │   │ - status    │
│ - owner_id FK  │   │ - owner_id FK    │   └─────────────┘
└────────────────┘   └──────────────────┘
                              │
                              │ 1:N (soft reference)
                              │
                     ┌────────▼─────────┐   ┌─────────────┐
                     │   exceptions     │   │    risks    │
                     │                  │   │             │
                     │ - id PK          │   │ - id PK     │
                     │ - tenant_id FK   │   │ - tenant_id │
                     │ - source_type    │   │ - name      │
                     │ - source_id      │   │ - inherent  │
                     │ - severity       │   │ - residual  │
                     │ - status         │   │ - owner_id  │
                     └──────────────────┘   └─────────────┘

Legend:
  PK = Primary Key
  FK = Foreign Key
  ─── = One-to-Many relationship
  ═══ = Many-to-Many relationship
```

---

## User Journey Map

### New Organization Onboarding

```
START
  │
  ├─→ 1. User visits app
  │      URL: https://regintels.app
  │
  ├─→ 2. Click "Start Onboarding"
  │
  ├─→ 3. Enter organization details
  │      - Company name
  │      - Regulatory regime (API/CASS/SYSC)
  │      - FRN (optional)
  │
  ├─→ 4. Create admin account
  │      - Email
  │      - Password (8+ chars, uppercase, lowercase, number)
  │      - Name
  │
  ├─→ 5. Supabase creates:
  │      a) auth.users record
  │      b) tenants record (status: 'pending')
  │      c) user_profiles record (role: 'Admin')
  │
  ├─→ 6. Email verification sent
  │      Subject: "Welcome to RegIntels!"
  │      Link: https://regintels.app/auth/confirm?token=...
  │
  ├─→ 7. User clicks link
  │      - Email confirmed
  │      - Tenant status → 'active'
  │
  ├─→ 8. Redirect to login
  │
  ├─→ 9. User signs in
  │      - JWT token issued
  │      - Session created
  │
  └─→ 10. Dashboard loads
         - Show welcome message
         - Prompt to create first policy
END
```

### Daily User Workflow

```
START
  │
  ├─→ 1. User signs in
  │      Email: user@company.com
  │      Password: ********
  │
  ├─→ 2. Dashboard loads
  │      - 12 active policies
  │      - 3 open exceptions
  │      - 2 new reg changes
  │
  ├─→ 3. User clicks "Exceptions"
  │
  ├─→ 4. View exceptions list
  │      [HIGH] DSAR breach - 35 days
  │      [MED]  Late CDD completion
  │      [LOW]  Missing documentation
  │
  ├─→ 5. Click on high severity exception
  │
  ├─→ 6. View exception details
  │      - Description
  │      - Opened date
  │      - Assigned to: Mike Chen
  │      - Related control: DATA-001
  │
  ├─→ 7. Update status to "remediation"
  │      Add note: "Implementing automated reminders"
  │
  ├─→ 8. Upload evidence
  │      File: remediation-plan.pdf
  │      Uploads to: storage/tenant-id/remediation-plan.pdf
  │
  ├─→ 9. Save changes
  │      - Database updated
  │      - Notification sent to Mike
  │
  └─→ 10. Return to dashboard
         - Exception count: 2 (updated)
END
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                              │
│  Layer 1: Network Security                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - HTTPS/TLS encryption                               │   │
│  │ - Rate limiting                                       │   │
│  │ - DDoS protection                                     │   │
│  │ - CORS configuration                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│  Layer 2: Authentication                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Email/password authentication                       │   │
│  │ - JWT tokens (1 hour expiry)                          │   │
│  │ - Refresh tokens (30 days)                            │   │
│  │ - Email verification required                         │   │
│  │ - Password requirements enforced                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│  Layer 3: Authorization (RLS)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Row Level Security on all tables                    │   │
│  │ - Tenant-based data isolation                         │   │
│  │ - Role-based access control                           │   │
│  │ - Admin-only operations protected                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│  Layer 4: Data Protection                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Encryption at rest (database)                       │   │
│  │ - Encryption in transit (TLS)                         │   │
│  │ - Automatic backups                                   │   │
│  │ - Audit logging                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ▼                                  │
│  Layer 5: Storage Security                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ - Private buckets (not public)                        │   │
│  │ - Folder-based tenant isolation                       │   │
│  │ - Storage RLS policies                                │   │
│  │ - File type restrictions                              │   │
│  │ - Size limits enforced                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

### Development Environment

```
┌─────────────────────────────────────────────┐
│          Developer Machine                  │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   React App (localhost:3000)        │   │
│  │   npm start                          │   │
│  └──────────────┬──────────────────────┘   │
│                 │                           │
│                 │ .env.local                │
│                 │ - DEV_SUPABASE_URL        │
│                 │ - DEV_SUPABASE_KEY        │
│                 │                           │
└─────────────────┼───────────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────────┐
│      Supabase Dev Project                   │
│      (dev-project.supabase.co)              │
│                                             │
│  - Test data                                │
│  - Email sandbox                            │
│  - Debug logging enabled                    │
└─────────────────────────────────────────────┘
```

### Production Environment

```
┌─────────────────────────────────────────────┐
│              End Users                      │
│       (browsers, mobile devices)            │
└──────────────┬──────────────────────────────┘
               │
               │ HTTPS
               │
┌──────────────▼──────────────────────────────┐
│         CDN / Hosting                       │
│         (Vercel / Netlify / AWS)            │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   React App (Production Build)      │   │
│  │   - Minified JS/CSS                  │   │
│  │   - Environment variables injected   │   │
│  └──────────────┬──────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
                  │ HTTPS
                  │
┌─────────────────▼───────────────────────────┐
│      Supabase Production Project            │
│      (prod-project.supabase.co)             │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   PostgreSQL Database               │   │
│  │   - Auto backups (daily)            │   │
│  │   - Point-in-time recovery          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Auth Service                      │   │
│  │   - Custom SMTP configured          │   │
│  │   - Email verification enabled      │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │   Storage Service                   │   │
│  │   - Private buckets                 │   │
│  │   - CDN enabled                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Monitoring & Logging enabled               │
└─────────────────────────────────────────────┘
```

---

## Performance Considerations

### Database Query Optimization

```
Bad Query (Full table scan):
┌──────────────────────────────┐
│ SELECT * FROM policies       │
│ WHERE title LIKE '%AML%'     │◄─── Slow! No index on title
└──────────────────────────────┘
         Execution time: 250ms


Good Query (Indexed):
┌──────────────────────────────┐
│ SELECT * FROM policies       │
│ WHERE tenant_id = 'xxx'      │◄─── Fast! Uses idx_policies_tenant_id
│   AND status = 'active'      │◄─── Fast! Uses idx_policies_status
└──────────────────────────────┘
         Execution time: 5ms
```

### Caching Strategy

```
First Request:
  User → React → Supabase → PostgreSQL → Supabase → React → User
  [────────────────────────── 200ms ──────────────────────────]

Subsequent Requests (with React Query):
  User → React (cache hit) → User
  [─────── 5ms ──────────]

Cache invalidation:
  - On data mutation (insert/update/delete)
  - Manual refresh button
  - 5 minute stale time
```

---

## Scaling Considerations

### Horizontal Scaling (Multi-Region)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   US Users  │     │   EU Users  │     │  APAC Users │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       │                   │                    │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  US CDN     │     │  EU CDN     │     │ APAC CDN    │
│  (Vercel)   │     │  (Vercel)   │     │  (Vercel)   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                    │
       └───────────────────┼────────────────────┘
                           │
                  ┌────────▼────────┐
                  │  Supabase       │
                  │  Primary Region │
                  │  (us-east-1)    │
                  └─────────────────┘
```

### Vertical Scaling (Database)

```
Free Tier:
  - 500MB database
  - Shared CPU
  - Up to 50MB file uploads

Pro Tier ($25/month):
  - 8GB database
  - Dedicated resources
  - Up to 5GB file uploads
  - Point-in-time recovery

Team/Enterprise:
  - Custom sizing
  - High availability
  - Custom support
```

---

This architecture document provides visual references for understanding how RegIntels is structured. For implementation details, refer to the other setup guides.
