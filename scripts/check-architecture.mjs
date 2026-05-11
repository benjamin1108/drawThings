import fs from "node:fs";
import path from "node:path";

const errors = [];
const cssFiles = collect("public/css").filter((file) => file.endsWith(".css"));
const publicJs = collect("public/js").filter((file) => file.endsWith(".js"));
const serverRoutes = collect("src/server/routes").filter((file) => file.endsWith(".js"));
const serverServices = collect("src/server/services").filter((file) => file.endsWith(".js"));

checkStylesManifest();
checkLineLimit("public/styles.css", 80);
cssFiles.forEach((file) => checkLineLimit(file, 450));
checkTokens();
checkForbiddenCss();
checkDuplicateSelectors();
publicJs.forEach((file) => {
  const isEntry = /public\/js\/(home|edit|audit)\/index\.js$/.test(file);
  checkLineLimit(file, isEntry ? 180 : 350);
});
checkLineLimit("src/server.js", 80);
serverRoutes.forEach((file) => checkLineLimit(file, 300));
serverServices.forEach((file) => checkLineLimit(file, 450));
checkSingleRequireAdmin();

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log("Architecture checks ok.");

function collect(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return collect(fullPath);
    return entry.isFile() ? [fullPath] : [];
  });
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function lines(file) {
  return read(file).split("\n").length;
}

function checkLineLimit(file, limit) {
  const count = lines(file);
  if (count > limit) errors.push(`${file} has ${count} lines, limit is ${limit}.`);
}

function checkStylesManifest() {
  const text = read("public/styles.css").trim();
  const invalid = text
    .split("\n")
    .filter((line) => line.trim())
    .filter((line) => !line.trim().startsWith("@import") && !line.trim().startsWith("/*"));
  if (invalid.length) errors.push("public/styles.css must contain only @import statements and comments.");
}

function checkTokens() {
  const tokenText = read("public/css/00-tokens.css");
  const rootCount = (tokenText.match(/:root\s*{/g) || []).length;
  if (rootCount !== 1) errors.push("00-tokens.css must define exactly one :root block.");
  const otherRoots = cssFiles.filter((file) => file !== "public/css/00-tokens.css" && /:root\s*{/.test(read(file)));
  if (otherRoots.length) errors.push(`Only 00-tokens.css may define :root: ${otherRoots.join(", ")}`);
}

function checkForbiddenCss() {
  const forbidden = /(^|[,{]\s*)\.(page|composer|gallery|button|field)([\s,{:#.>+~]|$)/;
  for (const file of ["public/styles.css", ...cssFiles]) {
    read(file).split("\n").forEach((line, index) => {
      if (forbidden.test(line)) errors.push(`${file}:${index + 1} contains forbidden legacy class selector.`);
    });
  }
}

function checkDuplicateSelectors() {
  const seen = new Map();
  for (const file of cssFiles) {
    read(file).split("\n").forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed.endsWith("{")) return;
      if (trimmed.startsWith("@") || trimmed.includes(",")) return;
      const selector = trimmed.slice(0, -1).trim();
      if (!selector || selector.includes(" ")) return;
      const first = seen.get(selector);
      if (first && !first.startsWith(`${file}:`)) {
        errors.push(`Duplicate simple selector ${selector}: ${first} and ${file}:${index + 1}`);
      }
      else seen.set(selector, `${file}:${index + 1}`);
    });
  }
}

function checkSingleRequireAdmin() {
  const files = collect("src").filter((file) => file.endsWith(".js"));
  const locations = files.flatMap((file) => {
    return read(file)
      .split("\n")
      .map((line, index) => ({ file, line, index }))
      .filter(({ line }) => /function\s+requireAdmin|const\s+requireAdmin\s*=/.test(line));
  });
  if (locations.length !== 1) errors.push(`requireAdmin implementation count must be 1, found ${locations.length}.`);
}
