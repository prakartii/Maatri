import express from "express";
import { scanQr } from "../controllers/qrController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/scan", authenticate, requireRole("doctor"), scanQr);

export default router;
