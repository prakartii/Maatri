import express from "express";
import cors from "cors";
import patientRoutes from "./routes/patientRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MatriScan Backend Running",
  });
});

app.use("/api/patients", patientRoutes);

export default app;