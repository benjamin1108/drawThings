import process from "node:process";
import "dotenv/config";

export async function generateImages({
  prompt,
  count = 1,
  aspect,
  size,
  negative,
  referenceImages,
  model,
  baseUrl,
  apiKey,
}) {
  const resolvedPrompt = String(prompt || "").trim();
  if (!resolvedPrompt) {
    throw new Error("Missing prompt.");
  }

  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!resolvedApiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.");
  }

  const defaultModel = "gemini-3-pro-image-preview";
  const resolvedSize = normalizeImageSize(size);
  const envModels = parseModelList(process.env.GEMINI_MODEL);
  let resolvedModel = model || envModels[1] || envModels[0] || defaultModel;
  if (resolvedSize && !model && !envModels.length) {
    resolvedModel = "gemini-3-pro-image-preview";
  }
  const resolvedBaseUrl =
    baseUrl ||
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta";
  const useV1 = isV1Endpoint(resolvedBaseUrl);

  if (!Number.isFinite(count) || count <= 0) {
    throw new Error("count must be a positive number.");
  }

  const responseModalities =
    resolvedSize || resolvedModel.includes("gemini-3-pro-image-preview")
      ? ["TEXT", "IMAGE"]
      : ["IMAGE"];

  const resolvedReferences = normalizeReferenceImages(referenceImages);
  const body = buildRequestBody({
    prompt: resolvedPrompt,
    responseModalities,
    aspect,
    size: resolvedSize,
    useV1,
    referenceImages: resolvedReferences,
  });

  if (negative) {
    body.contents[0].parts[0].text = `${body.contents[0].parts[0].text}\n\n避免事项：${negative}`;
  }

  const images = [];
  const requestCount = Math.max(1, Math.ceil(count));
  for (let i = 0; i < requestCount && images.length < count; i += 1) {
    const response = await requestWithFallback({
      apiKey: resolvedApiKey,
      model: resolvedModel,
      baseUrl: resolvedBaseUrl,
      body,
    });

    if (!response?.ok) {
      const errorText = response ? await response.text() : "";
      const statusText = response ? `${response.status} ${response.statusText}` : "No response";
      const details = errorText ? `\n${errorText}` : "";
      throw new Error(`API request failed: ${statusText}${details}`);
    }

    const data = await response.json();
    const batch = extractImages(data);
    if (batch.length === 0) {
      throw new Error("No images returned.");
    }
    for (const base64 of batch) {
      images.push(base64);
      if (images.length >= count) {
        break;
      }
    }
  }

  return {
    images,
    model: resolvedModel,
    size: resolvedSize,
  };
}

export async function generateText({
  prompt,
  model,
  baseUrl,
  apiKey,
}) {
  const resolvedPrompt = String(prompt || "").trim();
  if (!resolvedPrompt) {
    throw new Error("Missing prompt.");
  }
  const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
  if (!resolvedApiKey) {
    throw new Error("Missing GEMINI_API_KEY in .env.");
  }
  const resolvedModel = model || process.env.GEMINI_TEXT_MODEL || "gemini-3-pro-preview";
  const resolvedBaseUrl =
    baseUrl ||
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta";
  const useV1 = isV1Endpoint(resolvedBaseUrl);
  const responseModalities = ["TEXT"];
  const body = buildTextRequestBody({
    prompt: resolvedPrompt,
    responseModalities,
    useV1,
  });

  const response = await requestWithFallback({
    apiKey: resolvedApiKey,
    model: resolvedModel,
    baseUrl: resolvedBaseUrl,
    body,
  });
  if (!response?.ok) {
    const errorText = response ? await response.text() : "";
    const statusText = response ? `${response.status} ${response.statusText}` : "No response";
    const details = errorText ? `\n${errorText}` : "";
    throw new Error(`API request failed: ${statusText}${details}`);
  }
  const data = await response.json();
  const text = extractText(data);
  if (!text) {
    throw new Error("No text returned.");
  }
  return text;
}

function normalizeImageSize(size) {
  if (!size) {
    return undefined;
  }
  const trimmed = String(size).trim();
  if (!trimmed) {
    return undefined;
  }
  const match = trimmed.match(/^(\d+)\s*[kK]$/);
  if (match) {
    return `${match[1]}K`;
  }
  return trimmed;
}

function parseModelList(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return [];
  }
  const withoutBrackets = raw.startsWith("[") && raw.endsWith("]")
    ? raw.slice(1, -1)
    : raw;
  return withoutBrackets
    .split(",")
    .map((item) => item.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function normalizeReferenceImages(referenceImages) {
  if (!Array.isArray(referenceImages)) {
    return [];
  }
  return referenceImages
    .map((item) => {
      const data = String(item?.data || "").trim();
      const mimeType = String(item?.mimeType || item?.mime_type || "").trim();
      if (!data || !mimeType) {
        return null;
      }
      return { data, mimeType };
    })
    .filter(Boolean);
}

function buildTextRequestBody({ prompt, responseModalities, useV1 }) {
  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];
  if (useV1) {
    return {
      contents,
      generation_config: {
        response_modalities: responseModalities,
      },
    };
  }
  return {
    contents,
    generationConfig: {
      responseModalities,
    },
  };
}

function buildRequestBody({
  prompt,
  responseModalities,
  aspect,
  size,
  useV1,
  referenceImages,
}) {
  const parts = [{ text: prompt }];
  referenceImages.forEach((image) => {
    if (useV1) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data,
        },
      });
      return;
    }
    parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    });
  });

  const contents = [
    {
      role: "user",
      parts,
    },
  ];

  if (useV1) {
    const generation_config = {};
    if (responseModalities?.length) {
      generation_config.response_modalities = responseModalities;
    }
    if (aspect || size) {
      generation_config.image_config = {};
      if (aspect) {
        generation_config.image_config.aspect_ratio = aspect;
      }
      if (size) {
        generation_config.image_config.image_size = size;
      }
    }
    return { contents, generation_config };
  }

  const generationConfig = {};
  if (responseModalities?.length) {
    generationConfig.responseModalities = responseModalities;
  }
  if (aspect || size) {
    generationConfig.imageConfig = {};
    if (aspect) {
      generationConfig.imageConfig.aspectRatio = aspect;
    }
    if (size) {
      generationConfig.imageConfig.imageSize = size;
    }
  }
  return { contents, generationConfig };
}

function extractText(payload) {
  if (Array.isArray(payload?.candidates)) {
    for (const candidate of payload.candidates) {
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        if (typeof part?.text === "string") {
          return part.text;
        }
      }
    }
  }
  if (Array.isArray(payload?.generatedText)) {
    const value = payload.generatedText.find((item) => item?.text)?.text;
    if (value) {
      return value;
    }
  }
  return "";
}

function extractImages(payload) {
  if (Array.isArray(payload?.generatedImages)) {
    return payload.generatedImages
      .map((item) => item?.bytesBase64Encoded)
      .filter(Boolean);
  }

  if (Array.isArray(payload?.candidates)) {
    const bytes = [];
    for (const candidate of payload.candidates) {
      const parts = candidate?.content?.parts ?? [];
      for (const part of parts) {
        const data = part?.inlineData?.data ?? part?.inline_data?.data;
        if (data) {
          bytes.push(data);
        }
      }
    }
    return bytes;
  }

  return [];
}

async function requestWithFallback({ apiKey, model, baseUrl, body }) {
  const baseUrls = uniqueNonEmpty([baseUrl]);

  let lastError;
  for (const base of baseUrls) {
    const endpoint = `${base}/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (response.status !== 404) {
        return response;
      }
      lastError = response;
    } catch (error) {
      const message = error?.message ?? error;
      throw new Error(`API request failed to send: ${message}`);
    }
  }

  return lastError;
}

function uniqueNonEmpty(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    if (!item || seen.has(item)) {
      continue;
    }
    seen.add(item);
    result.push(item);
  }
  return result;
}

function isV1Endpoint(url) {
  return url.includes("/v1") && !url.includes("/v1beta");
}
