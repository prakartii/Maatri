import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

const requiredEnv = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

app.listen(PORT, () => {
  const aiBase = (
    process.env.MATRISCAN_AI_URL ??
    process.env.FASTAPI_URL ??
    "http://127.0.0.1:8001"
  ).replace(/\/+$/, "");
  console.log(`Maatri server running on port ${PORT}`);
  console.log(`[STARTUP] MATRISCAN_AI_URL = ${process.env.MATRISCAN_AI_URL ?? "(not set)"}`);
  console.log(`[STARTUP] Effective AI base = ${aiBase}`);
  console.log(`[STARTUP] OCR endpoint will be = ${aiBase}/ai/ocr`);
});
