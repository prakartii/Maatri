import supabase from "../config/supabase.js";

/**
 * Aggregate patient risk counts grouped by village with geo coordinates.
 */
export const getHeatmap = async () => {
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("village, current_risk");

  if (patientsError) throw patientsError;

  const { data: villages, error: villagesError } = await supabase
    .from("villages")
    .select("name, latitude, longitude");

  if (villagesError) throw villagesError;

  const villageMap = new Map(
    villages.map((v) => [v.name, { latitude: Number(v.latitude), longitude: Number(v.longitude) }])
  );

  const counts = {};

  for (const patient of patients) {
    const village = patient.village;

    if (!counts[village]) {
      counts[village] = { village, redCount: 0, amberCount: 0, greenCount: 0 };
    }

    if (patient.current_risk === "RED") counts[village].redCount++;
    else if (patient.current_risk === "AMBER") counts[village].amberCount++;
    else counts[village].greenCount++;
  }

  return Object.values(counts).map((entry) => {
    const geo = villageMap.get(entry.village);
    return {
      village: entry.village,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      redCount: entry.redCount,
      amberCount: entry.amberCount,
      greenCount: entry.greenCount,
    };
  });
};

/**
 * High-level dashboard KPIs.
 */
export const getDashboard = async () => {
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("current_risk");

  if (patientsError) throw patientsError;

  const { data: referrals, error: referralsError } = await supabase
    .from("referrals")
    .select("status");

  if (referralsError) throw referralsError;

  const riskCounts = { RED: 0, AMBER: 0, GREEN: 0 };

  for (const p of patients) {
    if (riskCounts[p.current_risk] !== undefined) {
      riskCounts[p.current_risk]++;
    }
  }

  return {
    total_patients: patients.length,
    red_patients: riskCounts.RED,
    amber_patients: riskCounts.AMBER,
    green_patients: riskCounts.GREEN,
    total_referrals: referrals.length,
    admitted_referrals: referrals.filter((r) => r.status === "ADMITTED").length,
  };
};

/**
 * Overall risk distribution (percentages + counts).
 */
export const getRiskDistribution = async () => {
  const { data: patients, error } = await supabase
    .from("patients")
    .select("current_risk");

  if (error) throw error;

  const total = patients.length;
  const counts = { RED: 0, AMBER: 0, GREEN: 0 };

  for (const p of patients) {
    if (counts[p.current_risk] !== undefined) {
      counts[p.current_risk]++;
    }
  }

  return {
    total,
    distribution: [
      {
        risk: "RED",
        count: counts.RED,
        percentage: total ? Math.round((counts.RED / total) * 1000) / 10 : 0,
      },
      {
        risk: "AMBER",
        count: counts.AMBER,
        percentage: total ? Math.round((counts.AMBER / total) * 1000) / 10 : 0,
      },
      {
        risk: "GREEN",
        count: counts.GREEN,
        percentage: total ? Math.round((counts.GREEN / total) * 1000) / 10 : 0,
      },
    ],
  };
};

/**
 * Per-village patient and risk breakdown.
 */
export const getVillageStats = async () => {
  const { data: patients, error } = await supabase
    .from("patients")
    .select("village, current_risk");

  if (error) throw error;

  const stats = {};

  for (const p of patients) {
    if (!stats[p.village]) {
      stats[p.village] = {
        village: p.village,
        total_patients: 0,
        redCount: 0,
        amberCount: 0,
        greenCount: 0,
      };
    }

    stats[p.village].total_patients++;

    if (p.current_risk === "RED") stats[p.village].redCount++;
    else if (p.current_risk === "AMBER") stats[p.village].amberCount++;
    else stats[p.village].greenCount++;
  }

  return Object.values(stats).sort((a, b) => b.total_patients - a.total_patients);
};
