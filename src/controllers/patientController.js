import supabase from "../config/supabase.js";

export const getPatients = async (req, res) => {
  const { data, error } = await supabase
    .from("patients")
    .select("*");

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
};

export const createPatient = async (req, res) => {
  const { name, age, village, phone, pregnancy_month, current_risk } =
    req.body;

  const { data, error } = await supabase
    .from("patients")
    .insert([
      {
        name,
        age,
        village,
        phone,
        pregnancy_month,
        current_risk,
      },
    ])
    .select();

  if (error) {
    return res.status(500).json(error);
  }

  res.json(data);
};