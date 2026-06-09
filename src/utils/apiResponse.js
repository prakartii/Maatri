/**
 * Consistent JSON response helpers for controllers.
 */

export const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({ success: true, data });
};

export const created = (res, data) => success(res, data, 201);

export const error = (res, message, statusCode = 500) => {
  return res.status(statusCode).json({ success: false, error: message });
};
