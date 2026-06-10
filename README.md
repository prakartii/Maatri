# Maatri 👩‍⚕️

AI-powered maternal healthcare platform for early risk detection, referral management, QR-based patient identity, and rural healthcare analytics.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat)
![Healthcare](https://img.shields.io/badge/Healthcare-Maternal-E91E63?style=flat)

---

## Problem Statement

Rural maternal healthcare breaks down in four predictable places:

| Gap | Impact |
|-----|--------|
| **Delayed risk detection** | High-risk pregnancies identified too late |
| **Broken referral chains** | No visibility from village referral to hospital admission |
| **Connectivity barriers** | Field data lost when networks fail |
| **Fragmented records** | History trapped in paper registers and verbal handoffs |

**Maatri** closes the loop — automated risk scoring, end-to-end referrals, QR hospital intake, offline batch sync, and village-level analytics.

---

## Features

| Module | Capability |
|--------|------------|
| **Authentication** | JWT login, bcrypt hashing, role-based access |
| **Patients** | Full CRUD with village tracking and live risk status |
| **Medical Visits** | Vitals logging with automatic risk recalculation |
| **Risk Engine** | Rule-based triage: RED / AMBER / GREEN |
| **Referrals** | ANM → hospital referral with status tracking |
| **QR Workflow** | Patient identity cards + doctor scan at intake |
| **Hospitals** | Facility directory with nearest-hospital matching |
| **Analytics** | Dashboard, heatmap, risk distribution, village stats |
| **Follow-ups** | Scheduled visits with priority levels |
| **Offline Sync** | Batch upload of patients, visits, and referrals |

**Risk engine:** RED (BP ≥ 140/90, Hb < 7, severe symptoms) · AMBER (elevated BP, Hb 7–10) · GREEN (normal)

---

## User Roles

| | **ANM** — Field Worker | **Doctor** — Hospital Clinician |
|---|------------------------|----------------------------------|
| **Patients** | Create, update, delete | View history |
| **Visits** | Log vitals (triggers risk engine) | View records |
| **Referrals** | Create | View, confirm arrival/admission, add notes |
| **QR** | Generate patient cards | Scan at intake |
| **Hospitals** | Find nearest facility | View directory |
| **Analytics** | Dashboard & heatmap | Dashboard & heatmap |
| **Follow-ups** | Schedule & manage | View |
| **Sync** | Offline batch upload | — |

---

## Workflow

```
┌─────────────┐     Register      ┌──────────┐     Log visit      ┌─────────────┐
│  ANM in     │ ───────────────►  │ Patient  │ ────────────────►  │ Risk Engine │
│  village    │                   │ record   │                    │ RED/AMBER/  │
└─────────────┘                   └──────────┘                    │ GREEN       │
       │                                │                          └──────┬──────┘
       │         High risk              ▼                                 │
       └──────────────────────►  Create referral ──► Nearest hospital     │
                                        │                                      │
                                        ▼                                      │
                                 Generate QR card                              │
                                        │                                      │
                                        ▼                                      │
┌─────────────┐     Scan QR       ┌──────────┐     Update status            │
│  Doctor at  │ ◄───────────────  │ Hospital │ ◄── PENDING → ARRIVED →      │
│  hospital   │     View history  │  intake  │     ADMITTED                   │
└─────────────┘                   └──────────┘                              │
                                                                             │
                    Analytics heatmap ◄────────────────────────────────────────┘
                    (village-level risk distribution)
```

Referral flow: `PENDING` → `ARRIVED` → `ADMITTED`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js 5 |
| Database | Supabase · PostgreSQL |
| Auth | JWT + bcrypt |
| QR | `qrcode` |
| Geo | Haversine nearest-hospital matching |

---

## Project Structure

```
Maatri/
├── src/
│   ├── config/          # Supabase client
│   ├── controllers/     # HTTP handlers
│   ├── middleware/      # JWT + role guards
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (riskEngine, analytics, sync…)
│   ├── utils/           # apiResponse, geo helpers
│   ├── app.js
│   └── server.js
├── supabase/            # SQL migrations (run in order)
├── scripts/             # seedUsers.js
└── .env.example
```

---

## API Overview

**Base URL:** `http://localhost:5000` · **Auth:** `Authorization: Bearer <token>` · **Response:** `{ success, data }` or `{ success, error }`

### Auth `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/login` | Public | Returns JWT |
| POST | `/register` | Doctor | Create ANM or Doctor account |
| GET | `/me` | Authenticated | Current user profile |

### Patients `/api/patients`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | ANM, Doctor | List patients |
| GET | `/:id` | ANM, Doctor | Patient detail |
| GET | `/:id/qr` | ANM | QR card (PNG data URL) |
| POST | `/` | ANM | Create patient |
| PUT | `/:id` | ANM | Update patient |
| DELETE | `/:id` | ANM | Delete patient |

### Visits `/api/visits`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/patient/:patientId` | ANM, Doctor | Visits by patient |
| GET | `/:id` | ANM, Doctor | Single visit |
| POST | `/` | ANM | Create visit · auto risk update |
| PUT | `/:id` | ANM | Update visit · re-triage |
| DELETE | `/:id` | ANM | Delete visit |

### Referrals `/api/referrals`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/` | ANM | Create referral |
| GET | `/` | Doctor | List referrals |
| GET | `/:id` | ANM, Doctor | Referral detail |
| PATCH | `/:id/status` | Doctor | Arrival / admission + notes |

### QR `/api/qr`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/:patientId` | ANM | Generate QR card |
| POST | `/scan` | Doctor | Patient + latest visit + risk |

### Hospitals `/api/hospitals`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | ANM, Doctor | All facilities |
| GET | `/nearest` | ANM, Doctor | Nearest by lat/lng · filter OBGYN / blood bank |

### Analytics `/api/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/heatmap` | ANM, Doctor | Village risk map with coordinates |
| GET | `/dashboard` | ANM, Doctor | KPIs: patients, risk counts, referrals |
| GET | `/risk-distribution` | ANM, Doctor | Risk breakdown with percentages |
| GET | `/village-stats` | ANM, Doctor | Per-village patient stats |

### Follow-ups `/api/followups`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/` | ANM, Doctor | List · filter by status / priority |
| POST | `/` | ANM | Schedule follow-up |
| PATCH | `/:id` | ANM | Update date, priority, or status |

### Offline Sync `/api/sync`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/batch` | ANM | Idempotent batch sync · skips duplicates |
| POST | `/` | ANM | Batch sync patients, visits, referrals |
| GET | `/status` | ANM | Sync history and latest status |

### Upload `/api/upload`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/audio` | ANM, Doctor | Upload audio · `multipart/form-data` field `file` |
| POST | `/image` | ANM, Doctor | Upload image · returns Supabase Storage URL |

### AI Integration `/api/ai`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/transcribe` | ANM, Doctor | Send `audioUrl` → FastAPI speech-to-text |
| POST | `/ocr` | ANM, Doctor | Send `imageUrl` → FastAPI OCR |

**Typical flow:** upload file → use returned `file_url` → call `/api/ai/transcribe` or `/api/ai/ocr`

---

## Database Overview

Run in **Supabase SQL Editor** (in order):

1. `supabase/schema.sql`
2. `supabase/schema_updates.sql`
3. `supabase/schema_updates_analytics.sql`

| Table | Purpose |
|-------|---------|
| `users` | Auth — roles: `anm`, `doctor` |
| `patients` | Registry · `qr_token` · `current_risk` |
| `medical_visits` | Vitals per visit |
| `hospitals` | Facilities with geo + capacity |
| `referrals` | Handshake: PENDING → ARRIVED → ADMITTED |
| `villages` | Centroids for heatmap |
| `followups` | Scheduled ANM visits |
| `offline_sync_logs` | Sync audit trail |

Core links: visits → patients · referrals → patients, hospitals, users · followups → patients

---

## Setup

**Prerequisites:** Node.js 18+ · Supabase project

```bash
git clone <repo-url> && cd Maatri
npm install
cp .env.example .env   # set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
```

Run the three SQL files in Supabase, then:

```bash
npm run seed:users   # doctor@maatri.org / doctor123 · anm@maatri.org / anm123
```

Run `supabase/storage_setup.sql` in Supabase to create the uploads bucket, then:

```bash
npm run dev          # http://localhost:5000 · FastAPI at FASTAPI_URL (default :8000)
```

**Quick demo flow:** ANM login → create patient → log visit → create referral → generate QR → Doctor login → scan QR → confirm arrival → view `/api/analytics/dashboard`

---

## Future Scope

| Phase | Direction |
|-------|-----------|
| **AI agents** | Diagnostic, counseling, logistics, triage, scheduling (`aiOrchestrator.js`) |
| **SMS layer** | Alerts + offline sync via text (`smsService.js`) |
| **Mobile** | ANM field app + Doctor hospital dashboard |
| **Integrations** | ABHA health ID · USSD fallback · Hindi/regional languages |
| **Real-time** | Push alerts for RED-risk patients · automated follow-up reminders |

---

## Team

Built for mothers in rural India.

**Maatri** — मातृ — *mother*
