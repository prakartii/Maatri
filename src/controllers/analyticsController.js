import * as analyticsService from "../services/analyticsService.js";
import { success, error } from "../utils/apiResponse.js";

export const getHeatmap = async (req, res) => {
  try {
    const data = await analyticsService.getHeatmap();
    return success(res, data);
  } catch (err) {
    console.error("Heatmap error:", err.message);
    return error(res, "Failed to fetch heatmap data", 500);
  }
};

export const getDashboard = async (req, res) => {
  try {
    const data = await analyticsService.getDashboard();
    return success(res, data);
  } catch (err) {
    console.error("Dashboard error:", err.message);
    return error(res, "Failed to fetch dashboard data", 500);
  }
};

export const getRiskDistribution = async (req, res) => {
  try {
    const data = await analyticsService.getRiskDistribution();
    return success(res, data);
  } catch (err) {
    console.error("Risk distribution error:", err.message);
    return error(res, "Failed to fetch risk distribution", 500);
  }
};

export const getVillageStats = async (req, res) => {
  try {
    const data = await analyticsService.getVillageStats();
    return success(res, data);
  } catch (err) {
    console.error("Village stats error:", err.message);
    return error(res, "Failed to fetch village stats", 500);
  }
};
