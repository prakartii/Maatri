import supabase from "../config/supabase.js";
import { getPatientById } from "./patientService.js";
import { getHospitalById } from "./hospitalService.js";

const REFERRAL_SELECT = `
  *,
  patients ( id, name, age, village, phone, current_risk, pregnancy_month ),
  hospitals ( id, name, village, district, has_obgyn, has_blood_bank )
`;

export const getAllReferrals = async () => {
  const { data, error } = await supabase
    .from("referrals")
    .select(REFERRAL_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getReferralById = async (id) => {
  const { data, error } = await supabase
    .from("referrals")
    .select(REFERRAL_SELECT)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }

  return data;
};

/**
 * ANM creates a referral for a high-risk patient to a hospital.
 */
export const createReferral = async ({ patient_id, hospital_id, referral_reason, referred_by }) => {
  const patient = await getPatientById(patient_id);

  if (!patient) {
    return { error: "Patient not found" };
  }

  const hospital = await getHospitalById(hospital_id);

  if (!hospital) {
    return { error: "Hospital not found" };
  }

  const { data, error } = await supabase
    .from("referrals")
    .insert([
      {
        patient_id,
        hospital_id,
        referral_reason,
        referred_by,
        status: "PENDING",
      },
    ])
    .select(REFERRAL_SELECT)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Doctor updates referral status: PENDING → ARRIVED → ADMITTED.
 * Optional doctor_notes appended on each update.
 */
export const updateReferralStatus = async (id, { status, doctor_notes }) => {
  const existing = await getReferralById(id);

  if (!existing) return null;

  const validTransitions = {
    PENDING: ["ARRIVED"],
    ARRIVED: ["ADMITTED"],
    ADMITTED: [],
  };

  if (!validTransitions[existing.status]?.includes(status)) {
    return {
      error: `Cannot transition from ${existing.status} to ${status}`,
    };
  }

  const payload = { status };

  if (doctor_notes !== undefined) {
    payload.doctor_notes = doctor_notes;
  }

  const { data, error } = await supabase
    .from("referrals")
    .update(payload)
    .eq("id", id)
    .select(REFERRAL_SELECT)
    .single();

  if (error) throw error;
  return data;
};
