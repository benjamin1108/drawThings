import fs from "node:fs";
import { contentType, sendJson } from "../lib/http.js";
import { safeDataPath } from "../lib/paths.js";
import { clampNumber } from "../lib/validation.js";
import { readAuditEntries, readAuditEntryById } from "../services/audit-store.js";
import { requireAdmin } from "../services/session-service.js";

export async function listAudit(req, res, { requestUrl }) {
  if (!requireAdmin(req, res)) return;
  const limit = clampNumber(requestUrl.searchParams.get("limit"), 1, 100, 50);
  const offset = clampNumber(requestUrl.searchParams.get("offset"), 0, 5000, 0);
  sendJson(res, 200, { entries: await readAuditEntries(limit, offset), limit, offset });
}

export async function getAuditImage(req, res, { requestUrl }) {
  if (!requireAdmin(req, res)) return;
  const filePath = safeDataPath(requestUrl.searchParams.get("path") || "");
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
}

export async function getAuditEntry(req, res, { params }) {
  if (!requireAdmin(req, res)) return;
  const entry = await readAuditEntryById(params.auditId);
  if (!entry) {
    sendJson(res, 404, { error: "Audit entry not found." });
    return;
  }
  sendJson(res, 200, entry);
}
