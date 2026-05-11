import { api } from "../shared/api-client.js";
import { buildRegenerationPrompt } from "./description.js";
import { createObjectUrl, downloadUrl, revokeObjectUrl } from "../shared/media.js";

export function createResultViewer({ el, state, setStatus, updateDescriptionState }) {
  function setResultActions(enabled) {
    el.zoomResult.disabled = !enabled;
    el.downloadResult.disabled = !enabled;
  }

  function setGenerateLoading(on) {
    state.generating = on;
    el.regenerateButton.disabled = on || !state.referenceImage || !el.description.value.trim() || state.uploading;
    el.regenerateButton.classList.toggle("is-generating", on);
    el.regenerateButton.querySelector(".primary-button__label").textContent = on ? "生成中..." : "按修改描述生成";
    el.resultLoader.classList.toggle("hidden", !on);
    if (on) {
      el.resultEmpty.classList.add("hidden");
      el.resultError.classList.add("hidden");
      el.resultImage.classList.add("hidden");
      setResultActions(false);
    }
  }

  function setResultError(message) {
    el.resultLoader.classList.add("hidden");
    el.resultImage.classList.add("hidden");
    el.resultEmpty.classList.add("hidden");
    el.resultError.textContent = message || "生成失败";
    el.resultError.classList.remove("hidden");
    setResultActions(false);
  }

  function showResult(blob) {
    revokeObjectUrl(state.resultUrl);
    state.resultUrl = createObjectUrl(blob);
    el.resultImage.src = state.resultUrl;
    el.resultImage.classList.remove("hidden");
    el.resultEmpty.classList.add("hidden");
    el.resultLoader.classList.add("hidden");
    el.resultError.classList.add("hidden");
    setResultActions(true);
  }

  function openViewer(src, caption) {
    if (!src) return;
    el.viewerImage.src = src;
    el.viewerImage.alt = caption || "大图预览";
    el.viewerCaption.textContent = caption || "";
    el.viewer.classList.remove("hidden");
    el.viewer.setAttribute("aria-hidden", "false");
    document.body.classList.add("viewer-open");
  }

  function closeViewer() {
    el.viewer.classList.add("hidden");
    el.viewer.setAttribute("aria-hidden", "true");
    el.viewerImage.removeAttribute("src");
    el.viewerCaption.textContent = "";
    document.body.classList.remove("viewer-open");
  }

  function zoomReferenceImage() {
    if (state.previewUrl) openViewer(state.previewUrl, el.referenceMeta.textContent || "参考图");
  }

  function zoomResultImage() {
    if (state.resultUrl) openViewer(state.resultUrl, "改图生成结果");
  }

  function downloadResultImage() {
    if (state.resultUrl) downloadUrl(state.resultUrl, `drawthings-edit-${Date.now()}.png`);
  }

  async function regenerateImage() {
    const description = el.description.value.trim();
    if (!state.referenceImage || !description || state.generating || state.uploading) return;
    setGenerateLoading(true);
    setStatus("正在按修改描述重新生成...", "");
    try {
      const data = await api.createTask({
        finalPrompt: buildRegenerationPrompt(description),
        referenceImages: [state.referenceImage],
        aspect: el.aspect.value || "16:9",
        size: el.size.value || "2K",
        modelMode: el.modelMode.value || "quality",
        count: 1,
      });
      if (!data.taskId) throw new Error("未获取到任务 ID");
      await pollTask(data.taskId);
    } catch (error) {
      const message = error?.message || String(error);
      setStatus(`生成失败：${message}`, "error");
      setResultError(message);
    } finally {
      setGenerateLoading(false);
      updateDescriptionState();
    }
  }

  function pollTask(taskId) {
    return new Promise((resolve, reject) => {
      const tick = async () => {
        try {
          const task = await api.getTask(taskId);
          if (task.status === "pending") {
            setStatus("生成中，请稍候...", "");
            setTimeout(tick, 1200);
            return;
          }
          if (task.status === "error") {
            reject(new Error(task.error || "未知错误"));
            return;
          }
          const url = Array.isArray(task.downloadUrls) ? task.downloadUrls[0] : "";
          if (!url) {
            reject(new Error("未收到图像结果"));
            return;
          }
          const imageResponse = await fetch(url);
          if (!imageResponse.ok) throw new Error("下载生成结果失败");
          showResult(await imageResponse.blob());
          setStatus("改图生成完成", "");
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      tick();
    });
  }

  function bindViewerActions() {
    el.regenerateButton.addEventListener("click", regenerateImage);
    el.zoomReference.addEventListener("click", zoomReferenceImage);
    el.referenceImage.addEventListener("click", zoomReferenceImage);
    el.zoomResult.addEventListener("click", zoomResultImage);
    el.resultImage.addEventListener("click", zoomResultImage);
    el.downloadResult.addEventListener("click", downloadResultImage);
    el.viewerBackdrop.addEventListener("click", closeViewer);
    el.viewerClose.addEventListener("click", closeViewer);
    el.description.addEventListener("keydown", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        regenerateImage();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !el.viewer.classList.contains("hidden")) closeViewer();
    });
  }

  return { bindViewerActions, closeViewer };
}
