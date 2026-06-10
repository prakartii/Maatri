import express from "express";
import {
  getVisitsByPatient,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
} from "../controllers/visitController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/patient/:patientId", requireRole("anm", "doctor"), getVisitsByPatient);
router.get("/:id", requireRole("anm", "doctor"), getVisitById);
router.post("/", requireRole("anm"), createVisit);
router.put("/:id", requireRole("anm"), updateVisit);
router.delete("/:id", requireRole("anm"), deleteVisit);

export default router;
