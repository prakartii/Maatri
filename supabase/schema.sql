-- =============================================================================
-- Maatri — Complete Supabase PostgreSQL Schema
-- =============================================================================
-- Run this entire script in: Supabase Dashboard → SQL Editor → New query
--
-- Tables used by the Node.js backend:
--   1. users          — JWT auth (Admin / ANM roles)
--   2. patients       — Maternal patient registry
--   3. medical_visits — ANM field visit vitals & notes
--
-- After running this script:
--   npm run seed:admin    (creates admin@maatri.org / admin123)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions (gen_random_uuid is provided by pgcrypto on Supabase)
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Optional: clean slate (uncomment only on a fresh/dev database)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS medical_visits CASCADE;
-- DROP TABLE IF EXISTS patients       CASCADE;
-- DROP TABLE IF EXISTS users          CASCADE;

-- =============================================================================
-- 1. USERS
-- =============================================================================
-- Backend-managed authentication (bcrypt + JWT).
-- Not linked to Supabase Auth — the Express API uses the service_role key.

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  email         TEXT        NOT NULL,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  role          TEXT        NOT NULL,

  CONSTRAINT users_email_unique
    UNIQUE (email),

  CONSTRAINT users_email_lowercase
    CHECK (email = lower(trim(email))),

  CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'anm'))
);

COMMENT ON TABLE  users                IS 'Health workers and admins — authenticated via backend JWT';
COMMENT ON COLUMN users.email          IS 'Unique login email (stored lowercase)';
COMMENT ON COLUMN users.password_hash  IS 'bcrypt hash — never expose via API';
COMMENT ON COLUMN users.role           IS 'admin = full access; anm = field health worker';

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);

-- =============================================================================
-- 2. PATIENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS patients (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  name             TEXT        NOT NULL,
  age              INTEGER     NOT NULL,
  village          TEXT        NOT NULL,
  phone            TEXT,
  pregnancy_month  INTEGER,
  current_risk     TEXT        NOT NULL DEFAULT 'GREEN',
  next_visit_date  DATE,

  CONSTRAINT patients_age_check
    CHECK (age > 0),

  CONSTRAINT patients_pregnancy_month_check
    CHECK (pregnancy_month IS NULL OR pregnancy_month BETWEEN 1 AND 9),

  CONSTRAINT patients_current_risk_check
    CHECK (current_risk IN ('RED', 'AMBER', 'GREEN'))
);

COMMENT ON TABLE  patients                   IS 'Registered maternal patients under ANM care';
COMMENT ON COLUMN patients.pregnancy_month   IS 'Gestational month (1–9)';
COMMENT ON COLUMN patients.current_risk        IS 'Latest triage from riskEngine: RED | AMBER | GREEN';
COMMENT ON COLUMN patients.next_visit_date     IS 'Scheduled follow-up date';

CREATE INDEX IF NOT EXISTS idx_patients_village       ON patients (village);
CREATE INDEX IF NOT EXISTS idx_patients_current_risk  ON patients (current_risk);
CREATE INDEX IF NOT EXISTS idx_patients_next_visit    ON patients (next_visit_date);
CREATE INDEX IF NOT EXISTS idx_patients_created_at    ON patients (created_at DESC);

-- =============================================================================
-- 3. MEDICAL_VISITS
-- =============================================================================
-- Each visit triggers riskEngine.calculateRisk() in the backend,
-- which updates patients.current_risk automatically.

CREATE TABLE IF NOT EXISTS medical_visits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    UUID        NOT NULL,
  visit_date    DATE        NOT NULL DEFAULT CURRENT_DATE,
  systolic_bp   INTEGER,
  diastolic_bp  INTEGER,
  hemoglobin    NUMERIC(4, 1),
  weight        NUMERIC(5, 2),
  symptoms      TEXT,
  notes         TEXT,

  CONSTRAINT medical_visits_patient_fk
    FOREIGN KEY (patient_id)
    REFERENCES patients (id)
    ON DELETE CASCADE,

  CONSTRAINT medical_visits_systolic_bp_check
    CHECK (systolic_bp IS NULL OR systolic_bp > 0),

  CONSTRAINT medical_visits_diastolic_bp_check
    CHECK (diastolic_bp IS NULL OR diastolic_bp > 0),

  CONSTRAINT medical_visits_hemoglobin_check
    CHECK (hemoglobin IS NULL OR hemoglobin > 0),

  CONSTRAINT medical_visits_weight_check
    CHECK (weight IS NULL OR weight > 0)
);

COMMENT ON TABLE  medical_visits              IS 'Field visit records logged by ANMs';
COMMENT ON COLUMN medical_visits.systolic_bp  IS 'Systolic blood pressure (mmHg)';
COMMENT ON COLUMN medical_visits.diastolic_bp IS 'Diastolic blood pressure (mmHg)';
COMMENT ON COLUMN medical_visits.hemoglobin   IS 'Hemoglobin level (g/dL)';
COMMENT ON COLUMN medical_visits.symptoms       IS 'Free-text symptoms — scanned for severe keywords by riskEngine';

CREATE INDEX IF NOT EXISTS idx_medical_visits_patient_id ON medical_visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_visits_visit_date ON medical_visits (visit_date DESC);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
-- The Express backend connects with SUPABASE_SERVICE_ROLE_KEY, which bypasses
-- RLS. Enabling RLS blocks direct anon/authenticated client access to tables,
-- which is recommended since all auth is handled by the API.

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients       ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_visits ENABLE ROW LEVEL SECURITY;

-- No policies are defined intentionally — only the service_role backend can
-- read/write. If you later add a Supabase client from the frontend, add
-- policies scoped to authenticated users here.

-- =============================================================================
-- Seed first admin (alternative to npm run seed:admin)
-- =============================================================================
-- INSERT INTO users (email, password_hash, name, role) VALUES (
--   'admin@maatri.org',
--   '$2b$10$...',  -- bcrypt hash of your password
--   'System Admin',
--   'admin'
-- );
