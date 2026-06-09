import express from "express";
import {
  getVisitsByPatient,
  getVisitById,
  createVisit,
  updateVisit,
  deleteVisit,
} from "../controllers/visitController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/patient/:patientId", getVisitsByPatient);
router.get("/:id", getVisitById);
router.post("/", createVisit);
router.put("/:id", updateVisit);
router.delete("/:id", deleteVisit);

export default router;
