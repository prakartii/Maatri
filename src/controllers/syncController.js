import * as offlineSyncService from "../services/offlineSyncService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * POST /api/sync — batch upload offline patients, visits, referrals
 */
export const syncData = async (req, res) => {
  try {
    const { patients, visits, referrals } = req.body;

    const hasData =
      (patients?.length ?? 0) > 0 ||
      (visits?.length ?? 0) > 0 ||
      (referrals?.length ?? 0) > 0;

    if (!hasData) {
      return error(res, "At least one of patients, visits, or referrals is required", 400);
    }

    const result = await offlineSyncService.processSync(req.user.id, {
      patients: patients ?? [],
      visits: visits ?? [],
      referrals: referrals ?? [],
    });

    return created(res, result);
  } catch (err) {
    console.error("Sync error:", err.message);
    return error(res, "Failed to process sync", 500);
  }
};

/**
 * GET /api/sync/status — recent sync history for the authenticated user
 */
export const getSyncStatus = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
    const status = await offlineSyncService.getSyncStatus(req.user.id, limit);
    return success(res, status);
  } catch (err) {
    console.error("Sync status error:", err.message);
    return error(res, "Failed to fetch sync status", 500);
  }
};
