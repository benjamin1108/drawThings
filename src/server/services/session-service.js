import { randomUUID, timingSafeEqual } from "node:crypto";
import { clearSessionCookie, parseCookies, setSessionCookie } from "../lib/cookies.js";
import { sendJson } from "../lib/http.js";

const sessions = new Map();
const adminSessionMaxAgeMs = 1000 * 60 * 60 * 12;

export function getAdminSessionStatus(req, res) {
  if (!process.env.ADMIN_PASSWORD) {
    return { configured: false, authenticated: false };
  }
  const token = parseCookies(req.headers.cookie).admin_session;
  if (!token) return { configured: true, authenticated: false };
  const session = sessions.get(token);
  if (!session) return { configured: true, authenticated: false };
  if (Date.now() - session.createdAt > adminSessionMaxAgeMs) {
    sessions.delete(token);
    if (res) clearSessionCookie(res);
    return { configured: true, authenticated: false, expired: true };
  }
  return { configured: true, authenticated: true };
}

export function requireAdmin(req, res) {
  const sessionStatus = getAdminSessionStatus(req, res);
  if (!sessionStatus.configured) {
    sendJson(res, 500, { error: "ADMIN_PASSWORD is not set on the server." });
    return false;
  }
  if (!sessionStatus.authenticated) {
    sendJson(res, 401, { error: sessionStatus.expired ? "Session expired." : "Unauthorized." });
    return false;
  }
  return true;
}

export function createAdminSession(res) {
  const token = randomUUID();
  sessions.set(token, { token, createdAt: Date.now() });
  setSessionCookie(res, token);
}

export function deleteAdminSession(req, res) {
  const token = parseCookies(req.headers.cookie).admin_session;
  if (token) sessions.delete(token);
  clearSessionCookie(res);
}

export function checkAdminPassword(password) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(adminPassword);
  return a.length === b.length && timingSafeEqual(a, b);
}
