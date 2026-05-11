import { createServer } from "node:http";
import { createApp } from "./app.js";
import { ensureDataDirs } from "./services/audit-store.js";

export function startServer({ port = Number(process.env.UI_PORT || 5173) } = {}) {
  ensureDataDirs();
  const server = createServer(createApp());
  server.listen(port, () => {
    console.log(`UI server running on http://localhost:${port}`);
  });
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
