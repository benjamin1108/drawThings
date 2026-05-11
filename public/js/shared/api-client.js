export async function readResponseError(response, fallback = "请求失败") {
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = await response.json();
      return data?.error || data?.message || fallback;
    }
    const text = await response.text();
    return text || fallback;
  } catch {
    return fallback;
  }
}

export async function fetchJson(url, options = {}, fallback = "请求失败") {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await readResponseError(response, fallback));
  }
  return response.json();
}

export function jsonPost(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const api = {
  getStyles() {
    return fetchJson("/api/styles", {}, "风格列表加载失败");
  },
  createTask(payload) {
    return fetchJson("/api/tasks", jsonPost(payload), "生成失败");
  },
  getTask(taskId) {
    return fetchJson(`/api/tasks/${encodeURIComponent(taskId)}`, {}, "任务查询失败");
  },
  describeImage(payload) {
    return fetchJson("/api/image-description", jsonPost(payload), "图片分析失败");
  },
  getAdminSession() {
    return fetchJson("/api/admin/session", {}, "无法读取登录状态");
  },
  login(password) {
    return fetchJson("/api/admin/login", jsonPost({ password }), "登录失败");
  },
  logout() {
    return fetchJson("/api/admin/logout", { method: "POST" }, "退出失败");
  },
  getAudit(limit = 100) {
    return fetchJson(`/api/audit?limit=${encodeURIComponent(limit)}`, {}, "审计日志加载失败");
  },
};
