import dotenv from "dotenv";
dotenv.config();
console.log("URL:", process.env.SUPABASE_URL);

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});