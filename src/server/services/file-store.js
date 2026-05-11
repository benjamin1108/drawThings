import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { dataDir, imagesDir, mimeTypeToExt, safeDataPath, sanitizeFilename } from "../lib/paths.js";

export async function persistImagesToDisk(base64Images, taskId, completedAt) {
  const day = (completedAt || new Date().toISOString()).slice(0, 10);
  const dir = path.join(imagesDir, day);
  await fs.promises.mkdir(dir, { recursive: true });
  const results = [];
  for (let index = 0; index < base64Images.length; index += 1) {
    const buffer = Buffer.from(base64Images[index], "base64");
    const filePath = path.join(dir, `${taskId}-${index + 1}.png`);
    await fs.promises.writeFile(filePath, buffer);
    results.push(toStoredImage(filePath, buffer, index + 1));
  }
  return results;
}

export async function persistReferenceImagesToDisk(referenceImages, taskId, completedAt) {
  const list = Array.isArray(referenceImages) ? referenceImages : [];
  if (!list.length) return [];
  const day = (completedAt || new Date().toISOString()).slice(0, 10);
  const dir = path.join(imagesDir, day);
  await fs.promises.mkdir(dir, { recursive: true });
  const results = [];
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index];
    const localPath = String(item?.localPath || item?.local_path || "").trim();
    if (localPath) {
      const stored = await copyLocalReference(localPath, item, taskId, index + 1, dir);
      if (stored) results.push(stored);
      continue;
    }
    const base64 = String(item?.data || "");
    const mimeType = String(item?.mimeType || "");
    if (!base64 || !mimeType) continue;
    const buffer = Buffer.from(base64, "base64");
    const filePath = path.join(dir, `${taskId}-ref-${index + 1}.${mimeTypeToExt(mimeType)}`);
    await fs.promises.writeFile(filePath, buffer);
    results.push({ ...toStoredImage(filePath, buffer, index + 1), mimeType, kind: "reference" });
  }
  return results;
}

async function copyLocalReference(localPath, item, taskId, index, dir) {
  const sourcePath = safeDataPath(localPath);
  if (!sourcePath) return null;
  try {
    const buffer = await fs.promises.readFile(sourcePath);
    const ext = mimeTypeToExt(String(item?.mimeType || ""));
    const filePath = path.join(dir, `${taskId}-ref-${index}.${ext}`);
    await fs.promises.writeFile(filePath, buffer);
    return {
      ...toStoredImage(filePath, buffer, index),
      mimeType: item?.mimeType || "",
      kind: "reference",
      source: "file-api",
    };
  } catch {
    return null;
  }
}

export async function persistUploadedReferenceToDisk(buffer, mimeType, filename) {
  const day = new Date().toISOString().slice(0, 10);
  const dir = path.join(imagesDir, day);
  await fs.promises.mkdir(dir, { recursive: true });
  const ext = mimeTypeToExt(mimeType);
  const base = sanitizeFilename(filename).replace(/\.[^.]+$/, "") || "reference-image";
  const filePath = path.join(dir, `upload-${randomUUID()}-${base}.${ext}`);
  await fs.promises.writeFile(filePath, buffer);
  return toStoredImage(filePath, buffer, 1);
}

function toStoredImage(filePath, buffer, index) {
  return {
    index,
    path: path.relative(dataDir, filePath),
    bytes: buffer.byteLength,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}
