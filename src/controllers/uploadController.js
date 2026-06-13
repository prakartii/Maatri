import * as uploadService from "../services/uploadService.js";
import { created, error } from "../utils/apiResponse.js";

export const uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "Audio file is required (field: file)", 400);
    }

    const result = await uploadService.uploadAudio(req.file, req.user.id);
    return created(res, result);
  } catch (err) {
    console.error("Audio upload error:", {
      message: err.message,
      statusCode: err.statusCode,
      error: err.error,
    });
    return error(res, `Failed to upload audio: ${err.message}`, 500);
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, "Image file is required (field: file)", 400);
    }

    const result = await uploadService.uploadImage(req.file, req.user.id);
    return created(res, result);
  } catch (err) {
    console.error("Image upload error:", {
      message: err.message,
      statusCode: err.statusCode,
      error: err.error,
    });
    return error(res, `Failed to upload image: ${err.message}`, 500);
  }
};
