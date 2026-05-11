import { readJsonBody, sendJson } from "../lib/http.js";
import { checkAdminPassword, createAdminSession, deleteAdminSession, getAdminSessionStatus } from "../services/session-service.js";

export function getSession(req, res) {
  sendJson(res, 200, getAdminSessionStatus(req, res));
}

export async function login(req, res) {
  const body = await readJsonBody(req, res);
  if (!body) return;
  if (!process.env.ADMIN_PASSWORD) {
    sendJson(res, 500, { error: "ADMIN_PASSWORD is not set on the server." });
    return;
  }
  if (!checkAdminPassword(String(body.password || ""))) {
    sendJson(res, 401, { error: "Invalid password." });
    return;
  }
  createAdminSession(res);
  sendJson(res, 200, { ok: true });
}

export function logout(req, res) {
  deleteAdminSession(req, res);
  sendJson(res, 200, { ok: true });
}
