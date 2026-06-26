const getAIServiceUrl = () => {
  const raw =
    process.env.MATRISCAN_AI_URL ??
    process.env.FASTAPI_URL ??
    "http://127.0.0.1:8001";
  // Strip trailing slashes so callers can safely append /ai/ocr etc.
  // If someone sets the env var to "https://host/docs" or "https://host/health"
  // those path suffixes are NOT stripped here — fix the env var on Render instead.
  return raw.replace(/\/+$/, "");
};

const BCP47 = { en: "en-IN", ta: "ta-IN", hi: "hi-IN" };
const LANG_PAIR = { ta: "en|ta", hi: "en|hi" };

/**
 * Translate English text to Tamil or Hindi using MyMemory free API.
 * Returns original text unchanged if lang is 'en' or API fails.
 */
const translateText = async (text, targetLang) => {
  if (!targetLang || targetLang === "en" || !LANG_PAIR[targetLang]) return text;

  const langpair = LANG_PAIR[targetLang];
  // Use project email to get 10k chars/day instead of 5k
  const emailParam = "crazyyyy1983@gmail.com";
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}&de=${encodeURIComponent(emailParam)}`;

  console.log(`[TRANSLATE] → MyMemory | langpair: ${langpair} | chars: ${text.length}`);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      console.log(`[TRANSLATE] ✓ translated ${text.length} chars → ${translated.length} chars`);
      return translated;
    }

    console.warn("[TRANSLATE] unexpected response:", JSON.stringify(data).slice(0, 200));
    return text;
  } catch (err) {
    console.warn("[TRANSLATE] ✗ API error:", err.message, "— returning English");
    return text;
  }
};

/**
 * Build a structured English care plan from risk and patient data (no AI required).
 */
const buildLocalCarePlan = (payload) => {
  const risk = String(
    payload.risk_result?.risk_color ||
    payload.risk_result?.overall_risk ||
    payload.patient?.risk ||
    "GREEN"
  ).toUpperCase();

  const plans = {
    RED: {
      doctor_advice:
        "Immediate obstetric review required. Arrange facility delivery with specialist cover. Monitor BP every 2 hours. Ensure IV access and magnesium sulfate available. Do not allow home delivery.",
      local_counseling:
        "This pregnancy needs hospital care right away. Please go to the nearest district hospital today. Take someone with you. Do not wait.",
      red_flags: [
        "Severe headache or visual disturbance",
        "Upper abdominal pain",
        "Facial or hand swelling",
        "Reduced fetal movements",
        "Vaginal bleeding",
      ],
      referral_urgency: "IMMEDIATE",
      followup_days: 1,
    },
    AMBER: {
      doctor_advice:
        "Schedule doctor review within 48 hours. Increase ANM visit frequency. Monitor blood pressure and Hb. Counsel on danger signs. Arrange institutional delivery plan.",
      local_counseling:
        "Your pregnancy needs extra care this week. Visit the health centre in the next 2 days. Eat iron-rich food and rest. Call ANM immediately if you feel unwell.",
      red_flags: [
        "Headache not relieved by rest",
        "Swelling of face or hands",
        "Decreased fetal movement",
        "Fever above 38°C",
      ],
      referral_urgency: "WITHIN_48H",
      followup_days: 3,
    },
    GREEN: {
      doctor_advice:
        "Continue routine antenatal care. Ensure all vaccinations up to date. Counsel on nutrition, rest, and birth preparedness. Schedule next ANC visit as per protocol.",
      local_counseling:
        "Your pregnancy is progressing normally. Keep eating well — green vegetables, dal, and fruit. Take your iron and calcium tablets every day. Come for your next check-up as scheduled.",
      red_flags: [
        "Any vaginal bleeding",
        "Severe headache",
        "No fetal movement for 12 hours",
        "High fever",
      ],
      referral_urgency: "ROUTINE",
      followup_days: 14,
    },
  };

  const plan = plans[risk] || plans.GREEN;
  return {
    ...plan,
    risk_color: risk,
    risk_explanation: `Patient classified as ${risk} risk based on current clinical parameters.`,
    _source: "local_template",
    _display_language: "en",
  };
};

/**
 * Forward a file buffer directly to Matriscan-AI OCR as multipart/form-data.
 * Matriscan-AI expects: POST /ai/ocr with field "image: UploadFile"
 */
export const extractLabReportFile = async (file) => {
  const aiBase = getAIServiceUrl();
  const aiUrl = `${aiBase}/ai/ocr`;

  // Diagnostic logs — verify URL and payload before the fetch hits the wire
  console.log("[OCR] AI BASE =", aiBase);
  console.log("[OCR] OCR URL =", aiUrl);
  console.log("[OCR] FETCH METHOD = POST");
  console.log(`[OCR] file: ${file.originalname} | size: ${file.size} bytes | mimetype: ${file.mimetype}`);

  const form = new FormData();
  form.append("image", new Blob([file.buffer], { type: file.mimetype }), file.originalname);

  console.log("[OCR] FORMDATA KEYS =", [...form.keys()]);

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
 * Generate a care plan.
 * Primary path: Matriscan-AI at MATRISCAN_AI_URL.
 * Fallback: local clinical template + MyMemory translation to requested language.
 */
export const generateCarePlan = async (payload) => {
  const lang = payload.language || "en";
  const aiUrl = `${getAIServiceUrl()}/ai/careplan`;
  console.log(`[CAREPLAN] → ${aiUrl} | language: ${lang}`);
  console.log("[CAREPLAN] payload:", JSON.stringify(payload));

  // Try Matriscan-AI first
  try {
    const response = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    console.log(`[CAREPLAN] ← status: ${response.status}`);
    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      // If AI returned content in English but Tamil/Hindi was requested, translate it
      if (lang !== "en" && data.doctor_advice) {
        console.log(`[CAREPLAN] AI responded — translating to ${lang} via MyMemory`);
        const [translatedAdvice, translatedCounseling] = await Promise.all([
          translateText(data.doctor_advice, lang),
          translateText(data.local_counseling || "", lang),
        ]);
        return {
          ...data,
          doctor_advice: translatedAdvice,
          local_counseling: translatedCounseling,
          _source: "matriscan_translated",
          _display_language: lang,
        };
      }
      return { ...data, _source: "matriscan_ai", _display_language: lang };
    }

    console.warn("[CAREPLAN] AI error response:", JSON.stringify(data).slice(0, 200));
  } catch (aiErr) {
    console.warn(`[CAREPLAN] ✗ Matriscan-AI unavailable: ${aiErr.message} — using local template`);
  }

  // Fallback: build local English template then translate
  const localPlan = buildLocalCarePlan(payload);
  console.log(`[CAREPLAN] built local template, risk: ${localPlan.risk_color}`);

  if (lang !== "en") {
    console.log(`[CAREPLAN] translating local template to ${lang}`);
    const [translatedAdvice, translatedCounseling] = await Promise.all([
      translateText(localPlan.doctor_advice, lang),
      translateText(localPlan.local_counseling, lang),
    ]);
    return {
      ...localPlan,
      doctor_advice: translatedAdvice,
      local_counseling: translatedCounseling,
      _display_language: lang,
    };
  }

  return localPlan;
};

/**
 * Call Matriscan-AI TTS. Returns binary audio buffer or JSON with audio_url.
 * On connection failure, returns { browser_tts_fallback: true } instead of throwing.
 */
export const generateTTS = async (text, language = "ta") => {
  const aiUrl = `${getAIServiceUrl()}/ai/tts`;
  console.log(`[TTS] → ${aiUrl} | language: ${language} | text length: ${text.length}`);

  let response;
  try {
    response = await fetch(aiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language }),
      signal: AbortSignal.timeout(12000),
    });
  } catch (connErr) {
    console.warn(`[TTS] ✗ Matriscan-AI unreachable: ${connErr.message} — signalling browser TTS fallback`);
    return { browser_tts_fallback: true, bcp47_language: BCP47[language] || language };
  }

  console.log(`[TTS] ← status: ${response.status}`);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    console.warn("[TTS] error response — signalling browser TTS fallback:", JSON.stringify(data).slice(0, 100));
    return { browser_tts_fallback: true, bcp47_language: BCP47[language] || language };
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
    const absoluteUrl = rawUrl.startsWith("/")
      ? `${getAIServiceUrl()}${rawUrl}`
      : rawUrl;

    console.log(`[TTS] proxying audio from ${absoluteUrl}`);
    try {
      const audioFetch = await fetch(absoluteUrl, { signal: AbortSignal.timeout(8000) });
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

    return { browser_tts_fallback: true, bcp47_language: BCP47[language] || language };
  }

  // If the response itself signals browser fallback (mock mode)
  if (data.browser_tts_fallback) {
    return { browser_tts_fallback: true, bcp47_language: BCP47[language] || language };
  }

  return data;
};
