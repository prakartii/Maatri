import * as authService from "../services/authService.js";
import { success, created, error } from "../utils/apiResponse.js";

/**
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, "Email and password are required", 400);
    }

    const result = await authService.login(email, password);

    if (result.error) {
      return error(res, result.error, 401);
    }

    return success(res, {
      token: result.token,
      user: result.user,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return error(res, "Login failed", 500);
  }
};

/**
 * POST /api/auth/register — Admin-only: create ANM or Admin accounts.
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      return error(res, "email, password, name, and role are required", 400);
    }

    if (!["admin", "anm"].includes(role)) {
      return error(res, "role must be 'admin' or 'anm'", 400);
    }

    if (password.length < 6) {
      return error(res, "Password must be at least 6 characters", 400);
    }

    const result = await authService.register({ email, password, name, role });

    if (result.error) {
      return error(res, result.error, 409);
    }

    return created(res, result.user);
  } catch (err) {
    console.error("Register error:", err.message);
    return error(res, "Registration failed", 500);
  }
};

/**
 * GET /api/auth/me — Return the currently authenticated user.
 */
export const getMe = async (req, res) => {
  try {
    return success(res, {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    });
  } catch (err) {
    console.error("Get me error:", err.message);
    return error(res, "Failed to fetch profile", 500);
  }
};
