import * as patientService from "../services/patientService.js";
import * as qrService from "../services/qrService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * GET /api/patients
 * ANM sees only their own patients; Doctor sees only referred patients.
 */
export const getPatients = async (req, res) => {
  try {
    const patients = await patientService.getAllPatients(req.user.id, req.user.role);
    return success(res, patients);
  } catch (err) {
    console.error("Get patients error:", err.message);
    return error(res, "Failed to fetch patients", 500);
  }
};

/**
 * GET /api/patients/:id/qr — ANM generates patient QR card
 */
export const getPatientQr = async (req, res) => {
  try {
    // Verify ownership before exposing QR token
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) return error(res, "Patient not found", 404);
    if (patient.anm_id !== req.user.id) return error(res, "Patient not found", 404);

    const result = await qrService.generatePatientQr(req.params.id);
    if (result.error) return error(res, result.error, 404);
    return success(res, result);
  } catch (err) {
    console.error("Generate patient QR error:", err.message);
    return error(res, "Failed to generate QR card", 500);
  }
};

/**
 * GET /api/patients/:id
 * ANM: 404 if patient belongs to another ANM.
 * Doctor: 404 if patient has no referrals.
 */
export const getPatientById = async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    if (!patient) return error(res, "Patient not found", 404);

    if (req.user.role === "anm" && patient.anm_id !== req.user.id) {
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
 * Binds the new patient to the ANM creating them.
 */
export const createPatient = async (req, res) => {
  try {
    const { name, age, village } = req.body;

    if (!name || age == null || !village) {
      return error(res, "name, age, and village are required", 400);
    }

    console.log("[createPatient] user:", req.user?.id, req.user?.role);
    console.log("[createPatient] payload:", JSON.stringify({ ...req.body, anm_id: req.user?.id }));

    const patient = await patientService.createPatient(req.body, req.user.id);
    return created(res, patient);
  } catch (err) {
    // Surface the real Supabase/DB error so it is visible in frontend alert and server logs
    const detail = err?.message || "Unknown error";
    const code   = err?.code   || "";
    console.error("[createPatient] FAILED —", code, detail);
    console.error("[createPatient] full error:", JSON.stringify(err, null, 2));
    return error(res, `Patient creation failed: ${detail}`, 500);
  }
};

/**
 * PUT /api/patients/:id
 * ANM can only update patients they own.
 */
export const updatePatient = async (req, res) => {
  try {
    const existing = await patientService.getPatientById(req.params.id);
    if (!existing) return error(res, "Patient not found", 404);
    if (existing.anm_id !== req.user.id) return error(res, "Patient not found", 404);

    const result = await patientService.updatePatient(req.params.id, req.body);
    if (!result) return error(res, "Patient not found", 404);
    if (result.error) return error(res, result.error, 400);
    return success(res, result);
  } catch (err) {
    console.error("Update patient error:", err.message);
    return error(res, "Failed to update patient", 500);
  }
};

/**
 * DELETE /api/patients/:id
 * ANM can only delete patients they own.
 */
export const deletePatient = async (req, res) => {
  try {
    const existing = await patientService.getPatientById(req.params.id);
    if (!existing) return error(res, "Patient not found", 404);
    if (existing.anm_id !== req.user.id) return error(res, "Patient not found", 404);

    const deleted = await patientService.deletePatient(req.params.id);
    if (!deleted) return error(res, "Patient not found", 404);
    return success(res, { message: "Patient deleted", patient: deleted });
  } catch (err) {
    console.error("Delete patient error:", err.message);
    return error(res, "Failed to delete patient", 500);
  }
};
