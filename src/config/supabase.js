import dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";

console.log("URL:", process.env.SUPABASE_URL);
console.log(
  "KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 15)
);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;