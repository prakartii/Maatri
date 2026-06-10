import express from "express";
import {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferralStatus,
} from "../controllers/referralController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.post("/", requireRole("anm"), createReferral);
router.get("/", requireRole("doctor"), getReferrals);
router.get("/:id", requireRole("anm", "doctor"), getReferralById);
router.patch("/:id/status", requireRole("doctor"), updateReferralStatus);

export default router;
