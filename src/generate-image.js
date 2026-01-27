import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { generateImages } from "./gemini-client.js";

const args = process.argv.slice(2);

const options = {
  out: "output.png",
  count: 1,
  aspect: undefined,
  size: undefined,
  negative: undefined,
  model: undefined,
  baseUrl: undefined,
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

if (!Number.isFinite(options.count) || options.count <= 0) {
  console.error("--count must be a positive number.");
  process.exit(1);
}

let images;
try {
  const result = await generateImages({
    prompt,
    count: options.count,
    aspect: options.aspect,
    size: options.size,
    negative: options.negative,
    model: options.model,
    baseUrl: options.baseUrl,
  });
  images = result.images;
} catch (error) {
  console.error(error?.message ?? error);
  process.exit(1);
}

const outputs = writeImages(images, options.out);
for (const file of outputs) {
  console.log(`Saved: ${file}`);
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
  --model <id>       Model id (default: gemini-3-pro-image-preview)
  -h, --help         Show this help
`);
}
