import { createRouter } from "./router.js";
import { sendJson } from "./lib/http.js";
import { getSession, login, logout } from "./routes/admin.js";
import { getAuditEntry, getAuditImage, listAudit } from "./routes/audit.js";
import { describeImage } from "./routes/image-description.js";
import { createPpt } from "./routes/ppt.js";
import { uploadReferenceFile } from "./routes/reference-files.js";
import { serveStatic } from "./routes/static.js";
import { getStyle, getStyles } from "./routes/styles.js";
import { createImageTask, getTaskImage, getTaskStatus } from "./routes/tasks.js";

export function createApp() {
  const router = createRouter();
  router.add("GET", "/api/styles", getStyles);
  router.add("GET", "/api/styles/:styleId", getStyle);
  router.add("POST", "/api/reference-files", uploadReferenceFile);
  router.add("POST", "/api/image-description", describeImage);
  router.add("POST", "/api/tasks", createImageTask);
  router.add("GET", "/api/tasks/:taskId/images/:imageIndex", getTaskImage);
  router.add("GET", "/api/tasks/:taskId", getTaskStatus);
  router.add("POST", "/api/ppt", createPpt);
  router.add("GET", "/api/admin/session", getSession);
  router.add("POST", "/api/admin/login", login);
  router.add("POST", "/api/admin/logout", logout);
  router.add("GET", "/api/audit", listAudit);
  router.add("GET", "/api/audit-image", getAuditImage);
  router.add("GET", "/api/audit/:auditId", getAuditEntry);

  return async function app(req, res) {
    try {
      const requestUrl = new URL(req.url || "/", "http://localhost");
      const pathname = normalizeRequestPath(requestUrl.pathname);
      const handled = await router.handle(req, res, { requestUrl, pathname });
      if (handled) return;
      if (pathname.startsWith("/api/")) {
        sendJson(res, req.method === "GET" ? 404 : 405, { error: req.method === "GET" ? "Not found." : "Method Not Allowed" });
        return;
      }
      if (req.method !== "GET") {
        res.statusCode = 405;
        res.end("Method Not Allowed");
        return;
      }
      await serveStatic(req, res, { pathname });
    } catch (error) {
      const message = error?.message ?? "Server error";
      res.statusCode = 500;
      res.end(message);
    }
  };
}

function normalizeRequestPath(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}
