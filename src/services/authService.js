import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../config/supabase.js";

const SALT_ROUNDS = 10;

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
};

/**
 * Find a user by email (excludes password_hash from returned shape in callers).
 */
export const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, password_hash, name, role, created_at")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }

  return data;
};

/**
 * Verify credentials and return a signed JWT.
 */
export const login = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    return { error: "Invalid email or password" };
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

  const { password_hash, ...safeUser } = user;

  return { token, user: safeUser };
};

/**
 * Register a new health worker or admin account.
 */
export const register = async ({ email, password, name, role }) => {
  const existing = await findUserByEmail(email);

  if (existing) {
    return { error: "Email already registered" };
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data, error } = await supabase
    .from("users")
    .insert([
      {
        email: email.toLowerCase().trim(),
        password_hash,
        name,
        role,
      },
    ])
    .select("id, email, name, role, created_at")
    .single();

  if (error) throw error;

  return { user: data };
};
