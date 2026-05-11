import { formatTime } from "../shared/format.js";
import { createObjectUrl, downloadUrl } from "../shared/media.js";

const HISTORY_LIMIT = 20;

export function createHistory({ el, state, openBlobPreview, setStatus }) {
  function openDb() {
    return new Promise((resolve) => {
      const request = indexedDB.open("drawthings", 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("images")) {
          db.createObjectStore("images", { keyPath: "id" });
        }
      };
      request.onsuccess = () => {
        state.db = request.result;
        resolve(state.db);
      };
      request.onerror = () => resolve(null);
    });
  }

  function saveHistory(blob, meta) {
    if (!state.db) return;
    const transaction = state.db.transaction("images", "readwrite");
    const record = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      blob,
      createdAt: meta.createdAt || new Date().toISOString(),
      styleId: meta.styleId || "",
      styleTitle: meta.styleTitle || "",
      size: meta.size || "",
      aspect: meta.aspect || "",
      userContent: meta.userContent || "",
    };
    transaction.objectStore("images").add(record);
    transaction.oncomplete = () => {
      trimHistory().then(loadHistory);
    };
  }

  function readAllHistory() {
    return new Promise((resolve) => {
      if (!state.db) return resolve([]);
      const transaction = state.db.transaction("images", "readonly");
      const items = [];
      transaction.objectStore("images").openCursor().onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          items.push(cursor.value);
          cursor.continue();
          return;
        }
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };
    });
  }

  async function trimHistory() {
    const items = await readAllHistory();
    if (items.length <= HISTORY_LIMIT) return;
    const transaction = state.db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");
    items.slice(HISTORY_LIMIT).forEach((entry) => store.delete(entry.id));
  }

  async function loadHistory() {
    const items = await readAllHistory();
    el.historyList.innerHTML = "";
    if (!items.length) {
      el.historyList.appendChild(el.historyEmpty);
      el.historyEmpty.hidden = false;
      return;
    }
    el.historyEmpty.hidden = true;
    items.slice(0, HISTORY_LIMIT).forEach((entry) => {
      el.historyList.appendChild(renderHistoryItem(entry));
    });
  }

  function renderHistoryItem(entry) {
    const item = document.createElement("div");
    item.className = "history-item";
    item.tabIndex = 0;
    item.setAttribute("role", "button");
    const url = createObjectUrl(entry.blob);
    const title = entry.styleTitle || "未命名风格";
    item.innerHTML = `
      <img class="history-item__thumb" src="${url}" alt="${title}" />
      <div class="history-item__meta">
        <div class="history-item__title" title="${title}">${title}</div>
        <div class="history-item__time">${formatTime(entry.createdAt)}</div>
      </div>
      <div class="history-item__actions">
        <button type="button" class="history-item__action" data-action="download">下载</button>
        <button type="button" class="history-item__action" data-action="delete">删除</button>
      </div>
    `;
    const open = () => openBlobPreview(entry.blob, title);
    item.addEventListener("click", (event) => {
      if (event.target.closest(".history-item__action")) return;
      open();
    });
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    item.querySelector('[data-action="download"]').addEventListener("click", (event) => {
      event.stopPropagation();
      downloadUrl(url, `drawthings-${entry.id}.png`);
    });
    item.querySelector('[data-action="delete"]').addEventListener("click", (event) => {
      event.stopPropagation();
      deleteHistoryEntry(entry.id);
    });
    return item;
  }

  function deleteHistoryEntry(id) {
    if (!state.db) return;
    const transaction = state.db.transaction("images", "readwrite");
    transaction.objectStore("images").delete(id);
    transaction.oncomplete = () => loadHistory();
  }

  function clearHistory() {
    if (!state.db) return;
    const transaction = state.db.transaction("images", "readwrite");
    transaction.objectStore("images").clear();
    transaction.oncomplete = () => {
      loadHistory();
      setStatus("历史已清理", "");
    };
  }

  return { openDb, saveHistory, loadHistory, clearHistory };
}
