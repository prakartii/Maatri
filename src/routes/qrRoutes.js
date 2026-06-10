import express from "express";
import { generateQr, scanQr } from "../controllers/qrController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/:patientId",
  authenticate,
  requireRole("anm"),
  generateQr
);

router.post("/scan", authenticate, requireRole("doctor"), scanQr);

export default router;
