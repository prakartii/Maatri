import express from "express";
import { getHospitals, getNearestHospitals } from "../controllers/hospitalController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

// /nearest must be registered before /:id if we add :id later
router.get("/nearest", requireRole("anm", "doctor"), getNearestHospitals);
router.get("/", requireRole("anm", "doctor"), getHospitals);

export default router;
