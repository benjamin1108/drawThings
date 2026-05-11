import { byId, qs } from "../shared/dom.js";
import { readResponseError } from "../shared/api-client.js";
import { escapeHtml, formatTime } from "../shared/format.js";
import { createAuditAuth } from "./auth.js";
import { createAuditFilters } from "./filters.js";
import { createAuditRenderer } from "./render.js";

const elements = {
  skipLink: byId("skip-link"),
  loginPanel: byId("login-panel"),
  auditPanel: byId("audit-panel"),
  loginForm: byId("login-form"),
  loginSubmit: qs("#login-form button[type='submit']"),
  adminPassword: byId("admin-password"),
  loginStatus: byId("login-status"),
  auditUpdated: byId("audit-updated"),
  auditSummary: byId("audit-summary"),
  auditSearch: byId("audit-search"),
  auditStatusFilter: byId("audit-status-filter"),
  auditList: byId("audit-list"),
  refreshAudit: byId("refresh-audit"),
  logout: byId("logout"),
};

const state = {
  entries: [],
  query: "",
  status: "all",
  pageSize: 25,
  visibleCount: 25,
};

let filters;
const renderer = createAuditRenderer({
  elements,
  state,
  getFilteredEntries: () => filters.getFilteredEntries(),
});

function showLogin(message = "") {
  elements.loginPanel.classList.remove("hidden");
  elements.auditPanel.classList.add("hidden");
  updateSkipLink("#login-form", "跳到登录表单");
  if (message) auth.setLoginStatus(message, true);
}

function showAudit() {
  elements.loginPanel.classList.add("hidden");
  elements.auditPanel.classList.remove("hidden");
  updateSkipLink("#audit-list", "跳到审计列表");
}

function updateSkipLink(href, label) {
  if (!elements.skipLink) return;
  elements.skipLink.href = href;
  elements.skipLink.textContent = label;
}

async function loadAudit() {
  renderer.renderLoading();
  try {
    const response = await fetch("/api/audit?limit=100");
    if (response.status === 401) {
      state.entries = [];
      showLogin("登录状态已过期，请重新登录。");
      return;
    }
    if (!response.ok) {
      throw new Error(await readResponseError(response, "加载失败。"));
    }
    const data = await response.json();
    state.entries = Array.isArray(data.entries) ? data.entries : [];
    state.visibleCount = state.pageSize;
    elements.auditUpdated.textContent = `最近更新 ${formatTime(new Date().toISOString())} · 已读取 ${state.entries.length} 条`;
    renderer.renderSummary(state.entries);
    renderer.renderAudit();
  } catch (error) {
    elements.auditSummary.innerHTML = "";
    elements.auditUpdated.textContent = "加载失败";
    elements.auditList.innerHTML = `<div class="audit-empty audit-empty--error">${escapeHtml(error?.message ?? String(error))}</div>`;
  }
}

filters = createAuditFilters({
  elements,
  state,
  renderSummary: renderer.renderSummary,
  renderAudit: renderer.renderAudit,
});

const auth = createAuditAuth({
  elements,
  state,
  showLogin,
  showAudit,
  loadAudit,
  resetFilters: filters.resetFilters,
});

elements.loginForm.addEventListener("submit", auth.handleLogin);
elements.refreshAudit.addEventListener("click", loadAudit);
elements.logout.addEventListener("click", auth.handleLogout);
filters.bindFilters();
auth.checkAuthAndLoad();
