/**
 * Risk Engine — triages maternal health based on vitals and symptoms.
 *
 * Priority: RED > AMBER > GREEN (worst condition wins).
 */

// Keywords that indicate severe / emergency symptoms
const SEVERE_SYMPTOM_KEYWORDS = [
  "severe bleeding",
  "heavy bleeding",
  "convulsion",
  "seizure",
  "unconscious",
  "blurred vision",
  "severe headache",
  "chest pain",
  "difficulty breathing",
  "reduced fetal movement",
  "no fetal movement",
  "high fever",
  "severe abdominal pain",
];

/**
 * Check if symptoms text contains any severe indicators.
 */
const hasSevereSymptoms = (symptoms) => {
  if (!symptoms || typeof symptoms !== "string") return false;

  const normalized = symptoms.toLowerCase();
  return SEVERE_SYMPTOM_KEYWORDS.some((keyword) =>
    normalized.includes(keyword)
  );
};

/**
 * Classify blood pressure into risk tier.
 */
const classifyBP = (systolic, diastolic) => {
  if (systolic == null || diastolic == null) return "GREEN";

  // Hypertensive crisis / high risk
  if (systolic >= 140 || diastolic >= 90) return "RED";

  // Slightly elevated (pre-hypertension range)
  if (systolic >= 130 || diastolic >= 80) return "AMBER";

  return "GREEN";
};

/**
 * Classify hemoglobin into risk tier.
 */
const classifyHemoglobin = (hemoglobin) => {
  if (hemoglobin == null) return "GREEN";

  if (hemoglobin < 7) return "RED";
  if (hemoglobin < 10) return "AMBER";

  return "GREEN";
};

/**
 * Return the higher-priority risk level.
 */
const maxRisk = (a, b) => {
  const priority = { RED: 3, AMBER: 2, GREEN: 1 };
  return priority[a] >= priority[b] ? a : b;
};

/**
 * Calculate overall risk from visit vitals and symptoms.
 *
 * @param {Object} vitals
 * @param {number} [vitals.systolic_bp]
 * @param {number} [vitals.diastolic_bp]
 * @param {number} [vitals.hemoglobin]
 * @param {string} [vitals.symptoms]
 * @returns {'RED' | 'AMBER' | 'GREEN'}
 */
export const calculateRisk = ({ systolic_bp, diastolic_bp, hemoglobin, symptoms }) => {
  let risk = "GREEN";

  risk = maxRisk(risk, classifyBP(systolic_bp, diastolic_bp));
  risk = maxRisk(risk, classifyHemoglobin(hemoglobin));

  if (hasSevereSymptoms(symptoms)) {
    risk = "RED";
  }

  return risk;
};

export default { calculateRisk };
