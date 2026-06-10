import * as followupService from "../services/followupService.js";
import { success, created, error } from "../utils/apiResponse.js";

export const getFollowups = async (req, res) => {
  try {
    const followups = await followupService.getAllFollowups({
      status: req.query.status,
      priority: req.query.priority,
    });
    return success(res, followups);
  } catch (err) {
    console.error("Get followups error:", err.message);
    return error(res, "Failed to fetch followups", 500);
  }
};

export const createFollowup = async (req, res) => {
  try {
    const { patient_id, next_visit_date } = req.body;

    if (!patient_id || !next_visit_date) {
      return error(res, "patient_id and next_visit_date are required", 400);
    }

    const followup = await followupService.createFollowup(req.body);

    if (followup.error) {
      return error(res, followup.error, 404);
    }

    return created(res, followup);
  } catch (err) {
    console.error("Create followup error:", err.message);
    return error(res, "Failed to create followup", 500);
  }
};

export const updateFollowup = async (req, res) => {
  try {
    const result = await followupService.updateFollowup(req.params.id, req.body);

    if (!result) {
      return error(res, "Followup not found", 404);
    }

    if (result.error) {
      return error(res, result.error, 400);
    }

    return success(res, result);
  } catch (err) {
    console.error("Update followup error:", err.message);
    return error(res, "Failed to update followup", 500);
  }
};
