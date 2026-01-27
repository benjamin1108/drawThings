const elements = {
  loginPanel: document.getElementById("login-panel"),
  auditPanel: document.getElementById("audit-panel"),
  loginForm: document.getElementById("login-form"),
  adminPassword: document.getElementById("admin-password"),
  loginStatus: document.getElementById("login-status"),
  auditList: document.getElementById("audit-list"),
  refreshAudit: document.getElementById("refresh-audit"),
  logout: document.getElementById("logout"),
};

async function checkAuthAndLoad() {
  try {
    const response = await fetch("/api/audit?limit=1");
    if (!response.ok) {
      showLogin();
      return;
    }
    showAudit();
    await loadAudit();
  } catch {
    showLogin();
  }
}

function showLogin() {
  elements.loginPanel.classList.remove("hidden");
  elements.auditPanel.classList.add("hidden");
}

function showAudit() {
  elements.loginPanel.classList.add("hidden");
  elements.auditPanel.classList.remove("hidden");
}

async function handleLogin(event) {
  event.preventDefault();
  const password = elements.adminPassword.value;
  if (!password) {
    setLoginStatus("请输入密码", true);
    return;
  }
  setLoginStatus("登录中...", false);
  try {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "登录失败");
    }
    setLoginStatus("登录成功", false);
    elements.adminPassword.value = "";
    await checkAuthAndLoad();
  } catch (error) {
    setLoginStatus(`登录失败：${error?.message ?? error}`, true);
  }
}

function setLoginStatus(message, isError) {
  elements.loginStatus.textContent = message;
  elements.loginStatus.style.color = isError ? "#d6452d" : "";
}

async function loadAudit() {
  elements.auditList.innerHTML = "<div class=\"audit-empty\">加载中...</div>";
  try {
    const response = await fetch("/api/audit?limit=100");
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "加载失败");
    }
    const data = await response.json();
    const entries = Array.isArray(data.entries) ? data.entries : [];
    renderAudit(entries);
  } catch (error) {
    elements.auditList.innerHTML = `<div class=\"audit-empty\">${escapeHtml(
      error?.message ?? String(error)
    )}</div>`;
  }
}

function renderAudit(entries) {
  if (!entries.length) {
    elements.auditList.innerHTML = "<div class=\"audit-empty\">暂无审计日志</div>";
    return;
  }
  elements.auditList.innerHTML = "";
  entries.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "audit-card fade-in";
    card.style.animationDelay = `${index * 0.03}s`;
    card.innerHTML = buildAuditCard(entry);
    elements.auditList.appendChild(card);
  });
}

function buildAuditCard(entry) {
  const status = entry.status || "unknown";
  const statusClass = status === "completed" ? "ok" : status === "error" ? "error" : "pending";
  const header = `
    <div class="audit-card__header">
      <div>
        <div class="audit-card__title">任务 ${escapeHtml(entry.taskId || "-")}</div>
        <div class="audit-card__meta">
          <span class="pill ${statusClass}">${escapeHtml(status)}</span>
          <span>${escapeHtml(entry.model || "-")}</span>
          <span>${escapeHtml(entry.size || "-")}</span>
          <span>${escapeHtml(entry.aspect || "-")}</span>
          <span>${formatTime(entry.createdAt)}</span>
          <span>${formatLatency(entry.latencyMs)}</span>
        </div>
      </div>
    </div>
  `;

  const prompts = `
    <details class="audit-block">
      <summary>提示词（完整保存）</summary>
      <div class="audit-block__content">
        ${renderPrompt("模版提示词", entry.promptTemplate)}
        ${renderPrompt("用户内容", entry.promptUser)}
        ${renderPrompt("最终提示词", entry.promptFinal)}
        ${renderPrompt("负面提示词", entry.negative)}
      </div>
    </details>
  `;

  const images = renderImages(entry.images);

  const error = entry.error
    ? `<div class="audit-error">错误：${escapeHtml(entry.error)}</div>`
    : "";

  return `${header}${error}${prompts}${images}`;
}

function renderPrompt(title, value) {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return `
    <section class="audit-prompt">
      <div class="audit-prompt__title">${escapeHtml(title)}</div>
      <pre class="audit-prompt__body">${escapeHtml(text)}</pre>
    </section>
  `;
}

function renderImages(images) {
  const list = Array.isArray(images) ? images : [];
  if (!list.length) {
    return "";
  }
  const items = list
    .map((img) => {
      const path = img?.path ? String(img.path) : "";
      const src = path ? `/api/audit-image?path=${encodeURIComponent(path)}` : "";
      const bytes = Number(img?.bytes || 0);
      const mb = bytes > 0 ? `${(bytes / (1024 * 1024)).toFixed(2)}MB` : "-";
      const sha = img?.sha256 ? String(img.sha256).slice(0, 16) : "";
      return `
        <a class="audit-thumb" href="${src}" target="_blank" rel="noreferrer">
          <img src="${src}" alt="audit image" loading="lazy" />
          <div class="audit-thumb__meta">
            <span>#${escapeHtml(img?.index || "-")}</span>
            <span>${escapeHtml(mb)}</span>
            <span>${escapeHtml(sha)}</span>
          </div>
        </a>
      `;
    })
    .join("");
  return `<div class="audit-thumbs">${items}</div>`;
}

function formatTime(value) {
  if (!value) {
    return "-";
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function formatLatency(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value) || value <= 0) {
    return "-";
  }
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  return `${(value / 1000).toFixed(1)}s`;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function handleLogout() {
  await fetch("/api/admin/logout", { method: "POST" });
  showLogin();
  setLoginStatus("已退出", false);
}

elements.loginForm.addEventListener("submit", handleLogin);
elements.refreshAudit.addEventListener("click", loadAudit);
elements.logout.addEventListener("click", handleLogout);

checkAuthAndLoad();
