import express from "express";
import multer from "multer";
import { ocr, analyze, careplan, tts } from "../controllers/aiController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

router.use(authenticate, requireRole("anm", "doctor"));

router.post("/ocr", upload.single("file"), ocr);
router.post("/analyze", analyze);
router.post("/careplan", careplan);
router.post("/tts", tts);

export default router;
