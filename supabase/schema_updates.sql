-- =============================================================================
-- Maatri — Schema updates (run AFTER initial schema.sql on existing databases)
-- =============================================================================
-- Adds: hospitals, referrals, patient QR tokens, role migration (anm / doctor)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Migrate user roles: admin → doctor, support only anm | doctor
-- -----------------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'doctor' WHERE role = 'admin';

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('anm', 'doctor'));

COMMENT ON COLUMN users.role IS 'anm = field health worker; doctor = hospital clinician';

-- -----------------------------------------------------------------------------
-- 2. Patient QR tokens (for patient identity cards)
-- -----------------------------------------------------------------------------
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS qr_token UUID UNIQUE DEFAULT gen_random_uuid();

-- Backfill any existing patients missing a token
UPDATE patients SET qr_token = gen_random_uuid() WHERE qr_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_patients_qr_token ON patients (qr_token);

-- -----------------------------------------------------------------------------
-- 3. HOSPITALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hospitals (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  village        TEXT        NOT NULL,
  district       TEXT        NOT NULL,
  latitude       NUMERIC(9, 6) NOT NULL,
  longitude      NUMERIC(9, 6) NOT NULL,
  has_obgyn      BOOLEAN     NOT NULL DEFAULT false,
  has_blood_bank BOOLEAN     NOT NULL DEFAULT false,
  capacity       INTEGER     NOT NULL DEFAULT 0 CHECK (capacity >= 0)
);

COMMENT ON TABLE hospitals IS 'Referral destination facilities with geo coordinates';

CREATE INDEX IF NOT EXISTS idx_hospitals_district ON hospitals (district);
CREATE INDEX IF NOT EXISTS idx_hospitals_village  ON hospitals (village);

-- -----------------------------------------------------------------------------
-- 4. REFERRALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL,
  referred_by       UUID        NOT NULL,
  hospital_id     UUID        NOT NULL,
  referral_reason TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'PENDING',
  qr_token        UUID        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  doctor_notes    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT referrals_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,

  CONSTRAINT referrals_referred_by_fk
    FOREIGN KEY (referred_by) REFERENCES users (id) ON DELETE RESTRICT,

  CONSTRAINT referrals_hospital_fk
    FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE RESTRICT,

  CONSTRAINT referrals_status_check
    CHECK (status IN ('PENDING', 'ARRIVED', 'ADMITTED'))
);

COMMENT ON TABLE referrals IS 'ANM-initiated referrals tracked through hospital arrival and admission';

CREATE INDEX IF NOT EXISTS idx_referrals_patient_id  ON referrals (patient_id);
CREATE INDEX IF NOT EXISTS idx_referrals_hospital_id ON referrals (hospital_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status      ON referrals (status);
CREATE INDEX IF NOT EXISTS idx_referrals_qr_token    ON referrals (qr_token);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at  ON referrals (created_at DESC);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE hospitals  ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals  ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Sample hospitals (optional — remove in production)
-- -----------------------------------------------------------------------------
INSERT INTO hospitals (name, village, district, latitude, longitude, has_obgyn, has_blood_bank, capacity)
SELECT * FROM (VALUES
  ('District Women''s Hospital', 'Sadar', 'Ranchi', 23.344100, 85.309600, true,  true,  120),
  ('Community Health Centre',    'Kanke', 'Ranchi', 23.401200, 85.321800, true,  false, 40),
  ('Rural Referral Unit',        'Bundu', 'Ranchi', 23.182400, 85.592100, false, false, 20)
) AS v(name, village, district, latitude, longitude, has_obgyn, has_blood_bank, capacity)
WHERE NOT EXISTS (SELECT 1 FROM hospitals LIMIT 1);
