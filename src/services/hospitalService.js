import supabase from "../config/supabase.js";
import { sortByNearest } from "../utils/geo.js";

export const getAllHospitals = async () => {
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
};

export const getHospitalById = async (id) => {
  const { data, error } = await supabase
    .from("hospitals")
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
 * Find nearest hospitals from a GPS coordinate.
 * Optional filters: has_obgyn, has_blood_bank, min_capacity
 */
export const getNearestHospitals = async ({
  latitude,
  longitude,
  has_obgyn,
  has_blood_bank,
  min_capacity,
  limit = 5,
}) => {
  let query = supabase.from("hospitals").select("*");

  if (has_obgyn === true) query = query.eq("has_obgyn", true);
  if (has_blood_bank === true) query = query.eq("has_blood_bank", true);
  if (min_capacity != null) query = query.gte("capacity", min_capacity);

  const { data, error } = await query;

  if (error) throw error;

  return sortByNearest(data, latitude, longitude).slice(0, limit);
};
