import express from "express";
import multer from "multer";
import { uploadAudio, uploadImage } from "../controllers/uploadController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
});

router.use(authenticate, requireRole("anm", "doctor"));

router.post("/audio", upload.single("file"), uploadAudio);
router.post("/image", upload.single("file"), uploadImage);

export default router;
