import express from "express";
import {
  getPatients,
  getPatientById,
  getPatientQr,
  createPatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// All patient routes require authentication
router.use(authenticate);

router.get("/", requireRole("anm", "doctor"), getPatients);
router.get("/:id/qr", requireRole("anm"), getPatientQr);
router.get("/:id", requireRole("anm", "doctor"), getPatientById);
router.post("/", requireRole("anm"), createPatient);
router.put("/:id", requireRole("anm"), updatePatient);
router.delete("/:id", requireRole("anm"), deletePatient);

export default router;
