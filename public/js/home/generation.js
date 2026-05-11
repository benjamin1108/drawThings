import { api } from "../shared/api-client.js";
import { downloadUrl, createObjectUrl, revokeObjectUrl } from "../shared/media.js";
import { STORAGE_KEYS } from "../shared/storage.js";

export function createGeneration({ el, state, saveHistory, showPreview }) {
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
    revokeObjectUrl(state.lastResultUrl);
    state.lastResultUrl = null;
  }

  function showCanvasImage(blob, styleTitle) {
    revokeObjectUrl(state.lastResultUrl);
    const url = createObjectUrl(blob);
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
      const data = await api.createTask(payload);
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
      const data = await api.createTask(payload);
      if (!data.taskId) throw new Error("未获取到任务 ID");
      pollBatchTask(data.taskId, style, batch, imageNumber);
    } catch (error) {
      finishBatchTask(batch, { ok: false, error: error?.message ?? String(error) });
    }
  }

  function pollBatchTask(taskId, style, batch, imageNumber) {
    const tick = async () => {
      if (batch.cancelled || state.currentBatch !== batch || state.abortPoll) return;
      try {
        const task = await api.getTask(taskId);
        if (batch.cancelled || state.currentBatch !== batch || state.abortPoll) return;
        if (task.status === "pending") {
          setTimeout(tick, 1200);
          return;
        }
        if (task.status === "error") {
          finishBatchTask(batch, { ok: false, error: task.error || "未知错误" });
          return;
        }
        const blob = await fetchTaskImage(task);
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
      } catch (error) {
        finishBatchTask(batch, { ok: false, error: error?.message ?? String(error) });
      }
    };
    tick();
  }

  function finishBatchTask(batch, result) {
    if (batch.cancelled || state.currentBatch !== batch) return;
    if (result.ok) batch.completed += 1;
    else {
      batch.failed += 1;
      batch.lastError = result.error || "未知错误";
    }
    updateBatchStatus(batch);
    if (batch.completed + batch.failed < batch.total) return;
    setGenerating(false);
    state.currentBatch = null;
    if (batch.completed > 0 && batch.failed > 0) {
      setStatus(`完成 ${batch.completed} 张，失败 ${batch.failed} 张`, "error");
    } else if (batch.completed > 0) {
      setStatus(`完成生成 ${batch.completed} 张`, "");
    } else {
      setStatus(`生成失败：${batch.lastError || "未知错误"}`, "error");
      showCanvasError(batch.lastError || "未知错误");
    }
  }

  function updateBatchStatus(batch) {
    const active = Math.max(batch.started - batch.completed - batch.failed, 0);
    setStatus(`已启动 ${batch.started}/${batch.total}，进行中 ${active}，完成 ${batch.completed}`, batch.failed ? "error" : "");
  }

  function pollTask(taskId, style) {
    state.polling = true;
    state.abortPoll = false;
    const tick = async () => {
      if (state.abortPoll) {
        state.polling = false;
        return;
      }
      try {
        const task = await api.getTask(taskId);
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
        setGenerating(false);
        localStorage.removeItem(STORAGE_KEYS.currentTaskId);
        if (task.status === "error") {
          setStatus(`生成失败：${task.error || "未知错误"}`, "error");
          showCanvasError(task.error || "未知错误");
          return;
        }
        const blob = await fetchTaskImage(task);
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
      } catch (error) {
        state.polling = false;
        setGenerating(false);
        setStatus(`生成失败：${error?.message ?? error}`, "error");
        showCanvasError(String(error?.message ?? error));
        localStorage.removeItem(STORAGE_KEYS.currentTaskId);
      }
    };
    tick();
  }

  async function fetchTaskImage(task) {
    const downloadUrl = Array.isArray(task.downloadUrls) ? task.downloadUrls[0] : "";
    if (!downloadUrl) throw new Error("未收到图像结果");
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error("下载生成结果失败");
    return response.blob();
  }

  function handleRetry() {
    if (!state.lastRequest) {
      setMode("flow");
      return;
    }
    if (el.generationCount && isBatchCountEnabled()) {
      el.generationCount.value = String(state.lastRequest.generationCount || 1);
    }
    handleSubmit(new Event("submit"));
  }

  function downloadCanvasImage() {
    if (state.lastResultUrl) downloadUrl(state.lastResultUrl, `drawthings-${Date.now()}.png`);
  }

  function zoomCanvasImage() {
    if (!state.lastResultUrl) return;
    showPreview(state.lastResultUrl, el.canvasStyle.textContent || "预览", el.canvasStyle.textContent || "");
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

  return {
    setMode,
    setStatus,
    setGenerating,
    stopCurrentBatch,
    handleSubmit,
    handleRetry,
    downloadCanvasImage,
    zoomCanvasImage,
    resumePendingTask,
  };
}
