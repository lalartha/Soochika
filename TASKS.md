# TASKS.md — Soochika (Panchayat Beneficiary Management System)
> Architecture analysis, implementation roadmap, and ordered task list.
> Generated from: PROJECT_PLAN.md + DPR.md
> DPR takes precedence on all conflicts.

---

## Part 1 — Document Analysis & Reconciliation

### Conflicts / Gaps Resolved

| # | Issue | Source | Decision |
|---|-------|---------|----------|
| 1 | PROJECT_PLAN lists 5 roles; DPR lists "Panchayat officials / ASHA / Anganwadi / Ward members" without naming President/VP separately | PROJECT_PLAN | Collapse to 4 roles: **Admin**, **Ward Member**, **ASHA Worker**, **Anganwadi Worker**. Admin covers President/VP. |
| 2 | PROJECT_PLAN says "PDF/Excel export" under Reports; DPR does not specify export format | PROJECT_PLAN | Include both. PDF via `@react-pdf/renderer`, Excel via `xlsx`. |
| 3 | Welfare Events feature: PROJECT_PLAN says "auto-generate beneficiary list based on eligibility"; DPR lists it as FR8 without detail | PROJECT_PLAN | Implement as: create event → set eligibility filters (ward, age range, disability %, priority) → system queries DB and shows matching list → admin can download. |
| 4 | DPR says pilot = 100–300 beneficiaries, 2 wards; this is important for performance design | DPR | Design for 1,000 beneficiaries, 10 wards to be safe but don't over-index on scale. |
| 5 | "Certificate upload" mentioned for PwD only in PROJECT_PLAN; DPR lists a generic Documents table | DPR | Allow document upload for any beneficiary, typed (disability cert, ID, medical record). |
| 6 | No mention of "registration" flow (who registers beneficiaries?) | DPR FR2 | ASHA / Ward Member can register; Admin can edit / verify / delete. |
| 7 | AuditLogs in PROJECT_PLAN DB table not mentioned in DPR | PROJECT_PLAN | Keep it — essential for production. Auto-log create/update/delete on beneficiaries and requests. |
| 8 | No sign-up flow defined anywhere | Both | No public sign-up. Admin creates user accounts from the dashboard (invite model). |
| 9 | "Large fonts" mentioned in DPR NFR | DPR | Use `text-base` as minimum, `text-lg` for data tables. Respect WCAG AA contrast. |
| 10 | Priority logic is in PROJECT_PLAN only | PROJECT_PLAN | Implement as a server-side computed column / DB function, not in application code, so it stays consistent everywhere. |

### Features Simplified for MVP

- **Offline sync** → deferred (Future Scope). Not in MVP.
- **SMS/Voice** → deferred.
- **GIS mapping** → deferred.
- **Government API integration** → deferred.
- **Welfare Events auto-eligibility** → simplified: filter UI + manual download. No scheduled jobs.
- **Multiple document versions** → not needed in MVP. One document per type per beneficiary is fine.
- **Two-factor auth** → not in MVP. Standard email+password via Supabase Auth.

---

## Part 2 — System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│  Next.js 15 App Router  ·  React  ·  Tailwind  ·  shadcn   │
│  TanStack Table  ·  Recharts  ·  React Hook Form  ·  Zod    │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│              Next.js API Routes  (Route Handlers)           │
│  /api/beneficiaries   /api/requests   /api/events           │
│  /api/reports         /api/users      /api/analytics        │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     Supabase Layer                          │
│  Auth (JWT + RLS)  ·  PostgreSQL  ·  Storage (docs)        │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Server Components by default** — fetch data in RSC, pass to client components only where interactivity is needed.
2. **Row-Level Security (RLS)** on every table — role enforcement at DB level, not just in API routes.
3. **Computed priority column** — PostgreSQL function `compute_priority(age, lives_alone, bedridden, disability_pct)` returns `high | medium | low`. Stored as a generated column so it's always consistent.
4. **Optimistic UI** — for request status updates, use TanStack Query mutations with rollback.
5. **No ORM** — use Supabase JS client directly with typed queries. Keeps it simple and aligned to Supabase patterns.
6. **Typed end-to-end** — generate Supabase DB types, import into API routes and components.

---

## Part 3 — Database Schema

```sql
-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'ward_member', 'asha_worker', 'anganwadi_worker');
CREATE TYPE beneficiary_type AS ENUM ('elderly', 'pwd', 'both');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE request_type AS ENUM ('wheelchair', 'walking_stick', 'home_visit', 'ramp', 'pension_support', 'other');
CREATE TYPE request_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE disability_type AS ENUM ('visual', 'hearing', 'locomotor', 'intellectual', 'multiple', 'other');
CREATE TYPE document_type AS ENUM ('disability_certificate', 'id_proof', 'medical_record', 'other');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete');

-- USERS (mirrors Supabase Auth, stores role + metadata)
CREATE TABLE users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  role         user_role NOT NULL DEFAULT 'asha_worker',
  ward_number  SMALLINT,                  -- NULL = access to all wards (admin)
  phone        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BENEFICIARIES
CREATE TABLE beneficiaries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type                beneficiary_type NOT NULL,
  full_name           TEXT NOT NULL,
  date_of_birth       DATE NOT NULL,
  age                 SMALLINT GENERATED ALWAYS AS (
                        DATE_PART('year', AGE(date_of_birth))::SMALLINT
                      ) STORED,
  gender              gender NOT NULL,
  address             TEXT NOT NULL,
  ward_number         SMALLINT NOT NULL,
  phone               TEXT,
  emergency_contact   TEXT,
  is_verified         BOOLEAN NOT NULL DEFAULT FALSE,
  priority            priority_level GENERATED ALWAYS AS (
                        compute_priority(
                          DATE_PART('year', AGE(date_of_birth))::SMALLINT,
                          COALESCE((SELECT lives_alone FROM health_details WHERE beneficiary_id = id), FALSE),
                          COALESCE((SELECT is_bedridden FROM health_details WHERE beneficiary_id = id), FALSE),
                          COALESCE((SELECT disability_percentage FROM disability_details WHERE beneficiary_id = id), 0)
                        )
                      ) STORED,
  registered_by       UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTE: Because GENERATED columns cannot reference other tables,
-- priority will be a regular column updated via a DB trigger instead.
-- See migration notes below.

-- HEALTH DETAILS (elderly-specific, nullable for PwD-only)
CREATE TABLE health_details (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id    UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
  lives_alone       BOOLEAN NOT NULL DEFAULT FALSE,
  is_bedridden      BOOLEAN NOT NULL DEFAULT FALSE,
  chronic_diseases  TEXT[],              -- e.g. ['diabetes', 'hypertension']
  pension_status    TEXT,               -- 'receiving' | 'applied' | 'not_applied'
  last_health_check DATE,
  notes             TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DISABILITY DETAILS (PwD-specific)
CREATE TABLE disability_details (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id        UUID NOT NULL UNIQUE REFERENCES beneficiaries(id) ON DELETE CASCADE,
  disability_type       disability_type NOT NULL,
  disability_percentage SMALLINT NOT NULL CHECK (disability_percentage BETWEEN 0 AND 100),
  certificate_number    TEXT,
  assistive_devices     TEXT[],         -- e.g. ['wheelchair', 'hearing_aid']
  has_caregiver         BOOLEAN NOT NULL DEFAULT FALSE,
  caregiver_name        TEXT,
  caregiver_phone       TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- REQUESTS
CREATE TABLE requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  request_type   request_type NOT NULL,
  other_details  TEXT,                  -- used when type = 'other'
  status         request_status NOT NULL DEFAULT 'pending',
  notes          TEXT,
  raised_by      UUID REFERENCES users(id),
  assigned_to    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- EVENTS (welfare camps, health drives, etc.)
CREATE TABLE events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  event_date          DATE NOT NULL,
  location            TEXT,
  -- Eligibility filters (NULL = no filter applied)
  eligibility_wards   SMALLINT[],
  eligibility_types   beneficiary_type[],
  min_age             SMALLINT,
  max_age             SMALLINT,
  min_disability_pct  SMALLINT,
  priority_filter     priority_level[],
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  doc_type       document_type NOT NULL,
  file_name      TEXT NOT NULL,
  storage_path   TEXT NOT NULL,        -- Supabase Storage path
  uploaded_by    UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  action      audit_action NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  performed_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_beneficiaries_ward ON beneficiaries(ward_number);
CREATE INDEX idx_beneficiaries_type ON beneficiaries(type);
CREATE INDEX idx_beneficiaries_priority ON beneficiaries(priority);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_beneficiary ON requests(beneficiary_id);
CREATE INDEX idx_audit_record ON audit_logs(table_name, record_id);
```

### Priority Trigger (replaces generated column)

```sql
CREATE OR REPLACE FUNCTION recompute_priority(
  p_age SMALLINT,
  p_lives_alone BOOLEAN,
  p_is_bedridden BOOLEAN,
  p_disability_pct SMALLINT
) RETURNS priority_level AS $$
BEGIN
  IF p_age > 75 OR p_lives_alone = TRUE OR p_is_bedridden = TRUE OR p_disability_pct > 70 THEN
    RETURN 'high';
  ELSIF (p_age BETWEEN 60 AND 75) OR (p_disability_pct BETWEEN 1 AND 70) THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger fires on INSERT/UPDATE of beneficiaries, health_details, disability_details
```

### RLS Policy Summary

| Table | Admin | Ward Member | ASHA Worker | Anganwadi Worker |
|-------|-------|-------------|-------------|-----------------|
| beneficiaries | All wards R/W | Own ward R/W | Own ward R/W | Own ward R |
| health_details | All R/W | Own ward R/W | Own ward R/W | Own ward R |
| disability_details | All R/W | Own ward R/W | Own ward R/W | Own ward R |
| requests | All R/W | Own ward R/W | Own ward R/W | No access |
| events | All R/W | R only | R only | R only |
| documents | All R/W | Own ward R/W | Own ward R/W | No access |
| users | All R/W | Self R | Self R | Self R |
| audit_logs | R only | No | No | No |

---

## Part 4 — Folder Structure

```
pbms/
├── app/                              # Next.js App Router
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Shell: sidebar + topbar
│   │   ├── page.tsx                  # Dashboard home
│   │   ├── beneficiaries/
│   │   │   ├── page.tsx              # List + search
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Register beneficiary
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Profile view
│   │   │       └── edit/
│   │   │           └── page.tsx      # Edit beneficiary
│   │   ├── requests/
│   │   │   ├── page.tsx              # All requests list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Request detail
│   │   ├── events/
│   │   │   ├── page.tsx              # Events list
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Event + beneficiary list
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx              # Admin: user management
│   │       └── users/
│   │           └── new/
│   │               └── page.tsx
│   └── api/
│       ├── beneficiaries/
│       │   └── route.ts
│       ├── requests/
│       │   └── route.ts
│       ├── events/
│       │   └── route.ts
│       ├── analytics/
│       │   └── route.ts
│       └── reports/
│           └── route.ts
│
├── components/
│   ├── ui/                           # shadcn/ui (auto-generated, do not edit)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   └── PageHeader.tsx
│   ├── dashboard/
│   │   ├── StatCard.tsx
│   │   ├── WardDistributionChart.tsx
│   │   ├── DisabilityCategoryChart.tsx
│   │   ├── PendingRequestsWidget.tsx
│   │   └── RecentActivityFeed.tsx
│   ├── beneficiaries/
│   │   ├── BeneficiaryTable.tsx
│   │   ├── BeneficiaryFilters.tsx
│   │   ├── BeneficiaryForm.tsx       # Used for new + edit
│   │   ├── BeneficiaryProfile.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── HealthDetailsForm.tsx
│   │   └── DisabilityDetailsForm.tsx
│   ├── requests/
│   │   ├── RequestTable.tsx
│   │   ├── RequestForm.tsx
│   │   ├── RequestStatusBadge.tsx
│   │   └── RequestStatusUpdater.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   ├── EventForm.tsx
│   │   └── EventBeneficiaryList.tsx
│   ├── documents/
│   │   ├── DocumentUploader.tsx
│   │   └── DocumentList.tsx
│   └── shared/
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       ├── PagedTable.tsx            # Generic TanStack Table wrapper
│       ├── SearchInput.tsx
│       └── RoleBadge.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (RSC / Route Handlers)
│   │   └── middleware.ts             # Session refresh
│   ├── db/
│   │   ├── beneficiaries.ts          # DB query functions
│   │   ├── requests.ts
│   │   ├── events.ts
│   │   ├── analytics.ts
│   │   └── users.ts
│   ├── validations/
│   │   ├── beneficiary.ts            # Zod schemas
│   │   ├── request.ts
│   │   ├── event.ts
│   │   └── user.ts
│   ├── utils/
│   │   ├── priority.ts               # Client-side priority helper (mirrors DB fn)
│   │   ├── formatters.ts             # Date, name, phone formatters
│   │   └── export.ts                 # PDF + Excel generation helpers
│   └── constants/
│       ├── roles.ts
│       ├── requestTypes.ts
│       └── disabilityTypes.ts
│
├── hooks/
│   ├── useBeneficiaries.ts
│   ├── useRequests.ts
│   ├── useAnalytics.ts
│   └── useCurrentUser.ts
│
├── types/
│   ├── database.ts                   # Supabase generated types
│   └── app.ts                        # App-level types + enums
│
├── middleware.ts                     # Auth guard (protects /dashboard/*)
├── supabase/
│   ├── migrations/                   # SQL migration files
│   └── seed.sql                      # Dev seed data
└── public/
    └── logo.svg
```

---

## Part 5 — Route Structure

| Route | Access | Description |
|-------|--------|-------------|
| `/login` | Public | Email + password login |
| `/` | → redirect | Redirects to `/` dashboard or `/login` |
| `/(dashboard)` | Authenticated | Shell layout |
| `/` | All roles | Dashboard with stats + charts |
| `/beneficiaries` | All roles | Searchable table of beneficiaries |
| `/beneficiaries/new` | Admin, Ward Member, ASHA | Registration form |
| `/beneficiaries/[id]` | All roles | Full profile view |
| `/beneficiaries/[id]/edit` | Admin, Ward Member | Edit form |
| `/requests` | Admin, Ward Member | All requests with filters |
| `/requests/[id]` | Admin, Ward Member | Detail + status update |
| `/events` | All roles | List of welfare events |
| `/events/new` | Admin only | Create event + eligibility |
| `/events/[id]` | All roles | Event detail + matched beneficiary list |
| `/analytics` | Admin, Ward Member | Charts + high-priority list |
| `/reports` | Admin | Export controls |
| `/settings` | Admin only | User management |
| `/settings/users/new` | Admin only | Create user account |

---

## Part 6 — Component Hierarchy

```
RootLayout
└── (auth) layout — no sidebar
    └── LoginPage
        └── LoginForm

└── (dashboard) Layout
    ├── Sidebar
    │   ├── NavItem × n
    │   └── UserAvatar + logout
    ├── TopBar
    │   └── PageTitle · BreadCrumb
    └── <page slot>
        │
        ├── DashboardPage
        │   ├── StatCard × 4
        │   ├── WardDistributionChart
        │   ├── DisabilityCategoryChart
        │   └── PendingRequestsWidget
        │
        ├── BeneficiariesPage
        │   ├── BeneficiaryFilters
        │   └── BeneficiaryTable → PriorityBadge
        │
        ├── BeneficiaryNewPage / EditPage
        │   └── BeneficiaryForm
        │       ├── HealthDetailsForm (if elderly or both)
        │       ├── DisabilityDetailsForm (if pwd or both)
        │       └── DocumentUploader
        │
        ├── BeneficiaryProfilePage
        │   ├── BeneficiaryProfile
        │   │   ├── PriorityBadge
        │   │   ├── HealthDetailsForm (read-only)
        │   │   └── DisabilityDetailsForm (read-only)
        │   ├── DocumentList
        │   └── RequestForm + RequestTable (beneficiary's requests)
        │
        ├── RequestsPage
        │   └── RequestTable → RequestStatusBadge
        │
        ├── EventsPage / EventNewPage / EventDetailPage
        │   ├── EventCard / EventForm
        │   └── EventBeneficiaryList
        │
        ├── AnalyticsPage
        │   ├── WardDistributionChart
        │   ├── DisabilityCategoryChart
        │   ├── PendingRequestsWidget
        │   └── BeneficiaryTable (high-priority filter)
        │
        ├── ReportsPage
        │   └── Export controls (PDF / Excel)
        │
        └── SettingsPage
            └── UsersTable + UserForm
```

---

## Part 7 — Development Milestones

| Phase | Name | Scope | Dependency |
|-------|------|-------|------------|
| 0 | **Foundation** | Supabase setup, DB migrations, types, auth config | None |
| 1 | **Auth + Shell** | Login page, middleware, sidebar, role guard | Phase 0 |
| 2 | **Beneficiary Core** | Registration, list, profile, search, filters | Phase 1 |
| 3 | **Requests** | Create request from profile, list, status update | Phase 2 |
| 4 | **Dashboard** | Stat cards, charts, recent activity | Phase 2 |
| 5 | **Events** | Create event, eligibility filters, beneficiary list | Phase 2 |
| 6 | **Analytics** | Full analytics page, high-priority list | Phase 4 |
| 7 | **Reports** | PDF export, Excel export | Phase 2 |
| 8 | **Admin Settings** | User management (create, deactivate, assign ward) | Phase 1 |
| 9 | **Hardening** | RLS policies, audit log trigger, accessibility pass, mobile QA | All |

---

## Part 8 — TASKS (Dependency Order)

### Phase 0 — Foundation

- [ ] **T-001** Initialize Next.js 15 project with TypeScript, Tailwind, ESLint
- [ ] **T-002** Install and configure shadcn/ui
- [ ] **T-003** Create Supabase project; note URL + anon key + service role key
- [ ] **T-004** Write migration 001: enums
- [ ] **T-005** Write migration 002: `users` table + RLS
- [ ] **T-006** Write migration 003: `beneficiaries` table
- [ ] **T-007** Write migration 004: `health_details` + `disability_details`
- [ ] **T-008** Write migration 005: `requests` table
- [ ] **T-009** Write migration 006: `events` table
- [ ] **T-010** Write migration 007: `documents` table + Storage bucket
- [ ] **T-011** Write migration 008: `audit_logs` table + trigger function
- [ ] **T-012** Write migration 009: `compute_priority` function + beneficiary priority trigger
- [ ] **T-013** Write migration 010: all indexes
- [ ] **T-014** Write migration 011: all RLS policies
- [ ] **T-015** Generate Supabase TypeScript types → `types/database.ts`
- [ ] **T-016** Create `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [ ] **T-017** Create `middleware.ts` (Next.js) for session refresh + auth redirect
- [ ] **T-018** Write `seed.sql` with 2 wards, 5 users, 20 beneficiaries for dev

### Phase 1 — Auth + Shell

- [ ] **T-101** Build `/login` page with LoginForm (email + password, React Hook Form + Zod)
- [ ] **T-102** Wire Supabase Auth sign-in, handle errors
- [ ] **T-103** Build `(dashboard)/layout.tsx` — Sidebar + TopBar shell
- [ ] **T-104** Build `Sidebar` component with role-based nav items
- [ ] **T-105** Build `TopBar` with user info + logout
- [ ] **T-106** Build `useCurrentUser` hook (reads from Supabase session + users table)
- [ ] **T-107** Role-guard HOC / middleware: redirect to `/login` if unauthenticated
- [ ] **T-108** Test: login → dashboard redirect, logout → login redirect

### Phase 2 — Beneficiary Core

- [ ] **T-201** Write Zod schemas in `lib/validations/beneficiary.ts`
- [ ] **T-202** Write DB query functions in `lib/db/beneficiaries.ts`
- [ ] **T-203** Build `BeneficiaryForm` (common fields + conditional sections)
- [ ] **T-204** Build `HealthDetailsForm` sub-form
- [ ] **T-205** Build `DisabilityDetailsForm` sub-form
- [ ] **T-206** Build `DocumentUploader` (Supabase Storage)
- [ ] **T-207** Build `/beneficiaries/new` page
- [ ] **T-208** Build `BeneficiaryTable` with TanStack Table (server-side pagination)
- [ ] **T-209** Build `BeneficiaryFilters` (ward, type, priority, lives alone, bedridden)
- [ ] **T-210** Build `/beneficiaries` list page
- [ ] **T-211** Build `BeneficiaryProfile` component
- [ ] **T-212** Build `PriorityBadge` component
- [ ] **T-213** Build `/beneficiaries/[id]` profile page
- [ ] **T-214** Build `/beneficiaries/[id]/edit` page (reuses BeneficiaryForm)
- [ ] **T-215** Build `DocumentList` component
- [ ] **T-216** Test: CRUD flow, priority display, filter results, role access

### Phase 3 — Requests

- [ ] **T-301** Write Zod schemas in `lib/validations/request.ts`
- [ ] **T-302** Write DB query functions in `lib/db/requests.ts`
- [ ] **T-303** Build `RequestForm` component (type, notes, raises on behalf of beneficiary)
- [ ] **T-304** Build `RequestStatusUpdater` (Pending → In Progress → Completed dropdown)
- [ ] **T-305** Build `RequestTable` with filters (status, type, ward)
- [ ] **T-306** Embed `RequestForm` + `RequestTable` in beneficiary profile page
- [ ] **T-307** Build `/requests` global list page
- [ ] **T-308** Build `/requests/[id]` detail + status update page
- [ ] **T-309** Test: create request, update status, filter by status

### Phase 4 — Dashboard

- [ ] **T-401** Write analytics query functions in `lib/db/analytics.ts`
- [ ] **T-402** Build `StatCard` component
- [ ] **T-403** Build `WardDistributionChart` (Recharts bar chart)
- [ ] **T-404** Build `DisabilityCategoryChart` (Recharts pie chart)
- [ ] **T-405** Build `PendingRequestsWidget` (count by type)
- [ ] **T-406** Build `RecentActivityFeed` (last 10 audit log entries)
- [ ] **T-407** Build `/` dashboard page (RSC, parallel data fetch)
- [ ] **T-408** Test: charts render correctly, counts accurate

### Phase 5 — Events

- [ ] **T-501** Write Zod schemas in `lib/validations/event.ts`
- [ ] **T-502** Write DB query functions in `lib/db/events.ts`
- [ ] **T-503** Build `EventForm` (title, date, location, eligibility filters)
- [ ] **T-504** Build `EventCard` component
- [ ] **T-505** Build `EventBeneficiaryList` — queries DB using event eligibility criteria
- [ ] **T-506** Build `/events` list page
- [ ] **T-507** Build `/events/new` page (admin only)
- [ ] **T-508** Build `/events/[id]` detail page with beneficiary list + download
- [ ] **T-509** Test: create event with eligibility, verify beneficiary list

### Phase 6 — Analytics

- [ ] **T-601** Build `/analytics` page with all charts
- [ ] **T-602** Build high-priority beneficiary table section
- [ ] **T-603** Add ward selector to filter all analytics charts
- [ ] **T-604** Test: filter changes update all widgets

### Phase 7 — Reports

- [ ] **T-701** Install `@react-pdf/renderer` + `xlsx`
- [ ] **T-702** Build `lib/utils/export.ts` — PDF layout for beneficiary list
- [ ] **T-703** Build Excel export helper
- [ ] **T-704** Build `/reports` page with filter controls + export buttons
- [ ] **T-705** Test: download PDF and Excel, verify data accuracy

### Phase 8 — Admin Settings

- [ ] **T-801** Build `/settings` page with user table
- [ ] **T-802** Build `UserForm` (create user: name, email, role, ward)
- [ ] **T-803** Wire Supabase Admin API to create auth user + insert into `users` table
- [ ] **T-804** Add deactivate/reactivate user action
- [ ] **T-805** Test: create user, assign ward, verify role-based access

### Phase 9 — Hardening

- [ ] **T-901** Audit all RLS policies with each role in Supabase dashboard
- [ ] **T-902** Verify audit trigger fires on all mutations
- [ ] **T-903** Accessibility pass: focus order, ARIA labels, color contrast, large fonts
- [ ] **T-904** Mobile responsiveness pass (target: 375px min width)
- [ ] **T-905** Error boundary + loading states for all async pages
- [ ] **T-906** Environment variable validation on startup
- [ ] **T-907** Final end-to-end test: full workflow from registration → request → event → report

---

## Part 9 — Suggested MVP Improvements

These are improvements that add real-world value without scope creep:

1. **Verification flag on beneficiaries** — The DPR workflow includes a "Verification" step. The DB has `is_verified`. Add a simple one-click "Mark as Verified" button visible to Admin/Ward Member on the profile page.

2. **Soft delete on beneficiaries** — Add `deleted_at TIMESTAMPTZ` instead of hard deletes. Prevents accidental data loss in the field.

3. **Request assignment** — The `requests` table already has `assigned_to`. Surface this as a dropdown on the request detail page so admin can assign to a specific ward member.

4. **Chronic disease quick chips** — Instead of a free-text field for chronic diseases, provide a multi-select with common options (diabetes, hypertension, cardiac, COPD, arthritis) + "other". Avoids inconsistent spellings that break analytics.

5. **Photo upload for beneficiaries** — A profile photo (optional) makes the system far more usable in the field where literacy is limited. One extra storage path column on the beneficiaries table.

6. **Pension status as an enum** — `pension_status` is currently free text. Use: `receiving | applied | not_applied | not_eligible` for consistent filtering.

7. **Print-friendly profile** — A browser `@media print` CSS rule on the profile page gives a quick way to hand a physical copy to a ward member without building a full PDF pipeline.

8. **Session timeout warning** — Supabase sessions expire. Show a "Your session will expire in 5 minutes" toast to prevent data loss mid-form.

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 78 |
| Phases | 9 |
| DB tables | 8 |
| DB enums | 9 |
| App routes | 16 |
| Reusable components | ~28 |
| Estimated dev time (solo) | 6–8 weeks |
| Estimated dev time (2 devs) | 3–4 weeks |

**Start with Phase 0. Do not write application code until migrations are tested and types are generated.**
