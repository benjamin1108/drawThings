import { api } from "../shared/api-client.js";

export function createAuditAuth({ elements, state, showLogin, showAudit, loadAudit, resetFilters }) {
  async function checkAuthAndLoad() {
    try {
      const session = await api.getAdminSession();
      if (!session.authenticated) {
        showLogin(session.configured === false ? "服务端未配置 ADMIN_PASSWORD。" : "");
        return;
      }
      showAudit();
      await loadAudit();
    } catch {
      showLogin();
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const password = elements.adminPassword.value.trim();
    if (!password) {
      setLoginStatus("请输入管理员密码。", true);
      elements.adminPassword.setAttribute("aria-invalid", "true");
      elements.adminPassword.focus();
      return;
    }
    setLoginStatus("正在验证管理员权限...", false);
    elements.adminPassword.setAttribute("aria-invalid", "false");
    setLoginBusy(true);
    try {
      await api.login(password);
      setLoginStatus("登录成功，正在读取审计记录。", false);
      elements.adminPassword.value = "";
      await checkAuthAndLoad();
    } catch (error) {
      setLoginStatus(humanizeLoginError(error?.message), true);
      elements.adminPassword.setAttribute("aria-invalid", "true");
    } finally {
      setLoginBusy(false);
    }
  }

  function setLoginBusy(isBusy) {
    if (!elements.loginSubmit) return;
    elements.loginSubmit.disabled = Boolean(isBusy);
    elements.loginSubmit.setAttribute("aria-busy", String(Boolean(isBusy)));
  }

  function setLoginStatus(message, isError) {
    elements.loginStatus.textContent = message || "";
    elements.loginStatus.classList.toggle("is-error", Boolean(isError));
  }

  async function handleLogout() {
    await api.logout();
    state.entries = [];
    resetFilters();
    showLogin();
    setLoginStatus("已退出。", false);
  }

  function humanizeLoginError(message) {
    const text = String(message || "");
    if (text.includes("Invalid password")) return "管理员密码不正确。";
    if (text.includes("ADMIN_PASSWORD")) return "服务端未配置 ADMIN_PASSWORD。";
    return text || "登录失败。";
  }

  return { checkAuthAndLoad, handleLogin, handleLogout, setLoginStatus };
}
