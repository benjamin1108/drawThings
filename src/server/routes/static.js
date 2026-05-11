import fs from "node:fs";
import path from "node:path";
import { contentType } from "../lib/http.js";
import { normalizePath, publicDir } from "../lib/paths.js";

export async function serveStatic(_req, res, { pathname }) {
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
}
