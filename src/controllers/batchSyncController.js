import * as batchSyncService from "../services/batchSyncService.js";
import { created, error } from "../utils/apiResponse.js";

/**
 * POST /api/sync/batch — idempotent offline batch sync with duplicate prevention
 */
export const batchSyncData = async (req, res) => {
  try {
    const { patients, visits, referrals } = req.body;

    const hasData =
      (patients?.length ?? 0) > 0 ||
      (visits?.length ?? 0) > 0 ||
      (referrals?.length ?? 0) > 0;

    if (!hasData) {
      return error(res, "At least one of patients, visits, or referrals is required", 400);
    }

    const result = await batchSyncService.processBatchSync(req.user.id, {
      patients: patients ?? [],
      visits: visits ?? [],
      referrals: referrals ?? [],
    });

    return created(res, result);
  } catch (err) {
    console.error("Batch sync error:", err.message);
    return error(res, "Failed to process batch sync", 500);
  }
};
