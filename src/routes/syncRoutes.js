import express from "express";
import { syncData, getSyncStatus } from "../controllers/syncController.js";
import { batchSyncData } from "../controllers/batchSyncController.js";
import { authenticate, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate, requireRole("anm"));

router.post("/batch", batchSyncData);
router.post("/", syncData);
router.get("/status", getSyncStatus);

export default router;
