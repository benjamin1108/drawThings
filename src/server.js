import fs from "node:fs";
import path from "node:path";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { generateImages } from "./gemini-client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

const tasks = new Map();

const server = createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/tasks") {
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

      const taskId = createTask({
        prompt,
        count,
        aspect,
        negative,
        size,
        model: body.model,
      });

      sendJson(res, 202, { taskId });
      return;
    }

    if (req.method === "GET" && req.url.startsWith("/api/tasks/")) {
      const taskId = decodeURIComponent(req.url.replace("/api/tasks/", ""));
      const task = tasks.get(taskId);
      if (!task) {
        sendJson(res, 404, { error: "Task not found." });
        return;
      }
      sendJson(res, 200, task);
      return;
    }

    if (req.method !== "GET") {
      res.statusCode = 405;
      res.end("Method Not Allowed");
      return;
    }

    const safePath = normalizePath(req.url);
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
  const task = {
    id: taskId,
    status: "pending",
    createdAt: new Date().toISOString(),
    model: payload.model,
    size: payload.size,
  };
  tasks.set(taskId, task);
  pruneTasks();

  generateImages(payload)
    .then((result) => {
      task.status = "completed";
      task.images = result.images;
      task.model = result.model;
      task.size = result.size;
    })
    .catch((error) => {
      task.status = "error";
      task.error = error?.message ?? String(error);
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
