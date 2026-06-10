import express from "express";
import {
  getFollowups,
  createFollowup,
  updateFollowup,
} from "../controllers/followupController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/", requireRole("anm", "doctor"), getFollowups);
router.post("/", requireRole("anm"), createFollowup);
router.patch("/:id", requireRole("anm"), updateFollowup);

export default router;
