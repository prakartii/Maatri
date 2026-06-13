import supabase from "../config/supabase.js";

/**
 * Returns patients visible to the requesting user.
 * ANM: only patients they registered (anm_id = userId).
 * Doctor: only patients who have at least one referral.
 */
export const getAllPatients = async (userId, role) => {
  let query = supabase.from("patients").select("*");

  if (role === "anm") {
    query = query.eq("anm_id", userId);
  } else if (role === "doctor") {
    // Fetch distinct patient IDs that appear in the referrals table
    const { data: refs, error: refErr } = await supabase
      .from("referrals")
      .select("patient_id");
    if (refErr) throw refErr;

    const patientIds = refs ? [...new Set(refs.map((r) => r.patient_id))] : [];
    if (patientIds.length === 0) return [];
    query = query.in("id", patientIds);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
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

/**
 * Creates a patient and binds it to the ANM who registered them.
 */
export const createPatient = async (patientData, anmId) => {
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
        anm_id: anmId,
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
