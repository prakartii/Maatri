import * as qrService from "../services/qrService.js";
import { success, error } from "../utils/apiResponse.js";

/**
 * GET /api/qr/:patientId — ANM generates patient QR card
 */
export const generateQr = async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await qrService.generatePatientQr(patientId);

    if (result.error) {
      return error(res, result.error, 404);
    }

    return success(res, result);
  } catch (err) {
    console.error("Generate QR error:", err.message);
    return error(res, "Failed to generate QR card", 500);
  }
};

/**
 * POST /api/qr/scan — Doctor scans patient QR at hospital intake
 */
export const scanQr = async (req, res) => {
  try {
    const { qr_token } = req.body;

    if (!qr_token) {
      return error(res, "qr_token is required", 400);
    }

    const result = await qrService.scanQrToken(qr_token);

    if (result.error) {
      return error(res, result.error, 404);
    }

    return success(res, result);
  } catch (err) {
    console.error("QR scan error:", err.message);
    return error(res, "Failed to scan QR code", 500);
  }
};
