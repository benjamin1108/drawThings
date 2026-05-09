const HISTORY_LIMIT = 20;
const STORAGE_KEYS = {
  userContent: "drawthings.userContent",
  aspect: "drawthings.aspect",
  size: "drawthings.size",
  modelMode: "drawthings.modelMode",
  generationCount: "drawthings.generationCount",
  activeStyle: "drawthings.activeStyle",
  sidebarCollapsed: "drawthings.sidebarCollapsed",
  currentTaskId: "drawthings.currentTaskId",
};

const el = {
  app: document.querySelector(".app"),
  historyToggle: document.getElementById("history-toggle"),
  stageFlow: document.getElementById("stage-flow"),
  stageCanvas: document.getElementById("stage-canvas"),
  track: document.getElementById("coverflow-track"),
  flowPrev: document.getElementById("flow-prev"),
  flowNext: document.getElementById("flow-next"),
  flowTitle: document.getElementById("flow-title"),
  flowTitleInner: document.getElementById("flow-title-inner"),
  flowTags: document.getElementById("flow-tags"),
  flowIndex: document.getElementById("flow-index"),
  styleHeroImage: document.getElementById("style-hero-image"),
  promptHints: document.getElementById("prompt-hints"),
  canvasBack: document.getElementById("canvas-back"),
  canvasStyle: document.getElementById("canvas-style"),
  canvasZoom: document.getElementById("canvas-zoom"),
  canvasDownload: document.getElementById("canvas-download"),
  canvasSkeleton: document.getElementById("canvas-skeleton"),
  canvasImage: document.getElementById("canvas-image"),
  canvasError: document.getElementById("canvas-error"),
  canvasErrorText: document.getElementById("canvas-error-text"),
  canvasRetry: document.getElementById("canvas-retry"),
  form: document.getElementById("prompt-form"),
  userContent: document.getElementById("user-content"),
  aspect: document.getElementById("aspect"),
  size: document.getElementById("size"),
  modelMode: document.getElementById("model-mode"),
  generationCountPill: document.getElementById("generation-count-pill"),
  generationCount: document.getElementById("generation-count"),
  status: document.getElementById("status"),
  generate: document.getElementById("generate"),
  historyList: document.getElementById("history-list"),
  historyEmpty: document.getElementById("history-empty"),
  historyClear: document.getElementById("history-clear"),
  lightbox: document.getElementById("lightbox"),
  lightboxImage: document.getElementById("lightbox-image"),
  lightboxCaption: document.getElementById("lightbox-caption"),
};

const state = {
  styles: [],
  activeIndex: -1,
  hoverIndex: -1,
  cards: [],
  mode: "flow",
  polling: false,
  abortPoll: false,
  lastResultUrl: null,
  lastRequest: null,
  currentBatch: null,
  db: null,
};

// ==================== Styles + CoverFlow ====================

async function loadStyles() {
  const res = await fetch("/api/styles");
  if (!res.ok) {
    throw new Error("风格列表加载失败");
  }
  const data = await res.json();
  return Array.isArray(data.styles) ? data.styles : [];
}

function renderFancards() {
  el.track.innerHTML = "";
  state.cards = state.styles.map((style, index) => {
    const card = document.createElement("div");
    card.className = "fancard";
    card.dataset.index = String(index);
    card.setAttribute("role", "option");
    card.setAttribute("tabindex", "0");
    card.setAttribute("aria-label", style.title);

    const img = document.createElement("img");
    img.src = style.previewUrl;
    img.alt = `${style.title} 样图`;
    img.loading = "lazy";
    img.draggable = false;
    card.appendChild(img);

    const caption = document.createElement("span");
    caption.className = "fancard__caption";
    caption.textContent = style.title;
    card.appendChild(caption);

    const zoom = document.createElement("button");
    zoom.type = "button";
    zoom.className = "fancard__zoom";
    zoom.setAttribute("aria-label", "放大查看");
    zoom.innerHTML =
      '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>';
    zoom.addEventListener("click", (event) => {
      event.stopPropagation();
      openLightboxForStyle(state.styles[index]);
    });
    card.appendChild(zoom);

    card.addEventListener("focus", () => setHoverIndex(index));
    card.addEventListener("click", () => commitActiveIndex(index));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        commitActiveIndex(index);
      }
    });

    el.track.appendChild(card);
    return card;
  });
  layoutFan();
}

function layoutFan() {
  const count = state.cards.length;
  if (!count) return;
  const pivot = (count - 1) / 2;
  state.cards.forEach((card, i) => {
    const spread = i - pivot;
    card.style.setProperty("--spread", spread);
    card.style.setProperty("--abs", Math.abs(spread));
    card.classList.toggle("is-active", i === state.activeIndex);
    card.classList.toggle("is-hover", i === state.hoverIndex);
  });
}

function setHoverIndex(index) {
  if (state.hoverIndex === index) return;
  state.hoverIndex = index;
  state.cards.forEach((card, i) => {
    card.classList.toggle("is-hover", i === index);
  });
  updateActiveMeta();
}

function clearHover() {
  if (state.hoverIndex === -1) return;
  state.hoverIndex = -1;
  state.cards.forEach((card) => card.classList.remove("is-hover"));
  updateActiveMeta();
}

function updateHoverFromPointer(event) {
  const count = state.cards.length;
  if (!count) return;
  const target = event.target;
  const card = target && target.closest && target.closest(".fancard");
  if (card && card.dataset.index != null) {
    const idx = parseInt(card.dataset.index, 10);
    if (!isNaN(idx) && idx !== state.hoverIndex) setHoverIndex(idx);
    return;
  }
  const last = state.cards[count - 1].getBoundingClientRect();
  const first = state.cards[0].getBoundingClientRect();
  const leftEdge = Math.min(first.left, last.left);
  const rightEdge = Math.max(first.right, last.right);
  const span = rightEdge - leftEdge;
  if (span <= 0) return;
  const ratio = Math.max(0, Math.min(1, (event.clientX - leftEdge) / span));
  const idx = Math.round(ratio * (count - 1));
  if (idx !== state.hoverIndex) setHoverIndex(idx);
}

function updateMagneticShift(clientX) {
  const area = document.getElementById("fancards");
  if (!area || !el.track) return;
  if (state.activeIndex >= 0) return;
  const rect = area.getBoundingClientRect();
  if (rect.width <= 0) return;
  const cx = rect.left + rect.width / 2;
  const half = rect.width / 2;
  const ratio = Math.max(-1, Math.min(1, (clientX - cx) / half));
  const maxShift = 140;
  const shift = -Math.sign(ratio) * Math.pow(Math.abs(ratio), 1.5) * maxShift;
  el.track.style.setProperty("--shift", `${shift.toFixed(1)}px`);
}

function clearMagneticShift() {
  if (el.track) el.track.style.setProperty("--shift", "0px");
}

function recenterActiveCard(card) {
  const area = document.getElementById("fancards");
  if (!card || !area || !el.track) return;
  const areaRect = area.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  const areaCenter = areaRect.left + areaRect.width / 2;
  const cardCenter = cardRect.left + cardRect.width / 2;
  const currentShift = parseFloat(el.track.style.getPropertyValue("--shift")) || 0;
  const newShift = currentShift + (areaCenter - cardCenter);
  el.track.style.setProperty("--shift", `${newShift.toFixed(1)}px`);
}

function commitActiveIndex(index) {
  const total = state.styles.length;
  if (!total) return;
  const clamped = ((index % total) + total) % total;
  if (state.activeIndex === clamped) {
    state.activeIndex = -1;
    localStorage.removeItem(STORAGE_KEYS.activeStyle);
  } else {
    state.activeIndex = clamped;
    const style = state.styles[clamped];
    if (style) localStorage.setItem(STORAGE_KEYS.activeStyle, style.id);
    recenterActiveCard(state.cards[clamped]);
  }
  state.cards.forEach((card, i) => {
    card.classList.toggle("is-active", i === state.activeIndex);
  });
  updateSelectionState();
  updateActiveMeta();
}

function updateSelectionState() {
  const root = document.getElementById("fancards");
  if (root) root.classList.toggle("has-selection", state.activeIndex >= 0);
}

function bindFanInteraction() {
  const area = document.getElementById("fancards");
  if (area) {
    area.addEventListener("mousemove", (event) => {
      updateHoverFromPointer(event);
      updateMagneticShift(event.clientX);
    });
    area.addEventListener("mouseleave", () => {
      clearHover();
      if (state.activeIndex < 0) clearMagneticShift();
    });
  }
  if (el.flowPrev) {
    el.flowPrev.addEventListener("click", () => {
      setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex - 1);
    });
  }
  if (el.flowNext) {
    el.flowNext.addEventListener("click", () => {
      setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex + 1);
    });
  }
  document.addEventListener("keydown", (e) => {
    if (state.mode !== "flow") return;
    if (document.activeElement && document.activeElement.tagName === "TEXTAREA") return;
    if (document.activeElement && document.activeElement.tagName === "INPUT") return;
    if (e.key === "ArrowLeft") setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex - 1);
    if (e.key === "ArrowRight") setActiveNoToggle(state.activeIndex < 0 ? 0 : state.activeIndex + 1);
  });
}

function setActiveNoToggle(index) {
  const total = state.styles.length;
  if (!total) return;
  const clamped = ((index % total) + total) % total;
  state.activeIndex = clamped;
  const style = state.styles[clamped];
  if (style) localStorage.setItem(STORAGE_KEYS.activeStyle, style.id);
  state.cards.forEach((card, i) => card.classList.toggle("is-active", i === clamped));
  updateSelectionState();
  updateActiveMeta();
  recenterActiveCard(state.cards[clamped]);
}

function updateActiveMeta() {
  const metaIndex = state.activeIndex >= 0 ? state.activeIndex : state.hoverIndex;
  const style = state.styles[metaIndex];
  if (!style) return;
  if (el.flowTitleInner) {
    if (el.flowTitleInner.textContent !== style.title) {
      el.flowTitleInner.textContent = style.title;
      el.flowTitleInner.style.animation = "none";
      void el.flowTitleInner.offsetWidth;
      el.flowTitleInner.style.animation = "";
    }
  } else {
    el.flowTitle.textContent = style.title;
  }
  if (el.flowIndex) {
    const current = String(metaIndex + 1).padStart(2, "0");
    const total = String(state.styles.length).padStart(2, "0");
    el.flowIndex.textContent = `${current} / ${total}`;
  }
  if (el.styleHeroImage) {
    const src = style.originalPreviewUrl || style.previewUrl;
    if (src && el.styleHeroImage.getAttribute("src") !== src) {
      el.styleHeroImage.src = src;
    }
    el.styleHeroImage.alt = `${style.title} 风格预览`;
  }
  el.flowTags.innerHTML = "";
  (style.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    el.flowTags.appendChild(span);
  });
}

function setActiveIndex(index) {
  commitActiveIndex(index);
}

// ==================== Mode switching ====================

function setMode(mode) {
  state.mode = mode;
  const isFlow = mode === "flow";
  el.stageFlow.classList.toggle("hidden", !isFlow);
  el.stageFlow.setAttribute("aria-hidden", isFlow ? "false" : "true");
  el.stageCanvas.classList.toggle("hidden", isFlow);
  el.stageCanvas.setAttribute("aria-hidden", isFlow ? "true" : "false");
}

function showCanvasSkeleton(styleTitle) {
  el.canvasStyle.textContent = styleTitle || "";
  el.canvasSkeleton.classList.remove("hidden");
  el.canvasImage.classList.add("hidden");
  el.canvasImage.removeAttribute("src");
  el.canvasError.classList.add("hidden");
  el.canvasZoom.hidden = true;
  el.canvasDownload.hidden = true;
  if (state.lastResultUrl) {
    URL.revokeObjectURL(state.lastResultUrl);
    state.lastResultUrl = null;
  }
}

function showCanvasImage(blob, styleTitle) {
  if (state.lastResultUrl) URL.revokeObjectURL(state.lastResultUrl);
  const url = URL.createObjectURL(blob);
  state.lastResultUrl = url;
  el.canvasStyle.textContent = styleTitle || "";
  el.canvasSkeleton.classList.add("hidden");
  el.canvasError.classList.add("hidden");
  el.canvasImage.src = url;
  el.canvasImage.classList.remove("hidden");
  el.canvasZoom.hidden = false;
  el.canvasDownload.hidden = false;
}

function showCanvasError(message) {
  el.canvasSkeleton.classList.add("hidden");
  el.canvasImage.classList.add("hidden");
  el.canvasError.classList.remove("hidden");
  el.canvasErrorText.textContent = message || "生成失败";
  el.canvasZoom.hidden = true;
  el.canvasDownload.hidden = true;
}

// ==================== Generation ====================

function setStatus(message, tone) {
  el.status.textContent = message || "";
  el.status.classList.toggle("is-error", tone === "error");
}

function setGenerating(on) {
  el.generate.disabled = on;
  if (el.generationCount) el.generationCount.disabled = on;
  el.generate.classList.toggle("is-generating", on);
  el.generate.querySelector(".primary-button__label").textContent = on ? "生成中…" : "开始生成";
}

function isBatchCountEnabled() {
  return Boolean(el.generationCountPill && !el.generationCountPill.classList.contains("hidden"));
}

function getGenerationCount() {
  if (!isBatchCountEnabled()) return 1;
  const count = Number(el.generationCount?.value || 1);
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(Math.round(count), 1), 10);
}

function stopCurrentBatch() {
  if (!state.currentBatch) return;
  state.currentBatch.cancelled = true;
  state.currentBatch.timers.forEach((timer) => clearTimeout(timer));
  state.currentBatch = null;
}

async function handleSubmit(event) {
  event.preventDefault();
  const userContent = el.userContent.value.trim();
  if (!userContent) {
    setStatus("请先输入用户内容。", "error");
    el.userContent.focus();
    return;
  }
  const style = state.styles[state.activeIndex];
  if (!style) {
    setStatus("请先选择风格。", "error");
    return;
  }
  const payload = {
    styleId: style.id,
    userContent,
    aspect: el.aspect.value || "16:9",
    size: el.size.value || "2K",
    modelMode: el.modelMode.value || "quality",
    count: 1,
  };
  const generationCount = getGenerationCount();
  state.lastRequest = { payload, style, generationCount };
  localStorage.setItem(STORAGE_KEYS.userContent, userContent);
  localStorage.setItem(STORAGE_KEYS.aspect, payload.aspect);
  localStorage.setItem(STORAGE_KEYS.size, payload.size);
  localStorage.setItem(STORAGE_KEYS.modelMode, payload.modelMode);
  localStorage.setItem(STORAGE_KEYS.generationCount, String(generationCount));

  setMode("canvas");
  showCanvasSkeleton(style.title);
  setStatus(generationCount > 1 ? `准备生成 ${generationCount} 张…` : "正在生成中…", "");
  setGenerating(true);

  stopCurrentBatch();
  state.abortPoll = false;

  if (generationCount > 1) {
    localStorage.removeItem(STORAGE_KEYS.currentTaskId);
    startBatchGeneration(payload, style, generationCount);
    return;
  }

  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "生成失败");
    }
    const data = await res.json();
    const taskId = data.taskId;
    if (!taskId) throw new Error("未获取到任务 ID");
    localStorage.setItem(STORAGE_KEYS.currentTaskId, taskId);
    pollTask(taskId, style);
  } catch (error) {
    setGenerating(false);
    setStatus(`生成失败：${error?.message ?? error}`, "error");
    showCanvasError(String(error?.message ?? error));
  }
}

function startBatchGeneration(payload, style, total) {
  const batch = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    total,
    started: 0,
    completed: 0,
    failed: 0,
    timers: [],
    cancelled: false,
  };
  state.currentBatch = batch;

  for (let index = 0; index < total; index += 1) {
    const timer = setTimeout(() => {
      if (batch.cancelled || state.currentBatch !== batch || state.abortPoll) return;
      startBatchTask({ ...payload, count: 1 }, style, batch, index + 1);
    }, index * 1000);
    batch.timers.push(timer);
  }
}

async function startBatchTask(payload, style, batch, imageNumber) {
  batch.started += 1;
  updateBatchStatus(batch);
  try {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "生成失败");
    }
    const data = await res.json();
    const taskId = data.taskId;
    if (!taskId) throw new Error("未获取到任务 ID");
    pollBatchTask(taskId, style, batch, imageNumber);
  } catch (error) {
    finishBatchTask(batch, {
      ok: false,
      error: error?.message ?? String(error),
    });
  }
}

function pollBatchTask(taskId, style, batch, imageNumber) {
  const tick = () => {
    if (batch.cancelled || state.currentBatch !== batch || state.abortPoll) return;
    fetch(`/api/tasks/${encodeURIComponent(taskId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(async (task) => {
        if (batch.cancelled || state.currentBatch !== batch || state.abortPoll) return;
        if (task.status === "pending") {
          setTimeout(tick, 1200);
          return;
        }
        if (task.status === "error") {
          finishBatchTask(batch, {
            ok: false,
            error: task.error || "未知错误",
          });
          return;
        }
        const downloadUrl = Array.isArray(task.downloadUrls) ? task.downloadUrls[0] : "";
        if (!downloadUrl) {
          finishBatchTask(batch, {
            ok: false,
            error: "未收到图像结果",
          });
          return;
        }
        const imageResponse = await fetch(downloadUrl);
        if (!imageResponse.ok) {
          throw new Error("下载生成结果失败");
        }
        const blob = await imageResponse.blob();
        showCanvasImage(blob, `${style?.title || task.styleTitle || ""} #${imageNumber}`);
        saveHistory(blob, {
          styleId: style?.id || task.styleId,
          styleTitle: `${style?.title || task.styleTitle || "生成结果"} #${imageNumber}`,
          createdAt: task.createdAt,
          size: task.size,
          aspect: state.lastRequest?.payload?.aspect,
          userContent: state.lastRequest?.payload?.userContent,
        });
        finishBatchTask(batch, { ok: true });
      })
      .catch((error) => {
        finishBatchTask(batch, {
          ok: false,
          error: error?.message ?? String(error),
        });
      });
  };
  tick();
}

function finishBatchTask(batch, result) {
  if (batch.cancelled || state.currentBatch !== batch) return;
  if (result.ok) {
    batch.completed += 1;
  } else {
    batch.failed += 1;
    batch.lastError = result.error || "未知错误";
  }
  updateBatchStatus(batch);
  if (batch.completed + batch.failed < batch.total) return;

  setGenerating(false);
  state.currentBatch = null;
  if (batch.completed > 0 && batch.failed > 0) {
    setStatus(`完成 ${batch.completed} 张，失败 ${batch.failed} 张`, "error");
    return;
  }
  if (batch.completed > 0) {
    setStatus(`完成生成 ${batch.completed} 张`, "");
    return;
  }
  setStatus(`生成失败：${batch.lastError || "未知错误"}`, "error");
  showCanvasError(batch.lastError || "未知错误");
}

function updateBatchStatus(batch) {
  const active = Math.max(batch.started - batch.completed - batch.failed, 0);
  setStatus(
    `已启动 ${batch.started}/${batch.total}，进行中 ${active}，完成 ${batch.completed}`,
    batch.failed ? "error" : "",
  );
}

function pollTask(taskId, style) {
  state.polling = true;
  state.abortPoll = false;
  const tick = () => {
    if (state.abortPoll) {
      state.polling = false;
      return;
    }
    fetch(`/api/tasks/${encodeURIComponent(taskId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then(async (task) => {
        if (state.abortPoll) {
          state.polling = false;
          return;
        }
        if (task.status === "pending") {
          setStatus("生成中，请稍候…", "");
          setTimeout(tick, 1200);
          return;
        }
        state.polling = false;
        if (task.status === "error") {
          setGenerating(false);
          setStatus(`生成失败：${task.error || "未知错误"}`, "error");
          showCanvasError(task.error || "未知错误");
          localStorage.removeItem(STORAGE_KEYS.currentTaskId);
          return;
        }
        const downloadUrl = Array.isArray(task.downloadUrls) ? task.downloadUrls[0] : "";
        setGenerating(false);
        localStorage.removeItem(STORAGE_KEYS.currentTaskId);
        if (!downloadUrl) {
          setStatus("没有收到图像结果。", "error");
          showCanvasError("未收到图像结果");
          return;
        }
        const imageResponse = await fetch(downloadUrl);
        if (!imageResponse.ok) {
          throw new Error("下载生成结果失败");
        }
        const blob = await imageResponse.blob();
        showCanvasImage(blob, style?.title || task.styleTitle || "");
        setStatus("完成生成", "");
        saveHistory(blob, {
          styleId: style?.id || task.styleId,
          styleTitle: style?.title || task.styleTitle,
          createdAt: task.createdAt,
          size: task.size,
          aspect: state.lastRequest?.payload?.aspect,
          userContent: state.lastRequest?.payload?.userContent,
        });
      })
      .catch((error) => {
        state.polling = false;
        setGenerating(false);
        setStatus(`生成失败：${error?.message ?? error}`, "error");
        showCanvasError(String(error?.message ?? error));
        localStorage.removeItem(STORAGE_KEYS.currentTaskId);
      });
  };
  tick();
}

function handleRetry() {
  if (!state.lastRequest) {
    setMode("flow");
    return;
  }
  const previousCount = state.lastRequest.generationCount || 1;
  if (el.generationCount && isBatchCountEnabled()) {
    el.generationCount.value = String(previousCount);
  }
  handleSubmit(new Event("submit"));
}

// ==================== History (IndexedDB) ====================

function openDb() {
  return new Promise((resolve) => {
    const req = indexedDB.open("drawthings", 2);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      state.db = req.result;
      resolve(state.db);
    };
    req.onerror = () => resolve(null);
  });
}

function saveHistory(blob, meta) {
  if (!state.db) return;
  const tx = state.db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
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
  store.add(record);
  tx.oncomplete = () => {
    trimHistory().then(loadHistory);
  };
}

function readAllHistory() {
  return new Promise((resolve) => {
    if (!state.db) return resolve([]);
    const tx = state.db.transaction("images", "readonly");
    const items = [];
    tx.objectStore("images").openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        items.push(cursor.value);
        cursor.continue();
        return;
      }
      items.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      resolve(items);
    };
  });
}

async function trimHistory() {
  const items = await readAllHistory();
  if (items.length <= HISTORY_LIMIT) return;
  const extras = items.slice(HISTORY_LIMIT);
  const tx = state.db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
  extras.forEach((entry) => store.delete(entry.id));
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
  const url = URL.createObjectURL(entry.blob);
  const title = entry.styleTitle || "未命名风格";
  const time = formatTime(entry.createdAt);
  item.innerHTML = `
    <img class="history-item__thumb" src="${url}" alt="${title}" />
    <div class="history-item__meta">
      <div class="history-item__title" title="${title}">${title}</div>
      <div class="history-item__time">${time}</div>
    </div>
    <div class="history-item__actions">
      <button type="button" class="history-item__action" data-action="download">下载</button>
      <button type="button" class="history-item__action" data-action="delete">删除</button>
    </div>
  `;
  const open = () => openLightboxForBlob(entry.blob, title);
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
  item.querySelector('[data-action="download"]').addEventListener("click", (e) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = url;
    a.download = `drawthings-${entry.id}.png`;
    a.click();
  });
  item.querySelector('[data-action="delete"]').addEventListener("click", (e) => {
    e.stopPropagation();
    deleteHistoryEntry(entry.id);
  });
  return item;
}

function deleteHistoryEntry(id) {
  if (!state.db) return;
  const tx = state.db.transaction("images", "readwrite");
  tx.objectStore("images").delete(id);
  tx.oncomplete = () => loadHistory();
}

function clearHistory() {
  if (!state.db) return;
  const tx = state.db.transaction("images", "readwrite");
  tx.objectStore("images").clear();
  tx.oncomplete = () => {
    loadHistory();
    setStatus("历史已清理", "");
  };
}

function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ==================== Sidebar ====================

function applySidebarState() {
  const collapsed = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1";
  const narrow = window.matchMedia("(max-width: 1180px)").matches;
  const effective = collapsed || narrow;
  el.app.classList.toggle("history-collapsed", effective);
  el.historyToggle.setAttribute("aria-expanded", effective ? "false" : "true");
}

function toggleSidebar() {
  const current = localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === "1";
  localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, current ? "0" : "1");
  applySidebarState();
}

// ==================== Lightbox ====================

function openLightboxForStyle(style) {
  el.lightboxImage.src = style.originalPreviewUrl || style.previewUrl;
  el.lightboxImage.alt = `${style.title} 样图`;
  el.lightboxCaption.textContent = style.title;
  showLightbox();
}

function openLightboxForBlob(blob, caption) {
  const url = URL.createObjectURL(blob);
  el.lightboxImage.src = url;
  el.lightboxImage.alt = caption || "预览";
  el.lightboxCaption.textContent = caption || "";
  showLightbox();
}

function showLightbox() {
  el.lightbox.classList.remove("hidden");
  el.lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

function closeLightbox() {
  el.lightbox.classList.add("hidden");
  el.lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
}

// ==================== Canvas actions ====================

function downloadCanvasImage() {
  if (!state.lastResultUrl) return;
  const a = document.createElement("a");
  a.href = state.lastResultUrl;
  a.download = `drawthings-${Date.now()}.png`;
  a.click();
}

function zoomCanvasImage() {
  if (!state.lastResultUrl) return;
  el.lightboxImage.src = state.lastResultUrl;
  el.lightboxImage.alt = el.canvasStyle.textContent || "预览";
  el.lightboxCaption.textContent = el.canvasStyle.textContent || "";
  showLightbox();
}

// ==================== Init ====================

function restoreInputState() {
  const userContent = localStorage.getItem(STORAGE_KEYS.userContent);
  if (userContent) el.userContent.value = userContent;
  const aspect = localStorage.getItem(STORAGE_KEYS.aspect);
  if (aspect && [...el.aspect.options].some((o) => o.value === aspect)) {
    el.aspect.value = aspect;
  }
  const size = localStorage.getItem(STORAGE_KEYS.size);
  if (size && [...el.size.options].some((o) => o.value === size)) {
    el.size.value = size;
  }
  const modelMode = localStorage.getItem(STORAGE_KEYS.modelMode);
  if (modelMode && [...el.modelMode.options].some((o) => o.value === modelMode)) {
    el.modelMode.value = modelMode;
  }
  const generationCount = localStorage.getItem(STORAGE_KEYS.generationCount);
  if (
    el.generationCount &&
    generationCount &&
    [...el.generationCount.options].some((o) => o.value === generationCount)
  ) {
    el.generationCount.value = generationCount;
  }
}

function bindPersistence() {
  el.userContent.addEventListener("input", () => {
    localStorage.setItem(STORAGE_KEYS.userContent, el.userContent.value);
  });
  el.aspect.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.aspect, el.aspect.value);
  });
  el.size.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.size, el.size.value);
  });
  el.modelMode.addEventListener("change", () => {
    localStorage.setItem(STORAGE_KEYS.modelMode, el.modelMode.value);
  });
  if (el.generationCount) {
    el.generationCount.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEYS.generationCount, el.generationCount.value);
    });
  }
  el.userContent.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      el.form.requestSubmit();
    }
  });
}

function bindPromptHints() {
  if (!el.promptHints) return;
  el.promptHints.addEventListener("click", (event) => {
    const chip = event.target.closest(".hint-chip");
    if (!chip) return;
    const hint = chip.dataset.hint;
    if (!hint) return;
    el.userContent.value = hint;
    el.userContent.focus();
    el.userContent.setSelectionRange(hint.length, hint.length);
    localStorage.setItem(STORAGE_KEYS.userContent, hint);
  });
}

function bindUI() {
  el.form.addEventListener("submit", handleSubmit);
  el.historyToggle.addEventListener("click", toggleSidebar);
  el.historyClear.addEventListener("click", clearHistory);
  bindPromptHints();
  el.canvasBack.addEventListener("click", () => {
    state.abortPoll = true;
    stopCurrentBatch();
    setGenerating(false);
    setStatus("准备就绪", "");
    setMode("flow");
  });
  el.canvasRetry.addEventListener("click", handleRetry);
  el.canvasDownload.addEventListener("click", downloadCanvasImage);
  el.canvasZoom.addEventListener("click", zoomCanvasImage);
  el.canvasImage.addEventListener("click", zoomCanvasImage);

  el.lightbox.addEventListener("click", () => {
    closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });

  window.addEventListener("resize", applySidebarState);
}

function exposeConsoleCommands() {
  window.drawThings = window.drawThings || {};
  const enableGenerationCount = () => {
    if (!el.generationCountPill) return "生成次数控件不可用";
    el.generationCountPill.classList.remove("hidden");
    return "生成次数控件已显示，可选择 1-10 张。";
  };
  const disableGenerationCount = () => {
    if (!el.generationCountPill) return "生成次数控件不可用";
    el.generationCountPill.classList.add("hidden");
    if (el.generationCount) el.generationCount.value = "1";
    return "生成次数控件已隐藏。";
  };
  window.drawThings.enableGenerationCount = enableGenerationCount;
  window.drawThings.disableGenerationCount = disableGenerationCount;
  window.enableGenerationCount = enableGenerationCount;
  window.disableGenerationCount = disableGenerationCount;
}

async function init() {
  bindUI();
  bindPersistence();
  restoreInputState();
  exposeConsoleCommands();
  applySidebarState();
  try {
    state.styles = await loadStyles();
  } catch (error) {
    setStatus(`风格加载失败：${error?.message ?? error}`, "error");
    return;
  }
  if (!state.styles.length) {
    setStatus("暂无可用风格", "error");
    return;
  }
  state.activeIndex = 0;
  if (state.styles[0]) localStorage.setItem(STORAGE_KEYS.activeStyle, state.styles[0].id);
  renderFancards();
  bindFanInteraction();
  updateSelectionState();
  updateActiveMeta();
  await openDb();
  loadHistory();
  resumePendingTask();
}

function resumePendingTask() {
  const taskId = localStorage.getItem(STORAGE_KEYS.currentTaskId);
  if (!taskId) return;
  const style = state.styles[state.activeIndex];
  setMode("canvas");
  showCanvasSkeleton(style?.title || "");
  setGenerating(true);
  setStatus("恢复上次生成…", "");
  pollTask(taskId, style);
}

init();
