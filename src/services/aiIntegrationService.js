const getAIServiceUrl = () =>
  process.env.MATRISCAN_AI_URL ||
  process.env.FASTAPI_URL ||
  "http://127.0.0.1:8001";

/**
 * Forward a file buffer directly to Matriscan-AI OCR as multipart/form-data.
 * Matriscan-AI expects: POST /ai/ocr with field "image: UploadFile"
 */
export const extractLabReportFile = async (file) => {
  const aiUrl = `${getAIServiceUrl()}/ai/ocr`;
  console.log(`[OCR] → ${aiUrl} | file: ${file.originalname} | size: ${file.size} bytes | mimetype: ${file.mimetype}`);

  const form = new FormData();
  form.append("image", new Blob([file.buffer], { type: file.mimetype }), file.originalname);

  const response = await fetch(aiUrl, {
    method: "POST",
    body: form,
  });

  console.log(`[OCR] ← status: ${response.status}`);

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[OCR] error response:", JSON.stringify(data));
    throw new Error(
      (Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(", ") : data.detail) ||
        data.error ||
        `Matriscan-AI OCR failed with status ${response.status}`
    );
  }

  console.log("[OCR] success, keys:", Object.keys(data).join(", "));
  return data;
};

/**
 * Legacy URL-based OCR — kept for backward compatibility but NOT used by the main flow.
 */
export const extractTextFromImage = async (imageUrl) => {
  const aiUrl = `${getAIServiceUrl()}/ai/ocr`;
  console.log(`[OCR-url] → ${aiUrl} | imageUrl: ${imageUrl}`);

  const form = new FormData();
  // Download the image and send as multipart — Matriscan-AI requires UploadFile not a URL.
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    throw new Error(`Could not download image from URL: ${imageUrl}`);
  }
  const imgBuffer = await imgRes.arrayBuffer();
  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const filename = imageUrl.split("/").pop() || "image.jpg";
  form.append("image", new Blob([imgBuffer], { type: contentType }), filename);

  const response = await fetch(aiUrl, { method: "POST", body: form });

  console.log(`[OCR-url] ← status: ${response.status}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[OCR-url] error response:", JSON.stringify(data));
    throw new Error(
      (Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(", ") : data.detail) ||
        data.error ||
        "AI OCR request failed"
    );
  }

  return data;
};

/**
 * Forward properly-structured AnalyzeRequest to Matriscan-AI.
 * Expected shape: { patient: PatientInfo, current_visit: VisitRecord, visit_history: [] }
 */
export const analyzeRisk = async (payload) => {
  const aiUrl = `${getAIServiceUrl()}/ai/analyze`;
  console.log(`[ANALYZE] → ${aiUrl}`);
  console.log("[ANALYZE] payload:", JSON.stringify(payload));

  const response = await fetch(aiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(`[ANALYZE] ← status: ${response.status}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[ANALYZE] error response:", JSON.stringify(data));
    throw new Error(
      (Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(", ") : data.detail) ||
        data.error ||
        "AI analyze request failed"
    );
  }

  return data;
};

/**
 * Forward properly-structured CarePlanRequest to Matriscan-AI.
 * Expected shape: { patient: PatientInfo, risk_result: Dict, language: str }
 */
export const generateCarePlan = async (payload) => {
  const aiUrl = `${getAIServiceUrl()}/ai/careplan`;
  console.log(`[CAREPLAN] → ${aiUrl}`);
  console.log("[CAREPLAN] payload:", JSON.stringify(payload));

  const response = await fetch(aiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  console.log(`[CAREPLAN] ← status: ${response.status}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[CAREPLAN] error response:", JSON.stringify(data));
    throw new Error(
      (Array.isArray(data.detail) ? data.detail.map((d) => d.msg).join(", ") : data.detail) ||
        data.error ||
        "AI careplan request failed"
    );
  }

  return data;
};

/**
 * Call Matriscan-AI TTS. Returns binary audio buffer or JSON with audio_url.
 */
export const generateTTS = async (text, language = "ta") => {
  const aiUrl = `${getAIServiceUrl()}/ai/tts`;
  console.log(`[TTS] → ${aiUrl} | language: ${language} | text length: ${text.length}`);

  const response = await fetch(aiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language }),
  });

  console.log(`[TTS] ← status: ${response.status}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.error("[TTS] error response:", JSON.stringify(data));
    throw new Error(data.detail || data.error || "AI TTS request failed");
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("audio/")) {
    const audioBuffer = await response.arrayBuffer();
    return { audio_buffer: audioBuffer, content_type: contentType };
  }

  // JSON response — may contain audio_url (possibly relative to the AI server)
  const data = await response.json().catch(() => ({}));

  const rawUrl = data.audio_url || data.url;
  if (rawUrl) {
    // Relative path → resolve against AI server base URL and proxy the audio
    const absoluteUrl = rawUrl.startsWith("/")
      ? `${getAIServiceUrl()}${rawUrl}`
      : rawUrl;

    console.log(`[TTS] proxying audio from ${absoluteUrl}`);
    try {
      const audioFetch = await fetch(absoluteUrl);
      if (audioFetch.ok) {
        const audioBuffer = await audioFetch.arrayBuffer();
        const ct = audioFetch.headers.get("content-type") || "audio/mpeg";
        console.log(`[TTS] proxied ${audioBuffer.byteLength} bytes (${ct})`);
        return { audio_buffer: audioBuffer, content_type: ct };
      }
      console.warn(`[TTS] audio file fetch failed: ${audioFetch.status} — signalling browser fallback`);
    } catch (fetchErr) {
      console.warn("[TTS] audio file fetch error:", fetchErr.message);
    }

    // Could not retrieve the audio file — tell the frontend to use browser TTS
    return {
      browser_tts_fallback: true,
      bcp47_language: data.language || null,
    };
  }

  return data;
};
