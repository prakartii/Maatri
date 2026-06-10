import * as hospitalService from "../services/hospitalService.js";
import { success, error } from "../utils/apiResponse.js";

/**
 * GET /api/hospitals
 */
export const getHospitals = async (req, res) => {
  try {
    const hospitals = await hospitalService.getAllHospitals();
    return success(res, hospitals);
  } catch (err) {
    console.error("Get hospitals error:", err.message);
    return error(res, "Failed to fetch hospitals", 500);
  }
};

/**
 * GET /api/hospitals/nearest?latitude=&longitude=&has_obgyn=&has_blood_bank=&limit=
 */
export const getNearestHospitals = async (req, res) => {
  try {
    const latitude = parseFloat(req.query.latitude);
    const longitude = parseFloat(req.query.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return error(res, "latitude and longitude query params are required", 400);
    }

    const hospitals = await hospitalService.getNearestHospitals({
      latitude,
      longitude,
      has_obgyn: req.query.has_obgyn === "true" ? true : undefined,
      has_blood_bank: req.query.has_blood_bank === "true" ? true : undefined,
      min_capacity: req.query.min_capacity
        ? parseInt(req.query.min_capacity, 10)
        : undefined,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 5,
    });

    return success(res, hospitals);
  } catch (err) {
    console.error("Get nearest hospitals error:", err.message);
    return error(res, "Failed to find nearest hospitals", 500);
  }
};
