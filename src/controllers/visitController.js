import * as visitService from "../services/visitService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * GET /api/visits/patient/:patientId
 */
export const getVisitsByPatient = async (req, res) => {
  try {
    const visits = await visitService.getVisitsByPatient(req.params.patientId);
    return success(res, visits);
  } catch (err) {
    console.error("Get visits error:", err.message);
    return error(res, "Failed to fetch visits", 500);
  }
};

/**
 * GET /api/visits/:id
 */
export const getVisitById = async (req, res) => {
  try {
    const visit = await visitService.getVisitById(req.params.id);

    if (!visit) {
      return error(res, "Visit not found", 404);
    }

    return success(res, visit);
  } catch (err) {
    console.error("Get visit error:", err.message);
    return error(res, "Failed to fetch visit", 500);
  }
};

/**
 * POST /api/visits
 * Creates visit, runs risk engine, updates patient current_risk.
 */
export const createVisit = async (req, res) => {
  try {
    const { patient_id } = req.body;

    if (!patient_id) {
      return error(res, "patient_id is required", 400);
    }

    const result = await visitService.createVisit(req.body);

    if (result.error) {
      return error(res, result.error, 404);
    }

    return created(res, result);
  } catch (err) {
    console.error("Create visit error:", err.message);
    return error(res, "Failed to create visit", 500);
  }
};

/**
 * PUT /api/visits/:id
 */
export const updateVisit = async (req, res) => {
  try {
    const result = await visitService.updateVisit(req.params.id, req.body);

    if (!result) {
      return error(res, "Visit not found", 404);
    }

    if (result.error) {
      return error(res, result.error, 400);
    }

    return success(res, result);
  } catch (err) {
    console.error("Update visit error:", err.message);
    return error(res, "Failed to update visit", 500);
  }
};

/**
 * DELETE /api/visits/:id
 */
export const deleteVisit = async (req, res) => {
  try {
    const deleted = await visitService.deleteVisit(req.params.id);

    if (!deleted) {
      return error(res, "Visit not found", 404);
    }

    return success(res, { message: "Visit deleted", visit: deleted });
  } catch (err) {
    console.error("Delete visit error:", err.message);
    return error(res, "Failed to delete visit", 500);
  }
};
