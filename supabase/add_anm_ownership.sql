-- =============================================================================
-- Maatri — Add ANM ownership to patients table
-- =============================================================================
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- SAFE TO RUN: only ADDs a column and updates NULLs. No data is deleted.
--
-- What this does:
--   1. Adds anm_id (UUID FK → users.id) to patients table
--   2. Assigns the 3 existing orphaned patients to anm@maatri.org
--   3. Creates an index for fast per-ANM queries
--
-- After running this:
--   • ANM login (anm@maatri.org) sees: Priya, Sita Devi, laxmi devi
--   • ANM login (new@gmail.com / HELLO) sees: empty list (correct — new account)
--   • Doctor login sees: only patients with referrals
-- =============================================================================

-- -----------------------------------------------------------------------
-- PRE-CHECK: run this SELECT first to see current state
-- -----------------------------------------------------------------------
-- SELECT id, name, village, current_risk FROM patients ORDER BY created_at;
-- Expected: 3 rows — Priya, Sita Devi, laxmi devi
-- -----------------------------------------------------------------------

-- Step 1: Add the column (nullable — existing rows get NULL, not an error)
ALTER TABLE patients
  ADD COLUMN IF NOT EXISTS anm_id UUID REFERENCES users(id) ON DELETE RESTRICT;

-- Step 2: Assign all current unowned patients to the seeded ANM (anm@maatri.org)
--
--   anm@maatri.org  →  3b48cd32-3730-4151-a95c-c4d58cc288da
--   (created 2026-06-10, name: "ANM Priya", role: anm)
--
UPDATE patients
  SET anm_id = '3b48cd32-3730-4151-a95c-c4d58cc288da'
  WHERE anm_id IS NULL;

-- Step 3: Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_patients_anm_id ON patients (anm_id);

-- -----------------------------------------------------------------------
-- VERIFICATION: run these after the migration to confirm success
-- -----------------------------------------------------------------------
-- Count summary:
SELECT
  COUNT(*)                       AS total_patients,
  COUNT(anm_id)                  AS with_anm_id,
  COUNT(*) - COUNT(anm_id)       AS still_null
FROM patients;
-- Expected: total=3, with_anm_id=3, still_null=0

-- Full list with owner:
-- SELECT p.name, p.village, p.current_risk, u.email AS owned_by
-- FROM patients p
-- LEFT JOIN users u ON u.id = p.anm_id
-- ORDER BY p.created_at;
-- Expected: all 3 patients owned by anm@maatri.org
-- -----------------------------------------------------------------------
