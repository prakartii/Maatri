import express from "express";
import { transcribe, ocr } from "../controllers/aiController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate, requireRole("anm", "doctor"));

router.post("/transcribe", transcribe);
router.post("/ocr", ocr);

export default router;
