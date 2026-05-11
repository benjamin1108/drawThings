import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const srcDir = path.resolve(__dirname, "..", "..");
export const rootDir = path.resolve(srcDir, "..");
export const publicDir = path.join(rootDir, "public");
export const dataDir = path.join(rootDir, "data");
export const auditDir = path.join(dataDir, "audit");
export const imagesDir = path.join(dataDir, "images");
export const auditFile = path.join(auditDir, "audit.jsonl");

export function normalizePath(urlPath) {
  const cleaned = (urlPath || "").split("?")[0].split("#")[0];
  const trimmed = cleaned === "/" ? "" : cleaned.replace(/^\//, "");
  if (!trimmed) return "";
  const normalized = path.posix.normalize(decodeURIComponent(trimmed));
  if (normalized.startsWith("..")) return "";
  return normalized.replace(/^\//, "");
}

export function safeDataPath(relPath) {
  const trimmed = String(relPath || "").trim();
  if (!trimmed) return null;
  const normalized = path.posix.normalize(trimmed.replace(/^\/+/, ""));
  if (normalized.startsWith("..")) return null;
  const resolved = path.join(dataDir, normalized);
  if (!resolved.startsWith(dataDir)) return null;
  return resolved;
}

export function sanitizeFilename(filename) {
  const cleaned = String(filename || "reference-image")
    .replace(/[\\/]/g, "-")
    .replace(/[^\w.\-\u4e00-\u9fa5]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
  return cleaned || "reference-image";
}

export function mimeTypeToExt(mimeType) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  return "bin";
}
