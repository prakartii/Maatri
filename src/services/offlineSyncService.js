import supabase from "../config/supabase.js";
import * as patientService from "./patientService.js";
import * as visitService from "./visitService.js";
import * as referralService from "./referralService.js";

/**
 * Create a sync log entry in PROCESSING state.
 */
const createSyncLog = async (userId) => {
  const { data, error } = await supabase
    .from("offline_sync_logs")
    .insert([{ user_id: userId, status: "PROCESSING" }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Finalize sync log with results.
 */
const finalizeSyncLog = async (logId, result) => {
  const status =
    result.totalFailed === 0
      ? "SUCCESS"
      : result.totalSynced > 0
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

/**
 * Process an offline batch: patients, visits, referrals.
 */
export const processSync = async (userId, { patients = [], visits = [], referrals = [] }) => {
  const log = await createSyncLog(userId);

  const result = {
    patients_synced: 0,
    visits_synced: 0,
    referrals_synced: 0,
    patients_failed: 0,
    visits_failed: 0,
    referrals_failed: 0,
    errors: [],
    synced: { patients: [], visits: [], referrals: [] },
  };

  for (const [index, record] of patients.entries()) {
    try {
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
  result.totalFailed =
    result.patients_failed + result.visits_failed + result.referrals_failed;

  const logEntry = await finalizeSyncLog(log.id, result);

  return {
    sync_log: logEntry,
    summary: {
      patients_synced: result.patients_synced,
      visits_synced: result.visits_synced,
      referrals_synced: result.referrals_synced,
      patients_failed: result.patients_failed,
      visits_failed: result.visits_failed,
      referrals_failed: result.referrals_failed,
      total_synced: result.totalSynced,
      total_failed: result.totalFailed,
    },
    synced: result.synced,
    errors: result.errors,
  };
};

/**
 * Get sync history for a user (most recent first).
 */
export const getSyncStatus = async (userId, limit = 10) => {
  const { data, error } = await supabase
    .from("offline_sync_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const latest = data[0] ?? null;

  return {
    latest_sync: latest,
    history: data,
    pending: latest?.status === "PROCESSING",
  };
};
