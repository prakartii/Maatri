import * as aiIntegrationService from "../services/aiIntegrationService.js";
import { success, error } from "../utils/apiResponse.js";

/**
 * POST /api/ai/ocr
 * Accepts a multipart file (field: "file") via multer, or falls back to JSON { imageUrl }.
 * Forwards as multipart/form-data to Matriscan-AI with field name "image".
 */
export const ocr = async (req, res) => {
  try {
    let result;

    if (req.file) {
      // Primary path: file uploaded via multer
      result = await aiIntegrationService.extractLabReportFile(req.file);
    } else {
      // Fallback: JSON body with image URL
      const { imageUrl, image_url } = req.body;
      const url = imageUrl || image_url;

      if (!url) {
        return error(res, "Either upload a file or provide imageUrl", 400);
      }

      result = await aiIntegrationService.extractTextFromImage(url);
    }

    return success(res, result);
  } catch (err) {
    console.error("AI OCR error:", err.message);
    return error(res, err.message || "OCR failed", 502);
  }
};

/**
 * POST /api/ai/analyze
 * Expects a fully-formed AnalyzeRequest body (built by the frontend):
 * { patient: PatientInfo, current_visit: VisitRecord, visit_history: [] }
 */
export const analyze = async (req, res) => {
  try {
    const result = await aiIntegrationService.analyzeRisk(req.body);
    return success(res, result);
  } catch (err) {
    console.error("AI analyze error:", err.message);
    return error(res, err.message || "Risk analysis failed", 502);
  }
};

/**
 * POST /api/ai/careplan
 * Expects a fully-formed CarePlanRequest body (built by the frontend):
 * { patient: PatientInfo, risk_result: Dict, language: str }
 */
export const careplan = async (req, res) => {
  try {
    const result = await aiIntegrationService.generateCarePlan(req.body);
    return success(res, result);
  } catch (err) {
    console.error("AI careplan error:", err.message);
    return error(res, err.message || "Care plan generation failed", 502);
  }
};

export const tts = async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text) {
      return error(res, "text is required", 400);
    }

    const result = await aiIntegrationService.generateTTS(text, language || "ta");

    if (result.audio_buffer) {
      res.set("Content-Type", result.content_type || "audio/mpeg");
      res.send(Buffer.from(result.audio_buffer));
      return;
    }

    return success(res, result);
  } catch (err) {
    console.error("AI TTS error:", err.message);
    return error(res, err.message || "TTS generation failed", 502);
  }
};
