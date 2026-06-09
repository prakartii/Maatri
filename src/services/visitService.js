import supabase from "../config/supabase.js";
import { calculateRisk } from "./riskEngine.js";
import { getPatientById, updatePatientRisk } from "./patientService.js";

export const getVisitsByPatient = async (patientId) => {
  const { data, error } = await supabase
    .from("medical_visits")
    .select("*")
    .eq("patient_id", patientId)
    .order("visit_date", { ascending: false });

  if (error) throw error;
  return data;
};

export const getVisitById = async (id) => {
  const { data, error } = await supabase
    .from("medical_visits")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

/**
 * Create a visit, run the risk engine, and sync patient current_risk.
 */
export const createVisit = async (visitData) => {
  const patient = await getPatientById(visitData.patient_id);

  if (!patient) {
    return { error: "Patient not found" };
  }

  const { data: visit, error } = await supabase
    .from("medical_visits")
    .insert([
      {
        patient_id: visitData.patient_id,
        visit_date: visitData.visit_date ?? new Date().toISOString().split("T")[0],
        systolic_bp: visitData.systolic_bp ?? null,
        diastolic_bp: visitData.diastolic_bp ?? null,
        hemoglobin: visitData.hemoglobin ?? null,
        weight: visitData.weight ?? null,
        symptoms: visitData.symptoms ?? null,
        notes: visitData.notes ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Triage and persist risk on the patient record
  const risk = calculateRisk({
    systolic_bp: visit.systolic_bp,
    diastolic_bp: visit.diastolic_bp,
    hemoglobin: visit.hemoglobin,
    symptoms: visit.symptoms,
  });

  await updatePatientRisk(visitData.patient_id, risk);

  return { visit, calculated_risk: risk };
};

export const updateVisit = async (id, updates) => {
  const existing = await getVisitById(id);

  if (!existing) return null;

  const allowedFields = [
    "visit_date",
    "systolic_bp",
    "diastolic_bp",
    "hemoglobin",
    "weight",
    "symptoms",
    "notes",
  ];

  const payload = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  if (Object.keys(payload).length === 0) {
    return { error: "No valid fields to update" };
  }

  const { data: visit, error } = await supabase
    .from("medical_visits")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Re-calculate risk when vitals or symptoms change
  const merged = { ...existing, ...visit };
  const risk = calculateRisk({
    systolic_bp: merged.systolic_bp,
    diastolic_bp: merged.diastolic_bp,
    hemoglobin: merged.hemoglobin,
    symptoms: merged.symptoms,
  });

  await updatePatientRisk(merged.patient_id, risk);

  return { visit, calculated_risk: risk };
};

export const deleteVisit = async (id) => {
  const { data, error } = await supabase
    .from("medical_visits")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};
