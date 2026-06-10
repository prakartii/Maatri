-- =============================================================================
-- Maatri — Analytics, Followups & Offline Sync schema updates
-- Run AFTER schema.sql and schema_updates.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. VILLAGES (geo lookup for heatmap)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS villages (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT          NOT NULL UNIQUE,
  district   TEXT,
  latitude   NUMERIC(9, 6) NOT NULL,
  longitude  NUMERIC(9, 6) NOT NULL
);

COMMENT ON TABLE villages IS 'Village centroids for analytics heatmap';

CREATE INDEX IF NOT EXISTS idx_villages_name ON villages (name);

-- Seed villages referenced by sample hospitals / common patient locations
INSERT INTO villages (name, district, latitude, longitude)
SELECT * FROM (VALUES
  ('Sadar', 'Ranchi', 23.344100, 85.309600),
  ('Kanke', 'Ranchi', 23.401200, 85.321800),
  ('Bundu', 'Ranchi', 23.182400, 85.592100)
) AS v(name, district, latitude, longitude)
WHERE NOT EXISTS (SELECT 1 FROM villages WHERE villages.name = v.name);

-- Auto-register villages from existing patients (default coords — update manually later)
INSERT INTO villages (name, district, latitude, longitude)
SELECT DISTINCT p.village, 'Unknown', 23.344100, 85.309600
FROM patients p
WHERE NOT EXISTS (SELECT 1 FROM villages v WHERE v.name = p.village);

-- -----------------------------------------------------------------------------
-- 2. FOLLOWUPS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS followups (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID        NOT NULL,
  next_visit_date DATE        NOT NULL,
  priority        TEXT        NOT NULL DEFAULT 'MEDIUM',
  status          TEXT        NOT NULL DEFAULT 'PENDING',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT followups_patient_fk
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,

  CONSTRAINT followups_priority_check
    CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),

  CONSTRAINT followups_status_check
    CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED'))
);

COMMENT ON TABLE followups IS 'Scheduled ANM follow-up visits for patients';

CREATE INDEX IF NOT EXISTS idx_followups_patient_id      ON followups (patient_id);
CREATE INDEX IF NOT EXISTS idx_followups_next_visit_date ON followups (next_visit_date);
CREATE INDEX IF NOT EXISTS idx_followups_status          ON followups (status);
CREATE INDEX IF NOT EXISTS idx_followups_priority        ON followups (priority);

-- -----------------------------------------------------------------------------
-- 3. OFFLINE SYNC LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_sync_logs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'PROCESSING',
  patients_synced   INTEGER     NOT NULL DEFAULT 0,
  visits_synced     INTEGER     NOT NULL DEFAULT 0,
  referrals_synced  INTEGER     NOT NULL DEFAULT 0,
  patients_failed   INTEGER     NOT NULL DEFAULT 0,
  visits_failed     INTEGER     NOT NULL DEFAULT 0,
  referrals_failed  INTEGER     NOT NULL DEFAULT 0,
  errors            JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ,

  CONSTRAINT offline_sync_logs_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,

  CONSTRAINT offline_sync_logs_status_check
    CHECK (status IN ('PROCESSING', 'SUCCESS', 'PARTIAL', 'FAILED'))
);

COMMENT ON TABLE offline_sync_logs IS 'Audit log for offline batch sync operations';

CREATE INDEX IF NOT EXISTS idx_offline_sync_logs_user_id    ON offline_sync_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_logs_created_at ON offline_sync_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
ALTER TABLE villages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offline_sync_logs  ENABLE ROW LEVEL SECURITY;
