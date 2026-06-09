import supabase from "../config/supabase.js";

export const getAllPatients = async () => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getPatientById = async (id) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

export const createPatient = async (patientData) => {
  const { data, error } = await supabase
    .from("patients")
    .insert([
      {
        name: patientData.name,
        age: patientData.age,
        village: patientData.village,
        phone: patientData.phone ?? null,
        pregnancy_month: patientData.pregnancy_month ?? null,
        current_risk: patientData.current_risk ?? "GREEN",
        next_visit_date: patientData.next_visit_date ?? null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePatient = async (id, updates) => {
  const allowedFields = [
    "name",
    "age",
    "village",
    "phone",
    "pregnancy_month",
    "current_risk",
    "next_visit_date",
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

  const { data, error } = await supabase
    .from("patients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

export const deletePatient = async (id) => {
  const { data, error } = await supabase
    .from("patients")
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

/**
 * Update only the current_risk field (called by visit service after triage).
 */
export const updatePatientRisk = async (patientId, risk) => {
  const { data, error } = await supabase
    .from("patients")
    .update({ current_risk: risk })
    .eq("id", patientId)
    .select("id, current_risk")
    .single();

  if (error) throw error;
  return data;
};
