import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const roots = ["public", "src", "scripts"];
const files = roots.flatMap((root) => collect(root)).filter((file) => {
  return file.endsWith(".js") || file.endsWith(".mjs");
});

let failed = false;
for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed = true;
    process.stderr.write(`\n${file}\n${result.stderr || result.stdout}`);
  }
}

if (failed) process.exit(1);
console.log(`JS syntax ok (${files.length} files).`);

function collect(root) {
  if (!fs.existsSync(root)) return [];
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return collect(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}
