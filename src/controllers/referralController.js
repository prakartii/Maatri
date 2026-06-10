import * as referralService from "../services/referralService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * POST /api/referrals — ANM creates referral
 */
export const createReferral = async (req, res) => {
  try {
    const { patient_id, hospital_id, referral_reason } = req.body;

    if (!patient_id || !hospital_id || !referral_reason) {
      return error(res, "patient_id, hospital_id, and referral_reason are required", 400);
    }

    const referral = await referralService.createReferral({
      patient_id,
      hospital_id,
      referral_reason,
      referred_by: req.user.id,
    });

    if (referral.error) {
      return error(res, referral.error, 404);
    }

    return created(res, referral);
  } catch (err) {
    console.error("Create referral error:", err.message);
    return error(res, "Failed to create referral", 500);
  }
};

/**
 * GET /api/referrals — Doctor views all referrals
 */
export const getReferrals = async (req, res) => {
  try {
    const referrals = await referralService.getAllReferrals();
    return success(res, referrals);
  } catch (err) {
    console.error("Get referrals error:", err.message);
    return error(res, "Failed to fetch referrals", 500);
  }
};

/**
 * GET /api/referrals/:id
 */
export const getReferralById = async (req, res) => {
  try {
    const referral = await referralService.getReferralById(req.params.id);

    if (!referral) {
      return error(res, "Referral not found", 404);
    }

    return success(res, referral);
  } catch (err) {
    console.error("Get referral error:", err.message);
    return error(res, "Failed to fetch referral", 500);
  }
};

/**
 * PATCH /api/referrals/:id/status — Doctor confirms arrival / admission + notes
 */
export const updateReferralStatus = async (req, res) => {
  try {
    const { status, doctor_notes } = req.body;

    if (!status) {
      return error(res, "status is required", 400);
    }

    if (!["ARRIVED", "ADMITTED"].includes(status)) {
      return error(res, "status must be ARRIVED or ADMITTED", 400);
    }

    const result = await referralService.updateReferralStatus(req.params.id, {
      status,
      doctor_notes,
    });

    if (!result) {
      return error(res, "Referral not found", 404);
    }

    if (result.error) {
      return error(res, result.error, 400);
    }

    return success(res, result);
  } catch (err) {
    console.error("Update referral status error:", err.message);
    return error(res, "Failed to update referral status", 500);
  }
};
