/**
 * One-time script to create the first admin user.
 * Usage: node scripts/seedAdmin.js
 */
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import supabase from "../src/config/supabase.js";

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@maatri.org";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "System Admin";

async function seedAdmin() {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", ADMIN_EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    return;
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: ADMIN_EMAIL,
        password_hash,
        name: ADMIN_NAME,
        role: "admin",
      },
    ])
    .select("id, email, name, role")
    .single();

  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }

  console.log("Admin user created:", data);
  console.log(`Login with email: ${ADMIN_EMAIL} / password: ${ADMIN_PASSWORD}`);
}

seedAdmin();
