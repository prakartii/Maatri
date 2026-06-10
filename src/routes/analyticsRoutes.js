import express from "express";
import {
  getHeatmap,
  getDashboard,
  getRiskDistribution,
  getVillageStats,
} from "../controllers/analyticsController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate, requireRole("anm", "doctor"));

router.get("/heatmap", getHeatmap);
router.get("/dashboard", getDashboard);
router.get("/risk-distribution", getRiskDistribution);
router.get("/village-stats", getVillageStats);

export default router;
