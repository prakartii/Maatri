import supabase from "../config/supabase.js";
import { getPatientById } from "./patientService.js";

const FOLLOWUP_SELECT = `
  *,
  patients ( id, name, village, phone, current_risk, pregnancy_month )
`;

export const getAllFollowups = async (filters = {}) => {
  let query = supabase
    .from("followups")
    .select(FOLLOWUP_SELECT)
    .order("next_visit_date", { ascending: true });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const getFollowupById = async (id) => {
  const { data, error } = await supabase
    .from("followups")
    .select(FOLLOWUP_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

/**
 * Map patient risk to default follow-up priority when not provided.
 */
const riskToPriority = (risk) => {
  if (risk === "RED") return "HIGH";
  if (risk === "AMBER") return "MEDIUM";
  return "LOW";
};

export const createFollowup = async ({ patient_id, next_visit_date, priority, status }) => {
  const patient = await getPatientById(patient_id);

  if (!patient) {
    return { error: "Patient not found" };
  }

  const { data, error } = await supabase
    .from("followups")
    .insert([
      {
        patient_id,
        next_visit_date,
        priority: priority ?? riskToPriority(patient.current_risk),
        status: status ?? "PENDING",
      },
    ])
    .select(FOLLOWUP_SELECT)
    .single();

  if (error) throw error;
  return data;
};

export const updateFollowup = async (id, updates) => {
  const existing = await getFollowupById(id);

  if (!existing) return null;

  const allowedFields = ["next_visit_date", "priority", "status"];
  const payload = { updated_at: new Date().toISOString() };

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      payload[field] = updates[field];
    }
  }

  if (Object.keys(payload).length === 1) {
    return { error: "No valid fields to update" };
  }

  const { data, error } = await supabase
    .from("followups")
    .update(payload)
    .eq("id", id)
    .select(FOLLOWUP_SELECT)
    .single();

  if (error) throw error;
  return data;
};
