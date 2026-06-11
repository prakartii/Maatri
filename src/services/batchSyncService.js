import supabase from "../config/supabase.js";
import * as patientService from "./patientService.js";
import * as visitService from "./visitService.js";
import * as referralService from "./referralService.js";

const createSyncLog = async (userId) => {
  const { data, error } = await supabase
    .from("offline_sync_logs")
    .insert([{ user_id: userId, status: "PROCESSING" }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const finalizeSyncLog = async (logId, result) => {
  const status =
    result.totalFailed === 0
      ? "SUCCESS"
      : result.totalSynced > 0 || result.totalSkipped > 0
        ? "PARTIAL"
        : "FAILED";

  const { data, error } = await supabase
    .from("offline_sync_logs")
    .update({
      status,
      patients_synced: result.patients_synced,
      visits_synced: result.visits_synced,
      referrals_synced: result.referrals_synced,
      patients_failed: result.patients_failed,
      visits_failed: result.visits_failed,
      referrals_failed: result.referrals_failed,
      errors: result.errors.length > 0 ? result.errors : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", logId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const isDuplicatePatient = async (record, seen) => {
  const offlineKey = record.offline_id || record.client_id;
  if (offlineKey) {
    if (seen.patients.has(offlineKey)) return true;
    seen.patients.add(offlineKey);
  }

  if (record.id) {
    const existing = await patientService.getPatientById(record.id);
    if (existing) return true;
  }

  if (record.phone && record.name) {
    const { data } = await supabase
      .from("patients")
      .select("id")
      .eq("phone", record.phone)
      .eq("name", record.name)
      .maybeSingle();

    if (data) return true;
  }

  return false;
};

const isDuplicateVisit = async (record, seen) => {
  const offlineKey = record.offline_id || record.client_id;
  if (offlineKey) {
    if (seen.visits.has(offlineKey)) return true;
    seen.visits.add(offlineKey);
  }

  if (record.id) {
    const existing = await visitService.getVisitById(record.id);
    if (existing) return true;
  }

  if (record.patient_id && record.visit_date) {
    const { data } = await supabase
      .from("medical_visits")
      .select("id")
      .eq("patient_id", record.patient_id)
      .eq("visit_date", record.visit_date)
      .maybeSingle();

    if (data) return true;
  }

  return false;
};

const isDuplicateReferral = async (record, seen) => {
  const offlineKey = record.offline_id || record.client_id;
  if (offlineKey) {
    if (seen.referrals.has(offlineKey)) return true;
    seen.referrals.add(offlineKey);
  }

  if (record.id) {
    const existing = await referralService.getReferralById(record.id);
    if (existing) return true;
  }

  if (record.patient_id && record.hospital_id) {
    const { data } = await supabase
      .from("referrals")
      .select("id")
      .eq("patient_id", record.patient_id)
      .eq("hospital_id", record.hospital_id)
      .eq("status", "PENDING")
      .maybeSingle();

    if (data) return true;
  }

  return false;
};

/**
 * Batch sync with duplicate detection (idempotent offline replay).
 */
export const processBatchSync = async (userId, { patients = [], visits = [], referrals = [] }) => {
  const log = await createSyncLog(userId);
  const seen = { patients: new Set(), visits: new Set(), referrals: new Set() };

  const result = {
    patients_synced: 0,
    visits_synced: 0,
    referrals_synced: 0,
    patients_skipped: 0,
    visits_skipped: 0,
    referrals_skipped: 0,
    patients_failed: 0,
    visits_failed: 0,
    referrals_failed: 0,
    errors: [],
    synced: { patients: [], visits: [], referrals: [] },
    skipped: { patients: [], visits: [], referrals: [] },
  };

  for (const [index, record] of patients.entries()) {
    try {
      if (await isDuplicatePatient(record, seen)) {
        result.patients_skipped++;
        result.skipped.patients.push({ index, record });
        continue;
      }

      const created = await patientService.createPatient(record);
      result.patients_synced++;
      result.synced.patients.push(created);
    } catch (err) {
      result.patients_failed++;
      result.errors.push({ type: "patient", index, message: err.message });
    }
  }

  for (const [index, record] of visits.entries()) {
    try {
      if (await isDuplicateVisit(record, seen)) {
        result.visits_skipped++;
        result.skipped.visits.push({ index, record });
        continue;
      }

      const created = await visitService.createVisit(record);

      if (created.error) {
        result.visits_failed++;
        result.errors.push({ type: "visit", index, message: created.error });
      } else {
        result.visits_synced++;
        result.synced.visits.push(created);
      }
    } catch (err) {
      result.visits_failed++;
      result.errors.push({ type: "visit", index, message: err.message });
    }
  }

  for (const [index, record] of referrals.entries()) {
    try {
      if (await isDuplicateReferral(record, seen)) {
        result.referrals_skipped++;
        result.skipped.referrals.push({ index, record });
        continue;
      }

      const created = await referralService.createReferral({
        ...record,
        referred_by: userId,
      });

      if (created.error) {
        result.referrals_failed++;
        result.errors.push({ type: "referral", index, message: created.error });
      } else {
        result.referrals_synced++;
        result.synced.referrals.push(created);
      }
    } catch (err) {
      result.referrals_failed++;
      result.errors.push({ type: "referral", index, message: err.message });
    }
  }

  result.totalSynced =
    result.patients_synced + result.visits_synced + result.referrals_synced;
  result.totalSkipped =
    result.patients_skipped + result.visits_skipped + result.referrals_skipped;
  result.totalFailed =
    result.patients_failed + result.visits_failed + result.referrals_failed;

  const logEntry = await finalizeSyncLog(log.id, result);

  return {
    sync_log: logEntry,
    summary: {
      patients_synced: result.patients_synced,
      visits_synced: result.visits_synced,
      referrals_synced: result.referrals_synced,
      patients_skipped: result.patients_skipped,
      visits_skipped: result.visits_skipped,
      referrals_skipped: result.referrals_skipped,
      patients_failed: result.patients_failed,
      visits_failed: result.visits_failed,
      referrals_failed: result.referrals_failed,
      total_synced: result.totalSynced,
      total_skipped: result.totalSkipped,
      total_failed: result.totalFailed,
    },
    synced: result.synced,
    skipped: result.skipped,
    errors: result.errors,
  };
};
