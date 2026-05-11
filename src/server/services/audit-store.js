import fs from "node:fs";
import { auditFile, auditDir, imagesDir } from "../lib/paths.js";

export function ensureDataDirs() {
  fs.mkdirSync(auditDir, { recursive: true });
  fs.mkdirSync(imagesDir, { recursive: true });
}

export async function writeAuditEntry(entry) {
  ensureDataDirs();
  await fs.promises.appendFile(auditFile, `${JSON.stringify(entry)}\n`, "utf8");
  await pruneAuditFile(100);
}

async function pruneAuditFile(maxEntries) {
  try {
    const raw = await fs.promises.readFile(auditFile, "utf8");
    const lines = raw.split("\n").filter(Boolean);
    if (lines.length <= maxEntries) return;
    await fs.promises.writeFile(auditFile, `${lines.slice(lines.length - maxEntries).join("\n")}\n`, "utf8");
  } catch {
    // Keep the append-only audit log if pruning fails.
  }
}

export async function readAuditEntries(limit, offset) {
  try {
    const raw = await fs.promises.readFile(auditFile, "utf8");
    const parsed = raw
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    return parsed.reverse().slice(offset, offset + limit);
  } catch {
    return [];
  }
}

export async function readAuditEntryById(auditId) {
  const entries = await readAuditEntries(5000, 0);
  return entries.find((entry) => entry.id === auditId) || null;
}
