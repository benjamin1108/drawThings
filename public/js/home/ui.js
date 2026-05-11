import { STORAGE_KEYS } from "../shared/storage.js";
import { createObjectUrl } from "../shared/media.js";

export function createHomeUi({ el, state }) {
  function showPreview(src, alt, caption) {
    el.lightboxImage.src = src;
    el.lightboxImage.alt = alt || "预览";
    el.lightboxCaption.textContent = caption || "";
    el.lightbox.classList.remove("hidden");
    el.lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("lightbox-open");
  }

  function openStylePreview(style) {
    showPreview(style.originalPreviewUrl || style.previewUrl, `${style.title} 样图`, style.title);
  }

  function openBlobPreview(blob, caption) {
    showPreview(createObjectUrl(blob), caption || "预览", caption || "");
  }

  function closeLightbox() {
    el.lightbox.classList.add("hidden");
    el.lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("lightbox-open");
  }

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

  function restoreInputState() {
    const userContent = localStorage.getItem(STORAGE_KEYS.userContent);
    if (userContent) el.userContent.value = userContent;
    restoreSelect(el.aspect, STORAGE_KEYS.aspect);
    restoreSelect(el.size, STORAGE_KEYS.size);
    restoreSelect(el.modelMode, STORAGE_KEYS.modelMode);
    restoreSelect(el.generationCount, STORAGE_KEYS.generationCount);
  }

  function restoreSelect(select, key) {
    const value = localStorage.getItem(key);
    if (select && value && [...select.options].some((option) => option.value === value)) {
      select.value = value;
    }
  }

  function bindPersistence() {
    el.userContent.addEventListener("input", () => localStorage.setItem(STORAGE_KEYS.userContent, el.userContent.value));
    el.aspect.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.aspect, el.aspect.value));
    el.size.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.size, el.size.value));
    el.modelMode.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.modelMode, el.modelMode.value));
    el.generationCount?.addEventListener("change", () => localStorage.setItem(STORAGE_KEYS.generationCount, el.generationCount.value));
    el.userContent.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        el.form.requestSubmit();
      }
    });
  }

  function bindPromptHints() {
    el.promptHints?.addEventListener("click", (event) => {
      const chip = event.target.closest(".hint-chip");
      const hint = chip?.dataset.hint;
      if (!hint) return;
      el.userContent.value = hint;
      el.userContent.focus();
      el.userContent.setSelectionRange(hint.length, hint.length);
      localStorage.setItem(STORAGE_KEYS.userContent, hint);
    });
  }

  function exposeConsoleCommands() {
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
    window.drawThings = { ...(window.drawThings || {}), enableGenerationCount, disableGenerationCount };
    window.enableGenerationCount = enableGenerationCount;
    window.disableGenerationCount = disableGenerationCount;
  }

  function bindUI(generation, history) {
    el.form.addEventListener("submit", generation.handleSubmit);
    el.historyToggle.addEventListener("click", toggleSidebar);
    el.historyClear.addEventListener("click", history.clearHistory);
    bindPromptHints();
    el.canvasBack.addEventListener("click", () => {
      state.abortPoll = true;
      generation.stopCurrentBatch();
      generation.setGenerating(false);
      generation.setStatus("准备就绪", "");
      generation.setMode("flow");
    });
    el.canvasRetry.addEventListener("click", generation.handleRetry);
    el.canvasDownload.addEventListener("click", generation.downloadCanvasImage);
    el.canvasZoom.addEventListener("click", generation.zoomCanvasImage);
    el.canvasImage.addEventListener("click", generation.zoomCanvasImage);
    el.lightbox.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.lightbox.classList.contains("hidden")) closeLightbox();
    });
    window.addEventListener("resize", applySidebarState);
  }

  function bootUi() {
    bindPersistence();
    restoreInputState();
    exposeConsoleCommands();
    applySidebarState();
  }

  return { showPreview, openStylePreview, openBlobPreview, bindUI, bootUi };
}
