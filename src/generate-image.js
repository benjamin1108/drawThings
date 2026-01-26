import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import "dotenv/config";

const args = process.argv.slice(2);

const options = {
  out: "output.png",
  count: 1,
  aspect: undefined,
  size: undefined,
  negative: undefined,
  model: process.env.GEMINI_MODEL || "gemini-2.5-flash-image",
  baseUrl:
    process.env.GEMINI_BASE_URL ||
    "https://generativelanguage.googleapis.com/v1beta",
};

const positionals = [];
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--out") {
    options.out = args[i + 1];
    i += 1;
  } else if (arg === "--count") {
    options.count = Number(args[i + 1]);
    i += 1;
  } else if (arg === "--aspect") {
    options.aspect = args[i + 1];
    i += 1;
  } else if (arg === "--size") {
    options.size = args[i + 1];
    i += 1;
  } else if (arg === "--negative") {
    options.negative = args[i + 1];
    i += 1;
  } else if (arg === "--model") {
    options.model = args[i + 1];
    i += 1;
  } else if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}`);
    printHelp();
    process.exit(1);
  } else {
    positionals.push(arg);
  }
}

const prompt = positionals.join(" ").trim();
if (!prompt) {
  console.error("Missing prompt.");
  printHelp();
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env.");
  process.exit(1);
}

if (!Number.isFinite(options.count) || options.count <= 0) {
  console.error("--count must be a positive number.");
  process.exit(1);
}

const body = {
  contents: [
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ],
  generationConfig: {
    responseModalities: ["IMAGE"],
  },
};

if (options.aspect || options.size) {
  body.generationConfig.imageConfig = {};
  if (options.aspect) {
    body.generationConfig.imageConfig.aspectRatio = options.aspect;
  }
  if (options.size) {
    body.generationConfig.imageConfig.imageSize = options.size;
  }
}

if (options.negative) {
  body.generationConfig.negativePrompt = {
    text: options.negative,
  };
}

const response = await requestWithFallback({
  apiKey,
  model: options.model,
  baseUrl: options.baseUrl,
  body,
});

if (!response.ok) {
  const errorText = await response.text();
  console.error("API request failed:");
  console.error(`Status: ${response.status} ${response.statusText}`);
  if (errorText) {
    console.error(errorText);
  } else {
    console.error("Empty response body.");
  }
  process.exit(1);
}

const data = await response.json();
const images = extractImages(data);
if (images.length === 0) {
  console.error("No images returned.");
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

const outputs = writeImages(images, options.out);
for (const file of outputs) {
  console.log(`Saved: ${file}`);
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

function writeImages(base64Images, outputPath) {
  const results = [];
  const parsed = path.parse(outputPath);
  const multi = base64Images.length > 1;

  base64Images.forEach((base64, index) => {
    const suffix = multi ? `-${index + 1}` : "";
    const filename = path.join(
      parsed.dir,
      `${parsed.name}${suffix}${parsed.ext || ".png"}`
    );
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync(filename, buffer);
    results.push(filename);
  });

  return results;
}

function printHelp() {
  console.log(`Usage:
  node src/generate-image.js "your prompt" [options]

Options:
  --out <file>       Output file path (default: output.png)
  --count <n>        Number of images (default: 1)
  --aspect <ratio>   Aspect ratio like 1:1, 4:3, 16:9
  --size <size>      Image size like 1K, 2K, 4K (Gemini 3 Pro only)
  --negative <text>  Negative prompt text
  --model <id>       Model id (default: gemini-2.5-flash-image)
  -h, --help         Show this help
`);
}

async function requestWithFallback({ apiKey, model, baseUrl, body }) {
  const baseUrls = uniqueNonEmpty([
    baseUrl,
    "https://generativelanguage.googleapis.com/v1beta",
    "https://generativelanguage.googleapis.com/v1",
  ]);

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
      console.error("API request failed to send:");
      console.error(error?.message ?? error);
      process.exit(1);
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
