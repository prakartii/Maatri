import * as patientService from "../services/patientService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * GET /api/patients
 */
export const getPatients = async (req, res) => {
  try {
    const patients = await patientService.getAllPatients();
    return success(res, patients);
  } catch (err) {
    console.error("Get patients error:", err.message);
    return error(res, "Failed to fetch patients", 500);
  }
};

/**
 * GET /api/patients/:id
 */
export const getPatientById = async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);

    if (!patient) {
      return error(res, "Patient not found", 404);
    }

    return success(res, patient);
  } catch (err) {
    console.error("Get patient error:", err.message);
    return error(res, "Failed to fetch patient", 500);
  }
};

/**
 * POST /api/patients
 */
export const createPatient = async (req, res) => {
  try {
    const { name, age, village } = req.body;

    if (!name || age == null || !village) {
      return error(res, "name, age, and village are required", 400);
    }

    const patient = await patientService.createPatient(req.body);
    return created(res, patient);
  } catch (err) {
    console.error("Create patient error:", err.message);
    return error(res, "Failed to create patient", 500);
  }
};

/**
 * PUT /api/patients/:id
 */
export const updatePatient = async (req, res) => {
  try {
    const result = await patientService.updatePatient(req.params.id, req.body);

    if (!result) {
      return error(res, "Patient not found", 404);
    }

    if (result.error) {
      return error(res, result.error, 400);
    }

    return success(res, result);
  } catch (err) {
    console.error("Update patient error:", err.message);
    return error(res, "Failed to update patient", 500);
  }
};

/**
 * DELETE /api/patients/:id
 */
export const deletePatient = async (req, res) => {
  try {
    const deleted = await patientService.deletePatient(req.params.id);

    if (!deleted) {
      return error(res, "Patient not found", 404);
    }

    return success(res, { message: "Patient deleted", patient: deleted });
  } catch (err) {
    console.error("Delete patient error:", err.message);
    return error(res, "Failed to delete patient", 500);
  }
};
