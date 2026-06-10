import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import visitRoutes from "./routes/visitRoutes.js";
import referralRoutes from "./routes/referralRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import qrRoutes from "./routes/qrRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import followupRoutes from "./routes/followupRoutes.js";
import syncRoutes from "./routes/syncRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Maatri Backend Running",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/qr", qrRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/followups", followupRoutes);
app.use("/api/sync", syncRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Route not found" });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

export default app;
