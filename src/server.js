import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { generateImages } from "./gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");
const dataDir = path.join(__dirname, "..", "data");
const auditDir = path.join(dataDir, "audit");
const imagesDir = path.join(dataDir, "images");
const auditFile = path.join(auditDir, "audit.jsonl");

const tasks = new Map();
const sessions = new Map();
ensureDataDirs();

const server = createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", "http://localhost");
    const pathname = requestUrl.pathname;

    if (req.method === "POST" && pathname === "/api/tasks") {
      const body = await readJsonBody(req, res);
      if (!body) {
        return;
      }

      const prompt = String(body.prompt || "").trim();
      if (!prompt) {
        sendJson(res, 400, { error: "Prompt is required." });
        return;
      }

      const count = clampNumber(body.count, 1, 2, 2);
      const aspect = body.aspect ? String(body.aspect) : "16:9";
      const negative = body.negative ? String(body.negative) : undefined;
      const size = body.size ? String(body.size) : undefined;
      const templatePrompt = body.templatePrompt ? String(body.templatePrompt) : "";
      const userContent = body.userContent ? String(body.userContent) : "";
      const finalPrompt = body.finalPrompt ? String(body.finalPrompt) : prompt;
      const referenceImages = normalizeReferenceImages(body.referenceImages);
      const desiredCount = referenceImages.length > 0 ? 1 : count;

      const taskId = createTask({
        prompt: finalPrompt,
        count: desiredCount,
        aspect,
        negative,
        size,
        model: body.model,
        templatePrompt,
        userContent,
        finalPrompt,
        referenceImages,
      });

      sendJson(res, 202, { taskId });
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/tasks/")) {
      const taskId = decodeURIComponent(pathname.replace("/api/tasks/", ""));
      const task = tasks.get(taskId);
      if (!task) {
        sendJson(res, 404, { error: "Task not found." });
        return;
      }
      sendJson(res, 200, task);
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/login") {
      const body = await readJsonBody(req, res);
      if (!body) {
        return;
      }
      if (!process.env.ADMIN_PASSWORD) {
        sendJson(res, 500, { error: "ADMIN_PASSWORD is not set on the server." });
        return;
      }
      const password = String(body.password || "");
      if (!checkAdminPassword(password)) {
        sendJson(res, 401, { error: "Invalid password." });
        return;
      }
      const token = randomUUID();
      sessions.set(token, {
        token,
        createdAt: Date.now(),
      });
      setSessionCookie(res, token);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && pathname === "/api/admin/logout") {
      const token = parseCookies(req.headers.cookie).admin_session;
      if (token) {
        sessions.delete(token);
      }
      clearSessionCookie(res);
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "GET" && pathname === "/api/audit") {
      if (!requireAdmin(req, res)) {
        return;
      }
      const limit = clampNumber(requestUrl.searchParams.get("limit"), 1, 100, 50);
      const offset = clampNumber(requestUrl.searchParams.get("offset"), 0, 5000, 0);
      const entries = await readAuditEntries(limit, offset);
      sendJson(res, 200, {
        entries,
        limit,
        offset,
      });
      return;
    }

    if (req.method === "GET" && pathname === "/api/audit-image") {
      if (!requireAdmin(req, res)) {
        return;
      }
      const relPath = requestUrl.searchParams.get("path") || "";
      const filePath = safeDataPath(relPath);
      if (!filePath) {
        sendJson(res, 400, { error: "Invalid path." });
        return;
      }
      try {
        const data = await fs.promises.readFile(filePath);
        res.statusCode = 200;
        res.setHeader("Content-Type", contentType(filePath));
        res.end(data);
      } catch {
        sendJson(res, 404, { error: "Image not found." });
      }
      return;
    }

    if (req.method === "GET" && pathname.startsWith("/api/audit/")) {
      if (!requireAdmin(req, res)) {
        return;
      }
      const auditId = decodeURIComponent(pathname.replace("/api/audit/", ""));
      const entry = await readAuditEntryById(auditId);
      if (!entry) {
        sendJson(res, 404, { error: "Audit entry not found." });
        return;
      }
      sendJson(res, 200, entry);
      return;
    }

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const safePath = normalizePath(pathname);
    const filePath = path.join(publicDir, safePath || "index.html");

    if (!filePath.startsWith(publicDir)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }

    const data = await fs.promises.readFile(filePath);
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType(filePath));
    res.end(data);
  } catch (error) {
    const message = error?.message ?? "Server error";
    res.statusCode = 500;
    res.end(message);
  }
});

const port = Number(process.env.UI_PORT || 5173);
server.listen(port, () => {
  console.log(`UI server running on http://localhost:${port}`);
});

function normalizePath(urlPath) {
  const cleaned = (urlPath || "").split("?")[0].split("#")[0];
  const trimmed = cleaned === "/" ? "" : cleaned.replace(/^\//, "");
  if (!trimmed) {
    return "";
  }
  const normalized = path.posix.normalize(decodeURIComponent(trimmed));
  if (normalized.startsWith("..")) {
    return "";
  }
  return normalized.replace(/^\//, "");
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) {
    return "text/html; charset=utf-8";
  }
  if (filePath.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }
  if (filePath.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }
  if (filePath.endsWith(".svg")) {
    return "image/svg+xml";
  }
  if (filePath.endsWith(".png")) {
    return "image/png";
  }
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (filePath.endsWith(".jsonl") || filePath.endsWith(".json")) {
    return "application/json; charset=utf-8";
  }
  return "application/octet-stream";
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req, res) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) {
    sendJson(res, 400, { error: "Empty request body." });
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON." });
    return null;
  }
}

function clampNumber(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return fallback;
  }
  return Math.min(Math.max(num, min), max);
}

function createTask(payload) {
  const taskId = randomUUID();
  const createdAt = new Date().toISOString();
  const startedAt = Date.now();
  const task = {
    id: taskId,
    status: "pending",
    createdAt,
    model: payload.model,
    size: payload.size,
  };
  tasks.set(taskId, task);
  pruneTasks();

  generateImages(payload)
    .then(async (result) => {
      task.status = "completed";
      task.images = result.images;
      task.model = result.model;
      task.size = result.size;
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      const savedReferences = await persistReferenceImagesToDisk(
        payload.referenceImages,
        taskId,
        completedAt
      );
      const savedImages = await persistImagesToDisk(result.images, taskId, completedAt);
      const auditId = randomUUID();
      task.auditId = auditId;
      task.completedAt = completedAt;
      task.latencyMs = latencyMs;
      task.savedImages = savedImages.map((item) => item.path);
      task.savedReferences = savedReferences.map((item) => item.path);
      await writeAuditEntry({
        id: auditId,
        taskId,
        status: "completed",
        createdAt,
        completedAt,
        latencyMs,
        model: result.model,
        aspect: payload.aspect,
        size: result.size,
        promptTemplate: payload.templatePrompt || "",
        promptUser: payload.userContent || "",
        promptFinal: payload.finalPrompt || payload.prompt,
        negative: payload.negative || "",
        images: savedImages,
        references: savedReferences,
      });
    })
    .catch(async (error) => {
      task.status = "error";
      task.error = error?.message ?? String(error);
      const completedAt = new Date().toISOString();
      const latencyMs = Date.now() - startedAt;
      const auditId = randomUUID();
      task.auditId = auditId;
      task.completedAt = completedAt;
      task.latencyMs = latencyMs;
      const savedReferences = await persistReferenceImagesToDisk(
        payload.referenceImages,
        taskId,
        completedAt
      );
      task.savedReferences = savedReferences.map((item) => item.path);
      await writeAuditEntry({
        id: auditId,
        taskId,
        status: "error",
        createdAt,
        completedAt,
        latencyMs,
        model: payload.model,
        aspect: payload.aspect,
        size: payload.size,
        promptTemplate: payload.templatePrompt || "",
        promptUser: payload.userContent || "",
        promptFinal: payload.finalPrompt || payload.prompt,
        negative: payload.negative || "",
        error: task.error,
        images: [],
        references: savedReferences,
      });
    });

  return taskId;
}

function pruneTasks() {
  const maxTasks = 30;
  if (tasks.size <= maxTasks) {
    return;
  }
  const entries = Array.from(tasks.values()).sort((a, b) => {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  while (entries.length > maxTasks) {
    const oldest = entries.shift();
    if (oldest) {
      tasks.delete(oldest.id);
    }
  }
}

function ensureDataDirs() {
  fs.mkdirSync(auditDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });
}

async function persistImagesToDisk(base64Images, taskId, completedAt) {
  const day = (completedAt || new Date().toISOString()).slice(0, 10);
  const dir = path.join(imagesDir, day);
  await fs.promises.mkdir(dir, { recursive: true });
  const results = [];
  for (let i = 0; i < base64Images.length; i += 1) {
    const base64 = base64Images[i];
    const buffer = Buffer.from(base64, "base64");
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const filename = `${taskId}-${i + 1}.png`;
    const filePath = path.join(dir, filename);
    await fs.promises.writeFile(filePath, buffer);
    results.push({
      index: i + 1,
      path: path.relative(dataDir, filePath),
      bytes: buffer.byteLength,
      sha256,
    });
  }
  return results;
}

async function persistReferenceImagesToDisk(referenceImages, taskId, completedAt) {
  const list = Array.isArray(referenceImages) ? referenceImages : [];
  if (!list.length) {
    return [];
  }
  const day = (completedAt || new Date().toISOString()).slice(0, 10);
  const dir = path.join(imagesDir, day);
  await fs.promises.mkdir(dir, { recursive: true });
  const results = [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    const base64 = String(item?.data || "");
    const mimeType = String(item?.mimeType || "");
    if (!base64 || !mimeType) {
      continue;
    }
    const buffer = Buffer.from(base64, "base64");
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const ext = mimeTypeToExt(mimeType);
    const filename = `${taskId}-ref-${i + 1}.${ext}`;
    const filePath = path.join(dir, filename);
    await fs.promises.writeFile(filePath, buffer);
    results.push({
      index: i + 1,
      path: path.relative(dataDir, filePath),
      bytes: buffer.byteLength,
      sha256,
      mimeType,
      kind: "reference",
    });
  }
  return results;
}

async function writeAuditEntry(entry) {
  ensureDataDirs();
  const line = `${JSON.stringify(entry)}\n`;
  await fs.promises.appendFile(auditFile, line, "utf8");
  await pruneAuditFile(100);
}

async function pruneAuditFile(maxEntries) {
  try {
    const raw = await fs.promises.readFile(auditFile, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    if (lines.length <= maxEntries) {
      return;
    }
    const trimmed = lines.slice(lines.length - maxEntries).join("\n") + "\n";
    await fs.promises.writeFile(auditFile, trimmed, "utf8");
  } catch {
    // If pruning fails, keep the append-only log.
  }
}

async function readAuditEntries(limit, offset) {
  try {
    const raw = await fs.promises.readFile(auditFile, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    const parsed = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    const newestFirst = parsed.reverse();
    return newestFirst.slice(offset, offset + limit);
  } catch {
    return [];
  }
}

async function readAuditEntryById(auditId) {
  const entries = await readAuditEntries(5000, 0);
  return entries.find((entry) => entry.id === auditId) || null;
}

function safeDataPath(relPath) {
  const trimmed = String(relPath || "").trim();
  if (!trimmed) {
    return null;
  }
  const normalized = path.posix.normalize(trimmed.replace(/^\/+/, ""));
  if (normalized.startsWith("..")) {
    return null;
  }
  const resolved = path.join(dataDir, normalized);
  if (!resolved.startsWith(dataDir)) {
    return null;
  }
  return resolved;
}

function normalizeReferenceImages(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const maxRefs = 6;
  return value
    .slice(0, maxRefs)
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

function mimeTypeToExt(mimeType) {
  if (mimeType.includes("png")) {
    return "png";
  }
  if (mimeType.includes("webp")) {
    return "webp";
  }
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    return "jpg";
  }
  return "bin";
}

function parseCookies(cookieHeader) {
  const result = {};
  const header = cookieHeader || "";
  header.split(";").forEach((part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) {
      return;
    }
    result[key] = decodeURIComponent(rest.join("="));
  });
  return result;
}

function requireAdmin(req, res) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    sendJson(res, 500, { error: "ADMIN_PASSWORD is not set on the server." });
    return false;
  }
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.admin_session;
  if (!token) {
    sendJson(res, 401, { error: "Unauthorized." });
    return false;
  }
  const session = sessions.get(token);
  if (!session) {
    sendJson(res, 401, { error: "Unauthorized." });
    return false;
  }
  const maxAgeMs = 1000 * 60 * 60 * 12;
  if (Date.now() - session.createdAt > maxAgeMs) {
    sessions.delete(token);
    clearSessionCookie(res);
    sendJson(res, 401, { error: "Session expired." });
    return false;
  }
  return true;
}

function checkAdminPassword(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return false;
  }
  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

function setSessionCookie(res, token) {
  const secure = process.env.ADMIN_COOKIE_SECURE === "1" ? "; Secure" : "";
  const cookie = `admin_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 12}${secure}`;
  res.setHeader("Set-Cookie", cookie);
}

function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
  );
}
