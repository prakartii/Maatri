const getFastApiUrl = () => process.env.FASTAPI_URL || "http://localhost:8000";

/**
 * Call FastAPI speech-to-text service.
 */
export const transcribeAudio = async (audioUrl) => {
  const response = await fetch(`${getFastApiUrl()}/ai/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ audio_url: audioUrl }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || "FastAPI transcribe request failed");
  }

  return data;
};

/**
 * Call FastAPI OCR service.
 */
export const extractTextFromImage = async (imageUrl) => {
  const response = await fetch(`${getFastApiUrl()}/ai/ocr`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.error || "FastAPI OCR request failed");
  }

  return data;
};
