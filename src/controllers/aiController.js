import * as aiIntegrationService from "../services/aiIntegrationService.js";
import { success, error } from "../utils/apiResponse.js";

/**
 * POST /api/ai/transcribe — forward audio URL to FastAPI
 */
export const transcribe = async (req, res) => {
  try {
    const { audioUrl, audio_url } = req.body;
    const url = audioUrl || audio_url;

    if (!url) {
      return error(res, "audioUrl is required", 400);
    }

    const result = await aiIntegrationService.transcribeAudio(url);
    return success(res, result);
  } catch (err) {
    console.error("AI transcribe error:", err.message);
    return error(res, err.message || "Transcription failed", 502);
  }
};

/**
 * POST /api/ai/ocr — forward image URL to FastAPI
 */
export const ocr = async (req, res) => {
  try {
    const { imageUrl, image_url } = req.body;
    const url = imageUrl || image_url;

    if (!url) {
      return error(res, "imageUrl is required", 400);
    }

    const result = await aiIntegrationService.extractTextFromImage(url);
    return success(res, result);
  } catch (err) {
    console.error("AI OCR error:", err.message);
    return error(res, err.message || "OCR failed", 502);
  }
};
