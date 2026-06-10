/**
 * Seed default Doctor and ANM users for development.
 * Usage: npm run seed:users
 */
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcrypt";
import supabase from "../src/config/supabase.js";

const USERS = [
  {
    email: process.env.SEED_DOCTOR_EMAIL || "doctor@maatri.org",
    password: process.env.SEED_DOCTOR_PASSWORD || "doctor123",
    name: process.env.SEED_DOCTOR_NAME || "Dr. Sharma",
    role: "doctor",
  },
  {
    email: process.env.SEED_ANM_EMAIL || "anm@maatri.org",
    password: process.env.SEED_ANM_PASSWORD || "anm123",
    name: process.env.SEED_ANM_NAME || "ANM Priya",
    role: "anm",
  },
];

async function seedUsers() {
  for (const user of USERS) {
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (existing) {
      console.log(`User already exists: ${user.email}`);
      continue;
    }

    const password_hash = await bcrypt.hash(user.password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email: user.email,
          password_hash,
          name: user.name,
          role: user.role,
        },
      ])
      .select("id, email, name, role")
      .single();

    if (error) {
      console.error(`Seed failed for ${user.email}:`, error.message);
      process.exit(1);
    }

    console.log("Created:", data, `| password: ${user.password}`);
  }
}

seedUsers();
