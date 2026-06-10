import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import supabase from "../config/supabase.js";
import { getPatientById } from "./patientService.js";
import { getVisitsByPatient } from "./visitService.js";

/**
 * Ensure patient has a qr_token (backfill for records created before migration).
 */
const ensureQrToken = async (patientId) => {
  const patient = await getPatientById(patientId);

  if (!patient) return null;

  if (patient.qr_token) return patient;

  const { data, error } = await supabase
    .from("patients")
    .update({ qr_token: randomUUID() })
    .eq("id", patientId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Generate QR card payload and PNG data URL for a patient.
 */
export const generatePatientQr = async (patientId) => {
  const patient = await ensureQrToken(patientId);

  if (!patient) {
    return { error: "Patient not found" };
  }

  const scanPayload = {
    type: "maatri_patient",
    qr_token: patient.qr_token,
    patient_id: patient.id,
  };

  const qr_data_url = await QRCode.toDataURL(JSON.stringify(scanPayload), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
  });

  return {
    patient_id: patient.id,
    qr_token: patient.qr_token,
    scan_payload: scanPayload,
    qr_data_url,
  };
};

/**
 * Resolve a scanned QR token to patient summary for hospital intake.
 */
export const scanQrToken = async (qr_token) => {
  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, name, age, village, phone, pregnancy_month, current_risk, next_visit_date, created_at")
    .eq("qr_token", qr_token)
    .single();

  if (error) {
    if (error.code === "PGRST116") return { error: "Invalid or unknown QR code" };
    throw error;
  }

  const visits = await getVisitsByPatient(patient.id);
  const latest_visit = visits.length > 0 ? visits[0] : null;

  return {
    patient,
    latest_visit,
    current_risk: patient.current_risk,
  };
};
