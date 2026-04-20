const HISTORY_LIMIT = 20;
const STORAGE_KEYS = {
  userContent: "drawthings.userContent",
  aspect: "drawthings.aspect",
  size: "drawthings.size",
  modelMode: "drawthings.modelMode",
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
  flowTags: document.getElementById("flow-tags"),
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
  activeIndex: 0,
  cards: [],
  mode: "flow",
  polling: false,
  abortPoll: false,
  lastResultUrl: null,
  lastRequest: null,
  db: null,
  swiper: null,
  hoverTimer: null,
};

const pointerState = { x: 0, y: 0, inside: false };

// ==================== Styles + CoverFlow ====================

async function loadStyles() {
  const res = await fetch("/api/styles");
  if (!res.ok) {
    throw new Error("风格列表加载失败");
  }
  const data = await res.json();
  return Array.isArray(data.styles) ? data.styles : [];
}

function renderCoverflow() {
  el.track.innerHTML = "";
  state.cards = state.styles.map((style, index) => {
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.dataset.index = String(index);
    slide.setAttribute("role", "option");
    slide.setAttribute("aria-label", style.title);
    const inner = document.createElement("div");
    inner.className = "coverflow__card-inner";
    const img = document.createElement("img");
    img.src = style.previewUrl;
    img.alt = `${style.title} 样图`;
    img.loading = "lazy";
    img.draggable = false;
    inner.appendChild(img);
    slide.appendChild(inner);
    el.track.appendChild(slide);
    return slide;
  });
}

function scheduleHoverSelect(index) {
  cancelHoverSelect();
  state.hoverTimer = window.setTimeout(() => {
    if (!state.swiper) return;
    if (state.swiper.activeIndex === index) return;
    if (state.swiper.animating) return;
    state.swiper.slideTo(index);
  }, 40);
}

function cancelHoverSelect() {
  if (state.hoverTimer) {
    clearTimeout(state.hoverTimer);
    state.hoverTimer = null;
  }
}

function selectFromPointer() {
  if (!state.swiper || !pointerState.inside) return;
  const node = document.elementFromPoint(pointerState.x, pointerState.y);
  const slide = node && node.closest && node.closest(".swiper-slide");
  let idx = -1;
  if (slide && slide.dataset.index != null) {
    idx = parseInt(slide.dataset.index, 10);
  } else {
    idx = nearestSlideIndexAt(pointerState.x, pointerState.y);
  }
  if (idx < 0 || idx === state.swiper.activeIndex) return;
  scheduleHoverSelect(idx);
}

function nearestSlideIndexAt(x, y) {
  if (!state.cards.length) return -1;
  const container = document.querySelector(".coverflow__swiper");
  if (!container) return -1;
  const cr = container.getBoundingClientRect();
  if (y < cr.top || y > cr.bottom || x < cr.left || x > cr.right) return -1;
  let best = -1;
  let bestDist = Infinity;
  state.cards.forEach((slide, i) => {
    const r = slide.getBoundingClientRect();
    if (r.width === 0) return;
    const cx = (r.left + r.right) / 2;
    const dist = Math.abs(x - cx);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  });
  return best;
}

function bindCoverflowPointer() {
  const container = document.querySelector(".coverflow__swiper");
  if (!container) return;
  container.addEventListener("mousemove", (event) => {
    pointerState.x = event.clientX;
    pointerState.y = event.clientY;
    pointerState.inside = true;
    selectFromPointer();
  });
  container.addEventListener("mouseleave", () => {
    pointerState.inside = false;
    cancelHoverSelect();
  });
}

function initCoverflowSwiper() {
  if (state.swiper) {
    state.swiper.destroy(true, true);
    state.swiper = null;
  }
  if (typeof Swiper === "undefined") {
    console.error("Swiper failed to load");
    return;
  }
  state.swiper = new Swiper(".coverflow__swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    initialSlide: state.activeIndex,
    slideToClickedSlide: true,
    speed: 260,
    loop: false,
    keyboard: { enabled: true, onlyInViewport: true },
    coverflowEffect: {
      rotate: 38,
      stretch: 0,
      depth: 160,
      modifier: 1.1,
      slideShadows: false,
    },
    navigation: {
      prevEl: "#flow-prev",
      nextEl: "#flow-next",
    },
    on: {
      slideChange: (swiper) => {
        state.activeIndex = swiper.activeIndex;
        updateActiveMeta();
        const style = state.styles[swiper.activeIndex];
        if (style) {
          localStorage.setItem(STORAGE_KEYS.activeStyle, style.id);
        }
      },
      slideChangeTransitionEnd: () => {
        if (pointerState.inside) selectFromPointer();
      },
      click: (swiper) => {
        if (swiper.clickedIndex === swiper.activeIndex) {
          const style = state.styles[swiper.activeIndex];
          if (style) openLightboxForStyle(style);
        }
      },
    },
  });
}

function updateActiveMeta() {
  const style = state.styles[state.activeIndex];
  if (!style) return;
  el.flowTitle.textContent = style.title;
  el.flowTags.innerHTML = "";
  (style.tags || []).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    el.flowTags.appendChild(span);
  });
}

function setActiveIndex(index) {
  const total = state.styles.length;
  if (!total) return;
  const clamped = ((index % total) + total) % total;
  if (state.swiper) {
    state.swiper.slideTo(clamped);
  } else {
    state.activeIndex = clamped;
    updateActiveMeta();
  }
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
  el.generate.classList.toggle("is-generating", on);
  el.generate.querySelector(".primary-button__label").textContent = on ? "生成中…" : "生成";
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
  state.lastRequest = { payload, style };
  localStorage.setItem(STORAGE_KEYS.userContent, userContent);
  localStorage.setItem(STORAGE_KEYS.aspect, payload.aspect);
  localStorage.setItem(STORAGE_KEYS.size, payload.size);
  localStorage.setItem(STORAGE_KEYS.modelMode, payload.modelMode);

  setMode("canvas");
  showCanvasSkeleton(style.title);
  setStatus("正在生成中…", "");
  setGenerating(true);

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
      .then((task) => {
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
        const images = Array.isArray(task.images) ? task.images : [];
        setGenerating(false);
        localStorage.removeItem(STORAGE_KEYS.currentTaskId);
        if (!images.length) {
          setStatus("没有收到图像结果。", "error");
          showCanvasError("未收到图像结果");
          return;
        }
        const blob = base64ToBlob(images[0], "image/png");
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

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

function handleRetry() {
  if (!state.lastRequest) {
    setMode("flow");
    return;
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
  el.userContent.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      el.form.requestSubmit();
    }
  });
}

function bindUI() {
  el.form.addEventListener("submit", handleSubmit);
  el.historyToggle.addEventListener("click", toggleSidebar);
  el.historyClear.addEventListener("click", clearHistory);
  el.canvasBack.addEventListener("click", () => {
    state.abortPoll = true;
    setGenerating(false);
    setStatus("准备就绪", "");
    setMode("flow");
  });
  el.canvasRetry.addEventListener("click", handleRetry);
  el.canvasDownload.addEventListener("click", downloadCanvasImage);
  el.canvasZoom.addEventListener("click", zoomCanvasImage);
  el.canvasImage.addEventListener("click", zoomCanvasImage);

  el.lightbox.addEventListener("click", (event) => {
    if (
      event.target.closest(".lightbox__close") ||
      event.target.classList.contains("lightbox__backdrop")
    ) {
      closeLightbox();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });

  window.addEventListener("resize", applySidebarState);
}

async function init() {
  bindUI();
  bindPersistence();
  restoreInputState();
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
  const savedStyleId = localStorage.getItem(STORAGE_KEYS.activeStyle);
  const savedIndex = state.styles.findIndex((s) => s.id === savedStyleId);
  state.activeIndex = savedIndex >= 0 ? savedIndex : 0;
  renderCoverflow();
  initCoverflowSwiper();
  bindCoverflowPointer();
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
