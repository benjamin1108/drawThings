import { sendJson, readRequestBuffer } from "./http.js";
import { sanitizeFilename } from "./paths.js";

export async function readMultipartImage(req, res) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    sendJson(res, 400, { error: "multipart/form-data boundary is required." });
    return null;
  }
  const maxUploadBytes = Number(process.env.REFERENCE_UPLOAD_MAX_BYTES || 50 * 1024 * 1024);
  const body = await readRequestBuffer(req, res, maxUploadBytes);
  if (!body) return null;
  const boundary = boundaryMatch[1] || boundaryMatch[2];
  for (const part of splitMultipart(body, boundary)) {
    const separator = Buffer.from("\r\n\r\n");
    const separatorIndex = part.indexOf(separator);
    if (separatorIndex === -1) continue;
    const rawHeaders = part.slice(0, separatorIndex).toString("utf8");
    const data = trimMultipartPart(part.slice(separatorIndex + separator.length));
    const disposition = rawHeaders.match(/content-disposition:\s*([^\r\n]+)/i)?.[1] || "";
    const name = disposition.match(/name="([^"]+)"/i)?.[1] || "";
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1] || "";
    if (name !== "image" && !filename) continue;
    const mimeType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim() || "";
    if (!mimeType.startsWith("image/")) {
      sendJson(res, 400, { error: "Only image uploads are supported." });
      return null;
    }
    if (!data.byteLength) {
      sendJson(res, 400, { error: "Uploaded image is empty." });
      return null;
    }
    return { data, mimeType, filename: sanitizeFilename(filename || "reference-image") };
  }
  sendJson(res, 400, { error: "Image file is required." });
  return null;
}

function splitMultipart(body, boundary) {
  const delimiter = Buffer.from(`--${boundary}`);
  const parts = [];
  let searchFrom = 0;
  while (searchFrom < body.length) {
    const start = body.indexOf(delimiter, searchFrom);
    if (start === -1) break;
    const contentStart = start + delimiter.length;
    const next = body.indexOf(delimiter, contentStart);
    if (next === -1) break;
    let part = body.slice(contentStart, next);
    if (part.slice(0, 2).toString() === "--") break;
    if (part.slice(0, 2).toString() === "\r\n") part = part.slice(2);
    parts.push(part);
    searchFrom = next;
  }
  return parts;
}

function trimMultipartPart(buffer) {
  let end = buffer.length;
  while (end >= 2 && buffer[end - 2] === 13 && buffer[end - 1] === 10) end -= 2;
  return buffer.slice(0, end);
}
