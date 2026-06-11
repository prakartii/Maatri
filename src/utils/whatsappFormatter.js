/**
 * Format a referral as a WhatsApp-ready message (text only — no API integration).
 */
export const generateReferralMessage = (patient, referral, hospital) => {
  const motherName = patient?.name ?? "Unknown";
  const village = patient?.village ?? "Unknown";
  const risk = patient?.current_risk ?? "UNKNOWN";
  const reason = referral?.referral_reason ?? "Not specified";
  const hospitalName = hospital?.name ?? referral?.hospitals?.name ?? "Unknown hospital";
  const referralId = referral?.id ?? "N/A";

  return [
    "🏥 *Maatri Referral Alert*",
    "",
    `👩 Mother: ${motherName}`,
    `📍 Village: ${village}`,
    `🚨 Risk Level: ${risk}`,
    `📋 Reason: ${reason}`,
    `🏨 Hospital: ${hospitalName}`,
    `🆔 Referral ID: ${referralId}`,
    "",
    "Please ensure timely care and confirm arrival at the facility.",
  ].join("\n");
};
