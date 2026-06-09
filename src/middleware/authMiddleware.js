import jwt from "jsonwebtoken";
import { error } from "../utils/apiResponse.js";

/**
 * Verify JWT from Authorization: Bearer <token> header.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return error(res, "Authentication required", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return error(res, "Invalid or expired token", 401);
  }
};

/**
 * Restrict route to specific roles (e.g. requireRole('admin')).
 * Must be used after authenticate middleware.
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, "Authentication required", 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, "Insufficient permissions", 403);
    }

    next();
  };
};
