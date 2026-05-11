import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "playwright";

const port = 45000 + Math.floor(Math.random() * 10000);
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["src/server.js"], {
  env: { ...process.env, UI_PORT: String(port), ADMIN_PASSWORD: "smoke-admin-password" },
  stdio: ["ignore", "pipe", "pipe"],
});

let output = "";
server.stdout.on("data", (chunk) => {
  output += chunk.toString();
});
server.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

try {
  await waitForServer();
  const browser = await chromium.launch();
  try {
    for (const viewport of [
      { width: 1440, height: 900, name: "desktop" },
      { width: 390, height: 844, name: "mobile" },
    ]) {
      const page = await browser.newPage({ viewport });
      await checkHome(page, viewport.name);
      await checkEdit(page, viewport.name);
      await checkAuditLoggedOut(page, viewport.name);
      await checkAuditLoggedIn(page, viewport.name);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log("UI smoke ok.");
} finally {
  server.kill();
}

async function waitForServer() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error(`Server did not start on ${baseURL}\n${output}`);
}

async function checkHome(page, label) {
  await page.goto(`${baseURL}/`, { waitUntil: "networkidle" });
  await expectVisible(page, ".topbar", `${label} home topbar`);
  await expectVisible(page, "#prompt-form", `${label} home prompt form`);
  await expectVisible(page, "#coverflow-track", `${label} home style selector`);
  await expectNoHorizontalOverflow(page, `${label} home`);
}

async function checkEdit(page, label) {
  await page.goto(`${baseURL}/edit.html`, { waitUntil: "networkidle" });
  await expectVisible(page, "#dropzone", `${label} edit upload`);
  await expectVisible(page, "#description", `${label} edit description`);
  await expectVisible(page, "#result-frame", `${label} edit result`);
  await expectNoHorizontalOverflow(page, `${label} edit`);
}

async function checkAuditLoggedOut(page, label) {
  await page.goto(`${baseURL}/audit.html`, { waitUntil: "networkidle" });
  await expectVisible(page, "#login-form", `${label} audit login form`);
  await expectCount(page, ".audit-login__copy", 0, `${label} audit login copy`);
  await expectCount(page, "#login-form p", 0, `${label} audit login paragraphs`);
  const childCount = await page.locator("#login-panel").evaluate((node) => node.children.length);
  if (childCount !== 1) throw new Error(`${label} login panel should have one child, found ${childCount}`);
  await expectNoHorizontalOverflow(page, `${label} audit logged out`);
}

async function checkAuditLoggedIn(page, label) {
  await page.fill("#admin-password", "smoke-admin-password");
  await Promise.all([page.waitForResponse((res) => res.url().includes("/api/admin/login")), page.click("#login-form button[type='submit']")]);
  await expectVisible(page, "#audit-panel", `${label} audit panel`);
  await expectVisible(page, "#audit-summary", `${label} audit summary`);
  await expectVisible(page, "#audit-list", `${label} audit list`);
  await expectNoHorizontalOverflow(page, `${label} audit logged in`);
  const loadImages = page.locator("[data-load-images]:not([disabled])").first();
  if ((await loadImages.count()) > 0) {
    await loadImages.click();
    await expectVisible(page, ".audit-thumbs--rail", `${label} audit media rail`);
  }
}

async function expectVisible(page, selector, label) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: "visible", timeout: 5000 });
  if (!(await locator.isVisible())) throw new Error(`${label} not visible: ${selector}`);
}

async function expectCount(page, selector, expected, label) {
  const actual = await page.locator(selector).count();
  if (actual !== expected) throw new Error(`${label} expected ${expected}, got ${actual}`);
}

async function expectNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  if (metrics.scrollWidth > metrics.clientWidth) {
    throw new Error(`${label} horizontal overflow: ${metrics.scrollWidth} > ${metrics.clientWidth}`);
  }
}

server.on("exit", (code) => {
  if (code && code !== 0) process.stderr.write(output);
});
