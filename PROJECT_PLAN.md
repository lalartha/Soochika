# PROJECT_PLAN.md

# Soochika — Panchayat Beneficiary Management & Decision Support System

## 1. Vision
Build a practical web application for rural Panchayats to manage information about elderly citizens (60+) and persons with disabilities (PwDs). The MVP focuses on collecting verified beneficiary data, organizing it centrally, prioritizing cases, tracking requests, and helping Panchayat officials plan welfare interventions.

## 2. Problem
- Data is scattered across paper registers, ASHA workers, Anganwadi records and ward members.
- No unified beneficiary profile.
- Difficult to identify eligible citizens quickly.
- Repeated surveys waste time.
- Limited decision-support.

## 3. Users
- Panchayat Admin
- President/Vice President
- Ward Member
- ASHA Worker
- Anganwadi Worker

## 4. MVP Scope
### Authentication
- Login
- Role-based access

### Dashboard
- Total elderly
- Total PwDs
- Ward distribution
- Pending requests
- Recent updates

### Beneficiary Management
Common fields:
- Name
- Age
- Gender
- Address
- Ward
- Phone
- Emergency contact

Elderly:
- Lives alone
- Bedridden
- Chronic diseases
- Pension status
- Last health check

PwD:
- Disability type
- Disability %
- Certificate upload
- Assistive devices
- Caregiver

### Requests
- Wheelchair
- Walking stick
- Home visit
- Ramp
- Pension support
- Other

Statuses:
Pending → In Progress → Completed

### Search
Filter by ward, age, disability, lives alone, bedridden, request status.

### Analytics
- Ward-wise counts
- Disability categories
- High-priority list
- Pending requests

### Welfare Events
Create event, define eligibility, auto-generate beneficiary list.

### Reports
PDF/Excel export.

## 5. Priority Logic
High:
- Age >75
- Lives alone
- Bedridden
- Disability >70%

Medium:
- Age 60–75
- Moderate disability

Low:
- Independent

## 6. Database Tables
Users
Beneficiaries
DisabilityDetails
HealthDetails
Requests
Events
Documents
AuditLogs

## 7. Suggested Tech Stack
Next.js
TypeScript
Tailwind CSS
Supabase
Supabase Auth
Supabase Storage
Recharts
Vercel

## 8. Future Scope
Offline sync
SMS
Voice calls
Government integration
