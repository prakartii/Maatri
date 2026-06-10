import express from "express";
import { login, register, getMe } from "../controllers/authController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", authenticate, requireRole("doctor"), register);
router.get("/me", authenticate, getMe);

export default router;
