export function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(Math.max(num, min), max);
}

export function parseModelList(value) {
  const raw = String(value || "").trim();
  if (!raw) return [];
  const withoutBrackets = raw.startsWith("[") && raw.endsWith("]") ? raw.slice(1, -1) : raw;
  return withoutBrackets
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function resolveImageModel(modelMode, explicitModel) {
  const requestedModel = String(explicitModel || "").trim();
  if (requestedModel) return requestedModel;
  const models = parseModelList(process.env.GEMINI_MODEL);
  if (!models.length) return undefined;
  const mode = String(modelMode || "").trim().toLowerCase();
  if (mode === "speed") return models[0];
  return models[1] || models[0];
}

export function normalizeReferenceImages(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 6)
    .map((item) => {
      const data = String(item?.data || "").trim();
      const fileUri = String(item?.fileUri || item?.file_uri || item?.uri || "").trim();
      const mimeType = String(item?.mimeType || item?.mime_type || "").trim();
      const name = String(item?.name || "").trim();
      const localPath = String(item?.localPath || item?.local_path || "").trim();
      if ((!data && !fileUri) || !mimeType) return null;
      return { data, fileUri, mimeType, name, localPath };
    })
    .filter(Boolean);
}
